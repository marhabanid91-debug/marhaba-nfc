// أيقونات مبسّطة لوسائل التواصل (SVG داخلي بلا مكتبات خارجية)
const brand: Record<string, { name: string; bg: string; fg: string }> = {
  facebook:  { name: "Facebook",  bg: "#1877F2", fg: "#fff" },
  instagram: { name: "Instagram", bg: "linear-gradient(45deg,#F9A13A,#E1306C,#7B3FE4)", fg: "#fff" },
  whatsapp:  { name: "WhatsApp",  bg: "#25D366", fg: "#fff" },
  snapchat:  { name: "Snapchat",  bg: "#FFFC00", fg: "#111" },
  tiktok:    { name: "TikTok",    bg: "#000",    fg: "#fff" },
  twitter:   { name: "X",         bg: "#000",    fg: "#fff" },
  linkedin:  { name: "LinkedIn",  bg: "#0A66C2", fg: "#fff" },
  youtube:   { name: "YouTube",   bg: "#FF0000", fg: "#fff" },
  website:   { name: "Website",   bg: "#64748b", fg: "#fff" },
};

export function socialName(k: string) {
  return brand[k]?.name || k.charAt(0).toUpperCase() + k.slice(1);
}

function Glyph({ k, c }: { k: string; c: string }) {
  const s = { fill: "none", stroke: c, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (k) {
    case "facebook":
      return <path fill={c} d="M14 8h2.200V5H13.500C11.600 5 11 6.300 11 7.800V10H9v3h2v6.500h3V13h2.100l.5-3H14V8.400c0-.3.1-.4.400-.4z" />;
    case "instagram":
      return <><rect x="4.500" y="4.500" width="15" height="15" rx="4.500" {...s} /><circle cx="12" cy="12" r="3.500" {...s} /><circle cx="16.500" cy="7.500" r="1" fill={c} /></>;
    case "whatsapp":
      return <><path {...s} d="M12 3.800a8.200 8.200 0 0 0-7 12.400L3.800 20.200l4.100-1.100A8.200 8.200 0 1 0 12 3.800z" /><path fill={c} d="M9 8.500c0 3.500 3 6.500 6.500 6.500l1-1.500-2-1-1 .8c-1-.4-1.900-1.300-2.300-2.300l.8-1-1-2z" /></>;
    case "snapchat":
      return <path {...s} strokeWidth={1.700} d="M12 4c-2.400 0-3.800 1.700-3.800 4v2l-2 .8 2 1.200c-.4 1.400-1.400 2.400-2.800 2.800.8.800 1.900.8 2.800.8.400.8 1 1.200 1.900 1.200.7 0 1-.5 1.900-.5s1.200.5 1.900.5c.9 0 1.500-.4 1.900-1.200.9 0 2 0 2.800-.8-1.400-.4-2.400-1.400-2.800-2.800l2-1.200-2-.8V8c0-2.300-1.400-4-3.800-4z" />;
    case "tiktok":
      return <><path {...s} d="M13.500 4v10.200a3 3 0 1 1-3-3" /><path {...s} d="M13.500 4c.3 2 1.800 3.500 4 3.800" /></>;
    case "twitter":
      return <path {...s} d="M5.500 5.500l13 13M18.500 5.500l-13 13" />;
    case "linkedin":
      return <><circle cx="7.200" cy="7.600" r="1.600" fill={c} /><rect x="5.700" y="10.200" width="3" height="8" fill={c} /><path fill={c} d="M11 10.200h2.900v1.200c.6-.9 1.600-1.400 2.800-1.400 2.300 0 3.300 1.400 3.300 3.800v4.400h-3v-4c0-1.100-.4-1.700-1.300-1.700-1 0-1.700.7-1.700 1.900v3.800h-3z" /></>;
    case "youtube":
      return <path fill={c} d="M10 9l5.500 3-5.500 3z" />;
    default:
      return <><circle cx="12" cy="12" r="8" {...s} /><path {...s} d="M4 12h16M12 4c2.500 2.500 2.500 13.500 0 16M12 4c-2.500 2.500-2.500 13.500 0 16" /></>;
  }
}

export function SocialIcon({ k, size = 22 }: { k: string; size?: number }) {
  const b = brand[k] || brand.website;
  return (
    <span style={{
      width: size, height: size, borderRadius: size * 0.3, background: b.bg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "1px solid rgba(255,255,255,0.18)", flexShrink: 0,
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.8} height={size * 0.8} aria-hidden="true"><Glyph k={k} c={b.fg} /></svg>
    </span>
  );
}
