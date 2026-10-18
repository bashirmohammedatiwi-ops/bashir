"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "./api";
import { useAuth } from "./stores/auth";

// ── أنواع رد «ديما» (نفس engine/types.ts في السيرفر)

export type Chip = { label: string; value: string; emoji?: string };
export type AdvProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  shadeCount: number;
  reasons: string[];
  match: number;
  why?: { ok: boolean; text: string }[];
  similarity?: number;
  saving?: number;
};
export type Knowledge = { title: string; kind: string; intro?: string; sections: { label: string; icon: string; bullets: string[] }[]; verdict?: { tone: "good" | "care" | "avoid"; text: string } };
export type Compare = { products: AdvProduct[]; rows: { label: string; values: string[]; best?: number }[]; winner?: number; verdict: string };
export type Fit = { product: AdvProduct; tone: "good" | "ok" | "care"; headline: string; points: { ok: boolean | null; text: string }[] };
export type RoutineStep = { step: string; label: string; emoji: string; when: "am" | "pm" | "both" | "any"; product: AdvProduct; owned?: boolean };
export type Personal = { title: string; note: string; kind: "refill" | "next"; products: AdvProduct[] };
export type Quiz = { id: string; title: string; question: string; step: number; total: number; options: Chip[]; multi?: boolean };
export type Profile = { skinType?: string; concerns?: string[]; hairConcerns?: string[]; families?: string[]; gender?: string; avoid?: string[] };

export type Reply = {
  messages: string[];
  chips: Chip[];
  products?: AdvProduct[];
  groups?: { title: string; products: AdvProduct[] }[];
  routine?: { title: string; steps: RoutineStep[]; total: number; emoji?: string; brand?: string };
  quiz?: Quiz;
  knowledge?: Knowledge;
  compare?: Compare;
  fit?: Fit;
  anchor?: AdvProduct;
  personal?: Personal[];
  profileUpdate?: Partial<Profile>;
  understood?: { key: string; label: string }[];
  prompts?: string[];
  state?: Record<string, unknown>;
};

export type Entry = { id: number; who: "me"; text: string } | { id: number; who: "bot"; reply: Reply; rated?: boolean };

export const isAction = (v: string) => /^(set|add|unset|act|quiz|skip):/.test(v);

export const ASK_LABELS: Record<string, string> = {
  fit: "🤔 هل يناسبني؟",
  dupe: "💸 بديل أرخص منه",
  complement: "🧩 شنو يكمّله؟",
  howto: "📖 شلون أستخدمه؟",
  similar: "🔁 شي يشبهه",
};

const SKIN_AR: Record<string, string> = { dry: "جافة", oily: "دهنية", combination: "مختلطة", normal: "عادية", sensitive: "حساسة" };

/** يدمج ما تعلّمته «ديما» في ملف الزبونة ويعيد ملاحظة قصيرة لما حُفظ. */
function merge(p: Profile, u: Partial<Profile>): [Profile, string | null] {
  const next: Profile = { ...p };
  const notes: string[] = [];
  for (const [k, v] of Object.entries(u) as [keyof Profile, unknown][]) {
    if (Array.isArray(v)) {
      const cur = (next[k] as string[] | undefined) ?? [];
      const add = (v as string[]).filter((x) => !cur.includes(x));
      if (add.length) {
        (next[k] as string[]) = [...cur, ...add];
        notes.push(add.join("، "));
      }
    } else if (typeof v === "string" && v && next[k] !== v) {
      (next[k] as string) = v;
      notes.push(k === "skinType" ? `بشرة ${SKIN_AR[v] ?? v}` : v);
    }
  }
  return [next, notes.length ? notes.join(" • ") : null];
}

const KEEP_MS = 6 * 60 * 60 * 1000;
let seq = Date.now();

type AdvisorState = {
  open: boolean;
  entries: Entry[];
  state: Record<string, unknown> | null;
  profile: Profile;
  thinking: boolean;
  error: string | null;
  notice: string | null;
  prompts: string[];
  lastActive: number;
  comparing: AdvProduct[];
  pending: { message?: string; action?: string } | null;
  setOpen: (v: boolean) => void;
  start: (o?: { productId?: string; ask?: string; q?: string; action?: string; label?: string }) => Promise<void>;
  send: (text: string) => Promise<void>;
  tap: (c: Chip) => Promise<void>;
  act: (label: string | null, action: string) => Promise<void>;
  answerQuiz: (picked: Chip[]) => Promise<void>;
  rate: (id: number, liked: boolean) => void;
  toggleCompare: (p: AdvProduct) => boolean;
  compareNow: () => Promise<void>;
  reset: () => Promise<void>;
  retry: () => Promise<void>;
  clearProfile: () => void;
};

const firstName = () => useAuth.getState().user?.name?.trim().split(/\s+/)[0];

export const track = (type: "click" | "cart" | "like" | "dislike", productId?: string, sig?: string) =>
  api("/advisor/feedback", { method: "POST", auth: false, body: { type, productId, sig } }).catch(() => null);

export const signature = (r: Reply) => {
  const need = (r.state?.need ?? {}) as { area?: string; kinds?: string[] };
  return [need.area, need.kinds?.[0]].filter(Boolean).join("|");
};

export const useAdvisor = create<AdvisorState>()(
  persist(
    (set, get) => {
      let gen = 0;
      const turn = async (me: string | null, body: { message?: string; action?: string }) => {
        const g = gen;
        set((s) => ({ entries: me ? [...s.entries, { id: ++seq, who: "me" as const, text: me }] : s.entries, thinking: true, error: null, pending: body, lastActive: Date.now() }));
        const t0 = Date.now();
        try {
          const reply = await api<Reply>("/advisor/chat", { method: "POST", body: { ...body, state: get().state ?? undefined, firstName: firstName(), profile: get().profile } });
          const wait = 600 - (Date.now() - t0);
          if (wait > 0) await new Promise((r) => setTimeout(r, wait));
          if (g !== gen) return;
          let notice: string | null = null;
          let profile = get().profile;
          if (reply.profileUpdate && Object.keys(reply.profileUpdate).length) {
            const [p, n] = merge(profile, reply.profileUpdate);
            profile = p;
            if (n) notice = `حفظت في ملفكِ: ${n}`;
          }
          set((s) => ({ entries: [...s.entries, { id: ++seq, who: "bot", reply }], state: reply.state ?? s.state, thinking: false, pending: null, profile, notice }));
        } catch (e) {
          if (g !== gen) return;
          set({ thinking: false, error: (e as Error).message || "تعذّر الاتصال بديما" });
        }
      };
      const welcome = async () => {
        const g = gen;
        set({ thinking: true, error: null });
        try {
          const reply = await api<Reply>("/advisor/welcome", { method: "POST", body: { firstName: firstName() } });
          if (g !== gen) return;
          set({ entries: [{ id: ++seq, who: "bot", reply }], prompts: reply.prompts ?? [], thinking: false, lastActive: Date.now() });
        } catch (e) {
          if (g !== gen) return;
          set({ thinking: false, error: (e as Error).message || "تعذّر الاتصال بديما" });
        }
      };
      return {
        open: false,
        entries: [],
        state: null,
        profile: {},
        thinking: false,
        error: null,
        notice: null,
        prompts: [],
        lastActive: 0,
        comparing: [],
        pending: null,
        setOpen: (open) => set({ open }),
        start: async (o = {}) => {
          if (get().entries.length && Date.now() - get().lastActive > KEEP_MS) {
            gen++;
            set({ entries: [], state: null, comparing: [] });
          }
          if (!get().entries.length && !get().thinking) await welcome();
          if (o.productId) {
            const label = o.ask ? ASK_LABELS[o.ask] : null;
            await turn(label, { action: `set:focus=${o.productId};act:${o.ask && label ? o.ask : "focus"}` });
          } else if (o.action) await turn(o.label ?? null, { action: o.action });
          else if (o.q?.trim()) await turn(o.q.trim(), { message: o.q.trim() });
        },
        send: async (text) => {
          const t = text.trim();
          if (!t || get().thinking) return;
          await turn(t, { message: t });
        },
        tap: async (c) => {
          if (get().thinking) return;
          const label = [c.emoji, c.label].filter(Boolean).join(" ");
          await turn(label, isAction(c.value) ? { action: c.value } : { message: c.value });
        },
        act: async (label, action) => {
          if (get().thinking) return;
          await turn(label, { action });
        },
        answerQuiz: async (picked) => {
          if (!picked.length || get().thinking) return;
          await turn(picked.map((c) => [c.emoji, c.label].filter(Boolean).join(" ")).join("، "), { action: `quiz:ans=${picked.map((c) => c.value).join(";")}` });
        },
        rate: (id, liked) => {
          const e = get().entries.find((x) => x.id === id);
          if (!e || e.who !== "bot" || e.rated) return;
          const ids = [...(e.reply.products ?? []), ...(e.reply.groups ?? []).flatMap((g) => g.products)].map((p) => p.id).slice(0, liked ? 3 : 2);
          ids.forEach((pid) => track(liked ? "like" : "dislike", pid, signature(e.reply)));
          set({ entries: get().entries.map((x) => (x.id === id ? { ...x, rated: true } : x)) });
        },
        toggleCompare: (p) => {
          const list = [...get().comparing];
          const i = list.findIndex((x) => x.id === p.id);
          if (i >= 0) list.splice(i, 1);
          else if (list.length >= 3) return false;
          else list.push(p);
          set({ comparing: list });
          return true;
        },
        compareNow: async () => {
          const ids = get().comparing.map((p) => p.id);
          if (ids.length < 2) return;
          set({ comparing: [] });
          await turn("قارني بينهم ⚖️", { action: `set:compare=${ids.join(",")};act:compare` });
        },
        reset: async () => {
          gen++;
          set({ entries: [], state: null, comparing: [], pending: null, error: null, thinking: false });
          await welcome();
        },
        retry: async () => {
          const p = get().pending;
          if (!get().entries.length) return welcome();
          if (p) await turn(null, p);
        },
        clearProfile: () => set({ profile: {} }),
      };
    },
    {
      name: "dh-advisor",
      partialize: (s) => ({ entries: s.entries.slice(-40), state: s.state, profile: s.profile, prompts: s.prompts, lastActive: s.lastActive }),
    },
  ),
);
