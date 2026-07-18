import { describe, it, expect } from "vitest";
import {
  normalizeLifecycle, lifecycleProgress, LIFECYCLE_STAGES,
  summarizeAttendance,
  leaveDays, evaluateLeave,
  computePayslip, prorateSalary,
  goalScore, performanceBand, three60Aggregate,
  skillGap, recommendCourses,
  attritionRisk, promotionCandidate, summarizeEmployee, shiftOptimization,
  buildOrgTree, reportingChain,
  resolveForBrain, pickDhHrMode, hrCan, hrSnapshot,
} from "@/lib/happy-r124/hrms-intelligence";

describe("R124 HRMS Intelligence", () => {
  it("normalizes lifecycle stages", () => {
    expect(normalizeLifecycle("Ex-Employee")).toBe("alumni");
    expect(normalizeLifecycle("Onboarding")).toBe("onboarding");
    expect(normalizeLifecycle("resigned")).toBe("exit");
    expect(normalizeLifecycle(null)).toBe("candidate");
    expect(LIFECYCLE_STAGES).toHaveLength(10);
    expect(lifecycleProgress("active")).toBeGreaterThan(lifecycleProgress("hiring"));
    expect(lifecycleProgress("exit")).toBe(0);
  });

  it("summarizes attendance", () => {
    const day = summarizeAttendance([
      { employee_id: "e1", at: "2025-06-01T09:00:00Z", kind: "in" },
      { employee_id: "e1", at: "2025-06-01T13:00:00Z", kind: "break_start" },
      { employee_id: "e1", at: "2025-06-01T13:30:00Z", kind: "break_end" },
      { employee_id: "e1", at: "2025-06-01T18:00:00Z", kind: "out" },
    ]);
    expect(day.status).toBe("present");
    expect(day.worked_minutes).toBe(510);
    expect(day.overtime_minutes).toBe(30);
    expect(summarizeAttendance([], { holiday: true }).status).toBe("holiday");
    expect(summarizeAttendance([]).status).toBe("absent");
  });

  it("evaluates leave", () => {
    expect(leaveDays({ type: "annual", from: "2025-06-01", to: "2025-06-03" })).toBe(3);
    expect(leaveDays({ type: "annual", from: "2025-06-01", to: "2025-06-01", half_day: true })).toBe(0.5);
    const d = evaluateLeave({ type: "annual", from: "2025-06-01", to: "2025-06-05" }, { annual: 10 });
    expect(d.allowed).toBe(true);
    expect(evaluateLeave({ type: "annual", from: "2025-06-01", to: "2025-06-05" }, { annual: 2 }).allowed).toBe(false);
    expect(evaluateLeave({ type: "wfh", from: "2025-06-01", to: "2025-06-01" }, {}, { auto_approve_wfh: true }).needs_approval).toBe(false);
  });

  it("computes payslips", () => {
    const p = computePayslip({ base_cents: 500_000, allowances_cents: 100_000, bonus_cents: 50_000, tax_rate: 0.1, deductions_cents: 20_000 });
    expect(p.gross_cents).toBe(650_000);
    expect(p.tax_cents).toBe(63_000);
    expect(p.net_cents).toBeGreaterThan(0);
    expect(prorateSalary(300_000, 15, 30)).toBe(150_000);
  });

  it("scores performance", () => {
    const s = goalScore([{ id: "1", weight: 2, progress: 1 }, { id: "2", weight: 1, progress: 0.5 }]);
    expect(s).toBeCloseTo(0.83, 1);
    expect(performanceBand(0.95)).toBe("exceeds");
    expect(performanceBand(0.3)).toBe("below");
    const agg = three60Aggregate({ self: 0.8, manager: 0.9, peers: [0.7, 0.8], reports: [0.85] });
    expect(agg).toBeGreaterThan(0.7);
  });

  it("finds skill gaps and recommends courses", () => {
    const rows = [{ skill: "sql", required: 4 as const, current: 2 as const }, { skill: "ts", required: 3 as const, current: 3 as const }];
    const gaps = skillGap(rows);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].skill).toBe("sql");
    const rec = recommendCourses(rows, [{ id: "c1", skill: "sql", level: 3 }, { id: "c2", skill: "ts", level: 4 }]);
    expect(rec).toContain("c1");
    expect(rec).not.toContain("c2");
  });

  it("estimates attrition & promotion", () => {
    expect(attritionRisk({ tenureMonths: 24 })).toBeLessThan(0.5);
    const high = attritionRisk({ tenureMonths: 3, lastPerfScore: 0.3, engagementScore: 0.3, overtimeMinutesLast30d: 2000, managerChangesLast12m: 3 });
    expect(high).toBeGreaterThan(0.7);
    expect(promotionCandidate(0.9, 24, 0.7)).toBe(true);
    expect(promotionCandidate(0.5, 24, 0.7)).toBe(false);
    expect(summarizeEmployee({ name: "A", role: "Eng", stage: "active", perf: 0.8 })).toMatch(/perf 80/);
    const opt = shiftOptimization([3, 5, 2], [2, 2, 2]);
    expect(opt[1].delta).toBe(3);
  });

  it("builds org tree and reporting chain", () => {
    const nodes = [
      { id: "ceo", name: "CEO" },
      { id: "cto", name: "CTO", manager_id: "ceo" },
      { id: "eng", name: "Eng", manager_id: "cto" },
    ];
    const tree = buildOrgTree(nodes);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    const chain = reportingChain(nodes, "eng");
    expect(chain.map((n) => n.id)).toEqual(["eng", "cto", "ceo"]);
  });

  it("routes Brain to HRMS domains", () => {
    expect(resolveForBrain("what's the weather").wantsHrms).toBe(false);
    expect(resolveForBrain("run payroll for June").domain).toBe("payroll");
    expect(resolveForBrain("apply sick leave").domain).toBe("leave");
    expect(resolveForBrain("hire a backend engineer").domain).toBe("hiring");
    expect(resolveForBrain("show org chart").domain).toBe("org");
  });

  it("picks DH HR mode", () => {
    expect(pickDhHrMode({ interviewing: true })).toBe("interview");
    expect(pickDhHrMode({ training: true })).toBe("training");
    expect(pickDhHrMode({ role: "founder" })).toBe("founder");
    expect(pickDhHrMode({})).toBe("hr");
  });

  it("enforces HR role x capability", () => {
    expect(hrCan("employee", "view_self")).toBe(true);
    expect(hrCan("employee", "run_payroll")).toBe(false);
    expect(hrCan("manager", "approve_leave")).toBe(true);
    expect(hrCan("hr_admin", "run_payroll")).toBe(true);
    expect(hrCan("admin", "delete")).toBe(true);
  });

  it("computes HR snapshot", () => {
    const snap = hrSnapshot({
      employees: [
        { status: "active", perf: 0.8, attrition: 0.2 },
        { status: "active", perf: 0.6, attrition: 0.7 },
        { status: "leave" },
      ],
      attendanceDays: [
        { employee_id: "e1", date: "d", worked_minutes: 480, break_minutes: 0, overtime_minutes: 0, status: "present" },
        { employee_id: "e1", date: "d", worked_minutes: 0, break_minutes: 0, overtime_minutes: 0, status: "absent" },
      ],
      openRoles: 4,
    });
    expect(snap.headcount).toBe(3);
    expect(snap.active).toBe(2);
    expect(snap.on_leave).toBe(1);
    expect(snap.attrition_risk_high).toBe(1);
    expect(snap.attendance_rate).toBe(0.5);
    expect(snap.open_roles).toBe(4);
  });
});
