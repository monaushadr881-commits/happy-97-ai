/**
 * R124 — HAPPY HRMS Intelligence™ (pure extension layer)
 *
 * Canonical owners (never duplicated, only extended):
 *   - Employees / Departments / Offices : src/lib/business-v1.functions.ts
 *   - Companies / Org hierarchy         : src/lib/enterprise-v1.functions.ts
 *   - Workspace roles & permissions     : src/lib/happy-r118/workspace-intelligence.ts
 *   - Files (contracts, payslips)       : src/lib/happy-r119/file-intelligence.ts
 *   - Search                            : src/lib/happy-r120/search-intelligence.ts
 *   - Brain routing                     : src/lib/brain/engine.ts
 *   - CRM / ERP integration             : src/lib/happy-r122, src/lib/happy-r123
 *
 * This module contains ONLY deterministic, pure helpers used by UI, Brain
 * Stage-6 resolvers, Digital Human presets, and analytics. It creates
 * NO new tables, NO new APIs, and NO parallel HRMS runtime.
 */

// ---------------------------------------------------------------------------
// PHASE 3 — Employee Lifecycle
// ---------------------------------------------------------------------------
export const LIFECYCLE_STAGES = [
  "candidate",
  "interview",
  "offer",
  "hiring",
  "onboarding",
  "active",
  "promotion",
  "transfer",
  "exit",
  "alumni",
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export function normalizeLifecycle(raw?: string | null): LifecycleStage {
  const s = (raw ?? "").toLowerCase().trim();
  if (!s) return "candidate";
  if (/(alumni|ex-?employee|former)/.test(s)) return "alumni";
  if (/(exit|resign|terminat|offboard)/.test(s)) return "exit";
  if (/(transfer|reloc)/.test(s)) return "transfer";
  if (/(promot|elevat)/.test(s)) return "promotion";
  if (/(active|employ|working|onrolls?)/.test(s)) return "active";
  if (/(onboard|induction)/.test(s)) return "onboarding";
  if (/(hir|joined|joining)/.test(s)) return "hiring";
  if (/(offer)/.test(s)) return "offer";
  if (/(interview|screen)/.test(s)) return "interview";
  return "candidate";
}

export function lifecycleProgress(stage: LifecycleStage): number {
  if (stage === "alumni" || stage === "exit") return 0;
  const active = LIFECYCLE_STAGES.slice(0, 8); // candidate..transfer
  const i = active.indexOf(stage);
  return i < 0 ? 0 : Math.round((i / (active.length - 1)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// PHASE 4 — Attendance
// ---------------------------------------------------------------------------
export type AttendancePunch = {
  employee_id: string;
  at: string; // ISO
  kind: "in" | "out" | "break_start" | "break_end";
  source?: "web" | "mobile" | "biometric" | "gps" | "manual";
  lat?: number;
  lng?: number;
};

export type AttendanceDay = {
  employee_id: string;
  date: string; // YYYY-MM-DD
  worked_minutes: number;
  break_minutes: number;
  overtime_minutes: number;
  status: "present" | "absent" | "partial" | "holiday" | "leave";
  first_in?: string;
  last_out?: string;
};

export function summarizeAttendance(
  punches: AttendancePunch[],
  opts: { standard_minutes?: number; holiday?: boolean; onLeave?: boolean } = {},
): AttendanceDay {
  const std = opts.standard_minutes ?? 480;
  const emp = punches[0]?.employee_id ?? "";
  const date = (punches[0]?.at ?? new Date().toISOString()).slice(0, 10);
  if (opts.holiday) return { employee_id: emp, date, worked_minutes: 0, break_minutes: 0, overtime_minutes: 0, status: "holiday" };
  if (opts.onLeave) return { employee_id: emp, date, worked_minutes: 0, break_minutes: 0, overtime_minutes: 0, status: "leave" };
  if (!punches.length) return { employee_id: emp, date, worked_minutes: 0, break_minutes: 0, overtime_minutes: 0, status: "absent" };
  const sorted = [...punches].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  let worked = 0, breaks = 0, lastIn: number | null = null, lastBreak: number | null = null;
  for (const p of sorted) {
    const t = Date.parse(p.at);
    if (p.kind === "in") lastIn = t;
    else if (p.kind === "out" && lastIn != null) { worked += (t - lastIn) / 60000; lastIn = null; }
    else if (p.kind === "break_start") lastBreak = t;
    else if (p.kind === "break_end" && lastBreak != null) { breaks += (t - lastBreak) / 60000; lastBreak = null; }
  }
  worked = Math.max(0, Math.round(worked - breaks));
  const overtime = Math.max(0, worked - std);
  const first_in = sorted.find((p) => p.kind === "in")?.at;
  const last_out = [...sorted].reverse().find((p) => p.kind === "out")?.at;
  const status: AttendanceDay["status"] = worked >= std ? "present" : worked > 0 ? "partial" : "absent";
  return { employee_id: emp, date, worked_minutes: worked, break_minutes: Math.round(breaks), overtime_minutes: overtime, status, first_in, last_out };
}

// ---------------------------------------------------------------------------
// PHASE 5 — Leave
// ---------------------------------------------------------------------------
export const LEAVE_TYPES = ["annual", "sick", "casual", "wfh", "comp_off", "unpaid", "maternity", "paternity"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export type LeaveRequest = { type: LeaveType; from: string; to: string; half_day?: boolean; reason?: string };
export type LeaveBalance = Partial<Record<LeaveType, number>>;

export function leaveDays(r: LeaveRequest): number {
  const a = Date.parse(r.from), b = Date.parse(r.to);
  if (isNaN(a) || isNaN(b) || b < a) return 0;
  const days = Math.floor((b - a) / 86_400_000) + 1;
  return r.half_day ? 0.5 : days;
}

export type LeaveDecision = { allowed: boolean; reason: string; needs_approval: boolean };

export function evaluateLeave(req: LeaveRequest, balance: LeaveBalance, opts: { auto_approve_wfh?: boolean } = {}): LeaveDecision {
  const days = leaveDays(req);
  if (days <= 0) return { allowed: false, reason: "Invalid date range", needs_approval: false };
  const bal = balance[req.type] ?? 0;
  if (req.type === "unpaid") return { allowed: true, reason: "Unpaid — approval required", needs_approval: true };
  if (req.type === "wfh" && opts.auto_approve_wfh) return { allowed: true, reason: "WFH auto-approved", needs_approval: false };
  if (bal < days) return { allowed: false, reason: `Insufficient ${req.type} balance (${bal} < ${days})`, needs_approval: false };
  return { allowed: true, reason: "Within balance", needs_approval: true };
}

// ---------------------------------------------------------------------------
// PHASE 6 — Payroll (deterministic, tax-ready shell)
// ---------------------------------------------------------------------------
export type SalaryStructure = {
  base_cents: number;
  allowances_cents?: number;
  bonus_cents?: number;
  reimbursements_cents?: number;
  deductions_cents?: number; // fixed pre-tax deductions
  tax_rate?: number; // 0..1
  loan_repayment_cents?: number;
};

export type Payslip = {
  gross_cents: number;
  taxable_cents: number;
  tax_cents: number;
  deductions_cents: number;
  net_cents: number;
  breakdown: Record<string, number>;
};

export function computePayslip(s: SalaryStructure): Payslip {
  const base = Math.max(0, s.base_cents);
  const allow = Math.max(0, s.allowances_cents ?? 0);
  const bonus = Math.max(0, s.bonus_cents ?? 0);
  const reimb = Math.max(0, s.reimbursements_cents ?? 0);
  const preDed = Math.max(0, s.deductions_cents ?? 0);
  const loan = Math.max(0, s.loan_repayment_cents ?? 0);
  const gross = base + allow + bonus;
  const taxable = Math.max(0, gross - preDed);
  const tax = Math.round(taxable * Math.min(1, Math.max(0, s.tax_rate ?? 0)));
  const totalDed = preDed + tax + loan;
  const net = gross - tax - loan - preDed + reimb;
  return {
    gross_cents: gross,
    taxable_cents: taxable,
    tax_cents: tax,
    deductions_cents: totalDed,
    net_cents: net,
    breakdown: { base, allow, bonus, reimb, preDed, loan, tax },
  };
}

export function prorateSalary(base_cents: number, workedDays: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.round((base_cents * Math.min(workedDays, totalDays)) / totalDays);
}

// ---------------------------------------------------------------------------
// PHASE 7 — Performance
// ---------------------------------------------------------------------------
export type Goal = { id: string; weight: number; progress: number /* 0..1 */; status?: "on_track" | "at_risk" | "off_track" | "done" };

export function goalScore(goals: Goal[]): number {
  if (!goals.length) return 0;
  const totalW = goals.reduce((s, g) => s + Math.max(0, g.weight), 0) || 1;
  const acc = goals.reduce((s, g) => s + Math.max(0, g.weight) * Math.min(1, Math.max(0, g.progress)), 0);
  return Math.round((acc / totalW) * 100) / 100;
}

export function performanceBand(score: number): "exceeds" | "meets" | "improving" | "below" {
  if (score >= 0.9) return "exceeds";
  if (score >= 0.7) return "meets";
  if (score >= 0.5) return "improving";
  return "below";
}

export function three60Aggregate(inputs: { self?: number; manager?: number; peers?: number[]; reports?: number[] }): number {
  const peers = (inputs.peers ?? []).length ? (inputs.peers ?? []).reduce((a, b) => a + b, 0) / (inputs.peers ?? []).length : undefined;
  const reports = (inputs.reports ?? []).length ? (inputs.reports ?? []).reduce((a, b) => a + b, 0) / (inputs.reports ?? []).length : undefined;
  const parts: { v: number; w: number }[] = [];
  if (inputs.self != null) parts.push({ v: inputs.self, w: 0.1 });
  if (inputs.manager != null) parts.push({ v: inputs.manager, w: 0.4 });
  if (peers != null) parts.push({ v: peers, w: 0.3 });
  if (reports != null) parts.push({ v: reports, w: 0.2 });
  const tw = parts.reduce((s, p) => s + p.w, 0) || 1;
  return Math.round((parts.reduce((s, p) => s + p.v * p.w, 0) / tw) * 100) / 100;
}

// ---------------------------------------------------------------------------
// PHASE 8 — Learning
// ---------------------------------------------------------------------------
export type SkillLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type SkillMatrixRow = { skill: string; required: SkillLevel; current: SkillLevel };

export function skillGap(rows: SkillMatrixRow[]): { skill: string; gap: number }[] {
  return rows
    .map((r) => ({ skill: r.skill, gap: Math.max(0, r.required - r.current) }))
    .filter((r) => r.gap > 0)
    .sort((a, b) => b.gap - a.gap);
}

export function recommendCourses(rows: SkillMatrixRow[], catalog: { id: string; skill: string; level: SkillLevel }[]): string[] {
  const gaps = new Map(skillGap(rows).map((g) => [g.skill, g.gap]));
  return catalog
    .filter((c) => (gaps.get(c.skill) ?? 0) > 0 && c.level >= (rows.find((r) => r.skill === c.skill)?.current ?? 0))
    .map((c) => c.id);
}

// ---------------------------------------------------------------------------
// PHASE 9 — AI HR Intelligence
// ---------------------------------------------------------------------------
export type AttritionSignals = {
  tenureMonths: number;
  lastPerfScore?: number;   // 0..1
  engagementScore?: number; // 0..1
  daysSinceLastPromotion?: number;
  overtimeMinutesLast30d?: number;
  leaveDaysLast90d?: number;
  managerChangesLast12m?: number;
};

/** Deterministic 0..1 attrition risk (higher = more likely to leave). */
export function attritionRisk(s: AttritionSignals): number {
  let r = 0.15;
  if ((s.lastPerfScore ?? 0.7) < 0.5) r += 0.25;
  if ((s.engagementScore ?? 0.7) < 0.5) r += 0.2;
  if ((s.daysSinceLastPromotion ?? 0) > 730) r += 0.15;
  if ((s.overtimeMinutesLast30d ?? 0) > 20 * 60) r += 0.15;
  if ((s.leaveDaysLast90d ?? 0) > 15) r += 0.1;
  if ((s.managerChangesLast12m ?? 0) >= 2) r += 0.1;
  if (s.tenureMonths < 6) r += 0.1;
  if (s.tenureMonths > 60 && (s.daysSinceLastPromotion ?? 0) > 900) r += 0.05;
  return Math.max(0, Math.min(1, Math.round(r * 100) / 100));
}

export function promotionCandidate(perf: number, tenureMonths: number, learningScore = 0): boolean {
  return perf >= 0.8 && tenureMonths >= 12 && learningScore >= 0.5;
}

export function summarizeEmployee(input: {
  name?: string;
  role?: string;
  stage: LifecycleStage;
  perf?: number;
  attrition?: number;
}): string {
  const bits: string[] = [];
  bits.push(`${input.name ?? "Employee"} · ${input.role ?? "—"} · ${input.stage}`);
  if (input.perf != null) bits.push(`perf ${Math.round(input.perf * 100)}%`);
  if (input.attrition != null) bits.push(`attrition ${Math.round(input.attrition * 100)}%`);
  return bits.join(" — ");
}

export function shiftOptimization(demandByHour: number[], staffByHour: number[]): { hour: number; delta: number }[] {
  const n = Math.max(demandByHour.length, staffByHour.length);
  const out: { hour: number; delta: number }[] = [];
  for (let h = 0; h < n; h++) out.push({ hour: h, delta: (demandByHour[h] ?? 0) - (staffByHour[h] ?? 0) });
  return out;
}

// ---------------------------------------------------------------------------
// PHASE 10 — Organization
// ---------------------------------------------------------------------------
export type OrgNode = { id: string; name: string; manager_id?: string | null; department_id?: string | null };

export function buildOrgTree(nodes: OrgNode[]): (OrgNode & { children: OrgNode[] })[] {
  const byId = new Map(nodes.map((n) => [n.id, { ...n, children: [] as OrgNode[] }]));
  const roots: (OrgNode & { children: OrgNode[] })[] = [];
  for (const n of byId.values()) {
    if (n.manager_id && byId.has(n.manager_id)) byId.get(n.manager_id)!.children.push(n);
    else roots.push(n);
  }
  return roots;
}

export function reportingChain(nodes: OrgNode[], employeeId: string): OrgNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const chain: OrgNode[] = [];
  let cur = byId.get(employeeId);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    chain.push(cur);
    cur = cur.manager_id ? byId.get(cur.manager_id) : undefined;
  }
  return chain;
}

// ---------------------------------------------------------------------------
// PHASE 11 — Brain Integration (Stage-6 HRMS resolver hints)
// ---------------------------------------------------------------------------
export type HrmsBrainHint = {
  wantsHrms: boolean;
  domain?: "employee" | "attendance" | "leave" | "payroll" | "performance" | "learning" | "hiring" | "org";
  confidence: number;
};

export function resolveForBrain(q: string): HrmsBrainHint {
  const s = (q ?? "").toLowerCase();
  const has = (re: RegExp) => re.test(s);
  if (has(/\b(payroll|payslip|salary|bonus|reimburs|allowance)\b/)) return { wantsHrms: true, domain: "payroll", confidence: 0.9 };
  if (has(/\b(leave|vacation|wfh|sick day|casual|comp[- ]?off)\b/)) return { wantsHrms: true, domain: "leave", confidence: 0.88 };
  if (has(/\b(attendance|clock[- ]?in|clock[- ]?out|shift|overtime|timesheet)\b/)) return { wantsHrms: true, domain: "attendance", confidence: 0.88 };
  if (has(/\b(review|kpi|goal|okr|appraisal|performance)\b/)) return { wantsHrms: true, domain: "performance", confidence: 0.82 };
  if (has(/\b(training|course|certificate|skill|learning)\b/)) return { wantsHrms: true, domain: "learning", confidence: 0.8 };
  if (has(/\b(hire|hiring|candidate|interview|offer|recruit)\b/)) return { wantsHrms: true, domain: "hiring", confidence: 0.85 };
  if (has(/\b(org chart|reporting|department|team|manager)\b/)) return { wantsHrms: true, domain: "org", confidence: 0.75 };
  if (has(/\b(employee|staff|headcount|people)\b/)) return { wantsHrms: true, domain: "employee", confidence: 0.7 };
  return { wantsHrms: false, confidence: 0 };
}

// ---------------------------------------------------------------------------
// PHASE 12 — Digital Human HR modes
// ---------------------------------------------------------------------------
export type DhHrMode = "hr" | "interview" | "training" | "presentation" | "manager" | "founder";

export function pickDhHrMode(ctx: { interviewing?: boolean; training?: boolean; presenting?: boolean; role?: "founder" | "manager" | "employee" | "hr" }): DhHrMode {
  if (ctx.interviewing) return "interview";
  if (ctx.training) return "training";
  if (ctx.presenting) return "presentation";
  if (ctx.role === "founder") return "founder";
  if (ctx.role === "manager") return "manager";
  return "hr";
}

// ---------------------------------------------------------------------------
// Permissions (extends R118 workspace roles)
// ---------------------------------------------------------------------------
export const HR_ROLES = ["viewer", "employee", "manager", "hr", "hr_admin", "admin"] as const;
export type HrRole = (typeof HR_ROLES)[number];
export const HR_CAPS = [
  "view_self", "view_team", "view_all",
  "edit_profile", "approve_leave", "run_payroll",
  "view_payroll", "manage_hiring", "manage_perf",
  "manage_learning", "manage_org", "export", "delete",
] as const;
export type HrCap = (typeof HR_CAPS)[number];

const MATRIX: Record<HrRole, HrCap[]> = {
  viewer:    ["view_self"],
  employee:  ["view_self", "edit_profile"],
  manager:   ["view_self", "edit_profile", "view_team", "approve_leave", "manage_perf"],
  hr:        ["view_self", "view_team", "view_all", "approve_leave", "manage_hiring", "manage_perf", "manage_learning", "view_payroll"],
  hr_admin:  ["view_self", "view_team", "view_all", "approve_leave", "manage_hiring", "manage_perf", "manage_learning", "view_payroll", "run_payroll", "manage_org", "export"],
  admin:     [...HR_CAPS],
};

export function hrCan(role: HrRole, cap: HrCap): boolean {
  return MATRIX[role]?.includes(cap) ?? false;
}

// ---------------------------------------------------------------------------
// PHASE 13 — Analytics snapshot
// ---------------------------------------------------------------------------
export type HrSnapshot = {
  headcount: number;
  active: number;
  on_leave: number;
  attrition_risk_high: number;
  attendance_rate: number; // 0..1
  avg_perf: number;        // 0..1
  open_roles: number;
};

export function hrSnapshot(input: {
  employees: { status?: string | null; perf?: number; attrition?: number }[];
  attendanceDays?: AttendanceDay[];
  openRoles?: number;
}): HrSnapshot {
  const e = input.employees ?? [];
  const headcount = e.length;
  const active = e.filter((x) => (x.status ?? "").toLowerCase() === "active").length;
  const on_leave = e.filter((x) => (x.status ?? "").toLowerCase() === "leave").length;
  const attrition_risk_high = e.filter((x) => (x.attrition ?? 0) >= 0.6).length;
  const attendance_rate = input.attendanceDays?.length
    ? input.attendanceDays.filter((d) => d.status === "present").length / input.attendanceDays.length
    : 0;
  const perfVals = e.map((x) => x.perf).filter((v): v is number => typeof v === "number");
  const avg_perf = perfVals.length ? perfVals.reduce((s, v) => s + v, 0) / perfVals.length : 0;
  return {
    headcount, active, on_leave, attrition_risk_high,
    attendance_rate: Math.round(attendance_rate * 100) / 100,
    avg_perf: Math.round(avg_perf * 100) / 100,
    open_roles: input.openRoles ?? 0,
  };
}
