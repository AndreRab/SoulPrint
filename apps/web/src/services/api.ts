import type { AiSuggestions, Conversation, Person, Place, Plan, Profile, SettingsModel } from '../types'
import { mockApi } from './mockApi'

const configuredBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '')
const apiBase = configuredBase || '/api'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try { message = (await response.json()).error || message } catch { /* keep generic error */ }
    throw new ApiError(response.status, message)
  }
  return response.json() as Promise<T>
}

const httpApi = {
  people: () => request<Person[]>('/people'),
  person: (id: string) => request<Person>(`/people/${encodeURIComponent(id)}`),
  like: (id: string, liked: boolean) => request<{ personId: string; liked: boolean }>(`/people/${encodeURIComponent(id)}/like`, { method: 'PUT', body: JSON.stringify({ liked }) }),
  profile: () => request<Profile>('/profile'),
  saveProfile: (profile: Partial<Profile>) => request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  saveSoulprint: (categories: Record<string, string>) => request('/soulprint', { method: 'PUT', body: JSON.stringify({ categories }) }),
  conversation: (id: string) => request<Conversation>(`/conversations/${encodeURIComponent(id)}`),
  sendMessage: (id: string, text: string) => request<Conversation>(`/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  places: () => request<Place[]>('/date-ideas'),
  plans: () => request<Plan[]>('/plans'),
  createPlan: (plan: Partial<Plan>) => request<Plan>('/plans', { method: 'POST', body: JSON.stringify(plan) }),
  settings: () => request<SettingsModel>('/settings'),
  saveSettings: (settings: Partial<SettingsModel>) => request<SettingsModel>('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
  suggestions: (person: string, context: string) => request<AiSuggestions>('/ai/suggestions', { method: 'POST', body: JSON.stringify({ person, context }) }),
}

// The Python API is opt-in: without VITE_USE_API=true the app runs on browser mock data only.
export const usesBackend = import.meta.env.VITE_USE_API === 'true'
export const api: typeof httpApi = usesBackend ? httpApi : mockApi

export function assetUrl(path: string): string {
  if (!path.startsWith('/') || path.startsWith('/api/')) return path
  return `${import.meta.env.BASE_URL}${path.slice(1)}`
}
