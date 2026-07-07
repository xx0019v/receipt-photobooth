"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "jp";
/** A localized string. */
export type L = { en: string; jp: string };

/** English is the source of truth; JP must mirror its shape. */
const en = {
  cover: {
    edition: "SCENT MEMORY",
    portrait: "SCENT BOARDING PASS",
  },
  sub: "SCENT MEMORY",
  idle: {
    tagline: "A SCENT YOU CAN KEEP",
    cycle: [
      "Take home a scent.",
      "Take home a portrait.",
      "Take home a memory.",
    ],
    cycleTail: "Printed in time.",
    steps: ["01 — Choose", "02 — Pose", "03 — Keep"],
    marquee: ["POSE", "CHOOSE", "BREATHE", "PRINT", "KEEP", "REMEMBER"],
    cta: "CLAIM YOUR SCENT MEMORY",
    location: "BESIDE THE SCENT MACHINE",
  },
  scent: {
    step: "Step I · The Mood",
    title: ["How do you want", "to be remembered?"],
    sub: "Choose a scent. It boards with your portrait.",
  },
  pose: {
    step: "Step II · The Pose",
    title: "Compose yourself.",
    cues: ["Chin up", "Shoulders square", "Eyes to the lens"],
    viewfinder: "Viewfinder",
    yourScent: "Your scent",
    start: "Start the shoot",
    frames: "frames",
  },
  capture: {
    recording: "Recording",
    frameLabel: (a: string, b: string) => `Frame ${a} / ${b}`,
    hold: "Hold",
  },
  review: {
    step: "Step IV · The Proof",
    title: ["Your scent", "memory."],
    subTail: "Print your pass, or shoot again.",
    retake: "Retake",
    print: "Print my pass",
  },
  print: {
    step: "Step V · Boarding",
    title: ["Boarding your", "memory…"],
    progress: "boarding pass",
  },
  done: {
    kickerTail: "",
    title: ["Your memory", "has boarded."],
    body: "Tear along the dotted line beneath the slot. Scan the code to keep a digital copy of this moment.",
    closing: "This moment was printed.",
    next: "Tap anywhere for next guest",
    countdown: (n: number) => `New edition in ${n}s`,
  },
  pass: {
    title: "SCENT BOARDING PASS",
    from: "From",
    fromValue: "NOW",
    to: "To",
    airline: "SCENT MEMORY AIRWAYS",
    passenger: "Passenger",
    passengerValue: "GUEST",
    flight: "Flight",
    gate: "Gate",
    gateValue: "MEMORY",
    seat: "Seat",
    boarding: "Boarding",
    date: "Date",
    fragrance: "Fragrance",
    mood: "Mood",
    notes: ["Top", "Heart", "Base"],
    stub: "STUB",
    closing: "THIS MOMENT WAS PRINTED",
    keep: "KEEP THIS PASS",
    scan: ["Scan to keep", "a digital copy."],
  },
};

type Dict = typeof en;

const jp: Dict = {
  cover: {
    edition: "香りの記憶",
    portrait: "香りの搭乗券",
  },
  sub: "香りの記憶",
  idle: {
    tagline: "持ち帰れる香り",
    cycle: ["香りを、持ち帰る。", "面影を、持ち帰る。", "記憶を、持ち帰る。"],
    cycleTail: "時刻を添えて。",
    steps: ["01 — 選ぶ", "02 — 構える", "03 — 持ち帰る"],
    marquee: ["選ぶ", "構える", "呼吸", "印字", "記憶", "余韻"],
    cta: "香りの記憶を受け取る",
    location: "香水自販機のとなりで",
  },
  scent: {
    step: "STEP I · 気分",
    title: ["どんな香りで", "記憶されたい？"],
    sub: "香りをひとつ。面影とともに搭乗します。",
  },
  pose: {
    step: "STEP II · 構え",
    title: "姿勢を、整えて。",
    cues: ["顎を上げて", "肩は水平に", "視線はレンズへ"],
    viewfinder: "ファインダー",
    yourScent: "選んだ香り",
    start: "撮影をはじめる",
    frames: "枚",
  },
  capture: {
    recording: "撮影中",
    frameLabel: (a: string, b: string) => `${a} / ${b} 枚目`,
    hold: "そのまま",
  },
  review: {
    step: "STEP IV · 確認",
    title: ["あなたの", "香りの記憶。"],
    subTail: "搭乗券を発券、または撮り直す。",
    retake: "撮り直す",
    print: "搭乗券を発券",
  },
  print: {
    step: "STEP V · 搭乗手続き",
    title: ["記憶を", "搭乗手続き中…"],
    progress: "搭乗券",
  },
  done: {
    kickerTail: "",
    title: ["記憶は", "搭乗しました。"],
    body: "スロット下の点線で切り取ってください。コードから、この瞬間のデジタル控えを。",
    closing: "この瞬間を印字しました。",
    next: "次の方はタップ",
    countdown: (n: number) => `あと ${n} 秒で次へ`,
  },
  pass: {
    title: "香りの搭乗券",
    from: "出発",
    fromValue: "いま",
    to: "行き先",
    airline: "セント・メモリー航空",
    passenger: "搭乗者",
    passengerValue: "ゲスト",
    flight: "便名",
    gate: "ゲート",
    gateValue: "記憶",
    seat: "座席",
    boarding: "搭乗時刻",
    date: "日付",
    fragrance: "香り",
    mood: "気分",
    notes: ["トップ", "ミドル", "ラスト"],
    stub: "控え",
    closing: "この瞬間を印字しました",
    keep: "この搭乗券を、大切に",
    scan: ["読み取って", "控えを保存"],
  },
};

const DICT: Record<Lang, Dict> = { en, jp };
export type Copy = Dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Copy };
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("tr-lang");
    if (saved === "en" || saved === "jp") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("tr-lang", l);
    } catch {}
  }, []);

  return createElement(
    LangContext.Provider,
    { value: { lang, setLang, t: DICT[lang] } },
    children,
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
