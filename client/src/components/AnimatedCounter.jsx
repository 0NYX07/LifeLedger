import React, { useEffect, useState, useRef } from 'react';

/**
 * Accessible animated numeric counter that smoothly interpolates to target numbers
 * without causing screen reader flickering.
 */
export const AnimatedCounter = ({
  value = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1000
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startVal = prevValueRef.current || 0;
    const endVal = Number(value) || 0;
    prevValueRef.current = endVal;

    if (startVal === endVal) {
      setDisplayValue(endVal);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, duration]);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  }).format(displayValue);

  return (
    <span className="tabular-nums font-extrabold tracking-tight" aria-label={`${prefix}${value}${suffix}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
