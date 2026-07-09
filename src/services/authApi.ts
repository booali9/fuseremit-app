import { postJson, patchJson } from "./api";

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
}

export interface RegisterResponse {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  accountTier?: "Classic" | "Premium";
  persistenceVerified: boolean;
  challengeId?: string;
  unverifiedExisting?: boolean;
  // Only present when the backend's dev OTP bypass is active (local dev, SMTP skipped).
  otp?: string;
}

export interface LoginOtpRequest {
  email?: string;
  phoneNumber?: string;
  password?: string;
}

export interface LoginOtpResponse {
  challengeId?: string;
  expiresAt?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    accountTier: string;
  };
  // Only present when the backend's dev OTP bypass is active (local dev, SMTP skipped).
  otp?: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  otp: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    hasPin: boolean;
  };
  requiresPinSetup: boolean;
}

export interface CreatePinResponse {
  hasPin: boolean;
}

export interface LogoutResponse {
  loggedOut: boolean;
}

export const requestEmailLoginOtp = async (payload: LoginOtpRequest) => {
  const res = await postJson<LoginOtpResponse, LoginOtpRequest>("/auth/login", payload);
  return res.data;
};

export const registerAccount = async (payload: RegisterRequest) => {
  const res = await postJson<RegisterResponse, RegisterRequest>(
    "/auth/register",
    payload,
  );

  return res.data;
};

export const verifyEmailLoginOtp = async (payload: VerifyOtpRequest) => {
  const res = await postJson<
    VerifyOtpResponse & { access_token?: string; refresh_token?: string },
    VerifyOtpRequest
  >("/auth/otp/verify", { ...payload, otp: payload.otp.trim() });

  const raw = res.data;
  const accessToken =
    (typeof raw.accessToken === "string" ? raw.accessToken : raw.access_token)?.trim() ?? "";
  const refreshToken =
    (typeof raw.refreshToken === "string" ? raw.refreshToken : raw.refresh_token)?.trim();

  return { ...raw, accessToken, refreshToken };
};

export const resendEmailLoginOtp = async (challengeId: string) => {
  const res = await postJson<
    { challengeId: string; expiresAt: string; otp?: string },
    { challengeId: string }
  >(
    "/auth/otp/resend",
    { challengeId },
  );

  return res.data;
};

export const createPin = async (payload: { pin: string }, accessToken: string) => {
  const res = await postJson<CreatePinResponse, { pin: string }>(
    "/auth/pin/create",
    payload,
    accessToken,
  );

  return res.data;
};

export const logoutAccount = async (accessToken?: string) => {
  const res = await postJson<LogoutResponse, Record<string, never>>(
    "/auth/logout",
    {},
    accessToken,
  );

  return res.data;
};

export interface ForgotPinRequest {
  email: string;
}

export interface ForgotPinVerifyRequest {
  challengeId: string;
  otp: string;
  newPin: string;
}

export interface BiometricSetupResponse {
  biometricToken: string;
}

export interface BiometricLoginRequest {
  biometricToken: string;
}

export const requestForgotPinOtp = async (payload: ForgotPinRequest) => {
  const res = await postJson<{ challengeId: string; expiresAt: string; otp?: string }, ForgotPinRequest>(
    "/auth/pin/reset/request",
    payload,
  );
  return res.data;
};

export const verifyForgotPinOtp = async (payload: ForgotPinVerifyRequest) => {
  const res = await postJson<{ success: boolean }, ForgotPinVerifyRequest>(
    "/auth/pin/reset/verify",
    payload,
  );
  return res.data;
};

export const setupBiometric = async (payload: { pin: string }, accessToken: string) => {
  const res = await postJson<BiometricSetupResponse, { pin: string }>(
    "/auth/biometric/setup",
    payload,
    accessToken,
  );
  return res.data;
};

export const biometricLogin = async (payload: BiometricLoginRequest) => {
  const res = await postJson<VerifyOtpResponse, BiometricLoginRequest>(
    "/auth/biometric/login",
    payload,
  );
  return res.data;
};

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface ProfileUpdateResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountTier: string;
}

export const updateProfile = async (
  payload: ProfileUpdateData,
  token: string
): Promise<ProfileUpdateResponse> => {
  const res = await patchJson<ProfileUpdateResponse, ProfileUpdateData>("/auth/profile", payload, token);
  return res.data;
};

export const toggleTwoFactor = async (
  enabled: boolean,
  token: string
): Promise<{ enabled: boolean }> => {
  const res = await patchJson<{ enabled: boolean }, { enabled: boolean }>("/auth/2fa", { enabled }, token);
  return res.data;
};

export interface SecurityQuestion {
  question: string;
  answer: string;
}

export const updateSecurityQuestions = async (
  questions: SecurityQuestion[],
  token: string
): Promise<{ success: boolean }> => {
  const res = await patchJson<{ success: boolean }, { questions: SecurityQuestion[] }>(
    "/auth/security-questions",
    { questions },
    token
  );
  return res.data;
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const changePassword = async (
  payload: ChangePasswordPayload,
  token: string
): Promise<{ changed: boolean }> => {
  const res = await postJson<{ changed: boolean }, ChangePasswordPayload>("/auth/password/change", payload, token);
  return res.data;
};
