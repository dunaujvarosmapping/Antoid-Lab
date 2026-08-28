import {
  ANTENNAS,
  createBroadcastState,
  createBroadcastServices,
  defaultFallbackAssignments,
  mergeScanIntoDatabase,
  serviceIdentity,
} from "./dvb.js";

export function createLabState() {
  return {
    activeDevice: "welcome",
    deviceView: "utv",
    changelogOpen: false,
    antenna: { selected: null, position: 12, unpacked: false },
    unboxing: { complete: false, stage: 0 },
    cables: {
      antennaToUtv: false,
      antennaToDecoder: false,
      decoderHdmiToUtv2: false,
      dvdHdmiToUtv1: false,
      ethernetToUtv: false,
      decoderScartToUtv: false,
      dvdScartToUtv: false,
      dvdCompositeToUtv: false,
      dvdAudioToUtv: false,
      utvPower: true,
      decoderPower: true,
      dvdPower: true,
    },
    broadcast: createBroadcastState(),
    utv: {
      power: "off",
      bootUntil: 0,
      setupComplete: false,
      setupStep: 0,
      language: "English",
      country: "Hungary",
      mode: "Home Mode",
      page: "home",
      smartApp: null,
      input: "Live TV",
      rotated: false,
      volume: 35,
      muted: false,
      subtitles: false,
      audioLanguage: "Primary",
      pictureMode: "Standard",
      screenFormat: "Auto",
      picture: {
        brightness: 50,
        contrast: 50,
        color: 50,
        sharpness: 30,
        backlight: 70,
        temperature: "Neutral",
      },
      soundMode: "Standard",
      speakers: true,
      speakerHealth: 100,
      panelHealth: 100,
      panelEnabled: true,
      backlightEnabled: true,
      refreshStability: 100,
      wifi: {
        enabled: true,
        connected: null,
        remembered: {},
        passwordEntry: "",
        error: null,
      },
      storedChannels: [],
      currentChannelId: null,
      tuningUntil: 0,
      favoritesOnly: false,
      scan: {
        status: "idle",
        frequency: null,
        progress: 0,
        tv: 0,
        radio: 0,
        message: "",
        plan: [],
        index: 0,
        foundServices: [],
        mode: null,
      },
      manualFrequency: 482000,
      reminders: [],
      numericEntry: "",
      infoOpen: false,
      infoRequest: 0,
      volumeRequest: 0,
      pip: { enabled: false, source: "HDMI 1", position: "bottom-right" },
      sleepMinutes: 0,
      sleepStartedAt: null,
      hdmi: {
        1: {
          enabled: true,
          detectionFault: false,
          videoFault: false,
          audioFault: false,
        },
        2: {
          enabled: true,
          detectionFault: false,
          videoFault: false,
          audioFault: false,
        },
      },
    },
    decoder: {
      power: "off",
      page: "live",
      card: null,
      storedChannels: [],
      currentChannelId: null,
      tuningUntil: 0,
      manualFrequency: 482000,
      favoritesOnly: false,
      volume: 32,
      muted: false,
      subtitles: false,
      audioLanguage: "Primary",
      infoRequest: 0,
      numericEntry: "",
      parentalPin: "1234",
      parentalUnlocked: false,
      tunerEnabled: true,
      cardReaderEnabled: true,
      cardValid: true,
      hdmiEnabled: true,
      scartEnabled: true,
      outputFault: null,
      bootedAt: Date.now(),
      lastBootReason: "Cold power-on",
      firmware: {
        version: "4.0.3",
        availableVersion: "4.0.4",
        bootloader: "ADB-BL 2.7.1",
        tunerVersion: "T2-FW 3.14.8",
        caVersion: "Antoid CA 5.2.0",
        build: "4003.260823",
        buildDate: "2026-08-23",
        status: "idle",
        progress: 0,
        message: "Software status has not been checked.",
        fault: "none",
        lastUpdate: null,
      },
      scan: {
        status: "idle",
        frequency: null,
        progress: 0,
        tv: 0,
        radio: 0,
        message: "",
        plan: [],
        index: 0,
        foundServices: [],
        mode: null,
      },
    },
    dvd: {
      power: "off",
      tray: "closed",
      trayJammed: false,
      disc: null,
      availableDiscs: [
        {
          id: "city",
          title: "Neon City",
          region: 2,
          condition: 96,
          chapters: 8,
          theme: "city",
        },
        {
          id: "forest",
          title: "The Quiet Forest",
          region: 2,
          condition: 82,
          chapters: 6,
          theme: "forest",
        },
        {
          id: "ocean",
          title: "Blue Frontier",
          region: 1,
          condition: 94,
          chapters: 7,
          theme: "ocean",
        },
      ],
      state: "NO DISC",
      readStartedAt: 0,
      readToken: 0,
      playing: false,
      chapter: 1,
      position: 0,
      subtitles: "Off",
      audioTrack: "English 2.0",
      region: 2,
      laserHealth: 100,
      trackingStability: 100,
      focusStability: 100,
      hdmiEnabled: true,
      scartEnabled: true,
      compositeEnabled: true,
      audioEnabled: true,
      outputFault: null,
      settings: {
        system: "PAL",
        aspect: "16:9",
        resolution: "1080p",
        menuLanguage: "English",
      },
    },
  };
}

export function dvdReadScore(dvd) {
  if (!dvd?.disc) return 100;
  return (
    dvd.disc.condition * 0.5 +
    dvd.laserHealth * 0.28 +
    dvd.trackingStability * 0.12 +
    dvd.focusStability * 0.1
  );
}

export function dvdReadOutcome(dvd) {
  if (!dvd?.disc) return "NO DISC";
  if (dvd.disc.region !== dvd.region) return "REGION ERROR";
  return dvdReadScore(dvd) < 48 ? "DISC ERROR" : "DVD MENU";
}

const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = (value, fallback) => (Array.isArray(value) ? value : fallback);
const finite = (value, fallback, min, max) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, number))
    : fallback;
};

const normalizeStoredLcn = (channels, fallbackAssignments) => {
  const canonical = new Map(
    createBroadcastServices(fallbackAssignments).map((service) => [
      serviceIdentity(service.canonicalName || service.name),
      service.lcn,
    ]),
  );
  return channels
    .map((channel) => {
      if (channel.customNumber) return channel;
      const lcn = canonical.get(
        serviceIdentity(channel.canonicalName || channel.name),
      );
      return lcn == null ? channel : { ...channel, lcn, channelNumber: lcn };
    })
    .sort(
      (a, b) =>
        a.channelNumber - b.channelNumber || a.name.localeCompare(b.name),
    );
};

export function migrateLabState(saved) {
  const base = createLabState();
  const source = object(saved);
  const lab = { ...base, ...source };
  lab.antenna = { ...base.antenna, ...object(source.antenna) };
  if (lab.antenna.selected && !ANTENNAS[lab.antenna.selected])
    lab.antenna.selected = null;
  lab.unboxing = { ...base.unboxing, ...object(source.unboxing) };
  lab.antenna.position = finite(
    lab.antenna.position,
    base.antenna.position,
    0,
    100,
  );
  lab.unboxing.stage = finite(lab.unboxing.stage, 0, 0, 10);
  lab.cables = { ...base.cables, ...object(source.cables) };
  lab.broadcast = { ...base.broadcast, ...object(source.broadcast) };
  lab.broadcast.fallbackAssignments = {
    ...defaultFallbackAssignments(),
    ...object(source.broadcast?.fallbackAssignments),
  };
  lab.broadcast.towers = Object.fromEntries(
    Object.entries(base.broadcast.towers).map(([towerId, tower]) => [
      towerId,
      {
        ...tower,
        ...object(source.broadcast?.towers?.[towerId]),
        multiplexes: Object.fromEntries(
          Object.entries(tower.multiplexes).map(([muxId, mux]) => [
            muxId,
            {
              ...mux,
              ...object(
                source.broadcast?.towers?.[towerId]?.multiplexes?.[muxId],
              ),
            },
          ]),
        ),
      },
    ]),
  );
  lab.broadcast.serviceOverrides = {
    ...base.broadcast.serviceOverrides,
    ...object(source.broadcast?.serviceOverrides),
  };
  lab.broadcast.providers = Object.fromEntries(
    Object.entries(base.broadcast.providers).map(([provider, config]) => [
      provider,
      {
        ...config,
        ...object(source.broadcast?.providers?.[provider]),
        denied: array(
          source.broadcast?.providers?.[provider]?.denied,
          config.denied,
        ),
      },
    ]),
  );
  lab.utv = { ...base.utv, ...object(source.utv) };
  lab.utv.picture = { ...base.utv.picture, ...object(source.utv?.picture) };
  lab.utv.pip = { ...base.utv.pip, ...object(source.utv?.pip) };
  lab.utv.wifi = {
    ...base.utv.wifi,
    ...object(source.utv?.wifi),
    remembered: {
      ...base.utv.wifi.remembered,
      ...object(source.utv?.wifi?.remembered),
    },
  };
  lab.utv.storedChannels = normalizeStoredLcn(
    mergeScanIntoDatabase(
      [],
      array(source.utv?.storedChannels, base.utv.storedChannels),
    ).filter((channel) => channel.free),
    lab.broadcast.fallbackAssignments,
  );
  if (
    !lab.utv.storedChannels.some(
      (channel) => channel.id === lab.utv.currentChannelId,
    )
  )
    lab.utv.currentChannelId = lab.utv.storedChannels[0]?.id || null;
  lab.utv.reminders = array(source.utv?.reminders, base.utv.reminders);
  lab.utv.setupStep = finite(source.utv?.setupStep, 0, 0, 6);
  if (!["utv", "decoder", "dvd"].includes(lab.deviceView))
    lab.deviceView = "utv";
  lab.utv.scan = {
    ...base.utv.scan,
    ...object(source.utv?.scan),
    status: "idle",
    progress: 0,
  };
  lab.utv.hdmi = {
    1: { ...base.utv.hdmi[1], ...object(source.utv?.hdmi?.[1]) },
    2: { ...base.utv.hdmi[2], ...object(source.utv?.hdmi?.[2]) },
  };
  lab.decoder = { ...base.decoder, ...object(source.decoder) };
  lab.decoder.storedChannels = normalizeStoredLcn(
    mergeScanIntoDatabase(
      [],
      array(source.decoder?.storedChannels, base.decoder.storedChannels),
    ),
    lab.broadcast.fallbackAssignments,
  );
  if (
    !lab.decoder.storedChannels.some(
      (channel) => channel.id === lab.decoder.currentChannelId,
    )
  )
    lab.decoder.currentChannelId = lab.decoder.storedChannels[0]?.id || null;
  lab.decoder.scan = {
    ...base.decoder.scan,
    ...object(source.decoder?.scan),
    status: "idle",
    progress: 0,
  };
  lab.decoder.firmware = {
    ...base.decoder.firmware,
    ...object(source.decoder?.firmware),
  };
  lab.dvd = { ...base.dvd, ...object(source.dvd) };
  lab.dvd.availableDiscs = array(
    source.dvd?.availableDiscs,
    base.dvd.availableDiscs,
  );
  lab.dvd.settings = { ...base.dvd.settings, ...object(source.dvd?.settings) };
  if (!["welcome", "phone", "utv"].includes(lab.activeDevice))
    lab.activeDevice = "welcome";
  return lab;
}
