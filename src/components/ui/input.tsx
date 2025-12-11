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
    ({ className, label, labelDir, Icon, sm = true, shadow, shortcut, error, errorPosition = "right", type, children, ...props }, ref) => {
      return (
        <div className={`relative flex flex-col gap-1 ${className}`}>
          {label && (
            <label
              htmlFor={props.id}
              dir={labelDir}
              className={cn("text-gray-800 font-medium text-[14px]", {
                "text-red-500": error,
              })}
            >
              {label}
            </label>
          )}
          <div className="flex items-center relative">
            {Icon && (
              <Icon
                strokeWidth={1.3}
                size={17}
                className="absolute left-[14px]"
                color="#343434"
              />
            )}
            <input
              ref={ref}
              type={type}
              className={cn(
                "text-[15px] pl-11 pr-4 flex w-full rounded-lg border border-input focus-visible:border-transparent file:border-0 file:bg-transparent file:text-sm file:font-semibold placeholder:text-[15px] placeholder:text-accent-gray/60 focus-visible:outline-none focus-visible:ring-[1.2px] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className, {
                'pl-4': !Icon,
                "shadow-md": shadow,
                '!h-[43px]': sm
              },
                className, {
                'border-red-500 ring-red-500 focus-visible:ring-1 focus-visible:ring-red-500': error,
              },
              )}
              {...props}
            />
            {
              shortcut && (
                <span className="select-none bg-[#fafafa] border border-accent-gray/50 rounded-[5px] py-[2px] px-1 absolute text-accent-gray/50 opacity-70 font-medium right-3 text-[12px]">
                  {shortcut}
                </span>
              )
            }
            {error && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute text-red-500 font-semibold ${errorPosition === "left" ? "left-0" : "right-0"} -top-5 ${sm ? "text-[11px]" : "text-[13px]"}`}
              >
                {error}
              </motion.span>
            )}
            <div className="absolute right-3">
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

