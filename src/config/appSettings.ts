export const APP_SETTINGS = {
  whatsappNumber: "966500816798",
  supportEmail: "support@marhaba.com",
  appUrl: "https://marhaba.com",
  get whatsappLink() {
    return `https://wa.me/${this.whatsappNumber}`;
  },
  get whatsappAccessoryMessage() {
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent("مرحباً، أريد طلب إكسسوار مرحباً NFC")}`;
  },
};

export const MOCK_SERIAL_INVENTORY: Record<string, "available" | "linked"> = {
  "MRH-000001": "available",
  "MRH-000002": "available",
  "MRH-000003": "available",
  "MRH-000010": "available",
  "MRH-000100": "available",
  "MRH-000125": "linked",
  "MRH-000200": "available",
  "MRH-000300": "available",
  "MRH-000400": "available",
  "MRH-000500": "available",
};

