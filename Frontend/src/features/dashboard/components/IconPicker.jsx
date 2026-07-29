import { useState, useMemo } from "react";
import * as FaIcons from "react-icons/fa";
import * as MdIcons from "react-icons/md";
import * as IoIcons from "react-icons/io5";
import * as HiIcons from "react-icons/hi";
import * as GiIcons from "react-icons/gi";
import * as BiIcons from "react-icons/bi";
import * as TbIcons from "react-icons/tb";
import * as RiIcons from "react-icons/ri";
import "../../../styles/dashboard/index.css"

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

// eslint-disable-next-line react-refresh/only-export-components
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
      <div className="ip-search-wrap">
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="ip-search"
        />
      </div>
      <div className="ip-grid">
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
              className={`ip-btn ${selected ? "ip-btn-selected" : "ip-btn-default"}`}
            >
              <IconComponent />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <span className="ip-empty">No icons found</span>
        )}
      </div>
      {!search && (
        <p className="ip-hint">Scroll or type to search all icons</p>
      )}
    </div>
  );
}
