"use client"

import { useEffect } from "react"

/**
 * Anti-copy/screenshot protection component.
 * Blocks: right-click, Ctrl+C, Ctrl+A, Ctrl+P, PrintScreen, drag.
 * Hides content when window loses focus (anti-screenshot for alt-tab + snipping tool).
 */
export function AntiCopy() {
  useEffect(() => {
    // Block context menu (right-click)
    function handleContextMenu(e: MouseEvent) {
      e.preventDefault()
      return false
    }

    // Block keyboard shortcuts for copying, selecting, printing
    function handleKeyDown(e: KeyboardEvent) {
      // Block Ctrl/Cmd + C (copy)
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault()
        return false
      }
      // Block Ctrl/Cmd + A (select all)
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault()
        return false
      }
      // Block Ctrl/Cmd + P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        return false
      }
      // Block Ctrl/Cmd + S (save page)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        return false
      }
      // Block Ctrl/Cmd + U (view source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault()
        return false
      }
      // Block Ctrl + Shift + I (devtools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault()
        return false
      }
      // Block Ctrl + Shift + J (console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault()
        return false
      }
      // Block Ctrl + Shift + C (inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault()
        return false
      }
      // Block F12 (devtools)
      if (e.key === "F12") {
        e.preventDefault()
        return false
      }
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault()
        // Clear clipboard
        navigator.clipboard?.writeText?.("")
        return false
      }
    }

    // Block drag events on text/images
    function handleDragStart(e: DragEvent) {
      e.preventDefault()
      return false
    }

    // Block copy event
    function handleCopy(e: ClipboardEvent) {
      e.preventDefault()
      return false
    }

    // Block cut event
    function handleCut(e: ClipboardEvent) {
      e.preventDefault()
      return false
    }

    // Blur content when window loses visibility (screenshot protection)
    // Only blurs elements with data-protected="question" to avoid resetting dashboard
    function handleVisibilityChange() {
      const questionElements = document.querySelectorAll('[data-protected="question"]')
      if (document.hidden) {
        questionElements.forEach((el) => {
          ;(el as HTMLElement).style.filter = "blur(20px)"
          ;(el as HTMLElement).style.transition = "filter 0.1s"
        })
      } else {
        questionElements.forEach((el) => {
          ;(el as HTMLElement).style.filter = "none"
        })
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("cut", handleCut)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("cut", handleCut)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  return null
}
