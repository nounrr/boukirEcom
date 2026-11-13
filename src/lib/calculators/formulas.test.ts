/**
 * Scenario test vectors for BOUKIR SMART CALCULATORS.
 * Run: node --test ecom/src/lib/calculators/formulas.test.ts   (Node ≥ 22.6)
 */
import test from 'node:test'
import assert from 'node:assert/strict'

import { ceilUnits, parseDecimal, round } from './core.ts'
import {
  calcBagMaterial,
  calcBlocks,
  calcBudget,
  calcConcrete,
  calcFill,
  calcLayoutCounts,
  calcPaint,
  calcPavers,
  calcPlaster,
  calcRoof,
  calcStone,
  calcTiles,
  calcWaterproofing,
  convertUnit,
  massToVolume,
  volumeToMass,
} from './formulas.ts'

function ok<T>(r: { ok: boolean; value?: T; issues: unknown[] }): T {
  assert.equal(r.ok, true, `expected ok, got issues ${JSON.stringify(r.issues)}`)
  return (r as { value: T }).value
}

/* ── core ─────────────────────────────────────────────────────────────────── */

test('parseDecimal handles French, English and Arabic conventions', () => {
  assert.equal(parseDecimal('2,5'), 2.5)
  assert.equal(parseDecimal('2.5'), 2.5)
  assert.equal(parseDecimal('1 250,75'), 1250.75)
  assert.equal(parseDecimal('1,250.75'), 1250.75)
  assert.equal(parseDecimal('1.250,75'), 1250.75)
  assert.equal(parseDecimal('٢٫٥'), 2.5)
  assert.equal(parseDecimal('۱۲'), 12)
  assert.equal(parseDecimal('-3'), -3)
  assert.equal(parseDecimal(''), null)
  assert.equal(parseDecimal('abc'), null)
  assert.equal(parseDecimal('2,5,6'), 256)
  assert.equal(parseDecimal(Number.NaN), null)
  assert.equal(parseDecimal(Infinity), null)
})

test('ceilUnits is robust to floating point noise', () => {
  assert.equal(ceilUnits(100.00000000000001), 100)
  assert.equal(ceilUnits(9.25), 10)
  assert.equal(ceilUnits(0), 0)
  assert.equal(ceilUnits(-4), 0)
  assert.equal(ceilUnits(Number.NaN), 0)
  assert.equal(round(1.005, 2), 1.01)
})

/* ── 1. Carrelage ─────────────────────────────────────────────────────────── */

test('tiles: 4×3 m, 60×60, 10 % waste, 4 tiles per box', () => {
  const r = ok(calcTiles({ lengthM: 4, widthM: 3, tileLengthCm: 60, tileWidthCm: 60, packMode: 'tiles', tilesPerBox: 4, wastePct: 10 }))
  assert.equal(r.netArea, 12)
  assert.equal(r.requiredArea, 13.2)
  assert.equal(r.tileArea, 0.36)
  assert.equal(r.tiles, 37)
  assert.equal(r.boxes, 10)
  assert.equal(r.purchasedTiles, 40)
  assert.equal(r.purchasedArea, 14.4)
  assert.equal(r.surplusArea, 1.2)
  assert.equal(r.cost, null, 'no price → cost unavailable, never 0')
})

test('tiles: m² per box packaging and price per box', () => {
  const r = ok(calcTiles({ lengthM: '4', widthM: '3', tileLengthCm: '60', tileWidthCm: '60', packMode: 'area', m2PerBox: '1,44', wastePct: 10, pricePerBox: 180 }))
  assert.equal(r.boxes, 10)
  assert.equal(r.purchasedArea, 14.4)
  assert.equal(r.cost, 1800)
})

test('tiles: exact multiple does not over-round (3×3 m, 30×30, 0 %)', () => {
  const r = ok(calcTiles({ lengthM: 3, widthM: 3, tileLengthCm: 30, tileWidthCm: 30, packMode: 'tiles', wastePct: 0 }))
  assert.equal(r.tiles, 100)
  assert.equal(r.boxes, null)
})

test('tiles: zero surface gives zero, invalid inputs are rejected', () => {
  assert.equal(ok(calcTiles({ lengthM: 0, widthM: 0, tileLengthCm: 60, tileWidthCm: 60, packMode: 'tiles', wastePct: 10 })).tiles, 0)
  const neg = calcTiles({ lengthM: -4, widthM: 3, tileLengthCm: 60, tileWidthCm: 60, packMode: 'tiles', wastePct: 10 })
  assert.equal(neg.ok, false)
  assert.deepEqual(neg.issues[0], { field: 'lengthM', code: 'negative' })
  const zeroTile = calcTiles({ lengthM: 4, widthM: 3, tileLengthCm: 0, tileWidthCm: 60, packMode: 'tiles', wastePct: 10 })
  assert.deepEqual(zeroTile.issues[0], { field: 'tileLengthCm', code: 'zero' })
  const huge = calcTiles({ lengthM: 1e9, widthM: 3, tileLengthCm: 60, tileWidthCm: 60, packMode: 'tiles', wastePct: 10 })
  assert.deepEqual(huge.issues[0], { field: 'lengthM', code: 'tooLarge' })
  const nan = calcTiles({ lengthM: 'abc', widthM: 3, tileLengthCm: 60, tileWidthCm: 60, packMode: 'tiles', wastePct: 10 })
  assert.deepEqual(nan.issues[0], { field: 'lengthM', code: 'invalid' })
})

/* ── 2. Peinture ──────────────────────────────────────────────────────────── */

test('paint: room 4×3×2.5 m, 1 door + 1 window, 2 coats @10 m²/L, 4 L pots', () => {
  const r = ok(calcPaint({ mode: 'room', lengthM: 4, widthM: 3, heightM: 2.5, doors: 1, windows: 1, coats: 2, coverageM2PerL: 10, wastePct: 0, containerL: 4 }))
  assert.equal(r.wallArea, 35)
  assert.equal(r.openingsArea, 3.09)
  assert.equal(r.paintableArea, 31.91)
  assert.equal(r.liters, 6.38)
  assert.equal(r.containers, 2)
  assert.equal(r.purchasedLiters, 8)
})

test('paint: ceiling included, waste applied, price per pot', () => {
  const r = ok(calcPaint({ mode: 'room', lengthM: 4, widthM: 3, heightM: 2.5, includeCeiling: true, coats: 2, coverageM2PerL: 12, wastePct: 5, containerL: 15, pricePerContainer: 420 }))
  assert.equal(r.paintableArea, 47)
  assert.equal(r.liters, 8.23)
  assert.equal(r.containers, 1)
  assert.equal(r.cost, 420)
})

test('paint: openings larger than walls clamp to 0 and are flagged; zero coverage rejected', () => {
  const r = ok(calcPaint({ mode: 'wall', lengthM: 1, heightM: 1, doors: 2, coats: 1, coverageM2PerL: 10, containerL: 1 }))
  assert.equal(r.paintableArea, 0)
  assert.equal(r.openingsExceedWalls, true)
  const bad = calcPaint({ mode: 'wall', lengthM: 4, heightM: 2.5, coats: 2, coverageM2PerL: 0, containerL: 4 })
  assert.deepEqual(bad.issues[0], { field: 'coverageM2PerL', code: 'zero' })
  const coats = calcPaint({ mode: 'wall', lengthM: 4, heightM: 2.5, coats: 0, coverageM2PerL: 10, containerL: 4 })
  assert.equal(coats.ok, false)
})

/* ── 3. Béton ─────────────────────────────────────────────────────────────── */

test('concrete: slab 5×4×15 cm, 5 % waste, 350 kg/m³, 50 kg bags, reference recipe', () => {
  const r = ok(calcConcrete({ shape: 'rect', lengthM: 5, widthM: 4, thicknessCm: 15, wastePct: 5, dosageKgPerM3: 350, bagKg: 50, sandLPerM3: 400, gravelLPerM3: 800, waterLPerM3: 175 }))
  assert.equal(r.volume, 3)
  assert.equal(r.adjustedVolume, 3.15)
  assert.equal(r.cementKg, 1102.5)
  assert.equal(r.bags, 23)
  assert.equal(r.sandM3, 1.26)
  assert.equal(r.gravelM3, 2.52)
  assert.equal(r.waterL, 551.3)
})

test('concrete: 4 round columns Ø30 cm × 3 m, no recipe → no sand/gravel invented', () => {
  const r = ok(calcConcrete({ shape: 'cylinder', lengthM: 3, diameterCm: 30, count: 4, wastePct: 0, dosageKgPerM3: 350, bagKg: 35 }))
  assert.equal(r.volume, 0.848)
  assert.equal(r.bags, 9)
  assert.equal(r.sandM3, null)
  assert.equal(r.gravelM3, null)
})

test('concrete: zero bag weight is a divide-by-zero error', () => {
  const r = calcConcrete({ shape: 'rect', lengthM: 5, widthM: 4, thicknessCm: 15, wastePct: 5, dosageKgPerM3: 350, bagKg: 0 })
  assert.deepEqual(r.issues[0], { field: 'bagKg', code: 'zero' })
})

/* ── 4. Étanchéité ────────────────────────────────────────────────────────── */

test('waterproofing liquid: terrace 5×4 m + 15 cm upstands, 2 coats × 1.5 kg/m², 20 kg packs', () => {
  const r = ok(calcWaterproofing({ mode: 'liquid', lengthM: 5, widthM: 4, upstandCm: 15, coats: 2, consumptionKgPerM2: 1.5, packKg: 20, wastePct: 0 }))
  assert.equal(r.baseArea, 20)
  assert.equal(r.upstandArea, 2.7)
  assert.equal(r.totalArea, 22.7)
  assert.equal(r.materialKg, 68.1)
  assert.equal(r.packs, 4)
})

test('waterproofing membrane: 10 % overlap, 10 m² rolls', () => {
  const r = ok(calcWaterproofing({ mode: 'membrane', lengthM: 5, widthM: 4, upstandCm: 15, coats: 1, consumptionKgPerM2: 0, rollAreaM2: 10, overlapPct: 10, wastePct: 0 }))
  assert.equal(r.membraneArea, 24.97)
  assert.equal(r.packs, 3)
  assert.equal(r.materialKg, null)
})

/* ── 5. Colle · mortier · ragréage ────────────────────────────────────────── */

test('tile adhesive: 20 m² × 4 kg/m² + 10 % → 4 bags of 25 kg', () => {
  const r = ok(calcBagMaterial({ areaM2: 20, mode: 'perM2', consumption: 4, bagKg: 25, wastePct: 10, pricePerBag: 95 }))
  assert.equal(r.kg, 88)
  assert.equal(r.bags, 4)
  assert.equal(r.purchasedKg, 100)
  assert.equal(r.cost, 380)
})

test('leveling: 20 m² × 1.6 kg/m²/mm × 5 mm → 7 bags of 25 kg', () => {
  const r = ok(calcBagMaterial({ areaM2: 20, mode: 'perM2mm', consumption: 1.6, thicknessMm: 5, bagKg: 25, wastePct: 0 }))
  assert.equal(r.kg, 160)
  assert.equal(r.bags, 7)
})

/* ── 6. Murs & blocs ──────────────────────────────────────────────────────── */

test('blocks: wall 10×2.5 m − 2 m² openings, 40×20 blocks, 10 mm joint, 5 %', () => {
  const r = ok(calcBlocks({ lengthM: 10, heightM: 2.5, openingsM2: 2, blockLengthCm: 40, blockHeightCm: 20, jointMm: 10, wastePct: 5 }))
  assert.equal(r.grossArea, 25)
  assert.equal(r.netArea, 23)
  assert.equal(r.unitsPerM2, 11.61)
  assert.equal(r.units, 281)
})

/* ── 7. Marbre ────────────────────────────────────────────────────────────── */

test('stone: 4×3 m, 60×60 slabs, 15 % cutting waste, 350 MAD/m²', () => {
  const r = ok(calcStone({ lengthM: 4, widthM: 3, slabLengthCm: 60, slabWidthCm: 60, wastePct: 15, pricePerM2: 350 }))
  assert.equal(r.adjustedArea, 13.8)
  assert.equal(r.slabs, 39)
  assert.equal(r.purchasedArea, 14.04)
  assert.equal(r.cost, 4914)
})

/* ── 8. Sable · gravier ───────────────────────────────────────────────────── */

test('fill: 10×5 m × 10 cm, 20 % compaction, density 1.6, 8 m³ truck', () => {
  const r = ok(calcFill({ lengthM: 10, widthM: 5, depthCm: 10, compactionPct: 20, densityTPerM3: 1.6, truckM3: 8 }))
  assert.equal(r.grossVolume, 5)
  assert.equal(r.adjustedVolume, 6)
  assert.equal(r.tonnes, 9.6)
  assert.equal(r.loads, 1)
})

test('fill: never converts m³ to tonnes without a density', () => {
  const r = ok(calcFill({ lengthM: 10, widthM: 5, depthCm: 10, compactionPct: 20 }))
  assert.equal(r.tonnes, null)
  assert.equal(r.loads, null)
})

/* ── 9. Plâtre ────────────────────────────────────────────────────────────── */

test('plaster coat: 4×3 m ceiling, 10 mm @1 kg/m²/mm, 10 %, 25 kg bags', () => {
  const r = ok(calcPlaster({ mode: 'coat', lengthM: 4, widthM: 3, thicknessMm: 10, consumptionKgPerM2Mm: 1, bagKg: 25, wastePct: 10 }))
  assert.equal(r.kg, 132)
  assert.equal(r.bags, 6)
})

test('plasterboard: 12 m², 120×250 sheets, 10 % cutting allowance → 5 sheets', () => {
  const r = ok(calcPlaster({ mode: 'board', lengthM: 4, widthM: 3, sheetLengthCm: 250, sheetWidthCm: 120, wastePct: 10 }))
  assert.equal(r.sheets, 5)
  assert.equal(r.kg, null)
})

/* ── 10. Pavés ────────────────────────────────────────────────────────────── */

test('pavers: 6×4 m, 20×10 cm, 3 mm joints, 5 % → pieces and m² packs', () => {
  const r = ok(calcPavers({ lengthM: 6, widthM: 4, pieceLengthCm: 20, pieceWidthCm: 10, jointMm: 3, wastePct: 5, packMode: 'area', m2PerPack: 10 }))
  assert.equal(r.netArea, 24)
  assert.equal(r.pieces, 1206)
  assert.equal(r.packs, 3)
})

/* ── 11. Toiture ──────────────────────────────────────────────────────────── */

test('roof: 2 planes 10×5 m, 13 tiles/m², 5 %, 240 per pallet', () => {
  const r = ok(calcRoof({ eaveLengthM: 10, slopeMode: 'slope', slopeLengthM: 5, planes: 2, tilesPerM2: 13, wastePct: 5, piecesPerPack: 240 }))
  assert.equal(r.roofArea, 100)
  assert.equal(r.pieces, 1365)
  assert.equal(r.packs, 6)
})

test('roof: slope length derived from run and pitch (4 m @ 30°)', () => {
  const r = ok(calcRoof({ eaveLengthM: 10, slopeMode: 'pitch', runM: 4, pitchDeg: 30, planes: 2, tilesPerM2: 10, wastePct: 0 }))
  assert.equal(r.slopeLength, 4.619)
  assert.equal(r.roofArea, 92.376)
  const steep = calcRoof({ eaveLengthM: 10, slopeMode: 'pitch', runM: 4, pitchDeg: 89, tilesPerM2: 10, wastePct: 0 })
  assert.equal(steep.ok, false)
})

/* ── 12. Budget ───────────────────────────────────────────────────────────── */

test('budget: unpriced rows are counted, not zeroed; labour kept separate', () => {
  const r = ok(
    calcBudget(
      [
        { id: '1', label: 'Colle', group: 'tiles', quantity: 4, unit: 'sac', unitPrice: 95 },
        { id: '2', label: 'Peinture', group: 'paint', quantity: 2, unit: 'pot', unitPrice: 420 },
        { id: '3', label: 'Carreaux', group: 'tiles', quantity: 10, unit: 'boîte', unitPrice: null },
        { id: '4', label: 'Pose', group: 'labor', quantity: 1, unit: 'forfait', unitPrice: 1500 },
      ],
      10
    )
  )
  assert.equal(r.materialSubtotal, 1220)
  assert.equal(r.otherSubtotal, 1500)
  assert.equal(r.contingency, 272)
  assert.equal(r.total, 2992)
  assert.equal(r.unpricedRows, 1)
  assert.equal(r.byGroup.tiles, 380)
})

/* ── 13. Convertisseur ────────────────────────────────────────────────────── */

test('converter: dimensionally valid conversions only', () => {
  assert.equal(ok(convertUnit(2.5, 'length', 'm', 'cm')), 250)
  assert.equal(ok(convertUnit(1, 'volume', 'm3', 'L')), 1000)
  assert.equal(ok(convertUnit('1 500', 'mass', 'kg', 't')), 1.5)
  assert.equal(ok(convertUnit(12000, 'area', 'cm2', 'm2')), 1.2)
  assert.equal(ok(volumeToMass(2, 1.6)), 3.2)
  assert.equal(ok(massToVolume(3.2, 1.6)), 2)
  assert.equal(volumeToMass(2, 0).ok, false, 'density is mandatory')
})

/* ── Calepinage ───────────────────────────────────────────────────────────── */

test('layout: straight 4.2 × 3.4 m with 60 × 60 → 35 full + 7 cut', () => {
  const r = ok(calcLayoutCounts(4.2, 3.4, 60, 60, 'straight'))
  // 7 columns fit exactly, 5 full rows + a 40 cm strip → 35 full, 7 cut
  assert.equal(r.exact, true)
  assert.equal(r.full, 35)
  assert.equal(r.cut, 7)
  assert.equal(r.positions, 42)
})

test('layout: straight with remainders on both axes counts the corner once', () => {
  const r = ok(calcLayoutCounts(1.3, 1.3, 60, 60, 'straight'))
  assert.equal(r.full, 4)
  assert.equal(r.cut, 5)
})

test('layout: half-offset rows cut both ends on shifted rows', () => {
  const r = ok(calcLayoutCounts(1.2, 1.2, 60, 60, 'offset'))
  // row 0: 2 full; row 1: half + 1 full + half → 1 full, 2 cut
  assert.equal(r.full, 3)
  assert.equal(r.cut, 2)
  assert.equal(r.positions, 5)
})

test('layout: diagonal is flagged as indicative', () => {
  const r = ok(calcLayoutCounts(4, 3, 60, 60, 'diagonal'))
  assert.equal(r.exact, false)
  assert.equal(r.full, null)
  assert.equal(r.positions, 34)
})
