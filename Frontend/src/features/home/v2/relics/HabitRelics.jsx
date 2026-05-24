import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Target, Plus, ArrowUp, Settings } from "lucide-react";
import { useHabitRelics } from "../../hooks/useHabitRelics";
import { resolveIcon } from "../../components/IconPicker";
import EquippedLoadout from "./EquippedLoadout";
import InventoryBar from "./InventoryBar";
import CreateRelicModal from "./CreateRelicModal";
import EditRelicModal from "./EditRelicModal";
import RelicManagerModal from "./RelicManagerModal";
import UpdateProgressModal from "./UpdateProgressModal";

const circ = 2 * Math.PI * 18;

export default function HabitRelics() {
  const { t } = useTranslation();
  const { relics, loading, error, createRelic, updateRelic, deleteRelic, equipRelic, unequipRelic } = useHabitRelics();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelic, setEditingRelic] = useState(null);
  const [relicManagerOpen, setRelicManagerOpen] = useState(false);
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);

  const equipped = useMemo(
    () => relics.filter((g) => g.is_equipped).sort((a, b) => (a.equipped_order ?? 99) - (b.equipped_order ?? 99)),
    [relics]
  );

  const inventory = useMemo(() => relics.filter((g) => !g.is_equipped), [relics]);

  const handleCreated = async (data) => {
    await createRelic(data);
    setModalOpen(false);
    setRelicManagerOpen(true);
  };

  if (loading) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.04)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(108,71,255,0.15)" }} />
          <div>
            <div style={{ width: 100, height: 12, borderRadius: 4, background: "rgba(255,255,255,0.04)" }} />
            <div style={{ width: 140, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.02)", marginTop: 4 }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 12, background: "rgba(255,255,255,0.02)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: "rgba(239,68,68,0.04)", borderRadius: 18,
        border: "1px solid rgba(239,68,68,0.08)",
        padding: "20px", textAlign: "center", fontSize: 12, color: "#EF4444",
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.04)",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(108,71,255,0.25), rgba(108,71,255,0.05))",
            border: "1px solid rgba(108,71,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Target size={15} color="rgba(200,190,240,0.8)" />
          </div>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "rgba(232,230,240,0.85)", margin: 0 }}>
              {t("home.habitRelics.title")}
            </h2>
            <p style={{ fontSize: 11, color: "rgba(154,148,184,0.5)", margin: "1px 0 0" }}>
              {t("home.habitRelics.subtitle")}
            </p>
          </div>
        </div>

        {/* Master badge */}
        {equipped.length > 0 && (
          <div style={{
            padding: "4px 10px", borderRadius: 20,
            background: "rgba(108,71,255,0.08)",
            border: "1px solid rgba(108,71,255,0.06)",
          }}>
            <span style={{ fontSize: 10, color: "rgba(200,190,240,0.6)", fontStyle: "italic", fontWeight: 500 }}>
              Relic Master
            </span>
          </div>
        )}
      </div>

      {/* Equipped Loadout */}
      {relics.length > 0 && equipped.length > 0 && (
        <EquippedLoadout
          equipped={equipped}
          dragOverSlot={null}
          animating={false}
          onSlotDragEnter={() => {}}
          onSlotDragLeave={() => {}}
          onSlotDrop={() => {}}
          onCardDragStart={() => {}}
          onCardDragEnd={() => {}}
          onCardClick={(g) => setEditingRelic(g)}
          t={t}
        />
      )}

      {/* Empty state */}
      {relics.length === 0 && (
        <div style={{
          padding: "24px 0",
          textAlign: "center",
          fontSize: 12,
          color: "rgba(154,148,184,0.4)",
          borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.04)",
        }}>
          No relics yet — tap + to forge a new one
        </div>
      )}

      {relics.length > 0 && equipped.length === 0 && (
        <div style={{
          padding: "18px 0",
          textAlign: "center",
          fontSize: 12,
          color: "rgba(154,148,184,0.4)",
          borderRadius: 12,
          border: "1px dashed rgba(255,255,255,0.04)",
        }}>
          No relics equipped — open Manage Relics to equip
        </div>
      )}

      {/* Inventory summary */}
      {inventory.length > 0 && (
        <div style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.03)",
          padding: "12px",
          background: "rgba(255,255,255,0.01)",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.4)",
            marginBottom: 10, letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            Inventory ({inventory.length})
          </div>
          <div style={{
            display: "flex", gap: 8, overflowX: "auto",
            scrollbarWidth: "none",
          }}>
            {inventory.map((relic) => {
              const Icon = resolveIcon(relic.icon);
              const pct = relic.target > 0
                ? Math.min(Math.round((relic.current_progress / relic.target) * 100), 100)
                : 0;
              return (
                <div
                  key={relic.id}
                  onClick={() => setEditingRelic(relic)}
                  style={{
                    flexShrink: 0,
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.03)",
                    background: "rgba(255,255,255,0.02)",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    minWidth: 0,
                  }}
                >
                  <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
                    <svg width={28} height={28} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                      <circle cx={14} cy={14} r={10} stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" fill="none" />
                      <circle cx={14} cy={14} r={10} stroke="#6C47FF" strokeWidth="2.5" fill="none" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 10}`} strokeDashoffset={2 * Math.PI * 10 * (1 - pct / 100)}
                        style={{ transition: "stroke-dashoffset 0.6s" }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={10} color="#6C47FF" />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(232,230,240,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 80 }}>
                      {relic.title}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(154,148,184,0.35)", marginTop: 1 }}>
                      {relic.current_progress}/{relic.target}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <motion.button
          onClick={() => setRelicManagerOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "8px 16px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            color: "rgba(154,148,184,0.6)",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <Settings size={13} />
          Manage
        </motion.button>

        <motion.button
          onClick={() => setModalOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            width: 34, height: 34, borderRadius: "50%",
            border: "1.5px dashed rgba(108,71,255,0.2)",
            background: "rgba(108,71,255,0.04)",
            color: "#6C47FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16, flexShrink: 0,
          }}
        >
          <Plus size={16} />
        </motion.button>

        <motion.button
          onClick={() => setUpdateProgressOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "8px 16px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
            color: "rgba(154,148,184,0.6)",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <ArrowUp size={13} />
          Upgrade
        </motion.button>
      </div>

      {/* Modals */}
      <CreateRelicModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditRelicModal
        relic={editingRelic}
        onClose={() => setEditingRelic(null)}
        onUpdated={updateRelic}
        onDeleted={deleteRelic}
      />

      <RelicManagerModal
        open={relicManagerOpen}
        onClose={() => setRelicManagerOpen(false)}
        relics={relics}
        onEquip={equipRelic}
        onUnequip={unequipRelic}
      />

      <UpdateProgressModal
        open={updateProgressOpen}
        onClose={() => setUpdateProgressOpen(false)}
        relics={relics}
        onUpdate={updateRelic}
      />
    </div>
  );
}
