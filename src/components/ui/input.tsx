"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideProps } from "lucide-react";
import * as React from "react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

interface InputProps extends React.ComponentProps<"input"> {
  label?: string;
  labelDir?: "ltr" | "rtl";
  Icon?: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  shadow?: boolean;
  error?: string;
  errorPosition?: "left" | "right";
  shortcut?: string;
  sm?: boolean;
}


const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, labelDir, Icon, sm = true, shadow, shortcut, error, errorPosition, type, children, ...props }, ref) => {
      const [documentDir, setDocumentDir] = React.useState<"ltr" | "rtl">("ltr");

      React.useEffect(() => {
        const dir = (document?.documentElement?.dir || "ltr") as "ltr" | "rtl";
        setDocumentDir(dir === "rtl" ? "rtl" : "ltr");
      }, []);

      const fieldDir = labelDir ?? documentDir;
      const effectiveErrorPosition = errorPosition ?? (fieldDir === "rtl" ? "left" : "right");

      return (
        <div className={`relative flex flex-col gap-1 ${className}`}>
          {(label || error) && (
            <div dir={fieldDir} className="flex items-center justify-between gap-2">
              {label && (
                <label
                  htmlFor={props.id}
                  className={cn("text-gray-800 font-medium text-[14px]", {
                    "text-red-500": error,
                  })}
                >
                  {label}
                </label>
              )}

              {/* If a label is provided, show the error on the opposite side of the label */}
              {!!error && !!label && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "text-red-500 font-semibold",
                    sm ? "text-[11px]" : "text-[13px]",
                  )}
                >
                  {error}
                </motion.span>
              )}
            </div>
          )}
          <div className="flex items-center relative">
            {Icon && (
              <Icon
                strokeWidth={1.3}
                size={17}
                className="absolute ltr:left-3.5 rtl:right-3.5"
                color="#343434"
              />
            )}
            <input
              ref={ref}
              type={type}
              className={cn(
                "text-[15px] ltr:pl-11 rtl:pr-11 ltr:pr-4 rtl:pl-4 flex w-full rounded-lg border border-input focus-visible:border-transparent file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-[15px] placeholder:text-accent-gray/60 focus-visible:outline-none focus-visible:ring-[1.2px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                {
                  "ltr:pl-4 rtl:pr-4": !Icon,
                  "shadow-md": shadow,
                  "h-[43px]!": sm,
                  "border-red-500 ring-red-500 focus-visible:ring-1 focus-visible:ring-red-500": !!error,
                },
                className,
              )}
              {...props}
            />
            {
              shortcut && (
                <span className="select-none bg-[#fafafa] border border-accent-gray/50 rounded-[5px] py-0.5 px-1 absolute text-accent-gray/50 opacity-70 font-medium ltr:right-3 rtl:left-3 text-[12px]">
                  {shortcut}
                </span>
              )
            }
            {/* If there's no label, keep a floating error position */}
            {!!error && !label && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "absolute text-red-500 font-semibold -top-5",
                  effectiveErrorPosition === "left" ? "left-0 text-left" : "right-0 text-right",
                  sm ? "text-[11px]" : "text-[13px]",
                )}
              >
                {error}
              </motion.span>
            )}
            <div className="absolute ltr:right-3 rtl:left-3">
              {children}
            </div>
          </div>
        </div>
      );
    }
  )
)
Input.displayName = "Input"

export { Input };
export type { InputProps };

