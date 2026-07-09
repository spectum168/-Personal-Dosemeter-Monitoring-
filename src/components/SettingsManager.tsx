import React, { useState, useRef } from "react";
import { Department, DatabaseState } from "../types";
import { exportDatabase, importDatabase } from "../dbStorage";
import {
  Settings,
  Building,
  Shield,
  UserCheck,
  CloudLightning,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Info,
  Image,
  Camera,
  Trash2,
} from "lucide-react";

interface SettingsManagerProps {
  departments: Department[];
  activeDepartmentId: string;
  onSelectDepartment: (id: string) => void;
  onAddDepartment: (dept: Omit<Department, "id">) => void;
  onUpdateDepartment: (dept: Department) => void;
  databaseState: DatabaseState;
  onImportState: (state: DatabaseState) => void;
}

export default function SettingsManager({
  departments,
  activeDepartmentId,
  onSelectDepartment,
  onAddDepartment,
  onUpdateDepartment,
  databaseState,
  onImportState,
}: SettingsManagerProps) {
  const activeDept = departments.find((d) => d.id === activeDepartmentId) || departments[0];

  // Profile creation state
  const [showNewDeptForm, setShowNewDeptForm] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [newHospitalName, setNewHospitalName] = useState("");

  // Edit current profile states
  const [editName, setEditName] = useState(activeDept.name);
  const [editHospital, setEditHospital] = useState(activeDept.hospitalName);
  const [editAnnualLimit, setEditAnnualLimit] = useState(activeDept.annualLimit.toString());
  const [editPeriodLimit, setEditPeriodLimit] = useState(activeDept.periodLimit.toString());
  const [editAlertLimit, setEditAlertLimit] = useState(activeDept.alertLimit.toString());
  const [editRsoName, setEditRsoName] = useState(activeDept.rsoName);
  const [editRsoPosition, setEditRsoPosition] = useState(activeDept.rsoPosition);
  const [editSignatoryTitle, setEditSignatoryTitle] = useState(activeDept.signatoryTitle);
  const [editLogoUrl, setEditLogoUrl] = useState(activeDept.logoUrl || "");

  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync state on change of activeDept
  React.useEffect(() => {
    setEditName(activeDept.name);
    setEditHospital(activeDept.hospitalName);
    setEditAnnualLimit(activeDept.annualLimit.toString());
    setEditPeriodLimit(activeDept.periodLimit.toString());
    setEditAlertLimit(activeDept.alertLimit.toString());
    setEditRsoName(activeDept.rsoName);
    setEditRsoPosition(activeDept.rsoPosition);
    setEditSignatoryTitle(activeDept.signatoryTitle);
    setEditLogoUrl(activeDept.logoUrl || "");
  }, [activeDept]);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > 1024 * 1024) {
      alert("ขนาดรูปภาพต้องไม่เกิน 1MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Handle Edit Profile Save
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDepartment({
      id: activeDept.id,
      name: editName,
      hospitalName: editHospital,
      annualLimit: parseFloat(editAnnualLimit) || 20.0,
      periodLimit: parseFloat(editPeriodLimit) || 5.0,
      alertLimit: parseFloat(editAlertLimit) || 1.25,
      rsoName: editRsoName,
      rsoPosition: editRsoPosition,
      signatoryTitle: editSignatoryTitle,
      logoUrl: editLogoUrl,
    });

    setSaveSuccessMsg("บันทึกการตั้งค่าแผนกปัจจุบันเรียบร้อยแล้ว!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  // Handle Add New Profile
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newHospitalName.trim()) {
      alert("กรุณากรอกข้อมูลหน่วยงานให้ครบถ้วน");
      return;
    }

    onAddDepartment({
      name: newDeptName,
      hospitalName: newHospitalName,
      annualLimit: 20.0,
      periodLimit: 5.0,
      alertLimit: 1.25,
      rsoName: "เจ้าหน้าที่ความปลอดภัยทางรังสี (RSO)",
      rsoPosition: "นักรังสีการแพทย์",
      signatoryTitle: "หัวหน้าแผนกรังสีเทคนิค",
    });

    // Reset and close
    setNewDeptName("");
    setNewHospitalName("");
    setShowNewDeptForm(false);
  };

  // Trigger JSON file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle JSON backup file import
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const newState = importDatabase(text, databaseState);
        onImportState(newState);
        alert("นำเข้าฐานข้อมูลและโครงสร้างประวัติรังสีสำเร็จเรียบร้อยแล้ว!");
      } catch (err: any) {
        alert(err.message || "การนำเข้าข้อมูลล้มเหลว");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {/* LEFT COLUMN: Department Switcher & Creation */}
      <div className="space-y-4 lg:col-span-1">
        {/* Department Switcher */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <Building className="size-4 text-blue-600" />
            หน่วยงาน / โรงพยาบาล
          </h2>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            ท่านสามารถเพิ่มได้หลายหน่วยงาน เพื่อแยกสถิติ ปริมาณรังสีสะสม และรายชื่อพนักงานออกจากกันโดยสิ้นเชิงข้อมูลไม่ปะปนกัน (Multi-profile)
          </p>

          <div className="space-y-1.5">
            {departments.map((d) => {
              const isActive = d.id === activeDepartmentId;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    onSelectDepartment(d.id);
                    // Sync form states with newly selected department
                    setEditName(d.name);
                    setEditHospital(d.hospitalName);
                    setEditAnnualLimit(d.annualLimit.toString());
                    setEditPeriodLimit(d.periodLimit.toString());
                    setEditAlertLimit(d.alertLimit.toString());
                    setEditRsoName(d.rsoName);
                    setEditRsoPosition(d.rsoPosition);
                    setEditSignatoryTitle(d.signatoryTitle);
                  }}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <h4 className="font-bold text-xs">{d.name}</h4>
                  <p className={`text-[10px] mt-0.5 font-medium ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                    {d.hospitalName}
                  </p>
                </div>
              );
            })}
          </div>

          {!showNewDeptForm ? (
            <button
              onClick={() => setShowNewDeptForm(true)}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              เพิ่มหน่วยงาน / แผนกใหม่
            </button>
          ) : (
            <form onSubmit={handleCreateProfile} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
              <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">ข้อมูลหน่วยงานใหม่</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อโรงพยาบาล/หน่วยงานใหญ่</label>
                  <input
                    type="text"
                    required
                    value={newHospitalName}
                    onChange={(e) => setNewHospitalName(e.target.value)}
                    placeholder="เช่น รพ.กรุงเทพพญาทัย"
                    className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อแผนกรังสี</label>
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="เช่น ฝ่ายรังสีวินิจฉัย"
                    className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800 font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-1.5 justify-end pt-1 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewDeptForm(false)}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm cursor-pointer"
                >
                  สร้างหน่วยงาน
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Database Backup & Google Drive Guide */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <CloudLightning className="size-4 text-blue-600" />
            จัดเก็บข้อมูลลง Google Drive
          </h2>
          
          <div className="p-3 bg-blue-50 text-blue-950 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 border border-blue-200/50 font-medium font-sans">
            <Info className="size-4 shrink-0 text-blue-600 mt-0.5" />
            <p>
              <strong>นโยบายความเป็นส่วนตัวสูงสุด:</strong> ข้อมูลบุคลากรทางการแพทย์ทั้งหมดถูกจัดเก็บภายใน <strong>Local Storage ของเบราว์เซอร์อย่างปลอดภัย 100%</strong> ไม่มีเซิร์ฟเวอร์ภายนอกเก็บข้อมูลของคุณ
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-600 font-medium">
            <p className="font-bold text-slate-800">วิธีการจัดเก็บบน Google Drive ของท่านเพื่อความต่อเนื่อง:</p>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>คลิกปุ่ม <strong>"ดาวน์โหลด Backup"</strong> ด้านล่างเพื่อรับไฟล์ข้อมูลแผนกและประวัติรังสีเป็นไฟล์ <span className="font-bold text-blue-600 font-mono">.json</span></li>
              <li>อัปโหลดไฟล์ไปบันทึกไว้ในโฟลเดอร์บน <strong>Google Drive ส่วนตัวหรือของหน่วยงาน</strong> เพื่อติดตามประวัติย้อนหลัง</li>
              <li>เมื่อสลับไปใช้คอมพิวเตอร์เครื่องอื่น ให้เปิดหน้านี้แล้วกดปุ่ม <strong>"นำเข้า Backup"</strong> เพื่อนำข้อมูลประวัติรังสีทั้งหมดกลับมาทำงานต่อ</li>
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => exportDatabase(databaseState)}
              className="py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-blue-600/10"
            >
              <Download className="size-3.5" />
              ดาวน์โหลด Backup
            </button>
            <button
              onClick={triggerFileInput}
              className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="size-3.5" />
              นำเข้า Backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active Profile Setup Forms */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
            <Settings className="size-4 text-blue-600" />
            ตั้งค่าเกณฑ์รังสีและผู้รับรองของ: <span className="text-blue-600 font-black">{activeDept.name}</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">แก้ไขรายละเอียดการแสดงผล ลายเซ็น และเกณฑ์จำกัดสูงสุดเฉพาะหน่วยงานนี้</p>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-bold">
            {saveSuccessMsg}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="size-3.5" />
              1. ข้อมูลชื่อหน่วยงานและโรงพยาบาล
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              {/* Logo section */}
              <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                  onClick={() => logoInputRef.current?.click()}
                  className="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors shrink-0 overflow-hidden relative group"
                  title="คลิกหรือลากไฟล์ภาพมาที่นี่เพื่ออัปโหลดโลโก้หน่วยงาน"
                >
                  {editLogoUrl ? (
                    <>
                      <img 
                        src={editLogoUrl} 
                        alt="Logo Preview" 
                        className="w-full h-full object-contain p-1"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="size-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <Image className="size-5 text-slate-400 mb-0.5" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">อัปโหลดโลโก้</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1 flex-1 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-slate-800">โลโก้หน่วยงาน / โรงพยาบาล</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    ลากและวางภาพโลโก้ หรือคลิกที่กรอบเพื่ออัปโหลดรูปภาพประจำแผนกของท่าน ไฟล์ที่อัปโหลดจะถูกแสดงในรายงานพิมพ์ PDF และบนแดชบอร์ด
                  </p>
                  <p className="text-[9px] text-amber-600 font-bold">
                    * แนะนำภาพทรงจัตุรัสหรือทรงกลม ขนาดไม่เกิน 1MB เพื่อความเร็วในการดาวน์โหลด
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      เลือกไฟล์ภาพ
                    </button>
                    {editLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditLogoUrl("")}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="size-3" />
                        ลบโลโก้
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อโรงพยาบาล/หน่วยงานหลัก (Hospital Name)</label>
                <input
                  type="text"
                  required
                  value={editHospital}
                  onChange={(e) => setEditHospital(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อแผนก/สาขา (Department Name)</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dose thresholds */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="size-3.5" />
              2. เกณฑ์จำกัดรังสีสูงสุดปลอดภัย (mSv)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ขีดจำกัดรังสีสูงสุดรายปี (Annual Limit)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editAnnualLimit}
                  onChange={(e) => setEditAnnualLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-black"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">มาตรฐานสากลคือ 20.0 mSv/ปี</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">เกณฑ์รังสีรายรอบ (Quarterly Limit)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editPeriodLimit}
                  onChange={(e) => setEditPeriodLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">แนะนำคือ 5.0 mSv ต่อไตรมาส</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">เกณฑ์เฝ้าระวังสีส้ม (Alert Limit)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editAlertLimit}
                  onChange={(e) => setEditAlertLimit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 text-amber-600 font-black"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">เตือนเฝ้าระวังรอบวัด เช่น 1.25 mSv</span>
              </div>
            </div>
          </div>

          {/* Section 3: Sign-off detail */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="size-3.5" />
              3. ข้อมูลผู้ลงนามรับรองและประวัติลายเซ็นท้ายรายงาน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อผู้รับรองความปลอดภัย (RSO Name)</label>
                <input
                  type="text"
                  required
                  value={editRsoName}
                  onChange={(e) => setEditRsoName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ตำแหน่งทางรังสีวิทยา (RSO Position)</label>
                <input
                  type="text"
                  required
                  value={editRsoPosition}
                  onChange={(e) => setEditRsoPosition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ตำแหน่งในการเซ็น (Signatory Title)</label>
                <input
                  type="text"
                  required
                  value={editSignatoryTitle}
                  onChange={(e) => setEditSignatoryTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 focus:outline-blue-500 text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Save buttons */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs px-5 py-2.5 rounded-md font-bold shadow-md shadow-blue-600/10 cursor-pointer"
            >
              บันทึกการตั้งค่าแผนก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
