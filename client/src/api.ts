export type MemoryType = 'recipe' | 'story' | 'note' | 'document' | 'photo'

export interface User {
  id: string
  email: string
}

export interface Family {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface FamilyMember {
  id: string
  familyId: string
  name: string
  relation: string
  avatarUrl: string
  createdAt: string
  updatedAt: string
}

export interface Memory {
  id: string
  familyId: string
  memberId: string | null
  memberIds: string[]
  isUserAssociated: boolean
  title: string
  content: string
  type: MemoryType
  attachment: MemoryAttachment | null
  createdAt: string
  updatedAt: string
}

export interface MemoryAttachment {
  fileName: string
  contentType: string
  size: number
}

export interface MemoryInput {
  title: string
  content: string
  type: MemoryType
  memberIds: string[]
  isUserAssociated: boolean
  attachment?: File | null
}

export interface Answer {
  answer: string
  sources: Array<{ memoryId: string; title: string }>
}

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'memoryvault.token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = authenticated ? getToken() : null
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    const target = API_URL || 'the configured API proxy'
    throw new ApiError(`Can't reach ${target}. Check that the MemoryVault server is running.`, 0)
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      (('message' in payload && typeof payload.message === 'string') ||
        ('error' in payload && typeof payload.error === 'string'))
        ? 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'error' in payload && typeof payload.error === 'string'
            ? payload.error
            : `Request failed with status ${response.status}`
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

async function downloadAttachment(memoryId: string): Promise<Blob> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/memories/${memoryId}/attachment`, { headers })
  } catch {
    const target = API_URL || 'the configured API proxy'
    throw new ApiError(`Can't reach ${target}. Check that the MemoryVault server is running.`, 0)
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return response.blob()
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

const memoryForm = (memory: MemoryInput) => {
  const form = new FormData()
  form.set('title', memory.title)
  form.set('content', memory.content)
  form.set('type', memory.type)
  form.set('memberIds', JSON.stringify(memory.memberIds))
  form.set('isUserAssociated', String(memory.isUserAssociated))
  if (memory.attachment) form.set('attachment', memory.attachment)
  return form
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>(
      '/api/auth/login',
      json('POST', { email, password }),
      false,
    ),
  register: (email: string, password: string) =>
    request<{ user: User; token: string }>(
      '/api/auth/register',
      json('POST', { email, password }),
      false,
    ),
  me: () => request<User>('/api/auth/me'),
  families: () => request<Family[]>('/api/families'),
  createFamily: (name: string) =>
    request<Family>('/api/families', json('POST', { name })),
  renameFamily: (familyId: string, name: string) =>
    request<Family>(`/api/families/${familyId}`, json('PATCH', { name })),
  members: (familyId: string) =>
    request<FamilyMember[]>(`/api/families/${familyId}/members`),
  createMember: (familyId: string, name: string, relation: string) =>
    request<FamilyMember>(
      `/api/families/${familyId}/members`,
      json('POST', { name, relation }),
    ),
  updateMember: (familyId: string, memberId: string, name: string, relation: string) =>
    request<FamilyMember>(
      `/api/families/${familyId}/members/${memberId}`,
      json('PATCH', { name, relation }),
    ),
  deleteMember: (familyId: string, memberId: string) =>
    request<void>(`/api/families/${familyId}/members/${memberId}`, json('DELETE')),
  memories: (familyId: string) =>
    request<Memory[]>(`/api/families/${familyId}/memories?limit=100`),
  createMemory: (familyId: string, memory: MemoryInput) =>
    request<Memory>(`/api/families/${familyId}/memories`, {
      method: 'POST',
      body: memoryForm(memory),
    }),
  updateMemory: (memoryId: string, memory: MemoryInput) =>
    request<Memory>(`/api/memories/${memoryId}`, {
      method: 'PATCH',
      body: memoryForm(memory),
    }),
  deleteMemory: (memoryId: string) =>
    request<void>(`/api/memories/${memoryId}`, json('DELETE')),
  downloadAttachment,
  ask: (familyId: string, question: string) =>
    request<Answer>(`/api/families/${familyId}/ask`, json('POST', { question })),
}
