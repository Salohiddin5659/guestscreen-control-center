import React from 'react';

export interface LiquidCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3 | 4;
  interactive?: boolean;
  chromatic?: boolean;
  children: React.ReactNode;
}

export const LiquidCard: React.FC<LiquidCardProps> = ({
  level = 2,
  interactive = false,
  chromatic = false,
  children,
  className = '',
  ...props
}) => {
  const getLevelClass = () => {
    switch (level) {
      case 1:
        return 'glass-surface-l1';
      case 2:
        return 'glass-surface-l2';
      case 3:
        return 'glass-surface-l3';
      case 4:
        return 'glass-surface-l4';
      default:
        return 'glass-surface-l2';
    }
  };

  return (
    <div
      {...props}
      className={`
        relative rounded-xl transition-all duration-200 overflow-hidden
        ${getLevelClass()}
        ${interactive ? 'hover:-translate-y-1 hover:shadow-2xl hover:border-white/25 cursor-pointer' : ''}
        ${chromatic ? 'liquid-chromatic-edge' : ''}
        ${className}
      `}
    >
      {/* Specular Rim / Optical Edge Reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />
      {children}
    </div>
  );
};

export default LiquidCard;
