import React, { useMemo, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import {
  ANTENNAS,
  MUX_IDS,
  TOWER_PLAN,
  createBroadcastServices,
  receptionForMux,
} from "../services/dvb.js";
import { Button, Slider, Toggle } from "./UI.jsx";

const sections = [
  "TV Hardware",
  "Inputs & Connections",
  "Antenna & Reception",
  "DVB-T2 Super Controller",
  "Weather",
  "Channels & Programming",
  "Network",
  "Decoder Box Controller",
  "DVD Player Controller",
  "Fault Testing",
];

function Connection({ id, label }) {
  const { state, set } = useOS();
  const change = (value) => {
    if (value && id === "decoderScartToUtv")
      set("lab.cables.dvdScartToUtv", false);
    if (value && id === "dvdScartToUtv")
      set("lab.cables.decoderScartToUtv", false);
    set(`lab.cables.${id}`, value);
  };
  return (
    <Toggle label={label} checked={state.lab.cables[id]} onChange={change} />
  );
}

function TowerController() {
  const { state, set } = useOS();
  const towerId = state.lab.broadcast.selectedTower;
  const tower = state.lab.broadcast.towers[towerId];
  const [muxId, setMuxId] = useState("A");
  const mux = tower.multiplexes[muxId];
  const utvRf = receptionForMux(state, towerId, muxId, "utv");
  const decoderRf = receptionForMux(state, towerId, muxId, "decoder");
  const path = `lab.broadcast.towers.${towerId}`;
  return (
    <div className="dvb-controller">
      <div className="tower-select">
        {Object.entries(TOWER_PLAN).map(([id, plan]) => (
          <button
            className={id === towerId ? "selected" : ""}
            onClick={() => set("lab.broadcast.selectedTower", id)}
            key={id}
          >
            <i />
            {plan.name}
            <small>{plan.site}</small>
          </button>
        ))}
      </div>
      <section>
        <h3>{TOWER_PLAN[towerId].name} transmitter</h3>
        <Toggle
          label="Transmitter ON"
          checked={tower.enabled}
          onChange={(value) => set(`${path}.enabled`, value)}
        />
        <Slider
          label="Overall output"
          value={tower.output}
          onChange={(value) => set(`${path}.output`, value)}
          unit="%"
        />
        <Slider
          label="Tower stability"
          value={tower.stability}
          onChange={(value) => set(`${path}.stability`, value)}
          unit="%"
        />
        <div className="mux-tabs">
          {MUX_IDS.map((id) => (
            <button
              className={muxId === id ? "active" : ""}
              onClick={() => setMuxId(id)}
              key={id}
            >
              MUX {id}
            </button>
          ))}
        </div>
        <div className="mux-controls">
          <Toggle
            label={`MUX ${muxId} transmission`}
            checked={mux.enabled}
            onChange={(value) =>
              set(`${path}.multiplexes.${muxId}.enabled`, value)
            }
          />
          <label>
            Frequency
            <input
              aria-label={`MUX ${muxId} frequency`}
              type="number"
              min="470000"
              max="790000"
              step="1000"
              value={mux.frequency}
              onChange={(event) =>
                set(
                  `${path}.multiplexes.${muxId}.frequency`,
                  Number(event.target.value),
                )
              }
            />
            <span>kHz</span>
          </label>
          {[
            ["strength", "Configured strength"],
            ["quality", "Configured quality"],
            ["interference", "Interference"],
            ["noise", "Noise"],
            ["multipath", "Multipath"],
            ["fading", "Fading"],
            ["stability", "MUX stability"],
          ].map(([key, label]) => (
            <Slider
              key={key}
              label={label}
              value={mux[key]}
              onChange={(value) =>
                set(`${path}.multiplexes.${muxId}.${key}`, value)
              }
              unit="%"
            />
          ))}
        </div>
      </section>
      <section className="reception-monitor">
        <h3>Effective Reception Monitor</h3>
        <div>
          <b>UTV tuner</b>
          <span>
            Configured {Math.round(utvRf.configuredStrength || 0)} /{" "}
            {Math.round(utvRf.configuredQuality || 0)}%
          </span>
          <span>
            Alignment {Math.round(utvRf.alignment)}% · weather −
            {Math.round(utvRf.weatherPenalty || 0)}%
          </span>
          <strong>
            Effective {Math.round(utvRf.strength)} / {Math.round(utvRf.quality)}
            %
          </strong>
          <em>
            {utvRf.state}
            {utvRf.collision ? " · RF COLLISION" : ""}
          </em>
        </div>
        <div>
          <b>Decoder tuner</b>
          <span>
            Independent ANT input:{" "}
            {state.lab.cables.antennaToDecoder ? "connected" : "disconnected"}
          </span>
          <strong>
            Effective {Math.round(decoderRf.strength)} /{" "}
            {Math.round(decoderRf.quality)}%
          </strong>
          <em>{decoderRf.state}</em>
        </div>
      </section>
    </div>
  );
}

function ChannelController() {
  const { state, set, dispatch } = useOS();
  const services = useMemo(
    () => createBroadcastServices(state.lab.broadcast.fallbackAssignments),
    [state.lab.broadcast.fallbackAssignments],
  );
  const [serviceId, setServiceId] = useState(services[0]?.id);
  const service = services.find((item) => item.id === serviceId) || services[0];
  const override = state.lab.broadcast.serviceOverrides[service.id] || {};
  const effective = { ...service, ...override };
  const update = (patch) =>
    set(`lab.broadcast.serviceOverrides.${service.id}`, {
      ...override,
      ...patch,
    });
  return (
    <div className="service-controller">
      <h3>Individual channel controller</h3>
      <label>
        Service
        <select
          value={service.id}
          onChange={(event) => setServiceId(event.target.value)}
        >
          {MUX_IDS.map((mux) => (
            <optgroup label={`MUX ${mux}`} key={mux}>
              {services
                .filter((item) => item.mux === mux)
                .map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.provider}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <div className="service-facts">
        <b>{service.name}</b>
        <span>MUX {service.mux}</span>
        <span>{effective.free ? "FREE" : "CODED"}</span>
        <span>{override.provider || service.provider}</span>
      </div>
      <Toggle
        label="Service Broadcast"
        checked={override.broadcast !== false}
        onChange={(value) => update({ broadcast: value })}
      />
      <Toggle
        label="Video feed"
        checked={effective.type === "tv" && override.video !== false}
        disabled={effective.type === "radio"}
        onChange={(value) => update({ video: value })}
      />
      <Toggle
        label="Audio feed"
        checked={override.audio !== false}
        onChange={(value) => update({ audio: value })}
      />
      <Toggle
        label="EPG broadcast"
        checked={override.epg !== false}
        onChange={(value) => update({ epg: value })}
      />
      <Toggle
        label="Screen bug"
        checked={override.screenBug !== false}
        onChange={(value) => update({ screenBug: value })}
      />
      <Toggle
        label="Subtitle feed"
        checked={override.subtitles !== false}
        onChange={(value) => update({ subtitles: value })}
      />
      <Toggle
        label="LCN Broadcast"
        checked={override.lcnBroadcast !== false}
        onChange={(value) => update({ lcnBroadcast: value })}
      />
      <label>
        LCN
        <input
          type="number"
          min="1"
          max="999"
          value={override.lcn ?? service.lcn}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (!Number.isInteger(value) || value < 1 || value > 999)
              return dispatch({
                type: "TOAST",
                message: "Invalid LCN · use 1–999",
              });
            update({ lcn: value });
          }}
        />
      </label>
      <label>
        Encryption
        <select
          value={effective.free ? "Free" : "Coded"}
          onChange={(event) =>
            update({
              free: event.target.value === "Free",
              provider:
                event.target.value === "Free"
                  ? "DTT Hungary"
                  : override.provider === "DTT Hungary" || !override.provider
                    ? "Telekom"
                    : override.provider,
            })
          }
        >
          <option>Free</option>
          <option>Coded</option>
        </select>
      </label>
      <label>
        Authorization provider
        <select
          value={
            effective.free
              ? "DTT Hungary"
              : override.provider || service.providers?.[0] || "Telekom"
          }
          disabled={effective.free}
          onChange={(event) => update({ provider: event.target.value })}
        >
          <option>DTT Hungary</option>
          <option>Telekom</option>
          <option>One</option>
          <option>Yettel</option>
        </select>
      </label>
      <label>
        Service type
        <select
          value={effective.type}
          onChange={(event) =>
            update(
              event.target.value === "radio"
                ? { type: "radio", resolution: "Audio", video: false }
                : {
                    type: "tv",
                    resolution:
                      effective.resolution === "Audio"
                        ? "576i"
                        : effective.resolution,
                    video: true,
                  },
            )
          }
        >
          <option value="tv">Television</option>
          <option value="radio">Radio</option>
        </select>
      </label>
      <label>
        Resolution
        <select
          value={override.resolution || service.resolution}
          disabled={effective.type === "radio"}
          onChange={(event) => update({ resolution: event.target.value })}
        >
          <option>Audio</option>
          <option>576i</option>
          <option>576p</option>
          <option>720p</option>
          <option>1080i</option>
          <option>1080p</option>
        </select>
      </label>
      <label>
        Aspect ratio
        <select
          value={override.aspectRatio || "16:9"}
          disabled={effective.type === "radio"}
          onChange={(event) => update({ aspectRatio: event.target.value })}
        >
          <option>16:9</option>
          <option>4:3</option>
        </select>
      </label>
      <label>
        Audio mode
        <select
          value={override.audioMode || "Stereo"}
          onChange={(event) => update({ audioMode: event.target.value })}
        >
          <option>Stereo</option>
          <option>Mono</option>
          <option>Dolby Digital</option>
        </select>
      </label>
      <label>
        Programming
        <select
          value={override.programming || "Normal"}
          onChange={(event) => update({ programming: event.target.value })}
        >
          <option>Normal</option>
          <option>Override A</option>
          <option>Override B</option>
        </select>
      </label>
      <p>
        RF strength and quality remain multiplex properties; service faults do
        not alter the carrier.
      </p>
    </div>
  );
}

function ProviderController() {
  const { state, set } = useOS();
  return (
    <div className="provider-controller">
      {Object.entries(state.lab.broadcast.providers).map(
        ([provider, config]) => (
          <section key={provider}>
            <h3>{provider}</h3>
            <Toggle
              label="Provider service online"
              checked={config.online}
              onChange={(value) =>
                set(`lab.broadcast.providers.${provider}.online`, value)
              }
            />
            <Toggle
              label="Authorization service online"
              checked={config.authorization}
              onChange={(value) =>
                set(`lab.broadcast.providers.${provider}.authorization`, value)
              }
            />
            <p>
              Authorization does not alter RF reception or service discovery.
            </p>
          </section>
        ),
      )}
    </div>
  );
}

function DVDController() {
  const { state, set } = useOS();
  const dvd = state.lab.dvd;
  return (
    <div className="controller-columns">
      <section>
        <h3>DISC / OPTICAL</h3>
        <Toggle
          label="Disc present"
          checked={Boolean(dvd.disc)}
          onChange={(value) => {
            set("lab.dvd.disc", value ? dvd.availableDiscs[0] : null);
            set("lab.dvd.playing", false);
            set(
              "lab.dvd.state",
              value
                ? dvd.tray === "open"
                  ? "DISC IN TRAY"
                  : "DVD MENU"
                : dvd.tray === "open"
                  ? "OPEN"
                  : "NO DISC",
            );
          }}
        />
        <Slider
          label="Laser health / power"
          value={dvd.laserHealth}
          onChange={(value) => set("lab.dvd.laserHealth", value)}
          unit="%"
        />
        <Slider
          label="Tracking stability"
          value={dvd.trackingStability}
          onChange={(value) => set("lab.dvd.trackingStability", value)}
          unit="%"
        />
        <Slider
          label="Focus stability"
          value={dvd.focusStability}
          onChange={(value) => set("lab.dvd.focusStability", value)}
          unit="%"
        />
      </section>
      <section>
        <h3>TRAY / OUTPUT</h3>
        <Toggle
          label="Forced tray jam"
          checked={dvd.trayJammed}
          onChange={(value) => set("lab.dvd.trayJammed", value)}
        />
        <Toggle
          label="HDMI output"
          checked={dvd.hdmiEnabled}
          onChange={(value) => set("lab.dvd.hdmiEnabled", value)}
        />
        <Toggle
          label="SCART output"
          checked={dvd.scartEnabled}
          onChange={(value) => set("lab.dvd.scartEnabled", value)}
        />
        <Toggle
          label="Composite output"
          checked={dvd.compositeEnabled}
          onChange={(value) => set("lab.dvd.compositeEnabled", value)}
        />
        <Toggle
          label="Audio output"
          checked={dvd.audioEnabled}
          onChange={(value) => set("lab.dvd.audioEnabled", value)}
        />
        <Button
          onClick={() => {
            set("lab.dvd.outputFault", null);
            set("lab.dvd.trayJammed", false);
            set("lab.dvd.laserHealth", 100);
            set("lab.dvd.trackingStability", 100);
            set("lab.dvd.focusStability", 100);
          }}
        >
          Reset DVD faults
        </Button>
      </section>
    </div>
  );
}

export function UTVController() {
  const { state, set, dispatch } = useOS();
  const [section, setSection] = useState("DVB-T2 Super Controller");
  return (
    <div className="utv-controller">
      <nav>
        {sections.map((name) => (
          <button
            className={section === name ? "active" : ""}
            onClick={() => setSection(name)}
            key={name}
          >
            {name}
          </button>
        ))}
      </nav>
      {section === "TV Hardware" && (
        <div className="controller-columns">
          <section>
            <h3>Power / panel</h3>
            <label>
              Power state
              <select
                value={state.lab.utv.power}
                onChange={(event) => set("lab.utv.power", event.target.value)}
              >
                <option>on</option>
                <option>standby</option>
                <option>off</option>
              </select>
            </label>
            <Toggle
              label="Panel"
              checked={state.lab.utv.panelEnabled}
              onChange={(value) => set("lab.utv.panelEnabled", value)}
            />
            <Toggle
              label="Backlight"
              checked={state.lab.utv.backlightEnabled}
              onChange={(value) => set("lab.utv.backlightEnabled", value)}
            />
            <Slider
              label="Panel health"
              value={state.lab.utv.panelHealth}
              onChange={(value) => set("lab.utv.panelHealth", value)}
              unit="%"
            />
            <Slider
              label="Refresh stability"
              value={state.lab.utv.refreshStability}
              onChange={(value) => set("lab.utv.refreshStability", value)}
              unit="%"
            />
          </section>
          <section>
            <h3>Audio</h3>
            <Toggle
              label="Speakers"
              checked={state.lab.utv.speakers}
              onChange={(value) => set("lab.utv.speakers", value)}
            />
            <Slider
              label="Speaker health"
              value={state.lab.utv.speakerHealth}
              onChange={(value) => set("lab.utv.speakerHealth", value)}
              unit="%"
            />
            <Button
              onClick={() => {
                set("lab.utv.power", "off");
                setTimeout(() => set("lab.utv.power", "on"), 350);
              }}
            >
              Restart
            </Button>
            <Button onClick={() => set("lab.utv.power", "off")}>
              Force Power Off
            </Button>
          </section>
        </div>
      )}
      {section === "Inputs & Connections" && (
        <div className="controller-columns">
          <section>
            <Connection id="antennaToUtv" label="UTV ANT IN" />
            <Connection id="antennaToDecoder" label="Decoder ANT IN" />
            <Connection id="dvdHdmiToUtv1" label="HDMI 1 · DVD" />
            <Connection id="decoderHdmiToUtv2" label="HDMI 2 · Decoder" />
            <Connection id="decoderScartToUtv" label="SCART · Decoder" />
            <Connection id="dvdScartToUtv" label="SCART · DVD" />
            <Connection id="dvdCompositeToUtv" label="AV video · DVD" />
            <Connection id="dvdAudioToUtv" label="AV audio · DVD" />
            <Connection id="ethernetToUtv" label="Ethernet" />
            <Connection id="utvPower" label="UTV power cable" />
            <Connection id="decoderPower" label="Decoder power cable" />
            <Connection id="dvdPower" label="DVD power cable" />
          </section>
          <section>
            {[1, 2].map((port) => (
              <div key={port}>
                <h3>HDMI {port}</h3>
                <Toggle
                  label="Port enabled"
                  checked={state.lab.utv.hdmi[port].enabled}
                  onChange={(value) =>
                    set(`lab.utv.hdmi.${port}.enabled`, value)
                  }
                />
                <Toggle
                  label="Signal detection fault"
                  checked={state.lab.utv.hdmi[port].detectionFault}
                  onChange={(value) =>
                    set(`lab.utv.hdmi.${port}.detectionFault`, value)
                  }
                />
                <Toggle
                  label="Video fault"
                  checked={state.lab.utv.hdmi[port].videoFault}
                  onChange={(value) =>
                    set(`lab.utv.hdmi.${port}.videoFault`, value)
                  }
                />
                <Toggle
                  label="Audio fault"
                  checked={state.lab.utv.hdmi[port].audioFault}
                  onChange={(value) =>
                    set(`lab.utv.hdmi.${port}.audioFault`, value)
                  }
                />
              </div>
            ))}
          </section>
        </div>
      )}
      {section === "Antenna & Reception" && (
        <div className="antenna-controller">
          <h3>
            {ANTENNAS[state.lab.antenna.selected]?.name ||
              "No antenna selected"}
          </h3>
          <Slider
            label="Antenna Position"
            value={state.lab.antenna.position}
            onChange={(value) => set("lab.antenna.position", value)}
          />
          <div className="antenna-map">
            <i style={{ left: `${state.lab.antenna.position}%` }}>⌁</i>
            {Object.entries(TOWER_PLAN).map(([id, tower]) => (
              <span
                className={
                  id === state.lab.broadcast.selectedTower ? "editing" : ""
                }
                style={{ left: `${tower.position}%` }}
                key={id}
              >
                {tower.name}
              </span>
            ))}
          </div>
          <p>
            Green/red tower selection controls editing only. Reception follows
            RF strength, frequency and antenna alignment.
          </p>
        </div>
      )}
      {section === "DVB-T2 Super Controller" && <TowerController />}
      {section === "Weather" && (
        <div>
          <label>
            Weather
            <select
              value={state.lab.broadcast.weather}
              onChange={(event) =>
                set("lab.broadcast.weather", event.target.value)
              }
            >
              {["Clear", "Cloudy", "Rain", "Heavy Rain", "Storm"].map(
                (name) => (
                  <option key={name}>{name}</option>
                ),
              )}
            </select>
          </label>
          <Slider
            label="Weather severity"
            value={state.lab.broadcast.weatherSeverity}
            onChange={(value) => set("lab.broadcast.weatherSeverity", value)}
            unit="%"
          />
          <p>
            This single weather state feeds UTV Live TV, Decoder, diagnostics
            and all scans.
          </p>
        </div>
      )}
      {section === "Channels & Programming" && (
        <div className="controller-columns">
          <ChannelController />
          <ProviderController />
        </div>
      )}
      {section === "Network" && (
        <div>
          <p>
            TP-Link B440 remains visible. Antoid 1 hotspot visibility follows
            the phone’s actual power and hotspot state.
          </p>
          <Button onClick={() => set("lab.utv.wifi.connected", null)}>
            Disconnect UTV Wi-Fi
          </Button>
        </div>
      )}
      {section === "Decoder Box Controller" && (
        <div className="controller-columns">
          <section>
            <h3>Decoder hardware</h3>
            <label>
              Power
              <select
                value={state.lab.decoder.power}
                onChange={(event) =>
                  set("lab.decoder.power", event.target.value)
                }
              >
                <option>on</option>
                <option>off</option>
              </select>
            </label>
            <Toggle
              label="Tuner"
              checked={state.lab.decoder.tunerEnabled}
              onChange={(value) => set("lab.decoder.tunerEnabled", value)}
            />
            <Toggle
              label="Card reader"
              checked={state.lab.decoder.cardReaderEnabled}
              onChange={(value) => set("lab.decoder.cardReaderEnabled", value)}
            />
            <Toggle
              label="Inserted card valid"
              checked={state.lab.decoder.cardValid}
              onChange={(value) => set("lab.decoder.cardValid", value)}
            />
            <Toggle
              label="HDMI output"
              checked={state.lab.decoder.hdmiEnabled}
              onChange={(value) => set("lab.decoder.hdmiEnabled", value)}
            />
            <Toggle
              label="SCART output"
              checked={state.lab.decoder.scartEnabled}
              onChange={(value) => set("lab.decoder.scartEnabled", value)}
            />
          </section>
          <section>
            <h3>Authorization / database</h3>
            <label>
              Inserted card
              <select
                value={state.lab.decoder.card || ""}
                onChange={(event) =>
                  set("lab.decoder.card", event.target.value || null)
                }
              >
                <option value="">No card</option>
                <option>Telekom</option>
                <option>One</option>
                <option>Yettel</option>
              </select>
            </label>
            <label>
              Parental PIN
              <input
                value={state.lab.decoder.parentalPin}
                maxLength="4"
                onChange={(event) =>
                  set(
                    "lab.decoder.parentalPin",
                    event.target.value.replace(/\D/g, "").slice(0, 4),
                  )
                }
              />
            </label>
            <Button
              disabled={state.lab.decoder.scan.status === "scanning"}
              onClick={() =>
                dispatch({ type: "LAB_AUTO_SCAN", device: "decoder" })
              }
            >
              Run Decoder Automatic Scan
            </Button>
            <p>
              {state.lab.decoder.storedChannels.length} stored services · free
              and coded retained.
            </p>
            <h3>Firmware / recovery simulation</h3>
            <label>
              Update fault
              <select
                value={state.lab.decoder.firmware.fault}
                onChange={(event) =>
                  set("lab.decoder.firmware.fault", event.target.value)
                }
              >
                <option value="none">No fault</option>
                <option value="server">Update server unavailable</option>
                <option value="corrupt">Corrupted download</option>
                <option value="verification">Verification failure</option>
                <option value="interrupted">Interrupted update</option>
                <option value="boot">Boot failure</option>
              </select>
            </label>
            <Button
              disabled={
                [
                  "checking",
                  "downloading",
                  "verifying",
                  "installing",
                  "restarting",
                ].includes(state.lab.decoder.firmware.status) ||
                state.lab.decoder.power !== "on" ||
                !state.lab.cables.decoderPower
              }
              onClick={() => dispatch({ type: "DECODER_UPDATE_START" })}
            >
              Start Decoder Update
            </Button>
            <Button onClick={() => set("lab.decoder.page", "recovery")}>
              Force Recovery Mode
            </Button>
          </section>
        </div>
      )}
      {section === "DVD Player Controller" && <DVDController />}
      {section === "Fault Testing" && (
        <div className="fault-grid">
          <Button onClick={() => set("lab.utv.panelEnabled", false)}>
            Kill TV panel
          </Button>
          <Button onClick={() => set("lab.utv.speakers", false)}>
            Kill TV audio
          </Button>
          <Button onClick={() => set("lab.decoder.outputFault", "HDMI")}>
            Kill Decoder HDMI
          </Button>
          <Button onClick={() => set("lab.dvd.outputFault", "HDMI")}>
            Kill DVD HDMI
          </Button>
          <Button onClick={() => set("lab.dvd.audioEnabled", false)}>
            Kill DVD audio
          </Button>
          <Button
            onClick={() => {
              set("lab.utv.panelEnabled", true);
              set("lab.utv.speakers", true);
              set("lab.decoder.outputFault", null);
              set("lab.dvd.outputFault", null);
              set("lab.dvd.audioEnabled", true);
            }}
          >
            Reset output faults
          </Button>
        </div>
      )}
    </div>
  );
}
