import React, { useEffect, useRef, useState } from "react";
import {
  Leaf,
  Plus,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  CloudRain,
  Sparkles,
  ArrowUpRight,
  X,
  Droplets,
  Check,
  Download,
  Upload,
  BookOpen,
  ChevronDown,
  Sprout,
  Flower2,
  Trees,
  Lightbulb,
  Search,
  Eye,
} from "lucide-react";
const GardenScene = React.lazy(() =>
  import("./scene").then((m) => ({ default: m.GardenScene })),
);
import { useGarden, validateGarden, type Kind, type Mood } from "./store";
import { startAmbience, stopAmbience } from "./audio";
import "./style.css";
class SceneBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-loading">
        The garden couldn’t render. Your plants are still safe in Field notes.
      </div>
    ) : (
      this.props.children
    );
  }
}
const moods: { id: Mood; label: string; icon: typeof Moon; phrase: string }[] =
  [
    {
      id: "twilight",
      label: "Twilight",
      icon: Sun,
      phrase: "The world slows. Your mind can, too.",
    },
    {
      id: "dawn",
      label: "Daybreak",
      icon: Sun,
      phrase: "A fresh light. A little room to begin.",
    },
    {
      id: "rain",
      label: "Soft rain",
      icon: CloudRain,
      phrase: "Let the rain hold the noise for a while.",
    },
    {
      id: "moonlight",
      label: "Moonlight",
      icon: Moon,
      phrase: "Some things only glow in the quiet.",
    },
  ];
const kinds: {
  id: Kind;
  label: string;
  icon: typeof Leaf;
  description: string;
}[] = [
  {
    id: "thought",
    label: "Thought",
    icon: Sparkles,
    description: "A light to keep close",
  },
  {
    id: "task",
    label: "Task",
    icon: Flower2,
    description: "A small thing to nurture",
  },
  {
    id: "idea",
    label: "Idea",
    icon: Lightbulb,
    description: "Let curiosity spread",
  },
  {
    id: "goal",
    label: "Goal",
    icon: Trees,
    description: "Something to grow toward",
  },
];
export default function App() {
  const [immersive, setImmersive] = useState(false);
  const {
    plants,
    mood,
    ready,
    saveError,
    hydrate,
    add,
    update,
    remove,
    setMood,
    restore,
  } = useGarden();
  const [selected, setSelected] = useState<string | null>(null),
    [planting, setPlanting] = useState(false),
    [position, setPosition] = useState<[number, number]>(),
    [moodOpen, setMoodOpen] = useState(false),
    [journal, setJournal] = useState(false),
    [sound, setSound] = useState(false),
    [toast, setToast] = useState(""),
    [help, setHelp] = useState(false),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState<Kind>("thought"),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [confirmRelease, setConfirmRelease] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const current = plants.find((p) => p.id === selected);
  const moodInfo = moods.find((m) => m.id === mood)!;
  useEffect(() => {
    void hydrate();
    return () => stopAmbience();
  }, [hydrate]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (current) {
      setTitle(current.title);
      setBody(current.body);
      setKind(current.kind);
      setConfirmRelease(false);
    }
  }, [selected]);
  useEffect(() => {
    if (!planting && !selected && !help) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input, textarea, [tabindex="0"]',
        ) ?? [],
      );
    focusables()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      const first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [planting, selected, help]);
  function close() {
    setSelected(null);
    setPlanting(false);
    setConfirmRelease(false);
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setImmersive(false);
        close();
        setJournal(false);
        setMoodOpen(false);
        setHelp(false);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function newPlant(pos?: [number, number]) {
    if (plants.length >= 100) {
      setToast(
        "Your garden is full of life. Export a keepsake or release a plant to make room.",
      );
      return;
    }
    setSelected(null);
    setPosition(pos);
    setTitle("");
    setBody("");
    setKind("thought");
    setPlanting(true);
    setJournal(false);
  }
  function exportGarden() {
    const blob = new Blob(
      [JSON.stringify({ version: 1, plants, mood }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vesper-garden-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("A little piece of your garden, safely kept.");
  }
  async function importGarden(file?: File) {
    if (!file) return;
    try {
      if (file.size > 3e6) throw Error();
      const g: unknown = JSON.parse(await file.text());
      if (!validateGarden(g)) throw Error();
      const existing = new Set(plants.map((p) => p.id));
      const added = g.plants.filter((p) => !existing.has(p.id));
      if (plants.length + added.length > 100) {
        setToast("These gardens together would exceed 100 plants.");
        return;
      }
      restore({ version: 1, mood, plants: [...plants, ...added] });
      setToast(
        `${added.length} plants welcomed home. Existing plants were kept.`,
      );
    } catch {
      setToast(
        "That file isn’t a supported Vesper garden. Your garden is unchanged.",
      );
    }
    if (importRef.current) importRef.current.value = "";
  }
  async function toggleSound() {
    if (sound) {
      stopAmbience();
      setSound(false);
    } else {
      try {
        await startAmbience();
        setSound(true);
      } catch {
        stopAmbience();
        setToast("Sound couldn’t start in this browser.");
      }
    }
  }
  return (
    <main className={`app mood-${mood} ${immersive ? "immersive" : ""}`}>
      <div className="sky">
        <div className="halo" />
        <div className="moon" />
        <div className="mountain far" />
        <div className="mountain near" />
      </div>
      <div className="scene" inert={immersive}>
        <SceneBoundary>
          <React.Suspense
            fallback={<div className="scene-loading">Waking the garden…</div>}
          >
            <GardenScene
              mood={mood}
              plants={plants}
              selected={selected}
              onSelect={(id) => {
                setPlanting(false);
                setSelected(id);
                setJournal(false);
              }}
              onGround={(pos) => newPlant(pos)}
            />
          </React.Suspense>
        </SceneBoundary>
      </div>
      <button
        className="return-from-reverie"
        onClick={() => setImmersive(false)}
      >
        Return to the garden <span>ESC</span>
      </button>
      <header inert={immersive}>
        <a
          className="brand"
          href="#"
          aria-label="Vesper home"
          onClick={(e) => {
            e.preventDefault();
            close();
            setJournal(false);
          }}
        >
          <span className="brand-mark">
            <Sprout size={27} />
          </span>
          <span>
            vesper<span className="brand-dot">.</span>
          </span>
        </a>
        <span className="tagline">A GARDEN FOR YOUR MIND</span>
        <div className="header-actions">
          <span className="local-status">
            <i />{" "}
            {saveError
              ? "Backup recommended"
              : ready
                ? "Your own little world"
                : "Opening your garden…"}
          </span>
          <button
            aria-label="Just be here"
            className="reverie-button"
            onClick={() => {
              close();
              setJournal(false);
              setImmersive(true);
            }}
          >
            <Eye size={16} />
            <span>Just be here</span>
          </button>
          <button
            className="icon-button sound"
            onClick={toggleSound}
            aria-label={sound ? "Mute ambience" : "Play ambience"}
            title={sound ? "Mute ambience" : "Play ambience"}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            aria-label="Field notes"
            className="journal-button"
            onClick={() => {
              setJournal(!journal);
              close();
            }}
          >
            <BookOpen size={17} />
            <span>Field notes</span>
          </button>
        </div>
      </header>
      <section className="intro" inert={immersive}>
        <div className="eyebrow">
          <span /> A LITTLE WILD. ENTIRELY YOURS.
        </div>
        <h1>
          Let your
          <br />
          mind <em>wander.</em>
        </h1>
        <p>
          A place for passing thoughts,
          <br />
          small beginnings, and things that grow.
        </p>
        <div className="intro-rule" />
        <span className="intro-note">
          No hurry. No falling behind.
          <br />
          Just a little room to grow.
        </span>
      </section>
      <div className="garden-caption" inert={immersive}>
        <span className="caption-line" />
        <span>YOUR GARDEN, IN {moodInfo.label.toUpperCase()}</span>
        <p>{moodInfo.phrase}</p>
      </div>
      <footer inert={immersive}>
        <button className="help-button" onClick={() => setHelp(true)}>
          <span>?</span>
          <span>A gentle guide</span>
        </button>
        <div className="toolbar">
          <div className="mood-control">
            <button
              className="mood-button"
              onClick={() => setMoodOpen(!moodOpen)}
              aria-expanded={moodOpen}
            >
              <moodInfo.icon size={18} />
              <span>{moodInfo.label}</span>
              <ChevronDown size={13} />
            </button>
            {moodOpen && (
              <div className="mood-menu">
                <span className="menu-label">CHANGE THE ATMOSPHERE</span>
                {moods.map((m) => (
                  <button
                    className={m.id === mood ? "active" : ""}
                    key={m.id}
                    onClick={() => {
                      setMood(m.id);
                      setMoodOpen(false);
                    }}
                  >
                    <m.icon size={17} />
                    {m.label}
                    {m.id === mood && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="toolbar-divider" />
          <button
            className="plant-button"
            disabled={!ready}
            onClick={() => newPlant()}
          >
            <Plus size={19} />
            Plant something<span className="button-sparkle">✧</span>
          </button>
        </div>
        <div className="garden-count">
          <Sprout size={15} />
          <span>{plants.length} little beginnings</span>
          <i />
        </div>
      </footer>
      <div className="ground-hint">Touch a plant to get a little closer</div>
      {(planting || current) && (
        <div className="panel-shade" onClick={close}>
          <section
            className="plant-panel"
            role="dialog"
            aria-modal="true"
            aria-label={current ? "Tend your plant" : "Plant something"}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="panel-close icon-button"
              aria-label="Close"
              onClick={close}
            >
              <X size={20} />
            </button>
            <div className="panel-symbol">
              <Leaf size={30} />
            </div>
            <span className="eyebrow">
              {current
                ? "A LITTLE CARE GOES A LONG WAY"
                : "EVERYTHING BEGINS SOMEWHERE"}
            </span>
            <h2>{current ? "Stay with this one." : "What’s on your mind?"}</h2>
            <p className="panel-subtitle">
              {current
                ? "Give it your attention. Let it take its time."
                : "Big plans or passing thoughts. There’s room for both."}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!title.trim()) return;
                if (current) {
                  update(current.id, { title: title.trim(), body });
                  setToast("A little thought, safely kept.");
                } else {
                  const id = add(title.trim(), kind, body, position);
                  setPlanting(false);
                  setSelected(id);
                  setToast("A new beginning has taken root.");
                }
              }}
            >
              {!current && (
                <div className="kind-picker">
                  {kinds.map((k) => (
                    <button
                      type="button"
                      key={k.id}
                      className={kind === k.id ? "chosen" : ""}
                      onClick={() => setKind(k.id)}
                    >
                      <k.icon size={19} />
                      {k.label}
                    </button>
                  ))}
                </div>
              )}
              <label className="field-label" htmlFor="title">
                {current
                  ? "YOUR " + current.kind.toUpperCase()
                  : "GIVE IT A NAME"}
              </label>
              <input
                id="title"
                autoFocus
                required
                maxLength={160}
                placeholder="Something you'd like to grow…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="field-label" htmlFor="body">
                A LITTLE MORE, IF YOU LIKE
              </label>
              <textarea
                id="body"
                maxLength={10000}
                rows={4}
                placeholder="Let your thoughts find a home here."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              {current && (
                <div className="growth-status">
                  <div>
                    <span>
                      {current.growth === 4
                        ? "In full bloom"
                        : current.growth === 0
                          ? "A new beginning"
                          : `Growing, at its own pace`}
                    </span>
                    <span>{current.growth}/4</span>
                  </div>
                  <div className="growth-leaves">
                    {[0, 1, 2, 3].map((i) => (
                      <Leaf
                        key={i}
                        className={current.growth > i ? "grown" : ""}
                        size={22}
                      />
                    ))}
                  </div>
                </div>
              )}
              <button className="primary-button" type="submit">
                {current ? "Keep these thoughts" : "Plant a little beginning"}
                <ArrowUpRight size={18} />
              </button>
            </form>
            {current && (
              <>
                <div className="care-actions">
                  <button
                    disabled={current.growth === 4}
                    onClick={() => {
                      update(current.id, {
                        growth: Math.min(4, current.growth + 1),
                      });
                      setToast(
                        current.growth === 3
                          ? "Look at that. Something beautiful grew from your care."
                          : "A little attention. A little growth.",
                      );
                    }}
                  >
                    <Droplets size={17} />
                    {current.growth === 4 ? "Fully grown" : "Give it some care"}
                  </button>
                  {current.kind !== "thought" && current.growth < 4 && (
                    <button
                      onClick={() => {
                        update(current.id, { growth: 4 });
                        setToast("A beginning, now in bloom.");
                      }}
                    >
                      <Check size={17} />
                      Let it bloom
                    </button>
                  )}
                </div>
                {confirmRelease ? (
                  <div className="release-confirm">
                    Let this plant go?
                    <button
                      onClick={() => {
                        remove(current.id);
                        close();
                        setToast("Released, with room for something new.");
                      }}
                    >
                      Release
                    </button>
                    <button onClick={() => setConfirmRelease(false)}>
                      Keep it
                    </button>
                  </div>
                ) : (
                  <button
                    className="release-button"
                    onClick={() => setConfirmRelease(true)}
                  >
                    Release this plant
                  </button>
                )}
              </>
            )}
            <div className="panel-footnote">
              Nothing withers here. Come back whenever.
            </div>
          </section>
        </div>
      )}
      {journal && (
        <aside className="journal-panel" aria-label="Field notes">
          <div className="journal-top">
            <span className="eyebrow">A RECORD OF SMALL BEGINNINGS</span>
            <button
              className="icon-button"
              aria-label="Close field notes"
              onClick={() => setJournal(false)}
            >
              <X size={19} />
            </button>
          </div>
          <h2>Your field notes.</h2>
          <p>Every thought has a place.</p>
          <label className="search">
            <Search size={17} />
            <input
              placeholder="Find something you planted…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="journal-list">
            {plants
              .filter((p) =>
                (p.title + " " + p.body)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((p) => {
                const K = kinds.find((k) => k.id === p.kind)!;
                return (
                  <button
                    key={p.id}
                    className="journal-entry"
                    onClick={() => {
                      setSelected(p.id);
                      setJournal(false);
                    }}
                  >
                    <K.icon size={20} />
                    <span>
                      <strong>{p.title}</strong>
                      <small>
                        {p.kind} · {p.growth === 4 ? "in bloom" : "growing"}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                );
              })}
            {plants.filter((p) =>
              (p.title + " " + p.body)
                .toLowerCase()
                .includes(query.toLowerCase()),
            ).length === 0 && (
              <p className="empty">
                Nothing here yet. A little room for possibility.
              </p>
            )}
          </div>
          <div className="backup-actions">
            <button onClick={exportGarden}>
              <Download size={16} />
              Export garden
            </button>
            <button onClick={() => importRef.current?.click()}>
              <Upload size={16} />
              Import plants
            </button>
          </div>
          <small className="backup-note">
            Saved on this browser. Export a keepsake to carry it with you.
          </small>
        </aside>
      )}
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => void importGarden(e.target.files?.[0])}
      />
      {help && (
        <div className="panel-shade" onClick={() => setHelp(false)}>
          <section
            className="guide"
            role="dialog"
            aria-modal="true"
            aria-label="A gentle guide"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="panel-close icon-button"
              aria-label="Close guide"
              onClick={() => setHelp(false)}
            >
              <X size={20} />
            </button>
            <Sprout size={35} />
            <h2>A garden, at your pace.</h2>
            <p>
              Plant a thought in the earth. Come back when it calls to you. Or
              simply stay a while.
            </p>
            <div className="guide-kinds">
              {kinds.map((k) => (
                <div key={k.id}>
                  <k.icon size={22} />
                  <span>
                    <strong>{k.label}s</strong>
                    <small>{k.description}</small>
                  </span>
                </div>
              ))}
            </div>
            <p>
              Click open ground to plant. Touch a plant to tend it. Care makes
              it grow; finishing makes it bloom. Thoughts become floating
              lights, ideas become mushroom clusters, and goals become trees.
            </p>
            <p>
              There are no streaks or deadlines here. Nothing dies while you’re
              away.
            </p>
            <button className="primary-button" onClick={() => setHelp(false)}>
              Let’s wander
              <ArrowUpRight size={17} />
            </button>
          </section>
        </div>
      )}
      {saveError && (
        <div className="save-warning">
          Local saving is unavailable.{" "}
          <button onClick={exportGarden}>Export your garden</button> to keep it
          safe.
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <Leaf size={17} />
          {toast}
        </div>
      )}
    </main>
  );
}
