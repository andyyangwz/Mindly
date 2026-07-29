import { useState, useRef, useCallback } from "react"
import "../../../styles/scheduling/index.css"

export default function InteractiveProgressBar({ value = 0, color = "#6366F1", onChange, headerSuffix, baselineValue }) {
  const [draftProgress, setDraftProgress] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [glowActive, setGlowActive] = useState(false)
  const [glowTarget, setGlowTarget] = useState(0)
  const barRef = useRef(null)

  const baseValue = baselineValue ?? value
  const displayProgress = draftProgress !== null ? draftProgress : value
  const hasIncrease = displayProgress > baseValue
  const hasDecrease = displayProgress < baseValue

  const getProgressFromPointer = useCallback((clientX) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    return Math.min(100, Math.max(0, Math.round((x / rect.width) * 100)))
  }, [])

  const handleBarPointerDown = useCallback((e) => {
    if (!onChange) return
    e.preventDefault()
    e.stopPropagation()
    const val = getProgressFromPointer(e.clientX)
    setDraftProgress(val)
    setIsDragging(true)
    if (val > baseValue) {
      setGlowActive(true)
      setGlowTarget(val)
    }

    const onMove = (ev) => {
      const newVal = getProgressFromPointer(ev.clientX)
      setDraftProgress(newVal)
      if (newVal > baseValue) {
        setGlowActive(true)
        setGlowTarget(newVal)
      } else {
        setGlowActive(false)
      }
    }
    const onUp = (ev) => {
      setIsDragging(false)
      setGlowActive(false)
      const finalVal = getProgressFromPointer(ev.clientX)
      if (finalVal !== value) {
        onChange(finalVal)
      }
      setDraftProgress(null)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [value, baseValue, getProgressFromPointer, onChange])

  return (
    <div className="ipb-container">
      <div className="ipb-header">
        <span className="ipb-label" style={{ color }}>Progress</span>
        {onChange ? (
          <div className="ipb-value-row">
            <input
              type="number"
              min={0}
              max={100}
              value={displayProgress}
              onChange={(e) => {
                const raw = parseInt(e.target.value, 10)
                if (isNaN(raw)) return
                const v = Math.min(100, Math.max(0, raw))
                setDraftProgress(v)
              }}
              onBlur={() => {
                if (draftProgress !== null && draftProgress !== value) {
                  onChange(draftProgress)
                }
                setDraftProgress(null)
              }}
              onKeyDown={(e) => { if (e.key === "Enter") e.target.blur() }}
              className="ipb-input"
              style={{
                border: `1px solid ${color}30`,
                background: `${color}08`,
                color,
              }}
            />
            <span className="ipb-percent" style={{ color }}>%</span>
            {headerSuffix}
          </div>
        ) : (
          <span className="ipb-static-value" style={{ color }}>{value}%</span>
        )}
      </div>
      <div
        ref={barRef}
        onPointerDown={onChange ? handleBarPointerDown : undefined}
        className="ipb-bar"
        style={{
          background: `${color}15`,
          cursor: onChange ? "pointer" : "default",
        }}
      >
        <div className="ipb-bar-fill" style={{
          width: `${displayProgress}%`,
          background: color,
          transition: (hasIncrease || hasDecrease) ? "none" : "width 0.3s ease",
        }} />
        {glowActive && (
          <div className="ipb-glow" style={{
            width: `${glowTarget}%`,
            background: `linear-gradient(90deg, ${color}00 0%, ${color}60 50%, ${color}00 100%)`,
            boxShadow: `0 0 14px ${color}90`,
            transition: "width 0.3s ease-out",
          }} />
        )}
        {hasIncrease && (
          <div className="ipb-unsaved" style={{
            left: `${baseValue}%`,
            width: `${displayProgress - baseValue}%`,
            background: `color-mix(in srgb, ${color} 75%, #000 25%)`,
          }} />
        )}
        {hasDecrease && (
          <div className="ipb-ghost" style={{
            left: `${displayProgress}%`,
            width: `${baseValue - displayProgress}%`,
            background: `${color}25`,
          }} />
        )}
        {onChange && (
          <div className="ipb-thumb" style={{
            left: `${displayProgress}%`,
            transform: "translate(-50%, -50%)",
            width: isDragging ? 18 : 16,
            height: isDragging ? 18 : 16,
            background: "var(--color-card, white)",
            border: `2.5px solid ${color}`,
            boxShadow: isDragging
              ? `0 0 0 4px ${color}20, 0 1px 4px ${color}40`
              : `0 1px 3px ${color}30`,
            transition: isDragging
              ? "none"
              : "left 0.3s ease, width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease",
          }} />
        )}
      </div>
    </div>
  )
}