import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEGS } from '../constants.js'

export default function FilterBar() {
  const { activeSegments, toggleSeg, resetSegs } = useContext(DashboardContext)
  const active = SEGS.filter(s => activeSegments.has(s.id))

  return (
    <div className="filter-bar">
      <span className="filter-lbl">Segments</span>
      <div className="active-pills">
        {active.map(seg => (
          <span key={seg.id} className={`seg-pill ${seg.id}`}>
            {seg.icon} {seg.label}
          </span>
        ))}
      </div>
      <button className="all-btn" onClick={resetSegs}>Show All</button>
    </div>
  )
}
