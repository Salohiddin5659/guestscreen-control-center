export interface DisplacementMapOptions {
  height: number;
  width: number;
  radius: number;
  depth: number;
  lightAngle?: number;
}

/**
 * Creating the displacement map that is used by feDisplacementMap filter.
 * Gradients take into account the radius and light angle of the element.
 */
export const getDisplacementMap = ({
  height,
  width,
  radius,
  depth,
  lightAngle = 0,
}: DisplacementMapOptions): string => {
  const rad = (lightAngle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);

  const safeHeight = Math.max(1, height);
  const safeWidth = Math.max(1, width);

  // Y gradient rotated by lightAngle
  const yPad = Math.ceil((radius / safeHeight) * 15);
  const yEnd = Math.floor(100 - (radius / safeHeight) * 15);
  const y1x1 = 50 - sinA * (50 - yPad);
  const y1y1 = yPad;
  const y1x2 = 50 + sinA * (50 - yPad);
  const y1y2 = yEnd;

  // X gradient rotated by lightAngle
  const xPad = Math.ceil((radius / safeWidth) * 15);
  const xEnd = Math.floor(100 - (radius / safeWidth) * 15);
  const x1x1 = xPad;
  const x1y1 = 50 + cosA * (50 - xPad);
  const x1x2 = xEnd;
  const x1y2 = 50 - cosA * (50 - xPad);

  const innerWidth = Math.max(0, width - 2 * depth);
  const innerHeight = Math.max(0, height - 2 * depth);

  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>
        .mix { mix-blend-mode: screen; }
    </style>
    <defs>
        <linearGradient
          id="Y"
          x1="${y1x1}%"
          x2="${y1x2}%"
          y1="${y1y1}%"
          y2="${y1y2}%">
            <stop offset="0%" stop-color="#0F0" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient
          id="X"
          x1="${x1x1}%"
          x2="${x1x2}%"
          y1="${x1y1}%"
          y2="${x1y2}%">
            <stop offset="0%" stop-color="#F00" />
            <stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>

    <rect x="0" y="0" height="${height}" width="${width}" fill="#808080" />
    <g filter="blur(2px)">
      <rect x="0" y="0" height="${height}" width="${width}" fill="#000080" />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#Y)"
          class="mix"
      />
      <rect
          x="0"
          y="0"
          height="${height}"
          width="${width}"
          fill="url(#X)"
          class="mix"
      />
      <rect
          x="${depth}"
          y="${depth}"
          height="${innerHeight}"
          width="${innerWidth}"
          fill="#808080"
          rx="${radius}"
          ry="${radius}"
          filter="blur(${Math.max(1, depth)}px)"
      />
    </g>
</svg>`)
  );
};
