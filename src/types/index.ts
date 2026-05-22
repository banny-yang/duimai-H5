export type RacePhase = "pre" | "race";

export interface RunnerProfile {
  id: string;
  name: string;
  bib: string;
  zone: string;
  bloodType: string;
  pickupWindow: string;
  pickupCounter: string;
  emergencyContact: string;
  emergencyPhone: string;
  checkInBefore: string;
  /** 后端会话问候语（优先展示） */
  greeting?: string;
}

export interface EventInfo {
  name: string;
  phase: RacePhase;
  preNotice: string;
  raceNotice: string;
  actionHint?: string;
}

export type ChatCardType = "supply" | "bib" | "text";

export interface SupplyCardData {
  stationName: string;
  distance: string;
  supplies: string;
  medical: string;
  navUrl: string;
}

export interface BibCardData {
  name: string;
  bib: string;
  counter: string;
  barcode: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  cardType?: ChatCardType;
  supply?: SupplyCardData;
  bib?: BibCardData;
  streaming?: boolean;
  createdAt?: number;
}

export type SosSymptom = "heart" | "muscle" | "injury";

export interface SosPayload {
  runnerId: string;
  bib: string;
  name: string;
  bloodType: string;
  emergencyPhone: string;
  gps: { lat: number; lng: number };
  battery: number;
  signal: string;
  symptom: SosSymptom;
  submittedAt: string;
}
