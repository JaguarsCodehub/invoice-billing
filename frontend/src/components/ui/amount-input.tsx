import * as React from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export type AmountInputProps = React.ComponentProps<typeof Input>

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, onFocus, ...props }, ref) => {
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select()
      if (onFocus) {
        onFocus(e)
      }
    }

    return (
      <Input
        type="number"
        className={cn(
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          className
        )}
        onFocus={handleFocus}
        ref={ref}
        {...props}
      />
    )
  }
)
AmountInput.displayName = "AmountInput"

export { AmountInput }
