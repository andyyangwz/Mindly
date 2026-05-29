import { useState, useRef, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT, { getLocalizedTutorialContent } from "./tutorialContent"
import { getTutorialMascot } from "./tutorialMascotMapping"
import { theme } from "../../theme"

const SPOTLIGHT_PADDING = 12
const SPOTLIGHT_RADIUS = 16

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

function createRoundedRectPath(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  return [
    `M ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${y + h - r}`,
    `Q ${x + w} ${y + h} ${x + w - r} ${y + h}`,
    `L ${x + r} ${y + h}`,
    `Q ${x} ${y + h} ${x} ${y + h - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ")
}

export default function SpotlightOverlay() {
  const { tutorialId, spotlightRect, closeTutorial, updateSpotlightTarget, setTutorialStep } = useTutorial()
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

  useEffect(() => {
    if (tutorialId) setTutorialStep(step)
  }, [tutorialId])

  const goToStep = useCallback((newStep) => {
    setStep(newStep)
    setTutorialStep(newStep)
  }, [setStep, setTutorialStep])

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

  // ─── Scroll lock when tutorial active ───
  useEffect(() => {
    if (tutorialId) {
      const prev = document.body.style.overflow
      const prevPos = document.body.style.position
      const prevTop = document.body.style.top
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.overflow = "hidden"
      document.body.style.width = "100%"
      return () => {
        document.body.style.position = prevPos
        document.body.style.top = prevTop
        document.body.style.overflow = prev
        document.body.style.width = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [tutorialId])

  // ─── Elevate the target element ───
  useEffect(() => {
    const id = "tutorial-target-elevation"
    if (!currentStep?.targetId) {
      document.getElementById(id)?.remove()
      return
    }
    const el = document.querySelector(`[data-tutorial-target="${currentStep.targetId}"]`)
    if (!el) return
    el.setAttribute("data-tutorial-active", "")

    let prevBoxShadow = el.style.boxShadow
    let prevFilter = el.style.filter
    let prevTransition = el.style.transition

    el.style.transition = "all 0.35s ease"
    el.style.filter = "brightness(1.06)"

    return () => {
      el.removeAttribute("data-tutorial-active")
      el.style.filter = prevFilter
      el.style.transition = prevTransition
      document.getElementById(id)?.remove()
    }
  }, [currentStep?.targetId])

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

  const retrySpotlight = useCallback((targetId, attempt = 0) => {
    if (attempt > 10) return
    const el = document.querySelector(`[data-tutorial-target="${targetId}"]`)
    if (el) {
      updateSpotlightTarget(targetId)
    } else {
      requestAnimationFrame(() => retrySpotlight(targetId, attempt + 1))
    }
  }, [updateSpotlightTarget])

  useEffect(() => {
    if (!currentStep?.targetId) return
    retrySpotlight(currentStep.targetId)
  }, [step, currentStep?.targetId, retrySpotlight])

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

  // Spotlight padded rect (slightly larger than target for breathing room)
  const sp = SPOTLIGHT_PADDING
  const sr = SPOTLIGHT_RADIUS
  const sx = spotlightRect.left - sp
  const sy = spotlightRect.top - sp
  const sw = spotlightRect.width + sp * 2
  const sh = spotlightRect.height + sp * 2

  const vw = window.innerWidth
  const vh = window.innerHeight

  // build the clip-path: full viewport outer rect, then subtract the target rect
  const clipPath = `path("M 0 0 H ${vw} V ${vh} H 0 Z M ${createRoundedRectPath(sx, sy, sw, sh, sr)}")`

  const isOpen = tutorialId && !!spotlightRect

  return (
    <>
      {/* Prevent pointer events on the main content behind (except card) */}
      {isOpen && (
        <style>{`
          [data-tutorial-active] {
            box-shadow: 0 4px 28px rgba(0,0,0,0.12), 0 0 0 3px rgba(255,255,255,0.18) !important;
          }
        `}</style>
      )}

      {/* Backdrop + blur + cutout */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.30)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          clipPath,
          opacity: closing ? 0 : 1,
          transition: "opacity 0.35s ease, clip-path 0.35s ease",
          pointerEvents: "auto",
        }}
      />

      {/* Soft radial glow behind the spotlight target */}
      <div
        style={{
          position: "fixed",
          top: spotlightRect.top - 40,
          left: spotlightRect.left - 40,
          width: spotlightRect.width + 80,
          height: spotlightRect.height + 80,
          borderRadius: "50%",
          background: `radial-gradient(circle at center, ${theme.primary}18 0%, ${theme.primary}08 40%, transparent 70%)`,
          zIndex: 9997,
          pointerEvents: "none",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.5s ease, all 0.35s ease",
        }}
      />

      {/* Spotlight glow ring — larger, softer */}
      <div
        style={{
          position: "fixed",
          top: sy - 6,
          left: sx - 6,
          width: sw + 12,
          height: sh + 12,
          borderRadius: sr + 6,
          border: `1.5px solid ${theme.primary}55`,
          boxShadow: `0 0 64px ${theme.primary}44, 0 0 0 1px rgba(255,255,255,0.08)`,
          zIndex: 10000,
          pointerEvents: "none",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.4s ease, all 0.35s ease",
        }}
      />

      {/* Bright overlay on target area — compensates for backdrop dim */}
      <div
        style={{
          position: "fixed",
          top: sx,
          left: sy,
          width: sw,
          height: sh,
          borderRadius: sr,
          background: "rgba(255,255,255,0.06)",
          zIndex: 10001,
          pointerEvents: "none",
          opacity: closing ? 0 : 1,
          transition: "opacity 0.35s ease, all 0.35s ease",
        }}
      />

      {/* Tutorial card */}
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          top: cardPos.top,
          left: cardPos.left,
          zIndex: 10002,
          width: 340,
          maxWidth: "calc(100vw - 32px)",
          overflow: "visible",
          opacity: positioned ? (closing ? 0 : 1) : 0,
          transform: positioned
            ? closing
              ? "translateY(8px) scale(0.98)"
              : "translateY(0) scale(1)"
            : "translateY(12px) scale(0.96)",
          transition: "opacity 0.3s ease, transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        }}
      >
        <div
          style={{
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.primary}33`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px ${theme.primary}22, 0 8px 32px ${theme.primary}15`,
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
                    width: i === step ? 22 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === step ? dotColor : theme.border,
                    transition: "all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
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
                onClick={() => goToStep(step - 1)}
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
                onClick={() => goToStep(step + 1)}
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
              zIndex: 10003,
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    </>
  )
}
