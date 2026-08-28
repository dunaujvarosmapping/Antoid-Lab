const lines = (value) =>
  value
    .trim()
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

export const MUX_IDS = Object.freeze(["A", "B", "C", "D", "E"]);

export const CANONICAL_MUX_SERVICES = Object.freeze({
  A: lines(`
M1 HD
Duna HD
M4 Sport HD
DunaW/M4Sport+
Kossuth Rádió
Petőfi Rádió
Bartók Rádió
Dankó Rádió`),
  B: lines(`
M2 HD
M5 HD
RTL
Spektrum Home
TV2
MAX4
MindigTV Plusz Info
Izaura TV
Dikh TV`),
  C: lines(`
AXN
VIASAT 3
RTL HÁROM
PRIME
Moziverzum
Comedy Central
Nickelodeon
NickToons
National Geographic
Life TV
Hír TV
Mozi+
Spektrum
ATV
Sport 2 HD
Arena 4 HD
Sorozat+`),
  D: lines(`
Film+
Spiler 2 HD
Spiler 1 HD
RTL KETTő
Super TV2
TV2 Kids
Disney Channel
AMC
Paramount Network
Discovery Channel
TV2 Comedy
Jocky TV
Cool
Ozone Network
TV4
Sport 1 HD
TV Paprika`),
  E: lines(`
Fit HD/TotalDance
TLC
RTL Gold
Fishing & Hunting
Brazzers TV
HGTV
Discovery ID
NatGeo Wild
Viasat History
Filmbox Premium
Minimax
Sláger TV
Jazz TV
Bonum TV
TV2 Sef
SuperOne
TeenNick
Heti TV
Apostol TV
PAX TV
Nick Junior
Magyar Mozi TV
JimJam
Baby TV
HEVC teszt`),
});

export const FREE_DTT = Object.freeze(
  lines(`
M1 HD
M2 HD
Duna HD
M4 Sport HD
DunaW/M4Sport+
M5 HD
RTL
Spektrum Home
TV2
MAX4
MindigTV Plusz Info
Kossuth Rádió
Petőfi Rádió
Bartók Rádió
Dankó Rádió`),
);

export const PROVIDER_PACKAGES = Object.freeze({
  Telekom: lines(`
M1
M2
Duna
M4 Sport
Duna World
M4 Sport+
M5
Spektrum Home
Da Vinci
Spektrum
National Geographic
Travel Channel
Discovery Channel
Animal Planet
BBC Earth
NatGeo Wild
History
ID Investigation Discovery
TLC
Viasat History
Viasat Explore
Viasat Nature
English Club
HGTV
Travelxp HD Europe
Film+
PRIME
Magyar Mozi TV
Mozi+
Film Café
Filmajánló
AXN
AMC
Cool
Moziverzum
Moziklub
JockyTV
FILMBOX+ comedy
FILMBOX+ love&crime
FILMBOX+ one
FILMBOX+ emotion HD
RTL GOLD
Sorozat+
Sorozatklub
Viasat Film
Viasat 2
Izaura TV
Viasat Epic Drama
Film Mánia
FILM4
MAX4
Telekom FilmKlub
TV2
RTL
Viasat 3
RTL KETTŐ
Super TV2
STORY4
TV4
Viasat 6
Kanapé TV
Bónusz
GALAXY4
TV2 Comedy
Dikh TV
ATV Extra
Telekom Good Game
Sport1
RTL HÁROM
Sport2
Eurosport
Fishing & Hunting
Spíler1 TV
Spíler2 TV
ARENA4
Eurosport2
MATCH4
Nicktoons
Minimax
JimJam
Kölyökklub
Nickelodeon
Disney Channel
TV2 Kids
Nick JR
Cartoon Network
Cartoonito
CNN International
Euronews English
d1
Jazz TV
EWTN
PAX TV
Heti Tv
Apostol TV
Fit HD
NESHAMA TV
OzoneTV
LifeTV
TV Paprika
FEM3
RTL OTTHON
Food Network
TV2 Séf
Muzsika TV
Sláger TV
MTV European
Zenebutik
Stingray Classica
ATV
Euronews (magyar)
Hír TV`),
  One: lines(`
M1 HD
M2 Petőfi TV HD
Duna TV HD
M4 Sport HD
Duna World HD / M4 Sport+ HD
M5 HD
TV4 HD
RTL HD
TV2 HD
VIASAT3 HD
VIASAT6
Super TV2 HD
Moziverzum HD
RTL KETTŐ HD
Film+ HD
Mozi+ HD
Moziklub
Cool HD
Sorozat+
RTL Gold
AXN HD
VIASAT Film
VIASAT2
Jocky TV
Izaura TV
Prime HD
Story4 HD
Film Mania HD
Film Café HD
RTL HÁROM HD
AMC HD
TV2 Comedy
FILMBOX+ One HD
Magyar Mozi TV
Sorozatklub
Canal+ Action HD
MAX4
Galaxy4 HD
Viasat Epic Drama HD
Film4 HD
ATV Extra HD
ATV HD
Hír TV HD
Euronews HD
Spíler1 TV HD
Sport1 HD
Spíler2 TV HD
Sport2 HD
Eurosport 1 HD
Eurosport 2 HD
Fishing & Hunting HD
ARENA4 HD
MATCH4 HD
Spektrum HD
BBC Earth HD
National Geographic HD
National Geographic Wild HD
Discovery Channel HD
Animal Planet HD
HGTV HD
RTL OTTHON HD
TLC
ID HD
History Channel HD
Ozone TV HD
Fashion Tv
Viasat Explore HD
Viasat History HD
Viasat Nature HD
Travel Channel HD
Life TV HD
TV Paprika HD
Spektrum Home HD
TV2 Séf
Food Network HD
FEM3
Da Vinci
Disney Channel
Duck Tv
Nickelodeon
Nick Jr
Minimax
Cartoonito
Cartoon Network
Jim Jam
Baby TV
TV2 Kids
Nicktoons
Kölyökklub HD
Mezzo HD
Muzsika TV
Zenebutik
MTV European
Sláger TV HD
Dikh TV HD
CNN International
BBC News
English Club TV HD
Al Jazeera English
TV5 MONDE Europe
TVE
ZDF
SAT 1
ORF 2
Rai Uno
CCTV 4
Pax Televízió
EWTN TV
Heti TV`),
  Yettel: lines(`
M1
M2
Duna
M4 Sport
M5
Duna World
Cool
RTL
RTL GOLD
RTL KETTŐ
Super TV2
TV2
TV2 Comedy
FEM3/TV2 Klub
Viasat 3
Viasat 6
ATV Extra
AMC
AXN
Viasat Epic Drama
Film Café
Film+
Film4
FILMBOX+ Emotion
FILMBOX+ Comedy
FILMBOX+ Hits
FILMBOX+ Love&Crime
Film Mánia
Izaura TV
Jocky
Mozi+
MoziKlub
Moziverzum
Prime
Sorozat+
SorozatKlub
Viasat 2
Viasat Film
Magyar Mozi TV
FILMBOX+ One
Max4
Galaxy4
Story4
TV4
RTL Három
Arena4
Eurosport 1
Eurosport 2
GINX Esports TV
Match4
Spíler 1
Spíler 2
Sport 1
Sport 2
F&H
ATV
BBC World News
CNN
Euronews
Hír TV
Cartoon Network
Cartoonito
Disney Channel
JimJam
KölyökKlub
Minimax
Nick Jr.
Nickelodeon
Nicktoons
TV2 Kids
Animal Planet
BBC Earth
Da Vinci
Discovery Channel
ID
Nat Geo
Nat Geo Wild
Ozone TV
Spektrum
Travel Channel
Viasat Explore
Viasat History
Viasat Nature
History
HGTV
English Club
Food Network
Life TV
RTL OTTHON
Spektrum Home
TV Paprika
TV2 Séf
MTV Europe
Muzsika TV
Zenebutik
Sláger TV
Mezzo
Dorcel TV
Hustler TV
Bartók Rádió
Kossuth Rádió
Petőfi Rádió`),
});

export const ANTENNAS = Object.freeze({
  supra: {
    name: "Supra Electronics Outdoor and Indoor TV Antenna",
    gain: 1,
    tolerance: 0.55,
    label: "Excellent",
  },
  sprOutdoor: {
    name: "Antoid SPR DVB-T2 Outdoor Antenna",
    gain: 0.9,
    tolerance: 0.46,
    label: "Very good",
  },
  sprIndoor: {
    name: "Antoid SPR DVB-T2 Indoor Antenna",
    gain: 0.76,
    tolerance: 0.35,
    label: "Good",
  },
  tiktok: {
    name: "TikTok Shop antenna",
    gain: 0.53,
    tolerance: 0.22,
    label: "Limited",
  },
});

export const TOWER_PLAN = Object.freeze({
  dunaujvaros: {
    name: "Dunaújváros",
    site: "Martinovics utca Víztorony",
    position: 12,
    distance: 7,
    frequencies: { A: 482000, B: 514000, C: 562000, D: 602000, E: 650000 },
  },
  sarszentlorinc: {
    name: "Sárszentlőrinc",
    site: "Sárszentlőrinc",
    position: 38,
    distance: 34,
    frequencies: { A: 538000, B: 570000, C: 594000, D: 634000, E: 674000 },
  },
  kabhegy: {
    name: "Kab-hegy",
    site: "Kab-hegy",
    position: 66,
    distance: 58,
    frequencies: { A: 498000, B: 522000, C: 554000, D: 618000, E: 666000 },
  },
  budapest: {
    name: "Budapest",
    site: "Széchenyi-hegy",
    position: 91,
    distance: 54,
    frequencies: { A: 610000, B: 746000, C: 642000, D: 650000, E: 674000 },
  },
});

const slug = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const SERVICE_ALIASES = Object.freeze({
  "m2-petofi": "m2",
  "duna-tv": "duna",
  "duna-world": "dunaw-m4sport",
  "duna-world-m4-sport": "dunaw-m4sport",
  "m4-sport-plus": "dunaw-m4sport",
  viasat3: "viasat-3",
  sport1: "sport-1",
  sport2: "sport-2",
  spiler1: "spiler-1",
  "spiler1-tv": "spiler-1",
  spiler2: "spiler-2",
  "spiler2-tv": "spiler-2",
  arena4: "arena-4",
  match4: "match-4",
  jocky: "jocky-tv",
  jockytv: "jocky-tv",
  "nick-jr": "nick-junior",
  "nick-jr-tv": "nick-junior",
  "national-geographic-wild": "natgeo-wild",
  "nat-geo-wild": "natgeo-wild",
  "nat-geo": "national-geographic",
  "id-investigation-discovery": "discovery-id",
  id: "discovery-id",
  "ozone-tv": "ozone-network",
  ozonetv: "ozone-network",
  "f-h": "fishing-hunting",
  "pax-televizio": "pax-tv",
  "fit-totaldance": "fit-totaldance",
});

export function serviceIdentity(value) {
  let key = slug(value)
    .replace(/-hd(?=-|$)/g, "")
    .replace(/-plus(?=-|$)/g, "-plus")
    .replace(/--+/g, "-")
    .replace(/^-|-$/g, "");
  key = SERVICE_ALIASES[key] || key;
  return key;
}
const stableHash = (value) =>
  [...String(value)].reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
const isRadioName = (name) => /rádió/i.test(name);

const LCN_OVERRIDES = Object.freeze({
  "M1 HD": 1,
  "M2 HD": 2,
  "Duna HD": 3,
  "M4 Sport HD": 4,
  "DunaW/M4Sport+": 5,
  "M5 HD": 6,
  RTL: 7,
  "Spektrum Home": 8,
  TV2: 9,
  MAX4: 10,
  "MindigTV Plusz Info": 11,
  "Kossuth Rádió": 201,
  "Petőfi Rádió": 202,
  "Bartók Rádió": 203,
  "Dankó Rádió": 204,
});

export function defaultFallbackAssignments() {
  const result = {};
  const canonicalKeys = new Set(
    Object.values(CANONICAL_MUX_SERVICES).flat().map(serviceIdentity),
  );
  for (const [provider, names] of Object.entries(PROVIDER_PACKAGES)) {
    for (const name of names) {
      const identity = serviceIdentity(name);
      if (canonicalKeys.has(identity)) continue;
      const key = `${provider}:${name}`;
      const mux = ["C", "D", "E"][stableHash(`service:${identity}`) % 3];
      result[key] = mux;
      result[`service:${identity}`] ??= mux;
    }
  }
  return result;
}

export function createBroadcastServices(
  fallbackAssignments = defaultFallbackAssignments(),
) {
  const services = [];
  const canonicalKeys = new Map();
  let codedLcn = 20;
  for (const [mux, names] of Object.entries(CANONICAL_MUX_SERVICES)) {
    for (const name of names) {
      const identity = serviceIdentity(name);
      const free =
        mux === "A" ||
        (mux === "B" && !["Izaura TV", "Dikh TV"].includes(name));
      const service = {
        id: `canonical:${slug(name)}`,
        name,
        canonicalName: name,
        provider: free ? "DTT Hungary" : "Multiplex Service",
        providers: free
          ? ["DTT Hungary"]
          : Object.entries(PROVIDER_PACKAGES)
              .filter(([, list]) =>
                list.some(
                  (packageName) => serviceIdentity(packageName) === identity,
                ),
              )
              .map(([provider]) => provider),
        mux,
        free,
        type: isRadioName(name) ? "radio" : "tv",
        lcn: LCN_OVERRIDES[name] ?? codedLcn++,
        resolution: isRadioName(name)
          ? "Audio"
          : /HD|Sport|Arena/i.test(name)
            ? "1080p"
            : "576p",
        visualSeed: stableHash(`canonical:${name}`) % 360,
      };
      services.push(service);
      canonicalKeys.set(identity, service);
    }
  }
  const fallbackServices = new Map();
  for (const [provider, names] of Object.entries(PROVIDER_PACKAGES)) {
    names.forEach((name, index) => {
      const identity = serviceIdentity(name);
      if (canonicalKeys.has(identity)) return;
      const key = `${provider}:${name}`;
      const existing = fallbackServices.get(identity);
      if (existing) {
        if (!existing.providers.includes(provider))
          existing.providers.push(provider);
        existing.packageNames[provider] = name;
        if (/HD/i.test(name)) existing.resolution = "1080p";
        return;
      }
      const service = {
        id: `package:${identity}`,
        name,
        canonicalName: name,
        provider,
        providers: [provider],
        packageNames: { [provider]: name },
        mux:
          fallbackAssignments[key] ||
          fallbackAssignments[`service:${identity}`] ||
          ["C", "D", "E"][stableHash(`service:${identity}`) % 3],
        free: false,
        type: isRadioName(name) ? "radio" : "tv",
        lcn: 100 + fallbackServices.size,
        resolution: /HD/i.test(name) ? "1080p" : "576p",
        visualSeed: stableHash(`service:${identity}`) % 360,
      };
      fallbackServices.set(identity, service);
    });
  }
  return [...services, ...fallbackServices.values()];
}

export function createBroadcastState() {
  return {
    selectedTower: "dunaujvaros",
    weather: "Clear",
    weatherSeverity: 20,
    fallbackAssignments: defaultFallbackAssignments(),
    towers: Object.fromEntries(
      Object.entries(TOWER_PLAN).map(([id, tower]) => [
        id,
        {
          enabled: true,
          output: 100,
          stability: 96,
          multiplexes: Object.fromEntries(
            MUX_IDS.map((mux) => [
              mux,
              {
                enabled: true,
                frequency: tower.frequencies[mux],
                strength: Math.max(64, 98 - Math.round(tower.distance * 0.35)),
                quality: Math.max(68, 98 - Math.round(tower.distance * 0.25)),
                interference: 4,
                noise: 3,
                multipath: 4,
                fading: 2,
                stability: 96,
              },
            ]),
          ),
        },
      ]),
    ),
    serviceOverrides: {},
    providers: {
      "DTT Hungary": { online: true, authorization: true, denied: [] },
      Telekom: { online: true, authorization: true, denied: [] },
      One: { online: true, authorization: true, denied: [] },
      Yettel: { online: true, authorization: true, denied: [] },
    },
  };
}

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));
const weatherPenalty = (broadcast) =>
  (({ Clear: 0, Cloudy: 3, Rain: 9, "Heavy Rain": 18, Storm: 30 })[
    broadcast.weather
  ] || 0) *
  (0.55 + clamp(broadcast.weatherSeverity) / 200);
const circularDistance = (a, b) => {
  const diff = Math.abs(a - b);
  return Math.min(diff, 100 - diff);
};

export function receptionForMux(state, towerId, muxId, device = "utv") {
  const broadcast = state.lab.broadcast;
  const tower = broadcast.towers[towerId];
  const mux = tower?.multiplexes?.[muxId];
  const tuner = state.lab[device];
  const antennaConnected =
    device === "utv"
      ? state.lab.cables.antennaToUtv
      : state.lab.cables.antennaToDecoder;
  const antenna = ANTENNAS[state.lab.antenna.selected] || ANTENNAS.tiktok;
  if (
    !tower ||
    !mux ||
    !antennaConnected ||
    !tower.enabled ||
    !mux.enabled ||
    tuner?.tunerEnabled === false
  )
    return {
      strength: 0,
      quality: 0,
      alignment: 0,
      state: "No Signal",
      locked: false,
      frequency: mux?.frequency || 0,
      collision: false,
      towerId,
      muxId,
      stability: 0,
      noise: mux?.noise || 0,
      interference: mux?.interference || 0,
      multipath: mux?.multipath || 0,
      fading: mux?.fading || 0,
      impairment: 100,
    };
  const alignmentDistance = circularDistance(
    state.lab.antenna.position,
    TOWER_PLAN[towerId].position,
  );
  const alignment = clamp(100 - alignmentDistance * (2.15 - antenna.tolerance));
  const distancePenalty =
    TOWER_PLAN[towerId].distance * (1.03 - antenna.gain * 0.46);
  const weather = weatherPenalty(broadcast);
  const configuredStrength = clamp((mux.strength * tower.output) / 100);
  const configuredQuality = clamp(
    (((mux.quality * tower.stability) / 100) * mux.stability) / 100,
  );
  let strength = clamp(
    configuredStrength * antenna.gain * (0.25 + alignment * 0.0075) -
      distancePenalty -
      weather * 0.35 -
      mux.fading * 0.35,
  );
  let quality = clamp(
    configuredQuality * (0.18 + alignment * 0.0082) -
      distancePenalty * 0.62 -
      weather -
      mux.interference * 0.72 -
      mux.noise * 0.66 -
      mux.multipath * 0.55,
  );
  const collisions = Object.entries(broadcast.towers)
    .flatMap(([otherTowerId, otherTower]) =>
      Object.entries(otherTower.multiplexes)
        .filter(
          ([, otherMux]) =>
            otherTower.enabled &&
            otherMux.enabled &&
            otherMux.frequency === mux.frequency,
        )
        .map(([otherMuxId]) => ({ towerId: otherTowerId, muxId: otherMuxId })),
    )
    .filter((entry) => entry.towerId !== towerId || entry.muxId !== muxId);
  if (collisions.length) {
    quality = clamp(quality - 28 - collisions.length * 8);
    strength = clamp(strength + 4);
  }
  const effectiveStability = clamp(
    (tower.stability + mux.stability) / 2 -
      mux.fading * 0.55 -
      mux.multipath * 0.22 -
      weather * 0.35,
  );
  const impairment = clamp(
    100 -
      quality +
      mux.noise * 0.45 +
      mux.interference * 0.35 +
      mux.multipath * 0.22 +
      mux.fading * 0.2,
  );
  const physicallyPerfect =
    configuredStrength >= 99.5 &&
    configuredQuality >= 99.5 &&
    tower.output >= 99.5 &&
    tower.stability >= 99.5 &&
    mux.stability >= 99.5 &&
    mux.noise <= 0 &&
    mux.interference <= 0 &&
    mux.multipath <= 0 &&
    mux.fading <= 0 &&
    alignment >= 99.5 &&
    broadcast.weather === "Clear" &&
    collisions.length === 0;
  if (physicallyPerfect) {
    strength = 100;
    quality = 100;
  }
  const finalStability = physicallyPerfect ? 100 : effectiveStability;
  const finalImpairment = physicallyPerfect ? 0 : impairment;
  const locked = strength >= 20 && quality >= 12 && finalStability >= 18;
  const tunerState = !strength
    ? "No Signal"
    : !locked && quality < 18
      ? "Signal Detected"
      : !locked
        ? "Acquiring"
        : quality < 25
          ? "Severe Breakup"
          : quality < 45
            ? "Unstable"
            : "Locked";
  return {
    strength,
    quality,
    alignment,
    state: tunerState,
    locked,
    frequency: mux.frequency,
    collision: collisions.length > 0,
    collisions,
    configuredStrength,
    configuredQuality,
    weatherPenalty: weather,
    antenna: antenna.name,
    towerId,
    muxId,
    stability: finalStability,
    noise: clamp(mux.noise),
    interference: clamp(mux.interference),
    multipath: clamp(mux.multipath),
    fading: clamp(mux.fading),
    impairment: finalImpairment,
  };
}

export function strongestReceptionAtFrequency(
  state,
  frequency,
  device = "utv",
) {
  const candidates = [];
  for (const [towerId, tower] of Object.entries(state.lab.broadcast.towers)) {
    for (const [muxId, mux] of Object.entries(tower.multiplexes)) {
      if (Number(mux.frequency) !== Number(frequency)) continue;
      candidates.push(receptionForMux(state, towerId, muxId, device));
    }
  }
  return (
    candidates.sort(
      (a, b) =>
        b.locked - a.locked || b.quality - a.quality || b.strength - a.strength,
    )[0] || null
  );
}

export function servicesForMux(state, muxId, device = "utv") {
  const services = createBroadcastServices(
    state.lab.broadcast.fallbackAssignments,
  );
  return services
    .map((service) => {
      const override = state.lab.broadcast.serviceOverrides[service.id] || {};
      return {
        ...service,
        ...override,
        providers: override.provider
          ? [override.provider]
          : override.providers || service.providers,
        lcnBroadcast: override.lcnBroadcast !== false,
      };
    })
    .filter(
      (service) =>
        service.mux === muxId &&
        service.broadcast !== false &&
        (device !== "utv" || service.free),
    );
}

export function discoverFrequency(state, frequency, device = "utv") {
  const reception = strongestReceptionAtFrequency(
    state,
    Number(frequency),
    device,
  );
  if (!reception || !reception.locked)
    return { frequency: Number(frequency), reception, services: [] };
  return {
    frequency: Number(frequency),
    reception,
    services: servicesForMux(state, reception.muxId, device).map((service) => ({
      ...service,
      tunedFrequency: Number(frequency),
      towerId: reception.towerId,
      tunedStrength: reception.strength,
      tunedQuality: reception.quality,
      tunedStability: reception.stability,
    })),
  };
}

export function automaticScan(state, device = "utv") {
  const frequencies = [
    ...new Set(
      Object.values(state.lab.broadcast.towers).flatMap((tower) =>
        Object.values(tower.multiplexes).map((mux) => mux.frequency),
      ),
    ),
  ].sort((a, b) => a - b);
  const results = frequencies.map((frequency) =>
    discoverFrequency(state, frequency, device),
  );
  const byId = new Map();
  for (const result of results)
    for (const service of result.services) {
      const identity = serviceIdentity(service.canonicalName || service.name);
      const previous = byId.get(identity);
      if (
        !previous ||
        (service.tunedQuality || 0) > (previous.tunedQuality || 0)
      )
        byId.set(identity, service);
    }
  return { frequencies, results, services: [...byId.values()] };
}

export function mergeScanIntoDatabase(existing, found) {
  const map = new Map();
  for (const channel of Array.isArray(existing) ? existing : []) {
    if (!channel?.name) continue;
    const identity = serviceIdentity(channel.canonicalName || channel.name);
    const previous = map.get(identity);
    if (!previous || channel.customNumber || channel.favorite)
      map.set(identity, channel);
  }
  const used = new Set(
    [...map.values()].map((channel) => channel.channelNumber),
  );
  for (const service of found) {
    const identity = serviceIdentity(service.canonicalName || service.name);
    const previous = map.get(identity);
    let channelNumber = previous?.customNumber
      ? previous.channelNumber
      : service.lcnBroadcast === false
        ? 800
        : service.lcn;
    while (used.has(channelNumber) && channelNumber !== previous?.channelNumber)
      channelNumber += 1;
    used.add(channelNumber);
    map.set(identity, {
      ...previous,
      ...service,
      channelNumber,
      customNumber: previous?.customNumber || false,
      favorite: previous?.favorite || false,
      hidden: previous?.hidden || false,
    });
  }
  return [...map.values()].sort(
    (a, b) => a.channelNumber - b.channelNumber || a.name.localeCompare(b.name),
  );
}

export function isServiceAuthorized(state, service) {
  if (!service || service.free) return Boolean(service);
  const decoder = state.lab.decoder;
  const card = decoder.card;
  if (
    !card ||
    decoder.cardReaderEnabled === false ||
    decoder.cardValid === false
  )
    return false;
  if (!service.providers?.includes(card)) return false;
  const provider = state.lab.broadcast.providers[card];
  return (
    provider?.online !== false &&
    provider?.authorization !== false &&
    !provider?.denied?.includes(service.id)
  );
}

export function playbackStatus(state, channel, device = "utv") {
  if (!channel)
    return {
      kind: "empty",
      title: "No channel selected",
      detail: "Run Channel Search.",
    };
  const result = discoverFrequency(state, channel.tunedFrequency, device);
  const received = result.services.find((service) => service.id === channel.id);
  if (!received)
    return {
      kind: "no-signal",
      title: "Nincs jel",
      detail: "No Signal",
      reception: result.reception,
    };
  if (!received.free && device === "decoder") {
    if (!isServiceAuthorized(state, received))
      return {
        kind: "coded",
        title: "Kódolt Adás",
        detail: "Coded Stream.",
        reception: result.reception,
      };
    if (
      /Dorcel|Hustler|Brazzers/i.test(received.name) &&
      !state.lab.decoder.parentalUnlocked
    )
      return {
        kind: "parental",
        title: "Parental Control",
        detail: "Enter PIN",
        reception: result.reception,
        service: received,
      };
  }
  const override = state.lab.broadcast.serviceOverrides[received.id] || {};
  return {
    kind: override.video === false ? "video-fault" : "playing",
    title: received.name,
    detail: override.audio === false ? "Audio Feed Failure" : "On air",
    reception: result.reception,
    service: received,
    audio: override.audio !== false,
    impairment: result.reception?.impairment || 0,
    audioReliability: clamp(
      (result.reception?.quality || 0) * 0.72 +
        (result.reception?.stability || 0) * 0.28 -
        (result.reception?.noise || 0) * 0.38,
    ),
  };
}

export function effectiveService(state, channel) {
  if (!channel) return null;
  const override = state.lab.broadcast.serviceOverrides[channel.id] || {};
  return {
    ...channel,
    ...override,
    providers: override.provider
      ? [override.provider]
      : override.providers || channel.providers,
    lcnBroadcast: override.lcnBroadcast !== false,
  };
}

export function programFor(service, at = Date.now()) {
  if (!service) return null;
  const identity =
    service.programming && service.programming !== "Normal"
      ? `${service.id}:${service.programming}`
      : service.id;
  const seed = stableHash(identity);
  const genres = [
    "Newsroom",
    "Nature",
    "Cinema",
    "Sport",
    "Culture",
    "Science",
    "Music",
    "Kids",
  ];
  const nouns = [
    "Horizons",
    "Live",
    "Studio",
    "Atlas",
    "Evening",
    "Stories",
    "Pulse",
    "Journey",
  ];
  const slot = Math.floor(at / 1800000);
  const make = (offset) => {
    const start = (slot + offset) * 1800000;
    const genre = genres[(seed + slot + offset) % genres.length];
    const overrideLabel =
      service.programming && service.programming !== "Normal"
        ? `${service.programming} · `
        : "";
    return {
      id: `${identity}:${slot + offset}`,
      title: `${overrideLabel}${genre} ${nouns[((seed >>> 4) + slot + offset) % nouns.length]}`,
      category: genre,
      start,
      end: start + 1800000,
      description: `Original Antoid ${genre.toLowerCase()} programme produced for ${service.name}.`,
    };
  };
  return {
    current: make(0),
    next: make(1),
    progress: ((at % 1800000) / 1800000) * 100,
    schedule: [make(-1), make(0), make(1), make(2), make(3)],
  };
}

export function validateBroadcastMap(
  fallbackAssignments = defaultFallbackAssignments(),
) {
  const services = createBroadcastServices(fallbackAssignments);
  return {
    undefinedMux: services.filter((service) => !MUX_IDS.includes(service.mux)),
    invalidFree: services.filter(
      (service) => service.free && !["A", "B"].includes(service.mux),
    ),
    packageCounts: Object.fromEntries(
      Object.entries(PROVIDER_PACKAGES).map(([provider, names]) => [
        provider,
        names.length,
      ]),
    ),
  };
}
