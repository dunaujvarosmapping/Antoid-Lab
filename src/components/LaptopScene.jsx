import React, { useEffect, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { ANTOID_SYSTEM } from "../config/version.js";
import {
  COMPONENT_DEFINITIONS,
  diagnoseHardware,
  hardwareCapabilities,
} from "../services/hardware.js";
import { Button } from "./UI.jsx";
import { calculateFMReception, formatFMFrequency } from "../services/fm.js";
import { batteryModel, formatRuntime } from "../services/battery.js";

function LaptopUnboxing() {
  const { state, dispatch } = useOS();
  const stage = state.laptop.unboxing.stage;
  const copy = [
    [
      "Antoid Notebook",
      "Break the pull tab on the notebook shipping case.",
      "Open shipping case",
    ],
    [
      "Precision aluminium",
      "Lift the Antoid notebook from its protective cradle.",
      "Lift notebook",
    ],
    [
      "Desktop power kit",
      "Unpack the compact charger and braided cable.",
      "Unpack charger",
    ],
    [
      "Antoid OS 3.1 for Laptop",
      "Open the lid and place the notebook on the laboratory desk.",
      "Place on desk",
    ],
  ][Math.min(stage, 3)];
  return (
    <div className={`laptop-unboxing stage-${stage}`}>
      <button
        className="device-return"
        onClick={() =>
          dispatch({ type: "SET", path: "deskView", value: "phone" })
        }
      >
        ← Antoid 1 phone
      </button>
      <div className="notebook-box">
        <i>ANTOИD</i>
        <div className="boxed-laptop">
          <span />
        </div>
        <div className="laptop-brick">65 W</div>
      </div>
      <div>
        <small>FIRST-EVER NOTEBOOK EXPERIENCE</small>
        <h1>{copy[0]}</h1>
        <p>{copy[1]}</p>
        <Button onClick={() => dispatch({ type: "LAPTOP_UNBOX" })}>
          {copy[2]}
        </Button>
      </div>
    </div>
  );
}

function Forum() {
  const { set } = useOS();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openThread, setOpenThread] = useState(null);
  const [openGuide, setOpenGuide] = useState(null);
  const guides = [
    { title:"Back cover removal", parts:["backCover","seals"], steps:["Power down and warm the rear perimeter evenly.","Lift the back cover without crossing the camera openings.","Remove the old single-use IP68 seal and clean the frame channel."] },
    { title:"Battery isolation and replacement", parts:["batteryBracket","batteryConnector","battery"], steps:["Disconnect external power and remove the battery bracket.","Lift the battery interconnect before applying pull-tab force.","Install an undamaged battery, reconnect telemetry, and refit the retainer."] },
    { title:"Display assembly service", parts:["display","digitizer","displayFlex"], steps:["Disconnect the display flex before separating the panel.","Release the complete panel and digitizer from the front frame.","Seat the replacement flex, test image and touch, then finish adhesive curing."] },
    { title:"USB-C daughterboard", parts:["usbBoard","usbFlex"], steps:["Isolate battery power before touching the port board.","Remove the bottom acoustic bracket and disconnect the USB flex.","Fit the daughterboard, reconnect the flex, then test charging, data and laptop detection."] },
    { title:"Camera modules", parts:["cameraBracket","cameraFlex","wideCamera","ultrawideCamera","telephotoCamera","frontCamera"], steps:["Remove the precision camera retainer without touching lens glass.","Disconnect the shared high-speed flex and lift only the required module.","Align the replacement, reconnect image data, and run all four camera tests."] },
    { title:"Antenna and RF path", parts:["cellularAntenna","wifiAntenna","gpsAntenna","antennaInterconnect"], steps:["Disconnect battery power and release coax heads vertically.","Replace the damaged antenna or RF interconnect without kinking it.","Seat every coax connector and verify cellular, Wi-Fi and GNSS diagnostics."] },
    { title:"Storage replacement", parts:["mainboardShield","storage"], steps:["Back up recoverable user data before beginning.","Remove the EMI shield and lift the replaceable storage module.","Install approved storage, verify actual capacity and reinstall Antoid OS."] },
    { title:"Frame replacement", parts:["frame"], steps:["Remove the display, rear cover and every attached internal module.","Transfer parts into the Plastic, Aluminum or Titanium service frame.","Verify alignment, button travel, antennas and enclosure rigidity."] },
    { title:"Water-damage response", parts:["seals","usbBoard","battery","mainboard"], steps:["Disconnect all power immediately; do not attempt charging.","Drain standing water and inspect bottom-up ingress exposure.","Replace corroded parts and seals, then run diagnostics before power-on."] },
    { title:"Final reassembly", parts:["batteryConnector","mainboardShield","seals","backCover"], steps:["Confirm every connector, bracket and shield is seated.","Run hardware diagnostics before applying a fresh perimeter seal.","Close the cover under even pressure and complete the final USB/radio test."] },
  ];
  const threads = [
    { title:"Antenna replacement field notes",category:"Hardware",author:"MiraTech",body:"I measured the Genuine four-element antenna, Supra Beam and foil budget part through three handovers. Supra gained 3 dB without changing the modem.",replies:["Confirming the same result on Tower B.","Remember that a damaged coax connector can erase the gain."] },
    { title:"Antoid OS 3 teardown checklist",category:"Repairs",author:"ServiceVan_7",body:"Power down, remove the back cover, isolate the battery, then disconnect board flexes. Always fit a fresh IP68 seal before closing.",replies:["This saved my charging board.","The physical cavities make missing parts much easier to spot."] },
    { title:"Street Light storm challenge",category:"Street Lights",author:"NightShift",body:"Can anyone keep eight mercury and sodium lamps alive in a maximum storm? My weak pole leaned before the breaker tripped.",replies:["A titanium pole survives longer.","Replace the wet fuse and reset the circuit only after the rain clears."] },
    { title:"USB4 service bridge benchmarks",category:"Development",author:"ANKernel",body:"Developer Software reads the negotiated phone USB controller live. A charge-only daughterboard correctly exposes no service link.",replies:["That authority check is important.","Supra board negotiated 40 Gbps here."] },
    { title:"Water ingress after cracked rear glass",category:"Water Damage",author:"FixItHU",body:"A cracked glass cover slowed ingress but did not stop it. The bottom speaker became wet first, followed by USB and the battery cavity.",replies:["Drain removes standing water, not corrosion.","Disconnecting power reduced the permanent damage."] },
  ].filter((thread) => (category === "All" || thread.category === category) && Object.values(thread).flat().join(" ").toLowerCase().includes(query.toLowerCase()));
  if (openGuide) return (
    <div className="laptop-window forum-window official-guide">
      <header><button onClick={() => setOpenGuide(null)}>← Guides</button><b>Official Antoid Repair Guides</b><button className="window-close" onClick={() => set("laptop.app", null)}>Close</button></header>
      <article>
        <i>OFFICIAL · ANTOID 1</i><h2>{openGuide.title}</h2>
        <div className="guide-components">{openGuide.parts.map(id => <section key={id}><b>{id.replace(/([A-Z])/g," $1")}</b><p>{COMPONENT_DEFINITIONS[id]?.description}</p></section>)}</div>
        <ol>{openGuide.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <strong>Finish by running Hardware Test and reviewing Events in Developer Software.</strong>
      </article>
    </div>
  );
  if (openThread) return (
    <div className="laptop-window forum-window forum-thread">
      <header><button onClick={() => setOpenThread(null)}>← Back</button><b>community.antoid.local / {openThread.category}</b><button className="window-close" onClick={() => set("laptop.app", null)}>Close</button></header>
      <article className="forum-post"><i>{openThread.category}</i><div><h2>{openThread.title}</h2><small>{openThread.author} · local service community</small><p>{openThread.body}</p></div></article>
      <h3>{openThread.replies.length} replies</h3>
      {openThread.replies.map((reply,index) => <article className="forum-reply" key={reply}><b>{["AntFan88","FieldEngineer"][index]}</b><p>{reply}</p></article>)}
    </div>
  );
  return (
    <div className="laptop-window forum-window">
      <header>
        <b>community.antoid.local</b>
        <input
          placeholder="Search forum"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="window-close" onClick={() => set("laptop.app", null)}>Close</button>
      </header>
      <div className="forum-hero">
        <span>ANTOИD FORUM</span>
        <h2>Build, repair, learn.</h2>
      </div>
      <nav className="forum-categories">{["All","Hardware","Repairs","Water Damage","Development","Street Lights"].map(item => <button className={category===item?"active":""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</nav>
      <section className="official-guides">
        <h3>Official Antoid Repair Guides</h3>
        <div>{guides.map(guide => <button key={guide.title} onClick={() => setOpenGuide(guide)}><b>{guide.title}</b><span>{guide.parts.length} documented component{guide.parts.length === 1 ? "" : "s"}</span></button>)}</div>
      </section>
      {threads.map((thread) => (
        <button className="forum-thread-card" onClick={() => setOpenThread(thread)} key={thread.title}>
          <i>{thread.category}</i>
          <div>
            <b>{thread.title}</b>
            <p>{thread.body}</p>
            <small>{thread.author} · {thread.replies.length} replies</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function DeveloperSoftware() {
  const { state, dispatch } = useOS();
  const [tab, setTab] = useState("Overview");
  const caps = hardwareCapabilities(state);
  const connected = state.laptop.usbConnected && caps.usb;
  const results = diagnoseHardware(state);
  const fm = calculateFMReception(state);
  const battery = batteryModel(state);
  return (
    <div className="laptop-window developer-software">
      <header>
        <b>Developer Software</b>
        <span>Service Bridge 3.1</span>
        <button className="window-close" onClick={() => dispatch({ type:"SET", path:"laptop.app", value:null })}>Close</button>
      </header>
      {connected ? (
        <>
          <div className="device-detected">
            <i>1</i>
            <div>
              <b>Antoid 1 detected</b>
              <span>
                {caps.usbSpecs.standard} · {caps.usbSpecs.speedGbps} Gbps
                negotiated
              </span>
            </div>
          </div>
          <div className="dev-tabs">{["Overview","Hardware","Diagnostics","Storage","Power/Thermal","Connectivity","FM","USB","Events"].map(item => <button className={tab===item?"active":""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
          {tab === "Overview" && <dl><dt>Device</dt><dd>Antoid 1 · Antoid OS {ANTOID_SYSTEM.version}</dd><dt>Phone power</dt><dd>{state.power.mode}</dd><dt>Service status</dt><dd>{results.filter(x=>!x.pass).length ? `${results.filter(x=>!x.pass).length} faults detected` : "All systems operational"}</dd><dt>USB link</dt><dd>{caps.usbSpecs.standard} · {caps.usbSpecs.speedGbps} Gbps</dd></dl>}
          {tab === "Hardware" && <div className="component-report">{Object.values(state.hardware.components).map(part => <article key={part.id}><b>{part.serviceName || part.name}</b><span>{part.manufacturer} · S/N {part.serial}</span><small>{part.description}</small><em className={part.installed&&!part.destroyed?"pass":"fail"}>{part.installed ? `${part.condition.toFixed(0)}%` : "REMOVED"}</em></article>)}</div>}
          {tab === "Diagnostics" && <><div className="laptop-diagnostics">{results.map(result => <span className={result.pass?"pass":"fail"} key={result.name}><b>{result.status}</b>{result.name}<small>{result.detail}</small></span>)}</div><Button onClick={() => dispatch({ type:"HARDWARE_TEST" })}>Run phone hardware test</Button></>}
          {tab === "Storage" && <dl><dt>Module</dt><dd>{state.hardware.components.storage.model || state.hardware.components.storage.serviceName || "Unknown"}</dd><dt>Interface</dt><dd>{state.hardware.components.storage.type}</dd><dt>Advertised</dt><dd>{caps.storageClaimedGb} GB</dd><dt>Actual verified capacity</dt><dd className={caps.storageActualGb < caps.storageClaimedGb ? "danger" : ""}>{caps.storageActualGb} GB</dd><dt>Sequential read/write</dt><dd>{caps.storageReadMbps} / {caps.storageWriteMbps} MB/s</dd></dl>}
          {tab === "Power/Thermal" && <dl><dt>Battery</dt><dd>{caps.battery ? `${state.battery.level.toFixed(1)}% · health ${battery.health.toFixed(1)}%` : "Not installed"}</dd><dt>Design / effective capacity</dt><dd>{caps.battery ? `${battery.designCapacityMah.toFixed(0)} / ${battery.effectiveCapacityMah.toFixed(0)} mAh` : "Not applicable"}</dd><dt>Stored usable charge</dt><dd>{caps.battery ? `${battery.storedChargeMah.toFixed(0)} mAh · ${formatRuntime(battery.estimatedRuntimeMinutes)}` : "Not applicable"}</dd><dt>Equivalent cycles</dt><dd>{state.battery.cycles} + {Math.round((Number(state.battery.cycleProgress) || 0) * 100)}% · aging loss {(Number(state.battery.agingLoss) || 0).toFixed(2)}%</dd><dt>Lifetime throughput</dt><dd>{(Number(state.battery.dischargedThroughputMah) || 0).toFixed(0)} mAh discharged · {(Number(state.battery.chargedThroughputMah) || 0).toFixed(0)} mAh charged</dd><dt>Power source</dt><dd>{caps.externalPower ? "External USB-C power" : caps.battery ? "Battery" : "No power source"}</dd><dt>Battery temperature</dt><dd>{caps.battery ? `${state.hardware.temperatures.battery}°C · ${battery.thermal.state}` : "Not applicable"}</dd><dt>Performance / charging</dt><dd>{battery.thermal.performanceLimit}% · {state.battery.chargeLimitedReason || "No thermal restriction"}</dd><dt>Mainboard / Modem</dt><dd>{state.hardware.temperatures.mainboard}°C / {state.hardware.temperatures.modem}°C</dd><dt>Wired power path</dt><dd>{caps.wiredPowerPath ? `${caps.usbSpecs.chargingWatts} W capable` : "Unavailable"}</dd></dl>}
          {tab === "Connectivity" && <dl><dt>Cellular</dt><dd>{caps.cellular ? caps.supportedGenerations.join(" / ") : "Unavailable"}</dd><dt>Antenna path</dt><dd>{caps.cellularPenaltyDb.toFixed(1)} dB penalty</dd><dt>Wi-Fi / Bluetooth</dt><dd>{caps.wifi ? `${state.hardware.components.wifiModule.wifi} / BT ${state.hardware.components.wifiModule.bluetooth}` : "Unavailable"}</dd><dt>Physical SIM</dt><dd>{caps.simReader && caps.physicalSimTray ? "Dual nano-SIM reader and tray ready" : "Reader or tray unavailable"}</dd><dt>eSIM</dt><dd>{caps.esim ? "Secure element ready" : "Unavailable"}</dd></dl>}
          {tab === "FM" && <dl className="fm-diagnostics"><dt>FM receiver</dt><dd>{fm.receiverAvailable ? `${state.hardware.components.fmReceiver.manufacturer} · ${fm.tunerCondition.toFixed(0)}% condition` : "Missing or unavailable"}</dd><dt>Internal FM antenna</dt><dd>{caps.fmAntenna ? `${state.hardware.components.fmAntenna.manufacturer} · ${state.hardware.components.fmAntenna.condition.toFixed(0)}% condition` : "Missing or unavailable"}</dd><dt>3.5 mm jack</dt><dd>{caps.headphoneJack ? `${state.hardware.components.headphoneJack.condition.toFixed(0)}% · headphones ${caps.headphonesDetected ? "connected" : "disconnected"}` : "Missing or unavailable"}</dd><dt>Antenna selection</dt><dd>{state.fm.antenna}</dd><dt>Current antenna</dt><dd>{fm.antenna.actual} · {fm.antenna.effectiveness.toFixed(1)}%</dd><dt>Tuned frequency</dt><dd>{formatFMFrequency(fm.frequency)}</dd><dt>Detected transmitter</dt><dd>{fm.transmitter ? `${fm.transmitter.station} · ${fm.transmitter.location}` : "None"}</dd><dt>Raw RF input</dt><dd>{fm.rawRF.toFixed(1)}%</dd><dt>Interference</dt><dd>{fm.interference.toFixed(1)}%</dd><dt>Final reception</dt><dd>{fm.finalReception.toFixed(1)}% · {fm.quality}</dd><dt>Mode / RDS</dt><dd>{fm.mode} · {fm.rds}</dd><dt>Audio state</dt><dd>{fm.outputAvailable ? fm.audioState : "Selected output unavailable"}</dd><dt>Exact-frequency collision</dt><dd className={fm.collision ? "danger" : ""}>{fm.collision ? `${fm.collisionCount} transmitters · FM app crash condition` : "None"}</dd></dl>}
          {tab === "USB" && <dl><dt>Controller</dt><dd>{state.hardware.components.usbBoard.serviceName || state.hardware.components.usbBoard.name}</dd><dt>Negotiated standard</dt><dd>{caps.usbSpecs.standard}</dd><dt>Data rate</dt><dd>{caps.usbSpecs.speedGbps} Gbps</dd><dt>Video output</dt><dd>{caps.usbSpecs.videoOut ? "Supported" : "Not supported"}</dd></dl>}
          {tab === "Events" && <div className="event-report">{state.developer.timeline.filter(e => ["hardware","usb","power","temperature","fm","audio"].includes(e.category) || ["hardware","usb","power","temperature","fm","audio"].includes(e.source)).slice(0,80).map(event => <article key={event.id || event.time}><time>{new Date(event.time).toLocaleTimeString()}</time><b>{event.type}</b><span>{event.message}</span></article>)}</div>}
        </>
      ) : (
        <div className="no-device">
          <i>⌁</i>
          <h2>No service device</h2>
          <p>
            {state.laptop.usbConnected
              ? "The phone USB controller is absent or cannot negotiate a data link."
              : "Connect the physical USB-C cable between the notebook and Antoid 1."}
          </p>
        </div>
      )}
    </div>
  );
}

function LaptopScreen() {
  const { state, set, dispatch } = useOS();
  const laptop = state.laptop;
  if (!laptop.powered)
    return (
      <div className="laptop-screen-off">
        {laptop.charging && <span>{laptop.battery.toFixed(0)}% charging</span>}
      </div>
    );
  if (laptop.booting)
    return (
      <div className="laptop-boot">
        <div className="antoid-mark">
          <i />
          <i />
          <i />
        </div>
        <b>ANTO ID</b>
        <strong>Antoid OS 3.1 for Laptop</strong>
        <span>Starting</span>
      </div>
    );
  return (
    <div
      className={`laptop-desktop wallpaper-${laptop.wallpaper}`}
      onClick={() =>
        laptop.componentsMenu && set("laptop.componentsMenu", false)
      }
    >
      <div className="desktop-top">
        <b>Antoid Desktop</b>
        <span>
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {laptop.battery.toFixed(0)}%
        </span>
      </div>
      <div className="desktop-icons">
        <button
          onDoubleClick={() => set("laptop.app", "browser")}
          onClick={() => set("laptop.app", "browser")}
        >
          <i>⊙</i>Browser
        </button>
        <button
          onDoubleClick={() => set("laptop.app", "developer")}
          onClick={() => set("laptop.app", "developer")}
        >
          <i>⌘</i>Developer Software
        </button>
      </div>
      {laptop.app === "browser" && <Forum />}
      {laptop.app === "developer" && <DeveloperSoftware />}
      <div
        className="laptop-taskbar"
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          set("laptop.componentsMenu", true);
        }}
      >
        <button aria-label="Start" onClick={() => set("laptop.componentsMenu", !laptop.componentsMenu)}>A</button>
        <button onClick={() => set("laptop.app", "browser")}>⊙</button>
        <button onClick={() => set("laptop.app", "developer")}>⌘</button>
        <span />
        <b>{state.laptop.usbConnected ? "USB-C linked" : "No device"}</b>
      </div>
      {laptop.componentsMenu && (
        <div className="taskbar-context">
          <b>Start · System</b>
          <span>Antoid OS 3.1</span>
          <span>AN Elite1 x64</span>
          <span>16 GB AN Hoooosh RAM · 2 × 8 GB</span>
          <span>AN Ultra Graphics100 · 6 GB VRAM</span>
          <span>1920 × 1200 · 16:10 IPS · 60 Hz</span>
          <span>Battery {laptop.battery.toFixed(0)}%</span>
          <Button onClick={() => dispatch({ type: "LAPTOP_POWER", on: false })}>
            Shut down
          </Button>
        </div>
      )}
    </div>
  );
}

export function LaptopScene() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  useEffect(() => {
    if (!state.laptop.booting) return;
    const timer = setTimeout(() => dispatch({ type: "LAPTOP_BOOTED" }), 1700);
    return () => clearTimeout(timer);
  }, [state.laptop.booting]);
  if (!state.laptop.unboxing.complete) return <LaptopUnboxing />;
  return (
    <div className="laptop-desk">
      <div className="desk-glow one" />
      <button
        className="device-return"
        onClick={() => set("deskView", "phone")}
      >
        ← Antoid 1 phone
      </button>
      <div className="laptop-title">
        <b>Antoid Notebook</b>
        <span>{ANTOID_SYSTEM.laptopOS} hardware workspace</span>
      </div>
      <section
        className={`physical-laptop ${state.laptop.lidOpen ? "open" : "closed"}`}
      >
        <div className="laptop-display-shell">
          <div className="webcam" />
          <LaptopScreen />
        </div>
        <div className="laptop-base">
          <div className="keyboard">
            {Array.from({ length: 55 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="trackpad" />
        </div>
        <button
          className="laptop-power-key"
          onClick={() =>
            dispatch({ type: "LAPTOP_POWER", on: !state.laptop.powered })
          }
        >
          ●
        </button>
      </section>
      <div className="laptop-accessories">
        {state.laptop.unboxing.chargerUnlocked && (
          <button
            className={`laptop-charger ${state.laptop.charging ? "connected" : ""}`}
            onClick={() => set("laptop.charging", !state.laptop.charging)}
          >
            <i>65 W</i>
            <span>
              {state.laptop.charging
                ? "Notebook charging"
                : "Connect notebook charger"}
            </span>
          </button>
        )}
        <button
          className={`usb-link ${state.laptop.usbConnected ? "connected" : ""}`}
          onClick={() => {
            if (!caps.usb && !state.laptop.usbConnected)
              dispatch({
                type: "TOAST",
                message: "Antoid 1 USB hardware is unavailable",
              });
            set("laptop.usbConnected", !state.laptop.usbConnected);
          }}
        >
          <i>⌁</i>
          <span>
            {state.laptop.usbConnected
              ? caps.usb
                ? `${caps.usbSpecs.standard} linked`
                : "Cable attached · no data"
              : "Connect Antoid 1 USB-C"}
          </span>
        </button>
      </div>
    </div>
  );
}
