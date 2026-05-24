export const EMOJI_CATEGORIES = [
  {
    name: "Moods & Feelings",
    keywords: ["mood", "feelings", "happy", "sad", "angry", "emotion"],
    emojis: [
      "😊", "😌", "🥰", "😢", "😭", "😤", "😡", "🥳", "😎", "🤩",
      "😴", "🥱", "🤔", "😰", "😨", "🤯", "😇", "🤗", "🙃", "😏",
      "😅", "😂", "🤣", "🙂", "😘", "😍", "🥺", "😣", "😖", "😩",
      "🥲", "🫠", "😶", "😐",
    ],
  },
  {
    name: "Nature & Weather",
    keywords: ["nature", "weather", "outdoor", "plant", "flower", "tree", "sun", "rain"],
    emojis: [
      "🌸", "🌺", "🌻", "🌷", "🌹", "🍃", "🌿", "🌱", "🍄", "🌙",
      "☀️", "⭐", "🌈", "🌊", "🔥", "❄️", "☁️", "🌧️", "⛅", "🌳",
      "🌵", "🌴", "🍁", "🌾", "🌤️", "💫",
    ],
  },
  {
    name: "Activities & Goals",
    keywords: ["activity", "goal", "workout", "music", "travel", "celebration", "sport"],
    emojis: [
      "📚", "✍️", "🎨", "🎵", "🎸", "🎧", "🏃", "🎯", "🚀", "💪",
      "🎉", "🎊", "✨", "🎭", "📸", "🎮", "🏋️", "🧘", "📖", "🎤",
      "🧠", "🎶", "🏆", "🎹", "🎲", "🧩",
    ],
  },
  {
    name: "Food & Drink",
    keywords: ["food", "drink", "coffee", "tea", "meal", "cooking", "snack"],
    emojis: [
      "☕", "🍵", "🍺", "🥂", "🍕", "🍜", "🥗", "🍰", "🍩", "🍪",
      "🥑", "🍓", "🍋", "🧋", "🍝", "🥤", "🍫", "🍿", "🥨", "🧁",
      "🥃", "🍷",
    ],
  },
  {
    name: "Objects & Symbols",
    keywords: ["object", "tool", "tech", "gift", "light", "key", "time", "book"],
    emojis: [
      "💡", "📝", "📌", "⭐", "💎", "🔮", "🎁", "💻", "📱", "🕯️",
      "🔑", "💭", "🖼️", "⏰", "📅", "🔋", "🧲", "🎀", "🧸", "📎",
      "✉️", "🗝️",
    ],
  },
  {
    name: "Love & Hearts",
    keywords: ["love", "heart", "romance", "care", "affection"],
    emojis: [
      "❤️", "💜", "💙", "💚", "💛", "🧡", "🤍", "🖤", "💕", "💗",
      "💖", "💘", "💝", "🩷", "❤️‍🔥", "❣️", "💞", "💓",
    ],
  },
]

export function getAllEmojis() {
  return EMOJI_CATEGORIES.flatMap((cat) => cat.emojis)
}
