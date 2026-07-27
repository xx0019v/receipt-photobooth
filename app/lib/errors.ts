/** Kiosk recovery states.
 *
 * `printer-offline` and `print-failed` are now raised by the real booth: a
 * backend that cannot be reached in hardware mode, an artefact the backend
 * refuses, or a job that ends in `error`. `camera` and `paper-empty` are
 * still reachable only through Staff Mode's TEST PRINT — the drivers do not
 * report those conditions distinctly yet. */
export type ErrorKind =
  | "camera"
  | "printer-offline"
  | "paper-empty"
  | "print-failed";

export type ErrorCopy = {
  title: string;
  jp: string;
  detail: string;
  detailJp: string;
  primary: string;
  primaryJp: string;
  secondary: string;
  secondaryJp: string;
};

export const ERROR_COPY: Record<ErrorKind, ErrorCopy> = {
  camera: {
    title: "CAMERA UNAVAILABLE",
    jp: "カメラを利用できません",
    detail: "The camera did not respond. It may need a moment to reconnect.",
    detailJp: "カメラが応答していません。再接続までお待ちください。",
    primary: "RETRY CAMERA",
    primaryJp: "カメラを再試行",
    secondary: "RETURN TO IDLE",
    secondaryJp: "はじめに戻る",
  },
  "printer-offline": {
    title: "PRINTER OFFLINE",
    jp: "プリンターがオフラインです",
    detail: "The print engine is not responding. Your proof is unchanged.",
    detailJp: "発行装置が応答していません。校正内容は保持されています。",
    primary: "RETRY",
    primaryJp: "再試行",
    secondary: "RETURN TO PROOF",
    secondaryJp: "校正に戻る",
  },
  "paper-empty": {
    title: "PAPER EMPTY",
    jp: "用紙切れです",
    detail: "The print engine is out of paper. Staff has been signalled.",
    detailJp: "用紙が切れています。スタッフにお知らせください。",
    primary: "CALL STAFF",
    primaryJp: "スタッフを呼ぶ",
    secondary: "RETURN TO PROOF",
    secondaryJp: "校正に戻る",
  },
  "print-failed": {
    title: "PRINTING PAUSED",
    jp: "印刷を一時停止しました",
    detail: "The edition stopped mid-registration. Nothing has been issued twice.",
    detailJp: "登録の途中で停止しました。二重発行は行われません。",
    primary: "RETRY PRINT",
    primaryJp: "印刷を再試行",
    secondary: "RETURN TO PROOF",
    secondaryJp: "校正に戻る",
  },
};
