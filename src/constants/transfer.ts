export type DeliveryMethod = "bank_transfer" | "cash_pickup" | "mobile_wallet";

export interface DeliveryOption {
  key: DeliveryMethod;
  icon: string;
  title: string;
  subtitle: string;
  speed: string;
  fee: number;
  countries?: string[];
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  {
    key: "bank_transfer",
    icon: "bank-outline",
    title: "Bank Transfer",
    subtitle: "Sent directly to recipient's bank account",
    speed: "1–2 business days",
    fee: 2.99,
  },
  {
    key: "cash_pickup",
    icon: "cash-multiple",
    title: "Cash Pickup",
    subtitle: "Recipient picks up cash at a local agent",
    speed: "Within minutes",
    fee: 4.99,
    countries: ["Nigeria", "Ghana", "Kenya", "India", "Philippines"],
  },
  {
    key: "mobile_wallet",
    icon: "cellphone-nfc",
    title: "Mobile Wallet",
    subtitle: "Sent to recipient's mobile money account",
    speed: "Within minutes",
    fee: 1.99,
    countries: ["Kenya (M-Pesa)", "Ghana (MTN)", "Tanzania (Airtel)", "Uganda (MTN)"],
  },
];

export const deliveryOption = (key?: string): DeliveryOption =>
  DELIVERY_OPTIONS.find((o) => o.key === key) ?? DELIVERY_OPTIONS[0];

export const cheapestDeliveryFee = Math.min(...DELIVERY_OPTIONS.map((o) => o.fee));

/** Payout currency per destination country — drives the live FX lookup. */
const COUNTRY_CURRENCY: Record<string, string> = {
  nigeria: "NGN",
  ghana: "GHS",
  kenya: "KES",
  tanzania: "TZS",
  uganda: "UGX",
  india: "INR",
  pakistan: "PKR",
  bangladesh: "BDT",
  philippines: "PHP",
  "united states": "USD",
  usa: "USD",
  "united kingdom": "GBP",
  uk: "GBP",
  canada: "CAD",
  france: "EUR",
  germany: "EUR",
  spain: "EUR",
  italy: "EUR",
};

export const currencyForCountry = (country?: string): string =>
  COUNTRY_CURRENCY[(country ?? "").trim().toLowerCase()] ?? "";
