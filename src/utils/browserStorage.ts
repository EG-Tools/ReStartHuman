export const getBrowserStorage = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export const safeStorageGetItem = (storage: Storage | undefined, key: string) => {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export const safeStorageSetItem = (
  storage: Storage | undefined,
  key: string,
  value: string,
) => {
  try {
    storage?.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export const safeStorageRemoveItem = (storage: Storage | undefined, key: string) => {
  try {
    storage?.removeItem(key)
    return true
  } catch {
    return false
  }
}
