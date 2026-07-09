import { postJson, getJson, ApiEnvelope, API_BASE_URL } from "./api";
import { getAccessToken, getAccessTokenAsync } from "./session";

export interface CreatePaymentIntentRequest {
  amount: number;
  currency?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface StatusEvent {
  status: string;
  label: string;
  timestamp: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  statusTimeline: StatusEvent[];
  type: "deposit" | "withdrawal" | "transfer";
  deliveryMethod?: "bank_transfer" | "cash_pickup" | "mobile_wallet";
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  recipientCountry?: string;
  exchangeRate?: number;
  fee?: number;
  amountReceived?: number;
  receivedCurrency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferRequest {
  amount: number;
  currency?: string;
  deliveryMethod: "bank_transfer" | "cash_pickup" | "mobile_wallet";
  recipientName: string;
  recipientBank?: string;
  recipientAccount?: string;
  recipientCountry: string;
  exchangeRate: number;
  fee: number;
  amountReceived: number;
  receivedCurrency: string;
}

export const createPaymentIntent = async (
  payload: CreatePaymentIntentRequest,
): Promise<PaymentIntentResponse> => {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token found");

  const response = await postJson<PaymentIntentResponse>(
    "/payments/create-intent",
    payload,
    token,
  );
  return response.data;
};

export const listTransactions = async (
  params: { limit?: number; offset?: number; type?: string } = {},
): Promise<{ transactions: Transaction[]; total: number }> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.type) qs.set("type", params.type);

  const res = await getJson<{ transactions: Transaction[]; total: number }>(
    `/payments/transactions?${qs.toString()}`,
    token,
  );
  return res.data;
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await getJson<Transaction>(`/payments/transactions/${id}`, token);
  return res.data;
};

export const createTransfer = async (
  payload: CreateTransferRequest,
): Promise<Transaction> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await postJson<Transaction>("/payments/transactions/transfer", payload, token);
  return res.data;
};

export const repeatTransfer = async (id: string): Promise<Transaction> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await postJson<Transaction>(`/payments/transactions/${id}/repeat`, {}, token);
  return res.data;
};

export const exportTransactionsUrl = async (from?: string, to?: string): Promise<string> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  qs.set("format", "csv");

  return `${API_BASE_URL}/payments/transactions/export?${qs.toString()}`;
};
