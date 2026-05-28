import { theme } from "../theme";

export const insightData = {
  weekly: [
    { day: "Mon", studyTime: 4.5, productivity: 75, focus: 85 },
    { day: "Tue", studyTime: 6, productivity: 82, focus: 90 },
    { day: "Wed", studyTime: 5.5, productivity: 78, focus: 88 },
    { day: "Thu", studyTime: 7, productivity: 88, focus: 92 },
    { day: "Fri", studyTime: 4, productivity: 70, focus: 75 },
    { day: "Sat", studyTime: 3, productivity: 65, focus: 70 },
    { day: "Sun", studyTime: 5, productivity: 80, focus: 82 },
  ],
  monthly: [
    { day: "Wk1", studyTime: 28, productivity: 72, focus: 78 },
    { day: "Wk2", studyTime: 32, productivity: 78, focus: 85 },
    { day: "Wk3", studyTime: 30, productivity: 75, focus: 80 },
    { day: "Wk4", studyTime: 35, productivity: 85, focus: 88 },
  ],
};

export const timeDistData = [
  { name: "Studying", value: 42, color: theme.primary },
  { name: "Social", value: 18, color: theme.secondary },
  { name: "Entertainment", value: 22, color: theme.accent },
  { name: "Rest", value: 18, color: "#F59E0B" },
];
