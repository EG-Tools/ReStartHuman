import { useCallback, useEffect, useState } from 'react'
import {
  getBrowserStorage,
  safeStorageGetItem,
  safeStorageSetItem,
} from '../utils/browserStorage'

export type ThemeMode = 'white' | 'dark'

const THEME_MODE_STORAGE_KEY = 'restarthuman_alpha_theme_mode'

const toThemeMode = (value: string | null | undefined): ThemeMode =>
  value === 'white' ? 'white' : 'dark'

export const useThemeMode = () => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const storage = getBrowserStorage()
    return toThemeMode(safeStorageGetItem(storage, THEME_MODE_STORAGE_KEY))
  })

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const isWhiteTheme = themeMode === 'white'
    document.documentElement.classList.toggle('theme-white', isWhiteTheme)
    document.body.classList.toggle('theme-white', isWhiteTheme)
  }, [themeMode])

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    const storage = getBrowserStorage()
    safeStorageSetItem(storage, THEME_MODE_STORAGE_KEY, nextMode)
    setThemeModeState(nextMode)
    return true
  }, [])

  return {
    themeMode,
    setThemeMode,
  }
}