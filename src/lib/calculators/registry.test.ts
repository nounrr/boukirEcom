import test from 'node:test'
import assert from 'node:assert/strict'

import { CALCULATORS, applyPrefill, calculatorForProduct, defaultValues, getCalculator } from './registry.ts'

test('every calculator definition computes cleanly with its defaults', () => {
  for (const def of CALCULATORS) {
    const result = def.compute(defaultValues(def))
    assert.equal(result.ok, true, `${def.slug}: ${JSON.stringify(result.issues)}`)
    const primary = def.primary((result as { value: unknown }).value)
    assert.ok(typeof primary.value === 'number' && primary.value > 0, `${def.slug} primary result should be positive`)
    for (const row of def.rows((result as { value: unknown }).value, defaultValues(def))) {
      assert.ok(row.value === null || Number.isFinite(row.value), `${def.slug}.${row.label} must be finite or null`)
    }
  }
})

test('prefill accepts only declared numeric/select keys', () => {
  const beton = getCalculator('beton')!
  const v = applyPrefill(beton, defaultValues(beton), { bagKg: '25', foo: 'x', lengthM: '<script>' })
  assert.equal(v.bagKg, '25')
  assert.equal(v.lengthM, '5')
  assert.equal((v as Record<string, unknown>).foo, undefined)

  const tile = getCalculator('carrelage')!
  const t = applyPrefill(tile, defaultValues(tile), { area: '24', format: '30x30' })
  assert.equal(t.extraAreaM2, '24')
  assert.equal(t.tileLengthCm, '30')
})

test('product → calculator mapping is contextual and never applies to tools', () => {
  assert.deepEqual(calculatorForProduct({ designation: 'Enduit Pate 25KG - KENZI', categoryId: 108, parentCategoryId: 72 }), {
    slug: 'platre-enduit',
    prefill: { mode: 'coat', bagKg: '25' },
  })
  assert.equal(calculatorForProduct({ designation: 'Disque diamant 230 mm', categoryId: 52 }), null)
  assert.equal(calculatorForProduct({ designation: 'Colle carrelage', categoryId: 48 }), null, 'tiler tools category is excluded')
  assert.equal(calculatorForProduct({ designation: 'Peinture façade 15L' })?.slug, 'peinture')
  assert.deepEqual(calculatorForProduct({ designation: 'Peinture façade 15L' })?.prefill, { containerL: '15' })
  assert.equal(calculatorForProduct({ designation: 'Câble 2.5mm', categoryId: 19, parentCategoryId: 16 }), null)
})
