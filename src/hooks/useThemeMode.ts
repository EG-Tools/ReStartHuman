import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  getBrowserStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '../utils/browserStorage'

export type ThemeMode = 'white' | 'dark'

interface ThemeViewTransition {
  finished: Promise<void>
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => ThemeViewTransition
}

const THEME_MODE_STORAGE_KEY = 'restarthuman_alpha_theme_mode'

const toThemeMode = (value: string | null | undefined): ThemeMode =>
  value === 'dark' ? 'dark' : 'white'

export const useThemeMode = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const storage = getBrowserStorage()
    return toThemeMode(safeStorageGetItem(storage, THEME_MODE_STORAGE_KEY))
  })
  const themeModeRef = useRef(themeMode)
  const isTransitioningRef = useRef(false)

  const applyThemeMode = useCallback((nextMode: ThemeMode) => {
    const storage = getBrowserStorage()
    safeStorageSetItem(storage, THEME_MODE_STORAGE_KEY, nextMode)
    themeModeRef.current = nextMode
    if (typeof document !== 'undefined') {
      const isWhiteTheme = nextMode === 'white'
      document.documentElement.classList.toggle('theme-white', isWhiteTheme)
      document.body.classList.toggle('theme-white', isWhiteTheme)
    }
    setThemeModeState(nextMode)
  }, [])
  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    if (nextMode === themeModeRef.current) {
      return true
    }

    const shouldReduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const viewTransitionDocument = typeof document !== 'undefined'
      ? document as ViewTransitionDocument
      : null

    if (
      shouldReduceMotion
      || !viewTransitionDocument?.startViewTransition
      || isTransitioningRef.current
    ) {
      applyThemeMode(nextMode)
      return true
    }

    isTransitioningRef.current = true
    const transition = viewTransitionDocument.startViewTransition(() => {
      flushSync(() => {
        applyThemeMode(nextMode)
      })
    })
    void transition.finished.finally(() => {
      isTransitioningRef.current = false
    })

    return true
  }, [applyThemeMode])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const isWhiteTheme = themeMode === 'white'
    document.documentElement.classList.toggle('theme-white', isWhiteTheme)
    document.body.classList.toggle('theme-white', isWhiteTheme)
  }, [themeMode])

  return {
    themeMode,
    setThemeMode,
  }
}
