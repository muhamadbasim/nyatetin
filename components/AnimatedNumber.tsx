import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  prefix = '', 
  suffix = '',
  className = '',
  duration = 800
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const difference = endValue - startValue;
    
    if (difference === 0) return;

    const framesPerSecond = 60;
    const totalFrames = (duration / 1000) * framesPerSecond;
    const increment = difference / totalFrames;

    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      setDisplayValue((prev) => {
        const newValue = startValue + (increment * frame);
        if ((difference > 0 && newValue >= endValue) || (difference < 0 && newValue <= endValue)) {
          clearInterval(counter);
          return endValue;
        }
        return newValue;
      });
      if (frame >= totalFrames) {
        clearInterval(counter);
        setDisplayValue(endValue);
      }
    }, 1000 / framesPerSecond);

    previousValue.current = value;

    return () => {
      clearInterval(counter);
    };
  }, [value, duration]);

  const formattedValue = displayValue.toLocaleString('id-ID', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  });

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
};

export default AnimatedNumber;
