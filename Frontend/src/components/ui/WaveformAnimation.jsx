import { useRef, useEffect, useCallback } from "react"
import { theme } from "../../theme"

export default function WaveformAnimation({ analyser, width = 320, height = 64, barCount = 28 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    const w = canvas.width
    const h = canvas.height

    const drawFrame = () => {
      animRef.current = requestAnimationFrame(drawFrame)
      ctx.clearRect(0, 0, w, h)

      const isDark = document.documentElement.getAttribute("data-theme") !== "light"
      const primary = theme.primary || "#8B5CF6"
      const barColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.35)"
      const glowColor = isDark ? `${primary}44` : `${primary}22`

      let dataArray
      let bufferLength = barCount

      if (analyser) {
        bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(dataArray)
      }

      const barWidth = w / barCount
      const gap = 2

      ctx.shadowBlur = 12
      ctx.shadowColor = glowColor

      for (let i = 0; i < barCount; i++) {
        let value
        if (dataArray) {
          const idx = Math.floor((i / barCount) * bufferLength)
          value = dataArray[idx] / 128.0
        } else {
          value = 0.5 + 0.3 * Math.sin((i / barCount) * Math.PI * 2 + Date.now() / 800)
        }

        const barH = Math.max(4, (value - 0.4) * h * 0.9)
        const x = i * barWidth + gap / 2
        const y = (h - barH) / 2
        const bw = barWidth - gap

        const r = Math.min(bw, barH) / 2
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + bw - r, y)
        ctx.arcTo(x + bw, y, x + bw, y + r, r)
        ctx.lineTo(x + bw, y + barH - r)
        ctx.arcTo(x + bw, y + barH, x + bw - r, y + barH, r)
        ctx.lineTo(x + r, y + barH)
        ctx.arcTo(x, y + barH, x, y + barH - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
        ctx.fillStyle = barColor
        ctx.fill()
      }

      ctx.shadowBlur = 0
    }
    drawFrame()
  }, [analyser, barCount])

  useEffect(() => {
    draw()
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width,
        height,
        borderRadius: 8,
        display: "block",
      }}
    />
  )
}
