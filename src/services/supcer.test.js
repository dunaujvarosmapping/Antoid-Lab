import { describe, expect, it } from "vitest";
import { createInitialState, migrateState } from "../state/OSContext.jsx";
import {
  createSUPCerState,
  monitorState,
  routerAccess,
  routerClients,
  supcerFacts,
} from "./supcer.js";

describe("Antoid SUPCer physical simulation", () => {
  it("derives POST and boot capability from installed physical hardware", () => {
    const pc = createSUPCerState();
    expect(supcerFacts(pc)).toMatchObject({
      memoryGb: 16,
      canPost: true,
      canBoot: true,
    });
    pc.hardware.ramSlots = [null, null, null, null];
    expect(supcerFacts(pc)).toMatchObject({
      memoryGb: 0,
      canPost: false,
      canBoot: false,
    });
    expect(supcerFacts(pc).postErrors).toContain("MEMORY NOT DETECTED");
  });

  it("distinguishes monitor power from the physical display route", () => {
    const pc = createSUPCerState();
    pc.power = "running";
    expect(monitorState(pc)).toBe("active");
    pc.cables.display = false;
    expect(monitorState(pc)).toBe("no-signal");
    pc.monitor.power = false;
    expect(monitorState(pc)).toBe("off");
  });

  it("uses the shared ANRouter for clients, local administration and WAN access", () => {
    const state = createInitialState();
    state.lab.supcer.cables.ethernet = true;
    expect(routerClients(state).some((client) => client.id === "supcer")).toBe(
      true,
    );
    expect(routerAccess(state, state.lab.router.ip)).toEqual({
      kind: "router",
    });
    expect(routerAccess(state, "example.test").kind).toBe("page");
    state.lab.router.wan = false;
    expect(routerAccess(state, "example.test")).toMatchObject({
      kind: "error",
    });
  });

  it("migrates old Lab data while preserving it and supplying every v5 branch", () => {
    const state = migrateState({
      schema: 8,
      lab: { activeDevice: "utv", router: { ssid: "Saved Network" } },
    });
    expect(state.lab.router.ssid).toBe("Saved Network");
    expect(state.lab.router.conditions.bandwidth).toBeTypeOf("number");
    expect(state.lab.supcer.network.remembered).toEqual({});
    expect(state.lab.supcer.installedApps).toContain("pairs");
    expect(state.lab.supcer.fileAssociations[".ant"]).toBe("installer");
    expect(state.lab.supcer.installedPackages).toEqual({});
    expect(state.lab.utv).toBeDefined();
  });

  it("makes SATA and graphics power connections authoritative", () => {
    const pc = createSUPCerState();
    pc.cables.sataData = false;
    expect(supcerFacts(pc).storageOnline).toBe(false);
    expect(supcerFacts(pc).canBoot).toBe(false);
    pc.cables.sataData = true;
    pc.hardware.gpu = "gpu1250";
    pc.cables.displayPort = "gpu";
    expect(supcerFacts(pc).graphicsOutput).toBeNull();
    pc.cables.gpuPower = true;
    expect(supcerFacts(pc).graphicsOutput?.id).toBe("gpu1250");
  });
});
