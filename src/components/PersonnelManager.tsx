import React, { useState, useMemo, useEffect } from "react";
import { Employee, DoseRecord, Department } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Activity,
  Award,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface PersonnelManagerProps {
  department: Department;
  employees: Employee[];
  records: DoseRecord[];
  onAddEmployee: (employee: Omit<Employee, "id" | "departmentId">) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteRecord: (id: string) => void;
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string | null) => void;
}

export default function PersonnelManager({
  department,
  employees,
  records,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDeleteRecord,
  selectedEmployeeId,
  onSelectEmployee,
}: PersonnelManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Custom delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "employee" | "record";
    id: string;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formBadgeId, setFormBadgeId] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  // Get active department employees
  const deptEmployees = useMemo(() => {
    return employees.filter((e) => e.departmentId === department.id);
  }, [employees, department.id]);

  // Filtered list
  const filteredEmployees = useMemo(() => {
    return deptEmployees.filter((emp) => {
      const matchName = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBadge = emp.employeeIdCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPosition = emp.position.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchBadge || matchPosition;
    });
  }, [deptEmployees, searchTerm]);

  // Get selected employee
  const selectedEmployee = useMemo(() => {
    return deptEmployees.find((e) => e.id === selectedEmployeeId) || null;
  }, [deptEmployees, selectedEmployeeId]);

  // Selected employee records
  const selectedEmployeeRecords = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return records
      .filter((r) => r.employeeId === selectedEmployeeId)
      .sort((a, b) => {
        // Sort by year, then period name
        if (a.year !== b.year) return b.year - a.year;
        return b.period.localeCompare(a.period, "th");
      });
  }, [records, selectedEmployeeId]);

  // Selected employee annual sum
  const selectedEmployeeAnnualSum = useMemo(() => {
    if (selectedEmployeeRecords.length === 0) return 0;
    const currentYear = Math.max(...selectedEmployeeRecords.map((r) => r.year));
    return selectedEmployeeRecords
      .filter((r) => r.year === currentYear)
      .reduce((sum, r) => sum + r.deepDose, 0);
  }, [selectedEmployeeRecords]);

  // Chart data for selected employee history (sorted in chronological order for line chart)
  const personalChartData = useMemo(() => {
    return [...selectedEmployeeRecords]
      .reverse() // chronologically
      .map((r) => ({
        period: r.period,
        Hp10: Number(r.deepDose.toFixed(3)),
        Hp007: Number(r.shallowDose.toFixed(3)),
      }));
  }, [selectedEmployeeRecords]);

  // Reset form
  const resetForm = () => {
    setFormName("");
    setFormPosition("");
    setFormBadgeId("");
    setFormStatus("active");
    setShowAddForm(false);
    setEditingEmployee(null);
  };

  // Handle Edit button click
  const handleStartEdit = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormPosition(emp.position);
    setFormBadgeId(emp.employeeIdCode);
    setFormStatus(emp.status);
    setShowAddForm(true);
  };

  // Handle submit Add/Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formBadgeId.trim() || !formPosition.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingEmployee) {
      onUpdateEmployee({
        ...editingEmployee,
        name: formName,
        position: formPosition,
        employeeIdCode: formBadgeId,
        status: formStatus,
      });
    } else {
      onAddEmployee({
        name: formName,
        position: formPosition,
        employeeIdCode: formBadgeId,
        status: formStatus,
      });
    }
    resetForm();
  };

  // Auto-select first employee if none selected on desktop
  useEffect(() => {
    if (!selectedEmployeeId && filteredEmployees.length > 0) {
      // Don't auto-select on small screens to avoid breaking single-panel flow
      if (window.innerWidth >= 1024) {
        onSelectEmployee(filteredEmployees[0].id);
      }
    }
  }, [filteredEmployees, selectedEmployeeId, onSelectEmployee]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      {/* List Panel */}
      <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 lg:col-span-1 ${selectedEmployeeId && "hidden lg:block"}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">บุคลากรทางรังสี ({filteredEmployees.length})</h2>
          {!showAddForm && (
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-blue-200/50"
            >
              <UserPlus className="size-3.5" />
              เพิ่มบุคลากร
            </button>
          )}
        </div>

        {/* Form Container (Collapsible) */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {editingEmployee ? "แก้ไขข้อมูลบุคลากร" : "เพิ่มบุคลากรใหม่"}
            </h3>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น นายอภิชาต ทวีสุข"
                  className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">ตำแหน่งงาน</label>
                  <input
                    type="text"
                    required
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="เช่น นักรังสีการแพทย์"
                    className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">รหัสพนักงาน/Badge ID</label>
                  <input
                    type="text"
                    required
                    value={formBadgeId}
                    onChange={(e) => setFormBadgeId(e.target.value)}
                    placeholder="เช่น RAD-001"
                    className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">สถานะผู้ใช้</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
                  className="w-full bg-white text-xs border border-slate-200 rounded-md p-2 focus:outline-blue-500 text-slate-800 font-medium"
                >
                  <option value="active">Active (ปฏิบัติงานรังสี)</option>
                  <option value="inactive">Inactive (หยุดปฏิบัติงาน/ย้ายหน่วย)</option>
                </select>
              </div>
              <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2.5 py-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm cursor-pointer"
                >
                  {editingEmployee ? "บันทึกแก้ไข" : "บันทึกข้อมูล"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัส หรือตำแหน่งงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-xs border border-slate-200 rounded-lg py-1.5 pl-8.5 pr-3 text-slate-800 placeholder:text-slate-400 focus:outline-blue-500 focus:bg-white font-medium"
          />
        </div>

        {/* Employee List */}
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => {
              const isSelected = emp.id === selectedEmployeeId;
              return (
                <div
                  key={emp.id}
                  onClick={() => onSelectEmployee(emp.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs">{emp.name}</h4>
                      {emp.status === "active" ? (
                        <span className={`size-1.5 rounded-full ${isSelected ? "bg-emerald-300" : "bg-emerald-500"}`}></span>
                      ) : (
                        <span className="size-1.5 rounded-full bg-slate-400"></span>
                      )}
                    </div>
                    <p className={`text-[10px] font-medium ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                      {emp.position} • {emp.employeeIdCode}
                    </p>
                  </div>
                  <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <button
                      onClick={(e) => handleStartEdit(emp, e)}
                      className={`p-1 rounded transition-colors ${
                        isSelected ? "hover:bg-blue-500 text-white" : "hover:bg-slate-200 text-slate-600"
                      } cursor-pointer`}
                      title="แก้ไขโปรไฟล์"
                    >
                      <Edit2 className="size-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          type: "employee",
                          id: emp.id,
                          title: "ยืนยันการลบข้อมูลบุคลากร",
                          message: `คุณต้องการลบข้อมูลบุคลากร "${emp.name}" ใช่หรือไม่? ประวัติการตรวจวัดและสถิติปริมาณรังสีทั้งหมดของพนักงานท่านนี้จะถูกลบออกจากระบบอย่างถาวรและไม่สามารถเรียกคืนได้`,
                          onConfirm: () => {
                            onDeleteEmployee(emp.id);
                            if (selectedEmployeeId === emp.id) onSelectEmployee(null);
                          }
                        });
                      }}
                      className={`p-1 rounded transition-colors ${
                        isSelected ? "hover:bg-blue-500 text-white" : "hover:bg-red-100 text-red-600"
                      } cursor-pointer`}
                      title="ลบบุคลากร"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">ไม่พบบุคลากร</p>
              <p className="text-[10px] text-slate-400 mt-0.5">ลองเปลี่ยนคำค้นหา หรือกด "เพิ่มบุคลากร"</p>
            </div>
          )}
        </div>
      </div>

      {/* Details Panel */}
      <div className={`lg:col-span-2 space-y-4 ${!selectedEmployeeId && "hidden lg:block"}`}>
        {selectedEmployee ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-5">
            {/* Header / Mobile Back Button */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectEmployee(null)}
                  className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden cursor-pointer"
                >
                  <ArrowLeft className="size-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{selectedEmployee.name}</h2>
                    {selectedEmployee.status === "active" ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="size-2.5" /> ACTIVE
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold border border-slate-200 flex items-center gap-1">
                        <XCircle className="size-2.5" /> INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {selectedEmployee.position} • รหัสเครื่องวัดรังสี: <span className="font-mono text-slate-700 font-bold">{selectedEmployee.employeeIdCode}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">ค่าสะสมปีล่าสุด</span>
                <span className={`text-xl font-black ${
                  selectedEmployeeAnnualSum >= department.annualLimit
                    ? "text-red-600"
                    : selectedEmployeeAnnualSum >= department.annualLimit * 0.75
                    ? "text-amber-500"
                    : "text-blue-600"
                }`}>
                  {selectedEmployeeAnnualSum.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 font-bold"> mSv</span>
              </div>
            </div>

            {/* Warning threshold box if near or over */}
            {selectedEmployeeAnnualSum >= department.annualLimit * 0.75 && (
              <div className={`p-4 rounded-lg border flex items-start gap-3 text-xs ${
                selectedEmployeeAnnualSum >= department.annualLimit
                  ? "bg-red-50 border-red-200 text-red-950"
                  : "bg-amber-50 border-amber-200 text-amber-950"
              }`}>
                <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5 animate-bounce" />
                <div className="space-y-1">
                  <h4 className="font-bold uppercase tracking-wider text-[10px]">
                    {selectedEmployeeAnnualSum >= department.annualLimit
                      ? "🚨 ตรวจพบค่ารังสีสะสมประจำปีเกินเกณฑ์อันตรายสูงสุด!"
                      : "⚠️ คำเตือน: ปริมาณรังสีสะสมใกล้เกินเกณฑ์มาตรฐาน"}
                  </h4>
                  <p className="text-[11px] leading-relaxed opacity-90 font-medium">
                    {selectedEmployeeAnnualSum >= department.annualLimit
                      ? `ค่ารังสีสะสมรวมประจำปี (${selectedEmployeeAnnualSum.toFixed(2)} mSv) ได้เกินเกณฑ์จำกัดความปลอดภัยระดับประเทศ (${department.annualLimit} mSv/ปี) เรียบร้อยแล้ว โปรดรายงานผู้บริหารหรือ RSO เพื่อพิจารณาปรับการมอบหมายงานทันที!`
                      : `ค่ารังสีสะสมรวมในรอบปีนี้ (${selectedEmployeeAnnualSum.toFixed(2)} mSv) สูงเกิน 75% ของขีดจำกัดปลอดภัย (${department.annualLimit} mSv) ควรจำกัดชั่วโมงปฏิบัติงานในห้องรังสีลง`}
                  </p>
                </div>
              </div>
            )}

            {/* Line graph of individual trend over time */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">กราฟประวัติปริมาณรังสีสะสมย้อนหลัง (Hp(10) Deep vs Hp(0.07) Shallow)</h3>
              {personalChartData.length > 0 ? (
                <div className="h-56 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={personalChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#FFF" />
                      <XAxis dataKey="period" tick={{ fill: "#64748B", fontSize: 10, fontWeight: "600" }} axisLine={false} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10, fontWeight: "600" }} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, borderColor: "#E2E8F0" }} />
                      <Line
                        name="Hp(10) Deep (mSv)"
                        type="monotone"
                        dataKey="Hp10"
                        stroke="#2563EB"
                        strokeWidth={2.5}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        name="Hp(0.07) Shallow (mSv)"
                        type="monotone"
                        dataKey="Hp007"
                        stroke="#06B6D4"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                      <ReferenceLine
                        y={department.alertLimit}
                        stroke="#EF4444"
                        strokeDasharray="4 4"
                        label={{ value: "Alert Limit", fill: "#EF4444", fontSize: 8, position: "insideBottomRight", fontWeight: "700" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <Activity className="size-8 text-slate-300 mb-1" />
                  <p className="text-xs font-bold">ไม่มีบันทึกข้อมูลประวัติรังสีในระบบ</p>
                </div>
              )}
            </div>

            {/* History Table list */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">บันทึกข้อมูลประวัติทั้งหมด ({selectedEmployeeRecords.length} รายการ)</h3>
              {selectedEmployeeRecords.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">รอบระยะเวลา</th>
                        <th className="p-2.5">ปี พ.ศ.</th>
                        <th className="p-2.5 text-right">Hp(10) Deep (mSv)</th>
                        <th className="p-2.5 text-right">Hp(0.07) Shallow (mSv)</th>
                        <th className="p-2.5">หมายเหตุ/ข้อมูลเพิ่มเติม</th>
                        <th className="p-2.5 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedEmployeeRecords.map((rec) => {
                        const isHigh = rec.deepDose >= department.alertLimit;
                        return (
                          <tr key={rec.id} className={`hover:bg-slate-50/50 ${isHigh && "bg-amber-50/20"}`}>
                            <td className="p-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-slate-400" />
                              {rec.period}
                            </td>
                            <td className="p-2.5 font-medium">{rec.year}</td>
                            <td className={`p-2.5 text-right font-black ${isHigh ? "text-amber-600" : "text-slate-800"}`}>
                              {rec.deepDose.toFixed(3)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-500">{rec.shallowDose.toFixed(3)}</td>
                            <td className="p-2.5">
                              {rec.remarks ? (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                  rec.remarks === "M" || rec.remarks === "Below limit"
                                    ? "bg-slate-100 text-slate-600 border-slate-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  {rec.remarks}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => {
                                  setDeleteTarget({
                                    type: "record",
                                    id: rec.id,
                                    title: "ยืนยันการลบข้อมูลปริมาณรังสี",
                                    message: `คุณต้องการลบข้อมูลประวัติปริมาณรังสีรอบ "${rec.period}" ปี พ.ศ. ${rec.year} ปริมาณ Hp(10): ${rec.deepDose} mSv ใช่หรือไม่? ข้อมูลนี้จะถูกลบออกจากระบบของพนักงานทันที`,
                                    onConfirm: () => {
                                      onDeleteRecord(rec.id);
                                    }
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                title="ลบข้อมูลฟิลด์นี้"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-slate-200">
                  <FileText className="size-8 text-slate-300 mx-auto mb-1" />
                  <p className="text-xs font-bold">ไม่พบข้อมูลปริมาณรังสีสะสม</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center text-slate-400 h-[500px] flex flex-col items-center justify-center">
            <UserPlus className="size-12 text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">โปรไฟล์และสถิติประวัติรังสี</h3>
            <p className="text-xs max-w-sm mt-1 leading-relaxed">
              กรุณาเลือกบุคลากรในรายชื่อทางด้านซ้าย หรือคลิกเพื่อเพิ่มบุคลากรใหม่ เพื่อเปิดดูสถิติ กราฟประวัติสะสม และข้อมูลโดยละเอียด
            </p>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            {/* Modal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden z-10 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-bold text-slate-800">{deleteTarget.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    {deleteTarget.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTarget.onConfirm();
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm shadow-red-600/10"
                >
                  ยืนยันการลบ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
