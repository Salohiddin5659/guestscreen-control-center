import React, { useState } from "react";
import { getDisplacementFilter } from "./getDisplacementFilter";
import { getDisplacementMap } from "./getDisplacementMap";
// @ts-ignore
import styles from "./GlassElement.module.css";

export interface GlassElementProps {
  height?: number;
  width?: number;
  depth?: number;
  radius?: number;
  children?: React.ReactNode;
  strength?: number;
  chromaticAberration?: number;
  blur?: number;
  brightness?: number;
  saturation?: number;
  lightAngle?: number;
  lightIntensity?: number;
  debug?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
}

export const GlassElement: React.FC<GlassElementProps> = ({
  height,
  width,
  depth: baseDepth = 30,
  radius = 16,
  children,
  strength = 60,
  chromaticAberration = 4,
  blur = 8,
  brightness = 5,
  saturation = 20,
  lightAngle = 135,
  lightIntensity = 65,
  debug = false,
  className = "",
  onClick,
  style: propStyle,
}) => {
  const [clicked, setClicked] = useState(false);
  const depth = baseDepth / (clicked ? 0.7 : 1);

  const hasFixedSize = height != null && width != null && height > 0 && width > 0;

  // brightness/saturation: 0 = no change (1.0), positive = boost
  const brightnessVal = 1 + brightness / 100;
  const saturateVal = 1 + saturation / 100;
  // lightIntensity controls box-shadow opacity (0-100 → 0-1)
  const shadowOpacity = Math.min(lightIntensity / 100, 1);

  const computedStyle: React.CSSProperties = {
    borderRadius: `${radius}px`,
    ...propStyle,
  };

  if (lightIntensity > 0) {
    const existingShadow = propStyle?.boxShadow ? `${propStyle.boxShadow}, ` : "";
    computedStyle.boxShadow = `${existingShadow}inset 0px 0px 4px 0px rgba(255,255,255,${shadowOpacity})`;
  }

  if (hasFixedSize) {
    computedStyle.height = `${height}px`;
    computedStyle.width = `${width}px`;
    try {
      const filterUri = getDisplacementFilter({
        height,
        width,
        radius,
        depth,
        strength,
        chromaticAberration,
        lightAngle,
      });
      const filterValue = `blur(${Math.max(1, blur / 2)}px) url('${filterUri}') blur(${blur}px) brightness(${brightnessVal}) saturate(${saturateVal})`;
      computedStyle.backdropFilter = filterValue;
      (computedStyle as any).WebkitBackdropFilter = filterValue;
    } catch {
      const fallbackValue = `blur(${blur}px) brightness(${brightnessVal}) saturate(${saturateVal})`;
      computedStyle.backdropFilter = fallbackValue;
      (computedStyle as any).WebkitBackdropFilter = fallbackValue;
    }
  } else {
    const filterValue = `blur(${blur}px) brightness(${brightnessVal}) saturate(${saturateVal})`;
    computedStyle.backdropFilter = filterValue;
    (computedStyle as any).WebkitBackdropFilter = filterValue;
  }

  if (debug && hasFixedSize) {
    computedStyle.background = `url("${getDisplacementMap({
      height,
      width,
      radius,
      depth,
      lightAngle,
    })}")`;
    computedStyle.boxShadow = "none";
  }

  return (
    <div
      className={`${styles.box} ${className}`}
      style={computedStyle}
      onClick={onClick}
      onMouseDown={() => setClicked(true)}
      onMouseUp={() => setClicked(false)}
      onMouseLeave={() => setClicked(false)}
    >
      {children}
    </div>
  );
};

export default GlassElement;
