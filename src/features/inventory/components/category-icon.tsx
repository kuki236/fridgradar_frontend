import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/features/inventory/lib/category-icons";

type Size = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, { box: string; icon: string }> = {
  xs: { box: "size-6",  icon: "size-3" },
  sm: { box: "size-8",  icon: "size-4" },
  md: { box: "size-10", icon: "size-4.5" },
  lg: { box: "size-14", icon: "size-6" },
};

interface CategoryIconProps {
  category: string | null | undefined;
  size?: Size;
  className?: string;
}

/**
 * Renders a category-based icon. The backend doesn't store product images
 * anymore (Open Food Facts was removed); this is the only visual cue for the
 * product in the inventory list, fridge view, detail page and add dialog.
 */
export function CategoryIcon({ category, size = "md", className }: CategoryIconProps) {
  const style = getCategoryStyle(category);
  const sizes = SIZE_CLASSES[size];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        "rounded-lg flex items-center justify-center shrink-0",
        style.bg,
        sizes.box,
        className,
      )}
    >
      <Icon className={cn(sizes.icon, style.fg)} aria-hidden />
    </div>
  );
}
