import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Sparkles, Lightbulb, Bot, Send, ChevronDown } from "lucide-react"
import { theme } from "../../../theme"
import mascotSrc from "../../../assets/mascot_images/empathic.png"

export default function AIPlanningAssistant() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)
  const suggestions = Object.values(t("productivity.aiPlanningAssistant.suggestions", { returnObjects: true }) ?? {})

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [expanded])

  return (
    <div
      style={{
        background: "var(--color-card, white)",
        borderRadius: 16,
        border: `1px solid ${theme.border}`,
        overflow: "hidden",
        cursor: expanded ? "default" : "pointer",
        transition: "box-shadow 0.2s ease",
      }}
      onClick={() => !expanded && setExpanded(true)}
      onMouseEnter={(e) => {
        if (!expanded) {
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      {/* Collapsed header — always visible */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          cursor: expanded ? "pointer" : "default",
        }}
        onClick={() => expanded && setExpanded(false)}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: `color-mix(in srgb, ${theme.primary} 22%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} color={theme.primaryText} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.dark,
              margin: 0,
            }}
          >
            {t("productivity.aiPlanningAssistant.title")}
          </p>
          {!expanded && (
            <p
              style={{
                fontSize: 11,
                color: theme.muted,
                margin: "2px 0 0",
              }}
            >
              {t("productivity.aiPlanningAssistant.subtitle")}
            </p>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: `color-mix(in srgb, ${theme.muted} 10%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={14} color={theme.muted} />
        </motion.div>
      </div>

      {/* Expandable content */}
      <motion.div
        animate={{ height: expanded ? contentHeight : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ overflow: "hidden" }}
      >
        <div ref={contentRef}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              padding: "0 18px 18px",
            }}
          >
            {/* Left column — Smart Suggestions */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Lightbulb size={13} color={theme.primaryText} />
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.dark,
                    margin: 0,
                  }}
                >
                  {t("productivity.aiPlanningAssistant.smartSuggestions")}
                </p>
              </div>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    marginBottom: 6,
                    background: "var(--color-card, white)",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: theme.secondary,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 12,
                      color: theme.dark,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {s}
                  </p>
                </div>
              ))}
            </div>

              {/* Right column — AI Scheduler */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <Bot size={13} color={theme.primaryText} />
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.dark,
                    margin: 0,
                  }}
                >
                  {t("productivity.aiPlanningAssistant.aiScheduler")}
                </p>
              </div>
              <div
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  overflow: "visible",
                  position: "relative",
                }}
              >
                <textarea
                  placeholder={t("productivity.aiPlanningAssistant.placeholder")}
                  rows={4}
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    resize: "none",
                    padding: 12,
                    fontSize: 12,
                    color: theme.dark,
                    background: "var(--color-card, white)",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: "6px 8px",
                    borderTop: `1px solid ${theme.border}`,
                    background: `color-mix(in srgb, ${theme.bg} 50%, transparent)`,
                  }}
                >
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: "white",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.85"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1"
                    }}
                  >
                    <Send size={12} />
                    {t("productivity.aiPlanningAssistant.generateSchedule")}
                  </button>
                </div>
                <motion.img
                  src={mascotSrc}
                  alt=""
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    left: -16,
                    bottom: -16,
                    width: 56,
                    height: 56,
                    objectFit: "contain",
                    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.12))",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
