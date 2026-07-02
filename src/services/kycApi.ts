import { getJson, postJson } from "./api";
import { getAccessTokenAsync } from "./session";

export interface IdentitySessionResponse {
  sessionId: string;
  clientSecret: string;
  url: string;
}

export interface AdvancedKycStatus {
  advancedKycStatus: "not_started" | "pending" | "verified" | "failed";
  stripeStatus: string | null;
  sendingLimit: number;
}

export const createIdentitySession = async (): Promise<IdentitySessionResponse> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await postJson<IdentitySessionResponse>("/kyc/identity-session", {}, token);
  return res.data;
};

export const getAdvancedKycStatus = async (): Promise<AdvancedKycStatus> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await getJson<AdvancedKycStatus>("/kyc/advanced-status", token);
  return res.data;
};
