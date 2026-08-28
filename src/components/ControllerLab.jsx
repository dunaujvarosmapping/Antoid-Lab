import React from "react";
import { CARRIERS, useOS } from "../state/OSContext.jsx";
import {
  DATA_PLAN_MB,
  NETWORK_MODES,
  OPERATION_CONDITIONS,
  RADIO_CHOICES,
  RADIO_TYPES,
  TOWERS,
  VOICE_PLAN_MINUTES,
  WEATHER_MODES,
  lineQuality,
  voiceBearer,
} from "../services/core.js";
import { Button, SignalBars, Toggle } from "./UI.jsx";
import { HardwareLab } from "./HardwareLab.jsx";
import { calculateFMReception, formatFMFrequency } from "../services/fm.js";
import { batteryModel, formatRuntime } from "../services/battery.js";

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
const floors = ["+3", "+2", "+1", "Ground", "-1", "-2", "-3"];
const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));

export function ControllerLab() {
  const { state, set, dispatch } = useOS();
  const lab = state.networkLab;
  const installed = ["physical", "esim"].filter(
    (key) => state.sim[key].installed,
  );
  const slot = installed.includes(lab.selectedSlot)
    ? lab.selectedSlot
    : installed[0] || "physical";
  const line = state.sim[slot];
  const quality = lineQuality(state, slot);
  const voice = voiceBearer(state, slot);
  const plan = lab.plans[slot];
  const allowance = DATA_PLAN_MB[plan.name];
  const voiceAllowance = VOICE_PLAN_MINUTES[plan.voicePlan];
  const dataPercent = Number.isFinite(allowance)
    ? Math.min(100, (plan.usedMB / allowance) * 100)
    : 0;
  const voicePercent = Number.isFinite(voiceAllowance)
    ? Math.min(100, (plan.usedMinutes / voiceAllowance) * 100)
    : 0;
  const setPlanUsage = (amount) =>
    set(
      `networkLab.plans.${slot}.usedMB`,
      clamp(amount, 0, Number.isFinite(allowance) ? allowance : 1024 * 1024),
    );

  return (
    <aside className="network-panel controller-lab desk-panel">
      <header>
        <span>LIVE</span>
        <div>
          <b>Controller Lab</b>
          <small>
            Authoritative hardware, radio, environment & battery controls
          </small>
        </div>
      </header>
      <div
        className="lab-modules"
        role="tablist"
        aria-label="Controller Lab module"
      >
        {modules.map((name) => (
          <button
            role="tab"
            aria-selected={lab.module === name}
            className={lab.module === name ? "active" : ""}
            onClick={() => set("networkLab.module", name)}
            key={name}
          >
            {name}
          </button>
        ))}
      </div>
      {!["Phone Disassembly", "RS Controller"].includes(lab.module) && (
        <label>
          Control line
          <select
            value={slot}
            disabled={!installed.length}
            onChange={(e) => set("networkLab.selectedSlot", e.target.value)}
          >
            {installed.length ? (
              installed.map((key) => (
                <option value={key} key={key}>
                  {state.sim[key].label} ·{" "}
                  {CARRIERS[state.sim[key].carrier].name}
                </option>
              ))
            ) : (
              <option>No installed line</option>
            )}
          </select>
        </label>
      )}
      {!["Phone Disassembly", "RS Controller"].includes(lab.module) && (
        <div className="lab-summary">
          <b>{quality.networkType}</b>
          <span>{quality.bars}/4 bars</span>
          <span>{Math.round(quality.dbm)} dBm</span>
          <span>{quality.tower?.id || "—"}</span>
          <span>{quality.condition}</span>
        </div>
      )}

      {lab.module === "Phone Disassembly" && <HardwareLab />}

      {lab.module === "RS Controller" &&
        (() => {
          const reception = calculateFMReception(state);
          return (
            <div className="rs-controller">
              <header className="rs-title">
                <div>
                  <b>Radio Signal Controller</b>
                  <span>Authoritative simulated FM broadcast environment</span>
                </div>
                <strong>{formatFMFrequency(state.fm.frequency)}</strong>
              </header>
              <div className="rs-station-tabs">
                {state.fm.transmitters.map((item) => (
                  <button
                    className={
                      state.fm.controllerSelected === item.id ? "active" : ""
                    }
                    onClick={() => set("fm.controllerSelected", item.id)}
                    key={item.id}
                  >
                    <b>{item.station}</b>
                    <span>{formatFMFrequency(item.frequency)}</span>
                  </button>
                ))}
              </div>
              {state.fm.transmitters.map((item, index) =>
                item.id === state.fm.controllerSelected ? (
                  <section className="rs-transmitter" key={item.id}>
                    <div className="rs-transmitter-head">
                      <div>
                        <small>TRANSMITTER {index + 1}</small>
                        <h3>{item.station}</h3>
                        <span>{item.location}</span>
                      </div>
                      <Toggle
                        label="On air"
                        checked={item.enabled}
                        onChange={(value) =>
                          set(`fm.transmitters.${index}.enabled`, value)
                        }
                      />
                    </div>
                    <label>
                      Frequency (MHz)
                      <input
                        type="number"
                        min="87.5"
                        max="108"
                        step="0.1"
                        value={item.frequency}
                        onChange={(event) =>
                          set(
                            `fm.transmitters.${index}.frequency`,
                            clamp(event.target.value, 87.5, 108),
                          )
                        }
                      />
                    </label>
                    {[
                      ["Signal strength", "strength"],
                      ["Interference", "interference"],
                      ["Noise", "noise"],
                      ["Transmission quality", "quality"],
                      ["Stability", "stability"],
                      ["Fading", "fading"],
                      ["Multipath / distortion", "multipath"],
                    ].map(([label, field]) => (
                      <label className="lab-slider" key={field}>
                        {label} <b>{item[field]}%</b>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={item[field]}
                          onChange={(event) =>
                            set(
                              `fm.transmitters.${index}.${field}`,
                              +event.target.value,
                            )
                          }
                        />
                      </label>
                    ))}
                    <div className="rs-switches">
                      <Toggle
                        label="Stereo available"
                        checked={item.stereo}
                        onChange={(value) =>
                          set(`fm.transmitters.${index}.stereo`, value)
                        }
                      />
                      <Toggle
                        label="RDS"
                        checked={item.rds}
                        onChange={(value) =>
                          set(`fm.transmitters.${index}.rds`, value)
                        }
                      />
                      <Toggle
                        label="Audio / modulation"
                        checked={item.modulation}
                        onChange={(value) =>
                          set(`fm.transmitters.${index}.modulation`, value)
                        }
                      />
                    </div>
                    <label>
                      RDS station name
                      <input
                        type="text"
                        value={item.rdsName}
                        onChange={(event) =>
                          set(
                            `fm.transmitters.${index}.rdsName`,
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label>
                      RDS RadioText
                      <textarea
                        value={item.radioText}
                        onChange={(event) =>
                          set(
                            `fm.transmitters.${index}.radioText`,
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </section>
                ) : null,
              )}
              <section className="rs-live-reception">
                <header>
                  <b>Antoid 1 FM Receiver</b>
                  <span>LIVE RECEPTION</span>
                </header>
                <dl>
                  <dt>Tuned</dt>
                  <dd>{formatFMFrequency(reception.frequency)}</dd>
                  <dt>Station</dt>
                  <dd>{reception.transmitter?.station || "None"}</dd>
                  <dt>Transmitter</dt>
                  <dd>
                    {reception.transmitter?.location || "No usable carrier"}
                  </dd>
                  <dt>Raw RF</dt>
                  <dd>{Math.round(reception.rawRF)}%</dd>
                  <dt>Interference</dt>
                  <dd>{Math.round(reception.interference)}%</dd>
                  <dt>Antenna</dt>
                  <dd>{reception.antenna.actual}</dd>
                  <dt>Antenna effectiveness</dt>
                  <dd>{Math.round(reception.antenna.effectiveness)}%</dd>
                  <dt>Tuner condition</dt>
                  <dd>{Math.round(reception.tunerCondition)}%</dd>
                  <dt>Final reception</dt>
                  <dd>{Math.round(reception.finalReception)}%</dd>
                  <dt>Mode</dt>
                  <dd>{reception.mode}</dd>
                  <dt>RDS</dt>
                  <dd>{reception.rds}</dd>
                </dl>
                {reception.collision && (
                  <strong className="rs-collision">
                    EXACT FREQUENCY COLLISION · {reception.collisionCount}{" "}
                    transmitters
                  </strong>
                )}
              </section>
            </div>
          );
        })()}

      {lab.module === "Radio" && (
        <div className="lab-module-panel">
          <label>
            Requested radio
            <select
              value={line.radioSelection || "Automatic"}
              onChange={(e) => {
                set(`sim.${slot}.radioSelection`, e.target.value);
                set(`sim.${slot}.network`, e.target.value);
              }}
            >
              {RADIO_CHOICES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Network mode
            <select
              value={line.networkMode || "Automatic"}
              onChange={(e) => set(`sim.${slot}.networkMode`, e.target.value)}
            >
              {NETWORK_MODES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="signal-control">
            <button
              onClick={() =>
                set(`sim.${slot}.bars`, Math.max(0, line.bars - 1))
              }
            >
              −<span>Signal</span>
            </button>
            <div>
              <SignalBars bars={quality.bars} />
              <b>{quality.bars} / 4</b>
              <small>
                RSRP {quality.rsrp} · RSRQ {quality.rsrq} · SINR {quality.sinr}
              </small>
            </div>
            <button
              onClick={() =>
                set(`sim.${slot}.bars`, Math.min(4, line.bars + 1))
              }
            >
              +<span>Signal</span>
            </button>
          </div>
          <div className="network-stats">
            <span>
              <b>{quality.networkType}</b>Active RAT
            </span>
            <span>
              <b>{voice.ok ? voice.shortLabel : "Unavailable"}</b>Voice
            </span>
            <span>
              <b>{quality.bandwidth.toFixed(1)} Mbps</b>Downlink
            </span>
            <span>
              <b>{quality.latency} ms</b>Latency
            </span>
          </div>
        </div>
      )}

      {lab.module === "Signal Shield" && (
        <div className="lab-module-panel shield-module">
          <div
            className="signal-shield"
            style={{ "--shield": `${lab.shield}%` }}
          >
            <i>Α</i>
            <span>INTERFERENCE SHIELD</span>
          </div>
          <label className="lab-slider">
            Interference <b>{lab.shield}%</b>
            <input
              type="range"
              min="0"
              max="100"
              value={lab.shield}
              onChange={(e) => set("networkLab.shield", +e.target.value)}
            />
          </label>
          <p>
            Attenuation is applied before the RAT-specific dBm thresholds. Bars
            remain capped at exactly four.
          </p>
        </div>
      )}

      {lab.module === "Network Load" && (
        <div className="lab-module-panel">
          <label>
            Carrier
            <select
              value={lab.loadCarrier}
              onChange={(e) => set("networkLab.loadCarrier", e.target.value)}
            >
              {Object.entries(CARRIERS).map(([id, c]) => (
                <option value={id} key={id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-slider">
            Network load <b>{lab.load[lab.loadCarrier]}%</b>
            <input
              type="range"
              min="0"
              max="100"
              value={lab.load[lab.loadCarrier]}
              onChange={(e) =>
                set(`networkLab.load.${lab.loadCarrier}`, +e.target.value)
              }
            />
          </label>
          <p>
            This changes actual throughput, latency, packet loss, downloads and
            internet-call stability.
          </p>
        </div>
      )}

      {lab.module === "Carrier Operations" && (
        <div className="lab-module-panel carrier-operations">
          <label>
            Carrier
            <select
              value={lab.operationCarrier}
              onChange={(e) =>
                set("networkLab.operationCarrier", e.target.value)
              }
            >
              {Object.entries(CARRIERS).map(([id, c]) => (
                <option value={id} key={id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Radio
            <select
              value={lab.operationNetwork}
              onChange={(e) =>
                set("networkLab.operationNetwork", e.target.value)
              }
            >
              <option>All</option>
              {RADIO_TYPES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Condition
            <select
              value={
                lab.operations[lab.operationCarrier]?.[lab.operationNetwork] ||
                "Normal"
              }
              onChange={(e) =>
                set(
                  `networkLab.operations.${lab.operationCarrier}.${lab.operationNetwork}`,
                  e.target.value,
                )
              }
            >
              {OPERATION_CONDITIONS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <Button
            onClick={() =>
              set(
                `networkLab.operations.${lab.operationCarrier}.${lab.operationNetwork}`,
                "Normal",
              )
            }
          >
            Reset selected network
          </Button>
          <Button
            onClick={() =>
              set(
                "networkLab.operations",
                Object.fromEntries(
                  Object.keys(CARRIERS).map((carrierId) => [
                    carrierId,
                    Object.fromEntries(
                      ["All", ...RADIO_TYPES].map((rat) => [rat, "Normal"]),
                    ),
                  ]),
                ),
              )
            }
          >
            Restore all carriers
          </Button>
          <p>
            Data and voice outages are independent; the modem will try an
            eligible lower RAT.
          </p>
        </div>
      )}

      {lab.module === "Cell Handover" && (
        <div className="lab-module-panel handover-module">
          <Toggle
            label="Automatic handover"
            checked={lab.handover.auto}
            onChange={(v) => set("networkLab.handover.auto", v)}
          />
          {!lab.handover.auto && (
            <label>
              Manual serving tower
              <select
                value={lab.handover.serving[slot]}
                onChange={(e) =>
                  set(`networkLab.handover.serving.${slot}`, e.target.value)
                }
              >
                {Object.values(TOWERS).map((tower) => (
                  <option value={tower.id} key={tower.id}>
                    {tower.id} · {tower.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="cell-map">
            <i
              className="phone-pin"
              style={{ left: `${lab.handover.position}%` }}
            >
              ▣
            </i>
            {Object.values(TOWERS).map((tower) => {
              const cell = quality.candidates.find(
                (item) => item.id === tower.id,
              );
              return (
                <span
                  className={`${quality.tower?.id === tower.id ? "active" : ""} bars-${cell?.bars || 0}`}
                  style={{ left: `${tower.position}%` }}
                  title={`${tower.name} · ${cell?.dbm || -160} dBm · ${cell?.bars || 0}/4`}
                  key={tower.id}
                >
                  ⌁<b>{tower.id}</b>
                  <small>{cell?.bars || 0}/4</small>
                </span>
              );
            })}
            <em
              className={
                quality.candidates.every((item) => !item.usable)
                  ? "dead active"
                  : "dead"
              }
            >
              DEAD ZONE
            </em>
          </div>
          <label className="lab-slider">
            Phone position <b>{lab.handover.position}%</b>
            <input
              type="range"
              min="0"
              max="100"
              value={lab.handover.position}
              onChange={(e) =>
                set("networkLab.handover.position", +e.target.value)
              }
            />
          </label>
          <div className="tower-editor">
            {Object.values(TOWERS).map((tower) => {
              const cfg = lab.towers[tower.id];
              const candidate = quality.candidates?.find(
                (x) => x.id === tower.id,
              );
              return (
                <section key={tower.id}>
                  <b>
                    {tower.id} · {tower.name}
                  </b>
                  <small>
                    {tower.rats.join(" / ")} ·{" "}
                    {candidate ? `${candidate.dbm} dBm` : "not eligible"}
                  </small>
                  <label>
                    Distance {cfg.distance} km
                    <input
                      type="range"
                      min="0"
                      max="80"
                      value={cfg.distance}
                      onChange={(e) =>
                        set(
                          `networkLab.towers.${tower.id}.distance`,
                          +e.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    Strength {cfg.strength}%
                    <input
                      type="range"
                      min="0"
                      max="150"
                      value={cfg.strength}
                      onChange={(e) =>
                        set(
                          `networkLab.towers.${tower.id}.strength`,
                          +e.target.value,
                        )
                      }
                    />
                  </label>
                  <label>
                    dBm
                    <select
                      value={cfg.dbmMode}
                      onChange={(e) =>
                        set(
                          `networkLab.towers.${tower.id}.dbmMode`,
                          e.target.value,
                        )
                      }
                    >
                      <option>Auto</option>
                      <option>Manual</option>
                    </select>
                    {cfg.dbmMode === "Manual" && (
                      <input
                        aria-label={`${tower.id} manual dBm`}
                        type="number"
                        min="-125"
                        max="-55"
                        value={cfg.manualDbm}
                        onChange={(e) =>
                          set(
                            `networkLab.towers.${tower.id}.manualDbm`,
                            +e.target.value,
                          )
                        }
                      />
                    )}
                  </label>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {lab.module === "Weather" && (
        <div className="lab-module-panel weather-module">
          <label>
            Environment
            <select
              value={lab.weather.mode}
              onChange={(e) => set("networkLab.weather.mode", e.target.value)}
            >
              {WEATHER_MODES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          {lab.weather.mode === "Heavy Storm" && (
            <label className="lab-slider">
              Storm severity <b>×{lab.weather.stormMultiplier}</b>
              <input
                type="range"
                min="1"
                max="5"
                value={lab.weather.stormMultiplier}
                onChange={(e) =>
                  set("networkLab.weather.stormMultiplier", +e.target.value)
                }
              />
            </label>
          )}
          {lab.weather.mode === "Building/Underground" && (
            <label>
              Floor
              <select
                value={lab.weather.floor}
                onChange={(e) =>
                  set("networkLab.weather.floor", e.target.value)
                }
              >
                {floors.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          )}
          <div
            className={`weather-visual weather-${lab.weather.mode.toLowerCase().replaceAll(" ", "-")}`}
          >
            <b>{lab.weather.mode}</b>
            <span>
              {lab.weather.mode === "Building/Underground"
                ? `Floor ${lab.weather.floor}`
                : "Live radio attenuation"}
            </span>
          </div>
          {lab.weather.floor === "-3" &&
            lab.weather.mode === "Building/Underground" && (
              <strong className="data-limit">
                Hard dead zone · no cellular service
              </strong>
            )}
        </div>
      )}

      {lab.module === "Plan & Usage" && (
        <div className="lab-module-panel data-plan-module">
          <label>
            Data plan
            <select
              value={plan.name}
              onChange={(e) =>
                set(`networkLab.plans.${slot}.name`, e.target.value)
              }
            >
              {Object.keys(DATA_PLAN_MB).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="plan-meter">
            <i style={{ width: `${dataPercent}%` }} />
          </div>
          <b>
            {(Number(plan.usedMB) || 0).toFixed(1)} MB used ·{" "}
            {Number.isFinite(allowance)
              ? `${Math.max(0, allowance - plan.usedMB).toFixed(1)} MB left`
              : "Unlimited"}
          </b>
          <label className="lab-slider">
            Manual usage
            <input
              type="range"
              min="0"
              max={Number.isFinite(allowance) ? allowance : 51200}
              value={Math.min(
                plan.usedMB,
                Number.isFinite(allowance) ? allowance : 51200,
              )}
              onChange={(e) => setPlanUsage(+e.target.value)}
            />
          </label>
          <label>
            Exact usage
            <span className="inline-fields">
              <input
                type="number"
                min="0"
                step="0.1"
                value={
                  (plan.usageUnit || "MB") === "GB"
                    ? +((Number(plan.usedMB) || 0) / 1024).toFixed(3)
                    : +(Number(plan.usedMB) || 0).toFixed(1)
                }
                onChange={(e) =>
                  setPlanUsage(
                    +e.target.value *
                      ((plan.usageUnit || "MB") === "GB" ? 1024 : 1),
                  )
                }
              />
              <select
                value={plan.usageUnit || "MB"}
                onChange={(e) =>
                  set(`networkLab.plans.${slot}.usageUnit`, e.target.value)
                }
              >
                <option>MB</option>
                <option>GB</option>
              </select>
            </span>
          </label>
          <div className="lab-actions">
            <Button onClick={() => setPlanUsage(plan.usedMB + 100)}>
              +100 MB
            </Button>
            <Button onClick={() => setPlanUsage(plan.usedMB + 500)}>
              +500 MB
            </Button>
            <Button onClick={() => setPlanUsage(plan.usedMB + 1024)}>
              +1 GB
            </Button>
            <Button
              onClick={() =>
                setPlanUsage(Number.isFinite(allowance) ? allowance : 51200)
              }
            >
              Exhaust
            </Button>
            <Button onClick={() => setPlanUsage(0)}>Reset data</Button>
            <Button
              onClick={() => {
                setPlanUsage(0);
                set(`networkLab.plans.${slot}.usedMinutes`, 0);
                set(
                  `networkLab.plans.${slot}.cycleStart`,
                  new Date().toISOString().slice(0, 10),
                );
              }}
            >
              New billing cycle
            </Button>
          </div>
          <label>
            Voice plan
            <select
              value={plan.voicePlan}
              onChange={(e) =>
                set(`networkLab.plans.${slot}.voicePlan`, e.target.value)
              }
            >
              {Object.keys(VOICE_PLAN_MINUTES).map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <div className="plan-meter voice">
            <i style={{ width: `${voicePercent}%` }} />
          </div>
          <b>
            {(Number(plan.usedMinutes) || 0).toFixed(1)} min used ·{" "}
            {Number.isFinite(voiceAllowance)
              ? `${Math.max(0, voiceAllowance - plan.usedMinutes).toFixed(1)} min left`
              : "Unlimited"}
          </b>
          <div className="lab-actions">
            <Button
              onClick={() =>
                set(
                  `networkLab.plans.${slot}.usedMinutes`,
                  plan.usedMinutes + 10,
                )
              }
            >
              +10 min
            </Button>
            <Button
              onClick={() =>
                set(
                  `networkLab.plans.${slot}.usedMinutes`,
                  Number.isFinite(voiceAllowance) ? voiceAllowance : 1000,
                )
              }
            >
              Exhaust
            </Button>
            <Button
              onClick={() => set(`networkLab.plans.${slot}.usedMinutes`, 0)}
            >
              Reset voice
            </Button>
          </div>
          <Toggle
            label="Automatically switch mobile data"
            checked={lab.autoSwitchData}
            onChange={(v) => set("networkLab.autoSwitchData", v)}
          />
        </div>
      )}

      {lab.module === "Battery" && (
        <div className="lab-module-panel">
          {(() => {
            const model = batteryModel(state);
            return (
              <div
                className={`battery-model-summary thermal-${model.thermal.severity}`}
              >
                <b>{model.effectiveCapacityMah.toFixed(0)} mAh effective</b>
                <span>
                  {model.designCapacityMah.toFixed(0)} mAh design ·{" "}
                  {model.health.toFixed(1)}% health
                </span>
                <span>
                  {formatRuntime(model.estimatedRuntimeMinutes)} ·{" "}
                  {model.thermal.state}
                </span>
                <span>Performance limit {model.thermal.performanceLimit}%</span>
              </div>
            );
          })()}
          <label className="lab-slider">
            Charge level <b>{Math.floor(state.battery.level)}%</b>
            <input
              type="range"
              min="0"
              max="100"
              value={state.battery.level}
              onChange={(e) => set("battery.level", +e.target.value)}
            />
          </label>
          <label className="lab-slider">
            Battery health <b>{Number(state.battery.health).toFixed(1)}%</b>
            <input
              type="range"
              min="20"
              max="100"
              value={state.battery.health}
              onChange={(e) => set("battery.health", +e.target.value)}
            />
          </label>
          <label>
            Temperature control
            <select
              value={state.battery.temperatureMode}
              onChange={(e) => set("battery.temperatureMode", e.target.value)}
            >
              <option>Auto</option>
              <option>Manual</option>
            </select>
          </label>
          {state.battery.temperatureMode === "Manual" && (
            <label className="lab-slider">
              Temperature <b>{state.battery.manualTemperature} °C</b>
              <input
                type="range"
                min="-10"
                max="65"
                value={state.battery.manualTemperature}
                onChange={(e) =>
                  set("battery.manualTemperature", +e.target.value)
                }
              />
            </label>
          )}
          <label>
            Charging speed
            <select
              value={state.battery.chargeMode}
              onChange={(e) => set("battery.chargeMode", e.target.value)}
            >
              <option>Fast</option>
              <option>Normal</option>
              <option>Slow</option>
              <option>Paused</option>
            </select>
          </label>
          <label>
            Charge cycles
            <input
              type="number"
              min="0"
              max="5000"
              value={state.battery.cycles}
              onChange={(e) =>
                set("battery.cycles", Math.max(0, +e.target.value))
              }
            />
          </label>
          <Toggle
            label="Cable connected"
            checked={state.battery.charging}
            onChange={(v) => set("battery.charging", v)}
          />
          <Toggle
            label="Adaptive charging"
            checked={state.battery.adaptiveCharging}
            onChange={(v) => set("battery.adaptiveCharging", v)}
          />
          <Toggle
            label="Protect battery at 80%"
            checked={state.battery.protect80}
            onChange={(v) => set("battery.protect80", v)}
          />
          <Button
            onClick={() => {
              set("battery.chargeTo100", true);
              dispatch({
                type: "TOAST",
                message: "Temporary full charge enabled",
              });
            }}
          >
            Charge to 100% once
          </Button>
          <p>
            {state.battery.chargeLimitedReason ||
              (state.battery.temperature >= 45
                ? "Charging is thermally limited."
                : "Temperature is within the normal operating range.")}{" "}
            · {state.battery.cycles} completed cycles +{" "}
            {Math.round(state.battery.cycleProgress * 100)}% ·{" "}
            {(Number(state.battery.dischargedThroughputMah) || 0).toFixed(0)}{" "}
            mAh discharged lifetime
          </p>
        </div>
      )}
    </aside>
  );
}
