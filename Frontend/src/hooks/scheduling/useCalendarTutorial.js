import { useState, useEffect, useMemo } from "react"
import { useTutorial } from "../../components/tutorial/TutorialContext"
import { toDateStr } from "../../features/scheduling/utils/calendarConstants"

export function useCalendarTutorial(currentDate, scrollContainerRef) {
  const { tutorialId, tutorialStep, updateSpotlightTarget } = useTutorial()
  const demoModeStep4 = tutorialId === "scheduling-calendar" && tutorialStep === 5
  const demoModeStep5 = tutorialId === "scheduling-calendar" && tutorialStep === 6
  const isTutorialDemoMode = demoModeStep4 || demoModeStep5
  const isStep4 = demoModeStep4

  const [tutorialBlock, setTutorialBlock] = useState({
    startTime: "00:00",
    endTime: "02:30",
    status: "To Do",
    visible: true,
  })

  const demoActivity = useMemo(() => {
    const dateStr = toDateStr(currentDate)
    return {
      id: "tutorial-demo",
      title: "Demo Activity",
      description: "Try moving or resizing me",
      startDatetime: `${dateStr}T${tutorialBlock.startTime}`,
      endDatetime: `${dateStr}T${tutorialBlock.endTime}`,
      color: "#7C3AED",
      priority: "medium",
      productivityLevel: "neutral",
      hasDeadline: false,
      status: "To Do",
    }
  }, [currentDate, tutorialBlock])

  useEffect(() => {
    if (!isTutorialDemoMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTutorialBlock({
        startTime: "12:00",
        endTime: "13:00",
        status: "To Do",
        visible: true,
      })
    }
  }, [isTutorialDemoMode])

  useEffect(() => {
    if (isTutorialDemoMode) {
      const timer = setTimeout(() => {
        updateSpotlightTarget("demo-activity-block", true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isTutorialDemoMode, updateSpotlightTarget])

  useEffect(() => {
    if (isTutorialDemoMode) {
      const container = scrollContainerRef?.current
      if (container) {
        const targetPx = 0
        const centerOffset = container.clientHeight * 0.35
        scrollContainerRef.current.scrollTop = Math.max(0, targetPx - centerOffset)
      }
    }
  }, [isTutorialDemoMode, scrollContainerRef])

  return {
    isTutorialDemoMode,
    isStep4,
    tutorialBlock,
    setTutorialBlock,
    demoActivity,
  }
}
