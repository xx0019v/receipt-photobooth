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

/** Which layout the printed artefact uses. */
export type PrintStyle = "pass" | "cover";

type Ctx = { style: PrintStyle; setStyle: (s: PrintStyle) => void };
const PrintStyleContext = createContext<Ctx | null>(null);

export function PrintStyleProvider({ children }: { children: ReactNode }) {
  const [style, setStyleState] = useState<PrintStyle>("pass");

  useEffect(() => {
    const saved = window.localStorage.getItem("tr-print-style");
    if (saved === "pass" || saved === "cover") setStyleState(saved);
  }, []);

  const setStyle = useCallback((s: PrintStyle) => {
    setStyleState(s);
    try {
      window.localStorage.setItem("tr-print-style", s);
    } catch {}
  }, []);

  return createElement(
    PrintStyleContext.Provider,
    { value: { style, setStyle } },
    children,
  );
}

export function usePrintStyle(): Ctx {
  const ctx = useContext(PrintStyleContext);
  if (!ctx) throw new Error("usePrintStyle must be used within PrintStyleProvider");
  return ctx;
}
