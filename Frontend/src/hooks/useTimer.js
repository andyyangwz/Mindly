import { useState, useEffect, useRef } from "react";

export function useTimer(initialDuration = 25 * 60) {
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [running, setRunning] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const initialRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    startRef.current = Date.now();
    initialRef.current = timeLeft;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, Math.floor(initialRef.current - elapsed));
      setTimeLeft(remaining);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const hours = String(Math.floor(timeLeft / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, "0");
  const seconds = String(Math.floor(timeLeft % 60)).padStart(2, "0");

  const display = timeLeft >= 3600
    ? `${hours}:${minutes}:${seconds}`
    : `${minutes}:${seconds}`;

  return { timeLeft, setTimeLeft, running, setRunning, hours, minutes, seconds, display };
}
