import { create } from "zustand";
import { get, set } from "idb-keyval";
export type Kind = "thought" | "task" | "idea" | "goal";
export type Mood = "twilight" | "dawn" | "rain" | "moonlight";
export type Plant = {
  id: string;
  title: string;
  body: string;
  kind: Kind;
  growth: number;
  x: number;
  z: number;
  seed: number;
  created: string;
};
export type Garden = { version: 1; plants: Plant[]; mood: Mood };
const starter: Plant[] = [
  {
    id: "welcome",
    title: "A little space to breathe",
    body: "This is your garden. Stay a while. Nothing here is ever behind.\n\nThese first plants are yours to keep, edit, or release.",
    kind: "goal",
    growth: 3,
    x: -3.2,
    z: -1.6,
    seed: 12,
    created: new Date().toISOString(),
  },
  {
    id: "idea",
    title: "Something wonderful, someday",
    body: "An idea doesn’t need a plan yet. Give it a little room.",
    kind: "idea",
    growth: 2,
    x: 2.7,
    z: -0.8,
    seed: 44,
    created: new Date().toISOString(),
  },
  {
    id: "task",
    title: "Make time for something small",
    body: "A walk. A page. A moment without a screen.",
    kind: "task",
    growth: 2,
    x: -1.6,
    z: 2.2,
    seed: 71,
    created: new Date().toISOString(),
  },
  {
    id: "thought",
    title: "You can begin again, softly",
    body: "There is no falling behind here.",
    kind: "thought",
    growth: 1,
    x: 3.5,
    z: 1.6,
    seed: 23,
    created: new Date().toISOString(),
  },
];
export function validateGarden(value: unknown): value is Garden {
  if (!value || typeof value !== "object") return false;
  const g = value as Garden;
  return (
    g.version === 1 &&
    ["twilight", "dawn", "rain", "moonlight"].includes(g.mood) &&
    Array.isArray(g.plants) &&
    g.plants.length <= 100 &&
    new Set(g.plants.map((p) => p?.id)).size === g.plants.length &&
    g.plants.every(
      (p) =>
        p &&
        typeof p.id === "string" &&
        typeof p.title === "string" &&
        p.title.trim().length > 0 &&
        p.title.length <= 160 &&
        typeof p.body === "string" &&
        p.body.length <= 10000 &&
        ["thought", "task", "idea", "goal"].includes(p.kind) &&
        Number.isInteger(p.growth) &&
        p.growth >= 0 &&
        p.growth <= 4 &&
        Number.isFinite(p.x) &&
        Math.abs(p.x) <= 5 &&
        Number.isFinite(p.z) &&
        Math.abs(p.z) <= 3.5 &&
        Number.isFinite(p.seed) &&
        typeof p.created === "string",
    )
  );
}
export function findOpenSoil(plants: Plant[]): [number, number] {
  let best: [number, number] = [-3, 2],
    bestDistance = -1;
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * 8 - 4,
      z = Math.random() * 5 - 2.5;
    if (((x - 0.6) / 1.9) ** 2 + ((z - 0.1) / 1.5) ** 2 < 1) continue;
    const distance = Math.min(
      ...plants.map((p) => Math.hypot(p.x - x, p.z - z)),
      10,
    );
    if (distance > bestDistance) {
      bestDistance = distance;
      best = [x, z];
    }
  }
  return best;
}
let writes = Promise.resolve();
function save() {
  const { plants, mood } = useGarden.getState();
  const data: Garden = { version: 1, plants, mood };
  writes = writes
    .catch(() => {})
    .then(() => set("vesper-garden-v1", data))
    .then(() => useGarden.setState({ saveError: false }))
    .catch(() => useGarden.setState({ saveError: true }));
}
type State = {
  plants: Plant[];
  mood: Mood;
  ready: boolean;
  saveError: boolean;
  add: (
    title: string,
    kind: Kind,
    body: string,
    position?: [number, number],
  ) => string;
  update: (
    id: string,
    changes: Partial<Pick<Plant, "title" | "body" | "growth">>,
  ) => void;
  remove: (id: string) => void;
  setMood: (m: Mood) => void;
  restore: (g: Garden) => void;
  hydrate: () => Promise<void>;
};
export const useGarden = create<State>((update) => ({
  plants: starter,
  mood: "dawn",
  ready: false,
  saveError: false,
  add: (title, kind, body, position) => {
    const id = crypto.randomUUID();
    const pos = position ?? findOpenSoil(useGarden.getState().plants);
    update((s) => ({
      plants: [
        ...s.plants,
        {
          id,
          title,
          body,
          kind,
          growth: 0,
          x: pos[0],
          z: pos[1],
          seed: Math.random() * 1000,
          created: new Date().toISOString(),
        },
      ],
    }));
    save();
    return id;
  },
  update: (id, changes) => {
    update((s) => ({
      plants: s.plants.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    }));
    save();
  },
  remove: (id) => {
    update((s) => ({ plants: s.plants.filter((p) => p.id !== id) }));
    save();
  },
  setMood: (mood) => {
    update({ mood });
    save();
  },
  restore: (g) => {
    update({ plants: g.plants, mood: g.mood });
    save();
  },
  hydrate: async () => {
    try {
      const data = await get("vesper-garden-v1");
      if (data !== undefined) {
        if (!validateGarden(data)) throw Error("Invalid save");
        update({ plants: data.plants, mood: data.mood });
      }
      update({ ready: true });
    } catch {
      update({ ready: true, saveError: true });
    }
  },
}));
