import empathic from "../../assets/mascot_images/empathic.jpg"
import solver from "../../assets/mascot_images/solver.jpg"
import motivational from "../../assets/mascot_images/motivational.jpg"

export const PERSONALITY_AVATARS = {
  empathetic: empathic,
  problem_solver: solver,
  motivational: motivational,
}

export function getPersonalityAvatar(personality) {
  return PERSONALITY_AVATARS[personality] || PERSONALITY_AVATARS.empathetic
}
