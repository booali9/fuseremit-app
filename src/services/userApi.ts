import { getJson, postJson, putJson, patchJson, API_BASE_URL } from "./api";
import { getAccessTokenAsync } from "./session";

export type AccountTier = "Classic" | "Premium";

export interface CurrentUserStatus {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  phoneNumber?: string;
  countryCode?: string;
  profilePicture?: string;
  hasPin: boolean;
  hasTransactionPin: boolean;
  accountTier: AccountTier;
  kycStatus: "pending" | "in_progress" | "verified" | "rejected";
  balance: number;
  currency: string;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  phoneNumber?: string;
  countryCode?: string;
}

export interface UpdateProfileResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  dateOfBirth?: string;
  gender?: "Male" | "Female" | "Other";
  phoneNumber?: string;
  countryCode?: string;
  profilePicture?: string;
  updatedAt?: string;
}

export type KycStatus = CurrentUserStatus["kycStatus"];

export const fetchCurrentUserStatus = async (accessToken: string) => {
  const res = await getJson<CurrentUserStatus>("/users/me", accessToken);
  return res.data;
};

export const updateCurrentUserProfile = async (
  accessToken: string,
  payload: UpdateProfilePayload,
) => {
  const res = await putJson<UpdateProfileResponse, UpdateProfilePayload>(
    "/users/me",
    payload,
    accessToken,
  );

  return res.data;
};

export const updateAccountTier = async (
  accessToken: string,
  accountTier: AccountTier,
) => {
  const res = await putJson<
    { accountTier: AccountTier },
    { accountTier: AccountTier }
  >("/users/me/tier", { accountTier }, accessToken);

  return res.data;
};

export const updateKycStatus = async (
  accessToken: string,
  kycStatus: KycStatus,
) => {
  const res = await putJson<{ kycStatus: KycStatus }, { kycStatus: KycStatus }>(
    "/users/me/kyc-status",
    { kycStatus },
    accessToken,
  );

  return res.data;
};

export interface UserSettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  preferences: {
    language: string;
    pushNotifications: boolean;
    emailNotifications: boolean;
    pushToken?: string;
  };
}

export const fetchUserSettings = async (accessToken: string) => {
  const res = await getJson<UserSettings>("/users/me/settings", accessToken);
  return res.data;
};

export const updateUserSettings = async (
  accessToken: string,
  payload: Partial<UserSettings>,
) => {
  const res = await putJson<UserSettings, Partial<UserSettings>>(
    "/users/me/settings",
    payload,
    accessToken,
  );
  return res.data;
};

export const createTransactionPin = async (
  accessToken: string,
  pin: string,
) => {
  const res = await postJson<
    { hasTransactionPin: boolean },
    { pin: string }
  >("/users/me/transaction-pin", { pin }, accessToken);

  return res.data;
};

export const uploadProfilePicture = async (
  accessToken: string,
  imageUri: string,
) => {
  const formData = new FormData();
  
  // Prepare file details for upload
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  const fileName = imageUri.split('/').pop() || 'profile.jpg';
  
  formData.append('image', {
    uri: imageUri,
    name: fileName,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as any);

  const response = await fetch(`${API_BASE_URL}/users/me/profile-picture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Do not set Content-Type, fetch will set it correctly for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    const errorString = await response.text();
    let errorMessage = "Upload failed";
    try {
      const errorJson = JSON.parse(errorString);
      errorMessage = errorJson.error?.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return json.data as { profilePicture: string; updatedAt: string };
};


export const verifyTransactionPin = async (pin: string): Promise<boolean> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await postJson<{ valid: boolean }>("/users/me/verify-transaction-pin", { pin }, token);
  return res.data.valid;
};
