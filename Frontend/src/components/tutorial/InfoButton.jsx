import { useState, useRef, useEffect } from "react"
import { Info } from "lucide-react"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT from "./tutorialContent"
import "../../styles/shared/index.css"

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
      className="ib-btn"
      style={{ width: size + 8, height: size + 8, ...customStyle }}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
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
      className="ib-tooltip"
      style={{ top: style.top, left: style.left }}
    >
      {content}
    </div>
  )
}


