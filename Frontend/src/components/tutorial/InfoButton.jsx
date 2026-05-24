import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT from "./tutorialContent"
import { theme } from "../../theme"

export default function InfoButton({ tutorialId, size = 14, style: customStyle }) {
  const { openTutorial, isHintDismissed, dismissHint } = useTutorial()
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPhase, setTooltipPhase] = useState("hidden")
  const btnRef = useRef(null)
  const content = TUTORIAL_CONTENT[tutorialId]

  if (!content) return null

  const hasHint = !isHintDismissed(tutorialId)

  useEffect(() => {
    if (showTooltip) {
      setTooltipPhase("entering")
      requestAnimationFrame(() => setTooltipPhase("visible"))
    } else {
      setTooltipPhase("leaving")
      const t = setTimeout(() => setTooltipPhase("hidden"), 200)
      return () => clearTimeout(t)
    }
  }, [showTooltip])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={`Learn about ${content.title}`}
        onClick={(e) => {
          e.stopPropagation()
          if (hasHint) dismissHint(tutorialId)
          openTutorial(tutorialId)
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size + 8,
          height: size + 8,
          borderRadius: "50%",
          border: `1px solid ${theme.primary}99`,
          background: `${theme.primary}1a`,
          color: theme.primary,
          cursor: "pointer",
          padding: 0,
          transition: "all 0.2s",
          opacity: 0.85,
          position: "relative",
          verticalAlign: "middle",
          flexShrink: 0,
          ...customStyle,
        }}
        onMouseEnterCapture={(e) => {
          e.currentTarget.style.opacity = "1"
          e.currentTarget.style.borderColor = theme.primary
          e.currentTarget.style.background = theme.primary + "30"
          e.currentTarget.style.transform = "scale(1.12)"
        }}
        onMouseLeaveCapture={(e) => {
          if (!e.currentTarget.matches(":focus")) {
            e.currentTarget.style.opacity = "0.85"
            e.currentTarget.style.borderColor = theme.primary + "99"
            e.currentTarget.style.background = theme.primary + "1a"
            e.currentTarget.style.transform = "scale(1)"
          }
        }}
      >
        <Info size={size} />
      </button>

      {tooltipPhase !== "hidden" && (
        <div
          style={{
            position: "fixed",
            zIndex: 99999,
            pointerEvents: "none",
            maxWidth: 240,
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 12,
            lineHeight: 1.4,
            color: theme.dark,
            background: "var(--color-card, white)",
            border: `1px solid ${theme.border}`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            opacity: tooltipPhase === "visible" ? 1 : 0,
            transform:
              tooltipPhase === "visible"
                ? "translateY(0)"
                : "translateY(4px)",
            transition: "opacity 0.2s, transform 0.2s",
            top: btnRef.current
              ? btnRef.current.getBoundingClientRect().bottom + 8
              : 0,
            left: btnRef.current
              ? Math.max(
                  8,
                  Math.min(
                    btnRef.current.getBoundingClientRect().left -
                      100 +
                      btnRef.current.offsetWidth / 2,
                    window.innerWidth - 250
                  )
                )
              : 0,
          }}
        >
          {content.tooltip}
        </div>
      )}
    </>
  )
}

export function useInfoContent(tutorialId) {
  return TUTORIAL_CONTENT[tutorialId] || null
}
