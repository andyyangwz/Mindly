import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause, Square } from "lucide-react";
import { theme } from "../../../theme";
import { useTimer } from "../../../hooks/useTimer";

export default function FocusTimer() {
  const { t } = useTranslation();
  const [session, setSession] = useState("focus");
  const durations = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const { timeLeft, setTimeLeft, running, setRunning, display } = useTimer(durations[session]);
  const [originalDuration, setOriginalDuration] = useState(durations[session]);
  const percent = timeLeft / originalDuration * 100;

  const [focusMode, setFocusMode] = useState("idle");
  const [origin, setOrigin] = useState(null);
  const cardRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (focusMode === "entering") {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFocusMode("active");
        });
      });
      return () => cancelAnimationFrame(id);
    }
    if (focusMode === "exiting") {
      const id = setTimeout(() => {
        setFocusMode("idle");
      }, 400);
      return () => clearTimeout(id);
    }
  }, [focusMode]);

  useEffect(() => {
    if (editing && inputRef.current) {
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const handleReset = () => {
    setRunning(false);
    setTimeLeft(originalDuration);
  };

  const handleTimeClick = () => {
    if (running) return;
    setEditing(true);
    const hh = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
    const mm = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");
    setEditValue(`${hh}:${mm}:${ss}`);
  };

  const handleTimeChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9:]/g, "");
    if (cleaned.length <= 8) {
      setEditValue(cleaned);
    }
  };

  const handleTimeBlur = () => {
    setEditing(false);
    const parts = editValue.split(":").map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      const [h, m, s] = parts;
      if (h >= 0 && h <= 99 && m >= 0 && m < 60 && s >= 0 && s < 60) {
        const val = h * 3600 + m * 60 + s;
        setTimeLeft(val);
        setOriginalDuration(val);
      }
    }
  };

  const handleTimeKeyDown = (e) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
  };

  const startFocus = () => {
    if (cardRef.current) {
      const r = cardRef.current.getBoundingClientRect();
      setOrigin({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    setRunning(true);
    setFocusMode("entering");
  };

  const stopFocus = () => {
    setRunning(false);
    setFocusMode("exiting");
  };

  const QUICK_TIMES = ["01:00", "05:00", "15:00", "30:00", "60:00", "90:00"];

  const handleQuickTime = (timeStr) => {
    const [mm, ss] = timeStr.split(":").map(Number);
    const val = mm * 60 + ss;
    setRunning(false);
    setTimeLeft(val);
    setOriginalDuration(val);
  };

  const timerContent = (large) => {
    const s = large ? 360 : 180;
    const cx = large ? 180 : 90;
    const r = large ? 168 : 78;
    const circ = 2 * Math.PI * r;
    const fs = large ? 48 : 24;
    const iw = large ? 165 : 120;

    return (
      <>
        <h3 style={{ fontSize: large ? 18 : 14, fontWeight: 600, color: "white", marginBottom: large ? 36 : 18 }}>
          {t("productivity.focusTimer.title")}
        </h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: large ? 44 : 18 }}>
          <div style={{ position: "relative", width: s, height: s, marginBottom: large ? 28 : 16 }}>
            <svg width={s} height={s} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={cx} cy={cx} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth="6" fill="none" />
              <circle cx={cx} cy={cx} r={r} stroke="white" strokeWidth="6" fill="none" strokeLinecap="round"
                strokeDasharray={`${circ}`} strokeDashoffset={`${circ * (1 - percent / 100)}`} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {editing && !running ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={handleTimeChange}
                  onBlur={handleTimeBlur}
                  onKeyDown={handleTimeKeyDown}
                  autoFocus
                  style={{
                    width: iw,
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 6,
                    padding: "3px 6px",
                    fontSize: fs,
                    fontWeight: 600,
                    color: "white",
                    textAlign: "center",
                    fontVariantNumeric: "tabular-nums",
                    outline: "none",
                    fontFamily: "inherit",
                    letterSpacing: "0.02em",
                  }}
                />
              ) : (
                <span
                  onClick={large ? undefined : handleTimeClick}
                  style={{
                    fontSize: fs,
                    fontWeight: 600,
                    color: "white",
                    fontVariantNumeric: "tabular-nums",
                    cursor: large || running ? "default" : "pointer",
                    userSelect: "none",
                    letterSpacing: "0.02em",
                  }}
                >
                  {display}
                </span>
              )}
              <span style={{ fontSize: large ? 14 : 12, color: "rgba(255,255,255,0.8)", marginTop: large ? 12 : 6 }}>
                {session === "focus" ? t("productivity.focusTimer.focus") : session === "short" ? t("productivity.focusTimer.shortBreak") : t("productivity.focusTimer.longBreak")}
              </span>
            </div>
          </div>
          {!large && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setRunning(r => !r)} style={{ background: "white", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                {running ? <Pause size={15} color={theme.primary} /> : <Play size={15} color={theme.primary} />}
              </button>
              {!running && timeLeft < originalDuration && (
                <button onClick={handleReset} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, height: 36, padding: "0 12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 500 }}>
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
        {!large && (
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {QUICK_TIMES.map(t => (
              <button key={t} onClick={() => handleQuickTime(t)}
                style={{ flex: 1, padding: "4px 2px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", cursor: "pointer", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: 10, fontWeight: 500, transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)" }}
              >{t}</button>
            ))}
          </div>
        )}
      </>
    );
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardScale = origin ? Math.min(origin.w / vw, origin.h / vh) : 0.5;
  const entered = focusMode === "active";
  const showOverlay = focusMode !== "idle";

  return (
    <>
        <div
          ref={cardRef}
          style={{
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            borderRadius: 16,
            padding: "14px 16px 26px",
            transition: "opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            opacity: focusMode === "entering" || focusMode === "active" ? 0 : 1,
            pointerEvents: focusMode === "entering" || focusMode === "active" ? "none" : "auto",
            height: "auto",
            maxHeight: 700,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 0 }}>
            {timerContent(false)}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 10 }}>
          <button
            onClick={startFocus}
            style={{
              width: "100%",
              padding: "8px",
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 8,
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {t("productivity.focusTimer.start")}
          </button>
        </div>
      </div>

      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            transformOrigin: origin ? `${origin.x + origin.w / 2}px ${origin.y + origin.h / 2}px` : "center center",
            transform: entered ? "scale(1)" : `scale(${cardScale})`,
            opacity: entered ? 1 : 0,
            borderRadius: entered ? 0 : 16,
            transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: entered ? "auto" : "none",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {timerContent(true)}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                onClick={stopFocus}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 28px",
                  background: "rgba(255,255,255,0.2)",
                  border: "2px solid rgba(255,255,255,0.5)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)" }}
              >
                <Square size={16} fill="white" />
                {t("productivity.focusTimer.stop")}
              </button>
              <button
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  background: "rgba(255,255,255,0.1)",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderRadius: 12,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)" }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
