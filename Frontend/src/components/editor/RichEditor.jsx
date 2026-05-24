import { useState, useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import LinkExtension from "@tiptap/extension-link"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold, Italic, Underline as UnderlineIcon,
  Heading2, Heading3, List, ListOrdered,
  Quote, Link, Highlighter, Undo, Redo,
} from "lucide-react"
import { theme } from "../../theme"
import "./RichEditor.css"

function ToolbarButton({ icon: Icon, active, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`re-toolbar-btn${active ? " active" : ""}`}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} />
    </button>
  )
}

function ToolbarDivider() {
  return <div className="re-toolbar-divider" />
}

export default function RichEditor({ value, onChange, placeholder }) {
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef(null)
  const lastEmittedRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        history: { depth: 50 },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "re-link" },
      }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({
        placeholder: placeholder || "Write what\u2019s been on your mind\u2026",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastEmittedRef.current = html
      onChange?.(html)
      setSaved(false)
    },
    editorProps: {
      attributes: {
        class: "re-editor-content",
      },
    },
  })

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!editor) return
    if (value !== lastEmittedRef.current) {
      editor.commands.setContent(value || "")
      lastEmittedRef.current = value
    }
  }, [editor, value])

  const showSaved = useCallback(() => {
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1500)
  }, [])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Link URL", previousUrl || "https://")
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="re-wrapper">
      <div className="re-toolbar">
        <div className="re-toolbar-group">
          <ToolbarButton icon={Bold} active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold" />
          <ToolbarButton icon={Italic} active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic" />
          <ToolbarButton icon={UnderlineIcon} active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline" />
        </div>
        <ToolbarDivider />
        <div className="re-toolbar-group">
          <ToolbarButton icon={Heading2} active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading" />
          <ToolbarButton icon={Heading3} active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Subheading" />
        </div>
        <ToolbarDivider />
        <div className="re-toolbar-group">
          <ToolbarButton icon={List} active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list" />
          <ToolbarButton icon={ListOrdered} active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list" />
          <ToolbarButton icon={Quote} active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote" />
        </div>
        <ToolbarDivider />
        <div className="re-toolbar-group">
          <ToolbarButton icon={Link} active={editor.isActive("link")} onClick={setLink} title="Link" />
          <ToolbarButton icon={Highlighter} active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()} title="Highlight" />
        </div>
        <div className="re-toolbar-spacer" />
        <div className="re-toolbar-group">
          <ToolbarButton icon={Undo} onClick={() => { editor.chain().focus().undo().run(); showSaved() }} title="Undo" />
          <ToolbarButton icon={Redo} onClick={() => { editor.chain().focus().redo().run(); showSaved() }} title="Redo" />
        </div>
      </div>
      <div className="re-editor-container">
        <EditorContent editor={editor} />
      </div>
      <div className={`re-status${saved ? " visible" : ""}`}>
        <span className="re-status-dot" />
        Saved
      </div>
    </div>
  )
}
