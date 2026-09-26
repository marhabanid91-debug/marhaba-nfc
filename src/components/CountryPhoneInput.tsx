import { useState, useRef, useEffect } from "react";

// ─── Country list (Gulf & Arab countries first, then common others) ───────────
// dialCode: without the leading "+"
export interface Country {
  code: string;   // ISO code (for the flag emoji)
  name: string;
  nameAr: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { code: "SA", name: "Saudi Arabia",   nameAr: "السعودية",     dialCode: "966" },
  { code: "AE", name: "UAE",            nameAr: "الإمارات",      dialCode: "971" },
  { code: "KW", name: "Kuwait",         nameAr: "الكويت",       dialCode: "965" },
  { code: "QA", name: "Qatar",          nameAr: "قطر",          dialCode: "974" },
  { code: "BH", name: "Bahrain",        nameAr: "البحرين",      dialCode: "973" },
  { code: "OM", name: "Oman",           nameAr: "عُمان",        dialCode: "968" },
  { code: "EG", name: "Egypt",          nameAr: "مصر",          dialCode: "20"  },
  { code: "JO", name: "Jordan",         nameAr: "الأردن",       dialCode: "962" },
  { code: "LB", name: "Lebanon",        nameAr: "لبنان",        dialCode: "961" },
  { code: "SY", name: "Syria",          nameAr: "سوريا",        dialCode: "963" },
  { code: "IQ", name: "Iraq",           nameAr: "العراق",       dialCode: "964" },
  { code: "YE", name: "Yemen",          nameAr: "اليمن",        dialCode: "967" },
  { code: "PS", name: "Palestine",      nameAr: "فلسطين",       dialCode: "970" },
  { code: "SD", name: "Sudan",          nameAr: "السودان",      dialCode: "249" },
  { code: "LY", name: "Libya",          nameAr: "ليبيا",        dialCode: "218" },
  { code: "TN", name: "Tunisia",        nameAr: "تونس",         dialCode: "216" },
  { code: "DZ", name: "Algeria",        nameAr: "الجزائر",      dialCode: "213" },
  { code: "MA", name: "Morocco",        nameAr: "المغرب",       dialCode: "212" },
  { code: "TR", name: "Turkey",         nameAr: "تركيا",        dialCode: "90"  },
  { code: "US", name: "United States",  nameAr: "الولايات المتحدة", dialCode: "1" },
  { code: "GB", name: "United Kingdom", nameAr: "بريطانيا",     dialCode: "44"  },
  { code: "FR", name: "France",         nameAr: "فرنسا",        dialCode: "33"  },
  { code: "DE", name: "Germany",        nameAr: "ألمانيا",       dialCode: "49"  },
  { code: "IN", name: "India",          nameAr: "الهند",        dialCode: "91"  },
  { code: "PK", name: "Pakistan",       nameAr: "باكستان",      dialCode: "92"  },
  { code: "PH", name: "Philippines",    nameAr: "الفلبين",      dialCode: "63"  },
  { code: "BD", name: "Bangladesh",     nameAr: "بنغلاديش",     dialCode: "880" },
];

function flagEmoji(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

/**
 * Splits a full stored phone (e.g. "+966501234567" or "966501234567")
 * into { country, localNumber } for editing. Falls back to Saudi Arabia
 * + the raw digits if no known dial code matches.
 */
export function splitStoredPhone(stored: string | undefined | null): {
  country: Country;
  localNumber: string;
} {
  const digits = (stored || "").replace(/[^0-9]/g, "");
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dialCode)) {
      return { country: c, localNumber: digits.slice(c.dialCode.length) };
    }
  }
  return { country: COUNTRIES[0], localNumber: digits };
}

/** Combines a country + local number into the canonical stored format: "+<dialCode><local>" */
export function combinePhone(country: Country, localNumber: string): string {
  const local = localNumber.replace(/[^0-9]/g, "").replace(/^0+/, ""); // strip leading zero
  if (!local) return "";
  return `+${country.dialCode}${local}`;
}

interface CountryPhoneInputProps {
  /** Full stored value, e.g. "+966501234567". Empty string if none. */
  value: string;
  /** Called with the new full stored value on every change. */
  onChange: (fullPhone: string) => void;
  lang: "ar" | "en";
  placeholder?: string;
}

export default function CountryPhoneInput({ value, onChange, lang, placeholder }: CountryPhoneInputProps) {
  const isAr = lang === "ar";
  const initial = splitStoredPhone(value);
  const [country, setCountry] = useState<Country>(initial.country);
  const [localNumber, setLocalNumber] = useState(initial.localNumber);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Keep in sync if parent resets value externally (e.g. loading saved data)
  useEffect(() => {
    const split = splitStoredPhone(value);
    setCountry(split.country);
    setLocalNumber(split.localNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pickCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    onChange(combinePhone(c, localNumber));
  };

  const handleLocalChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^0-9]/g, "");
    setLocalNumber(digitsOnly);
    onChange(combinePhone(country, digitsOnly));
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div style={{
        display: "flex", alignItems: "stretch", gap: 8,
        background: "var(--card)", border: "1px solid var(--border-strong, rgba(255,255,255,0.1))",
        borderRadius: 12, overflow: "visible",
      }}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 10px", border: "none", background: "transparent",
            color: "var(--foreground)", fontSize: 14, cursor: "pointer",
            fontFamily: "inherit", borderInlineEnd: "1px solid var(--border-strong, rgba(255,255,255,0.1))",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 18 }}>{flagEmoji(country.code)}</span>
          <span data-dir="ltr" style={{ fontWeight: 700 }}>+{country.dialCode}</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>

        {/* Local number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => handleLocalChange(e.target.value)}
          placeholder={placeholder || (isAr ? "5xxxxxxxx" : "5xxxxxxxx")}
          data-dir="ltr"
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            padding: "13px 12px", fontSize: 15, color: "var(--foreground)",
            fontFamily: "inherit", minWidth: 0,
          }}
        />
      </div>

      {/* Dropdown list */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", insetInlineStart: 0,
          width: 260, maxHeight: 280, overflowY: "auto", zIndex: 50,
          background: "var(--card-elevated, var(--card))", border: "1px solid var(--border-strong, rgba(255,255,255,0.15))",
          borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.35)", padding: 6,
        }}>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => pickCountry(c)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", border: "none", borderRadius: 10,
                background: c.code === country.code ? "rgba(201,168,76,0.12)" : "transparent",
                color: "var(--foreground)", fontSize: 14, cursor: "pointer",
                textAlign: isAr ? "right" : "left", fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 18 }}>{flagEmoji(c.code)}</span>
              <span style={{ flex: 1 }}>{isAr ? c.nameAr : c.name}</span>
              <span data-dir="ltr" style={{ opacity: 0.6, fontSize: 12 }}>+{c.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
