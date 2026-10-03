export type MatchDetails = { distance: number; similarity: number; score: number; mode: string }

export type Person = {
  id: string
  name: string
  age: number
  city: string
  distance: string
  job: string
  match: number
  image: string
  tags: string[]
  bio: string
  reasons: string[]
  liked?: boolean
  matching?: MatchDetails
}

export type Message = { id: string; from: string; text: string; time: string }
export type Conversation = { personId: string; messages: Message[] }

export type Place = {
  id: string
  title: string
  description: string
  image: string
  fit: number
  duration: string
  kind: string
}

export type Plan = {
  id: string
  title: string
  personId: string
  when: string
  place: string
  status: string
  image: string
  safety: boolean
}

export type SettingsModel = {
  goal: string
  ageRange: [number, number]
  distance: number
  messages: boolean
  checkins: boolean
  recommendations: boolean
  locationSharing: boolean
  trustedContact: boolean
  emergencyShortcut: boolean
  theme: string
}

export type Profile = {
  name: string
  image: string
  onboardingComplete: boolean
  answers: string[]
  traits: string[]
  summary: string
}

export type AiIdea = { title: string; body: string }
export type AiSuggestions = { mode: string; disclaimer: string | null; person: string; ideas: AiIdea[] }
