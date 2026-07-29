import { Component } from "react"
import "../styles/shared/index.css"

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
        <div className="eb-wrapper">
          <h1 className="eb-title">Something went wrong</h1>
          <p className="eb-message">An unexpected error occurred.</p>
          <div className="eb-actions">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null })
              }}
              className="eb-btn eb-btn--try-again"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.reload()
              }}
              className="eb-btn eb-btn--refresh"
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
