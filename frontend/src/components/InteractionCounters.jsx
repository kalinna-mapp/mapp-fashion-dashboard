import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'

const COUNTERS = [
  { key: 'view', label: 'Page Views',    icon: '👁',  cls: 'view' },
  { key: 'cart', label: 'Cart Adds',     icon: '🛒',  cls: 'cart' },
  { key: 'buy',  label: 'Purchases',     icon: '✓',   cls: 'buy'  },
]

export default function InteractionCounters() {
  const { interactionCounts } = useContext(DashboardContext)
  const total = Object.values(interactionCounts).reduce((s, v) => s + v, 0)

  return (
    <div className="cnt-row">
      {COUNTERS.map(c => (
        <div key={c.key} className="cnt-card">
          <div className={`cnt-icon ${c.cls}`}>{c.icon}</div>
          <div>
            <div className="cnt-lbl">{c.label}</div>
            <div className={`cnt-val ${c.cls}`}>
              {(interactionCounts[c.key] ?? 0).toLocaleString('en-US')}
            </div>
          </div>
        </div>
      ))}
      <div className="cnt-card">
        <div className="cnt-icon total">📊</div>
        <div>
          <div className="cnt-lbl">Total Events</div>
          <div className="cnt-val total">{total.toLocaleString('en-US')}</div>
        </div>
      </div>
    </div>
  )
}
