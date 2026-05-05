export function getDashboardSnapshot(state) {
  if (!state) return {}
  return {
    liveKPIs: {
      revenue:     state.revenue,
      orders:      state.orders,
      cartValue:   state.cartValue,
      cartCount:   state.cartCount,
      cartItems:   state.cartItems,
      views:       state.views,
      rateRevenue: state.rateRevenue,
    },
    segmentCounts:     state.segmentCounts    ?? {},
    segmentFinance:    state.segFinance       ?? {},
    categoryData:      state.catData          ?? {},
    interactionCounts: state.interactionCounts ?? {},
    activeSegments:    [...(state.activeSegments ?? [])],
    recentEvents:      state.recentEvents?.slice(0, 20) ?? [],
    miBaseline:        state.miBaseline       ?? null,
    mode:              state.mode,
  }
}
