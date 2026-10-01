import { randomUUID } from 'node:crypto'
import { Storage } from '@google-cloud/storage'

const bucketName = process.env.GCS_BUCKET_NAME
const googleStorage = bucketName
  ? new Storage({ projectId: process.env.GOOGLE_CLOUD_PROJECT || undefined })
  : null
const ephemeralObjects = new Map()

export async function storeObject({ bytes, mediaType, purpose }) {
  const id = `${purpose}/${randomUUID()}`

  if (googleStorage && bucketName) {
    await googleStorage.bucket(bucketName).file(id).save(bytes, {
      resumable: false,
      metadata: { contentType: mediaType, cacheControl: 'private, no-store' },
    })
    return { id, stored: true, adapter: 'google-cloud-storage' }
  }

  ephemeralObjects.set(id, { bytes, mediaType })
  if (ephemeralObjects.size > 24) {
    ephemeralObjects.delete(ephemeralObjects.keys().next().value)
  }
  return { id, stored: false, adapter: 'ephemeral' }
}

export function storageMode() {
  return googleStorage ? 'google-cloud-storage' : 'ephemeral-demo'
}
