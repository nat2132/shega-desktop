import * as React from "react";
import { cn } from "@renderer/utils/shadcn";

type TextVariant = 
  | "display" 
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "title" 
  | "body" | "body-sm"
  | "caption" 
  | "label";

type TextWeight = "normal" | "medium" | "semibold" | "bold";

interface AppTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  numberOfLines?: number;
  align?: "left" | "center" | "right";
}

const variantStyles: Record<TextVariant, string> = {
  display: "text-4xl font-black tracking-tight",
  h1: "text-3xl font-black tracking-tight",
  h2: "text-2xl font-bold tracking-tight",
  h3: "text-xl font-bold tracking-tight",
  h4: "text-lg font-bold tracking-tight",
  h5: "text-base font-bold tracking-tight",
  h6: "text-sm font-bold tracking-tight",
  title: "text-lg font-bold",
  body: "text-base",
  "body-sm": "text-sm",
  caption: "text-xs text-muted-foreground",
  label: "text-sm font-medium text-muted-foreground",
};

const weightStyles: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const alignStyles = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const AppText = React.forwardRef<HTMLSpanElement, AppTextProps>(
  ({ 
    variant = "body", 
    weight = "normal", 
    color, 
    numberOfLines, 
    align, 
    className, 
    style,
    children,
    ...props 
  }, ref) => {
    const lineClampStyle = numberOfLines 
      ? { 
          display: "-webkit-box", 
          WebkitLineClamp: numberOfLines, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden" 
        } 
      : {};

    return (
      <span
        ref={ref}
        className={cn(
          "inline-block",
          variantStyles[variant],
          weightStyles[weight],
          align && alignStyles[align],
          className
        )}
        style={{
          ...lineClampStyle,
          color,
          ...style,
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

AppText.displayName = "AppText";

export { AppText };