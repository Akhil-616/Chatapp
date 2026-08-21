import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "pixel";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

    const variantStyles = {
      default:
        "bg-white text-black hover:bg-zinc-200 shadow-sm active:scale-[0.98]",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      outline:
        "border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800 hover:border-zinc-500",
      secondary:
        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60",
      ghost:
        "text-zinc-300 hover:bg-zinc-800 hover:text-white",
      link:
        "text-zinc-300 underline-offset-4 hover:underline",
      pixel:
        "border-2 border-white bg-black text-white hover:bg-white hover:text-black font-mono uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-md px-8 text-base font-semibold",
      icon: "h-10 w-10",
    };

    return (
      <button
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
