"use client"

import { Coins } from "lucide-react"
import { cn } from "@/lib/utils"

interface RemiseBalanceProps {
  balance: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

export function RemiseBalance({ 
  balance, 
  size = "md", 
  showLabel = true,
  className 
}: RemiseBalanceProps) {
  const sizeClasses = {
    sm: {
      container: "gap-1.5",
      icon: "w-4 h-4",
      iconBg: "w-6 h-6",
      amount: "text-sm",
      label: "text-xs"
    },
    md: {
      container: "gap-2",
      icon: "w-4 h-4",
      iconBg: "w-8 h-8",
      amount: "text-base",
      label: "text-sm"
    },
    lg: {
      container: "gap-3",
      icon: "w-5 h-5",
      iconBg: "w-10 h-10",
      amount: "text-lg",
      label: "text-base"
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={cn("inline-flex items-center", classes.container, className)}>
      <div className={cn(
        "rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0",
        classes.iconBg
      )}>
        <Coins className={cn("text-amber-600 dark:text-amber-500", classes.icon)} />
      </div>
      <div className="flex flex-col">
        <span className={cn("font-bold text-amber-600 dark:text-amber-500", classes.amount)}>
          {balance.toFixed(2)} DH
        </span>
        {showLabel && (
          <span className={cn("text-muted-foreground", classes.label)}>
            Solde remise
          </span>
        )}
      </div>
    </div>
  )
}
