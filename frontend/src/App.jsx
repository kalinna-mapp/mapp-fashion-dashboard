import { useContext } from 'react'
import { DashboardContext } from './context/dashboardContext.js'
import ChatDrawer          from './components/ChatDrawer.jsx'
import Header              from './components/Header.jsx'
import GlobalKpiStrip      from './components/GlobalKpiStrip.jsx'
import SegmentCards        from './components/SegmentCards.jsx'
import FilterBar           from './components/FilterBar.jsx'
import InteractionCounters from './components/InteractionCounters.jsx'
import RunwayLanes         from './components/RunwayLanes.jsx'
import RevenueTable        from './components/RevenueTable.jsx'
import CartDistribution    from './components/CartDistribution.jsx'
import CategoryHeatmap     from './components/CategoryHeatmap.jsx'
import EventLog            from './components/EventLog.jsx'
import RiskStrip           from './components/RiskStrip.jsx'
import MIBaselineTab       from './components/MIBaselineTab.jsx'
import ForecastTab         from './components/ForecastTab.jsx'

const TABS = [
  { id: 'stream',   label: 'Live Stream' },
  { id: 'mi',       label: 'MI Baseline' },
  { id: 'forecast', label: 'Forecast' },
]

export default function App() {
  const { tab, setTab } = useContext(DashboardContext)

  return (
    <>
      <ChatDrawer />
      <Header />
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'26px 36px 60px', position:'relative', zIndex:1 }}>

        <nav className="tab-nav">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'stream' && (
          <>
            <RiskStrip />
            <GlobalKpiStrip />
            <SegmentCards />
            <FilterBar />
            <InteractionCounters />
            <RunwayLanes />
            <div className="bottom">
              <RevenueTable />
              <CartDistribution />
              <EventLog />
            </div>
          </>
        )}

        {tab === 'mi' && <MIBaselineTab />}

        {tab === 'forecast' && <ForecastTab />}

      </main>
    </>
  )
}
