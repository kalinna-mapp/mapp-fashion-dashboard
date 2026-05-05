import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { CATS, CAT_EMOJI } from '../constants.js'

function heatBg(total) {
  if (total === 0) return 'var(--bg)'
  if (total < 10)  return 'rgba(123,111,232,0.07)'
  if (total < 30)  return 'rgba(123,111,232,0.13)'
  if (total < 60)  return 'rgba(123,111,232,0.20)'
  return 'rgba(123,111,232,0.28)'
}

export default function CategoryHeatmap() {
  const { catData } = useContext(DashboardContext)

  return (
    <div className="bcard">
      <div className="bcard-hdr">
        <div className="bcard-title">Category Heatmap</div>
        <div className="bcard-sub">Views · Cart · Purchases</div>
      </div>
      <div className="hm-grid">
        {CATS.map(cat => {
          const d     = catData[cat] ?? { view: 0, cart: 0, buy: 0 }
          const total = d.view + d.cart + d.buy
          const sum   = Math.max(total, 1)

          return (
            <div key={cat} className="hm-cell" style={{ background: heatBg(total) }}>
              <div className="hm-cat">{CAT_EMOJI[cat]} {cat}</div>
              <div className="hm-val">{total.toLocaleString('en-US')}</div>
              <div className="hm-bars">
                <div className="hm-v" style={{ flex: d.view / sum }} />
                <div className="hm-c" style={{ flex: d.cart / sum }} />
                <div className="hm-b" style={{ flex: d.buy  / sum }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
