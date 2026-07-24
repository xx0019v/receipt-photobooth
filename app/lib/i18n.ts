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
    edition: "THE ARCHIVE",
    portrait: "BOARDING PASS",
  },
  sub: "EDITORIAL PRINT",
  idle: {
    tagline: "A MOMENT YOU CAN KEEP",
    cycle: [
      "Capture the moment.",
      "Compose the frame.",
      "Collect the edition.",
    ],
    cycleTail: "Issued in time.",
    steps: ["01 — Edition", "02 — Frame", "03 — Collect"],
    marquee: ["CAPTURE", "COMPOSE", "PROOF", "ISSUE", "COLLECT", "ARCHIVE"],
    cta: "CLAIM YOUR EDITION",
    location: "AT THE PRINT ENGINE",
  },
  scent: {
    step: "Step I · The Destination",
    title: ["Choose where", "this memory goes."],
    sub: "Your choice sets the destination, fragrance notes, and security mark printed with your portraits.",
    destination: "Printed destination",
    securityMark: "Security mark",
  },
  format: {
    step: "Step II · The Form",
    title: ["Choose how", "to keep it."],
    passName: "Boarding Pass",
    passTag: "A ticket, issued and stamped.",
    coverName: "Photo Film",
    coverTag: "Three frames, one editorial print.",
    selected: "Selected",
    continue: "Continue",
  },
  pose: {
    step: "Step III · The Pose",
    title: "Compose yourself.",
    cues: ["Chin up", "Shoulders square", "Eyes to the lens"],
    viewfinder: "Viewfinder",
    yourScent: "Your edition",
    start: "Start the shoot",
    frames: "frames",
  },
  capture: {
    recording: "Recording",
    frameLabel: (a: string, b: string) => `Frame ${a} / ${b}`,
    hold: "Hold",
  },
  review: {
    step: "Step V · The Proof",
    title: ["Ready to", "issue."],
    subTail: "Confirm your frames and serial. The edition is composed as it is printed.",
    retake: "Retake",
    print: "Print my pass",
  },
  print: {
    step: "Step VI · Boarding",
    title: ["Printing your", "pass"],
    progress: "printing pass",
  },
  done: {
    kickerTail: "",
    title: ["Your pass", "is ready."],
    body: "Collect your memory from below.",
    closing: "This moment was printed.",
    next: "Start next session",
    countdown: (n: number) => `Auto reset in ${n}s`,
  },
  pass: {
    title: "BOARDING PASS",
    from: "From",
    fromValue: "NOW",
    to: "To",
    airline: "THE RECEIPT · PRINT ENGINE",
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
    edition: "ザ・アーカイブ",
    portrait: "搭乗券",
  },
  sub: "エディショナル・プリント",
  idle: {
    tagline: "持ち帰れる一瞬",
    cycle: ["瞬間を、写す。", "構図を、組む。", "一枚を、受け取る。"],
    cycleTail: "時刻を添えて発行。",
    steps: ["01 — エディション", "02 — 構える", "03 — 受け取る"],
    marquee: ["写す", "組む", "校正", "発行", "受取", "保管"],
    cta: "エディションを受け取る",
    location: "プリントエンジンにて",
  },
  scent: {
    step: "STEP I · 行き先",
    title: ["記憶の行き先を", "選ぶ"],
    sub: "選択した行き先・香調・セキュリティマークが、写真と一緒に印刷されます。",
    destination: "印刷される行き先",
    securityMark: "セキュリティマーク",
  },
  format: {
    step: "STEP II · 形式",
    title: ["記憶の残し方を", "選ぶ"],
    passName: "搭乗券",
    passTag: "発行済みの一枚。",
    coverName: "フォトフィルム",
    coverTag: "三つの瞬間を、一本のエディションに",
    selected: "選択中",
    continue: "次へ",
  },
  pose: {
    step: "STEP III · 構え",
    title: "画面に合わせてください",
    cues: ["顎を上げて", "肩は水平に", "視線はレンズへ"],
    viewfinder: "ファインダー",
    yourScent: "選んだエディション",
    start: "撮影をはじめる",
    frames: "枚",
  },
  capture: {
    recording: "撮影中",
    frameLabel: (a: string, b: string) => `${a} / ${b} 枚目`,
    hold: "そのまま",
  },
  review: {
    step: "STEP V · 確認",
    title: ["発行の", "準備"],
    subTail: "写真とシリアルをご確認ください。仕上がりは発行と同時に印字されます。",
    retake: "撮り直す",
    print: "搭乗券を発券",
  },
  print: {
    step: "STEP VI · 搭乗手続き",
    title: ["チケットを", "発券しています"],
    progress: "搭乗券",
  },
  done: {
    kickerTail: "",
    title: ["搭乗券は", "準備できました"],
    body: "下からお受け取りください",
    closing: "この瞬間を印字しました。",
    next: "次のセッションを開始",
    countdown: (n: number) => `あと ${n} 秒で自動リセット`,
  },
  pass: {
    title: "搭乗券",
    from: "出発",
    fromValue: "いま",
    to: "行き先",
    airline: "ザ・レシート・プリントエンジン",
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

export type Copy = Dict;

/**
 * Bilingual luxury mode: English is always the primary voice. In JP mode a
 * short Japanese support line (`sub`) is offered under selected English copy —
 * never a full translation. Components choose which `sub` lines to show.
 */
type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Copy;
  sub: Copy | null;
};
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
    { value: { lang, setLang, t: en, sub: lang === "jp" ? jp : null } },
    children,
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
