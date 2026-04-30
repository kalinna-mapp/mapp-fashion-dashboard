// App.jsx
// Root component — assembles all dashboard sections.
// Component implementations: see each file in src/components/
// Full specification: docs/PROMPT.md

import Header              from './components/Header.jsx'
import ChatDrawer          from './components/ChatDrawer.jsx'
import GlobalKpiStrip      from './components/GlobalKpiStrip.jsx'
import SegmentCards        from './components/SegmentCards.jsx'
import FilterBar           from './components/FilterBar.jsx'
import InteractionCounters from './components/InteractionCounters.jsx'
import RunwayLanes         from './components/RunwayLanes.jsx'
import RevenueTable        from './components/RevenueTable.jsx'
import CartDistribution    from './components/CartDistribution.jsx'
import CategoryHeatmap     from './components/CategoryHeatmap.jsx'
import EventLog            from './components/EventLog.jsx'

export default function App() {
  return (
    <>
      <ChatDrawer />
      <Header />
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '26px 36px 60px', position: 'relative', zIndex: 1 }}>
        <GlobalKpiStrip />
        <SegmentCards />
        <FilterBar />
        <InteractionCounters />
        <RunwayLanes />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <RevenueTable />
          <CartDistribution />
          <EventLog />
        </div>
      </main>
    </>
  )
}
