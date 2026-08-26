import AsyncStorage from "@react-native-async-storage/async-storage";

export type ManualKycGender = "Male" | "Female" | "Other";
export type ManualKycDocumentType = "passport" | "id_card" | "drivers_license";

export interface ManualKycDraft {
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    gender?: ManualKycGender;
  };
  country?: string;
  documentType?: ManualKycDocumentType;
  documentImageUri?: string;
  documentImageBase64?: string;
  livenessImageUri?: string;
  livenessImageBase64?: string;
}

const MANUAL_KYC_DRAFT_KEY = "@fuseremit/manualKycDraft";

const readDraft = async (): Promise<ManualKycDraft> => {
  const raw = await AsyncStorage.getItem(MANUAL_KYC_DRAFT_KEY);

  if (!raw) return {};

  try {
    return JSON.parse(raw) as ManualKycDraft;
  } catch {
    await AsyncStorage.removeItem(MANUAL_KYC_DRAFT_KEY);
    return {};
  }
};

export const getManualKycDraft = async (): Promise<ManualKycDraft> => {
  return readDraft();
};

export const updateManualKycDraft = async (
  patch: Partial<ManualKycDraft>,
): Promise<ManualKycDraft> => {
  const current = await readDraft();

  const next: ManualKycDraft = {
    ...current,
    ...patch,
    personalInfo: {
      ...(current.personalInfo ?? {}),
      ...(patch.personalInfo ?? {}),
    },
  };

  await AsyncStorage.setItem(MANUAL_KYC_DRAFT_KEY, JSON.stringify(next));
  return next;
};

export const clearManualKycDraft = async () => {
  await AsyncStorage.removeItem(MANUAL_KYC_DRAFT_KEY);
};
