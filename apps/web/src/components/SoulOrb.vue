<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ compact?: boolean; labels?: boolean; orbit?: boolean }>()

const uid = `orb-${Math.random().toString(36).slice(2, 9)}`

// Deterministic pseudo-random numbers keep the constellation stable between renders.
function random(seed: number) {
  let value = seed
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646 }
}

const width = computed(() => (props.labels ? 1000 : 400))
const height = 400
const cx = computed(() => width.value / 2)
const cy = 200
const radius = computed(() => (props.labels ? 150 : props.orbit ? 118 : 140))

function edge(theta: number, scale = 1) {
  const r = radius.value * scale * (1 + 0.11 * Math.sin(5 * theta + 0.6) + 0.05 * Math.sin(3 * theta + 1.9))
  return { x: cx.value + r * Math.cos(theta), y: cy + r * 0.86 * Math.sin(theta) }
}

const blob = computed(() => {
  const points = Array.from({ length: 96 }, (_, index) => edge((index / 96) * Math.PI * 2))
  return `M${points.map((point) => `${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join('L')}Z`
})

const stars = computed(() => {
  const next = random(props.compact ? 11 : 7)
  const count = props.compact ? 26 : 90
  return Array.from({ length: count }, () => {
    const theta = next() * Math.PI * 2
    const point = edge(theta, Math.sqrt(next()) * 0.92)
    const roll = next()
    const hue = roll < 0.4 ? '#ffd1f4' : roll < 0.7 ? '#9fe9ff' : roll < 0.85 ? '#ffb38a' : '#ffffff'
    return { ...point, r: 0.6 + next() * (props.compact ? 2.2 : 1.8), hub: next() > 0.88, hue }
  })
})

const links = computed(() => {
  if (props.compact) return []
  const list: { x1: number; y1: number; x2: number; y2: number }[] = []
  stars.value.forEach((star, index) => {
    stars.value
      .map((other, otherIndex) => ({ other, otherIndex, d: Math.hypot(other.x - star.x, other.y - star.y) }))
      .filter((item) => item.otherIndex > index && item.d < 70)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ other }) => list.push({ x1: star.x, y1: star.y, x2: other.x, y2: other.y }))
  })
  return list
})

const dust = computed(() => {
  const next = random(23)
  return Array.from({ length: props.compact ? 0 : 40 }, () => {
    const theta = next() * Math.PI * 2
    return { ...edge(theta, 1.05 + next() * 0.4), r: 0.5 + next() * 1.3 }
  })
})

const categoryLabels = computed(() => {
  const colors = ['#e58cff', '#f07ee0', '#4fd8ff', '#c27cff', '#4fc8ff', '#c690ff', '#8f9bff']
  const left = ['Values', 'Interests', 'Lifestyle', 'Boundaries'].map((label, index) => ({
    label, x: 270 + Math.abs(index - 1.5) * 40, y: 70 + index * 92,
    target: edge(Math.PI - (index - 1.5) * 0.5, 0.92), side: -1, color: colors[index],
  }))
  const right = ['Communication', 'Relationships', 'Social Energy'].map((label, index) => ({
    label, x: 760 + Math.abs(index - 1) * 20, y: 90 + index * 112,
    target: edge((index - 1) * 0.55, 0.92), side: 1, color: colors[index + 4],
  }))
  return [...left, ...right].map((item) => ({ ...item, dot: item.x - item.side * 16 }))
})
</script>

<template>
  <svg
    class="soul-orb"
    :class="{ compact, labelled: labels }"
    :viewBox="`0 0 ${width} ${height}`"
    :role="labels ? 'img' : undefined"
    :aria-label="labels ? 'Soulprint constellation across seven categories' : undefined"
    :aria-hidden="labels ? undefined : 'true'"
  >
    <defs>
      <radialGradient :id="`${uid}-core`" cx="48%" cy="46%" r="60%">
        <stop offset="0" stop-color="#4d7bff" stop-opacity=".95" />
        <stop offset=".35" stop-color="#3a47d8" stop-opacity=".85" />
        <stop offset=".7" stop-color="#8a3ff0" stop-opacity=".8" />
        <stop offset="1" stop-color="#ff7ad9" stop-opacity=".9" />
      </radialGradient>
      <radialGradient :id="`${uid}-sheen`" cx="35%" cy="30%" r="55%">
        <stop offset="0" stop-color="#ffffff" stop-opacity=".22" />
        <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
      <filter :id="`${uid}-glow`" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18" /></filter>
      <filter :id="`${uid}-star`" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" /></filter>
    </defs>

    <ellipse v-if="orbit" class="orb-orbit" :cx="cx" :cy="cy" :rx="radius * 1.5" :ry="radius * 0.62" :transform="`rotate(-14 ${cx} ${cy})`" />
    <path :d="blob" :fill="`url(#${uid}-core)`" :filter="`url(#${uid}-glow)`" opacity=".75" />
    <g class="orb-body">
      <path :d="blob" :fill="`url(#${uid}-core)`" opacity=".72" />
      <path :d="blob" :fill="`url(#${uid}-sheen)`" />
      <path :d="blob" fill="none" stroke="#f3c6ff" stroke-opacity=".75" stroke-width="2" />
      <path :d="blob" fill="none" stroke="#ffffff" stroke-opacity=".9" stroke-width=".8" />
      <line v-for="(link, index) in links" :key="`l${index}`" v-bind="link" class="orb-link" />
      <g v-for="(star, index) in stars" :key="`s${index}`">
        <circle v-if="star.hub" :cx="star.x" :cy="star.y" :r="star.r * 4" :fill="star.hue" :filter="`url(#${uid}-star)`" opacity=".9" />
        <circle :cx="star.x" :cy="star.y" :r="star.r" :fill="star.hue" />
      </g>
    </g>
    <circle v-for="(item, index) in dust" :key="`d${index}`" :cx="item.x" :cy="item.y" :r="item.r" class="orb-dust" />
    <g v-if="orbit">
      <circle :cx="cx - radius * 1.4" :cy="cy + radius * 0.4" r="9" fill="#7fd8ff" :filter="`url(#${uid}-star)`" /><circle :cx="cx - radius * 1.4" :cy="cy + radius * 0.4" r="6" fill="#bff1ff" />
      <circle :cx="cx + radius * 1.42" :cy="cy - radius * 0.36" r="8" fill="#d58cff" :filter="`url(#${uid}-star)`" /><circle :cx="cx + radius * 1.42" :cy="cy - radius * 0.36" r="5" fill="#f0d0ff" />
    </g>

    <g v-if="labels" class="orb-labels">
      <g v-for="item in categoryLabels" :key="item.label">
        <path class="orb-connector" :stroke="item.color" :d="`M${item.dot} ${item.y} C ${(item.dot + item.target.x) / 2} ${item.y}, ${(item.dot + item.target.x) / 2} ${item.target.y}, ${item.target.x} ${item.target.y}`" />
        <circle :cx="item.dot" :cy="item.y" r="13" :fill="item.color" opacity=".2" />
        <circle :cx="item.dot" :cy="item.y" r="6" :fill="item.color" />
        <text :x="item.x":y="item.y + 6" :text-anchor="item.side < 0 ? 'end' : 'start'">{{ item.label }}</text>
      </g>
    </g>
  </svg>
</template>
