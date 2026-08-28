import { describe, expect, it } from "vitest";
import {
  createInitialState,
  migrateState,
  reducer,
} from "../state/OSContext.jsx";
import { batteryModel, cycleHealthCeiling, thermalProfile } from "./battery.js";

const runningState = () => {
  const state = createInitialState();
  state.power.mode = "on";
  state.power.locked = false;
  state.battery.last = 1_000;
  return state;
};

describe("coherent Antoid battery model", () => {
  it("maps health to effective full capacity without changing displayed full charge", () => {
    const capacities = [100, 80, 60, 40].map((health) => {
      const state = createInitialState();
      state.battery.health = health;
      state.battery.level = 100;
      const model = batteryModel(state);
      expect(model.storedChargeMah).toBeCloseTo(model.effectiveCapacityMah, 6);
      return model.effectiveCapacityMah;
    });
    expect(capacities[0]).toBeCloseTo(4800, 0);
    expect(capacities[1]).toBeCloseTo(3840, 0);
    expect(capacities[2]).toBeCloseTo(2880, 0);
    expect(capacities[3]).toBeCloseTo(1920, 0);
  });

  it("discharges progressively faster at lower health while retaining relative percentage", () => {
    const drainAt = (health) => {
      let state = runningState();
      state.battery.health = health;
      state.battery.level = 100;
      state = reducer(state, { type: "TICK", now: 181_000 });
      return 100 - state.battery.level;
    };
    const drains = [100, 80, 60, 40].map(drainAt);
    expect(drains[0]).toBeCloseTo(1, 1);
    expect(drains[1]).toBeGreaterThan(drains[0]);
    expect(drains[2]).toBeGreaterThan(drains[1]);
    expect(drains[3]).toBeGreaterThan(drains[2]);
  });

  it("heats under prolonged heavy charging load and applies deterministic thermal protection", () => {
    let heavy = runningState();
    heavy.screen.app = "youtube";
    heavy.battery.charging = true;
    heavy = reducer(heavy, { type: "TICK", now: 71_000 });
    expect(heavy.battery.temperature).toBeGreaterThan(35);

    let normal = runningState();
    normal.battery.level = 50;
    normal.battery.charging = true;
    normal.battery.temperatureMode = "Manual";
    normal.battery.manualTemperature = 30;
    normal.battery.temperature = 30;
    normal = reducer(normal, { type: "TICK", now: 21_000 });

    let hot = runningState();
    hot.battery.level = 50;
    hot.battery.charging = true;
    hot.battery.temperatureMode = "Manual";
    hot.battery.manualTemperature = 48;
    hot.battery.temperature = 48;
    hot = reducer(hot, { type: "TICK", now: 21_000 });
    expect(hot.battery.level - 50).toBeLessThan(normal.battery.level - 50);
    expect(hot.battery.performanceLimit).toBeLessThan(100);

    let critical = runningState();
    critical.battery.temperatureMode = "Manual";
    critical.battery.manualTemperature = 60;
    critical.battery.temperature = 60;
    critical = reducer(critical, { type: "TICK", now: 2_000 });
    expect(critical.power.mode).toBe("off");
    expect(critical.battery.chargeLimitedReason).toContain("Critical");
    expect(thermalProfile(60).protectiveShutdown).toBe(true);
  });

  it("accumulates partial discharge into full equivalent cycles and gradual aging", () => {
    let state = runningState();
    state.battery.level = 100;
    state = reducer(state, { type: "TICK", now: 9_001_000 });
    expect(state.battery.level).toBeCloseTo(50, 0);
    expect(state.battery.cycles).toBe(0);
    expect(state.battery.cycleProgress).toBeCloseTo(0.5, 1);
    const healthAfterHalf = state.battery.health;
    state.battery.level = 100;
    state.battery.last = 10_000_000;
    state = reducer(state, { type: "TICK", now: 19_000_000 });
    expect(state.battery.cycles).toBe(1);
    expect(state.battery.cycleProgress).toBeLessThan(0.05);
    expect(state.battery.health).toBeLessThan(healthAfterHalf);
    expect(state.battery.health).toBeGreaterThan(99.9);
  });

  it("makes Controller Lab cycle changes affect health and physical condition", () => {
    let state = createInitialState();
    state = reducer(state, {
      type: "SET",
      path: "battery.cycles",
      value: 1000,
    });
    expect(state.battery.health).toBeCloseTo(cycleHealthCeiling(1000), 6);
    expect(state.hardware.components.battery.condition).toBeLessThan(100);
    expect(batteryModel(state).effectiveCapacityMah).toBeLessThan(4000);
  });

  it("migrates and persists equivalent-cycle progress and aging diagnostics", () => {
    const state = migrateState({
      schema: 6,
      battery: {
        health: 78,
        cycles: 321.4,
        agingLoss: 2.3,
        dischargedThroughputMah: 123456,
      },
    });
    expect(state.schema).toBe(9);
    expect(state.battery.cycles).toBe(321);
    expect(state.battery.cycleProgress).toBeCloseTo(0.4, 6);
    expect(state.battery.health).toBe(78);
    expect(state.battery.agingLoss).toBe(2.3);
    expect(state.battery.dischargedThroughputMah).toBe(123456);
    const restarted = migrateState(state);
    expect(restarted.battery).toMatchObject({
      cycles: 321,
      agingLoss: 2.3,
      dischargedThroughputMah: 123456,
    });
    expect(restarted.battery.cycleProgress).toBeCloseTo(0.4, 6);
  });
});
