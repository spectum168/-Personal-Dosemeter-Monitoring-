import React, { useMemo } from "react";
import { Employee, DoseRecord, Department } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  ShieldAlert,
  Activity,
  Award,
  AlertTriangle,
  TrendingUp,
  Heart,
  ChevronRight,
} from "lucide-react";

const normalizeName = (name: string): string => {
  return name
    .replace(/^(นาย|นางสาว|นาง|ดร\.|นพ\.|พญ\.|นายแพทย์|แพทย์หญิง|Mr\.|Mrs\.|Ms\.)\s*/, "")
    .trim()
    .replace(/\s+/g, "")
    .toLowerCase();
};

interface DashboardProps {
  department: Department;
  employees: Employee[];
  records: DoseRecord[];
  onNavigateToTab: (tab: string) => void;
  onSelectEmployee: (empId: string) => void;
}

export default function Dashboard({
  department,
  employees,
  records,
  onNavigateToTab,
  onSelectEmployee,
}: DashboardProps) {
  // Filter employees of current department
  const deptEmployees = useMemo(() => {
    return employees.filter((e) => e.departmentId === department.id);
  }, [employees, department.id]);

  const uniquePersonnelCount = useMemo(() => {
    const uniqueNames = new Set(deptEmployees.map((e) => normalizeName(e.name)));
    return uniqueNames.size;
  }, [deptEmployees]);

  const deptEmployeeIds = useMemo(() => {
    return new Set(deptEmployees.map((e) => e.id));
  }, [deptEmployees]);

  // Filter records of current department
  const deptRecords = useMemo(() => {
    return records.filter((r) => deptEmployeeIds.has(r.employeeId));
  }, [records, deptEmployeeIds]);

  // Get current year (maximum year found in records, or current Thai Year)
  const currentYear = useMemo(() => {
    if (deptRecords.length === 0) return 2569; // fallback
    return Math.max(...deptRecords.map((r) => r.year));
  }, [deptRecords]);

  // Calculate annual cumulative dose for each unique person for the current year
  const employeeDoseStats = useMemo(() => {
    const stats: {
      [normalizedNameKey: string]: {
        employee: Employee;
        annualDose: number;
        maxPeriodDose: number;
        periodsRecorded: string[];
        employeeIds: string[]; // Track all employee IDs belonging to this physical person
      };
    } = {};

    // 1. Group unique employees by normalized name
    deptEmployees.forEach((emp) => {
      const key = normalizeName(emp.name);
      if (!stats[key]) {
        stats[key] = {
          employee: emp, // Representative employee
          annualDose: 0,
          maxPeriodDose: 0,
          periodsRecorded: [],
          employeeIds: [],
        };
      } else {
        // If we find an active employee, prefer them as the representative
        if (emp.status === "active" && stats[key].employee.status !== "active") {
          stats[key].employee = emp;
        }
      }
      stats[key].employeeIds.push(emp.id);
    });

    // 2. Populate doses by checking record's employeeId matches any of the grouped IDs
    deptRecords.forEach((rec) => {
      // Find which grouped stats this record belongs to
      const matchedStat = Object.values(stats).find(s => s.employeeIds.includes(rec.employeeId));
      if (matchedStat) {
        if (rec.year === currentYear) {
          matchedStat.annualDose += rec.deepDose;
        }
        if (rec.deepDose > matchedStat.maxPeriodDose) {
          matchedStat.maxPeriodDose = rec.deepDose;
        }
        matchedStat.periodsRecorded.push(rec.period);
      }
    });

    return Object.values(stats);
  }, [deptEmployees, deptRecords, currentYear]);

  // Alerts logic
  const alerts = useMemo(() => {
    const list: Array<{
      employee: Employee;
      type: "annual_over" | "period_over" | "approaching_limit";
      value: number;
      limit: number;
      period?: string;
    }> = [];

    employeeDoseStats.forEach(({ employee, annualDose, maxPeriodDose, employeeIds }) => {
      // Annual limit check
      if (annualDose >= department.annualLimit) {
        list.push({
          employee,
          type: "annual_over",
          value: annualDose,
          limit: department.annualLimit,
        });
      } else if (annualDose >= department.annualLimit * 0.75) {
        // Approaching 75% of limit
        list.push({
          employee,
          type: "approaching_limit",
          value: annualDose,
          limit: department.annualLimit,
        });
      }

      // Check each specific record for periodic limit warning
      const empRecords = deptRecords.filter((r) => employeeIds.includes(r.employeeId));
      empRecords.forEach((r) => {
        if (r.deepDose >= department.alertLimit) {
          list.push({
            employee,
            type: "period_over",
            value: r.deepDose,
            limit: department.alertLimit,
            period: r.period,
          });
        }
      });
    });

    // Remove duplicates of same employee for visual list if needed, or sort
    return list.sort((a, b) => b.value - a.value);
  }, [employeeDoseStats, department, deptRecords]);

  // Pie chart of safe vs watch vs danger statuses
  const statusDistribution = useMemo(() => {
    let safe = 0;
    let watch = 0;
    let danger = 0;

    employeeDoseStats.forEach(({ annualDose, maxPeriodDose }) => {
      if (annualDose >= department.annualLimit || maxPeriodDose >= department.periodLimit) {
        danger++;
      } else if (annualDose >= department.annualLimit * 0.5 || maxPeriodDose >= department.alertLimit) {
        watch++;
      } else {
        safe++;
      }
    });

    return [
      { name: "ระดับปลอดภัย (< 50% Limit)", value: safe, color: "#10B981" },
      { name: "ระดับเฝ้าระวัง (50%-100% Limit)", value: watch, color: "#F59E0B" },
      { name: "ระดับอันตราย (> เกณฑ์มาตรฐาน)", value: danger, color: "#EF4444" },
    ];
  }, [employeeDoseStats, department]);

  // Average dose of active employees in current year
  const avgDose = useMemo(() => {
    const activeStats = employeeDoseStats.filter(s => s.employee.status === "active");
    if (activeStats.length === 0) return 0;
    const total = activeStats.reduce((sum, s) => sum + s.annualDose, 0);
    return Number((total / activeStats.length).toFixed(3));
  }, [employeeDoseStats]);

  // Chart data: Individual Annual Cumulative Dose (Hp(10)) vs standard line
  const individualChartData = useMemo(() => {
    return employeeDoseStats
      .filter((s) => s.employee.status === "active")
      .map((s) => ({
        name: s.employee.name,
        shortName: s.employee.name.split(" ")[0] + " " + (s.employee.name.split(" ")[1]?.charAt(0) || "") + ".",
        dose: Number(s.annualDose.toFixed(3)),
        id: s.employee.id,
      }))
      .sort((a, b) => b.dose - a.dose);
  }, [employeeDoseStats]);

  // Chart data: Radiation trend over periods (e.g. Q1, Q2)
  const timelineChartData = useMemo(() => {
    // Map employeeId to its normalized name key to group records of the same person
    const employeeToNameKey: { [empId: string]: string } = {};
    deptEmployees.forEach((emp) => {
      employeeToNameKey[emp.id] = normalizeName(emp.name);
    });

    const periodTotals: { [period: string]: { [nameKey: string]: number } } = {};
    
    deptRecords.forEach((rec) => {
      const nameKey = employeeToNameKey[rec.employeeId];
      if (!nameKey) return; // Skip if employee is not in deptEmployees
      
      if (!periodTotals[rec.period]) {
        periodTotals[rec.period] = {};
      }
      if (!periodTotals[rec.period][nameKey]) {
        periodTotals[rec.period][nameKey] = 0;
      }
      periodTotals[rec.period][nameKey] += rec.deepDose;
    });

    const periodStats: { [period: string]: { total: number; count: number } } = {};
    Object.entries(periodTotals).forEach(([period, nameMap]) => {
      let total = 0;
      let count = 0;
      Object.values(nameMap).forEach((dose) => {
        total += dose;
        count += 1;
      });
      periodStats[period] = { total, count };
    });

    // Sort periods (Thai quarters normally sorted e.g. ไตรมาส 1/2568, ไตรมาส 2/2568)
    const sortedPeriods = Object.keys(periodStats).sort((a, b) => {
      // Basic sorting heuristic for quarters/dates
      return a.localeCompare(b, "th");
    });

    return sortedPeriods.map((period) => ({
      period,
      totalDose: Number(periodStats[period].total.toFixed(3)),
      avgDose: Number((periodStats[period].total / periodStats[period].count).toFixed(3)),
    }));
  }, [deptEmployees, deptRecords]);

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-radial from-slate-900 to-slate-950 text-white rounded-xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {department.logoUrl && (
              <div className="w-16 h-16 bg-white rounded-xl p-1 shrink-0 flex items-center justify-center border border-slate-700 shadow-sm">
                <img
                  src={department.logoUrl}
                  alt="Hospital Logo"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div>
              <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2.5 py-1 rounded-full border border-blue-500/30 font-semibold uppercase tracking-wider">
                ข้อมูลปัจจุบัน: {department.name}
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-1.5 text-slate-100">
                {department.hospitalName}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                ระบบวิเคราะห์รังสีบุคคล (Personal Dosemeter Monitoring) ประจำปี พ.ศ. {currentYear}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onNavigateToTab("import")}
              className="bg-blue-600 hover:bg-blue-500 transition-colors text-white text-xs px-3.5 py-2 rounded-md font-bold shadow-md shadow-blue-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Activity className="size-4" />
              นำเข้าข้อมูล PDF / คีย์ข้อมูล
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Personnel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="size-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center border border-slate-200 shrink-0">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">บุคลากรทางรังสี</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-none mt-1">{uniquePersonnelCount} คน</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Active ในระบบทั้งหมด</p>
          </div>
        </div>

        {/* Alerts count */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className={`size-10 rounded-lg flex items-center justify-center border shrink-0 ${
            alerts.length > 0 
              ? "bg-red-50 text-red-600 border-red-200" 
              : "bg-emerald-50 text-emerald-600 border-emerald-200"
          }`}>
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">แจ้งเตือนปริมาณรังสี</p>
            <h3 className={`text-lg font-extrabold leading-none mt-1 ${alerts.length > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {alerts.length} รายการ
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {alerts.length > 0 ? "ตรวจพบผู้มีระดับรังสีสูง" : "บุคลากรทุกคนอยู่ในเกณฑ์ปลอดภัย"}
            </p>
          </div>
        </div>

        {/* Average Annual Dose */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="size-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-200 shrink-0">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รังสีสะสมเฉลี่ยปี {currentYear}</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-none mt-1">{avgDose} <span className="text-xs font-normal text-slate-500">mSv</span></h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">เกณฑ์มาตรฐานคือ 20 mSv/ปี</p>
          </div>
        </div>

        {/* Safety Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="size-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200 shrink-0">
            <Award className="size-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เกณฑ์สูงสุดเฝ้าระวัง</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-none mt-1">{department.alertLimit} <span className="text-xs font-normal text-slate-500">mSv</span></h3>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">ต่อรอบวัด / เดือน-ไตรมาส</p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Graphs & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Chart: Annual Cumulative Dose */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ปริมาณรังสีสะสมรายบุคคล (Hp(10)) ปี พ.ศ. {currentYear}</h3>
              <p className="text-[11px] text-slate-500">เปรียบเทียบปริมาณรังสีจริงกับเกณฑ์จำกัดสูงสุดประจำปี ({department.annualLimit} mSv/ปี)</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><span className="size-2 bg-blue-600 rounded-full inline-block"></span> ปริมาณรังสี (mSv)</span>
              <span className="flex items-center gap-1.5"><span className="size-0.5 w-3 bg-red-500 border-t border-dashed border-red-500 inline-block"></span> เกณฑ์สูงสุด ({department.annualLimit} mSv)</span>
            </div>
          </div>
          
          {individualChartData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={individualChartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="shortName" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: 8, border: "none" }}
                    labelFormatter={(label, items) => {
                      if (items && items[0]) {
                        return (items[0].payload as any).name;
                      }
                      return label;
                    }}
                  />
                  <Bar 
                    dataKey="dose" 
                    fill="#2563EB" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={32}
                  >
                    {individualChartData.map((entry, index) => {
                      // Color bar differently if it exceeds or approaches limits
                      let color = "#2563EB"; // primary blue-600
                      if (entry.dose >= department.annualLimit) {
                        color = "#EF4444"; // danger red
                      } else if (entry.dose >= department.annualLimit * 0.75) {
                        color = "#F59E0B"; // warning orange
                      } else if (entry.dose >= department.annualLimit * 0.25) {
                        color = "#3B82F6"; // moderate blue
                      }
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                  <ReferenceLine 
                    y={department.annualLimit} 
                    stroke="#EF4444" 
                    strokeDasharray="4 4" 
                    label={{ value: "Limit", fill: "#EF4444", fontSize: 9, position: "top", fontWeight: "bold" }} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <Activity className="size-10 mb-2 text-slate-300 animate-pulse" />
              <p className="text-xs">ไม่มีข้อมูลปริมาณรังสีสะสมของปีปัจจุบัน</p>
              <button
                onClick={() => onNavigateToTab("import")}
                className="mt-3 text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md transition-colors font-bold cursor-pointer border border-blue-100"
              >
                เพิ่มข้อมูลแรก
              </button>
            </div>
          )}
        </div>

        {/* Risk / Category distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">สัดส่วนระดับความเสี่ยง</h3>
            <p className="text-[11px] text-slate-500 mb-2">จำแนกตามการสะสมรังสีรายรอบและรายปี</p>
          </div>
          
          {individualChartData.length > 0 ? (
            <div className="relative flex flex-col items-center justify-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 6, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5 w-full text-[11px]">
                {statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-1.5 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-800">{item.value} คน</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400">
              <p className="text-xs">ไม่มีข้อมูลการกระจายความเสี่ยง</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alerts & Warnings Panel */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="size-4 text-amber-500" />
              การแจ้งเตือนค่าเกินเกณฑ์
            </h3>
            <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-extrabold">
              {alerts.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  onClick={() => onSelectEmployee(alert.employee.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 group hover:border-slate-300 ${
                    alert.type === "annual_over"
                      ? "bg-red-50/50 border-red-200 text-red-950"
                      : alert.type === "period_over"
                      ? "bg-amber-50/50 border-amber-200 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {alert.employee.name}
                        <ChevronRight className="size-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <p className="text-[10px] text-slate-500">{alert.employee.position} ({alert.employee.employeeIdCode})</p>
                    </div>
                    {alert.type === "annual_over" ? (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        อันตรายสะสมปี
                      </span>
                    ) : alert.type === "period_over" ? (
                      <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        รอบวัดเกินเกณฑ์
                      </span>
                    ) : (
                      <span className="bg-slate-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        ใกล้ชนเกณฑ์ปี
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] border-t border-slate-200/50 pt-1.5 mt-0.5">
                    <span className="text-slate-500">
                      {alert.type === "period_over" ? `รอบ ${alert.period}` : `ปริมาณสะสมปี พ.ศ. ${currentYear}`}
                    </span>
                    <span className="font-extrabold flex items-center gap-1">
                      <span className="text-xs">
                        {alert.value.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">/ {alert.limit} mSv</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center">
                <Heart className="size-8 text-emerald-400 mb-1.5 fill-emerald-100" />
                <p className="text-xs font-bold text-slate-700">รังสีทุกคนอยู่ในเกณฑ์ปลอดภัยสูงสุด</p>
                <p className="text-[10px] text-slate-400 mt-0.5">ไม่มีรายงานปริมาณรังสีสะสมเกินเกณฑ์</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Chart of Department Dose */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="size-4 text-blue-500" />
                แนวโน้มปริมาณรังสีสะสมของแผนก (Timeline Dose Trends)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">ผลรวมและค่าเฉลี่ยความปลอดภัยรังสีของบุคลากรรายรอบวัด</p>
            </div>
          </div>

          {timelineChartData.length > 0 ? (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: "#64748B", fontSize: 10, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: 8, border: "none" }}
                  />
                  <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 600 }} />
                  <Line 
                    name="ปริมาณรวมทั้งแผนก (mSv)" 
                    type="monotone" 
                    dataKey="totalDose" 
                    stroke="#2563EB" 
                    strokeWidth={2.5}
                    activeDot={{ r: 5 }} 
                  />
                  <Line 
                    name="ปริมาณรังสีเฉลี่ยต่อคน (mSv)" 
                    type="monotone" 
                    dataKey="avgDose" 
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
              <TrendingUp className="size-10 mb-2 text-slate-300 animate-pulse" />
              <p className="text-xs">ไม่มีข้อมูลประวัติประเมินตามรอบเวลา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
