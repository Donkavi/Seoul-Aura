"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className,
}: Props) {
  const [hover, setHover] = useState(0);

  const display = hover || value;

  return (
    <div className={cn("flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={cn(
            "transition-transform",
            !readOnly && "cursor-pointer hover:scale-110",
            readOnly && "cursor-default"
          )}
          aria-label={`${star} stars`}
        >
          <Star
            size={size}
            className={cn(
              "transition-colors",
              star <= display
                ? "fill-gold-400 text-gold-400"
                : "fill-ink-100 text-ink-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}
