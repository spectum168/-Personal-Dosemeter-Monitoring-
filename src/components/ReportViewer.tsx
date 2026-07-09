import React, { useState, useMemo } from "react";
import { Employee, DoseRecord, Department, DatabaseState } from "../types";
import { Printer, Calendar, FileCheck, ShieldAlert, AlertTriangle, ExternalLink, Download } from "lucide-react";
import { exportDatabase } from "../dbStorage";

interface ReportViewerProps {
  department: Department;
  employees: Employee[];
  records: DoseRecord[];
  databaseState?: DatabaseState;
}

export default function ReportViewer({ department, employees, records, databaseState }: ReportViewerProps) {
  // Get active department employees
  const deptEmployees = useMemo(() => {
    return employees.filter((e) => e.departmentId === department.id);
  }, [employees, department.id]);

  const deptEmployeeIds = useMemo(() => {
    return new Set(deptEmployees.map((e) => e.id));
  }, [deptEmployees]);

  // Filter records of current department
  const deptRecords = useMemo(() => {
    return records.filter((r) => deptEmployeeIds.has(r.employeeId));
  }, [records, deptEmployeeIds]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<number>(deptRecords.map((r) => r.year));
    if (years.size === 0) return [2569];
    return Array.from(years).sort((a, b) => b - a);
  }, [deptRecords]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0]);

  // Available Periods for selected year
  const availablePeriods = useMemo(() => {
    const periods = new Set(
      deptRecords.filter((r) => r.year === selectedYear).map((r) => r.period)
    );
    return ["ทั้งปี (Cumulative Annual)", ...Array.from(periods).sort()];
  }, [deptRecords, selectedYear]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("ทั้งปี (Cumulative Annual)");
  const [calculationMode, setCalculationMode] = useState<"avg" | "sum" | "both">("both");
  const [isInIframe, setIsInIframe] = useState(false);

  React.useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  // Generate table rows based on filters, merging duplicate employees of the same physical person
  const reportRows = useMemo(() => {
    const normalizeName = (name: string): string => {
      return name
        .replace(/^(นาย|นางสาว|นาง|ดร\.|นพ\.|พญ\.|นายแพทย์|แพทย์หญิง|Mr\.|Mrs\.|Ms\.)\s*/, "")
        .trim()
        .replace(/\s+/g, "")
        .toLowerCase();
    };

    // 1. Group employees by normalized name
    const groupedEmployees: { [key: string]: Employee[] } = {};
    deptEmployees.forEach((emp) => {
      const key = normalizeName(emp.name);
      if (!groupedEmployees[key]) {
        groupedEmployees[key] = [];
      }
      groupedEmployees[key].push(emp);
    });

    // 2. Compute doses for each grouped person
    return Object.entries(groupedEmployees).map(([key, emps]) => {
      // Use the representative employee (prefer active if available, else first)
      const activeEmp = emps.find(e => e.status === "active") || emps[0];
      const empIds = emps.map((e) => e.id);

      // Find all records matching any of these employee IDs, selected year and period
      const empRecords = deptRecords.filter((r) => {
        if (!empIds.includes(r.employeeId)) return false;
        if (r.year !== selectedYear) return false;
        if (selectedPeriod !== "ทั้งปี (Cumulative Annual)" && r.period !== selectedPeriod) {
          return false;
        }
        return true;
      });

      const totalDeep = empRecords.reduce((sum, r) => sum + r.deepDose, 0);
      const totalShallow = empRecords.reduce((sum, r) => sum + r.shallowDose, 0);
      const periodsCount = empRecords.length;

      const avgDeep = periodsCount > 0 ? totalDeep / periodsCount : 0;
      const avgShallow = periodsCount > 0 ? totalShallow / periodsCount : 0;

      // Status classification based on calculation mode
      let status: "safe" | "watch" | "danger" = "safe";
      const limitToCompare =
        selectedPeriod === "ทั้งปี (Cumulative Annual)"
          ? department.annualLimit
          : department.periodLimit;

      // Check average dose for specific periods, or cumulative dose for annual
      const doseToCompare = selectedPeriod === "ทั้งปี (Cumulative Annual)" ? totalDeep : avgDeep;

      if (doseToCompare >= limitToCompare) {
        status = "danger";
      } else if (doseToCompare >= limitToCompare * 0.5) {
        status = "watch";
      }

      // Collect unique non-normal remarks
      const remarksList = empRecords
        .map((r) => r.remarks)
        .filter((r) => r && r !== "Normal" && r !== "-");
      const uniqueRemarks = Array.from(new Set(remarksList)).join(", ") || "-";

      // Combine badge IDs in case of duplicates
      const badgeIds = Array.from(new Set(emps.map((e) => e.employeeIdCode))).join(", ");

      return {
        employee: activeEmp,
        badgeIds,
        deepDose: totalDeep,
        shallowDose: totalShallow,
        avgDeep,
        avgShallow,
        periodsCount,
        status,
        remarks: uniqueRemarks,
      };
    }).sort((a, b) => b.deepDose - a.deepDose); // highest cumulative dose first
  }, [deptEmployees, deptRecords, selectedYear, selectedPeriod, department]);

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable CSS Helper */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          table {
            page-break-inside: auto;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          th, td {
            border: 1px solid #000 !important;
            padding: 6px 8px !important;
          }
          thead {
            display: table-header-group;
          }
        }
      `}</style>

      {/* Control Panel (no-print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        <div className="space-y-0.5">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">สร้างรายงานทางการแผนก</h2>
          <p className="text-[11px] text-slate-500 font-medium">เลือกช่วงระยะเวลาเพื่อจัดทำรายงานปริมาณรังสีที่สามารถพิมพ์หรือบันทึกเป็น PDF ได้</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">เลือกปี พ.ศ.</span>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                setSelectedPeriod("ทั้งปี (Cumulative Annual)");
              }}
              className="bg-slate-50 border border-slate-200 p-2 rounded-md text-slate-800 focus:outline-blue-500 font-bold text-xs"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">รอบระยะเวลา</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-50 border border-slate-200 p-2 rounded-md text-slate-800 focus:outline-blue-500 font-bold text-xs"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">รูปแบบข้อมูลที่แสดง</span>
            <select
              value={calculationMode}
              onChange={(e) => setCalculationMode(e.target.value as "both" | "sum" | "avg")}
              className="bg-slate-50 border border-slate-200 p-2 rounded-md text-slate-800 focus:outline-blue-500 font-bold text-xs"
              title="เลือกแสดงเฉพาะค่าสะสม, เฉพาะค่าเฉลี่ย หรือแสดงทั้งสองแบบคู่กัน"
            >
              <option value="both">แสดงทั้ง "สะสม" และ "ค่าเฉลี่ย"</option>
              <option value="avg">แสดงเฉพาะ "ค่าเฉลี่ยต่อรอบ" (Average)</option>
              <option value="sum">แสดงเฉพาะ "ค่าสะสมรวม" (Cumulative Sum)</option>
            </select>
          </div>

          <button
            onClick={triggerPrint}
            className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs px-4 py-2 rounded-md font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
          >
            <Printer className="size-4" />
            พิมพ์รายงาน / บันทึก PDF
          </button>
        </div>
      </div>

      {/* Helpful Print / PDF Guide Banner for iFrame Preview */}
      {isInIframe && (
        <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-xl space-y-3.5 no-print max-w-4xl mx-auto shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">💡 ทำไมข้อมูลล่าสุดไม่ตามไป และคำแนะนำสำหรับการพิมพ์/เซฟ PDF 100%</h3>
              
              <div className="text-[11px] text-amber-800 leading-relaxed space-y-2 font-medium">
                <p>
                  เนื่องจากแอปพรีวิวนี้รันอยู่ภายใต้ <strong>"กรอบความปลอดภัยจำลอง (iFrame Sandbox)"</strong> เบราว์เซอร์ส่วนใหญ่จะใช้ฟีเจอร์ความปลอดภัยแยกพื้นที่เก็บข้อมูล (Storage Partitioning) ทำให้แอปในแท็บใหม่ไม่สามารถเข้าถึงฐานข้อมูลเดิมของกรอบพรีวิวนี้ได้โดยตรง
                </p>
                <p className="font-bold text-amber-950">
                  วิธีแก้ที่ง่ายที่สุดและได้ผลชัวร์ 100% (ทำเพียง 2 ขั้นตอนสั้น ๆ ดังนี้):
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Step 1: Export */}
                <div className="bg-white/80 border border-amber-200 p-3 rounded-lg flex flex-col justify-between space-y-2">
                  <div>
                    <span className="inline-block bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">ขั้นตอนที่ 1</span>
                    <h4 className="text-[11px] font-bold text-slate-900 mt-1.5">ดาวน์โหลดไฟล์ฐานข้อมูลล่าสุด</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-normal">
                      สำรองไฟล์ประวัติรังสีและโลโก้ที่ท่านเพิ่งกรอก/แก้ไขลงเครื่องคอมพิวเตอร์เป็นไฟล์ JSON
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (databaseState) {
                        exportDatabase(databaseState);
                      } else {
                        // fallback export
                        const fallbackState: DatabaseState = {
                          departments: [department],
                          activeDepartmentId: department.id,
                          employees: employees,
                          records: records
                        };
                        exportDatabase(fallbackState);
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-600/15"
                  >
                    <Download className="size-3.5" />
                    ดาวน์โหลดไฟล์ข้อมูล .json
                  </button>
                </div>

                {/* Step 2: Open in new tab & Import */}
                <div className="bg-white/80 border border-amber-200 p-3 rounded-lg flex flex-col justify-between space-y-2">
                  <div>
                    <span className="inline-block bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">ขั้นตอนที่ 2</span>
                    <h4 className="text-[11px] font-bold text-slate-900 mt-1.5">เปิดแอปในแท็บใหม่ & นำเข้าไฟล์</h4>
                    <p className="text-[10px] text-slate-600 mt-0.5 font-medium leading-normal">
                      เปิดแอปในหน้าต่างเต็มจอ แล้วไปที่แท็บ <strong className="text-blue-700">"ตั้งค่าระบบ" &gt; "นำเข้าฐานข้อมูล (Import JSON)"</strong> แล้วเลือกไฟล์จากขั้นตอนที่ 1
                    </p>
                  </div>
                  <a
                    href={typeof window !== "undefined" ? window.location.href : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-amber-600/15 decoration-none"
                  >
                    <ExternalLink className="size-3.5" />
                    เปิดแอปแท็บใหม่
                  </a>
                </div>
              </div>

              <div className="text-[10px] text-amber-800/80 font-semibold italic bg-amber-100/50 p-2 rounded border border-amber-200/50">
                ✨ หลังจากนำเข้าไฟล์ในแท็บใหม่แล้ว ข้อมูล รายชื่อพนักงาน ประวัติการรับรังสี และโลโก้โรงพยาบาลจะถูกกู้คืนมาครบถ้วน 100% และท่านจะสามารถกดปุ่ม "พิมพ์รายงาน / บันทึก PDF" เพื่อเซฟเป็นไฟล์ PDF เก็บไว้ได้อย่างปลอดภัยทันที!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Report Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 md:p-8 max-w-4xl mx-auto space-y-6 print-container">
        
        {/* Document Header */}
        <div className="text-center space-y-2 border-b border-double border-slate-300 pb-5">
          {department.logoUrl ? (
            <div className="mx-auto size-16 flex items-center justify-center mb-1">
              <img
                src={department.logoUrl}
                alt="Hospital Logo"
                className="max-w-full max-h-full object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="mx-auto size-12 border-2 border-slate-800 rounded-full flex items-center justify-center font-bold text-slate-800 text-[10px] uppercase tracking-wider no-print">
              RAD SAFE
            </div>
          )}
          <h1 className="text-sm font-bold text-slate-950 uppercase tracking-wide">รายงานสรุปผลการวัดรังสีบุคคลประจำหน่วยงาน</h1>
          <h2 className="text-xs font-bold text-slate-800">{department.hospitalName}</h2>
          <p className="text-[11px] text-slate-600 font-bold">
            หน่วยงาน: <span className="text-slate-900">{department.name}</span> • 
            รอบระยะเวลา: <span className="text-slate-900">{selectedPeriod}</span> • 
            ปีประเมิน: <span className="text-slate-900">พ.ศ. {selectedYear}</span>
          </p>
        </div>

        {/* Report Overview Info Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 no-print">
          <div className="flex items-center gap-2 font-medium">
            <FileCheck className="size-4 text-emerald-600" />
            <span>เกณฑ์รังสีสะสมประจำปีสูงสุด: <strong>{department.annualLimit.toFixed(2)} mSv</strong></span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-amber-500" />
            <span>เกณฑ์เฝ้าระวังรายรอบ: <strong>{department.alertLimit.toFixed(2)} mSv</strong></span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <Printer className="size-4 text-slate-500" />
            <span>ระบบออกเอกสารแบบ High Density</span>
          </div>
        </div>

        {/* Formal Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-800 border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-slate-900 font-bold">
                <th className="p-2 border border-slate-300 text-center uppercase tracking-wider text-[10px]" width="50">ลำดับ</th>
                <th className="p-2 border border-slate-300 text-center uppercase tracking-wider text-[10px]" width="120">Badge ID</th>
                <th className="p-2 border border-slate-300 text-left uppercase tracking-wider text-[10px]">ชื่อ-นามสกุล บุคลากร</th>
                <th className="p-2 border border-slate-300 text-left uppercase tracking-wider text-[10px]">ตำแหน่งงาน</th>
                <th className="p-2 border border-slate-300 text-right uppercase tracking-wider text-[10px]" width="160">
                  Hp(10) Deep (mSv)
                  {calculationMode === "sum" && <span className="block text-[9px] text-slate-500 font-medium">(รวมสะสม)</span>}
                  {calculationMode === "avg" && <span className="block text-[9px] text-slate-500 font-medium">(ค่าเฉลี่ยต่อรอบ)</span>}
                  {calculationMode === "both" && <span className="block text-[9px] text-slate-500 font-medium">(สะสม / เฉลี่ย)</span>}
                </th>
                <th className="p-2 border border-slate-300 text-right uppercase tracking-wider text-[10px]" width="160">
                  Hp(0.07) Shallow (mSv)
                  {calculationMode === "sum" && <span className="block text-[9px] text-slate-500 font-medium">(รวมสะสม)</span>}
                  {calculationMode === "avg" && <span className="block text-[9px] text-slate-500 font-medium">(ค่าเฉลี่ยต่อรอบ)</span>}
                  {calculationMode === "both" && <span className="block text-[9px] text-slate-500 font-medium">(สะสม / เฉลี่ย)</span>}
                </th>
                <th className="p-2 border border-slate-300 text-center uppercase tracking-wider text-[10px]" width="110">สถานะประเมิน</th>
                <th className="p-2 border border-slate-300 text-left uppercase tracking-wider text-[10px]">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reportRows.map((row, index) => (
                <tr key={row.employee.id} className="hover:bg-slate-50/50">
                  <td className="p-2 border border-slate-300 text-center font-mono">{index + 1}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono font-bold">{row.badgeIds}</td>
                  <td className="p-2 border border-slate-300 font-bold text-slate-900">{row.employee.name}</td>
                  <td className="p-2 border border-slate-300 text-slate-600 font-medium">{row.employee.position}</td>
                  <td className="p-2 border border-slate-300 text-right">
                    {calculationMode === "sum" && (
                      <span className="font-black text-slate-950">{row.deepDose.toFixed(3)}</span>
                    )}
                    {calculationMode === "avg" && (
                      <span className="font-black text-slate-950">{row.avgDeep.toFixed(3)}</span>
                    )}
                    {calculationMode === "both" && (
                      <div className="space-y-0.5">
                        <div className="font-black text-slate-950">{row.deepDose.toFixed(3)}</div>
                        <div className="text-[10px] text-slate-500 font-medium">เฉลี่ย: {row.avgDeep.toFixed(3)}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-right">
                    {calculationMode === "sum" && (
                      <span className="font-bold text-slate-600">{row.shallowDose.toFixed(3)}</span>
                    )}
                    {calculationMode === "avg" && (
                      <span className="font-bold text-slate-600">{row.avgShallow.toFixed(3)}</span>
                    )}
                    {calculationMode === "both" && (
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-700">{row.shallowDose.toFixed(3)}</div>
                        <div className="text-[10px] text-slate-400 font-medium">เฉลี่ย: {row.avgShallow.toFixed(3)}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">
                    {row.status === "danger" ? (
                      <span className="text-red-600">⚠️ เกินกำหนด</span>
                    ) : row.status === "watch" ? (
                      <span className="text-amber-600">⚠️ เฝ้าระวังสูง</span>
                    ) : (
                      <span className="text-emerald-700">✓ ปลอดภัย</span>
                    )}
                  </td>
                  <td className="p-2 border border-slate-300 text-slate-500 font-medium italic">
                    {row.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legal Disclaimer / Safety Standard Notes */}
        <div className="space-y-1 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">เกณฑ์การประเมินและการควบคุมความปลอดภัยทางรังสี (Radiation Safety Standards):</p>
          <p>1. ปริมาณรังสีสะสมจำกัดรายบุคคลสูงสุดต้องไม่เกิน 20.0 mSv ในระยะเวลา 1 ปีปฏิทิน (Hp(10) &lt; 20 mSv/year)</p>
          <p>2. สำหรับการประเมินรายรอบ ระดับรังสีเฝ้าระวัง (Alert Level) ตั้งไว้ที่ {department.alertLimit} mSv หากตรวจพบปริมาณเกิน เจ้าหน้าที่ต้องส่งรายงานต่อ RSO เพื่อตรวจสอบ</p>
        </div>

        {/* Sign-Off Footer section */}
        <div className="grid grid-cols-2 pt-10 text-xs text-slate-800 gap-8">
          <div className="text-center space-y-10">
            <p className="font-bold">ผู้รายงานสรุปข้อมูลผลรังสีสะสม</p>
            <div className="space-y-1">
              <p>...........................................................................</p>
              <p>(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</p>
              <p className="text-slate-500 text-[10px] font-bold">เจ้าหน้าที่เทคนิครังสีวิทยาประจำแผนก</p>
            </div>
          </div>
          
          <div className="text-center space-y-10">
            <p className="font-bold">ผู้ตรวจสอบและลงนามรับรองรายงาน</p>
            <div className="space-y-1">
              <p>...........................................................................</p>
              <p className="font-bold text-slate-900">(&nbsp;&nbsp;{department.rsoName}&nbsp;&nbsp;)</p>
              <p className="text-slate-600 font-bold">{department.rsoPosition}</p>
              <p className="text-slate-500 text-[10px] font-medium">{department.signatoryTitle}</p>
              <p className="text-slate-400 text-[10px] pt-1">วันที่ .......... เดือน ........................ พ.ศ. .............</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
