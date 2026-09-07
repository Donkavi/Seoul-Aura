"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Tailwind only ships the clamp utilities it finds as literal strings in the
 * source, so the supported line counts are spelled out rather than built from
 * the prop.
 */
const CLAMP: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

interface ExpandableTextProps {
  text: string;
  /** Lines shown before the text is cut off. */
  lines?: number;
  className?: string;
  buttonClassName?: string;
  /** Lets a parent react to the toggle — the review carousel pauses autoplay on it. */
  onExpandedChange?: (expanded: boolean) => void;
}

/**
 * Text that clamps to `lines` with a Read more / Show less toggle.
 *
 * The toggle only appears when the text is genuinely cut off — a two-line
 * comment with a "Read more" under it that reveals nothing is worse than no
 * toggle at all. That can only be known by measuring, since where the clamp
 * falls depends on the width it is rendered at, so the overflow is re-checked
 * whenever the element resizes.
 */
export default function ExpandableText({
  text,
  lines = 4,
  className,
  buttonClassName,
  onExpandedChange,
}: ExpandableTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Only measurable while the clamp is applied: once expanded the element is
    // its full height, so the last known answer is kept and "Show less" stays.
    const measure = () => {
      if (!expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, expanded]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <>
      <p ref={ref} className={cn(className, !expanded && (CLAMP[lines] ?? CLAMP[4]))}>
        {text}
      </p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          className={cn(
            "mt-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline underline-offset-2",
            buttonClassName
          )}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </>
  );
}
