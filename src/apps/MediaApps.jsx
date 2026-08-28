import React, { useEffect, useRef, useState } from "react";
import { useOS, useSystemBack } from "../state/OSContext.jsx";
import { sound } from "../services/audio.js";
import { hardwareCapabilities } from "../services/hardware.js";
import {
  Button,
  Empty,
  Header,
  Offline,
  Segmented,
  Slider,
  Toggle,
} from "../components/UI.jsx";

function drawScene(
  canvas,
  filter = "Natural",
  front = false,
  zoom = 1,
  exposure = 0,
) {
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height;
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, filter === "Mono" ? "#56616a" : "#183f64");
  sky.addColorStop(0.55, filter === "Warm" ? "#ef8c62" : "#725ea4");
  sky.addColorStop(1, "#efbb76");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  c.save();
  c.translate(w / 2, h / 2);
  c.scale(zoom, zoom);
  c.translate(-w / 2, -h / 2);
  c.fillStyle = "#172b37";
  c.beginPath();
  c.moveTo(0, h * 0.75);
  for (let x = 0; x <= w; x += 30)
    c.lineTo(x, h * 0.55 + Math.sin(x * 0.04) * 20);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.fill();
  c.strokeStyle = "#ffda8b";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(w * 0.1, h * 0.76);
  c.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.9, h * 0.76);
  c.stroke();
  for (let i = 0; i < 9; i++) {
    c.fillStyle = i % 2 ? "#ffd067" : "#a5eeff";
    c.beginPath();
    c.arc(
      w * 0.12 + i * w * 0.095,
      h * 0.7 - Math.sin((i / 8) * Math.PI) * 85,
      4,
      0,
      7,
    );
    c.fill();
  }
  c.restore();
  if (front) {
    c.fillStyle = "rgba(255,255,255,.12)";
    c.beginPath();
    c.arc(w * 0.5, h * 0.55, 75, 0, 7);
    c.fill();
  }
  if (exposure) {
    c.fillStyle = `rgba(${exposure > 0 ? "255,255,255" : "0,0,0"},${Math.abs(exposure) / 150})`;
    c.fillRect(0, 0, w, h);
  }
}

export function CameraApp() {
  const { state, set, dispatch } = useOS();
  const caps = hardwareCapabilities(state);
  const wide = state.hardware.components.wideCamera;
  const canvas = useRef(),
    [mode, setMode] = useState("Photo"),
    [front, setFront] = useState(false),
    [flash, setFlash] = useState(false),
    [timer, setTimer] = useState(0),
    [zoom, setZoom] = useState(1),
    [exposure, setExposure] = useState(0),
    [grid, setGrid] = useState(true),
    [filter, setFilter] = useState("Natural");
  useEffect(() => {
    const paint = () => {
      if (canvas.current)
        drawScene(canvas.current, filter, front, zoom, exposure);
      frame = requestAnimationFrame(paint);
    };
    let frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [filter, front, zoom, exposure]);
  useEffect(() => {
    if (!caps.flashlight && flash) setFlash(false);
  }, [caps.flashlight, flash]);
  const shoot = () => {
    const available = front
      ? caps.cameras.front
      : caps.cameras.wide || caps.cameras.ultrawide || caps.cameras.telephoto;
    if (!available) {
      dispatch({
        type: "TOAST",
        message: `${front ? "Front" : "Rear"} camera hardware is unavailable`,
      });
      return;
    }
    if (!state.permissions.camera) {
      dispatch({
        type: "MODAL",
        modal: {
          icon: "◉",
          title: "Allow Camera?",
          body: "Camera creates generated local images and may use camera hardware only after permission.",
          actions: [
            { label: "Not now" },
            { label: "Allow", onClick: () => set("permissions.camera", true) },
          ],
        },
      });
      return;
    }
    const capture = () => {
      sound("shutter");
      const data = canvas.current.toDataURL("image/jpeg", 0.55);
      dispatch({
        type: "ADD_PHOTO",
        photo: {
          id: `photo-${Date.now()}`,
          title: `${mode} ${new Date().toLocaleTimeString("en-US")}`,
          filename: `IMG_${new Date().toISOString().replaceAll(":", "-")}.jpg`,
          kind: "camera",
          data,
          created: Date.now(),
          resolution: `${canvas.current.width} × ${canvas.current.height}`,
          source: `${front ? "Front" : wide.serviceName || wide.name} · ${mode}${wide.ai ? " · Supra Vision AI" : ""}`,
          size: `${Math.round(data.length * 0.00075)} KB`,
          colors: ["#183f64", "#725ea4", "#efbb76"],
          favorite: false,
          trash: false,
          rotation: 0,
          brightness: 100,
          contrast: 100,
        },
      });
    };
    timer ? setTimeout(capture, timer * 1000) : capture();
  };
  const rearAvailable =
    caps.cameras.wide || caps.cameras.ultrawide || caps.cameras.telephoto;
  if (!rearAvailable && !caps.cameras.front)
    return (
      <div className="camera-app camera-hardware-offline">
        <Header title="Camera" />
        <div>
          <i>◉</i>
          <h2>No camera hardware</h2>
          <p>
            Install and connect a camera module in Controller Lab → Phone
            Disassembly.
          </p>
        </div>
      </div>
    );
  return (
    <div className="camera-app">
      <Header title="Camera" />
      <div className="viewfinder">
        <canvas ref={canvas} width="360" height="520" />
        {grid && <div className="camera-grid" />}
        {flash && <div className="flash-overlay" />}
        <div className="camera-indicator">● Camera active</div>
      </div>
      <div className="camera-toolbar">
        <Segmented
          value={mode}
          onChange={setMode}
          items={["Photo", "Portrait", "Panorama", "Video"]}
          label="Camera mode"
        />
        <div className="camera-settings">
          <button
            disabled={front ? !rearAvailable : !caps.cameras.front}
            onClick={() => setFront(!front)}
          >
            ↻<span>{front ? "Front" : "Rear"}</span>
          </button>
          <button
            className={flash ? "on" : ""}
            disabled={!caps.flashlight}
            onClick={() => caps.flashlight && setFlash(!flash)}
          >
            ϟ<span>Flash</span>
          </button>
          <button onClick={() => setTimer(timer === 10 ? 0 : timer + 3)}>
            ◷<span>{timer ? `${timer}s` : "Timer"}</span>
          </button>
          <button onClick={() => setGrid(!grid)}>
            #<span>Grid</span>
          </button>
        </div>
        <div className="camera-adjust">
          <div className="lens-picker">
            {caps.cameras.ultrawide && (
              <button
                className={zoom === 0.6 ? "active" : ""}
                onClick={() => setZoom(0.6)}
              >
                .6× Ultra-wide
              </button>
            )}
            {caps.cameras.wide && (
              <button
                className={zoom === 1 ? "active" : ""}
                onClick={() => setZoom(1)}
              >
                1× Wide
              </button>
            )}
            {caps.cameras.telephoto && (
              <button
                className={zoom === 3 ? "active" : ""}
                onClick={() => setZoom(3)}
              >
                3× Tele
              </button>
            )}
          </div>
          <label>
            Zoom{" "}
            <input
              type="range"
              min=".6"
              max={
                caps.cameras.telephoto
                  ? wide.lunarEnhancement
                    ? "12"
                    : "5"
                  : "2"
              }
              step=".1"
              value={zoom}
              onChange={(e) => setZoom(+e.target.value)}
            />
          </label>
          <label>
            Exposure{" "}
            <input
              type="range"
              min="-50"
              max="50"
              value={exposure}
              onChange={(e) => setExposure(+e.target.value)}
            />
          </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Natural</option>
            <option>Warm</option>
            <option>Mono</option>
          </select>
          {wide.ai && (
            <span className="vision-ai">
              Supra Vision AI
              {wide.lunarEnhancement && zoom >= 8
                ? " · Lunar enhancement active"
                : ""}
            </span>
          )}
        </div>
        <button className="shutter" onClick={shoot}>
          <i />
        </button>
      </div>
    </div>
  );
}

function PhotoArt({ photo }) {
  if (photo.data)
    return (
      <div
        className="photo-art-layer"
        style={{
          clipPath: photo.crop ? `inset(${photo.crop}% round 8px)` : undefined,
        }}
      >
        <img
          src={photo.data}
          alt={photo.title}
          style={{
            transform: `rotate(${photo.rotation || 0}deg)`,
            filter: `brightness(${photo.brightness || 100}%) contrast(${photo.contrast || 100}%)`,
          }}
        />
        {photo.text && <span className="photo-text">{photo.text}</span>}
        {!!photo.annotations?.length && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            {photo.annotations.map((stroke, index) => (
              <polyline
                key={index}
                points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
              />
            ))}
          </svg>
        )}
      </div>
    );
  return (
    <div
      className="generated-art"
      style={{
        background: `linear-gradient(${photo.rotation || 135}deg,${photo.colors.join(",")})`,
        filter: `brightness(${photo.brightness || 100}%) contrast(${photo.contrast || 100}%)`,
      }}
    >
      <span>{photo.kind === "screenshot" ? "Antoid 1" : "A"}</span>
    </div>
  );
}
export function GalleryApp() {
  const { state, set, dispatch } = useOS();
  const [tab, setTab] = useState("Photos"),
    [view, setView] = useState(null),
    [slide, setSlide] = useState(false),
    [drawing, setDrawing] = useState(false),
    [undo, setUndo] = useState([]);
  const stroke = useRef(false);
  useSystemBack(() => {
    setView(null);
    setSlide(false);
    return true;
  }, !!view);
  const photos = state.photos.filter((p) =>
    tab === "Trash"
      ? p.trash
      : !p.trash &&
        (tab === "Favorites"
          ? p.favorite
          : tab === "Camera"
            ? p.kind !== "screenshot"
            : tab === "Screenshots"
              ? p.kind === "screenshot"
              : true),
  );
  useEffect(() => {
    if (slide && view) {
      const id = setInterval(() => {
        const list = state.photos.filter((p) => !p.trash);
        setView(
          list[(list.findIndex((p) => p.id === view.id) + 1) % list.length],
        );
      }, 2000);
      return () => clearInterval(id);
    }
  }, [slide, view, state.photos]);
  const patchPhoto = (id, changes) =>
    set(
      "photos",
      state.photos.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );
  const share = (target) => {
    dispatch({
      type: "TOAST",
      message: `Ready to share ${view.title} with ${target}`,
    });
    dispatch({ type: "OPEN_APP", id: target.toLowerCase() });
  };
  return (
    <div className="app-fill">
      <Header
        title="Gallery"
        subtitle={`${state.photos.filter((p) => !p.trash).length} local images`}
      />
      <Segmented
        value={tab}
        onChange={setTab}
        items={[
          "Photos",
          "Camera",
          "Screenshots",
          "Albums",
          "Favorites",
          "Trash",
        ]}
        label="Gallery section"
      />
      <div className="photo-grid app-scroll">
        {photos.map((p) => (
          <button key={p.id} onClick={() => setView(p)}>
            <PhotoArt photo={p} />
            <span>{p.title}</span>
          </button>
        ))}
        {!photos.length && (
          <Empty
            title={`No ${tab.toLowerCase()}`}
            body="Images you create will appear here."
          />
        )}
      </div>
      {view && (
        <div className="photo-viewer">
          <header>
            <button onClick={() => setView(null)}>‹</button>
            <b>{view.title}</b>
            <button
              onClick={() => patchPhoto(view.id, { favorite: !view.favorite })}
            >
              {view.favorite ? "♥" : "♡"}
            </button>
          </header>
          <div
            className={`photo-edit-stage ${drawing ? "drawing" : ""}`}
            onPointerDown={(e) => {
              if (!drawing) return;
              stroke.current = true;
              setUndo([...undo, structuredClone(view)]);
              const rect = e.currentTarget.getBoundingClientRect();
              const point = {
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              };
              const next = {
                ...view,
                annotations: [...(view.annotations || []), [point]],
              };
              setView(next);
              patchPhoto(view.id, next);
            }}
            onPointerMove={(e) => {
              if (!drawing || !stroke.current) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const point = {
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              };
              const annotations = [...(view.annotations || [])];
              annotations[annotations.length - 1] = [
                ...annotations.at(-1),
                point,
              ];
              const next = { ...view, annotations };
              setView(next);
              patchPhoto(view.id, next);
            }}
            onPointerUp={() => (stroke.current = false)}
          >
            <PhotoArt
              photo={state.photos.find((p) => p.id === view.id) || view}
            />
          </div>
          <dl className="photo-info">
            <dt>File</dt>
            <dd>{view.filename || `${view.title}.png`}</dd>
            <dt>Created</dt>
            <dd>
              {new Date(view.created || Date.now()).toLocaleString("en-US")}
            </dd>
            <dt>Resolution</dt>
            <dd>{view.resolution || "1080 × 1920"}</dd>
            <dt>Source</dt>
            <dd>
              {view.source ||
                (view.kind === "screenshot" ? "Screenshot" : "Camera")}
            </dd>
            <dt>Size</dt>
            <dd>{view.size || "1.8 MB"}</dd>
          </dl>
          <div className="edit-controls">
            <Slider
              label="Brightness"
              value={view.brightness || 100}
              min={40}
              max={160}
              onChange={(v) => {
                patchPhoto(view.id, { brightness: v });
                setView({ ...view, brightness: v });
              }}
            />
            <Slider
              label="Contrast"
              value={view.contrast || 100}
              min={40}
              max={160}
              onChange={(v) => {
                patchPhoto(view.id, { contrast: v });
                setView({ ...view, contrast: v });
              }}
            />
          </div>
          <footer>
            <button
              onClick={() => {
                setUndo([...undo, structuredClone(view)]);
                patchPhoto(view.id, { rotation: (view.rotation || 0) + 90 });
                setView({ ...view, rotation: (view.rotation || 0) + 90 });
              }}
            >
              ↻<span>Rotate</span>
            </button>
            <button
              onClick={() => {
                setUndo([...undo, structuredClone(view)]);
                const crop = (view.crop || 0) >= 20 ? 0 : (view.crop || 0) + 5;
                patchPhoto(view.id, { crop });
                setView({ ...view, crop });
              }}
            >
              ⌗<span>Crop</span>
            </button>
            <button
              className={drawing ? "active" : ""}
              onClick={() => setDrawing(!drawing)}
            >
              ✎<span>Draw</span>
            </button>
            <button
              onClick={() => {
                const text = window.prompt("Text on photo", view.text || "");
                if (text === null) return;
                setUndo([...undo, structuredClone(view)]);
                patchPhoto(view.id, { text });
                setView({ ...view, text });
              }}
            >
              T<span>Text</span>
            </button>
            <button
              disabled={!undo.length}
              onClick={() => {
                const previous = undo.at(-1);
                setUndo(undo.slice(0, -1));
                patchPhoto(view.id, previous);
                setView(previous);
              }}
            >
              ↶<span>Undo</span>
            </button>
            <button onClick={() => setSlide(!slide)}>
              ▷<span>{slide ? "Stop" : "Slideshow"}</span>
            </button>
            <button
              onClick={() =>
                dispatch({
                  type: "MODAL",
                  modal: {
                    title: "Share photo",
                    body: "Choose a local app.",
                    actions: [
                      { label: "Messages", onClick: () => share("messages") },
                      { label: "Messenger", onClick: () => share("messenger") },
                      { label: "Cancel" },
                    ],
                  },
                })
              }
            >
              ↗<span>Share</span>
            </button>
            {view.trash && (
              <button
                onClick={() => {
                  set(
                    "photos",
                    state.photos.filter((p) => p.id !== view.id),
                  );
                  setView(null);
                  dispatch({
                    type: "TOAST",
                    message: "Photo permanently deleted",
                  });
                }}
              >
                ×<span>Delete</span>
              </button>
            )}
            <button
              onClick={() => {
                patchPhoto(view.id, { trash: !view.trash });
                setView(null);
              }}
            >
              {view.trash ? "↥" : "⌫"}
              <span>{view.trash ? "Restore" : "Trash"}</span>
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}

const pages = {
  Search: {
    title: "Antoid Search",
    lead: "A private search across local Antoid pages.",
    cards: [
      "Antoid 1 Help",
      "Today in Budapest",
      "Technology that feels human",
    ],
  },
  "Antoid Help": {
    title: "Antoid Help",
    lead: "Learn the gestures, hardware, apps and connection laboratory.",
    cards: [
      "SIM tray & eSIM",
      "Four-bar network simulator",
      "Backups and accessibility",
    ],
  },
  News: {
    title: "Local News",
    lead: "Budapest wakes to a calm, clear morning.",
    cards: [
      "City lights project complete",
      "Community garden opens",
      "Antoid 1 update announced",
    ],
  },
  Technology: {
    title: "Technology",
    lead: "Local-first design puts your data in your hands.",
    cards: [
      "Inside Antoid connectivity",
      "Procedural music",
      "A browser OS without servers",
    ],
  },
  Travel: {
    title: "Travel",
    lead: "An evening route along the Danube.",
    cards: ["Margaret Island", "Castle District", "Tram 2 at sunset"],
  },
  Recipes: {
    title: "Recipes",
    lead: "Comforting food for slow weekends.",
    cards: [
      "Paprika breakfast eggs",
      "Grandma’s apple cake",
      "Fresh garden salad",
    ],
  },
  "Daily Questions": {
    title: "Daily Questions",
    lead: "Ask, answer and vote in a private local community.",
    cards: [],
  },
};

const launchQuestion = {
  id: "dq-launch",
  title: "What small habit made your everyday life noticeably better?",
  body: "Share one practical change and why it stuck.",
  author: "Daily Questions",
  created: 1,
};
function DailyQuestionsSite() {
  const { state, set, dispatch } = useOS();
  const dq = state.browser.dailyQuestions;
  const [question, setQuestion] = useState("");
  const [comment, setComment] = useState({});
  const score = (id) => dq.votes[id] || 0;
  const all = [launchQuestion, ...dq.questions];
  const sorted = [...all].sort((a, b) =>
    dq.sort === "Newest"
      ? b.created - a.created
      : dq.sort === "Most Discussed"
        ? dq.comments.filter((x) => x.question === b.id).length -
          dq.comments.filter((x) => x.question === a.id).length
        : score(b.id) - score(a.id),
  );
  const vote = (id, delta) =>
    set(`browser.dailyQuestions.votes.${id}`, score(id) === delta ? 0 : delta);
  const submit = () => {
    const title = question.trim();
    if (!title) return;
    set("browser.dailyQuestions.questions", [
      {
        id: `dq-${Date.now()}`,
        title,
        body: "Asked from this Antoid 1",
        author: state.setup.firstName || "You",
        created: Date.now(),
      },
      ...dq.questions,
    ]);
    setQuestion("");
  };
  return (
    <div className="daily-questions">
      <span className="site-chip">LOCAL ANT WEB</span>
      <h1>Daily Questions</h1>
      <p>Thoughtful questions, stored only on this phone.</p>
      <div className="dq-compose">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the community a question"
        />
        <Button onClick={submit}>Publish question</Button>
      </div>
      <label>
        Sort
        <select
          value={dq.sort}
          onChange={(e) => set("browser.dailyQuestions.sort", e.target.value)}
        >
          <option>Top Question</option>
          <option>Newest</option>
          <option>Most Discussed</option>
        </select>
      </label>
      {sorted.map((item) => (
        <article className="dq-card" key={item.id}>
          <div className="dq-vote">
            <button onClick={() => vote(item.id, 1)}>▲</button>
            <b>{score(item.id)}</b>
            <button onClick={() => vote(item.id, -1)}>▼</button>
          </div>
          <section>
            <small>
              {item.author} ·{" "}
              {item.id === "dq-launch"
                ? "Question of the day"
                : new Date(item.created).toLocaleString("en-US")}
            </small>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <div className="dq-actions">
              <button
                onClick={() =>
                  set(
                    "browser.dailyQuestions.saved",
                    dq.saved.includes(item.id)
                      ? dq.saved.filter((x) => x !== item.id)
                      : [...dq.saved, item.id],
                  )
                }
              >
                {dq.saved.includes(item.id) ? "Saved" : "Save"}
              </button>
              <button
                onClick={() => {
                  set("browser.dailyQuestions.reported", [
                    ...new Set([...dq.reported, item.id]),
                  ]);
                  dispatch({
                    type: "TOAST",
                    message: "Report saved locally for review",
                  });
                }}
              >
                Report
              </button>
            </div>
            <div className="dq-comments">
              {dq.comments
                .filter((x) => x.question === item.id)
                .map((x) => (
                  <p key={x.id}>
                    <b>{x.author}</b> {x.body}
                  </p>
                ))}
              <div>
                <input
                  value={comment[item.id] || ""}
                  onChange={(e) =>
                    setComment({ ...comment, [item.id]: e.target.value })
                  }
                  placeholder="Write a comment or reply"
                />
                <button
                  onClick={() => {
                    const body = (comment[item.id] || "").trim();
                    if (!body) return;
                    set("browser.dailyQuestions.comments", [
                      ...dq.comments,
                      {
                        id: `dqc-${Date.now()}`,
                        question: item.id,
                        author: state.setup.firstName || "You",
                        body,
                      },
                    ]);
                    setComment({ ...comment, [item.id]: "" });
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </section>
        </article>
      ))}
    </div>
  );
}
export function BrowserApp() {
  const { state, set, dispatch, net } = useOS();
  const b = state.browser,
    [address, setAddress] = useState("Search"),
    [loading, setLoading] = useState(false),
    [find, setFind] = useState("");
  const tab = b.tabs.find((t) => t.id === b.active) || b.tabs[0],
    page = pages[tab?.page] || pages.Search;
  const browserBack = () => {
    const previous = b.history.at(-1);
    if (!previous) return false;
    set(
      "browser.tabs",
      b.tabs.map((item) =>
        item.id === b.active
          ? { ...item, title: previous, page: previous }
          : item,
      ),
    );
    set("browser.history", b.history.slice(0, -1));
    setAddress(previous);
    return true;
  };
  useSystemBack(browserBack, b.history.length > 0);
  const go = (target = address) => {
    if (!net.isOnline) {
      dispatch({ type: "TOAST", message: "No internet connection" });
      return;
    }
    setLoading(true);
    setTimeout(
      () => {
        const key =
          Object.keys(pages).find((k) =>
            k.toLowerCase().includes(target.toLowerCase()),
          ) || "Search";
        const tabs = b.tabs.map((t) =>
          t.id === b.active ? { ...t, title: key, page: key } : t,
        );
        set("browser.tabs", tabs);
        set("browser.history", [...b.history, tab?.page || "Search"]);
        setLoading(false);
      },
      Math.min(2500, net.latency + 250),
    );
  };
  const addTab = () => {
    const id = `t${Date.now()}`;
    set("browser.tabs", [...b.tabs, { id, title: "New tab", page: "Search" }]);
    set("browser.active", id);
  };
  return (
    <div className="browser-app">
      <Header
        title="Browser"
        subtitle={`${net.onlineVia} · ${b.private ? "Private" : "Standard"}`}
      />
      <div className="browser-bar">
        <button onClick={browserBack}>‹</button>
        <button onClick={() => go(page.title)}>↻</button>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button
          onClick={() =>
            set("browser.bookmarks", [...new Set([...b.bookmarks, page.title])])
          }
        >
          ☆
        </button>
      </div>
      <div className="browser-tabs">
        {b.tabs.map((t) => (
          <button
            className={t.id === b.active ? "active" : ""}
            onClick={() => set("browser.active", t.id)}
            key={t.id}
          >
            {t.title}
            <i
              onClick={(e) => {
                e.stopPropagation();
                set(
                  "browser.tabs",
                  b.tabs.filter((x) => x.id !== t.id),
                );
              }}
            >
              ×
            </i>
          </button>
        ))}
        <button onClick={addTab}>＋</button>
      </div>
      <div className="web-page app-scroll">
        {loading ? (
          <div className="web-loading">
            <i />
            <b>Loading over {net.onlineVia}</b>
            <span>
              {net.quality} · {net.latency} ms
            </span>
          </div>
        ) : !net.isOnline ? (
          <Offline
            onWifi={() => dispatch({ type: "OPEN_APP", id: "settings" })}
            onMobile={() => dispatch({ type: "OPEN_APP", id: "settings" })}
            onRetry={() => go()}
          />
        ) : tab?.page === "Daily Questions" ? (
          <DailyQuestionsSite />
        ) : (
          <>
            <span className="site-chip">LOCAL ANT WEB</span>
            <h1>{page.title}</h1>
            <p>{page.lead}</p>
            <input
              placeholder="Find on page"
              value={find}
              onChange={(e) => setFind(e.target.value)}
            />
            <div className="web-cards">
              {page.cards
                .filter((x) => x.toLowerCase().includes(find.toLowerCase()))
                .map((x) => (
                  <button key={x} onClick={() => go(x)}>
                    <b>{x}</b>
                    <span>Original local page · updated today</span>
                  </button>
                ))}
            </div>
            <div className="page-links">
              {Object.keys(pages).map((x) => (
                <button
                  onClick={() => {
                    setAddress(x);
                    go(x);
                  }}
                  key={x}
                >
                  {x}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <footer className="browser-menu">
        <button onClick={() => set("browser.private", !b.private)}>
          Private
        </button>
        <button onClick={() => set("browser.desktop", !b.desktop)}>
          {b.desktop ? "Mobile" : "Desktop"}
        </button>
        <button
          onClick={() => {
            if (navigator.share)
              navigator
                .share({ title: page.title, text: page.lead })
                .catch(() =>
                  dispatch({
                    type: "TOAST",
                    message: "Share canceled; page remains open",
                  }),
                );
            else {
              navigator.clipboard?.writeText(page.title);
              dispatch({ type: "TOAST", message: "Page title copied" });
            }
          }}
        >
          Share
        </button>
        <button
          onClick={() =>
            dispatch({
              type: "TOAST",
              message: `${b.bookmarks.length} bookmarks · ${b.history.length} history items`,
            })
          }
        >
          Library
        </button>
      </footer>
    </div>
  );
}
