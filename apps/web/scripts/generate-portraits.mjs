// Generates the fictional, painterly demo portraits in public/images/avatars.
// Run: node scripts/generate-portraits.mjs
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const W = 600
const H = 760
const outDir = fileURLToPath(new URL('../public/images/avatars/', import.meta.url))

function rng(seed) {
  let value = seed
  return () => { value = (value * 16807) % 2147483647; return (value - 1) / 2147483646 }
}
const f = (n) => Number(n.toFixed(1))

function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  const r = mix(n >> 16), g = mix((n >> 8) & 255), b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

function bokeh(p, next) {
  return p.bokeh.map(([color, count]) => Array.from({ length: count }, () => {
    const r = 18 + next() * 60
    return `<circle cx="${f(next() * W)}" cy="${f(next() * H * 0.75)}" r="${f(r)}" fill="${color}" opacity="${f(0.25 + next() * 0.5)}"/>`
  }).join('')).join('')
}

// Hair strands: quadratic curves that follow a flow field from a start region.
function strands(next, count, make, color, width, opacity) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const [x1, y1, cx, cy, x2, y2] = make(next, i / count)
    out += `<path d="M${f(x1)} ${f(y1)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}" stroke="${color}" stroke-width="${f(width * (0.5 + next()))}" opacity="${f(opacity * (0.5 + next() * 0.7))}"/>`
  }
  return `<g fill="none" stroke-linecap="round">${out}</g>`
}

function portrait(p) {
  const next = rng(p.seed)
  const skin = p.skin
  const skinDark = shade(skin, -0.28)
  const skinDeep = shade(skin, -0.45)
  const skinLight = shade(skin, 0.22)
  const hair = p.hair
  const hairLight = shade(hair, 0.2)
  const hairDark = shade(hair, -0.45)
  const jaw = p.jaw ?? 1
  const cx = 300

  const face = `M300 196C${f(cx + 64)} 196 ${f(cx + 104)} 244 ${f(cx + 104)} 310C${f(cx + 104)} 356 ${f(cx + 98 * jaw)} 392 ${f(cx + 84 * jaw)} 424C${f(cx + 66 * jaw)} 462 ${f(cx + 34 * jaw)} 484 300 486C${f(cx - 34 * jaw)} 484 ${f(cx - 66 * jaw)} 462 ${f(cx - 84 * jaw)} 424C${f(cx - 98 * jaw)} 392 ${f(cx - 104)} 356 ${f(cx - 104)} 310C${f(cx - 104)} 244 ${f(cx - 64)} 196 300 196Z`

  const eye = (x, side) => {
    const y = 322
    const lid = p.female ? 3.6 : 3
    const iris = `url(#iris)`
    return `
      <path d="M${x - 26} ${y + 2}Q${x} ${y - 18} ${x + 26} ${y}" stroke="${skinDark}" stroke-width="6" fill="none" opacity=".35" filter="url(#b3)"/>
      <g clip-path="url(#eye${side})">
        <path d="M${x - 24} ${y}Q${x} ${y - 15} ${x + 24} ${y}Q${x} ${y + 11} ${x - 24} ${y}Z" fill="#efe6e2"/>
        <circle cx="${x + p.gaze}" cy="${y - 1}" r="11" fill="${iris}"/>
        <circle cx="${x + p.gaze}" cy="${y - 1}" r="11" fill="none" stroke="${shade(p.eyes, -0.6)}" stroke-width="1.4" opacity=".7"/>
        <circle cx="${x + p.gaze}" cy="${y - 1}" r="4.6" fill="#0d0a0a"/>
        <path d="M${x - 24} ${y}Q${x} ${y - 15} ${x + 24} ${y}" stroke="#000" stroke-width="7" fill="none" opacity=".18" filter="url(#b2)"/>
        <circle cx="${x + p.gaze + 3.5}" cy="${y - 5}" r="2.6" fill="#fff" opacity=".95"/>
      </g>
      <path d="M${x - 26} ${y + 1}Q${x} ${y - 17} ${x + 26} ${y - 1}" stroke="${shade(hair, -0.5)}" stroke-width="${lid}" fill="none" stroke-linecap="round"/>
      ${p.female ? `<path d="M${x + side * 22} ${y - 4}l${side * 8} -5" stroke="${shade(hair, -0.5)}" stroke-width="2.6" stroke-linecap="round"/>` : ''}
      <path d="M${x - 24} ${y - 9}Q${x} ${y - 27} ${x + 24} ${y - 9}" stroke="${skinDeep}" stroke-width="1.4" fill="none" opacity=".45"/>
      <path d="M${x - 20} ${y + 6}Q${x} ${y + 13} ${x + 20} ${y + 5}" stroke="${skinDeep}" stroke-width="1.2" fill="none" opacity=".35"/>`
  }
  const brow = (x, side) => {
    const y = 290 - (p.browLift ?? 0)
    const t = p.female ? 6 : 9
    const inner = x - side * 30, outer = x + side * 30
    return `<path d="M${inner} ${y + 4}Q${x - side * 4} ${y - 10} ${outer} ${y + 1}Q${x} ${y - 10 + t} ${inner} ${y + 4 + t}Z" fill="${shade(hair, -0.25)}" opacity=".92" filter="url(#b1)"/>`
  }

  const smile = p.smile ?? 6
  const mouth = `
    <path d="M268 ${422 - smile * 0.3}Q300 ${434 + smile * 0.6} 332 ${422 - smile * 0.3}" stroke="${skinDeep}" stroke-width="8" fill="none" opacity=".25" filter="url(#b3)"/>
    <path d="M270 ${421 - smile * 0.4}Q285 412 300 416Q315 412 330 ${421 - smile * 0.4}Q300 ${425 + smile * 0.5} 270 ${421 - smile * 0.4}Z" fill="${shade(p.lips, -0.18)}"/>
    <path d="M272 ${422 - smile * 0.3}Q300 ${427 + smile * 0.5} 328 ${422 - smile * 0.3}Q318 ${441 + smile * 0.2} 300 ${442 + smile * 0.2}Q282 ${441 + smile * 0.2} 272 ${422 - smile * 0.3}Z" fill="url(#lip)"/>
    <ellipse cx="302" cy="${433 + smile * 0.2}" rx="11" ry="3.5" fill="#fff" opacity=".22" filter="url(#b2)"/>
    <path d="M269 ${421 - smile * 0.4}Q300 ${428 + smile * 0.6} 331 ${421 - smile * 0.4}" stroke="${shade(p.lips, -0.55)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <path d="M268 ${419 - smile * 0.5}q-4 3 -3 7M332 ${419 - smile * 0.5}q4 3 3 7" stroke="${skinDeep}" stroke-width="1.6" fill="none" opacity=".5"/>`

  const nose = `
    <path d="M287 318C284 345 279 365 278 382" stroke="${skinDeep}" stroke-width="7" fill="none" opacity=".22" filter="url(#b4)"/>
    <path d="M313 318C316 345 320 362 322 380" stroke="${skinDeep}" stroke-width="5" fill="none" opacity=".12" filter="url(#b4)"/>
    <path d="M300 320C302 345 304 362 306 374" stroke="${skinLight}" stroke-width="7" fill="none" opacity=".35" filter="url(#b4)"/>
    <ellipse cx="302" cy="377" rx="11" ry="8" fill="${skinLight}" opacity=".5" filter="url(#b3)"/>
    <path d="M280 384Q286 396 296 392M320 384Q314 396 304 392" stroke="${skinDeep}" stroke-width="2.4" fill="none" opacity=".55" filter="url(#b1)"/>
    <ellipse cx="290" cy="391" rx="6" ry="3" fill="${shade(skin, -0.62)}" opacity=".6" filter="url(#b1)"/>
    <ellipse cx="310" cy="391" rx="6" ry="3" fill="${shade(skin, -0.62)}" opacity=".6" filter="url(#b1)"/>
    <ellipse cx="300" cy="404" rx="12" ry="7" fill="${skinDark}" opacity=".25" filter="url(#b3)"/>`

  // Hair is split into a back mass (behind the head) and a front mass with strands.
  let hairBack = ''
  let hairFront = ''
  if (p.style === 'long') {
    const len = p.length ?? 700
    hairBack = `<path d="M300 150C390 150 438 220 440 320C442 420 470 520 ${500} ${len}L100 ${len}C130 520 158 420 160 320C162 220 210 150 300 150Z" fill="url(#hairG)"/>
      ${strands(next, 140, (n, t) => { const side = t < 0.5 ? -1 : 1; const x = 300 + side * (90 + n() * 60); return [300 + side * n() * 40, 170 + n() * 30, x + side * 40, 380 + n() * 80, x + side * (10 + n() * 70), len - 40 - n() * 120] }, hairLight, 2.2, 0.35)}
      ${strands(next, 90, (n, t) => { const side = t < 0.5 ? -1 : 1; const x = 300 + side * (100 + n() * 50); return [300 + side * n() * 30, 175, x + side * 30, 400, x + side * n() * 50, len - 80 - n() * 100] }, hairDark, 3, 0.4)}`
    const part = p.part ?? -1
    hairFront = `<path d="M${300 + part * 18} 168C${300 + part * 70} 170 ${300 - part * 110} 200 ${300 - part * 112} 300C${300 - part * 118} 380 ${300 - part * 122} 460 ${300 - part * 132} 560L${300 - part * 100} 560C${300 - part * 92} 450 ${300 - part * 90} 360 ${300 - part * 70} 290C${300 - part * 46} 236 ${300 + part * 20} 214 ${300 + part * 18} 168Z" fill="url(#hairG)"/>
      <path d="M${300 + part * 18} 168C${300 + part * 70} 172 ${300 + part * 108} 210 ${300 + part * 112} 290C${300 + part * 116} 380 ${300 + part * 124} 470 ${300 + part * 136} 560L${300 + part * 106} 560C${300 + part * 98} 470 ${300 + part * 100} 380 ${300 + part * 90} 300C${300 + part * 80} 250 ${300 + part * 50} 226 ${300 + part * 18} 168Z" fill="url(#hairG)"/>
      ${strands(next, 70, (n) => [300 + part * 18 + n() * 8, 172 + n() * 8, 300 - part * (60 + n() * 40), 220 + n() * 40, 300 - part * (95 + n() * 30), 320 + n() * 220], hairLight, 1.6, 0.5)}
      ${strands(next, 50, (n) => [300 + part * 22, 172 + n() * 8, 300 + part * (80 + n() * 30), 230 + n() * 30, 300 + part * (100 + n() * 30), 330 + n() * 220], hairLight, 1.6, 0.45)}`
  } else {
    const volume = p.style === 'wavy' ? 1 : 0.55
    hairBack = `<path d="M196 330C178 230 220 ${f(150 - 20 * volume)} 300 ${f(146 - 22 * volume)}C384 ${f(142 - 22 * volume)} 426 228 404 330C400 290 394 262 380 246L220 246C206 262 200 290 196 330Z" fill="url(#hairG)"/>`
    const crown = Array.from({ length: 25 }, (_, i) => {
      const t = i / 24
      const angle = Math.PI * (1.04 + t * 0.92)
      const rx = 112, ry = 118 + 34 * volume
      const wobble = (p.style === 'wavy' ? 9 : 4) * Math.sin(i * 2.3) + next() * 6 * volume
      return [300 + (rx + wobble) * Math.cos(angle), 300 + (ry + wobble) * Math.sin(angle)]
    })
    const tufts = `<path d="M198 310${crown.map(([x, y], i) => i ? `Q${f((x + crown[i - 1][0]) / 2 + (next() - 0.5) * 6)} ${f((y + crown[i - 1][1]) / 2 - 8 * volume)} ${f(x)} ${f(y)}` : `L${f(x)} ${f(y)}`).join('')}L402 310C394 270 376 250 350 240C320 250 290 236 270 246C240 244 214 262 198 310Z" fill="url(#hairG)"/>`
    hairFront = `<path d="M198 300C196 238 236 188 300 184C366 182 404 232 402 300C394 268 378 248 352 240C326 246 300 236 282 244C256 240 226 252 210 272C204 282 200 290 198 300Z" fill="url(#hairG)"/>${tufts}
      ${strands(next, 160, (n) => { const x = 210 + n() * 180; const y = 170 + n() * 70 - 30 * volume; return [x, y + 30, x + (n() - 0.5) * 50, y - 10 * volume, x + (n() - 0.3) * 70, y - 5 + n() * 30] }, hairLight, 1.8, 0.4)}
      ${strands(next, 80, (n) => { const x = 215 + n() * 170; return [x, 250, x + (n() - 0.5) * 40, 200, x + (n() - 0.5) * 60, 165 + n() * 30] }, hairDark, 2.4, 0.35)}`
  }

  const beard = p.beard ? `
    <g clip-path="url(#faceClip)">
      <path d="M204 360C210 440 252 492 300 494C348 492 390 440 396 360C388 404 366 424 342 430C326 420 274 420 258 430C234 424 212 404 204 360Z" fill="${hairDark}" opacity="${p.beard * 0.55}" filter="url(#b6)"/>
      <path d="M204 360C210 440 252 492 300 494C348 492 390 440 396 360C388 404 366 424 342 430C326 420 274 420 258 430C234 424 212 404 204 360Z" fill="${hair}" opacity="${p.beard}" filter="url(#stubble)"/>
      <path d="M268 410C282 400 318 400 332 410C320 406 280 406 268 410Z" fill="${hairDark}" opacity="${p.beard * 0.9}" filter="url(#b2)"/>
      <path d="M262 412C280 398 320 398 338 412" stroke="${hair}" stroke-width="10" fill="none" opacity="${p.beard * 0.8}" filter="url(#stubble)"/>
    </g>` : ''

  const neckline = p.neckline === 'v'
    ? `<path d="M238 552L300 630L362 552Z" fill="${skinDark}" opacity=".9"/><path d="M238 552L300 630L362 552" stroke="${shade(p.shirt, -0.4)}" stroke-width="5" fill="none"/>`
    : `<path d="M232 552C258 584 342 584 368 552" stroke="${shade(p.shirt, -0.45)}" stroke-width="10" fill="none" stroke-linecap="round"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="105 120 390 560">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.bg[0]}"/><stop offset="1" stop-color="${p.bg[1]}"/></linearGradient>
  <radialGradient id="vignette" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <radialGradient id="skinG" cx="${p.light > 0 ? '.62' : '.38'}" cy=".35" r=".75"><stop stop-color="${skinLight}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${skinDark}"/></radialGradient>
  <linearGradient id="neckG" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${skinDeep}"/><stop offset=".45" stop-color="${skinDark}"/><stop offset="1" stop-color="${skin}"/></linearGradient>
  <linearGradient id="hairG" x1="0" y1="0" x2="${p.light > 0 ? 1 : 0}" y2="1"><stop stop-color="${hairLight}"/><stop offset=".4" stop-color="${hair}"/><stop offset="1" stop-color="${hairDark}"/></linearGradient>
  <linearGradient id="shirtG" x1="0" y1="0" x2="${p.light > 0 ? 1 : 0}" y2="1"><stop stop-color="${shade(p.shirt, 0.18)}"/><stop offset="1" stop-color="${shade(p.shirt, -0.35)}"/></linearGradient>
  <radialGradient id="iris" cx=".45" cy=".4" r=".6"><stop stop-color="${shade(p.eyes, 0.45)}"/><stop offset=".6" stop-color="${p.eyes}"/><stop offset="1" stop-color="${shade(p.eyes, -0.5)}"/></radialGradient>
  <linearGradient id="lip" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${p.lips}"/><stop offset="1" stop-color="${shade(p.lips, -0.25)}"/></linearGradient>
  <clipPath id="faceClip"><path d="${face}"/></clipPath>
  <clipPath id="eye-1"><path d="M234 322Q258 307 282 322Q258 333 234 322Z"/></clipPath>
  <clipPath id="eye1"><path d="M318 322Q342 307 366 322Q342 333 318 322Z"/></clipPath>
  ${[1, 2, 3, 4, 6, 10, 18, 28].map((s) => `<filter id="b${s}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')}
  <filter id="stubble" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="${p.seed}" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.6 1.75" result="dots"/><feComposite in="SourceGraphic" in2="dots" operator="in"/></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .07"/></feComponentTransfer><feComposite in2="SourceGraphic" operator="in"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<g filter="url(#b18)">${bokeh(p, next)}</g>
<g filter="url(#b6)">${p.bokeh.map(([color]) => Array.from({ length: 4 }, () => `<circle cx="${f(next() * W)}" cy="${f(next() * H * 0.6)}" r="${f(6 + next() * 14)}" fill="${color}" opacity=".55"/>`).join('')).join('')}</g>
${hairBack}
<path d="M10 ${H}C24 630 140 562 232 548L368 548C460 562 576 630 590 ${H}Z" fill="url(#shirtG)"/>
<path d="M10 ${H}C24 630 140 562 232 548L368 548C460 562 576 630 590 ${H}Z" fill="#000" opacity=".25" filter="url(#b18)" transform="translate(${p.light > 0 ? -30 : 30} 0)"/>
<path d="M244 430C246 480 240 530 232 552C262 576 338 576 368 552C360 530 354 480 356 430Z" fill="url(#neckG)"/>
<ellipse cx="300" cy="492" rx="70" ry="26" fill="${skinDeep}" opacity=".6" filter="url(#b10)"/>
${neckline}
<ellipse cx="196" cy="338" rx="15" ry="31" fill="${skinDark}"/><ellipse cx="404" cy="338" rx="15" ry="31" fill="${skinDark}"/>
<ellipse cx="198" cy="338" rx="7" ry="18" fill="${skinDeep}" opacity=".5" filter="url(#b2)"/><ellipse cx="402" cy="338" rx="7" ry="18" fill="${skinDeep}" opacity=".5" filter="url(#b2)"/>
<path d="${face}" fill="url(#skinG)"/>
<g clip-path="url(#faceClip)">
  <ellipse cx="${p.light > 0 ? 200 : 400}" cy="340" rx="50" ry="170" fill="${skinDeep}" opacity=".45" filter="url(#b18)"/>
  <ellipse cx="${p.light > 0 ? 410 : 190}" cy="330" rx="30" ry="150" fill="${skinDark}" opacity=".25" filter="url(#b18)"/>
  <ellipse cx="300" cy="250" rx="70" ry="38" fill="${skinLight}" opacity=".45" filter="url(#b18)"/>
  <ellipse cx="300" cy="470" rx="90" ry="26" fill="${skinDeep}" opacity=".35" filter="url(#b10)"/>
  <ellipse cx="248" cy="380" rx="32" ry="20" fill="${p.blush}" opacity="${p.female ? 0.4 : 0.22}" filter="url(#b10)"/>
  <ellipse cx="352" cy="380" rx="32" ry="20" fill="${p.blush}" opacity="${p.female ? 0.4 : 0.22}" filter="url(#b10)"/>
  <ellipse cx="258" cy="338" rx="20" ry="7" fill="${skinDeep}" opacity=".14" filter="url(#b6)"/>
  <ellipse cx="342" cy="338" rx="20" ry="7" fill="${skinDeep}" opacity=".14" filter="url(#b6)"/>
  <ellipse cx="232" cy="360" rx="20" ry="16" fill="${skinLight}" opacity=".25" filter="url(#b6)"/><ellipse cx="368" cy="360" rx="20" ry="16" fill="${skinLight}" opacity=".25" filter="url(#b6)"/><ellipse cx="208" cy="290" rx="18" ry="44" fill="${skinDeep}" opacity=".35" filter="url(#b10)"/><ellipse cx="392" cy="290" rx="18" ry="44" fill="${skinDeep}" opacity=".35" filter="url(#b10)"/><ellipse cx="300" cy="462" rx="30" ry="12" fill="${skinLight}" opacity=".35" filter="url(#b6)"/>
  <rect width="${W}" height="${H}" fill="#fff" filter="url(#grain)"/>
  <path d="M200 236C240 222 360 222 400 236L400 200L200 200Z" fill="${skinDeep}" opacity=".35" filter="url(#b10)"/>
</g>
${nose}
${eye(258, -1)}${eye(342, 1)}
${brow(258, -1)}${brow(342, 1)}
${mouth}
${beard}
${hairFront}
<path d="M${p.light > 0 ? 404 : 196} 250C${p.light > 0 ? 420 : 180} 320 ${p.light > 0 ? 410 : 190} 400 ${p.light > 0 ? 384 : 216} 440" stroke="${p.rim}" stroke-width="5" fill="none" opacity=".5" filter="url(#b4)"/>
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`
}

const people = {
  daniel: { seed: 11, style: 'wavy', skin: '#d9a182', hair: '#3b2418', eyes: '#5b3a22', lips: '#b9716a', blush: '#d77a6e', shirt: '#1d2440', beard: 0.85, jaw: 1.04, smile: 7, gaze: 0, light: 1, rim: '#ffd29a', bg: ['#3d4a2a', '#24191a'], bokeh: [['#e0a24a', 8], ['#7a9a46', 7], ['#f2d08a', 4]] },
  emma: { seed: 23, style: 'long', female: true, part: -1, skin: '#e2ae92', hair: '#2a1712', eyes: '#4a2c1c', lips: '#c46f6e', blush: '#e08080', shirt: '#161419', jaw: 0.9, smile: 9, gaze: 1, light: -1, rim: '#f5d8c8', length: 720, bg: ['#cfc5bd', '#7b716c'], bokeh: [['#ffffff', 6], ['#e9d8c8', 6]] },
  sophie: { seed: 37, style: 'long', female: true, part: 1, skin: '#eab89c', hair: '#7a4f30', eyes: '#5d6b4a', lips: '#d0807c', blush: '#ee8f8a', shirt: '#c99aa8', jaw: 0.88, smile: 6, gaze: -1, light: 1, rim: '#fff0dc', length: 700, bg: ['#d9d2cc', '#9c938d'], bokeh: [['#ffffff', 7], ['#f2e4d4', 5]], neckline: 'v' },
  james: { seed: 51, style: 'short', skin: '#a8714f', hair: '#1c120d', eyes: '#2e1d12', lips: '#8f5548', blush: '#b0604f', shirt: '#17161b', beard: 0.6, jaw: 1.06, smile: 5, gaze: 0, light: 1, rim: '#ffc890', bg: ['#2c2622', '#121012'], bokeh: [['#8a6a4a', 6], ['#4c4038', 6]] },
  me: { seed: 67, style: 'long', female: true, part: -1, skin: '#b9805e', hair: '#1f130e', eyes: '#3a2416', lips: '#a8645a', blush: '#c46e5e', shirt: '#4a4650', jaw: 0.9, smile: 8, gaze: 0, light: -1, rim: '#f0c8ff', length: 740, bg: ['#4a2f5e', '#1c1428'], bokeh: [['#b07ad8', 6], ['#e8a0c0', 4]] },
}

for (const [name, params] of Object.entries(people)) {
  writeFileSync(`${outDir}${name}.svg`, portrait(params))
  console.log(`wrote ${name}.svg`)
}
