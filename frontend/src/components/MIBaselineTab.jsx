import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { fmtEurK } from '../constants.js'

function fmtRevMI(v) {
  if (!v) return '—'
  return v >= 1000 ? '€' + (v / 1000).toFixed(0) + 'K' : '€' + v
}

function MIRows({ rows, maxRate, avgRate }) {
  if (!rows?.length) return <div style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:12 }}>No data</div>

  return rows.map((r, i) => {
    const pct = Math.round((r.return_rate_qty / maxRate) * 100)
    const col = r.return_rate_qty >= avgRate * 1.15
      ? '#EF4444'
      : r.return_rate_qty >= avgRate
        ? '#F59E0B'
        : '#7B6FE8'
    const name = r.key?.length > 22 ? r.key.substring(0, 20) + '…' : r.key

    return (
      <div key={i} className="mi-row">
        <span className="mi-key" title={r.key}>{name}</span>
        <span className="mi-rate" style={{ color: col }}>{r.return_rate_qty}%</span>
        <div className="mi-bar-wrap">
          <div className="mi-bar" style={{ width: pct + '%', background: col }} />
        </div>
        <span className="mi-rev">{fmtRevMI(r.net_revenue)}</span>
        <span className="mi-orders">{r.orders?.toLocaleString()}</span>
      </div>
    )
  })
}

export default function MIBaselineTab() {
  const { miBaseline } = useContext(DashboardContext)

  if (!miBaseline) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>MI Baseline not available</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Check MAPP_CLIENT_ID / MAPP_CLIENT_SECRET in .env and restart the backend.
        </div>
      </div>
    )
  }

  const s       = miBaseline.summary ?? {}
  const avgRate = s.avg_return_rate ?? 13.6
  const topCat  = miBaseline.by_category?.[0]
  const topOcc  = miBaseline.by_occasion?.[0]
  const maxCat  = miBaseline.by_category?.[0]?.return_rate_qty ?? 20
  const maxOcc  = miBaseline.by_occasion?.[0]?.return_rate_qty ?? 20
  const maxSku  = miBaseline.by_sku?.[0]?.return_rate_qty ?? 20

  return (
    <>
      {/* Summary KPIs */}
      <div className="mi-kpis">
        <div className="mi-kpi c1">
          <div className="mi-kpi-label">Avg Return Rate</div>
          <div className="mi-kpi-value">{avgRate}%</div>
          <div className="mi-kpi-sub">28-day baseline</div>
        </div>
        <div className="mi-kpi c2">
          <div className="mi-kpi-label">Total SKUs</div>
          <div className="mi-kpi-value">{s.total_skus?.toLocaleString() ?? '—'}</div>
          <div className="mi-kpi-sub">with return data</div>
        </div>
        <div className="mi-kpi c3">
          <div className="mi-kpi-label">Top Risk Category</div>
          <div className="mi-kpi-value" style={{ fontSize: 18 }}>{topCat?.key ?? '—'}</div>
          <div className="mi-kpi-sub">{topCat ? topCat.return_rate_qty + '% return rate' : ''}</div>
        </div>
        <div className="mi-kpi c4">
          <div className="mi-kpi-label">Top Risk Occasion</div>
          <div className="mi-kpi-value" style={{ fontSize: 18 }}>{topOcc?.key ?? '—'}</div>
          <div className="mi-kpi-sub">{topOcc ? topOcc.return_rate_qty + '% return rate' : ''}</div>
        </div>
      </div>

      {/* By Category + By Occasion */}
      <div className="mi-grid">
        <div className="mi-card">
          <div className="mi-hdr">
            <div>
              <div className="mi-title">By Category</div>
              <div className="mi-sub">Return rate · Revenue · Orders</div>
            </div>
          </div>
          <div className="mi-body">
            <div className="mi-row hdr">
              <span>Category</span><span>Rate</span><span>Bar</span>
              <span style={{ textAlign:'right' }}>Revenue</span>
              <span style={{ textAlign:'right' }}>Orders</span>
            </div>
            <MIRows rows={miBaseline.by_category} maxRate={maxCat} avgRate={avgRate} />
          </div>
        </div>

        <div className="mi-card">
          <div className="mi-hdr">
            <div>
              <div className="mi-title">By Occasion</div>
              <div className="mi-sub">Return rate · Revenue · Orders</div>
            </div>
          </div>
          <div className="mi-body">
            <div className="mi-row hdr">
              <span>Occasion</span><span>Rate</span><span>Bar</span>
              <span style={{ textAlign:'right' }}>Revenue</span>
              <span style={{ textAlign:'right' }}>Orders</span>
            </div>
            <MIRows rows={miBaseline.by_occasion?.slice(0, 15)} maxRate={maxOcc} avgRate={avgRate} />
          </div>
        </div>
      </div>

      {/* Top SKUs */}
      <div className="mi-card" style={{ marginBottom: 16 }}>
        <div className="mi-hdr">
          <div>
            <div className="mi-title">Top Return SKUs</div>
            <div className="mi-sub">Highest return rate products (top 20)</div>
          </div>
        </div>
        <div className="mi-body">
          <div className="mi-row hdr">
            <span>SKU / Product</span><span>Rate</span><span>Bar</span>
            <span style={{ textAlign:'right' }}>Revenue</span>
            <span style={{ textAlign:'right' }}>Orders</span>
          </div>
          <MIRows rows={miBaseline.by_sku?.slice(0, 20)} maxRate={maxSku} avgRate={avgRate} />
        </div>
      </div>
    </>
  )
}
