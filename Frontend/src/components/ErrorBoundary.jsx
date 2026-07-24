import { Component } from "react"

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 40,
          fontFamily: "system-ui, sans-serif",
          background: "#f9fafb",
          color: "#111827",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 20, textAlign: "center", maxWidth: 400 }}>
            An unexpected error occurred.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
              }}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "white",
                color: "#111827",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.reload()
              }}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: "#6366f1",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
