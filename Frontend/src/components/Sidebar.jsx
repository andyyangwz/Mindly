import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Brain, Home, PenLine, Calendar, BarChart3, Plus,
  MessageSquare, Sun, Moon, Monitor, LogOut,
} from "lucide-react";
import { theme } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import ChatListItem from "../features/chats/ChatListItem";
import { useTranslation } from "react-i18next";

const ICONS = { Home, PenLine, Calendar, BarChart3 };

const NAV_ITEMS = [
  { icon: "Home", id: "home" },
  { icon: "Calendar", id: "productivity" },
  { icon: "PenLine", id: "journals" },
  { icon: "BarChart3", id: "insight" },
];

function ThemeSwitcher({ currentTheme, onSelect }) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        background: theme.bg,
        borderRadius: 8,
        padding: 2,
      }}
    >
      {[
        { value: "light", icon: Sun, label: t("nav.light") },
        { value: "dark", icon: Moon, label: t("nav.dark") },
        { value: "system", icon: Monitor, label: t("nav.system") },
      ].map(({ value, icon: Icon, label }) => {
        const active = currentTheme === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "5px 8px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: active ? "var(--color-card, white)" : "transparent",
              color: active ? theme.primaryText : theme.muted,
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              transition: "all 0.15s",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("id") ? "id" : "en";

  return (
    <div
      style={{
        display: "flex",
        gap: 3,
        background: theme.bg,
        borderRadius: 8,
        padding: 2,
      }}
    >
      {[
        { value: "en", label: t("nav.english") },
        { value: "id", label: t("nav.indonesian") },
      ].map(({ value, label }) => {
        const active = currentLang === value;
        return (
          <button
            key={value}
            onClick={() => i18n.changeLanguage(value)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "5px 8px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              background: active ? "var(--color-card, white)" : "transparent",
              color: active ? theme.primaryText : theme.muted,
              fontSize: 11,
              fontWeight: active ? 600 : 500,
              transition: "all 0.15s",
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {value === "en" ? "\uD83C\uDDEC\uD83C\uDDE7" : "\uD83C\uDDEE\uD83C\uDDE9"}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Sidebar({ sessions, newSessionId, onNewChat, onRenameChat, onDeleteChat, onNavClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: currentTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pathname = location.pathname;
  const activeTab = pathname.startsWith("/app") ? pathname.split("/")[2] || "home" : "home";
  const activeSessionId = pathname.startsWith("/app/spill/") ? pathname.split("/")[3] : null;

  const initials = user?.first_name
    ? (user.first_name[0] + (user.last_name?.[0] || "")).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || "?";

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "User";

  const handleLogout = () => {
    setShowAccountMenu(false);
    logout();
    navigate("/auth");
  };

  return (
    <div
      style={{
        width: 260, minWidth: 260, height: "100vh",
        background: "var(--color-card, white)",
        borderRight: `1px solid ${theme.border}`,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "22px 20px 18px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              borderRadius: 10, padding: 7, display: "flex",
            }}
          >
            <Brain size={18} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700, fontSize: 16, color: theme.dark,
              letterSpacing: "-0.01em",
            }}
          >
            {t("app.name")}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ padding: "14px 10px 12px" }}>
        <p
          style={{
            fontSize: 10, fontWeight: 700, color: theme.muted,
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: 10, paddingLeft: 6,
          }}
        >
          {t("nav.mainMenu")}
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { navigate(`/app/${item.id}`); onNavClick?.() }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8, border: "none",
                cursor: "pointer", marginBottom: 4,
                background: active ? theme.primary : "transparent",
                color: active ? "white" : theme.muted,
                fontWeight: active ? 600 : 500, fontSize: 14,
                transition: "all 0.12s",
                boxShadow: active
                  ? `0 2px 8px color-mix(in srgb, ${theme.primary} 33%, transparent)`
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  e.currentTarget.style.background = "var(--color-hover, #F9FAFB)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={17} />
              {t(`nav.${item.id}`)}
            </button>
          );
        })}
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 10px" }}>
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 6px 8px", marginTop: 6,
          }}
        >
          <p
            style={{
              fontSize: 10, fontWeight: 700, color: theme.muted,
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}
          >
            {t("nav.recentChats")}
          </p>
          <button
            onClick={onNewChat}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: theme.muted, display: "flex", padding: 4, borderRadius: 6,
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-hover, #F3F4F6)";
              e.currentTarget.style.color = theme.primaryText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = theme.muted;
            }}
          >
            <Plus size={15} />
          </button>
        </div>

        {sessions.length === 0 && (
          <div style={{ padding: "28px 12px", textAlign: "center" }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: `color-mix(in srgb, ${theme.primary} 18%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 10px",
              }}
            >
              <MessageSquare size={14} color={theme.primaryText} />
            </div>
            <p style={{ fontSize: 12, color: theme.muted, margin: 0, lineHeight: 1.5 }}>
              {t("nav.noChats")}
            </p>
          </div>
        )}

        {sessions.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            active={activeSessionId === chat.id}
            newSessionId={newSessionId}
            onSelect={(id) => { navigate(`/app/spill/${id}`); onNavClick?.() }}
            onRename={onRenameChat}
            onDelete={onDeleteChat}
          />
        ))}
      </div>

      {/* User footer */}
      <div
        ref={accountRef}
        style={{
          position: "relative", padding: "12px 10px",
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <button
          onClick={() => setShowAccountMenu((v) => !v)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 10, border: "none",
            cursor: "pointer",
            background: "transparent",
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${theme.secondary}, ${theme.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 600, fontSize: 12,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <p
              style={{
                fontSize: 12, fontWeight: 600, color: theme.dark,
                margin: 0, marginBottom: 1,
              }}
            >
              {displayName}
            </p>
            <p style={{ fontSize: 10, color: theme.muted, margin: 0 }}>
              {t("nav.basicPlan")}
            </p>
          </div>
        </button>

        {showAccountMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 10,
              right: 10,
              marginBottom: 6,
              background: "var(--color-card, white)",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              padding: 12,
              zIndex: theme.z.dropdown,
            }}
          >
            <p
              style={{
                fontSize: 10, fontWeight: 700, color: theme.muted,
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {t("nav.theme")}
            </p>
            <ThemeSwitcher currentTheme={currentTheme} onSelect={setTheme} />
            <div style={{ height: 12 }} />
            <p
              style={{
                fontSize: 10, fontWeight: 700, color: theme.muted,
                textTransform: "uppercase", letterSpacing: "0.08em",
                marginBottom: 8,
              }}
            >
              {t("nav.language")}
            </p>
            <LanguageSwitcher />

            <div style={{ height: 12 }} />
            <button
              onClick={handleLogout}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 8, padding: "10px 12px", borderRadius: 8,
                border: "none", cursor: "pointer",
                background: "transparent", color: "#EF4444",
                fontSize: 13, fontWeight: 600,
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={15} />
              {t("nav.logout") || "Log Out"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
