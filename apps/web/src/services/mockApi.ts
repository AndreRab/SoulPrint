import { demoAi, demoConversation, demoPeople, demoPlaces, demoPlans, demoProfile, demoSettings } from '../data/demo'
import type { AiSuggestions, Conversation, Person, Place, Plan, Profile, SettingsModel } from '../types'

// Browser-only stand-in for the Python API. State lives in localStorage so a static
// GitHub Pages build keeps likes, plans, settings and messages between reloads.
type MockState = {
  likes: string[]
  profile: Profile
  settings: SettingsModel
  plans: Plan[]
  conversation: Conversation
}

const storageKey = 'soulprint-demo-v1'
const replies = [
  'That sounds lovely. I’m in!',
  'Ha, I like how you think. Tell me more?',
  'Perfect. Let’s keep it relaxed and see where the day takes us.',
  'Good idea. I’ll bring my appetite for good coffee.',
]

function initialState(): MockState {
  return {
    likes: [],
    profile: structuredClone(demoProfile),
    settings: structuredClone(demoSettings),
    plans: structuredClone(demoPlans),
    conversation: structuredClone(demoConversation),
  }
}

function load(): MockState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) return { ...initialState(), ...JSON.parse(saved) }
  } catch { /* storage unavailable: fall back to a fresh demo */ }
  return initialState()
}

const state = load()

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)) } catch { /* demo still works in memory */ }
}

function respond<T>(value: T, delay = 120): Promise<T> {
  return new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), delay))
}

function timeNow() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function withLike(person: Person): Person {
  return { ...person, liked: state.likes.includes(person.id) }
}

export const mockApi = {
  people: () => respond(demoPeople.map(withLike)),
  person: (id: string) => {
    const person = demoPeople.find((item) => item.id === id)
    return person ? respond(withLike(person)) : Promise.reject(new Error('Person not found'))
  },
  like: (id: string, liked: boolean) => {
    state.likes = liked ? [...new Set([...state.likes, id])] : state.likes.filter((item) => item !== id)
    save()
    return respond({ personId: id, liked })
  },
  profile: () => respond(state.profile),
  saveProfile: (profile: Partial<Profile>) => {
    state.profile = { ...state.profile, ...profile }
    save()
    return respond(state.profile)
  },
  saveSoulprint: (categories: Record<string, string>) => respond({ categories }),
  conversation: (id: string) => respond({ ...state.conversation, personId: id }),
  sendMessage: (id: string, text: string) => {
    state.conversation.messages.push({ id: crypto.randomUUID(), from: 'me', text, time: timeNow() })
    const replyCount = state.conversation.messages.filter((item) => item.from !== 'me').length
    state.conversation.messages.push({ id: crypto.randomUUID(), from: id, text: replies[replyCount % replies.length], time: timeNow() })
    save()
    return respond(state.conversation, 700)
  },
  places: () => respond<Place[]>(demoPlaces),
  plans: () => respond(state.plans),
  createPlan: (plan: Partial<Plan>) => {
    const created = { id: crypto.randomUUID(), status: 'Planned', image: '', safety: false, title: '', personId: '', when: '', place: '', ...plan } as Plan
    state.plans.push(created)
    save()
    return respond(created)
  },
  settings: () => respond(state.settings),
  saveSettings: (settings: Partial<SettingsModel>) => {
    state.settings = { ...state.settings, ...settings }
    save()
    return respond(state.settings)
  },
  suggestions: (person: string, _context: string) => respond<AiSuggestions>({ ...demoAi, person }, 500),
}
