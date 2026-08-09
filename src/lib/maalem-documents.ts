import { API_CONFIG } from '@/lib/api-config'

interface PrivateDocumentRequestOptions {
  accessToken: string
  path: string
  method?: 'GET' | 'POST' | 'DELETE'
  body?: FormData
}

async function privateDocumentRequest({
  accessToken,
  path,
  method = 'GET',
  body,
}: PrivateDocumentRequestOptions) {
  const response = await fetch(`${API_CONFIG.BASE_URL}${path}`, {
    method,
    body,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Platform: 'web',
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || `HTTP ${response.status}`)
  }

  return response
}

export async function uploadMaalemCv(accessToken: string, file: File) {
  const body = new FormData()
  body.append('file', file)
  const response = await privateDocumentRequest({
    accessToken,
    path: '/api/maalem-profiles/me/cv',
    method: 'POST',
    body,
  })
  return response.json()
}

export async function uploadMaalemRealizations(accessToken: string, files: File[]) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  const response = await privateDocumentRequest({
    accessToken,
    path: '/api/maalem-profiles/me/realizations',
    method: 'POST',
    body,
  })
  return response.json()
}

export async function deleteMaalemDocument(accessToken: string, documentId: number) {
  await privateDocumentRequest({
    accessToken,
    path: `/api/maalem-profiles/me/documents/${documentId}`,
    method: 'DELETE',
  })
}

export async function downloadMaalemDocument(
  accessToken: string,
  documentId: number,
  fallbackName: string
) {
  const response = await privateDocumentRequest({
    accessToken,
    path: `/api/maalem-profiles/me/documents/${documentId}/download`,
  })
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fallbackName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
