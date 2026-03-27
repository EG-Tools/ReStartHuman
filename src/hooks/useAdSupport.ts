import { useCallback, useEffect, useState } from 'react'
import {
  getBrowserStorage,
  safeStorageGetItem,
  safeStorageRemoveItem,
  safeStorageSetItem,
} from '../utils/browserStorage'

const AD_FREE_STORAGE_KEY = 'restarthuman_alpha_ad_free_enabled'
const AD_FREE_BYPASS_ENABLED = import.meta.env.DEV

const readAdFreeEnabled = (storage?: Storage) =>
  AD_FREE_BYPASS_ENABLED && safeStorageGetItem(storage, AD_FREE_STORAGE_KEY) === 'true'

export const useAdSupport = () => {
  const [isAdFreeEnabled, setIsAdFreeEnabled] = useState(() =>
    readAdFreeEnabled(getBrowserStorage()),
  )

  useEffect(() => {
    if (AD_FREE_BYPASS_ENABLED) {
      return
    }

    safeStorageRemoveItem(getBrowserStorage(), AD_FREE_STORAGE_KEY)
  }, [])

  const enableAdFree = useCallback(() => {
    if (!AD_FREE_BYPASS_ENABLED) {
      return false
    }

    const storage = getBrowserStorage()
    const didPersist = safeStorageSetItem(storage, AD_FREE_STORAGE_KEY, 'true')

    setIsAdFreeEnabled(didPersist || readAdFreeEnabled(storage))
    return didPersist
  }, [])

  return {
    isAdFreeEnabled,
    canEnableAdFree: AD_FREE_BYPASS_ENABLED,
    enableAdFree,
  }
}
