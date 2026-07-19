/**
 * R183 Batch H — Canonical Executive Board Members (R171–R180)
 *
 * FIRST canonical implementation. No prior owner existed (see Reality
 * Audit, Batch H). This module defines the ten Executive members and
 * their pure runtime analysers. Analysers are deterministic, side-
 * effect-free, and depend only on the caller-supplied proposal payload
 * so that the Brain (`withBrain`) can wrap them without extra I/O.
 *
 * NO new runtime. NO new AI layer. NO new tables. NO new services.
 * The Board is consumed exclusively by `board.functions.ts`, which
 * routes through `withBrain` → R158 approvals → `writeCanonicalAudit`
 * → Mission Control (existing owners).
 */

export type MemberId =
  | "R171_CTO"
  | "R172_COO"
  | "R173_CFO"
  | "R174_CPO"
  | "R175_CGO"
  | "R176_RESEARCH"
  | "R177_RELEASE"
  | "R178_INNOVATION"
  | "R179_STRATEGY"
  | "R180_CREATIVE";

export type MemberRole =
  | "AI CTO"
  | "AI COO"
  | "AI CFO"
  | "AI CPO"
  | "AI CGO"
  | "AI Research Director"
  | "AI Release Director"
  | "AI Innovation Director"
  | "AI Strategy Director"
  | "AI Creative Director";

export type Recommendation = "go" | "hold" | "no_go";

export interface BoardProposal {
  /** Short human title of the initiative under review. */
  title: string;
  /** Free-form summary or brief. */
  summary?: string;
  /**
   * Coarse category the initiative belongs to. Members use this to
   * decide focus. Values are open strings, but common ones are
   * "release", "publishing", "revenue", "product", "growth",
   * "research", "creative", "operations".
   */
  kind?: string;
  /** Optional monetary impact in minor units (paise). */
  financial_cents?: number;
  /** Optional currency (ISO 4217). Defaults to INR when omitted. */
  currency?: string;
  /** Free-form tags that members may key on. */
  tags?: string[];
  /**
   * Optional readiness signals the caller has already collected. Every
   * signal is normalised to 0..1 confidence. Absent = unknown.
   */
  signals?: {
    tests_passing?: boolean;
    security_reviewed?: boolean;
    docs_updated?: boolean;
    rollback_plan?: boolean;
    budget_approved?: boolean;
    brand_reviewed?: boolean;
    users_notified?: boolean;
  };
}

export interface MemberAnalysis {
  member_id: MemberId;
  role: MemberRole;
  focus: string;
  recommendation: Recommendation;
  /** 0..1 — higher = more confident in the recommendation. */
  confidence: number;
  risks: string[];
  notes: string[];
}

type Analyser = (proposal: BoardProposal) => MemberAnalysis;

const hasTag = (p: BoardProposal, t: string) =>
  Array.isArray(p.tags) && p.tags.map((x) => x.toLowerCase()).includes(t);

const kindMatches = (p: BoardProposal, ...vals: string[]) =>
  typeof p.kind === "string" &&
  vals.map((v) => v.toLowerCase()).includes(p.kind.toLowerCase());

function decide(
  risksHigh: number,
  risksMed: number,
  positive: number,
): { rec: Recommendation; conf: number } {
  const score = positive - risksHigh * 2 - risksMed;
  if (risksHigh >= 2 || score <= -2) return { rec: "no_go", conf: 0.8 };
  if (risksHigh >= 1 || score <= 0) return { rec: "hold", conf: 0.65 };
  return { rec: "go", conf: Math.min(0.95, 0.6 + positive * 0.1) };
}

const cto: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (p.signals?.tests_passing === false) {
    risks.push("tests_not_passing");
    high++;
  } else if (p.signals?.tests_passing) {
    pos++;
    notes.push("tests_passing");
  }
  if (p.signals?.security_reviewed === false) {
    risks.push("security_review_missing");
    high++;
  } else if (p.signals?.security_reviewed) {
    pos++;
  }
  if (p.signals?.rollback_plan === false) {
    risks.push("no_rollback_plan");
    med++;
  }
  if (kindMatches(p, "release", "publishing")) {
    notes.push("architecture_touched");
    if (!p.signals?.rollback_plan) {
      risks.push("release_without_rollback");
      med++;
    }
  }
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R171_CTO",
    role: "AI CTO",
    focus: "Architecture · Performance · Security · Scalability",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const coo: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (p.signals?.docs_updated === false) {
    risks.push("runbook_not_updated");
    med++;
  } else if (p.signals?.docs_updated) {
    pos++;
  }
  if (p.signals?.rollback_plan) {
    pos++;
    notes.push("rollback_ready");
  } else {
    risks.push("operational_rollback_absent");
    med++;
  }
  if (kindMatches(p, "operations", "release")) pos++;
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R172_COO",
    role: "AI COO",
    focus: "Operations · Workflow · Execution",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const cfo: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  const amt = p.financial_cents ?? 0;
  const ccy = p.currency ?? "INR";
  if (amt > 0) notes.push(`financial_impact:${(amt / 100).toFixed(0)} ${ccy}`);
  if (amt >= 1_000_000_00) {
    risks.push("large_budget_exposure");
    high++;
  } else if (amt >= 100_000_00) {
    risks.push("material_budget_exposure");
    med++;
  }
  if (p.signals?.budget_approved === false) {
    risks.push("budget_not_approved");
    high++;
  } else if (p.signals?.budget_approved) {
    pos++;
  }
  if (kindMatches(p, "revenue")) pos++;
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R173_CFO",
    role: "AI CFO",
    focus: "Financial Impact · Revenue · Cost · Budget",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const cpo: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (p.signals?.users_notified === false) {
    risks.push("users_not_notified");
    med++;
  } else if (p.signals?.users_notified) pos++;
  if (p.signals?.docs_updated) pos++;
  if (kindMatches(p, "product", "release", "publishing")) pos++;
  if (hasTag(p, "breaking")) {
    risks.push("breaking_change_user_impact");
    high++;
  }
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R174_CPO",
    role: "AI CPO",
    focus: "Product Impact · UX · Roadmap",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const cgo: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (kindMatches(p, "growth", "publishing", "revenue")) pos++;
  if (!p.signals?.users_notified && kindMatches(p, "publishing", "release")) {
    risks.push("no_launch_comms_plan");
    med++;
  }
  if (hasTag(p, "internal_only")) notes.push("no_growth_surface");
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R175_CGO",
    role: "AI CGO",
    focus: "Growth · Marketing · Acquisition",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const research: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (hasTag(p, "unproven_tech")) {
    risks.push("technology_unvetted");
    high++;
  }
  if (hasTag(p, "external_dependency")) {
    risks.push("external_dependency");
    med++;
  }
  if (p.signals?.tests_passing) pos++;
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R176_RESEARCH",
    role: "AI Research Director",
    focus: "Technology Evaluation",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const release: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (kindMatches(p, "release", "publishing")) {
    if (!p.signals?.rollback_plan) {
      risks.push("no_rollback_plan");
      high++;
    } else pos++;
    if (!p.signals?.tests_passing) {
      risks.push("release_without_green_tests");
      high++;
    } else pos++;
    if (!p.signals?.docs_updated) {
      risks.push("release_notes_missing");
      med++;
    } else pos++;
  } else {
    notes.push("not_release_workload");
    pos++;
  }
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R177_RELEASE",
    role: "AI Release Director",
    focus: "Release Readiness",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const innovation: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (hasTag(p, "duplicate_runtime")) {
    risks.push("duplication_violates_lock");
    high++;
  }
  if (hasTag(p, "v2")) {
    risks.push("v2_requires_founder_override");
    high++;
  }
  if (hasTag(p, "extends_canonical")) {
    pos++;
    notes.push("extends_canonical_owner");
  }
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R178_INNOVATION",
    role: "AI Innovation Director",
    focus: "Innovation Risk",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const strategy: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (hasTag(p, "off_vision")) {
    risks.push("out_of_scope_vs_core_vision_lock");
    high++;
  }
  if (hasTag(p, "aligned")) pos++;
  if (kindMatches(p, "revenue", "growth", "publishing")) pos++;
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R179_STRATEGY",
    role: "AI Strategy Director",
    focus: "Business Alignment",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

const creative: Analyser = (p) => {
  const risks: string[] = [];
  const notes: string[] = [];
  let high = 0;
  let med = 0;
  let pos = 0;
  if (kindMatches(p, "creative", "publishing", "product")) {
    if (p.signals?.brand_reviewed === false) {
      risks.push("brand_review_missing");
      med++;
    } else if (p.signals?.brand_reviewed) pos++;
  }
  if (hasTag(p, "off_brand")) {
    risks.push("off_brand_content");
    high++;
  }
  const { rec, conf } = decide(high, med, pos);
  return {
    member_id: "R180_CREATIVE",
    role: "AI Creative Director",
    focus: "Brand · Content · Assets",
    recommendation: rec,
    confidence: conf,
    risks,
    notes,
  };
};

export const EXECUTIVE_MEMBERS: ReadonlyArray<{
  id: MemberId;
  role: MemberRole;
  analyse: Analyser;
}> = [
  { id: "R171_CTO", role: "AI CTO", analyse: cto },
  { id: "R172_COO", role: "AI COO", analyse: coo },
  { id: "R173_CFO", role: "AI CFO", analyse: cfo },
  { id: "R174_CPO", role: "AI CPO", analyse: cpo },
  { id: "R175_CGO", role: "AI CGO", analyse: cgo },
  { id: "R176_RESEARCH", role: "AI Research Director", analyse: research },
  { id: "R177_RELEASE", role: "AI Release Director", analyse: release },
  { id: "R178_INNOVATION", role: "AI Innovation Director", analyse: innovation },
  { id: "R179_STRATEGY", role: "AI Strategy Director", analyse: strategy },
  { id: "R180_CREATIVE", role: "AI Creative Director", analyse: creative },
];

export interface BoardReview {
  members: MemberAnalysis[];
  unified: {
    recommendation: Recommendation;
    confidence: number;
    rationale: string;
  };
  conflicts: Array<{
    member_id: MemberId;
    role: MemberRole;
    recommendation: Recommendation;
    reason: string;
  }>;
  top_risks: Array<{ risk: string; count: number; from: MemberId[] }>;
}

/**
 * Aggregate ten member analyses into a unified board decision.
 * Deterministic — no I/O, no randomness. Called from `board.functions.ts`
 * inside `withBrain`.
 */
export function aggregateBoard(members: MemberAnalysis[]): BoardReview {
  const tally: Record<Recommendation, number> = { go: 0, hold: 0, no_go: 0 };
  for (const m of members) tally[m.recommendation]++;

  let unified: Recommendation = "go";
  if (tally.no_go >= 2) unified = "no_go";
  else if (tally.no_go >= 1 || tally.hold >= 3) unified = "hold";

  const dissent = members.filter((m) => m.recommendation !== unified);
  const conflicts = dissent.map((m) => ({
    member_id: m.member_id,
    role: m.role,
    recommendation: m.recommendation,
    reason:
      m.risks[0] ?? m.notes[0] ?? `${m.role} recommends ${m.recommendation}`,
  }));

  const conf =
    members.reduce((s, m) => s + m.confidence, 0) /
    Math.max(1, members.length);

  const rationale =
    unified === "go"
      ? `Consensus ${tally.go}/${members.length}. No blocking risks.`
      : unified === "hold"
        ? `Mixed signals: ${tally.no_go} no_go · ${tally.hold} hold · ${tally.go} go.`
        : `Blocking risks flagged by ${tally.no_go} member(s).`;

  const riskMap = new Map<string, { count: number; from: MemberId[] }>();
  for (const m of members) {
    for (const r of m.risks) {
      const cur = riskMap.get(r) ?? { count: 0, from: [] };
      cur.count++;
      cur.from.push(m.member_id);
      riskMap.set(r, cur);
    }
  }
  const top_risks = Array.from(riskMap.entries())
    .map(([risk, v]) => ({ risk, count: v.count, from: v.from }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    members,
    unified: { recommendation: unified, confidence: conf, rationale },
    conflicts,
    top_risks,
  };
}
