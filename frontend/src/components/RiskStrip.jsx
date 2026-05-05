import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'

function timeSince(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

const BUCKETS = [
  { key: 'high',   dot: 'red',   activeClass: 'active-red',   titleClass: 'red',   defaultLabel: 'High Risk' },
  { key: 'medium', dot: 'amber', activeClass: 'active-amber', titleClass: 'amber', defaultLabel: 'Medium Risk' },
  { key: 'low',    dot: 'green', activeClass: 'active-green', titleClass: 'green', defaultLabel: 'Low Risk' },
]

export default function RiskStrip() {
  const { riskState, miBaseline } = useContext(DashboardContext)
  const avgRate = miBaseline?.summary?.avg_return_rate ?? null

  return (
    <div className="risk-strip">
      <span className="risk-strip-label">Return Risk</span>
      <div className="risk-lights">
        {BUCKETS.map(b => {
          const s = riskState[b.key]
          const active = s.rate > 0
          return (
            <div key={b.key} className={`risk-light ${active ? b.activeClass : 'inactive'}`}>
              <div className={`risk-dot ${b.dot}${!active ? ' off' : ''}${b.key === 'high' && active ? ' pulse' : ''}`}
                style={active ? {} : { background: '#D1D5DB' }}
              />
              <div className="risk-light-text">
                <div className={`risk-light-title ${active ? b.titleClass : 'off'}`}>
                  {active ? `${s.rate}% · ${s.cat || s.product?.name || '—'}` : b.defaultLabel}
                </div>
                <div className="risk-light-sub">
                  {active
                    ? `${s.type?.toUpperCase()} · ${timeSince(s.ts)}`
                    : 'no events yet'
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {avgRate !== null && (
        <span className="risk-avg">28d avg: {avgRate}%</span>
      )}
    </div>
  )
}
