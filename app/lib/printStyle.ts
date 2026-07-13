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

export function PrintStyleProvider({
  children,
  resetKey,
}: {
  children: ReactNode;
  resetKey?: string;
}) {
  const [style, setStyleState] = useState<PrintStyle>("pass");

  useEffect(() => {
    if (resetKey) setStyleState("pass");
  }, [resetKey]);

  const setStyle = useCallback((s: PrintStyle) => {
    setStyleState(s);
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
