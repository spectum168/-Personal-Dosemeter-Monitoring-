import React, { useState, useEffect, useMemo } from "react";
import { DatabaseState, Department, Employee, DoseRecord } from "./types";
import { loadDatabase, saveDatabase } from "./dbStorage";
import Dashboard from "./components/Dashboard";
import PersonnelManager from "./components/PersonnelManager";
import DoseRecordEntry from "./components/DoseRecordEntry";
import ReportViewer from "./components/ReportViewer";
import SettingsManager from "./components/SettingsManager";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Users,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
  Menu,
  X,
  Building,
  Shield,
  Briefcase,
  Layers,
} from "lucide-react";

export default function App() {
  // Global Database State
  const [dbState, setDbState] = useState<DatabaseState>(() => loadDatabase());
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-persist database whenever it changes
  useEffect(() => {
    saveDatabase(dbState);
  }, [dbState]);

  // Destructure state for easy access
  const { departments, activeDepartmentId, employees, records } = dbState;

  // Active department object
  const activeDept = useMemo(() => {
    return departments.find((d) => d.id === activeDepartmentId) || departments[0];
  }, [departments, activeDepartmentId]);

  // Handler: Change active department/profile
  const handleSelectDepartment = (id: string) => {
    setDbState((prev) => ({
      ...prev,
      activeDepartmentId: id,
    }));
    setSelectedEmployeeId(null);
  };

  // Handler: Create new department
  const handleAddDepartment = (dept: Omit<Department, "id">) => {
    const newId = `dept-${Date.now()}`;
    const newDept: Department = { id: newId, ...dept };
    setDbState((prev) => ({
      ...prev,
      departments: [...prev.departments, newDept],
      activeDepartmentId: newId, // auto-switch
    }));
    setSelectedEmployeeId(null);
  };

  // Handler: Update active department settings
  const handleUpdateDepartment = (updatedDept: Department) => {
    setDbState((prev) => ({
      ...prev,
      departments: prev.departments.map((d) => (d.id === updatedDept.id ? updatedDept : d)),
    }));
  };

  // Handler: Add employee
  const handleAddEmployee = (newEmpData: Omit<Employee, "id" | "departmentId">) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      id: newId,
      departmentId: activeDepartmentId,
      ...newEmpData,
    };
    setDbState((prev) => ({
      ...prev,
      employees: [...prev.employees, newEmp],
    }));
    // Auto select newly created employee
    setSelectedEmployeeId(newId);
  };

  // Handler: Update employee
  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setDbState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)),
    }));
  };

  // Handler: Delete employee (cascades and deletes all dose records of that employee)
  const handleDeleteEmployee = (id: string) => {
    setDbState((prev) => ({
      ...prev,
      employees: prev.employees.filter((e) => e.id !== id),
      records: prev.records.filter((r) => r.employeeId !== id),
    }));
  };

  // Handler: Add a single radiation dose record
  const handleAddRecord = (newRecData: Omit<DoseRecord, "id" | "departmentId" | "recordedAt">) => {
    const newId = `rec-${Date.now()}`;
    const newRec: DoseRecord = {
      id: newId,
      departmentId: activeDepartmentId,
      recordedAt: new Date().toISOString(),
      ...newRecData,
    };
    setDbState((prev) => ({
      ...prev,
      records: [...prev.records, newRec],
    }));
  };

  // Handler: Delete a dose record
  const handleDeleteRecord = (recordId: string) => {
    setDbState((prev) => ({
      ...prev,
      records: prev.records.filter((r) => r.id !== recordId),
    }));
  };

  // Handler: Batch insert (handles registering new employees on-the-fly and linking records)
  const handleAddMultipleRecords = (
    rows: Array<{
      employeeId: string; // "new" or existing ID
      employeeName: string;
      position: string;
      badgeId: string;
      period: string;
      year: number;
      deepDose: number;
      shallowDose: number;
      remarks: string;
    }>
  ) => {
    setDbState((prev) => {
      const updatedEmployees = [...prev.employees];
      const updatedRecords = [...prev.records];

      rows.forEach((row) => {
        let targetEmployeeId = row.employeeId;

        // If it is marked as a new employee, register them first!
        if (targetEmployeeId === "new") {
          const newEmpId = `emp-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
          const newEmp: Employee = {
            id: newEmpId,
            departmentId: activeDepartmentId,
            name: row.employeeName,
            position: row.position,
            employeeIdCode: row.badgeId,
            status: "active",
          };
          updatedEmployees.push(newEmp);
          targetEmployeeId = newEmpId;
        }

        // Build and add the radiation record
        const newRecordId = `rec-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
        const newRecord: DoseRecord = {
          id: newRecordId,
          employeeId: targetEmployeeId,
          departmentId: activeDepartmentId,
          period: row.period,
          year: row.year,
          deepDose: row.deepDose,
          shallowDose: row.shallowDose,
          remarks: row.remarks,
          recordedAt: new Date().toISOString(),
        };
        updatedRecords.push(newRecord);
      });

      return {
        ...prev,
        employees: updatedEmployees,
        records: updatedRecords,
      };
    });
  };

  // Handler: Direct JSON database upload
  const handleImportState = (newState: DatabaseState) => {
    setDbState(newState);
    setSelectedEmployeeId(null);
  };

  // Helper: jump to personnel profile from alert list
  const handleSelectEmployeeAndNavigate = (empId: string) => {
    setSelectedEmployeeId(empId);
    setActiveTab("personnel");
  };

  // Nav Tabs config
  const navTabs = [
    { id: "dashboard", label: "แดชบอร์ดสรุปผล", icon: Layers },
    { id: "personnel", label: "จัดการประวัติบุคลากร", icon: Users },
    { id: "import", label: "นำเข้าข้อมูล / PDF", icon: Sparkles },
    { id: "report", label: "รายงานพิมพ์ PDF", icon: FileText },
    { id: "settings", label: "ตั้งค่าระบบ", icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Top Navigation Bar (no-print) */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 border-b border-slate-700 no-print">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg">R</div>
          <h1 className="text-sm md:text-base font-semibold tracking-tight">
            DoseGuard <span className="text-slate-400 font-normal">| Radiology Monitoring</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center bg-slate-800 rounded px-3 py-1 text-xs border border-slate-700">
            <span className="text-slate-400 mr-2">Unit:</span>
            <select
              value={activeDepartmentId}
              onChange={(e) => handleSelectDepartment(e.target.value)}
              className="bg-transparent border-none text-white font-medium outline-none cursor-pointer focus:ring-0 text-xs"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="text-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">System Active</span>
          </div>
          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* SIDEBAR NAVIGATION (no-print) */}
        <nav
          className={`absolute lg:relative inset-y-0 left-0 z-30 w-56 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transform transition-transform duration-300 no-print lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:flex"
          }`}
        >
          <div className="p-4 flex flex-col gap-1.5">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              ควบคุมความปลอดภัยรังสี
            </div>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-md text-xs flex items-center gap-3 transition-colors cursor-pointer ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-auto p-4 border-t border-slate-100 space-y-3">
            {/* Active profile widget */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] flex items-center gap-2.5">
              {activeDept.logoUrl ? (
                <div className="w-9 h-9 bg-white rounded-md p-0.5 border border-slate-200 flex items-center justify-center shrink-0">
                  <img
                    src={activeDept.logoUrl}
                    alt="Logo"
                    className="max-w-full max-h-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 bg-slate-200 rounded-md flex items-center justify-center font-black text-slate-500 text-xs shrink-0">
                  H
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase leading-none">หน่วยงานปัจจุบัน</p>
                <p className="font-bold text-slate-800 mt-1 truncate">{activeDept.hospitalName}</p>
                <p className="text-slate-500 truncate mt-0.5 leading-none">{activeDept.name}</p>
              </div>
            </div>

            {/* Sync Status Box */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Database Sync</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Google Drive</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">Connected</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Backdrop for mobile menu (no-print) */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden no-print"
          ></div>
        )}

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col p-4 md:p-6">
          <div className="flex-1 w-full max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {activeTab === "dashboard" && (
                  <Dashboard
                    department={activeDept}
                    employees={employees}
                    records={records}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                    onSelectEmployee={handleSelectEmployeeAndNavigate}
                  />
                )}

                {activeTab === "personnel" && (
                  <PersonnelManager
                    department={activeDept}
                    employees={employees}
                    records={records}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    onDeleteRecord={handleDeleteRecord}
                    selectedEmployeeId={selectedEmployeeId}
                    onSelectEmployee={setSelectedEmployeeId}
                  />
                )}

                {activeTab === "import" && (
                  <DoseRecordEntry
                    department={activeDept}
                    employees={employees}
                    onAddRecord={handleAddRecord}
                    onAddMultipleRecords={handleAddMultipleRecords}
                  />
                )}

                {activeTab === "report" && (
                  <ReportViewer
                    department={activeDept}
                    employees={employees}
                    records={records}
                    databaseState={dbState}
                  />
                )}

                {activeTab === "settings" && (
                  <SettingsManager
                    departments={departments}
                    activeDepartmentId={activeDepartmentId}
                    onSelectDepartment={handleSelectDepartment}
                    onAddDepartment={handleAddDepartment}
                    onUpdateDepartment={handleUpdateDepartment}
                    databaseState={dbState}
                    onImportState={handleImportState}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 bg-slate-200 flex items-center px-4 justify-between text-[10px] text-slate-600 shrink-0 font-medium no-print border-t border-slate-300">
        <div className="flex gap-4">
          <span>Storage: 1.2GB / 15GB (Google Drive)</span>
          <span>PDF Export Ready: Yes</span>
        </div>
        <div className="flex gap-4">
          <span className="text-blue-700 font-bold">Current Unit ID: {activeDept.id.toUpperCase()}</span>
          <span>Last Sync: 2 minutes ago</span>
        </div>
      </footer>
    </div>
  );
}
