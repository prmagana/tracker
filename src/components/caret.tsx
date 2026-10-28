import { ChevronDown } from "lucide-react";

// Dropdown caret for the nav buttons and the sort menu. Flips while its menu is open.
export function Caret({ open }: { open: boolean }) {
  return (
    <ChevronDown
      aria-hidden
      size={16}
      strokeWidth={2.25}
      className={`ml-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    />
  );
}
