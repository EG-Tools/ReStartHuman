import { useCallback, useState } from 'react'

const AD_FREE_STORAGE_KEY = 'restarthuman_alpha_ad_free_enabled'

const getBrowserStorage = () => (typeof window === 'undefined' ? undefined : window.localStorage)

const readAdFreeEnabled = (storage?: Storage) => storage?.getItem(AD_FREE_STORAGE_KEY) === 'true'

export const useAdSupport = () => {
  const [isAdFreeEnabled, setIsAdFreeEnabled] = useState(() =>
    readAdFreeEnabled(getBrowserStorage()),
  )

  const enableAdFree = useCallback(() => {
    const storage = getBrowserStorage()

    storage?.setItem(AD_FREE_STORAGE_KEY, 'true')
    setIsAdFreeEnabled(true)
  }, [])

  return {
    isAdFreeEnabled,
    enableAdFree,
  }
}
