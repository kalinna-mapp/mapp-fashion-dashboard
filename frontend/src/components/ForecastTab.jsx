import { useContext, useEffect, useState } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { fmtEurK } from '../constants.js'

const FC_DAY_HOURS = 16
const FC_OPEN_HOUR = 8
const SESSION_START = Date.now()

const BASE_DAILY_REV    = 41000
const BASE_DAILY_ORDERS = 167

function fcColor(pct) {
  if (pct >= 5)   return 'var(--green)'
  if (pct >= -5)  return 'var(--amber)'
  return '#EF4444'
}

function calcForecast(revenue, orders, views, cartCount, miBaseline) {
  const now          = new Date()
  const hour         = now.getHours() + now.getMinutes() / 60
  const sessionMins  = Math.max(5, (Date.now() - SESSION_START) / 60000)
  const sessionHours = sessionMins / 60
  const remain       = Math.max(0, FC_OPEN_HOUR + FC_DAY_HOURS - hour)

  const revRate   = revenue / sessionHours
  const orderRate = orders  / sessionHours
  const viewRate  = views   / sessionHours
  const cartRate  = cartCount / sessionHours

  const weight      = Math.min(sessionMins / 30, 1) * 0.7
  const baseRevRate = BASE_DAILY_REV / FC_DAY_HOURS
  const blended     = revRate * weight + baseRevRate * (1 - weight)

  const projRev    = revenue + blended * remain
  const projOrders = orders  + (orderRate * weight + (BASE_DAILY_REV / FC_DAY_HOURS / 200) * (1 - weight)) * remain
  const projViews  = views   + viewRate * remain
  const projCart   = cartCount + cartRate * remain

  const baseDailyRev  = miBaseline ? BASE_DAILY_REV    : BASE_DAILY_REV
  const baseDailyOrd  = miBaseline ? BASE_DAILY_ORDERS : BASE_DAILY_ORDERS
  const avgReturnRate = miBaseline?.summary?.avg_return_rate ?? 13.6

  const revDiff   = Math.round((projRev    / baseDailyRev  - 1) * 100)
  const ordDiff   = Math.round((projOrders / baseDailyOrd  - 1) * 100)
  const retImpact = projRev * (avgReturnRate / 100)

  return {
    projRev, projOrders, projViews, projCart,
    baseDailyRev, baseDailyOrd, avgReturnRate,
    revDiff, ordDiff, retImpact,
    liveRev: revenue, liveOrders: orders,
    sessionMins,
  }
}

export default function ForecastTab() {
  const { revenue, orders, views, cartCount, miBaseline } = useContext(DashboardContext)
  const [fc, setFc] = useState(() => calcForecast(revenue, orders, views, cartCount, miBaseline))

  useEffect(() => {
    setFc(calcForecast(revenue, orders, views, cartCount, miBaseline))
    const t = setInterval(() => {
      setFc(calcForecast(revenue, orders, views, cartCount, miBaseline))
    }, 5000)
    return () => clearInterval(t)
  }, [revenue, orders, views, cartCount, miBaseline])

  const paceClass = fc.revDiff >= 5 ? 'fc-on-track' : fc.revDiff >= -5 ? 'fc-at-risk' : 'fc-behind'
  const paceLabel = fc.revDiff >= 5 ? 'On Track' : fc.revDiff >= -5 ? 'At Risk' : 'Behind'

  const maxBar   = Math.max(fc.projRev, fc.baseDailyRev) * 1.1
  const livePct  = Math.min((fc.liveRev   / maxBar) * 100, 100)
  const basePct  = Math.min((fc.baseDailyRev / maxBar) * 100, 100)
  const projPct  = Math.min((fc.projRev   / maxBar) * 100, 100)

  const cats = miBaseline?.by_category?.slice(0, 10) ?? []
  const half = Math.ceil(cats.length / 2)

  return (
    <>
      {/* KPI strip */}
      <div className="fc-kpis">
        <div className="fc-kpi c1">
          <div className="fc-kpi-label">Projected Orders</div>
          <div className="fc-kpi-value">{Math.round(fc.projOrders).toLocaleString()}</div>
          <div className="fc-kpi-sub">{fc.baseDailyOrd} daily avg</div>
        </div>
        <div className="fc-kpi c2">
          <div className="fc-kpi-label">Projected Revenue</div>
          <div className="fc-kpi-value">{fmtEurK(fc.projRev)}</div>
          <div className="fc-kpi-sub">{fmtEurK(fc.baseDailyRev)} daily avg</div>
        </div>
        <div className="fc-kpi c3">
          <div className="fc-kpi-label">Revenue Pace</div>
          <div className={`fc-kpi-value ${paceClass}`}>
            {fc.revDiff >= 0 ? '+' : ''}{fc.revDiff}%
          </div>
          <div className={`fc-kpi-sub ${paceClass}`}>{paceLabel}</div>
        </div>
        <div className="fc-kpi c4">
          <div className="fc-kpi-label">Return Impact</div>
          <div className="fc-kpi-value">{fmtEurK(fc.retImpact)}</div>
          <div className="fc-kpi-sub">{fc.avgReturnRate}% avg return rate</div>
        </div>
      </div>

      {/* Bar comparison + metric bars */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Vertical bar chart */}
        <div className="bcard" style={{ padding:'20px 24px' }}>
          <div className="bcard-hdr" style={{ border:'none', padding:'0 0 16px' }}>
            <div className="bcard-title">Revenue Projection</div>
            <div className="bcard-sub">Today live vs. 28d avg vs. forecast</div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:20, height:160, padding:'0 12px' }}>
            {[
              { label:'Today so far', pct:livePct,  color:'var(--violet)',  val:fmtEurK(fc.liveRev) },
              { label:'28d avg',      pct:basePct,  color:'var(--text-muted)', val:fmtEurK(fc.baseDailyRev) },
              { label:'Projected',    pct:projPct,  color:fcColor(fc.revDiff), val:fmtEurK(fc.projRev) },
            ].map(b => (
              <div key={b.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:11, fontWeight:700, color:b.color }}>{b.val}</div>
                <div style={{ width:'100%', borderRadius:6, overflow:'hidden', height:b.pct * 1.4 + 'px', minHeight:4, transition:'height 0.6s', background:b.color, opacity: b.label === '28d avg' ? 0.4 : 1 }} />
                <div style={{ fontSize:10, color:'var(--text-muted)', textAlign:'center', lineHeight:1.3 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Metric progress bars */}
        <div className="bcard" style={{ padding:'20px 24px' }}>
          <div className="bcard-hdr" style={{ border:'none', padding:'0 0 16px' }}>
            <div className="bcard-title">Session Progress</div>
            <div className="bcard-sub">{Math.round(fc.sessionMins)} min into session</div>
          </div>
          {[
            { label:'Revenue',   cur:fc.liveRev,       proj:fc.projRev,    color:'var(--green)',  fmt:fmtEurK },
            { label:'Orders',    cur:fc.liveOrders,     proj:fc.projOrders, color:'var(--violet)', fmt:v => Math.round(v) },
            { label:'Views',     cur:views,             proj:fc.projViews,  color:'var(--violet-light)', fmt:v => Math.round(v).toLocaleString() },
            { label:'Cart Adds', cur:cartCount,         proj:fc.projCart,   color:'var(--pink)',   fmt:v => Math.round(v) },
          ].map(m => {
            const pct = Math.min((m.cur / Math.max(m.proj, 1)) * 100, 100)
            return (
              <div key={m.label} className="fc-mbar">
                <div className="fc-mbar-label">{m.label}</div>
                <div className="fc-mbar-track">
                  <div className="fc-mbar-fill" style={{ width: pct + '%', background: m.color }} />
                </div>
                <div className="fc-mbar-val">{m.fmt(m.cur)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Category forecast (if MI baseline available) */}
      {cats.length > 0 && (
        <div className="bcard" style={{ padding:'20px 24px' }}>
          <div className="bcard-hdr" style={{ border:'none', padding:'0 0 16px' }}>
            <div className="bcard-title">Category Forecast</div>
            <div className="bcard-sub">Projected orders vs. 28d daily average</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 32px' }}>
            {[cats.slice(0, half), cats.slice(half)].map((col, ci) => (
              <div key={ci}>
                {col.map((c, i) => {
                  const projOrd = Math.round(c.orders / 28 * (fc.projOrders / fc.baseDailyOrd))
                  const baseOrd = Math.round(c.orders / 28)
                  const p       = baseOrd ? Math.round((projOrd / baseOrd - 1) * 100) : 0
                  return (
                    <div key={i} className="fc-cat-row">
                      <div className="fc-cat-name">{c.key}</div>
                      <div className="fc-cat-vals">
                        <div className="fc-cat-proj">{projOrd.toLocaleString()}</div>
                        <div className="fc-cat-base">{baseOrd.toLocaleString()} avg</div>
                        <div className="fc-cat-diff" style={{ color: fcColor(p) }}>
                          {p >= 0 ? '+' : ''}{p}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
