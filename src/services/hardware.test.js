import { describe, expect, it } from "vitest";
import { createInitialState, migrateState, reducer } from "../state/OSContext.jsx";
import { emergencyNetwork, lineQuality } from "./core.js";
import {
  COMPONENT_DEFINITIONS,
  COMPONENT_LAYOUT,
  REMOVABLE_COMPONENT_IDS,
  REPLACEMENT_PARTS,
  hardwareCapabilities,
} from "./hardware.js";

describe("Antoid OS 3 authoritative hardware", () => {
  it("ships the corrected factory storage and all exact catalog capacities", async () => {
    const { REPLACEMENT_PARTS } = await import("./hardware.js");
    const storage = REPLACEMENT_PARTS.filter((part) => part.type === "storage");
    expect(storage).toHaveLength(8);
    expect(storage.find((part) => part.name.includes("‘256 GB’"))?.specs).toMatchObject({ capacityGb: 256, actualCapacityGb: 64 });
    expect(createInitialState().hardware.components.storage).toMatchObject({ type: "UFS 2.0", capacityGb: 256, actualCapacityGb: 256 });
  });
  it("distinguishes genuinely fresh unboxing from migrated devices", () => {
    expect(createInitialState().hardware.unboxing.complete).toBe(false);
    const migrated = migrateState({
      schema: 2,
      setup: { done: true, firstName: "Existing" },
    });
    expect(migrated.setup.firstName).toBe("Existing");
    expect(migrated.hardware.unboxing.complete).toBe(true);
    expect(migrated.hardware.unboxing.chargerUnlocked).toBe(true);
  });

  it("prevents cellular and emergency service without a working antenna", () => {
    const state = createInitialState();
    Object.assign(state.sim.physical, {
      carrier: "yettel",
      installed: true,
      enabled: true,
      registered: true,
    });
    expect(lineQuality(state, "physical").bars).toBeGreaterThan(0);
    state.hardware.components.cellularAntenna.installed = false;
    state.hardware.components.cellularAntenna.connected = false;
    expect(lineQuality(state, "physical").bars).toBe(0);
    expect(emergencyNetwork(state)).toMatchObject({
      reachable: false,
      reason: "Cellular modem or antenna unavailable",
    });
  });

  it("applies replacement specs to storage, display, USB and antenna behavior", () => {
    const state = createInitialState();
    Object.assign(state.hardware.components.storage, {
      manufacturer: "Extreme Budget",
      capacityGb: 1024,
      actualCapacityGb: 32,
      counterfeit: true,
    });
    Object.assign(state.hardware.components.display, {
      technology: "IPS LCD",
      refreshHz: 60,
      hdr: false,
    });
    Object.assign(state.hardware.components.usbBoard, {
      manufacturer: "Supra",
      standard: "Supra USB4 40G",
      speedGbps: 40,
    });
    Object.assign(state.hardware.components.cellularAntenna, {
      manufacturer: "Extreme Budget",
      antennaGainDb: -16,
      condition: 50,
    });
    const caps = hardwareCapabilities(state);
    expect(caps.storageClaimedGb).toBe(1024);
    expect(caps.storageActualGb).toBe(32);
    expect(caps.displaySpecs).toMatchObject({
      technology: "IPS LCD",
      refreshHz: 60,
      hdr: false,
    });
    expect(caps.usbSpecs).toMatchObject({
      standard: "Supra USB4 40G",
      speedGbps: 40,
    });
    expect(caps.cellularPenaltyDb).toBeGreaterThan(20);
  });

  it("keeps physical hardware independent from personal software branches", () => {
    const state = createInitialState();
    state.contacts.push({ id: "owner-data", name: "Owner" });
    state.hardware.components.battery.condition = 61;
    const migrated = migrateState(state);
    expect(
      migrated.contacts.some((contact) => contact.id === "owner-data"),
    ).toBe(true);
    expect(migrated.hardware.components.battery.condition).toBe(61);
  });

  it("keeps every removable component described, rendered and replaceable", () => {
    const state = createInitialState();
    expect(REMOVABLE_COMPONENT_IDS).toEqual(Object.keys(state.hardware.components));
    for (const id of REMOVABLE_COMPONENT_IDS) {
      expect(COMPONENT_DEFINITIONS[id]?.description.length, id).toBeGreaterThan(24);
      expect(COMPONENT_LAYOUT[id], `${id} physical geometry`).toBeTruthy();
      expect(REPLACEMENT_PARTS.some((part) => part.type === id), `${id} replacement`).toBe(true);
    }
  });

  it("limits Supra Electronics to its exact approved product families", () => {
    const supra = REPLACEMENT_PARTS.filter((part) => part.manufacturer === "Supra Electronics");
    expect(new Set(supra.map((part) => part.type))).toEqual(
      new Set(["storage", "usbBoard", "wideCamera", "ultrawideCamera", "telephotoCamera"]),
    );
    expect(REPLACEMENT_PARTS.some((part) => part.manufacturer === "Supra")).toBe(false);
    expect(supra.filter((part) => part.type === "storage")).toHaveLength(2);
    expect(supra.filter((part) => part.type.endsWith("Camera") || part.type === "wideCamera")).toHaveLength(3);
  });

  it("runs from external USB-C power without pretending a battery is installed", () => {
    const state = createInitialState();
    state.hardware.components.battery.installed = false;
    state.hardware.components.battery.connected = false;
    state.battery.charging = true;
    const caps = hardwareCapabilities(state);
    expect(caps.battery).toBe(false);
    expect(caps.externalPower).toBe(true);
    expect(caps.powerAvailable).toBe(true);
    expect(caps.charging).toBe(false);
    state.hardware.components.usbBoard.installed = false;
    expect(hardwareCapabilities(state).externalPower).toBe(false);
  });

  it("migrates legacy Supra inventory labels without losing loose parts", () => {
    const migrated = migrateState({
      schema: 4,
      hardware: {
        components: {},
        inventory: {
          packages: [
            { id: "storage", inventoryId: "approved", manufacturer: "Supra", name: "Supra NVMe Mobile 1 TB" },
            { id: "battery", inventoryId: "legacy", manufacturer: "Supra", name: "Supra battery" },
          ],
        },
      },
    });
    expect(migrated.hardware.inventory.packages).toHaveLength(2);
    expect(migrated.hardware.inventory.packages[0].manufacturer).toBe("Supra Electronics");
    expect(migrated.hardware.inventory.packages[1].manufacturer).toBe("Independent aftermarket");
  });

  it("uses live charger state to trigger deterministic USB-C water protection and permanent damage", () => {
    let state = createInitialState();
    state.hardware.unboxing.complete = true;
    state.hardware.components.backCover.installed = false;
    state.hardware.water.running = true;
    state.power.mode = "on";
    state.battery.charging = true;
    state = reducer(state, { type: "HARDWARE_WATER_TICK" });
    state = reducer(state, { type: "HARDWARE_WATER_TICK" });
    expect(state.hardware.components.usbBoard).toMatchObject({
      wet: true,
      connected: false,
      electricalFault: true,
    });
    expect(state.hardware.components.usbBoard.condition).toBeLessThan(100);
    expect(state.battery.charging).toBe(false);
    expect(state.hardware.faults).toContain("USB-C powered-water electrical fault");
    expect(state.developer.timeline.some((event) => event.message.includes("USB-C protection triggered"))).toBe(true);
    const damagedCondition = state.hardware.components.usbBoard.condition;
    state = reducer(state, { type: "HARDWARE_WATER", mode: "drain" });
    expect(state.hardware.components.usbBoard.condition).toBe(damagedCondition);
    expect(state.hardware.components.usbBoard.connected).toBe(false);
  });

  it("immediately kills a batteryless externally powered phone after a wet USB fault", () => {
    let state = createInitialState();
    state.hardware.components.backCover.installed = false;
    state.hardware.components.battery.installed = false;
    state.hardware.components.battery.connected = false;
    state.hardware.water.running = true;
    state.battery.charging = true;
    state.power.mode = "on";
    expect(hardwareCapabilities(state).externalPower).toBe(true);
    state = reducer(state, { type: "HARDWARE_WATER_TICK" });
    state = reducer(state, { type: "HARDWARE_WATER_TICK" });
    expect(state.power.mode).toBe("off");
    expect(state.battery.charging).toBe(false);
    expect(hardwareCapabilities(state).externalPower).toBe(false);
    expect(state.developer.timeline.some((event) => event.message.includes("batteryless external power failed"))).toBe(true);
  });

  it("shuts down on powered mainboard water contact but not on passive contact", () => {
    const flood = (powered) => {
      let state = createInitialState();
      state.hardware.components.backCover.installed = false;
      state.hardware.water.running = true;
      state.power.mode = powered ? "on" : "off";
      for (let index = 0; index < 30; index += 1)
        state = reducer(state, { type: "HARDWARE_WATER_TICK" });
      return state;
    };
    const powered = flood(true);
    const passive = flood(false);
    const boardFaultId = ["mainboard", "soc", "ram", "storage"].find(
      (id) => powered.hardware.components[id].electricalFault,
    );
    expect(powered.power.mode).toBe("off");
    expect(boardFaultId).toBeTruthy();
    expect(powered.developer.timeline.some((event) => event.message.includes("Mainboard electrical fault"))).toBe(true);
    expect(passive.hardware.components[boardFaultId].electricalFault).not.toBe(true);
    expect(passive.hardware.components[boardFaultId].condition).toBeGreaterThan(
      powered.hardware.components[boardFaultId].condition,
    );
  });
});
