'use client';

import { useEffect, useRef } from 'react';
import VanillaTilt from 'vanilla-tilt';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const TiltCard = ({ children, className, style }: TiltCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    VanillaTilt.init(el, {
      max: 12,
      speed: 600,
      scale: 1.04,
      perspective: 900,
      glare: true,
      'max-glare': 0.15,
      easing: 'cubic-bezier(.03,.98,.52,.99)',
    });

    return () => {
      (el as HTMLDivElement & { vanillaTilt?: { destroy: () => void } }).vanillaTilt?.destroy();
    };
  }, []);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default TiltCard;
