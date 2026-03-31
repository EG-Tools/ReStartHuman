import { useCallback, useEffect, useState } from 'react'
import {
  getBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '../utils/browserStorage'

const ADMIN_MODE_STORAGE_KEY = 'restarthuman_alpha_admin_mode_enabled'
const LEGACY_AD_FREE_STORAGE_KEY = 'restarthuman_alpha_ad_free_enabled'

const readAdminModeEnabled = (storage?: Storage) =>
  safeStorageGetItem(storage, ADMIN_MODE_STORAGE_KEY) === 'true' ||
  safeStorageGetItem(storage, LEGACY_AD_FREE_STORAGE_KEY) === 'true'

export const useAdSupport = () => {
  const [isAdminModeEnabled, setIsAdminModeEnabled] = useState(() =>
    readAdminModeEnabled(getBrowserStorage()),
  )

  useEffect(() => {
    const storage = getBrowserStorage()

    if (!readAdminModeEnabled(storage)) {
      return
    }

    safeStorageSetItem(storage, ADMIN_MODE_STORAGE_KEY, 'true')
    safeStorageRemoveItem(storage, LEGACY_AD_FREE_STORAGE_KEY)
  }, [])

  const enableAdminMode = useCallback(() => {
    const storage = getBrowserStorage()

    safeStorageSetItem(storage, ADMIN_MODE_STORAGE_KEY, 'true')
    safeStorageRemoveItem(storage, LEGACY_AD_FREE_STORAGE_KEY)
    setIsAdminModeEnabled(true)

    return true
  }, [])

  return {
    isAdminModeEnabled,
    isAdFreeEnabled: isAdminModeEnabled,
    canEnableAdminMode: true,
    enableAdminMode,
  }
}
