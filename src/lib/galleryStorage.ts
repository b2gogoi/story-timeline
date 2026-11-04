export type GalleryPhoto = {
  id: string
  name: string
  type: string
  size: number
  createdAt: number
  blob: Blob
}

const DATABASE_NAME = 'story-timeline-gallery'
const DATABASE_VERSION = 1
const STORE_NAME = 'photos'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local photo storage.'))
      return
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open photo storage.'))
    request.onblocked = () => reject(new Error('Photo storage is busy in another tab.'))
  })
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Photo storage failed.'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Photo storage was cancelled.'))
  })
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<GalleryPhoto[]>
    const photos = await new Promise<GalleryPhoto[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error ?? new Error('Could not read photo storage.'))
    })
    return photos.sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    database.close()
  }
}

export async function saveGalleryPhotos(files: File[]) {
  const images = files.filter(file => file.type.startsWith('image/'))
  if (images.length === 0) throw new Error('Choose one or more image files to upload.')

  const database = await openDatabase()
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const done = transactionComplete(transaction)
    const store = transaction.objectStore(STORE_NAME)
    for (const file of images) {
      store.put({
        id: createId(),
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: Date.now(),
        blob: file,
      } satisfies GalleryPhoto)
    }
    await done
  } finally {
    database.close()
  }
}

export async function deleteGalleryPhoto(id: string) {
  const database = await openDatabase()
  try {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const done = transactionComplete(transaction)
    transaction.objectStore(STORE_NAME).delete(id)
    await done
  } finally {
    database.close()
  }
}
