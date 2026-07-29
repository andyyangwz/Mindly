import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Brain, LayoutDashboard, PenLine, Calendar, BarChart3, Plus,
  MessageSquare, Sun, Moon, Monitor, LogOut, Target,
} from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../context/AuthContext";
import ChatListItem from "../features/chats/ChatListItem";
import { useTranslation } from "react-i18next";
import { useNavbarJournals, refreshPinnedJournals } from "../hooks/journals/usePinnedJournals";
import ManageNavbarJournals from "../features/journals/components/ManageNavbarJournals";
import "../styles/shared/index.css";

const ICONS = { LayoutDashboard, PenLine, Calendar };

const NAV_ITEMS = [
  { icon: "LayoutDashboard", id: "dashboard" },
  { icon: "Calendar", id: "scheduling" },
  { icon: "PenLine", id: "journals" },
];

function ThemeSwitcher({ currentTheme, onSelect }) {
  const { t } = useTranslation();
  return (
    <div className="sidebar-switcher">
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
            className={`sidebar-switcher-btn ${active ? "sidebar-switcher-btn--active" : ""}`}
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
    <div className="sidebar-switcher">
      {[
        { value: "en", label: t("nav.english") },
        { value: "id", label: t("nav.indonesian") },
      ].map(({ value, label }) => {
        const active = currentLang === value;
        return (
          <button
            key={value}
            onClick={() => i18n.changeLanguage(value)}
            className={`sidebar-switcher-btn ${active ? "sidebar-switcher-btn--active" : ""}`}
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
  const navbarJournals = useNavbarJournals();
  const [showManageNavbar, setShowManageNavbar] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    refreshPinnedJournals();
  }, []);

  const pathname = location.pathname;
  const activeTab = pathname.startsWith("/app") ? pathname.split("/")[2] || "dashboard" : "dashboard";
  const activeSessionId = pathname.startsWith("/app/spill/") ? pathname.split("/")[3] : null;
  const activeJournalId = pathname.startsWith("/app/journals/") ? pathname.split("/")[3] : null;

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
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo-icon">
            <Brain size={18} color="white" />
          </div>
          <span className="sidebar-logo-text">
            {t("app.name")}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="sidebar-nav-section">
        <p className="sidebar-section-label sidebar-label-nav">
          {t("nav.mainMenu")}
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = activeTab === item.id;
          return (
            <div key={item.id}>
              <button
                onClick={() => { navigate(`/app/${item.id}`); onNavClick?.() }}
                className={`sidebar-nav-btn ${active ? "sidebar-nav-btn--active" : ""}`}
              >
                <Icon size={17} />
                {t(`nav.${item.id}`)}
              </button>
              {item.id === "journals" && (
                <div className="sidebar-journal-submenu">
                  <button
                    onClick={() => { setShowManageNavbar(true); onNavClick?.() }}
                    className="sidebar-pinned-btn"
                  >
                    {t("nav.pinned")}
                  </button>
                  {navbarJournals.length > 0 && (
                    <div>
                      {navbarJournals.slice(0, 3).map((journal) => {
                        const isActive = activeJournalId === journal.id;
                        const emoji = journal.emojis?.find(Boolean) || "📖";
                        return (
                          <button
                            key={journal.id}
                            onClick={() => { navigate(`/app/journals/${journal.id}`); onNavClick?.() }}
                            className={`sidebar-journal-item ${isActive ? "sidebar-journal-item--active" : ""}`}
                          >
                            <span className="sidebar-journal-emoji">{emoji}</span>
                            <span className="sidebar-journal-title">
                              {journal.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chat list */}
      <div className="sidebar-chat-section">
        <div className="sidebar-chat-header">
          <p className="sidebar-section-label">
            {t("nav.recentChats")}
          </p>
          <button
            onClick={onNewChat}
            className="sidebar-new-chat-btn"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="sidebar-chat-list">
          {sessions.length === 0 && (
            <div className="sidebar-empty-state">
              <div className="sidebar-empty-icon">
                <MessageSquare size={14} />
              </div>
              <p className="sidebar-empty-text">
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
      </div>

      {/* User footer */}
      <div ref={accountRef} className="sidebar-footer">
        <button
          onClick={() => setShowAccountMenu((v) => !v)}
          className="sidebar-account-btn"
        >
          <div className="sidebar-avatar">
            {initials}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">
              {displayName}
            </p>
            <p className="sidebar-user-plan">
              {t("nav.basicPlan")}
            </p>
          </div>
        </button>

        {showAccountMenu && (
          <div className="sidebar-dropdown">
            <p className="sidebar-section-label sidebar-label-dropdown">
              {t("nav.theme")}
            </p>
            <ThemeSwitcher currentTheme={currentTheme} onSelect={setTheme} />
            <p className="sidebar-section-label sidebar-label-dropdown-top">
              {t("nav.language")}
            </p>
            <LanguageSwitcher />

            <button
              onClick={() => { setShowAccountMenu(false); navigate("/app/progress-tracker"); onNavClick?.() }}
              className="sidebar-dropdown-btn"
            >
              <Target size={15} />
              {t("nav.progressTracker") || "Progress Tracker"}
            </button>
            <button
              onClick={() => { setShowAccountMenu(false); navigate("/app/insight"); onNavClick?.() }}
              className="sidebar-dropdown-btn"
            >
              <BarChart3 size={15} />
              {t("nav.insight")}
            </button>
            <button
              onClick={handleLogout}
              className="sidebar-dropdown-btn sidebar-dropdown-btn--danger"
            >
              <LogOut size={15} />
              {t("nav.logout") || "Log Out"}
            </button>
          </div>
        )}
      </div>

      {showManageNavbar && (
        <ManageNavbarJournals
          open={showManageNavbar}
          onClose={() => setShowManageNavbar(false)}
        />
      )}
    </div>
  );
}
