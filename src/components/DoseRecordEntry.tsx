import React, { useState, useMemo } from "react";
import { Employee, DoseRecord, Department } from "../types";
import {
  FileText,
  Upload,
  User,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw,
  Sparkles,
  Edit,
  Save,
  HelpCircle,
} from "lucide-react";

interface DoseRecordEntryProps {
  department: Department;
  employees: Employee[];
  onAddRecord: (record: Omit<DoseRecord, "id" | "departmentId" | "recordedAt">) => void;
  onAddMultipleRecords: (
    records: Array<{
      employeeId: string; // "new" or actual ID
      employeeName: string;
      position: string;
      badgeId: string;
      period: string;
      year: number;
      deepDose: number;
      shallowDose: number;
      remarks: string;
    }>
  ) => void;
}

export default function DoseRecordEntry({
  department,
  employees,
  onAddRecord,
  onAddMultipleRecords,
}: DoseRecordEntryProps) {
  const [entryMode, setEntryMode] = useState<"manual" | "pdf">("pdf");

  // --- MANUAL ENTRY STATE ---
  const [manualEmpId, setManualEmpId] = useState("");
  const [manualPeriod, setManualPeriod] = useState("ไตรมาส 1/2569");
  const [manualYear, setManualYear] = useState<number>(2569);
  const [manualDeepDose, setManualDeepDose] = useState("");
  const [manualShallowDose, setManualShallowDose] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");
  const [manualSuccessMsg, setManualSuccessMsg] = useState("");

  // --- PDF UPLOAD STATE ---
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  const [uploadError, setUploadError] = useState("");
  
  // Extracted data preview state
  const [extractedMeta, setExtractedMeta] = useState<{
    period: string;
    year: number;
    organization: string;
    department: string;
  } | null>(null);

  interface ExtractedRecordRow {
    tempId: string;
    employeeId: string; // Linked existing employee ID, or "new"
    employeeName: string;
    position: string;
    badgeId: string;
    deepDose: number;
    shallowDose: number;
    remarks: string;
    isExisting: boolean;
  }
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecordRow[]>([]);

  // Filter active department employees
  const deptEmployees = useMemo(() => {
    return employees.filter((e) => e.departmentId === department.id && e.status === "active");
  }, [employees, department.id]);

  // Handle Manual Save
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmpId) {
      alert("กรุณาเลือกบุคลากร");
      return;
    }
    if (manualDeepDose === "") {
      alert("กรุณาระบุปริมาณรังสีสะสม Hp(10)");
      return;
    }

    onAddRecord({
      employeeId: manualEmpId,
      period: manualPeriod,
      year: Number(manualYear),
      deepDose: parseFloat(manualDeepDose) || 0,
      shallowDose: parseFloat(manualShallowDose) || 0,
      remarks: manualRemarks || "Normal",
    });

    const emp = employees.find((x) => x.id === manualEmpId);
    setManualSuccessMsg(`บันทึกข้อมูลรังสีของ "${emp?.name}" รอบ ${manualPeriod} เรียบร้อยแล้ว!`);
    setManualDeepDose("");
    setManualShallowDose("");
    setManualRemarks("");

    setTimeout(() => {
      setManualSuccessMsg("");
    }, 4000);
  };

  // Process File Upload and Call Backend API
  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    await uploadAndParsePDF(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      await uploadAndParsePDF(file);
    } else {
      alert("กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น");
    }
  };

  // Convert PDF to Base64 and send to backend API
  const uploadAndParsePDF = async (file: File) => {
    setIsUploading(true);
    setUploadError("");
    setUploadProgressMsg("กำลังอ่านไฟล์และแปลงรหัสฐานข้อมูล...");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64String = reader.result as string;
        setUploadProgressMsg("กำลังประมวลผลด้วย Gemini AI (วิเคราะห์เอกสารแบบ OCR และจำแนกฟิลด์)...");

        let response;
        try {
          response = await fetch("/api/parse-pdf", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pdfBase64: base64String,
              fileName: file.name,
            }),
          });
        } catch (fetchErr) {
          throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านได้ หากท่านกำลังใช้งานอยู่บน GitHub Pages ระบบจะไม่สามารถประมวลผล PDF ได้เนื่องจากเป็นโฮสติ้งแบบ Static กรุณาใช้วิธี 'กรอกข้อมูลด้วยตนเอง (Manual Entry)' หรือย้ายไปโฮสต์บน Render.com / Railway.app แทน");
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("ได้รับข้อมูลตอบกลับที่ไม่ได้อยู่ในรูปแบบ JSON จากเซิร์ฟเวอร์ (อาจเกิดจากการอัปโหลดบนระบบโฮสต์ที่ไม่รองรับ Backend Node.js เช่น GitHub Pages) กรุณากรอกข้อมูลโดยคลิกปุ่ม 'กรอกข้อมูลด้วยตนเอง (Manual Entry)' หรือรันเซิร์ฟเวอร์แบบ Full-Stack");
        }

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์ PDF บนเซิร์ฟเวอร์");
        }

        const resData = await response.json();
        if (resData.success && resData.data) {
          const aiData = resData.data;
          
          // Setup metadata
          setExtractedMeta({
            period: aiData.period || "ไตรมาส 1/2569",
            year: aiData.year || 2569,
            organization: aiData.organization || department.hospitalName,
            department: aiData.department || department.name,
          });

          // Process records and map to existing employees if there is a name match
          const rows: ExtractedRecordRow[] = (aiData.records || []).map((rec: any, idx: number) => {
            // Find existing employee in current department with matching name
            const normalizedExtractedName = rec.employeeName.trim().replace(/\s+/g, "");
            const foundEmp = deptEmployees.find((e) => {
              const normalizedDbName = e.name.trim().replace(/\s+/g, "");
              return (
                normalizedDbName.includes(normalizedExtractedName) ||
                normalizedExtractedName.includes(normalizedDbName)
              );
            });

            return {
              tempId: `temp-${idx}-${Date.now()}`,
              employeeId: foundEmp ? foundEmp.id : "new",
              employeeName: rec.employeeName,
              position: rec.position || "นักรังสีการแพทย์",
              badgeId: rec.employeeId || `RAD-${Math.floor(100 + Math.random() * 900)}`,
              deepDose: rec.deepDose !== undefined ? parseFloat(rec.deepDose) : 0,
              shallowDose: rec.shallowDose !== undefined ? parseFloat(rec.shallowDose) : 0,
              remarks: rec.remarks || "Normal",
              isExisting: !!foundEmp,
            };
          });

          setExtractedRecords(rows);
          setUploadProgressMsg("ประมวลผลเสร็จสิ้น กรุณาตรวจสอบข้อมูลก่อนบันทึก");
        } else {
          throw new Error("โครงสร้างข้อมูลรังสีที่สกัดได้จาก AI ไม่สมบูรณ์");
        }
      } catch (err: any) {
        console.error("PDF Parse error:", err);
        setUploadError(err.message || "ล้มเหลวในการอ่านข้อมูลรังสีจาก PDF");
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setUploadError("การอ่านไฟล์ล้มเหลว");
      setIsUploading(false);
    };
  };

  // Handle updates in preview table
  const handleUpdateExtractedRow = (tempId: string, updates: Partial<ExtractedRecordRow>) => {
    setExtractedRecords((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, ...updates } : r))
    );
  };

  // Remove row from uploader preview
  const handleRemoveExtractedRow = (tempId: string) => {
    setExtractedRecords((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // Confirm PDF Save All
  const handleSaveExtractedAll = () => {
    if (!extractedMeta) return;

    const payload = extractedRecords.map((row) => ({
      employeeId: row.employeeId, // "new" or actual ID
      employeeName: row.employeeName,
      position: row.position,
      badgeId: row.badgeId,
      period: extractedMeta.period,
      year: extractedMeta.year,
      deepDose: row.deepDose,
      shallowDose: row.shallowDose,
      remarks: row.remarks,
    }));

    // Call state saver in parent
    onAddMultipleRecords(payload);

    // Reset uploader
    setPdfFile(null);
    setExtractedMeta(null);
    setExtractedRecords([]);
    alert("บันทึกข้อมูลปริมาณรังสีสะสมและลงทะเบียนพนักงานใหม่เรียบร้อยแล้ว!");
  };

  const handleCancelPreview = () => {
    setPdfFile(null);
    setExtractedMeta(null);
    setExtractedRecords([]);
    setUploadError("");
  };

  return (
    <div className="space-y-4">
      {/* Tab bar header */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => {
              handleCancelPreview();
              setEntryMode("pdf");
            }}
            className={`flex-1 sm:flex-initial text-xs font-bold py-2 px-3.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              entryMode === "pdf"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="size-3.5" />
            นำเข้าไฟล์ PDF ด้วย AI
          </button>
          <button
            onClick={() => {
              handleCancelPreview();
              setEntryMode("manual");
            }}
            className={`flex-1 sm:flex-initial text-xs font-bold py-2 px-3.5 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              entryMode === "manual"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Edit className="size-3.5" />
            คีย์ข้อมูลเข้าระบบเอง (Manual)
          </button>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200 uppercase">
          <Database className="size-3 text-blue-600" />
          {department.name}
        </span>
      </div>

      {/* --- MODE 1: PDF IMPORT & AI EXTRACT --- */}
      {entryMode === "pdf" && (
        <div className="space-y-4">
          {/* Instructions Banner */}
          <div className="bg-blue-50/50 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="size-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-xs text-blue-950">
              <h4 className="font-bold uppercase tracking-wider text-[10px] text-blue-800">ระบบนำเข้าเอกสารด้วยปัญญาประดิษฐ์ (AI-Powered PDF OCR)</h4>
              <p className="leading-relaxed opacity-90">
                ท่านสามารถลากและวางไฟล์ PDF รายงานผลการวัดรังสีบุคคลที่ได้รับจากกรมวิทยาศาสตร์การแพทย์ หรือ สทน. เข้าสู่กล่องด้านล่าง ระบบจะสแกนรายชื่อ รหัส Badge และปริมาณรังสี Hp(10) ของทุกคนโดยอัตโนมัติ และจับคู่กับรายชื่อพนักงานให้ทันทีโดยไม่ต้องป้อนข้อมูลด้วยมือ!
              </p>
            </div>
          </div>

          {!extractedMeta ? (
            // Drag and Drop Zone
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all ${
                isUploading
                  ? "border-blue-400 bg-blue-50/20"
                  : "border-slate-300 hover:border-blue-500 hover:bg-slate-50/50"
              }`}
            >
              <input
                type="file"
                id="pdf-upload-input"
                accept="application/pdf"
                onChange={handlePdfFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer block space-y-3">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative size-14">
                      <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto size-5 text-blue-600 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">กำลังวิเคราะห์เอกสารรังสีบุคคลด้วย AI...</p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed animate-pulse">
                        {uploadProgressMsg}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="size-12 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center mb-3 text-slate-500 shadow-sm">
                      <Upload className="size-6 text-slate-600" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ลากและวางไฟล์ PDF รายงานปริมาณรังสีที่นี่</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">หรือคลิกเพื่อเลือกไฟล์รายงานจากเครื่องคอมพิวเตอร์ของคุณ</p>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded mt-3 inline-block border border-slate-200">
                      รองรับไฟล์ .PDF ทุกรูปแบบ
                    </span>
                  </div>
                )}
              </label>

              {uploadError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2 justify-center max-w-md mx-auto">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          ) : (
            // Extracted Results Preview & Edit
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
              {/* Meta information review */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CheckCircle className="size-4 text-emerald-600" />
                    ข้อมูลสรุปเอกสารที่สกัดได้สำเร็จ (AI Extracted Metadata)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">ไฟล์: {pdfFile?.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">รอบระยะเวลารายงาน</label>
                    <input
                      type="text"
                      value={extractedMeta.period}
                      onChange={(e) => setExtractedMeta({ ...extractedMeta, period: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md p-2 font-medium text-slate-800 focus:outline-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ปี พ.ศ.</label>
                    <input
                      type="number"
                      value={extractedMeta.year}
                      onChange={(e) => setExtractedMeta({ ...extractedMeta, year: parseInt(e.target.value) || 2569 })}
                      className="w-full bg-white border border-slate-200 rounded-md p-2 font-medium text-slate-800 focus:outline-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">โรงพยาบาล/หน่วยงาน</label>
                    <input
                      type="text"
                      value={extractedMeta.organization}
                      onChange={(e) => setExtractedMeta({ ...extractedMeta, organization: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md p-2 font-medium text-slate-800 focus:outline-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">แผนก</label>
                    <input
                      type="text"
                      value={extractedMeta.department}
                      onChange={(e) => setExtractedMeta({ ...extractedMeta, department: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-md p-2 font-medium text-slate-800 focus:outline-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Records preview table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">รายชื่อปริมาณรังสีรายบุคคล ({extractedRecords.length} คน)</h3>
                    <p className="text-[11px] text-slate-500">โปรดตรวจสอบการจับคู่รายชื่อระบบและแก้ไขความถูกต้องก่อนกดยืนยันบันทึก</p>
                  </div>
                  <div className="flex gap-1.5 text-xs">
                    <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                      มีโปรไฟล์แล้ว: {extractedRecords.filter(r => r.isExisting).length}
                    </span>
                    <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                      พนักงานใหม่: {extractedRecords.filter(r => !r.isExisting).length}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">ชื่อพนักงานใน PDF</th>
                        <th className="p-2.5">การจับคู่รายชื่อระบบ</th>
                        <th className="p-2.5">ตำแหน่ง / รหัสเครื่องวัด</th>
                        <th className="p-2.5 text-right" width="120">Hp(10) Deep (mSv)</th>
                        <th className="p-2.5 text-right" width="120">Hp(0.07) Shallow (mSv)</th>
                        <th className="p-2.5">หมายเหตุ</th>
                        <th className="p-2.5 text-center">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {extractedRecords.map((row) => (
                        <tr key={row.tempId} className={`hover:bg-slate-50/50 ${!row.isExisting && "bg-blue-50/10"}`}>
                          <td className="p-2.5 font-bold text-slate-800">{row.employeeName}</td>
                          <td className="p-2.5">
                            <select
                                value={row.employeeId}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const isExist = val !== "new";
                                  const emp = isExist ? deptEmployees.find(d => d.id === val) : null;
                                  handleUpdateExtractedRow(row.tempId, {
                                    employeeId: val,
                                    isExisting: isExist,
                                    employeeName: emp ? emp.name : row.employeeName,
                                    position: emp ? emp.position : row.position,
                                    badgeId: emp ? emp.employeeIdCode : row.badgeId,
                                  });
                                }}
                                className={`p-1 rounded-md border text-xs max-w-[200px] focus:outline-blue-500 ${
                                  row.isExisting
                                    ? "border-emerald-200 bg-emerald-50/20 text-emerald-800 font-medium"
                                    : "border-blue-200 bg-blue-50 text-blue-900 font-bold"
                                }`}
                            >
                              <option value="new">🆕 บันทึกเป็นพนักงานใหม่</option>
                              {deptEmployees.map((e) => (
                                <option key={e.id} value={e.id}>
                                  🔗 {e.name} ({e.employeeIdCode})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            {row.employeeId === "new" ? (
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={row.position}
                                  placeholder="ตำแหน่ง"
                                  onChange={(e) => handleUpdateExtractedRow(row.tempId, { position: e.target.value })}
                                  className="w-24 bg-white border border-slate-200 p-1 rounded text-[11px]"
                                />
                                <input
                                  type="text"
                                  value={row.badgeId}
                                  placeholder="รหัสเครื่องวัด"
                                  onChange={(e) => handleUpdateExtractedRow(row.tempId, { badgeId: e.target.value })}
                                  className="w-20 bg-white border border-slate-200 p-1 rounded font-mono text-[11px]"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-medium">
                                {row.position} • <span className="font-mono">{row.badgeId}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={row.deepDose}
                              onChange={(e) => handleUpdateExtractedRow(row.tempId, { deepDose: parseFloat(e.target.value) || 0 })}
                              className="w-20 text-right bg-white border border-slate-200 p-1 rounded font-bold text-slate-800"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              step="0.001"
                              value={row.shallowDose}
                              onChange={(e) => handleUpdateExtractedRow(row.tempId, { shallowDose: parseFloat(e.target.value) || 0 })}
                              className="w-20 text-right bg-white border border-slate-200 p-1 rounded text-slate-500"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              value={row.remarks}
                              onChange={(e) => handleUpdateExtractedRow(row.tempId, { remarks: e.target.value })}
                              className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => handleRemoveExtractedRow(row.tempId)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3.5">
                <button
                  onClick={handleCancelPreview}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-medium text-xs cursor-pointer"
                >
                  ยกเลิกและย้อนกลับ
                </button>
                <button
                  onClick={handleSaveExtractedAll}
                  className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs px-4 py-2 rounded-md font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
                >
                  <Database className="size-4" />
                  บันทึกข้อมูลและลงทะเบียนทั้งหมดเข้าคลาวด์ท้องถิ่น ({extractedRecords.length} รายการ)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODE 2: MANUAL ENTRY FORM --- */}
      {entryMode === "manual" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 max-w-xl mx-auto space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">คีย์ข้อมูลปริมาณรังสีสะสมรายบุคคล</h2>
            <p className="text-xs text-slate-500">กรอกข้อมูลปริมาณรังสี Hp(10) และ Hp(0.07) ลงในระบบด้วยตนเอง</p>
          </div>

          {manualSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="size-4.5 shrink-0 text-emerald-500" />
              <span className="font-medium">{manualSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">เลือกพนักงาน (ที่เปิดใช้งาน)</label>
                <select
                  required
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-medium"
                >
                  <option value="">-- เลือกรายชื่อบุคลากร --</option>
                  {deptEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.employeeIdCode} - {e.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">รอบระยะเวลา</label>
                  <input
                    type="text"
                    required
                    value={manualPeriod}
                    onChange={(e) => setManualPeriod(e.target.value)}
                    placeholder="เช่น ไตรมาส 2/2569"
                    className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ปี พ.ศ.</label>
                  <input
                    type="number"
                    required
                    value={manualYear}
                    onChange={(e) => setManualYear(parseInt(e.target.value) || 2569)}
                    className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>ปริมาณรังสีลึก Hp(10) Deep (mSv)</span>
                  <span className="text-[9px] text-slate-400 font-normal">ปกติ &lt; 1.25 mSv</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={manualDeepDose}
                  onChange={(e) => setManualDeepDose(e.target.value)}
                  placeholder="เช่น 0.125"
                  className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-extrabold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>ปริมาณรังสีตื้น Hp(0.07) Shallow (mSv)</span>
                  <span className="text-[9px] text-slate-400 font-normal">ตัวเลือก (Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={manualShallowDose}
                  onChange={(e) => setManualShallowDose(e.target.value)}
                  placeholder="เช่น 0.145"
                  className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">หมายเหตุ หรือข้อมูลการตรวจวัดรังสี</label>
              <input
                type="text"
                value={manualRemarks}
                onChange={(e) => setManualRemarks(e.target.value)}
                placeholder="เช่น M (ต่ำกว่าระดับวัดรังสี), ตรวจไม่พบ, ปฏิบัติงาน CT Scan หนัก"
                className="w-full bg-slate-50 text-xs border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs px-5 py-2.5 rounded-md font-bold shadow-md shadow-blue-600/10 cursor-pointer"
              >
                บันทึกข้อมูลรังสีเข้าระบบ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
