import { describe, expect, it } from "vitest";
import {
  createInitialState,
  migrateState,
  reducer,
} from "../state/OSContext.jsx";
import {
  FM_PROGRAMS,
  calculateFMReception,
  createFMTransmitters,
  currentFMProgramme,
  formatFMFrequency,
  scanFMEnvironment,
  seekFM,
} from "./fm.js";
import { hardwareCapabilities } from "./hardware.js";
import { FM_COMPOSITIONS, compositionFrame } from "./fmAudio.js";

describe("Antoid Lab 5.0.0 Public Beta FM regression", () => {
  it("ships all four Hungarian transmitters and eight distinct original songs", () => {
    const transmitters = createFMTransmitters();
    expect(
      transmitters.map(({ station, frequency }) => [station, frequency]),
    ).toEqual([
      ["Rádió 24", 102.9],
      ["Kossuth Rádió", 92],
      ["Petőfi Rádió", 90.3],
      ["Retro Rádió", 100.5],
    ]);
    const songs = Object.values(FM_PROGRAMS).flatMap(
      (program) => program.songs,
    );
    expect(songs).toHaveLength(8);
    expect(new Set(songs.map((song) => song.title)).size).toBe(8);
    expect(
      songs.every((song) => song.duration >= 120 && song.duration <= 180),
    ).toBe(true);
    expect(
      Object.values(FM_PROGRAMS)
        .flatMap((program) => program.ids)
        .every((id) => !/\d+[.,]\d/.test(id)),
    ).toBe(true);
  });

  it("uses eight genuinely separate compositions rather than one shared song engine", () => {
    const compositions = Object.values(FM_COMPOSITIONS).flat();
    expect(compositions).toHaveLength(8);
    expect(new Set(compositions.map((song) => song.id)).size).toBe(8);
    expect(
      new Set(
        compositions.map(
          (song) => `${song.tempo}:${song.stepsPerBeat}:${song.drums}`,
        ),
      ).size,
    ).toBe(8);
    expect(
      new Set(compositions.map((song) => JSON.stringify(song.lead))).size,
    ).toBe(8);
    const frames = Object.entries(FM_COMPOSITIONS).flatMap(([station, songs]) =>
      songs.map((_, index) => compositionFrame(station, index, 12_345)),
    );
    expect(
      new Set(
        frames.map(
          (frame) =>
            `${frame.id}:${frame.leadHz}:${frame.bassHz}:${frame.drumAccent}`,
        ),
      ).size,
    ).toBe(8);
  });

  it("formats the Hungarian decimal comma and keeps programme time globally continuous", () => {
    expect(formatFMFrequency(102.9)).toBe("102,9 MHz");
    expect(currentFMProgramme("radio24", 10_000)).toEqual(
      currentFMProgramme("radio24", 10_000),
    );
    expect(currentFMProgramme("radio24", 160_000).type).toBe("id");
  });

  it("calculates reception from transmitter, antenna and tuner hardware", () => {
    const state = createInitialState();
    const clean = calculateFMReception(state, 102.9, 1000);
    expect(clean.transmitter.id).toBe("radio24");
    expect(clean.finalReception).toBeGreaterThan(50);
    state.fm.transmitters[0].strength = 28;
    state.fm.transmitters[0].noise = 90;
    const degraded = calculateFMReception(state, 102.9, 1000);
    expect(degraded.finalReception).toBeLessThan(clean.finalReception);
    state.hardware.components.fmAntenna.installed = false;
    state.hardware.components.fmAntenna.connected = false;
    expect(calculateFMReception(state, 102.9).finalReception).toBe(0);
    state.audioAccessories.wiredHeadphonesConnected = true;
    state.fm.antenna = "Wired Headphones";
    expect(calculateFMReception(state, 102.9).antenna.available).toBe(true);
  });

  it("crashes only for two enabled transmitters on the exact tuned frequency", () => {
    const state = createInitialState();
    state.fm.transmitters[1].frequency = 102.9;
    expect(calculateFMReception(state, 102.9).collision).toBe(true);
    expect(calculateFMReception(state, 102.8).collision).toBe(false);
    state.fm.transmitters[1].enabled = false;
    expect(calculateFMReception(state, 102.9).collision).toBe(false);
    const crashed = reducer(state, {
      type: "FM_COLLISION",
      frequency: 102.9,
      count: 2,
    });
    expect(crashed.fm.crash).toMatchObject({ frequency: 102.9, count: 2 });
    expect(
      crashed.developer.timeline.some(
        (event) => event.category === "fm" && event.message.includes("102.9"),
      ),
    ).toBe(true);
  });

  it("scans and seeks against the live controller environment", () => {
    const state = createInitialState();
    const found = scanFMEnvironment(state, 1000);
    expect(found.map((station) => station.frequency)).toEqual([
      90.3, 92, 100.5, 102.9,
    ]);
    state.fm.frequency = 92;
    expect(seekFM(state, 1)).toBe(100.5);
    state.fm.transmitters[3].enabled = false;
    expect(seekFM(state, 1)).toBe(102.9);
  });

  it("migrates legacy data with working FM defaults and meaningful budget parts", () => {
    const state = migrateState({
      schema: 5,
      setup: { firstName: "Existing", done: true },
    });
    expect(state.fm.transmitters).toHaveLength(4);
    expect(state.audioAccessories.wiredHeadphonesConnected).toBe(false);
    Object.assign(state.hardware.components.fmReceiver, {
      manufacturer: "Extreme Budget",
      sensitivity: 0.68,
      noisePenalty: 13,
    });
    Object.assign(state.hardware.components.headphoneJack, {
      manufacturer: "Extreme Budget",
      channels: 1,
      crackle: 24,
    });
    state.audioAccessories.wiredHeadphonesConnected = true;
    state.fm.audioOutput = "Wired Headphones";
    const caps = hardwareCapabilities(state);
    expect(caps.headphoneChannels).toBe(1);
    expect(caps.headphoneCrackle).toBeGreaterThan(0);
    const reception = calculateFMReception(state);
    expect(reception.finalReception).toBeLessThan(90);
    expect(reception.outputChannels).toBe(1);
    expect(reception.outputQuality).toBeLessThan(70);
  });
});
