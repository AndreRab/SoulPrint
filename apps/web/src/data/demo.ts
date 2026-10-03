import type { AiSuggestions, Conversation, Person, Place, Plan, Profile, SettingsModel } from '../types'

export const demoPeople: Person[] = [
  { id: 'daniel', name: 'Daniel', age: 31, city: 'Berlin', distance: '3 km', job: 'Product Designer', match: 88, image: '/images/avatars/daniel.svg', tags: ['Nature', 'Good food', 'Meaningful relationships', 'Long-term oriented'], bio: 'Thoughtful, curious, and happiest near a good meal or a long walk.', reasons: ['You both value deep conversations and personal growth.', 'You share a long-term outlook and respect independence.', 'You both enjoy nature, good food, and meaningful experiences.', 'Your communication styles complement each other.'] },
  { id: 'emma', name: 'Emma', age: 28, city: 'Berlin', distance: '5 km', job: 'Curator', match: 93, image: '/images/avatars/emma.svg', tags: ['Deep conversations', 'Travel', 'Art', 'Mental health'], bio: 'Art lover with a calm, warm way of making every day feel considered.', reasons: ['You make room for curiosity.', 'You both enjoy intentional time together.'] },
  { id: 'sophie', name: 'Sophie', age: 26, city: 'Berlin', distance: '7 km', job: 'Photographer', match: 87, image: '/images/avatars/sophie.svg', tags: ['Art', 'Personal growth', 'Spontaneous plans', 'Nature'], bio: 'A quietly adventurous photographer looking for shared stories.', reasons: ['You both look for meaning in small moments.', 'Your energy balances well.'] },
  { id: 'james', name: 'James', age: 30, city: 'Berlin', distance: '4 km', job: 'Engineer', match: 86, image: '/images/avatars/james.svg', tags: ['Tech', 'Hiking', 'Meaningful relationships', 'Adventure'], bio: 'A builder, hiker and attentive listener with a playful side.', reasons: ['You share a practical curiosity.', 'Your pacing is mutually comfortable.'] },
]

export const demoPlaces: Place[] = [
  { id: 'cafe', title: 'Café & Walk in Kreuzberg', description: 'A relaxed first date with good food and an easy canal-side walk.', image: '/images/places/cafe.svg', fit: 92, duration: '1.5–2 hours', kind: 'Casual' },
  { id: 'walk', title: 'Sunset Walk by the Canal', description: 'Nature, fresh air, and space for a real conversation.', image: '/images/places/canal.svg', fit: 89, duration: '1–1.5 hours', kind: 'Outdoor' },
  { id: 'gallery', title: 'Contemporary Art & Coffee', description: 'A shared curiosity with a relaxed place to talk afterward.', image: '/images/places/gallery.svg', fit: 86, duration: 'About 2 hours', kind: 'Culture' },
]

export const demoConversation: Conversation = { personId: 'daniel', messages: [
  { id: 'm1', from: 'daniel', text: 'Hey! I saw you enjoy nature and good food. Is there a place in Berlin you always go back to?', time: '10:14 AM' },
  { id: 'm2', from: 'me', text: 'There’s a little Italian place near Kreuzberg I love. I usually pair it with a walk along the canal.', time: '10:16 AM' },
  { id: 'm3', from: 'daniel', text: 'That sounds great. I’m always up for a walk by the water. Want to try it together this weekend?', time: '10:18 AM' },
  { id: 'm4', from: 'me', text: 'I’d like that! Let’s plan something relaxed.', time: '10:19 AM' },
] }

export const demoPlans: Plan[] = [
  { id: 'today', title: 'Café & Walk in Kreuzberg', personId: 'daniel', when: 'Today · 4:00 PM', place: 'Kreuzberg canal', status: 'Confirmed', image: '/images/places/cafe.svg', safety: true },
  { id: 'upcoming', title: 'Museum & Coffee', personId: 'sophie', when: 'Saturday · 3:00 PM', place: 'Contemporary Art Museum', status: 'Planned', image: '/images/places/gallery.svg', safety: false },
]

export const demoSettings: SettingsModel = { goal: 'Both', ageRange: [25, 40], distance: 25, messages: true, checkins: true, recommendations: false, locationSharing: false, trustedContact: true, emergencyShortcut: true, theme: 'dark' }
export const demoProfile: Profile = { name: 'Maya', image: '/images/avatars/me.svg', onboardingComplete: false, answers: [], traits: ['Independent', 'Curious', 'Direct communicator', 'Long-term oriented', 'High openness'], summary: 'You value deep conversations, meaningful experiences, and personal growth.' }
export const demoAi: AiSuggestions = { mode: 'demo', disclaimer: 'Demo suggestions are shown until an AI provider is configured.', person: 'Daniel', ideas: [
  { title: 'Italian food', body: 'You both enjoy good food. Compare favorite Italian dishes or cafés around Kreuzberg.' },
  { title: 'Nature & walks', body: 'Ask Daniel about a favorite canal-side route or green space.' },
  { title: 'Meaningful conversations', body: 'Explore what makes a weekend feel memorable for each of you.' },
] }
