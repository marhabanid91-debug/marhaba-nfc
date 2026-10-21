export type Language = "ar" | "en";
export type ActiveMode = "business" | "emergency" | "events";
export type Screen =
  | "auth"
  | "home"
  | "emergency"
  | "business"
  | "events"
  | "accessory"
  | "settings"
  | "reader-emergency"
  | "reader-business"
  | "reader-events"
  | "reader-gift"
  | "offline-settings"
  | "add-identity"
  | "privacy-policy"
  | "password-demo"
  | "card-scan";

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  visible: boolean;
}

export interface EmergencyVisibility {
  birthDate: boolean;
  bloodType: boolean;
  conditions: boolean;
  allergies: boolean;
  medications: boolean;
  firstAidInstructions: boolean;
}

export interface SocialLinks {
  googleReview?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  snapchat?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  whatsapp?: string;
  website?: string;
}

// موقع محفوظ: اسم يختاره المستخدم + رابط خريطة أو عنوان وطني، مع مفتاح إظهار/إخفاء
export interface LocationItem {
  name: string;
  value: string;
  visible: boolean;
}

export interface ContactNotes {
  presets: string[];
  custom: string;
}

export interface EmergencyData {
  photo: string;
  name: string;
  birthDate: string;
  bloodType: string;
  conditions: string;
  allergies: string;
  medications: string;
  firstAidInstructions: string;
  contactNotes?: ContactNotes;
  emergencyContacts: EmergencyContact[];
  visibility: EmergencyVisibility;
  locations?: LocationItem[];
}

export interface BusinessData {
  photo: string;
  name: string;
  jobTitle: string;
  company: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  socialLinks: SocialLinks;
  locations?: LocationItem[];
}

export type EventStatus = "sponsor" | "participant" | "visitor" | "";

export interface EventsData {
  photo: string;
  name: string;
  bio: string;
  eventName: string;
  eventLocation: string;
  status: EventStatus;
  ticketLink: string;
  socialLinks: SocialLinks;
  locations?: LocationItem[];
}

export interface OfflineSettings {
  name: boolean;
  contactPhone: boolean;
  emergencyPhone: boolean;
}

export interface Identity {
  id: string;
  serialNumber: string | null;
  activeMode: ActiveMode;
  isActive: boolean;
  emergency: EmergencyData;
  business: BusinessData;
  events: EventsData;
  offlineSettings: OfflineSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailConfirmed?: boolean;
  avatarUrl?: string | null;
}
