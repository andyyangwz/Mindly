import excitedHi from "../../assets/mascot_images/excited_hi.png"
import meditate from "../../assets/mascot_images/meditate.png"
import questioning from "../../assets/mascot_images/questioning.png"
import learning from "../../assets/mascot_images/learning.png"

const TUTORIAL_MASCOTS = {
  "task-completed": excitedHi,
  "scheduling-score": questioning,
  "progress-tracker": excitedHi,
  "progress-tracker-onboarding": excitedHi,
  "weekly-insights": questioning,
  "dashboard-page": excitedHi,
  "writing-assistant": learning,
  "emoji-autofill": learning,
  "voice-journaling": learning,
  "scheduling-calendar": learning,
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
