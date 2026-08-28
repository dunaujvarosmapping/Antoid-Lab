import React, { useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import {
  diagnoseHardware,
  hardwareCapabilities,
} from "../services/hardware.js";
import { Button, Header } from "../components/UI.jsx";
import { AnPayCheckout } from "../components/AnPayCheckout.jsx";
import { ANTOID_SYSTEM } from "../config/version.js";

export function MaintenanceApp() {
  const { state, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const results = state.hardware.testResults || diagnoseHardware(state);
  return (
    <div className="maintenance-app app-fill">
      <Header title="Maintenance Mode" subtitle="Personal data is hidden" />
      <div className="maintenance-banner">
        <b>Service workspace</b>
        <span>
          Calls, messages, photos, accounts and third-party apps are unavailable
          while this mode is active.
        </span>
      </div>
      <div className="maintenance-grid app-scroll">
        <section>
          <h3>Device identity</h3>
          <dl>
            <dt>Model</dt>
            <dd>Antoid 1</dd>
            <dt>OS</dt>
            <dd>{ANTOID_SYSTEM.osName} {ANTOID_SYSTEM.version}</dd>
            <dt>Mainboard</dt>
            <dd>{state.hardware.components.mainboard.serial}</dd>
            <dt>Seal status</dt>
            <dd>{caps.sealed ? "Verified" : "Open / service required"}</dd>
          </dl>
        </section>
        <section>
          <h3>Live temperatures</h3>
          <div className="temperature-grid">
            <span>
              <b>{state.hardware.temperatures.battery}°C</b>Battery
            </span>
            <span>
              <b>{state.hardware.temperatures.mainboard}°C</b>Board
            </span>
            <span>
              <b>{state.hardware.temperatures.modem}°C</b>Modem
            </span>
          </div>
        </section>
        <section>
          <h3>Hardware diagnostics</h3>
          {results.map((result) => (
            <article
              className={result.pass ? "pass" : "fail"}
              key={result.name}
            >
              <b>{result.status}</b>
              <span>
                {result.name} · {result.detail}
              </span>
            </article>
          ))}
          <Button onClick={() => dispatch({ type: "HARDWARE_TEST" })}>
            Run hardware test
          </Button>
        </section>
        <section>
          <h3>Exit service workspace</h3>
          <p>
            Restart normally to return to the owner’s lock screen. No personal
            data has been changed.
          </p>
          <Button
            tone="primary"
            onClick={() => {
              dispatch({ type: "MAINTENANCE_MODE", enabled: false });
              dispatch({
                type: "POWER",
                value: { mode: "booting", locked: true },
              });
            }}
          >
            Restart Antoid 1
          </Button>
        </section>
      </div>
    </div>
  );
}

const lampColor = {
  "Low-pressure sodium": "#ff9b18", "High-pressure sodium": "#ffb14a",
  "Mercury vapour": "#b9e8ff", "Metal halide": "#d8efff",
  "Warm LED": "#ffd9a3", "Cool LED": "#eaf7ff",
};
const bulbOptions = Object.keys(lampColor);
const poleOptions = [
  ["Steel utility", "Galvanised steel", 82], ["Aluminum tapered", "Aluminum", 76],
  ["Titanium storm", "Titanium", 118], ["Concrete heritage", "Reinforced concrete", 105],
  ["Budget thin-wall", "Thin steel", 42], ["Decorative cast", "Cast iron", 68],
];
const luminaireOptions = ["Cobrahead Classic", "Roadway Cutoff", "Heritage Lantern", "Slim LED Aero"];
const partToInventory = {
  bulb: "bulbs",
  ballast: "ballasts",
  capacitor: "capacitors",
  ignitor: "ignitors",
  fuse: "fuses",
  cable: "cable",
  photocell: "photocells",
};

export function StreetLightApp() {
  const { state, set, dispatch } = useOS();
  const [section, setSection] = useState("Workshop");
  const game = state.streetlight;
  const pole = game.poles[game.selectedPole - 1];
  const isNight = game.time >= 18 || game.time < 6;
  const repair = (part) => {
    const key = partToInventory[part];
    if (key && game.inventory[key] <= 0)
      return dispatch({
        type: "TOAST",
        message: `No ${key} left in the service van`,
      });
    if (key) set(`streetlight.inventory.${key}`, game.inventory[key] - 1);
    dispatch({
      type: "STREETLIGHT_REPAIR",
      index: game.selectedPole - 1,
      part,
    });
  };
  const replace = (part, value) => dispatch({ type: "STREETLIGHT_REPLACE", index: game.selectedPole - 1, part, value });
  const operational = (item) => game.masterOn && isNight && item.lit && item.condition > 5 && item.breaker && item.connected !== false && item.bulb > 5 && item.cable > 5;
  return (
    <div className="streetlight-app app-fill">
      <Header
        title="Street Light Simulator"
        subtitle="Municipal circuit SL-08 · component authority"
      />
      <div
        className={`street-scene weather-${game.weather.toLowerCase().replaceAll(" ", "-")}`}
        style={{ "--sky-time": game.time }}
      >
        <div className={`sky storm-${game.storm}`}>
          <i className="moon" />
          <div className="clouds" />
          {game.weather.includes("Rain") || game.weather.includes("Storm") ? <div className="street-rain" /> : null}
          {(game.storm >= 3 || game.weather.includes("Storm")) && <div className="street-lightning" />}
        </div>
        <div className="road">
          {game.poles.map((item) => {
            const on = operational(item);
            return (
              <button
                key={item.id}
                className={`lamp-pole ${on ? "on" : "off"} ${game.selectedPole === item.id ? "selected" : ""} ${item.fallen ? "fallen" : ""} ${item.lean ? "leaning" : ""} design-${String(item.poleDesign || "steel").toLowerCase().replaceAll(" ","-")}`}
                style={{ "--lamp": lampColor[item.technology] || "#fff", "--warmup": `${Math.min(1, Number(item.warmup ?? 1))}` }}
                onClick={() => set("streetlight.selectedPole", item.id)}
              >
                <i className="lamp-head">
                  <span />
                </i>
                <i className="pole-stem" />
                <i className="light-cone" />
                <b>{item.id}</b>
                {item.fault && <em>!</em>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="street-console app-scroll">
        <nav className="street-tabs">{["Workshop","Service Van Inventory","Events"].map(item => <button className={section===item?"active":""} onClick={() => setSection(item)} key={item}>{item}</button>)}</nav>
        {section === "Workshop" && <>
        <div className="master-cabinet">
          <button
            className={game.masterOn ? "on" : ""}
            onClick={() => set("streetlight.masterOn", !game.masterOn)}
          >
            <i />
            MASTER {game.masterOn ? "ON" : "OFF"}
          </button>
          <span>400 V three-phase cabinet · photocell schedule</span>
        </div>
        <label>
          Time · {String(game.time).padStart(2, "0")}:00
          <input
            type="range"
            min="0"
            max="23"
            value={game.time}
            onChange={(event) =>
              set("streetlight.time", Number(event.target.value))
            }
          />
        </label>
        <div className="street-controls">
          <label>
            Weather
            <select
              value={game.weather}
              onChange={(event) =>
                set("streetlight.weather", event.target.value)
              }
            >
              <option>Clear</option>
              <option>Rain</option>
              <option>Fog</option><option>Heavy Rain</option><option>Heavy Storm</option>
            </select>
          </label>
          <label>
            Storm severity · {game.storm}
            <input
              type="range"
              min="0"
              max="5"
              value={game.storm}
              onChange={(event) =>
                set("streetlight.storm", Number(event.target.value))
              }
            />
          </label>
        </div>
        <section className="pole-service">
          <header>
            <div>
              <h3>Pole {pole.id}</h3>
              <small>
                {pole.technology} · condition {pole.condition}%
              </small>
            </div>
            <label>
              Technology
              <select value={pole.technology} onChange={(event) => replace("bulb", event.target.value)}>{bulbOptions.map(item => <option key={item}>{item}</option>)}</select>
            </label>
          </header>
          <div className="physical-lamp-service">
            <div className={`service-pole-mini ${pole.connected === false ? "disconnected" : ""}`}><i className="mini-luminaire"><b>{pole.technology}</b></i><span /><em>{pole.poleDesign || "Steel utility"}</em></div>
            <div><b>Physical sequence</b><span>1. Isolate circuit  2. Disconnect cable  3. Remove/mount luminaire  4. Reconnect  5. Test</span></div>
          </div>
          <div className="replacement-workflow">
            <label>Pole design<select value={pole.poleDesign || "Steel utility"} onChange={event => replace("pole", event.target.value)}>{poleOptions.map(([name]) => <option key={name} disabled={!game.dlcPurchased && !["Steel utility","Aluminum tapered"].includes(name)}>{name}</option>)}</select></label>
            <label>Luminaire<select value={pole.luminaire || "Cobrahead Classic"} disabled={pole.connected !== false} onChange={event => replace("luminaire", event.target.value)}>{luminaireOptions.map(item=><option key={item}>{item}</option>)}</select></label>
            <Button onClick={() => set(`streetlight.poles.${game.selectedPole - 1}.connected`, pole.connected === false)}>{pole.connected === false ? "Reconnect luminaire" : "Disconnect luminaire"}</Button>
            <Button onClick={() => set(`streetlight.poles.${game.selectedPole - 1}.breaker`, !pole.breaker)}>{pole.breaker ? "Trip circuit" : "Reset breaker"}</Button>
            <Button onClick={() => dispatch({ type:"STREETLIGHT_TEST", index:game.selectedPole-1 })}>Test lamp</Button>
          </div>
          <div className="lamp-parts">
            {[
              "bulb",
              "ballast",
              "capacitor",
              "ignitor",
              "fuse",
              "cable",
              "photocell",
            ].map((part) => (
              <button key={part} onClick={() => repair(part)}>
                <i style={{ "--part-health": pole[part] ?? 100 }} />
                <b>{part}</b>
                <span>{pole[part] ?? 100}% · replace</span>
              </button>
            ))}
          </div>
          <div className="lab-actions">
            <Button
              onClick={() =>
                dispatch({
                  type: "STREETLIGHT_FAULT",
                  index: game.selectedPole - 1,
                  fault:
                    game.storm >= 4 || game.weather.includes("Storm")
                      ? "Lightning surge: fuse and ballast failure"
                      : "Lamp end-of-life",
                })
              }
            >
              {game.storm >= 4 || game.weather.includes("Storm") ? "Run lightning strike" : "Force lamp fault"}
            </Button>
            <Button onClick={() => repair(null)}>Complete pole overhaul</Button>
          </div>
          {pole.fault && <p className="street-fault">⚡ {pole.fault}</p>}
        </section>
        </>}
        {section === "Service Van Inventory" && <section className="service-van service-van-full">
          <h3>Service van inventory</h3>
          {Object.entries(game.inventory).map(([name, count]) => (
            <span key={name}>
              <b>{count}</b>
              {name}
            </span>
          ))}
          <h4>Bulb stock</h4>{bulbOptions.map(name => <button key={name} onClick={() => replace("bulb",name)}><i style={{background:lampColor[name]}}/><b>{name}</b><span>Fit to pole {pole.id}</span></button>)}
          <h4>Luminaire stock</h4>{luminaireOptions.map(name => <button key={name} disabled={pole.connected !== false} onClick={() => replace("luminaire",name)}><i>⌁</i><b>{name}</b><span>{pole.connected === false ? "Mount now" : "Disconnect cable first"}</span></button>)}
          <h4>Replacement poles</h4>{poleOptions.map(([name,material,quality]) => <button key={name} disabled={!game.dlcPurchased && !["Steel utility","Aluminum tapered"].includes(name)} onClick={() => replace("pole",name)}><i>│</i><b>{name}</b><span>{material} · quality {quality}</span></button>)}
        </section>}
        {section === "Events" && <section>
          <h3>Field event log</h3>
          {game.events.length ? (
            game.events.map((event, index) => (
              <p key={`${event.time}-${index}`}>
                <time>{new Date(event.time).toLocaleTimeString()}</time>{" "}
                {event.message}
              </p>
            ))
          ) : (
            <p>No faults recorded.</p>
          )}
        </section>}
        {!game.dlcPurchased && (
          <section className="dlc-card">
            <b>Aftermarket Section</b>
            <span>
              Additional pole designs and quality tiers for the Service Van Inventory.
            </span>
            <AnPayCheckout amount={70} item="Street Light Simulator · Aftermarket Section" onApproved={() => dispatch({ type: "PURCHASE_STREETLIGHT", dlc: true })} />
          </section>
        )}
      </div>
    </div>
  );
}
