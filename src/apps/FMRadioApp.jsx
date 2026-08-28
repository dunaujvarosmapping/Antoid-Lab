import React, { useEffect, useMemo, useRef } from "react";
import { useOS } from "../state/OSContext.jsx";
import {
  FM_MAX,
  FM_MIN,
  calculateFMReception,
  formatFMFrequency,
  seekFM,
} from "../services/fm.js";
import { startFMProgram } from "../services/fmAudio.js";
import { Button, Header, Slider } from "../components/UI.jsx";

export function FMRadioApp() {
  const { state, set, dispatch } = useOS();
  const player = useRef(null);
  const reception = useMemo(
    () => calculateFMReception(state),
    [state.fm, state.hardware, state.audioAccessories],
  );

  useEffect(() => {
    if (reception.collision)
      dispatch({
        type: "FM_COLLISION",
        frequency: reception.frequency,
        count: reception.collisionCount,
      });
  }, [reception.collision, reception.collisionCount, reception.frequency, dispatch]);

  useEffect(() => {
    player.current?.stop?.();
    player.current = null;
    if (!state.fm.playing || !reception.outputAvailable || state.fm.crash) return undefined;
    player.current = startFMProgram({
      stationId: reception.modulation ? reception.transmitter?.id : null,
      reception: reception.modulation
        ? Math.min(reception.finalReception, reception.outputQuality)
        : reception.outputQuality,
      volume: state.fm.volume / 100,
      muted: state.fm.muted || !reception.modulation,
    });
    return () => {
      player.current?.stop?.();
      player.current = null;
    };
  }, [
    state.fm.playing,
    state.fm.crash,
    reception.transmitter?.id,
    reception.modulation,
    reception.outputAvailable,
  ]);

  useEffect(() => {
    player.current?.setReception?.(
      Math.min(reception.finalReception, reception.outputQuality),
    );
    player.current?.setVolume?.(state.fm.volume / 100);
    player.current?.setMuted?.(state.fm.muted || !reception.modulation);
  }, [reception.finalReception, reception.outputQuality, reception.modulation, state.fm.volume, state.fm.muted]);

  const tune = (frequency) => dispatch({ type: "FM_TUNE", frequency });
  const favorite = state.fm.favorites.includes(reception.frequency);

  if (state.fm.crash)
    return (
      <div className="fm-crash">
        <i>!</i>
        <h2>FM Radio has stopped</h2>
        <p>Conflicting broadcast detected.</p>
        <dl>
          <dt>Frequency</dt>
          <dd>{formatFMFrequency(state.fm.crash.frequency)}</dd>
          <dt>Transmitters</dt>
          <dd>{state.fm.crash.count}</dd>
        </dl>
        <Button
          tone="primary"
          onClick={() => {
            dispatch({ type: "FM_CLEAR_CRASH" });
            dispatch({ type: "HOME" });
          }}
        >
          Return Home
        </Button>
      </div>
    );

  return (
    <div className="fm-radio app-scroll">
      <Header
        title="FM Radio"
        subtitle={`${reception.antenna.actual} · ${reception.mode}`}
        action={
          <button
            className={favorite ? "fm-favorite saved" : "fm-favorite"}
            aria-label={favorite ? "Remove favorite" : "Save favorite"}
            onClick={() => dispatch({ type: "FM_FAVORITE", frequency: reception.frequency })}
          >
            {favorite ? "★" : "☆"}
          </button>
        }
      />

      <section className={`fm-now quality-${reception.quality.toLowerCase().replace(" ", "-")}`}>
        <small>{reception.transmitter ? "TUNED STATION" : "FM TUNER"}</small>
        <strong>{formatFMFrequency(reception.frequency)}</strong>
        <h2>{reception.transmitter?.station || "No station"}</h2>
        <div className="fm-badges">
          <b>{reception.quality}</b>
          <b>{reception.mode}</b>
          <b>RDS {reception.rds}</b>
        </div>
        <div className="fm-meter" aria-label={`Signal ${Math.round(reception.finalReception)} percent`}>
          <i style={{ width: `${reception.finalReception}%` }} />
        </div>
        <span>{Math.round(reception.finalReception)}% · {reception.audioState}</span>
      </section>

      {!reception.receiverAvailable && (
        <div className="fm-warning"><b>FM receiver not detected.</b><span>Install a working FM tuner in Phone Disassembly.</span></div>
      )}
      {!reception.antenna.available && reception.receiverAvailable && (
        <div className="fm-warning"><b>Selected antenna unavailable</b><span>Connect wired headphones or select another antenna.</span></div>
      )}
      {!reception.outputAvailable && (
        <div className="fm-warning"><b>Audio output unavailable</b><span>Select a working phone speaker or connect detectable wired headphones.</span></div>
      )}

      <section className="fm-tuner">
        <input
          aria-label="FM tuning frequency"
          type="range"
          min={FM_MIN * 10}
          max={FM_MAX * 10}
          step="1"
          value={Math.round(reception.frequency * 10)}
          onChange={(event) => tune(Number(event.target.value) / 10)}
        />
        <div className="fm-scale"><span>87,5</span><span>97,8</span><span>108,0</span></div>
        <div className="fm-tune-actions">
          <Button onClick={() => tune(reception.frequency - 0.1)}>− 0,1</Button>
          <Button onClick={() => tune(seekFM(state, -1))}>Seek Down</Button>
          <Button onClick={() => tune(seekFM(state, 1))}>Seek Up</Button>
          <Button onClick={() => tune(reception.frequency + 0.1)}>+ 0,1</Button>
        </div>
      </section>

      <section className="fm-playback">
        <button
          className="fm-main-control"
          disabled={!reception.receiverAvailable || !reception.antenna.available}
          onClick={() => set("fm.playing", !state.fm.playing)}
        >
          {state.fm.playing ? "Ⅱ" : "▶"}
        </button>
        <button onClick={() => set("fm.muted", !state.fm.muted)}>
          {state.fm.muted ? "Muted" : "Mute"}
        </button>
        <Slider label="Radio volume" value={state.fm.volume} onChange={(value) => set("fm.volume", value)} />
      </section>

      <section className="fm-rds">
        <small>{reception.rdsLocked ? reception.transmitter?.rdsName : "RDS searching"}</small>
        <h3>{reception.rdsLocked ? reception.programme?.title || reception.transmitter?.radioText : "—"}</h3>
        <p>{reception.rdsLocked ? reception.programme?.artist || reception.transmitter?.radioText : "Station text appears when RDS obtains a clean lock."}</p>
      </section>

      <section className="fm-settings-panel">
        <h3>Antenna Selection</h3>
        <select
          value={state.fm.antenna}
          onChange={(event) => {
            const value = event.target.value;
            set("fm.antenna", value);
            dispatch({
              type: "LOG_SYSTEM_EVENT",
              event: { source: "fm", category: "fm", type: "FM antenna changed", message: `FM antenna selection changed to ${value}` },
            });
          }}
        >
          <option>Automatic</option>
          <option disabled={!reception.antenna.internalAvailable}>Internal FM Antenna</option>
          <option>Wired Headphones</option>
        </select>
        <h3>Audio output</h3>
        <select value={state.fm.audioOutput} onChange={(event) => set("fm.audioOutput", event.target.value)}>
          <option>Phone Speaker</option>
          <option disabled={!reception.antenna.wiredAvailable}>Wired Headphones</option>
        </select>
      </section>

      <section className="fm-scan">
        <div><h3>Auto Scan</h3><small>Uses the current RS Controller environment and installed hardware.</small></div>
        <Button onClick={() => dispatch({ type: "FM_SCAN" })}>Scan now</Button>
        {state.fm.scanned.map((station) => (
          <button key={`${station.frequency}-${station.station}`} onClick={() => tune(station.frequency)}>
            <b>{station.station}</b><span>{formatFMFrequency(station.frequency)} · {station.strength}%</span>
          </button>
        ))}
      </section>

      <section className="fm-presets">
        <h3>Saved frequencies</h3>
        {state.fm.favorites.length ? state.fm.favorites.map((frequency) => (
          <button key={frequency} onClick={() => tune(frequency)}>{formatFMFrequency(frequency)}</button>
        )) : <p>No presets saved.</p>}
      </section>
    </div>
  );
}
