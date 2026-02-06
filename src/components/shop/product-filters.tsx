'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, ChevronDown, ChevronRight, Tag, Package, DollarSign, Palette, Search, SlidersHorizontal, Ruler, ChevronLeft, ArrowUpDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import type { FilterState, SortOption, ProductCategory, ProductBrand } from '@/types/api/products'
import { useTranslations } from 'next-intl'

function getCategoryLabel(category: ProductCategory, locale: string) {
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
  return category.nom
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
  categories?: ProductCategory[]
  brands?: ProductBrand[]
  availableColors?: string[]
  availableUnits?: string[]
  minPrice?: number
  maxPrice?: number
  isLoading?: boolean
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function ProductFilters({
  onFilterChange,
  initialFilters,
  categories = [],
  brands = [],
  availableColors = [],
  availableUnits = [],
  minPrice = 0,
  maxPrice = 10000,
  isLoading = false,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
}: ProductFiltersProps) {
  const t = useTranslations('productFilters')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(false)
  const isCollapsed = typeof controlledCollapsed === 'boolean' ? controlledCollapsed : uncontrolledCollapsed
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const debouncedCategorySearch = useDebounce(categorySearch, 300)
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(8)
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    price: true,
    colors: false,
    units: false
  })

  const [filters, setFilters] = useState<FilterState>(() => ({
    categories: initialFilters?.categories ?? [],
    brands: initialFilters?.brands ?? [],
    priceRange: initialFilters?.priceRange ?? [minPrice, maxPrice],
    colors: initialFilters?.colors ?? [],
    units: initialFilters?.units ?? [],
    search: initialFilters?.search ?? '',
    inStock: typeof initialFilters?.inStock === 'boolean' ? initialFilters.inStock : true,
    sort: initialFilters?.sort ?? 'newest',
    page: initialFilters?.page ?? 1,
    per_page: initialFilters?.per_page ?? 20,
  }))

  const [searchInput, setSearchInput] = useState(() => initialFilters?.search ?? '')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(() =>
    (initialFilters?.priceRange as [number, number] | undefined) ?? [minPrice, maxPrice]
  )

  // Refs for optimization
  const isInitialMount = useRef(true)
  const previousFilters = useRef<FilterState>(filters)
  const notifyTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastPriceBoundsRef = useRef<[number, number]>([minPrice, maxPrice])

  // Sort options with labels
  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'newest', label: t('sort.newest') },
    { value: 'price_asc', label: t('sort.priceAsc') },
    { value: 'price_desc', label: t('sort.priceDesc') },
    { value: 'promo', label: t('sort.bestPromos') },
    { value: 'popular', label: t('sort.popular') },
  ]

  // Helper to check if filters actually changed (deep equality for arrays)
  const filtersChanged = useCallback((prev: FilterState, current: FilterState): boolean => {
    const sortNums = (arr: number[]) => [...arr].sort((a, b) => a - b)
    const sortStrings = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b))

    return (
      prev.page !== current.page ||
      prev.per_page !== current.per_page ||
      prev.sort !== current.sort ||
      prev.search !== current.search ||
      prev.inStock !== current.inStock ||
      prev.priceRange[0] !== current.priceRange[0] ||
      prev.priceRange[1] !== current.priceRange[1] ||
      JSON.stringify(sortNums(prev.categories)) !== JSON.stringify(sortNums(current.categories)) ||
      JSON.stringify(sortNums(prev.brands)) !== JSON.stringify(sortNums(current.brands)) ||
      JSON.stringify(sortStrings(prev.colors)) !== JSON.stringify(sortStrings(current.colors)) ||
      JSON.stringify(sortStrings(prev.units)) !== JSON.stringify(sortStrings(current.units))
    )
  }, [])

  const desiredFilters = useMemo<FilterState>(() => ({
    categories: initialFilters?.categories ?? [],
    brands: initialFilters?.brands ?? [],
    priceRange: (initialFilters?.priceRange as [number, number] | undefined) ?? [minPrice, maxPrice],
    colors: initialFilters?.colors ?? [],
    units: initialFilters?.units ?? [],
    search: initialFilters?.search ?? '',
    inStock: typeof initialFilters?.inStock === 'boolean' ? initialFilters.inStock : true,
    sort: (initialFilters?.sort as SortOption | undefined) ?? 'newest',
    page: initialFilters?.page ?? 1,
    per_page: initialFilters?.per_page ?? 20,
  }), [initialFilters, minPrice, maxPrice])

  // Keep UI in sync when URL params change (e.g., browser back/forward)
  useEffect(() => {
    if (isInitialMount.current) return

    setFilters((prev) => {
      if (!filtersChanged(prev, desiredFilters)) return prev
      previousFilters.current = desiredFilters
      return desiredFilters
    })

    setSearchInput(desiredFilters.search)
    setLocalPriceRange(desiredFilters.priceRange)
  }, [desiredFilters, filtersChanged])

  // Debounced notification to parent (batches rapid changes)
  const notifyParent = useCallback((newFilters: FilterState) => {
    if (notifyTimeoutRef.current) {
      clearTimeout(notifyTimeoutRef.current)
    }

    notifyTimeoutRef.current = setTimeout(() => {
      if (filtersChanged(previousFilters.current, newFilters)) {
        previousFilters.current = newFilters
        onFilterChange(newFilters)
      }
    }, 150) // Small delay to batch rapid changes
  }, [filtersChanged, onFilterChange])

  // Update search in filters when debounced
  useEffect(() => {
    if (isInitialMount.current) return

    setFilters(prev => {
      const updated = { ...prev, search: debouncedSearch, page: 1 }
      notifyParent(updated)
      return updated
    })
  }, [debouncedSearch, notifyParent])

  // Sync price bounds from API (only when min/max props change)
  useEffect(() => {
    const newMin = minPrice ?? 0
    const newMax = maxPrice ?? 10000

    const [prevMin, prevMax] = lastPriceBoundsRef.current
    if (prevMin === newMin && prevMax === newMax) return
    lastPriceBoundsRef.current = [newMin, newMax]

    // Clamp current UI selection within new bounds
    setLocalPriceRange((prev) => {
      const clampedMin = Math.max(newMin, prev[0])
      const clampedMax = Math.min(newMax, prev[1])
      if (clampedMin > clampedMax) return [newMin, newMax]
      return [clampedMin, clampedMax]
    })

    if (!isInitialMount.current) {
      setFilters((prev) => {
        const clampedMin = Math.max(newMin, prev.priceRange[0])
        const clampedMax = Math.min(newMax, prev.priceRange[1])
        const range: [number, number] =
          clampedMin > clampedMax ? [newMin, newMax] : [clampedMin, clampedMax]

        const updated = { ...prev, priceRange: range, page: 1 }
        notifyParent(updated)
        return updated
      })
    } else {
      // On mount, just set without notifying
      setFilters((prev) => ({ ...prev, priceRange: [newMin, newMax] as [number, number] }))
    }
  }, [minPrice, maxPrice, notifyParent])

  // Mark initial mount as complete and notify parent with initial filters
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      previousFilters.current = filters
      onFilterChange(filters)
    }
  }, []) // Run only once on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notifyTimeoutRef.current) {
        clearTimeout(notifyTimeoutRef.current)
      }
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    if (typeof controlledCollapsed !== 'boolean') {
      setUncontrolledCollapsed(value)
    }
    onCollapsedChange?.(value)
  }, [controlledCollapsed, onCollapsedChange])

  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }, [])

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const handleCategoryChange = useCallback((categoryId: number) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        categories: prev.categories.includes(categoryId)
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId],
        page: 1
      }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handleBrandChange = useCallback((brandId: number) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        brands: prev.brands.includes(brandId)
          ? prev.brands.filter(id => id !== brandId)
          : [...prev.brands, brandId],
        page: 1
      }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handleColorChange = useCallback((color: string) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        colors: prev.colors.includes(color)
          ? prev.colors.filter(c => c !== color)
          : [...prev.colors, color],
        page: 1
      }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handleUnitChange = useCallback((unit: string) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        units: prev.units.includes(unit)
          ? prev.units.filter(u => u !== unit)
          : [...prev.units, unit],
        page: 1
      }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handlePriceChange = useCallback((value: number[]) => {
    setLocalPriceRange(value as [number, number])
  }, [])

  const handlePriceCommit = useCallback((value: number[]) => {
    const range = value as [number, number]
    setLocalPriceRange(range)
    setFilters(prev => {
      const updated = { ...prev, priceRange: range, page: 1 }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handleInStockChange = useCallback((checked: boolean) => {
    setFilters(prev => {
      const updated = { ...prev, inStock: checked, page: 1 }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const handleSortChange = useCallback((value: SortOption) => {
    setFilters(prev => {
      const updated = { ...prev, sort: value, page: 1 }
      notifyParent(updated)
      return updated
    })
  }, [notifyParent])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setLocalPriceRange([minPrice, maxPrice])
    const resetFilters: FilterState = {
      categories: [],
      brands: [],
      priceRange: [minPrice, maxPrice],
      colors: [],
      units: [],
      search: '',
      inStock: true,
      sort: 'newest',
      page: 1,
      per_page: 20
    }
    setFilters(resetFilters)
    notifyParent(resetFilters)
  }, [minPrice, maxPrice, notifyParent])

  const activeFiltersCount = useMemo(() => {
    return (
      filters.categories.length +
      filters.brands.length +
      filters.colors.length +
      filters.units.length +
      (filters.inStock !== true ? 1 : 0) +
      (filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice ? 1 : 0) +
      (filters.search ? 1 : 0)
    )
  }, [filters, minPrice, maxPrice])

  // Helper function to render category tree recursively
  // Flatten categories to leaves for quick-pick grid
  const flattenCategories = useCallback((nodes: ProductCategory[]): ProductCategory[] => {
    const result: ProductCategory[] = []
    const stack = [...nodes]
    while (stack.length) {
      const node = stack.pop()!
      if (node.children && node.children.length) {
        stack.push(...node.children)
      } else {
        result.push(node)
      }
    }
    return result
  }, [])

  const quickCategories = useMemo(() => {
    const leaves = flattenCategories(categories)
    const filtered = debouncedCategorySearch
      ? leaves.filter((c) =>
        getCategoryLabel(c, locale).toLowerCase().includes(debouncedCategorySearch.toLowerCase())
      )
      : leaves
    return filtered.slice(0, visibleCategoryCount)
  }, [categories, debouncedCategorySearch, visibleCategoryCount, flattenCategories, locale])

  const renderCategoryTree = useCallback((category: ProductCategory) => {
    const hasChildren = category.children && category.children.length > 0

    return (
      <div key={category.id} className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`category-${category.id}`}
            checked={filters.categories.includes(category.id)}
            onCheckedChange={() => handleCategoryChange(category.id)}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <label
            htmlFor={`category-${category.id}`}
            className="flex-1 text-sm cursor-pointer hover:text-foreground transition-colors"
          >
            {getCategoryLabel(category, locale)}
          </label>
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCategory(category.id)}
              className="h-6 w-6 p-0"
              disabled={isLoading}
            >
              <ChevronRight
                className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  expandedCategories.includes(category.id) && "rotate-90"
                )}
              />
            </Button>
          )}
        </div>
        {hasChildren && expandedCategories.includes(category.id) && (
          <div className="ml-6 space-y-2">
            {category.children!.map((child) => renderCategoryTree(child))}
          </div>
        )}
      </div>
    )
  }, [filters.categories, expandedCategories, handleCategoryChange, toggleCategory, isLoading, locale])

  // Auto-expand parents so selected categories (e.g., 23/27) are visible & checked.
  const autoExpanded = useMemo(() => {
    if (!categories.length || filters.categories.length === 0) return [] as number[]

    const findPath = (
      nodes: ProductCategory[],
      targetId: number,
      path: number[]
    ): number[] | null => {
      for (const node of nodes) {
        const nextPath = [...path, node.id]
        if (node.id === targetId) return nextPath
        if (node.children && node.children.length > 0) {
          const found = findPath(node.children, targetId, nextPath)
          if (found) return found
        }
      }
      return null
    }

    const expanded = new Set<number>()
    for (const selectedId of filters.categories) {
      const path = findPath(categories, selectedId, [])
      if (!path || path.length < 2) continue
      // Expand all ancestors (exclude the selected leaf itself)
      for (let i = 0; i < path.length - 1; i += 1) {
        expanded.add(path[i])
      }
    }
    return Array.from(expanded)
  }, [categories, filters.categories])

  useEffect(() => {
    if (autoExpanded.length === 0) return
    setExpandedCategories((prev) => {
      const merged = new Set(prev)
      for (const id of autoExpanded) merged.add(id)
      return Array.from(merged)
    })
  }, [autoExpanded])

  const colorMap: Record<string, string> = {
    'Blanc': '#FFFFFF',
    'Blanc Pur': '#FAFAFA',
    'Beige': '#D4C5B9',
    'Beige Sable': '#C9B99B',
    'Noir': '#000000',
    'Gris': '#6B7280',
    'Gris Perle': '#D3D3D3',
    'Rouge': '#EF4444',
    'Bleu': '#3B82F6',
    'Bleu Ciel': '#87CEEB',
    'Vert': '#10B981',
    'Jaune': '#FBBF24',
    'Orange': '#F97316',
    'Violet': '#8B5CF6',
    'Marron': '#92400E'
  }

  const FiltersContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center px-1.5 bg-primary">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isLoading}
            className="h-8 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {t('clear')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {/* Sort */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('sortBy')}</span>
          </div>
          <Select value={filters.sort} onValueChange={handleSortChange} disabled={isLoading}>
            <SelectTrigger className="h-9 text-sm w-full bg-background/80 backdrop-blur-sm border-border/60 hover:border-primary/40 transition-colors">
              <SelectValue placeholder={t('selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('searchTitle')}</span>
          </div>
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isLoading}
            className="h-9 text-sm"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('categories')}
              disabled={isLoading}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t('categories')}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  expandedSections.categories && "rotate-180"
                )}
              />
            </button>
            {expandedSections.categories && (
              <div className="space-y-2 pt-1">
                {categories.map((category) => (
                  <div key={category.id}>{renderCategoryTree(category)}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('brands')}
              disabled={isLoading}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t('brands')}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  expandedSections.brands && "rotate-180"
                )}
              />
            </button>
            {expandedSections.brands && (
              <div className="space-y-2 pt-1">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`brand-${brand.id}`}
                      checked={filters.brands.includes(brand.id)}
                      onCheckedChange={() => handleBrandChange(brand.id)}
                      disabled={isLoading}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`brand-${brand.id}`}
                      className="text-sm cursor-pointer hover:text-foreground transition-colors"
                    >
                      {brand.nom}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Range */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('price')}
            disabled={isLoading}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{t('price')}</span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                expandedSections.price && "rotate-180"
              )}
            />
          </button>
          {expandedSections.price && (
            <div className="space-y-4 pt-1">
              <Slider
                min={minPrice}
                max={maxPrice}
                step={100}
                value={localPriceRange}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                disabled={isLoading}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{localPriceRange[0]} {tCommon('currency')}</span>
                <span className="text-muted-foreground">{localPriceRange[1]} {tCommon('currency')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Colors - Only show if available */}
        {availableColors.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('colors')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t('colors')}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  expandedSections.colors && "rotate-180"
                )}
              />
            </button>
            {expandedSections.colors && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 transition-all duration-200 relative group",
                      filters.colors.includes(color)
                        ? "border-primary scale-110 shadow-md"
                        : "border-border hover:border-border/60 hover:scale-105"
                    )}
                    style={{ backgroundColor: colorMap[color] || color }}
                    title={color}
                  >
                    {filters.colors.includes(color) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
                      </div>
                    )}
                    {(color === 'Blanc' || color === 'Blanc Pur' || color === 'Beige' || color === 'Beige Sable' || color === 'Gris Perle') && (
                      <div className="absolute inset-0 rounded-full border border-border/30" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Units - Only show if available */}
        {availableUnits.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('units')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{t('units')}</span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  expandedSections.units && "rotate-180"
                )}
              />
            </button>
            {expandedSections.units && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                {availableUnits.map((unit) => (
                  <button
                    key={unit}
                    onClick={() => handleUnitChange(unit)}
                    className={cn(
                      "h-9 px-3 rounded-md border text-xs font-medium transition-all duration-200 cursor-pointer",
                      filters.units.includes(unit)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* In Stock */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStock}
            onCheckedChange={handleInStockChange}
            disabled={isLoading}
            className="h-4 w-4"
          />
          <label
            htmlFor="in-stock"
            className="text-sm cursor-pointer hover:text-foreground transition-colors"
          >
            {t('inStockOnly')}
          </label>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" className="gap-2 relative">
            <SlidersHorizontal className="w-4 h-4" />
            {t('title')}
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center px-1.5 bg-primary">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-6">
          <FiltersContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block relative", isCollapsed ? "shrink-0" : "shrink-0")}>
        <div
          className={cn(
            // Clean container: no border, no shadow
            "sticky top-20 bg-background rounded-2xl transition-all duration-300 ease-in-out",
            // Keep in flex flow; when collapsed do not reserve width
            isCollapsed ? "w-0 p-0 overflow-visible" : "w-[360px] md:w-[400px] p-6 overflow-visible"
          )}
        >
          {/* Content with smooth opacity transition */}
          {!isCollapsed && (
            <div className="transition-opacity duration-300">
              <FiltersContent />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
