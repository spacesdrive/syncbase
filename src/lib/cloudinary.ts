const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string

export async function uploadToCloudinary(file: File, folder = 'syncbase/posts') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await res.json()
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
  }
}

function getResourceEndpoint(file: File): 'image' | 'video' | 'raw' {
  const mime = file.type.toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (mime.startsWith('video/')) return 'video'
  // PDFs upload cleanly as images — Cloudinary has native PDF support
  if (mime.startsWith('image/') || mime === 'application/pdf' || ext === 'pdf') return 'image'
  // Everything else (pptx, docx, xlsx, zip, etc.) must go through /raw/upload
  return 'raw'
}

export async function uploadFileToCloudinary(file: File, folder = 'syncbase/chat') {
  const resourceType = getResourceEndpoint(file)
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await res.json()
  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    name: file.name,
    type: data.resource_type as string,
    size: file.size,
    format: (data.format as string) ?? fileExt,
  }
}

export function getOptimizedUrl(publicId: string, options: { width?: number; quality?: string; format?: string } = {}) {
  const { width = 800, quality = 'auto', format = 'auto' } = options
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_${quality},f_${format}/${publicId}`
}

export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Fallback: open in new tab (browser will prompt to download or display)
    window.open(url, '_blank')
  }
}
