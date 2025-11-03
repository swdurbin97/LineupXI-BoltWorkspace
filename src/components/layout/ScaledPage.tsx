import React from 'react';
import { useUniformScale } from '../../hooks/useUniformScale';

type Props = {
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
  children: React.ReactNode;
};

export default function ScaledPage({
  baseWidth = 1440,
  baseHeight = 900,
  className = '',
  children
}: Props) {
  const { containerRef, scale, outerSize } = useUniformScale({ baseWidth, baseHeight });

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <div
        className="mx-auto origin-top"
        style={{
          width: outerSize.width,
          height: outerSize.height,
          transform: `scale(${scale})`,
          transformOrigin: 'top center'
        }}
      >
        {children}
      </div>
    </div>
  );
}
