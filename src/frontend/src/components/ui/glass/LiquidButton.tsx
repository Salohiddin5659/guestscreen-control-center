import React, { useState } from 'react';

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  glow?: boolean;
  children: React.ReactNode;
}

export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  glow = true,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const [pressed, setPressed] = useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold border-blue-400 shadow-[0_4px_16px_rgba(37,99,235,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]';
      case 'secondary':
        return 'bg-white/[0.08] hover:bg-white/[0.14] text-white font-semibold border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)]';
      case 'danger':
        return 'bg-[#FF5B5B]/15 hover:bg-[#FF5B5B]/25 text-[#FF7070] font-semibold border-[#FF5B5B]/30 shadow-[0_4px_16px_rgba(255,91,91,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)]';
      case 'ghost':
        return 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white border-transparent';
      default:
        return '';
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onMouseDown={(e) => {
        setPressed(true);
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setPressed(false);
        props.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        setPressed(false);
        props.onMouseLeave?.(e);
      }}
      className={`
        relative overflow-hidden inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border
        backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${pressed ? 'scale-[0.97] brightness-95' : 'hover:-translate-y-0.5'}
        ${getVariantStyles()}
        ${className}
      `}
    >
      {/* Specular Edge Reflection */}
      <span className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
      {children}
    </button>
  );
};

export default LiquidButton;
