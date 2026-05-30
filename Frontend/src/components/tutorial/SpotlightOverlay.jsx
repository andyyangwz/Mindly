import { useState, useRef, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useTutorial } from "./TutorialContext"
import TUTORIAL_CONTENT, { getLocalizedTutorialContent } from "./tutorialContent"
import { getTutorialMascot } from "./tutorialMascotMapping"
import { theme } from "../../theme"

const SPOTLIGHT_PADDING = 16
const SPOTLIGHT_RADIUS = 14

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

function createCutoutPath(x, y, w, h, r) {
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

  // ─── Keyboard navigation: Left/Right arrows for back/next ───
  useEffect(() => {
    if (!tutorialId || !content) return
    const handler = (e) => {
      if (e.key === "ArrowLeft" && step > 0) {
        e.preventDefault()
        goToStep(step - 1)
      } else if (e.key === "ArrowRight" && step < content.steps.length - 1) {
        e.preventDefault()
        goToStep(step + 1)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [tutorialId, content, step, goToStep])

  // ─── The target element is NEVER modified ───

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
      updateSpotlightTarget(targetId, true)
    } else {
      requestAnimationFrame(() => retrySpotlight(targetId, attempt + 1))
    }
  }, [updateSpotlightTarget])

  useEffect(() => {
    if (!currentStep?.targetId) return
    retrySpotlight(currentStep.targetId)
  }, [currentStep?.targetId, retrySpotlight])

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

  const sp = SPOTLIGHT_PADDING
  const sr = SPOTLIGHT_RADIUS
  const stepOffsetX = currentStep?.spotlightOffsetX ?? 0
  const stepOffsetY = currentStep?.spotlightOffsetY ?? 0
  const sx = spotlightRect.left - sp + stepOffsetX
  const sy = spotlightRect.top - sp + stepOffsetY
  const sw = spotlightRect.width + sp * 2
  const sh = spotlightRect.height + sp * 2

  const vw = window.innerWidth
  const vh = window.innerHeight

  // SVG mask with internal `<mask>` — renders black everywhere with a transparent hole for the cutout
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" width="${vw}" height="${vh}">
  <defs>
    <mask id="m">
      <rect width="${vw}" height="${vh}" fill="white"/>
      <path d="${createCutoutPath(sx, sy, sw, sh, sr)}" fill="black"/>
    </mask>
  </defs>
  <rect width="${vw}" height="${vh}" fill="black" mask="url(#m)"/>
</svg>`
  const maskImage = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`

  return (
    <>
      <style>{`
        @keyframes spotlightIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Fullscreen dark overlay with mask cutout — target shows through as a real hole */}
      <div
        onClick={handleBackdropClick}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.80)",
          WebkitMaskImage: maskImage,
          maskImage,
          WebkitMaskSize: `${vw}px ${vh}px`,
          maskSize: `${vw}px ${vh}px`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          cursor: "pointer",
          animation: "spotlightIn 0.3s ease both",
        }}
      />

      {/* Outer glow — pulsing intensity */}
      <div
        style={{
          position: "fixed",
          top: sy - 8,
          left: sx - 8,
          width: sw + 16,
          height: sh + 16,
          borderRadius: sr + 8,
          boxShadow: [
            `0 0 30px 8px ${theme.primary}55`,
            `0 0 60px 20px ${theme.primary}30`,
            `0 0 120px 50px ${theme.primary}15`,
          ].join(", "),
          zIndex: 9999,
          pointerEvents: "none",
          animation: "glowPulse 2.5s ease-in-out infinite",
          transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
        }}
      />

      {/* Edge ring — clean visible boundary around the cutout */}
      <div
        style={{
          position: "fixed",
          top: sy - 1,
          left: sx - 1,
          width: sw + 2,
          height: sh + 2,
          borderRadius: sr + 1,
          border: "1.5px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
          zIndex: 9999,
          pointerEvents: "none",
          transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
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
          borderRadius: 16,
          boxShadow: "0 24px 80px 16px rgba(0,0,0,0.45)",
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
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 4,
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
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.30)) drop-shadow(0 24px 64px rgba(0,0,0,0.20))",
              objectFit: "contain",
            }}
          />
        )}
      </div>
    </>
  )
}
