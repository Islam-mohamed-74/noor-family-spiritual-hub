// ---------------------------------------------------------------------------
// HijriDate — Task 22: Hijri Calendar display
// Shows the current Hijri (Islamic) date in Arabic script.
// ---------------------------------------------------------------------------

import { getHijriDateAr } from "@/lib/hijri";

interface HijriDateProps {
  className?: string;
}

export default function HijriDate({ className }: HijriDateProps) {
  const hijriStr = getHijriDateAr();
  if (!hijriStr) return null;
  return (
    <span className={className} title="التاريخ الهجري">
      {hijriStr} هـ
    </span>
  );
}
