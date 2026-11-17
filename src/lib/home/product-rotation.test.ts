import assert from 'node:assert/strict'
import test from 'node:test'

import {
  categoryKey,
  displayPrice,
  interleaveByCategory,
  pickNext,
  seededRandom,
  showcaseProducts,
  type RotatingProduct,
} from './product-rotation.ts'

const p = (id: number, category: number, price = 900, image = 'x.webp', promo: number | null = null): RotatingProduct => ({
  id, prix_vente: price, prix_promo: promo, image_url: image, categorie: { id: category },
})

test('only products of 550 DH and more, with a photo, each once', () => {
  const list = showcaseProducts([
    [p(1, 1, 549), p(2, 1, 550), p(3, 2, 1200, ''), p(4, 2, 800)],
    [p(2, 1, 550), p(5, 3, 1000, 'x', 400)],
  ])
  assert.deepEqual(list.map((x) => x.id), [2, 4]) // 5 costs 400 with its promo
  assert.equal(displayPrice(p(6, 1, 1000, 'x', 700)), 700)
})

test('neighbours come from different categories when possible', () => {
  const pool = [p(1, 1), p(2, 1), p(3, 1), p(4, 2), p(5, 2), p(6, 3)]
  const order = interleaveByCategory(pool, seededRandom(7))
  assert.equal(order.length, 6)
  for (let i = 1; i < 4; i++) assert.notEqual(categoryKey(order[i]), categoryKey(order[i - 1]))
})

test('a new product never repeats one on screen or already shown, and takes a free category', () => {
  const pool = [p(1, 1), p(2, 2), p(3, 1), p(4, 3), p(5, 2), p(6, 4)]
  // Cells show 0 (cat 1) and 1 (cat 2); 0 leaves; 3 was already shown this round.
  const next = pickNext(pool, { shown: [0, 1], used: new Set([0, 1, 3]), leaving: 0 })
  assert.equal(next.resetRound, false)
  assert.equal(next.index, 5) // category 4: nobody shows it, not used yet
})

test('when every product had its turn, a new round starts', () => {
  const pool = [p(1, 1), p(2, 2), p(3, 3)]
  const next = pickNext(pool, { shown: [0, 1], used: new Set([0, 1, 2]), leaving: 0 })
  assert.equal(next.resetRound, true)
  assert.equal(next.index, 2)
})

test('a tiny catalogue still rotates without showing the same product twice at once', () => {
  const pool = [p(1, 1), p(2, 1)]
  const next = pickNext(pool, { shown: [0], used: new Set([0]), leaving: 0 })
  assert.equal(next.index, 1)
})
