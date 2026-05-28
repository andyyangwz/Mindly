import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT from "./tutorialContent"
import { theme } from "../../theme"

export default function InfoButton({ tutorialId, size = 14, style: customStyle, showTooltip = true }) {
  const { openTutorial, isHintDismissed, dismissHint } = useTutorial()
  const content = TUTORIAL_CONTENT[tutorialId]

  if (!content) return null

  const hasHint = !isHintDismissed(tutorialId)

  const [tooltipVisible, setTooltipVisible] = useState(false)
  const btnRef = useRef(null)

  const button = (
    <button
      ref={showTooltip ? btnRef : null}
      type="button"
      aria-label={`Learn about ${content.title}`}
      onClick={(e) => {
        e.stopPropagation()
        if (hasHint) dismissHint(tutorialId)
        openTutorial(tutorialId)
      }}
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
      {...(showTooltip
        ? {
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.background = theme.primary + "30"
              e.currentTarget.style.transform = "scale(1.12)"
              setTooltipVisible(true)
            },
            onMouseLeave: (e) => {
              if (!e.currentTarget.matches(":focus")) {
                e.currentTarget.style.opacity = "0.85"
                e.currentTarget.style.borderColor = theme.primary + "99"
                e.currentTarget.style.background = theme.primary + "1a"
                e.currentTarget.style.transform = "scale(1)"
              }
              setTooltipVisible(false)
            },
            onFocus: () => setTooltipVisible(true),
            onBlur: () => setTooltipVisible(false),
          }
        : {
            onMouseEnter: (e) => {
              e.currentTarget.style.opacity = "1"
              e.currentTarget.style.borderColor = theme.primary
              e.currentTarget.style.background = theme.primary + "30"
              e.currentTarget.style.transform = "scale(1.12)"
            },
            onMouseLeave: (e) => {
              if (!e.currentTarget.matches(":focus")) {
                e.currentTarget.style.opacity = "0.85"
                e.currentTarget.style.borderColor = theme.primary + "99"
                e.currentTarget.style.background = theme.primary + "1a"
                e.currentTarget.style.transform = "scale(1)"
              }
            },
          })}
    >
      <Info size={size} />
    </button>
  )

  if (!showTooltip) return button

  return (
    <>
      {button}
      {tooltipVisible && (
        <TooltipContent btnRef={btnRef} content={content.tooltip} />
      )}
    </>
  )
}

function TooltipContent({ btnRef, content }) {
  const tooltipRef = useRef(null)
  const [style, setStyle] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!btnRef.current || !tooltipRef.current) return
    const btnRect = btnRef.current.getBoundingClientRect()
    const ttHeight = tooltipRef.current.offsetHeight
    const top = btnRect.top - ttHeight - 8 < 4
      ? btnRect.bottom + 8
      : btnRect.top - ttHeight - 8
    const left = Math.max(
      8,
      Math.min(
        btnRect.left - 100 + btnRef.current.offsetWidth / 2,
        window.innerWidth - 250
      )
    )
    setStyle({ top, left })
  }, [btnRef])

  return (
    <div
      ref={tooltipRef}
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
        top: style.top,
        left: style.left,
      }}
    >
      {content}
    </div>
  )
}


