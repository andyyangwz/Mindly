import excitedHi from "../../assets/mascot_images/excited_hi.png"
import meditate from "../../assets/mascot_images/meditate.png"
import questioning from "../../assets/mascot_images/questioning.png"
import learning from "../../assets/mascot_images/learning.png"

const TUTORIAL_MASCOTS = {
  "task-completed": excitedHi,
  "productivity-score": questioning,
  "habit-relics": excitedHi,
  "weekly-insights": questioning,
  "home-dashboard": excitedHi,
  "writing-assistant": learning,
  "emoji-autofill": learning,
  "voice-journaling": learning,
  "productivity-calendar": learning,
  "smart-suggestions": questioning,
  "voice-scheduling": learning,
  "right-click-calendar": learning,
  "ai-personalities": meditate,
  "forward-journal": meditate,
  "voice-input-spill": learning,
  "relic-archive": learning,
  "weekly-overview": learning,
  "update-progress": learning,
}

export function getTutorialMascot(tutorialId) {
  return TUTORIAL_MASCOTS[tutorialId] || learning
}
