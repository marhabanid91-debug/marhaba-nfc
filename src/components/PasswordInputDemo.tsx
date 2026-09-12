import { useState, useId } from "react";

// ─── Reusable PasswordInput component ────────────────────────────────────────

interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PasswordInput({
  label,
  placeholder = "••••••••",
  value,
  onChange,
  hint,
  error,
  disabled = false,
  size = "md",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  const sizeMap = {
    sm: { height: 40, fontSize: 13, iconSize: 16, padding: "0 38px 0 14px" },
    md: { height: 50, fontSize: 15, iconSize: 18, padding: "0 46px 0 16px" },
    lg: { height: 58, fontSize: 16, iconSize: 20, padding: "0 52px 0 18px" },
  };
  const s = sizeMap[size];

  const borderColor = error
    ? "rgba(239,68,68,0.7)"
    : "rgba(255,255,255,0.1)";
  const borderFocusColor = error ? "rgba(239,68,68,0.9)" : "#c9a84c";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: error ? "rgb(239,68,68)" : "var(--muted-foreground)",
            letterSpacing: 0.2,
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        {/* Lock icon on the left */}
        <div style={{
          position: "absolute",
          insetInlineStart: size === "sm" ? 10 : size === "lg" ? 16 : 13,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: error ? "rgb(239,68,68)" : "var(--muted-foreground)",
          opacity: disabled ? 0.4 : 0.7,
          display: "flex",
        }}>
          <LockIcon size={s.iconSize - 2} />
        </div>

        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            height: s.height,
            paddingInlineStart: size === "sm" ? 34 : size === "lg" ? 44 : 40,
            paddingInlineEnd: size === "sm" ? 36 : size === "lg" ? 50 : 44,
            fontSize: s.fontSize,
            background: "rgba(255,255,255,0.03)",
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12,
            color: "var(--foreground)",
            fontFamily: "inherit",
            letterSpacing: value && !visible ? 3 : "normal",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
            boxSizing: "border-box",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = borderFocusColor;
            e.currentTarget.style.boxShadow = error
              ? "0 0 0 3px rgba(239,68,68,0.12)"
              : "0 0 0 3px rgba(201,168,76,0.14)";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = borderColor;
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
          }}
        />

        {/* Eye toggle button */}
        <button
          type="button"
          onClick={() => !disabled && setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            insetInlineEnd: size === "sm" ? 10 : size === "lg" ? 16 : 13,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            padding: 4,
            borderRadius: 6,
            cursor: disabled ? "not-allowed" : "pointer",
            color: visible ? "var(--primary)" : "var(--muted-foreground)",
            opacity: disabled ? 0.4 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.18s, opacity 0.18s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              (e.currentTarget as HTMLElement).style.color = visible ? "#e5c76b" : "var(--foreground)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1.12)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = visible ? "var(--primary)" : "var(--muted-foreground)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-50%) scale(1)";
          }}
        >
          {visible ? <EyeOpenIcon size={s.iconSize} /> : <EyeClosedIcon size={s.iconSize} />}
        </button>
      </div>

      {(hint || error) && (
        <p style={{
          fontSize: 12,
          color: error ? "rgb(239,68,68)" : "var(--muted-foreground)",
          margin: 0,
          lineHeight: 1.5,
          paddingInlineStart: 2,
        }}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

// ─── Demo / showcase page ──────────────────────────────────────────────────────

export default function PasswordInputDemo() {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("MySecretPass123");
  const [pw3, setPw3] = useState("wrongpassword");
  const [pw4, setPw4] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const strength = getStrength(pw4);

  return (
    <div style={{
      minHeight: "100%",
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 20px 60px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48, maxWidth: 480 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(201,168,76,0.12)",
          border: "1px solid rgba(201,168,76,0.25)",
          marginBottom: 20,
        }}>
          <LockIcon size={24} color="#c9a84c" />
        </div>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          margin: "0 0 10px",
          background: "linear-gradient(135deg, #f0f0f5 30%, #c9a84c)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: -0.5,
        }}>
          Password Input
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 15, margin: 0, lineHeight: 1.7 }}>
          Interactive field with eye-icon toggle · sizes · states · strength meter
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 32 }}>

        {/* ── Card 1: Basic sizes ─── */}
        <Card title="Sizes" subtitle="sm · md · lg">
          <PasswordInput size="sm" label="Small" placeholder="Small password field" value={pw1} onChange={setPw1} />
          <PasswordInput size="md" label="Medium (default)" placeholder="Medium password field" value={pw1} onChange={setPw1} />
          <PasswordInput size="lg" label="Large" placeholder="Large password field" value={pw1} onChange={setPw1} />
        </Card>

        {/* ── Card 2: States ─── */}
        <Card title="States" subtitle="default · filled · error · disabled">
          <PasswordInput
            label="Default — empty"
            placeholder="Enter your password"
            value=""
            onChange={() => {}}
            hint="Must be at least 8 characters"
          />
          <PasswordInput
            label="Filled — password visible"
            value={pw2}
            onChange={setPw2}
          />
          <PasswordInput
            label="Error state"
            value={pw3}
            onChange={setPw3}
            error="Incorrect password. Please try again."
          />
          <PasswordInput
            label="Disabled"
            value="Disabled field"
            onChange={() => {}}
            disabled
          />
        </Card>

        {/* ── Card 3: Strength meter ─── */}
        <Card title="With Strength Meter" subtitle="Real-time password analysis">
          <PasswordInput
            label="Create password"
            placeholder="Type a strong password…"
            value={pw4}
            onChange={setPw4}
            hint={pw4 ? undefined : "Combine letters, numbers & symbols"}
          />

          {pw4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Bar */}
              <div style={{ display: "flex", gap: 4 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{
                    flex: 1, height: 4, borderRadius: 99,
                    background: i <= strength.score
                      ? strength.color
                      : "rgba(255,255,255,0.07)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              {/* Label */}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                <span style={{ color: "var(--muted-foreground)" }}>{strength.tip}</span>
              </div>
            </div>
          )}
        </Card>

        {/* ── Card 4: Live form ─── */}
        <Card title="Live Example" subtitle="Sign-in form">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--muted-foreground)", display: "block", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                style={{
                  width: "100%", height: 50, padding: "0 16px", fontSize: 15,
                  background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 12, color: "var(--foreground)", fontFamily: "inherit",
                  boxSizing: "border-box", outline: "none",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.14)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={pw1}
              onChange={setPw1}
              hint={!pw1 ? "Forgot your password?" : undefined}
            />
          </div>

          {submitted && (
            <div style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 10, padding: "12px 16px",
              color: "#22c55e", fontSize: 13,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>✓</span>
              Form submitted — password is {pw1.length} characters long
            </div>
          )}

          <button
            onClick={() => { setSubmitted(true); setTimeout(() => setSubmitted(false), 3000); }}
            style={{
              width: "100%", height: 50, borderRadius: 12,
              background: "linear-gradient(135deg, #c9a84c, #d4af37)",
              border: "none", color: "#09090f",
              fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              transition: "opacity 0.15s, transform 0.12s",
              letterSpacing: 0.3,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            Sign In
          </button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted-foreground)", margin: 0 }}>
            Don't have an account?{" "}
            <span style={{ color: "var(--primary)", cursor: "pointer", fontWeight: 600 }}>Sign up</span>
          </p>
        </Card>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border-strong)",
      borderRadius: 18,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 18,
    }}>
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── Password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string; tip: string } {
  if (!pw) return { score: 0, label: "", color: "", tip: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const map = [
    { score: 1, label: "Weak",      color: "#ef4444", tip: "Add uppercase letters" },
    { score: 2, label: "Fair",      color: "#f97316", tip: "Add numbers or symbols" },
    { score: 3, label: "Good",      color: "#eab308", tip: "Almost there!" },
    { score: 4, label: "Strong",    color: "#22c55e", tip: "Great password!" },
  ];
  return map[Math.max(0, score - 1)] ?? map[0];
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function LockIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeOpenIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

