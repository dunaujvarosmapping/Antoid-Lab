import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useOS } from "../state/OSContext.jsx";
import {
  HARDWARE_GROUPS,
  REPLACEMENT_PARTS,
  diagnoseHardware,
  hardwareCapabilities,
} from "../services/hardware.js";
import { Button } from "./UI.jsx";

const fmt = (value) =>
  typeof value === "boolean"
    ? value
      ? "Yes"
      : "No"
    : Array.isArray(value)
      ? value.join(", ")
      : String(value);

function ComponentInspector({ state, dispatch, onRecover }) {
  const part = state.hardware.components[state.hardware.selected];
  if (!part) return null;
  const specs = Object.entries(part).filter(
    ([key]) =>
      ![
        "id",
        "name",
        "group",
        "layer",
        "installed",
        "connected",
        "condition",
        "waterExposure",
        "destroyed",
        "powered",
        "dependsOn",
        "description",
        "keywords",
        "removable",
      ].includes(key),
  );
  return (
    <section className="component-inspector">
      <header>
        <div>
          <b>{part.name}</b>
          <small>
            {part.group} · layer {part.layer}
          </small>
        </div>
        <strong>{part.condition.toFixed(0)}%</strong>
      </header>
      <p className="component-description">{part.description}</p>
      <div className="component-state-grid">
        {[
          ["Installed", part.installed],
          ["Connected", part.connected],
          ["Powered", part.powered],
          ["Destroyed", part.destroyed],
          ["Water", `${part.waterExposure.toFixed(0)}%`],
        ].map(([label, value]) => (
          <span key={label}>
            <b>{fmt(value)}</b>
            {label}
          </span>
        ))}
      </div>
      <label>
        Condition
        <input
          type="range"
          min="0"
          max="100"
          value={part.condition}
          onChange={(event) =>
            dispatch({
              type: "HARDWARE_FIELD",
              id: part.id,
              field: "condition",
              value: Number(event.target.value),
            })
          }
        />
      </label>
      <div className="hw-switches">
        <label>
          <input
            type="checkbox"
            checked={part.connected}
            disabled={!part.installed}
            onChange={(event) =>
              dispatch({
                type: "HARDWARE_FIELD",
                id: part.id,
                field: "connected",
                value: event.target.checked,
              })
            }
          />{" "}
          Connector seated
        </label>
        <label>
          <input
            type="checkbox"
            checked={part.powered}
            disabled={!part.installed}
            onChange={(event) =>
              dispatch({
                type: "HARDWARE_FIELD",
                id: part.id,
                field: "powered",
                value: event.target.checked,
              })
            }
          />{" "}
          Power rail enabled
        </label>
      </div>
      <dl className="component-specs">
        {specs.map(([key, value]) => (
          <React.Fragment key={key}>
            <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
            <dd>{fmt(value)}</dd>
          </React.Fragment>
        ))}
      </dl>
      <div className="lab-actions">
        <Button
          onClick={() => dispatch({ type: "HARDWARE_INSPECT", id: part.id })}
        >
          Inspect
        </Button>
        {part.installed && state.hardware.mode === "Teardown" && (
          <Button
            onClick={() => dispatch({ type: "HARDWARE_REMOVE", id: part.id })}
          >
            Remove
          </Button>
        )}
        {part.destroyed ? (
          <Button onClick={() => onRecover(part.id)}>RECOVER</Button>
        ) : (
          <Button onClick={() => dispatch({ type: "HARDWARE_SMASH", id: part.id })}>
            SMASH
          </Button>
        )}
      </div>
    </section>
  );
}

function Inventory({ state, dispatch }) {
  const [manufacturer, setManufacturer] = useState("All");
  const [query, setQuery] = useState(state.hardware.inventorySearch || "");
  useEffect(() => {
    if (state.hardware.inventorySearch) setQuery(state.hardware.inventorySearch);
  }, [state.hardware.inventorySearch]);
  const searchable = (value) =>
    Object.values(value || {})
      .flatMap((item) => Array.isArray(item) ? item : [item])
      .join(" ")
      .toLowerCase();
  const matches = (part) => {
    const component = state.hardware.components[part.type || part.id] || {};
    return searchable({ ...component, ...part, specs: searchable(part.specs) }).includes(query.trim().toLowerCase());
  };
  const parts = REPLACEMENT_PARTS.filter(
    (part) =>
      (manufacturer === "All" || part.manufacturer === manufacturer) &&
      matches(part),
  );
  const stock = [
    ...state.hardware.inventory.packages,
    ...state.hardware.inventory.removed,
  ].filter(matches);
  return (
    <section className="hw-inventory">
      <h3>Parts bench & inventory</h3>
      <label className="inventory-search">
        Search every part
        <input
          type="search"
          value={query}
          placeholder="Name, category, manufacturer, technology, specification…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label>
        Manufacturer
        <select
          value={manufacturer}
          onChange={(event) => setManufacturer(event.target.value)}
        >
          <option>All</option>
          <option>Genuine</option>
          <option>Supra Electronics</option>
          <option>Extreme Budget</option>
        </select>
      </label>
      <div className="replacement-catalog">
        {parts.map((part) => {
          const index = REPLACEMENT_PARTS.indexOf(part);
          return (
            <article key={`${part.type}-${part.manufacturer}-${part.name}`}>
              <i>▣</i>
              <div>
                <b>{part.name}</b>
                <small>
                  {part.manufacturer} · {part.price.toLocaleString()} HUF
                </small>
                <small>{state.hardware.components[part.type]?.description}</small>
              </div>
              <Button
                onClick={() => dispatch({ type: "HARDWARE_UNBOX_PART", index })}
              >
                Open box
              </Button>
            </article>
          );
        })}
      </div>
      <h4>Available exact parts</h4>
      <div className="inventory-stock">
        {stock.length ? (
          stock.map((item) => (
            <article
              key={item.inventoryId}
              className={state.hardware.recoverType === item.id ? "recover-highlight" : ""}
            >
              <div>
                <b>{item.serviceName || item.name}</b>
                <small>
                  {item.manufacturer} · {item.condition.toFixed(0)}% · S/N{" "}
                  {item.serial}
                </small>
                <small>{item.description}</small>
              </div>
              {state.hardware.mode === "Repair" && !item.destroyed && (
                <Button
                  onClick={() =>
                    dispatch({
                      type: "HARDWARE_INSTALL",
                      inventoryId: item.inventoryId,
                    })
                  }
                >
                  Install
                </Button>
              )}
              {state.hardware.inventory.removed.some(
                (x) => x.inventoryId === item.inventoryId,
              ) && (
                <>
                  {item.destroyed ? (
                    <Button onClick={() => dispatch({ type: "HARDWARE_RECOVER", inventoryId: item.inventoryId })}>
                      RECOVER
                    </Button>
                  ) : (
                    <Button
                      onClick={() => dispatch({ type: "HARDWARE_SMASH_INVENTORY", inventoryId: item.inventoryId })}
                    >
                      SMASH
                    </Button>
                  )}
                  <Button
                    onClick={() =>
                      dispatch({
                        type: "HARDWARE_TRASH",
                        inventoryId: item.inventoryId,
                      })
                    }
                  >
                    Trash
                  </Button>
                </>
              )}
            </article>
          ))
        ) : (
          <p>No loose parts. Remove a component or open a service package.</p>
        )}
      </div>
    </section>
  );
}

export function HardwareLab() {
  const { state, set, dispatch } = useOS();
  const hardware = state.hardware;
  const caps = hardwareCapabilities(state);
  const diagnostics = hardware.testResults || diagnoseHardware(state);
  const [tab, setTab] = useState("Device");
  const failed = useMemo(
    () => diagnostics.filter((result) => !result.pass).length,
    [diagnostics],
  );
  return (
    <div className="hardware-lab">
      {hardware.packageOpening && createPortal((
        <div className={`service-unbox stage-${hardware.packageOpening.stage} package-${String(REPLACEMENT_PARTS[hardware.packageOpening.index]?.manufacturer || "genuine").toLowerCase().replaceAll(" ", "-")}`}>
          <div className="service-package"><i>{REPLACEMENT_PARTS[hardware.packageOpening.index]?.manufacturer === "Genuine" ? "ANTOИD GENUINE SERVICE" : REPLACEMENT_PARTS[hardware.packageOpening.index]?.manufacturer}</i><b>{REPLACEMENT_PARTS[hardware.packageOpening.index]?.name}</b><span /></div>
          <h3>{["Sealed service carton", "Security seal cut", "Antistatic sleeve", "Part ready"][hardware.packageOpening.stage]}</h3>
          <Button onClick={() => dispatch({ type: "HARDWARE_PACKAGE_STEP" })}>
            {["Cut seal", "Open carton", "Remove part", "Done"][hardware.packageOpening.stage]}
          </Button>
          <button className="package-cancel" onClick={() => dispatch({ type: "HARDWARE_CANCEL_PACKAGE" })}>Cancel unboxing</button>
        </div>
      ), document.body)}
      {hardware.smash && createPortal((
        <div className={`smash-stage ${hardware.smash.battery ? "battery-easter" : ""}`}>
          <div className="smash-part">{hardware.smash.name}</div><i className="smash-hammer">🔨</i><div className="smash-flash" />
          {hardware.smash.battery ? (
            <div className="easter-message"><h2>Congratulations!</h2><p>You have reached the Easter Egg of Antoid!<br />Enjoy our simulator!</p><Button onClick={() => dispatch({ type: "HARDWARE_CLEAR_SMASH" })}>Continue</Button></div>
          ) : <Button onClick={() => dispatch({ type: "HARDWARE_CLEAR_SMASH" })}>Continue to recovery</Button>}
        </div>
      ), document.body)}
      <div className="hw-toolbar">
        <div className="segmented">
          <button
            className={hardware.view === "front" ? "active" : ""}
            onClick={() => set("hardware.view", "front")}
          >
            Front
          </button>
          <button
            className={hardware.view === "back" ? "active" : ""}
            onClick={() => set("hardware.view", "back")}
          >
            Back / internals
          </button>
        </div>
        <div className="segmented">
          {["Teardown", "Repair"].map((mode) => (
            <button
              key={mode}
              className={hardware.mode === mode ? "active" : ""}
              onClick={() => set("hardware.mode", mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <label className="explode-range">
        Exploded view
        <input
          type="range"
          min="0"
          max="100"
          value={hardware.exploded}
          onChange={(event) =>
            set("hardware.exploded", Number(event.target.value))
          }
        />
      </label>
      <div className="hw-tabbar">
        {["Device", "Inventory", "Tests", "Damage"].map((name) => (
          <button
            key={name}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "Device" && (
        <>
          <div className="physical-device-note">
            <i>↻</i><div><b>Work on the main Antoid 1</b><span>{hardware.view === "back" ? "The real phone is open. Select components directly in its chassis." : "Choose Back / internals to physically flip the main phone."}</span></div>
          </div>
          <div className="component-tree">
            {HARDWARE_GROUPS.map((group) => (
              <details
                key={group}
                open={
                  group ===
                  state.hardware.components[state.hardware.selected]?.group
                }
              >
                <summary>{group}</summary>
                {Object.values(hardware.components)
                  .filter((part) => part.group === group)
                  .map((part) => (
                    <button
                      key={part.id}
                      className={hardware.selected === part.id ? "active" : ""}
                      onClick={() =>
                        dispatch({ type: "HARDWARE_SELECT", id: part.id })
                      }
                    >
                      <i
                        className={
                          part.installed && !part.destroyed ? "ok" : "bad"
                        }
                      />
                      <span><b>{part.name}</b><em>{part.description}</em></span>
                      <small>
                        {part.installed
                          ? `${part.condition.toFixed(0)}%`
                          : "Removed"}
                      </small>
                    </button>
                  ))}
              </details>
            ))}
          </div>
          <ComponentInspector
            state={state}
            dispatch={dispatch}
            onRecover={(id) => {
              dispatch({ type: "HARDWARE_RECOVER", id });
              setTab("Inventory");
            }}
          />
        </>
      )}
      {tab === "Inventory" && <Inventory state={state} dispatch={dispatch} />}
      {tab === "Tests" && (
        <section className="hw-tests">
          <div className="temperature-grid">
            <span>
              <b>{hardware.temperatures.battery}°C</b>Battery
            </span>
            <span>
              <b>{hardware.temperatures.mainboard}°C</b>Mainboard
            </span>
            <span>
              <b>{hardware.temperatures.modem}°C</b>Modem
            </span>
          </div>
          <div className="diagnostic-head">
            <div>
              <h3>Hardware Test</h3>
              <p>
                {failed
                  ? `${failed} issue${failed === 1 ? "" : "s"} found`
                  : "All tested systems pass"}
              </p>
            </div>
            <Button onClick={() => dispatch({ type: "HARDWARE_TEST" })}>
              Run all tests
            </Button>
          </div>
          {diagnostics.map((result) => (
            <article
              className={result.pass ? "pass" : "fail"}
              key={result.name}
            >
              <b>{result.status}</b>
              <div>
                <strong>{result.name}</strong>
                <span>{result.detail}</span>
              </div>
            </article>
          ))}
          {hardware.faults.map((fault) => (
            <p className="electrical-fault" key={fault}>
              ⚡ {fault}
            </p>
          ))}
        </section>
      )}
      {tab === "Damage" && (
        <section className="damage-lab">
          <h3>Visual water test</h3>
          <div className="water-controls">
            <b>
              {Math.round(hardware.water.level)}% outside · {Math.round(hardware.water.ingress || 0)}% inside · {hardware.water.seconds}s
            </b>
            <Button
              onClick={() =>
                dispatch({
                  type: "HARDWARE_WATER",
                  mode: hardware.water.running ? "stop" : "start",
                })
              }
            >
              {hardware.water.running ? "Stop water" : "Start water"}
            </Button>
            <Button
              onClick={() =>
                dispatch({ type: "HARDWARE_WATER", mode: "drain" })
              }
            >
              Drain
            </Button>
          </div>
          <p>
            {caps.sealed
              ? "Seal integrity is currently protecting internal components."
              : "Warning: the enclosure is not sealed; submerged parts accumulate real exposure."}
          </p>
          <h3>Drop test</h3>
          <label>
            Height · {hardware.drop.height} m
            <input
              type="range"
              min="0.5"
              max="828"
              step="0.1"
              value={hardware.drop.height}
              onChange={(event) =>
                set("hardware.drop.height", Number(event.target.value))
              }
            />
          </label>
          <label>
            Orientation
            <select
              value={hardware.drop.orientation}
              onChange={(event) =>
                set("hardware.drop.orientation", event.target.value)
              }
            >
              <option>Screen</option>
              <option>Back</option>
              <option>Corner</option>
            </select>
          </label>
          <div className="drop-presets">
            {[0.5, 1, 1.5, 2, 3].map((height) => <Button key={height} onClick={() => set("hardware.drop.height", height)}>{height} m</Button>)}
            <Button onClick={() => set("hardware.drop.height", 330)}>Eiffel Tower · 330 m</Button>
            <Button onClick={() => set("hardware.drop.height", 828)}>Burj Khalifa · 828 m</Button>
            <Button
              onClick={() =>
                dispatch({
                  type: "HARDWARE_DROP",
                  height: hardware.drop.height,
                  orientation: hardware.drop.orientation,
                })
              }
            >
              Release phone
            </Button>
          </div>
          {hardware.drop.lastResult && (
            <strong className="drop-result">{hardware.drop.lastResult}</strong>
          )}
          <h3>Physical reset</h3>
          <p>
            Restores factory phone hardware only. Personal data, SIM numbers,
            apps and settings stay untouched.
          </p>
          <Button onClick={() => dispatch({ type: "RESET_PHONE_STATE" })}>
            Reset Phone State
          </Button>
          <div className="full-wipe-panel">
            <h3>Complete device wipe</h3>
            <p>
              Permanently erases every setting and all phone, SIM, eSIM, app,
              media, account, purchase, hardware, laptop and lab data. The
              sealed-box Antoid unboxing experience starts again.
            </p>
            <Button
              className="full-wipe-button"
              onClick={() =>
                dispatch({
                  type: "MODAL",
                  modal: {
                    icon: "!",
                    title: "Wipe Everything and Return to Unboxing?",
                    body: "This permanently erases every setting and all saved data, including profiles, SIM and eSIM data, apps, messages, media, purchases, hardware damage, replacement parts, laptop state and Controller Lab changes. This cannot be undone.",
                    actions: [
                      { label: "Cancel" },
                      {
                        label: "Wipe Everything",
                        onClick: () =>
                          dispatch({ type: "FULL_FACTORY_RESET" }),
                      },
                    ],
                  },
                })
              }
            >
              Wipe Everything &amp; Return to Unboxing
            </Button>
          </div>
        </section>
      )}
      {hardware.inspection && (
        <p className="inspection-readout">{hardware.inspection}</p>
      )}
    </div>
  );
}
