/**
 * BOUKIR SMART CALCULATORS — pure estimation formulas.
 *
 * Conventions
 *  - Every input name carries its unit (…M, …Cm, …Mm, …Pct, …Kg, …L).
 *  - Measurements keep precision; indivisible purchases are rounded UP.
 *  - Prices are optional; a missing price yields `cost: null` ("price
 *    unavailable"), never 0.
 *  - Coverage, consumption, dosage and waste are user-editable assumptions,
 *    not manufacturer specifications. Results are indicative estimates.
 */
import { LIMITS, Validator, ceilUnits, costOrNull, round, withWaste, type CalcResult } from './core.ts'

/* ─────────────────────────────── 1. Carrelage ─────────────────────────────── */

export type TilePattern = 'straight' | 'offset' | 'diagonal' | 'herringbone'

/** Typical cutting allowances by layout (editable in the UI). */
export const TILE_PATTERN_WASTE: Record<TilePattern, number> = {
  straight: 10,
  offset: 12,
  diagonal: 15,
  herringbone: 18,
}

export interface TileInput {
  lengthM: unknown
  widthM: unknown
  extraAreaM2?: unknown
  tileLengthCm: unknown
  tileWidthCm: unknown
  packMode: 'tiles' | 'area'
  tilesPerBox?: unknown
  m2PerBox?: unknown
  wastePct: unknown
  pricePerBox?: unknown
  pricePerM2?: unknown
}

export interface TileOutput {
  netArea: number
  requiredArea: number
  tileArea: number
  tiles: number
  boxes: number | null
  purchasedTiles: number | null
  purchasedArea: number | null
  surplusArea: number | null
  cost: number | null
}

export function calcTiles(input: TileInput): CalcResult<TileOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const extra = v.num('extraAreaM2', input.extraAreaM2, { max: LIMITS.areaM2, optional: true })
  const tl = v.num('tileLengthCm', input.tileLengthCm, { max: LIMITS.cm, positive: true })
  const tw = v.num('tileWidthCm', input.tileWidthCm, { max: LIMITS.cm, positive: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const tilesPerBox = input.packMode === 'tiles' ? v.num('tilesPerBox', input.tilesPerBox, { max: LIMITS.count, optional: true, integer: true }) : 0
  const m2PerBox = input.packMode === 'area' ? v.num('m2PerBox', input.m2PerBox, { max: 100, optional: true }) : 0
  const pricePerBox = v.price('pricePerBox', input.pricePerBox)
  const pricePerM2 = v.price('pricePerM2', input.pricePerM2)

  return v.result(() => {
    const netArea = length * width + extra
    const requiredArea = withWaste(netArea, waste)
    const tileArea = (tl * tw) / 10_000
    const tiles = ceilUnits(requiredArea / tileArea)

    let boxes: number | null = null
    let purchasedTiles: number | null = null
    let purchasedArea: number | null = null
    if (input.packMode === 'tiles' && tilesPerBox > 0) {
      boxes = ceilUnits(tiles / tilesPerBox)
      purchasedTiles = boxes * tilesPerBox
      purchasedArea = purchasedTiles * tileArea
    } else if (input.packMode === 'area' && m2PerBox > 0) {
      boxes = ceilUnits(requiredArea / m2PerBox)
      purchasedArea = boxes * m2PerBox
      purchasedTiles = Math.floor(purchasedArea / tileArea + 1e-9)
    }

    const cost =
      boxes !== null && pricePerBox !== null
        ? costOrNull(boxes, pricePerBox)
        : pricePerM2 !== null
          ? costOrNull(purchasedArea ?? requiredArea, pricePerM2)
          : null

    return {
      netArea: round(netArea, 3),
      requiredArea: round(requiredArea, 3),
      tileArea: round(tileArea, 4),
      tiles,
      boxes,
      purchasedTiles,
      purchasedArea: purchasedArea === null ? null : round(purchasedArea, 3),
      surplusArea: purchasedArea === null ? null : round(purchasedArea - requiredArea, 3),
      cost,
    }
  })
}

/* ─────────────────────────────── 2. Peinture ──────────────────────────────── */

export interface PaintInput {
  mode: 'room' | 'wall'
  lengthM: unknown
  widthM?: unknown
  heightM: unknown
  includeCeiling?: boolean
  doors?: unknown
  doorAreaM2?: unknown
  windows?: unknown
  windowAreaM2?: unknown
  coats: unknown
  coverageM2PerL: unknown
  wastePct?: unknown
  containerL: unknown
  pricePerContainer?: unknown
}

export interface PaintOutput {
  wallArea: number
  ceilingArea: number
  openingsArea: number
  paintableArea: number
  liters: number
  containers: number
  purchasedLiters: number
  openingsExceedWalls: boolean
  cost: number | null
}

export function calcPaint(input: PaintInput): CalcResult<PaintOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = input.mode === 'room' ? v.num('widthM', input.widthM, { max: LIMITS.lengthM }) : 0
  const height = v.num('heightM', input.heightM, { max: 100 })
  const doors = v.num('doors', input.doors, { max: 500, optional: true, integer: true })
  const doorArea = v.num('doorAreaM2', input.doorAreaM2, { max: 50, optional: true, fallback: 1.89 })
  const windows = v.num('windows', input.windows, { max: 500, optional: true, integer: true })
  const windowArea = v.num('windowAreaM2', input.windowAreaM2, { max: 50, optional: true, fallback: 1.2 })
  const coats = v.num('coats', input.coats, { min: 1, max: LIMITS.coats, integer: true })
  const coverage = v.num('coverageM2PerL', input.coverageM2PerL, { max: LIMITS.coverage, positive: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct, optional: true })
  const containerL = v.num('containerL', input.containerL, { max: LIMITS.liters, positive: true })
  const price = v.price('pricePerContainer', input.pricePerContainer)

  return v.result(() => {
    const wallArea = input.mode === 'room' ? 2 * (length + width) * height : length * height
    const ceilingArea = input.mode === 'room' && input.includeCeiling ? length * width : 0
    const openingsArea = doors * doorArea + windows * windowArea
    const paintableArea = Math.max(0, wallArea - openingsArea) + ceilingArea
    const liters = withWaste((paintableArea * coats) / coverage, waste)
    const containers = ceilUnits(liters / containerL)
    return {
      wallArea: round(wallArea, 3),
      ceilingArea: round(ceilingArea, 3),
      openingsArea: round(openingsArea, 3),
      paintableArea: round(paintableArea, 3),
      liters: round(liters, 2),
      containers,
      purchasedLiters: round(containers * containerL, 2),
      openingsExceedWalls: openingsArea > wallArea && wallArea > 0,
      cost: costOrNull(containers, price),
    }
  })
}

/* ─────────────────────────────── 3. Béton ─────────────────────────────────── */

export interface ConcreteInput {
  shape: 'rect' | 'cylinder'
  lengthM: unknown
  widthM?: unknown
  thicknessCm?: unknown
  diameterCm?: unknown
  count?: unknown
  wastePct: unknown
  dosageKgPerM3: unknown
  bagKg: unknown
  sandLPerM3?: unknown
  gravelLPerM3?: unknown
  waterLPerM3?: unknown
  pricePerBag?: unknown
}

export interface ConcreteOutput {
  volume: number
  adjustedVolume: number
  cementKg: number
  bags: number
  sandM3: number | null
  gravelM3: number | null
  waterL: number | null
  cost: number | null
}

export function calcConcrete(input: ConcreteInput): CalcResult<ConcreteOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = input.shape === 'rect' ? v.num('widthM', input.widthM, { max: LIMITS.lengthM }) : 0
  const thicknessCm = input.shape === 'rect' ? v.num('thicknessCm', input.thicknessCm, { max: LIMITS.cm }) : 0
  const diameterCm = input.shape === 'cylinder' ? v.num('diameterCm', input.diameterCm, { max: LIMITS.cm }) : 0
  const count = v.num('count', input.count, { min: 1, max: LIMITS.count, optional: true, fallback: 1, integer: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const dosage = v.num('dosageKgPerM3', input.dosageKgPerM3, { max: LIMITS.dosage })
  const bagKg = v.num('bagKg', input.bagKg, { max: 1000, positive: true })
  const sand = v.num('sandLPerM3', input.sandLPerM3, { max: 2000, optional: true })
  const gravel = v.num('gravelLPerM3', input.gravelLPerM3, { max: 2000, optional: true })
  const water = v.num('waterLPerM3', input.waterLPerM3, { max: 1000, optional: true })
  const price = v.price('pricePerBag', input.pricePerBag)

  return v.result(() => {
    const unit =
      input.shape === 'rect'
        ? length * width * (thicknessCm / 100)
        : Math.PI * (diameterCm / 200) ** 2 * length
    const volume = unit * count
    const adjustedVolume = withWaste(volume, waste)
    const cementKg = adjustedVolume * dosage
    const bags = ceilUnits(cementKg / bagKg)
    return {
      volume: round(volume, 3),
      adjustedVolume: round(adjustedVolume, 3),
      cementKg: round(cementKg, 1),
      bags,
      sandM3: sand > 0 ? round((adjustedVolume * sand) / 1000, 3) : null,
      gravelM3: gravel > 0 ? round((adjustedVolume * gravel) / 1000, 3) : null,
      waterL: water > 0 ? round(adjustedVolume * water, 1) : null,
      cost: costOrNull(bags, price),
    }
  })
}

/* ─────────────────────────────── 4. Étanchéité ────────────────────────────── */

export interface WaterproofingInput {
  mode: 'liquid' | 'membrane'
  lengthM: unknown
  widthM: unknown
  upstandCm?: unknown
  coats: unknown
  consumptionKgPerM2: unknown
  packKg?: unknown
  rollAreaM2?: unknown
  overlapPct?: unknown
  wastePct: unknown
  pricePerPack?: unknown
}

export interface WaterproofingOutput {
  baseArea: number
  upstandArea: number
  totalArea: number
  materialKg: number | null
  membraneArea: number | null
  packs: number
  cost: number | null
}

export function calcWaterproofing(input: WaterproofingInput): CalcResult<WaterproofingOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const upstandCm = v.num('upstandCm', input.upstandCm, { max: 300, optional: true })
  const coats = v.num('coats', input.coats, { min: 1, max: LIMITS.coats, integer: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const consumption = input.mode === 'liquid' ? v.num('consumptionKgPerM2', input.consumptionKgPerM2, { max: 50, positive: true }) : 0
  const packKg = input.mode === 'liquid' ? v.num('packKg', input.packKg, { max: 1000, positive: true }) : 0
  const rollArea = input.mode === 'membrane' ? v.num('rollAreaM2', input.rollAreaM2, { max: 500, positive: true }) : 0
  const overlap = input.mode === 'membrane' ? v.num('overlapPct', input.overlapPct, { max: LIMITS.pct, optional: true }) : 0
  const price = v.price('pricePerPack', input.pricePerPack)

  return v.result(() => {
    const baseArea = length * width
    const upstandArea = 2 * (length + width) * (upstandCm / 100)
    const totalArea = baseArea + upstandArea
    if (input.mode === 'liquid') {
      const materialKg = withWaste(totalArea * coats * consumption, waste)
      const packs = ceilUnits(materialKg / packKg)
      return {
        baseArea: round(baseArea, 3),
        upstandArea: round(upstandArea, 3),
        totalArea: round(totalArea, 3),
        materialKg: round(materialKg, 2),
        membraneArea: null,
        packs,
        cost: costOrNull(packs, price),
      }
    }
    const membraneArea = withWaste(withWaste(totalArea * coats, overlap), waste)
    const packs = ceilUnits(membraneArea / rollArea)
    return {
      baseArea: round(baseArea, 3),
      upstandArea: round(upstandArea, 3),
      totalArea: round(totalArea, 3),
      materialKg: null,
      membraneArea: round(membraneArea, 3),
      packs,
      cost: costOrNull(packs, price),
    }
  })
}

/* ─────────────────────────── 5. Colle · mortier · ragréage ────────────────── */

export interface BagMaterialInput {
  areaM2: unknown
  mode: 'perM2' | 'perM2mm'
  consumption: unknown
  thicknessMm?: unknown
  bagKg: unknown
  wastePct: unknown
  pricePerBag?: unknown
}

export interface BagMaterialOutput {
  kg: number
  bags: number
  purchasedKg: number
  cost: number | null
}

export function calcBagMaterial(input: BagMaterialInput): CalcResult<BagMaterialOutput> {
  const v = new Validator()
  const area = v.num('areaM2', input.areaM2, { max: LIMITS.areaM2 })
  const consumption = v.num('consumption', input.consumption, { max: 100, positive: true })
  const thickness = input.mode === 'perM2mm' ? v.num('thicknessMm', input.thicknessMm, { max: 200 }) : 1
  const bagKg = v.num('bagKg', input.bagKg, { max: 1000, positive: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const price = v.price('pricePerBag', input.pricePerBag)

  return v.result(() => {
    const kg = withWaste(area * consumption * thickness, waste)
    const bags = ceilUnits(kg / bagKg)
    return { kg: round(kg, 2), bags, purchasedKg: round(bags * bagKg, 2), cost: costOrNull(bags, price) }
  })
}

/* ─────────────────────────────── 6. Murs & blocs ──────────────────────────── */

export interface BlocksInput {
  lengthM: unknown
  heightM: unknown
  openingsM2?: unknown
  blockLengthCm: unknown
  blockHeightCm: unknown
  jointMm: unknown
  wastePct: unknown
  pricePerUnit?: unknown
}

export interface BlocksOutput {
  grossArea: number
  netArea: number
  unitsPerM2: number
  units: number
  cost: number | null
}

export function calcBlocks(input: BlocksInput): CalcResult<BlocksOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const height = v.num('heightM', input.heightM, { max: 100 })
  const openings = v.num('openingsM2', input.openingsM2, { max: LIMITS.areaM2, optional: true })
  const bl = v.num('blockLengthCm', input.blockLengthCm, { max: 200, positive: true })
  const bh = v.num('blockHeightCm', input.blockHeightCm, { max: 200, positive: true })
  const joint = v.num('jointMm', input.jointMm, { max: 50 })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const price = v.price('pricePerUnit', input.pricePerUnit)

  return v.result(() => {
    const grossArea = length * height
    const netArea = Math.max(0, grossArea - openings)
    const face = ((bl * 10 + joint) / 1000) * ((bh * 10 + joint) / 1000)
    const unitsPerM2 = 1 / face
    const units = ceilUnits(withWaste(netArea * unitsPerM2, waste))
    return {
      grossArea: round(grossArea, 3),
      netArea: round(netArea, 3),
      unitsPerM2: round(unitsPerM2, 2),
      units,
      cost: costOrNull(units, price),
    }
  })
}

/* ─────────────────────────── 7. Marbre & pierre naturelle ─────────────────── */

export interface StoneInput {
  lengthM: unknown
  widthM: unknown
  surfaces?: unknown
  slabLengthCm: unknown
  slabWidthCm: unknown
  wastePct: unknown
  pricePerM2?: unknown
}

export interface StoneOutput {
  netArea: number
  adjustedArea: number
  slabArea: number
  slabs: number
  purchasedArea: number
  cost: number | null
}

export function calcStone(input: StoneInput): CalcResult<StoneOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const surfaces = v.num('surfaces', input.surfaces, { min: 1, max: 1000, optional: true, fallback: 1, integer: true })
  const sl = v.num('slabLengthCm', input.slabLengthCm, { max: LIMITS.cm, positive: true })
  const sw = v.num('slabWidthCm', input.slabWidthCm, { max: LIMITS.cm, positive: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const price = v.price('pricePerM2', input.pricePerM2)

  return v.result(() => {
    const netArea = length * width * surfaces
    const adjustedArea = withWaste(netArea, waste)
    const slabArea = (sl * sw) / 10_000
    const slabs = ceilUnits(adjustedArea / slabArea)
    const purchasedArea = slabs * slabArea
    return {
      netArea: round(netArea, 3),
      adjustedArea: round(adjustedArea, 3),
      slabArea: round(slabArea, 4),
      slabs,
      purchasedArea: round(purchasedArea, 3),
      cost: costOrNull(purchasedArea, price),
    }
  })
}

/* ─────────────────────────── 8. Sable · gravier · remblai ─────────────────── */

export interface FillInput {
  lengthM: unknown
  widthM: unknown
  depthCm: unknown
  compactionPct: unknown
  densityTPerM3?: unknown
  truckM3?: unknown
  pricePerM3?: unknown
}

export interface FillOutput {
  grossVolume: number
  adjustedVolume: number
  tonnes: number | null
  loads: number | null
  cost: number | null
}

export function calcFill(input: FillInput): CalcResult<FillOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const depth = v.num('depthCm', input.depthCm, { max: LIMITS.cm })
  const compaction = v.num('compactionPct', input.compactionPct, { max: LIMITS.pct })
  // Density is never assumed: without it, no tonnage is produced.
  const density = v.num('densityTPerM3', input.densityTPerM3, { max: LIMITS.density, optional: true })
  const truck = v.num('truckM3', input.truckM3, { max: 100, optional: true })
  const price = v.price('pricePerM3', input.pricePerM3)

  return v.result(() => {
    const grossVolume = length * width * (depth / 100)
    const adjustedVolume = withWaste(grossVolume, compaction)
    return {
      grossVolume: round(grossVolume, 3),
      adjustedVolume: round(adjustedVolume, 3),
      tonnes: density > 0 ? round(adjustedVolume * density, 3) : null,
      loads: truck > 0 ? ceilUnits(adjustedVolume / truck) : null,
      cost: costOrNull(adjustedVolume, price),
    }
  })
}

/* ───────────────────────── 9. Plâtre · enduit · faux-plafond ──────────────── */

export interface PlasterInput {
  mode: 'coat' | 'board'
  lengthM: unknown
  widthM: unknown
  openingsM2?: unknown
  thicknessMm?: unknown
  consumptionKgPerM2Mm?: unknown
  bagKg?: unknown
  sheetLengthCm?: unknown
  sheetWidthCm?: unknown
  wastePct: unknown
  pricePerUnit?: unknown
}

export interface PlasterOutput {
  area: number
  kg: number | null
  bags: number | null
  sheets: number | null
  cost: number | null
}

export function calcPlaster(input: PlasterInput): CalcResult<PlasterOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const openings = v.num('openingsM2', input.openingsM2, { max: LIMITS.areaM2, optional: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const thickness = input.mode === 'coat' ? v.num('thicknessMm', input.thicknessMm, { max: 200 }) : 0
  const consumption = input.mode === 'coat' ? v.num('consumptionKgPerM2Mm', input.consumptionKgPerM2Mm, { max: 10, positive: true }) : 0
  const bagKg = input.mode === 'coat' ? v.num('bagKg', input.bagKg, { max: 1000, positive: true }) : 0
  const sl = input.mode === 'board' ? v.num('sheetLengthCm', input.sheetLengthCm, { max: 1000, positive: true }) : 0
  const sw = input.mode === 'board' ? v.num('sheetWidthCm', input.sheetWidthCm, { max: 1000, positive: true }) : 0
  const price = v.price('pricePerUnit', input.pricePerUnit)

  return v.result(() => {
    const area = Math.max(0, length * width - openings)
    if (input.mode === 'coat') {
      const kg = withWaste(area * consumption * thickness, waste)
      const bags = ceilUnits(kg / bagKg)
      return { area: round(area, 3), kg: round(kg, 2), bags, sheets: null, cost: costOrNull(bags, price) }
    }
    const sheetArea = (sl * sw) / 10_000
    const sheets = ceilUnits(withWaste(area, waste) / sheetArea)
    return { area: round(area, 3), kg: null, bags: null, sheets, cost: costOrNull(sheets, price) }
  })
}

/* ───────────────────────── 10. Pavés · dalles · terrasse ──────────────────── */

export type PaverPattern = 'straight' | 'offset' | 'herringbone' | 'diagonal'

export const PAVER_PATTERN_WASTE: Record<PaverPattern, number> = {
  straight: 5,
  offset: 7,
  herringbone: 12,
  diagonal: 12,
}

export interface PaverInput {
  lengthM: unknown
  widthM: unknown
  pieceLengthCm: unknown
  pieceWidthCm: unknown
  jointMm: unknown
  wastePct: unknown
  packMode: 'pieces' | 'area'
  piecesPerPack?: unknown
  m2PerPack?: unknown
  pricePerPack?: unknown
}

export interface PaverOutput {
  netArea: number
  pieces: number
  packs: number | null
  cost: number | null
}

export function calcPavers(input: PaverInput): CalcResult<PaverOutput> {
  const v = new Validator()
  const length = v.num('lengthM', input.lengthM, { max: LIMITS.lengthM })
  const width = v.num('widthM', input.widthM, { max: LIMITS.lengthM })
  const pl = v.num('pieceLengthCm', input.pieceLengthCm, { max: 500, positive: true })
  const pw = v.num('pieceWidthCm', input.pieceWidthCm, { max: 500, positive: true })
  const joint = v.num('jointMm', input.jointMm, { max: 50 })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const ppp = input.packMode === 'pieces' ? v.num('piecesPerPack', input.piecesPerPack, { max: LIMITS.count, optional: true, integer: true }) : 0
  const m2pp = input.packMode === 'area' ? v.num('m2PerPack', input.m2PerPack, { max: 100, optional: true }) : 0
  const price = v.price('pricePerPack', input.pricePerPack)

  return v.result(() => {
    const netArea = length * width
    const face = ((pl * 10 + joint) / 1000) * ((pw * 10 + joint) / 1000)
    const pieces = ceilUnits(withWaste(netArea, waste) / face)
    let packs: number | null = null
    if (input.packMode === 'pieces' && ppp > 0) packs = ceilUnits(pieces / ppp)
    if (input.packMode === 'area' && m2pp > 0) packs = ceilUnits(withWaste(netArea, waste) / m2pp)
    return { netArea: round(netArea, 3), pieces, packs, cost: packs === null ? null : costOrNull(packs, price) }
  })
}

/* ─────────────────────────────── 11. Toiture ──────────────────────────────── */

export interface RoofInput {
  eaveLengthM: unknown
  slopeMode: 'slope' | 'pitch'
  slopeLengthM?: unknown
  runM?: unknown
  pitchDeg?: unknown
  planes?: unknown
  tilesPerM2: unknown
  wastePct: unknown
  piecesPerPack?: unknown
  pricePerPiece?: unknown
}

export interface RoofOutput {
  slopeLength: number
  roofArea: number
  pieces: number
  packs: number | null
  cost: number | null
}

export function calcRoof(input: RoofInput): CalcResult<RoofOutput> {
  const v = new Validator()
  const eave = v.num('eaveLengthM', input.eaveLengthM, { max: LIMITS.lengthM })
  const slope = input.slopeMode === 'slope' ? v.num('slopeLengthM', input.slopeLengthM, { max: 200 }) : 0
  const run = input.slopeMode === 'pitch' ? v.num('runM', input.runM, { max: 200 }) : 0
  const pitch = input.slopeMode === 'pitch' ? v.num('pitchDeg', input.pitchDeg, { max: LIMITS.degrees }) : 0
  const planes = v.num('planes', input.planes, { min: 1, max: 20, optional: true, fallback: 1, integer: true })
  const tilesPerM2 = v.num('tilesPerM2', input.tilesPerM2, { max: 200, positive: true })
  const waste = v.num('wastePct', input.wastePct, { max: LIMITS.pct })
  const ppp = v.num('piecesPerPack', input.piecesPerPack, { max: LIMITS.count, optional: true, integer: true })
  const price = v.price('pricePerPiece', input.pricePerPiece)

  return v.result(() => {
    const slopeLength = input.slopeMode === 'slope' ? slope : run / Math.cos((pitch * Math.PI) / 180)
    const roofArea = eave * slopeLength * planes
    const pieces = ceilUnits(withWaste(roofArea * tilesPerM2, waste))
    return {
      slopeLength: round(slopeLength, 3),
      roofArea: round(roofArea, 3),
      pieces,
      packs: ppp > 0 ? ceilUnits(pieces / ppp) : null,
      cost: costOrNull(pieces, price),
    }
  })
}

/* ─────────────────────────── 12. Budget projet ────────────────────────────── */

export const MATERIAL_GROUPS = ['materials', 'tiles', 'paint', 'waterproofing', 'cement', 'plumbing', 'electrical', 'tools'] as const
export const SERVICE_GROUPS = ['labor', 'delivery', 'installation', 'other'] as const
export type BudgetGroup = (typeof MATERIAL_GROUPS)[number] | (typeof SERVICE_GROUPS)[number]

export interface BudgetRow {
  id: string
  label: string
  group: BudgetGroup
  quantity: number
  unit: string
  unitPrice: number | null
  productId?: number | null
}

export interface BudgetOutput {
  materialSubtotal: number
  otherSubtotal: number
  contingency: number
  total: number
  unpricedRows: number
  byGroup: Partial<Record<BudgetGroup, number>>
}

export function isMaterialGroup(group: BudgetGroup): boolean {
  return (MATERIAL_GROUPS as readonly string[]).includes(group)
}

export function calcBudget(rows: BudgetRow[], contingencyPct: unknown): CalcResult<BudgetOutput> {
  const v = new Validator()
  const pct = v.num('contingencyPct', contingencyPct, { max: LIMITS.pct })
  rows.forEach((row, index) => {
    v.num(`rows.${index}.quantity`, row.quantity, { max: LIMITS.count * 10 })
    if (row.unitPrice !== null) v.price(`rows.${index}.unitPrice`, row.unitPrice)
  })

  return v.result(() => {
    let materialSubtotal = 0
    let otherSubtotal = 0
    let unpricedRows = 0
    const byGroup: Partial<Record<BudgetGroup, number>> = {}
    for (const row of rows) {
      if (row.unitPrice === null) {
        unpricedRows += 1
        continue
      }
      const line = row.quantity * row.unitPrice
      byGroup[row.group] = round((byGroup[row.group] ?? 0) + line, 2)
      if (isMaterialGroup(row.group)) materialSubtotal += line
      else otherSubtotal += line
    }
    const contingency = ((materialSubtotal + otherSubtotal) * pct) / 100
    return {
      materialSubtotal: round(materialSubtotal, 2),
      otherSubtotal: round(otherSubtotal, 2),
      contingency: round(contingency, 2),
      total: round(materialSubtotal + otherSubtotal + contingency, 2),
      unpricedRows,
      byGroup,
    }
  })
}

/* ─────────────────────────── 13. Convertisseur ────────────────────────────── */

export const UNIT_FACTORS = {
  length: { mm: 0.001, cm: 0.01, m: 1, km: 1000 },
  area: { cm2: 0.0001, m2: 1, ha: 10_000 },
  volume: { cm3: 0.000001, L: 0.001, m3: 1 },
  mass: { g: 0.001, kg: 1, t: 1000 },
} as const

export type Dimension = keyof typeof UNIT_FACTORS
export type UnitOf<D extends Dimension> = keyof (typeof UNIT_FACTORS)[D]

/** Converts within one physical dimension only (no kg ↔ m³ without density). */
export function convertUnit<D extends Dimension>(value: unknown, dimension: D, from: UnitOf<D>, to: UnitOf<D>): CalcResult<number> {
  const v = new Validator()
  const n = v.num('value', value, { min: -Number.MAX_SAFE_INTEGER, max: 1e12 })
  return v.result(() => {
    const factors = UNIT_FACTORS[dimension] as Record<string, number>
    return round((n * factors[from as string]) / factors[to as string], 6)
  })
}

/** Volume (m³) ↔ mass (t) — only with an explicit, user-confirmed density. */
export function volumeToMass(volumeM3: unknown, densityTPerM3: unknown): CalcResult<number> {
  const v = new Validator()
  const vol = v.num('volume', volumeM3, { max: 1e9 })
  const density = v.num('density', densityTPerM3, { max: LIMITS.density, positive: true })
  return v.result(() => round(vol * density, 4))
}

export function massToVolume(massT: unknown, densityTPerM3: unknown): CalcResult<number> {
  const v = new Validator()
  const mass = v.num('mass', massT, { max: 1e9 })
  const density = v.num('density', densityTPerM3, { max: LIMITS.density, positive: true })
  return v.result(() => round(mass / density, 4))
}

/* ─────────────────────────── Calepinage (layout explorer) ─────────────────── */

export interface LayoutCountOutput {
  /** true when counts are exact for the modelled layout */
  exact: boolean
  full: number | null
  cut: number | null
  positions: number
}

/**
 * Counts tile positions for a rectangular floor laid from one corner, without
 * joints. Exact for straight and half-offset (running bond) layouts; for
 * diagonal and herringbone the area-based position count is indicative only.
 */
export function calcLayoutCounts(lengthM: unknown, widthM: unknown, tileLengthCm: unknown, tileWidthCm: unknown, pattern: TilePattern): CalcResult<LayoutCountOutput> {
  const v = new Validator()
  const L = v.num('lengthM', lengthM, { max: LIMITS.lengthM })
  const W = v.num('widthM', widthM, { max: LIMITS.lengthM })
  const tl = v.num('tileLengthCm', tileLengthCm, { max: LIMITS.cm, positive: true }) / 100
  const tw = v.num('tileWidthCm', tileWidthCm, { max: LIMITS.cm, positive: true }) / 100

  return v.result(() => {
    const eps = 1e-9
    if (pattern === 'diagonal' || pattern === 'herringbone') {
      return { exact: false, full: null, cut: null, positions: ceilUnits((L * W) / (tl * tw)) }
    }
    const fullRows = Math.floor(W / tw + eps)
    const partialRow = W - fullRows * tw > 1e-6
    const rowCounts = (shift: number) => {
      if (L <= eps) return { full: 0, cut: 0 }
      if (shift <= eps) {
        const full = Math.floor(L / tl + eps)
        return { full, cut: L - full * tl > 1e-6 ? 1 : 0 }
      }
      const first = Math.min(shift, L)
      const rest = L - first
      const full = rest > eps ? Math.floor(rest / tl + eps) : 0
      const tail = rest - full * tl > 1e-6 ? 1 : 0
      // the leading piece is a full tile only when the offset equals a tile
      const leadingFull = first >= tl - 1e-6 ? 1 : 0
      return { full: full + leadingFull, cut: tail + (1 - leadingFull) }
    }
    let full = 0
    let cut = 0
    const totalRows = fullRows + (partialRow ? 1 : 0)
    for (let row = 0; row < totalRows; row++) {
      const shift = pattern === 'offset' && row % 2 === 1 ? tl / 2 : 0
      const counts = rowCounts(shift)
      if (row < fullRows) {
        full += counts.full
        cut += counts.cut
      } else {
        cut += counts.full + counts.cut
      }
    }
    return { exact: true, full, cut, positions: full + cut }
  })
}
