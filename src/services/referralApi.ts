import { getJson, postJson } from "./api";
import { getAccessTokenAsync } from "./session";

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  referralCount: number;
  discountPerReferral: number;
  currentDiscount: number;
}

export const getMyReferral = async (): Promise<ReferralInfo> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await getJson<ReferralInfo>("/users/me/referral", token);
  return res.data;
};

export const applyReferralCode = async (code: string): Promise<{ message: string }> => {
  const token = await getAccessTokenAsync();
  if (!token) throw new Error("No access token found");

  const res = await postJson<{ message: string }>("/users/me/referral/apply", { code }, token);
  return res.data;
};
