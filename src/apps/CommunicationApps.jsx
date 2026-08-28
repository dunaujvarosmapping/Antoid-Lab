import React, { useEffect, useMemo, useRef, useState } from "react";
import { CARRIERS, useOS, useSystemBack } from "../state/OSContext.jsx";
import {
  connectivity,
  emergencyNetwork,
  lineQuality,
  voiceBearer,
} from "../services/core.js";
import { sound } from "../services/audio.js";
import {
  Avatar,
  Button,
  Empty,
  FormField,
  Header,
  Segmented,
  Tabs,
} from "../components/UI.jsx";

function ContactList({ onPick, actions = true }) {
  const { state } = useOS();
  const [q, setQ] = useState("");
  return (
    <>
      <input
        className="search-input"
        placeholder="Search people"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="contact-list">
        {state.contacts
          .filter((c) =>
            (c.name + c.number).toLowerCase().includes(q.toLowerCase()),
          )
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((c) => (
            <button key={c.id} onClick={() => onPick(c)}>
              <Avatar name={c.name} color={c.color} />
              <span>
                <b>
                  {c.name}
                  {c.favorite ? " ★" : ""}
                </b>
                <small>{c.number}</small>
              </span>
              {actions && <i>›</i>}
            </button>
          ))}
      </div>
    </>
  );
}
function activeNumber(state, slot) {
  const s = state.sim[slot];
  return s.installed
    ? state.numbers.profiles[`${slot}-${s.carrier}`]
    : "No number";
}

export function PhoneApp() {
  const { state, set, dispatch } = useOS();
  const [tab, setTab] = useState("Favorites"),
    [digits, setDigits] = useState(""),
    [choose, setChoose] = useState(null);
  const call = state.activeCall;
  useEffect(() => {
    if (call?.phase === "ringing") {
      const id = setTimeout(
        () =>
          set("activeCall", {
            ...call,
            phase: "connected",
            connectedAt: Date.now(),
          }),
        1800,
      );
      return () => clearTimeout(id);
    }
  }, [call?.phase]);
  useEffect(() => {
    if (call?.phase === "connected") {
      const id = setInterval(
        () =>
          set("activeCall", {
            ...state.activeCall,
            duration: Math.floor(
              (Date.now() - state.activeCall.connectedAt) / 1000,
            ),
          }),
        1000,
      );
      return () => clearInterval(id);
    }
  }, [call?.phase, state.activeCall?.duration]);
  const begin = (target, slot = state.defaults.calls) => {
    const calledNumber = String(target?.number || target).replace(/\s/g, "");
    if (calledNumber === "112") {
      const emergency = emergencyNetwork(state);
      if (!emergency.reachable) {
        sound("error");
        dispatch({ type: "TOAST", message: emergency.reason });
        return;
      }
      sound("call");
      set("activeCall", {
        target: { name: "Emergency services", number: "112", color: "#e3424f" },
        slot: null,
        emergency: true,
        bearer: `Emergency cellular · Tower ${emergency.tower.id}`,
        phase: "ringing",
        duration: 0,
        muted: false,
        speaker: false,
        held: false,
      });
      return;
    }
    if (slot === "ask") {
      setChoose(target);
      return;
    }
    const route = voiceBearer(state, slot);
    if (lineQuality(state, route.line || slot).plan.voiceExhausted) {
      sound("error");
      dispatch({ type: "TOAST", message: "Voice plan minutes exhausted" });
      return;
    }
    if (!route.ok) {
      sound("error");
      dispatch({ type: "TOAST", message: route.label });
      return;
    }
    sound("call");
    set("activeCall", {
      target,
      slot: route.line,
      bearer: route.label,
      phase: "ringing",
      duration: 0,
      muted: false,
      speaker: false,
      held: false,
    });
  };
  const end = () => {
    if (call) {
      set("calls", [
        {
          id: String(Date.now()),
          name: call.target.name || call.target,
          number: call.target.number || call.target,
          bearer: call.bearer,
          slot: call.slot,
          time: Date.now(),
          duration: call.duration || 0,
          type: "outgoing",
        },
        ...state.calls,
      ]);
      dispatch({
        type: "CONSUME_VOICE",
        slot: call.slot,
        minutes: Math.max(1 / 60, (call.duration || 0) / 60),
        emergency: call.emergency,
      });
      set("activeCall", null);
      sound("tap");
    }
  };
  if (call)
    return (
      <div className="call-screen">
        <Header title="Antoid Phone" />
        <Avatar
          name={call.target.name || String(call.target)}
          color={call.target.color}
        />
        <h2>{call.target.name || call.target}</h2>
        <p>
          {call.phase === "ringing"
            ? "Calling…"
            : new Date((call.duration || 0) * 1000).toISOString().slice(14, 19)}
        </p>
        <div className="bearer-pill">
          {call.bearer} · {call.emergency ? "112" : state.sim[call.slot].label}
        </div>
        <div className="call-controls">
          {[
            ["muted", "Mute", "♩"],
            ["speaker", "Speaker", "◉"],
            ["held", "Hold", "Ⅱ"],
          ].map(([key, label, icon]) => (
            <button
              className={call[key] ? "on" : ""}
              key={key}
              onClick={() => set(`activeCall.${key}`, !call[key])}
            >
              <b>{icon}</b>
              <span>{label}</span>
            </button>
          ))}
          <button
            onClick={() =>
              dispatch({ type: "TOAST", message: "In-call keypad ready" })
            }
          >
            <b>⌨</b>
            <span>Keypad</span>
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "TOAST",
                message: "Choose a contact to add after this call",
              })
            }
          >
            <b>＋</b>
            <span>Add call</span>
          </button>
        </div>
        <button className="hangup" onClick={end}>
          ⌕
        </button>
      </div>
    );
  const selectedLines = ["physical", "esim"].filter(
    (k) => state.sim[k].installed && state.sim[k].enabled,
  );
  return (
    <div className="app-fill">
      <Header
        title="Phone"
        subtitle={`${selectedLines.map((k) => CARRIERS[state.sim[k].carrier].name).join(" · ") || "No SIM"} · ${voiceBearer(state).label}`}
      />
      <Tabs
        items={["Favorites", "Recents", "Contacts", "Keypad", "Voicemail"]}
        active={tab}
        onChange={setTab}
      />
      <div className="app-scroll tab-body">
        {tab === "Favorites" && <ContactList onPick={begin} />}{" "}
        {tab === "Contacts" && <ContactList onPick={begin} />}
        {tab === "Recents" &&
          (state.calls.length ? (
            <div className="list-cards">
              {state.calls.map((c) => (
                <button key={c.id} onClick={() => begin(c)}>
                  <b>{c.name}</b>
                  <span>{new Date(c.time).toLocaleString("en-US")}</span>
                  <small>
                    {c.bearer} · {c.duration}s
                  </small>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              icon="↗"
              title="No recent calls"
              body="Completed and missed calls will appear here."
            />
          ))}
        {tab === "Keypad" && (
          <div className="dialer">
            <input
              value={digits}
              onChange={(e) =>
                setDigits(e.target.value.replace(/[^0-9+*#]/g, ""))
              }
              placeholder="Enter number"
            />
            <div>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(
                (n) => (
                  <button
                    onClick={() => {
                      setDigits(digits + n);
                      sound("tap");
                    }}
                    key={n}
                  >
                    {n}
                  </button>
                ),
              )}
            </div>
            <button
              className="dial"
              onClick={() =>
                digits &&
                begin({ name: digits, number: digits, color: "#3fbd86" })
              }
            >
              ☎
            </button>
          </div>
        )}
        {tab === "Voicemail" && (
          <div className="voicemail">
            <h3>Local voicemail</h3>
            <article>
              <Avatar small name="Grandma" color="#b37adb" />
              <span>
                <b>Grandma</b>
                <small>“Call me when you can, dear.” · 0:08</small>
              </span>
              <Button onClick={() => sound("call")}>Play</Button>
            </article>
          </div>
        )}
        <div className="my-numbers">
          <b>My numbers</b>
          {selectedLines.map((k) => (
            <span key={k}>
              {state.sim[k].label}: {activeNumber(state, k)}
            </span>
          ))}
        </div>
      </div>
      {choose && (
        <div className="sheet">
          <h3>Call using</h3>
          {selectedLines.map((k) => (
            <button
              key={k}
              onClick={() => {
                begin(choose, k);
                setChoose(null);
              }}
            >
              <b>
                {state.sim[k].label} — {CARRIERS[state.sim[k].carrier].name}
              </b>
              <span>{activeNumber(state, k)}</span>
            </button>
          ))}
          <Button onClick={() => setChoose(null)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}

function Conversation({ kind, contact, onClose }) {
  const { state, dispatch } = useOS();
  const [text, setText] = useState("");
  const threads = state[kind],
    items = threads[contact.id] || [];
  const send = (lineOverride = null) => {
    if (!text.trim()) return;
    if (kind === "messages") {
      const available = ["physical", "esim"].filter(
        (k) => state.sim[k].installed && state.sim[k].enabled,
      );
      if (
        state.defaults.sms === "ask" &&
        !lineOverride &&
        available.length > 1
      ) {
        dispatch({
          type: "MODAL",
          modal: {
            title: "Send SMS using",
            body: "Choose the cellular line for this message.",
            actions: [
              ...available.map((k) => ({
                label: `${state.sim[k].label} — ${CARRIERS[state.sim[k].carrier].name}`,
                onClick: () => send(k),
              })),
              { label: "Cancel" },
            ],
          },
        });
        return;
      }
      const line =
        lineOverride ||
        (state.defaults.sms === "ask" ? available[0] : state.defaults.sms);
      const s = state.sim[line];
      const quality = lineQuality(state, line);
      if (!s?.installed || !quality.registered) {
        dispatch({
          type: "TOAST",
          message: !s?.installed
            ? "No SIM card"
            : state.radio.airplane
              ? "SMS unavailable in airplane mode"
              : "No cellular SMS service",
        });
        sound("error");
        return;
      }
    }
    dispatch({
      type: "ADD_MESSAGE",
      kind,
      contact: contact.id,
      text: text.trim(),
    });
    setText("");
    sound("notify");
    setTimeout(
      () =>
        dispatch({
          type: "ADD_MESSAGE",
          kind,
          contact: contact.id,
          from: contact.name,
          text:
            contact.id === "mom"
              ? "Sounds good! ❤️"
              : contact.id === "dad"
                ? "Got it — talk soon."
                : "Wonderful, dear!",
        }),
      900,
    );
  };
  return (
    <div className="conversation">
      <Header
        title={contact.name}
        subtitle={
          kind === "messenger" ? "Active on local Messenger" : contact.number
        }
      />
      <div className="message-flow app-scroll">
        {items.map((m) => (
          <div key={m.id} className={m.from === "You" ? "mine" : ""}>
            <span>{m.text}</span>
            <small>
              {new Date(m.time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              {m.from === "You" ? "✓✓" : ""}
            </small>
            <button
              onClick={() =>
                dispatch({
                  type: "TOAST",
                  message: "Message reaction toggled: ❤️",
                })
              }
            >
              ♡
            </button>
          </div>
        ))}
      </div>
      <footer className="composer">
        <button
          onClick={() =>
            dispatch({
              type: "TOAST",
              message: "Choose a photo in Gallery, then Share",
            })
          }
        >
          ＋
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message"
        />
        <button onClick={() => setText(text + " 😊")}>☺</button>
        <button onClick={() => send()}>↑</button>
      </footer>
    </div>
  );
}

function MessagingShell({ kind }) {
  const { state, dispatch, net } = useOS();
  const [selected, setSelected] = useState(null),
    [q, setQ] = useState("");
  useSystemBack(() => {
    setSelected(null);
    return true;
  }, !!selected);
  if (selected)
    return (
      <Conversation
        kind={kind}
        contact={selected}
        onClose={() => setSelected(null)}
      />
    );
  const call = (contact, video = false) => {
    if (!net.isOnline) {
      sound("error");
      dispatch({ type: "TOAST", message: "No internet connection" });
      return;
    }
    const delay = Math.min(3200, Math.max(600, net.latency));
    dispatch({
      type: "TOAST",
      message: `Connecting ${video ? "video " : ""}call · ${net.quality}`,
    });
    setTimeout(
      () =>
        dispatch({
          type: "MODAL",
          modal: {
            icon: "ϟ",
            title: `${contact.name} · ${video ? "Video" : "Audio"} call`,
            body: `Connected over ${net.onlineVia}. Quality: ${net.quality}. Latency: ${net.latency} ms.`,
            content: (
              <div className="call-actions">
                <Button onClick={() => sound("tap")}>Mute</Button>
                <Button onClick={() => sound("tap")}>Speaker</Button>
                {video && <Button onClick={() => sound("tap")}>Camera</Button>}
              </div>
            ),
            actions: [{ label: "End call" }],
          },
        }),
      delay,
    );
  };
  return (
    <div className="app-fill">
      <Header
        title={kind === "messenger" ? "Messenger" : "Messages"}
        subtitle={
          kind === "messenger"
            ? `${net.onlineVia} · internet calling`
            : "Local SMS"
        }
      />
      <input
        className="search-input"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search conversations"
      />
      <div className="thread-list app-scroll">
        {state.contacts
          .filter(
            (c) =>
              ["mom", "dad", "grandma"].includes(c.id) &&
              c.name.toLowerCase().includes(q.toLowerCase()),
          )
          .map((c) => {
            const last = (state[kind][c.id] || []).at(-1);
            return (
              <article key={c.id}>
                <button onClick={() => setSelected(c)}>
                  <Avatar name={c.name} color={c.color} />
                  <span>
                    <b>{c.name}</b>
                    <small>{last?.text || "Start a conversation"}</small>
                  </span>
                  <time>
                    {last
                      ? new Date(last.time).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </time>
                </button>
                {kind === "messenger" && (
                  <div>
                    <button onClick={() => call(c)}>☎</button>
                    <button onClick={() => call(c, true)}>▣</button>
                  </div>
                )}
              </article>
            );
          })}
      </div>
      <button
        className="fab"
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: "Choose any contact from Contacts to start a thread",
          })
        }
      >
        ＋
      </button>
    </div>
  );
}
export function MessagesApp() {
  return <MessagingShell kind="messages" />;
}
export function MessengerApp() {
  return <MessagingShell kind="messenger" />;
}

export function ContactsApp() {
  const { state, dispatch } = useOS();
  const [editing, setEditing] = useState(null),
    [form, setForm] = useState({ name: "", number: "", email: "" });
  useSystemBack(() => {
    setEditing(null);
    return true;
  }, !!editing);
  const save = () => {
    if (!form.name.trim() || !form.number.trim()) {
      dispatch({
        type: "TOAST",
        message: "Name and phone number are required",
      });
      return;
    }
    dispatch({ type: "ADD_CONTACT", contact: { ...form, favorite: false } });
    setEditing(null);
    setForm({ name: "", number: "", email: "" });
  };
  return (
    <div className="app-fill">
      <Header
        title="Contacts"
        subtitle={`${state.contacts.length} people · My number: ${activeNumber(state, state.defaults.calls === "ask" ? "physical" : state.defaults.calls)}`}
      />
      <div className="app-scroll">
        <ContactList onPick={(c) => setEditing(c)} />
      </div>
      <button className="fab" onClick={() => setEditing("new")}>
        ＋
      </button>
      {editing && (
        <div className="sheet contact-sheet">
          <h3>{editing === "new" ? "New contact" : editing.name}</h3>
          {editing === "new" ? (
            <>
              <FormField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <FormField
                label="Phone"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
              <FormField
                label="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Button tone="primary" onClick={save}>
                Save contact
              </Button>
            </>
          ) : (
            <>
              <Avatar name={editing.name} color={editing.color} />
              <p>
                {editing.number}
                <br />
                {editing.email}
                <br />
                {editing.notes}
              </p>
              <div className="action-grid">
                <Button
                  onClick={() => dispatch({ type: "OPEN_APP", id: "phone" })}
                >
                  Call
                </Button>
                <Button
                  onClick={() => dispatch({ type: "OPEN_APP", id: "messages" })}
                >
                  Message
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard?.writeText(JSON.stringify(editing));
                    dispatch({
                      type: "TOAST",
                      message: "Contact copied as JSON",
                    });
                  }}
                >
                  Share JSON
                </Button>
                <Button
                  onClick={() => {
                    dispatch({ type: "DELETE_CONTACT", id: editing.id });
                    setEditing(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
          <Button onClick={() => setEditing(null)}>Close</Button>
        </div>
      )}
    </div>
  );
}
