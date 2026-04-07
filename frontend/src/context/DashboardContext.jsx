/**
 * DashboardContext — single source of truth.
 * Segment assignment is SIMULATED — see docs/ROADMAP.md Phase 3.
 */
import { createContext, useReducer, useCallback, useRef } from 'react'
import { useStream } from '../hooks/useStream'
import { playPurchaseSound, playCartSound, unlockAudio } from '../audio/cashRegister'

export const DashboardContext = createContext(null)

const ALL_SEGS = ['party','beach','casual','work','date']
const initF = () => ({ revenue:0, orders:0, cartValue:0, cartCount:0, cartItems:0 })

const initialState = {
  revenue:0, cartValue:0, orders:0, cartCount:0, cartItems:0, views:0, rateRevenue:0,
  segmentCounts: { party:0, beach:0, casual:0, work:0, date:0 },
  segFinance: { party:initF(), beach:initF(), casual:initF(), work:initF(), date:initF() },
  interactionCounts: { view:0, cart:0, buy:0 },
  catData: {
    Dresses:{view:0,cart:0,buy:0}, Shoes:{view:0,cart:0,buy:0},
    Jackets:{view:0,cart:0,buy:0}, Accessories:{view:0,cart:0,buy:0},
    Trousers:{view:0,cart:0,buy:0}, Swimwear:{view:0,cart:0,buy:0},
  },
  recentEvents: [],
  activeSegments: new Set(ALL_SEGS),
  soundOn: true,
  mode: 'MOCK',
}

function reducer(state, action) {
  switch (action.type) {
    case 'EVENT': {
      const { interaction, product, segment, adjusted_price, cart_items } = action.payload
      const seg = segment || 'casual'
      const f  = { ...state.segFinance[seg] }
      const ic = { ...state.interactionCounts }
      const cd = { ...state.catData }
      ic[interaction] = (ic[interaction]||0) + 1
      if (cd[product.category]) {
        cd[product.category] = { ...cd[product.category], [interaction]: cd[product.category][interaction]+1 }
      }
      if (interaction === 'buy')  { f.revenue += adjusted_price; f.orders += 1 }
      if (interaction === 'cart') { f.cartValue += adjusted_price; f.cartCount += 1; f.cartItems += cart_items }
      return {
        ...state,
        segFinance: { ...state.segFinance, [seg]: f },
        interactionCounts: ic,
        catData: cd,
        recentEvents: [{ ...action.payload, _id: Date.now()+Math.random() }, ...state.recentEvents].slice(0,10),
      }
    }
    case 'AGGREGATE':
      return { ...state,
        revenue: action.p.revenue, cartValue: action.p.cart_value,
        orders: action.p.orders, cartCount: action.p.cart_count,
        cartItems: action.p.cart_items, views: action.p.views,
        rateRevenue: action.p.rate_revenue, segmentCounts: action.p.segment_counts,
      }
    case 'TOGGLE_SEG': {
      const s = new Set(state.activeSegments)
      if (s.has(action.id)) { if (s.size > 1) s.delete(action.id) } else s.add(action.id)
      return { ...state, activeSegments: s }
    }
    case 'RESET_SEGS':   return { ...state, activeSegments: new Set(ALL_SEGS) }
    case 'TOGGLE_SOUND': return { ...state, soundOn: !state.soundOn }
    case 'SET_MODE':     return { ...state, mode: action.mode }
    default: return state
  }
}

export function DashboardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const soundRef = useRef(state.soundOn)
  soundRef.current = state.soundOn

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'event') {
      dispatch({ type: 'EVENT', payload: msg })
      if (soundRef.current) {
        if (msg.interaction === 'buy')  playPurchaseSound()
        if (msg.interaction === 'cart') playCartSound()
      }
    } else if (msg.type === 'aggregate') {
      dispatch({ type: 'AGGREGATE', p: msg })
    }
  }, [])

  useStream(handleMessage)

  return (
    <DashboardContext.Provider value={{
      ...state,
      toggleSeg:   (id) => { unlockAudio(); dispatch({ type:'TOGGLE_SEG', id }) },
      resetSegs:   ()   => dispatch({ type:'RESET_SEGS' }),
      toggleSound: ()   => { unlockAudio(); dispatch({ type:'TOGGLE_SOUND' }) },
    }}>
      {children}
    </DashboardContext.Provider>
  )
}
