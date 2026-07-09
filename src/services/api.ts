import { Platform } from "react-native";
import { getRefreshTokenAsync, updateAccessToken, updateRefreshToken } from "./session";

const productionBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.fuseremit.com/api/v1";

const localDevBase =
  process.env.EXPO_PUBLIC_DEV_API_BASE_URL ??
  (Platform.OS === "android"
    ? "http://10.0.2.2:4000/api/v1"
    : "http://localhost:4000/api/v1");

// Dev builds use EXPO_PUBLIC_DEV_API_BASE_URL when set; otherwise same API as release.
export const API_BASE_URL =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_API_BASE_URL
    ? localDevBase
    : productionBase;

export const TEST_OTP = "000000";

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

const normalizeToken = (accessToken?: string | null): string | undefined => {
  if (typeof accessToken !== "string") return undefined;
  const token = accessToken.trim();
  if (!token || token.split(".").length !== 3) return undefined;
  return token;
};

/** Auth fields for fetch — duplicate token for proxies that strip Authorization. */
export const authHeaderFields = (
  accessToken?: string | null,
): Record<string, string> => {
  const token = normalizeToken(accessToken);
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
    "X-Access-Token": token,
  };
};

/** Append token to URL — CloudFront often strips auth headers. */
export const withAccessTokenQuery = (
  path: string,
  accessToken?: string | null,
): string => {
  const token = normalizeToken(accessToken);
  if (!token) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}access_token=${encodeURIComponent(token)}`;
};

const buildHeaders = (accessToken?: string): Record<string, string> => ({
  "Content-Type": "application/json",
  ...authHeaderFields(accessToken),
});

const parsePathAndQuery = (path: string) => {
  const q = path.indexOf("?");
  if (q < 0) return { basePath: path, params: {} as Record<string, string> };
  const basePath = path.slice(0, q);
  const params = Object.fromEntries(new URLSearchParams(path.slice(q + 1)));
  return { basePath, params };
};

const fetchOptions = (
  accessToken?: string | null,
  extraBody: Record<string, string> = {},
): RequestInit => {
  const token = normalizeToken(accessToken);
  if (token) {
    return {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ access_token: token, ...extraBody }),
      credentials: "include",
    };
  }
  return {
    method: "GET",
    headers: buildHeaders(),
    credentials: "include",
  };
};

const tryRefreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = await getRefreshTokenAsync();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: buildHeaders(),
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  const json = await parseJsonResponse<{ accessToken: string; refreshToken?: string }>(
    response,
    "/auth/refresh",
  );

  const accessToken = normalizeToken(json.data.accessToken);
  if (!accessToken) return null;

  await updateAccessToken(accessToken);
  if (json.data.refreshToken?.trim()) {
    await updateRefreshToken(json.data.refreshToken);
  }
  return accessToken;
};

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
  const token = normalizeToken(accessToken);
  const body = token ? { ...(payload as object), access_token: token } : payload;

  if (__DEV__) {
    console.log(`[API] POST ${API_BASE_URL}${path}${token ? " +auth" : ""}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseJsonResponse<TResponse>(response, path);
};

export const getJson = async <TResponse>(
  path: string,
  accessToken?: string,
  retried = false,
): Promise<ApiEnvelope<TResponse>> => {
  const token = normalizeToken(accessToken);
  const { basePath, params } = parsePathAndQuery(path);
  const url = `${API_BASE_URL}${basePath}`;

  if (__DEV__) {
    console.log(`[API] ${token ? "POST" : "GET"} ${url}${token ? " +auth" : ""}`);
  }

  const response = await fetch(url, fetchOptions(accessToken, params));

  try {
    return await parseJsonResponse<TResponse>(response, path);
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      !retried &&
      token
    ) {
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        return getJson<TResponse>(path, newToken, true);
      }
    }
    throw error;
  }
};

export const putJson = async <
  TResponse,
  TPayload extends any = any,
>(
  path: string,
  payload: TPayload,
  accessToken?: string,
): Promise<ApiEnvelope<TResponse>> => {
  const token = normalizeToken(accessToken);
  const body = token ? { ...(payload as object), access_token: token } : payload;

  if (__DEV__) {
    console.log(`[API] PUT ${API_BASE_URL}${path}${token ? " +auth" : ""}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(body),
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
  const token = normalizeToken(accessToken);
  const body = token ? { ...(payload as object), access_token: token } : payload;

  if (__DEV__) {
    console.log(`[API] PATCH ${API_BASE_URL}${path}${token ? " +auth" : ""}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: buildHeaders(accessToken),
    credentials: "include",
    body: JSON.stringify(body),
  });

  return parseJsonResponse<TResponse>(response, path);
};
