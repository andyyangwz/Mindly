const TUTORIAL_CONTENT = {

  // ─── HOME ───────────────────────────────────────

  "task-completed": {
    title: "Task Completion",
    tooltip: "How many of your planned tasks you've finished today",
    description:
      "Shows completed vs total active tasks for today. A task is counted as 'completed' when its status is set to Done. Active tasks include everything except ones already done before today starts.",
    steps: [
      {
        title: "What It Measures",
        text: "The numerator is how many tasks you marked as Done today. The denominator is all your active tasks — created tasks minus ones that were already Done before today.",
      },
      {
        title: "How to Improve",
        text: "Plan realistic daily task counts. Break large tasks into smaller ones to build momentum. Use the Productivity Calendar to schedule focused time blocks for each task.",
      },
    ],
  },

  "productivity-score": {
    title: "Productivity Score",
    tooltip: "Ratio of productive vs total tracked time today",
    description:
      "Your productivity score is the percentage of tracked time today that you spent on Productive activities vs Unproductive ones. Only activities marked with a productivity level count toward this score.",
    steps: [
      {
        title: "How It's Calculated",
        text: "The score = (productive minutes) ÷ (productive + unproductive minutes) × 100. Only activities with a productivity level set (Productive or Unproductive) are included — Neutral activities are skipped.",
      },
      {
        title: "What Counts as Productive",
        text: "When creating an activity, you can set its Productivity Level. Activities labeled 'Productive' add to the numerator; 'Unproductive' ones add to the denominator. The percentage shows your ratio of quality focused time.",
      },
      {
        title: "Keep in Mind",
        text: "Neutral activities (like lunch, commuting, breaks) don't affect the score. The goal isn't 100% — a balanced day with rest and focused work is healthy and sustainable.",
      },
    ],
  },

  // ─── HOME ───────────────────────────────────────

  "habit-relics": {
    title: "Habit Relics",
    tooltip: "Equip, track, and evolve your personal growth relics",
    description:
      "Equip meaningful growth relics that remind you of who you're becoming. Each relic tracks a daily habit you've committed to — update your progress and watch your streak grow.",
    steps: [
      {
        title: "Equipping Relics",
        text: "Choose relics that resonate with your current goals. Each slot represents a daily practice you're nurturing.",
      },
      {
        title: "Tracking Progress",
        text: "Log your progress each day. The streak counter builds momentum and gives you a visual sense of consistency.",
      },
      {
        title: "RPG Inspiration",
        text: "Think of relics as your character's equipped items. They shape who you are — one daily habit at a time.",
      },
    ],
  },

  "weekly-insights": {
    title: "Weekly Insights",
    tooltip: "AI reflections on your productivity and emotional patterns",
    description:
      "Weekly Insights analyze your productivity patterns, emotional trends, and journal reflections to give you meaningful perspective on your week.",
    steps: [
      {
        title: "AI-Powered Analysis",
        text: "The AI reviews your completed activities, tasks, and journal entries to identify patterns you might miss.",
      },
      {
        title: "Productivity Trends",
        text: "See how your energy flows across the week — which days you're most productive and what drains you.",
      },
      {
        title: "Reflection Prompts",
        text: "Each insight includes a gentle prompt to help you reflect and adjust your approach going forward.",
      },
    ],
  },

  "home-dashboard": {
    title: "Home Dashboard",
    tooltip: "Your personal command center for growth and productivity",
    description:
      "The Home Dashboard brings together your daily inspiration, quick actions, weekly overview, and habit relics in one calm, focused space.",
    steps: [
      {
        title: "Daily Inspiration",
        text: "Start each day with a meaningful prompt or reflection to set your intention.",
      },
      {
        title: "Quick Actions",
        text: "Jump into journaling, productivity planning, or a reflective AI conversation with one click.",
      },
    ],
  },

  // ─── JOURNALS ───────────────────────────────────

  "writing-assistant": {
    title: "AI Writing Assistant",
    tooltip: "Smoothen, format, or restructure your journal writing",
    description:
      "Three intelligent tools to refine your journal writing while preserving your voice and the editor's rich formatting.",
    steps: [
      {
        title: "Smoothen — Light Cleanup",
        text: "Gently removes filler words, stuttering, and speech noise. Preserves your exact wording and personality — just cleaner.",
      },
      {
        title: "Auto Format — Rich Structure",
        text: "Analyzes your content and applies real rich text formatting: headings for topic shifts, lists for sequential thoughts, and proper paragraph spacing. Your words stay exactly the same — only the structure improves.",
      },
      {
        title: "Restructure — Deep Refinement",
        text: "Rewrites your thoughts with deeper emotional clarity and flow. Preserves your intent and voice while making your writing more articulate.",
      },
    ],
  },

  "emoji-autofill": {
    title: "Emoji Auto Fill",
    tooltip: "Let AI suggest emotionally relevant emojis for your journal",
    description:
      "Click Auto Fill and the AI analyzes your entire journal — mood, tone, topic — then suggests three emotionally intelligent emojis to visually capture the vibe.",
    steps: [
      {
        title: "Emotional Understanding",
        text: "The AI reads beyond keywords — it understands the emotional atmosphere and chooses emojis that feel connected, not random.",
      },
      {
        title: "You're in Control",
        text: "Auto Fill never overwrites your choices. You can remove, replace, or keep the suggestions however you like.",
      },
    ],
  },

  "voice-journaling": {
    title: "Voice Journaling",
    tooltip: "Record your thoughts naturally, then enhance with AI",
    description:
      "Speak your journal instead of typing. Record, transcribe, then use the AI toolbar to smoothen, format, or restructure your spoken words.",
    steps: [
      {
        title: "Record",
        text: "Tap Record and speak naturally — like you're talking to a close friend.",
      },
      {
        title: "Transcribe",
        text: "Stop and tap Transcribe. Your speech becomes text, placed directly in the editor.",
      },
      {
        title: "Enhance",
        text: "Use Smoothen to clean up speech artifacts, Auto Format for structure, or Restructure for deeper clarity.",
      },
    ],
  },

  // ─── PRODUCTIVITY ──────────────────────────────

  "productivity-calendar": {
    title: "Productivity Calendar",
    tooltip: "Schedule activities, manage tasks, and organize your week",
    description:
      "A visual week calendar where you can plan time-blocked activities, set deadline-driven tasks, and adjust everything with drag-and-drop.",
    steps: [
      {
        title: "Week View & Navigation",
        text: "The calendar shows one day at a time in a vertical 24-hour timeline. Use the day picker row at the top to jump between days, the left/right arrows to move week-by-week, or click the month name to pick any month. The 'Today' button returns you to the current day.",
      },
      {
        title: "Activity vs Task — What's the Difference?",
        text: "An Activity is a time-blocked event with a start and end time — like 'Gym 9–10 AM'. You can resize it by dragging its edges. A Task has a deadline — like 'Assignment due Friday'. It shows a start block on your schedule plus a deadline marker on the due date. Tasks cannot be resized (fixed 1-hour duration).",
      },
      {
        title: "Adding an Activity",
        text: "Click the '+ Add' button in the top-right and select 'Activity', or right-click any empty time slot and choose 'Activity'. You can also double-click an empty spot on the grid and type inline — no modal needed. Set the title, time range, priority, and color.",
      },
      {
        title: "Adding a Task",
        text: "Click '+ Add' > 'Task', or right-click empty space > 'Task'. Give it a name, start date/time, and deadline date/time. The deadline marker automatically appears on the due date so you can see upcoming deadlines at a glance.",
      },
      {
        title: "Move & Resize Activities",
        text: "Double-click and hold any activity block, then drag up or down to move it to a different time. To resize, hover over the top or bottom edge until you see the resize handle, then drag to change duration. A live tooltip shows the current time as you drag.",
      },
      {
        title: "Edit, Change Status, or Delete",
        text: "Right-click any block and choose 'View Details' to see full info, edit, or delete it. From the right-click menu you can also quickly change its status to To Do, In Progress, or Done without opening the modal.",
      },
      {
        title: "Undo & Redo",
        text: "Use the undo (↩) and redo (↪) buttons in the top toolbar to reverse or reapply any action — creating, deleting, moving, resizing, or editing. Handy when you accidentally move or delete an event.",
      },
      {
        title: "Voice Scheduling",
        text: "Click '+ Add' > 'Use Voice' or right-click > 'Use Voice'. Record your plan naturally — say 'Gym tomorrow at 7 PM' or 'Database assignment due Friday' — and the AI autofills the form. Review and submit.",
      },
      {
        title: "Today's Plan & Task Sidebar",
        text: "Below the calendar, 'Today's Plan' lists your scheduled activities for the day. The 'Tasks' tab shows all deadline tasks grouped by status — To Do, In Progress, and Done. Quickly toggle status with the circle buttons.",
      },
    ],
  },

  "smart-suggestions": {
    title: "Smart Suggestions",
    tooltip: "AI-powered recommendations to optimize your productivity",
    description:
      "Smart Suggestions analyze your calendar, task load, and energy patterns to recommend meaningful adjustments to your week.",
    steps: [
      {
        title: "Intelligent Recommendations",
        text: "The AI identifies opportunities — like rescheduling low-energy tasks to your peak hours or breaking down large tasks.",
      },
      {
        title: "Productivity Guidance",
        text: "Get insights about your productivity patterns, such as which times of day you're most effective.",
      },
    ],
  },

  "voice-scheduling": {
    title: "Voice Scheduling",
    tooltip: "Speak your plan — AI fills the form automatically",
    description:
      "Use your voice to create activities and tasks. Speak naturally, and the AI intelligently fills the form — you review and submit.",
    steps: [
      {
        title: "Speak Your Plan",
        text: "Say something like 'Gym tomorrow at 7 PM' or 'Database assignment due Friday'. The AI understands dates, times, and types.",
      },
      {
        title: "Review Before Saving",
        text: "The AI never writes to your calendar directly. You always review the pre-filled form and make adjustments before submitting.",
      },
    ],
  },

  "right-click-calendar": {
    title: "Right-Click Calendar",
    tooltip: "Quick actions for faster planning",
    description:
      "Right-click anywhere on the calendar to add activities, create tasks, or open voice scheduling — all without leaving your view.",
    steps: [
      {
        title: "Context Menu",
        text: "Right-click a time slot or date to open a context menu with quick options for that specific moment.",
      },
      {
        title: "Quick Add",
        text: "Add an activity or task directly at the clicked time — the form auto-fills with the selected date and time.",
      },
    ],
  },

  // ─── SPILL AI ──────────────────────────────────

  "ai-personalities": {
    title: "Spill AI Personalities",
    tooltip: "Choose how your AI companion responds to you",
    description:
      "Switch between three distinct AI personalities — each designed for a different kind of conversation.",
    steps: [
      {
        title: "Empathic Listener",
        text: "A warm, understanding presence. Best when you need to be heard without judgment.",
      },
      {
        title: "Problem Solver",
        text: "Clear, logical, and solution-oriented. Helps you untangle complex situations.",
      },
      {
        title: "Motivational Coach",
        text: "Energetic, encouraging, and direct. Perfect when you need a push forward.",
      },
    ],
  },

  "forward-journal": {
    title: "Forward Journal",
    tooltip: "Bring your journal entries into a reflective AI conversation",
    description:
      "Select a previous journal entry and forward it into your Spill AI conversation. The AI reads your entry and uses it as context for a deeper reflective discussion.",
    steps: [
      {
        title: "Select a Journal",
        text: "Click the Forward Journal button and choose an entry from your journal list.",
      },
      {
        title: "Reflective Discussion",
        text: "The AI understands your journal context and can help you explore, unpack, or reflect on what you wrote.",
      },
    ],
  },

  "voice-input-spill": {
    title: "Voice Input",
    tooltip: "Speak your thoughts naturally to the AI",
    description:
      "Use voice input to speak your messages to Spill AI instead of typing. Your speech is transcribed and sent as your message.",
    steps: [
      {
        title: "Speak Naturally",
        text: "Just talk like you're having a conversation. The AI will receive your transcribed message and respond.",
      },
      {
        title: "Seamless Flow",
        text: "Continue the conversation naturally — voice and typing work together seamlessly.",
      },
    ],
  },
}

export default TUTORIAL_CONTENT
