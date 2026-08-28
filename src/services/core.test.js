import { describe, expect, it } from "vitest";
import {
  CARRIERS,
  NETWORK_MATRIX,
  NETWORK_MODES,
  RADIO_CHOICES,
  STORE_APPS,
  connectivity,
  emergencyNetwork,
  lineQuality,
  makeNumbers,
  speedtestProfile,
  voiceBearer,
} from "./core.js";

const baseState = () => ({
  radio: { wifi: false, mobileData: true, airplane: false },
  wifi: { connected: null },
  defaults: { data: "physical", calls: "physical" },
  sim: {
    physical: {
      label: "SIM 1",
      carrier: "yettel",
      installed: true,
      enabled: true,
      registered: true,
      network: "Automatic",
      radioSelection: "Automatic",
      networkMode: "Automatic",
      bars: 4,
      voice: {
        enable5g: true,
        vonr: true,
        volte: true,
        wifiCalling: true,
        preferWifi: false,
        fallback3g: true,
        fallback2g: true,
        allow2g: true,
      },
    },
    esim: { installed: false },
  },
  tray: { open: false },
  networkLab: {
    shield: 0,
    load: { yettel: 0, telekom: 0, one: 0 },
    operations: {
      yettel: {
        All: "Normal",
        "5G SA": "Normal",
        "5G NSA": "Normal",
        "4G+": "Normal",
        "4G": "Normal",
        "3G": "Normal",
        EDGE: "Normal",
      },
    },
    weather: { mode: "Clear", stormMultiplier: 1, floor: "Ground" },
    towers: {
      A: { distance: 5, strength: 100, dbmMode: "Auto", manualDbm: -65 },
      B: { distance: 8, strength: 100, dbmMode: "Auto", manualDbm: -72 },
      C: { distance: 10, strength: 100, dbmMode: "Auto", manualDbm: -82 },
    },
    handover: {
      position: 8,
      auto: true,
      serving: { physical: "A", esim: "A" },
    },
    plans: {
      physical: {
        name: "1 GB",
        usedMB: 0,
        voicePlan: "100 minutes",
        usedMinutes: 0,
      },
      esim: {
        name: "1 GB",
        usedMB: 0,
        voicePlan: "100 minutes",
        usedMinutes: 0,
      },
    },
    autoSwitchData: false,
  },
});

describe("Antoid 1 carrier model", () => {
  it("generates unique permanent-format Hungarian numbers", () => {
    const numbers = makeNumbers();
    const all = [
      ...Object.values(numbers.profiles),
      ...Object.values(numbers.contacts),
    ];
    expect(new Set(all).size).toBe(all.length);
    for (const [key, value] of Object.entries(numbers.profiles)) {
      const carrier = Object.keys(CARRIERS).find((id) => key.endsWith(id));
      expect(value).toMatch(
        new RegExp(`^\\+36 ${CARRIERS[carrier].prefix} \\d{7}$`),
      );
    }
  });

  it("defines Store apps including the paid simulator, exact RAT choices and signal levels zero through four", () => {
    expect(STORE_APPS).toHaveLength(7);
    expect(STORE_APPS.at(-1).id).toBe("streetlight");
    expect(RADIO_CHOICES).toEqual([
      "Automatic",
      "5G SA",
      "5G NSA",
      "4G+",
      "4G",
      "3G",
      "EDGE",
    ]);
    expect(NETWORK_MODES).toContain("2G only");
    for (const type of Object.values(NETWORK_MATRIX)) {
      expect(type.bandwidth).toHaveLength(5);
      expect(type.quality[0]).toBe("Offline");
    }
    expect(
      Object.fromEntries(
        Object.entries(NETWORK_MATRIX).map(([rat, item]) => [
          rat,
          item.ceiling,
        ]),
      ),
    ).toEqual({
      "5G SA": 940,
      "5G NSA": 730,
      "4G+": 250,
      "4G": 193,
      "3G": 72,
      EDGE: 0.8,
    });
  });

  it("keeps 112 independent of SIM state but respects the hard underground dead zone", () => {
    const state = baseState();
    state.sim.physical.installed = false;
    expect(emergencyNetwork(state).reachable).toBe(true);
    state.networkLab.weather = {
      mode: "Building/Underground",
      floor: "-3",
      stormMultiplier: 1,
    };
    expect(emergencyNetwork(state)).toMatchObject({
      reachable: false,
      reason: "Hard cellular dead zone",
    });
  });

  it("uses centralized connection quality and voice bearers", () => {
    const state = baseState();
    expect(connectivity(state)).toMatchObject({
      isOnline: true,
      signalBars: 4,
      networkType: "5G SA",
    });
    expect(voiceBearer(state)).toMatchObject({
      label: "VoNR",
      shortLabel: "VoNR",
    });
    state.sim.physical.radioSelection = "4G";
    state.networkLab.handover.position = 52;
    expect(voiceBearer(state).shortLabel).toBe("VoLTE");
    state.sim.physical.radioSelection = "3G";
    state.networkLab.handover.position = 92;
    expect(voiceBearer(state).shortLabel).toBe("UMTS");
    state.sim.physical.radioSelection = "EDGE";
    expect(voiceBearer(state).shortLabel).toBe("GSM");
  });

  it("allows VoWiFi at zero bars and in airplane mode", () => {
    const state = baseState();
    state.wifi.connected = "TP-Link B440";
    state.radio.wifi = true;
    state.radio.airplane = true;
    state.sim.physical.bars = 0;
    expect(voiceBearer(state)).toMatchObject({
      label: "VoWiFi",
      shortLabel: "VoWiFi",
    });
    expect(connectivity(state).wifiConnected).toBe(true);
    state.radio.wifi = false;
    expect(connectivity(state).wifiConnected).toBe(false);
  });

  it("always gives connected Wi-Fi priority over eligible cellular data", () => {
    const state = baseState();
    expect(connectivity(state).route).toBe("cellular");
    state.radio.wifi = true;
    state.wifi.connected = "TP-Link B440";
    expect(connectivity(state)).toMatchObject({
      route: "wifi",
      onlineVia: "Wi-Fi",
      bandwidth: 180,
    });
    state.wifi.connected = null;
    expect(connectivity(state).route).toBe("cellular");
  });

  it("combines base bars, Shield, load and handover without exceeding four bars", () => {
    const state = baseState();
    const ideal = lineQuality(state, "physical");
    state.networkLab.shield = 50;
    state.networkLab.load.yettel = 100;
    state.networkLab.handover.position = 33;
    const stressed = lineQuality(state, "physical");
    expect(stressed.baseBars).toBe(4);
    expect(stressed.bars).toBeLessThan(ideal.bars);
    expect(stressed.load).toBe(100);
    expect(stressed.bandwidth).toBeLessThan(ideal.bandwidth);
    expect(stressed.latency).toBeGreaterThan(ideal.latency);
    expect(stressed.bars).toBeLessThanOrEqual(4);
  });

  it("falls back through lower generations for independent data and voice outages", () => {
    const state = baseState();
    state.networkLab.operations.yettel["5G SA"] = "Voice Outage";
    expect(voiceBearer(state)).toMatchObject({
      shortLabel: "VoLTE",
      network: "5G NSA",
    });
    expect(connectivity(state).route).toBe("cellular");
    state.networkLab.operations.yettel["5G SA"] = "Full Outage";
    expect(lineQuality(state, "physical").networkType).toBe("5G NSA");
    state.networkLab.operations.yettel.All = "Full Outage";
    expect(connectivity(state).route).toBe("offline");
    expect(voiceBearer(state).ok).toBe(false);
  });

  it("stops mobile data at the plan limit while preserving registration and voice", () => {
    const state = baseState();
    state.networkLab.plans.physical.usedMB = 1024;
    const quality = lineQuality(state, "physical");
    expect(quality.registered).toBe(true);
    expect(quality.plan.exhausted).toBe(true);
    expect(quality.dataEligible).toBe(false);
    expect(connectivity(state).route).toBe("offline");
    expect(voiceBearer(state).shortLabel).toBe("VoNR");
  });

  it("only switches data to the other SIM when automatic switching is enabled", () => {
    const state = baseState();
    state.sim.esim = {
      ...state.sim.physical,
      label: "SIM 2",
      carrier: "telekom",
    };
    state.networkLab.operations.telekom = {
      ...state.networkLab.operations.yettel,
    };
    state.networkLab.plans.physical.usedMB = 1024;
    expect(connectivity(state).route).toBe("offline");
    state.networkLab.autoSwitchData = true;
    expect(connectivity(state)).toMatchObject({
      route: "cellular",
      activeDataSIM: "esim",
      activeCarrier: "telekom",
    });
  });

  it("models ordered and visibly distinct Speedtest performance", () => {
    const state = baseState();
    const fast5g = speedtestProfile(state);
    state.sim.physical.bars = 1;
    const weak5g = speedtestProfile(state);
    state.sim.physical.radioSelection = "EDGE";
    state.networkLab.handover.position = 92;
    const edge = speedtestProfile(state);
    expect(fast5g.download).toBeGreaterThan(weak5g.download);
    expect(weak5g.download).toBeGreaterThan(edge.download);
    expect(edge.ping).toBeGreaterThan(weak5g.ping);
    state.radio.mobileData = false;
    expect(speedtestProfile(state)).toMatchObject({
      isOnline: false,
      download: 0,
      packetLoss: 100,
    });
  });
});
