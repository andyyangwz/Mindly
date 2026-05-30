const TUTORIAL_CONTENT = {

  // ─── HOME ───────────────────────────────────────

  "task-completed": {
    title: "Task Completion",
    tooltip: "Completed vs total tasks for today",
    description:
      "Shows your task completion ratio for today — how many tasks you've marked Done out of your total tasks scheduled. If no tasks exist for today, it shows 'No On Going Task'.",
    steps: [
      {
        title: "What It Shows",
        text: "The card displays a ratio like '3/5' — 3 tasks completed out of 5 total for today. It counts all tasks on your schedule, whether they're time-blocked activities or deadline-based tasks.",
      },
      {
        title: "Improving Your Rate",
        text: "Break large tasks into smaller, manageable steps. Use the Productivity Calendar to schedule focused time blocks. Set realistic daily targets to build momentum over time.",
      },
    ],
  },

  "productivity-score": {
    title: "Productivity Score",
    tooltip: "Calculated from today's activities — shows Unknown if none are tracked",
    description:
      "Your productivity score measures how focused your tracked time was today. It's the percentage of time spent on Productive vs Unproductive activities, based on the productivity level you assign.",
    steps: [
      {
        title: "How It's Calculated",
        text: "Score = (productive minutes) ÷ (productive + unproductive minutes) × 100. Only activities with a Productivity Level set (Productive or Unproductive) are counted — Neutral activities are skipped entirely.",
      },
      {
        title: "Setting Productivity Levels",
        text: "When creating or editing an activity, set its Productivity Level. 'Productive' adds to the numerator; 'Unproductive' adds to the denominator. The percentage reflects your ratio of focused time.",
      },
      {
        title: "Keep in Mind",
        text: "Neutral activities like lunch, commuting, or breaks don't affect the score. A healthy day balances focused work with rest — 100% isn't the goal.",
      },
    ],
  },

  // ─── HOME ───────────────────────────────────────

  "habit-relics": {
    title: "Habit Relics",
    tooltip: "Equip, track, and evolve your personal growth relics",
    description:
      "Equip up to three Habit Relics — each one tracks a daily habit you've committed to. See your progress at a glance with progress rings, status badges, and streak counters.",
    steps: [
      {
        title: "Equipped Relics",
        text: "Your active loadout shows up to three relics with a circular progress ring, current count vs target, and a status badge (In Progress, Almost Done, Achieved, or On Fire). Double-click any card to edit its name, icon, or targets.",
      },
      {
        title: "Managing Relics",
        text: "Use the 'Change Relics' button to open the Relic Manager, where you can equip, unequip, and organize your relics via drag-and-drop. The '+' button creates a new relic from scratch.",
      },
      {
        title: "Tracking Progress",
        text: "Click 'Update Progress' to open the progress modal. Select a relic, enter how many units to add, then click 'Channel Energy' to commit. The progress ring and status badge update automatically.",
      },
    ],
  },

  "habit-relics-onboarding": {
    title: "Habit Relic Tutorial",
    tooltip: "A guided tour through relics — from equipping to tracking progress",
    description:
      "A step-by-step walkthrough of the Habit Relic system — what they are, how to manage them via drag-and-drop, and how to track your daily progress.",
    steps: [
      {
        targetId: "habit-relics",
        title: "What Are Habit Relics?",
        text: "Habit Relics are your personal growth companions. Each one tracks a daily habit you've committed to. Equip up to three relics to your active loadout, update your progress daily, and watch your consistency grow.",
      },
      {
        targetId: "habit-relics-equipped",
        title: "Your Equipped Relics",
        text: "This is your active loadout — up to three relics you're currently nurturing. Each card shows a progress ring, icon, current count vs target, and a status badge. Double-click any card to edit its properties.",
      },
      {
        targetId: "habit-relics-actions",
        title: "Actions & Inventory",
        text: "'Change Relics' opens the Relic Manager where you can equip/unequip using drag-and-drop. '+' creates a new relic. 'Update Progress' lets you add daily progress to any relic.",
      },
      {
        targetId: "relic-manager-modal",
        title: "The Relic Manager",
        text: "The Relic Manager shows your Archive on the left and a Constellation on the right. Drag relics from the Archive onto one of the three orbital nodes to equip them. Drag an equipped relic back to the Archive to unequip it.",
        spotlightOffsetY: -27,
      },
      {
        targetId: "relic-archive",
        title: "The Relic Archive",
        text: "Your unequipped relics live here. Use the search bar to find specific relics, or sort by Name, Progress, or Created date. Drag a relic from here onto a Constellation node on the right to equip it.",
      },
      {
        targetId: "update-progress",
        title: "Update Progress",
        text: "The Update Progress screen lets you add daily progress to any relic. Select a relic from the roster on the left, enter the amount to add, then click 'Channel Energy' to commit.",
        spotlightOffsetY: -27,
      },
      {
        targetId: "upgrade-roster",
        title: "The Relic Roster",
        text: "All your relics are listed here — equipped ones appear first, then the rest. Click any relic to select it, then use the controls on the right to add progress, reset it, or delete the relic permanently.",
      },
      {
        targetId: "update-progress-controls",
        title: "Adding & Resetting Progress",
        text: "With a relic selected, enter a number in the input field to add progress. Use the Reset button to zero out its progress, or the Delete button to remove the relic entirely. Click 'Channel Energy' to commit all pending changes at once. A count-up animation plays as the progress updates.",
      },
    ],
  },

  "weekly-insights": {
    title: "Weekly Overview",
    tooltip: "Review your productive hours and task completions for the week",
    description:
      "The Weekly Overview shows your productive hours, completed tasks, and daily trends for the current week in a bar chart and stats summary.",
    steps: [
      {
        title: "Bar Chart",
        text: "Each bar represents one day's total productive hours. Today's bar is highlighted with a glow effect. Future days appear dimmed. Hover or check the label below each bar to see the exact hours.",
      },
      {
        title: "Stats Summary",
        text: "Total Hours sums all productive time this week. Tasks Done shows how many tasks you completed. Average Day is your mean productive hours per day — a handy consistency benchmark.",
      },
      {
        title: "Navigating Weeks",
        text: "Use the left and right arrows next to the date range to view past or future weeks. This lets you compare performance and spot trends over time.",
      },
    ],
  },

  "home-dashboard": {
    title: "Home Dashboard",
    tooltip: "Your personal command center for growth and productivity",
    description:
      "The Home Dashboard brings together daily inspiration, quick actions, your weekly overview, and habit relics in one focused space.",
    steps: [
      {
        title: "Daily Inspiration",
        text: "Start each day with a meaningful quote to set your intention. The greeting at the top shows your name and the current date.",
      },
      {
        title: "Quick Actions",
        text: "Jump straight into journaling, adding an activity or task to your calendar, or starting a Spill AI conversation — all with one click from the quick action row.",
      },
    ],
  },

  // ─── JOURNALS ───────────────────────────────────

  "writing-assistant": {
    title: "AI Writing Assistant",
    tooltip: "Smoothen, format, or restructure your journal writing",
    description:
      "Three AI tools to refine your journal writing. Select any text in the editor, then choose Smoothen, Auto Format, or Restructure to transform it while preserving your voice.",
    steps: [
      {
        title: "Smoothen — Light Cleanup",
        text: "Select text and click Smoothen to gently remove filler words, stuttering, and speech noise. Your exact wording and personality are preserved — just cleaner and more fluid.",
      },
      {
        title: "Auto Format — Grammar & Structure",
        text: "Select text and click Auto Format to fix grammar, punctuation, and sentence flow. The AI reformats your writing into clear, well-structured paragraphs.",
      },
      {
        title: "Restructure — Deep Refinement",
        text: "Select text and click Restructure to reorganize your thoughts with deeper clarity. Headings, lists, and paragraph breaks are applied intelligently. Your voice and intent stay intact.",
      },
    ],
  },

  "emoji-autofill": {
    title: "Emoji Auto Fill",
    tooltip: "Let AI suggest emotionally relevant emojis for your journal",
    description:
      "Click Auto Fill and the AI reads your journal content — mood, tone, and topic — then suggests three emotionally intelligent emojis that match the vibe.",
    steps: [
      {
        title: "How It Works",
        text: "The AI analyzes your writing beyond keywords — it understands the emotional atmosphere and picks emojis that feel connected, not random. Suggestions pop in with a smooth animation.",
      },
      {
        title: "You're in Control",
        text: "Auto Fill never overwrites your choices. You can remove, replace, or keep the suggestions however you like. Click any emoji slot to pick a different one from the full emoji library.",
      },
    ],
  },

  "voice-journaling": {
    title: "Voice Journaling",
    tooltip: "Record your thoughts naturally, then enhance with AI",
    description:
      "Speak your journal instead of typing. Record your voice, transcribe it to text, then use the AI writing tools to smoothen, format, or restructure your spoken words.",
    steps: [
      {
        title: "Record",
        text: "Click the Record button and speak naturally — like you're talking to a close friend. A waveform animates as you speak, and a timer shows your recording duration.",
      },
      {
        title: "Transcribe",
        text: "When you're done, click Stop, then Transcribe. Your speech is converted to text and inserted directly into the editor. You can also record again if you want to redo it.",
      },
      {
        title: "Enhance",
        text: "After transcription, select any part of the text and use Smoothen to clean up speech artifacts, Auto Format for proper structure, or Restructure for deeper clarity and organization.",
      },
    ],
  },

  // ─── PRODUCTIVITY ──────────────────────────────

  "productivity-calendar": {
    title: "Productivity Calendar",
    tooltip: "Schedule activities, manage tasks, and organize your day",
    description:
      "A visual daily calendar where you can plan time-blocked activities, set deadline-driven tasks, and adjust everything with drag-and-drop or right-click actions.",
    steps: [
      {
        targetId: "productivity-calendar",
        title: "Day View & Navigation",
        text: "The calendar shows one day at a time in a vertical 24-hour timeline. Use the day picker row at the top to jump between days, click the month name to pick any month, or use the left/right arrows to move week-by-week. The 'Today' button returns you to the current date.",
      },
      {
        targetId: "add-activity-btn",
        title: "Adding an Activity or Task",
        text: "Click the '+ Add' button and select 'Activity' for a time-blocked event or 'Task' for a deadline-driven item. You can also double-click any empty slot on the grid to type inline, or right-click an empty slot and choose from the context menu.",
      },
      {
        targetId: "add-menu-options",
        title: "Activity vs Task — What's the Difference?",
        text: "An Activity is a time-blocked event with a start and end time — like 'Gym 9–10 AM'. You can resize it by dragging its edges. A Task has a deadline — like 'Assignment due Friday'. It shows a start marker on your schedule plus a deadline marker on the due date. Tasks cannot be resized.",
      },
      {
        targetId: "voice-option",
        title: "Activity/Task Insertion by Voice",
        text: "Click '+ Add' > 'Use Voice' or right-click > 'Use Voice'. Record your plan naturally — say 'Gym tomorrow at 7 PM' or 'Database assignment due Friday' — and the AI autofills the form. Review the details and submit.",
      },
      {
        targetId: "mode-toggle",
        title: "Fixed vs Reschedule Mode",
        text: "Toggle between 'Fixed' mode (blocks stay where you put them) and 'Reschedule' mode (drag freely to rearrange). Press CTRL+K to switch modes quickly. The toggle button lights up in Reschedule mode.",
      },
      {
        targetId: "demo-activity-block",
        title: "Move and Resize Activity",
        text: "In Reschedule mode, click and drag any activity block up or down to move it to a different time. To resize, hover over the top or bottom edge until you see the resize handle, then drag to change the duration. A live tooltip shows the current time as you drag.",
      },
      {
        targetId: "demo-activity-block",
        title: "Edit, Change Status, and Delete",
        text: "Right-click any block to open the context menu. Choose 'View Details' to see full info, edit, or delete the activity. You can also quickly change its status from the right-click menu or by clicking the status badge on the block itself.",
      },
      {
        targetId: "undo-redo",
        title: "Undo & Redo",
        text: "Use the undo (↩) and redo (↪) buttons in the top toolbar to reverse or reapply actions — creating, deleting, moving, resizing, or editing events. Handy when you accidentally move or delete an activity.",
      },
      {
        targetId: "sync-btn",
        title: "Auto Sync",
        text: "Click the 'Auto Sync' button to synchronize your calendar with external task sources. A sweep animation crosses the timeline while activities are fetched and merged. The icon spins during syncing — no page refresh needed.",
      },
    ],
  },

  "smart-suggestions": {
    title: "Smart Suggestions",
    tooltip: "AI-powered recommendations to optimize your productivity",
    description:
      "Smart Suggestions analyze your calendar and task load to recommend meaningful adjustments and productivity improvements for your day.",
    steps: [
      {
        title: "Intelligent Recommendations",
        text: "The AI identifies opportunities to improve your schedule — like rescheduling low-energy tasks to your peak hours or balancing your workload across the day.",
      },
      {
        title: "Productivity Guidance",
        text: "Get insights about your work patterns, such as which times of day you're most effective, and actionable tips to build better productivity habits.",
      },
    ],
  },

  "voice-scheduling": {
    title: "Voice Scheduling",
    tooltip: "Speak your plan — AI fills the form automatically",
    description:
      "Use your voice to create activities and tasks. Speak naturally, and the AI intelligently fills the form. You always review and confirm before anything is saved.",
    steps: [
      {
        title: "Speak Your Plan",
        text: "Open the voice recorder from the '+ Add' menu or right-click menu. Say something like 'Gym tomorrow at 7 PM' or 'Database assignment due Friday'. The AI understands dates, times, and event types.",
      },
      {
        title: "Review Before Saving",
        text: "The AI never writes to your calendar directly. After transcription, you see the pre-filled form with your spoken details extracted. Make any adjustments, then submit to create the event.",
      },
    ],
  },

  "right-click-calendar": {
    title: "Right-Click Calendar",
    tooltip: "Quick actions for faster planning",
    description:
      "Right-click anywhere on the calendar to access context-sensitive actions — add activities from empty slots, or edit and delete existing blocks.",
    steps: [
      {
        title: "Right-Click on Empty Space",
        text: "Right-click any empty time slot to add an Activity, Task, or open Voice Scheduling. The date and time are pre-filled based on where you clicked.",
      },
      {
        title: "Right-Click on an Activity Block",
        text: "Right-click an existing activity block to edit it, change its status (To Do / In Progress / Done), or delete it. You can also view full details in the detail modal.",
      },
    ],
  },

  // ─── SPILL AI ──────────────────────────────────

  "ai-personalities": {
    title: "Spill AI Personalities",
    tooltip: "Choose how your AI companion responds to you",
    description:
      "Switch between three distinct AI personalities — each designed for a different kind of conversation. The personality affects the AI's tone, style, and avatar.",
    steps: [
      {
        title: "Empathic",
        text: "A warm, understanding presence with a heart-centered tone. Best when you need to be heard without judgment or advice.",
      },
      {
        title: "Problem Solver",
        text: "Clear, logical, and solution-oriented with a lightbulb icon. Helps you untangle complex situations step by step.",
      },
      {
        title: "Motivational Coach",
        text: "Energetic, encouraging, and direct with a trophy icon. Perfect when you need a push forward or a confidence boost.",
      },
    ],
  },

  "forward-journal": {
    title: "Forward Journal",
    tooltip: "Bring your journal entries into a reflective AI conversation",
    description:
      "Select a previous journal entry and forward it into your Spill AI conversation. The AI uses it as context for a deeper reflective discussion.",
    steps: [
      {
        title: "Select a Journal",
        text: "Click the Forward Journal button (book icon) above the message input. A popover shows your recent journals — pick one to forward.",
      },
      {
        title: "Reflective Discussion",
        text: "The forwarded journal appears as a preview card above the input. The AI reads it and uses the context to explore, unpack, or reflect on what you wrote.",
      },
    ],
  },

  "voice-input-spill": {
    title: "Voice Input",
    tooltip: "Speak your thoughts naturally to the AI",
    description:
      "Use voice input to speak your messages to Spill AI instead of typing. Your speech is transcribed and sent as your message automatically.",
    steps: [
      {
        title: "Recording Your Message",
        text: "Click the microphone button next to the text input. Speak naturally — a waveform animates and a timer shows your recording duration. Click Stop when done.",
      },
      {
        title: "Seamless Flow",
        text: "The transcribed text is placed into the message input automatically. Review it, edit if needed, then send. Voice and typing work together seamlessly within the same conversation.",
      },
    ],
  },

  // ─── RELIC MANAGER ─────────────────────────────

  "relic-archive": {
    title: "Change Relics",
    tooltip: "Equip, unequip, and manage your habit relics",
    description:
      "The Change Relics modal lets you curate your equipped relics. Drag from the Archive onto the Constellation to equip, or drag equipped relics back to the Archive to unequip.",
    steps: [
      {
        title: "What Is the Archive",
        targetId: "relic-archive",
        text: "The Archive is the left panel — it holds all your unequipped relics. Scroll through them to find the relic you want to equip next. Search or sort to browse quickly.",
      },
      {
        title: "Ordering the Archive",
        targetId: "relic-archive-order",
        text: "Use the sort buttons (Name, Progress, Created) to reorder your archive. Helps you find the right relic quickly — especially useful if you have many relics.",
      },
      {
        title: "Equipping a Relic",
        targetId: "relic-manager-modal",
        text: "Drag any relic from the Archive onto one of the three orbital slots in the Constellation on the right. Each slot represents a daily practice you're committing to. You can swap relics at any time.",
      },
    ],
  },

  "weekly-overview": {
    title: "Weekly Overview",
    tooltip: "See your performance for the week at a glance",
    description:
      "The Weekly Overview shows your productive hours, task completions, and daily trends for the current week in a bar chart and stats summary.",
    steps: [
      {
        title: "What Is the Weekly Overview?",
        targetId: "weekly-overview",
        text: "This is your weekly performance dashboard. It shows how much focused work you've logged this week, how many tasks you completed, and how your productive time breaks down across each day.",
      },
      {
        title: "Navigating Weeks",
        targetId: "weekly-overview-nav",
        text: "Use the left and right arrows next to the date range to view previous or future weeks. Compare your performance across different weeks to spot trends.",
      },
      {
        title: "Daily Bar Chart",
        targetId: "weekly-overview-chart",
        text: "Each bar represents one day's total productive hours. Today's bar is highlighted with a glow. Future days appear dimmed. Past days show the hours below the bar.",
      },
      {
        title: "Weekly Stats Summary",
        targetId: "weekly-overview-stats",
        text: "Total Hours sums all productive time tracked this week. Tasks Done counts completed tasks. Average Day shows your mean productive hours per day — a handy consistency benchmark.",
      },
    ],
  },

  "update-progress": {
    title: "Update Progress",
    tooltip: "Channel progress into your equipped relics",
    description:
      "Select a relic from the roster, then add progress points, reset progress, or delete the relic entirely. Changes are committed when you click 'Channel Energy'.",
    steps: [
      {
        title: "Relic Roster",
        targetId: "upgrade-roster",
        text: "The roster lists all your relics — equipped ones first, then the rest. Click any relic to select it, then use the controls on the right to add progress, reset it, or delete it. A pending-op badge marks relics with unsaved changes.",
      },
      {
        title: "Controls & Committing",
        targetId: "update-progress-controls",
        text: "With a relic selected, type a number in the input to add that many points. Use Reset to zero out its progress, or Delete to remove it permanently. Click 'Channel Energy' to commit all pending changes — a count-up animation plays as the progress updates.",
      },
    ],
  },

  // ─── JOURNAL PAGE ────────────────────────────

  "journal-page": {
    title: "Journal Page",
    tooltip: "Browse, search, filter, and organize your journal entries",
    description:
      "Your journals page lets you browse all entries, search by title or content, filter by date or folder, and pin or favorite your most important entries.",
    steps: [
      {
        title: "Journal List",
        targetId: "journal-list-container",
        text: "All your journals are displayed as cards. Each card shows emojis, title, a preview snippet, date, pinned and favorite indicators, and folder tags. Click any card to open it.",
      },
      {
        title: "Creating a Journal",
        targetId: "journal-add-button",
        text: "Click '+ New Journal' to create a new entry. You'll be taken to the editor where you can write, add emojis, assign folders, and use the AI writing tools.",
      },
      {
        title: "Search by Title & Content",
        targetId: "journal-search-input",
        text: "Use the search bar to filter journals by their title or body content. Results update in real time as you type. Click the X button to clear your search.",
      },
      {
        title: "Filter by Pinned & Favorites",
        targetId: "journal-pin-fav-filter",
        text: "Use the All / Pinned / Favorites filter pills to quickly narrow down your list. The count badge shows how many entries match each filter. Pin important entries or star your favorites.",
      },
      {
        title: "Search by Date",
        targetId: "journal-date-filter",
        text: "Click 'Date Filter' to set a from/to date range and view only journals within that period. The active range is shown next to the button. Use 'Default' to clear the filter.",
      },
      {
        title: "Search by Folder",
        targetId: "journal-folder-filter",
        text: "Click 'Folders' to open the Folder Explorer, where you can browse journals organized by folder. Create, rename, or delete folders. Drag and drop journal cards onto folder cards to assign them.",
      },
      {
        title: "Assigning to Folders",
        targetId: "journal-folder-assign",
        text: "Right-click any journal card to open the folder assignment panel. Check the boxes for the folders you want. Journals can belong to multiple folders at once.",
      },
    ],
  },
}

export function getLocalizedTutorialContent(t, id) {
  const fallback = TUTORIAL_CONTENT[id]
  if (!fallback) return null

  const baseKey = `tutorials.${id}`

  const title = t(`${baseKey}.title`, { defaultValue: fallback.title })
  const tooltip = t(`${baseKey}.tooltip`, { defaultValue: fallback.tooltip })
  const description = t(`${baseKey}.description`, {
    defaultValue: fallback.description,
  })

  // If i18n returned the key itself, no translation exists → use fallback entirely
  if (title === `${baseKey}.title`) return fallback

  const localized = { title, tooltip, description }

  if (fallback.steps) {
    localized.steps = fallback.steps.map((step, i) => ({
      ...step,
      title: t(`${baseKey}.steps.${i}.title`, { defaultValue: step.title }),
      text: t(`${baseKey}.steps.${i}.text`, { defaultValue: step.text }),
      targetId: step.targetId,
    }))
  }

  return localized
}

export default TUTORIAL_CONTENT
