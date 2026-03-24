import { useEffect } from 'react'

export function useViewportCssVars() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = document.documentElement
    const timerIds = new Set<number>()
    let frameId: number | null = null
    let lastViewportSize = ''

    const syncViewportSize = () => {
      const visualViewport = window.visualViewport
      const viewportWidth = Math.round(
        Math.max(window.innerWidth, document.documentElement.clientWidth || 0),
      )
      const viewportHeight = Math.round(
        visualViewport?.height || window.innerHeight || document.documentElement.clientHeight,
      )
      const nextViewportSize = `${viewportWidth}x${viewportHeight}`

      if (nextViewportSize === lastViewportSize) {
        return
      }

      lastViewportSize = nextViewportSize
      root.style.setProperty('--app-height', `${viewportHeight}px`)
      root.style.setProperty('--app-width', `${viewportWidth}px`)
    }

    const clearScheduledViewportSync = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }

      timerIds.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      timerIds.clear()
    }

    const queueViewportSync = () => {
      clearScheduledViewportSync()
      syncViewportSize()
      frameId = window.requestAnimationFrame(() => {
        frameId = null
        syncViewportSize()
      })

      ;[120, 280, 520, 900].forEach((delay) => {
        const timerId = window.setTimeout(() => {
          syncViewportSize()
          timerIds.delete(timerId)
        }, delay)

        timerIds.add(timerId)
      })
    }

    queueViewportSync()

    window.addEventListener('resize', queueViewportSync)
    window.addEventListener('orientationchange', queueViewportSync)
    window.addEventListener('pageshow', queueViewportSync)
    window.visualViewport?.addEventListener('resize', queueViewportSync)
    window.visualViewport?.addEventListener('scroll', queueViewportSync)

    return () => {
      clearScheduledViewportSync()
      window.removeEventListener('resize', queueViewportSync)
      window.removeEventListener('orientationchange', queueViewportSync)
      window.removeEventListener('pageshow', queueViewportSync)
      window.visualViewport?.removeEventListener('resize', queueViewportSync)
      window.visualViewport?.removeEventListener('scroll', queueViewportSync)
    }
  }, [])
}
