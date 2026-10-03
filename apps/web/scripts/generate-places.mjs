// Generates the demo date-idea illustrations in public/images/places.
// Run: node scripts/generate-places.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const outDir = fileURLToPath(new URL('../public/images/places/', import.meta.url))
const W = 900
const H = 480
const f = (n) => Number(n.toFixed(1))
function rng(seed) {
  let value = seed
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646 }
}
const blurs = [1, 2, 4, 8, 14, 24, 40].map((s) => `<filter id="b${s}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')
const grain = '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .06"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>'
const svg = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${blurs}${grain}${defs}</defs>${body}<rect width="${W}" height="${H}" fill="#fff" filter="url(#grain)"/></svg>`

function foliage(next, cx, cy, r, colors, count = 40) {
  return Array.from({ length: count }, () => {
    const a = next() * Math.PI * 2
    const d = Math.sqrt(next()) * r
    return `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d * 0.8)}" r="${f(r * (0.12 + next() * 0.18))}" fill="${colors[Math.floor(next() * colors.length)]}" opacity="${f(0.6 + next() * 0.4)}"/>`
  }).join('')
}

function cafe() {
  const next = rng(4)
  const vx = 640, vy = 220
  const windows = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, col) => {
    const x = 30 + col * 95 + row * 0, y = 40 + row * 70
    const shrink = 1 - col * 0.12
    const lit = next() > 0.35
    return `<rect x="${f(x)}" y="${f(y + col * 6)}" width="${f(60 * shrink)}" height="${f(46 * shrink)}" rx="3" fill="${lit ? '#ffcf7a' : '#3a2a2a'}" opacity="${lit ? 0.95 : 0.8}"/>${lit ? `<rect x="${f(x - 10)}" y="${f(y + col * 6 - 10)}" width="${f(60 * shrink + 20)}" height="${f(46 * shrink + 20)}" fill="#ffb347" opacity=".35" filter="url(#b8)"/>` : ''}`
  }).join('')).join('')
  const bulbs = Array.from({ length: 22 }, (_, i) => {
    const t = i / 21
    const x = 30 + t * 610, y = 205 + Math.sin(t * Math.PI) * 26 - t * 40
    return `<circle cx="${f(x)}" cy="${f(y)}" r="9" fill="#ffd27a" opacity=".55" filter="url(#b4)"/><circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="#fff4d0"/>`
  }).join('')
  const tables = Array.from({ length: 6 }, (_, i) => {
    const t = i / 5
    const x = 70 + t * 420, y = 400 - t * 120, s = 1 - t * 0.6
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
      <path d="M-70 -120L0 -150L70 -120Z" fill="#7a2f2a"/><path d="M-70 -120L0 -150L70 -120L60 -112L0 -138L-60 -112Z" fill="#a8463a"/>
      <rect x="-3" y="-140" width="6" height="140" fill="#2a1a14"/>
      <ellipse cx="0" cy="-2" rx="48" ry="9" fill="#5a3a26"/><rect x="-46" y="-2" width="92" height="7" fill="#3a2418"/>
      <path d="M-70 0V-46H-44V0M44 0V-46H70V0" stroke="#3a2418" stroke-width="6" fill="none"/>
      <circle cx="-8" cy="-12" r="6" fill="#ffe2a8" opacity=".9"/><circle cx="-8" cy="-14" r="16" fill="#ffb347" opacity=".35" filter="url(#b4)"/>
    </g>`
  }).join('')
  const stones = Array.from({ length: 14 }, (_, i) => {
    const t = (i + 1) / 15
    const y = vy + (H - vy) * Math.pow(t, 1.6)
    return `<path d="M${f(vx - (vx + 200) * Math.pow(t, 1.6))} ${f(y)}H${f(vx + (W - vx + 300) * Math.pow(t, 1.6))}" stroke="#2a1a1a" stroke-width="${f(0.5 + t * 2)}" opacity=".35"/>`
  }).join('')
  const people = Array.from({ length: 7 }, () => {
    const x = 420 + next() * 260, y = 300 + next() * 40, s = 0.5 + next() * 0.5
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" opacity=".75" filter="url(#b2)"><circle cx="0" cy="-70" r="11" fill="#2a1c1e"/><path d="M-16 -56H16L20 0H-20Z" fill="#3a2630"/></g>`
  }).join('')
  return svg(`
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f6c58a"/><stop offset=".6" stop-color="#e88f62"/><stop offset="1" stop-color="#b45a4c"/></linearGradient>
    <linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8a5a48"/><stop offset="1" stop-color="#3a2420"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#b8735a"/><stop offset="1" stop-color="#8a4f42"/></linearGradient>`,
  `<rect width="${W}" height="${H}" fill="url(#sky)"/>
   <circle cx="${vx}" cy="${vy - 20}" r="140" fill="#fff0c2" opacity=".55" filter="url(#b40)"/>
   <path d="M560 260L560 120L600 110L620 140L640 100L680 120L700 260Z" fill="#c98a6a" opacity=".5" filter="url(#b2)"/>
   <path d="M0 0H420L${vx - 40} ${vy - 70}V${vy + 40}L420 ${H}H0Z" fill="url(#wall)"/>
   ${windows}
   <path d="M0 250H440L${vx - 60} ${vy + 20}V${vy + 34}L440 270H0Z" fill="#5a2a26"/>
   <path d="M0 270H440L${vx - 60} ${vy + 34}L${vx - 60} ${vy + 44}L440 300H0Z" fill="#ffcf7a" opacity=".55" filter="url(#b8)"/>
   <path d="M0 ${H}L${vx - 40} ${vy + 40}L${vx + 60} ${vy + 40}L${W} ${H}Z" fill="url(#street)"/>
   ${stones}
   <g filter="url(#b2)">${foliage(next, 790, 120, 160, ['#4a6a2a', '#6a8a36', '#c8a84a', '#e8c46a', '#3a4a22'], 80)}${foliage(next, 700, 170, 70, ['#5a7a2e', '#d8b456', '#8a9a3a'], 30)}</g>
   <rect x="770" y="200" width="16" height="200" fill="#2a1c14"/><rect x="694" y="220" width="8" height="90" fill="#2a1c14"/>
   ${people}
   ${tables}
   ${bulbs}
   <g filter="url(#b14)">${Array.from({ length: 10 }, () => `<circle cx="${f(next() * W)}" cy="${f(next() * 260)}" r="${f(8 + next() * 18)}" fill="#ffe0a0" opacity=".5"/>`).join('')}</g>
   <rect width="${W}" height="${H}" fill="#ff9a4a" opacity=".1"/>`)
}

function canal() {
  const next = rng(9)
  const horizon = 270
  const reflections = Array.from({ length: 40 }, () => {
    const y = horizon + 10 + next() * 200
    const w = 20 + next() * 140 * (1 - (y - horizon) / 300)
    const x = 520 + (next() - 0.5) * (y - horizon) * 1.4
    return `<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(1.5 + next() * 3)}" rx="2" fill="#ffd38a" opacity="${f(0.3 + next() * 0.5)}"/>`
  }).join('')
  const buildings = Array.from({ length: 16 }, (_, i) => {
    const x = 120 + i * 48, h = 40 + next() * 70
    return `<rect x="${x}" y="${horizon - h}" width="${f(40 + next() * 14)}" height="${f(h)}" fill="#5a3a5a" opacity=".55"/>`
  }).join('')
  return svg(`
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a3270"/><stop offset=".35" stop-color="#b65c86"/><stop offset=".75" stop-color="#f19a5a"/><stop offset="1" stop-color="#ffd27a"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e88a5a"/><stop offset=".4" stop-color="#7a4466"/><stop offset="1" stop-color="#1e1a34"/></linearGradient>`,
  `<rect width="${W}" height="${horizon + 2}" fill="url(#sky)"/>
   ${Array.from({ length: 6 }, () => `<ellipse cx="${f(next() * W)}" cy="${f(40 + next() * 140)}" rx="${f(80 + next() * 140)}" ry="${f(8 + next() * 14)}" fill="#ffb4a0" opacity=".35" filter="url(#b8)"/>`).join('')}
   <circle cx="520" cy="${horizon - 24}" r="160" fill="#ffdc8a" opacity=".55" filter="url(#b40)"/>
   <circle cx="520" cy="${horizon - 24}" r="34" fill="#fff2c4"/>
   <circle cx="520" cy="${horizon - 24}" r="60" fill="#ffd88a" opacity=".6" filter="url(#b14)"/>
   <g filter="url(#b2)">${buildings}</g>
   <path d="M330 ${horizon - 30}H720V${horizon}H690C680 ${horizon - 44} 560 ${horizon - 60} 525 ${horizon - 60}C490 ${horizon - 60} 370 ${horizon - 44} 360 ${horizon}H330Z" fill="#3a2440"/>
   <rect y="${horizon}" width="${W}" height="${H - horizon}" fill="url(#water)"/>
   <path d="M330 ${horizon}H720V${horizon + 26}H690C680 ${horizon + 50} 560 ${horizon + 64} 525 ${horizon + 64}C490 ${horizon + 64} 370 ${horizon + 50} 360 ${horizon + 26}H330Z" fill="#2a1a34" opacity=".55" filter="url(#b4)"/>
   <g filter="url(#b1)">${reflections}</g>
   <rect x="440" y="${horizon}" width="160" height="${H - horizon}" fill="#ffcf7a" opacity=".22" filter="url(#b24)"/>
   <path d="M0 ${horizon - 10}C80 ${horizon - 16} 160 ${horizon} 240 ${horizon + 20}L340 ${H}H0Z" fill="#1e1626"/>
   <path d="M${W} ${horizon - 6}C820 ${horizon} 760 ${horizon + 30} 720 ${horizon + 70}L640 ${H}H${W}Z" fill="#2a1c2a"/>
   <path d="M${W} ${horizon + 40}C840 ${horizon + 60} 780 ${horizon + 120} 760 ${H}H${W}Z" fill="#8a6a5a" opacity=".6"/>
   <g filter="url(#b2)">
     ${foliage(next, 90, 130, 150, ['#2a2030', '#3a2a3a', '#4a3040', '#c87a5a'], 70)}
     ${foliage(next, 840, 150, 130, ['#2a2030', '#3a2a36', '#6a4048', '#e8945a'], 60)}
   </g>
   <rect x="80" y="160" width="14" height="${horizon - 150}" fill="#1a121e"/><rect x="830" y="170" width="12" height="${horizon - 140}" fill="#1a121e"/>
   ${foliage(next, 40, 140, 60, ['#ffb070'], 12).replace(/opacity="[^"]+"/g, 'opacity=".25"')}
   <g transform="translate(790 ${horizon + 60})" opacity=".85"><circle cx="0" cy="-48" r="7" fill="#1a121e"/><path d="M-9 -40H9L11 0H-11Z" fill="#1a121e"/><circle cx="22" cy="-46" r="7" fill="#1a121e"/><path d="M13 -38H31L33 0H11Z" fill="#1a121e"/></g>
   <rect width="${W}" height="${H}" fill="#ff7a4a" opacity=".06"/>`)
}

function gallery() {
  const next = rng(17)
  const floorY = 330
  const painting = (x, y, w, h, palette, depth = 1) => {
    const shapes = Array.from({ length: 7 }, () => {
      const c = palette[Math.floor(next() * palette.length)]
      const sx = x + 10 + next() * (w - 40), sy = y + 10 + next() * (h - 40)
      return next() > 0.5
        ? `<rect x="${f(sx)}" y="${f(sy)}" width="${f(16 + next() * w * 0.4)}" height="${f(14 + next() * h * 0.4)}" fill="${c}" transform="rotate(${f((next() - 0.5) * 40)} ${f(sx)} ${f(sy)})"/>`
        : `<path d="M${f(sx)} ${f(sy + 30)}L${f(sx + 20 + next() * 40)} ${f(sy)}L${f(sx + 40 + next() * 40)} ${f(sy + 34)}Z" fill="${c}"/>`
    }).join('')
    return `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" fill="#2a2420"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#efe6da"/>
      <g clip-path="url(#c${x})">${shapes}</g><clipPath id="c${x}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>
      <ellipse cx="${x + w / 2}" cy="${y - 10}" rx="${w * 0.7}" ry="${h * 0.9}" fill="#fff4dc" opacity="${0.35 * depth}" filter="url(#b24)"/>
      <rect x="${x - 6}" y="${y + h + 6}" width="${w + 12}" height="10" fill="#000" opacity=".18" filter="url(#b4)"/>`
  }
  return svg(`
    <linearGradient id="back" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f2e9dc"/><stop offset="1" stop-color="#d8c8b4"/></linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c8b6a0"/><stop offset="1" stop-color="#e6dacb"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a87a52"/><stop offset="1" stop-color="#5a3a24"/></linearGradient>`,
  `<rect width="${W}" height="${floorY}" fill="url(#back)"/>
   <path d="M0 0L150 50V${floorY - 10}L0 ${H}Z" fill="url(#side)"/>
   <path d="M${W} 0L780 50V${floorY - 10}L${W} ${H}Z" fill="url(#side)" opacity=".9"/>
   <rect x="0" y="0" width="${W}" height="50" fill="#e6dccd"/>
   ${[230, 450, 670].map((x) => `<rect x="${x - 30}" y="20" width="60" height="8" rx="4" fill="#fff"/><path d="M${x - 24} 28L${x - 90} ${floorY}H${x + 90}L${x + 24} 28Z" fill="#fff8e6" opacity=".35" filter="url(#b14)"/>`).join('')}
   <path d="M0 ${H}L150 ${floorY - 10}H780L${W} ${H}Z" fill="url(#floor)"/>
   ${Array.from({ length: 10 }, (_, i) => `<path d="M${150 + i * 70} ${floorY - 10}L${f(-200 + i * 140)} ${H}" stroke="#3a2416" stroke-width="1.2" opacity=".35"/>`).join('')}
   ${painting(190, 110, 110, 140, ['#c8324a', '#2a2a3a', '#e8a23a', '#3a6aa8'])}
   ${painting(395, 90, 120, 160, ['#2a3a6a', '#e86a3a', '#f2c84a', '#1a1a1a'])}
   ${painting(610, 110, 100, 130, ['#3a8a8a', '#c84a6a', '#f2e0b0', '#2a2a2a'])}
   ${painting(40, 120, 60, 130, ['#8a3a6a', '#3a3a8a', '#e8c86a'], 0.6).replace(/<rect x="34"/, '<rect transform="skewY(14)" x="34"')}
   <rect x="380" y="372" width="160" height="16" rx="3" fill="#2a1e18"/><rect x="392" y="388" width="10" height="34" fill="#1e1612"/><rect x="518" y="388" width="10" height="34" fill="#1e1612"/>
   <rect x="370" y="420" width="180" height="14" fill="#000" opacity=".25" filter="url(#b4)"/>
   <path d="M150 ${floorY + 40}H780" stroke="#fff" opacity=".12" stroke-width="40" filter="url(#b14)"/>
   <g opacity=".85" filter="url(#b1)"><g transform="translate(300 360)"><circle cx="0" cy="-86" r="11" fill="#3a2a26"/><path d="M-15 -72H15L18 -20H-18Z" fill="#4a3a4a"/><path d="M-12 -20V0M12 -20V0" stroke="#2a1e1e" stroke-width="7"/></g>
   <g transform="translate(620 350) scale(.85)"><circle cx="0" cy="-86" r="11" fill="#3a2a26"/><path d="M-15 -72H15L18 -20H-18Z" fill="#6a4a3a"/><path d="M-12 -20V0M12 -20V0" stroke="#2a1e1e" stroke-width="7"/></g></g>
   <rect width="${W}" height="${H}" fill="#ffb060" opacity=".06"/>`)
}

writeFileSync(`${outDir}cafe.svg`, cafe())
writeFileSync(`${outDir}canal.svg`, canal())
writeFileSync(`${outDir}gallery.svg`, gallery())
console.log('wrote cafe.svg canal.svg gallery.svg')
