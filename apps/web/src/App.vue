<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, ArrowRight, ArrowUp, Bell, Blend, BriefcaseBusiness, Cake, CalendarDays, Check, CheckCheck,
  ChevronDown, ChevronRight, Clock3, Cuboid, Ellipsis, EllipsisVertical, Eye, Globe, Heart, HeartPulse,
  House, Info, Leaf, Lightbulb, Lock, LogOut, Mail, MapPin, MessageCircle, MessageSquareHeart, Mic, Moon,
  Pencil, Plus, Search, Send, SendHorizontal, Settings, Shield, ShieldCheck, ShieldPlus, Sparkles, Star,
  Target, UserRound, UsersRound, UtensilsCrossed, Video,
} from '@lucide/vue'
import BrandMark from './components/BrandMark.vue'
import SoulOrb from './components/SoulOrb.vue'
import ToggleSwitch from './components/ToggleSwitch.vue'
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
const assistantQuestion = ref('')
const selectedPlace = ref('cafe')
const placeFilter = ref('AI')
const savedPlaces = ref<string[]>([])
const planPersonId = ref('daniel')
const selectedDate = ref('This Saturday')
const selectedTime = ref('4:00 PM')
const safetyOpen = ref(false)
const historyEl = ref<HTMLElement | null>(null)

const questions = [
  'What kind of people make you feel comfortable?',
  'How do you usually spend your free time?',
  'What are you looking for right now?',
]
const nav = [
  { to: '/home', label: 'Home', icon: House, match: ['/home'] },
  { to: '/people', label: 'People', icon: UsersRound, match: ['/people'] },
  { to: '/chat', label: 'Chat', icon: MessageSquareHeart, match: ['/chat', '/assistant', '/date-plan'] },
  { to: '/plans', label: 'Plan', icon: ShieldPlus, match: ['/plans'] },
  { to: '/settings', label: 'Settings', icon: Settings, match: ['/settings'] },
]
const categories = [
  { label: 'Values', tone: 'violet' }, { label: 'Communication', tone: 'cyan' }, { label: 'Interests', tone: 'pink' },
  { label: 'Relationships', tone: 'violet' }, { label: 'Lifestyle', tone: 'cyan' }, { label: 'Social Energy', tone: 'violet' },
]
const placeFilters = ['AI', 'Outdoor', 'Culture', 'Food', 'At home']
const placeKinds: Record<string, string[]> = { Outdoor: ['Outdoor'], Culture: ['Culture'], Food: ['Casual', 'Food'], 'At home': ['At home'] }
const reasonIcons = [MessageSquareHeart, Heart, Leaf, UsersRound]
const assistantPrompts = [
  { icon: Leaf, tone: 'cyan', text: 'What’s your favorite place in Berlin to unwind outdoors?' },
  { icon: UtensilsCrossed, tone: 'coral', text: 'What’s a meal you love making or discovering with someone?' },
  { icon: MessageCircle, tone: 'violet', text: 'What kind of conversations make you lose track of time?' },
]
const safetyRows = [
  { key: 'shareDetails', icon: House, tone: 'violet', title: 'Share date details', hint: 'Your date plan is saved privately' },
  { key: 'trustedContact', icon: UsersRound, tone: 'violet', title: 'Trusted contact', hint: 'Choose someone you trust' },
  { key: 'checkins', icon: ShieldCheck, tone: 'violet', title: 'Scheduled check-in', hint: 'Check in after 2 hours' },
  { key: 'locationSharing', icon: MapPin, tone: 'coral', title: 'Live location sharing', hint: 'Demo only, during your date' },
  { key: 'emergencyShortcut', icon: HeartPulse, tone: 'coral', title: 'Emergency shortcut', hint: 'Demo quick access from chat' },
] as const
const notificationRows = [
  { key: 'messages', icon: MessageCircle, title: 'Messages', hint: 'New messages and chat activity' },
  { key: 'checkins', icon: Bell, title: 'Date check-ins', hint: 'Reminders and safety check-ins' },
  { key: 'recommendations', icon: Star, title: 'Recommendations', hint: 'New people and experiences for you' },
] as const
const visibilityOptions = ['Everyone', 'Matches only', 'Only me']

const activePerson = computed(() => people.value.find((person) => person.id === String(route.params.id || 'daniel')) || people.value[0])
const chatPerson = computed(() => personFor(conversation.value.personId) || people.value[0])
const planPerson = computed(() => personFor(planPersonId.value) || people.value[0])
const filteredPeople = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return people.value
  return people.value.filter((person) => [person.name, person.job, person.city, ...person.tags].some((value) => value.toLowerCase().includes(query)))
})
const visiblePlaces = computed(() => placeFilter.value === 'AI'
  ? [...places.value].sort((a, b) => b.fit - a.fit)
  : places.value.filter((place) => placeKinds[placeFilter.value]?.includes(place.kind)))
const selectedIdea = computed(() => places.value.find((place) => place.id === selectedPlace.value) || places.value[0])
const todayPlans = computed(() => plans.value.filter((plan) => plan.when.startsWith('Today')))
const upcomingPlans = computed(() => plans.value.filter((plan) => !plan.when.startsWith('Today')))
const sharedInterests = computed(() => aiSuggestions.value.ideas.map((idea) => idea.title.toLowerCase()).slice(0, 3).join(', ').replace(/, ([^,]*)$/, ', and $1'))

function go(path: string) { void router.push(path) }
function notify(text: string) { toast.value = text; window.setTimeout(() => { if (toast.value === text) toast.value = '' }, 2800) }
function personFor(id: string) { return people.value.find((person) => person.id === id) }
function placeFor(plan: Plan) { return places.value.find((place) => place.title === plan.title || place.image === plan.image) }
function ideaIcon(title: string) {
  if (/food|meal|italian|caf|dinner|cook/i.test(title)) return UtensilsCrossed
  if (/nature|walk|outdoor|park|canal|hike/i.test(title)) return Leaf
  return MessageCircle
}
function kindTone(kind: string) { return kind === 'Outdoor' ? 'coral' : kind === 'Culture' ? 'violet' : 'neutral' }

async function loadData() {
  const tasks = await Promise.allSettled([api.people(), api.profile(), api.places(), api.plans(), api.settings(), api.conversation('daniel')])
  const [peopleResult, profileResult, placesResult, plansResult, settingsResult, conversationResult] = tasks
  if (peopleResult.status === 'fulfilled') people.value = peopleResult.value
  if (profileResult.status === 'fulfilled') profile.value = profileResult.value
  if (placesResult.status === 'fulfilled') places.value = placesResult.value
  if (plansResult.status === 'fulfilled') plans.value = plansResult.value
  if (settingsResult.status === 'fulfilled') settings.value = { ...demoSettings, ...settingsResult.value }
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

function usePrompt(text: string) {
  message.value = text
  go('/chat')
}

async function loadSuggestions(extra = '') {
  busy.value = true
  try {
    const context = conversation.value.messages.map((item) => `${item.from}: ${item.text}`).join('\n')
    aiSuggestions.value = await api.suggestions(chatPerson.value.name, extra ? `${context}\nme (to assistant): ${extra}` : context)
  } catch { online.value = false; aiSuggestions.value = structuredClone(demoAi) }
  busy.value = false
}

async function askAssistant() {
  const text = assistantQuestion.value.trim()
  if (!text) return
  assistantQuestion.value = ''
  await loadSuggestions(text)
  notify('Fresh ideas are ready')
}

function chooseSomeoneElse() {
  const index = people.value.findIndex((person) => person.id === planPersonId.value)
  planPersonId.value = people.value[(index + 1) % people.value.length].id
}

function toggleSavedPlace(id: string) {
  savedPlaces.value = savedPlaces.value.includes(id) ? savedPlaces.value.filter((item) => item !== id) : [...savedPlaces.value, id]
}

async function createPlan(personId = planPersonId.value) {
  const idea = selectedIdea.value
  if (!idea) return
  busy.value = true
  const name = personFor(personId)?.name || 'your match'
  const draft: Partial<Plan> = { title: idea.title, personId, when: `${selectedDate.value} · ${selectedTime.value}`, place: idea.title, image: idea.image, safety: settings.value.checkins }
  try { plans.value.push(await api.createPlan(draft)); notify(`Plan shared with ${name}`) }
  catch { plans.value.push({ ...draft, id: crypto.randomUUID(), status: 'Planned' } as Plan); online.value = false; notify('Plan saved in this demo session') }
  busy.value = false
  go('/plans')
}

async function saveSetting(key: keyof SettingsModel, value: SettingsModel[keyof SettingsModel]) {
  ;(settings.value as unknown as Record<string, unknown>)[key] = value
  try { settings.value = { ...settings.value, ...(await api.saveSettings({ [key]: value })) }; notify('Preference saved') }
  catch { online.value = false; notify('Saved in this demo session') }
}

function saveAge(edge: 0 | 1, value: number) {
  const range: [number, number] = [...settings.value.ageRange]
  range[edge] = value
  if (range[0] > range[1]) range[edge === 0 ? 1 : 0] = value
  void saveSetting('ageRange', range)
}

function cycleVisibility() {
  const index = visibilityOptions.indexOf(settings.value.visibility || 'Everyone')
  void saveSetting('visibility', visibilityOptions[(index + 1) % visibilityOptions.length])
}

function openSafety() {
  safetyOpen.value = true
  go('/chat')
}

watch(screen, (value) => { if (value === 'assistant') void loadSuggestions() })
watch([() => answers.value.length, busy], async () => { await nextTick(); historyEl.value?.scrollTo({ top: historyEl.value.scrollHeight, behavior: 'smooth' }) })
onMounted(loadData)
</script>

<template>
  <main v-if="screen === 'landing'" class="landing">
    <div class="landing-frame">
      <div class="landing-sparks" aria-hidden="true"><i v-for="index in 14" :key="index"></i></div>
      <div class="brand"><BrandMark /><span>Soulprint</span></div>
      <Ellipsis class="landing-more" aria-hidden="true" />
      <div class="landing-copy">
        <h1>More than a match.<br><em>A deeper you.</em></h1>
        <p>AI-powered connections for dating, friendship,<br>and everything in between.</p>
        <button class="primary large" @click="go('/home')">Get Started <ArrowRight /></button>
        <small>Real conversations.<br>Meaningful connections.<br>A safer experience.</small>
      </div>
    </div>
  </main>

  <main v-else class="app-shell cosmic-page">
    <aside class="rail">
      <div class="brand"><BrandMark /><span>Soulprint</span></div>
      <nav aria-label="Main navigation">
        <button
          v-for="item in nav"
          :key="item.to"
          :class="{ active: item.match.some((path) => route.path.startsWith(path)) }"
          @click="go(item.to)"
        ><component :is="item.icon" /><span>{{ item.label }}</span></button>
      </nav>
      <div class="demo-chip"><span></span> Demo experience</div>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <label class="searchbox"><Search /><input v-model="search" aria-label="Search" placeholder="Search people, interests, or topics..." /></label>
        <div class="top-actions">
          <span v-if="!online" class="offline">Offline demo</span>
          <button class="primary small" @click="notify('Invite link copied for the demo')"><Plus /> Invite a Friend</button>
          <button class="icon-button" aria-label="More options" @click="notify('More options are coming soon')"><EllipsisVertical /></button>
          <button class="avatar-button" aria-label="Open settings" @click="go('/settings')"><img :src="assetUrl(profile.image)" alt="Your fictional demo profile" /></button>
        </div>
      </header>

      <!-- Onboarding: goal -->
      <section v-if="screen === 'home' && onboarding === 'intro'" class="onboarding panel star-field">
        <div class="progress"><i style="width: 7%"></i><span>1 / 15</span></div>
        <div class="prompt-row"><SoulOrb compact /><div class="prompt">Let’s get to know you better ✨</div></div>
        <div class="prompt-row"><SoulOrb compact /><div class="prompt"><b>What are you here for?</b><small>You can always change this later.</small></div></div>
        <div class="choice-grid">
          <button class="pink" @click="chooseGoal('Dating')"><Heart /><span><b>Dating</b><small>Romantic relationships</small></span></button>
          <button class="cyan" @click="chooseGoal('Friendship')"><UsersRound /><span><b>Friendship</b><small>Meaningful friendships</small></span></button>
          <button class="violet" @click="chooseGoal('Both')"><Blend /><span><b>Both</b><small>Open to both</small></span></button>
        </div>
        <div class="composer disabled"><span class="composer-plus"><Plus /></span><span>Choose an option to continue</span><span class="composer-send muted"><ArrowUp /></span></div>
      </section>

      <!-- Onboarding: questions -->
      <section v-else-if="screen === 'home' && onboarding === 'questions'" class="onboarding panel star-field">
        <div class="progress"><i :style="{ width: `${20 + onboardingQuestion * 7}%` }"></i><span>{{ onboardingQuestion + 2 }} / 15</span></div>
        <div ref="historyEl" class="answer-history">
          <template v-for="(answer, index) in answers" :key="`${index}-${answer}`">
            <div class="prompt-row"><SoulOrb compact /><div class="prompt">{{ questions[index] }}</div></div>
            <div class="reply">{{ answer }}</div>
          </template>
          <div class="prompt-row current"><SoulOrb compact /><div class="prompt">{{ questions[onboardingQuestion] }}</div></div>
          <div v-if="busy" class="typing" aria-label="Creating your Soulprint"><i></i><i></i><i></i></div>
        </div>
        <form class="composer" @submit.prevent="submitAnswer">
          <span class="composer-plus"><Plus /></span>
          <input v-model="onboardingAnswer" :placeholder="busy ? 'Creating your Soulprint…' : 'Type your answer...'" :disabled="busy" aria-label="Your answer" />
          <button class="composer-send" :disabled="busy || !onboardingAnswer.trim()" aria-label="Send answer"><ArrowUp /></button>
        </form>
      </section>

      <!-- Soulprint ready -->
      <section v-else-if="screen === 'home' && onboarding === 'ready'" class="ready-view">
        <h1>Your Soulprint is ready.</h1>
        <article class="panel ready-card">
          <SoulOrb labels />
          <div class="ready-body">
            <div>
              <h2>My Soulprint</h2>
              <p class="trait-line"><template v-for="(trait, index) in profile.traits" :key="trait"><span v-if="index"> · </span>{{ trait }}</template></p>
              <p>{{ profile.summary }}<br>You’re drawn to kind, ambitious people who appreciate both adventure and stability.</p>
              <div class="button-row">
                <button class="secondary" @click="resetOnboarding"><Pencil /> Edit Soulprint</button>
                <button class="primary" @click="onboarding = 'dashboard'">Discover your matches <ArrowRight /></button>
              </div>
            </div>
            <div class="insight"><span class="icon-chip violet"><Lightbulb /></span><div><b>Connection style</b><small>Your connections thrive on honesty, curiosity, and room to grow.</small></div></div>
          </div>
        </article>
      </section>

      <!-- Home dashboard -->
      <section v-else-if="screen === 'home'" class="dashboard-view">
        <div class="page-heading"><div><h1>Your Connections, Redefined.</h1><p>Meaningful people. Deeper conversations. A safer journey.</p></div></div>
        <div class="dashboard-grid">
          <article class="panel soul-summary">
            <h2>Your Soulprint</h2>
            <div class="soul-summary-body">
              <SoulOrb orbit />
              <ul class="category-list">
                <li v-for="item in categories" :key="item.label" :class="item.tone"><i></i>{{ item.label }}</li>
              </ul>
            </div>
            <button class="text-button" @click="resetOnboarding">Refine Soulprint <ChevronRight /></button>
          </article>
          <article class="panel suggestions">
            <h2>Today’s Suggestions</h2>
            <div class="suggestion-row">
              <div v-for="person in people.slice(0, 3)" :key="person.id" class="suggestion">
                <button class="suggestion-open" :aria-label="`Open ${person.name}'s profile`" @click="go(`/people/${person.id}`)">
                  <img :src="assetUrl(person.image)" :alt="`${person.name}, fictional demo profile`" />
                  <span><b>{{ person.name }}, {{ person.age }}</b><strong>{{ person.match }}% match</strong></span>
                </button>
                <button class="ghost-heart" :class="{ liked: person.liked }" :aria-label="`${person.liked ? 'Unlike' : 'Like'} ${person.name}`" @click="toggleLike(person)"><Heart :fill="person.liked ? 'currentColor' : 'none'" /></button>
              </div>
            </div>
          </article>
          <article class="panel checkin">
            <span class="icon-chip violet big"><CalendarDays /></span>
            <div><b>Upcoming Check-in</b><small>Today at 8:00 PM</small></div>
            <button class="secondary" @click="go('/plans')">View</button>
          </article>
          <article class="panel activity">
            <b>Recent Activity</b>
            <div class="activity-row">
              <div class="avatar-stack"><img v-for="person in people.slice(0, 3)" :key="person.id" :src="assetUrl(person.image)" alt="" /></div>
              <small>3 new people liked your Soulprint</small>
              <span class="divider"></span>
              <img class="mini-avatar" :src="assetUrl(people[0].image)" alt="" />
              <small>2 new messages</small>
              <button class="icon-button bordered" aria-label="Open chat" @click="go('/chat')"><ChevronRight /></button>
            </div>
          </article>
        </div>
      </section>

      <!-- People -->
      <section v-else-if="screen === 'people'" class="people-view">
        <div class="page-heading"><div><h1>People who get you.</h1><p>Based on semantic compatibility between Soulprints.</p></div></div>
        <div class="tabs" role="tablist"><button v-for="filter in ['Dating', 'Friendship', 'Both']" :key="filter" role="tab" :aria-selected="connectionFilter === filter" :class="{ selected: connectionFilter === filter }" @click="connectionFilter = filter">{{ filter }}</button></div>
        <div v-if="filteredPeople.length" class="people-grid">
          <article v-for="person in filteredPeople" :key="person.id" class="person-card">
            <img :src="assetUrl(person.image)" :alt="`${person.name}, fictional demo profile`" />
            <span class="fictional-badge">Fictional</span>
            <button class="ghost-heart" :class="{ liked: person.liked }" :aria-label="`${person.liked ? 'Unlike' : 'Like'} ${person.name}`" @click="toggleLike(person)"><Heart :fill="person.liked ? 'currentColor' : 'none'" /></button>
            <div class="person-info">
              <h2>{{ person.name }}, {{ person.age }}</h2>
              <strong>{{ person.match }}% match</strong>
              <div class="tag-list"><span v-for="tag in person.tags" :key="tag">{{ tag }}</span></div>
              <button class="primary full reveal" @click="go(`/people/${person.id}`)">View profile <ChevronRight /></button>
            </div>
          </article>
        </div>
        <div v-else class="empty panel"><Search /><h2>No people match that search</h2><button class="secondary" @click="search = ''">Clear search</button></div>
      </section>

      <!-- Profile -->
      <section v-else-if="screen === 'profile'" class="profile-view">
        <div class="profile-grid">
          <div class="profile-media">
            <div class="profile-image-wrap"><span class="fictional-badge">Fictional demo profile</span><img :src="assetUrl(activePerson.image)" :alt="`${activePerson.name}, fictional demo profile`" /></div>
            <div class="profile-actions">
              <button class="primary" @click="toggleLike(activePerson)"><Heart v-if="activePerson.liked" fill="currentColor" />{{ activePerson.liked ? 'Liked' : 'Send a Like' }}</button>
              <button class="icon-button bordered big" aria-label="More options" @click="go('/chat')"><Ellipsis /></button>
            </div>
          </div>
          <article class="profile-copy">
            <div class="profile-title">
              <div>
                <h1>{{ activePerson.name }}, {{ activePerson.age }}</h1>
                <strong class="match-line">{{ activePerson.match }}% Soulprint Match <svg viewBox="0 0 110 24" aria-hidden="true"><path d="M2 14c18 0 22-2 34-2s16-10 26-10 12 14 22 14 14-4 24-4" /></svg></strong>
              </div>
              <button class="icon-button bordered big" :class="{ liked: activePerson.liked }" :aria-label="activePerson.liked ? 'Unlike' : 'Like'" @click="toggleLike(activePerson)"><Heart :fill="activePerson.liked ? 'currentColor' : 'none'" /></button>
              <button class="icon-button bordered big" aria-label="More options" @click="notify('More options are coming soon')"><Ellipsis /></button>
            </div>
            <p class="fact"><MapPin />{{ activePerson.city }}, {{ activePerson.distance }}</p>
            <p class="fact"><BriefcaseBusiness />{{ activePerson.job }}</p>
            <div class="tag-list large"><span>{{ settings.goal === 'Friendship' ? 'Friendship' : 'Dating' }}</span><span v-for="tag in activePerson.tags.slice(-1)" :key="tag">{{ tag }}</span></div>
            <hr>
            <h2>Why you might connect</h2>
            <ul class="reason-list">
              <li v-for="(reason, index) in activePerson.reasons" :key="reason"><span class="icon-chip violet"><component :is="reasonIcons[index % reasonIcons.length]" /></span>{{ reason }}</li>
            </ul>
            <p class="gentle-note">A thoughtful match to explore at your own pace.</p>
          </article>
        </div>
      </section>

      <!-- Chat -->
      <section v-else-if="screen === 'chat'" class="chat-layout">
        <article class="chat-card panel">
          <div class="chat-header">
            <div class="avatar-online"><img :src="assetUrl(chatPerson.image)" :alt="`${chatPerson.name}, fictional demo profile`"><i></i></div>
            <div><h2>{{ chatPerson.name }}, {{ chatPerson.age }}</h2><small>Online</small></div>
            <button class="icon-button bordered big" :class="{ liked: chatPerson.liked }" aria-label="Like" @click="toggleLike(chatPerson)"><Heart :fill="chatPerson.liked ? 'currentColor' : 'none'" /></button>
            <button class="icon-button bordered big" aria-label="More options" @click="go(`/people/${chatPerson.id}`)"><Ellipsis /></button>
          </div>
          <div class="message-list">
            <div v-for="item in conversation.messages" :key="item.id" class="message" :class="{ mine: item.from === 'me' }">
              <img :src="assetUrl(item.from === 'me' ? profile.image : chatPerson.image)" alt="">
              <div><p>{{ item.text }}</p><small>{{ item.time }}<CheckCheck v-if="item.from === 'me'" /></small></div>
            </div>
          </div>
          <form class="composer chat-composer" @submit.prevent="sendMessage">
            <button type="button" class="round-ghost" aria-label="Add attachment" @click="notify('Attachments are coming soon')"><Plus /></button>
            <input v-model="message" :placeholder="`Message ${chatPerson.name}...`" :aria-label="`Message ${chatPerson.name}`" />
            <button type="button" class="round-ghost" aria-label="Voice message" @click="notify('Voice notes are coming soon')"><Mic /></button>
            <button type="button" class="round-ghost" aria-label="Video call" @click="notify('Video dates are coming soon')"><Video /></button>
            <button class="composer-send" :disabled="!message.trim()" aria-label="Send message"><SendHorizontal /></button>
          </form>
        </article>

        <aside v-if="!safetyOpen" class="chat-tools panel">
          <button class="cyan" @click="go('/assistant')"><span class="ring-icon"><Lightbulb /></span><span><b>AI Assistant</b><small>Conversation ideas &amp; gentle help</small></span><ChevronRight /></button>
          <button class="coral" @click="go('/date-plan')"><span class="ring-icon"><CalendarDays /></span><span><b>Plan Date</b><small>Make a plan together</small></span><ChevronRight /></button>
          <button class="violet" @click="safetyOpen = true"><span class="ring-icon"><ShieldCheck /></span><span><b>Safety</b><small>Your safety tools</small></span><ChevronRight /></button>
        </aside>
        <aside v-else class="safety-panel panel">
          <div class="safety-title">
            <img :src="assetUrl(profile.image)" alt="">
            <div><h2>Date Safety</h2><small>With {{ chatPerson.name }} · For your planned date</small></div>
          </div>
          <div class="enhanced"><span class="shield"><Shield /></span><b>Enhanced Mode</b><button class="text-button" @click="safetyOpen = false"><Pencil /> Edit</button></div>
          <div v-for="row in safetyRows" :key="row.key" class="safety-row">
            <span class="icon-chip" :class="row.tone"><component :is="row.icon" /></span>
            <span><b>{{ row.title }}</b><small>{{ row.hint }}</small></span>
            <ToggleSwitch :model-value="Boolean(settings[row.key])" :label="row.title" @update:model-value="saveSetting(row.key, $event)" />
          </div>
          <button class="safety-start" @click="notify('Safety Mode is a demo: nobody is contacted')">Start Safety Mode</button>
          <p class="safety-foot"><ShieldCheck /> Your safety settings stay in your control. Demo only: no one is contacted.</p>
        </aside>
      </section>

      <!-- AI assistant -->
      <section v-else-if="screen === 'assistant'" class="assistant-view panel">
        <button class="pill-back" @click="go('/chat')"><ArrowLeft /> Return to chat with {{ chatPerson.name }}</button>
        <div class="assistant-inner">
          <div class="feature-title"><span class="ring-icon cyan huge"><Lightbulb /></span><div><h1>AI Assistant</h1><p>Based on your conversation with {{ chatPerson.name }}</p></div></div>
          <div class="assistant-intro"><b>I can help you find a natural next thing to talk about.</b><span>You both enjoy {{ sharedInterests }}.</span></div>

          <p class="section-label">Shared interests from your chat</p>
          <div class="idea-grid">
            <article v-for="idea in aiSuggestions.ideas" :key="idea.title"><div class="idea-head"><span class="ring-icon cyan"><component :is="ideaIcon(idea.title)" /></span><h2>{{ idea.title }}</h2></div><p>{{ idea.body }}</p></article>
          </div>

          <p class="section-label">Things you could ask {{ chatPerson.name }}</p>
          <div class="prompt-grid">
            <article v-for="prompt in assistantPrompts" :key="prompt.text" :class="prompt.tone">
              <div><span class="ring-icon"><component :is="prompt.icon" /></span><p>{{ prompt.text }}</p></div>
              <button @click="usePrompt(prompt.text)"><Sparkles /> Use prompt</button>
            </article>
          </div>

          <article class="next-step">
            <span class="ring-icon cyan huge"><Leaf /></span>
            <div>
              <h2>A thoughtful next step</h2>
              <p>{{ chatPerson.name }} has already suggested meeting, and it’s clear you both enjoy nature, good food, and meaningful conversations. A relaxed public café near Kreuzberg followed by a canal-side walk would be a great fit based on what you’ve both shared.</p>
              <p>If you feel comfortable, consider agreeing on a day and time to meet. For your safety, keep the first meeting in a public place.</p>
              <button class="secondary" @click="go('/date-plan')"><CalendarDays /> Plan a date</button>
            </div>
          </article>

          <div class="assistant-tip"><Leaf /> You could build on the canal walk you already mentioned.</div>
          <form class="composer" @submit.prevent="askAssistant">
            <span class="composer-plus"><Plus /></span>
            <input v-model="assistantQuestion" :disabled="busy" :placeholder="busy ? 'Thinking…' : 'Ask AI Assistant...'" aria-label="Ask AI Assistant" />
            <button class="composer-send" :disabled="busy || !assistantQuestion.trim()" aria-label="Ask"><SendHorizontal /></button>
          </form>
          <p class="privacy-note"><ShieldCheck /> Your conversation stays between you and {{ chatPerson.name }}; AI suggestions are optional.</p>
          <p v-if="aiSuggestions.disclaimer" class="demo-note">{{ aiSuggestions.disclaimer }}</p>
        </div>
      </section>

      <!-- Date planning (from chat) and new plan (from plans) -->
      <section v-else-if="screen === 'date' || screen === 'newplan'" class="date-view panel">
        <button class="back-link" @click="go(screen === 'date' ? '/chat' : '/plans')"><span class="icon-button bordered"><ArrowLeft /></span>{{ screen === 'date' ? `Return to chat with ${chatPerson.name}` : 'Back to Plans' }}</button>
        <template v-if="screen === 'newplan'">
          <h1>Create a new plan</h1>
          <p class="lede">Choose who you’d like to spend time with.</p>
          <div class="who-box">
            <h2>Who would you like to plan with?</h2>
            <div class="who-row">
              <div class="who-card"><img :src="assetUrl(planPerson.image)" :alt="`${planPerson.name}, fictional demo profile`"><div><b>{{ planPerson.name }}, {{ planPerson.age }}</b><small><Heart /> {{ planPerson.match }}% Soulprint Match</small></div><span class="check-badge"><Check /></span></div>
              <button class="who-other" @click="chooseSomeoneElse"><UsersRound /> Choose someone else</button>
            </div>
          </div>
          <h2 class="sub-heading">Plan a date with {{ planPerson.name }}</h2>
          <p class="lede small">Ideas based on what you both enjoy.</p>
        </template>
        <template v-else>
          <h1>Plan a date with {{ chatPerson.name }}</h1>
          <p class="lede">Ideas based on what you both enjoy.</p>
        </template>
        <div class="tabs outline"><button v-for="filter in placeFilters" :key="filter" :class="{ selected: placeFilter === filter }" @click="placeFilter = filter">{{ filter }}</button></div>
        <div v-if="visiblePlaces.length" class="place-grid">
          <div v-for="place in visiblePlaces" :key="place.id" class="place-card" :class="{ selected: selectedPlace === place.id }">
            <button class="place-select" :aria-pressed="selectedPlace === place.id" @click="selectedPlace = place.id">
              <img :src="assetUrl(place.image)" :alt="`${place.title}, demo illustration`">
              <div>
                <h2>{{ place.title }}</h2>
                <p>{{ place.description }}</p>
                <small><Heart />{{ place.fit }}% fit <Clock3 />{{ place.duration }}<span class="kind" :class="kindTone(place.kind)">{{ place.kind }}</span></small>
              </div>
            </button>
            <span v-if="selectedPlace === place.id" class="check-badge corner"><Check /></span>
            <button v-else class="ghost-heart corner" :class="{ liked: savedPlaces.includes(place.id) }" :aria-label="`Save ${place.title}`" @click="toggleSavedPlace(place.id)"><Heart :fill="savedPlaces.includes(place.id) ? 'currentColor' : 'none'" /></button>
          </div>
        </div>
        <div v-else class="empty-inline"><Sparkles /> No {{ placeFilter.toLowerCase() }} ideas yet. Try AI picks.</div>
        <div class="plan-bar">
          <div v-if="screen === 'date'" class="plan-bar-copy"><h2>Plan together</h2><small>Pick a time that works for you both. You can always adjust later.</small></div>
          <label class="select-pill"><CalendarDays /><select v-model="selectedDate" aria-label="Plan date"><option>This Saturday</option><option>This Sunday</option><option>Next Saturday</option></select><ChevronDown /></label>
          <label class="select-pill"><Clock3 /><select v-model="selectedTime" aria-label="Plan time"><option>12:30 PM</option><option>4:00 PM</option><option>6:30 PM</option></select><ChevronDown /></label>
          <button class="primary" :disabled="busy" @click="createPlan(screen === 'date' ? chatPerson.id : planPersonId)"><Send /> Share plan with {{ screen === 'date' ? chatPerson.name : planPerson.name }}</button>
        </div>
      </section>

      <!-- Plans -->
      <section v-else-if="screen === 'plans'" class="plans-view">
        <div class="page-heading"><div><h1>Your Plans</h1><p>Make time for the connections that matter.</p></div><button class="primary large" @click="go('/plans/new')"><Plus /> Add a new plan</button></div>
        <template v-for="group in [{ title: 'Today', items: todayPlans }, { title: 'Upcoming', items: upcomingPlans }]" :key="group.title">
          <h2 v-if="group.items.length" class="group-title">{{ group.title }}</h2>
          <article v-for="plan in group.items" :key="plan.id" class="plan-card panel" :class="{ compact: group.title === 'Upcoming' }">
            <img :src="assetUrl(plan.image || places[0].image)" :alt="`${plan.title}, demo illustration`">
            <div class="plan-main">
              <div class="plan-person">
                <div v-if="personFor(plan.personId)" class="avatar-online small"><img :src="assetUrl(personFor(plan.personId)!.image)" alt=""><i v-if="group.title === 'Today'"></i></div>
                <span v-else class="initial">{{ plan.personId.charAt(0).toUpperCase() }}</span>
                <div><b>{{ personFor(plan.personId)?.name || 'A connection' }}, {{ personFor(plan.personId)?.age }}</b><small v-if="group.title === 'Today'" class="online">Online</small><b v-else class="plan-inline-title">{{ plan.title }}</b></div>
              </div>
              <h2 v-if="group.title === 'Today'">{{ plan.title }}</h2>
              <p class="plan-meta"><span><CalendarDays />{{ plan.when }}</span><span v-if="group.title === 'Today' && plan.safety"><ShieldPlus /> Safety on <Info /></span><span v-if="group.title !== 'Today'"><MapPin />{{ plan.place }}</span></p>
              <p v-if="group.title === 'Today'" class="plan-desc">{{ placeFor(plan)?.description || plan.place }}</p>
            </div>
            <div class="plan-side">
              <div class="plan-status">
                <span class="status" :class="plan.status === 'Confirmed' ? 'ok' : 'planned'"><Check v-if="plan.status === 'Confirmed'" /><Clock3 v-else />{{ plan.status }}</span>
                <button class="icon-button bordered" aria-label="Plan options" @click="notify('Plan options are coming soon')"><Ellipsis /></button>
              </div>
              <button :class="group.title === 'Today' ? 'primary' : 'outline-button'" @click="notify(`${plan.title}: ${plan.when}`)">View plan <ArrowRight /></button>
            </div>
          </article>
        </template>
      </section>

      <!-- Settings -->
      <section v-else class="settings-view">
        <div class="settings-grid">
          <div class="settings-col">
            <div class="page-heading"><div><h1>Settings</h1><p>Make Soulprint feel right for you.</p></div></div>
            <article class="panel">
              <h2>Profile &amp; Soulprint</h2>
              <div class="row-group">
                <button class="setting-row" @click="notify('Profile editing is coming soon')"><span class="icon-chip"><UserRound /></span><span><b>Edit profile</b><small>Update your photos, bio, and basic info</small></span><ChevronRight /></button>
                <button class="setting-row" @click="resetOnboarding"><span class="icon-chip"><Cuboid /></span><span><b>Update my Soulprint</b><small>Answer new questions or refine your answers</small></span><ChevronRight /></button>
              </div>
            </article>
            <article class="panel">
              <h2>Discovery preferences</h2>
              <div class="row-group">
                <div class="setting-row"><span class="icon-chip"><Target /></span><span><b>Connection goals</b><small>What are you here for?</small></span>
                  <div class="segmented" role="radiogroup" aria-label="Connection goals"><button v-for="goal in ['Dating', 'Friendship', 'Both']" :key="goal" role="radio" :aria-checked="settings.goal === goal" :class="{ selected: settings.goal === goal }" @click="saveSetting('goal', goal)">{{ goal }}</button></div>
                </div>
                <div class="setting-row"><span class="icon-chip"><Cake /></span><span><b>Age range</b></span>
                  <div class="dual-range" :style="{ '--from': `${((settings.ageRange[0] - 18) / 52) * 100}%`, '--to': `${((settings.ageRange[1] - 18) / 52) * 100}%` }">
                    <input type="range" min="18" max="70" :value="settings.ageRange[0]" aria-label="Minimum age" @change="saveAge(0, Number(($event.target as HTMLInputElement).value))">
                    <input type="range" min="18" max="70" :value="settings.ageRange[1]" aria-label="Maximum age" @change="saveAge(1, Number(($event.target as HTMLInputElement).value))">
                  </div>
                  <output>{{ settings.ageRange[0] }} – {{ settings.ageRange[1] }}</output>
                </div>
                <div class="setting-row"><span class="icon-chip"><MapPin /></span><span><b>Distance</b></span>
                  <input class="single-range" type="range" min="5" max="100" :value="settings.distance" :style="{ '--fill': `${((settings.distance - 5) / 95) * 100}%` }" aria-label="Distance" @input="settings.distance = Number(($event.target as HTMLInputElement).value)" @change="saveSetting('distance', Number(($event.target as HTMLInputElement).value))">
                  <output>{{ settings.distance }} km</output>
                </div>
                <button class="setting-row" @click="cycleVisibility"><span class="icon-chip"><Eye /></span><span><b>Who can see my profile</b><small>Choose who can find and view your profile</small></span><em>{{ settings.visibility || 'Everyone' }}</em><ChevronRight /></button>
              </div>
            </article>
            <button class="logout" @click="go('/')"><LogOut /> Log out</button>
          </div>
          <div class="settings-col">
            <article class="panel">
              <h2>Privacy &amp; Safety</h2>
              <div class="row-group">
                <button class="setting-row" @click="notify('Privacy controls are coming soon')"><span class="icon-chip"><Lock /></span><span><b>Privacy controls</b><small>Manage your visibility and data</small></span><ChevronRight /></button>
                <button class="setting-row" @click="openSafety"><span class="icon-chip"><ShieldPlus /></span><span><b>Date Safety settings</b><small>Tools for safer, more confident dates</small></span><ChevronRight /></button>
                <button class="setting-row" @click="openSafety"><span class="icon-chip"><UsersRound /></span><span><b>Trusted contact</b><small>Add someone you trust for your safety</small></span><ChevronRight /></button>
                <div class="setting-row"><span class="icon-chip"><MapPin /></span><span><b>Location sharing</b><small>Demo only, during dates</small></span><ToggleSwitch tone="cyan" :model-value="settings.locationSharing" label="Location sharing" @update:model-value="saveSetting('locationSharing', $event)" /></div>
              </div>
            </article>
            <article class="panel">
              <h2>Notifications</h2>
              <div class="row-group">
                <div v-for="row in notificationRows" :key="row.key" class="setting-row"><span class="icon-chip"><component :is="row.icon" /></span><span><b>{{ row.title }}</b><small>{{ row.hint }}</small></span><ToggleSwitch tone="cyan" :model-value="settings[row.key]" :label="row.title" @update:model-value="saveSetting(row.key, $event)" /></div>
              </div>
            </article>
            <article class="panel">
              <h2>App preferences</h2>
              <div class="row-group">
                <button class="setting-row" @click="notify('More languages are coming soon')"><span class="icon-chip"><Globe /></span><span><b>Language</b></span><em>{{ settings.language || 'English' }}</em><ChevronRight /></button>
                <button class="setting-row" @click="notify('Soulprint is designed for dark mode')"><span class="icon-chip"><Moon /></span><span><b>Appearance</b></span><em>Dark</em><ChevronRight /></button>
                <button class="setting-row" @click="notify('Account settings are coming soon')"><span class="icon-chip"><Mail /></span><span><b>Email and password</b><small>Update your email or password</small></span><ChevronRight /></button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </section>
    <Transition name="toast"><div v-if="toast" class="toast" role="status"><Check />{{ toast }}</div></Transition>
  </main>
</template>
