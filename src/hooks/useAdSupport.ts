import { useCallback, useEffect, useState } from 'react'
import {
  getBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '../utils/browserStorage'

export type AppAccessMode = 'general' | 'pro'

const ADMIN_MODE_STORAGE_KEY = 'restarthuman_alpha_admin_mode_enabled'
const ACCESS_MODE_STORAGE_KEY = 'restarthuman_alpha_access_mode'
const LEGACY_AD_FREE_STORAGE_KEY = 'restarthuman_alpha_ad_free_enabled'

const toAccessMode = (value: string | null | undefined): AppAccessMode =>
  value === 'general' ? 'general' : 'pro'

const readAdminModeEnabled = (storage?: Storage) =>
  safeStorageGetItem(storage, ADMIN_MODE_STORAGE_KEY) === 'true' ||
  safeStorageGetItem(storage, LEGACY_AD_FREE_STORAGE_KEY) === 'true'

const readStoredAccessMode = (storage?: Storage) =>
  toAccessMode(safeStorageGetItem(storage, ACCESS_MODE_STORAGE_KEY))

export const useAdSupport = () => {
  const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(() =>
    readAdminModeEnabled(getBrowserStorage()),
  )
  const [requestedAccessMode, setRequestedAccessMode] = useState<AppAccessMode>(() => {
    const storage = getBrowserStorage()

    return readAdminModeEnabled(storage) ? readStoredAccessMode(storage) : 'general'
  })

  useEffect(() => {
    const storage = getBrowserStorage()

    if (!readAdminModeEnabled(storage)) {
      return
    }

    const normalizedAccessMode = readStoredAccessMode(storage)
    safeStorageSetItem(storage, ADMIN_MODE_STORAGE_KEY, 'true')
    safeStorageSetItem(storage, ACCESS_MODE_STORAGE_KEY, normalizedAccessMode)
    safeStorageRemoveItem(storage, LEGACY_AD_FREE_STORAGE_KEY)
  }, [])

  const enableAdminMode = useCallback(() => {
    const storage = getBrowserStorage()

    safeStorageSetItem(storage, ADMIN_MODE_STORAGE_KEY, 'true')
    safeStorageSetItem(storage, ACCESS_MODE_STORAGE_KEY, 'pro')
    safeStorageRemoveItem(storage, LEGACY_AD_FREE_STORAGE_KEY)
    setIsAdminModeEnabled(true)
    setRequestedAccessMode('pro')

    return true
  }, [])

  const setAccessMode = useCallback(
    (nextMode: AppAccessMode) => {
      if (!isAdminModeEnabled) {
        return false
      }

      const storage = getBrowserStorage()
      safeStorageSetItem(storage, ACCESS_MODE_STORAGE_KEY, nextMode)
      setRequestedAccessMode(nextMode)
      return true
    },
    [isAdminModeEnabled],
  )

  const accessMode = isAdminModeEnabled ? requestedAccessMode : 'general'

  return {
    accessMode,
    isAdminModeEnabled,
    isAdFreeEnabled: isAdminModeEnabled && accessMode === 'pro',
    canEnableAdminMode: true,
    canToggleAccessMode: isAdminModeEnabled,
    enableAdminMode,
    setAccessMode,
  }
}
