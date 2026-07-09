import { DatabaseState, Department, Employee, DoseRecord } from "./types";

// Seed data to make the app look immediately ready and realistic
const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "dept-1",
    name: "แผนกรังสีเทคนิค",
    hospitalName: "โรงพยาบาลศูนย์การแพทย์รังสี",
    annualLimit: 20.0,       // mSv per year
    periodLimit: 5.0,        // mSv per quarter
    alertLimit: 1.25,        // mSv monthly alert limit
    rsoName: "ดร.สมชาย ใจดี",
    rsoPosition: "เจ้าหน้าที่ความปลอดภัยทางรังสี (RSO) ชำนาญการพิเศษ",
    signatoryTitle: "หัวหน้าแผนกรังสีเทคนิค",
  },
  {
    id: "dept-2",
    name: "ฝ่ายรังสีวิทยาและเวชศาสตร์นิวเคลียร์",
    hospitalName: "โรงพยาบาลมหานครบูรพา",
    annualLimit: 20.0,
    periodLimit: 5.0,
    alertLimit: 1.25,
    rsoName: "นางสาวรัตนา แก้วมณี",
    rsoPosition: "นักรังสีการแพทย์ชำนาญการ (RSO)",
    signatoryTitle: "ผู้อำนวยการฝ่ายรังสีวิทยา",
  }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  // Employees for Department 1
  {
    id: "emp-101",
    departmentId: "dept-1",
    employeeIdCode: "RAD-001",
    name: "นายปกรณ์ บุญเรือง",
    position: "นักรังสีการแพทย์ชำนาญการ",
    status: "active",
  },
  {
    id: "emp-102",
    departmentId: "dept-1",
    employeeIdCode: "RAD-002",
    name: "นางสาวพิมลพรรณ เลิศวิไล",
    position: "นักรังสีการแพทย์",
    status: "active",
  },
  {
    id: "emp-103",
    departmentId: "dept-1",
    employeeIdCode: "RAD-003",
    name: "นายอนันต์ ศรีสุข",
    position: "เจ้าพนักงานรังสีการแพทย์",
    status: "active",
  },
  {
    id: "emp-104",
    departmentId: "dept-1",
    employeeIdCode: "RAD-004",
    name: "แพทย์หญิงณัฐธิดา งามดี",
    position: "รังสีแพทย์",
    status: "active",
  },
  {
    id: "emp-105",
    departmentId: "dept-1",
    employeeIdCode: "RAD-005",
    name: "นางจารุวรรณ สมบัติ",
    position: "พยาบาลวิชาชีพแผนกรังสี",
    status: "active",
  },
  // Employees for Department 2
  {
    id: "emp-201",
    departmentId: "dept-2",
    employeeIdCode: "NUC-011",
    name: "นายสมยศ แสนดี",
    position: "นักรังสีการแพทย์",
    status: "active",
  },
  {
    id: "emp-202",
    departmentId: "dept-2",
    employeeIdCode: "NUC-012",
    name: "นางสาวศิริลักษณ์ อุดมสุข",
    position: "พยาบาลรังสีเทคนิค",
    status: "active",
  }
];

const DEFAULT_RECORDS: DoseRecord[] = [
  // Department 1 History (Year 2568, Quarters 1-4)
  {
    id: "rec-1",
    employeeId: "emp-101",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2568",
    year: 2568,
    deepDose: 0.15,
    shallowDose: 0.18,
    remarks: "M",
    recordedAt: "2025-04-10T09:00:00Z",
  },
  {
    id: "rec-2",
    employeeId: "emp-101",
    departmentId: "dept-1",
    period: "ไตรมาส 2/2568",
    year: 2568,
    deepDose: 0.45,
    shallowDose: 0.51,
    remarks: "Normal",
    recordedAt: "2025-07-11T10:00:00Z",
  },
  {
    id: "rec-3",
    employeeId: "emp-101",
    departmentId: "dept-1",
    period: "ไตรมาส 3/2568",
    year: 2568,
    deepDose: 1.35, // Trigger single-period alert (> 1.25)
    shallowDose: 1.45,
    remarks: "High workload in CT scan",
    recordedAt: "2025-10-15T08:30:00Z",
  },
  {
    id: "rec-4",
    employeeId: "emp-101",
    departmentId: "dept-1",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.22,
    shallowDose: 0.25,
    remarks: "Normal",
    recordedAt: "2026-01-10T14:20:00Z",
  },

  // Employee 102 - Miss Pimonpan (Dose approaching annual limit warning or period alert)
  {
    id: "rec-5",
    employeeId: "emp-102",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2568",
    year: 2568,
    deepDose: 0.35,
    shallowDose: 0.40,
    remarks: "Normal",
    recordedAt: "2025-04-10T09:15:00Z",
  },
  {
    id: "rec-6",
    employeeId: "emp-102",
    departmentId: "dept-1",
    period: "ไตรมาส 2/2568",
    year: 2568,
    deepDose: 0.85,
    shallowDose: 0.95,
    remarks: "Normal",
    recordedAt: "2025-07-11T10:15:00Z",
  },
  {
    id: "rec-7",
    employeeId: "emp-102",
    departmentId: "dept-1",
    period: "ไตรมาส 3/2568",
    year: 2568,
    deepDose: 1.80, // Over periodic limit alert
    shallowDose: 2.10,
    remarks: "Interventional fluoroscopy assistant",
    recordedAt: "2025-10-15T08:45:00Z",
  },
  {
    id: "rec-8",
    employeeId: "emp-102",
    departmentId: "dept-1",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.50,
    shallowDose: 0.55,
    remarks: "Normal",
    recordedAt: "2026-01-10T14:30:00Z",
  },

  // Other employees with low/normal doses
  {
    id: "rec-9",
    employeeId: "emp-103",
    departmentId: "dept-1",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.08,
    shallowDose: 0.10,
    remarks: "M (Minimum)",
    recordedAt: "2026-01-10T14:35:00Z",
  },
  {
    id: "rec-10",
    employeeId: "emp-104",
    departmentId: "dept-1",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.12,
    shallowDose: 0.15,
    remarks: "Normal",
    recordedAt: "2026-01-10T14:40:00Z",
  },

  // Department 1 - New Year 2569, Quarter 1
  {
    id: "rec-11",
    employeeId: "emp-101",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 0.28,
    shallowDose: 0.32,
    remarks: "Normal",
    recordedAt: "2026-04-12T11:00:00Z",
  },
  {
    id: "rec-12",
    employeeId: "emp-102",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 2.15, // Extremely high dose to trigger alert in current year
    shallowDose: 2.30,
    remarks: "Heavy assist in angiography procedures",
    recordedAt: "2026-04-12T11:10:00Z",
  },
  {
    id: "rec-13",
    employeeId: "emp-103",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 0.11,
    shallowDose: 0.14,
    remarks: "M",
    recordedAt: "2026-04-12T11:15:00Z",
  },
  {
    id: "rec-14",
    employeeId: "emp-104",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 0.05,
    shallowDose: 0.07,
    remarks: "M",
    recordedAt: "2026-04-12T11:20:00Z",
  },
  {
    id: "rec-15",
    employeeId: "emp-105",
    departmentId: "dept-1",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 0.04,
    shallowDose: 0.05,
    remarks: "M",
    recordedAt: "2026-04-12T11:25:00Z",
  },

  // Department 2 Seed Data (Year 2568, Q4 and Year 2569, Q1)
  {
    id: "rec-20",
    employeeId: "emp-201",
    departmentId: "dept-2",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.35,
    shallowDose: 0.40,
    remarks: "Normal",
    recordedAt: "2026-01-15T09:00:00Z",
  },
  {
    id: "rec-21",
    employeeId: "emp-202",
    departmentId: "dept-2",
    period: "ไตรมาส 4/2568",
    year: 2568,
    deepDose: 0.12,
    shallowDose: 0.15,
    remarks: "Normal",
    recordedAt: "2026-01-15T09:15:00Z",
  },
  {
    id: "rec-22",
    employeeId: "emp-201",
    departmentId: "dept-2",
    period: "ไตรมาส 1/2569",
    year: 2569,
    deepDose: 0.42,
    shallowDose: 0.48,
    remarks: "Normal",
    recordedAt: "2026-04-18T10:00:00Z",
  }
];

const STORAGE_KEY = "radiation_dose_tracker_db";

export function loadDatabase(): DatabaseState {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data) as DatabaseState;
      // Ensure basic arrays and fields exist
      if (
        Array.isArray(parsed.departments) &&
        parsed.departments.length > 0 &&
        parsed.employees &&
        parsed.records &&
        parsed.activeDepartmentId
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error loading database from localStorage:", e);
  }

  // Fallback to seeded database if empty or corrupted
  const defaultState: DatabaseState = {
    departments: DEFAULT_DEPARTMENTS,
    activeDepartmentId: "dept-1",
    employees: DEFAULT_EMPLOYEES,
    records: DEFAULT_RECORDS,
  };
  saveDatabase(defaultState);
  return defaultState;
}

export function saveDatabase(state: DatabaseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving database to localStorage:", e);
  }
}

export function exportDatabase(state: DatabaseState): void {
  try {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    // Create meaningful filename
    const activeDept = state.departments.find(d => d.id === state.activeDepartmentId);
    const deptName = activeDept ? activeDept.name.replace(/\s+/g, "_") : "dept";
    const dateStr = new Date().toISOString().split("T")[0];
    
    a.href = url;
    a.download = `radiation_dose_backup_${deptName}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Error exporting database:", e);
    alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
  }
}

export function importDatabase(jsonContent: string, currentState: DatabaseState): DatabaseState {
  try {
    const imported = JSON.parse(jsonContent);
    if (!imported.departments || !imported.employees || !imported.records) {
      throw new Error("ไฟล์ Backup ไม่ถูกต้อง (ขาดตารางข้อมูลหลัก)");
    }

    // Merge strategy to prevent duplicate key issues or missing current entities
    // We will replace departments, employees, and records.
    const mergedState: DatabaseState = {
      departments: Array.isArray(imported.departments) ? imported.departments : currentState.departments,
      activeDepartmentId: imported.activeDepartmentId || currentState.activeDepartmentId,
      employees: Array.isArray(imported.employees) ? imported.employees : currentState.employees,
      records: Array.isArray(imported.records) ? imported.records : currentState.records,
    };

    saveDatabase(mergedState);
    return mergedState;
  } catch (e: any) {
    throw new Error(`การนำเข้าข้อมูลล้มเหลว: ${e.message}`);
  }
}
