import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { Slider, Toggle } from "./UI.jsx";
import {
  SUPCER_PARTS,
  createRouterState,
  createSUPCerState,
  monitorState,
  routerAccess,
  routerClients,
  supcerFacts,
  usedStorageMb,
} from "../services/supcer.js";
const APPS = {
  files: ["Files", "▤"],
  browser: ["Antoid Browser", "◎"],
  paint: ["Antoid Paint", "✎"],
  media: ["Media Player", "▶"],
  text: ["Text Editor", "▧"],
  calculator: ["Calculator", "#"],
  system: ["System Information", "ⓘ"],
  tasks: ["System Monitor", "▥"],
  settings: ["Control Panel", "⚙"],
  orbital: ["Orbital Blocks", "◆"],
  pairs: ["Circuit Pairs", "▦"],
  store: ["Parts & Packages", "◫"],
  installer: ["Antoid Installer", "A"],
  "sketch-tools": ["Antoid Sketch Tools", "✐"],
};

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const pcPath = "lab.supcer";

function Monitor({ children }) {
  const { state, set } = useOS();
  const pc = state.lab.supcer,
    status = monitorState(pc);
  return (
    <div className={`sup-monitor monitor-${status}`}>
      <div
        className="sup-monitor-screen"
        style={{ filter: `brightness(${pc.monitor.brightness / 82})` }}
      >
        {status === "off" ? (
          <span />
        ) : status === "fault" ? (
          <div className="sup-no-signal">
            <b>DISPLAY HARDWARE FAULT</b>
            <small>Controller Lab reports a monitor failure.</small>
          </div>
        ) : status === "no-signal" ? (
          <div className="sup-no-signal">
            <b>NO SIGNAL</b>
            <small>Check the display cable and selected graphics output.</small>
          </div>
        ) : status === "standby" ? (
          <div className="sup-no-signal standby">
            <i /> <b>STANDBY</b>
            <small>Digital input · no active video</small>
          </div>
        ) : (
          children
        )}
      </div>
      <div className="sup-monitor-controls">
        <button
          aria-label="Monitor power"
          className={pc.monitor.power ? "on" : ""}
          onClick={() => set(`${pcPath}.monitor.power`, !pc.monitor.power)}
        >
          ⏻
        </button>
        <button
          aria-label="Reduce monitor brightness"
          onClick={() =>
            set(
              `${pcPath}.monitor.brightness`,
              Math.max(20, pc.monitor.brightness - 5),
            )
          }
        >
          −
        </button>
        <button
          aria-label="Increase monitor brightness"
          onClick={() =>
            set(
              `${pcPath}.monitor.brightness`,
              Math.min(100, pc.monitor.brightness + 5),
            )
          }
        >
          +
        </button>
        <i className={status === "active" ? "active" : ""} />
      </div>
      <div className="sup-monitor-stand" />
    </div>
  );
}

function BootDisplay() {
  const { state } = useOS();
  const pc = state.lab.supcer,
    facts = supcerFacts(pc);
  if (pc.power === "failed")
    return (
      <div className="sup-post">
        <b>POST STOPPED</b>
        {facts.postErrors.map((x) => (
          <p key={x}>{x}</p>
        ))}
        <small>Correct the physical hardware state and press power.</small>
      </div>
    );
  const labels = {
    starting: "Power rails stabilizing…",
    post: "ANTOИD BIOS · Performing POST",
    firmware: "Selecting boot device…",
    booting: "Starting Antoid OS 7…",
    login: "Preparing desktop…",
    shutting: "Shutting down safely…",
    restarting: "Restarting…",
  };
  return (
    <div className="sup-boot">
      <div className="sup-boot-logo">A</div>
      <b>{labels[pc.bootStage] || pc.bootMessage}</b>
      <span className="sup-loader" />
      <small>
        {facts.cpu?.name || "No CPU"} · {facts.memoryGb} GB ·{" "}
        {facts.storageOnline ? facts.storage?.name : "No boot storage"}
      </small>
    </div>
  );
}

function BIOS() {
  const { state, set } = useOS();
  const pc = state.lab.supcer,
    facts = supcerFacts(pc);
  const [tab, setTab] = useState("Overview");
  const [draft, setDraft] = useState(() => ({
    ...pc.bios,
    bootOrder: [...pc.bios.bootOrder],
  }));
  const tabs = ["Overview", "Storage", "Boot", "Graphics", "Monitor", "Exit"];
  const save = () => {
    set(`${pcPath}.bios`, { ...draft, pending: null });
    set(`${pcPath}.biosOpen`, false);
    set(`${pcPath}.biosRequested`, false);
    set(`${pcPath}.power`, "starting");
    set(`${pcPath}.bootStage`, "post");
  };
  const discard = () => {
    set(`${pcPath}.biosOpen`, false);
    set(`${pcPath}.biosRequested`, false);
    set(`${pcPath}.power`, "starting");
    set(`${pcPath}.bootStage`, "post");
  };
  return (
    <div className="sup-bios">
      <header>
        <b>ANTOИD BIOS SETUP UTILITY</b>
        <span>{pc.bios.version} · Public Beta firmware</span>
      </header>
      <nav>
        {tabs.map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      <main>
        {tab === "Overview" && (
          <>
            <h2>System Overview</h2>
            <dl>
              <dt>SUPCer</dt>
              <dd>{pc.model}</dd>
              <dt>Processor</dt>
              <dd>
                {facts.cpu
                  ? `${facts.cpu.brand} ${facts.cpu.name} · ${facts.cpu.actual}`
                  : "Not detected"}
              </dd>
              <dt>Memory</dt>
              <dd>
                {facts.memoryGb
                  ? `${facts.memoryGb} GB ${facts.board?.ramGeneration}`
                  : "Not detected"}
              </dd>
              <dt>Graphics</dt>
              <dd>
                {facts.graphicsOutput
                  ? `${facts.graphicsOutput.brand} ${facts.graphicsOutput.name}`
                  : "No valid output"}
              </dd>
              <dt>CPU temperature</dt>
              <dd>{facts.temperature} °C</dd>
              <dt>Fan</dt>
              <dd>
                {pc.hardware.fans.cpu && pc.conditions.fanHealth
                  ? `${Math.round(650 + facts.temperature * 27)} RPM`
                  : "Stopped"}
              </dd>
              <dt>Date/time</dt>
              <dd>
                {new Date(Date.now() + draft.timeOffset).toLocaleString()}
              </dd>
            </dl>
          </>
        )}
        {tab === "Storage" && (
          <>
            <h2>SATA Configuration</h2>
            <dl>
              <dt>SATA Port 0</dt>
              <dd>
                {facts.storageOnline
                  ? `${facts.storage.brand} ${facts.storage.name}`
                  : pc.cables.sataPower && !pc.cables.sataData
                    ? "Powered · no data link"
                    : pc.cables.sataData && !pc.cables.sataPower
                      ? "Data cable · device unpowered"
                      : "Not detected"}
              </dd>
              <dt>SMART health</dt>
              <dd>
                {facts.storageOnline
                  ? `${pc.conditions.ssdHealth}%`
                  : "Unavailable"}
              </dd>
            </dl>
          </>
        )}
        {tab === "Boot" && (
          <>
            <h2>Boot Priority</h2>
            {draft.bootOrder.map((item, i) => (
              <div className="bios-order" key={item}>
                <b>
                  {i + 1}. {item}
                </b>
                <button
                  disabled={!i}
                  onClick={() => {
                    const a = [...draft.bootOrder];
                    [a[i - 1], a[i]] = [a[i], a[i - 1]];
                    setDraft({ ...draft, bootOrder: a });
                  }}
                >
                  ↑
                </button>
                <button
                  disabled={i === draft.bootOrder.length - 1}
                  onClick={() => {
                    const a = [...draft.bootOrder];
                    [a[i + 1], a[i]] = [a[i], a[i + 1]];
                    setDraft({ ...draft, bootOrder: a });
                  }}
                >
                  ↓
                </button>
              </div>
            ))}
            <p>
              {facts.storageOnline && facts.storage?.bootable
                ? "Antoid OS loader detected."
                : "No bootable SATA device detected."}
            </p>
          </>
        )}
        {tab === "Graphics" && (
          <>
            <h2>Graphics Configuration</h2>
            <Toggle
              label="Integrated Graphics"
              checked={draft.igpuEnabled}
              onChange={(v) => setDraft({ ...draft, igpuEnabled: v })}
            />
            <dl>
              <dt>PCIe graphics</dt>
              <dd>
                {facts.discrete
                  ? `${facts.discrete.brand} ${facts.discrete.name} · ${facts.discrete.actual || facts.discrete.advertised}`
                  : "Not installed"}
              </dd>
              <dt>Active physical output</dt>
              <dd>{pc.cables.displayPort}</dd>
            </dl>
          </>
        )}
        {tab === "Monitor" && (
          <>
            <h2>Hardware Monitor</h2>
            <dl>
              <dt>CPU</dt>
              <dd>{facts.temperature} °C</dd>
              <dt>CPU fan</dt>
              <dd>{pc.hardware.fans.cpu ? "Operational" : "Disconnected"}</dd>
              <dt>PSU load</dt>
              <dd>
                {facts.draw} W / {facts.psu?.watts || 0} W
              </dd>
              <dt>Memory errors</dt>
              <dd>{pc.conditions.memoryErrors}</dd>
              <dt>SSD health</dt>
              <dd>{pc.conditions.ssdHealth}%</dd>
            </dl>
            <label>
              Fan policy
              <select
                value={draft.fanMode}
                onChange={(e) =>
                  setDraft({ ...draft, fanMode: e.target.value })
                }
              >
                <option>Automatic</option>
                <option>Quiet</option>
                <option>Performance</option>
              </select>
            </label>
          </>
        )}
        {tab === "Exit" && (
          <div className="bios-exit">
            <button onClick={save}>Save changes and reboot</button>
            <button onClick={discard}>Discard changes and reboot</button>
            <button
              onClick={() =>
                setDraft({
                  ...createSUPCerState().bios,
                  bootOrder: [...createSUPCerState().bios.bootOrder],
                })
              }
            >
              Load firmware defaults
            </button>
            <button onClick={() => setTab("Overview")}>Return to setup</button>
          </div>
        )}
      </main>
      <footer>
        Mouse and keyboard active · changes remain pending until Save
      </footer>
    </div>
  );
}

function RouterPage() {
  const { state, set } = useOS();
  const router = state.lab.router,
    [tab, setTab] = useState("Status"),
    clients = routerClients(state);
  const update = (patch) => set("lab.router", { ...router, ...patch });
  return (
    <div className="anrouter">
      <header>
        <div className="anrouter-logo">AN</div>
        <div>
          <b>ANRouter Settings</b>
          <span>
            {router.model} · {router.ip}
          </span>
        </div>
        <em>
          {router.restarting
            ? "RESTARTING"
            : router.wan
              ? "WAN ONLINE"
              : "LOCAL ONLY"}
        </em>
      </header>
      <nav>
        {["Status", "Wi-Fi", "LAN", "Devices", "System"].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      <section>
        {tab === "Status" && (
          <dl>
            <dt>Internet</dt>
            <dd>{router.wan ? "Connected" : "Unavailable"}</dd>
            <dt>LAN gateway</dt>
            <dd>{router.ip}</dd>
            <dt>Wi-Fi</dt>
            <dd>
              {router.wifiEnabled
                ? `${router.ssid} · ${Object.entries(router.bands)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(" / ")}`
                : "Disabled"}
            </dd>
            <dt>Uptime</dt>
            <dd>
              {Math.floor((Date.now() - router.uptimeStartedAt) / 60000)}{" "}
              minutes
            </dd>
            <dt>Clients</dt>
            <dd>{clients.length}</dd>
          </dl>
        )}
        {tab === "Wi-Fi" && (
          <>
            <Toggle
              label="Wireless radio"
              checked={router.wifiEnabled}
              onChange={(v) => update({ wifiEnabled: v })}
            />
            <label>
              Network name
              <input
                value={router.ssid}
                onChange={(e) => update({ ssid: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                value={router.password}
                onChange={(e) => update({ password: e.target.value })}
              />
            </label>
            <label>
              Security
              <select
                value={router.security}
                onChange={(e) => update({ security: e.target.value })}
              >
                <option>WPA2/WPA3</option>
                <option>WPA3</option>
                <option>WPA2</option>
              </select>
            </label>
            <Toggle
              label="Hidden SSID"
              checked={router.hidden}
              onChange={(v) => update({ hidden: v })}
            />
            {Object.entries(router.bands).map(([band, on]) => (
              <Toggle
                key={band}
                label={band}
                checked={on}
                onChange={(v) =>
                  update({ bands: { ...router.bands, [band]: v } })
                }
              />
            ))}
            <label>
              Channel
              <input
                type="number"
                min="1"
                max="165"
                value={router.channel}
                onChange={(e) => update({ channel: +e.target.value })}
              />
            </label>
            <label>
              Channel width
              <select
                value={router.channelWidth}
                onChange={(e) => update({ channelWidth: +e.target.value })}
              >
                <option value="20">20 MHz</option>
                <option value="40">40 MHz</option>
                <option value="80">80 MHz</option>
                <option value="160">160 MHz</option>
              </select>
            </label>
            <Slider
              label="Transmit power"
              value={router.transmitPower}
              onChange={(v) => update({ transmitPower: v })}
              unit="%"
            />
            <Toggle
              label="Guest network"
              checked={router.guest.enabled}
              onChange={(enabled) =>
                update({ guest: { ...router.guest, enabled } })
              }
            />
            {router.guest.enabled && (
              <label>
                Guest network name
                <input
                  value={router.guest.ssid}
                  onChange={(e) =>
                    update({ guest: { ...router.guest, ssid: e.target.value } })
                  }
                />
              </label>
            )}
          </>
        )}
        {tab === "LAN" && (
          <>
            <label>
              Router address
              <input
                value={router.ip}
                onChange={(e) => update({ ip: e.target.value })}
              />
            </label>
            <Toggle
              label="DHCP server"
              checked={router.dhcp}
              onChange={(v) => update({ dhcp: v })}
            />
            <label>
              DHCP start
              <input
                type="number"
                min="2"
                max="250"
                value={router.dhcpStart}
                onChange={(e) => update({ dhcpStart: +e.target.value })}
              />
            </label>
            <label>
              DHCP end
              <input
                type="number"
                min="2"
                max="250"
                value={router.dhcpEnd}
                onChange={(e) => update({ dhcpEnd: +e.target.value })}
              />
            </label>
            <label>
              DNS
              <input
                value={router.dns}
                onChange={(e) => update({ dns: e.target.value })}
              />
            </label>
          </>
        )}
        {tab === "Devices" && (
          <div className="router-clients">
            {clients.length ? (
              clients.map((c) => (
                <article key={c.id}>
                  <b>{c.name}</b>
                  <span>
                    {c.ip} · {c.type} · {c.band}
                  </span>
                  <input
                    aria-label={`Rename ${c.name}`}
                    value={router.clientNames[c.id] || ""}
                    placeholder="Custom name"
                    onChange={(e) =>
                      update({
                        clientNames: {
                          ...router.clientNames,
                          [c.id]: e.target.value,
                        },
                      })
                    }
                  />
                  <button
                    onClick={() =>
                      update({
                        blocked: c.blocked
                          ? router.blocked.filter((x) => x !== c.id)
                          : [...router.blocked, c.id],
                      })
                    }
                  >
                    {c.blocked ? "Unblock" : "Block"}
                  </button>
                </article>
              ))
            ) : (
              <p>No active DHCP clients.</p>
            )}
          </div>
        )}
        {tab === "System" && (
          <>
            <dl>
              <dt>Firmware</dt>
              <dd>{router.firmware}</dd>
              <dt>Public Beta</dt>
              <dd>Shared Wi-Fi architecture</dd>
            </dl>
            <button
              onClick={() => {
                const restoreWireless = router.wifiEnabled;
                update({
                  uptimeStartedAt: Date.now(),
                  restarting: true,
                  wifiEnabled: false,
                });
                setTimeout(() => {
                  set("lab.router.restarting", false);
                  set("lab.router.wifiEnabled", restoreWireless);
                }, 1200);
              }}
            >
              Restart ANRouter
            </button>
            <button onClick={() => set("lab.router", createRouterState())}>
              Restore network defaults
            </button>
          </>
        )}
      </section>
    </div>
  );
}

function FileManager() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    fs = pc.filesystem;
  const [path, setPath] = useState("/Users/Antoid"),
    [selected, setSelected] = useState(null),
    [name, setName] = useState(""),
    [movePath, setMovePath] = useState("/Users/Antoid/Documents");
  const items = fs.items.filter((x) => x.path === path),
    update = (next) => set(`${pcPath}.filesystem`, next);
  if (!supcerFacts(pc).storageOnline)
    return (
      <div className="browser-error">
        <b>Storage drive unavailable</b>
        <p>
          Reconnect SATA data and power or repair the SSD in Controller Lab.
        </p>
      </div>
    );
  const create = (type) => {
    const n = name.trim() || `New ${type}`;
    update({
      ...fs,
      items: [
        ...fs.items,
        {
          id: uid(),
          name: n,
          type,
          size: type === "folder" ? 0 : 1,
          path,
          content: "",
          created: Date.now(),
          modified: Date.now(),
        },
      ],
    });
    setName("");
  };
  const remove = () => {
    const item = fs.items.find((x) => x.id === selected);
    if (!item) return;
    update({
      ...fs,
      items: fs.items.filter((x) => x.id !== selected),
      recycle: [
        ...fs.recycle,
        { ...item, deletedFrom: item.path, path: "/Recycle Bin" },
      ],
    });
    setSelected(null);
  };
  const rename = () => {
    const nextName = name.trim();
    if (!selected || !nextName) return;
    update({
      ...fs,
      items: fs.items.map((item) =>
        item.id === selected
          ? { ...item, name: nextName, modified: Date.now() }
          : item,
      ),
    });
    setName("");
  };
  const copy = () => {
    const item = fs.items.find((candidate) => candidate.id === selected);
    if (!item) return;
    const dot = item.name.lastIndexOf(".");
    const copiedName =
      dot > 0
        ? `${item.name.slice(0, dot)} copy${item.name.slice(dot)}`
        : `${item.name} copy`;
    update({
      ...fs,
      items: [
        ...fs.items,
        {
          ...item,
          id: uid(),
          name: copiedName,
          created: Date.now(),
          modified: Date.now(),
        },
      ],
    });
  };
  const move = () => {
    if (!selected || !movePath) return;
    update({
      ...fs,
      items: fs.items.map((item) =>
        item.id === selected
          ? { ...item, path: movePath, modified: Date.now() }
          : item,
      ),
    });
    setSelected(null);
  };
  const open = (item) => {
    if (item.type === "folder") setPath(`${item.path}/${item.name}`);
    else if (item.type === "text")
      openAppWindow(state, set, "text", { fileId: item.id });
    else if (item.type === "package")
      openAppWindow(state, set, "installer", { fileId: item.id });
    else if (item.type === "image") {
      let strokes = [];
      try {
        strokes = JSON.parse(item.content || "[]");
      } catch {
        strokes = [];
      }
      set(`${pcPath}.paint`, {
        ...pc.paint,
        fileId: item.id,
        name: item.name,
        strokes,
        redo: [],
      });
      openAppWindow(state, set, pc.fileAssociations[".anpaint"] || "paint");
    } else if (["audio", "video"].includes(item.type)) {
      set(`${pcPath}.media.fileId`, item.id);
      openAppWindow(state, set, "media");
    }
  };
  if (path === "/Recycle Bin")
    return (
      <div className="file-app">
        <div className="file-toolbar">
          <button onClick={() => setPath("/Users/Antoid")}>← User</button>
          <button
            disabled={!selected}
            onClick={() => {
              const item = fs.recycle.find((x) => x.id === selected);
              update({
                ...fs,
                recycle: fs.recycle.filter((x) => x.id !== selected),
                items: [
                  ...fs.items,
                  {
                    ...item,
                    path: item.deletedFrom || "/Users/Antoid",
                    deletedFrom: null,
                  },
                ],
              });
              setSelected(null);
            }}
          >
            Restore
          </button>
          <button
            disabled={!selected}
            onClick={() => {
              update({
                ...fs,
                recycle: fs.recycle.filter((x) => x.id !== selected),
              });
              setSelected(null);
            }}
          >
            Delete permanently
          </button>
        </div>
        <div className="file-grid">
          {fs.recycle.map((x) => (
            <button
              className={selected === x.id ? "selected" : ""}
              onClick={() => setSelected(x.id)}
              key={x.id}
            >
              <i>♲</i>
              <b>{x.name}</b>
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <div className="file-app">
      <div className="file-toolbar">
        <button
          disabled={path === "/Users/Antoid"}
          onClick={() =>
            setPath(path.split("/").slice(0, -1).join("/") || "/Users/Antoid")
          }
        >
          ←
        </button>
        <span>{path}</span>
        <input
          value={name}
          placeholder="New item name"
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => create("folder")}>New folder</button>
        <button onClick={() => create("text")}>New text file</button>
        <button disabled={!selected} onClick={remove}>
          Recycle
        </button>
        <button disabled={!selected || !name.trim()} onClick={rename}>
          Rename
        </button>
        <button disabled={!selected} onClick={copy}>
          Copy
        </button>
        <select
          aria-label="Move destination"
          value={movePath}
          onChange={(event) => setMovePath(event.target.value)}
        >
          {fs.items
            .filter((item) => item.type === "folder")
            .map((folder) => (
              <option key={folder.id} value={`${folder.path}/${folder.name}`}>
                {folder.name}
              </option>
            ))}
        </select>
        <button disabled={!selected} onClick={move}>
          Move
        </button>
        <button onClick={() => setPath("/Recycle Bin")}>
          Recycle Bin ({fs.recycle.length})
        </button>
      </div>
      <div className="file-grid">
        {items.map((x) => (
          <button
            className={selected === x.id ? "selected" : ""}
            onClick={() => setSelected(x.id)}
            onDoubleClick={() => open(x)}
            key={x.id}
          >
            <i>
              {x.type === "folder" ? "▤" : x.type === "package" ? "A" : "▧"}
            </i>
            <b>{x.name}</b>
            <small>
              {x.type} · {x.size} MB
            </small>
          </button>
        ))}
      </div>
      <footer>
        {(usedStorageMb(fs) / 1024).toFixed(1)} GB used of {fs.capacityGb} GB
      </footer>
    </div>
  );
}

function BrowserApp() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    browser = pc.browser,
    tab = browser.tabs.find((x) => x.id === browser.active) || browser.tabs[0];
  const [address, setAddress] = useState(tab.address);
  const result = routerAccess(state, tab.address);
  const writeTabs = (tabs, active = browser.active) =>
    set(`${pcPath}.browser`, { ...browser, tabs, active });
  const go = (value) => {
    const a = value.trim() || "antoid:start";
    const history = tab.history.slice(0, tab.index + 1).concat(a);
    writeTabs(
      browser.tabs.map((x) =>
        x.id === tab.id
          ? {
              ...x,
              address: a,
              title: a === state.lab.router.ip ? "ANRouter" : a,
              index: history.length - 1,
              history,
            }
          : x,
      ),
    );
    setAddress(a);
  };
  const move = (n) => {
    const i = Math.max(0, Math.min(tab.history.length - 1, tab.index + n)),
      a = tab.history[i];
    writeTabs(
      browser.tabs.map((x) =>
        x.id === tab.id ? { ...x, index: i, address: a } : x,
      ),
    );
    setAddress(a);
  };
  return (
    <div className="browser-app">
      <div className="browser-tabs">
        {browser.tabs.map((t) => (
          <button
            className={t.id === browser.active ? "active" : ""}
            onClick={() => {
              set(`${pcPath}.browser.active`, t.id);
              setAddress(t.address);
            }}
            key={t.id}
          >
            {t.title}
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (browser.tabs.length > 1)
                  writeTabs(
                    browser.tabs.filter((x) => x.id !== t.id),
                    browser.tabs.find((x) => x.id !== t.id).id,
                  );
              }}
            >
              ×
            </span>
          </button>
        ))}
        <button
          onClick={() => {
            const t = {
              id: uid(),
              title: "New tab",
              address: "antoid:start",
              history: ["antoid:start"],
              index: 0,
            };
            writeTabs([...browser.tabs, t], t.id);
            setAddress(t.address);
          }}
        >
          +
        </button>
      </div>
      <div className="browser-bar">
        <button disabled={!tab.index} onClick={() => move(-1)}>
          ←
        </button>
        <button
          disabled={tab.index >= tab.history.length - 1}
          onClick={() => move(1)}
        >
          →
        </button>
        <button onClick={() => go(tab.address)}>↻</button>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go(address)}
        />
        <button
          onClick={() => {
            if (!browser.bookmarks.includes(tab.address))
              set(`${pcPath}.browser.bookmarks`, [
                ...browser.bookmarks,
                tab.address,
              ]);
          }}
        >
          ☆
        </button>
      </div>
      <div className="browser-library">
        <details>
          <summary>Bookmarks ({browser.bookmarks.length})</summary>
          {browser.bookmarks.map((bookmark) => (
            <button onClick={() => go(bookmark)} key={bookmark}>
              {bookmark}
            </button>
          ))}
        </details>
        <details>
          <summary>History ({tab.history.length})</summary>
          {tab.history.map((entry, index) => (
            <button onClick={() => go(entry)} key={`${entry}-${index}`}>
              {entry}
            </button>
          ))}
        </details>
        <span>Downloads {browser.downloads.length}</span>
      </div>
      <div className="browser-page">
        {tab.address === "antoid:start" ? (
          <div className="browser-start">
            <b>Antoid Browser</b>
            <h2>Where do you want to go?</h2>
            <button onClick={() => go(state.lab.router.ip)}>
              Open ANRouter
            </button>
            <button onClick={() => go("antoid.local/news")}>
              Antoid Local News
            </button>
            <small>
              {state.lab.router.wan
                ? "Internet available"
                : "Local network only"}
            </small>
          </div>
        ) : result.kind === "router" ? (
          <RouterPage />
        ) : result.kind === "error" ? (
          <div className="browser-error">
            <b>Page unavailable</b>
            <p>{result.message}</p>
            <button onClick={() => go(tab.address)}>Try again</button>
          </div>
        ) : (
          <div className="local-web">
            <h1>{result.title}</h1>
            <p>This simulated page was delivered through ANRouter.</p>
            <button
              onClick={() => {
                const item = {
                  id: uid(),
                  name: "download.txt",
                  type: "text",
                  size: 1,
                  path: "/Users/Antoid/Downloads",
                  content: `Downloaded from ${tab.address}`,
                  created: Date.now(),
                  modified: Date.now(),
                };
                set(`${pcPath}.filesystem.items`, [
                  ...pc.filesystem.items,
                  item,
                ]);
                set(`${pcPath}.browser.downloads`, [
                  ...browser.downloads,
                  {
                    id: item.id,
                    name: item.name,
                    source: tab.address,
                    status: "complete",
                  },
                ]);
              }}
            >
              Download page note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PaintApp() {
  const { state, set } = useOS(),
    p = state.lab.supcer.paint,
    ref = useRef(null),
    drawing = useRef(false);
  const save = (saveAs = false) => {
    const fs = state.lab.supcer.filesystem;
    const existing =
      !saveAs && p.fileId && fs.items.find((item) => item.id === p.fileId);
    if (existing) {
      set(
        `${pcPath}.filesystem.items`,
        fs.items.map((item) =>
          item.id === p.fileId
            ? {
                ...item,
                content: JSON.stringify(p.strokes),
                modified: Date.now(),
              }
            : item,
        ),
      );
      return;
    }
    const id = uid();
    const name = `Painting ${new Date().toLocaleTimeString().replaceAll(":", "-")}.anpaint`;
    set(`${pcPath}.filesystem.items`, [
      ...fs.items,
      {
        id,
        name,
        type: "image",
        size: Math.max(1, Math.ceil(JSON.stringify(p.strokes).length / 1024)),
        path: "/Users/Antoid/Pictures",
        content: JSON.stringify(p.strokes),
        created: Date.now(),
        modified: Date.now(),
      },
    ]);
    set(`${pcPath}.paint.fileId`, id);
    set(`${pcPath}.paint.name`, name);
  };
  const add = (e) => {
    const r = ref.current.getBoundingClientRect(),
      point = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (!drawing.current) {
      drawing.current = true;
      set(`${pcPath}.paint`, {
        ...p,
        strokes: [
          ...p.strokes,
          { tool: p.tool, color: p.color, width: p.width, points: [point] },
        ],
        redo: [],
      });
    } else {
      const a = [...p.strokes],
        last = {
          ...a.at(-1),
          points: ["line", "rectangle"].includes(a.at(-1).tool)
            ? [a.at(-1).points[0], point]
            : [...a.at(-1).points, point],
        };
      a[a.length - 1] = last;
      set(`${pcPath}.paint.strokes`, a);
    }
  };
  return (
    <div className="paint-app">
      <div className="paint-tools">
        <button
          className={p.tool === "brush" ? "active" : ""}
          onClick={() => set(`${pcPath}.paint.tool`, "brush")}
        >
          Brush
        </button>
        <button
          className={p.tool === "eraser" ? "active" : ""}
          onClick={() => set(`${pcPath}.paint.tool`, "eraser")}
        >
          Eraser
        </button>
        <button
          className={p.tool === "line" ? "active" : ""}
          onClick={() => set(`${pcPath}.paint.tool`, "line")}
        >
          Line
        </button>
        <button
          className={p.tool === "rectangle" ? "active" : ""}
          onClick={() => set(`${pcPath}.paint.tool`, "rectangle")}
        >
          Rectangle
        </button>
        <input
          aria-label="Paint color"
          type="color"
          value={p.color}
          onChange={(e) => set(`${pcPath}.paint.color`, e.target.value)}
        />
        <input
          aria-label="Line width"
          type="range"
          min="1"
          max="24"
          value={p.width}
          onChange={(e) => set(`${pcPath}.paint.width`, +e.target.value)}
        />
        <button
          disabled={!p.strokes.length}
          onClick={() => {
            set(`${pcPath}.paint.redo`, [p.strokes.at(-1), ...p.redo]);
            set(`${pcPath}.paint.strokes`, p.strokes.slice(0, -1));
          }}
        >
          Undo
        </button>
        <button
          disabled={!p.redo.length}
          onClick={() => {
            set(`${pcPath}.paint.strokes`, [...p.strokes, p.redo[0]]);
            set(`${pcPath}.paint.redo`, p.redo.slice(1));
          }}
        >
          Redo
        </button>
        <button onClick={() => save(false)}>Save</button>
        <button onClick={() => save(true)}>Save as</button>
        <button
          onClick={() =>
            set(`${pcPath}.paint`, {
              ...p,
              fileId: null,
              name: "Untitled.anpaint",
              strokes: [],
              redo: [],
            })
          }
        >
          New
        </button>
        <span>{p.name}</span>
      </div>
      <svg
        ref={ref}
        className="paint-canvas"
        onPointerDown={add}
        onPointerMove={(e) => drawing.current && add(e)}
        onPointerUp={() => (drawing.current = false)}
        onPointerLeave={() => (drawing.current = false)}
      >
        {p.strokes.map((s, i) =>
          s.tool === "rectangle" && s.points.length > 1 ? (
            <rect
              key={i}
              x={Math.min(s.points[0].x, s.points[1].x)}
              y={Math.min(s.points[0].y, s.points[1].y)}
              width={Math.abs(s.points[1].x - s.points[0].x)}
              height={Math.abs(s.points[1].y - s.points[0].y)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width}
            />
          ) : (
            <polyline
              key={i}
              points={s.points.map((q) => `${q.x},${q.y}`).join(" ")}
              fill="none"
              stroke={s.tool === "eraser" ? "white" : s.color}
              strokeWidth={s.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
        )}
      </svg>
    </div>
  );
}

function TextApp() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    te = pc.textEditor,
    [text, setText] = useState(
      te.fileId
        ? pc.filesystem.items.find((x) => x.id === te.fileId)?.content || ""
        : te.text,
    );
  const save = () => {
    if (te.fileId)
      set(
        `${pcPath}.filesystem.items`,
        pc.filesystem.items.map((x) =>
          x.id === te.fileId
            ? {
                ...x,
                content: text,
                size: Math.max(1, Math.ceil(text.length / 1024)),
                modified: Date.now(),
              }
            : x,
        ),
      );
    else {
      const id = uid();
      set(`${pcPath}.filesystem.items`, [
        ...pc.filesystem.items,
        {
          id,
          name: "Untitled.txt",
          type: "text",
          size: 1,
          path: "/Users/Antoid/Documents",
          content: text,
          created: Date.now(),
          modified: Date.now(),
        },
      ]);
      set(`${pcPath}.textEditor.fileId`, id);
    }
    set(`${pcPath}.textEditor.text`, text);
  };
  return (
    <div className="text-app">
      <div>
        <button
          onClick={() => {
            setText("");
            set(`${pcPath}.textEditor`, { fileId: null, text: "" });
          }}
        >
          New
        </button>
        <button onClick={save}>Save</button>
        <span>
          {te.fileId
            ? pc.filesystem.items.find((x) => x.id === te.fileId)?.name
            : "Untitled.txt"}
        </span>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}
function Calculator() {
  const { state, set } = useOS(),
    c = state.lab.supcer.calculator;
  const press = (v) => {
    if (v === "C") return set(`${pcPath}.calculator.display`, "0");
    if (v === "=") {
      let result = "Error";
      try {
        if (/^[0-9+\-*/().% ]+$/.test(c.display))
          result = String(Function(`"use strict";return (${c.display})`)());
      } catch {}
      set(`${pcPath}.calculator`, {
        display: result,
        history: [`${c.display} = ${result}`, ...c.history].slice(0, 10),
      });
      return;
    }
    set(`${pcPath}.calculator.display`, c.display === "0" ? v : c.display + v);
  };
  return (
    <div className="calc-app">
      <output>{c.display}</output>
      <div>
        {[
          "7",
          "8",
          "9",
          "/",
          "4",
          "5",
          "6",
          "*",
          "1",
          "2",
          "3",
          "-",
          "0",
          ".",
          "=",
          "+",
          "C",
          "(",
          ")",
          "%",
        ].map((x) => (
          <button onClick={() => press(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <small>{c.history[0]}</small>
    </div>
  );
}
function Media() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    m = pc.media,
    item = pc.filesystem.items.find((x) => x.id === m.fileId),
    library = pc.filesystem.items.filter((x) =>
      ["audio", "video"].includes(x.type),
    );
  const choose = (next) =>
    set(`${pcPath}.media`, {
      ...m,
      fileId: next.id,
      position: 0,
      playing: false,
    });
  const stepTrack = (offset) => {
    const current = Math.max(
      0,
      library.findIndex((candidate) => candidate.id === m.fileId),
    );
    if (library.length)
      choose(library[(current + offset + library.length) % library.length]);
  };
  return (
    <div className="media-app">
      <div className="media-art">♪</div>
      <h2>{item?.name || "No media selected"}</h2>
      <input
        type="range"
        min="0"
        max="100"
        value={m.position}
        onChange={(e) => set(`${pcPath}.media.position`, +e.target.value)}
      />
      <div>
        <button disabled={!library.length} onClick={() => stepTrack(-1)}>
          ⏮
        </button>
        <button
          onClick={() =>
            set(`${pcPath}.media.position`, Math.max(0, m.position - 10))
          }
        >
          ⏪
        </button>
        <button
          disabled={!item}
          onClick={() => set(`${pcPath}.media.playing`, !m.playing)}
        >
          {m.playing ? "Ⅱ" : "▶"}
        </button>
        <button
          onClick={() =>
            set(`${pcPath}.media.position`, Math.min(100, m.position + 10))
          }
        >
          ⏩
        </button>
        <button disabled={!library.length} onClick={() => stepTrack(1)}>
          ⏭
        </button>
      </div>
      <label>
        Volume{" "}
        <input
          type="range"
          min="0"
          max="100"
          value={m.volume}
          onChange={(e) => set(`${pcPath}.media.volume`, +e.target.value)}
        />
      </label>
      <p>{m.playing ? "Playing through Antoid audio service" : "Paused"}</p>
      <div className="media-library">
        <b>Music &amp; Videos library</b>
        {library.map((mediaItem) => (
          <button
            className={mediaItem.id === m.fileId ? "active" : ""}
            onClick={() => choose(mediaItem)}
            key={mediaItem.id}
          >
            {mediaItem.type === "video" ? "▣" : "♪"} {mediaItem.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SystemInfo() {
  const { state } = useOS(),
    pc = state.lab.supcer,
    f = supcerFacts(pc);
  return (
    <div className="system-info">
      <div className="system-hero">
        <span>A</span>
        <div>
          <h2>Antoid OS 7</h2>
          <b>Antoid Lab v5.0.0 Public Beta</b>
        </div>
      </div>
      <dl>
        <dt>Computer</dt>
        <dd>{pc.model}</dd>
        <dt>Processor</dt>
        <dd>
          {f.cpu?.brand} {f.cpu?.name} · {f.cpu?.actual}
        </dd>
        <dt>Installed memory</dt>
        <dd>
          {f.memoryGb} GB {f.board?.ramGeneration}
        </dd>
        <dt>Graphics</dt>
        <dd>
          {f.graphics
            ? `${f.graphics.brand} ${f.graphics.name} · ${f.graphics.actual || f.graphics.advertised || `${f.graphics.vram} GB VRAM`}`
            : "Unavailable"}
        </dd>
        <dt>Storage</dt>
        <dd>
          {f.storageOnline
            ? `${f.storage.name} · ${pc.conditions.ssdHealth}% health`
            : "Not detected"}
        </dd>
        <dt>BIOS</dt>
        <dd>
          {pc.bios.version} · {pc.bios.date}
        </dd>
        <dt>Network</dt>
        <dd>
          {pc.cables.ethernet
            ? "Ethernet"
            : pc.network?.connected || "Disconnected"}
        </dd>
      </dl>
    </div>
  );
}
function TaskMonitor() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    f = supcerFacts(pc);
  const mem = Math.min(
    99,
    Math.round(
      18 + pc.desktop.windows.length * 5 + (16 / Math.max(1, f.memoryGb)) * 8,
    ),
  );
  return (
    <div className="tasks-app">
      <div className="perf-grid">
        <article>
          <b>
            {Math.min(
              100,
              pc.conditions.cpuLoad + pc.desktop.windows.length * 3,
            )}
            %
          </b>
          <span>CPU</span>
        </article>
        <article>
          <b>{mem}%</b>
          <span>Memory</span>
        </article>
        <article>
          <b>{pc.desktop.windows.length ? 12 : 1}%</b>
          <span>Disk</span>
        </article>
        <article>
          <b>
            {state.lab.router.wan
              ? Math.round(state.lab.router.conditions.bandwidth / 12)
              : 0}
          </b>
          <span>Mbps</span>
        </article>
      </div>
      {pc.desktop.windows.map((w) => (
        <div className="process" key={w.id}>
          <span>{APPS[w.app]?.[0]} · Running</span>
          <button
            disabled={w.app === "tasks"}
            onClick={() =>
              set(
                `${pcPath}.desktop.windows`,
                pc.desktop.windows.filter((x) => x.id !== w.id),
              )
            }
          >
            End task
          </button>
        </div>
      ))}
    </div>
  );
}
function Settings() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    router = state.lab.router,
    [wifiPass, setWifiPass] = useState(""),
    [networkChoice, setNetworkChoice] = useState(router.ssid);
  const wifiOnline =
    pc.network.connected === router.ssid &&
    pc.network.remembered[router.ssid] === router.password &&
    router.wifiEnabled;
  const hotspotVisible = state.radio.hotspot && state.power.mode === "on";
  useEffect(() => {
    if (!router.wifiEnabled && hotspotVisible)
      setNetworkChoice(state.hotspot.ssid || "Antoid 1");
    else if (!hotspotVisible && router.wifiEnabled)
      setNetworkChoice(router.ssid);
  }, [router.wifiEnabled, router.ssid, hotspotVisible, state.hotspot.ssid]);
  const networkPassword =
    networkChoice === router.ssid ? router.password : state.hotspot.password;
  const connectNetwork = () => {
    if (wifiPass !== networkPassword)
      return set(`${pcPath}.network.password`, "Incorrect password");
    set(`${pcPath}.network`, {
      ...pc.network,
      connected: networkChoice,
      remembered: { ...pc.network.remembered, [networkChoice]: wifiPass },
      password: "",
    });
  };
  return (
    <div className="control-app">
      <h2>Personalization</h2>
      <div className="wallpapers">
        {["aurora7", "lake", "graphite"].map((x) => (
          <button
            className={pc.desktop.wallpaper === x ? "active" : ""}
            onClick={() => set(`${pcPath}.desktop.wallpaper`, x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      <label>
        Accent
        <input
          type="color"
          value={pc.desktop.accent}
          onChange={(e) => set(`${pcPath}.desktop.accent`, e.target.value)}
        />
      </label>
      <Slider
        label="System volume"
        value={pc.desktop.volume}
        onChange={(v) => set(`${pcPath}.desktop.volume`, v)}
        unit="%"
      />
      <Toggle
        label="Mute"
        checked={pc.desktop.muted}
        onChange={(v) => set(`${pcPath}.desktop.muted`, v)}
      />
      <h2>Display &amp; devices</h2>
      <Slider
        label="Monitor brightness"
        value={pc.monitor.brightness}
        min={20}
        onChange={(value) => set(`${pcPath}.monitor.brightness`, value)}
        unit="%"
      />
      <Toggle
        label="Keyboard connected"
        checked={pc.cables.keyboard}
        onChange={(value) => set(`${pcPath}.cables.keyboard`, value)}
      />
      <Toggle
        label="Mouse connected"
        checked={pc.cables.mouse}
        onChange={(value) => set(`${pcPath}.cables.mouse`, value)}
      />
      <h2>Network</h2>
      <p>
        {pc.cables.ethernet
          ? `Ethernet · ${router.ip.split(".").slice(0, 3).join(".")}.40`
          : wifiOnline
            ? `${router.ssid} · Internet ${router.wan ? "available" : "unavailable"}`
            : "Disconnected"}
      </p>
      {!pc.cables.ethernet && (router.wifiEnabled || hotspotVisible) && (
        <>
          <label>
            Available network
            <select
              value={networkChoice}
              onChange={(e) => setNetworkChoice(e.target.value)}
            >
              {router.wifiEnabled && <option>{router.ssid}</option>}
              {hotspotVisible && (
                <option>{state.hotspot.ssid || "Antoid 1"}</option>
              )}
            </select>
          </label>
          <label>
            {networkChoice}
            <input
              type="password"
              value={wifiPass}
              placeholder="Wi-Fi password"
              onChange={(e) => setWifiPass(e.target.value)}
            />
          </label>
          <button
            onClick={() =>
              pc.network.connected === networkChoice
                ? set(`${pcPath}.network.connected`, null)
                : connectNetwork()
            }
          >
            {pc.network.connected === networkChoice
              ? "Disconnect Wi-Fi"
              : "Connect Wi-Fi"}
          </button>
          {pc.network.password && <p>{pc.network.password}</p>}
        </>
      )}
      <h2>Applications &amp; storage</h2>
      <p>
        {(usedStorageMb(pc.filesystem) / 1024).toFixed(1)} GB used ·{" "}
        {pc.installedApps.length} applications installed
      </p>
      <div className="installed-programs">
        {pc.installedApps.map((app) => (
          <span key={app}>{APPS[app]?.[0] || app}</span>
        ))}
      </div>
      <h2>User, date &amp; time</h2>
      <label>
        Account display name
        <input
          value={pc.desktop.user}
          onChange={(e) => set(`${pcPath}.desktop.user`, e.target.value)}
        />
      </label>
      <p>
        {new Date(Date.now() + pc.bios.timeOffset).toLocaleString()} ·
        firmware-managed clock
      </p>
      <h2>System &amp; About</h2>
      <p>Antoid OS 7 · Antoid Lab v5.0.0 Public Beta · {pc.model}</p>
      <h2>Power</h2>
      <div className="settings-actions">
        <button
          onClick={() => {
            set(`${pcPath}.power`, "sleep");
            set(`${pcPath}.bootStage`, "off");
          }}
        >
          Sleep
        </button>
        <button
          onClick={() => {
            set(`${pcPath}.power`, "restarting");
            set(`${pcPath}.bootStage`, "restarting");
          }}
        >
          Restart
        </button>
        <button
          onClick={() => {
            set(`${pcPath}.power`, "shutting");
            set(`${pcPath}.bootStage`, "shutting");
          }}
        >
          Shut down
        </button>
        <button onClick={() => set(`${pcPath}.desktop.locked`, true)}>
          Lock
        </button>
      </div>
      <h2>Accessibility</h2>
      <p>
        Keyboard navigation, scalable windows and high-contrast firmware screens
        are active in this beta.
      </p>
    </div>
  );
}
function Game() {
  const { state, set } = useOS(),
    g = state.lab.supcer.game;
  useEffect(() => {
    if (!g.running) return;
    const t = setInterval(
      () => set(`${pcPath}.game.target`, Math.floor(Math.random() * 9)),
      900,
    );
    return () => clearInterval(t);
  }, [g.running]);
  return (
    <div className="game-app">
      <header>
        <b>Orbital Blocks</b>
        <span>
          Score {g.score} · Best {g.best}
        </span>
        <button
          onClick={() =>
            set(`${pcPath}.game`, {
              score: 0,
              best: g.best,
              target: 4,
              running: true,
            })
          }
        >
          {g.running ? "Restart" : "Start"}
        </button>
      </header>
      <div className="game-grid">
        {Array.from({ length: 9 }, (_, i) => (
          <button
            className={g.running && g.target === i ? "target" : ""}
            disabled={!g.running || g.target !== i}
            onClick={() => {
              const score = g.score + 1;
              set(`${pcPath}.game`, {
                ...g,
                score,
                best: Math.max(g.best, score),
                target: Math.floor(Math.random() * 9),
              });
            }}
            key={i}
          />
        ))}
      </div>
      <p>
        Click the illuminated block before it moves. Mouse and keyboard focus
        are supported.
      </p>
    </div>
  );
}

function CircuitPairs() {
  const { state, set } = useOS(),
    game = state.lab.supcer.pairs;
  const restart = () =>
    set(`${pcPath}.pairs`, {
      ...game,
      cards: [1, 2, 3, 4, 1, 2, 3, 4].sort(() => Math.random() - 0.5),
      open: [],
      matched: [],
      moves: 0,
      running: true,
    });
  const choose = (index) => {
    if (
      !game.running ||
      game.open.includes(index) ||
      game.matched.includes(index) ||
      game.open.length >= 2
    )
      return;
    const open = [...game.open, index];
    if (open.length === 1) return set(`${pcPath}.pairs.open`, open);
    const moves = game.moves + 1;
    if (game.cards[open[0]] === game.cards[open[1]]) {
      const matched = [...game.matched, ...open],
        finished = matched.length === game.cards.length;
      set(`${pcPath}.pairs`, {
        ...game,
        open: [],
        matched,
        moves,
        running: !finished,
        best: finished
          ? game.best == null
            ? moves
            : Math.min(game.best, moves)
          : game.best,
      });
    } else {
      set(`${pcPath}.pairs`, { ...game, open, moves });
      setTimeout(() => set(`${pcPath}.pairs.open`, []), 650);
    }
  };
  return (
    <div className="game-app pairs-game">
      <header>
        <b>Circuit Pairs</b>
        <span>
          Moves {game.moves} · Best {game.best ?? "—"}
        </span>
        <button onClick={restart}>
          {game.running ? "Restart" : "New game"}
        </button>
      </header>
      <div className="pairs-grid">
        {game.cards.map((value, index) => {
          const revealed =
            game.open.includes(index) || game.matched.includes(index);
          return (
            <button
              className={revealed ? "revealed" : ""}
              disabled={!game.running || game.matched.includes(index)}
              aria-label={`Circuit card ${index + 1}${revealed ? ` value ${value}` : " hidden"}`}
              onClick={() => choose(index)}
              key={index}
            >
              {revealed ? ["◉", "△", "◇", "⌁"][value - 1] : "?"}
            </button>
          );
        })}
      </div>
      <p>
        Match all four circuit symbols. Buttons support mouse, touch, Tab and
        Enter.
      </p>
    </div>
  );
}

function Installer() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    w = pc.desktop.windows.find((x) => x.id === pc.desktop.activeWindow),
    item = pc.filesystem.items.find((x) => x.id === w?.payload?.fileId);
  let pkg;
  try {
    pkg = JSON.parse(item?.content || "");
  } catch {}
  if (!pkg || !pkg.id)
    return (
      <div className="installer invalid">
        <b>Invalid Antoid Installer Package</b>
        <p>The .ant metadata cannot be verified.</p>
      </div>
    );
  const incompatible = Number(pkg.minOS) > 7 || !pkg.app || !pkg.version;
  const installed = !!pc.installedPackages[pkg.id];
  const install = () => {
    if (incompatible) return;
    set(
      `${pcPath}.installedApps`,
      pc.installedApps.includes(pkg.app)
        ? pc.installedApps
        : [...pc.installedApps, pkg.app],
    );
    set(`${pcPath}.installedPackages`, {
      ...pc.installedPackages,
      [pkg.id]: {
        id: pkg.id,
        app: pkg.app,
        version: pkg.version,
        publisher: pkg.publisher,
        installedAt: Date.now(),
      },
    });
    set(`${pcPath}.fileAssociations`, {
      ...pc.fileAssociations,
      ...Object.fromEntries(
        (pkg.associations || []).map((extension) => [extension, pkg.app]),
      ),
    });
  };
  const uninstall = () => {
    const packages = { ...pc.installedPackages };
    delete packages[pkg.id];
    set(`${pcPath}.installedPackages`, packages);
    set(
      `${pcPath}.installedApps`,
      pc.installedApps.filter((x) => x !== pkg.app),
    );
    set(
      `${pcPath}.fileAssociations`,
      Object.fromEntries(
        Object.entries(pc.fileAssociations).filter(
          ([, app]) => app !== pkg.app,
        ),
      ),
    );
  };
  return (
    <div className="installer">
      <div className="installer-logo">A</div>
      <h2>{pkg.name}</h2>
      <p>
        {pkg.publisher} · version {pkg.version}
      </p>
      <dl>
        <dt>Package ID</dt>
        <dd>{pkg.id}</dd>
        <dt>Requires</dt>
        <dd>Antoid OS {pkg.minOS}+</dd>
        <dt>Permissions</dt>
        <dd>{(pkg.permissions || []).join(", ") || "None"}</dd>
        <dt>Files</dt>
        <dd>{(pkg.files || []).length} packaged asset(s)</dd>
        <dt>Associations</dt>
        <dd>{(pkg.associations || []).join(", ") || "None"}</dd>
        <dt>Signature</dt>
        <dd>
          {pkg.signature
            ? "Antoid package metadata verified"
            : "Unsigned simulated package"}
        </dd>
      </dl>
      {incompatible && (
        <p className="error">This package is incompatible with Antoid OS 7.</p>
      )}
      <button disabled={installed || incompatible} onClick={install}>
        {installed ? "Installed" : "Install package"}
      </button>
      <button
        disabled={
          !installed || ["files", "browser", "settings"].includes(pkg.app)
        }
        onClick={uninstall}
      >
        Uninstall
      </button>
    </div>
  );
}
function PartsStore() {
  const { state, set } = useOS(),
    pc = state.lab.supcer;
  return (
    <div className="parts-store">
      <p>Simulated inventory · no real-money purchase</p>
      {Object.values(SUPCER_PARTS)
        .filter((x) => x.price)
        .map((p) => (
          <article key={p.id}>
            <div>
              <b>
                {p.brand} {p.name}
              </b>
              <span>
                {p.advertised || p.actual || `${p.category} component`} ·{" "}
                {p.price.toLocaleString()} Ft simulated
              </span>
            </div>
            <button
              disabled={pc.inventory.includes(p.id)}
              onClick={() =>
                set(`${pcPath}.inventory`, [...pc.inventory, p.id])
              }
            >
              {pc.inventory.includes(p.id) ? "In inventory" : "Acquire"}
            </button>
          </article>
        ))}
    </div>
  );
}

function AppContent({ app }) {
  return app === "files" ? (
    <FileManager />
  ) : app === "browser" ? (
    <BrowserApp />
  ) : app === "paint" ? (
    <PaintApp />
  ) : app === "sketch-tools" ? (
    <PaintApp />
  ) : app === "media" ? (
    <Media />
  ) : app === "text" ? (
    <TextApp />
  ) : app === "calculator" ? (
    <Calculator />
  ) : app === "system" ? (
    <SystemInfo />
  ) : app === "tasks" ? (
    <TaskMonitor />
  ) : app === "settings" ? (
    <Settings />
  ) : app === "orbital" ? (
    <Game />
  ) : app === "pairs" ? (
    <CircuitPairs />
  ) : app === "installer" ? (
    <Installer />
  ) : app === "store" ? (
    <PartsStore />
  ) : (
    <p>Application unavailable.</p>
  );
}

function openAppWindow(state, set, app, payload = {}) {
  const pc = state.lab.supcer,
    existing = pc.desktop.windows.find((w) => w.app === app);
  if (existing) {
    set(
      `${pcPath}.desktop.windows`,
      pc.desktop.windows.map((w) =>
        w.id === existing.id
          ? {
              ...w,
              minimized: false,
              z: pc.desktop.nextZ,
              payload: { ...w.payload, ...payload },
            }
          : w,
      ),
    );
    set(`${pcPath}.desktop.activeWindow`, existing.id);
    set(`${pcPath}.desktop.nextZ`, pc.desktop.nextZ + 1);
    return;
  }
  const id = uid();
  set(`${pcPath}.desktop.windows`, [
    ...pc.desktop.windows,
    {
      id,
      app,
      x: 80 + pc.desktop.windows.length * 28,
      y: 55 + pc.desktop.windows.length * 24,
      w: Math.min(780, window.innerWidth * 0.58),
      h: Math.min(560, window.innerHeight * 0.62),
      z: pc.desktop.nextZ,
      minimized: false,
      maximized: false,
      payload,
    },
  ]);
  set(`${pcPath}.desktop.activeWindow`, id);
  set(`${pcPath}.desktop.nextZ`, pc.desktop.nextZ + 1);
  set(`${pcPath}.desktop.startOpen`, false);
}

function Window({ win }) {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    drag = useRef(null);
  const focus = () => {
    set(
      `${pcPath}.desktop.windows`,
      pc.desktop.windows.map((w) =>
        w.id === win.id ? { ...w, z: pc.desktop.nextZ } : w,
      ),
    );
    set(`${pcPath}.desktop.activeWindow`, win.id);
    set(`${pcPath}.desktop.nextZ`, pc.desktop.nextZ + 1);
  };
  const pointer = (e) => {
    if (win.maximized) return;
    focus();
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    set(
      `${pcPath}.desktop.windows`,
      pc.desktop.windows.map((w) =>
        w.id === win.id
          ? {
              ...w,
              x: Math.max(0, e.clientX - drag.current.dx),
              y: Math.max(0, e.clientY - drag.current.dy),
            }
          : w,
      ),
    );
  };
  if (win.minimized) return null;
  return (
    <section
      className={`os7-window ${win.maximized ? "maximized" : ""} ${pc.desktop.activeWindow === win.id ? "focused" : ""}`}
      style={
        win.maximized
          ? { zIndex: win.z }
          : {
              left: win.x,
              top: win.y,
              width: win.w,
              height: win.h,
              zIndex: win.z,
            }
      }
      onPointerDown={focus}
    >
      <header
        onPointerDown={pointer}
        onPointerMove={move}
        onPointerUp={() => (drag.current = null)}
      >
        <span>{APPS[win.app]?.[1]}</span>
        <b>{APPS[win.app]?.[0]}</b>
        <div>
          <button
            aria-label="Minimize"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              set(
                `${pcPath}.desktop.windows`,
                pc.desktop.windows.map((w) =>
                  w.id === win.id ? { ...w, minimized: true } : w,
                ),
              )
            }
          >
            —
          </button>
          <button
            aria-label={win.maximized ? "Restore" : "Maximize"}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              set(
                `${pcPath}.desktop.windows`,
                pc.desktop.windows.map((w) =>
                  w.id === win.id ? { ...w, maximized: !w.maximized } : w,
                ),
              )
            }
          >
            {win.maximized ? "❐" : "□"}
          </button>
          <button
            aria-label="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() =>
              set(
                `${pcPath}.desktop.windows`,
                pc.desktop.windows.filter((w) => w.id !== win.id),
              )
            }
          >
            ×
          </button>
        </div>
      </header>
      <div className="window-content">
        <AppContent app={win.app} />
      </div>
      {!win.maximized && (
        <div
          className="resize-grip"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = {
              resize: true,
              sx: e.clientX,
              sy: e.clientY,
              w: win.w,
              h: win.h,
            };
          }}
          onPointerMove={(e) => {
            if (!drag.current?.resize) return;
            set(
              `${pcPath}.desktop.windows`,
              pc.desktop.windows.map((w) =>
                w.id === win.id
                  ? {
                      ...w,
                      w: Math.max(
                        360,
                        drag.current.w + e.clientX - drag.current.sx,
                      ),
                      h: Math.max(
                        260,
                        drag.current.h + e.clientY - drag.current.sy,
                      ),
                    }
                  : w,
              ),
            );
          }}
          onPointerUp={() => (drag.current = null)}
        />
      )}
    </section>
  );
}

function Desktop() {
  const { state, set } = useOS(),
    pc = state.lab.supcer;
  const apps = Object.keys(APPS).filter(
    (x) => pc.installedApps.includes(x) || x === "store",
  );
  if (pc.desktop.locked)
    return (
      <div
        className="os7-lock"
        onClick={() => set(`${pcPath}.desktop.locked`, false)}
      >
        <div>A</div>
        <h2>{pc.desktop.user}</h2>
        <p>Click to unlock · Antoid OS 7</p>
        <time>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    );
  return (
    <div
      className={`os7-desktop wallpaper-${pc.desktop.wallpaper}`}
      style={{ "--os7-accent": pc.desktop.accent }}
      onClick={() =>
        pc.desktop.startOpen && set(`${pcPath}.desktop.startOpen`, false)
      }
    >
      <div className="desktop-icons">
        {apps.slice(0, 6).map((app) => (
          <button
            onDoubleClick={() => openAppWindow(state, set, app)}
            key={app}
          >
            <i>{APPS[app][1]}</i>
            <span>{APPS[app][0]}</span>
          </button>
        ))}
      </div>
      {pc.desktop.windows.map((w) => (
        <Window win={w} key={w.id} />
      ))}
      {pc.desktop.startOpen && (
        <div className="os7-start" onClick={(e) => e.stopPropagation()}>
          <header>
            <div>A</div>
            <b>{pc.desktop.user}</b>
          </header>
          <div>
            {apps.map((app) => (
              <button onClick={() => openAppWindow(state, set, app)} key={app}>
                <i>{APPS[app][1]}</i>
                {APPS[app][0]}
              </button>
            ))}
          </div>
          <footer>
            <button onClick={() => set(`${pcPath}.desktop.locked`, true)}>
              Lock
            </button>
            <button
              onClick={() => {
                set(`${pcPath}.power`, "shutting");
                set(`${pcPath}.bootStage`, "shutting");
              }}
            >
              Shut down
            </button>
          </footer>
        </div>
      )}
      <footer className="os7-taskbar">
        <button
          className="start-orb"
          onClick={(e) => {
            e.stopPropagation();
            set(`${pcPath}.desktop.startOpen`, !pc.desktop.startOpen);
          }}
        >
          A
        </button>
        {pc.desktop.windows.map((w) => (
          <button
            className={
              pc.desktop.activeWindow === w.id && !w.minimized ? "active" : ""
            }
            onClick={() => {
              set(
                `${pcPath}.desktop.windows`,
                pc.desktop.windows.map((x) =>
                  x.id === w.id
                    ? {
                        ...x,
                        minimized:
                          pc.desktop.activeWindow === w.id && !w.minimized,
                      }
                    : x,
                ),
              );
              set(`${pcPath}.desktop.activeWindow`, w.id);
            }}
            key={w.id}
          >
            {APPS[w.app][1]} {APPS[w.app][0]}
          </button>
        ))}
        <div className="os7-tray">
          <button
            onClick={() => set(`${pcPath}.desktop.muted`, !pc.desktop.muted)}
          >
            {pc.desktop.muted ? "🔇" : "♫"}
          </button>
          <span>{pc.cables.ethernet ? "▣" : "⌁"}</span>
          <span>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Interior() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    f = supcerFacts(pc),
    [drag, setDrag] = useState(null);
  const inventory = pc.inventory.map((id) => SUPCER_PARTS[id]).filter(Boolean);
  const installRam = (id, slot) => {
    const p = SUPCER_PARTS[id];
    if (pc.power !== "off" || !pc.latches.ram[slot]) {
      set(
        `${pcPath}.bootMessage`,
        "Shut down and open the RAM retention clip before installation.",
      );
      return;
    }
    if (p.category !== "memory" || p.generation !== f.board?.ramGeneration) {
      set(
        `${pcPath}.bootMessage`,
        `${p.name} is incompatible with ${f.board?.ramGeneration} slots.`,
      );
      return;
    }
    const slots = [...pc.hardware.ramSlots];
    const previous = slots[slot];
    slots[slot] = id;
    set(`${pcPath}.hardware.ramSlots`, slots);
    set(`${pcPath}.inventory`, [
      ...pc.inventory.filter((x) => x !== id),
      ...(previous ? [previous] : []),
    ]);
  };
  const installPart = (id, category, hardwareKey, safe, instruction) => {
    const part = SUPCER_PARTS[id];
    if (!part || part.category !== category) return;
    if (pc.power !== "off" || !safe) {
      set(`${pcPath}.bootMessage`, instruction);
      return;
    }
    const previous = pc.hardware[hardwareKey];
    set(`${pcPath}.hardware.${hardwareKey}`, id);
    set(`${pcPath}.inventory`, [
      ...pc.inventory.filter((candidate) => candidate !== id),
      ...(previous ? [previous] : []),
    ]);
  };
  const removeRam = (slot) => {
    if (!pc.latches.ram[slot] || pc.power !== "off") return;
    const slots = [...pc.hardware.ramSlots],
      id = slots[slot];
    if (!id) return;
    slots[slot] = null;
    set(`${pcPath}.hardware.ramSlots`, slots);
    set(`${pcPath}.inventory`, [...pc.inventory, id]);
  };
  const cable = (key, label) => (
    <button
      aria-label={`${pc.cables[key] ? "Disconnect" : "Connect"} ${label}`}
      className={`internal-plug ${pc.cables[key] ? "connected" : ""}`}
      onClick={() => set(`${pcPath}.cables.${key}`, !pc.cables[key])}
    >
      <i />
      {label}
    </button>
  );
  return (
    <div className="sup-interior">
      <div className="motherboard">
        <b>ANTOИD OFFICEBOARD AN5-D4</b>
        <div className="cpu-socket">
          <span>{f.cpu ? "A5-560G" : "EMPTY CPU SOCKET"}</span>
          <button
            aria-label="CPU cooler latch"
            className={pc.latches.cooler ? "open" : ""}
            onClick={() => set(`${pcPath}.latches.cooler`, !pc.latches.cooler)}
          >
            COOLER LATCH
          </button>
          <i
            className={pc.hardware.fans.cpu ? "fan spin" : "fan"}
            onClick={() =>
              set(`${pcPath}.hardware.fans.cpu`, !pc.hardware.fans.cpu)
            }
          />
        </div>
        <div className="ram-bank">
          {pc.hardware.ramSlots.map((id, i) => (
            <div
              className="ram-slot"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drag && installRam(drag, i)}
              key={i}
            >
              <button
                aria-label={`RAM slot ${i + 1} retention clip`}
                className={pc.latches.ram[i] ? "open" : ""}
                onClick={() => {
                  const a = [...pc.latches.ram];
                  a[i] = !a[i];
                  set(`${pcPath}.latches.ram`, a);
                }}
              />
              <div
                draggable={!!id && pc.latches.ram[i]}
                onDragStart={() => setDrag(id)}
                onDragEnd={() => removeRam(i)}
                className={id ? "ram-module" : "ram-empty"}
              >
                {id
                  ? `${SUPCER_PARTS[id].capacity} GB ${SUPCER_PARTS[id].generation}`
                  : "EMPTY"}
              </div>
            </div>
          ))}
        </div>
        <div
          className="pcie-slot"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            const p = SUPCER_PARTS[drag];
            if (p?.interface !== "PCIe") return;
            installPart(
              drag,
              "graphics",
              "gpu",
              pc.latches.pcie && !pc.cables.gpuPower,
              "Shut down, open the PCIe latch, and disconnect GPU power before installation.",
            );
          }}
        >
          <span>PCIe x16</span>
          {f.discrete ? (
            <div
              draggable={pc.latches.pcie}
              onDragStart={() => setDrag(f.discrete.id)}
              onDragEnd={() => {
                if (
                  pc.latches.pcie &&
                  pc.power === "off" &&
                  !pc.cables.gpuPower
                ) {
                  set(`${pcPath}.hardware.gpu`, null);
                  set(`${pcPath}.inventory`, [...pc.inventory, f.discrete.id]);
                }
              }}
              className="gpu-card"
            >
              {f.discrete.name}
            </div>
          ) : (
            <i>DROP COMPATIBLE GPU HERE</i>
          )}
          <button
            aria-label="PCIe retention latch"
            className={pc.latches.pcie ? "open" : ""}
            onClick={() => set(`${pcPath}.latches.pcie`, !pc.latches.pcie)}
          >
            LATCH
          </button>
        </div>
        {cable("boardPower", "24-PIN ATX")}
        {cable("cpuPower", "CPU 8-PIN")}
        {f.discrete && cable("gpuPower", "GPU POWER")}
      </div>
      <div
        className="drive-cage"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() =>
          installPart(
            drag,
            "storage",
            "storage",
            !pc.cables.sataData && !pc.cables.sataPower,
            "Shut down and disconnect SATA data and power before changing the drive.",
          )
        }
      >
        <b>{f.storage?.name || "EMPTY DRIVE BAY"}</b>
        {cable("sataData", "SATA DATA")}
        {cable("sataPower", "SATA POWER")}
      </div>
      <div
        className="psu-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() =>
          installPart(
            drag,
            "psu",
            "psu",
            !pc.cables.ac && !pc.cables.boardPower && !pc.cables.cpuPower,
            "Shut down and disconnect AC, 24-pin ATX, and CPU power before changing the PSU.",
          )
        }
      >
        <b>{f.psu?.name}</b>
        <span>
          {f.draw} W load / {f.psu?.watts} W
        </span>
      </div>
      <div
        className="cooler-bay"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() =>
          installPart(
            drag,
            "cooling",
            "cooler",
            pc.latches.cooler && !pc.hardware.fans.cpu,
            "Shut down, open the cooler latch, and disconnect the CPU fan first.",
          )
        }
      >
        <b>{SUPCER_PARTS[pc.hardware.cooler]?.name}</b>
        <span>CPU COOLER MOUNT</span>
      </div>
      <div className="parts-inventory">
        <b>PARTS MAT</b>
        <small>Drag compatible hardware to a visible socket.</small>
        {inventory.map((p) => (
          <div
            draggable
            onDragStart={() => setDrag(p.id)}
            onDragEnd={() => setDrag(null)}
            key={p.id}
          >
            <strong>{p.brand}</strong>
            {p.name}
            <em>{p.advertised || p.actual || p.category}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhysicalPC() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    f = supcerFacts(pc);
  return (
    <div className="sup-physical">
      <div className="sup-tower">
        <div className="tower-front">
          <b>ANTOИD</b>
          <button
            aria-label="SUPCer physical power button"
            className={pc.power !== "off" ? "on" : ""}
            onClick={() => {
              if (["off", "sleep", "failed"].includes(pc.power)) {
                set(`${pcPath}.power`, "starting");
                set(`${pcPath}.bootStage`, "starting");
                set(`${pcPath}.bootStartedAt`, Date.now());
              } else if (pc.power === "running") {
                set(`${pcPath}.power`, "shutting");
                set(`${pcPath}.bootStage`, "shutting");
              }
            }}
          >
            ⏻
          </button>
          <i className={`power-led ${pc.power !== "off" ? "on" : ""}`} />
          <i className={`disk-led ${pc.power === "booting" ? "active" : ""}`} />
          <span>USB</span>
          <span>USB</span>
          <span>◉ AUDIO</span>
        </div>
        <div className="tower-side">
          <button
            aria-label={
              pc.sidePanel === "open"
                ? "Slide and close case side panel"
                : "Release and slide case side panel"
            }
            onClick={() =>
              set(
                `${pcPath}.sidePanel`,
                pc.sidePanel === "open" ? "closed" : "open",
              )
            }
            className={`side-panel panel-${pc.sidePanel}`}
          >
            <i />
            <b>{pc.sidePanel === "open" ? "OPEN CHASSIS" : "ANTOИD SUPCer"}</b>
          </button>
          {pc.sidePanel === "open" && <Interior />}
        </div>
        <div className="tower-rear">
          <b>REAR I/O</b>
          {[
            ["ac", "AC IN"],
            ["display", "DISPLAY"],
            ["ethernet", "ETHERNET"],
            ["keyboard", "KEYBOARD USB"],
            ["mouse", "MOUSE USB"],
          ].map(([key, label]) => (
            <button
              className={pc.cables[key] ? "connected" : ""}
              aria-label={`${pc.cables[key] ? "Unplug" : "Plug in"} ${label}`}
              onClick={() => set(`${pcPath}.cables.${key}`, !pc.cables[key])}
              key={key}
            >
              <i />
              {label}
            </button>
          ))}
          <button
            className={
              pc.cables.displayPort === "motherboard" ? "selected" : ""
            }
            onClick={() => set(`${pcPath}.cables.displayPort`, "motherboard")}
          >
            Motherboard video
          </button>
          <button
            disabled={!f.discrete}
            className={pc.cables.displayPort === "gpu" ? "selected" : ""}
            onClick={() => set(`${pcPath}.cables.displayPort`, "gpu")}
          >
            GPU video
          </button>
        </div>
      </div>
      <div className="sup-peripherals">
        <button
          aria-label="Keyboard firmware Delete key"
          disabled={!pc.cables.keyboard || !pc.conditions.keyboard}
          onClick={() => {
            set(`${pcPath}.biosRequested`, true);
            if (pc.power === "running") {
              set(`${pcPath}.power`, "restarting");
              set(`${pcPath}.bootStage`, "restarting");
            }
          }}
          className="sup-keyboard"
        >
          <span>Esc</span>
          <span>F1 F2 F3 F4</span>
          <b>DEL · BIOS</b>
          <i>Q W E R T Y U I O P</i>
          <i>A S D F G H J K L</i>
          <i>Z X C V B N M</i>
        </button>
        <button
          aria-label="Mouse primary button"
          disabled={!pc.cables.mouse || !pc.conditions.mouse}
          className="sup-mouse"
          onClick={() => set(`${pcPath}.bootMessage`, "Mouse input verified")}
        />
      </div>
    </div>
  );
}

function Controller() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    [tab, setTab] = useState("System");
  const c = pc.conditions,
    router = state.lab.router;
  return (
    <aside className="sup-controller">
      <header>
        <em>LIVE</em>
        <div>
          <b>SUPCer Controller Lab</b>
          <span>Authoritative PC, thermal and network controls</span>
        </div>
      </header>
      <nav>
        {[
          "System",
          "CPU",
          "Memory",
          "Storage",
          "Graphics",
          "Cooling",
          "Network",
          "Monitor",
          "Peripherals",
          "Boot",
        ].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      <section>
        {tab === "System" && (
          <>
            <Toggle
              label="External AC available"
              checked={c.ac}
              onChange={(v) => set(`${pcPath}.conditions.ac`, v)}
            />
            <Slider
              label="PSU condition"
              value={c.psuHealth}
              onChange={(v) => set(`${pcPath}.conditions.psuHealth`, v)}
              unit="%"
            />
            <Slider
              label="Motherboard condition"
              value={c.motherboardHealth}
              onChange={(v) => set(`${pcPath}.conditions.motherboardHealth`, v)}
              unit="%"
            />
            <button onClick={() => set(pcPath, createSUPCerState())}>
              Factory-reset SUPCer
            </button>
          </>
        )}
        {tab === "CPU" && (
          <>
            <Slider
              label="CPU workload"
              value={c.cpuLoad}
              onChange={(v) => set(`${pcPath}.conditions.cpuLoad`, v)}
              unit="%"
            />
            <Slider
              label="Ambient temperature"
              value={c.ambient}
              min={5}
              max={50}
              onChange={(v) => set(`${pcPath}.conditions.ambient`, v)}
              unit="°C"
            />
            <p>Detected temperature: {supcerFacts(pc).temperature} °C</p>
          </>
        )}
        {tab === "Memory" && (
          <>
            <Slider
              label="Injected memory errors"
              value={c.memoryErrors}
              max={1000}
              onChange={(v) => set(`${pcPath}.conditions.memoryErrors`, v)}
            />
            <p>BIOS detects {supcerFacts(pc).memoryGb} GB usable memory.</p>
          </>
        )}
        {tab === "Storage" && (
          <>
            <Slider
              label="SSD health"
              value={c.ssdHealth}
              onChange={(v) => set(`${pcPath}.conditions.ssdHealth`, v)}
              unit="%"
            />
            <Toggle
              label="Storage corruption"
              checked={c.storageCorruption}
              onChange={(v) => set(`${pcPath}.conditions.storageCorruption`, v)}
            />
            <p>
              SATA data: {pc.cables.sataData ? "connected" : "open"} · power:{" "}
              {pc.cables.sataPower ? "connected" : "open"}
            </p>
          </>
        )}
        {tab === "Graphics" && (
          <>
            <Toggle
              label="Graphics fault"
              checked={c.graphicsFault}
              onChange={(v) => set(`${pcPath}.conditions.graphicsFault`, v)}
            />
            <p>
              Active route: {pc.cables.displayPort} ·{" "}
              {supcerFacts(pc).graphicsOutput?.name || "no output"}
            </p>
          </>
        )}
        {tab === "Cooling" && (
          <>
            <Slider
              label="Fan condition"
              value={c.fanHealth}
              onChange={(v) => set(`${pcPath}.conditions.fanHealth`, v)}
              unit="%"
            />
            <Slider
              label="Dust level"
              value={c.dust}
              onChange={(v) => set(`${pcPath}.conditions.dust`, v)}
              unit="%"
            />
            <Toggle
              label="CPU fan connected"
              checked={pc.hardware.fans.cpu}
              onChange={(v) => set(`${pcPath}.hardware.fans.cpu`, v)}
            />
          </>
        )}
        {tab === "Network" && (
          <>
            <Toggle
              label="ANRouter WAN"
              checked={router.wan}
              onChange={(v) => set("lab.router.wan", v)}
            />
            <Toggle
              label="ANRouter Wi-Fi"
              checked={router.wifiEnabled}
              onChange={(v) => set("lab.router.wifiEnabled", v)}
            />
            <Slider
              label="Signal"
              value={router.conditions.signal}
              onChange={(v) => set("lab.router.conditions.signal", v)}
              unit="%"
            />
            <Slider
              label="Noise"
              value={router.conditions.noise}
              onChange={(v) => set("lab.router.conditions.noise", v)}
              unit="%"
            />
            <Slider
              label="Congestion"
              value={router.conditions.congestion}
              onChange={(v) => set("lab.router.conditions.congestion", v)}
              unit="%"
            />
            <Slider
              label="Latency"
              value={router.conditions.latency}
              max={500}
              onChange={(v) => set("lab.router.conditions.latency", v)}
              unit=" ms"
            />
            <Slider
              label="Bandwidth"
              value={router.conditions.bandwidth}
              max={1000}
              onChange={(v) => set("lab.router.conditions.bandwidth", v)}
              unit=" Mbps"
            />
            <Slider
              label="Packet loss"
              value={router.conditions.packetLoss}
              onChange={(v) => set("lab.router.conditions.packetLoss", v)}
              unit="%"
            />
            <Slider
              label="Reliability ceiling"
              value={router.conditions.reliability}
              onChange={(v) => set("lab.router.conditions.reliability", v)}
              unit="%"
            />
          </>
        )}
        {tab === "Monitor" && (
          <>
            <Toggle
              label="Monitor condition fault"
              checked={pc.monitor.fault}
              onChange={(v) => set(`${pcPath}.monitor.fault`, v)}
            />
            <Slider
              label="Panel condition"
              value={pc.monitor.condition}
              onChange={(v) => set(`${pcPath}.monitor.condition`, v)}
              unit="%"
            />
            <p>Signal state: {monitorState(pc)}</p>
          </>
        )}
        {tab === "Peripherals" && (
          <>
            <Toggle
              label="Keyboard available"
              checked={c.keyboard}
              onChange={(v) => set(`${pcPath}.conditions.keyboard`, v)}
            />
            <Toggle
              label="Mouse available"
              checked={c.mouse}
              onChange={(v) => set(`${pcPath}.conditions.mouse`, v)}
            />
            <Toggle
              label="USB controller fault"
              checked={c.usbFault}
              onChange={(v) => set(`${pcPath}.conditions.usbFault`, v)}
            />
          </>
        )}
        {tab === "Boot" && (
          <>
            <label>
              POST fault
              <select
                value={c.postFault}
                onChange={(e) =>
                  set(`${pcPath}.conditions.postFault`, e.target.value)
                }
              >
                <option value="none">No injected fault</option>
                <option value="keyboard controller fault">
                  Keyboard controller fault
                </option>
                <option value="firmware checksum fault">
                  Firmware checksum fault
                </option>
              </select>
            </label>
            <button
              onClick={() => {
                set(`${pcPath}.biosRequested`, true);
                set(`${pcPath}.power`, "restarting");
                set(`${pcPath}.bootStage`, "restarting");
              }}
            >
              Restart into BIOS
            </button>
            <p>{pc.bootMessage}</p>
          </>
        )}
      </section>
    </aside>
  );
}

export function SUPCerScene() {
  const { state, set } = useOS(),
    pc = state.lab.supcer,
    facts = useMemo(() => supcerFacts(pc), [pc]);
  useEffect(() => {
    let t;
    if (pc.power === "starting" && pc.bootStage === "starting")
      t = setTimeout(() => set(`${pcPath}.bootStage`, "post"), 600);
    else if (pc.power === "starting" && pc.bootStage === "post")
      t = setTimeout(() => {
        if (pc.biosRequested) {
          set(`${pcPath}.biosOpen`, true);
          set(`${pcPath}.power`, "bios");
        } else if (!facts.canPost) {
          set(`${pcPath}.power`, "failed");
          set(`${pcPath}.bootMessage`, facts.postErrors.join(" · "));
        } else set(`${pcPath}.bootStage`, "firmware");
      }, 700);
    else if (pc.power === "starting" && pc.bootStage === "firmware")
      t = setTimeout(
        () =>
          facts.canBoot
            ? set(`${pcPath}.bootStage`, "booting")
            : (set(`${pcPath}.power`, "failed"),
              set(`${pcPath}.bootMessage`, "NO BOOTABLE DEVICE")),
        700,
      );
    else if (pc.power === "starting" && pc.bootStage === "booting")
      t = setTimeout(() => set(`${pcPath}.bootStage`, "login"), 900);
    else if (pc.power === "starting" && pc.bootStage === "login")
      t = setTimeout(() => {
        set(`${pcPath}.power`, "running");
        set(`${pcPath}.bootStage`, "running");
      }, 700);
    else if (pc.power === "restarting")
      t = setTimeout(() => {
        set(`${pcPath}.power`, "starting");
        set(`${pcPath}.bootStage`, "post");
      }, 700);
    else if (pc.power === "shutting")
      t = setTimeout(() => {
        set(`${pcPath}.power`, "off");
        set(`${pcPath}.bootStage`, "off");
      }, 800);
    return () => clearTimeout(t);
  }, [pc.power, pc.bootStage, pc.biosRequested, facts.canPost, facts.canBoot]);
  return (
    <main className="supcer-lab">
      <header className="sup-top">
        <button onClick={() => set("lab.activeDevice", "welcome")}>
          ← Antoid Lab
        </button>
        <div>
          <b>Antoid SUPCer</b>
          <span>Antoid OS Edition · Antoid Lab v5.0.0 Public Beta</span>
        </div>
        <em>PUBLIC BETA</em>
      </header>
      <div className="sup-workspace">
        <section>
          <div className="sup-desk">
            <Monitor>
              {pc.biosOpen ? (
                <BIOS />
              ) : pc.power === "running" ? (
                <Desktop />
              ) : (
                <BootDisplay />
              )}
            </Monitor>
            <PhysicalPC />
          </div>
        </section>
        <Controller />
      </div>
    </main>
  );
}
