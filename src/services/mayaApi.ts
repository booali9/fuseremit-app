import { postJson } from "./api";
import { getAccessTokenAsync } from "./session";

export type MayaChatMessage = { role: "user" | "model"; text: string };

export interface MayaInsights {
  bullets: string[];
}

export interface MayaScore {
  score: number;
  summary: string;
}

export interface MayaRecipientSuggestion {
  name: string;
  country: string;
  reason: string;
  amount: number;
}

export interface MayaRatePrediction {
  currentRate: number;
  predictedRate: number;
  currentChangePct: number;
  predictedChangePct: number;
  advice: string;
}

export interface MayaFeeTip {
  message: string;
}

export interface MayaVoiceRecipient {
  name: string;
  country: string;
  bank: string;
  account: string;
  deliveryMethod: string;
  receivedCurrency: string;
}

export interface MayaVoiceCommand {
  transcript: string;
  reply: string;
  intent: "send_money" | "check_balance" | "transfer_status" | "other";
  recipientName: string;
  amount: number;
  currency: string;
  /** Non-null only when the spoken name matched someone the user has sent money to before. */
  recipient: MayaVoiceRecipient | null;
  exchange: { rate: number; receivedCurrency: string } | null;
  /** True when the transfer can go straight to the PIN screen. */
  ready: boolean;
}

const authToken = async () => getAccessTokenAsync();

export const mayaChat = async (
  message: string,
  history: MayaChatMessage[] = [],
) => {
  const token = await authToken();
  const res = await postJson<{ reply: string }>(
    "/maya/chat",
    { message, history },
    token ?? undefined,
  );
  return res.data.reply;
};

/** Insights are derived server-side from the user's real profile + transfer history. */
export const mayaInsights = async () => {
  const token = await authToken();
  const res = await postJson<MayaInsights>("/maya/insights", {}, token ?? undefined);
  return res.data;
};

export const mayaScore = async () => {
  const token = await authToken();
  const res = await postJson<MayaScore>("/maya/score", {}, token ?? undefined);
  return res.data;
};

const recommendations = async <T>(payload: Record<string, unknown>) => {
  const token = await authToken();
  const res = await postJson<T>("/maya/recommendations", payload, token ?? undefined);
  return res.data;
};

/** Ranked from the user's real past recipients — empty when they have no transfer history. */
export const mayaRecipientSuggestions = async () => {
  const data = await recommendations<{ suggestions: MayaRecipientSuggestion[] }>({
    type: "recipients",
  });
  return data.suggestions ?? [];
};

export const mayaRatePrediction = async (base = "USD", target = "NGN") =>
  recommendations<MayaRatePrediction>({ type: "rate", base, target });

export const mayaFeeTip = async (payload: {
  amount: number;
  feeTotal: number;
  deliveryMethod?: string;
  cheapestFee?: number;
}) => recommendations<MayaFeeTip>({ type: "fee", ...payload });

export const mayaVoiceCommand = async (payload: {
  audioBase64?: string;
  mimeType?: string;
  text?: string;
}) => {
  const token = await authToken();
  const res = await postJson<MayaVoiceCommand>(
    "/maya/voice-command",
    payload,
    token ?? undefined,
  );
  return res.data;
};
