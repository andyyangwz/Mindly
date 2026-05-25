import { useState, useRef, useEffect } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT, { getLocalizedTutorialContent } from "./tutorialContent"
import { getTutorialMascot } from "./tutorialMascotMapping"
import { theme } from "../../theme"

function getCardPosition(rect, cardW, cardH) {
  const gap = 16
  const margin = 16
  const vw = window.innerWidth
  const vh = window.innerHeight

  const fitsBelow = rect.bottom + gap + cardH + margin <= vh
  const fitsAbove = rect.top - gap - cardH >= margin
  const fitsRight = rect.right + gap + cardW + margin <= vw
  const fitsLeft = rect.left - gap - cardW >= margin

  let top, leftPos

  if (fitsBelow) {
    top = rect.bottom + gap
    leftPos = Math.max(margin, Math.min(rect.left, vw - cardW - margin))
  } else if (fitsAbove) {
    top = rect.top - gap - cardH
    leftPos = Math.max(margin, Math.min(rect.left, vw - cardW - margin))
  } else if (fitsRight) {
    top = Math.max(margin, Math.min(rect.top, vh - cardH - margin))
    leftPos = rect.right + gap
  } else if (fitsLeft) {
    top = Math.max(margin, Math.min(rect.top, vh - cardH - margin))
    leftPos = rect.left - gap - cardW
  } else {
    top = Math.max(margin, Math.min(vh / 2 - cardH / 2, vh - cardH - margin))
    leftPos = Math.max(margin, Math.min(vw / 2 - cardW / 2, vw - cardW - margin))
  }

  return { top, left: leftPos }
}

export default function SpotlightOverlay() {
  const { tutorialId, spotlightRect, closeTutorial, updateSpotlightTarget } = useTutorial()
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 })
  const [positioned, setPositioned] = useState(false)
  const cardRef = useRef(null)

  const { t } = useTranslation()
  const content = tutorialId
    ? getLocalizedTutorialContent(t, tutorialId) || TUTORIAL_CONTENT[tutorialId]
    : null

  const isMultiStep = content && content.steps && content.steps.length > 1
  const currentStep = content?.steps?.[step] || null

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setVisible(false)
      setStep(0)
      closeTutorial()
    }, 250)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  useEffect(() => {
    if (!cardRef.current || !spotlightRect) return
    const raf = requestAnimationFrame(() => {
      if (!cardRef.current) return
      const { offsetWidth, offsetHeight } = cardRef.current
      setCardPos(getCardPosition(spotlightRect, offsetWidth, offsetHeight))
      setPositioned(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [visible, spotlightRect, step])

  useEffect(() => {
    if (!currentStep?.targetId) return
    updateSpotlightTarget(currentStep.targetId)
  }, [step, currentStep?.targetId])

  if (!tutorialId || !content || !spotlightRect) {
    if (visible) {
      setVisible(false)
      setStep(0)
    }
    return null
  }

  if (!visible) {
    requestAnimationFrame(() => setVisible(true))
    return null
  }

  const dotColor = theme.primary

  return (
    <>
      {/* Dark backdrop */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.45)",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Spotlight aperture — cuts hole in dark overlay */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
          borderRadius: 14,
          zIndex: 9999,
          pointerEvents: "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Bright overlay on spotlighted area to make it pop */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
          borderRadius: 14,
          background: "rgba(255,255,255,0.05)",
          zIndex: 10000,
          pointerEvents: "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Glow ring around spotlight */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top - 3,
          left: spotlightRect.left - 3,
          width: spotlightRect.width + 6,
          height: spotlightRect.height + 6,
          borderRadius: 16,
          border: `2px solid ${theme.primary}88`,
          boxShadow: `0 0 48px ${theme.primary}66, 0 0 0 1px rgba(255,255,255,0.15)`,
          zIndex: 10001,
          pointerEvents: "none",
          transition: "all 0.3s ease",
        }}
      />

      {/* Tutorial card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          top: cardPos.top,
          left: cardPos.left,
          zIndex: 10000,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          overflow: "visible",
          opacity: positioned ? (closing ? 0 : 1) : 0,
          transform: positioned ? (closing ? "translateY(8px)" : "translateY(0)") : "translateY(8px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <div
          style={{
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.15), 0 0 0 1px ${theme.primary}11`,
            padding: "24px 24px 20px",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
            position: "relative",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "var(--color-input)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.primary + "1a"
              e.currentTarget.style.color = theme.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-input)"
              e.currentTarget.style.color = theme.muted
            }}
          >
            <X size={13} />
          </button>

          {/* Step indicator dots */}
          {isMultiStep && (
            <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
              {content.steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? dotColor : theme.border,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: theme.dark,
              margin: "0 0 4px",
            }}
          >
            {isMultiStep && currentStep ? currentStep.title : content.title}
          </h3>

          {/* Description or step text */}
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: theme.muted,
              margin: "0 0 16px",
            }}
          >
            {isMultiStep && currentStep
              ? currentStep.text
              : content.description}
          </p>

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 6,
            }}
          >
            {isMultiStep && step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: "var(--color-card, white)",
                  color: theme.dark,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.primary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border
                }}
              >
                <ChevronLeft size={13} />
                Back
              </button>
            )}

            {isMultiStep && step < content.steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                Next
                <ChevronRight size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                  color: "white",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Mascot — bottom-left overflow */}
        {tutorialId && (
          <motion.img
            src={getTutorialMascot(tutorialId)}
            alt=""
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              bottom: -60,
              left: -24,
              width: 100,
              height: "auto",
              pointerEvents: "none",
              zIndex: 10001,
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    </>
  )
}
