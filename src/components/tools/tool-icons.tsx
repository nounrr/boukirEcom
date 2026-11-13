import {
  ArrowLeftRight,
  BrickWall,
  Droplets,
  Gem,
  Grid3x3,
  Home,
  Layers,
  LayoutGrid,
  Mountain,
  PaintRoller,
  PiggyBank,
  Shovel,
  Square,
  type LucideIcon,
} from "lucide-react"
import type { ToolSlug } from "@/lib/calculators/registry"

export const TOOL_ICONS: Record<ToolSlug, LucideIcon> = {
  carrelage: Grid3x3,
  peinture: PaintRoller,
  beton: Square,
  etancheite: Droplets,
  "colle-mortier": Layers,
  "murs-blocs": BrickWall,
  "marbre-pierre": Gem,
  "sable-gravier": Mountain,
  "platre-enduit": LayoutGrid,
  "paves-terrasse": Shovel,
  toiture: Home,
  budget: PiggyBank,
  convertisseur: ArrowLeftRight,
}
