import { useState, useMemo } from "react";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";
import * as HiIcons from "react-icons/hi";
import * as GiIcons from "react-icons/gi";
import * as BiIcons from "react-icons/bi";
import * as TbIcons from "react-icons/tb";
import * as RiIcons from "react-icons/ri";

const iconSets = {
  ...FaIcons,
  ...MdIcons,
  ...IoIcons,
  ...HiIcons,
  ...GiIcons,
  ...BiIcons,
  ...TbIcons,
  ...RiIcons,
};

function isIconComponent(value) {
  return typeof value === "function" && value.name !== "GenIcon";
}

const COMMON_CANDIDATES = [
  "FaDumbbell", "FaBook", "FaCode", "FaRunning", "FaBicycle",
  "FaBrain", "FaHeart", "FaStar", "FaFire", "FaRocket",
  "FaSeedling", "FaWater", "FaSun", "FaMoon", "FaCoffee",
  "FaYoga", "FaMusic", "FaPaintBrush", "FaPen", "FaPencilAlt",
  "FaWalking", "FaSwimmer", "FaMedal", "FaTrophy", "FaGlobe",
  "FaLeaf", "FaApple", "FaDog", "FaCat", "FaTree",
  "FaHome", "FaBookOpen", "FaLaptop", "FaPhone", "FaCamera",
  "FaSmile", "FaBolt", "FaClock", "FaCalendar", "FaCheckCircle",
  "MdFitnessCenter", "MdSelfImprovement", "MdAutoGraph", "MdMenuBook",
  "MdLightMode", "MdBedtime", "MdWaterDrop", "MdEmojiEmotions",
  "MdSchool", "MdDirectionsRun", "MdMonitorHeart", "MdNightsStay",
  "IoBody", "IoBarbell", "IoBicycle", "IoWalk", "IoHappy",
  "IoLeaf", "IoWater", "IoFlame", "IoNutrition", "IoMoon",
  "GiMeditation", "GiWeight", "GiHealthNormal", "GiBrain",
  "GiHeartBeats", "GiRunningShoe", "GiMuscleUp", "GiLotus",
  "HiSparkles", "HiAcademicCap", "HiBeaker", "HiClock",
  "BiCycling", "BiRun", "BiDumbbell", "BiBookHeart",
  "TbBeach", "TbMoodSmile", "TbHeartRateMonitor",
  "RiMentalHealthLine", "RiHeartAddLine", "RiMindMap",
];

const COMMON_ICONS = COMMON_CANDIDATES.filter(
  (name) => isIconComponent(iconSets[name])
);

const allIcons = Object.keys(iconSets).filter(
  (name) => /^[A-Z]/.test(name) && !name.startsWith("Icon") && isIconComponent(iconSets[name])
);

export function resolveIcon(name) {
  return iconSets[name] || FaIcons.FaStar;
}

export default function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const source = search ? allIcons : COMMON_ICONS;
    if (!search) return source.slice(0, 60);
    const q = search.toLowerCase();
    return source.filter((n) => n.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-border, #E5E7EB)",
            background: "var(--color-bg, #F9FAFB)",
            color: "var(--color-dark, #1F2937)",
            fontSize: 13,
            outline: "none",
          }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 4,
          maxHeight: 200,
          overflowY: "auto",
          padding: "2px 0",
        }}
      >
        {filtered.map((name) => {
          const IconComponent = iconSets[name];
          if (typeof IconComponent !== "function") return null;
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 8,
                border: selected
                  ? "2px solid var(--color-primary, #8B5CF6)"
                  : "1px solid transparent",
                background: selected
                  ? "var(--color-primary, #8B5CF6)"
                  : "transparent",
                color: selected
                  ? "#fff"
                  : "var(--color-dark, #1F2937)",
                cursor: "pointer",
                fontSize: 16,
                transition: "all 0.15s",
              }}
            >
              <IconComponent />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <span
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              fontSize: 12,
              color: "#9CA3AF",
              padding: "16px 0",
            }}
          >
            No icons found
          </span>
        )}
      </div>
      {!search && (
        <p
          style={{
            fontSize: 10,
            color: "#9CA3AF",
            margin: "4px 0 0",
            textAlign: "center",
          }}
        >
          Scroll or type to search all icons
        </p>
      )}
    </div>
  );
}
