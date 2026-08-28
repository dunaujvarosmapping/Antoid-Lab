import { describe, expect, it } from "vitest";
import {
  CANONICAL_MUX_SERVICES,
  FREE_DTT,
  PROVIDER_PACKAGES,
  automaticScan,
  createBroadcastServices,
  discoverFrequency,
  isServiceAuthorized,
  mergeScanIntoDatabase,
  playbackStatus,
  receptionForMux,
  servicesForMux,
  strongestReceptionAtFrequency,
  validateBroadcastMap,
} from "./dvb.js";
import { createLabState, migrateLabState } from "./lab.js";

const makeState = () => {
  const lab = createLabState();
  lab.antenna.selected = "supra";
  lab.antenna.position = 12;
  lab.cables.antennaToUtv = true;
  lab.cables.antennaToDecoder = true;
  return { lab };
};

describe("canonical DVB-T2 map", () => {
  it("preserves every fixed service on its authoritative multiplex", () => {
    const services = createBroadcastServices();
    for (const [mux, names] of Object.entries(CANONICAL_MUX_SERVICES)) {
      for (const name of names) {
        expect(
          services.find(
            (service) =>
              service.id.startsWith("canonical:") && service.name === name,
          )?.mux,
        ).toBe(mux);
      }
    }
    expect(
      services.filter((service) => service.mux === "A" && !service.free),
    ).toHaveLength(0);
    expect(
      services
        .filter((service) => service.mux === "B" && !service.free)
        .map((service) => service.name),
    ).toEqual(["Izaura TV", "Dikh TV"]);
    expect(
      services.filter(
        (service) => ["C", "D", "E"].includes(service.mux) && service.free,
      ),
    ).toHaveLength(0);
  });

  it("keeps exact provider-facing lineups and assigns every entry", () => {
    const audit = validateBroadcastMap();
    expect(audit.undefinedMux).toHaveLength(0);
    expect(audit.invalidFree).toHaveLength(0);
    expect(PROVIDER_PACKAGES.Telekom).toHaveLength(112);
    expect(PROVIDER_PACKAGES.One).toHaveLength(109);
    expect(PROVIDER_PACKAGES.Yettel).toHaveLength(102);
    expect(PROVIDER_PACKAGES.Telekom).toContain("Bónusz");
    expect(PROVIDER_PACKAGES.One).toContain("Duna World HD / M4 Sport+ HD");
    expect(PROVIDER_PACKAGES.Yettel.slice(-3)).toEqual([
      "Bartók Rádió",
      "Kossuth Rádió",
      "Petőfi Rádió",
    ]);
  });

  it("migrates and preserves permanent fallback assignments", () => {
    const original = createLabState();
    original.broadcast.fallbackAssignments["Telekom:Da Vinci"] = "E";
    const restored = migrateLabState(JSON.parse(JSON.stringify(original)));
    expect(restored.broadcast.fallbackAssignments["Telekom:Da Vinci"]).toBe(
      "E",
    );
    expect(
      createBroadcastServices(restored.broadcast.fallbackAssignments).find(
        (service) =>
          service.provider === "Telekom" && service.name === "Da Vinci",
      )?.mux,
    ).toBe("E");
  });

  it("repairs malformed legacy UTV layout state without losing valid data", () => {
    const restored = migrateLabState({
      activeDevice: "utv",
      deviceView: "invalid-view",
      antenna: { selected: "tiktok", position: "not-a-number" },
      utv: {
        setupStep: 99,
        language: "Magyar",
        pip: "corrupted",
        wifi: null,
      },
    });
    expect(restored.activeDevice).toBe("utv");
    expect(restored.deviceView).toBe("utv");
    expect(restored.antenna.position).toBe(12);
    expect(restored.utv.setupStep).toBe(6);
    expect(restored.utv.language).toBe("Magyar");
    expect(restored.utv.pip).toEqual({
      enabled: false,
      source: "HDMI 1",
      position: "bottom-right",
    });
    expect(restored.utv.wifi.enabled).toBe(true);
  });
});

describe("DVB-T2 signal path and scanning", () => {
  it("discovers only free services in UTV and free plus coded in Decoder", () => {
    const state = makeState();
    const utv = automaticScan(state, "utv");
    const decoder = automaticScan(state, "decoder");
    expect(utv.services.every((service) => service.free)).toBe(true);
    expect(new Set(utv.services.map((service) => service.name))).toEqual(
      new Set(FREE_DTT),
    );
    expect(decoder.services.some((service) => !service.free)).toBe(true);
  });

  it("searches the exact entered frequency only", () => {
    const state = makeState();
    expect(
      discoverFrequency(state, 482000, "utv").services.every(
        (service) => service.mux === "A",
      ),
    ).toBe(true);
    expect(discoverFrequency(state, 483000, "utv").services).toHaveLength(0);
  });

  it("runs a scan without an antenna and finds zero services", () => {
    const state = makeState();
    state.lab.cables.antennaToUtv = false;
    const result = automaticScan(state, "utv");
    expect(result.services).toHaveLength(0);
    expect(receptionForMux(state, "dunaujvaros", "A", "utv").state).toBe(
      "No Signal",
    );
  });

  it("keeps tower MUX shutdown independent", () => {
    const state = makeState();
    state.lab.broadcast.towers.dunaujvaros.multiplexes.D.enabled = false;
    expect(discoverFrequency(state, 602000, "decoder").services).toHaveLength(
      0,
    );
    state.lab.antenna.position = 66;
    expect(
      discoverFrequency(state, 618000, "decoder").services.some(
        (service) => service.mux === "D",
      ),
    ).toBe(true);
  });

  it("removes one service without removing its multiplex peers", () => {
    const state = makeState();
    const first = discoverFrequency(state, 602000, "decoder");
    const disney = first.services.find(
      (service) => service.name === "Disney Channel",
    );
    state.lab.broadcast.serviceOverrides[disney.id] = { broadcast: false };
    const second = discoverFrequency(state, 602000, "decoder");
    expect(
      second.services.some((service) => service.name === "Disney Channel"),
    ).toBe(false);
    expect(second.services.length).toBeGreaterThan(1);
  });

  it("keeps a stored tuning stale after a frequency change until rescanned", () => {
    const state = makeState();
    const channel = discoverFrequency(state, 482000, "utv").services[0];
    state.lab.broadcast.towers.dunaujvaros.multiplexes.A.frequency = 490000;
    expect(playbackStatus(state, channel, "utv").kind).toBe("no-signal");
    expect(
      discoverFrequency(state, 490000, "utv").services.length,
    ).toBeGreaterThan(0);
  });

  it("models exact-frequency collisions without merging multiplex services", () => {
    const state = makeState();
    state.lab.broadcast.towers.kabhegy.multiplexes.B.frequency = 482000;
    const reception = strongestReceptionAtFrequency(state, 482000, "decoder");
    const found = discoverFrequency(state, 482000, "decoder").services;
    expect(reception.collision).toBe(true);
    expect(
      new Set(found.map((service) => service.mux)).size,
    ).toBeLessThanOrEqual(1);
  });

  it("separates coded authorization from RF lock", () => {
    const state = makeState();
    const axn = discoverFrequency(state, 562000, "decoder").services.find(
      (service) => service.name === "AXN",
    );
    expect(playbackStatus(state, axn, "decoder").kind).toBe("coded");
    state.lab.decoder.card = "Telekom";
    expect(playbackStatus(state, axn, "decoder").kind).toBe("playing");
    state.lab.broadcast.providers.Telekom.authorization = false;
    const denied = playbackStatus(state, axn, "decoder");
    expect(denied.kind).toBe("coded");
    expect(denied.reception.locked).toBe(true);
  });

  it("deduplicates provider aliases into one physical broadcast service", () => {
    const services = createBroadcastServices();
    expect(services.length).toBeLessThan(200);
    expect(new Set(services.map((service) => service.id)).size).toBe(
      services.length,
    );
    const axn = services.find((service) => service.name === "AXN");
    expect(axn.providers).toEqual(["Telekom", "One", "Yettel"]);
  });

  it("card changes authorization immediately without changing discovery", () => {
    const state = makeState();
    const scan = automaticScan(state, "decoder");
    const dorcel = scan.services.find(
      (service) => service.name === "Dorcel TV",
    );
    expect(dorcel).toBeTruthy();
    const count = scan.services.length;
    expect(isServiceAuthorized(state, dorcel)).toBe(false);
    state.lab.decoder.card = "Telekom";
    expect(isServiceAuthorized(state, dorcel)).toBe(false);
    state.lab.decoder.card = "Yettel";
    expect(isServiceAuthorized(state, dorcel)).toBe(true);
    expect(automaticScan(state, "decoder").services).toHaveLength(count);
    state.lab.decoder.card = null;
    expect(playbackStatus(state, dorcel, "decoder").kind).toBe("coded");
  });

  it("keeps free Decoder services authorized with every card state", () => {
    const state = makeState();
    const free = discoverFrequency(state, 482000, "decoder").services[0];
    for (const card of [null, "Telekom", "One", "Yettel"]) {
      state.lab.decoder.card = card;
      expect(playbackStatus(state, free, "decoder").kind).toBe("playing");
    }
  });

  it("makes noise and quality alter the same reception used by playback", () => {
    const state = makeState();
    const mux = state.lab.broadcast.towers.dunaujvaros.multiplexes.A;
    const clean = receptionForMux(state, "dunaujvaros", "A", "utv");
    mux.noise = 90;
    const noisy = receptionForMux(state, "dunaujvaros", "A", "utv");
    expect(noisy.strength).toBeGreaterThan(70);
    expect(noisy.quality).toBeLessThan(clean.quality - 40);
    expect(noisy.impairment).toBeGreaterThan(clean.impairment);
    mux.noise = 0;
    mux.quality = 20;
    const lowQuality = receptionForMux(state, "dunaujvaros", "A", "utv");
    expect(lowQuality.strength).toBeGreaterThan(lowQuality.quality);
  });

  it("merges rescans and legacy aliases without duplicate channel growth", () => {
    const state = makeState();
    const found = automaticScan(state, "decoder").services;
    const legacy = found
      .slice(0, 4)
      .flatMap((service) => [
        service,
        { ...service, id: `legacy:${service.id}` },
      ]);
    const first = mergeScanIntoDatabase(legacy, found);
    const second = mergeScanIntoDatabase(first, found);
    expect(second).toHaveLength(first.length);
    expect(new Set(second.map((service) => service.id)).size).toBe(
      second.length,
    );
  });

  it("uses stable public LCNs and keeps radio services in the audio range", () => {
    const services = createBroadcastServices();
    const lcn = (name) =>
      services.find((service) => service.name === name)?.lcn;
    expect(lcn("M1 HD")).toBe(1);
    expect(lcn("M2 HD")).toBe(2);
    expect(lcn("Duna HD")).toBe(3);
    expect(lcn("TV2")).toBe(9);
    expect(lcn("Kossuth Rádió")).toBe(201);
    expect(lcn("Dankó Rádió")).toBe(204);
  });

  it("propagates authoritative format and aspect overrides into discovery", () => {
    const state = makeState();
    const m1 = createBroadcastServices().find(
      (service) => service.name === "M1 HD",
    );
    state.lab.broadcast.serviceOverrides[m1.id] = {
      resolution: "576i",
      aspectRatio: "4:3",
      audioMode: "Mono",
    };
    const received = discoverFrequency(state, 482000, "utv").services.find(
      (service) => service.id === m1.id,
    );
    expect(received).toMatchObject({
      resolution: "576i",
      aspectRatio: "4:3",
      audioMode: "Mono",
    });
  });

  it("makes encryption and provider overrides affect tuner access", () => {
    const state = makeState();
    const m1 = createBroadcastServices().find(
      (service) => service.name === "M1 HD",
    );
    state.lab.broadcast.serviceOverrides[m1.id] = {
      free: false,
      provider: "One",
    };
    expect(
      servicesForMux(state, "A", "utv").some((item) => item.id === m1.id),
    ).toBe(false);
    const coded = servicesForMux(state, "A", "decoder").find(
      (item) => item.id === m1.id,
    );
    expect(coded.providers).toEqual(["One"]);
    expect(isServiceAuthorized(state, coded)).toBe(false);
    state.lab.decoder.card = "One";
    expect(isServiceAuthorized(state, coded)).toBe(true);
  });

  it("applies changed, hidden and conflicting LCN metadata deterministically", () => {
    const state = makeState();
    const [m1, duna] = createBroadcastServices().filter((service) =>
      ["M1 HD", "Duna HD"].includes(service.name),
    );
    state.lab.broadcast.serviceOverrides[m1.id] = { lcn: 51 };
    let found = discoverFrequency(state, 482000, "utv").services;
    expect(
      mergeScanIntoDatabase([], found).find((item) => item.id === m1.id)
        .channelNumber,
    ).toBe(51);
    state.lab.broadcast.serviceOverrides[m1.id] = {
      lcn: 51,
      lcnBroadcast: false,
    };
    found = discoverFrequency(state, 482000, "utv").services;
    expect(
      mergeScanIntoDatabase([], found).find((item) => item.id === m1.id)
        .channelNumber,
    ).toBeGreaterThanOrEqual(800);
    state.lab.broadcast.serviceOverrides[m1.id] = { lcn: 5 };
    state.lab.broadcast.serviceOverrides[duna.id] = { lcn: 5 };
    const first = mergeScanIntoDatabase(
      [],
      discoverFrequency(state, 482000, "utv").services,
    );
    const second = mergeScanIntoDatabase(
      [],
      discoverFrequency(state, 482000, "utv").services,
    );
    expect(new Set(first.map((item) => item.channelNumber)).size).toBe(
      first.length,
    );
    expect(second.map((item) => item.channelNumber)).toEqual(
      first.map((item) => item.channelNumber),
    );
  });

  it("produces zero impairment for a genuinely perfect RF path", () => {
    const state = makeState();
    const tower = state.lab.broadcast.towers.dunaujvaros;
    const mux = tower.multiplexes.A;
    tower.output = 100;
    tower.stability = 100;
    Object.assign(mux, {
      strength: 100,
      quality: 100,
      stability: 100,
      noise: 0,
      interference: 0,
      multipath: 0,
      fading: 0,
    });
    state.lab.broadcast.weather = "Clear";
    for (const [towerId, otherTower] of Object.entries(
      state.lab.broadcast.towers,
    ))
      if (towerId !== "dunaujvaros") otherTower.enabled = false;
    const reception = receptionForMux(state, "dunaujvaros", "A", "utv");
    expect(reception).toMatchObject({
      strength: 100,
      quality: 100,
      stability: 100,
      impairment: 0,
    });
  });

  it("keeps audio alive through a video fault and removes it for an audio fault", () => {
    const state = makeState();
    const channel = discoverFrequency(state, 482000, "utv").services.find(
      (service) => service.type === "tv",
    );
    state.lab.broadcast.serviceOverrides[channel.id] = {
      video: false,
      audio: true,
    };
    expect(playbackStatus(state, channel, "utv")).toMatchObject({
      kind: "video-fault",
      audio: true,
    });
    state.lab.broadcast.serviceOverrides[channel.id] = {
      video: true,
      audio: false,
    };
    expect(playbackStatus(state, channel, "utv")).toMatchObject({
      kind: "playing",
      audio: false,
    });
  });
});
