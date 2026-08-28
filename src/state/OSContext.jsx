import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  CARRIERS,
  CORE_APPS,
  DATA_PLAN_MB,
  RADIO_TYPES,
  STORE_APPS,
  VOICE_PLAN_MINUTES,
  connectivity,
  downloadRate,
  emergencyNetwork,
  lineQuality,
  makeNumbers,
  normalizeRat,
  voiceBearer,
} from "../services/core.js";
import { sound } from "../services/audio.js";
import { ANTOID_SYSTEM } from "../config/version.js";
import {
  FM_MAX,
  FM_MIN,
  calculateFMReception,
  createFMState,
  scanFMEnvironment,
} from "../services/fm.js";
import {
  COMPONENT_LAYOUT,
  REPLACEMENT_PARTS,
  createHardwareState,
  createLaptopState,
  diagnoseHardware,
  hardwareCapabilities,
  makeReplacement,
} from "../services/hardware.js";
import {
  agingPerEquivalentCycle,
  batteryModel,
  cycleHealthCeiling,
} from "../services/battery.js";
import {
  automaticScan,
  discoverFrequency,
  mergeScanIntoDatabase,
} from "../services/dvb.js";
import { createLabState, migrateLabState } from "../services/lab.js";

const STORAGE_KEY = "antoid-1-os-v1";
const colorSchemeQuery = "(prefers-color-scheme: dark)";
const subscribeColorScheme = (callback) => {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(colorSchemeQuery);
  media.addEventListener?.("change", callback);
  return () => media.removeEventListener?.("change", callback);
};
const getColorScheme = () =>
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(colorSchemeQuery).matches
    : true;
const randomWifi = () => {
  const pool = [
    "HomeNet_5G",
    "DIGI_729A",
    "Apartment_24G",
    "Galaxy-WiFi",
    "CoffeeHub_5G",
    "FamilyNet-4821",
  ];
  const first = pool[Math.floor(Math.random() * pool.length)];
  let second = first;
  while (second === first)
    second = pool[Math.floor(Math.random() * pool.length)];
  return [first, second];
};
const line = (label) => ({
  label,
  carrier: null,
  installed: false,
  enabled: true,
  registered: false,
  status: "No SIM",
  network: "Automatic",
  radioSelection: "Automatic",
  networkMode: "Automatic",
  bars: 4,
  roaming: false,
  pin: "",
  voice: {
    enable5g: true,
    vonr: true,
    volte: true,
    wifiCalling: false,
    preferWifi: false,
    fallback3g: true,
    fallback2g: true,
    allow2g: true,
    automatic: true,
  },
});
const carrierOperations = () =>
  Object.fromEntries(
    Object.keys(CARRIERS).map((carrier) => [
      carrier,
      {
        All: "Normal",
        "5G SA": "Normal",
        "5G NSA": "Normal",
        "4G+": "Normal",
        "4G": "Normal",
        "3G": "Normal",
        EDGE: "Normal",
      },
    ]),
  );
const dataPlan = () => ({
  name: "5 GB",
  usedMB: 0,
  usageUnit: "MB",
  voicePlan: "100 minutes",
  usedMinutes: 0,
  cycleStart: new Date().toISOString().slice(0, 10),
});
const towerSettings = () => ({
  A: { distance: 5, strength: 100, dbmMode: "Auto", manualDbm: -65 },
  B: { distance: 8, strength: 100, dbmMode: "Auto", manualDbm: -72 },
  C: { distance: 10, strength: 100, dbmMode: "Auto", manualDbm: -82 },
});
const starterThreads = {
  mom: [
    {
      id: "m1",
      from: "Mom",
      text: "Dinner at seven? I saved you a plate. ❤️",
      time: Date.now() - 3600000,
    },
  ],
  dad: [
    {
      id: "d1",
      from: "Dad",
      text: "The new Antoid looks sharp!",
      time: Date.now() - 7200000,
    },
  ],
  grandma: [
    {
      id: "g1",
      from: "Grandma",
      text: "I baked something special for Sunday.",
      time: Date.now() - 86400000,
    },
  ],
};

export function createInitialState() {
  const nums = makeNumbers(),
    wifiNames = randomWifi();
  return {
    schema: 8,
    deskView: "phone",
    lab: createLabState(),
    maintenance: { active: false, lastRun: null },
    hardware: createHardwareState(),
    laptop: createLaptopState(),
    wallet: {
      balanceHuf: 5000,
      anPayEnabled: true,
      email: "",
      signedIn: false,
      purchases: [],
    },
    streetlight: {
      installed: false,
      purchased: false,
      dlcPurchased: false,
      masterOn: true,
      time: 21,
      weather: "Clear",
      storm: 0,
      selectedPole: 1,
      poles: Array.from({ length: 8 }, (_, index) => ({
        id: index + 1,
        technology:
          index < 2
            ? "Low-pressure sodium"
            : index < 4
              ? "Mercury vapour"
              : index < 6
                ? "High-pressure sodium"
                : index === 6
                  ? "Metal halide"
                  : "Cool LED",
        poleDesign: index % 2 ? "Aluminum tapered" : "Steel utility",
        poleMaterial: index % 2 ? "Aluminum" : "Galvanised steel",
        poleQuality: index % 2 ? 76 : 82,
        luminaire: index < 4 ? "Cobrahead Classic" : "Roadway Cutoff",
        connected: true,
        warmup: index >= 6 ? 1 : 0.2,
        lean: false,
        fallen: false,
        lit: true,
        condition: 100,
        bulb: 100,
        ballast: 100,
        capacitor: 100,
        ignitor: 100,
        fuse: 100,
        cable: 100,
        photocell: 100,
        breaker: true,
        fault: null,
      })),
      inventory: {
        bulbs: 4,
        ballasts: 2,
        capacitors: 2,
        ignitors: 2,
        fuses: 6,
        cable: 10,
        photocells: 2,
      },
      events: [],
    },
    setup: {
      done: false,
      step: 0,
      language: "English",
      appearance: "dark",
      wallpaper: "aurora",
      firstName: "",
      lastName: "",
      username: "",
      deviceName: "Antoid One",
      pin: "",
      notifications: true,
    },
    power: { mode: "off", locked: true, bootCount: 0 },
    screen: {
      app: null,
      secureApp: null,
      page: 0,
      overlay: null,
      history: [],
      recents: [],
      brightness: 80,
      rotation: false,
      recording: false,
      volumeOverlay: null,
      screenshotPreview: null,
      screenshotFlash: false,
    },
    theme: { mode: "dark", accent: "#3ce5aa", wallpaper: "aurora" },
    accessibility: {
      largeText: false,
      highContrast: false,
      reducedMotion: false,
      color: "normal",
      keyboard: true,
    },
    numbers: nums,
    tray: { open: false, card: null, selected: null },
    qr: { carrier: null, selected: false },
    sim: { physical: line("SIM 1"), esim: line("SIM 2") },
    defaults: { calls: "physical", sms: "physical", data: "physical" },
    networkLab: {
      module: "Radio",
      selectedSlot: "physical",
      shield: 0,
      load: { yettel: 15, telekom: 15, one: 15 },
      loadCarrier: "yettel",
      operations: carrierOperations(),
      operationCarrier: "yettel",
      operationNetwork: "5G SA",
      weather: { mode: "Clear", stormMultiplier: 1, floor: "Ground" },
      towers: towerSettings(),
      handover: {
        position: 8,
        auto: true,
        serving: { physical: "A", esim: "A" },
      },
      plans: { physical: dataPlan(), esim: dataPlan() },
      autoSwitchData: false,
    },
    fm: createFMState(),
    audioAccessories: {
      wiredHeadphonesConnected: false,
      mediaOutput: "Automatic",
    },
    speedtest: { history: [] },
    radio: {
      wifi: true,
      mobileData: true,
      airplane: false,
      bluetooth: false,
      hotspot: false,
      flashlight: false,
      flashlightBrightness: 80,
      flashlightMode: "Continuous",
      dnd: false,
      silent: false,
      autoRotate: true,
    },
    wifi: { connected: null, saved: false, names: wifiNames, stage: null },
    bluetooth: { paired: [], scanning: false },
    hotspot: {
      ssid: "Antoid 1",
      password: "antoid123",
      security: "WPA2/WPA3",
      devices: 0,
    },
    battery: {
      level: 87,
      charging: false,
      last: Date.now(),
      saver: false,
      saverAuto: false,
      extremeSaver: false,
      extremeSaverAuto: false,
      extremeAllowedApps: [
        "phone",
        "messages",
        "contacts",
        "clock",
        "settings",
        "fm-radio",
      ],
      history: [],
      health: 100,
      cycles: 0,
      cycleProgress: 0,
      chargedThroughputMah: 0,
      dischargedThroughputMah: 0,
      agingLoss: 0,
      condition: "Normal",
      temperature: 29,
      thermalState: "Normal",
      performanceLimit: 100,
      chargeLimitedReason: null,
      temperatureMode: "Auto",
      manualTemperature: 30,
      adaptiveCharging: true,
      protect80: false,
      chargeMode: "Fast",
      chargeTo100: false,
      usage: { System: 0, Screen: 0 },
      lastHistoryAt: Date.now(),
    },
    sound: {
      enabled: true,
      media: 70,
      call: 70,
      ringtone: 75,
      notification: 70,
      alarm: 80,
      vibration: true,
      ringtoneName: "Orbit",
      notificationName: "Dewdrop",
    },
    notifications: [
      {
        id: "welcome",
        app: "System",
        title: "Welcome to Antoid 1",
        body: "Press the power button to begin.",
        time: Date.now(),
        read: false,
      },
    ],
    notificationHistory: [],
    installed: [],
    downloads: {},
    versions: {},
    contacts: [
      {
        id: "mom",
        name: "Mom",
        number: nums.contacts.mom,
        color: "#ed6e8a",
        favorite: true,
        email: "mom@family.local",
        emergency: true,
      },
      {
        id: "dad",
        name: "Dad",
        number: nums.contacts.dad,
        color: "#5d9bec",
        favorite: true,
        email: "dad@family.local",
      },
      {
        id: "grandma",
        name: "Grandma",
        number: nums.contacts.grandma,
        color: "#b37adb",
        favorite: true,
        email: "grandma@family.local",
        notes: "Mom’s mother",
      },
      {
        id: "alex",
        name: "Alex Kovács",
        number: nums.contacts.alex,
        color: "#4dc4ad",
        email: "alex@local.net",
      },
      {
        id: "doctor",
        name: "Dr. Varga",
        number: nums.contacts.doctor,
        color: "#ef9a52",
      },
    ],
    messages: structuredClone(starterThreads),
    messenger: structuredClone(starterThreads),
    calls: [],
    activeCall: null,
    photos: [
      {
        id: "wall1",
        title: "Aurora Glass",
        kind: "generated",
        colors: ["#073f3d", "#2f69bd", "#8b45b8"],
        favorite: true,
        trash: false,
        rotation: 0,
        brightness: 100,
        contrast: 100,
      },
    ],
    notes: [
      {
        id: "n1",
        title: "Welcome",
        body: "Antoid 1 keeps your notes locally. Pin, label, archive or restore them any time.",
        color: "#d9b843",
        pinned: true,
        archived: false,
        trash: false,
      },
    ],
    events: [
      {
        id: "e1",
        title: "Family lunch",
        date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        time: "13:00",
        reminder: true,
        repeat: "none",
      },
    ],
    alarms: [{ id: "a1", time: "07:30", label: "Morning", enabled: false }],
    timers: [],
    stopwatch: { running: false, started: 0, elapsed: 0, laps: [] },
    files: [
      {
        id: "f1",
        name: "Antoid 1 Guide.txt",
        type: "Document",
        size: "12 KB",
        trash: false,
      },
      {
        id: "f2",
        name: "Antoid Nights.mix",
        type: "Audio",
        size: "4.2 MB",
        trash: false,
      },
    ],
    browser: {
      tabs: [{ id: "t1", title: "Antoid Search", page: "Search" }],
      active: "t1",
      history: [],
      bookmarks: ["Antoid Help"],
      private: false,
      desktop: false,
      dailyQuestions: {
        votes: {},
        saved: [],
        reported: [],
        questions: [],
        comments: [],
        sort: "Top Question",
      },
    },
    weather: {
      city: "Budapest",
      unit: "C",
      temp: 23,
      condition: "Clear",
      updated: Date.now(),
      cities: ["Budapest"],
    },
    emails: [
      {
        id: "mail1",
        folder: "inbox",
        from: "Antoid Team",
        to: "",
        subject: "Welcome to Antoid ID",
        body: "Your Antoid ID connects local services, the Antoid Store, security and customization—privately on this device.",
        read: false,
        starred: true,
        time: Date.now(),
      },
    ],
    mailDraft: { to: "", subject: "", body: "" },
    social: {
      youtube: {
        likes: [],
        dislikes: [],
        subscribed: [],
        watchLater: [],
        history: [],
        comments: [],
        playing: null,
        progress: 0,
        captions: true,
        speed: 1,
        volume: 70,
        mini: false,
      },
      facebook: { posts: [], saved: [], reactions: {} },
      instagram: { liked: [], saved: [], viewed: [], posts: [], dms: [] },
      spotify: {
        liked: false,
        progress: 0,
        playing: false,
        volume: 60,
        shuffle: false,
        repeat: false,
        playlists: ["Night Drive"],
      },
    },
    clipboard: [],
    permissions: {
      camera: false,
      microphone: false,
      location: false,
      notifications: true,
    },
    wellbeing: { focus: false, screenTime: {} },
    system: {
      build: ANTOID_SYSTEM.build,
      updateProgress: 0,
      updateStatus: "Current",
      storageUsed: 4.8,
      emergency: "Owner • Blood type unknown",
      lastBackup: null,
    },
    modal: null,
    toast: null,
    developer: {
      unlocked: false,
      buildTaps: 0,
      timelinePaused: false,
      timeline: [],
      timelineFilters: {
        physical: true,
        esim: true,
        wifi: true,
        hardware: true,
        power: true,
        damage: true,
        repair: true,
        temperature: true,
        water: true,
        usb: true,
        system: true,
      },
    },
    calculator: {
      display: "0",
      history: [],
      memory: 0,
      mode: "Basic",
      converter: { category: "Data", from: "GB", to: "MB", value: 5 },
      mathNotes: [
        {
          id: "math-1",
          title: "Scratchpad",
          body: "1+1=2",
          strokes: [],
          updated: Date.now(),
        },
      ],
      activeMathNote: "math-1",
      autoCalculate: true,
      handwritingCorrection: false,
    },
  };
}

function merge(base, saved) {
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) return base;
  const object = (value) =>
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const array = (value, fallback) => (Array.isArray(value) ? value : fallback);
  const finite = (value, fallback, min = -Infinity, max = Infinity) => {
    if (value === null || value === undefined || value === "") return fallback;
    const numeric = Number(value);
    return Number.isFinite(numeric)
      ? Math.max(min, Math.min(max, numeric))
      : fallback;
  };
  const out = { ...base, ...saved };
  for (const key of Object.keys(base))
    if (base[key] && typeof base[key] === "object" && !Array.isArray(base[key]))
      out[key] = { ...base[key], ...(saved[key] || {}) };
  out.sim = {
    physical: {
      ...base.sim.physical,
      ...saved.sim?.physical,
      voice: { ...base.sim.physical.voice, ...saved.sim?.physical?.voice },
    },
    esim: {
      ...base.sim.esim,
      ...saved.sim?.esim,
      voice: { ...base.sim.esim.voice, ...saved.sim?.esim?.voice },
    },
  };
  for (const slot of ["physical", "esim"]) {
    const oldNetwork =
      saved.sim?.[slot]?.radioSelection ??
      saved.sim?.[slot]?.network ??
      out.sim[slot].radioSelection ??
      out.sim[slot].network;
    out.sim[slot].radioSelection =
      oldNetwork === "Automatic" ? "Automatic" : normalizeRat(oldNetwork);
    out.sim[slot].network = out.sim[slot].radioSelection;
    out.sim[slot].networkMode ||= "Automatic";
  }
  out.networkLab = {
    ...base.networkLab,
    ...saved.networkLab,
    load: { ...base.networkLab.load, ...saved.networkLab?.load },
    handover: {
      ...base.networkLab.handover,
      ...saved.networkLab?.handover,
      serving: {
        ...base.networkLab.handover.serving,
        ...saved.networkLab?.handover?.serving,
      },
    },
    weather: {
      ...base.networkLab.weather,
      ...saved.networkLab?.weather,
    },
    towers: Object.fromEntries(
      Object.keys(base.networkLab.towers).map((tower) => [
        tower,
        {
          ...base.networkLab.towers[tower],
          ...saved.networkLab?.towers?.[tower],
        },
      ]),
    ),
    plans: {
      physical: {
        ...base.networkLab.plans.physical,
        ...saved.networkLab?.plans?.physical,
      },
      esim: {
        ...base.networkLab.plans.esim,
        ...saved.networkLab?.plans?.esim,
      },
    },
    operations: Object.fromEntries(
      Object.keys(CARRIERS).map((carrier) => [
        carrier,
        {
          ...base.networkLab.operations[carrier],
          ...saved.networkLab?.operations?.[carrier],
        },
      ]),
    ),
  };
  if (out.networkLab.operationNetwork === "5G")
    out.networkLab.operationNetwork = "5G SA";
  for (const carrier of Object.keys(CARRIERS)) {
    const legacy5g = saved.networkLab?.operations?.[carrier]?.["5G"];
    if (legacy5g) {
      out.networkLab.operations[carrier]["5G SA"] = legacy5g;
      out.networkLab.operations[carrier]["5G NSA"] = legacy5g;
    }
  }
  out.battery = {
    ...base.battery,
    ...saved.battery,
    usage: { ...base.battery.usage, ...saved.battery?.usage },
  };
  out.browser = {
    ...base.browser,
    ...saved.browser,
    dailyQuestions: {
      ...base.browser.dailyQuestions,
      ...saved.browser?.dailyQuestions,
    },
  };
  out.developer = {
    ...base.developer,
    ...saved.developer,
    timelineFilters: {
      ...base.developer.timelineFilters,
      ...saved.developer?.timelineFilters,
    },
  };
  const savedHasHardware = !!saved.hardware?.components;
  const normalizeInventoryPart = (item) => {
    if (!item || typeof item !== "object") return item;
    const defaults = base.hardware.components[item.id] || {};
    const approvedSupra = [
      "storage",
      "usbBoard",
      "wideCamera",
      "ultrawideCamera",
      "telephotoCamera",
    ].includes(item.id);
    const wasSupra =
      item.manufacturer === "Supra" ||
      item.manufacturer === "Supra Electronics";
    const manufacturer = wasSupra
      ? approvedSupra
        ? "Supra Electronics"
        : "Independent aftermarket"
      : item.manufacturer;
    return {
      ...defaults,
      ...item,
      manufacturer,
      serviceName:
        wasSupra && !approvedSupra
          ? String(item.serviceName || item.name || defaults.name).replace(
              /Supra/gi,
              "Aftermarket",
            )
          : item.serviceName,
      description: item.description || defaults.description,
      keywords: Array.isArray(item.keywords)
        ? item.keywords
        : defaults.keywords,
    };
  };
  out.hardware = {
    ...base.hardware,
    ...object(saved.hardware),
    components: Object.fromEntries(
      Object.entries(base.hardware.components).map(([id, defaults]) => [
        id,
        { ...defaults, ...object(saved.hardware?.components?.[id]) },
      ]),
    ),
    inventory: {
      ...base.hardware.inventory,
      ...object(saved.hardware?.inventory),
      packages: array(
        saved.hardware?.inventory?.packages,
        base.hardware.inventory.packages,
      ).map(normalizeInventoryPart),
      removed: array(
        saved.hardware?.inventory?.removed,
        base.hardware.inventory.removed,
      ).map(normalizeInventoryPart),
    },
    temperatures: {
      ...base.hardware.temperatures,
      ...object(saved.hardware?.temperatures),
    },
    water: { ...base.hardware.water, ...object(saved.hardware?.water) },
    drop: { ...base.hardware.drop, ...object(saved.hardware?.drop) },
    unboxing: savedHasHardware
      ? { ...base.hardware.unboxing, ...object(saved.hardware?.unboxing) }
      : { complete: true, stage: 5, chargerUnlocked: true },
    faults: array(saved.hardware?.faults, base.hardware.faults),
  };
  if (!["Teardown", "Repair"].includes(out.hardware.mode))
    out.hardware.mode = "Teardown";
  if (!["front", "back"].includes(out.hardware.view))
    out.hardware.view = "front";
  // 3.0 accidentally shipped a 64 GB UFS 3.1 factory module. Migrate only that
  // known stock part; aftermarket modules and exact removed inventory stay intact.
  const storedStorage = saved.hardware?.components?.storage;
  const isAccidentalFactoryStorage =
    storedStorage &&
    storedStorage.manufacturer === "Genuine" &&
    Number(storedStorage.capacityGb) === 64 &&
    storedStorage.type === "UFS 3.1" &&
    (!storedStorage.serviceName || storedStorage.serial === "ANT-STORAGE-001");
  if (!savedHasHardware || isAccidentalFactoryStorage)
    out.hardware.components.storage = {
      ...base.hardware.components.storage,
      installed: storedStorage?.installed ?? true,
      connected: storedStorage?.connected ?? true,
      condition: storedStorage?.condition ?? 100,
      waterExposure: storedStorage?.waterExposure ?? 0,
      destroyed: storedStorage?.destroyed ?? false,
    };
  out.laptop = {
    ...base.laptop,
    ...object(saved.laptop),
    unboxing: saved.laptop
      ? { ...base.laptop.unboxing, ...object(saved.laptop?.unboxing) }
      : { complete: false, stage: 0, chargerUnlocked: false },
    diagnostics: array(saved.laptop?.diagnostics, base.laptop.diagnostics),
  };
  out.wallet = {
    ...base.wallet,
    ...object(saved.wallet),
    purchases: array(saved.wallet?.purchases, base.wallet.purchases),
  };
  out.streetlight = {
    ...base.streetlight,
    ...object(saved.streetlight),
    poles: array(saved.streetlight?.poles, base.streetlight.poles).map(
      (pole, index) => ({
        ...base.streetlight.poles[index % base.streetlight.poles.length],
        ...object(pole),
      }),
    ),
    inventory: {
      ...base.streetlight.inventory,
      ...object(saved.streetlight?.inventory),
    },
    events: array(saved.streetlight?.events, base.streetlight.events),
  };
  out.calculator = {
    ...base.calculator,
    ...saved.calculator,
    converter: {
      ...base.calculator.converter,
      ...saved.calculator?.converter,
    },
  };
  // A saved branch may predate Antoid OS 2.0 or be partially malformed. Keep
  // recoverable values, but normalize every field used during root rendering.
  for (const key of Object.keys(base))
    if (Array.isArray(base[key])) out[key] = array(saved[key], base[key]);
  out.schema = 8;
  out.lab = migrateLabState(saved.lab);
  delete out.hardware.preview;
  out.screen = {
    ...base.screen,
    ...object(saved.screen),
    history: array(saved.screen?.history, base.screen.history),
    recents: array(saved.screen?.recents, base.screen.recents),
  };
  out.fm = {
    ...base.fm,
    ...object(saved.fm),
    favorites: array(saved.fm?.favorites, base.fm.favorites),
    scanned: array(saved.fm?.scanned, base.fm.scanned),
    transmitters: base.fm.transmitters.map((defaults) => ({
      ...defaults,
      ...object(
        array(saved.fm?.transmitters, []).find(
          (candidate) => candidate?.id === defaults.id,
        ),
      ),
    })),
  };
  out.audioAccessories = {
    ...base.audioAccessories,
    ...object(saved.audioAccessories),
  };
  out.sim.physical.bars = finite(out.sim.physical.bars, 4, 0, 4);
  out.sim.esim.bars = finite(out.sim.esim.bars, 4, 0, 4);
  const modules = [
    "Phone Disassembly",
    "RS Controller",
    "Radio",
    "Signal Shield",
    "Network Load",
    "Carrier Operations",
    "Cell Handover",
    "Weather",
    "Plan & Usage",
    "Battery",
  ];
  if (out.networkLab.module === "Data Plan")
    out.networkLab.module = "Plan & Usage";
  if (!modules.includes(out.networkLab.module)) out.networkLab.module = "Radio";
  out.networkLab.shield = finite(out.networkLab.shield, 0, 0, 100);
  out.networkLab.handover.position = finite(
    out.networkLab.handover.position,
    8,
    0,
    100,
  );
  for (const carrier of Object.keys(CARRIERS))
    out.networkLab.load[carrier] = finite(
      out.networkLab.load[carrier],
      base.networkLab.load[carrier],
      0,
      100,
    );
  for (const tower of Object.keys(base.networkLab.towers)) {
    const settings = out.networkLab.towers[tower];
    settings.distance = finite(
      settings.distance,
      base.networkLab.towers[tower].distance,
      0,
      80,
    );
    settings.strength = finite(
      settings.strength,
      base.networkLab.towers[tower].strength,
      0,
      150,
    );
    settings.manualDbm = finite(
      settings.manualDbm,
      base.networkLab.towers[tower].manualDbm,
      -125,
      -55,
    );
    if (!["Auto", "Manual"].includes(settings.dbmMode))
      settings.dbmMode = "Auto";
  }
  for (const slot of ["physical", "esim"]) {
    const plan = out.networkLab.plans[slot];
    plan.usedMB = finite(plan.usedMB, 0, 0);
    plan.usedMinutes = finite(plan.usedMinutes, 0, 0);
    if (!Object.hasOwn(DATA_PLAN_MB, plan.name)) plan.name = "5 GB";
    if (!Object.hasOwn(VOICE_PLAN_MINUTES, plan.voicePlan))
      plan.voicePlan = "100 minutes";
    if (!["MB", "GB"].includes(plan.usageUnit)) plan.usageUnit = "MB";
  }
  const legacyCycles = finite(out.battery.cycles, base.battery.cycles, 0, 5000);
  const migratedCycleProgress =
    saved.schema >= 7
      ? finite(out.battery.cycleProgress, 0, 0, 0.999999)
      : legacyCycles - Math.floor(legacyCycles);
  out.battery = {
    ...out.battery,
    level: finite(out.battery.level, base.battery.level, 0, 100),
    health: finite(out.battery.health, base.battery.health, 20, 100),
    cycles: Math.floor(legacyCycles),
    cycleProgress: migratedCycleProgress,
    chargedThroughputMah: finite(out.battery.chargedThroughputMah, 0, 0),
    dischargedThroughputMah: finite(out.battery.dischargedThroughputMah, 0, 0),
    agingLoss: finite(out.battery.agingLoss, 0, 0, 80),
    temperature: finite(
      out.battery.temperature,
      base.battery.temperature,
      0,
      60,
    ),
    manualTemperature: finite(
      out.battery.manualTemperature,
      base.battery.manualTemperature,
      0,
      60,
    ),
    last: finite(out.battery.last, Date.now(), 0),
    lastHistoryAt: finite(out.battery.lastHistoryAt, Date.now(), 0),
    history: array(out.battery.history, base.battery.history),
    usage: { ...base.battery.usage, ...object(out.battery.usage) },
    extremeAllowedApps: array(
      out.battery.extremeAllowedApps,
      base.battery.extremeAllowedApps,
    ),
  };
  out.battery.health = Math.min(
    out.battery.health,
    cycleHealthCeiling(out.battery.cycles + out.battery.cycleProgress),
  );
  out.browser.tabs = array(out.browser.tabs, base.browser.tabs);
  if (!out.browser.tabs.length) out.browser.tabs = base.browser.tabs;
  out.browser.history = array(out.browser.history, base.browser.history);
  out.browser.bookmarks = array(out.browser.bookmarks, base.browser.bookmarks);
  for (const key of ["saved", "reported", "questions", "comments"])
    out.browser.dailyQuestions[key] = array(
      out.browser.dailyQuestions[key],
      base.browser.dailyQuestions[key],
    );
  out.developer.timeline = array(
    out.developer.timeline,
    base.developer.timeline,
  );
  out.calculator.history = array(
    out.calculator.history,
    base.calculator.history,
  );
  out.calculator.mathNotes = array(
    out.calculator.mathNotes,
    base.calculator.mathNotes,
  );
  if (!out.calculator.mathNotes.length)
    out.calculator.mathNotes = base.calculator.mathNotes;
  out.social = Object.fromEntries(
    Object.entries(base.social).map(([app, defaults]) => [
      app,
      { ...defaults, ...object(saved.social?.[app]) },
    ]),
  );
  for (const [app, defaults] of Object.entries(base.social))
    for (const [key, fallback] of Object.entries(defaults))
      if (Array.isArray(fallback))
        out.social[app][key] = array(out.social[app][key], fallback);
  return out;
}
export function migrateState(saved) {
  return merge(createInitialState(), saved);
}
function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  try {
    const restored = migrateState(JSON.parse(raw));
    restored.lab.activeDevice = "welcome";
    return restored;
  } catch {
    // Invalid JSON cannot be field-migrated. Retain a recovery copy before
    // removing the unreadable active value so future launches can boot.
    try {
      localStorage.setItem(`${STORAGE_KEY}-unreadable-backup`, raw);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable in privacy modes; the in-memory default
      // still keeps the app usable for this session.
    }
    return createInitialState();
  }
}
const setPath = (obj, path, value) => {
  const keys = path.split("."),
    copy = { ...obj };
  let p = copy;
  for (let i = 0; i < keys.length - 1; i++) {
    p[keys[i]] = Array.isArray(p[keys[i]])
      ? [...p[keys[i]]]
      : { ...p[keys[i]] };
    p = p[keys[i]];
  }
  p[keys.at(-1)] = typeof value === "function" ? value(p[keys.at(-1)]) : value;
  return copy;
};
const notice = (state, title, body, app = "System") => ({
  ...state,
  notifications: [
    {
      id: crypto.randomUUID?.() || String(Date.now()),
      title,
      body,
      app,
      time: Date.now(),
      read: false,
    },
    ...state.notifications,
  ].slice(0, 80),
});

function addDataUsage(state, slot, amountMB) {
  if (!amountMB || amountMB <= 0) return state;
  const current = state.networkLab.plans[slot];
  const allowance = DATA_PLAN_MB[current.name] ?? DATA_PLAN_MB["5 GB"];
  const usedMB = Math.max(0, current.usedMB + amountMB);
  let next = {
    ...state,
    networkLab: {
      ...state.networkLab,
      plans: {
        ...state.networkLab.plans,
        [slot]: { ...current, usedMB },
      },
    },
  };
  if (
    Number.isFinite(allowance) &&
    current.usedMB < allowance &&
    usedMB >= allowance
  )
    next = notice(
      next,
      "Mobile data limit reached",
      `${state.sim[slot].label} remains registered for calls and SMS. Connect Wi-Fi or start a new billing cycle.`,
    );
  return next;
}

function addVoiceUsage(state, slot, minutes) {
  if (!minutes || minutes <= 0 || !state.networkLab.plans[slot]) return state;
  const current = state.networkLab.plans[slot];
  const allowance =
    VOICE_PLAN_MINUTES[current.voicePlan] ?? VOICE_PLAN_MINUTES["100 minutes"];
  const usedMinutes = Math.max(0, (current.usedMinutes || 0) + minutes);
  let next = {
    ...state,
    networkLab: {
      ...state.networkLab,
      plans: {
        ...state.networkLab.plans,
        [slot]: { ...current, usedMinutes },
      },
    },
  };
  if (
    Number.isFinite(allowance) &&
    (current.usedMinutes || 0) < allowance &&
    usedMinutes >= allowance
  )
    next = notice(
      next,
      "Voice minutes exhausted",
      `${state.sim[slot].label} can still receive calls and place emergency calls.`,
      "Phone",
    );
  return next;
}

function batteryCondition(health) {
  return health >= 85
    ? "Normal"
    : health >= 65
      ? "Degraded"
      : "Service recommended";
}

export function reducer(state, action) {
  switch (action.type) {
    case "SET": {
      const caps = hardwareCapabilities(state);
      const denied =
        (action.path.startsWith("radio.flashlight") &&
          action.value &&
          !caps.flashlight) ||
        (action.path === "radio.wifi" && action.value && !caps.wifi) ||
        (action.path === "radio.bluetooth" &&
          action.value &&
          !caps.bluetooth) ||
        (action.path === "radio.autoRotate" &&
          action.value &&
          (!caps.sensors.accelerometer || !caps.sensors.gyroscope)) ||
        (action.path === "battery.charging" &&
          action.value &&
          !caps.wiredPowerPath);
      if (denied)
        return {
          ...state,
          toast: {
            message: "Required hardware is missing, disconnected or damaged",
            time: Date.now(),
          },
        };
      if (action.path === "battery.saver")
        return {
          ...state,
          battery: {
            ...state.battery,
            saver: Boolean(action.value),
            saverAuto: false,
            extremeSaver: action.value ? false : state.battery.extremeSaver,
            extremeSaverAuto: action.value
              ? false
              : state.battery.extremeSaverAuto,
          },
        };
      if (action.path === "battery.extremeSaver")
        return {
          ...state,
          battery: {
            ...state.battery,
            extremeSaver: Boolean(action.value),
            extremeSaverAuto: false,
            saver: action.value ? false : state.battery.saver,
            saverAuto: action.value ? false : state.battery.saverAuto,
          },
        };
      if (action.path === "battery.health") {
        const health = Math.max(20, Math.min(100, Number(action.value) || 20));
        const chemicalCondition = Math.max(5, 40 + health * 0.6);
        const previousChemicalCondition = Math.max(
          5,
          40 + Number(state.battery.health || 100) * 0.6,
        );
        const physicalCondition = state.hardware.components.battery.condition;
        const independentlyDamaged =
          physicalCondition < previousChemicalCondition - 0.5;
        return {
          ...state,
          battery: {
            ...state.battery,
            health,
            condition: batteryCondition(health),
          },
          hardware: {
            ...state.hardware,
            components: {
              ...state.hardware.components,
              battery: {
                ...state.hardware.components.battery,
                condition: independentlyDamaged
                  ? Math.min(physicalCondition, chemicalCondition)
                  : chemicalCondition,
              },
            },
          },
        };
      }
      if (action.path === "battery.cycles") {
        const cycles = Math.max(
          0,
          Math.min(5000, Math.floor(Number(action.value) || 0)),
        );
        const health = Math.min(
          state.battery.health,
          cycleHealthCeiling(cycles),
        );
        const chemicalCondition = Math.max(5, 40 + health * 0.6);
        const previousChemicalCondition = Math.max(
          5,
          40 + Number(state.battery.health || 100) * 0.6,
        );
        const physicalCondition = state.hardware.components.battery.condition;
        const independentlyDamaged =
          physicalCondition < previousChemicalCondition - 0.5;
        return {
          ...state,
          battery: {
            ...state.battery,
            cycles,
            health,
            condition: batteryCondition(health),
          },
          hardware: {
            ...state.hardware,
            components: {
              ...state.hardware.components,
              battery: {
                ...state.hardware.components.battery,
                condition: independentlyDamaged
                  ? Math.min(physicalCondition, chemicalCondition)
                  : chemicalCondition,
              },
            },
          },
        };
      }
      if (action.path === "battery.manualTemperature") {
        const temperature = Math.max(
          -10,
          Math.min(65, Number(action.value) || 0),
        );
        const battery = {
          ...state.battery,
          manualTemperature: temperature,
          ...(state.battery.temperatureMode === "Manual"
            ? { temperature }
            : {}),
        };
        return {
          ...state,
          battery,
          hardware:
            state.battery.temperatureMode === "Manual"
              ? {
                  ...state.hardware,
                  temperatures: {
                    ...state.hardware.temperatures,
                    battery: temperature,
                  },
                }
              : state.hardware,
        };
      }
      if (
        action.path === "battery.temperatureMode" &&
        action.value === "Manual"
      ) {
        const temperature = Number(state.battery.manualTemperature);
        return {
          ...state,
          battery: { ...state.battery, temperatureMode: "Manual", temperature },
          hardware: {
            ...state.hardware,
            temperatures: {
              ...state.hardware.temperatures,
              battery: temperature,
            },
          },
        };
      }
      if (action.path === "battery.charging") {
        const next = setPath(state, action.path, action.value);
        if (!action.value && !caps.battery)
          return {
            ...next,
            power: { ...state.power, mode: "off", locked: true },
            radio: { ...state.radio, flashlight: false },
            toast: {
              message: "External power disconnected · immediate power loss",
              time: Date.now(),
            },
          };
        const nextCaps = hardwareCapabilities(next);
        if (
          action.value &&
          nextCaps.externalPower &&
          nextCaps.board &&
          nextCaps.storage
        )
          return {
            ...next,
            power: {
              ...state.power,
              mode: "booting",
              locked: true,
              bootCount: state.power.bootCount + 1,
            },
            toast: {
              message: "External USB-C power · battery not installed",
              time: Date.now(),
            },
          };
        return next;
      }
      const next = setPath(state, action.path, action.value);
      if (action.path === "radio.flashlightMode")
        return reducer(next, {
          type: "LOG_SYSTEM_EVENT",
          event: {
            source: "power",
            category: "power",
            type: "Flashlight mode changed",
            message: `Flashlight mode changed to ${action.value}`,
          },
        });
      return next;
    }
    case "LAB_AUTO_SCAN": {
      const device = action.device === "decoder" ? "decoder" : "utv";
      const result = automaticScan(state, device);
      return setPath(state, `lab.${device}`, {
        ...state.lab[device],
        scan: {
          status: "scanning",
          frequency: result.frequencies[0] || null,
          progress: 0,
          tv: 0,
          radio: 0,
          message: "Preparing automatic frequency search…",
          plan: result.frequencies,
          index: 0,
          foundServices: [],
          mode: "automatic",
        },
      });
    }
    case "LAB_MANUAL_SCAN": {
      const device = action.device === "decoder" ? "decoder" : "utv";
      const frequency = Math.max(
        470000,
        Math.min(790000, Math.round(Number(action.frequency) || 0)),
      );
      return setPath(state, `lab.${device}`, {
        ...state.lab[device],
        manualFrequency: frequency,
        scan: {
          status: "scanning",
          frequency,
          progress: 10,
          tv: 0,
          radio: 0,
          message: `Tuning ${frequency} kHz…`,
          plan: [frequency, frequency],
          index: 0,
          foundServices: [],
          mode: "manual",
        },
      });
    }
    case "LAB_SCAN_TICK": {
      const device = action.device === "decoder" ? "decoder" : "utv";
      const tuner = state.lab[device];
      const scan = tuner.scan;
      if (scan.status !== "scanning" || !scan.plan?.length) return state;
      const frequency = scan.plan[scan.index];
      if (frequency == null) return state;
      const result = discoverFrequency(state, frequency, device);
      const foundServices = mergeScanIntoDatabase(
        scan.foundServices || [],
        result.services,
      );
      const nextIndex = scan.index + 1;
      const complete = nextIndex >= scan.plan.length;
      const tv = foundServices.filter(
        (service) => service.type === "tv",
      ).length;
      const radio = foundServices.length - tv;
      const database = complete
        ? mergeScanIntoDatabase(tuner.storedChannels, foundServices)
        : tuner.storedChannels;
      const locked = Boolean(result.reception?.locked);
      return setPath(state, `lab.${device}`, {
        ...tuner,
        storedChannels: database,
        currentChannelId:
          tuner.currentChannelId || (complete ? database[0]?.id || null : null),
        scan: {
          ...scan,
          status: complete ? "complete" : "scanning",
          frequency,
          progress: complete
            ? 100
            : Math.max(1, Math.round((nextIndex / scan.plan.length) * 100)),
          tv,
          radio,
          index: nextIndex,
          foundServices,
          message: complete
            ? foundServices.length
              ? `${tv} TV and ${radio} radio services found and stored.`
              : "No channels found. Check antenna connection and position."
            : `${locked ? "Locked" : "Searching"} ${frequency} kHz · ${tv} TV, ${radio} radio found`,
        },
      });
    }
    case "LAB_TUNE_CHANNEL": {
      const device = action.device === "decoder" ? "decoder" : "utv";
      if (
        !state.lab[device].storedChannels.some((item) => item.id === action.id)
      )
        return state;
      return setPath(state, `lab.${device}`, {
        ...state.lab[device],
        currentChannelId: action.id,
        tuningUntil: Date.now() + 360,
      });
    }
    case "DECODER_UPDATE_START": {
      if (state.lab.decoder.power !== "on" || !state.lab.cables.decoderPower)
        return {
          ...state,
          toast: {
            message: "Power the Decoder before starting an update",
            time: Date.now(),
          },
        };
      const firmware = state.lab.decoder.firmware;
      return setPath(state, "lab.decoder", {
        ...state.lab.decoder,
        page: "update",
        firmware: {
          ...firmware,
          status: "checking",
          progress: 0,
          message: "Contacting the Antoid update service…",
        },
      });
    }
    case "DECODER_UPDATE_TICK": {
      const decoder = state.lab.decoder;
      const firmware = decoder.firmware;
      const fail = (message, recovery = false) =>
        setPath(state, "lab.decoder", {
          ...decoder,
          page: recovery ? "recovery" : "update",
          firmware: { ...firmware, status: "failed", message },
        });
      if (firmware.status === "checking") {
        if (firmware.fault === "server")
          return fail(
            "Update server unavailable. Check the network or retry later.",
          );
        if (firmware.version === firmware.availableVersion)
          return setPath(state, "lab.decoder", {
            ...decoder,
            page: "system",
            firmware: {
              ...firmware,
              status: "complete",
              progress: 100,
              message: `Software is up to date · firmware ${firmware.version}`,
            },
          });
        return setPath(state, "lab.decoder.firmware", {
          ...firmware,
          status: "downloading",
          progress: 5,
          message: `Downloading firmware ${firmware.availableVersion}…`,
        });
      }
      if (firmware.status === "downloading") {
        if (firmware.fault === "interrupted")
          return fail(
            "Update interrupted. Decoder recovery is required.",
            true,
          );
        const progress = Math.min(100, firmware.progress + 19);
        return setPath(state, "lab.decoder.firmware", {
          ...firmware,
          status: progress >= 100 ? "verifying" : "downloading",
          progress,
          message:
            progress >= 100
              ? "Verifying signed firmware package…"
              : `Downloading firmware ${firmware.availableVersion}…`,
        });
      }
      if (firmware.status === "verifying") {
        if (["corrupt", "verification"].includes(firmware.fault))
          return fail("Firmware signature verification failed.", true);
        return setPath(state, "lab.decoder.firmware", {
          ...firmware,
          status: "installing",
          progress: 0,
          message: "Installing firmware. Do not disconnect power.",
        });
      }
      if (firmware.status === "installing") {
        const progress = Math.min(100, firmware.progress + 24);
        return setPath(state, "lab.decoder.firmware", {
          ...firmware,
          status: progress >= 100 ? "restarting" : "installing",
          progress,
          message:
            progress >= 100
              ? "Installation complete. Restarting Decoder…"
              : "Installing firmware. Do not disconnect power.",
        });
      }
      if (firmware.status === "restarting") {
        if (firmware.fault === "boot")
          return fail(
            "New firmware could not boot. Recovery mode started.",
            true,
          );
        return setPath(state, "lab.decoder", {
          ...decoder,
          page: "system",
          bootedAt: Date.now(),
          lastBootReason: "Firmware update",
          firmware: {
            ...firmware,
            version: firmware.availableVersion,
            build: "4004.260828",
            buildDate: "2026-08-28",
            status: "complete",
            progress: 100,
            message: `Update complete · firmware ${firmware.availableVersion}`,
            lastUpdate: Date.now(),
          },
        });
      }
      return state;
    }
    case "DECODER_RECOVERY": {
      const mode = action.mode;
      if (mode === "retry") {
        const cleared = setPath(state, "lab.decoder.firmware.fault", "none");
        return reducer(cleared, { type: "DECODER_UPDATE_START" });
      }
      if (mode === "factory") {
        const fresh = createLabState().decoder;
        return setPath(state, "lab.decoder", {
          ...fresh,
          power: "on",
          page: "system",
          lastBootReason: "Recovery factory reset",
        });
      }
      return setPath(state, "lab.decoder", {
        ...state.lab.decoder,
        power: "on",
        page: "system",
        bootedAt: Date.now(),
        lastBootReason:
          mode === "restore" ? "Recovery firmware restore" : "Recovery restart",
        firmware: {
          ...state.lab.decoder.firmware,
          version:
            mode === "restore" ? "4.0.3" : state.lab.decoder.firmware.version,
          build:
            mode === "restore"
              ? "4003.260823"
              : state.lab.decoder.firmware.build,
          buildDate:
            mode === "restore"
              ? "2026-08-23"
              : state.lab.decoder.firmware.buildDate,
          status: "idle",
          progress: 0,
          fault: "none",
          lastUpdate:
            mode === "restore" ? null : state.lab.decoder.firmware.lastUpdate,
          message:
            mode === "restore"
              ? "Factory firmware restored successfully."
              : "Decoder restarted from recovery.",
        },
      });
    }
    case "UTV_FACTORY_RESET": {
      const fresh = createLabState().utv;
      return {
        ...state,
        lab: {
          ...state.lab,
          utv: { ...fresh, power: state.lab.utv.power },
        },
        toast: {
          message: "UTV software reset complete · physical Lab state preserved",
          time: Date.now(),
        },
      };
    }
    case "LAB_REPACK":
      return {
        ...state,
        lab: createLabState(),
        toast: {
          message: "Antoid Lab devices and accessories repacked",
          time: Date.now(),
        },
      };
    case "PATCH":
      const removed = {
        ...state,
        [action.key]: { ...state[action.key], ...action.value },
      };
    case "TOAST":
      return {
        ...state,
        toast: action.message
          ? { message: action.message, time: Date.now() }
          : null,
      };
    case "MODAL":
      return { ...state, modal: action.modal };
    case "POWER":
      return { ...state, power: { ...state.power, ...action.value } };
    case "SLEEP":
      return {
        ...state,
        power: { ...state.power, mode: "sleep", locked: true },
        screen: {
          ...state.screen,
          overlay: null,
          secureApp: null,
          volumeOverlay: null,
        },
      };
    case "WAKE":
      return state.power.mode === "sleep"
        ? {
            ...state,
            power: { ...state.power, mode: "on", locked: true },
            screen: { ...state.screen, overlay: null, secureApp: null },
          }
        : state;
    case "OPEN_SECURE_CAMERA":
      if (!state.power.locked) return state;
      return {
        ...state,
        power: { ...state.power, mode: "on", locked: true },
        screen: {
          ...state.screen,
          app: "camera",
          secureApp: "camera",
          overlay: null,
        },
      };
    case "BOOT":
      if (
        !hardwareCapabilities(state).board ||
        !hardwareCapabilities(state).powerAvailable ||
        !hardwareCapabilities(state).storage
      )
        return {
          ...state,
          toast: {
            message:
              "Antoid 1 cannot boot: check the logic board, power source and storage",
            time: Date.now(),
          },
        };
      if (hardwareCapabilities(state).battery && state.battery.level < 3)
        return {
          ...state,
          toast: {
            message: "Charge to at least 3% to start Antoid 1",
            time: Date.now(),
          },
        };
      return {
        ...state,
        power: {
          mode: "booting",
          locked: true,
          bootCount: state.power.bootCount + 1,
        },
      };
    case "BOOTED":
      return {
        ...state,
        power: {
          ...state.power,
          mode: state.setup.done ? "on" : "on",
          locked: state.setup.done,
        },
        screen: { ...state.screen, app: null, overlay: null },
      };
    case "OPEN_APP": {
      if (state.power.locked) return state;
      if (
        state.battery.extremeSaver &&
        !state.battery.extremeAllowedApps.includes(action.id)
      )
        return {
          ...state,
          toast: {
            message: `${CORE_APPS.find((app) => app.id === action.id)?.name || STORE_APPS.find((app) => app.id === action.id)?.name || "This app"} is restricted by Extreme Battery Saver`,
            time: Date.now(),
          },
        };
      const recents = [
        action.id,
        ...state.screen.recents.filter((x) => x !== action.id),
      ].slice(0, 8);
      return {
        ...state,
        screen: {
          ...state.screen,
          app: action.id,
          overlay: null,
          history: state.screen.app
            ? [...state.screen.history, state.screen.app]
            : state.screen.history,
          recents,
        },
      };
    }
    case "HOME":
      if (state.power.locked)
        return {
          ...state,
          screen: {
            ...state.screen,
            app: state.screen.secureApp ? null : state.screen.app,
            secureApp: null,
            overlay: null,
          },
        };
      return {
        ...state,
        screen: { ...state.screen, app: null, overlay: null, history: [] },
      };
    case "BACK": {
      if (state.power.locked)
        return {
          ...state,
          screen: {
            ...state.screen,
            app: state.screen.secureApp ? null : state.screen.app,
            secureApp: null,
            overlay: null,
          },
        };
      if (state.screen.overlay)
        return {
          ...state,
          screen: { ...state.screen, overlay: null },
        };
      if (!state.screen.history.length) return state;
      const hist = [...state.screen.history],
        app = hist.pop() || null;
      return {
        ...state,
        screen: { ...state.screen, app, overlay: null, history: hist },
      };
    }
    case "RECENTS":
      if (state.power.locked)
        return {
          ...state,
          screen: {
            ...state.screen,
            app: state.screen.secureApp ? null : state.screen.app,
            secureApp: null,
            overlay: null,
          },
        };
      return {
        ...state,
        screen: { ...state.screen, overlay: "recents" },
      };
    case "VOLUME_ADJUST": {
      const stream = state.activeCall
        ? "call"
        : state.fm.playing ||
            state.social.spotify.playing ||
            state.social.youtube.playing ||
            ["spotify", "youtube"].includes(state.screen.app)
          ? "media"
          : "ringtone";
      const level = Math.max(
        0,
        Math.min(100, (state.sound[stream] ?? 70) + action.delta),
      );
      return {
        ...state,
        sound: { ...state.sound, [stream]: level },
        screen: {
          ...state.screen,
          volumeOverlay: { stream, level, time: Date.now() },
        },
      };
    }
    case "NOTIFY":
      return notice(state, action.title, action.body, action.app);
    case "DISMISS_NOTICE":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.id),
      };
    case "CLEAR_NOTICES":
      return {
        ...state,
        notificationHistory: [
          ...state.notifications,
          ...state.notificationHistory,
        ].slice(0, 100),
        notifications: [],
      };
    case "TOGGLE_TRAY": {
      const opening = !state.tray.open;
      const next = {
        ...state,
        tray: { ...state.tray, open: opening },
        sim:
          opening && state.sim.physical.installed
            ? {
                ...state.sim,
                physical: {
                  ...state.sim.physical,
                  registered: false,
                  status: "Tray open",
                },
              }
            : state.sim,
      };
      return opening && state.sim.physical.installed
        ? notice(
            {
              ...next,
              toast: { message: "SIM tray open", time: Date.now() },
            },
            "SIM tray open",
            "SIM 1 calls, messages and mobile data are temporarily unavailable.",
          )
        : next;
    }
    case "SELECT_SIM_CARD":
      return {
        ...state,
        tray: {
          ...state.tray,
          selected:
            state.tray.selected === action.carrier ? null : action.carrier,
        },
      };
    case "SEAT_SIM":
      if (!state.tray.open || state.tray.card) return state;
      return {
        ...state,
        tray: { ...state.tray, card: action.carrier, selected: null },
      };
    case "REMOVE_SIM": {
      const carrier = state.tray.card;
      return notice(
        {
          ...state,
          tray: { ...state.tray, card: null, selected: null },
          sim: {
            ...state.sim,
            physical: {
              ...state.sim.physical,
              carrier: null,
              installed: false,
              registered: false,
              status: "No SIM",
            },
          },
        },
        "Physical SIM removed",
        carrier
          ? `${CARRIERS[carrier].name} is back on the desk.`
          : "The tray is empty.",
      );
    }
    case "CLOSE_TRAY":
      if (!state.tray.open) return state;
      if (!state.tray.card)
        return { ...state, tray: { ...state.tray, open: false } };
      return {
        ...state,
        tray: { ...state.tray, open: false },
        sim: {
          ...state.sim,
          physical: {
            ...state.sim.physical,
            carrier: state.tray.card,
            installed: true,
            registered: false,
            status: "SIM detected",
          },
        },
      };
    case "SIM_STAGE": {
      const current = state.sim[action.slot];
      if (!current.installed) return state;
      const next = {
        ...current,
        status: action.stage,
        registered: action.stage === "Connected",
      };
      let out = { ...state, sim: { ...state.sim, [action.slot]: next } };
      return action.stage === "Connected"
        ? notice(
            out,
            `${CARRIERS[current.carrier].name} connected`,
            `${current.label} is registered on ${current.network}.`,
          )
        : out;
    }
    case "PROGRAM_QR":
      return notice(
        {
          ...state,
          qr: { ...state.qr, carrier: action.carrier, selected: false },
        },
        "eSIM QR programmed",
        `${CARRIERS[action.carrier].name} provisioning data is ready.`,
      );
    case "INSTALL_ESIM": {
      const c = action.carrier;
      return {
        ...state,
        sim: {
          ...state.sim,
          esim: {
            ...state.sim.esim,
            carrier: c,
            installed: true,
            registered: false,
            status: "Preparing eSIM",
          },
        },
      };
    }
    case "REMOVE_ESIM":
      return notice(
        {
          ...state,
          sim: {
            ...state.sim,
            esim: {
              ...state.sim.esim,
              carrier: null,
              installed: false,
              registered: false,
              status: "No SIM",
            },
          },
        },
        "eSIM removed",
        "The profile remains available on the programmed QR.",
      );
    case "AIRPLANE": {
      const on = !state.radio.airplane;
      return notice(
        {
          ...state,
          radio: {
            ...state.radio,
            airplane: on,
            wifi: on ? false : state.radio.wifi,
          },
          wifi: on ? { ...state.wifi, connected: null } : state.wifi,
        },
        `Airplane mode ${on ? "on" : "off"}`,
        on
          ? "Cellular and Wi-Fi radios switched off. Wi-Fi can be restored manually."
          : "Cellular service restored.",
      );
    }
    case "WIFI_CONNECTED":
      return notice(
        {
          ...state,
          wifi: {
            ...state.wifi,
            connected: "TP-Link B440",
            saved: true,
            stage: null,
          },
          radio: { ...state.radio, wifi: true },
        },
        "Wi-Fi connected",
        "TP-Link B440 • 192.168.1.24",
      );
    case "WIFI_DISCONNECT":
      return {
        ...state,
        wifi: { ...state.wifi, connected: null, stage: null },
      };
    case "WIFI_FORGET":
      return {
        ...state,
        wifi: { ...state.wifi, connected: null, saved: false, stage: null },
      };
    case "START_DOWNLOAD":
      if (state.installed.includes(action.id)) return state;
      if (!hardwareCapabilities(state).storage)
        return {
          ...state,
          toast: { message: "No writable storage hardware", time: Date.now() },
        };
      return {
        ...state,
        downloads: {
          ...state.downloads,
          [action.id]: {
            progress: state.downloads[action.id]?.progress || 0,
            status: "downloading",
          },
        },
      };
    case "CONSUME_DATA": {
      const net = connectivity(state);
      return net.route === "cellular"
        ? addDataUsage(state, net.activeDataSIM, action.amountMB)
        : state;
    }
    case "CONSUME_VOICE":
      return action.emergency
        ? state
        : addVoiceUsage(state, action.slot, action.minutes);
    case "LOG_NETWORK_EVENT":
      if (state.developer.timelinePaused) return state;
      return {
        ...state,
        developer: {
          ...state.developer,
          timeline: [
            {
              id: `net-${Date.now()}-${Math.random()}`,
              time: Date.now(),
              ...action.event,
            },
            ...state.developer.timeline,
          ].slice(0, 500),
        },
      };
    case "LOG_SYSTEM_EVENT":
      if (state.developer.timelinePaused) return state;
      return {
        ...state,
        developer: {
          ...state.developer,
          timeline: [
            {
              id: `sys-${Date.now()}-${Math.random()}`,
              time: Date.now(),
              source: action.event?.source || "system",
              category: action.event?.category || "system",
              ...action.event,
            },
            ...state.developer.timeline,
          ].slice(0, 500),
        },
      };
    case "FM_TUNE": {
      const frequency =
        Math.round(
          Math.max(FM_MIN, Math.min(FM_MAX, Number(action.frequency))) * 10,
        ) / 10;
      const tuned = {
        ...state,
        fm: { ...state.fm, frequency, crash: null },
      };
      const reception = calculateFMReception(tuned, frequency);
      if (reception.collision)
        return reducer(tuned, {
          type: "FM_COLLISION",
          frequency,
          count: reception.collisionCount,
        });
      if (action.silent) return tuned;
      return reducer(tuned, {
        type: "LOG_SYSTEM_EVENT",
        event: {
          source: "fm",
          category: "fm",
          type: reception.transmitter
            ? "FM station tuned"
            : "FM frequency tuned",
          message: reception.transmitter
            ? `${reception.transmitter.station} tuned at ${frequency.toFixed(1)} MHz`
            : `${frequency.toFixed(1)} MHz · ${reception.quality}`,
        },
      });
    }
    case "FM_SCAN": {
      const scanned = scanFMEnvironment(state);
      return {
        ...state,
        fm: { ...state.fm, scanned, scanning: false },
        toast: {
          message: `${scanned.length} receivable FM station${scanned.length === 1 ? "" : "s"} found`,
          time: Date.now(),
        },
      };
    }
    case "FM_FAVORITE": {
      const frequency = Math.round(Number(action.frequency) * 10) / 10;
      const exists = state.fm.favorites.includes(frequency);
      return {
        ...state,
        fm: {
          ...state.fm,
          favorites: exists
            ? state.fm.favorites.filter((item) => item !== frequency)
            : [...state.fm.favorites, frequency].sort((a, b) => a - b),
        },
      };
    }
    case "FM_COLLISION": {
      if (
        state.fm.crash?.frequency === action.frequency &&
        state.fm.crash?.count === action.count
      )
        return state;
      const crashed = {
        ...state,
        fm: {
          ...state.fm,
          playing: false,
          crash: {
            frequency: action.frequency,
            count: action.count,
            time: Date.now(),
          },
        },
      };
      return reducer(crashed, {
        type: "LOG_SYSTEM_EVENT",
        event: {
          source: "fm",
          category: "fm",
          type: "FM Radio crashed",
          message: `FM frequency collision detected · Frequency: ${Number(action.frequency).toFixed(1)} MHz · Transmitters: ${action.count} · FM Radio process crashed`,
        },
      });
    }
    case "FM_CLEAR_CRASH":
      return { ...state, fm: { ...state.fm, crash: null } };
    case "SET_HEADPHONES": {
      const connected = Boolean(action.connected);
      let next = {
        ...state,
        audioAccessories: {
          ...state.audioAccessories,
          wiredHeadphonesConnected: connected,
        },
      };
      const detected = hardwareCapabilities(next).headphonesDetected;
      next = notice(
        next,
        connected
          ? detected
            ? "Wired headphones connected"
            : "Headphone plug inserted"
          : "Wired headphones disconnected",
        connected
          ? detected
            ? "Analogue audio and wired FM antenna are available."
            : "The 3.5 mm jack could not reliably detect the accessory."
          : "Headphone audio and the wired FM antenna are unavailable.",
        "System",
      );
      return reducer(next, {
        type: "LOG_SYSTEM_EVENT",
        event: {
          source: "hardware",
          category: "hardware",
          type: connected ? "Headphones connected" : "Headphones disconnected",
          message: connected
            ? `3.5 mm plug inserted · detection ${detected ? "successful" : "failed"}`
            : "3.5 mm wired headphones removed",
        },
      });
    }
    case "BUILD_NUMBER_TAP": {
      if (state.developer.unlocked)
        return {
          ...state,
          toast: {
            message: "Developer Options already enabled",
            time: Date.now(),
          },
        };
      const taps = Math.min(7, state.developer.buildTaps + 1);
      const remaining = 7 - taps;
      const message =
        taps >= 7
          ? "Developer Options enabled"
          : remaining <= 3
            ? `${remaining} ${remaining === 1 ? "step" : "steps"} away from Developer Options`
            : "";
      return {
        ...state,
        developer: {
          ...state.developer,
          buildTaps: taps,
          unlocked: taps === 7,
        },
        toast: message ? { message, time: Date.now() } : state.toast,
      };
    }
    case "RECORD_SPEEDTEST": {
      let next = {
        ...state,
        speedtest: {
          ...state.speedtest,
          history: [action.result, ...state.speedtest.history].slice(0, 20),
        },
      };
      const net = connectivity(state);
      if (net.route === "cellular")
        next = addDataUsage(next, net.activeDataSIM, action.dataMB || 35);
      return next;
    }
    case "DOWNLOAD_ACTION":
      return {
        ...state,
        downloads: {
          ...state.downloads,
          [action.id]: {
            ...(state.downloads[action.id] || { progress: 0 }),
            status: action.status,
          },
        },
      };
    case "TICK": {
      const elapsed = Math.max(0, (action.now - state.battery.last) / 1000);
      let next = state;
      let interval = 180;
      if (["youtube", "facebook", "instagram"].includes(state.screen.app))
        interval = 120;
      else if (
        ["camera", "spotify", "fm-radio"].includes(state.screen.app) ||
        state.radio.flashlight ||
        state.fm.playing ||
        state.social.spotify.playing
      )
        interval = 150;
      const hardwareBattery = state.hardware.components.battery;
      const demanding = [
        "youtube",
        "instagram",
        "facebook",
        "camera",
        "speedtest",
      ].includes(state.screen.app);
      const caps = hardwareCapabilities(state);
      const activelyCharging = caps.charging && state.battery.charging;
      const flashlightLimit = state.battery.extremeSaver
        ? 18
        : state.battery.saver
          ? 45
          : 100;
      const flashlightBrightness = state.radio.flashlight
        ? Math.min(state.radio.flashlightBrightness || 80, flashlightLimit) /
          100
        : 0;
      const flashlightDuty =
        state.radio.flashlightMode === "Pulse"
          ? 0.46
          : state.radio.flashlightMode === "SOS"
            ? 0.36
            : 1;
      const saverMultiplier = state.battery.extremeSaver
        ? 2.55
        : state.battery.saver
          ? 1.5
          : 1;
      const drainMultiplier =
        1 +
        flashlightBrightness * flashlightDuty * 1.35 +
        (state.fm.playing ? 0.12 : 0);
      const ambientTemperature = Number(state.weather?.temp ?? 23);
      const ageHeat =
        (100 - Number(state.battery.health || 100)) / 18 +
        Math.min(3.5, (Number(state.battery.cycles) || 0) / 700);
      const chargeHeat = activelyCharging
        ? state.battery.chargeMode === "Fast"
          ? 7
          : state.battery.chargeMode === "Normal"
            ? 4
            : 2
        : 0;
      const autoTarget =
        ambientTemperature +
        4 +
        (state.power.mode === "on" ? 2 : 0) +
        (demanding ? 9 : 0) +
        (state.social.spotify.playing ? 2 : 0) +
        flashlightBrightness * flashlightDuty * 7 +
        chargeHeat +
        (activelyCharging && demanding ? 5 : 0) +
        ageHeat;
      const temperature =
        state.battery.temperatureMode === "Manual"
          ? Math.max(-10, Math.min(65, state.battery.manualTemperature))
          : state.battery.temperature +
            (autoTarget - state.battery.temperature) *
              Math.min(1, elapsed / 70);
      const model = batteryModel(state, {
        temperature,
        demanding,
        loadMultiplier: drainMultiplier,
      });
      let level = state.battery.level;
      const protectionTarget =
        state.battery.adaptiveCharging &&
        state.battery.protect80 &&
        !state.battery.chargeTo100
          ? 80
          : 100;
      const thermalLimit = Number(hardwareBattery.thermalLimit || 49);
      const heatPaused =
        model.thermal.chargingPaused ||
        temperature >= Math.min(52, thermalLimit + 3);
      const userPaused = state.battery.chargeMode === "Paused";
      const levelBeforeTick = level;
      if (activelyCharging && !heatPaused && !userPaused) {
        const secondsPerPercent =
          state.battery.chargeMode === "Slow"
            ? 60
            : state.battery.chargeMode === "Normal"
              ? 32
              : 20;
        const hardwareThermalFactor =
          temperature >= thermalLimit
            ? 0.35
            : temperature >= thermalLimit - 5
              ? 0.65
              : 1;
        level = Math.min(
          protectionTarget,
          level +
            ((elapsed / secondsPerPercent) *
              model.thermal.chargeFactor *
              hardwareThermalFactor) /
              model.capacityRatio,
        );
      } else if (caps.battery && state.power.mode !== "off")
        level = Math.max(
          0,
          level -
            (elapsed * drainMultiplier * model.thermal.drainMultiplier) /
              (interval * saverMultiplier * model.capacityRatio),
        );
      const dischargedFraction = caps.battery
        ? Math.max(0, levelBeforeTick - level) / 100
        : 0;
      const chargedFraction = caps.battery
        ? Math.max(0, level - levelBeforeTick) / 100
        : 0;
      const accumulatedProgress =
        Math.max(0, Number(state.battery.cycleProgress) || 0) +
        dischargedFraction;
      const completedCycles = Math.floor(accumulatedProgress);
      const cycles =
        Math.max(0, Number(state.battery.cycles) || 0) + completedCycles;
      const cycleProgress = accumulatedProgress - completedCycles;
      const agingLoss =
        Math.max(0, Number(state.battery.agingLoss) || 0) +
        dischargedFraction * agingPerEquivalentCycle(temperature);
      const health = Math.max(
        20,
        Math.min(
          Number(state.battery.health) || 100,
          cycleHealthCeiling(cycles + cycleProgress),
        ) -
          dischargedFraction * agingPerEquivalentCycle(temperature),
      );
      const voltageShutdown =
        demanding &&
        model.instabilityThreshold > 0 &&
        level <= model.instabilityThreshold;
      const thermalShutdown = caps.battery && model.thermal.protectiveShutdown;
      const becameOff =
        caps.battery &&
        (level <= 0 || voltageShutdown || thermalShutdown) &&
        state.power.mode !== "off";
      const usage = { ...state.battery.usage };
      if (state.power.mode === "on") {
        usage.Screen = (usage.Screen || 0) + elapsed / 60;
        const appName = state.screen.app
          ? CORE_APPS.find((app) => app.id === state.screen.app)?.name ||
            STORE_APPS.find((app) => app.id === state.screen.app)?.name ||
            "System"
          : "System";
        usage[appName] = (usage[appName] || 0) + elapsed / 60;
      }
      const addHistory =
        action.now - (state.battery.lastHistoryAt || 0) >= 60000;
      next = {
        ...state,
        streetlight: {
          ...state.streetlight,
          poles: state.streetlight.poles.map((pole) => ({
            ...pole,
            warmup:
              state.streetlight.masterOn &&
              pole.breaker &&
              pole.connected !== false
                ? Math.min(
                    1,
                    Number(pole.warmup ?? 1) +
                      elapsed / (/LED/.test(pole.technology) ? 1 : 18),
                  )
                : Number(pole.warmup ?? 0),
          })),
        },
        hardware: {
          ...state.hardware,
          components: {
            ...state.hardware.components,
            battery: {
              ...hardwareBattery,
              swelling: Math.min(
                100,
                Number(hardwareBattery.swelling || 0) +
                  (temperature > 47
                    ? (elapsed * (temperature - 46)) / 7200
                    : 0),
              ),
              condition: Math.max(
                0,
                Math.min(hardwareBattery.condition, 40 + health * 0.6) -
                  (temperature > 52
                    ? (elapsed * (temperature - 51)) / 18000
                    : 0),
              ),
            },
          },
          temperatures: {
            battery: Math.round(temperature * 10) / 10,
            mainboard:
              Math.round(
                (32 +
                  (demanding
                    ? (14 * (model.thermal.performanceLimit / 100)) /
                      saverMultiplier
                    : 0) +
                  flashlightBrightness * flashlightDuty * 4 +
                  (activelyCharging ? 3 : 0)) *
                  10,
              ) / 10,
            modem:
              Math.round(
                (30 +
                  (connectivity(state).route === "cellular" ? 11 : 0) +
                  (state.screen.app === "speedtest" ? 9 : 0)) *
                  10,
              ) / 10,
          },
          faults: Object.values(state.hardware.components).some(
            (part) => part.waterExposure > 70,
          )
            ? [
                ...new Set([
                  ...state.hardware.faults,
                  "Intermittent leakage current detected",
                ]),
              ]
            : state.hardware.faults,
        },
        battery: {
          ...state.battery,
          level,
          cycles,
          cycleProgress,
          chargedThroughputMah:
            (Number(state.battery.chargedThroughputMah) || 0) +
            chargedFraction * model.effectiveCapacityMah,
          dischargedThroughputMah:
            (Number(state.battery.dischargedThroughputMah) || 0) +
            dischargedFraction * model.effectiveCapacityMah,
          agingLoss,
          last: action.now,
          health,
          condition: batteryCondition(health),
          temperature,
          thermalState: model.thermal.state,
          performanceLimit: model.thermal.performanceLimit,
          chargeLimitedReason: userPaused
            ? "Paused by user"
            : heatPaused
              ? `${model.thermal.state} battery temperature`
              : activelyCharging && model.thermal.chargeFactor < 1
                ? "Thermally limited"
                : null,
          usage,
          chargeTo100: state.battery.chargeTo100 && level < 100 ? true : false,
          history: addHistory
            ? [
                ...state.battery.history,
                { time: action.now, level: Math.round(level * 10) / 10 },
              ].slice(-120)
            : state.battery.history,
          lastHistoryAt: addHistory ? action.now : state.battery.lastHistoryAt,
        },
        power: becameOff
          ? { ...state.power, mode: "off", locked: true }
          : state.power,
      };
      const previousThermalSeverity =
        {
          Normal: 0,
          Warm: 1,
          Cold: 1,
          Hot: 2,
          "Very Cold": 2,
          "Very Hot": 3,
          Critical: 4,
        }[state.battery.thermalState] ?? 0;
      if (
        caps.battery &&
        model.thermal.severity >= 2 &&
        model.thermal.severity > previousThermalSeverity
      ) {
        next = notice(
          next,
          model.thermal.protectiveShutdown
            ? "Antoid shut down to cool"
            : "Battery temperature high",
          model.thermal.protectiveShutdown
            ? `${temperature.toFixed(1)} °C exceeded the safe operating limit.`
            : `${temperature.toFixed(1)} °C · charging and performance are restricted.`,
          "System",
        );
        next = reducer(next, {
          type: "LOG_SYSTEM_EVENT",
          event: {
            source: "temperature",
            category: "temperature",
            type: model.thermal.protectiveShutdown
              ? "Thermal protective shutdown"
              : "Thermal protection active",
            message: `${temperature.toFixed(1)} °C · ${model.thermal.state} · performance ${model.thermal.performanceLimit}%`,
          },
        });
      }
      if (voltageShutdown) {
        next = notice(
          next,
          "Battery could not sustain peak load",
          `A ${health.toFixed(0)}% health battery shut down protectively at ${level.toFixed(1)}%.`,
          "System",
        );
        next = reducer(next, {
          type: "LOG_SYSTEM_EVENT",
          event: {
            source: "power",
            category: "power",
            type: "Low-voltage protective shutdown",
            message: `Battery health ${health.toFixed(1)}% · charge ${level.toFixed(1)}% · demanding load`,
          },
        });
      }
      if (caps.battery) {
        if (level <= 5 && !next.battery.extremeSaver) {
          next = notice(
            {
              ...next,
              battery: {
                ...next.battery,
                extremeSaver: true,
                extremeSaverAuto: true,
                saver: false,
                saverAuto: false,
              },
            },
            "Extreme Battery Saver turned on",
            "Battery level reached 5%.",
            "System",
          );
          next = reducer(next, {
            type: "LOG_SYSTEM_EVENT",
            event: {
              source: "power",
              category: "power",
              type: "Extreme Battery Saver automatically enabled",
              message: "Battery level reached 5%",
            },
          });
        } else if (
          level <= 15 &&
          level > 5 &&
          !next.battery.extremeSaver &&
          !next.battery.saver
        ) {
          next = notice(
            {
              ...next,
              battery: {
                ...next.battery,
                saver: true,
                saverAuto: true,
              },
            },
            "Battery Saver turned on",
            "Battery level reached 15%.",
            "System",
          );
          next = reducer(next, {
            type: "LOG_SYSTEM_EVENT",
            event: {
              source: "power",
              category: "power",
              type: "Battery Saver automatically enabled",
              message: "Battery level reached 15%",
            },
          });
        } else if (activelyCharging && level > 18 && next.battery.saverAuto) {
          next = {
            ...next,
            battery: { ...next.battery, saver: false, saverAuto: false },
          };
        } else if (
          activelyCharging &&
          level > 7 &&
          next.battery.extremeSaverAuto
        ) {
          next = {
            ...next,
            battery: {
              ...next.battery,
              extremeSaver: false,
              extremeSaverAuto: false,
              saver: level <= 15,
              saverAuto: level <= 15,
            },
          };
        }
      }
      if (
        next.screen.volumeOverlay &&
        action.now - next.screen.volumeOverlay.time > 2200
      )
        next = {
          ...next,
          screen: { ...next.screen, volumeOverlay: null },
        };
      if (
        next.screen.screenshotPreview &&
        action.now - next.screen.screenshotPreview.time > 4200
      )
        next = {
          ...next,
          screen: {
            ...next.screen,
            screenshotPreview: null,
            screenshotFlash: false,
          },
        };
      const rate = hardwareCapabilities(next).storage ? downloadRate(next) : 0;
      let completed = [];
      let downloadedMB = 0;
      const downloads = { ...next.downloads };
      Object.entries(downloads).forEach(([id, d]) => {
        if (d.status === "downloading" && rate > 0) {
          const progress = Math.min(100, d.progress + rate * elapsed);
          const appSize = STORE_APPS.find((app) => app.id === id)?.size || 0;
          downloadedMB += (appSize * (progress - d.progress)) / 100;
          downloads[id] = {
            ...d,
            progress,
            status: progress >= 100 ? "installed" : "downloading",
          };
          if (progress >= 100) completed.push(id);
        } else if (d.status === "downloading" && rate === 0)
          downloads[id] = { ...d, status: "waiting" };
        else if (d.status === "waiting" && rate > 0)
          downloads[id] = { ...d, status: "downloading" };
      });
      if (completed.length) {
        next = {
          ...next,
          downloads,
          installed: [...new Set([...next.installed, ...completed])],
          versions: {
            ...next.versions,
            ...Object.fromEntries(
              completed.map((id) => [
                id,
                STORE_APPS.find((a) => a.id === id).version,
              ]),
            ),
          },
        };
        completed.forEach((id) => {
          next = notice(
            next,
            `${STORE_APPS.find((a) => a.id === id).name} installed`,
            "Ready on your Home screen.",
            "Antoid Store",
          );
        });
      } else next = { ...next, downloads };
      const activeNet = connectivity(next);
      if (downloadedMB > 0 && activeNet.route === "cellular")
        next = addDataUsage(next, activeNet.activeDataSIM, downloadedMB);
      if (activeNet.route === "cellular") {
        const activityRates = {
          youtube: 0.42,
          facebook: 0.035,
          instagram: 0.055,
          spotify: state.social.spotify.playing ? 0.025 : 0.004,
          messenger: 0.018,
          browser: 0.002,
          gmail: 0.001,
          weather: 0.001,
          store: 0.002,
          settings: state.system.updateStatus === "Downloading" ? 0.08 : 0,
        };
        const backgroundFactor = next.battery.extremeSaver
          ? 0.08
          : next.battery.saver
            ? 0.45
            : 1;
        const usageRate =
          (activityRates[state.screen.app] || 0) * backgroundFactor;
        if (usageRate > 0)
          next = addDataUsage(
            next,
            activeNet.activeDataSIM,
            usageRate * elapsed,
          );
      }
      if (state.stopwatch.running)
        next = {
          ...next,
          stopwatch: {
            ...next.stopwatch,
            elapsed: state.stopwatch.elapsed + elapsed,
          },
        };
      next = {
        ...next,
        timers: next.timers.map((t) =>
          t.running
            ? {
                ...t,
                remaining: Math.max(0, t.remaining - elapsed),
                running: t.remaining - elapsed > 0,
              }
            : t,
        ),
      };
      return next;
    }
    case "ADD_MESSAGE": {
      const group = action.kind === "messenger" ? "messenger" : "messages",
        threads = { ...state[group] },
        arr = [
          ...(threads[action.contact] || []),
          {
            id: String(Date.now() + Math.random()),
            from: action.from || "You",
            text: action.text,
            time: Date.now(),
            read: true,
            reaction: null,
          },
        ];
      threads[action.contact] = arr;
      return { ...state, [group]: threads };
    }
    case "ADD_CONTACT":
      return {
        ...state,
        contacts: [
          ...state.contacts,
          {
            ...action.contact,
            id: crypto.randomUUID?.() || String(Date.now()),
            color: "#4ecdb4",
          },
        ],
      };
    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
      };
    case "ADD_PHOTO":
      if (!hardwareCapabilities(state).storage)
        return {
          ...state,
          toast: {
            message: "Photo not saved: storage hardware unavailable",
            time: Date.now(),
          },
        };
      return notice(
        { ...state, photos: [action.photo, ...state.photos] },
        "Photo saved",
        `${action.photo.title} was added to Gallery.`,
        "Camera",
      );
    case "SAVE_NOTE": {
      if (!hardwareCapabilities(state).storage)
        return {
          ...state,
          toast: {
            message: "Note not saved: storage hardware unavailable",
            time: Date.now(),
          },
        };
      const exists = state.notes.some((n) => n.id === action.note.id);
      return {
        ...state,
        notes: exists
          ? state.notes.map((n) => (n.id === action.note.id ? action.note : n))
          : [action.note, ...state.notes],
      };
    }
    case "ADD_EVENT":
      return { ...state, events: [action.event, ...state.events] };
    case "ADD_ALARM":
      return { ...state, alarms: [...state.alarms, action.alarm] };
    case "SEND_MAIL": {
      const email = {
        ...action.email,
        id: String(Date.now()),
        from: `${state.setup.username || "user"}@antoid.id`,
        time: Date.now(),
        read: true,
        starred: false,
        folder: connectivity(state).isOnline ? "sent" : "outbox",
      };
      return notice(
        { ...state, emails: [email, ...state.emails] },
        email.folder === "sent" ? "Message sent" : "Saved to Outbox",
        email.folder === "sent"
          ? email.subject
          : "It will send when internet returns.",
        "Gmail",
      );
    }
    case "PHONE_UNBOX": {
      const stage = Math.min(5, state.hardware.unboxing.stage + 1);
      return {
        ...state,
        hardware: {
          ...state.hardware,
          unboxing: {
            stage,
            complete: stage >= 5,
            chargerUnlocked: stage >= 4,
          },
        },
      };
    }
    case "HARDWARE_SELECT":
      return {
        ...state,
        hardware: { ...state.hardware, selected: action.id },
      };
    case "HARDWARE_FIELD": {
      const current = state.hardware.components[action.id];
      if (!current) return state;
      const nextPart = { ...current, [action.field]: action.value };
      return {
        ...state,
        hardware: {
          ...state.hardware,
          components: { ...state.hardware.components, [action.id]: nextPart },
        },
        developer: state.developer.timelinePaused
          ? state.developer
          : {
              ...state.developer,
              timeline: [
                {
                  id: `hw-${Date.now()}`,
                  time: Date.now(),
                  source: "hardware",
                  category: "hardware",
                  type: "Component state",
                  message: `${current.name}: ${action.field} → ${String(action.value)}`,
                },
                ...state.developer.timeline,
              ].slice(0, 500),
            },
      };
    }
    case "HARDWARE_REMOVE": {
      const current = state.hardware.components[action.id];
      if (!current?.installed) return state;
      const inventoryItem = {
        ...structuredClone(current),
        installed: false,
        connected: false,
        inventoryId: `removed-${action.id}-${Date.now()}`,
        removedAt: Date.now(),
        ...(action.id === "battery"
          ? {
              batteryTelemetry: {
                health: state.battery.health,
                cycles: state.battery.cycles,
                cycleProgress: state.battery.cycleProgress,
                chargedThroughputMah: state.battery.chargedThroughputMah,
                dischargedThroughputMah: state.battery.dischargedThroughputMah,
                agingLoss: state.battery.agingLoss,
              },
            }
          : {}),
      };
      const components = {
        ...state.hardware.components,
        [action.id]: { ...current, installed: false, connected: false },
      };
      const nextCaps = hardwareCapabilities({
        ...state,
        hardware: { ...state.hardware, components },
      });
      const losesPower =
        action.id === "mainboard" ||
        (!nextCaps.battery && !nextCaps.externalPower);
      return {
        ...state,
        power: losesPower
          ? { ...state.power, mode: "off", locked: true }
          : action.id === "battery" && nextCaps.externalPower
            ? {
                ...state.power,
                mode: "booting",
                locked: true,
                bootCount: state.power.bootCount + 1,
              }
            : state.power,
        hardware: {
          ...state.hardware,
          components,
          inventory: {
            ...state.hardware.inventory,
            removed: [inventoryItem, ...state.hardware.inventory.removed],
          },
          inspection: `${current.name} removed intact and placed in inventory.`,
          motion: {
            kind: "remove",
            id: action.id,
            part: inventoryItem,
            time: Date.now(),
          },
        },
        toast: { message: `${current.name} removed`, time: Date.now() },
      };
      return ["fmReceiver", "fmAntenna", "headphoneJack"].includes(action.id)
        ? reducer(removed, {
            type: "LOG_SYSTEM_EVENT",
            event: {
              source: "hardware",
              category: "fm",
              type: `${current.name} removed`,
              message: `${current.name} was physically removed from Antoid 1`,
            },
          })
        : removed;
    }
    case "HARDWARE_INSTALL": {
      const all = [
        ...state.hardware.inventory.removed,
        ...state.hardware.inventory.packages,
      ];
      const item = all.find(
        (candidate) => candidate.inventoryId === action.inventoryId,
      );
      if (!item) return state;
      if (item.destroyed)
        return {
          ...state,
          toast: {
            message:
              "Destroyed originals cannot be repaired. Recover a replacement instead.",
            time: Date.now(),
          },
        };
      const current = state.hardware.components[item.id];
      const displaced = current?.installed
        ? [
            {
              ...structuredClone(current),
              installed: false,
              connected: false,
              inventoryId: `removed-${item.id}-${Date.now()}`,
              removedAt: Date.now(),
              ...(item.id === "battery"
                ? {
                    batteryTelemetry: {
                      health: state.battery.health,
                      cycles: state.battery.cycles,
                      cycleProgress: state.battery.cycleProgress,
                      chargedThroughputMah: state.battery.chargedThroughputMah,
                      dischargedThroughputMah:
                        state.battery.dischargedThroughputMah,
                      agingLoss: state.battery.agingLoss,
                    },
                  }
                : {}),
            },
            ...state.hardware.inventory.removed,
          ]
        : state.hardware.inventory.removed;
      const installed = {
        ...item,
        installed: true,
        connected: true,
        powered: true,
      };
      delete installed.inventoryId;
      delete installed.removedAt;
      const fromRemoved = state.hardware.inventory.removed.some(
        (candidate) => candidate.inventoryId === action.inventoryId,
      );
      const installedState = {
        ...state,
        battery:
          item.id === "battery"
            ? {
                ...state.battery,
                level: fromRemoved ? state.battery.level : 40,
                health: item.batteryTelemetry?.health ?? 100,
                cycles: item.batteryTelemetry?.cycles ?? 0,
                cycleProgress: item.batteryTelemetry?.cycleProgress ?? 0,
                chargedThroughputMah:
                  item.batteryTelemetry?.chargedThroughputMah ?? 0,
                dischargedThroughputMah:
                  item.batteryTelemetry?.dischargedThroughputMah ?? 0,
                agingLoss: item.batteryTelemetry?.agingLoss ?? 0,
                temperature: 29,
                thermalState: "Normal",
                performanceLimit: 100,
                chargeLimitedReason: null,
              }
            : state.battery,
        hardware: {
          ...state.hardware,
          components: { ...state.hardware.components, [item.id]: installed },
          inventory: {
            ...state.hardware.inventory,
            removed: fromRemoved
              ? displaced.filter(
                  (candidate) => candidate.inventoryId !== action.inventoryId,
                )
              : displaced,
            packages: state.hardware.inventory.packages.filter(
              (candidate) => candidate.inventoryId !== action.inventoryId,
            ),
          },
          inspection: `${item.serviceName || item.name} installed and connected.`,
          motion: {
            kind: "install",
            id: item.id,
            part: installed,
            time: Date.now(),
          },
        },
        toast: { message: `${item.name} installed`, time: Date.now() },
      };
      return ["fmReceiver", "fmAntenna", "headphoneJack"].includes(item.id)
        ? reducer(installedState, {
            type: "LOG_SYSTEM_EVENT",
            event: {
              source: "hardware",
              category: "fm",
              type: `${item.name} installed`,
              message: `${item.serviceName || item.name} was installed and connected`,
            },
          })
        : installedState;
    }
    case "HARDWARE_UNBOX_PART": {
      const template = REPLACEMENT_PARTS[action.index];
      if (!template) return state;
      return {
        ...state,
        hardware: {
          ...state.hardware,
          packageOpening: { index: action.index, stage: 0, time: Date.now() },
          inspection: `${template.name}: sealed service package placed on the work mat.`,
        },
      };
    }
    case "HARDWARE_PACKAGE_STEP": {
      const opening = state.hardware.packageOpening;
      if (!opening) return state;
      const template = REPLACEMENT_PARTS[opening.index];
      if (!template) return state;
      const stage = Math.min(3, opening.stage + 1);
      if (stage < 3)
        return {
          ...state,
          hardware: {
            ...state.hardware,
            packageOpening: { ...opening, stage },
            inspection:
              stage === 1 ? "Security seal cut." : "Antistatic sleeve opened.",
          },
        };
      const replacement = makeReplacement(template, Date.now());
      replacement.inventoryId = `package-${template.type}-${Date.now()}`;
      return {
        ...state,
        hardware: {
          ...state.hardware,
          packageOpening: null,
          inventory: {
            ...state.hardware.inventory,
            packages: [replacement, ...state.hardware.inventory.packages],
          },
          inspection: `${template.name} removed from packaging and added to inventory.`,
        },
        toast: {
          message: `${template.name} ready to install`,
          time: Date.now(),
        },
      };
    }
    case "HARDWARE_CANCEL_PACKAGE":
      return {
        ...state,
        hardware: { ...state.hardware, packageOpening: null },
      };
    case "HARDWARE_INSPECT": {
      const current = state.hardware.components[action.id];
      if (!current) return state;
      const dependencies = (current.dependsOn || []).map(
        (id) => state.hardware.components[id]?.name || id,
      );
      return {
        ...state,
        hardware: {
          ...state.hardware,
          selected: action.id,
          inspection: `${current.name} · ${current.manufacturer} · ${current.condition}% condition · ${current.waterExposure}% water exposure${dependencies.length ? ` · requires ${dependencies.join(", ")}` : ""}`,
        },
      };
    }
    case "HARDWARE_TEST":
      return {
        ...state,
        hardware: {
          ...state.hardware,
          inspection: "Hardware test complete",
          testResults: diagnoseHardware(state),
        },
        maintenance: { ...state.maintenance, lastRun: Date.now() },
      };
    case "HARDWARE_WATER":
      return {
        ...state,
        hardware: {
          ...state.hardware,
          water: {
            ...state.hardware.water,
            running:
              action.mode === "start"
                ? true
                : action.mode === "stop"
                  ? false
                  : false,
            level: action.mode === "drain" ? 0 : state.hardware.water.level,
            ingress: action.mode === "drain" ? 0 : state.hardware.water.ingress,
            seconds: action.mode === "drain" ? 0 : state.hardware.water.seconds,
            reached:
              action.mode === "drain" ? [] : state.hardware.water.reached || [],
          },
        },
      };
    case "HARDWARE_WATER_TICK": {
      if (!state.hardware.water.running) return state;
      const level = Math.min(100, state.hardware.water.level + 4);
      const cover = state.hardware.components.backCover;
      const seals = state.hardware.components.seals;
      const coverClosed = cover?.installed && !cover?.destroyed;
      const sealGood =
        seals?.installed && !seals?.destroyed && seals?.condition > 75;
      const crackFactor = Math.max(0, Number(cover?.cracked || 0) / 30);
      const materialFactor = /plastic/i.test(cover?.material || "")
        ? 1.2
        : /aramid/i.test(cover?.material || "")
          ? 0.7
          : 1;
      const ingressRate = !coverClosed
        ? 9
        : sealGood && crackFactor === 0
          ? 0.12 * materialFactor
          : (1.5 + crackFactor * 2.2) * materialFactor;
      const ingress = Math.min(
        level,
        Number(state.hardware.water.ingress || 0) + ingressRate,
      );
      const capsBefore = hardwareCapabilities(state);
      const chargerConnected = Boolean(state.battery.charging);
      const deviceEnergized =
        state.power.mode !== "off" ||
        chargerConnected ||
        capsBefore.externalPower;
      const previouslyReached = new Set(state.hardware.water.reached || []);
      const reached = new Set(previouslyReached);
      const timelineEvents = [];
      const event = (type, message, category = "water") =>
        timelineEvents.push({
          id: `water-${Date.now()}-${timelineEvents.length}`,
          time: Date.now(),
          source: category,
          category,
          type,
          message,
        });
      let usbFault = false;
      let mainboardFault = false;
      let significantFault = null;
      const components = { ...state.hardware.components };
      for (const [id, component] of Object.entries(state.hardware.components)) {
        const reach = COMPONENT_LAYOUT[id]?.waterReach ?? component.layer * 8;
        if (!component.installed || ingress < reach) continue;
        reached.add(id);
        if (!previouslyReached.has(id))
          event("Water contact", `Water reached ${component.name}`);
        const live =
          deviceEnergized &&
          component.connected !== false &&
          component.powered !== false &&
          !component.destroyed;
        const depth = Math.max(0, ingress - reach);
        const conditionFactor = Math.max(
          0.35,
          Number(component.condition || 0) / 100,
        );
        const exposureGain = live
          ? 5.5 + depth * 0.32 + (chargerConnected ? 5 : 0)
          : 1.1 + depth * 0.08;
        const exposure = Math.min(
          100,
          Number(component.waterExposure || 0) + exposureGain,
        );
        const isUsb = id === "usbBoard" || id === "usbFlex";
        const isMainboard = [
          "mainboard",
          "soc",
          "ram",
          "storage",
          "mainboardShield",
        ].includes(id);
        const poweredUsbContact =
          isUsb && live && chargerConnected && exposure >= 8;
        const poweredBoardContact = isMainboard && live && exposure >= 24;
        const poweredPeripheralFault =
          live &&
          !isUsb &&
          !isMainboard &&
          exposure >= 48 &&
          conditionFactor < 0.9;
        const electricalFault =
          poweredUsbContact || poweredBoardContact || poweredPeripheralFault;
        const damage = electricalFault
          ? (isMainboard ? 32 : isUsb ? 27 : 16) *
            (1.2 - conditionFactor * 0.25)
          : live
            ? 1.5 + (chargerConnected ? 0.8 : 0)
            : 0.35;
        const condition = Math.max(
          0,
          Number(component.condition || 0) - damage,
        );
        const destroyed =
          component.destroyed ||
          condition <= 5 ||
          (electricalFault && exposure >= 82);
        components[id] = {
          ...component,
          waterExposure: exposure,
          wet: true,
          fogged: id.toLowerCase().includes("camera") && exposure > 12,
          condition,
          destroyed,
          connected:
            destroyed || poweredUsbContact || poweredBoardContact
              ? false
              : component.connected,
          electricalFault: electricalFault || component.electricalFault,
        };
        if (poweredUsbContact && !usbFault) {
          usbFault = true;
          significantFault = significantFault || {
            id: "usbBoard",
            severity: "high",
            label: "USB-C POWER FAULT",
          };
          event(
            "External power fault",
            "External power fault detected at the USB-C daughterboard",
            "power",
          );
          event(
            "USB-C protection",
            "USB-C protection triggered and interrupted the wired power path",
            "power",
          );
        }
        if (poweredBoardContact && !mainboardFault) {
          mainboardFault = true;
          significantFault = significantFault || {
            id,
            severity: "critical",
            label: "MAINBOARD SHORT",
          };
          event(
            "Mainboard electrical fault",
            `Mainboard electrical fault at ${component.name}`,
            "power",
          );
        }
        if (poweredPeripheralFault && !significantFault) {
          significantFault = {
            id,
            severity: "medium",
            label: "ELECTRICAL FAULT",
          };
          event(
            "Component electrical fault",
            `${component.name} suffered a powered-water fault`,
            "hardware",
          );
        }
      }
      if (usbFault) {
        const board = components.usbBoard;
        components.usbBoard = {
          ...board,
          connected: false,
          electricalFault: true,
          wet: true,
        };
      }
      const powerLost = mainboardFault || (usbFault && !capsBefore.battery);
      if (powerLost)
        event(
          "Protective shutdown",
          capsBefore.externalPower
            ? "Device shut down after batteryless external power failed"
            : "Device shut down due to electrical fault",
          "power",
        );
      const newFaultLabels = [
        ...(usbFault ? ["USB-C powered-water electrical fault"] : []),
        ...(mainboardFault ? ["Mainboard powered-water electrical fault"] : []),
        ...(significantFault && !usbFault && !mainboardFault
          ? [
              `${significantFault.label} at ${components[significantFault.id]?.name}`,
            ]
          : []),
      ];
      return {
        ...state,
        power: powerLost
          ? { ...state.power, mode: "off", locked: true }
          : state.power,
        battery: usbFault
          ? { ...state.battery, charging: false }
          : state.battery,
        laptop: usbFault
          ? { ...state.laptop, usbConnected: false }
          : state.laptop,
        hardware: {
          ...state.hardware,
          components,
          faults: [...new Set([...newFaultLabels, ...state.hardware.faults])],
          electricalEffect: significantFault
            ? { ...significantFault, time: Date.now() }
            : state.hardware.electricalEffect,
          inspection: significantFault
            ? `${significantFault.label}: ${components[significantFault.id]?.name} suffered permanent powered-water damage.`
            : state.hardware.inspection,
          water: {
            ...state.hardware.water,
            level,
            ingress,
            seconds: state.hardware.water.seconds + 1,
            reached: [...reached],
          },
        },
        developer:
          timelineEvents.length && !state.developer.timelinePaused
            ? {
                ...state.developer,
                timeline: [
                  ...timelineEvents.reverse(),
                  ...state.developer.timeline,
                ].slice(0, 500),
              }
            : state.developer,
      };
    }
    case "HARDWARE_DROP": {
      const height = Math.max(
        0.5,
        Math.min(828, Number(action.height || state.hardware.drop.height)),
      );
      const orientation = action.orientation || state.hardware.drop.orientation;
      const frame = state.hardware.components.frame;
      const material = String(frame?.material || "").toLowerCase();
      const materialFactor = material.includes("titanium")
        ? 0.7
        : material.includes("aluminium")
          ? 0.88
          : 1.22;
      const protection = Math.max(0.25, Number(frame?.rigidity || 60) / 100);
      const severity = Math.min(
        180,
        (Math.pow(height, 0.72) * 16 * materialFactor) / protection,
      );
      const targets =
        orientation === "Screen"
          ? ["display", "digitizer", "frame"]
          : orientation === "Corner"
            ? ["frame", "display", "backCover"]
            : ["backCover", "frame", "battery"];
      const components = { ...state.hardware.components };
      const catastrophic = height >= 330;
      const affected = catastrophic
        ? Object.keys(components)
        : [...targets, ...(height >= 3 ? ["wideCamera", "usbBoard"] : [])];
      affected.forEach((id, index) => {
        const target = components[id];
        if (!target?.installed) return;
        const damage = catastrophic
          ? Math.max(45, severity * (0.55 + ((id.length * 7) % 37) / 100))
          : severity * Math.max(0.4, 1 - index * 0.12);
        const condition = Math.max(0, target.condition - damage);
        components[id] = {
          ...target,
          condition,
          destroyed: condition <= (catastrophic ? 18 : 3),
          deformed: id === "frame" && condition < 55,
          deadPixels:
            id === "display" && condition < 55
              ? Math.round(100 - condition)
              : target.deadPixels,
          cracked:
            ["display", "backCover"].includes(id) && condition < 68
              ? Math.max(target.cracked || 0, Math.round(100 - condition))
              : target.cracked,
        };
      });
      const result = `${height.toFixed(1)} m ${orientation.toLowerCase()} impact · ${height >= 828 ? "catastrophic Burj Khalifa destruction" : height >= 330 ? "catastrophic Eiffel Tower destruction" : severity < 18 ? "no visible damage" : severity < 45 ? "scuffed" : severity < 75 ? "cracked" : "severe structural damage"}`;
      return {
        ...state,
        hardware: {
          ...state.hardware,
          components,
          drop: {
            height,
            orientation,
            lastResult: result,
            impactId: Date.now(),
          },
          inspection: result,
        },
      };
    }
    case "HARDWARE_SMASH": {
      const target = state.hardware.components[action.id];
      if (!target) return state;
      const components = {
        ...state.hardware.components,
        [action.id]: {
          ...target,
          condition: 0,
          destroyed: true,
          connected: false,
          punctured: action.id === "battery" ? true : target.punctured,
        },
      };
      return {
        ...state,
        power:
          action.id === "battery"
            ? { ...state.power, mode: "off", locked: true }
            : state.power,
        hardware: {
          ...state.hardware,
          components,
          smash: {
            id: action.id,
            name: target.name,
            battery: action.id === "battery",
            impactId: Date.now(),
          },
          inspection: `${target.name} destroyed.`,
        },
      };
    }
    case "HARDWARE_TRASH": {
      const removed = state.hardware.inventory.removed.filter(
        (item) => item.inventoryId !== action.inventoryId,
      );
      return {
        ...state,
        hardware: {
          ...state.hardware,
          inventory: {
            ...state.hardware.inventory,
            removed,
            trashed:
              state.hardware.inventory.trashed +
              (removed.length === state.hardware.inventory.removed.length
                ? 0
                : 1),
          },
        },
      };
    }
    case "HARDWARE_SMASH_INVENTORY": {
      let batteryBurst = false;
      let smashed = null;
      const removed = state.hardware.inventory.removed.map((item) => {
        if (item.inventoryId !== action.inventoryId) return item;
        if (item.id === "battery") batteryBurst = true;
        smashed = item;
        return {
          ...item,
          condition: 0,
          destroyed: true,
          connected: false,
          punctured: item.id === "battery" ? true : item.punctured,
        };
      });
      return {
        ...state,
        hardware: {
          ...state.hardware,
          inventory: { ...state.hardware.inventory, removed },
          smash: smashed
            ? {
                inventoryId: action.inventoryId,
                id: smashed.id,
                name: smashed.name,
                battery: batteryBurst,
                impactId: Date.now(),
              }
            : state.hardware.smash,
        },
      };
    }
    case "HARDWARE_CLEAR_SMASH":
      return { ...state, hardware: { ...state.hardware, smash: null } };
    case "HARDWARE_RECOVER": {
      const target =
        state.hardware.inventory.removed.find(
          (item) => item.inventoryId === action.inventoryId,
        ) || state.hardware.components[action.id];
      if (!target) return state;
      return {
        ...state,
        hardware: {
          ...state.hardware,
          smash: null,
          mode: "Repair",
          recoverType: target.id,
          inventorySearch: target.id,
          inspection: `${target.name} is destroyed. Compatible replacement packages are highlighted; the original remains destroyed.`,
        },
        toast: {
          message: `Recovery opened for ${target.name}`,
          time: Date.now(),
        },
      };
    }
    case "RESET_PHONE_STATE": {
      const freshHardware = createHardwareState({ unboxed: true });
      return {
        ...state,
        power: { ...state.power, mode: "off", locked: true },
        battery: {
          ...state.battery,
          level: 87,
          charging: false,
          health: 100,
          cycles: 0,
          cycleProgress: 0,
          chargedThroughputMah: 0,
          dischargedThroughputMah: 0,
          agingLoss: 0,
          condition: "Normal",
          temperature: 29,
          temperatureMode: "Auto",
          manualTemperature: 30,
          thermalState: "Normal",
          performanceLimit: 100,
          chargeLimitedReason: null,
        },
        radio: { ...state.radio, flashlight: false },
        hardware: { ...freshHardware, unboxing: state.hardware.unboxing },
      };
    }
    case "MAINTENANCE_MODE":
      return {
        ...state,
        maintenance: { ...state.maintenance, active: action.enabled },
        power: action.enabled
          ? { ...state.power, mode: "on", locked: false }
          : state.power,
        screen: action.enabled
          ? { ...state.screen, app: "maintenance", overlay: null }
          : { ...state.screen, app: null },
      };
    case "LAPTOP_UNBOX": {
      const stage = Math.min(4, state.laptop.unboxing.stage + 1);
      return {
        ...state,
        laptop: {
          ...state.laptop,
          unboxing: {
            stage,
            complete: stage >= 4,
            chargerUnlocked: stage >= 3,
          },
        },
      };
    }
    case "LAPTOP_POWER":
      if (state.laptop.battery < 2 && !state.laptop.charging)
        return {
          ...state,
          toast: {
            message: "Connect the laptop charger first",
            time: Date.now(),
          },
        };
      return {
        ...state,
        laptop: {
          ...state.laptop,
          powered: action.on,
          booting: action.on,
          app: null,
        },
      };
    case "LAPTOP_BOOTED":
      return { ...state, laptop: { ...state.laptop, booting: false } };
    case "LAPTOP_TICK": {
      const rate = state.laptop.charging
        ? 0.18
        : state.laptop.powered
          ? -0.025
          : -0.002;
      const battery = Math.max(0, Math.min(100, state.laptop.battery + rate));
      return {
        ...state,
        laptop: {
          ...state.laptop,
          battery,
          powered: battery <= 0 ? false : state.laptop.powered,
        },
      };
    }
    case "PURCHASE_STREETLIGHT": {
      const price = action.dlc ? 70 : 1200;
      if (!state.wallet.anPayEnabled || state.wallet.balanceHuf < price)
        return {
          ...state,
          toast: { message: "AnPay payment declined", time: Date.now() },
        };
      if (action.dlc && !state.streetlight.purchased) return state;
      return {
        ...state,
        wallet: {
          ...state.wallet,
          balanceHuf: state.wallet.balanceHuf - price,
          purchases: [
            {
              id: action.dlc ? "streetlight-dlc" : "streetlight",
              amount: price,
              time: Date.now(),
            },
            ...state.wallet.purchases,
          ],
        },
        streetlight: {
          ...state.streetlight,
          purchased: action.dlc ? state.streetlight.purchased : true,
          installed: action.dlc ? state.streetlight.installed : true,
          dlcPurchased: action.dlc ? true : state.streetlight.dlcPurchased,
        },
        installed:
          action.dlc || state.installed.includes("streetlight")
            ? state.installed
            : [...state.installed, "streetlight"],
        toast: { message: `AnPay approved · ${price} HUF`, time: Date.now() },
      };
    }
    case "ANPAY_LOGIN":
      return {
        ...state,
        wallet: { ...state.wallet, email: action.email, signedIn: true },
      };
    case "STREETLIGHT_FAULT": {
      const index = Math.max(
        0,
        Math.min(state.streetlight.poles.length - 1, action.index),
      );
      const effectiveStorm =
        state.streetlight.weather === "Heavy Storm"
          ? 5
          : state.streetlight.storm;
      const poles = state.streetlight.poles.map((pole, i) =>
        i === index
          ? {
              ...pole,
              condition: Math.max(
                0,
                pole.condition - (15 + effectiveStorm * 9),
              ),
              lit: false,
              breaker: action.fault?.includes("Lightning")
                ? false
                : pole.breaker,
              fuse: action.fault?.includes("Lightning") ? 0 : pole.fuse,
              ballast: action.fault?.includes("Lightning")
                ? Math.max(0, pole.ballast - 65)
                : pole.ballast,
              lean: effectiveStorm >= 4 && Number(pole.poleQuality || 70) < 70,
              fallen:
                effectiveStorm >= 5 && Number(pole.poleQuality || 70) < 50,
              fault: action.fault || "Lamp failure",
            }
          : pole,
      );
      return {
        ...state,
        streetlight: {
          ...state.streetlight,
          poles,
          events: [
            {
              time: Date.now(),
              message: `Pole ${index + 1}: ${poles[index].fault}`,
            },
            ...state.streetlight.events,
          ].slice(0, 40),
        },
      };
    }
    case "STREETLIGHT_REPAIR": {
      const index = Math.max(
        0,
        Math.min(state.streetlight.poles.length - 1, action.index),
      );
      const poles = state.streetlight.poles.map((pole, i) =>
        i === index
          ? {
              ...pole,
              [action.part || "condition"]: 100,
              condition: action.part ? Math.min(100, pole.condition + 22) : 100,
              fault: null,
              lit: state.streetlight.masterOn,
            }
          : pole,
      );
      return { ...state, streetlight: { ...state.streetlight, poles } };
    }
    case "STREETLIGHT_REPLACE": {
      const index = Math.max(
        0,
        Math.min(state.streetlight.poles.length - 1, action.index),
      );
      const poleCatalog = {
        "Steel utility": ["Galvanised steel", 82],
        "Aluminum tapered": ["Aluminum", 76],
        "Titanium storm": ["Titanium", 118],
        "Concrete heritage": ["Reinforced concrete", 105],
        "Budget thin-wall": ["Thin steel", 42],
        "Decorative cast": ["Cast iron", 68],
      };
      const poles = state.streetlight.poles.map((pole, i) => {
        if (i !== index) return pole;
        if (action.part === "luminaire" && pole.connected !== false)
          return pole;
        if (action.part === "pole") {
          const [poleMaterial, poleQuality] =
            poleCatalog[action.value] || poleCatalog["Steel utility"];
          return {
            ...pole,
            poleDesign: action.value,
            poleMaterial,
            poleQuality,
            condition: 100,
            lean: false,
            fallen: false,
            fault: null,
          };
        }
        if (action.part === "luminaire")
          return {
            ...pole,
            luminaire: action.value,
            condition: Math.max(70, pole.condition),
            fault: null,
          };
        if (action.part === "bulb")
          return {
            ...pole,
            technology: action.value,
            bulb: 100,
            lit: true,
            warmup: /LED/.test(action.value) ? 1 : 0.08,
            fault: null,
          };
        return pole;
      });
      const changed = poles[index] !== state.streetlight.poles[index];
      return {
        ...state,
        streetlight: {
          ...state.streetlight,
          poles,
          events: changed
            ? [
                {
                  time: Date.now(),
                  message: `Pole ${index + 1}: ${action.part} replaced with ${action.value}`,
                },
                ...state.streetlight.events,
              ].slice(0, 40)
            : state.streetlight.events,
        },
        toast: changed
          ? { message: `${action.part} replacement complete`, time: Date.now() }
          : {
              message: "Disconnect the luminaire cable before removal",
              time: Date.now(),
            },
      };
    }
    case "STREETLIGHT_TEST": {
      const index = Math.max(
        0,
        Math.min(state.streetlight.poles.length - 1, action.index),
      );
      const pole = state.streetlight.poles[index];
      const ok =
        pole.breaker &&
        pole.connected !== false &&
        pole.bulb > 5 &&
        pole.fuse > 5 &&
        pole.cable > 5 &&
        pole.condition > 5 &&
        !pole.fallen;
      const poles = state.streetlight.poles.map((item, i) =>
        i === index
          ? {
              ...item,
              lit: ok,
              fault: ok
                ? null
                : item.fault || "Open circuit or failed component",
            }
          : item,
      );
      return {
        ...state,
        streetlight: {
          ...state.streetlight,
          poles,
          events: [
            {
              time: Date.now(),
              message: `Pole ${index + 1}: test ${ok ? "passed" : "failed"}`,
            },
            ...state.streetlight.events,
          ].slice(0, 40),
        },
      };
    }
    case "FACTORY_RESET": {
      const reset = createInitialState();
      return {
        ...reset,
        hardware: state.hardware,
        laptop: state.laptop,
        deskView: state.deskView,
        lab: state.lab,
      };
    }
    case "FULL_FACTORY_RESET":
      return createInitialState();
    case "RESTORE":
      return merge(createInitialState(), action.state);
    default:
      return state;
  }
}

const Ctx = createContext(null);
export function OSProvider({ children }) {
  const [state, reducerDispatch] = useReducer(reducer, undefined, load);
  const dispatch = useCallback((action) => {
    if (action?.type === "FULL_FACTORY_RESET") {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}-unreadable-backup`);
      } catch {
        // The in-memory reset still succeeds when browser storage is blocked.
      }
    }
    reducerDispatch(action);
  }, []);
  const backHandlers = useRef([]);
  const systemPrefersDark = useSyncExternalStore(
    subscribeColorScheme,
    getColorScheme,
    () => true,
  );
  const resolvedTheme =
    state.theme.mode === "auto"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : state.theme.mode;
  const priorOnline = useRef(connectivity(state).isOnline);
  const lastAlarmKey = useRef("");
  const priorNetworkSnapshot = useRef(null);
  const priorSystemSnapshot = useRef(null);
  const set = useCallback(
    (path, value) => dispatch({ type: "SET", path, value }),
    [],
  );
  const registerBackHandler = useCallback((handler) => {
    backHandlers.current.push(handler);
    return () => {
      backHandlers.current = backHandlers.current.filter(
        (candidate) => candidate !== handler,
      );
    };
  }, []);
  const goBack = useCallback(() => {
    if (!state.power.locked) {
      const handler = backHandlers.current.at(-1);
      if (handler?.()) return;
    }
    dispatch({ type: "BACK" });
  }, [state.power.locked]);
  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
      dispatch({ type: "HARDWARE_WATER_TICK" });
      dispatch({ type: "LAPTOP_TICK" });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      dispatch({
        type: "TOAST",
        message: "Storage is full. Remove local photos or app data.",
      });
    }
  }, [state]);
  useEffect(() => {
    if (priorOnline.current === false && connectivity(state).isOnline) {
      dispatch({
        type: "NOTIFY",
        title: "Back online",
        body: `Connected via ${connectivity(state).onlineVia}`,
      });
    }
    priorOnline.current = connectivity(state).isOnline;
  }, [
    state.radio,
    state.wifi,
    state.sim,
    state.defaults,
    state.networkLab,
    state.tray,
    state.hardware,
  ]);
  useEffect(() => {
    const caps = hardwareCapabilities(state);
    const current = {
      power: `${state.power.mode}:${caps.board}:${caps.battery}`,
      hardware: Object.values(state.hardware.components)
        .map(
          (part) =>
            `${part.id}:${part.installed}:${part.connected}:${Math.round(part.condition)}:${part.destroyed}`,
        )
        .join("|"),
      temperature: `${Math.round(state.hardware.temperatures.battery)}:${Math.round(state.hardware.temperatures.mainboard)}:${Math.round(state.hardware.temperatures.modem)}`,
      water: `${state.hardware.water.running}:${Math.round(state.hardware.water.level / 10) * 10}`,
      usb: `${state.laptop.usbConnected}:${caps.usb}:${caps.usbSpecs.standard || "none"}`,
    };
    const previous = priorSystemSnapshot.current;
    if (previous)
      for (const [category, value] of Object.entries(current))
        if (value !== previous[category])
          dispatch({
            type: "LOG_SYSTEM_EVENT",
            event: {
              source: category,
              category,
              type: `${category[0].toUpperCase()}${category.slice(1)} event`,
              message: `${previous[category]} → ${value}`,
            },
          });
    priorSystemSnapshot.current = current;
  }, [state.hardware, state.laptop.usbConnected, state.power.mode]);
  useEffect(() => {
    if (state.power.mode === "booting") {
      sound("boot");
      const id = setTimeout(() => dispatch({ type: "BOOTED" }), 2100);
      return () => clearTimeout(id);
    }
  }, [state.power.mode]);
  useEffect(() => {
    if (!state.activeCall) return;
    if (state.activeCall.emergency) {
      if (!emergencyNetwork(state).reachable) {
        dispatch({ type: "SET", path: "activeCall", value: null });
        dispatch({
          type: "NOTIFY",
          title: "Emergency call ended",
          body: "The emergency cellular route was lost.",
          app: "Phone",
        });
      }
      return;
    }
    const route = voiceBearer(state, state.activeCall.slot);
    if (!route.ok) {
      dispatch({ type: "SET", path: "activeCall", value: null });
      dispatch({
        type: "NOTIFY",
        title: "Call ended",
        body: "The active voice route became unavailable.",
        app: "Phone",
      });
    } else if (route.label !== state.activeCall.bearer) {
      dispatch({
        type: "SET",
        path: "activeCall",
        value: { ...state.activeCall, bearer: route.label },
      });
      dispatch({
        type: "TOAST",
        message: `Call handed over to ${route.label}`,
      });
    }
  }, [
    state.activeCall,
    state.networkLab,
    state.radio,
    state.wifi,
    state.sim,
    state.hardware,
  ]);
  useEffect(() => {
    const caps = hardwareCapabilities(state);
    if (!caps.flashlight && state.radio.flashlight)
      dispatch({ type: "SET", path: "radio.flashlight", value: false });
    if (!caps.display && state.screen.recording)
      dispatch({ type: "SET", path: "screen.recording", value: false });
    if (!caps.wifi && state.radio.wifi)
      dispatch({ type: "SET", path: "radio.wifi", value: false });
    if (!caps.bluetooth && state.radio.bluetooth)
      dispatch({ type: "SET", path: "radio.bluetooth", value: false });
    if (
      (!caps.sensors.accelerometer || !caps.sensors.gyroscope) &&
      state.radio.autoRotate
    )
      dispatch({ type: "SET", path: "radio.autoRotate", value: false });
  }, [state.hardware]);
  useEffect(() => {
    const caps = hardwareCapabilities(state);
    if (
      !caps.battery &&
      caps.externalPower &&
      caps.board &&
      caps.storage &&
      state.power.mode === "off"
    )
      dispatch({ type: "BOOT" });
    else if (!caps.battery && !caps.externalPower && state.power.mode !== "off")
      dispatch({ type: "POWER", value: { mode: "off", locked: true } });
  }, [state.hardware.components, state.battery.charging, state.power.mode]);
  useEffect(() => {
    const net = connectivity(state);
    const lineSnapshots = Object.fromEntries(
      ["physical", "esim"].map((slot) => {
        const quality = lineQuality(state, slot);
        const bearer = voiceBearer(state, slot);
        return [
          slot,
          {
            installed: !!state.sim[slot].installed,
            registered: quality.registered,
            rat: quality.networkType,
            bars: quality.bars,
            dbm: quality.dbm,
            tower: quality.tower?.id,
            voice: bearer.shortLabel || "None",
            dataLimited: quality.plan.exhausted,
            voiceLimited: quality.plan.voiceExhausted,
          },
        ];
      }),
    );
    const current = {
      lines: lineSnapshots,
      wifi: state.wifi.connected || "Disconnected",
      route: net.route,
      weather: `${state.networkLab.weather.mode}:${state.networkLab.weather.stormMultiplier}:${state.networkLab.weather.floor}`,
      shield: state.networkLab.shield,
      load: JSON.stringify(state.networkLab.load),
      operations: JSON.stringify(state.networkLab.operations),
    };
    const previous = priorNetworkSnapshot.current;
    if (previous) {
      for (const slot of ["physical", "esim"])
        for (const key of Object.keys(current.lines[slot]))
          if (current.lines[slot][key] !== previous.lines[slot][key])
            dispatch({
              type: "LOG_NETWORK_EVENT",
              event: {
                source: slot,
                type: key,
                message: `${state.sim[slot].label} ${key}: ${previous.lines[slot][key]} → ${current.lines[slot][key]}`,
              },
            });
      for (const key of [
        "wifi",
        "route",
        "weather",
        "shield",
        "load",
        "operations",
      ])
        if (current[key] !== previous[key])
          dispatch({
            type: "LOG_NETWORK_EVENT",
            event: {
              source: key === "wifi" || key === "route" ? "wifi" : "system",
              type: key,
              message: `${key}: ${previous[key]} → ${current[key]}`,
            },
          });
    }
    priorNetworkSnapshot.current = current;
    if (state.networkLab.handover.auto)
      for (const slot of ["physical", "esim"]) {
        const serving = lineSnapshots[slot].tower;
        if (
          state.sim[slot].installed &&
          serving &&
          state.networkLab.handover.serving[slot] !== serving
        )
          dispatch({
            type: "SET",
            path: `networkLab.handover.serving.${slot}`,
            value: serving,
          });
      }
  }, [
    state.sim,
    state.tray,
    state.radio,
    state.wifi,
    state.defaults,
    state.networkLab,
  ]);
  useEffect(() => {
    const timers = [];
    for (const slot of ["physical", "esim"]) {
      const s = state.sim[slot];
      if (!s.installed || s.registered) continue;
      const stages =
        slot === "physical"
          ? [
              "SIM detected",
              "Reading SIM",
              "Searching for network",
              "Registering",
              "Connecting",
              "Connected",
            ]
          : [
              "Preparing eSIM",
              "Reading profile",
              "Installing profile",
              "Registering",
              "Connecting",
              "eSIM activated",
              "Connected",
            ];
      const index = stages.indexOf(s.status);
      if (index >= 0 && index < stages.length - 1)
        timers.push(
          setTimeout(
            () =>
              dispatch({ type: "SIM_STAGE", slot, stage: stages[index + 1] }),
            slot === "physical" ? 520 : 460,
          ),
        );
    }
    return () => timers.forEach(clearTimeout);
  }, [
    state.sim.physical.status,
    state.sim.esim.status,
    state.sim.physical.installed,
    state.sim.esim.installed,
  ]);
  useEffect(() => {
    const finished = state.timers.find(
      (timer) => timer.remaining === 0 && !timer.notified,
    );
    if (finished) {
      sound("notify");
      set("timers", (timers) =>
        timers.map((timer) =>
          timer.id === finished.id ? { ...timer, notified: true } : timer,
        ),
      );
      dispatch({
        type: "NOTIFY",
        title: "Timer complete",
        body: finished.label,
        app: "Clock",
      });
    }
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const alarm = state.alarms.find(
      (item) => item.enabled && item.time === hhmm,
    );
    const key = alarm ? `${now.toDateString()}-${alarm.id}-${hhmm}` : "";
    if (alarm && lastAlarmKey.current !== key) {
      lastAlarmKey.current = key;
      sound("notify");
      dispatch({
        type: "NOTIFY",
        title: alarm.label || "Alarm",
        body: `${hhmm} · Tap Clock to snooze or turn it off.`,
        app: "Clock",
      });
    }
  }, [Math.floor(state.battery.last / 1000), state.alarms, state.timers, set]);
  const api = useMemo(
    () => ({
      state,
      dispatch,
      set,
      net: connectivity(state),
      resolvedTheme,
      registerBackHandler,
      goBack,
      voice: (slot) => voiceBearer(state, slot),
    }),
    [state, set, resolvedTheme, registerBackHandler, goBack],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export const useOS = () => useContext(Ctx);
export function useSystemBack(handler, active = true) {
  const { registerBackHandler } = useOS();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    if (!active) return;
    return registerBackHandler(() => handlerRef.current?.() !== false);
  }, [active, registerBackHandler]);
}
export { CARRIERS, CORE_APPS, STORE_APPS, connectivity };
