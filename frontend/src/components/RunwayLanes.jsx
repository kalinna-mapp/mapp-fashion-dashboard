import { useContext, useEffect, useRef, useState } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEGS, SEG_MAP, fmtEur } from '../constants.js'

const LANES = [
  { id: 'view', label: 'Viewed',        dotClass: 'view' },
  { id: 'cart', label: 'Added to Cart', dotClass: 'cart' },
  { id: 'buy',  label: 'Purchased',     dotClass: 'buy'  },
]

let _cardIdSeq = 0

export default function RunwayLanes() {
  const { recentEvents, speed, paused } = useContext(DashboardContext)
  const [cards, setCards] = useState({ view: [], cart: [], buy: [] })
  const laneRefs    = useRef({})
  const lastEventId = useRef(null)

  useEffect(() => {
    if (paused || !recentEvents.length) return
    const newest = recentEvents[0]
    if (!newest || newest._id === lastEventId.current) return
    lastEventId.current = newest._id

    const lane = newest.interaction
    if (!['view', 'cart', 'buy'].includes(lane)) return

    const laneEl = laneRefs.current[lane]
    const travel = laneEl ? laneEl.offsetWidth - 134 + 80 : 800
    const dur    = speed === 500 ? 5 : speed === 1000 ? 9 : 14

    const card = {
      id:       ++_cardIdSeq,
      intType:  lane,
      product:  newest.product ?? {},
      segId:    newest.segment ?? 'once',
      price:    newest.adjusted_price ?? newest.product?.price ?? 0,
      items:    newest.cart_items ?? 1,
      risk:     newest.return_risk ?? null,
      travel,
      dur:      dur + (Math.random() * 1.4 - 0.7),
    }

    setCards(prev => ({ ...prev, [lane]: [...prev[lane], card] }))
  }, [recentEvents, paused, speed])

  function removeCard(lane, id) {
    setCards(prev => ({ ...prev, [lane]: prev[lane].filter(c => c.id !== id) }))
  }

  return (
    <div className="runway">
      <div className="runway-hdr">
        <div>
          <div className="runway-title">Live Product Stream</div>
          <div className="runway-sub">Real-time interactions — newest on the right</div>
        </div>
        <div className="seg-dot-legend">
          {SEGS.map(s => (
            <div key={s.id} className="sdl-item">
              <div className="sdl-dot" style={{ background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="lanes">
        {LANES.map(lane => (
          <div key={lane.id} className="lane" ref={el => laneRefs.current[lane.id] = el}>
            <div className="lane-lbl">
              <div className={`ldot ${lane.dotClass}`} />
              {lane.label}
            </div>
            <div className="lane-track" />
            {cards[lane.id].map(card => (
              <ProductCard key={card.id} card={card} onDone={() => removeCard(lane.id, card.id)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCard({ card, onDone }) {
  const { intType, product, segId, price, items, risk, travel, dur } = card
  const seg      = SEG_MAP[segId] ?? SEG_MAP['once']
  const priceStr = intType === 'view'
    ? '€' + (product.price ?? 0).toFixed(2)
    : fmtEur(price) + (items > 1 ? ' ×' + items : '')

  return (
    <div
      className={`pcard ${intType}`}
      style={{
        left: '134px',
        '--travel': travel + 'px',
        animationDuration: dur + 's',
      }}
      onAnimationEnd={onDone}
    >
      <div className="pcard-emoji">{product.emoji ?? '🛍'}</div>
      <div>
        <div className="pcard-name">{product.name ?? 'Product'}</div>
        <div className="pcard-meta">{product.cat ?? product.category ?? ''}</div>
      </div>
      <div className="pcard-seg" style={{ background: seg.color }} title={seg.label} />
      <span className={`ptag ${intType}`}>{intType === 'buy' ? '✓' : intType === 'cart' ? '🛒' : '👁'}</span>
      <span className={`pprice ${intType}`}>{priceStr}</span>
      {risk && risk.rate > 0 && intType !== 'view' && (
        <span className={`risk-badge ${risk.level}`}>{risk.rate}%</span>
      )}
    </div>
  )
}
