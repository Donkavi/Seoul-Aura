"use client";

import { useCallback, useRef, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX = 5;
/** Reviews are stored with min: 1, so interactive selection never goes below it. */
const MIN_INPUT = 1;
const STEP = 0.1;

/** Keeps values like 4.7 clean — plain arithmetic would give 4.700000000000001. */
const round1 = (n: number) => Math.round(n * 10) / 10;
const clampInput = (n: number) => Math.min(MAX, Math.max(MIN_INPUT, round1(n)));

/** Trims a trailing ".0" so whole ratings read as "4", decimals as "4.7". */
export function formatRating(value: number): string {
  return round1(value).toFixed(1).replace(/\.0$/, "");
}

/** Snaps an arbitrary number into a valid 1–5 rating with one decimal. */
export const clampRating = clampInput;

export const RATING_STEP = STEP;

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
  /** Show the numeric value (e.g. "4.7") beside the stars. */
  showValue?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className,
  showValue = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const interactive = !readOnly && !!onChange;
  const display = interactive && hover !== null ? hover : value;

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return value;
      const { left, width } = el.getBoundingClientRect();
      return clampInput(((clientX - left) / width) * MAX);
    },
    [value]
  );

  const commit = (next: number) => {
    setHover(next);
    onChange?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    const nudge = (delta: number) => {
      e.preventDefault();
      commit(clampInput((hover ?? value ?? MIN_INPUT) + delta));
    };
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        return nudge(STEP);
      case "ArrowLeft":
      case "ArrowDown":
        return nudge(-STEP);
      case "PageUp":
        return nudge(0.5);
      case "PageDown":
        return nudge(-0.5);
      case "Home":
        e.preventDefault();
        return commit(MIN_INPUT);
      case "End":
        e.preventDefault();
        return commit(MAX);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        ref={trackRef}
        role={interactive ? "slider" : "img"}
        aria-label={interactive ? "Rating" : `Rated ${formatRating(value)} out of ${MAX}`}
        aria-valuenow={interactive ? round1(display) : undefined}
        aria-valuemin={interactive ? MIN_INPUT : undefined}
        aria-valuemax={interactive ? MAX : undefined}
        aria-valuetext={interactive ? `${formatRating(display)} of ${MAX} stars` : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={
          interactive
            ? (e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                setDragging(true);
                commit(valueFromClientX(e.clientX));
              }
            : undefined
        }
        onPointerMove={
          interactive
            ? (e) => {
                const next = valueFromClientX(e.clientX);
                if (dragging) commit(next);
                else setHover(next);
              }
            : undefined
        }
        onPointerUp={interactive ? () => setDragging(false) : undefined}
        onPointerCancel={interactive ? () => setDragging(false) : undefined}
        onPointerLeave={
          interactive
            ? () => {
                if (!dragging) setHover(null);
              }
            : undefined
        }
        className={cn(
          "flex gap-0.5 rounded-sm",
          interactive &&
            "cursor-pointer touch-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
        )}
      >
        {Array.from({ length: MAX }, (_, i) => {
          const fill = Math.min(1, Math.max(0, display - i));
          return (
            <span
              key={i}
              className={cn(
                "relative block flex-shrink-0 transition-transform duration-200",
                interactive && hover !== null && hover > i && "scale-110"
              )}
              style={{ width: size, height: size }}
            >
              <Star size={size} className="absolute inset-0 fill-ink-100 text-ink-200" />
              {fill > 0 && (
                /* Clipping the gold star to a % width is what renders partial fills (e.g. 4.7). */
                <span
                  className="absolute inset-y-0 left-0 block overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <span className="block" style={{ width: size, height: size }}>
                    <Star size={size} className="fill-gold-400 text-gold-400" />
                  </span>
                </span>
              )}
            </span>
          );
        })}
      </div>

      {showValue && (
        <span
          className={cn(
            "font-display leading-none tabular-nums text-ink-900",
            size >= 24 ? "text-lg" : "text-sm"
          )}
        >
          {formatRating(display)}
          <span className="text-ink-400 font-body text-xs">/{MAX}</span>
        </span>
      )}
    </div>
  );
}
