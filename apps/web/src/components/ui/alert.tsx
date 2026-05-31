import * as React from "react";
import { cn } from "../../lib/utils.js";

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive",
      className,
    )}
    {...props}
  />
));
Alert.displayName = "Alert";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("m-0", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";
