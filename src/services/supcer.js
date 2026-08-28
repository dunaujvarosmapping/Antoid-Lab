export const SUPCER_PARTS = Object.freeze({
  cpuA5: {
    id: "cpuA5",
    brand: "Antoid Genuine",
    name: "A5-560G",
    category: "cpu",
    socket: "AN5",
    cores: 6,
    threads: 12,
    watts: 65,
    graphics: "igpu",
    actual: "6 cores / 12 threads · 3.8 GHz",
  },
  igpuA5: {
    id: "igpuA5",
    brand: "Antoid Genuine",
    name: "Integrated Graphics",
    category: "graphics",
    interface: "integrated",
    vram: 2,
    performance: 24,
    watts: 18,
    actual: "2 GB shared DDR4",
  },
  boardA5: {
    id: "boardA5",
    brand: "Antoid Genuine",
    name: "OfficeBoard AN5-D4",
    category: "motherboard",
    socket: "AN5",
    ramGeneration: "DDR4",
    sataPorts: 4,
    pcie: "4.0 x16",
  },
  ram16: {
    id: "ram16",
    brand: "Antoid Genuine",
    name: "16 GB DDR4",
    category: "memory",
    generation: "DDR4",
    capacity: 16,
    speed: 3200,
  },
  ram8Byte: {
    id: "ram8Byte",
    brand: "BytePeak",
    name: "PeakRAM 8 GB DDR4",
    category: "memory",
    generation: "DDR4",
    capacity: 8,
    speed: 3200,
    price: 11990,
  },
  ram32Byte: {
    id: "ram32Byte",
    brand: "BytePeak",
    name: "PeakRAM Pro 32 GB DDR4",
    category: "memory",
    generation: "DDR4",
    capacity: 32,
    speed: 3600,
    price: 29990,
  },
  ram16D5: {
    id: "ram16D5",
    brand: "Korax",
    name: "Velocity 16 GB DDR5",
    category: "memory",
    generation: "DDR5",
    capacity: 16,
    speed: 6000,
    price: 24990,
  },
  ssd500: {
    id: "ssd500",
    brand: "Antoid Genuine",
    name: "500 GB SATA SSD",
    category: "storage",
    interface: "SATA",
    capacity: 500,
    speed: 520,
    bootable: true,
  },
  ssd2tb: {
    id: "ssd2tb",
    brand: "BytePeak",
    name: "ArchivePeak 2 TB SATA SSD",
    category: "storage",
    interface: "SATA",
    capacity: 2000,
    speed: 550,
    bootable: false,
    price: 64990,
  },
  psu500: {
    id: "psu500",
    brand: "Antoid Genuine",
    name: "500 W Office PSU",
    category: "psu",
    watts: 500,
    efficiency: 82,
  },
  psu850: {
    id: "psu850",
    brand: "VoltEdge",
    name: "TrueRail 850 W",
    category: "psu",
    watts: 850,
    efficiency: 92,
    price: 54990,
  },
  coolerStock: {
    id: "coolerStock",
    brand: "Antoid Genuine",
    name: "A5 Quiet Cooler",
    category: "cooling",
    socket: "AN5",
    cooling: 72,
  },
  coolerAir: {
    id: "coolerAir",
    brand: "AirForge",
    name: "TowerFlow 140",
    category: "cooling",
    socket: "AN5",
    cooling: 94,
    price: 18990,
  },
  wifi: {
    id: "wifi",
    brand: "Antoid Genuine",
    name: "AN-WiFi 5 Adapter",
    category: "network",
    bands: ["2.4 GHz", "5 GHz"],
  },
  gpu1210: {
    id: "gpu1210",
    brand: "Supra Electronics",
    name: "Game Ready 1210",
    category: "graphics",
    interface: "PCIe",
    advertised: "4 GB GDDR6",
    vram: 4,
    performance: 48,
    watts: 90,
    price: 79990,
  },
  gpu1230: {
    id: "gpu1230",
    brand: "Supra Electronics",
    name: "Game Ready 1230",
    category: "graphics",
    interface: "PCIe",
    advertised: "6 GB GDDR6",
    vram: 6,
    performance: 62,
    watts: 125,
    price: 119990,
  },
  gpu1250: {
    id: "gpu1250",
    brand: "Supra Electronics",
    name: "Game Ready 1250",
    category: "graphics",
    interface: "PCIe",
    advertised: "8 GB GDDR6",
    vram: 8,
    performance: 76,
    watts: 170,
    price: 174990,
  },
  gpu1270: {
    id: "gpu1270",
    brand: "Supra Electronics",
    name: "Game Ready 1270",
    category: "graphics",
    interface: "PCIe",
    advertised: "12 GB GDDR6X",
    vram: 12,
    performance: 91,
    watts: 240,
    price: 249990,
  },
  gpu1290: {
    id: "gpu1290",
    brand: "Supra Electronics",
    name: "Game Ready 1290",
    category: "graphics",
    interface: "PCIe",
    advertised: "16 GB GDDR6X",
    vram: 16,
    performance: 116,
    watts: 330,
    price: 389990,
  },
  gpu1290xt: {
    id: "gpu1290xt",
    brand: "Supra Electronics",
    name: "Game Ready 1290 XT",
    category: "graphics",
    interface: "PCIe",
    advertised: "24 GB GDDR6X",
    vram: 24,
    performance: 138,
    watts: 410,
    price: 549990,
  },
  gpuFake: {
    id: "gpuFake",
    brand: "ZhenTek",
    name: "Geferc Ultrsuper 8000",
    category: "graphics",
    interface: "PCIe",
    advertised: "11000 GB VRAM",
    actual: "2 GB DDR3 · legacy core",
    vram: 2,
    performance: 13,
    watts: 145,
    reliability: 38,
    price: 19990,
  },
});

const now = () => Date.now();
const file = (id, name, type, size, path, content = "") => ({
  id,
  name,
  type,
  size,
  path,
  content,
  created: now(),
  modified: now(),
  deletedFrom: null,
});

export function createRouterState() {
  return {
    model: "ANRouter AR-500",
    firmware: "ANR 5.0 beta 2",
    restarting: false,
    ip: "192.168.0.1",
    uptimeStartedAt: now(),
    wifiEnabled: true,
    ssid: "Antoid Lab",
    password: "1112",
    security: "WPA2/WPA3",
    hidden: false,
    bands: { "2.4 GHz": true, "5 GHz": true, "6 GHz": false },
    channel: 36,
    channelWidth: 80,
    transmitPower: 100,
    wan: true,
    dhcp: true,
    dhcpStart: 20,
    dhcpEnd: 199,
    dns: "Automatic",
    guest: { enabled: false, ssid: "Antoid Guest" },
    blocked: [],
    clientNames: {},
    conditions: {
      signal: 88,
      noise: 4,
      congestion: 10,
      latency: 14,
      bandwidth: 420,
      reliability: 99,
      packetLoss: 0,
    },
  };
}

export function createFilesystem() {
  return {
    capacityGb: 500,
    items: [
      file("docs", "Documents", "folder", 0, "/Users/Antoid"),
      file("pics", "Pictures", "folder", 0, "/Users/Antoid"),
      file("music", "Music", "folder", 0, "/Users/Antoid"),
      file("videos", "Videos", "folder", 0, "/Users/Antoid"),
      file("downloads", "Downloads", "folder", 0, "/Users/Antoid"),
      file("desktop", "Desktop", "folder", 0, "/Users/Antoid"),
      file(
        "readme",
        "Welcome.txt",
        "text",
        2,
        "/Users/Antoid/Documents",
        "Welcome to Antoid OS 7 Public Beta.\nYour files live on the Antoid Genuine SATA SSD.",
      ),
      file("song", "Lab Theme.anaudio", "audio", 4200, "/Users/Antoid/Music"),
      file(
        "video",
        "SUPCer Tour.anvideo",
        "video",
        18400,
        "/Users/Antoid/Videos",
      ),
      file(
        "paintpkg",
        "Antoid Sketch Tools.ant",
        "package",
        880,
        "/Users/Antoid/Downloads",
        JSON.stringify({
          id: "sketch-tools",
          name: "Antoid Sketch Tools",
          version: "1.0",
          publisher: "Antoid Genuine",
          minOS: 7,
          permissions: ["Pictures library"],
          app: "sketch-tools",
          icon: "✎",
          files: ["/Apps/SketchTools/brushes.json"],
          associations: [".anpaint"],
          install: { launcher: true, startMenu: true },
          signature: "ANTOID-VERIFIED-DEMO",
        }),
      ),
    ],
    recycle: [],
  };
}

export function createSUPCerState() {
  return {
    model: "Antoid SUPCer · Antoid OS Edition",
    unboxed: true,
    sidePanel: "closed",
    power: "off",
    bootStage: "off",
    bootStartedAt: 0,
    bootMessage: "System powered off",
    biosRequested: false,
    biosOpen: false,
    cables: {
      ac: true,
      monitorPower: true,
      display: true,
      displayPort: "motherboard",
      ethernet: false,
      keyboard: true,
      mouse: true,
      sataData: true,
      sataPower: true,
      cpuPower: true,
      boardPower: true,
      gpuPower: false,
    },
    monitor: {
      power: true,
      source: "Digital",
      brightness: 82,
      condition: 100,
      fault: false,
    },
    hardware: {
      cpu: "cpuA5",
      motherboard: "boardA5",
      ramSlots: ["ram16", null, null, null],
      storage: "ssd500",
      psu: "psu500",
      cooler: "coolerStock",
      gpu: null,
      network: "wifi",
      fans: { cpu: true, case: true },
    },
    latches: {
      ram: [false, false, false, false],
      pcie: false,
      cooler: false,
      cpu: false,
    },
    bios: {
      version: "ANT-BIOS 5.00B",
      date: "2026-08-28",
      bootOrder: ["SATA SSD", "USB", "Network"],
      igpuEnabled: true,
      fanMode: "Automatic",
      timeOffset: 0,
      pending: null,
    },
    conditions: {
      ac: true,
      psuHealth: 100,
      motherboardHealth: 100,
      postFault: "none",
      cpuLoad: 12,
      ambient: 24,
      memoryErrors: 0,
      ssdHealth: 100,
      storageCorruption: false,
      graphicsFault: false,
      fanHealth: 100,
      dust: 6,
      keyboard: true,
      mouse: true,
      usbFault: false,
    },
    inventory: [
      "ram8Byte",
      "ram32Byte",
      "ram16D5",
      "ssd2tb",
      "psu850",
      "coolerAir",
      "gpu1210",
      "gpu1250",
      "gpu1290xt",
      "gpuFake",
    ],
    network: { enabled: true, connected: null, remembered: {}, password: "" },
    desktop: {
      wallpaper: "aurora7",
      accent: "#4ea7d8",
      volume: 58,
      muted: false,
      locked: false,
      user: "Antoid User",
      windows: [],
      activeWindow: null,
      nextZ: 2,
      startOpen: false,
      trayOpen: false,
      notifications: ["Welcome to Antoid OS 7 Public Beta"],
      clipboard: null,
    },
    filesystem: createFilesystem(),
    installedApps: [
      "files",
      "browser",
      "paint",
      "media",
      "text",
      "calculator",
      "system",
      "tasks",
      "settings",
      "orbital",
      "pairs",
    ],
    installedPackages: {},
    fileAssociations: {
      ".txt": "text",
      ".anpaint": "paint",
      ".anaudio": "media",
      ".anvideo": "media",
      ".ant": "installer",
    },
    browser: {
      tabs: [
        {
          id: "home",
          title: "Antoid Start",
          address: "antoid:start",
          history: ["antoid:start"],
          index: 0,
        },
      ],
      active: "home",
      bookmarks: ["antoid:start"],
      downloads: [],
    },
    paint: {
      fileId: null,
      name: "Untitled.anpaint",
      color: "#214a77",
      width: 5,
      tool: "brush",
      strokes: [],
      redo: [],
    },
    textEditor: { fileId: null, text: "" },
    media: { fileId: "song", playing: false, position: 0, volume: 70 },
    calculator: { display: "0", history: [] },
    game: { score: 0, best: 0, target: 4, running: false },
    pairs: {
      cards: [1, 2, 3, 4, 1, 2, 3, 4],
      open: [],
      matched: [],
      moves: 0,
      best: null,
      running: false,
    },
  };
}

export function supcerFacts(pc) {
  const parts = SUPCER_PARTS,
    h = pc.hardware;
  const cpu = parts[h.cpu],
    board = parts[h.motherboard],
    psu = parts[h.psu],
    discrete = parts[h.gpu];
  const ram = h.ramSlots
    .map((id) => parts[id])
    .filter(Boolean)
    .filter((r) => r.generation === board?.ramGeneration);
  const memoryGb = ram.reduce((n, r) => n + r.capacity, 0);
  const storage = parts[h.storage];
  const storageOnline =
    !!storage &&
    pc.cables.sataData &&
    pc.cables.sataPower &&
    pc.conditions.ssdHealth > 0 &&
    !pc.conditions.storageCorruption;
  const igpu =
    cpu?.graphics === "igpu" && pc.bios.igpuEnabled ? parts.igpuA5 : null;
  const graphics = discrete || igpu;
  const discretePowered =
    !discrete || discrete.watts <= 75 || pc.cables.gpuPower;
  const graphicsOutput =
    discrete && discretePowered && pc.cables.displayPort === "gpu"
      ? discrete
      : !discrete || pc.cables.displayPort === "motherboard"
        ? igpu
        : null;
  const draw = (cpu?.watts || 0) + (graphics?.watts || 0) + 110;
  const powered =
    pc.cables.ac &&
    pc.conditions.ac &&
    pc.conditions.psuHealth > 0 &&
    pc.cables.boardPower &&
    pc.cables.cpuPower;
  const postErrors = [];
  if (!powered) postErrors.push("NO SYSTEM POWER");
  if (!cpu) postErrors.push("CPU NOT DETECTED");
  if (!memoryGb) postErrors.push("MEMORY NOT DETECTED");
  if (!graphicsOutput || pc.conditions.graphicsFault)
    postErrors.push("DISPLAY ADAPTER ERROR");
  if (draw > (psu?.watts || 0)) postErrors.push("PSU CAPACITY EXCEEDED");
  if (pc.conditions.postFault !== "none")
    postErrors.push(pc.conditions.postFault.toUpperCase());
  const temperature = Math.round(
    pc.conditions.ambient +
      pc.conditions.cpuLoad * 0.42 +
      pc.conditions.dust * 0.12 +
      (h.fans.cpu && pc.conditions.fanHealth ? -10 : 25),
  );
  return {
    cpu,
    board,
    psu,
    ram,
    memoryGb,
    storage,
    storageOnline,
    igpu,
    discrete,
    graphics,
    discretePowered,
    graphicsOutput,
    draw,
    powered,
    postErrors,
    temperature,
    canPost: postErrors.length === 0,
    canBoot: postErrors.length === 0 && storageOnline && storage?.bootable,
  };
}

export function monitorState(pc) {
  const f = supcerFacts(pc);
  if (!pc.monitor.power || !pc.cables.monitorPower) return "off";
  if (pc.monitor.fault || pc.monitor.condition <= 0) return "fault";
  if (!pc.cables.display || !f.graphicsOutput || pc.conditions.graphicsFault)
    return "no-signal";
  if (["off", "sleep", "failed"].includes(pc.power)) return "standby";
  return "active";
}

export function routerClients(state) {
  const r = state.lab.router,
    clients = [];
  const wifiBand = r.bands["5 GHz"]
    ? "5 GHz"
    : r.bands["2.4 GHz"]
      ? "2.4 GHz"
      : null;
  const add = (id, name, connected, type, band, ip) => {
    if (connected)
      clients.push({
        id,
        name: r.clientNames[id] || name,
        type,
        band,
        ip,
        blocked: r.blocked.includes(id),
      });
  };
  add(
    "phone",
    "Antoid 1",
    state.wifi.connected === r.ssid &&
      state.wifi.credentials?.[r.ssid] === r.password &&
      r.wifiEnabled &&
      wifiBand &&
      r.dhcp,
    "Wi-Fi",
    wifiBand || "Wireless unavailable",
    `${r.ip.split(".").slice(0, 3).join(".")}.24`,
  );
  const utvWired = state.lab.cables.ethernetToUtv;
  add(
    "utv",
    "Antoid UTV 1",
    (utvWired ||
      (state.lab.utv.wifi.connected === r.ssid &&
        state.lab.utv.wifi.remembered?.[r.ssid] === r.password &&
        r.wifiEnabled &&
        wifiBand)) &&
      r.dhcp,
    utvWired ? "Ethernet" : "Wi-Fi",
    utvWired ? "LAN" : wifiBand || "Wireless unavailable",
    `${r.ip.split(".").slice(0, 3).join(".")}.31`,
  );
  const pc = state.lab.supcer;
  add(
    "supcer",
    "Antoid SUPCer",
    (pc.cables.ethernet || (pc.network?.connected === r.ssid && wifiBand)) &&
      r.dhcp,
    pc.cables.ethernet ? "Ethernet" : "Wi-Fi",
    pc.cables.ethernet ? "LAN" : wifiBand || "Wireless unavailable",
    `${r.ip.split(".").slice(0, 3).join(".")}.40`,
  );
  return clients;
}

export function routerAccess(state, address) {
  const normalized = address.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const local = normalized === state.lab.router.ip;
  const pc = state.lab.supcer;
  const connected =
    state.lab.router.dhcp &&
    !state.lab.router.blocked.includes("supcer") &&
    (pc.cables.ethernet ||
      (pc.network?.connected === state.lab.router.ssid &&
        pc.network?.remembered?.[state.lab.router.ssid] ===
          state.lab.router.password &&
        state.lab.router.wifiEnabled &&
        (state.lab.router.bands["5 GHz"] ||
          state.lab.router.bands["2.4 GHz"])));
  if (local)
    return connected
      ? { kind: "router" }
      : {
          kind: "error",
          message: "ANRouter is not reachable on the local network.",
        };
  const hotspotConnected =
    pc.network?.connected === (state.hotspot?.ssid || "Antoid 1") &&
    pc.network?.remembered?.[state.hotspot?.ssid || "Antoid 1"] ===
      state.hotspot?.password &&
    state.radio?.hotspot &&
    state.power?.mode === "on" &&
    ((state.radio?.mobileData &&
      [state.sim?.physical, state.sim?.esim].some(
        (line) => line?.installed && line?.enabled && line?.registered,
      )) ||
      (state.wifi?.connected === state.lab.router.ssid &&
        state.wifi?.credentials?.[state.lab.router.ssid] ===
          state.lab.router.password &&
        state.lab.router.wan));
  if ((!connected || !state.lab.router.wan) && !hotspotConnected)
    return { kind: "error", message: "No internet connection." };
  return { kind: "page", title: normalized || "Antoid Start" };
}

export function usedStorageMb(fs) {
  return [...fs.items, ...fs.recycle].reduce(
    (n, item) => n + (item.size || 0),
    0,
  );
}
