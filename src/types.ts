export interface Department {
  id: string;
  name: string;
  hospitalName: string;
  annualLimit: number;       // e.g., 20 mSv
  periodLimit: number;       // e.g., 5 mSv per period/quarter
  alertLimit: number;        // e.g., 1.25 mSv for alert trigger
  rsoName: string;           // Radiation Safety Officer (เจ้าหน้าที่ความปลอดภัยทางรังสี)
  rsoPosition: string;       // RSO Position, e.g., นักรังสีการแพทย์ชำนาญการ
  signatoryTitle: string;    // Text below signature line, e.g., "หัวหน้าแผนกรังสีเทคนิค"
  logoUrl?: string;          // Optional custom logo (base64 image or URL)
}

export interface Employee {
  id: string;
  departmentId: string;      // Organization profile ID
  employeeIdCode: string;    // Badge ID / Registration ID (เลขทะเบียน/เครื่องวัดรังสี)
  name: string;              // Full Name (ชื่อ-นามสกุล)
  position: string;          // Position (ตำแหน่ง)
  status: 'active' | 'inactive';
}

export interface DoseRecord {
  id: string;
  employeeId: string;        // ID of the Employee
  departmentId: string;      // Partition by department ID to prevent overlap
  period: string;            // Period name, e.g. "ไตรมาส 1/2569", "ประจำเดือน มกราคม 2569"
  year: number;              // Year of dose, e.g., 2569
  deepDose: number;          // Hp(10) deep dose in mSv
  shallowDose: number;       // Hp(0.07) shallow dose in mSv
  remarks: string;           // Remarks, e.g., "M" (Minimum), "Badge Lost"
  recordedAt: string;        // ISO timestamp when recorded
}

export interface DatabaseState {
  departments: Department[];
  activeDepartmentId: string;
  employees: Employee[];
  records: DoseRecord[];
}
