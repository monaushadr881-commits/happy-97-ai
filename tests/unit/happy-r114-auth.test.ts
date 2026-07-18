/**
 * R114 — HAPPY ID auth extension smoke tests (module wiring only).
 * Full end-to-end coverage lands with Playwright as sessions come online.
 */
import { describe, it, expect } from "vitest";
import * as happyId from "@/lib/happy-id.functions";

describe("R114 — HAPPY ID auth extensions", () => {
  it("exports session/device/history/alert/policy server functions", () => {
    expect(typeof happyId.listMyDevices).toBe("function");
    expect(typeof happyId.registerDevice).toBe("function");
    expect(typeof happyId.trustDevice).toBe("function");
    expect(typeof happyId.revokeDevice).toBe("function");
    expect(typeof happyId.listMySessions).toBe("function");
    expect(typeof happyId.registerSession).toBe("function");
    expect(typeof happyId.remoteLogout).toBe("function");
    expect(typeof happyId.remoteLogoutAllOthers).toBe("function");
    expect(typeof happyId.listMyLoginHistory).toBe("function");
    expect(typeof happyId.recordLoginEvent).toBe("function");
    expect(typeof happyId.listMySecurityAlerts).toBe("function");
    expect(typeof happyId.acknowledgeSecurityAlert).toBe("function");
    expect(typeof happyId.getEffectiveSessionPolicy).toBe("function");
  });
});
