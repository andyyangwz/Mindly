import { useEffect, useState } from "react";

const ORBS = [
  { size: 500, x: "10%", y: "20%", blur: 120, speed: 20 },
  { size: 400, x: "70%", y: "10%", blur: 100, speed: 25 },
  { size: 350, x: "50%", y: "60%", blur: 90, speed: 30 },
  { size: 300, x: "85%", y: "70%", blur: 80, speed: 22 },
  { size: 250, x: "20%", y: "80%", blur: 70, speed: 28 },
];

function Orb({ orb, index }) {
  const [offset] = useState(() => ({
    x: Math.random() * 60 - 30,
    y: Math.random() * 60 - 30,
  }));

  return (
    <div
      style={{
        position: "absolute",
        width: orb.size,
        height: orb.size,
        left: `calc(${orb.x} + ${offset.x}px)`,
        top: `calc(${orb.y} + ${offset.y}px)`,
        borderRadius: "50%",
        background: "var(--landing-orb)",
        filter: `blur(${orb.blur}px)`,
        opacity: 0.5,
        pointerEvents: "none",
        animation: `orbFloat ${orb.speed}s ease-in-out infinite alternate`,
        transform: "translate(-50%, -50%)",
        willChange: "transform",
      }}
    />
  );
}

export default function FloatingOrbs({ count = 5 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, overflow: "hidden",
      zIndex: 0, pointerEvents: "none",
    }}>
      <style>{`
        @keyframes orbFloat {
          0% { transform: translate(-50%, -50%) translate(0, 0) scale(1); }
          33% { transform: translate(-50%, -50%) translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-50%, -50%) translate(-15px, 20px) scale(0.95); }
          100% { transform: translate(-50%, -50%) translate(10px, -10px) scale(1.02); }
        }
      `}</style>
      {ORBS.slice(0, count).map((orb, i) => (
        <Orb key={i} orb={orb} index={i} />
      ))}
    </div>
  );
}
