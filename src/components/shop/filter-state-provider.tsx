'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface FilterStateContextType {
  isFiltersCollapsed: boolean
  setIsFiltersCollapsed: (collapsed: boolean) => void
}

const FilterStateContext = createContext<FilterStateContextType | undefined>(undefined)

export function FilterStateProvider({ children }: { children: ReactNode }) {
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)

  return (
    <FilterStateContext.Provider value={{ isFiltersCollapsed, setIsFiltersCollapsed }}>
      {children}
    </FilterStateContext.Provider>
  )
}

export function useFilterState() {
  const context = useContext(FilterStateContext)
  if (context === undefined) {
    throw new Error('useFilterState must be used within a FilterStateProvider')
  }
  return context
}
