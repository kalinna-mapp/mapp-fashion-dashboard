import { useReducer, useCallback, useRef, useEffect } from 'react'
import { useStream } from '../hooks/useStream'
import { playPurchaseSound, playCartSound, unlockAudio } from '../audio/cashRegister'
import { DashboardContext } from './dashboardContext.js'

const ALL_SEGS = ['none', 'once', 'loyal', 'returner']
const initF = () => ({ revenue:0, orders:0, cartValue:0, cartItems:0, cartCount:0 })

const initialState = {
  revenue:0, cartValue:0, orders:0, cartCount:0, cartItems:0, views:0, rateRevenue:0,
  segmentCounts: { none:0, once:0, loyal:0, returner:0 },
  segFinance:    { none:initF(), once:initF(), loyal:initF(), returner:initF() },
  interactionCounts: { view:0, cart:0, buy:0 },
  catData: {
    Dresses:{view:0,cart:0,buy:0}, Shoes:{view:0,cart:0,buy:0},
    Jackets:{view:0,cart:0,buy:0}, Accessories:{view:0,cart:0,buy:0},
    Trousers:{view:0,cart:0,buy:0}, Swimwear:{view:0,cart:0,buy:0},
  },
  recentEvents:  [],
  activeSegments: new Set(ALL_SEGS),
  soundOn: false,
  mode: 'MOCK',
  speed: 1000,
  paused: false,
  tab: 'stream',
  miBaseline: null,
  segHist: { none:[], once:[], loyal:[], returner:[] },
  riskState: {
    high:   { product:null, rate:0, cat:'', type:'', ts:0 },
    medium: { product:null, rate:0, cat:'', type:'', ts:0 },
    low:    { product:null, rate:0, cat:'', type:'', ts:0 },
  },
}

function reducer(state, action) {
  switch (action.type) {

    case 'EVENT': {
      const p = action.payload
      const interaction = p.interaction
      const product     = p.product ?? {}
      const segment     = p.segment
      const return_risk = p.return_risk ?? p.returnRisk ?? null
      // backend sends camelCase; also accept snake_case from future sources
      const price = p.adjusted_price ?? p.adjustedPrice ?? p.orderValue ?? p.basketValue ?? product.price ?? 0
      const items = p.cart_items     ?? p.cartItems     ?? p.basketItems ?? 1

      const seg = (segment && ALL_SEGS.includes(segment)) ? segment : 'once'
      const f   = { ...state.segFinance[seg] }
      const ic  = { ...state.interactionCounts }
      const cd  = { ...state.catData }
      const cat = product.category

      ic[interaction] = (ic[interaction] || 0) + 1
      if (cat && cd[cat]) cd[cat] = { ...cd[cat], [interaction]: cd[cat][interaction] + 1 }

      // backend includes segmentCounts on every event
      const newSegCounts = p.segmentCounts ?? state.segmentCounts

      let newGlobal = {}
      if (interaction === 'buy') {
        f.revenue += price; f.orders++
        newGlobal = { revenue: state.revenue + price, orders: state.orders + 1 }
      } else if (interaction === 'cart') {
        f.cartValue += price; f.cartCount++; f.cartItems += items
        newGlobal = { cartValue: state.cartValue + price, cartCount: state.cartCount + 1, cartItems: state.cartItems + items }
      } else {
        newGlobal = { views: state.views + 1 }
      }

      // Update risk state if event carries return_risk
      let riskState = state.riskState
      if (return_risk && return_risk.rate > 0 && interaction !== 'view') {
        const level = return_risk.level
        const bucket = level === 'high' ? 'high' : level === 'medium' ? 'medium' : level === 'low' ? 'low' : null
        if (bucket) {
          riskState = {
            ...state.riskState,
            [bucket]: { product, rate: return_risk.rate, cat: cat || '', type: interaction, ts: Date.now() },
          }
        }
      }

      return {
        ...state,
        ...newGlobal,
        segFinance:        { ...state.segFinance, [seg]: f },
        interactionCounts: ic,
        catData:           cd,
        riskState,
        segmentCounts:     newSegCounts,
        recentEvents: [
          { ...p, _id: Date.now() + Math.random() },
          ...state.recentEvents,
        ].slice(0, 20),
      }
    }

    case 'AGGREGATE': {
      const p = action.p
      // Update segHist sparklines
      const newHist = {}
      ALL_SEGS.forEach(s => {
        const prev = state.segHist[s] || []
        const next = [...prev, p.segment_counts?.[s] ?? state.segmentCounts[s]]
        newHist[s] = next.length > 8 ? next.slice(-8) : next
      })
      return {
        ...state,
        revenue:      p.revenue       ?? state.revenue,
        cartValue:    p.cart_value     ?? state.cartValue,
        orders:       p.orders         ?? state.orders,
        cartCount:    p.cart_count     ?? state.cartCount,
        cartItems:    p.cart_items     ?? state.cartItems,
        views:        p.views          ?? state.views,
        rateRevenue:  p.rate_revenue   ?? state.rateRevenue,
        segmentCounts: p.segment_counts ?? state.segmentCounts,
        segHist: newHist,
      }
    }

    case 'TOGGLE_SEG': {
      const s = new Set(state.activeSegments)
      if (s.has(action.id)) { if (s.size > 1) s.delete(action.id) } else s.add(action.id)
      return { ...state, activeSegments: s }
    }
    case 'RESET_SEGS':    return { ...state, activeSegments: new Set(ALL_SEGS) }
    case 'TOGGLE_SOUND':  return { ...state, soundOn: !state.soundOn }
    case 'SET_MODE':      return { ...state, mode: action.mode }
    case 'SET_SPEED':     return { ...state, speed: action.speed }
    case 'TOGGLE_PAUSE':  return { ...state, paused: !state.paused }
    case 'SET_TAB':       return { ...state, tab: action.tab }
    case 'SET_MI_BASELINE': return { ...state, miBaseline: action.data }

    default: return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const soundRef  = useRef(state.soundOn)
  const pausedRef = useRef(state.paused)
  soundRef.current  = state.soundOn
  pausedRef.current = state.paused

  const handleMessage = useCallback((msg) => {
    if (pausedRef.current) return
    // Backend sends raw events (no type wrapper) — detect by interaction field
    if (msg.interaction) {
      dispatch({ type: 'EVENT', payload: msg })
      if (soundRef.current) {
        if (msg.interaction === 'buy')  playPurchaseSound()
        if (msg.interaction === 'cart') playCartSound()
      }
    } else if (msg.type === 'aggregate') {
      dispatch({ type: 'AGGREGATE', p: msg })
    } else if (msg.type === 'mode') {
      dispatch({ type: 'SET_MODE', mode: msg.mode })
    }
  }, [])

  useStream(handleMessage)

  // Load mode + MI baseline on mount
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(data => { if (data.mode) dispatch({ type: 'SET_MODE', mode: data.mode }) })
      .catch(() => {})
    fetch('/api/baseline')
      .then(r => r.json())
      .then(data => { if (!data.error) dispatch({ type: 'SET_MI_BASELINE', data }) })
      .catch(() => {})
  }, [])

  const ctx = {
    ...state,
    toggleSeg:    (id) => { unlockAudio(); dispatch({ type: 'TOGGLE_SEG', id }) },
    resetSegs:    ()   => dispatch({ type: 'RESET_SEGS' }),
    toggleSound:  ()   => { unlockAudio(); dispatch({ type: 'TOGGLE_SOUND' }) },
    setSpeed:     (ms) => dispatch({ type: 'SET_SPEED', speed: ms }),
    togglePause:  ()   => dispatch({ type: 'TOGGLE_PAUSE' }),
    setTab:       (tab) => dispatch({ type: 'SET_TAB', tab }),
  }

  return (
    <DashboardContext.Provider value={ctx}>
      {children}
    </DashboardContext.Provider>
  )
}

