import { describe, expect, it } from "vitest";
import { lineQuality } from "../services/core.js";
import { createLabState, dvdReadOutcome } from "../services/lab.js";
import { createInitialState, migrateState, reducer } from "./OSContext.jsx";

describe("Antoid OS persisted-state migration", () => {
  it("creates a complete clean 4.0.0 state", () => {
    const state = migrateState(null);
    expect(state.schema).toBe(8);
    expect(state.hardware.components.storage).toMatchObject({
      manufacturer: "Genuine",
      type: "UFS 2.0",
      capacityGb: 256,
      actualCapacityGb: 256,
    });
    expect(state.hardware.components.modem.installed).toBe(true);
    expect(state.laptop.unboxing.complete).toBe(false);
    expect(state.networkLab.module).toBe("Radio");
    expect(state.lab.activeDevice).toBe("welcome");
    expect(state.lab.broadcast.towers).toHaveProperty("budapest");
    expect(state.lab.broadcast.fallbackAssignments).toHaveProperty(
      "Telekom:Da Vinci",
    );
    expect(state.battery.cycles).toBeTypeOf("number");
    expect(state.hardware).not.toHaveProperty("preview");
    expect(lineQuality(state, "physical").bandwidth).toBeTypeOf("number");
  });

  it("migrates the accidental 3.0 stock storage without replacing user hardware", () => {
    const stock = migrateState({
      schema: 3,
      hardware: {
        components: {
          storage: {
            manufacturer: "Genuine",
            serial: "ANT-STORAGE-001",
            capacityGb: 64,
            actualCapacityGb: 64,
            type: "UFS 3.1",
            installed: true,
          },
        },
      },
    });
    expect(stock.hardware.components.storage).toMatchObject({
      type: "UFS 2.0",
      capacityGb: 256,
      actualCapacityGb: 256,
    });
    const aftermarket = migrateState({
      schema: 3,
      hardware: {
        components: {
          storage: {
            manufacturer: "Extreme Budget",
            serviceName: "Budget eMMC ‘256 GB’ (64 GB actual)",
            capacityGb: 256,
            actualCapacityGb: 64,
            type: "eMMC",
            installed: true,
          },
        },
      },
    });
    expect(aftermarket.hardware.components.storage).toMatchObject({
      manufacturer: "Extreme Budget",
      capacityGb: 256,
      actualCapacityGb: 64,
    });
  });

  it("preserves recoverable legacy user data and adds 2.0 branches", () => {
    const state = migrateState({
      schema: 1,
      hardware: { preview: true },
      setup: { firstName: "Legacy", username: "legacy-user", done: true },
      sim: { physical: { network: "5G", bars: 3 } },
      battery: { level: "73", cycles: null },
      networkLab: {
        module: "Data Plan",
        plans: { physical: { name: "1 GB", usedMB: "120" } },
      },
    });
    expect(state.setup).toMatchObject({
      firstName: "Legacy",
      username: "legacy-user",
      done: true,
    });
    expect(state.sim.physical.radioSelection).toBe("5G SA");
    expect(state.networkLab.module).toBe("Plan & Usage");
    expect(state.networkLab.plans.physical.usedMB).toBe(120);
    expect(state.networkLab.plans.physical.voicePlan).toBe("100 minutes");
    expect(state.battery).toMatchObject({ level: 73, cycles: 0 });
    expect(state.hardware).not.toHaveProperty("preview");
  });

  it("repairs malformed branches without throwing during root calculations", () => {
    const state = migrateState({
      notifications: "broken",
      installed: null,
      sim: { physical: { bars: "not-a-number", voice: null } },
      battery: {
        level: "invalid",
        cycles: "invalid",
        temperature: null,
        history: "invalid",
        usage: null,
      },
      networkLab: {
        module: "Unknown old panel",
        load: null,
        handover: null,
        towers: { A: null },
        plans: {
          physical: {
            name: "unknown",
            usedMB: "invalid",
            voicePlan: "unknown",
            usedMinutes: null,
          },
        },
      },
      browser: {
        tabs: "invalid",
        dailyQuestions: { questions: "invalid" },
      },
      social: { youtube: { likes: "invalid" }, spotify: null },
    });
    expect(state.notifications).toEqual(expect.any(Array));
    expect(state.installed).toEqual(expect.any(Array));
    expect(state.networkLab.module).toBe("Radio");
    expect(state.battery).toMatchObject({ level: 87, cycles: 0 });
    expect(state.browser.tabs.length).toBeGreaterThan(0);
    expect(state.social.youtube.likes).toEqual([]);
    expect(() => lineQuality(state, "physical")).not.toThrow();
  });

  it("fully wipes persisted device data and returns to physical unboxing", () => {
    const initial = createInitialState();
    const dirty = {
      ...initial,
      deskView: "laptop",
      setup: {
        ...initial.setup,
        done: true,
        step: 9,
        firstName: "Saved",
        username: "saved-user",
        pin: "1234",
      },
      hardware: {
        ...initial.hardware,
        unboxing: { complete: true, stage: 5, chargerUnlocked: true },
        drop: {
          ...initial.hardware.drop,
          height: 828,
          lastResult: "Destroyed",
        },
        components: {
          ...initial.hardware.components,
          display: { ...initial.hardware.components.display, condition: 1 },
        },
      },
      laptop: {
        ...initial.laptop,
        unboxing: { ...initial.laptop.unboxing, complete: true, stage: 5 },
      },
      tray: { open: false, card: "yettel", selected: null },
      sim: {
        ...initial.sim,
        physical: {
          ...initial.sim.physical,
          carrier: "yettel",
          installed: true,
          registered: true,
        },
      },
      notes: [{ id: "saved-note", title: "Private", body: "Erase me" }],
    };

    const reset = reducer(dirty, { type: "FULL_FACTORY_RESET" });

    expect(reset.deskView).toBe("phone");
    expect(reset.setup).toMatchObject({
      done: false,
      step: 0,
      firstName: "",
      username: "",
      pin: "",
    });
    expect(reset.hardware.unboxing).toEqual({
      complete: false,
      stage: 0,
      chargerUnlocked: false,
    });
    expect(reset.hardware.components.display.condition).toBe(100);
    expect(reset.hardware.drop.lastResult).toBeNull();
    expect(reset.laptop.unboxing.complete).toBe(false);
    expect(reset.tray).toEqual({ open: false, card: null, selected: null });
    expect(reset.sim.physical.installed).toBe(false);
    expect(reset.notes).toHaveLength(1);
    expect(reset.notes[0]).toMatchObject({ id: "n1", title: "Welcome" });
    expect(reset.notes.some((note) => note.id === "saved-note")).toBe(false);
    expect(reset.lab.unboxing.complete).toBe(false);
  });

  it("automatically applies saver thresholds only when a battery is installed", () => {
    let saver = createInitialState();
    saver.power.mode = "on";
    saver.battery.level = 15;
    saver.battery.last = 1000;
    saver = reducer(saver, { type: "TICK", now: 2000 });
    expect(saver.battery).toMatchObject({
      saver: true,
      saverAuto: true,
      extremeSaver: false,
    });

    let extreme = createInitialState();
    extreme.power.mode = "on";
    extreme.battery.level = 5;
    extreme.battery.last = 1000;
    extreme = reducer(extreme, { type: "TICK", now: 2000 });
    expect(extreme.battery).toMatchObject({
      saver: false,
      extremeSaver: true,
      extremeSaverAuto: true,
    });

    let external = createInitialState();
    external.hardware.components.battery.installed = false;
    external.hardware.components.battery.connected = false;
    external.battery.level = 3;
    external.battery.charging = true;
    external.power.mode = "on";
    external.battery.last = 1000;
    external = reducer(external, { type: "TICK", now: 2000 });
    expect(external.battery).toMatchObject({
      saver: false,
      extremeSaver: false,
    });
  });

  it("enforces the configurable Extreme Saver app allowlist", () => {
    let state = createInitialState();
    state.power.locked = false;
    state.battery.extremeSaver = true;
    state = reducer(state, { type: "OPEN_APP", id: "youtube" });
    expect(state.screen.app).not.toBe("youtube");
    expect(state.toast.message).toContain("Extreme Battery Saver");
    state.battery.extremeAllowedApps = [
      ...state.battery.extremeAllowedApps,
      "youtube",
    ];
    state = reducer(state, { type: "OPEN_APP", id: "youtube" });
    expect(state.screen.app).toBe("youtube");
  });

  it("advances a Lab channel scan frequency-by-frequency before storing results", () => {
    let state = createInitialState();
    state.lab.antenna.selected = "supra";
    state.lab.antenna.position = 12;
    state.lab.cables.antennaToUtv = true;
    state = reducer(state, { type: "LAB_AUTO_SCAN", device: "utv" });
    expect(state.lab.utv.scan.status).toBe("scanning");
    expect(state.lab.utv.scan.progress).toBe(0);
    expect(state.lab.utv.storedChannels).toHaveLength(0);
    const steps = state.lab.utv.scan.plan.length;
    state = reducer(state, { type: "LAB_SCAN_TICK", device: "utv" });
    expect(state.lab.utv.scan.progress).toBeGreaterThan(0);
    expect(state.lab.utv.scan.status).toBe(
      steps === 1 ? "complete" : "scanning",
    );
    for (let index = 1; index < steps; index += 1)
      state = reducer(state, { type: "LAB_SCAN_TICK", device: "utv" });
    expect(state.lab.utv.scan.status).toBe("complete");
    expect(state.lab.utv.scan.progress).toBe(100);
    expect(state.lab.utv.storedChannels.length).toBeGreaterThan(0);
  });

  it("records a real acquisition interval for channel changes", () => {
    let state = createInitialState();
    state.lab.utv.storedChannels = [
      { id: "one", name: "One", channelNumber: 1 },
    ];
    const before = Date.now();
    state = reducer(state, {
      type: "LAB_TUNE_CHANNEL",
      device: "utv",
      id: "one",
    });
    expect(state.lab.utv.currentChannelId).toBe("one");
    expect(state.lab.utv.tuningUntil).toBeGreaterThan(before);
  });

  it("runs the Decoder firmware state machine through install and reboot", () => {
    let state = createInitialState();
    state.lab.decoder.power = "on";
    state = reducer(state, { type: "DECODER_UPDATE_START" });
    expect(state.lab.decoder.firmware.status).toBe("checking");
    for (
      let step = 0;
      step < 30 && state.lab.decoder.firmware.status !== "complete";
      step += 1
    )
      state = reducer(state, { type: "DECODER_UPDATE_TICK" });
    expect(state.lab.decoder.firmware).toMatchObject({
      status: "complete",
      progress: 100,
      version: "4.0.4",
    });
    expect(state.lab.decoder.lastBootReason).toBe("Firmware update");
  });

  it("enters recoverable Decoder mode on verification failure", () => {
    let state = createInitialState();
    state.lab.decoder.power = "on";
    state.lab.decoder.firmware.fault = "verification";
    state = reducer(state, { type: "DECODER_UPDATE_START" });
    for (
      let step = 0;
      step < 20 && state.lab.decoder.page !== "recovery";
      step += 1
    )
      state = reducer(state, { type: "DECODER_UPDATE_TICK" });
    expect(state.lab.decoder.page).toBe("recovery");
    state = reducer(state, { type: "DECODER_RECOVERY", mode: "restore" });
    expect(state.lab.decoder).toMatchObject({
      page: "system",
      power: "on",
      firmware: {
        version: "4.0.3",
        build: "4003.260823",
        buildDate: "2026-08-23",
        fault: "none",
        status: "idle",
        lastUpdate: null,
      },
    });
  });

  it("evaluates DVD tray media through the optical hardware model", () => {
    const dvd = createLabState().dvd;
    expect(dvdReadOutcome(dvd)).toBe("NO DISC");
    dvd.disc = dvd.availableDiscs[0];
    expect(dvdReadOutcome(dvd)).toBe("DVD MENU");
    dvd.laserHealth = 0;
    dvd.trackingStability = 0;
    dvd.focusStability = 0;
    dvd.disc = { ...dvd.disc, condition: 10 };
    expect(dvdReadOutcome(dvd)).toBe("DISC ERROR");
    dvd.disc = dvd.availableDiscs[2];
    expect(dvdReadOutcome(dvd)).toBe("REGION ERROR");
  });
});
