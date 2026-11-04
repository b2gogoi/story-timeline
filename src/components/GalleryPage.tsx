import { useEffect, useMemo, useState } from 'react'
import { btn } from './ui'
import { deleteGalleryPhoto, listGalleryPhotos, saveGalleryPhotos, type GalleryPhoto } from '../lib/galleryStorage'

type PhotoWithUrl = GalleryPhoto & { url: string }

export function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    listGalleryPhotos()
      .then(items => { if (current) setPhotos(items) })
      .catch(reason => { if (current) setError(errorMessage(reason)) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [])

  const photosWithUrls = useMemo<PhotoWithUrl[]>(
    () => photos.map(photo => ({ ...photo, url: URL.createObjectURL(photo.blob) })),
    [photos],
  )
  useEffect(
    () => () => photosWithUrls.forEach(photo => URL.revokeObjectURL(photo.url)),
    [photosWithUrls],
  )

  const upload = async (files: File[]) => {
    if (!files.length) return
    setBusy(true)
    setError('')
    try {
      await saveGalleryPhotos(files)
      setPhotos(await listGalleryPhotos())
    } catch (reason) {
      setError(errorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (photo: GalleryPhoto) => {
    setError('')
    try {
      await deleteGalleryPhoto(photo.id)
      setPhotos(await listGalleryPhotos())
    } catch (reason) {
      setError(errorMessage(reason))
    }
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-y-auto p-6 text-white">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Your browser library</p>
          <h1 className="mt-1 text-2xl font-semibold">Gallery</h1>
          <p className="mt-1 text-sm text-white/55">Photos are stored in this browser on this device.</p>
        </div>
        <label className={`${btn} inline-flex cursor-pointer items-center gap-2 px-4 py-2 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          <span aria-hidden="true" className="text-lg leading-none">＋</span>
          {busy ? 'Saving photos…' : 'Upload photos'}
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            onChange={event => {
              const files = Array.from(event.currentTarget.files ?? [])
              event.currentTarget.value = ''
              void upload(files)
            }}
          />
        </label>
      </header>

      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-white/50">Loading your photos…</p>
      ) : photos.length === 0 ? (
        <div className="flex min-h-[280px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center">
          <div aria-hidden="true" className="mb-3 text-4xl text-white/35">▧</div>
          <h2 className="text-base font-medium text-white/85">Your gallery is empty</h2>
          <p className="mt-1 max-w-sm text-sm text-white/50">Upload photos to keep them in this browser and browse them here.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-white/45">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {photosWithUrls.map(photo => (
              <article key={photo.id} className="group overflow-hidden rounded-lg border border-white/10 bg-neutral-950 shadow-lg">
                <div className="relative aspect-square overflow-hidden bg-white/[0.04]">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded-md border border-black/20 bg-black/65 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:bg-red-700 group-hover:opacity-100 focus:opacity-100"
                    aria-label={`Delete ${photo.name}`}
                    onClick={() => void remove(photo)}
                  >
                    Remove
                  </button>
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm text-white/85" title={photo.name}>{photo.name}</p>
                  <p className="mt-0.5 text-xs text-white/40">{formatSize(photo.size)}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function errorMessage(reason: unknown) {
  if (reason instanceof Error) {
    if (reason.name === 'QuotaExceededError') return 'Browser storage is full. Remove some photos or free storage space, then try again.'
    return reason.message
  }
  return 'Could not access photo storage. Please try again.'
}
