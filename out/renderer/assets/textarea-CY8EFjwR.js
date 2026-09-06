import { r as reactExports, j as jsxRuntimeExports, ak as cn } from "./index-C0Jx5v6F.js";
const Textarea = reactExports.forwardRef(({ className, ...props }, ref) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "textarea",
    {
      "data-slot": "textarea",
      ref,
      className: cn(
        "flex min-h-[60px] w-full rounded-xl border border-border/70 bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 outline-none placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      ),
      ...props
    }
  );
});
Textarea.displayName = "Textarea";
export {
  Textarea as T
};
