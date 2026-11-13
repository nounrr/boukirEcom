/**
 * Declarative definitions for every material calculator.
 *
 * The UI renders fields, diagrams and result rows from these definitions;
 * the maths lives exclusively in ./formulas.ts. Labels are i18n keys under
 * the `xp` namespace (fields.*, options.*, results.*, units.*, assumptions.*).
 * Catalog links use only category ids that exist in lib/catalog/registry.ts.
 */
import type { CalcResult } from './core.ts'
import {
  PAVER_PATTERN_WASTE,
  TILE_PATTERN_WASTE,
  calcBagMaterial,
  calcBlocks,
  calcConcrete,
  calcFill,
  calcPaint,
  calcPavers,
  calcPlaster,
  calcRoof,
  calcStone,
  calcTiles,
  calcWaterproofing,
  type BagMaterialOutput,
  type BlocksOutput,
  type ConcreteOutput,
  type FillOutput,
  type PaintOutput,
  type PaverOutput,
  type PlasterOutput,
  type RoofOutput,
  type StoneOutput,
  type TileOutput,
  type WaterproofingOutput,
} from './formulas.ts'

export type Values = Record<string, string | boolean>
export type FieldGroup = 'dimensions' | 'material' | 'packaging' | 'assumptions' | 'pricing'

interface BaseField {
  key: string
  /** i18n key under xp.fields */
  label: string
  group: FieldGroup
  when?: (v: Values) => boolean
  /** i18n key under xp.help */
  help?: string
}
export interface NumberField extends BaseField {
  kind: 'number'
  unit?: string
  default: number | ''
  step?: number
  slider?: [number, number]
  optional?: boolean
  /** quick-pick chips (e.g. common bag or pot sizes) */
  presets?: number[]
}
export interface SelectField extends BaseField {
  kind: 'select'
  default: string
  options: { value: string; label: string; patch?: Values }[]
}
export interface ToggleField extends BaseField {
  kind: 'toggle'
  default: boolean
}
export type FieldDef = NumberField | SelectField | ToggleField

export interface ResultRow {
  /** i18n key under xp.results */
  label: string
  value: number | null
  /** physical unit symbol or `u:<key>` for a translated count unit (xp.units.*) */
  unit: string
  decimals?: number
  emphasis?: boolean
  /** i18n key under xp.results shown when value is null */
  nullLabel?: string
}

export type DiagramSpec =
  | { type: 'room'; lengthKey: string; widthKey: string; tileLKey?: string; tileWKey?: string; patternKey?: string }
  | { type: 'wall'; lengthKey: string; heightKey: string; widthKey?: string; doorsKey?: string; windowsKey?: string; blockLKey?: string; blockHKey?: string; roomModeKey?: string }
  | { type: 'slab'; lengthKey: string; widthKey: string; depthKey: string; variant: 'concrete' | 'fill' | 'membrane'; upstandKey?: string }
  | { type: 'roof'; eaveKey: string; slopeKey: string; runKey: string; pitchKey: string; modeKey: string; planesKey: string }
  | { type: 'bags' }

export type CalculatorSlug =
  | 'carrelage'
  | 'peinture'
  | 'beton'
  | 'etancheite'
  | 'colle-mortier'
  | 'murs-blocs'
  | 'marbre-pierre'
  | 'sable-gravier'
  | 'platre-enduit'
  | 'paves-terrasse'
  | 'toiture'

export interface CalculatorDef {
  slug: CalculatorSlug
  family: 'surfaces' | 'structure' | 'finishes'
  fields: FieldDef[]
  diagram: DiagramSpec
  compute: (v: Values) => CalcResult<unknown>
  primary: (out: any) => ResultRow
  rows: (out: any, v: Values) => ResultRow[]
  /** i18n keys under xp.assumptions */
  assumptions: string[]
  /** category ids (lib/catalog/registry.ts) */
  catalog: number[]
  /** field key holding the optional unit price */
  priceKey?: string
  /** query-string aliases accepted for prefill, e.g. ?area= → areaM2 */
  aliases?: Record<string, string>
}

const s = (v: Values, k: string) => v[k] as string
const pct = (key = 'wastePct', def = 10): NumberField => ({ kind: 'number', key, label: 'waste', unit: '%', default: def, step: 1, slider: [0, 30], group: 'assumptions', help: 'waste' })
const len = (key: string, label: string, def: number, max = 30): NumberField => ({ kind: 'number', key, label, unit: 'm', default: def, step: 0.1, slider: [0, max], group: 'dimensions' })
const price = (key: string, label: string): NumberField => ({ kind: 'number', key, label, unit: 'MAD', default: '', step: 1, optional: true, group: 'pricing', help: 'price' })

/* ─────────────────────────────────────────────────────────────────────────── */

export const CALCULATORS: CalculatorDef[] = [
  {
    slug: 'carrelage',
    family: 'surfaces',
    fields: [
      len('lengthM', 'length', 4.2, 20),
      len('widthM', 'width', 3.4, 20),
      { kind: 'number', key: 'extraAreaM2', label: 'extraArea', unit: 'm²', default: 0, step: 0.5, optional: true, group: 'dimensions', help: 'extraArea' },
      {
        kind: 'select', key: 'format', label: 'tileFormat', group: 'material', default: '60x60',
        options: [
          { value: '30x30', label: 'f30x30', patch: { tileLengthCm: '30', tileWidthCm: '30' } },
          { value: '45x45', label: 'f45x45', patch: { tileLengthCm: '45', tileWidthCm: '45' } },
          { value: '60x60', label: 'f60x60', patch: { tileLengthCm: '60', tileWidthCm: '60' } },
          { value: '60x120', label: 'f60x120', patch: { tileLengthCm: '120', tileWidthCm: '60' } },
          { value: '20x120', label: 'f20x120', patch: { tileLengthCm: '120', tileWidthCm: '20' } },
          { value: 'custom', label: 'custom' },
        ],
      },
      { kind: 'number', key: 'tileLengthCm', label: 'tileLength', unit: 'cm', default: 60, step: 1, group: 'material', when: (v) => v.format === 'custom' },
      { kind: 'number', key: 'tileWidthCm', label: 'tileWidth', unit: 'cm', default: 60, step: 1, group: 'material', when: (v) => v.format === 'custom' },
      {
        kind: 'select', key: 'pattern', label: 'pattern', group: 'material', default: 'straight',
        options: (Object.keys(TILE_PATTERN_WASTE) as (keyof typeof TILE_PATTERN_WASTE)[]).map((p) => ({ value: p, label: p, patch: { wastePct: String(TILE_PATTERN_WASTE[p]) } })),
      },
      {
        kind: 'select', key: 'packMode', label: 'packMode', group: 'packaging', default: 'area',
        options: [{ value: 'area', label: 'm2PerBox' }, { value: 'tiles', label: 'tilesPerBox' }],
      },
      { kind: 'number', key: 'm2PerBox', label: 'm2PerBox', unit: 'm²', default: 1.44, step: 0.01, optional: true, group: 'packaging', when: (v) => v.packMode === 'area', help: 'packaging' },
      { kind: 'number', key: 'tilesPerBox', label: 'tilesPerBox', unit: 'u', default: 4, step: 1, optional: true, group: 'packaging', when: (v) => v.packMode === 'tiles', help: 'packaging' },
      pct('wastePct', 10),
      price('pricePerBox', 'pricePerBox'),
    ],
    diagram: { type: 'room', lengthKey: 'lengthM', widthKey: 'widthM', tileLKey: 'tileLengthCm', tileWKey: 'tileWidthCm', patternKey: 'pattern' },
    compute: (v) => calcTiles({ lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), extraAreaM2: s(v, 'extraAreaM2'), tileLengthCm: s(v, 'tileLengthCm'), tileWidthCm: s(v, 'tileWidthCm'), packMode: v.packMode === 'tiles' ? 'tiles' : 'area', tilesPerBox: s(v, 'tilesPerBox'), m2PerBox: s(v, 'm2PerBox'), wastePct: s(v, 'wastePct'), pricePerBox: s(v, 'pricePerBox') }),
    primary: (o: TileOutput) => (o.boxes !== null ? { label: 'boxes', value: o.boxes, unit: 'u:boxes' } : { label: 'tiles', value: o.tiles, unit: 'u:tiles' }),
    rows: (o: TileOutput) => [
      { label: 'netArea', value: o.netArea, unit: 'm²', decimals: 2 },
      { label: 'areaWithWaste', value: o.requiredArea, unit: 'm²', decimals: 2 },
      { label: 'tiles', value: o.tiles, unit: 'u:tiles', emphasis: true },
      { label: 'boxes', value: o.boxes, unit: 'u:boxes', emphasis: true, nullLabel: 'packagingMissing' },
      { label: 'purchasedArea', value: o.purchasedArea, unit: 'm²', decimals: 2 },
      { label: 'surplus', value: o.surplusArea, unit: 'm²', decimals: 2 },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['tileWaste', 'tilePattern', 'packagingCheck', 'indicative'],
    catalog: [50, 76, 48],
    priceKey: 'pricePerBox',
    aliases: { area: 'extraAreaM2', length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'peinture',
    family: 'finishes',
    fields: [
      { kind: 'select', key: 'mode', label: 'paintMode', group: 'dimensions', default: 'room', options: [{ value: 'room', label: 'room' }, { value: 'wall', label: 'singleWall' }] },
      len('lengthM', 'length', 4.5, 20),
      { ...len('widthM', 'width', 3.5, 20), when: (v) => v.mode === 'room' },
      { kind: 'number', key: 'heightM', label: 'wallHeight', unit: 'm', default: 2.7, step: 0.05, slider: [2, 5], group: 'dimensions' },
      { kind: 'toggle', key: 'includeCeiling', label: 'includeCeiling', default: false, group: 'dimensions', when: (v) => v.mode === 'room' },
      { kind: 'number', key: 'doors', label: 'doors', unit: 'u', default: 1, step: 1, group: 'dimensions', help: 'doors' },
      { kind: 'number', key: 'windows', label: 'windows', unit: 'u', default: 1, step: 1, group: 'dimensions', help: 'windows' },
      { kind: 'number', key: 'coats', label: 'coats', unit: '×', default: 2, step: 1, slider: [1, 4], group: 'material' },
      { kind: 'number', key: 'coverageM2PerL', label: 'coverage', unit: 'm²/L', default: 10, step: 0.5, slider: [4, 16], group: 'material', help: 'coverage' },
      { kind: 'number', key: 'containerL', label: 'containerL', unit: 'L', default: 15, step: 0.5, group: 'packaging', presets: [1, 4, 10, 15, 20], help: 'packaging' },
      pct('wastePct', 5),
      price('pricePerContainer', 'pricePerContainer'),
    ],
    diagram: { type: 'wall', lengthKey: 'lengthM', heightKey: 'heightM', widthKey: 'widthM', doorsKey: 'doors', windowsKey: 'windows', roomModeKey: 'mode' },
    compute: (v) => calcPaint({ mode: v.mode === 'wall' ? 'wall' : 'room', lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), heightM: s(v, 'heightM'), includeCeiling: v.includeCeiling === true, doors: s(v, 'doors'), windows: s(v, 'windows'), coats: s(v, 'coats'), coverageM2PerL: s(v, 'coverageM2PerL'), wastePct: s(v, 'wastePct'), containerL: s(v, 'containerL'), pricePerContainer: s(v, 'pricePerContainer') }),
    primary: (o: PaintOutput) => ({ label: 'liters', value: o.liters, unit: 'L', decimals: 1 }),
    rows: (o: PaintOutput) => [
      { label: 'wallArea', value: o.wallArea, unit: 'm²', decimals: 2 },
      { label: 'ceilingArea', value: o.ceilingArea || null, unit: 'm²', decimals: 2, nullLabel: 'notIncluded' },
      { label: 'openingsArea', value: o.openingsArea, unit: 'm²', decimals: 2 },
      { label: 'paintableArea', value: o.paintableArea, unit: 'm²', decimals: 2, emphasis: true },
      { label: 'liters', value: o.liters, unit: 'L', decimals: 1, emphasis: true },
      { label: 'containers', value: o.containers, unit: 'u:pots', emphasis: true },
      { label: 'purchasedLiters', value: o.purchasedLiters, unit: 'L', decimals: 1 },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['openingsStandard', 'coverageCheck', 'surfacePrep', 'indicative'],
    catalog: [72],
    priceKey: 'pricePerContainer',
    aliases: { length: 'lengthM', width: 'widthM', height: 'heightM' },
  },
  {
    slug: 'beton',
    family: 'structure',
    fields: [
      {
        kind: 'select', key: 'element', label: 'element', group: 'dimensions', default: 'slab',
        options: [
          { value: 'slab', label: 'slab', patch: { shape: 'rect', thicknessCm: '12' } },
          { value: 'footing', label: 'footing', patch: { shape: 'rect', thicknessCm: '35' } },
          { value: 'beam', label: 'beam', patch: { shape: 'rect', thicknessCm: '40' } },
          { value: 'column', label: 'column', patch: { shape: 'rect', thicknessCm: '25' } },
          { value: 'round', label: 'roundColumn', patch: { shape: 'cylinder' } },
        ],
      },
      len('lengthM', 'length', 5, 30),
      { ...len('widthM', 'width', 4, 30), when: (v) => v.shape !== 'cylinder' },
      { kind: 'number', key: 'thicknessCm', label: 'thickness', unit: 'cm', default: 12, step: 1, slider: [5, 60], group: 'dimensions', when: (v) => v.shape !== 'cylinder' },
      { kind: 'number', key: 'diameterCm', label: 'diameter', unit: 'cm', default: 30, step: 1, group: 'dimensions', when: (v) => v.shape === 'cylinder' },
      { kind: 'number', key: 'count', label: 'count', unit: 'u', default: 1, step: 1, group: 'dimensions' },
      {
        kind: 'select', key: 'dosage', label: 'dosage', group: 'material', default: '350',
        options: [
          { value: '250', label: 'd250', patch: { dosageKgPerM3: '250', sandLPerM3: '', gravelLPerM3: '', waterLPerM3: '' } },
          { value: '300', label: 'd300', patch: { dosageKgPerM3: '300', sandLPerM3: '', gravelLPerM3: '', waterLPerM3: '' } },
          { value: '350', label: 'd350', patch: { dosageKgPerM3: '350', sandLPerM3: '400', gravelLPerM3: '800', waterLPerM3: '175' } },
          { value: 'custom', label: 'custom' },
        ],
      },
      { kind: 'number', key: 'dosageKgPerM3', label: 'dosageKg', unit: 'kg/m³', default: 350, step: 10, group: 'material', when: (v) => v.dosage === 'custom', help: 'dosage' },
      { kind: 'number', key: 'bagKg', label: 'bagKg', unit: 'kg', default: 50, step: 1, group: 'packaging', presets: [25, 35, 50] },
      { kind: 'number', key: 'sandLPerM3', label: 'sandRecipe', unit: 'L/m³', default: 400, step: 10, optional: true, group: 'assumptions', help: 'recipe' },
      { kind: 'number', key: 'gravelLPerM3', label: 'gravelRecipe', unit: 'L/m³', default: 800, step: 10, optional: true, group: 'assumptions', help: 'recipe' },
      { kind: 'number', key: 'waterLPerM3', label: 'waterRecipe', unit: 'L/m³', default: 175, step: 5, optional: true, group: 'assumptions', help: 'recipe' },
      pct('wastePct', 5),
      price('pricePerBag', 'pricePerBag'),
    ],
    diagram: { type: 'slab', lengthKey: 'lengthM', widthKey: 'widthM', depthKey: 'thicknessCm', variant: 'concrete' },
    compute: (v) => calcConcrete({ shape: v.shape === 'cylinder' ? 'cylinder' : 'rect', lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), thicknessCm: s(v, 'thicknessCm'), diameterCm: s(v, 'diameterCm'), count: s(v, 'count'), wastePct: s(v, 'wastePct'), dosageKgPerM3: s(v, 'dosageKgPerM3'), bagKg: s(v, 'bagKg'), sandLPerM3: s(v, 'sandLPerM3'), gravelLPerM3: s(v, 'gravelLPerM3'), waterLPerM3: s(v, 'waterLPerM3'), pricePerBag: s(v, 'pricePerBag') }),
    primary: (o: ConcreteOutput) => ({ label: 'cementBags', value: o.bags, unit: 'u:bags' }),
    rows: (o: ConcreteOutput) => [
      { label: 'volume', value: o.volume, unit: 'm³', decimals: 3 },
      { label: 'adjustedVolume', value: o.adjustedVolume, unit: 'm³', decimals: 3, emphasis: true },
      { label: 'cementKg', value: o.cementKg, unit: 'kg', decimals: 0 },
      { label: 'cementBags', value: o.bags, unit: 'u:bags', emphasis: true },
      { label: 'sand', value: o.sandM3, unit: 'm³', decimals: 2, nullLabel: 'noRecipe' },
      { label: 'gravel', value: o.gravelM3, unit: 'm³', decimals: 2, nullLabel: 'noRecipe' },
      { label: 'water', value: o.waterL, unit: 'L', decimals: 0, nullLabel: 'noRecipe' },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['dosageUser', 'recipeReference', 'notStructural', 'indicative'],
    catalog: [73],
    priceKey: 'pricePerBag',
    aliases: { length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'etancheite',
    family: 'surfaces',
    fields: [
      { kind: 'select', key: 'mode', label: 'wpMode', group: 'material', default: 'liquid', options: [{ value: 'liquid', label: 'liquid' }, { value: 'membrane', label: 'membrane' }] },
      len('lengthM', 'length', 6, 30),
      len('widthM', 'width', 5, 30),
      { kind: 'number', key: 'upstandCm', label: 'upstand', unit: 'cm', default: 15, step: 1, slider: [0, 40], group: 'dimensions', help: 'upstand' },
      { kind: 'number', key: 'coats', label: 'coatsLayers', unit: '×', default: 2, step: 1, slider: [1, 4], group: 'material' },
      { kind: 'number', key: 'consumptionKgPerM2', label: 'consumptionKgM2', unit: 'kg/m²', default: 1.5, step: 0.1, group: 'material', when: (v) => v.mode === 'liquid', help: 'consumption' },
      { kind: 'number', key: 'packKg', label: 'packKg', unit: 'kg', default: 20, step: 1, group: 'packaging', when: (v) => v.mode === 'liquid', presets: [5, 20, 25] },
      { kind: 'number', key: 'rollAreaM2', label: 'rollArea', unit: 'm²', default: 10, step: 0.5, group: 'packaging', when: (v) => v.mode === 'membrane', help: 'packaging' },
      { kind: 'number', key: 'overlapPct', label: 'overlap', unit: '%', default: 10, step: 1, group: 'assumptions', when: (v) => v.mode === 'membrane' },
      pct('wastePct', 5),
      price('pricePerPack', 'pricePerPack'),
    ],
    diagram: { type: 'slab', lengthKey: 'lengthM', widthKey: 'widthM', depthKey: 'upstandCm', variant: 'membrane', upstandKey: 'upstandCm' },
    compute: (v) => calcWaterproofing({ mode: v.mode === 'membrane' ? 'membrane' : 'liquid', lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), upstandCm: s(v, 'upstandCm'), coats: s(v, 'coats'), consumptionKgPerM2: s(v, 'consumptionKgPerM2'), packKg: s(v, 'packKg'), rollAreaM2: s(v, 'rollAreaM2'), overlapPct: s(v, 'overlapPct'), wastePct: s(v, 'wastePct'), pricePerPack: s(v, 'pricePerPack') }),
    primary: (o: WaterproofingOutput) => ({ label: o.materialKg !== null ? 'packs' : 'rolls', value: o.packs, unit: o.materialKg !== null ? 'u:packs' : 'u:rolls' }),
    rows: (o: WaterproofingOutput) => [
      { label: 'baseArea', value: o.baseArea, unit: 'm²', decimals: 2 },
      { label: 'upstandArea', value: o.upstandArea, unit: 'm²', decimals: 2 },
      { label: 'totalArea', value: o.totalArea, unit: 'm²', decimals: 2, emphasis: true },
      ...(o.materialKg !== null
        ? [{ label: 'materialKg', value: o.materialKg, unit: 'kg', decimals: 1 }, { label: 'packs', value: o.packs, unit: 'u:packs', emphasis: true }]
        : [{ label: 'membraneArea', value: o.membraneArea, unit: 'm²', decimals: 2 }, { label: 'rolls', value: o.packs, unit: 'u:rolls', emphasis: true }]),
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['consumptionDatasheet', 'upstands', 'supportPrep', 'indicative'],
    catalog: [75],
    priceKey: 'pricePerPack',
    aliases: { length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'colle-mortier',
    family: 'finishes',
    fields: [
      {
        kind: 'select', key: 'product', label: 'productType', group: 'material', default: 'adhesive',
        options: [
          { value: 'adhesive', label: 'tileAdhesive', patch: { mode: 'perM2', consumption: '4', bagKg: '25' } },
          { value: 'leveling', label: 'leveling', patch: { mode: 'perM2mm', consumption: '1.6', thicknessMm: '5', bagKg: '25' } },
          { value: 'mortar', label: 'mortar', patch: { mode: 'perM2mm', consumption: '1.8', thicknessMm: '15', bagKg: '25' } },
        ],
      },
      { kind: 'number', key: 'areaM2', label: 'area', unit: 'm²', default: 20, step: 0.5, slider: [0, 200], group: 'dimensions' },
      { kind: 'number', key: 'consumption', label: 'consumption', unit: 'kg/m²', default: 4, step: 0.1, group: 'material', help: 'consumption', when: (v) => v.mode !== 'perM2mm' },
      { kind: 'number', key: 'consumption', label: 'consumptionPerMm', unit: 'kg/m²/mm', default: 4, step: 0.1, group: 'material', help: 'consumption', when: (v) => v.mode === 'perM2mm' },
      { kind: 'number', key: 'thicknessMm', label: 'layerThickness', unit: 'mm', default: 5, step: 1, slider: [1, 50], group: 'material', when: (v) => v.mode === 'perM2mm' },
      { kind: 'number', key: 'bagKg', label: 'bagKg', unit: 'kg', default: 25, step: 1, group: 'packaging', presets: [5, 20, 25] },
      pct('wastePct', 10),
      price('pricePerBag', 'pricePerBag'),
    ],
    diagram: { type: 'bags' },
    compute: (v) => calcBagMaterial({ areaM2: s(v, 'areaM2'), mode: v.mode === 'perM2mm' ? 'perM2mm' : 'perM2', consumption: s(v, 'consumption'), thicknessMm: s(v, 'thicknessMm'), bagKg: s(v, 'bagKg'), wastePct: s(v, 'wastePct'), pricePerBag: s(v, 'pricePerBag') }),
    primary: (o: BagMaterialOutput) => ({ label: 'bags', value: o.bags, unit: 'u:bags' }),
    rows: (o: BagMaterialOutput) => [
      { label: 'materialKg', value: o.kg, unit: 'kg', decimals: 1, emphasis: true },
      { label: 'bags', value: o.bags, unit: 'u:bags', emphasis: true },
      { label: 'purchasedKg', value: o.purchasedKg, unit: 'kg', decimals: 0 },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['consumptionDatasheet', 'notchTrowel', 'indicative'],
    catalog: [50, 36],
    priceKey: 'pricePerBag',
    aliases: { area: 'areaM2', bag: 'bagKg' },
  },
  {
    slug: 'murs-blocs',
    family: 'structure',
    fields: [
      len('lengthM', 'wallLength', 8, 40),
      { kind: 'number', key: 'heightM', label: 'wallHeight', unit: 'm', default: 2.8, step: 0.05, slider: [1, 6], group: 'dimensions' },
      { kind: 'number', key: 'openingsM2', label: 'openings', unit: 'm²', default: 3.1, step: 0.1, group: 'dimensions', help: 'openings' },
      {
        kind: 'select', key: 'block', label: 'blockType', group: 'material', default: 'agglo40',
        options: [
          { value: 'agglo40', label: 'agglo40', patch: { blockLengthCm: '40', blockHeightCm: '20' } },
          { value: 'agglo50', label: 'agglo50', patch: { blockLengthCm: '50', blockHeightCm: '20' } },
          { value: 'brick30', label: 'brick30', patch: { blockLengthCm: '30', blockHeightCm: '20' } },
          { value: 'custom', label: 'custom' },
        ],
      },
      { kind: 'number', key: 'blockLengthCm', label: 'blockLength', unit: 'cm', default: 40, step: 1, group: 'material', when: (v) => v.block === 'custom' },
      { kind: 'number', key: 'blockHeightCm', label: 'blockHeight', unit: 'cm', default: 20, step: 1, group: 'material', when: (v) => v.block === 'custom' },
      { kind: 'number', key: 'jointMm', label: 'joint', unit: 'mm', default: 10, step: 1, slider: [0, 20], group: 'material' },
      pct('wastePct', 5),
      price('pricePerUnit', 'pricePerUnit'),
    ],
    diagram: { type: 'wall', lengthKey: 'lengthM', heightKey: 'heightM', blockLKey: 'blockLengthCm', blockHKey: 'blockHeightCm' },
    compute: (v) => calcBlocks({ lengthM: s(v, 'lengthM'), heightM: s(v, 'heightM'), openingsM2: s(v, 'openingsM2'), blockLengthCm: s(v, 'blockLengthCm'), blockHeightCm: s(v, 'blockHeightCm'), jointMm: s(v, 'jointMm'), wastePct: s(v, 'wastePct'), pricePerUnit: s(v, 'pricePerUnit') }),
    primary: (o: BlocksOutput) => ({ label: 'units', value: o.units, unit: 'u:units' }),
    rows: (o: BlocksOutput) => [
      { label: 'grossArea', value: o.grossArea, unit: 'm²', decimals: 2 },
      { label: 'netWallArea', value: o.netArea, unit: 'm²', decimals: 2, emphasis: true },
      { label: 'unitsPerM2', value: o.unitsPerM2, unit: 'u:perM2', decimals: 2 },
      { label: 'units', value: o.units, unit: 'u:units', emphasis: true },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['jointIncluded', 'noMortar', 'notStructural', 'indicative'],
    catalog: [36, 73],
    priceKey: 'pricePerUnit',
    aliases: { length: 'lengthM', height: 'heightM' },
  },
  {
    slug: 'marbre-pierre',
    family: 'surfaces',
    fields: [
      len('lengthM', 'length', 5, 20),
      len('widthM', 'width', 4, 20),
      { kind: 'number', key: 'surfaces', label: 'surfaces', unit: 'u', default: 1, step: 1, group: 'dimensions' },
      {
        kind: 'select', key: 'slab', label: 'slabFormat', group: 'material', default: '60x60',
        options: [
          { value: '40x40', label: 'f40x40', patch: { slabLengthCm: '40', slabWidthCm: '40' } },
          { value: '60x60', label: 'f60x60', patch: { slabLengthCm: '60', slabWidthCm: '60' } },
          { value: '120x60', label: 'f60x120', patch: { slabLengthCm: '120', slabWidthCm: '60' } },
          { value: '280x160', label: 'f280x160', patch: { slabLengthCm: '280', slabWidthCm: '160' } },
          { value: 'custom', label: 'custom' },
        ],
      },
      { kind: 'number', key: 'slabLengthCm', label: 'slabLength', unit: 'cm', default: 60, step: 1, group: 'material', when: (v) => v.slab === 'custom' },
      { kind: 'number', key: 'slabWidthCm', label: 'slabWidth', unit: 'cm', default: 60, step: 1, group: 'material', when: (v) => v.slab === 'custom' },
      pct('wastePct', 15),
      price('pricePerM2', 'pricePerM2'),
    ],
    diagram: { type: 'room', lengthKey: 'lengthM', widthKey: 'widthM', tileLKey: 'slabLengthCm', tileWKey: 'slabWidthCm' },
    compute: (v) => calcStone({ lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), surfaces: s(v, 'surfaces'), slabLengthCm: s(v, 'slabLengthCm'), slabWidthCm: s(v, 'slabWidthCm'), wastePct: s(v, 'wastePct'), pricePerM2: s(v, 'pricePerM2') }),
    primary: (o: StoneOutput) => ({ label: 'slabs', value: o.slabs, unit: 'u:slabs' }),
    rows: (o: StoneOutput) => [
      { label: 'netArea', value: o.netArea, unit: 'm²', decimals: 2 },
      { label: 'areaWithWaste', value: o.adjustedArea, unit: 'm²', decimals: 2, emphasis: true },
      { label: 'slabs', value: o.slabs, unit: 'u:slabs', emphasis: true },
      { label: 'purchasedArea', value: o.purchasedArea, unit: 'm²', decimals: 2 },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['stoneWaste', 'stoneVeining', 'indicative'],
    catalog: [48, 50],
    priceKey: 'pricePerM2',
    aliases: { length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'sable-gravier',
    family: 'structure',
    fields: [
      len('lengthM', 'length', 10, 50),
      len('widthM', 'width', 5, 50),
      { kind: 'number', key: 'depthCm', label: 'fillDepth', unit: 'cm', default: 10, step: 1, slider: [2, 60], group: 'dimensions' },
      { kind: 'number', key: 'compactionPct', label: 'compaction', unit: '%', default: 20, step: 1, slider: [0, 40], group: 'assumptions', help: 'compaction' },
      {
        kind: 'select', key: 'material', label: 'fillMaterial', group: 'material', default: 'none',
        options: [
          { value: 'none', label: 'densityUnknown', patch: { densityTPerM3: '' } },
          { value: 'sand', label: 'drySand', patch: { densityTPerM3: '1.6' } },
          { value: 'gravel', label: 'gravel', patch: { densityTPerM3: '1.5' } },
          { value: 'custom', label: 'customDensity' },
        ],
      },
      { kind: 'number', key: 'densityTPerM3', label: 'density', unit: 't/m³', default: '', step: 0.05, optional: true, group: 'material', when: (v) => v.material !== 'none', help: 'density' },
      { kind: 'number', key: 'truckM3', label: 'truckCapacity', unit: 'm³', default: '', step: 0.5, optional: true, group: 'packaging', help: 'truck' },
      { ...price('pricePerM3', 'pricePerM3') },
    ],
    diagram: { type: 'slab', lengthKey: 'lengthM', widthKey: 'widthM', depthKey: 'depthCm', variant: 'fill' },
    compute: (v) => calcFill({ lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), depthCm: s(v, 'depthCm'), compactionPct: s(v, 'compactionPct'), densityTPerM3: s(v, 'densityTPerM3'), truckM3: s(v, 'truckM3'), pricePerM3: s(v, 'pricePerM3') }),
    primary: (o: FillOutput) => ({ label: 'adjustedVolume', value: o.adjustedVolume, unit: 'm³', decimals: 2 }),
    rows: (o: FillOutput) => [
      { label: 'volume', value: o.grossVolume, unit: 'm³', decimals: 2 },
      { label: 'adjustedVolume', value: o.adjustedVolume, unit: 'm³', decimals: 2, emphasis: true },
      { label: 'tonnes', value: o.tonnes, unit: 't', decimals: 2, nullLabel: 'densityRequired' },
      { label: 'loads', value: o.loads, unit: 'u:loads', nullLabel: 'capacityUnknown' },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['densitySupplier', 'compactionFactor', 'indicative'],
    catalog: [73],
    priceKey: 'pricePerM3',
    aliases: { length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'platre-enduit',
    family: 'finishes',
    fields: [
      { kind: 'select', key: 'mode', label: 'plasterMode', group: 'material', default: 'coat', options: [{ value: 'coat', label: 'plasterCoat' }, { value: 'board', label: 'plasterboard' }] },
      len('lengthM', 'length', 4, 20),
      len('widthM', 'widthOrHeight', 3, 20),
      { kind: 'number', key: 'openingsM2', label: 'openings', unit: 'm²', default: 0, step: 0.1, optional: true, group: 'dimensions', help: 'openings' },
      { kind: 'number', key: 'thicknessMm', label: 'layerThickness', unit: 'mm', default: 10, step: 1, slider: [1, 30], group: 'material', when: (v) => v.mode === 'coat' },
      { kind: 'number', key: 'consumptionKgPerM2Mm', label: 'consumptionPerMm', unit: 'kg/m²/mm', default: 1, step: 0.05, group: 'material', when: (v) => v.mode === 'coat', help: 'consumption' },
      { kind: 'number', key: 'bagKg', label: 'bagKg', unit: 'kg', default: 25, step: 1, group: 'packaging', when: (v) => v.mode === 'coat', presets: [5, 25, 40] },
      { kind: 'number', key: 'sheetLengthCm', label: 'sheetLength', unit: 'cm', default: 250, step: 1, group: 'packaging', when: (v) => v.mode === 'board' },
      { kind: 'number', key: 'sheetWidthCm', label: 'sheetWidth', unit: 'cm', default: 120, step: 1, group: 'packaging', when: (v) => v.mode === 'board' },
      pct('wastePct', 10),
      price('pricePerUnit', 'pricePerBagOrSheet'),
    ],
    diagram: { type: 'room', lengthKey: 'lengthM', widthKey: 'widthM' },
    compute: (v) => calcPlaster({ mode: v.mode === 'board' ? 'board' : 'coat', lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), openingsM2: s(v, 'openingsM2'), thicknessMm: s(v, 'thicknessMm'), consumptionKgPerM2Mm: s(v, 'consumptionKgPerM2Mm'), bagKg: s(v, 'bagKg'), sheetLengthCm: s(v, 'sheetLengthCm'), sheetWidthCm: s(v, 'sheetWidthCm'), wastePct: s(v, 'wastePct'), pricePerUnit: s(v, 'pricePerUnit') }),
    primary: (o: PlasterOutput) => (o.bags !== null ? { label: 'bags', value: o.bags, unit: 'u:bags' } : { label: 'sheets', value: o.sheets, unit: 'u:sheets' }),
    rows: (o: PlasterOutput) => [
      { label: 'surface', value: o.area, unit: 'm²', decimals: 2, emphasis: true },
      ...(o.bags !== null
        ? [{ label: 'materialKg', value: o.kg, unit: 'kg', decimals: 1 }, { label: 'bags', value: o.bags, unit: 'u:bags', emphasis: true }]
        : [{ label: 'sheets', value: o.sheets, unit: 'u:sheets', emphasis: true }]),
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['consumptionDatasheet', 'boardVsPlaster', 'indicative'],
    catalog: [72],
    priceKey: 'pricePerUnit',
    aliases: { length: 'lengthM', width: 'widthM', bag: 'bagKg' },
  },
  {
    slug: 'paves-terrasse',
    family: 'surfaces',
    fields: [
      len('lengthM', 'length', 8, 40),
      len('widthM', 'width', 5, 40),
      {
        kind: 'select', key: 'piece', label: 'pieceFormat', group: 'material', default: '20x10',
        options: [
          { value: '20x10', label: 'p20x10', patch: { pieceLengthCm: '20', pieceWidthCm: '10' } },
          { value: '40x40', label: 'f40x40', patch: { pieceLengthCm: '40', pieceWidthCm: '40' } },
          { value: '60x40', label: 'p60x40', patch: { pieceLengthCm: '60', pieceWidthCm: '40' } },
          { value: 'custom', label: 'custom' },
        ],
      },
      { kind: 'number', key: 'pieceLengthCm', label: 'pieceLength', unit: 'cm', default: 20, step: 1, group: 'material', when: (v) => v.piece === 'custom' },
      { kind: 'number', key: 'pieceWidthCm', label: 'pieceWidth', unit: 'cm', default: 10, step: 1, group: 'material', when: (v) => v.piece === 'custom' },
      { kind: 'number', key: 'jointMm', label: 'joint', unit: 'mm', default: 3, step: 1, slider: [0, 15], group: 'material' },
      {
        kind: 'select', key: 'pattern', label: 'pattern', group: 'material', default: 'straight',
        options: (Object.keys(PAVER_PATTERN_WASTE) as (keyof typeof PAVER_PATTERN_WASTE)[]).map((p) => ({ value: p, label: p, patch: { wastePct: String(PAVER_PATTERN_WASTE[p]) } })),
      },
      { kind: 'select', key: 'packMode', label: 'packMode', group: 'packaging', default: 'area', options: [{ value: 'area', label: 'm2PerPack' }, { value: 'pieces', label: 'piecesPerPack' }] },
      { kind: 'number', key: 'm2PerPack', label: 'm2PerPack', unit: 'm²', default: 10, step: 0.5, optional: true, group: 'packaging', when: (v) => v.packMode === 'area', help: 'packaging' },
      { kind: 'number', key: 'piecesPerPack', label: 'piecesPerPack', unit: 'u', default: 480, step: 1, optional: true, group: 'packaging', when: (v) => v.packMode === 'pieces', help: 'packaging' },
      pct('wastePct', 5),
      price('pricePerPack', 'pricePerPack'),
    ],
    diagram: { type: 'room', lengthKey: 'lengthM', widthKey: 'widthM', tileLKey: 'pieceLengthCm', tileWKey: 'pieceWidthCm', patternKey: 'pattern' },
    compute: (v) => calcPavers({ lengthM: s(v, 'lengthM'), widthM: s(v, 'widthM'), pieceLengthCm: s(v, 'pieceLengthCm'), pieceWidthCm: s(v, 'pieceWidthCm'), jointMm: s(v, 'jointMm'), wastePct: s(v, 'wastePct'), packMode: v.packMode === 'pieces' ? 'pieces' : 'area', piecesPerPack: s(v, 'piecesPerPack'), m2PerPack: s(v, 'm2PerPack'), pricePerPack: s(v, 'pricePerPack') }),
    primary: (o: PaverOutput) => ({ label: 'pieces', value: o.pieces, unit: 'u:pieces' }),
    rows: (o: PaverOutput) => [
      { label: 'netArea', value: o.netArea, unit: 'm²', decimals: 2, emphasis: true },
      { label: 'pieces', value: o.pieces, unit: 'u:pieces', emphasis: true },
      { label: 'packs', value: o.packs, unit: 'u:packs', nullLabel: 'packagingMissing' },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['paverCuts', 'borders', 'indicative'],
    catalog: [73, 36],
    priceKey: 'pricePerPack',
    aliases: { length: 'lengthM', width: 'widthM' },
  },
  {
    slug: 'toiture',
    family: 'structure',
    fields: [
      len('eaveLengthM', 'eaveLength', 10, 40),
      { kind: 'select', key: 'slopeMode', label: 'slopeMode', group: 'dimensions', default: 'slope', options: [{ value: 'slope', label: 'measuredSlope' }, { value: 'pitch', label: 'runAndPitch' }] },
      { ...len('slopeLengthM', 'slopeLength', 5, 20), when: (v) => v.slopeMode === 'slope' },
      { ...len('runM', 'run', 4, 20), when: (v) => v.slopeMode === 'pitch' },
      { kind: 'number', key: 'pitchDeg', label: 'pitch', unit: '°', default: 30, step: 1, slider: [5, 60], group: 'dimensions', when: (v) => v.slopeMode === 'pitch' },
      { kind: 'number', key: 'planes', label: 'planes', unit: 'u', default: 2, step: 1, slider: [1, 4], group: 'dimensions' },
      { kind: 'number', key: 'tilesPerM2', label: 'tilesPerM2', unit: 'u/m²', default: 13, step: 0.5, group: 'material', help: 'tilesPerM2' },
      { kind: 'number', key: 'piecesPerPack', label: 'piecesPerPallet', unit: 'u', default: '', step: 1, optional: true, group: 'packaging' },
      pct('wastePct', 5),
      price('pricePerPiece', 'pricePerPiece'),
    ],
    diagram: { type: 'roof', eaveKey: 'eaveLengthM', slopeKey: 'slopeLengthM', runKey: 'runM', pitchKey: 'pitchDeg', modeKey: 'slopeMode', planesKey: 'planes' },
    compute: (v) => calcRoof({ eaveLengthM: s(v, 'eaveLengthM'), slopeMode: v.slopeMode === 'pitch' ? 'pitch' : 'slope', slopeLengthM: s(v, 'slopeLengthM'), runM: s(v, 'runM'), pitchDeg: s(v, 'pitchDeg'), planes: s(v, 'planes'), tilesPerM2: s(v, 'tilesPerM2'), wastePct: s(v, 'wastePct'), piecesPerPack: s(v, 'piecesPerPack'), pricePerPiece: s(v, 'pricePerPiece') }),
    primary: (o: RoofOutput) => ({ label: 'roofTiles', value: o.pieces, unit: 'u:pieces' }),
    rows: (o: RoofOutput) => [
      { label: 'slopeLength', value: o.slopeLength, unit: 'm', decimals: 2 },
      { label: 'roofArea', value: o.roofArea, unit: 'm²', decimals: 2, emphasis: true },
      { label: 'roofTiles', value: o.pieces, unit: 'u:pieces', emphasis: true },
      { label: 'pallets', value: o.packs, unit: 'u:packs', nullLabel: 'packagingMissing' },
      { label: 'cost', value: o.cost, unit: 'MAD', decimals: 2, nullLabel: 'priceUnavailable' },
    ],
    assumptions: ['tilesPerM2Maker', 'roofNoStructure', 'indicative'],
    catalog: [75],
    priceKey: 'pricePerPiece',
  },
]

export const EXTRA_TOOLS = ['budget', 'convertisseur'] as const
export type ExtraToolSlug = (typeof EXTRA_TOOLS)[number]
export type ToolSlug = CalculatorSlug | ExtraToolSlug

export const ALL_TOOL_SLUGS: ToolSlug[] = [...CALCULATORS.map((c) => c.slug), ...EXTRA_TOOLS]

export function getCalculator(slug: string): CalculatorDef | undefined {
  return CALCULATORS.find((c) => c.slug === slug)
}

/** Default values, applying select patches so derived fields stay coherent. */
export function defaultValues(def: CalculatorDef): Values {
  const values: Values = {}
  for (const field of def.fields) {
    if (field.key in values) continue
    values[field.key] = field.kind === 'number' ? String(field.default) : field.default
  }
  for (const field of def.fields) {
    if (field.kind !== 'select') continue
    const option = field.options.find((o) => o.value === values[field.key])
    if (option?.patch) Object.assign(values, option.patch)
  }
  return values
}

/**
 * Applies a query-string prefill (e.g. from the footer teaser or a product
 * page). Only known numeric/select keys are accepted; everything else is
 * ignored so URLs cannot inject arbitrary state.
 */
export function applyPrefill(def: CalculatorDef, base: Values, params: Record<string, string | undefined>): Values {
  const next: Values = { ...base }
  const numeric = /^-?[\d\s.,٠-٩]+$/
  const fieldOf = (key: string) => def.fields.find((f) => f.key === key)
  // 1) selects first (their presets may patch numeric fields)…
  for (const [rawKey, rawValue] of Object.entries(params)) {
    const key = def.aliases?.[rawKey] ?? rawKey
    const field = fieldOf(key)
    if (field?.kind !== 'select' || !rawValue) continue
    const option = field.options.find((o) => o.value === rawValue)
    if (!option) continue
    next[key] = option.value
    if (option.patch) Object.assign(next, option.patch)
  }
  // 2) …then explicit numbers win. Accepted keys: declared fields and
  //    derived numeric keys already present in the defaults.
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (!rawValue) continue
    const key = def.aliases?.[rawKey] ?? rawKey
    const field = fieldOf(key)
    if (field?.kind === 'toggle') {
      next[key] = rawValue === '1' || rawValue === 'true'
      continue
    }
    const isNumericKey = field?.kind === 'number' || (!field && typeof base[key] === 'string' && numeric.test(String(base[key]) || '0'))
    if (isNumericKey && numeric.test(rawValue) && rawValue.length < 16) next[key] = rawValue
  }
  return next
}

/** Maps a product to the most relevant calculator (or none) — see product page. */
export function calculatorForProduct(product: { designation?: string | null; categoryId?: number | null; parentCategoryId?: number | null }): { slug: CalculatorSlug; prefill: Record<string, string> } | null {
  const name = (product.designation ?? '').toLowerCase()
  const cats = [product.categoryId, product.parentCategoryId].filter((c): c is number => typeof c === 'number')
  // Tools, cutting discs, ladders, electricity and plumbing never get a quantity calculator.
  const excluded = [10, 48, 52, 16, 53, 83, 105, 106]
  if (cats.some((c) => excluded.includes(c))) return null
  if (/(disque|outil|truelle|spatule|pistolet|rouleau|pinceau|machine|perceuse|meuleuse)/.test(name)) return null

  const pack = name.match(/(\d+(?:[.,]\d+)?)\s*(kg|l|lt|litres?)\b/)
  const size = pack ? pack[1].replace(',', '.') : undefined
  const isLiters = pack ? /^l/.test(pack[2]) : false

  if (/(colle|adhesive|adhésif)/.test(name) || cats.includes(50)) return { slug: 'colle-mortier', prefill: { product: 'adhesive', ...(size && !isLiters ? { bagKg: size } : {}) } }
  if (/(ragr[eé]age|autolissant|nivel)/.test(name)) return { slug: 'colle-mortier', prefill: { product: 'leveling', ...(size && !isLiters ? { bagKg: size } : {}) } }
  if (/(mortier)/.test(name)) return { slug: 'colle-mortier', prefill: { product: 'mortar', ...(size && !isLiters ? { bagKg: size } : {}) } }
  if (/(enduit|pl[aâ]tre|gypse)/.test(name)) return { slug: 'platre-enduit', prefill: { mode: 'coat', ...(size && !isLiters ? { bagKg: size } : {}) } }
  if (/(étanch|etanch|bitum|membrane|imperm)/.test(name) || cats.includes(75)) return { slug: 'etancheite', prefill: size && !isLiters ? { packKg: size } : {} }
  if (/(peinture|laque|vernis|primaire|sous-couche)/.test(name) || cats.includes(72) || cats.includes(108)) return { slug: 'peinture', prefill: size && isLiters ? { containerL: size } : {} }
  if (/(ciment|béton|beton|cpj)/.test(name)) return { slug: 'beton', prefill: size && !isLiters ? { bagKg: size } : {} }
  if (/(sable|gravette|gravier|gravillon)/.test(name)) return { slug: 'sable-gravier', prefill: {} }
  if (/(carreau|carrelage|faïence|faience|grès|gres c[eé]rame)/.test(name)) return { slug: 'carrelage', prefill: {} }
  if (/(marbre|granit|travertin)/.test(name)) return { slug: 'marbre-pierre', prefill: {} }
  if (/(brique|agglo|parpaing|bloc)/.test(name)) return { slug: 'murs-blocs', prefill: {} }
  return null
}
