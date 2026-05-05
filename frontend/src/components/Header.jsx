import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'

const SPEEDS = [
  { label: 'Slow',   ms: 2000 },
  { label: 'Normal', ms: 1000 },
  { label: 'Fast',   ms: 500  },
]

export default function Header() {
  const { mode, speed, paused, soundOn, setSpeed, togglePause, toggleSound } = useContext(DashboardContext)

  const pillCfg = {
    LIVE:         { bg:'rgba(16,185,129,0.18)',  border:'rgba(16,185,129,0.32)',  color:'#6EE7B7', dot:'#10B981' },
    MOCK:         { bg:'rgba(245,158,11,0.18)',  border:'rgba(245,158,11,0.32)',  color:'#FCD34D', dot:'#F59E0B' },
    RECONNECTING: { bg:'rgba(236,72,153,0.14)',  border:'rgba(236,72,153,0.28)',  color:'#F9A8D4', dot:'#EC4899' },
  }[mode] || { bg:'rgba(245,158,11,0.18)', border:'rgba(245,158,11,0.32)', color:'#FCD34D', dot:'#F59E0B' }

  return (
    <header>
      <div className="logo">
        <div className="logo-dot" />
        Mapp Fashion
      </div>

      <div className="hdr-right">
        <div
          className="live-pill"
          style={{ background: pillCfg.bg, borderColor: pillCfg.border, color: pillCfg.color }}
        >
          <div className="live-dot animate" style={{ background: pillCfg.dot }} />
          <span>{mode}</span>
        </div>

        <div className="spd-wrap">
          <span className="spd-label">Speed</span>
          {SPEEDS.map(s => (
            <button
              key={s.ms}
              className={`spd-btn${speed === s.ms ? ' active' : ''}`}
              onClick={() => setSpeed(s.ms)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button className="pause-btn" onClick={togglePause}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>

        <button className={`sound-btn${soundOn ? ' on' : ''}`} onClick={toggleSound}>
          {soundOn ? '🔔 Sound' : '🔕 Muted'}
        </button>
      </div>
    </header>
  )
}
