"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  duration?: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function formatNumber(value: number, decimals: number): string {
  return value.toLocaleString("en-LK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function CountUp({
  to,
  duration = 1400,
  from = 0,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: Props) {
  const [value, setValue] = useState(from);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const fromRef = useRef(from);

  useEffect(() => {
    fromRef.current = value;
    startTimeRef.current = null;

    const tick = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = fromRef.current + (to - fromRef.current) * eased;
      setValue(current);

      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  return (
    <span className={className}>
      {prefix}
      {formatNumber(decimals === 0 ? Math.round(value) : value, decimals)}
      {suffix}
    </span>
  );
}
