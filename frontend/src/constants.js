export const SEGS = [
  { id:'none',     label:'Non-Customer',   icon:'👤', color:'#8B87A0', weight:40, cartItems:1.2 },
  { id:'once',     label:'One-Time Buyer', icon:'🛍', color:'#7B6FE8', weight:30, cartItems:1.8 },
  { id:'loyal',    label:'Loyal Customer', icon:'⭐', color:'#10B981', weight:18, cartItems:2.6 },
  { id:'returner', label:'Returner',       icon:'↩️', color:'#F59E0B', weight:12, cartItems:2.1 },
]

export const SEG_MAP = Object.fromEntries(SEGS.map(s => [s.id, s]))

export const PRODUCTS = [
  { name:'Summer Dress Lina',   cat:'Dresses',     price:79.99,  emoji:'👗' },
  { name:'Floral Midi Skirt',   cat:'Dresses',     price:59.99,  emoji:'👗' },
  { name:'Wrap Dress Sienna',   cat:'Dresses',     price:94.99,  emoji:'👗' },
  { name:'Linen Dress Mara',    cat:'Dresses',     price:69.99,  emoji:'👗' },
  { name:'Cloud Run Sneaker',   cat:'Shoes',       price:129.99, emoji:'👟' },
  { name:'Palma Sandal',        cat:'Shoes',       price:89.99,  emoji:'👡' },
  { name:'Satin Mule Nude',     cat:'Shoes',       price:74.99,  emoji:'👡' },
  { name:'Ecru Linen Blazer',   cat:'Jackets',     price:149.99, emoji:'🧥' },
  { name:'Washed Denim Jacket', cat:'Jackets',     price:119.99, emoji:'🧥' },
  { name:'Silk Scarf Tulum',    cat:'Accessories', price:39.99,  emoji:'🧣' },
  { name:'Straw Bag Ibiza',     cat:'Accessories', price:54.99,  emoji:'👜' },
  { name:'Riviera Sunglasses',  cat:'Accessories', price:44.99,  emoji:'🕶️' },
  { name:'Wide-Leg Jeans Maya', cat:'Trousers',    price:99.99,  emoji:'👖' },
  { name:'Linen Capri Pants',   cat:'Trousers',    price:79.99,  emoji:'👖' },
  { name:'Coral Bikini Set',    cat:'Swimwear',    price:69.99,  emoji:'👙' },
  { name:'Riviera Swimsuit',    cat:'Swimwear',    price:84.99,  emoji:'🩱' },
]

export const CATS = ['Dresses', 'Shoes', 'Jackets', 'Accessories', 'Trousers', 'Swimwear']

export const CAT_EMOJI = {
  Dresses: '👗', Shoes: '👟', Jackets: '🧥',
  Accessories: '🧣', Trousers: '👖', Swimwear: '👙',
}

export function fmtEurK(v) {
  return v >= 1000 ? '€' + (v / 1000).toFixed(1) + 'K' : '€' + Math.round(v)
}

export function fmtEur(v) {
  return '€' + v.toFixed(2)
}

export function fmtT(d) {
  return d.getHours().toString().padStart(2, '0') + ':' +
    d.getMinutes().toString().padStart(2, '0') + ':' +
    d.getSeconds().toString().padStart(2, '0')
}
