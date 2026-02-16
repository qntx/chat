import { useCallback, useEffect, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { XIcon, DownloadIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react'

interface ImageLightboxProps {
  src: string
  alt?: string
  onClose: () => void
}

/** Fullscreen image lightbox with zoom, download, and keyboard support. */
export const ImageLightbox: FC<ImageLightboxProps> = ({
  src,
  alt = 'Generated image',
  onClose,
}) => {
  const [zoomed, setZoomed] = useState(false)

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const toggleZoom = useCallback(() => setZoomed((v) => !v), [])

  /** Download the image as a file. */
  const handleDownload = useCallback(async () => {
    try {
      const res = await fetch(src)
      const blob = await res.blob()
      const ext = blob.type.split('/')[1] || 'png'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-image.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab if download fails
      window.open(src, '_blank')
    }
  }, [src])

  return createPortal(
    <div
      className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleZoom}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          title={zoomed ? 'Zoom out' : 'Zoom in'}
        >
          {zoomed ? <ZoomOutIcon className="size-5" /> : <ZoomInIcon className="size-5" />}
        </button>
        <button
          onClick={handleDownload}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Download image"
          title="Download image"
        >
          <DownloadIcon className="size-5" />
        </button>
        <button
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close"
          title="Close (Esc)"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      {/* Image container */}
      <div
        className={`relative z-[1] flex items-center justify-center transition-transform duration-200 ${
          zoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'
        }`}
        onClick={(e) => {
          // Only toggle zoom when clicking the image area, not the toolbar
          if (e.target === e.currentTarget) onClose()
        }}
        style={zoomed ? { width: '100vw', height: '100vh', overflow: 'auto' } : {}}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => {
            e.stopPropagation()
            toggleZoom()
          }}
          className={`select-none transition-all duration-200 ${
            zoomed ? 'max-w-none' : 'max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl'
          }`}
          draggable={false}
        />
      </div>
    </div>,
    document.body,
  )
}
