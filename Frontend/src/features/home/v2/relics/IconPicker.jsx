import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";
import * as HiIcons from "react-icons/hi";
import * as GiIcons from "react-icons/gi";
import * as BiIcons from "react-icons/bi";
import * as TbIcons from "react-icons/tb";
import * as RiIcons from "react-icons/ri";

const iconSets = { ...FaIcons, ...MdIcons, ...IoIcons, ...HiIcons, ...GiIcons, ...BiIcons, ...TbIcons, ...RiIcons };

function isIconComponent(value) {
  return typeof value === "function" && value.name !== "GenIcon";
}

const COMMON = [
  "FaDumbbell","FaBook","FaCode","FaRunning","FaBicycle",
  "FaBrain","FaHeart","FaStar","FaFire","FaRocket",
  "FaSeedling","FaWater","FaSun","FaMoon","FaCoffee",
  "FaYoga","FaMusic","FaPaintBrush","FaPen","FaWalking",
  "FaMedal","FaTrophy","FaGlobe","FaLeaf","FaApple",
  "FaBolt","FaClock","FaCheckCircle","FaHome","FaSmile",
  "MdFitnessCenter","MdSelfImprovement","MdAutoGraph","MdMenuBook",
  "MdLightMode","MdBedtime","MdWaterDrop","MdEmojiEmotions",
  "MdSchool","MdDirectionsRun","MdMonitorHeart","MdNightsStay",
  "IoBody","IoBarbell","IoWalk","IoHappy","IoLeaf","IoWater","IoFlame",
  "GiMeditation","GiWeight","GiBrain","GiHeartBeats","GiMuscleUp","GiLotus",
  "HiSparkles","HiAcademicCap","HiBeaker","HiClock",
  "TbMoodSmile","TbHeartRateMonitor","RiMentalHealthLine","RiMindMap",
].filter((n) => isIconComponent(iconSets[n]));

const ALL = Object.keys(iconSets).filter(
  (n) => /^[A-Z]/.test(n) && !n.startsWith("Icon") && isIconComponent(iconSets[n])
);

export function resolveIcon(name) {
  return iconSets[name] || FaIcons.FaStar;
}

export default function IconPicker({ value, onChange }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const source = search ? ALL : COMMON;
    if (!search) return source.slice(0, 60);
    const q = search.toLowerCase();
    return source.filter((n) => n.toLowerCase().includes(q)).slice(0, 80);
  }, [search]);

  return (
    <div>
      {/* Search */}
      <div style={{ position: "relative", marginBottom: 10 }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--relic-text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 12px 9px 32px",
            borderRadius: 10,
            border: "1px solid var(--relic-border)",
            background: "var(--relic-card-bg)",
            color: "var(--relic-text-primary)",
            fontSize: 12,
            outline: "none",
          }}
        />
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gap: 4,
          maxHeight: 180,
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
                width: 32,
                height: 32,
                borderRadius: 8,
                border: selected
                  ? "1.5px solid color-mix(in srgb, var(--relic-accent) 50%, transparent)"
                  : "1px solid transparent",
                background: selected
                  ? "color-mix(in srgb, var(--relic-accent) 15%, transparent)"
                  : "transparent",
                color: selected
                  ? "var(--relic-accent)"
                  : "var(--relic-text-secondary)",
                cursor: "pointer",
                fontSize: 14,
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
              fontSize: 11,
              color: "var(--relic-text-muted)",
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
            fontSize: 9,
            color: "var(--relic-text-muted)",
            margin: "6px 0 0",
            textAlign: "center",
          }}
        >
          Scroll or type to search all icons
        </p>
      )}
    </div>
  );
}
