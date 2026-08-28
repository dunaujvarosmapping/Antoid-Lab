export const HARDWARE_GROUPS = [
  "Exterior",
  "Display assembly",
  "Mainboard",
  "Cameras",
  "Radios & antennas",
  "Power & charging",
  "Audio & haptics",
  "Sensors",
  "Thermal & sealing",
];

export const COMPONENT_DEFINITIONS = {
  backCover: { description: "The removable rear enclosure protects the internals and completes the water-resistant seal.", keywords: ["rear glass", "cover", "exterior"] },
  seals: { description: "Single-use perimeter adhesive that restores dust and water resistance after reassembly.", keywords: ["IP68", "adhesive", "gasket"] },
  chargingCoil: { description: "Inductive power and NFC antenna assembly mounted beneath the back cover.", keywords: ["wireless charging", "NFC", "coil"] },
  frame: { description: "The load-bearing removable mid-frame that locates and protects every internal module.", keywords: ["chassis", "housing", "plastic", "aluminum", "titanium"] },
  battery: { description: "Replaceable lithium-polymer energy pack with temperature and safety monitoring.", keywords: ["power", "cell", "capacity"] },
  batteryBracket: { description: "Mechanical retainer that secures the battery against drops and vibration.", keywords: ["bracket", "battery", "retainer"] },
  batteryConnector: { description: "Removable power interconnect carrying battery voltage and telemetry to the mainboard.", keywords: ["battery flex", "power connector", "telemetry"] },
  display: { description: "Complete removable OLED image panel; without it the front exposes the display cavity.", keywords: ["screen", "OLED", "panel"] },
  digitizer: { description: "Touch-sensing layer that converts finger gestures into input independently of the image panel.", keywords: ["touch", "screen", "input"] },
  displayFlex: { description: "Display data and power flex connecting the screen assembly to the logic board.", keywords: ["screen cable", "display connector", "flex"] },
  mainboard: { description: "Primary logic board linking compute, storage, radios, cameras and peripheral controllers.", keywords: ["logic board", "motherboard", "PCB"] },
  mainboardShield: { description: "Removable EMI and thermal shield protecting sensitive mainboard circuits.", keywords: ["shield", "EMI", "heat spreader"] },
  soc: { description: "Antoid application processor responsible for operating-system compute and graphics.", keywords: ["processor", "CPU", "GPU", "chip"] },
  ram: { description: "High-speed working memory package used by the operating system and applications.", keywords: ["memory", "LPDDR", "RAM"] },
  storage: { description: "Replaceable system storage containing Antoid OS, applications and user data.", keywords: ["flash", "UFS", "NVMe", "disk"] },
  modem: { description: "Cellular baseband module providing 5G, LTE, UMTS and GSM network access.", keywords: ["5G", "4G", "cellular", "baseband"] },
  cellularAntenna: { description: "Multi-element cellular antenna array that determines radio sensitivity and signal quality.", keywords: ["signal", "5G antenna", "radio"] },
  antennaInterconnect: { description: "Coaxial interconnect harness joining the radio modules to the chassis antennas.", keywords: ["coax", "RF cable", "antenna flex"] },
  wifiModule: { description: "Combined Wi-Fi and Bluetooth radio controller mounted on the mainboard.", keywords: ["Wi-Fi", "Bluetooth", "radio"] },
  wifiAntenna: { description: "Dedicated antenna for Wi-Fi and Bluetooth transmission and reception.", keywords: ["Wi-Fi antenna", "Bluetooth antenna", "signal"] },
  gpsAntenna: { description: "Satellite-navigation antenna used for accurate GNSS positioning.", keywords: ["GPS antenna", "GNSS", "location"] },
  fmReceiver: { description: "Dedicated analogue FM tuner and demodulator for 87.5–108.0 MHz broadcast reception, stereo decoding and RDS.", keywords: ["FM", "radio", "tuner", "RDS", "receiver"] },
  fmAntenna: { description: "Dedicated internal FM antenna element providing broadcast reception without an accessory cable.", keywords: ["FM antenna", "radio antenna", "broadcast"] },
  headphoneJack: { description: "Serviceable 3.5 mm audio jack and detection module carrying analogue headphone audio and the wired FM antenna path.", keywords: ["3.5 mm", "headphones", "audio jack", "FM antenna"] },
  simReader: { description: "Dual nano-SIM contact reader; SIM provisioning and eSIM profiles remain separate data.", keywords: ["SIM reader", "nano SIM", "contacts"] },
  simTray: { description: "Removable dual nano-SIM carrier that physically holds inserted SIM cards.", keywords: ["SIM tray", "SIM carrier", "slot"] },
  secureElement: { description: "Protected security element storing device credentials and supporting eSIM authentication.", keywords: ["eSIM", "security", "credentials"] },
  usbBoard: { description: "First-class USB-C daughterboard handling wired charging, data and laptop detection.", keywords: ["USB-C", "charging port", "data", "daughterboard"] },
  usbFlex: { description: "Removable flex cable joining the USB-C daughterboard to the mainboard and power path.", keywords: ["USB cable", "charging flex", "interconnect"] },
  sideButtonFlex: { description: "Flexible circuit carrying power and volume button input to the mainboard.", keywords: ["power button", "volume", "flex"] },
  flashlight: { description: "Dual-tone LED illumination module used by the rear cameras and torch.", keywords: ["flash", "torch", "LED"] },
  wideCamera: { description: "Primary wide-angle camera module for high-resolution photo and video capture.", keywords: ["main camera", "wide", "photo"] },
  ultrawideCamera: { description: "Ultra-wide camera module for expansive scenes and close-range perspective.", keywords: ["ultrawide", "camera", "wide angle"] },
  telephotoCamera: { description: "Optically stabilized telephoto camera providing lossless long-range framing.", keywords: ["telephoto", "zoom", "camera"] },
  frontCamera: { description: "Front-facing camera module used for selfies, video calls and face-aware features.", keywords: ["selfie", "front camera", "video call"] },
  cameraBracket: { description: "Precision retainer aligning the rear camera modules with the lens openings.", keywords: ["camera bracket", "retainer", "alignment"] },
  cameraFlex: { description: "Shared high-speed camera interconnect carrying image data and stabilization control.", keywords: ["camera cable", "camera flex", "connector"] },
  speaker: { description: "Bottom loudspeaker module for media, ringtones and the lower stereo channel.", keywords: ["loudspeaker", "audio", "ringer"] },
  speakerBracket: { description: "Acoustic and mechanical retainer sealing the bottom loudspeaker to the frame.", keywords: ["speaker bracket", "acoustic seal", "retainer"] },
  earpiece: { description: "Upper speaker module for calls and the upper stereo audio channel.", keywords: ["earpiece", "receiver", "speaker"] },
  earpieceFlex: { description: "Removable flex linking the earpiece speaker to the mainboard audio path.", keywords: ["earpiece cable", "audio flex", "receiver"] },
  microphones: { description: "Three-microphone array for calls, recording and active noise cancellation.", keywords: ["microphone", "voice", "noise cancellation"] },
  haptics: { description: "Linear vibration actuator providing tactile feedback and alert patterns.", keywords: ["vibration", "haptic motor", "feedback"] },
  proximitySensor: { description: "Sensor that turns the display off when the phone is held to the ear.", keywords: ["proximity", "call sensor", "screen off"] },
  ambientSensor: { description: "Light sensor used for automatic display brightness and environment awareness.", keywords: ["ambient light", "brightness", "sensor"] },
  sensorFlex: { description: "Upper sensor flex connecting proximity and ambient-light modules to the mainboard.", keywords: ["sensor cable", "upper flex", "proximity"] },
  accelerometer: { description: "Motion sensor measuring linear acceleration and device orientation changes.", keywords: ["motion", "orientation", "sensor"] },
  gyroscope: { description: "Rotational motion sensor used by camera stabilization, games and navigation.", keywords: ["rotation", "motion", "sensor"] },
  magnetometer: { description: "Digital compass sensor measuring the direction of Earth’s magnetic field.", keywords: ["compass", "heading", "sensor"] },
  gps: { description: "Multi-constellation GNSS receiver calculating the phone’s geographic location.", keywords: ["GPS", "Galileo", "location"] },
  nfc: { description: "Near-field communication controller for contactless interaction and tag reading.", keywords: ["NFC", "contactless", "tap"] },
  thermalSystem: { description: "Vapour-chamber heat spreader moving heat away from the processor and modem.", keywords: ["cooling", "vapour chamber", "thermal"] },
};

const part = (id, name, group, layer, extra = {}) => ({
  id,
  name,
  group,
  layer,
  manufacturer: "Genuine",
  installed: true,
  connected: true,
  condition: 100,
  waterExposure: 0,
  destroyed: false,
  powered: true,
  serial: `ANT-${id.toUpperCase()}-001`,
  description: COMPONENT_DEFINITIONS[id]?.description || `${name} service component.`,
  keywords: COMPONENT_DEFINITIONS[id]?.keywords || [],
  removable: true,
  ...extra,
});

export const createGenuineComponents = () => ({
  backCover: part("backCover", "Glass back cover", "Exterior", 1, {
    material: "Victus glass",
    color: "Aurora graphite",
  }),
  seals: part("seals", "IP68 adhesive seals", "Thermal & sealing", 2, {
    rating: "IP68",
    reusable: false,
  }),
  chargingCoil: part(
    "chargingCoil",
    "Wireless charging & NFC coil",
    "Power & charging",
    3,
    {
      watts: 15,
      nfc: true,
    },
  ),
  frame: part("frame", "Structural mid-frame", "Exterior", 4, {
    material: "Aerospace aluminium",
    rigidity: 92,
  }),
  battery: part("battery", "Lithium battery", "Power & charging", 5, {
    capacityMah: 4800,
    chemistry: "Li-ion polymer",
    swelling: 0,
    punctured: false,
    thermalLimit: 49,
  }),
  batteryBracket: part("batteryBracket", "Battery retaining bracket", "Power & charging", 6),
  batteryConnector: part("batteryConnector", "Battery power interconnect", "Power & charging", 7, { dependsOn: ["mainboard"] }),
  display: part("display", "6.5-inch display panel", "Display assembly", 6, {
    technology: "LTPO OLED",
    tier: "Premium",
    resolution: "2400 × 1080",
    refreshHz: 120,
    peakNits: 1800,
    hdr: true,
    pwmHz: 1440,
    colorGamut: "P3",
    touchLatency: 8,
  }),
  digitizer: part("digitizer", "Touch digitizer", "Display assembly", 6, {
    sampleRateHz: 360,
    touchLatency: 8,
  }),
  displayFlex: part("displayFlex", "Display flex cable", "Display assembly", 7, { dependsOn: ["mainboard"] }),
  mainboard: part("mainboard", "Antoid logic board", "Mainboard", 7, {
    boardRevision: "A3",
    architecture: "64-bit",
  }),
  mainboardShield: part("mainboardShield", "Mainboard EMI shield", "Mainboard", 8),
  soc: part("soc", "Antoid A1 SoC", "Mainboard", 8, {
    cores: 8,
    processNm: 4,
    clockGhz: 3.05,
    dependsOn: ["mainboard"],
  }),
  ram: part("ram", "Memory package", "Mainboard", 8, {
    capacityGb: 8,
    type: "LPDDR5X",
    dependsOn: ["mainboard"],
  }),
  storage: part("storage", "Internal flash storage", "Mainboard", 8, {
    model: "Genuine Antoid UFS 2.0 256 GB",
    capacityGb: 256,
    actualCapacityGb: 256,
    type: "UFS 2.0",
    readMbps: 850,
    writeMbps: 420,
    dependsOn: ["mainboard"],
  }),
  modem: part("modem", "5G cellular modem", "Radios & antennas", 8, {
    generations: ["5G SA", "5G NSA", "4G+", "4G", "3G", "EDGE"],
    maxDownMbps: 2400,
    maxUpMbps: 350,
    dependsOn: ["mainboard"],
  }),
  cellularAntenna: part(
    "cellularAntenna",
    "Cellular antenna array",
    "Radios & antennas",
    4,
    {
      antennaGainDb: 0,
      elements: 4,
    },
  ),
  antennaInterconnect: part("antennaInterconnect", "RF antenna interconnect", "Radios & antennas", 8),
  wifiModule: part(
    "wifiModule",
    "Wi-Fi / Bluetooth module",
    "Radios & antennas",
    8,
    {
      wifi: "Wi-Fi 6E",
      bluetooth: "5.3",
      maxMbps: 1200,
      dependsOn: ["mainboard"],
    },
  ),
  wifiAntenna: part("wifiAntenna", "Wi-Fi antenna", "Radios & antennas", 4, {
    antennaGainDb: 0,
  }),
  gpsAntenna: part("gpsAntenna", "GNSS antenna", "Radios & antennas", 4, {
    accuracyM: 2.5,
  }),
  fmReceiver: part("fmReceiver", "FM receiver / tuner", "Radios & antennas", 8, {
    rangeMHz: "87.5–108.0",
    sensitivity: 1,
    noisePenalty: 0,
    stereoLock: 55,
    rdsThreshold: 62,
    dependsOn: ["mainboard"],
  }),
  fmAntenna: part("fmAntenna", "Internal FM antenna", "Radios & antennas", 4, {
    efficiency: 1,
  }),
  simReader: part("simReader", "Dual nano-SIM reader", "Mainboard", 7, {
    slots: 2,
    esim: true,
    dependsOn: ["mainboard", "modem"],
  }),
  simTray: part("simTray", "Dual nano-SIM tray", "Exterior", 2, { slots: 2 }),
  secureElement: part("secureElement", "Secure element", "Mainboard", 8, { dependsOn: ["mainboard"] }),
  usbBoard: part("usbBoard", "USB-C daughterboard", "Power & charging", 9, {
    standard: "USB 3.2 Gen 2",
    speedGbps: 10,
    chargingWatts: 45,
    videoOut: true,
  }),
  usbFlex: part("usbFlex", "USB-C interconnect flex", "Power & charging", 8, { dependsOn: ["mainboard"] }),
  headphoneJack: part("headphoneJack", "3.5 mm audio jack module", "Audio & haptics", 9, {
    standard: "3.5 mm TRRS",
    detectionReliability: 1,
    antennaReliability: 1,
    channels: 2,
    crackle: 0,
    dependsOn: ["mainboard"],
  }),
  sideButtonFlex: part(
    "sideButtonFlex",
    "Side-button flex cable",
    "Mainboard",
    9,
    {
      buttons: ["power", "volumeUp", "volumeDown"],
    },
  ),
  flashlight: part("flashlight", "Dual-tone LED flash", "Cameras", 9, {
    lumens: 110,
    colorTemperatureK: 4800,
  }),
  wideCamera: part("wideCamera", "50 MP wide camera", "Cameras", 9, {
    megapixels: 50,
    aperture: "f/1.7",
    ois: true,
    maxVideo: "4K60",
    lens: "Wide",
  }),
  ultrawideCamera: part(
    "ultrawideCamera",
    "12 MP ultra-wide camera",
    "Cameras",
    9,
    {
      megapixels: 12,
      aperture: "f/2.2",
      fieldOfView: 120,
      lens: "Ultra-wide",
    },
  ),
  telephotoCamera: part("telephotoCamera", "10 MP 3× telephoto", "Cameras", 9, {
    megapixels: 10,
    opticalZoom: 3,
    ois: true,
    lens: "Telephoto",
  }),
  frontCamera: part("frontCamera", "16 MP front camera", "Cameras", 6, {
    megapixels: 16,
    maxVideo: "4K30",
    lens: "Front",
  }),
  cameraBracket: part("cameraBracket", "Rear camera retaining bracket", "Cameras", 8),
  cameraFlex: part("cameraFlex", "Camera interconnect flex", "Cameras", 8, { dependsOn: ["mainboard"] }),
  speaker: part("speaker", "Bottom loudspeaker", "Audio & haptics", 9, {
    maxDb: 88,
    stereo: true,
  }),
  speakerBracket: part("speakerBracket", "Loudspeaker retaining bracket", "Audio & haptics", 9),
  earpiece: part("earpiece", "Earpiece speaker", "Audio & haptics", 6, {
    maxDb: 74,
  }),
  earpieceFlex: part("earpieceFlex", "Earpiece interconnect flex", "Audio & haptics", 7, { dependsOn: ["mainboard"] }),
  microphones: part(
    "microphones",
    "Triple microphone array",
    "Audio & haptics",
    9,
    {
      count: 3,
      noiseCancellation: true,
    },
  ),
  haptics: part("haptics", "Linear haptic motor", "Audio & haptics", 9, {
    actuator: "X-axis linear",
  }),
  proximitySensor: part("proximitySensor", "Proximity sensor", "Sensors", 6),
  ambientSensor: part("ambientSensor", "Ambient light sensor", "Sensors", 6),
  sensorFlex: part("sensorFlex", "Upper sensor flex", "Sensors", 7, { dependsOn: ["mainboard"] }),
  accelerometer: part("accelerometer", "Accelerometer", "Sensors", 8, {
    dependsOn: ["mainboard"],
  }),
  gyroscope: part("gyroscope", "Gyroscope", "Sensors", 8, {
    dependsOn: ["mainboard"],
  }),
  magnetometer: part("magnetometer", "Magnetometer", "Sensors", 8, {
    dependsOn: ["mainboard"],
  }),
  gps: part("gps", "GNSS receiver", "Sensors", 8, {
    systems: ["GPS", "Galileo", "GLONASS"],
    dependsOn: ["mainboard", "gpsAntenna"],
  }),
  nfc: part("nfc", "NFC controller", "Sensors", 8, {
    dependsOn: ["mainboard", "chargingCoil"],
  }),
  thermalSystem: part(
    "thermalSystem",
    "Vapour chamber",
    "Thermal & sealing",
    7,
    {
      areaMm2: 4100,
      efficiency: 1,
    },
  ),
});

export const REPLACEMENT_PARTS = [
  {
    type: "fmReceiver",
    manufacturer: "Genuine",
    name: "Genuine Antoid FM receiver / tuner",
    price: 18900,
    specs: { rangeMHz: "87.5–108.0", sensitivity: 1, noisePenalty: 0, stereoLock: 55, rdsThreshold: 62 },
  },
  {
    type: "fmReceiver",
    manufacturer: "Extreme Budget",
    name: "ValueWave compatible FM tuner",
    price: 4900,
    specs: { rangeMHz: "87.5–108.0", sensitivity: 0.68, noisePenalty: 13, stereoLock: 72, rdsThreshold: 80 },
  },
  {
    type: "fmAntenna",
    manufacturer: "Genuine",
    name: "Genuine Antoid internal FM antenna",
    price: 9900,
    specs: { efficiency: 1 },
  },
  {
    type: "fmAntenna",
    manufacturer: "Extreme Budget",
    name: "ValueLine flexible FM antenna",
    price: 2900,
    specs: { efficiency: 0.62 },
  },
  {
    type: "headphoneJack",
    manufacturer: "Genuine",
    name: "Genuine Antoid 3.5 mm jack module",
    price: 14900,
    specs: { standard: "3.5 mm TRRS", detectionReliability: 1, antennaReliability: 1, channels: 2, crackle: 0 },
  },
  {
    type: "headphoneJack",
    manufacturer: "Extreme Budget",
    name: "ValuePort compatible 3.5 mm jack",
    price: 3900,
    specs: { standard: "3.5 mm TRRS", detectionReliability: 0.64, antennaReliability: 0.58, channels: 1, crackle: 24 },
  },
  {
    type: "display",
    manufacturer: "Genuine",
    name: "Genuine LTPO OLED service pack",
    price: 104900,
    specs: {
      technology: "LTPO OLED",
      tier: "Premium",
      resolution: "2400 × 1080",
      refreshHz: 120,
      peakNits: 1800,
      hdr: true,
      pwmHz: 1440,
      colorGamut: "P3",
      touchLatency: 8,
    },
  },
  {
    type: "display",
    manufacturer: "Supra",
    name: "Supra Crystal AMOLED Pro",
    price: 79900,
    specs: {
      technology: "AMOLED",
      tier: "Performance",
      resolution: "2400 × 1080",
      refreshHz: 144,
      peakNits: 1500,
      hdr: true,
      pwmHz: 2160,
      colorGamut: "P3",
      touchLatency: 6,
    },
  },
  {
    type: "display",
    manufacturer: "Extreme Budget",
    name: "ValueView LCD-compatible panel",
    price: 18900,
    specs: {
      technology: "IPS LCD",
      tier: "Budget",
      resolution: "1600 × 720",
      refreshHz: 60,
      peakNits: 430,
      hdr: false,
      pwmHz: 240,
      colorGamut: "sRGB",
      touchLatency: 35,
    },
  },
  {
    type: "storage",
    manufacturer: "Genuine",
    name: "Genuine Antoid UFS 2.0 256 GB",
    price: 39900,
    specs: {
      model: "Genuine Antoid UFS 2.0 256 GB",
      capacityGb: 256,
      actualCapacityGb: 256,
      type: "UFS 2.0",
      readMbps: 850,
      writeMbps: 420,
    },
  },
  {
    type: "storage",
    manufacturer: "Genuine",
    name: "Genuine Antoid UFS 2.0 512 GB",
    price: 59900,
    specs: { model: "Antoid UFS2 512", capacityGb: 512, actualCapacityGb: 512, type: "UFS 2.0", readMbps: 900, writeMbps: 480 },
  },
  {
    type: "storage",
    manufacturer: "Genuine",
    name: "Genuine Antoid UFS 3.0 512 GB",
    price: 74900,
    specs: { model: "Antoid UFS3 512", capacityGb: 512, actualCapacityGb: 512, type: "UFS 3.0", readMbps: 1500, writeMbps: 900 },
  },
  {
    type: "storage",
    manufacturer: "Genuine",
    name: "Genuine Antoid UFS 3.0 1 TB",
    price: 109900,
    specs: { model: "Antoid UFS3 1TB", capacityGb: 1024, actualCapacityGb: 1024, type: "UFS 3.0", readMbps: 1700, writeMbps: 1100 },
  },
  {
    type: "storage",
    manufacturer: "Extreme Budget",
    name: "Budget eMMC 128 GB",
    price: 11900,
    specs: { model: "BasicStore eMMC128", capacityGb: 128, actualCapacityGb: 128, type: "eMMC", readMbps: 160, writeMbps: 55 },
  },
  {
    type: "storage",
    manufacturer: "Extreme Budget",
    name: "Budget eMMC ‘256 GB’ (64 GB actual)",
    price: 9900,
    specs: { model: "ValueFlash eMMC256", capacityGb: 256, actualCapacityGb: 64, type: "eMMC", readMbps: 105, writeMbps: 28, counterfeit: true },
  },
  {
    type: "storage",
    manufacturer: "Supra",
    name: "Supra NVMe Mobile 1 TB",
    price: 89900,
    specs: {
      model: "Supra NVMe Mobile 1 TB",
      capacityGb: 1024,
      actualCapacityGb: 1024,
      type: "Supra NVMe",
      readMbps: 5200,
      writeMbps: 4100,
    },
  },
  {
    type: "storage",
    manufacturer: "Supra",
    name: "Supra NVMe Mobile 2 TB",
    price: 149900,
    specs: {
      model: "Supra NVMe Mobile 2 TB",
      capacityGb: 2048,
      actualCapacityGb: 2048,
      type: "Supra NVMe",
      readMbps: 5600,
      writeMbps: 4500,
    },
  },
  {
    type: "battery",
    manufacturer: "Genuine",
    name: "Genuine 4800 mAh battery",
    price: 32900,
    specs: {
      capacityMah: 4800,
      thermalLimit: 49,
      swelling: 0,
      punctured: false,
    },
  },
  {
    type: "battery",
    manufacturer: "Supra",
    name: "Supra Silicon 5600 battery",
    price: 42900,
    specs: {
      capacityMah: 5600,
      thermalLimit: 52,
      swelling: 0,
      punctured: false,
    },
  },
  {
    type: "battery",
    manufacturer: "Extreme Budget",
    name: "PowerMax 7000 label / 3100 mAh actual",
    price: 8900,
    specs: {
      capacityMah: 3100,
      claimedCapacityMah: 7000,
      thermalLimit: 41,
      swelling: 8,
      punctured: false,
    },
  },
  {
    type: "modem",
    manufacturer: "Genuine",
    name: "Genuine Antoid 5G modem",
    price: 74900,
    specs: {
      generations: ["5G SA", "5G NSA", "4G+", "4G", "3G", "EDGE"],
      maxDownMbps: 2400,
      maxUpMbps: 350,
    },
  },
  {
    type: "modem",
    manufacturer: "Supra",
    name: "Supra Wave X modem",
    price: 84900,
    specs: {
      generations: ["5G SA", "5G NSA", "4G+", "4G", "3G", "EDGE"],
      maxDownMbps: 3600,
      maxUpMbps: 500,
    },
  },
  {
    type: "modem",
    manufacturer: "Extreme Budget",
    name: "ConnectGo LTE modem",
    price: 14900,
    specs: {
      generations: ["4G", "3G", "EDGE"],
      maxDownMbps: 90,
      maxUpMbps: 25,
    },
  },
  {
    type: "cellularAntenna",
    manufacturer: "Genuine",
    name: "Genuine 4-element antenna",
    price: 15900,
    specs: { antennaGainDb: 0, elements: 4 },
  },
  {
    type: "cellularAntenna",
    manufacturer: "Supra",
    name: "Supra Beam antenna array",
    price: 23900,
    specs: { antennaGainDb: 3, elements: 6 },
  },
  {
    type: "cellularAntenna",
    manufacturer: "Extreme Budget",
    name: "Universal foil antenna",
    price: 2900,
    specs: { antennaGainDb: -16, elements: 1 },
  },
  {
    type: "usbBoard",
    manufacturer: "Genuine",
    name: "Genuine USB-C service board",
    price: 26900,
    specs: {
      standard: "USB 3.2 Gen 2",
      speedGbps: 10,
      chargingWatts: 45,
      videoOut: true,
    },
  },
  {
    type: "usbBoard",
    manufacturer: "Supra",
    name: "Supra Premium USB-C Board for Antoid 1",
    price: 38900,
    specs: {
      standard: "Supra USB4 40G",
      speedGbps: 40,
      chargingWatts: 65,
      videoOut: true,
    },
  },
  {
    type: "usbBoard",
    manufacturer: "Extreme Budget",
    name: "Charge-only USB-C board",
    price: 4900,
    specs: {
      standard: "USB 2.0 charge-only",
      speedGbps: 0,
      chargingWatts: 10,
      videoOut: false,
    },
  },
  {
    type: "wideCamera",
    manufacturer: "Supra",
    name: "Supra Vision Ultra main camera",
    price: 92900,
    specs: {
      megapixels: 108,
      aperture: "f/1.5",
      ois: true,
      maxVideo: "8K30",
      lens: "Vision Ultra",
      ai: true,
      lunarEnhancement: true,
    },
  },
  {
    type: "ultrawideCamera",
    manufacturer: "Supra",
    name: "Supra Vision Ultra-wide camera",
    price: 82900,
    specs: {
      megapixels: 48,
      aperture: "f/1.8",
      fieldOfView: 128,
      lens: "Vision Ultra-wide",
      ai: true,
      lunarEnhancement: true,
    },
  },
  {
    type: "telephotoCamera",
    manufacturer: "Supra",
    name: "Supra Vision Telephoto camera",
    price: 94900,
    specs: {
      megapixels: 50,
      opticalZoom: 5,
      ois: true,
      lens: "Vision Telephoto",
      ai: true,
      lunarEnhancement: true,
    },
  },
  {
    type: "wideCamera",
    manufacturer: "Extreme Budget",
    name: "PhotoBasic 8 MP camera",
    price: 6900,
    specs: {
      megapixels: 8,
      aperture: "f/2.8",
      ois: false,
      maxVideo: "1080p24",
      lens: "Wide",
    },
  },
  {
    type: "frame",
    manufacturer: "Supra",
    name: "Supra titanium frame",
    price: 68900,
    specs: { material: "Grade 5 titanium", rigidity: 112 },
  },
  {
    type: "frame",
    manufacturer: "Extreme Budget",
    name: "Moulded polycarbonate frame",
    price: 10900,
    specs: { material: "Polycarbonate", rigidity: 48 },
  },
  {
    type: "backCover",
    manufacturer: "Supra",
    name: "Supra aramid back cover",
    price: 32900,
    specs: { material: "Aramid composite", color: "Obsidian weave" },
  },
  {
    type: "backCover",
    manufacturer: "Extreme Budget",
    name: "Gloss plastic back cover",
    price: 4900,
    specs: { material: "ABS plastic", color: "Black" },
  },
  {
    type: "seals",
    manufacturer: "Genuine",
    name: "Genuine IP68 reseal kit",
    price: 9900,
    specs: { rating: "IP68", reusable: false },
  },
];

// Supra Electronics only manufactures the five product families explicitly
// approved for Antoid 1. Legacy 3.1 catalog rows are removed during module
// initialization so they cannot leak into search, packages or repair choices.
const SUPRA_APPROVED_TYPES = new Set([
  "storage",
  "usbBoard",
  "wideCamera",
  "ultrawideCamera",
  "telephotoCamera",
]);
for (let index = REPLACEMENT_PARTS.length - 1; index >= 0; index -= 1) {
  const item = REPLACEMENT_PARTS[index];
  if (item.manufacturer === "Supra" && !SUPRA_APPROVED_TYPES.has(item.type)) {
    REPLACEMENT_PARTS.splice(index, 1);
  } else if (item.manufacturer === "Supra") {
    item.manufacturer = "Supra Electronics";
  }
}

// Every part that can leave the chassis has a working service replacement.
// The specialised entries above preserve meaningful manufacturer differences;
// this catalog fills out the remaining electrical, camera, audio and sensor parts.
const serviceDefaults = createGenuineComponents();
const stateFields = new Set([
  "id", "name", "group", "layer", "manufacturer", "installed", "connected",
  "condition", "waterExposure", "destroyed", "powered", "serial",
  "description", "keywords", "removable",
]);
const copySpecs = (component) =>
  Object.fromEntries(Object.entries(component).filter(([key]) => !stateFields.has(key)));
for (const [type, component] of Object.entries(serviceDefaults)) {
  if (type === "storage") continue;
  for (const variant of [
    { manufacturer: "Genuine", prefix: "Genuine Antoid", price: 17900, quality: 1 },
    { manufacturer: "Extreme Budget", prefix: "ValueLine", price: 6900, quality: 0.58 },
  ]) {
    if (REPLACEMENT_PARTS.some((item) => item.type === type && item.manufacturer === variant.manufacturer)) continue;
    REPLACEMENT_PARTS.push({
      type,
      manufacturer: variant.manufacturer,
      name: `${variant.prefix} ${component.name}`,
      price: variant.price + component.layer * 700,
      specs: { ...copySpecs(component), quality: variant.quality },
    });
  }
}

export const COMPONENT_LAYOUT = {
  backCover: { special: "rear-cover", x: 0, y: 0, w: 100, h: 100, waterReach: 1 },
  mainboard: { x: 10, y: 7, w: 78, h: 21, waterReach: 79 },
  wideCamera: { x: 12, y: 8, w: 16, h: 12, waterReach: 84 },
  ultrawideCamera: { x: 30, y: 8, w: 12, h: 10, waterReach: 84 },
  telephotoCamera: { x: 44, y: 8, w: 12, h: 10, waterReach: 84 },
  flashlight: { x: 58, y: 9, w: 8, h: 8, waterReach: 84 },
  soc: { x: 50, y: 18, w: 12, h: 8, waterReach: 75 },
  ram: { x: 64, y: 18, w: 10, h: 8, waterReach: 75 },
  storage: { x: 76, y: 18, w: 10, h: 8, waterReach: 75 },
  modem: { x: 30, y: 18, w: 12, h: 8, waterReach: 75 },
  simReader: { x: 12, y: 21, w: 15, h: 8, waterReach: 73 },
  simTray: { x: 90, y: 48, w: 7, h: 20, waterReach: 48 },
  secureElement: { x: 68, y: 10, w: 8, h: 6, waterReach: 80 },
  mainboardShield: { x: 45, y: 6, w: 36, h: 11, waterReach: 82 },
  cameraBracket: { x: 9, y: 6, w: 50, h: 15, waterReach: 86 },
  cameraFlex: { x: 15, y: 20, w: 43, h: 4, waterReach: 78 },
  antennaInterconnect: { x: 8, y: 27, w: 80, h: 3, waterReach: 72 },
  chargingCoil: { x: 29, y: 30, w: 44, h: 31, waterReach: 46 },
  battery: { x: 15, y: 34, w: 69, h: 45, waterReach: 36 },
  batteryBracket: { x: 12, y: 32, w: 75, h: 49, waterReach: 34 },
  batteryConnector: { x: 77, y: 30, w: 10, h: 5, waterReach: 66 },
  thermalSystem: { x: 43, y: 25, w: 15, h: 52, waterReach: 40 },
  wifiModule: { x: 76, y: 27, w: 11, h: 7, waterReach: 69 },
  nfc: { x: 72, y: 37, w: 10, h: 8, waterReach: 57 },
  accelerometer: { x: 12, y: 29, w: 7, h: 6, waterReach: 67 },
  gyroscope: { x: 20, y: 29, w: 7, h: 6, waterReach: 67 },
  magnetometer: { x: 12, y: 75, w: 8, h: 6, waterReach: 25 },
  gps: { x: 77, y: 68, w: 10, h: 7, waterReach: 31 },
  haptics: { x: 70, y: 78, w: 18, h: 8, waterReach: 17 },
  speaker: { x: 7, y: 84, w: 27, h: 10, waterReach: 8 },
  speakerBracket: { x: 5, y: 82, w: 31, h: 14, waterReach: 7 },
  usbBoard: { x: 36, y: 86, w: 28, h: 9, waterReach: 5 },
  usbFlex: { x: 44, y: 77, w: 12, h: 10, waterReach: 14 },
  microphones: { x: 66, y: 89, w: 12, h: 5, waterReach: 4 },
  cellularAntenna: { x: 6, y: 3, w: 88, h: 5, waterReach: 91 },
  wifiAntenna: { x: 89, y: 31, w: 5, h: 32, waterReach: 44 },
  gpsAntenna: { x: 6, y: 68, w: 5, h: 22, waterReach: 18 },
  fmReceiver: { x: 60, y: 20, w: 11, h: 7, waterReach: 72 },
  fmAntenna: { x: 89, y: 66, w: 5, h: 19, waterReach: 20 },
  headphoneJack: { x: 66, y: 84, w: 13, h: 8, waterReach: 7 },
  sideButtonFlex: { x: 90, y: 39, w: 4, h: 31, waterReach: 36 },
  frame: { x: 3, y: 2, w: 94, h: 95, waterReach: 3 },
  seals: { x: 4, y: 3, w: 92, h: 93, waterReach: 2 },
  display: { face: "front", x: 4, y: 3, w: 92, h: 94, waterReach: 2 },
  digitizer: { face: "front", x: 5, y: 4, w: 90, h: 92, waterReach: 2 },
  displayFlex: { face: "front", x: 44, y: 88, w: 12, h: 8, waterReach: 7 },
  frontCamera: { face: "front", x: 46, y: 3, w: 8, h: 5, waterReach: 88 },
  earpiece: { face: "front", x: 42, y: 2, w: 16, h: 3, waterReach: 89 },
  earpieceFlex: { face: "front", x: 38, y: 4, w: 24, h: 4, waterReach: 86 },
  proximitySensor: { face: "front", x: 38, y: 3, w: 4, h: 3, waterReach: 88 },
  ambientSensor: { face: "front", x: 58, y: 3, w: 4, h: 3, waterReach: 88 },
  sensorFlex: { face: "front", x: 35, y: 2, w: 30, h: 6, waterReach: 86 },
};

export const REMOVABLE_COMPONENT_IDS = Object.freeze(
  Object.keys(createGenuineComponents()),
);

export function createHardwareState({ unboxed = false } = {}) {
  return {
    schema: 1,
    view: "front",
    mode: "Teardown",
    selected: "battery",
    exploded: 0,
    components: createGenuineComponents(),
    inventory: { packages: [], removed: [], trashed: 0 },
    inspection: null,
    faults: [],
    temperatures: { battery: 29, mainboard: 34, modem: 36 },
    water: { running: false, level: 0, ingress: 0, seconds: 0, reached: [] },
    drop: { height: 1, orientation: "Back", lastResult: null, impactId: 0 },
    packageOpening: null,
    smash: null,
    unboxing: {
      complete: unboxed,
      stage: unboxed ? 5 : 0,
      chargerUnlocked: unboxed,
    },
    explosion: null,
  };
}

const okay = (part) =>
  !!part &&
  part.installed !== false &&
  part.connected !== false &&
  part.powered !== false &&
  !part.destroyed &&
  Number(part.condition ?? 100) > 5;

export function componentWorks(state, id, seen = new Set()) {
  const components = state.hardware?.components || createGenuineComponents();
  const component = components[id];
  if (!okay(component) || seen.has(id)) return false;
  const nextSeen = new Set(seen).add(id);
  return (component.dependsOn || []).every((dependency) =>
    componentWorks(
      state.hardware?.components
        ? state
        : { ...state, hardware: { components } },
      dependency,
      nextSeen,
    ),
  );
}

export function hardwareCapabilities(state) {
  const works = (id) => componentWorks(state, id);
  const c = state.hardware?.components || createGenuineComponents();
  const board = works("mainboard") && works("soc") && works("ram");
  const display = board && works("display") && works("displayFlex");
  const digitizer = display && works("digitizer");
  const battery =
    works("battery") && works("batteryConnector") && !c.battery?.punctured;
  const wiredPowerPath = works("usbBoard") && works("usbFlex");
  const externalPower =
    !battery && wiredPowerPath && Boolean(state.battery?.charging);
  const powerAvailable = battery || externalPower;
  const cellular =
    board && powerAvailable && works("modem") && works("cellularAntenna") && works("antennaInterconnect");
  const antennaCondition = Number(c.cellularAntenna?.condition ?? 100);
  const cellularPenaltyDb = cellular
    ? Math.max(0, (100 - antennaCondition) * 0.28) -
      Number(c.cellularAntenna?.antennaGainDb || 0)
    : 120;
  const wifi = board && powerAvailable && works("wifiModule") && works("wifiAntenna") && works("antennaInterconnect");
  const wifiCondition = Math.min(
    Number(c.wifiModule?.condition ?? 100),
    Number(c.wifiAntenna?.condition ?? 100),
  );
  const storage = board && works("storage");
  const fmReceiver = board && powerAvailable && works("fmReceiver");
  const fmAntenna = works("fmAntenna");
  const headphoneJack = board && powerAvailable && works("headphoneJack");
  const jackCondition = Number(c.headphoneJack?.condition ?? 0);
  const headphonesPhysicallyConnected = Boolean(state.audioAccessories?.wiredHeadphonesConnected);
  const headphonesDetected =
    headphoneJack &&
    headphonesPhysicallyConnected &&
    jackCondition >= Math.max(8, 35 * (1 - Number(c.headphoneJack?.detectionReliability || 1)));
  const usb = board && wiredPowerPath;
  const sealing =
    works("backCover") &&
    !c.backCover?.cracked &&
    works("seals") &&
    Number(c.seals?.condition ?? 100) > 75;
  return {
    board,
    battery,
    powerAvailable,
    externalPower,
    wiredPowerPath,
    display,
    digitizer,
    cellular,
    cellularPenaltyDb,
    maxCellularDownMbps: cellular ? Number(c.modem?.maxDownMbps || 0) : 0,
    maxCellularUpMbps: cellular ? Number(c.modem?.maxUpMbps || 0) : 0,
    supportedGenerations: cellular ? c.modem?.generations || [] : [],
    wifi,
    bluetooth: wifi,
    wifiFactor: wifi ? Math.max(0.04, wifiCondition / 100) : 0,
    displaySpecs: c.display || {},
    storage,
    fmReceiver,
    fmAntenna,
    headphoneJack,
    headphonesPhysicallyConnected,
    headphonesDetected,
    headphoneAntenna: headphonesDetected && jackCondition > 10,
    headphoneChannels: headphonesDetected ? Number(c.headphoneJack?.channels || 2) : 0,
    headphoneCrackle: headphonesDetected
      ? Math.max(Number(c.headphoneJack?.crackle || 0), 100 - jackCondition)
      : 0,
    storageClaimedGb: Number(c.storage?.capacityGb || 0),
    storageActualGb: storage
      ? Number(c.storage?.actualCapacityGb ?? c.storage?.capacityGb ?? 0)
      : 0,
    storageReadMbps: storage ? Number(c.storage?.readMbps || 0) : 0,
    storageWriteMbps: storage ? Number(c.storage?.writeMbps || 0) : 0,
    usb,
    usbSpecs: c.usbBoard || {},
    charging: battery && wiredPowerPath,
    wirelessCharging: battery && works("chargingCoil"),
    buttons: board && powerAvailable && works("sideButtonFlex"),
    flashlight: board && powerAvailable && works("flashlight"),
    speaker: board && powerAvailable && works("speaker") && works("speakerBracket"),
    earpiece: board && powerAvailable && works("earpiece") && works("earpieceFlex"),
    microphone: board && powerAvailable && works("microphones"),
    haptics: board && powerAvailable && works("haptics"),
    physicalSimTray: works("simTray"),
    simReader: cellular && works("simReader"),
    esim: cellular && works("secureElement"),
    cameras: {
      front: board && powerAvailable && works("frontCamera") && works("cameraFlex"),
      wide: board && powerAvailable && works("wideCamera") && works("cameraFlex"),
      ultrawide: board && powerAvailable && works("ultrawideCamera") && works("cameraFlex"),
      telephoto: board && powerAvailable && works("telephotoCamera") && works("cameraFlex"),
    },
    sensors: {
      proximity: board && works("proximitySensor") && works("sensorFlex"),
      ambient: board && works("ambientSensor") && works("sensorFlex"),
      accelerometer: board && works("accelerometer"),
      gyroscope: board && works("gyroscope"),
      magnetometer: board && works("magnetometer"),
      gps: board && works("gps") && works("gpsAntenna"),
      nfc: board && works("nfc"),
    },
    sealed: sealing,
    frameIntegrity: works("frame") ? Number(c.frame?.condition ?? 100) : 0,
  };
}

export function diagnoseHardware(state) {
  const caps = hardwareCapabilities(state);
  const results = [];
  const add = (name, pass, detail) =>
    results.push({ name, pass, detail, status: pass ? "PASS" : "FAIL" });
  add(
    "Logic board",
    caps.board,
    caps.board ? "SoC and memory respond" : "Mainboard, SoC or RAM unavailable",
  );
  add(
    "Power system",
    caps.powerAvailable,
    caps.battery
      ? `${state.hardware.components.battery.capacityMah} mAh detected`
      : caps.externalPower
        ? "External USB-C power · battery not installed"
        : "Battery missing, disconnected or unsafe",
  );
  add(
    "Display",
    caps.display,
    caps.display
      ? `${caps.displaySpecs.technology} · ${caps.displaySpecs.refreshHz} Hz`
      : "No working panel",
  );
  add(
    "Touch",
    caps.digitizer,
    caps.digitizer
      ? `${state.hardware.components.digitizer.sampleRateHz || 120} Hz digitizer`
      : "Digitizer unavailable",
  );
  add(
    "Cellular",
    caps.cellular,
    caps.cellular
      ? `${state.hardware.components.modem.generations.join(" / ")}`
      : "Modem or antenna path open",
  );
  add(
    "Wi-Fi / Bluetooth",
    caps.wifi,
    caps.wifi
      ? state.hardware.components.wifiModule.wifi
      : "Radio module or antenna unavailable",
  );
  add(
    "FM receiver",
    caps.fmReceiver,
    caps.fmReceiver
      ? `${state.hardware.components.fmReceiver.manufacturer} tuner · ${state.hardware.components.fmReceiver.condition.toFixed(0)}%`
      : "FM receiver not detected",
  );
  add(
    "Internal FM antenna",
    caps.fmAntenna,
    caps.fmAntenna
      ? `${state.hardware.components.fmAntenna.condition.toFixed(0)}% condition`
      : "Internal FM antenna unavailable",
  );
  add(
    "3.5 mm audio",
    caps.headphoneJack,
    caps.headphoneJack
      ? `${caps.headphonesDetected ? "Wired headphones detected" : "Jack ready · no headphones"}`
      : "3.5 mm jack module unavailable",
  );
  add(
    "Storage",
    caps.storage,
    caps.storage
      ? `${caps.storageActualGb} GB actual · ${caps.storageReadMbps} MB/s`
      : "Boot storage unavailable",
  );
  add(
    "USB-C",
    caps.usb,
    caps.usb
      ? `${caps.usbSpecs.standard} · ${caps.usbSpecs.speedGbps} Gbps`
      : "Daughterboard or USB-C interconnect unavailable",
  );
  add(
    "Cameras",
    Object.values(caps.cameras).some(Boolean),
    `${Object.values(caps.cameras).filter(Boolean).length}/4 modules respond`,
  );
  add(
    "Audio",
    caps.speaker && caps.microphone,
    caps.speaker && caps.microphone
      ? "Speaker and microphones respond"
      : "Audio path incomplete",
  );
  add(
    "Sealing",
    caps.sealed,
    caps.sealed ? "IP seal integrity verified" : "Not water resistant",
  );
  return results;
}

export function makeReplacement(partTemplate, serialSuffix = Date.now()) {
  const base = createGenuineComponents()[partTemplate.type];
  return {
    ...base,
    ...partTemplate.specs,
    manufacturer: partTemplate.manufacturer,
    serviceName: partTemplate.name,
    installed: false,
    connected: false,
    condition: 100,
    waterExposure: 0,
    destroyed: false,
    powered: true,
    serial: `${partTemplate.manufacturer.slice(0, 3).toUpperCase()}-${partTemplate.type.toUpperCase()}-${String(serialSuffix).slice(-6)}`,
  };
}

export function createLaptopState({ unboxed = false } = {}) {
  return {
    unboxing: {
      complete: unboxed,
      stage: unboxed ? 4 : 0,
      chargerUnlocked: unboxed,
    },
    powered: false,
    booting: false,
    battery: 68,
    charging: false,
    usbConnected: false,
    lidOpen: true,
    app: null,
    browserPage: "forum",
    componentsMenu: false,
    diagnostics: [],
    wallpaper: "violet",
  };
}
