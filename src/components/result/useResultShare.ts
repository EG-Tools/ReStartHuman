import { useCallback, useState, type RefObject } from 'react'

type ExportState = 'idle' | 'sharing'

interface UseResultShareOptions {
  captureRef: RefObject<HTMLDivElement | null>
}

const getExportFileName = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `restarthuman-alpha-cashflow-${year}${month}${day}.png`
}

const createResultImage = async (node: HTMLDivElement) => {
  const openedPopovers = Array.from(
    node.querySelectorAll('details[open]'),
  ) as HTMLDetailsElement[]

  openedPopovers.forEach((element) => {
    element.open = false
  })

  try {
    const { toBlob } = await import('html-to-image')
    const blob = await toBlob(node, {
      backgroundColor: '#081113',
      pixelRatio: 2,
      cacheBust: true,
      filter: (currentNode) => {
        return !(
          currentNode instanceof HTMLElement &&
          currentNode.dataset.captureExclude === 'true'
        )
      },
    })

    if (!blob) {
      throw new Error('capture-failed')
    }

    return blob
  } finally {
    openedPopovers.forEach((element) => {
      element.open = true
    })
  }
}

const downloadResultImage = (blob: Blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = getExportFileName()
  link.click()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

export function useResultShare({ captureRef }: UseResultShareOptions) {
  const [exportState, setExportState] = useState<ExportState>('idle')
  const [exportMessage, setExportMessage] = useState<string | null>(null)

  const handleShareImage = useCallback(async () => {
    const node = captureRef.current

    if (!node) {
      setExportMessage('결과 이미지 공유에 실패했습니다.')
      return
    }

    try {
      setExportState('sharing')
      setExportMessage(null)
      const blob = await createResultImage(node)
      const file = new File([blob], getExportFileName(), { type: 'image/png' })

      if (
        navigator.share &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: 'Re Start Human 결과',
          files: [file],
        })
        setExportMessage('결과 이미지를 공유했습니다.')
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Re Start Human 결과',
          text: '결과 화면 이미지를 저장하거나 전송할 수 있습니다.',
          url: window.location.href,
        })
        setExportMessage('공유를 마쳤습니다.')
        return
      }

      downloadResultImage(blob)
      setExportMessage('공유 기능이 없어 이미지를 다운로드했습니다.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportMessage('공유가 취소되었습니다.')
      } else {
        setExportMessage('결과 이미지 공유에 실패했습니다.')
      }
    } finally {
      setExportState('idle')
    }
  }, [captureRef])

  return {
    exportMessage,
    exportState,
    handleShareImage,
  }
}
