const VARIANTS = {
  normal: {
    label: "Activity (time block)",
    background: (color) => `${color}20`,
    borderLeft: (color) => `3px solid ${color}`,
    border: (color) => `1px solid ${color}12`,
    titleColor: (color) => color,
    hoverBackground: (color) => `${color}30`,
    hoverShadow: (color) => `0 2px 10px ${color}40, 0 1px 3px rgba(0,0,0,0.08)`,
  },

  deadlineTask: {
    label: "Task (with deadline)",
    background: (color) => `${color}0A`,
    borderLeft: (color) => `3px solid ${color}`,
    border: (color) => `1.5px dashed ${color}40`,
    titleColor: (color) => color,
    hoverBackground: (color) => `${color}18`,
    hoverShadow: (color) => `0 2px 10px ${color}35, 0 1px 3px rgba(0,0,0,0.06)`,
  },

}

export function getVariant(event) {
  if (event.hasDeadline) return "deadlineTask"
  return "normal"
}

export function getActivityStyles(event) {
  const variantKey = getVariant(event)
  const variant = VARIANTS[variantKey]
  const color = event.color || "#7C3AED"
  return {
    variantKey,
    variant,
    color,
    style: {
      background: variant.background(color),
      borderLeft: variant.borderLeft(color),
      border: variant.border(color),
    },
    hover: {
      background: variant.hoverBackground(color),
      boxShadow: variant.hoverShadow(color),
    },
    leave: {
      background: variant.background(color),
      boxShadow: "none",
    },
    titleColor: variant.titleColor(color),
  }
}
