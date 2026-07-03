import { Platform } from "react-native";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.fuseremit.com/api/v1";


export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: {
    code?: string;
    message?: string;
    category?: string;
  } | null;
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const buildHeaders = (accessToken?: string): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
});

const parseJsonResponse = async <TResponse>(
  response: Response,
  path: string,
): Promise<ApiEnvelope<TResponse>> => {
  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.clone().text();

  if (!contentType.includes("application/json")) {
    const bodySnippet = responseText.trim().slice(0, 200);
    throw new Error(
      `Invalid JSON response from ${path}: ${response.status} ${response.statusText}${
        bodySnippet ? ` - ${bodySnippet}` : ""
      }`,
    );
  }

  let json: ApiEnvelope<TResponse>;
  try {
    json = JSON.parse(responseText) as ApiEnvelope<TResponse>;
  } catch (error) {
    const bodySnippet = responseText.trim().slice(0, 200);
    throw new Error(
      `Failed to parse JSON from ${path}: ${bodySnippet || response.statusText}`,
    );
  }

  if (__DEV__) {
    console.log(
      `[API] ${response.status} ${path} requestId=${json.meta?.requestId ?? "n/a"}`,
    );
  }

  if (!response.ok || !json.success) {
    const message = json.error?.message || "Request failed";
    throw new ApiError(message, response.status);
  }

  return json;
};

export const postJson = async <
  TResponse,
  TPayload extends any = any,
>(
  path: string,
  payload: TPayload,
  accessToken?: string,
): Promise<ApiEnvelope<TResponse>> => {
  if (__DEV__) {
    console.log(`[API] POST ${API_BASE_URL}${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<TResponse>(response, path);
};

export const getJson = async <TResponse>(
  path: string,
  accessToken?: string,
): Promise<ApiEnvelope<TResponse>> => {
  if (__DEV__) {
    console.log(`[API] GET ${API_BASE_URL}${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: buildHeaders(accessToken),
  });

  return parseJsonResponse<TResponse>(response, path);
};

export const putJson = async <
  TResponse,
  TPayload extends any = any,
>(
  path: string,
  payload: TPayload,
  accessToken?: string,
): Promise<ApiEnvelope<TResponse>> => {
  if (__DEV__) {
    console.log(`[API] PUT ${API_BASE_URL}${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<TResponse>(response, path);
};

export const patchJson = async <
  TResponse,
  TPayload extends any = any,
>(
  path: string,
  payload: TPayload,
  accessToken?: string,
): Promise<ApiEnvelope<TResponse>> => {
  if (__DEV__) {
    console.log(`[API] PATCH ${API_BASE_URL}${path}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<TResponse>(response, path);
};
