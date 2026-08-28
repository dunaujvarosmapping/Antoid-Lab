import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOS } from "../state/OSContext.jsx";
import { formatTime } from "../services/core.js";
import { sound, startAntoidNights } from "../services/audio.js";
import {
  Avatar,
  Button,
  Empty,
  FormField,
  Header,
  Offline,
  Segmented,
  Slider,
  Tabs,
  Toggle,
} from "../components/UI.jsx";

const videos = [
  {
    id: "tour",
    title: "Antoid 1 Official Tour",
    channel: "Antoid",
    duration: 78,
    color: ["#0f3e38", "#2bdca1"],
    scenes: [
      "Boot",
      "Home",
      "SIM insertion",
      "Carrier connection",
      "eSIM",
      "Wi-Fi",
      "Store",
      "Notifications",
      "Themes",
    ],
  },
  {
    id: "budapest",
    title: "Budapest Evening Walk",
    channel: "Budapest Views",
    duration: 72,
    color: ["#182b59", "#ed7f76"],
    scenes: [
      "Evening sky",
      "Danube river",
      "Bridge lights",
      "Walking motion",
      "Reflections",
      "Budapest captions",
    ],
  },
  {
    id: "breakfast",
    title: "Making the Perfect Breakfast",
    channel: "Home Kitchen",
    duration: 66,
    color: ["#7d3b24", "#f0bd63"],
    scenes: [
      "Ingredients",
      "Preparation",
      "Cooking",
      "Plating",
      "Finished breakfast",
    ],
  },
];
function VideoStage({ video, progress, captions }) {
  const scene =
    video.scenes[
      Math.min(
        video.scenes.length - 1,
        Math.floor((progress / video.duration) * video.scenes.length),
      )
    ];
  return (
    <div
      className={`video-stage scene-${video.id}`}
      style={{ "--v1": video.color[0], "--v2": video.color[1] }}
    >
      <div className="scene-sky" />
      <div className="scene-land">
        <i />
        <i />
        <i />
      </div>
      <div className="scene-orbit">
        {video.id === "budapest" ? "⌁" : video.id === "breakfast" ? "◉" : "A"}
      </div>
      {captions && (
        <span className="captions">{scene} · an original Antoid scene</span>
      )}
    </div>
  );
}
export function YouTubeApp() {
  const { state, set, dispatch } = useOS();
  const y = state.social.youtube,
    [tab, setTab] = useState("Home"),
    [query, setQuery] = useState(""),
    [comment, setComment] = useState(""),
    video = videos.find((v) => v.id === y.playing);
  useEffect(() => {
    if (video && !y.paused && y.progress < video.duration) {
      const id = setInterval(
        () =>
          set("social.youtube.progress", (p) =>
            Math.min(video.duration, p + 0.25 * (y.speed || 1)),
          ),
        250,
      );
      return () => clearInterval(id);
    }
  }, [video?.id, y.paused, y.speed, y.progress]);
  useEffect(() => {
    if (video && y.progress >= video.duration && !y.paused) {
      const i = videos.findIndex((v) => v.id === video.id);
      if (i < videos.length - 1) {
        set("social.youtube.playing", videos[i + 1].id);
        set("social.youtube.progress", 0);
      } else set("social.youtube.paused", true);
    }
  }, [y.progress]);
  const play = (v) => {
    sound("success", 0.035);
    set("social.youtube.playing", v.id);
    set("social.youtube.progress", 0);
    set("social.youtube.paused", false);
    set("social.youtube.history", [
      v.id,
      ...y.history.filter((x) => x !== v.id),
    ]);
  };
  const toggleList = (key, id) =>
    set(
      `social.youtube.${key}`,
      y[key].includes(id) ? y[key].filter((x) => x !== id) : [...y[key], id],
    );
  if (video)
    return (
      <div
        className={`youtube-player ${y.full ? "full" : ""} ${y.paused ? "paused" : "playing"}`}
      >
        <Header
          title="YouTube"
          action={
            <button onClick={() => set("social.youtube.mini", !y.mini)}>
              {y.mini ? "Expand" : "Mini"}
            </button>
          }
        />
        <VideoStage video={video} progress={y.progress} captions={y.captions} />
        <input
          type="range"
          min="0"
          max={video.duration}
          step=".1"
          value={y.progress}
          onChange={(e) => set("social.youtube.progress", +e.target.value)}
        />
        <div className="video-controls">
          <button onClick={() => set("social.youtube.progress", 0)}>↺</button>
          <button onClick={() => set("social.youtube.paused", !y.paused)}>
            {y.paused ? "▶" : "Ⅱ"}
          </button>
          <span>
            {formatTime(y.progress)} / {formatTime(video.duration)}
          </span>
          <button onClick={() => set("social.youtube.captions", !y.captions)}>
            CC
          </button>
          <select
            value={y.speed}
            onChange={(e) => set("social.youtube.speed", +e.target.value)}
          >
            <option value=".5">0.5×</option>
            <option value="1">1×</option>
            <option value="1.5">1.5×</option>
            <option value="2">2×</option>
          </select>
          <button onClick={() => set("social.youtube.muted", !y.muted)}>
            {y.muted ? "♩̸" : "♫"}
          </button>
          <button onClick={() => set("social.youtube.full", !y.full)}>⛶</button>
        </div>
        <div className="video-info app-scroll">
          <h2>{video.title}</h2>
          <p>
            {video.channel} · Original local animation · {video.scenes.length}{" "}
            scenes
          </p>
          <div className="social-actions">
            <button
              className={y.likes.includes(video.id) ? "active" : ""}
              onClick={() => toggleList("likes", video.id)}
            >
              ♡ Like
            </button>
            <button
              className={y.dislikes.includes(video.id) ? "active" : ""}
              onClick={() => toggleList("dislikes", video.id)}
            >
              Dislike
            </button>
            <button onClick={() => toggleList("watchLater", video.id)}>
              ＋ Watch later
            </button>
            <button
              onClick={() =>
                navigator.clipboard?.writeText(video.title) &&
                dispatch({
                  type: "TOAST",
                  message: "Video link copied locally",
                })
              }
            >
              Share
            </button>
          </div>
          <Button onClick={() => toggleList("subscribed", video.channel)}>
            {y.subscribed.includes(video.channel)
              ? "Subscribed ✓"
              : "Subscribe to " + video.channel}
          </Button>
          <h3>Comments</h3>
          <div className="inline-form">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment"
            />
            <Button
              onClick={() => {
                if (comment.trim()) {
                  set("social.youtube.comments", [
                    ...y.comments,
                    { id: String(Date.now()), video: video.id, text: comment },
                  ]);
                  setComment("");
                }
              }}
            >
              Post
            </Button>
          </div>
          {y.comments
            .filter((c) => c.video === video.id)
            .map((c) => (
              <p className="user-comment" key={c.id}>
                {c.text}
                <button
                  onClick={() => {
                    setComment(c.text);
                    set(
                      "social.youtube.comments",
                      y.comments.filter((x) => x.id !== c.id),
                    );
                    dispatch({
                      type: "TOAST",
                      message: "Comment moved to the editor",
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    set(
                      "social.youtube.comments",
                      y.comments.filter((x) => x.id !== c.id),
                    )
                  }
                >
                  Delete
                </button>
              </p>
            ))}
          <h3>Related</h3>
          {videos
            .filter((v) => v.id !== video.id)
            .map((v) => (
              <button
                className="related-video"
                key={v.id}
                onClick={() => play(v)}
              >
                <VideoStage video={v} progress={20} captions={false} />
                <b>{v.title}</b>
              </button>
            ))}
        </div>
      </div>
    );
  return (
    <div className="app-fill youtube">
      <Header
        title="YouTube"
        subtitle="3 local videos · no external connection"
      />
      <div className="youtube-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search videos, channels and library"
        />
        <button
          onClick={() =>
            dispatch({
              type: "TOAST",
              message: "YouTube notifications reviewed",
            })
          }
        >
          ♧
        </button>
      </div>
      <Tabs
        items={["Home", "Library", "Channels"]}
        active={tab}
        onChange={setTab}
      />
      <div className="video-feed app-scroll">
        {tab === "Library" && (
          <div className="library-stats">
            <span>History {y.history.length}</span>
            <span>Watch later {y.watchLater.length}</span>
            <span>Liked {y.likes.length}</span>
          </div>
        )}
        {videos
          .filter(
            (v) =>
              (tab !== "Channels" || true) &&
              (v.title + v.channel).toLowerCase().includes(query.toLowerCase()),
          )
          .map((v) => (
            <button className="video-card" key={v.id} onClick={() => play(v)}>
              <VideoStage
                video={v}
                progress={v.duration * 0.35}
                captions={false}
              />
              <div>
                <b>{v.title}</b>
                <span>
                  {v.channel} · {formatTime(v.duration)}
                </span>
                <small>{v.scenes.join(" · ")}</small>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

const basePosts = [
  {
    id: "g-bake",
    who: "Grandma",
    color: "#b37adb",
    text: "Apple cake is out of the oven! Mom brought cinnamon and Dad taste-tested the corners. Saving a slice for everyone. 🥧",
    kind: "cake",
    time: "2h",
    comments: ["Mom: It smells wonderful!", "Dad: Quality control passed."],
  },
  {
    id: "g-garden",
    who: "Grandma",
    color: "#b37adb",
    text: "The garden tomatoes finally turned red. Family lunch among the flowers this weekend?",
    kind: "garden",
    time: "Yesterday",
    comments: ["Mom: Sunday works!", "Alex: Beautiful garden."],
  },
  {
    id: "mom-day",
    who: "Mom",
    color: "#ed6e8a",
    text: "A quiet walk by the Danube before work.",
    kind: "river",
    time: "3h",
    comments: ["Dad: Great light."],
  },
  {
    id: "dad-tech",
    who: "Dad",
    color: "#5d9bec",
    text: "Learning the Antoid 1 network lab. EDGE really does make downloads crawl!",
    kind: "phone",
    time: "5h",
    comments: [],
  },
  {
    id: "antoid-page",
    who: "Antoid",
    color: "#3ce5aa",
    text: "Tip: airplane mode can keep Wi-Fi calling online after Wi-Fi is manually restored.",
    kind: "antoid",
    time: "1d",
    comments: [],
  },
];
function PostArt({ kind }) {
  return (
    <div className={`post-art ${kind}`}>
      <i />
      <i />
      <i />
      <b>
        {kind === "cake"
          ? "Grandma’s kitchen"
          : kind === "garden"
            ? "Weekend garden"
            : kind === "river"
              ? "Danube light"
              : kind === "phone"
                ? "Antoid lab"
                : "Antoid 1"}
      </b>
    </div>
  );
}
export function FacebookApp() {
  const { state, set, dispatch, net } = useOS();
  const f = state.social.facebook,
    [tab, setTab] = useState("Feed"),
    [post, setPost] = useState(""),
    [comment, setComment] = useState({});
  const posts = [...f.posts, ...basePosts];
  const react = (id) =>
    set("social.facebook.reactions", {
      ...f.reactions,
      [id]: f.reactions[id] ? null : "love",
    });
  const addPost = () => {
    if (!post.trim()) return;
    set("social.facebook.posts", [
      {
        id: String(Date.now()),
        who: "You",
        color: state.theme.accent,
        text: post,
        kind: "user",
        time: "Now",
        comments: [],
        user: true,
      },
      ...f.posts,
    ]);
    setPost("");
  };
  return (
    <div className="app-fill facebook">
      <Header
        title="facebook"
        subtitle={`${net.isOnline ? "Synced locally" : "Offline · saved feed"} · family network`}
      />
      <Tabs
        items={["Feed", "Friends", "Groups", "Events", "Marketplace", "Menu"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Feed" ? (
        <div className="feed app-scroll">
          <div className="create-post">
            <Avatar small name="You" color={state.theme.accent} />
            <input
              value={post}
              onChange={(e) => setPost(e.target.value)}
              placeholder="Share something with family…"
            />
            <Button onClick={addPost}>Post</Button>
            <button
              onClick={() => dispatch({ type: "OPEN_APP", id: "gallery" })}
            >
              Gallery
            </button>
          </div>
          {posts.map((p) => (
            <article className="post" key={p.id}>
              <header>
                <Avatar small name={p.who} color={p.color} />
                <div>
                  <b>{p.who}</b>
                  <span>{p.time} · Local</span>
                </div>
                {p.user && (
                  <button
                    onClick={() =>
                      set(
                        "social.facebook.posts",
                        f.posts.filter((x) => x.id !== p.id),
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </header>
              <p>{p.text}</p>
              <PostArt kind={p.kind} />
              <div className="reaction-count">
                {f.reactions[p.id]
                  ? "❤️ You reacted"
                  : "♡ Be the first to react"}{" "}
                · {(p.comments?.length || 0) + (comment[p.id] ? 1 : 0)} comments
              </div>
              <div className="post-actions">
                <button
                  className={f.reactions[p.id] ? "active" : ""}
                  onClick={() => react(p.id)}
                >
                  React
                </button>
                <button
                  onClick={() => document.getElementById(`fb-${p.id}`)?.focus()}
                >
                  Comment
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "TOAST",
                      message: "Shared to your local Facebook timeline",
                    })
                  }
                >
                  Share
                </button>
                <button
                  className={f.saved.includes(p.id) ? "active" : ""}
                  onClick={() =>
                    set(
                      "social.facebook.saved",
                      f.saved.includes(p.id)
                        ? f.saved.filter((x) => x !== p.id)
                        : [...f.saved, p.id],
                    )
                  }
                >
                  Save
                </button>
              </div>
              {p.comments?.map((c, i) => (
                <p className="fb-comment" key={i}>
                  {c}
                  <button
                    onClick={() =>
                      dispatch({
                        type: "TOAST",
                        message: "Reply thread opened",
                      })
                    }
                  >
                    Reply
                  </button>
                </p>
              ))}
              <div className="inline-form">
                <input
                  id={`fb-${p.id}`}
                  value={comment[p.id] || ""}
                  onChange={(e) =>
                    setComment({ ...comment, [p.id]: e.target.value })
                  }
                  placeholder="Write a comment"
                />
                <button
                  onClick={() => {
                    if (comment[p.id]) {
                      p.comments.push(`You: ${comment[p.id]}`);
                      setComment({ ...comment, [p.id]: "" });
                      set("social.facebook.reactions", { ...f.reactions });
                    }
                  }}
                >
                  ↑
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <SocialSection
          name={tab}
          onMessenger={() => dispatch({ type: "OPEN_APP", id: "messenger" })}
        />
      )}
    </div>
  );
}
function SocialSection({ name, onMessenger }) {
  const { dispatch } = useOS();
  const content =
    {
      Friends: [
        "Mom · Friend",
        "Dad · Friend",
        "Grandma · Family",
        "Alex Kovács · Request",
      ],
      Groups: [
        "Budapest Neighbors",
        "Antoid Enthusiasts",
        "Home Cooking Circle",
      ],
      Events: [
        "Family lunch · Tomorrow",
        "Garden weekend · Saturday",
        "Budapest lights walk · Aug 30",
      ],
      Marketplace: [
        "Ceramic lamp · 12 000 Ft",
        "Phone stand · 4 500 Ft",
        "Garden tools · 8 000 Ft",
      ],
      Menu: [
        "Saved posts",
        "Notifications",
        "Profiles",
        "Dark mode",
        "Messenger chat",
      ],
    }[name] || [];
  return (
    <div className="social-section app-scroll">
      <h2>{name}</h2>
      {content.map((x) => (
        <button
          key={x}
          onClick={
            x.includes("Messenger")
              ? onMessenger
              : () =>
                  dispatch({
                    type: "MODAL",
                    modal: {
                      title: x,
                      body: `${name} details are saved locally in Antoid 1.`,
                      actions: [
                        {
                          label:
                            name === "Marketplace" ? "Save listing" : "Close",
                        },
                      ],
                    },
                  })
          }
        >
          <b>{x}</b>
          <span>
            {name === "Marketplace"
              ? "Local listing · tap to save"
              : "Open local details"}
          </span>
        </button>
      ))}
    </div>
  );
}

export function GmailApp() {
  const { state, set, dispatch, net } = useOS();
  const [folder, setFolder] = useState("inbox"),
    [compose, setCompose] = useState(false),
    [q, setQ] = useState(""),
    [view, setView] = useState(null);
  useEffect(() => {
    if (net.isOnline && state.emails.some((e) => e.folder === "outbox")) {
      set(
        "emails",
        state.emails.map((e) =>
          e.folder === "outbox" ? { ...e, folder: "sent" } : e,
        ),
      );
      dispatch({
        type: "NOTIFY",
        title: "Outbox sent",
        body: "Queued Antoid mail was delivered locally.",
        app: "Gmail",
      });
    }
  }, [net.isOnline]);
  const folders = [
    "inbox",
    "starred",
    "snoozed",
    "archive",
    "sent",
    "drafts",
    "spam",
    "trash",
    "outbox",
  ];
  const emails = state.emails.filter(
    (e) =>
      (folder === "starred" ? e.starred : e.folder === folder) &&
      (e.subject + e.from + e.body).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div className="app-fill gmail">
      <Header
        title="Gmail"
        subtitle={`${state.setup.username || "user"}@antoid.id · local mail`}
      />
      <div className="mail-search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search mail"
        />
        {folder === "trash" ? (
          <button
            onClick={() =>
              dispatch({
                type: "MODAL",
                modal: {
                  title: "Empty Trash?",
                  body: "Permanently remove all local mail in Trash.",
                  actions: [
                    { label: "Cancel" },
                    {
                      label: "Empty",
                      onClick: () =>
                        set(
                          "emails",
                          state.emails.filter((e) => e.folder !== "trash"),
                        ),
                    },
                  ],
                },
              })
            }
          >
            Empty Trash
          </button>
        ) : (
          <button onClick={() => setCompose(true)}>Compose</button>
        )}
      </div>
      <div className="mail-folders">
        {folders.map((f) => (
          <button
            className={folder === f ? "active" : ""}
            key={f}
            onClick={() => setFolder(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}{" "}
            <small>
              {
                state.emails.filter((e) =>
                  f === "starred" ? e.starred : e.folder === f,
                ).length
              }
            </small>
          </button>
        ))}
      </div>
      <div className="mail-list app-scroll">
        {emails.map((m) => (
          <button
            className={m.read ? "" : "unread"}
            key={m.id}
            onClick={() => {
              setView(m);
              set(
                "emails",
                state.emails.map((e) =>
                  e.id === m.id ? { ...e, read: true } : e,
                ),
              );
            }}
          >
            <Avatar small name={m.from} />
            <div>
              <b>{m.from}</b>
              <strong>{m.subject}</strong>
              <span>{m.body}</span>
            </div>
            <i
              onClick={(e) => {
                e.stopPropagation();
                set(
                  "emails",
                  state.emails.map((x) =>
                    x.id === m.id ? { ...x, starred: !x.starred } : x,
                  ),
                );
              }}
            >
              {m.starred ? "★" : "☆"}
            </i>
          </button>
        ))}
        {!emails.length && (
          <Empty
            title={`No ${folder} mail`}
            body="This local folder is empty."
          />
        )}
      </div>
      <button className="fab" onClick={() => setCompose(true)}>
        ✎
      </button>
      {(compose || view) && (
        <MailSheet
          mail={view}
          compose={compose}
          onClose={() => {
            setCompose(false);
            setView(null);
          }}
        />
      )}
    </div>
  );
}
function MailSheet({ mail, compose, onClose }) {
  const { state, dispatch, set } = useOS();
  const [writing, setWriting] = useState(compose);
  const [form, setForm] = useState(
    mail && compose
      ? {
          to: mail.from,
          subject: `Re: ${mail.subject}`,
          body: `\n\n— Replying to —\n${mail.body}`,
        }
      : { to: "", subject: "", body: "" },
  );
  const send = () => {
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) {
      dispatch({
        type: "TOAST",
        message: "Recipient, subject and message are required",
      });
      return;
    }
    dispatch({ type: "SEND_MAIL", email: form });
    onClose();
  };
  if (mail && !writing)
    return (
      <div className="mail-sheet">
        <header>
          <button onClick={onClose}>‹</button>
          <b>{mail.subject}</b>
          <button
            onClick={() =>
              set(
                "emails",
                state.emails.map((e) =>
                  e.id === mail.id ? { ...e, folder: "trash" } : e,
                ),
              )
            }
          >
            ⌫
          </button>
        </header>
        <p>
          <strong>{mail.from}</strong> to{" "}
          {mail.to || `${state.setup.username || "user"}@antoid.id`}
        </p>
        <article>{mail.body}</article>
        <div className="action-grid">
          <Button
            onClick={() => {
              set(
                "emails",
                state.emails.map((e) =>
                  e.id === mail.id ? { ...e, folder: "archive" } : e,
                ),
              );
              onClose();
            }}
          >
            Archive
          </Button>
          <Button
            onClick={() => {
              setForm({
                to: mail.from,
                subject: `Re: ${mail.subject}`,
                body: `\n\n— Replying to —\n${mail.body}`,
              });
              setWriting(true);
            }}
          >
            Reply
          </Button>
          <Button
            onClick={() => {
              setForm({
                to: [mail.from, mail.to].filter(Boolean).join(", "),
                subject: `Re: ${mail.subject}`,
                body: `\n\n— Replying to all —\n${mail.body}`,
              });
              setWriting(true);
            }}
          >
            Reply all
          </Button>
          <Button
            onClick={() => {
              setForm({
                to: "",
                subject: `Fwd: ${mail.subject}`,
                body: `\n\n— Forwarded message —\n${mail.body}`,
              });
              setWriting(true);
            }}
          >
            Forward
          </Button>
          <Button
            onClick={() => {
              set(
                "emails",
                state.emails.map((e) =>
                  e.id === mail.id ? { ...e, folder: "inbox" } : e,
                ),
              );
              onClose();
            }}
          >
            Restore
          </Button>
        </div>
      </div>
    );
  return (
    <div className="mail-sheet">
      <header>
        <button
          onClick={() => {
            if (form.to || form.subject || form.body)
              set("emails", [
                {
                  id: String(Date.now()),
                  folder: "drafts",
                  from: "You",
                  ...form,
                  time: Date.now(),
                  read: true,
                  starred: false,
                },
                ...state.emails,
              ]);
            onClose();
          }}
        >
          ×
        </button>
        <b>New message</b>
        <button onClick={send}>Send</button>
      </header>
      <input
        placeholder="Recipients"
        value={form.to}
        onChange={(e) => setForm({ ...form, to: e.target.value })}
      />
      <input
        placeholder="Subject"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />
      <textarea
        placeholder="Write email"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <footer>
        <Button onClick={() => dispatch({ type: "OPEN_APP", id: "gallery" })}>
          Attach Gallery image
        </Button>
        <small>
          {state.contacts
            .map((c) => c.email)
            .filter(Boolean)
            .join(" · ")}
        </small>
      </footer>
    </div>
  );
}

export function SpotifyApp() {
  const { state, set } = useOS();
  const s = state.social.spotify,
    [tab, setTab] = useState("Home"),
    engine = useRef(null);
  useEffect(() => () => engine.current?.stop(), []);
  useEffect(() => {
    engine.current?.setVolume(state.sound.media / 100);
  }, [state.sound.media]);
  useEffect(() => {
    let id;
    if (s.playing)
      id = setInterval(
        () =>
          set("social.spotify.progress", (p) =>
            p >= 60 ? (s.repeat ? 0 : 60) : p + 0.25,
          ),
        250,
      );
    return () => clearInterval(id);
  }, [s.playing, s.repeat]);
  const toggle = () => {
    if (s.playing) {
      engine.current?.stop();
      engine.current = null;
      set("social.spotify.playing", false);
    } else {
      engine.current = startAntoidNights(state.sound.media / 100);
      set("social.spotify.playing", true);
    }
  };
  return (
    <div className="app-fill spotify">
      <Header title="Spotify" subtitle="Original local music" />
      <Tabs
        items={["Home", "Search", "Library"]}
        active={tab}
        onChange={setTab}
      />
      <div className="spotify-body app-scroll">
        <div className={`album-art ${s.playing ? "playing" : ""}`}>
          <i />
          <b>A</b>
          <span>ANTOИD NIGHTS</span>
        </div>
        <p className="eyebrow">ANTOИD SOUND LAB · ORIGINAL PROCEDURAL SINGLE</p>
        <h1>Antoid Nights</h1>
        <p>
          A 60-second original arrangement with synth melody, chord movement,
          bass, generated kick and percussion, intro, main section, breakdown
          and outro.
        </p>
        <div className="lyric-line">
          {
            [
              "City glass catches the violet light",
              "Quiet signals cross the night",
              "Green horizons, moving slow",
              "Antoid nights begin to glow",
            ][Math.min(3, Math.floor(s.progress / 15))]
          }
        </div>
        <div className="equalizer">
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
        <input
          type="range"
          min="0"
          max="60"
          value={s.progress}
          onChange={(e) => set("social.spotify.progress", +e.target.value)}
        />
        <div className="track-time">
          <span>{formatTime(s.progress)}</span>
          <span>1:00</span>
        </div>
        <div className="music-controls">
          <button
            className={s.shuffle ? "active" : ""}
            onClick={() => set("social.spotify.shuffle", !s.shuffle)}
          >
            ⌘
          </button>
          <button
            onClick={() =>
              set("social.spotify.progress", Math.max(0, s.progress - 10))
            }
          >
            |‹
          </button>
          <button className="play" onClick={toggle}>
            {s.playing ? "Ⅱ" : "▶"}
          </button>
          <button
            onClick={() =>
              set("social.spotify.progress", Math.min(60, s.progress + 10))
            }
          >
            ›|
          </button>
          <button
            className={s.repeat ? "active" : ""}
            onClick={() => set("social.spotify.repeat", !s.repeat)}
          >
            ↻
          </button>
        </div>
        <Slider
          label="Volume"
          value={state.sound.media}
          onChange={(v) => {
            set("sound.media", v);
            set("social.spotify.volume", v);
          }}
        />
        <div className="social-actions">
          <button
            className={s.liked ? "active" : ""}
            onClick={() => set("social.spotify.liked", !s.liked)}
          >
            ♡ Liked Songs
          </button>
          <button
            onClick={() =>
              set("social.spotify.playlists", [
                ...new Set([...s.playlists, "Antoid Favorites"]),
              ])
            }
          >
            ＋ Playlist
          </button>
          <button onClick={() => set("social.spotify.progress", 0)}>
            Queue: Antoid Nights
          </button>
        </div>
        <h3>Library & playlists</h3>
        {s.playlists.map((p) => (
          <button
            className="playlist-row"
            key={p}
            onClick={() => {
              set("social.spotify.progress", 0);
              if (!s.playing) toggle();
              setTab("Home");
            }}
          >
            <span>♫</span>
            <b>{p}</b>
            <small>1 local track</small>
          </button>
        ))}
      </div>
    </div>
  );
}

const stories = [
  ["Mom", "#ed6e8a", "Danube morning"],
  ["Dad", "#5d9bec", "Antoid lab"],
  ["Grandma", "#b37adb", "Garden blooms"],
  ["Antoid", "#3ce5aa", "Antoid 1 tips"],
  ["Budapest Life", "#ef8b55", "City sunset"],
];
const instaPosts = [
  ["Antoid", "Antoid phone in aurora glass. Built for you.", "antoid"],
  ["Budapest Life", "Evening reflections along the river.", "river"],
  ["Grandma", "The garden is ready for our weekend.", "garden"],
  ["Home Kitchen", "Breakfast, plated at last.", "cake"],
  ["Mom", "A little family moment to keep.", "family"],
];
export function InstagramApp() {
  const { state, set, dispatch, net } = useOS();
  const ig = state.social.instagram,
    [tab, setTab] = useState("Feed"),
    [story, setStory] = useState(null),
    [progress, setProgress] = useState(0),
    [paused, setPaused] = useState(false),
    [caption, setCaption] = useState(""),
    [dm, setDm] = useState("");
  useEffect(() => {
    if (story !== null && !paused) {
      const id = setInterval(
        () =>
          setProgress((p) => {
            if (p >= 100) {
              if (story < stories.length - 1) {
                setStory(story + 1);
                return 0;
              } else {
                setStory(null);
                return 0;
              }
            }
            return p + 2;
          }),
        100,
      );
      return () => clearInterval(id);
    }
  }, [story, paused]);
  const toggle = (key, id) =>
    set(
      `social.instagram.${key}`,
      ig[key].includes(id) ? ig[key].filter((x) => x !== id) : [...ig[key], id],
    );
  return (
    <div className="app-fill instagram">
      <Header
        title="Instagram"
        subtitle={`${net.isOnline ? "Local feed synced" : "Offline · saved posts"} · @${state.setup.username || "user"}`}
      />
      <Tabs
        items={["Feed", "Explore", "Create", "Activity", "Profile"]}
        active={tab}
        onChange={setTab}
      />
      {tab === "Feed" ? (
        <div className="insta-feed app-scroll">
          <div className="stories">
            {stories.map((s, i) => (
              <button
                key={s[0]}
                onClick={() => {
                  setStory(i);
                  setProgress(0);
                  toggle("viewed", s[0]);
                }}
              >
                <span
                  className={ig.viewed.includes(s[0]) ? "viewed" : ""}
                  style={{ "--story": s[1] }}
                >
                  {s[0][0]}
                </span>
                <small>{s[0]}</small>
              </button>
            ))}
          </div>
          {instaPosts.map((p, i) => (
            <article className="insta-post" key={p[0]}>
              <header>
                <Avatar small name={p[0]} />
                <b>{p[0]}</b>
                <button
                  onClick={() =>
                    dispatch({
                      type: "TOAST",
                      message: "Post options: save, share or report locally",
                    })
                  }
                >
                  •••
                </button>
              </header>
              <PostArt kind={p[2]} />
              <div className="post-actions">
                <button
                  className={ig.liked.includes(i) ? "active" : ""}
                  onClick={() => toggle("liked", i)}
                >
                  ♡
                </button>
                <button
                  onClick={() =>
                    dispatch({
                      type: "TOAST",
                      message: "Comment field focused",
                    })
                  }
                >
                  ◯
                </button>
                <button
                  onClick={() =>
                    dispatch({ type: "OPEN_APP", id: "messenger" })
                  }
                >
                  ↗
                </button>
                <button
                  className={ig.saved.includes(i) ? "active" : ""}
                  onClick={() => toggle("saved", i)}
                >
                  ▱
                </button>
              </div>
              <p>
                <b>{p[0]}</b> {p[1]}
              </p>
              <div className="inline-form">
                <input
                  value={caption[i] || ""}
                  onChange={(e) =>
                    setCaption({ ...caption, [i]: e.target.value })
                  }
                  placeholder="Add a comment"
                />
                <button
                  onClick={() => {
                    if (caption[i]) {
                      set("social.instagram.posts", [
                        ...ig.posts,
                        { id: Date.now(), comment: caption[i], post: i },
                      ]);
                      setCaption({ ...caption, [i]: "" });
                    }
                  }}
                >
                  Post
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : tab === "Create" ? (
        <CreateInstagram />
      ) : tab === "Profile" ? (
        <ProfileInstagram />
      ) : (
        <SocialSection
          name={
            tab === "Explore"
              ? "Groups"
              : tab === "Activity"
                ? "Events"
                : "Friends"
          }
          onMessenger={() => dispatch({ type: "OPEN_APP", id: "messenger" })}
        />
      )}
      {story !== null && (
        <div
          className="story-viewer"
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
        >
          <div className="story-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <header>
            <Avatar small name={stories[story][0]} color={stories[story][1]} />
            <b>{stories[story][0]}</b>
            <button onClick={() => setStory(null)}>×</button>
          </header>
          <PostArt
            kind={["river", "phone", "garden", "antoid", "river"][story]}
          />
          <span className="story-caption">
            {stories[story][2]} · {paused ? "Paused" : "Playing"}
          </span>
          <button
            className="story-back"
            onClick={() => {
              setStory(Math.max(0, story - 1));
              setProgress(0);
            }}
          />
          <button
            className="story-next"
            onClick={() => {
              if (story < stories.length - 1) {
                setStory(story + 1);
                setProgress(0);
              } else setStory(null);
            }}
          />
          <footer>
            <input
              value={dm}
              onChange={(e) => setDm(e.target.value)}
              placeholder="Reply…"
            />
            <button
              onClick={() => {
                if (dm) {
                  set("social.instagram.dms", [
                    ...ig.dms,
                    { to: stories[story][0], text: dm, time: Date.now() },
                  ]);
                  setDm("");
                }
              }}
            >
              Send
            </button>
            <button onClick={() => sound("tap")}>♡</button>
            <button onClick={() => set("social.instagram.muted", !ig.muted)}>
              {ig.muted ? "♩̸" : "♫"}
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
function CreateInstagram() {
  const { state, set, dispatch } = useOS();
  const [caption, setCaption] = useState(""),
    [filter, setFilter] = useState("Natural"),
    [crop, setCrop] = useState("Square");
  return (
    <div className="create-instagram app-scroll">
      <h2>Create post or story</h2>
      <PostArt kind="user" />
      <Segmented
        value={filter}
        onChange={setFilter}
        items={["Natural", "Warm", "Mono"]}
        label="Filter"
      />
      <Segmented
        value={crop}
        onChange={setCrop}
        items={["Square", "Portrait", "Wide"]}
        label="Crop"
      />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption…"
      />
      <Button onClick={() => dispatch({ type: "OPEN_APP", id: "gallery" })}>
        Choose from Gallery
      </Button>
      <Button
        tone="primary"
        onClick={() => {
          if (!caption)
            return dispatch({
              type: "TOAST",
              message: "Write a caption first",
            });
          set("social.instagram.posts", [
            { id: Date.now(), caption, filter, crop },
            ...state.social.instagram.posts,
          ]);
          dispatch({ type: "TOAST", message: "Instagram post shared locally" });
          setCaption("");
        }}
      >
        Share post
      </Button>
      <Button
        onClick={() =>
          dispatch({
            type: "TOAST",
            message: "Story created for your local followers",
          })
        }
      >
        Share as story
      </Button>
    </div>
  );
}
function ProfileInstagram() {
  const { state, set } = useOS();
  const [edit, setEdit] = useState(false);
  return (
    <div className="profile-insta app-scroll">
      <Avatar
        name={`${state.setup.firstName || "Antoid"} ${state.setup.lastName || "User"}`}
        color={state.theme.accent}
      />
      <h2>@{state.setup.username || "user"}</h2>
      <p>Exploring Antoid 1 from Budapest.</p>
      <div>
        <span>
          <b>{state.social.instagram.posts.length}</b> posts
        </span>
        <span>
          <b>5</b> followers
        </span>
        <span>
          <b>5</b> following
        </span>
      </div>
      <Button onClick={() => setEdit(!edit)}>Edit profile</Button>
      {edit && (
        <FormField
          label="Bio"
          defaultValue="Exploring Antoid 1 from Budapest."
        />
      )}
      <h3>Saved posts</h3>
      <p>
        {state.social.instagram.saved.length} saved ·{" "}
        {state.social.instagram.dms.length} direct messages
      </p>
    </div>
  );
}
