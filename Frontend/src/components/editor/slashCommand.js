import { Extension } from "@tiptap/core"
import Suggestion from "@tiptap/suggestion"
import {
  Heading2,
  Heading3,
  Heading4,
  Quote,
  List,
  ListOrdered,
  Minus,
} from "lucide-react"

function findSlashRange(editor) {
  const { state } = editor
  const { from } = state.selection
  const $from = state.doc.resolve(from)
  const text = $from.nodeBefore?.text || ""
  const idx = text.lastIndexOf("/")
  if (idx === -1) return null
  return { from: from - text.length + idx, to: from }
}

const SLASH_COMMANDS = [
  {
    label: "H2 Heading",
    aliases: ["h2"],
    icon: Heading2,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleHeading({ level: 2 }).run()
    },
  },
  {
    label: "H3 Subheading",
    aliases: ["h3"],
    icon: Heading3,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleHeading({ level: 3 }).run()
    },
  },
  {
    label: "H4 Small Heading",
    aliases: ["h4"],
    icon: Heading4,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleHeading({ level: 4 }).run()
    },
  },
  {
    label: "Quote",
    aliases: ["q", "quote"],
    icon: Quote,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleBlockquote().run()
    },
  },
  {
    label: "Bullet List",
    aliases: ["bullet"],
    icon: List,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleBulletList().run()
    },
  },
  {
    label: "Numbered List",
    aliases: ["number"],
    icon: ListOrdered,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().toggleOrderedList().run()
    },
  },
  {
    label: "Horizontal Divider",
    aliases: ["hr"],
    icon: Minus,
    command: ({ editor }) => {
      const range = findSlashRange(editor)
      if (!range) return
      editor.chain().deleteRange(range).focus().setHorizontalRule().run()
    },
  },
]

function filterCommands(query) {
  const q = (query || "").toLowerCase()
  if (!q) return SLASH_COMMANDS
  return SLASH_COMMANDS.filter((cmd) => {
    if (cmd.label.toLowerCase().includes(q)) return true
    return cmd.aliases.some((alias) => alias.toLowerCase().includes(q))
  })
}

const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: false,
        items: (props) => filterCommands(props.query),
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export { SLASH_COMMANDS }
export default SlashCommand
