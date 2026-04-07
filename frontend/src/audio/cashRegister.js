/**
 * Vintage cash register sound — Web Audio API only. No audio files.
 * Purchase: key thud → latch → drawer → cha-ching → coin shimmer
 * Cart add:  single soft click
 */
let ctx = null
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}
export function unlockAudio() {
  const c = getCtx()
  if (c.state === 'suspended') c.resume()
}
function noise(ac, t, freq, dur, vol) {
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource(); src.buffer = buf
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 1.8
  const env = ac.createGain()
  env.gain.setValueAtTime(vol, t)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur)
  src.connect(bp); bp.connect(env); env.connect(ac.destination)
  src.start(t); src.stop(t + dur + 0.01)
}
function ping(ac, t, freq, dur, vol) {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  osc.frequency.exponentialRampToValueAtTime(freq * 0.995, t + dur)
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(vol, t + 0.006)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(env); env.connect(ac.destination)
  osc.start(t); osc.stop(t + dur + 0.01)
}
export function playPurchaseSound() {
  try {
    const ac = getCtx(); const t = ac.currentTime
    noise(ac, t,       220, 0.055, 0.55); noise(ac, t,       480, 0.030, 0.30)
    noise(ac, t+0.045, 900, 0.022, 0.45); noise(ac, t+0.048, 1600, 0.012, 0.20)
    noise(ac, t+0.100, 140, 0.065, 0.60); noise(ac, t+0.100, 300,  0.035, 0.25)
    [[1318,.18],[1397,.13],[1480,.09]].forEach(([f,v],i) =>
      ping(ac, t+0.14+i*0.012, f, 0.55-i*0.08, v))
    ping(ac, t+0.15, 2637, 0.22, 0.04)
    const sb = ac.createBuffer(1, Math.ceil(ac.sampleRate*0.4), ac.sampleRate)
    const sd = sb.getChannelData(0)
    for (let i=0; i<sd.length; i++) sd[i] = Math.random()*2-1
    const ss = ac.createBufferSource(); ss.buffer = sb
    const hp = ac.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=4000
    const se = ac.createGain()
    se.gain.setValueAtTime(0.06, t+0.22)
    se.gain.exponentialRampToValueAtTime(0.001, t+0.60)
    ss.connect(hp); hp.connect(se); se.connect(ac.destination)
    ss.start(t+0.22); ss.stop(t+0.65)
  } catch {}
}
export function playCartSound() {
  try {
    const ac = getCtx(); const t = ac.currentTime
    noise(ac, t, 320, 0.025, 0.30)
    noise(ac, t+0.01, 700, 0.012, 0.18)
  } catch {}
}
