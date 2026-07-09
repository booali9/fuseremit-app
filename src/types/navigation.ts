import { Transaction } from "../services/paymentApi";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ChangeDevicePin: undefined;
  ChangeDeviceMain: undefined;
  ChangeDevicePhoneVerify: undefined;
  PhoneNumberVerify: { challengeId: string; email: string } | undefined;
  Signup: undefined;
  CreatePin: undefined;
  MainOnboarding: undefined;
  OnboardingTransactionPin: undefined;
  OnboardingClassic: undefined;
  OnboardingPremium: undefined;
  MainKYC: undefined;
  PersonalInformation: undefined;
  BackgroundInformation: undefined;
  KYCSubmission: undefined;
  DocumentType: undefined;
  SelectDocument: undefined;
  AppServiceBottomNavigation: undefined;
  LivenessVerify: undefined;
  VerificationProgress: undefined;
  AdvancedKYC: { justCompleted?: boolean } | undefined;
  IdentityWebView: { url: string };
};
