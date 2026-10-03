<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, CalendarDays, Check, ChevronRight, CircleEllipsis, Clock3, Heart, Home,
  Lightbulb, MapPin, MessageSquare, Plus, Search, Send, Settings, ShieldCheck,
  Sparkles, Users,
} from '@lucide/vue'
import SoulOrb from './components/SoulOrb.vue'
import { api, assetUrl } from './services/api'
import { demoAi, demoConversation, demoPeople, demoPlaces, demoPlans, demoProfile, demoSettings } from './data/demo'
import type { AiSuggestions, Conversation, Person, Place, Plan, Profile, SettingsModel } from './types'

const router = useRouter()
const route = useRoute()
const screen = computed(() => String(route.meta.screen || 'landing'))
const people = ref<Person[]>(structuredClone(demoPeople))
const places = ref<Place[]>(structuredClone(demoPlaces))
const plans = ref<Plan[]>(structuredClone(demoPlans))
const conversation = ref<Conversation>(structuredClone(demoConversation))
const settings = ref<SettingsModel>(structuredClone(demoSettings))
const profile = ref<Profile>(structuredClone(demoProfile))
const aiSuggestions = ref<AiSuggestions>(structuredClone(demoAi))
const online = ref(true)
const busy = ref(false)
const toast = ref('')
const search = ref('')
const connectionFilter = ref('Dating')
const onboarding = ref<'intro' | 'questions' | 'ready' | 'dashboard'>('intro')
const onboardingQuestion = ref(0)
const onboardingAnswer = ref('')
const answers = ref<string[]>([])
const message = ref('')
const selectedPlace = ref('cafe')
const selectedDate = ref('This Saturday')
const selectedTime = ref('4:00 PM')
const safetyOpen = ref(false)

const questions = [
  'What kind of people make you feel comfortable?',
  'How do you usually spend your free time?',
  'What are you looking for right now?',
]
const nav = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/people', label: 'People', icon: Users },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/plans', label: 'Plan', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: Settings },
]
const activePerson = computed(() => people.value.find((person) => person.id === String(route.params.id || 'daniel')) || people.value[0])
const filteredPeople = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return people.value
  return people.value.filter((person) => [person.name, person.job, person.city, ...person.tags].some((value) => value.toLowerCase().includes(query)))
})
const selectedIdea = computed(() => places.value.find((place) => place.id === selectedPlace.value) || places.value[0])

function go(path: string) { void router.push(path) }
function notify(text: string) { toast.value = text; window.setTimeout(() => { if (toast.value === text) toast.value = '' }, 2800) }

async function loadData() {
  const tasks = await Promise.allSettled([api.people(), api.profile(), api.places(), api.plans(), api.settings(), api.conversation('daniel')])
  const [peopleResult, profileResult, placesResult, plansResult, settingsResult, conversationResult] = tasks
  if (peopleResult.status === 'fulfilled') people.value = peopleResult.value
  if (profileResult.status === 'fulfilled') profile.value = profileResult.value
  if (placesResult.status === 'fulfilled') places.value = placesResult.value
  if (plansResult.status === 'fulfilled') plans.value = plansResult.value
  if (settingsResult.status === 'fulfilled') settings.value = settingsResult.value
  if (conversationResult.status === 'fulfilled') conversation.value = conversationResult.value
  online.value = tasks.some((result) => result.status === 'fulfilled')
  if (profile.value.onboardingComplete) onboarding.value = 'dashboard'
}

function chooseGoal(goal: string) {
  settings.value.goal = goal
  onboarding.value = 'questions'
}

async function submitAnswer() {
  const value = onboardingAnswer.value.trim()
  if (!value) return
  answers.value.push(value)
  onboardingAnswer.value = ''
  if (onboardingQuestion.value < questions.length - 1) {
    onboardingQuestion.value += 1
    return
  }
  busy.value = true
  const categories = {
    values: answers.value[0] || value,
    relationships: `${settings.value.goal} ${answers.value[2] || value}`,
    communication: `${answers.value[0] || value} honest thoughtful conversation`,
    boundaries: 'respect consent comfortable pace emotional safety',
    interests: answers.value[1] || value,
    lifestyle: answers.value[1] || value,
    social_energy: `${answers.value[0] || value} balanced connection`,
  }
  profile.value = { ...profile.value, answers: [...answers.value], onboardingComplete: true }
  const results = await Promise.allSettled([api.saveProfile(profile.value), api.saveSoulprint(categories), api.saveSettings({ goal: settings.value.goal })])
  online.value = results.some((result) => result.status === 'fulfilled')
  busy.value = false
  onboarding.value = 'ready'
}

function resetOnboarding() {
  profile.value.onboardingComplete = false
  answers.value = []
  onboardingQuestion.value = 0
  onboarding.value = 'intro'
  go('/home')
}

async function toggleLike(person: Person) {
  const next = !person.liked
  person.liked = next
  try { await api.like(person.id, next); notify(next ? `You liked ${person.name}` : `Removed ${person.name} from likes`) }
  catch { online.value = false; notify('Saved in this demo session') }
}

async function sendMessage() {
  const text = message.value.trim()
  if (!text) return
  message.value = ''
  const optimistic = { id: crypto.randomUUID(), from: 'me', text, time: 'Now' }
  conversation.value.messages.push(optimistic)
  try { conversation.value = await api.sendMessage('daniel', text) }
  catch { online.value = false }
}

async function loadSuggestions() {
  busy.value = true
  try {
    aiSuggestions.value = await api.suggestions('Daniel', conversation.value.messages.map((item) => `${item.from}: ${item.text}`).join('\n'))
  } catch { online.value = false; aiSuggestions.value = structuredClone(demoAi) }
  busy.value = false
}

async function createPlan() {
  const idea = selectedIdea.value
  if (!idea) return
  busy.value = true
  const draft: Partial<Plan> = { title: idea.title, personId: 'daniel', when: `${selectedDate.value} · ${selectedTime.value}`, place: idea.title, image: idea.image, safety: settings.value.checkins }
  try { plans.value.push(await api.createPlan(draft)); notify('Plan shared with Daniel') }
  catch { plans.value.push({ ...draft, id: crypto.randomUUID(), status: 'Planned' } as Plan); online.value = false; notify('Plan saved in this demo session') }
  busy.value = false
  go('/plans')
}

async function saveSetting(key: keyof SettingsModel, value: SettingsModel[keyof SettingsModel]) {
  ;(settings.value as unknown as Record<string, unknown>)[key] = value
  try { settings.value = await api.saveSettings({ [key]: value }); notify('Preference saved') }
  catch { online.value = false; notify('Saved in this demo session') }
}

watch(screen, (value) => { if (value === 'assistant') void loadSuggestions() })
onMounted(loadData)
</script>

<template>
  <main v-if="screen === 'landing'" class="landing cosmic-page">
    <div class="landing-frame">
      <div class="brand"><span class="brand-mark">S</span><span>Soulprint</span></div>
      <CircleEllipsis class="landing-more" aria-hidden="true" />
      <div class="landing-copy">
        <p class="eyebrow">A new kind of connection</p>
        <h1>More than a match.<br><em>A deeper you.</em></h1>
        <p>AI-powered connections for dating, friendship,<br>and everything in between.</p>
        <button class="primary large" @click="go('/home')">Get Started <ChevronRight /></button>
        <small>Real conversations.<br>Meaningful connections.<br>A safer experience.</small>
      </div>
    </div>
  </main>

  <main v-else class="app-shell cosmic-page">
    <aside class="rail">
      <div class="brand"><span class="brand-mark">S</span><span>Soulprint</span></div>
      <nav aria-label="Main navigation">
        <button v-for="item in nav" :key="item.to" :class="{ active: route.path.startsWith(item.to) }" @click="go(item.to)">
          <component :is="item.icon" /><span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="demo-chip"><span></span> Demo experience</div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <label class="searchbox"><Search /><input v-model="search" aria-label="Search" placeholder="Search people, interests, or topics..." /></label>
        <div class="top-actions">
          <span v-if="!online" class="offline">Offline demo</span>
          <button class="primary small" @click="notify('Invite link copied for the demo')"><Plus /> Invite a Friend</button>
          <CircleEllipsis class="more-icon" aria-hidden="true" />
          <button class="avatar-button" aria-label="Open settings" @click="go('/settings')"><img :src="assetUrl(profile.image)" alt="Your fictional demo profile" /></button>
        </div>
      </header>

      <section v-if="screen === 'home' && onboarding === 'intro'" class="onboarding glass-card star-field">
        <div class="progress"><i style="width: 7%"></i><span>1 / 15</span></div>
        <div class="prompt-row"><SoulOrb compact /><div class="prompt">Let’s get to know you better ✨</div></div>
        <div class="prompt-row"><SoulOrb compact /><div class="prompt"><b>What are you here for?</b><small>You can always change this later.</small></div></div>
        <div class="choice-grid">
          <button @click="chooseGoal('Dating')"><Heart /><span><b>Dating</b><small>Romantic relationships</small></span></button>
          <button @click="chooseGoal('Friendship')"><Users /><span><b>Friendship</b><small>Meaningful friendships</small></span></button>
          <button @click="chooseGoal('Both')"><Sparkles /><span><b>Both</b><small>Open to both</small></span></button>
        </div>
        <div class="composer disabled"><Plus /><span>Choose an option to continue</span><Send /></div>
      </section>

      <section v-else-if="screen === 'home' && onboarding === 'questions'" class="onboarding glass-card star-field">
        <div class="progress"><i :style="{ width: `${26 + onboardingQuestion * 16}%` }"></i><span>{{ onboardingQuestion + 4 }} / 15</span></div>
        <div class="answer-history">
          <template v-for="(answer, index) in answers" :key="answer">
            <div class="prompt-row"><SoulOrb compact /><div class="prompt">{{ questions[index] }}</div></div>
            <div class="reply">{{ answer }}</div>
          </template>
        </div>
        <div class="prompt-row current"><SoulOrb compact /><div class="prompt">{{ questions[onboardingQuestion] }}</div></div>
        <form class="composer" @submit.prevent="submitAnswer">
          <Plus /><input v-model="onboardingAnswer" :placeholder="busy ? 'Creating your Soulprint…' : 'Type your answer...'" :disabled="busy" aria-label="Your answer" /><button :disabled="busy || !onboardingAnswer.trim()" aria-label="Send answer"><Send /></button>
        </form>
      </section>

      <section v-else-if="screen === 'home' && onboarding === 'ready'" class="ready-view">
        <h1>Your Soulprint is ready.</h1>
        <article class="soulprint-hero glass-card">
          <SoulOrb />
          <div class="soulprint-copy">
            <p class="eyebrow">My Soulprint</p><h2>{{ profile.traits.slice(0, 3).join(' · ') }}</h2>
            <p>{{ profile.summary }}</p>
            <button class="primary" @click="onboarding = 'dashboard'">Discover your matches <ChevronRight /></button>
          </div>
          <div class="insight"><Lightbulb /><div><b>Connection style</b><small>Your connections thrive on honesty, curiosity, and room to grow.</small></div></div>
        </article>
      </section>

      <section v-else-if="screen === 'home'" class="dashboard-view">
        <div class="page-heading"><div><p class="eyebrow">Welcome back, {{ profile.name }}</p><h1>Your Connections, Redefined.</h1><p>Meaningful people. Deeper conversations. A safer journey.</p></div></div>
        <div class="dashboard-grid">
          <article class="glass-card soul-summary"><div><h2>Your Soulprint</h2><SoulOrb /></div><div><ul><li v-for="trait in profile.traits" :key="trait">{{ trait }}</li></ul><button class="text-button" @click="resetOnboarding">Refine Soulprint <ChevronRight /></button></div></article>
          <article class="glass-card"><h2>Today’s Suggestions</h2><div class="suggestion-row"><button v-for="person in people.slice(0,3)" :key="person.id" @click="go(`/people/${person.id}`)"><img :src="assetUrl(person.image)" :alt="`${person.name}, fictional demo profile`" /><span><b>{{ person.name }}, {{ person.age }}</b><strong>{{ person.match }}% match</strong></span></button></div></article>
          <article class="glass-card checkin"><CalendarDays /><div><b>Upcoming Check-in</b><small>Today at 8:00 PM</small></div><button class="secondary" @click="go('/plans')">View</button></article>
          <article class="glass-card activity"><div><b>Recent Activity</b><small>3 new people liked your Soulprint</small></div><div><b>2 new messages</b><small>Continue the conversation</small></div><ChevronRight /></article>
        </div>
      </section>

      <section v-else-if="screen === 'people'" class="people-view">
        <div class="page-heading"><div><h1>People who get you.</h1><p>Based on weighted semantic compatibility between Soulprints.</p></div></div>
        <div class="tabs" role="tablist"><button v-for="filter in ['Dating','Friendship','Both']" :key="filter" :class="{ selected: connectionFilter === filter }" @click="connectionFilter = filter">{{ filter }}</button></div>
        <div v-if="filteredPeople.length" class="people-grid">
          <article v-for="person in filteredPeople" :key="person.id" class="person-card">
            <button class="heart-button" :class="{ liked: person.liked }" :aria-label="`${person.liked ? 'Unlike' : 'Like'} ${person.name}`" @click="toggleLike(person)"><Heart :fill="person.liked ? 'currentColor' : 'none'" /></button>
            <span class="fictional-badge">Fictional demo</span>
            <img :src="assetUrl(person.image)" :alt="`${person.name}, fictional demo profile`" />
            <div class="person-info"><h2>{{ person.name }}, {{ person.age }}</h2><strong>{{ person.match }}% match</strong><p>{{ person.job }} · {{ person.distance }}</p><div class="tag-list"><span v-for="tag in person.tags" :key="tag">{{ tag }}</span></div><button class="primary full" @click="go(`/people/${person.id}`)">View profile <ChevronRight /></button></div>
          </article>
        </div>
        <div v-else class="empty glass-card"><Search /><h2>No people match that search</h2><button class="secondary" @click="search = ''">Clear search</button></div>
      </section>

      <section v-else-if="screen === 'profile'" class="profile-view">
        <button class="back-button" @click="go('/people')"><ArrowLeft /> Back to people</button>
        <div class="profile-grid">
          <div class="profile-media"><div class="profile-image-wrap"><span class="fictional-badge">Fictional demo profile</span><img :src="assetUrl(activePerson.image)" :alt="`${activePerson.name}, fictional demo profile`" /></div><button class="primary full" @click="toggleLike(activePerson)"><Heart :fill="activePerson.liked ? 'currentColor' : 'none'" />{{ activePerson.liked ? 'Liked' : 'Send a Like' }}</button></div>
          <article class="profile-copy"><div class="profile-title"><div><h1>{{ activePerson.name }}, {{ activePerson.age }}</h1><strong>{{ activePerson.match }}% Soulprint Match</strong></div><button class="heart-button" @click="toggleLike(activePerson)"><Heart /></button><button class="round-button" aria-label="More options"><CircleEllipsis /></button></div><p><MapPin />{{ activePerson.city }}, {{ activePerson.distance }} · {{ activePerson.job }}</p><div class="tag-list"><span v-for="tag in activePerson.tags" :key="tag">{{ tag }}</span></div><hr><h2>Why you might connect</h2><ul class="reason-list"><li v-for="reason in activePerson.reasons" :key="reason"><Sparkles />{{ reason }}</li></ul><p class="gentle-note">A thoughtful match to explore at your own pace.</p></article>
        </div>
      </section>

      <section v-else-if="screen === 'chat'" class="chat-layout">
        <article class="chat-card glass-card"><div class="chat-header"><img :src="assetUrl(people[0].image)" alt="Daniel, fictional demo profile"><div><h2>Daniel, 31</h2><small><i></i> Online</small></div><button class="round-button"><Heart /></button><CircleEllipsis /></div><div class="message-list"><div v-for="item in conversation.messages" :key="item.id" class="message" :class="{ mine: item.from === 'me' }"><img v-if="item.from !== 'me'" :src="assetUrl(people[0].image)" alt=""><div><p>{{ item.text }}</p><small>{{ item.time }}</small></div></div></div><form class="composer chat-composer" @submit.prevent="sendMessage"><Plus /><input v-model="message" placeholder="Message Daniel..." aria-label="Message Daniel" /><button :disabled="!message.trim()"><Send /></button></form></article>
        <aside v-if="!safetyOpen" class="chat-tools"><button @click="go('/assistant')"><Lightbulb /><span><b>AI Assistant</b><small>Conversation ideas & gentle help</small></span><ChevronRight /></button><button @click="go('/date-plan')"><CalendarDays /><span><b>Plan Date</b><small>Make a plan together</small></span><ChevronRight /></button><button @click="safetyOpen = true"><ShieldCheck /><span><b>Safety</b><small>Your safety tools</small></span><ChevronRight /></button></aside>
        <aside v-else class="safety-panel glass-card"><div class="safety-title"><ShieldCheck /><div><h2>Date Safety</h2><small>With Daniel · demo controls</small></div></div><p class="demo-warning">These controls demonstrate the intended experience. They do not contact emergency services or share live location.</p><label><span><b>Trusted contact</b><small>Choose someone you trust</small></span><input type="checkbox" :checked="settings.trustedContact" @change="saveSetting('trustedContact', ($event.target as HTMLInputElement).checked)"></label><label><span><b>Scheduled check-in</b><small>Check in after 2 hours</small></span><input type="checkbox" :checked="settings.checkins" @change="saveSetting('checkins', ($event.target as HTMLInputElement).checked)"></label><label><span><b>Live location sharing</b><small>Demo only during your date</small></span><input type="checkbox" :checked="settings.locationSharing" @change="saveSetting('locationSharing', ($event.target as HTMLInputElement).checked)"></label><label><span><b>Emergency shortcut</b><small>Demo quick access from chat</small></span><input type="checkbox" :checked="settings.emergencyShortcut" @change="saveSetting('emergencyShortcut', ($event.target as HTMLInputElement).checked)"></label><button class="secondary full" @click="safetyOpen = false">Back to tools</button></aside>
      </section>

      <section v-else-if="screen === 'assistant'" class="assistant-view glass-card">
        <button class="back-button" @click="go('/chat')"><ArrowLeft /> Return to chat with Daniel</button><div class="feature-title"><Lightbulb /><div><h1>AI Assistant</h1><p>Based on your conversation with Daniel</p></div></div><p class="section-label">Shared interests from your chat</p><div class="idea-grid"><article v-for="idea in aiSuggestions.ideas" :key="idea.title"><Lightbulb /><h2>{{ idea.title }}</h2><p>{{ idea.body }}</p></article></div><p v-if="aiSuggestions.disclaimer" class="demo-note">{{ aiSuggestions.disclaimer }}</p>
      </section>

      <section v-else-if="screen === 'date'" class="date-view glass-card">
        <button class="back-button" @click="go('/chat')"><ArrowLeft /> Return to chat with Daniel</button><h1>Plan a date with Daniel</h1><p>Ideas based on what you both enjoy.</p><div class="tabs"><button class="selected">AI</button><button>Outdoor</button><button>Culture</button><button>Food</button><button>At home</button></div><div class="place-grid"><button v-for="place in places" :key="place.id" :class="{ selected: selectedPlace === place.id }" @click="selectedPlace = place.id"><span class="selected-check" v-if="selectedPlace === place.id"><Check /></span><img :src="assetUrl(place.image)" :alt="`${place.title}, demo illustration`"><div><h2>{{ place.title }}</h2><p>{{ place.description }}</p><small><Heart />{{ place.fit }}% fit <Clock3 />{{ place.duration }}</small></div></button></div><div class="plan-bar"><div><h2>Plan together</h2><small>Pick a time that works for you both.</small></div><select v-model="selectedDate" aria-label="Plan date"><option>This Saturday</option><option>Next Sunday</option></select><select v-model="selectedTime" aria-label="Plan time"><option>4:00 PM</option><option>6:30 PM</option></select><button class="primary" :disabled="busy" @click="createPlan"><Send /> Share plan with Daniel</button></div>
      </section>

      <section v-else-if="screen === 'plans'" class="plans-view">
        <div class="page-heading"><div><h1>Your Plans</h1><p>Make time for the connections that matter.</p></div><button class="primary" @click="go('/date-plan')"><Plus /> Add a new plan</button></div><h2>Today</h2><article v-for="plan in plans" :key="plan.id" class="plan-card glass-card"><img :src="assetUrl(plan.image || places[0].image)" :alt="`${plan.title}, demo illustration`"><div><p class="eyebrow">With {{ people.find((person) => person.id === plan.personId)?.name || 'a connection' }}</p><h2>{{ plan.title }}</h2><p><CalendarDays />{{ plan.when }} <ShieldCheck v-if="plan.safety" />{{ plan.safety ? 'Safety on' : '' }}</p><small>{{ plan.place }}</small></div><div><strong><Check v-if="plan.status === 'Confirmed'" />{{ plan.status }}</strong><button class="secondary">View plan <ChevronRight /></button></div></article>
      </section>

      <section v-else class="settings-view">
        <div class="page-heading"><div><h1>Settings</h1><p>Make Soulprint feel right for you.</p></div></div><div class="settings-grid"><article class="glass-card"><h2>Profile & Soulprint</h2><button @click="resetOnboarding"><Sparkles /><span><b>Update my Soulprint</b><small>Answer new questions or refine your answers</small></span><ChevronRight /></button><button><Users /><span><b>Demo profile</b><small>Fictional data used for this MVP</small></span><ChevronRight /></button></article><article class="glass-card"><h2>Privacy & Safety</h2><label><ShieldCheck /><span><b>Location sharing</b><small>Demo only during dates</small></span><input type="checkbox" :checked="settings.locationSharing" @change="saveSetting('locationSharing', ($event.target as HTMLInputElement).checked)"></label><label><Users /><span><b>Trusted contact</b><small>Demo safety preference</small></span><input type="checkbox" :checked="settings.trustedContact" @change="saveSetting('trustedContact', ($event.target as HTMLInputElement).checked)"></label></article><article class="glass-card"><h2>Discovery preferences</h2><div class="setting-row"><Heart /><span><b>Connection goal</b><small>What are you here for?</small></span><select :value="settings.goal" @change="saveSetting('goal', ($event.target as HTMLSelectElement).value)"><option>Dating</option><option>Friendship</option><option>Both</option></select></div><label><MapPin /><span><b>Distance</b><small>{{ settings.distance }} km</small></span><input type="range" min="5" max="100" :value="settings.distance" @change="saveSetting('distance', Number(($event.target as HTMLInputElement).value))"></label></article><article class="glass-card"><h2>Notifications</h2><label><MessageSquare /><span><b>Messages</b><small>New messages and chat activity</small></span><input type="checkbox" :checked="settings.messages" @change="saveSetting('messages', ($event.target as HTMLInputElement).checked)"></label><label><CalendarDays /><span><b>Date check-ins</b><small>Reminders and safety check-ins</small></span><input type="checkbox" :checked="settings.checkins" @change="saveSetting('checkins', ($event.target as HTMLInputElement).checked)"></label><label><Sparkles /><span><b>Recommendations</b><small>New people and experiences</small></span><input type="checkbox" :checked="settings.recommendations" @change="saveSetting('recommendations', ($event.target as HTMLInputElement).checked)"></label></article></div>
      </section>
    </section>
    <Transition name="toast"><div v-if="toast" class="toast" role="status"><Check />{{ toast }}</div></Transition>
  </main>
</template>
