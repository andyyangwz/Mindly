import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { createRoot } from "react-dom/client"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import LinkExtension from "@tiptap/extension-link"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import tippy from "tippy.js"
import "tippy.js/dist/tippy.css"
import {
  Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Undo, Redo, ExternalLink,
} from "lucide-react"
import SlashCommand from "./slashCommand"
import SlashCommandList from "./SlashCommandList"
import "../../styles/shared/index.css"

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

const RichEditor = forwardRef(function RichEditor(
  { value, onChange, placeholder, onSelectionChange, showToolbar = true, bare = false },
  ref,
) {
  const [saved, setSaved] = useState(false)
  const savedTimer = useRef(null)
  const lastEmittedRef = useRef(value)

  const [linkState, setLinkState] = useState({
    show: false,
    x: 0,
    y: 0,
    url: "",
    editing: false,
  })
  const linkInputRef = useRef(null)
  const linkPopupRef = useRef(null)
  const [ctxMenu, setCtxMenu] = useState({ show: false, x: 0, y: 0, url: "" })
  const ctxMenuRef = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        history: { depth: 50 },
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: { class: "re-link" },
      }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({
        placeholder: placeholder || "Write what\u2019s been on your mind\u2026",
      }),
      SlashCommand.configure({
        suggestion: {
          render: () => {
            let component
            let root
            let popup

            return {
              onStart: (props) => {
                const container = document.createElement("div")
                root = createRoot(container)
                component = { ref: null, element: container }

                root.render(
                  <SlashCommandList
                    ref={(r) => { component.ref = r }}
                    items={props.items}
                    command={props.command}
                    editor={props.editor}
                  />,
                )

                if (!props.clientRect) return

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: container,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  offset: [0, 8],
                })
              },
              onUpdate: (props) => {
                if (component?.ref) {
                  component.ref.updateProps?.(props)
                  component.ref.forceUpdate?.()
                }
                if (!props.clientRect) return
                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },
              onKeyDown: (props) => {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide()
                  return true
                }
                return component?.ref?.onKeyDown?.(props)
              },
              onExit: () => {
                popup?.[0]?.destroy()
                root?.unmount()
              },
            }
          },
          command: (cmdProps) => {
            const { editor: e, props: item } = cmdProps
            item.command({ editor: e })
          },
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML()
      lastEmittedRef.current = html
      onChange?.(html)
      onSelectionChange?.(!e.state.selection.empty)
      setSaved(false)
    },
    onSelectionUpdate: ({ editor: e }) => {
      const hasSelection = !e.state.selection.empty
      onSelectionChange?.(hasSelection)

      if (!hasSelection) {
        setLinkState((prev) => (prev.editing ? prev : { ...prev, show: false }))
        return
      }

      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setLinkState((prev) => (prev.editing ? prev : { ...prev, show: false }))
        return
      }

      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (!rect || rect.width === 0) return

      const existingUrl = e.isActive("link") ? e.getAttributes("link").href || "" : ""
      setLinkState({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 6,
        url: existingUrl,
        editing: false,
      })
    },
    editorProps: {
      attributes: {
        class: "re-editor-content",
      },
    },
  })

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    hasSelection: () => editor && !editor.state.selection.empty,
    getSelectedText: () => {
      if (!editor || editor.state.selection.empty) return ""
      const { from, to } = editor.state.selection
      return editor.state.doc.textBetween(from, to, "\n")
    },
    getSelectedHTML: () => {
      if (!editor || editor.state.selection.empty) return ""
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.rangeCount) return ""
      const range = selection.getRangeAt(0)
      const fragment = range.cloneContents()
      const div = document.createElement("div")
      div.appendChild(fragment)
      return div.innerHTML
    },
    replaceSelection: (html) => {
      if (!editor || editor.state.selection.empty) return
      const { from, to } = editor.state.selection
      editor.chain().focus().insertContentAt({ from, to }, html).run()
    },
    insertAtCursor: (html) => {
      if (!editor) return
      editor.chain().focus().insertContent(html).run()
    },
  }), [editor])

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

  useEffect(() => {
    if (!linkState.editing || !linkInputRef.current) return
    linkInputRef.current.focus()
    linkInputRef.current.select()
  }, [linkState.editing])

  useEffect(() => {
    if (!linkState.show || linkState.editing) return
    function handleOutside(e) {
      if (linkPopupRef.current && !linkPopupRef.current.contains(e.target)) {
        setLinkState((prev) => ({ ...prev, show: false }))
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [linkState.show, linkState.editing])

  const applyLink = useCallback(() => {
    if (!editor) return
    const url = linkState.url.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
    setLinkState({ show: false, x: 0, y: 0, url: "", editing: false })
  }, [editor, linkState.url])

  const handleContextMenu = useCallback((e) => {
    if (!editor) return
    const link = e.target.closest("a.re-link")
    if (!link) return
    e.preventDefault()
    const href = link.getAttribute("href") || ""
    setCtxMenu({ show: true, x: e.clientX, y: e.clientY, url: href })
  }, [editor])

  useEffect(() => {
    if (!ctxMenu.show) return
    function close() { setCtxMenu((prev) => ({ ...prev, show: false })) }
    document.addEventListener("mousedown", close, { once: true, capture: true })
    return () => document.removeEventListener("mousedown", close, true)
  }, [ctxMenu.show])

  const openLinkForEdit = useCallback(() => {
    if (!editor || !ctxMenu.url) return
    setCtxMenu({ show: false, x: 0, y: 0, url: "" })
    const linkMark = editor.state.schema.marks.link
    if (!linkMark) return
    const { state } = editor
    let linkPos = null
    state.doc.descendants((node, pos) => {
      if (linkPos !== null) return false
      if (!node.marks) return
      for (const mark of node.marks) {
        if (mark.type === linkMark && mark.attrs.href === ctxMenu.url) {
          linkPos = pos
          return false
        }
      }
    })
    if (linkPos === null) return
    editor.chain().focus().setTextSelection(linkPos).run()
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (rect && rect.width > 0) {
        setLinkState({
          show: true,
          x: rect.left + rect.width / 2,
          y: rect.top - 6,
          url: ctxMenu.url,
          editing: true,
        })
        return
      }
    }
    setLinkState({
      show: true,
      x: ctxMenu.x,
      y: ctxMenu.y,
      url: ctxMenu.url,
      editing: true,
    })
  }, [editor, ctxMenu.url, ctxMenu.x, ctxMenu.y])

  const showSaved = useCallback(() => {
    setSaved(true)
    if (savedTimer.current) clearTimeout(savedTimer.current)
    savedTimer.current = setTimeout(() => setSaved(false), 1500)
  }, [])

  if (!editor) return null

  return (
    <div className={bare ? "re-bare" : "re-wrapper"}>
      {showToolbar && (
        <div className="re-toolbar">
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
          <div className="re-toolbar-spacer" />
          <div className="re-toolbar-group">
            <ToolbarButton icon={Undo} onClick={() => { editor.chain().focus().undo().run(); showSaved() }} title="Undo" />
            <ToolbarButton icon={Redo} onClick={() => { editor.chain().focus().redo().run(); showSaved() }} title="Redo" />
          </div>
        </div>
      )}
      <div className="re-editor-container" onContextMenu={handleContextMenu}>
        <EditorContent editor={editor} />

        {linkState.show && !linkState.editing && (
          <div
            ref={linkPopupRef}
            className="re-link-float"
            style={{ left: linkState.x, top: linkState.y }}
          >
            <button
              type="button"
              className="re-link-float-btn"
              onClick={() => {
                const existingUrl = editor.isActive("link")
                  ? editor.getAttributes("link").href || ""
                  : ""
                setLinkState((prev) => ({
                  ...prev,
                  editing: true,
                  url: existingUrl || "https://",
                }))
              }}
              title="Insert link"
            >
              <LinkIcon size={14} />
            </button>
          </div>
        )}

        {linkState.editing && (
          <div
            ref={linkPopupRef}
            className="re-link-popup"
            style={{ left: linkState.x, top: linkState.y }}
          >
            <div className="re-link-popup-row">
              <ExternalLink size={13} className="re-link-popup-icon" />
              <input
                ref={linkInputRef}
                type="url"
                className="re-link-popup-input"
                value={linkState.url}
                onChange={(e) => setLinkState((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="Paste or type a URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    applyLink()
                  }
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setLinkState({ show: false, x: 0, y: 0, url: "", editing: false })
                    editor?.commands.focus()
                  }
                }}
              />
            </div>
            <div className="re-link-popup-actions">
              <button
                type="button"
                className="re-link-popup-cancel"
                onClick={() => {
                  setLinkState({ show: false, x: 0, y: 0, url: "", editing: false })
                  editor?.commands.focus()
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="re-link-popup-apply"
                onClick={applyLink}
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {ctxMenu.show && (
          <div
            ref={ctxMenuRef}
            className="re-ctx-menu"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
          >
            <button
              type="button"
              className="re-ctx-menu-item"
              onClick={openLinkForEdit}
            >
              <LinkIcon size={13} />
              Edit Link
            </button>
          </div>
        )}
      </div>
      {!bare && (
        <div className={`re-status${saved ? " visible" : ""}`}>
          <span className="re-status-dot" />
          Saved
        </div>
      )}
    </div>
  )
})

export default RichEditor
