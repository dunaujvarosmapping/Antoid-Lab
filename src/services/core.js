import { hardwareCapabilities } from "./hardware.js";

export const CARRIERS = {
  yettel: { name: "Yettel HU", prefix: "20", color: "#22d96f" },
  telekom: { name: "Telekom HU", prefix: "30", color: "#e8409d" },
  one: { name: "One HU", prefix: "70", color: "#ef394f" },
};

export const STORE_APPS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: "▶",
    category: "Video",
    version: "1.2",
    size: 86,
    color: "#ff4050",
    description:
      "Three original animated local films, channels, comments and library.",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    category: "Social",
    version: "1.1",
    size: 64,
    color: "#3988f6",
    description:
      "A private local feed for family, communities, events and marketplace.",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "M",
    category: "Productivity",
    version: "1.3",
    size: 42,
    color: "#e95d53",
    description:
      "Local Antoid ID mail with inbox, drafts, labels and offline outbox.",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: "≋",
    category: "Music",
    version: "1.0",
    size: 71,
    color: "#32d975",
    description:
      "Antoid Nights: an original procedural track made with Web Audio.",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "◎",
    category: "Social",
    version: "1.1",
    size: 79,
    color: "#b84be1",
    description: "Local stories, posts, filters, reactions, profiles and DMs.",
  },
  {
    id: "mobile-debug",
    name: "Mobile Data Debug",
    icon: "⌁",
    category: "Developer Tools",
    version: "2.0",
    size: 18,
    color: "#19b9a5",
    description:
      "Live serving-cell, dual-SIM, IMS, handover and data-session diagnostics.",
  },
  {
    id: "streetlight",
    name: "Street Light Simulator",
    icon: "♜",
    category: "Simulation",
    version: "1.0",
    size: 96,
    priceHuf: 1200,
    color: "#e8a93c",
    description:
      "A component-level street-light network simulator with four lamp technologies, storms, faults and field repairs.",
  },
];

export const CORE_APPS = [
  ["phone", "Phone", "☎", "#42d477"],
  ["messages", "Messages", "✉", "#35c994"],
  ["contacts", "Contacts", "♟", "#49a4ff"],
  ["messenger", "Messenger", "ϟ", "#6d72ff"],
  ["camera", "Camera", "◉", "#20262d"],
  ["gallery", "Gallery", "❖", "#ef5b86"],
  ["browser", "Browser", "⊙", "#36a5ef"],
  ["settings", "Settings", "⚙", "#71808f"],
  ["clock", "Clock", "◷", "#684ddf"],
  ["calculator", "Calculator", "±", "#ef9b3f"],
  ["notes", "Notes", "▤", "#f2c744"],
  ["weather", "Weather", "☀", "#5db7f4"],
  ["calendar", "Calendar", "23", "#ee5c5c"],
  ["files", "Files", "▰", "#3c8ef3"],
  ["speedtest", "Speedtest", "⇅", "#23c7ad"],
  ["fm-radio", "FM Radio", "◖", "#e34e72"],
  ["store", "Antoid Store", "A", "#31d69b"],
].map(([id, name, icon, color]) => ({ id, name, icon, color }));

export function randomDigits(n = 7) {
  const array = new Uint32Array(n);
  globalThis.crypto?.getRandomValues?.(array);
  return [...array]
    .map((v, i) =>
      String(
        globalThis.crypto?.getRandomValues
          ? v % 10
          : Math.floor(Math.random() * 10),
      ),
    )
    .join("");
}

export function makeNumbers() {
  const used = new Set();
  const make = (prefix) => {
    let value;
    do value = `+36 ${prefix} ${randomDigits()}`;
    while (used.has(value));
    used.add(value);
    return value;
  };
  const profiles = {};
  Object.entries(CARRIERS).forEach(([id, c]) => {
    profiles[`physical-${id}`] = make(c.prefix);
    profiles[`esim-${id}`] = make(c.prefix);
  });
  return {
    profiles,
    contacts: {
      mom: make("70"),
      dad: make("70"),
      grandma: make("70"),
      alex: make("30"),
      doctor: make("20"),
    },
  };
}

export const NETWORK_MATRIX = {
  "5G SA": {
    ceiling: 940,
    uploadCeiling: 200,
    latencyIdeal: 10,
    thresholds: [-118, -106, -94, -82],
    bandwidth: [0, 45, 235, 610, 940],
    latency: [0, 360, 105, 32, 10],
    quality: ["Offline", "Unstable", "Good", "Very good", "Excellent"],
  },
  "5G NSA": {
    ceiling: 730,
    uploadCeiling: 150,
    latencyIdeal: 16,
    thresholds: [-120, -108, -96, -84],
    bandwidth: [0, 32, 180, 470, 730],
    latency: [0, 470, 135, 44, 16],
    quality: ["Offline", "Unstable", "Good", "Very good", "Excellent"],
  },
  "4G+": {
    ceiling: 250,
    uploadCeiling: 42,
    latencyIdeal: 25,
    thresholds: [-122, -110, -98, -86],
    bandwidth: [0, 12, 62, 155, 250],
    latency: [0, 700, 210, 68, 25],
    quality: ["Offline", "Poor", "Moderate", "Good", "Excellent"],
  },
  "4G": {
    ceiling: 193,
    uploadCeiling: 23,
    latencyIdeal: 34,
    thresholds: [-124, -112, -100, -88],
    bandwidth: [0, 8, 43, 116, 193],
    latency: [0, 900, 260, 86, 34],
    quality: ["Offline", "Poor", "Moderate", "Good", "Very good"],
  },
  "3G": {
    ceiling: 72,
    uploadCeiling: 5,
    latencyIdeal: 95,
    thresholds: [-121, -110, -99, -88],
    bandwidth: [0, 1.8, 13, 38, 72],
    latency: [0, 1500, 620, 240, 95],
    quality: ["Offline", "Poor", "Slow", "Usable", "Moderate"],
  },
  EDGE: {
    ceiling: 0.8,
    uploadCeiling: 0.1,
    latencyIdeal: 650,
    thresholds: [-125, -116, -106, -96],
    bandwidth: [0, 0.05, 0.18, 0.42, 0.8],
    latency: [0, 3200, 2100, 1200, 650],
    quality: [
      "Offline",
      "Barely usable",
      "Extremely slow",
      "Very slow",
      "Slow",
    ],
  },
};

export const RADIO_TYPES = ["5G SA", "5G NSA", "4G+", "4G", "3G", "EDGE"];
export const RADIO_CHOICES = ["Automatic", ...RADIO_TYPES];
export const NETWORK_MODES = [
  "Automatic",
  "5G preferred",
  "4G preferred",
  "3G preferred",
  "5G only",
  "4G only",
  "2G only",
];
export const TOWERS = Object.freeze({
  A: {
    id: "A",
    name: "Budapest Széchenyi-hegy",
    position: 8,
    rats: ["5G SA"],
  },
  B: {
    id: "B",
    name: "Előszállás Horgásztó",
    position: 52,
    rats: ["5G NSA", "4G+", "4G"],
  },
  C: {
    id: "C",
    name: "Előszállás Vasútállomás",
    position: 92,
    rats: ["3G", "EDGE"],
  },
});
export const WEATHER_MODES = [
  "Clear",
  "Rain",
  "Heavy Rain",
  "Snow",
  "Storm",
  "Heavy Storm",
  "Building/Underground",
];
export const OPERATION_CONDITIONS = [
  "Normal",
  "Maintenance",
  "Degraded",
  "Data Outage",
  "Voice Outage",
  "Full Outage",
];
export const DATA_PLAN_MB = {
  "1 GB": 1024,
  "5 GB": 5120,
  "10 GB": 10240,
  "25 GB": 25600,
  Unlimited: Infinity,
};
export const VOICE_PLAN_MINUTES = {
  "30 minutes": 30,
  "100 minutes": 100,
  "300 minutes": 300,
  Unlimited: Infinity,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const normalizeRat = (network) =>
  ({
    "5G": "5G SA",
    "EDGE / 2G": "EDGE",
    "2G / EDGE": "EDGE",
  })[network] || network;
export const ratLabel = (network) =>
  normalizeRat(network) === "EDGE" ? "EDGE / 2G" : normalizeRat(network);
const labFallback = {
  shield: 0,
  load: { yettel: 15, telekom: 15, one: 15 },
  weather: { mode: "Clear", stormMultiplier: 1, floor: "Ground" },
  handover: {
    position: 8,
    auto: true,
    serving: { physical: "A", esim: "A" },
  },
  towers: {
    A: { distance: 5, strength: 100, dbmMode: "Auto", manualDbm: -65 },
    B: { distance: 8, strength: 100, dbmMode: "Auto", manualDbm: -72 },
    C: { distance: 10, strength: 100, dbmMode: "Auto", manualDbm: -82 },
  },
  operations: {},
  plans: {},
  autoSwitchData: false,
};

function carrierCondition(state, carrier, network) {
  const operations = state.networkLab?.operations?.[carrier] || {};
  return operations.All && operations.All !== "Normal"
    ? operations.All
    : operations[network] || "Normal";
}

function conditionAllows(condition, kind) {
  if (condition === "Full Outage") return false;
  if (kind === "data" && condition === "Data Outage") return false;
  if (kind === "voice" && condition === "Voice Outage") return false;
  return true;
}

function modeOrder(line) {
  const mode = line?.networkMode || "Automatic";
  if (mode === "5G only") return ["5G SA", "5G NSA"];
  if (mode === "4G only") return ["4G+", "4G"];
  if (mode === "2G only") return ["EDGE"];
  if (mode === "4G preferred") return ["4G+", "4G", "3G", "EDGE"];
  if (mode === "3G preferred") return ["3G", "EDGE"];
  const configured = normalizeRat(line?.radioSelection || line?.network);
  if (
    configured &&
    configured !== "Automatic" &&
    RADIO_TYPES.includes(configured)
  ) {
    const index = RADIO_TYPES.indexOf(configured);
    return RADIO_TYPES.slice(index);
  }
  return [...RADIO_TYPES];
}

function weatherPenalty(state, rat, towerId) {
  const weather = state.networkLab?.weather || labFallback.weather;
  const highBand = ["5G SA", "5G NSA"].includes(rat);
  const midBand = ["4G+", "4G"].includes(rat);
  if (weather.mode === "Building/Underground") {
    const floorPenalty = {
      "+3": 7,
      "+2": 9,
      "+1": 11,
      Ground: 14,
      "-1": 23,
      "-2": 39,
      "-3": 100,
    }[weather.floor || "Ground"];
    return floorPenalty + (highBand ? 8 : midBand ? 3 : 0);
  }
  const base =
    {
      Clear: 0,
      Rain: highBand ? 4 : 2,
      "Heavy Rain": highBand ? 10 : midBand ? 6 : 3,
      Snow: highBand ? 7 : 4,
      Storm: highBand ? 13 : midBand ? 8 : 5,
      "Heavy Storm": highBand ? 9 : midBand ? 6 : 4,
    }[weather.mode] || 0;
  if (weather.mode !== "Heavy Storm") return base;
  const multiplier = clamp(weather.stormMultiplier || 1, 1, 5);
  const phase = (Date.now() / 1400 + towerId.charCodeAt(0)) % (Math.PI * 2);
  return base * multiplier + Math.sin(phase) * multiplier * 1.8;
}

function towerDbm(state, line, tower, rat) {
  const lab = state.networkLab || labFallback;
  if (
    lab.weather?.mode === "Building/Underground" &&
    lab.weather.floor === "-3"
  )
    return -160;
  const config = { ...labFallback.towers[tower.id], ...lab.towers?.[tower.id] };
  const position = clamp(lab.handover?.position ?? 8, 0, 100);
  const configuredBars = clamp(Number(line?.bars) || 0, 0, 4);
  const barPenalty = (4 - configuredBars) * 11;
  const movementDistance = Math.abs(position - tower.position) * 0.72;
  const distance = clamp(Number(config.distance) || 0, 0, 80);
  const strengthBonus =
    (clamp(Number(config.strength) || 0, 0, 150) - 100) * 0.24;
  const automatic = -54 - distance * 1.15 - movementDistance + strengthBonus;
  const base =
    config.dbmMode === "Manual"
      ? clamp(config.manualDbm, -125, -55)
      : automatic;
  const antennaPenalty = hardwareCapabilities(state).cellularPenaltyDb;
  return (
    Math.round(
      (base -
        barPenalty -
        clamp(lab.shield || 0, 0, 100) * 0.34 -
        weatherPenalty(state, rat, tower.id) -
        antennaPenalty) *
        10,
    ) / 10
  );
}

function barsFromDbm(rat, dbm) {
  const thresholds = NETWORK_MATRIX[rat]?.thresholds || [-124, -112, -100, -88];
  if (dbm < thresholds[0]) return 0;
  if (dbm < thresholds[1]) return 1;
  if (dbm < thresholds[2]) return 2;
  if (dbm < thresholds[3]) return 3;
  return 4;
}

function ratAvailable(state, carrier, tower, rat, kind = "service") {
  const caps = hardwareCapabilities(state);
  if (!caps.cellular || !caps.supportedGenerations.includes(rat)) return false;
  if (!tower.rats.includes(rat)) return false;
  if (!conditionAllows(carrierCondition(state, carrier, rat), kind))
    return false;
  if (rat === "5G NSA") {
    const anchorCondition = carrierCondition(state, carrier, "4G");
    if (!tower.rats.includes("4G") || !conditionAllows(anchorCondition, kind))
      return false;
  }
  return true;
}

export function towerCandidates(state, slot, kind = "service") {
  const line = state.sim?.[slot];
  const carrier = line?.carrier;
  const order = modeOrder(line);
  return Object.values(TOWERS).map((tower) => {
    const rat = order.find((candidateRat) =>
      ratAvailable(state, carrier, tower, candidateRat, kind),
    );
    const measuredRat =
      rat ||
      order.find((candidateRat) => tower.rats.includes(candidateRat)) ||
      tower.rats[0];
    const dbm = towerDbm(state, line, tower, measuredRat);
    const bars = rat ? barsFromDbm(rat, dbm) : 0;
    return {
      ...tower,
      rat: rat || null,
      dbm,
      bars,
      usable: !!rat && bars > 0,
      condition: rat ? carrierCondition(state, carrier, rat) : "Unavailable",
    };
  });
}

function servingCandidate(state, slot, kind = "service") {
  const lab = state.networkLab || labFallback;
  const candidates = towerCandidates(state, slot, kind);
  const usable = candidates.filter((candidate) => candidate.usable);
  if (!usable.length) return candidates[0];
  const currentId = lab.handover?.serving?.[slot] || "A";
  const current = usable.find((candidate) => candidate.id === currentId);
  if (lab.handover?.auto === false && current) return current;
  return [...usable].sort((a, b) => b.dbm - a.dbm)[0];
}

function planFor(state, slot) {
  const plan = state.networkLab?.plans?.[slot] || {
    name: "5 GB",
    usedMB: 0,
  };
  const allowanceMB = DATA_PLAN_MB[plan.name] ?? DATA_PLAN_MB["5 GB"];
  const usedMB = Math.max(0, Number(plan.usedMB) || 0);
  const voicePlan = plan.voicePlan || "100 minutes";
  const allowanceMinutes =
    VOICE_PLAN_MINUTES[voicePlan] ?? VOICE_PLAN_MINUTES["100 minutes"];
  const usedMinutes = Math.max(0, Number(plan.usedMinutes) || 0);
  return {
    ...plan,
    allowanceMB,
    usedMB,
    remainingMB: Number.isFinite(allowanceMB)
      ? Math.max(0, allowanceMB - usedMB)
      : Infinity,
    exhausted: Number.isFinite(allowanceMB) && usedMB >= allowanceMB,
    voicePlan,
    allowanceMinutes,
    usedMinutes,
    remainingMinutes: Number.isFinite(allowanceMinutes)
      ? Math.max(0, allowanceMinutes - usedMinutes)
      : Infinity,
    voiceExhausted:
      Number.isFinite(allowanceMinutes) && usedMinutes >= allowanceMinutes,
  };
}

export function lineQuality(state, slot) {
  const lab = state.networkLab || labFallback;
  const line = state.sim?.[slot];
  const carrier = line?.carrier;
  const baseBars = clamp(Number(line?.bars) || 0, 0, 4);
  const tower = servingCandidate(state, slot, "service");
  const dataTower = servingCandidate(state, slot, "data");
  const voiceTower = servingCandidate(state, slot, "voice");
  const currentTower = lab.handover?.serving?.[slot] || "A";
  const nearHandover =
    lab.handover?.auto !== false && tower.id !== currentTower;
  const effectiveBars = tower.usable ? tower.bars : 0;
  const trayUnavailable = slot === "physical" && state.tray?.open;
  const deviceHardware = hardwareCapabilities(state);
  const subscriberHardware =
    slot === "physical"
      ? deviceHardware.simReader && deviceHardware.physicalSimTray
      : deviceHardware.esim;
  const hardwareAvailable =
    deviceHardware.cellular &&
    subscriberHardware &&
    !!line?.installed &&
    line.enabled &&
    line.registered &&
    !trayUnavailable &&
    !state.radio.airplane &&
    effectiveBars > 0;
  const order = modeOrder(line);
  const serviceNetwork = tower.usable ? tower.rat : null;
  const dataNetwork = order.find(
    (network) =>
      dataTower.rats.includes(network) &&
      towerDbm(state, line, dataTower, network) >=
        NETWORK_MATRIX[network].thresholds[0] &&
      ratAvailable(state, carrier, dataTower, network, "data"),
  );
  const supportsVoice = (network) => {
    if (
      !voiceTower.rats.includes(network) ||
      towerDbm(state, line, voiceTower, network) <
        NETWORK_MATRIX[network].thresholds[0] ||
      !ratAvailable(state, carrier, voiceTower, network, "voice")
    )
      return false;
    if (network === "5G SA") return line?.voice?.enable5g && line.voice.vonr;
    if (["5G NSA", "4G+", "4G"].includes(network)) return line?.voice?.volte;
    if (network === "3G") return line?.voice?.fallback3g;
    return line?.voice?.allow2g && line.voice.fallback2g;
  };
  const voiceNetwork = order.find(supportsVoice);
  const activeNetwork = serviceNetwork || tower.rat || order[0] || "5G SA";
  const condition = carrierCondition(state, carrier, activeNetwork);
  const dataCondition = carrierCondition(
    state,
    carrier,
    dataNetwork || activeNetwork,
  );
  const load = clamp(Number(lab.load?.[carrier]) || 0, 0, 100);
  const plan = planFor(state, slot);
  const registered = hardwareAvailable && !!serviceNetwork;
  const dataEligible =
    registered && state.radio.mobileData && !!dataNetwork && !plan.exhausted;
  const matrix =
    NETWORK_MATRIX[dataNetwork || activeNetwork] || NETWORK_MATRIX["5G SA"];
  const dataDbm = dataNetwork
    ? towerDbm(state, line, dataTower, dataNetwork)
    : -160;
  const dataBars = dataNetwork ? barsFromDbm(dataNetwork, dataDbm) : 0;
  const minDbm = matrix.thresholds[0];
  const idealDbm = matrix.thresholds[3] + 8;
  const signalFactor = clamp(
    0.06 + 0.94 * ((dataDbm - minDbm) / (idealDbm - minDbm)),
    0.03,
    1,
  );
  const baseBandwidth = matrix.ceiling * signalFactor;
  const baseLatency = matrix.latency[dataBars] || 0;
  const loadFactor = Math.max(0.08, 1 - 0.92 * Math.pow(load / 100, 1.35));
  const conditionFactor =
    dataCondition === "Maintenance"
      ? 0.72
      : dataCondition === "Degraded"
        ? 0.42
        : 1;
  const handoverFactor = nearHandover ? 0.72 : 1;
  const bandwidth = dataEligible
    ? Math.min(
        deviceHardware.maxCellularDownMbps,
        baseBandwidth * loadFactor * conditionFactor * handoverFactor,
      )
    : 0;
  const latencyMultiplier =
    (1 + Math.pow(load / 100, 1.5) * 4.5) *
    (dataCondition === "Maintenance"
      ? 1.4
      : dataCondition === "Degraded"
        ? 2.4
        : 1) *
    (nearHandover ? 1.65 : 1);
  const latency = dataEligible
    ? Math.round(baseLatency * latencyMultiplier)
    : 0;
  const jitter = dataEligible
    ? Math.max(
        1,
        Math.round(latency * (0.04 + load / 330 + (4 - effectiveBars) * 0.045)),
      )
    : 0;
  const packetLoss = dataEligible
    ? clamp((4 - dataBars) * 1.2 + load / 22 + (nearHandover ? 2.5 : 0), 0, 38)
    : 100;
  return {
    slot,
    line,
    carrier,
    carrierName: CARRIERS[carrier]?.name || "No carrier",
    baseBars,
    bars: registered ? effectiveBars : 0,
    effectiveBars,
    baseNetwork: normalizeRat(
      line?.radioSelection || line?.network || "Automatic",
    ),
    networkType: activeNetwork,
    dataNetwork,
    voiceNetwork,
    registered,
    dataEligible,
    trayUnavailable,
    condition,
    load,
    tower,
    dataTower,
    voiceTower,
    candidates: towerCandidates(state, slot),
    dbm: tower.dbm,
    rsrp: Math.round(
      tower.dbm -
        (["5G SA", "5G NSA", "4G+", "4G"].includes(activeNetwork) ? 2 : 0),
    ),
    rsrq: Math.round(-3 - load / 11 - (4 - effectiveBars) * 2),
    sinr: Math.round(28 - load / 5 - (4 - effectiveBars) * 5),
    handover: nearHandover,
    plan,
    bandwidth,
    upload: dataEligible
      ? Math.min(
          deviceHardware.maxCellularUpMbps,
          matrix.uploadCeiling *
            signalFactor *
            loadFactor *
            conditionFactor *
            handoverFactor,
        )
      : 0,
    latency,
    jitter,
    packetLoss,
    reliability: dataEligible
      ? Math.round(clamp(100 - packetLoss * 2.1, 1, 99))
      : 0,
  };
}

export function emergencyNetwork(state) {
  if (!hardwareCapabilities(state).cellular)
    return {
      reachable: false,
      reason: "Cellular modem or antenna unavailable",
    };
  if (
    state.networkLab?.weather?.mode === "Building/Underground" &&
    state.networkLab.weather.floor === "-3"
  )
    return { reachable: false, reason: "Hard cellular dead zone" };
  const probe = {
    ...state,
    radio: { ...state.radio, airplane: false },
    sim: {
      ...state.sim,
      physical: {
        ...state.sim.physical,
        installed: true,
        enabled: true,
        registered: true,
        carrier: state.sim.physical.carrier || "yettel",
        bars: 4,
        radioSelection: "Automatic",
        networkMode: "Automatic",
      },
    },
  };
  const candidates = towerCandidates(probe, "physical").filter(
    (item) => item.usable,
  );
  return candidates.length
    ? { reachable: true, tower: candidates.sort((a, b) => b.dbm - a.dbm)[0] }
    : { reachable: false, reason: "No reachable cellular network" };
}

export function connectivity(state) {
  const caps = hardwareCapabilities(state);
  const wifiConnected =
    caps.wifi && state.radio.wifi && state.wifi.connected === "TP-Link B440";
  const preferred = state.defaults.data;
  let quality = lineQuality(state, preferred);
  let key = preferred;
  if (!quality.dataEligible && state.networkLab?.autoSwitchData) {
    const alternative = preferred === "physical" ? "esim" : "physical";
    const alternateQuality = lineQuality(state, alternative);
    if (alternateQuality.dataEligible) {
      quality = alternateQuality;
      key = alternative;
    }
  }
  const cellular = quality.dataEligible;
  const wifi = {
    bandwidth: 180 * caps.wifiFactor,
    upload: 62 * caps.wifiFactor,
    latency: Math.round(18 / Math.max(0.08, caps.wifiFactor)),
    jitter: Math.round(3 / Math.max(0.08, caps.wifiFactor)),
    packetLoss: Math.max(0.1, (1 - caps.wifiFactor) * 24),
    reliability: Math.round(Math.max(1, 99 * caps.wifiFactor)),
  };
  const active = wifiConnected ? wifi : quality;
  const isOnline = wifiConnected || cellular;
  const performanceFactor = Math.max(
    0.35,
    Math.min(1, (Number(state.battery?.performanceLimit) || 100) / 100),
  );
  return {
    isOnline,
    route: wifiConnected ? "wifi" : cellular ? "cellular" : "offline",
    onlineVia: wifiConnected
      ? "Wi-Fi"
      : cellular
        ? `${quality.line.label} mobile data`
        : "Offline",
    wifiConnected,
    activeDataSIM: key,
    preferredDataSIM: preferred,
    activeCarrier: wifiConnected ? null : quality.carrier,
    carrierName: wifiConnected ? null : quality.carrierName,
    networkType: wifiConnected ? "Wi-Fi" : quality.networkType,
    signalBars: wifiConnected ? 4 : quality.bars,
    bandwidth: isOnline ? active.bandwidth * performanceFactor : 0,
    upload: isOnline ? active.upload * performanceFactor : 0,
    latency: isOnline ? Math.round(active.latency / performanceFactor) : 0,
    jitter: isOnline ? active.jitter : 0,
    packetLoss: isOnline ? active.packetLoss : 100,
    quality: !isOnline
      ? "Offline"
      : active.reliability >= 90
        ? "Excellent"
        : active.reliability >= 72
          ? "Good"
          : active.reliability >= 45
            ? "Unstable"
            : "Poor",
    reliability: isOnline ? active.reliability : 0,
    condition: wifiConnected ? "Normal" : quality.condition,
    congestion: wifiConnected ? 0 : quality.load,
    tower: wifiConnected ? null : quality.tower,
    handover: wifiConnected ? false : quality.handover,
    remainingMB: wifiConnected ? Infinity : quality.plan.remainingMB,
    dataLimited: !wifiConnected && quality.plan.exhausted,
  };
}

export function voiceBearer(state, slot = state.defaults.calls) {
  const key =
    slot === "ask"
      ? state.sim.physical.installed
        ? "physical"
        : "esim"
      : slot;
  const line = state.sim[key];
  if (!line?.installed || !line.enabled)
    return { ok: false, label: "No SIM card", shortLabel: null };
  const wifi =
    hardwareCapabilities(state).wifi &&
    state.radio.wifi &&
    state.wifi.connected === "TP-Link B440";
  const quality = lineQuality(state, key);
  if (
    wifi &&
    line.voice?.wifiCalling &&
    (line.voice.preferWifi || state.radio.airplane || !quality.registered)
  )
    return { ok: true, label: "VoWiFi", shortLabel: "VoWiFi", line: key };
  if (!quality.registered || !quality.voiceNetwork)
    return { ok: false, label: "No cellular network", shortLabel: null };
  if (quality.voiceNetwork === "5G SA")
    return {
      ok: true,
      label: "VoNR",
      shortLabel: "VoNR",
      line: key,
      network: "5G SA",
    };
  if (["5G NSA", "4G+", "4G"].includes(quality.voiceNetwork))
    return {
      ok: true,
      label:
        quality.voiceNetwork !== quality.networkType
          ? "VoLTE fallback"
          : "VoLTE",
      shortLabel: "VoLTE",
      line: key,
      network: quality.voiceNetwork,
    };
  if (quality.voiceNetwork === "3G")
    return {
      ok: true,
      label: "UMTS / 3G Voice",
      shortLabel: "UMTS",
      line: key,
      network: "3G",
    };
  if (quality.voiceNetwork === "EDGE")
    return {
      ok: true,
      label: "EDGE / GSM Voice",
      shortLabel: "GSM",
      line: key,
      network: "EDGE",
    };
  return {
    ok: false,
    label: "No compatible voice route",
    shortLabel: null,
  };
}

export function speedtestProfile(state, variation = 0) {
  const net = connectivity(state);
  if (!net.isOnline)
    return {
      ...net,
      download: 0,
      upload: 0,
      ping: 0,
      jitter: 0,
      packetLoss: 100,
    };
  const instability = clamp(
    (100 - net.reliability) / 100 + (4 - net.signalBars) * 0.08,
    0.03,
    0.65,
  );
  const wave = clamp(Number(variation) || 0, -1, 1);
  return {
    ...net,
    download: Math.max(0.001, net.bandwidth * (1 + wave * instability * 0.55)),
    upload: Math.max(0.001, net.upload * (1 - wave * instability * 0.35)),
    ping: Math.max(
      1,
      Math.round(net.latency * (1 + Math.abs(wave) * instability)),
    ),
    jitter: Math.max(1, Math.round(net.jitter * (1 + Math.abs(wave)))),
    packetLoss: clamp(net.packetLoss * (1 + Math.max(0, wave) * 0.45), 0, 100),
  };
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function downloadRate(state) {
  const net = connectivity(state);
  return net.isOnline ? Math.max(0.001, net.bandwidth / 18) : 0;
}
