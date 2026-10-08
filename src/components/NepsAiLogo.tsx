import React from 'react';

interface NepsAiIconProps {
  size?: number | string;
  className?: string;
  showGlow?: boolean;
}

/**
 * NepsAi Master 3D Optical Glass Vector Icon Mark
 * Represents:
 * - Volumetric 3D Glass Candlestick Architecture
 * - Prismatic "N" Optical Slicing Monogram
 * - Refractive Cyan/Teal to Emerald/Blue 3D Glass Columns
 * - Apex Quantum AI 4-Point Diamond Flare (✦) with Anamorphic Streak
 * - Pure Futuristic Fintech & TradingView Terminal Aesthetic
 * - Designed & Built by @raazkhnl
 */
export const NepsAiIcon: React.FC<NepsAiIconProps> = ({
  size = 32,
  className = '',
  showGlow = true,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 group ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      title="NepsAi · NEPSE AI Analytics Platform @raazkhnl"
    >
      {/* Volumetric Ambient Background Glow */}
      {showGlow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/25 via-emerald-500/20 to-blue-500/15 blur-sm group-hover:blur-md transition-all duration-300 opacity-80 group-hover:opacity-100" />
      )}

      <svg
        viewBox="0 0 512 512"
        className="w-full h-full relative z-10 drop-shadow-sm select-none transition-transform duration-300 group-hover:scale-[1.03]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Base Plate Radial Gradient */}
          <radialGradient id="cmp-plate-bg" cx="40%" cy="30%" r="85%">
            <stop offset="0%" stopColor="#0E1424" />
            <stop offset="45%" stopColor="#090D17" />
            <stop offset="100%" stopColor="#04060A" />
          </radialGradient>

          {/* Chamfered Outer Border */}
          <linearGradient id="cmp-plate-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#1E293B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0F172A" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#334155" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.85" />
          </linearGradient>

          {/* Ambient Lighting Gradients */}
          <radialGradient id="cmp-ambient-cyan" cx="30%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="cmp-ambient-emerald" cx="70%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
            <stop offset="45%" stopColor="#059669" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* 3D Glass Pillar Gradients */}
          <linearGradient id="cmp-pillar-left-front" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#0284C7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="cmp-pillar-left-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="cmp-pillar-right-front" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.95" />
            <stop offset="25%" stopColor="#10B981" stopOpacity="0.88" />
            <stop offset="65%" stopColor="#06B6D4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="cmp-pillar-right-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#D1FAE5" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          {/* 3D Diagonal Facets */}
          <linearGradient id="cmp-diag-top-facet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#7DD3FC" />
            <stop offset="60%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>

          <linearGradient id="cmp-diag-main-facet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#0891B2" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#059669" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="cmp-diag-bottom-facet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#03456D" />
            <stop offset="50%" stopColor="#083344" />
            <stop offset="100%" stopColor="#022C22" />
          </linearGradient>

          <linearGradient id="cmp-specular-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#E0F2FE" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#A7F3D0" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="cmp-laser-beam" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
            <stop offset="30%" stopColor="#00F2FE" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#10B981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          <radialGradient id="cmp-star-bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#A5F3FC" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.4" />
            <stop offset="80%" stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="cmp-streak-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00F2FE" stopOpacity="0" />
            <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="75%" stopColor="#34D399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Base Obsidian Housing */}
        <rect x="22" y="22" width="468" height="468" rx="112" fill="url(#cmp-plate-bg)" />
        <rect x="22" y="22" width="468" height="468" rx="112" fill="url(#cmp-ambient-cyan)" />
        <rect x="22" y="22" width="468" height="468" rx="112" fill="url(#cmp-ambient-emerald)" />

        {/* Precision Coordinate Grids */}
        <g opacity="0.12" stroke="#38BDF8" strokeWidth="1">
          <circle cx="256" cy="256" r="190" fill="none" strokeDasharray="4 8" />
          <circle cx="256" cy="256" r="130" fill="none" strokeDasharray="2 6" />
          <line x1="256" y1="46" x2="256" y2="466" strokeDasharray="3 7" />
          <line x1="46" y1="256" x2="466" y2="256" strokeDasharray="3 7" />
        </g>

        {/* Corner Reticles */}
        <g stroke="#22D3EE" strokeWidth="1.5" opacity="0.5">
          <path d="M 54 74 L 54 54 L 74 54" />
          <path d="M 438 54 L 458 54 L 458 74" />
          <path d="M 54 438 L 54 458 L 74 458" />
          <path d="M 438 458 L 458 458 L 458 438" />
        </g>

        {/* Contact Shadow Under Monogram */}
        <g opacity="0.45">
          <rect x="130" y="200" width="56" height="195" rx="14" fill="#000000" />
          <rect x="326" y="150" width="56" height="235" rx="14" fill="#000000" />
          <polygon points="186,225 326,355 326,380 186,250" fill="#000000" />
        </g>

        {/* Laser Neural Trajectory Curve */}
        <path
          d="M 78 412 C 145 412, 195 355, 248 308 C 295 266, 332 170, 354 72"
          fill="none"
          stroke="url(#cmp-laser-beam)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M 78 412 C 145 412, 195 355, 248 308 C 295 266, 332 170, 354 72"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* === 1. LEFT CANDLESTICK COLUMN === */}
        <g>
          {/* Wick */}
          <line x1="158" y1="112" x2="158" y2="402" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="158" y1="112" x2="158" y2="402" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Glass Body */}
          <rect x="130" y="162" width="56" height="198" rx="14" fill="url(#cmp-pillar-left-front)" />

          {/* Top Bevel */}
          <path
            d="M 130 176 C 130 168, 136 162, 144 162 L 172 162 C 180 162, 186 168, 186 176 L 186 180 C 186 172, 180 166, 172 166 L 144 166 C 136 166, 130 172, 130 180 Z"
            fill="url(#cmp-pillar-left-top)"
          />

          {/* Specular Rim */}
          <path d="M 133 182 L 133 346" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M 137 178 L 137 350" stroke="#BAE6FD" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <ellipse cx="158" cy="260" rx="14" ry="40" fill="#00F2FE" opacity="0.4" />
        </g>

        {/* === 2. RIGHT CANDLESTICK COLUMN === */}
        <g>
          {/* Wick */}
          <line x1="354" y1="72" x2="354" y2="422" stroke="#34D399" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="354" y1="72" x2="354" y2="422" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Glass Body */}
          <rect x="326" y="120" width="56" height="238" rx="14" fill="url(#cmp-pillar-right-front)" />

          {/* Top Bevel */}
          <path
            d="M 326 134 C 326 126, 332 120, 340 120 L 368 120 C 376 120, 382 126, 382 134 L 382 138 C 382 130, 376 124, 368 124 L 340 124 C 332 124, 326 130, 326 138 Z"
            fill="url(#cmp-pillar-right-top)"
          />

          {/* Specular Rim */}
          <path d="M 329 140 L 329 344" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          <path d="M 333 136 L 333 348" stroke="#D1FAE5" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
          <ellipse cx="354" cy="220" rx="15" ry="50" fill="#34D399" opacity="0.45" />
        </g>

        {/* === 3. 3D CONNECTING DIAGONAL PRISM === */}
        <polygon points="186,186 326,326 326,358 186,218" fill="url(#cmp-diag-bottom-facet)" />
        <polygon points="186,162 326,302 326,334 186,194" fill="url(#cmp-diag-main-facet)" />
        <polygon points="186,162 326,302 326,314 186,174" fill="url(#cmp-diag-top-facet)" />
        <line
          x1="186"
          y1="162"
          x2="326"
          y2="302"
          stroke="url(#cmp-specular-edge)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Quantum Pivot Nodes */}
        <g transform="translate(158, 360)">
          <circle r="5" fill="#38BDF8" />
          <circle r="2" fill="#FFFFFF" />
        </g>
        <g transform="translate(256, 298)">
          <circle r="5.5" fill="#34D399" />
          <circle r="2.2" fill="#FFFFFF" />
        </g>
        <g transform="translate(354, 122)">
          <circle r="5" fill="#67E8F9" />
          <circle r="2" fill="#FFFFFF" />
        </g>

        {/* === THE APEX AI QUANTUM BEACON (REALISTIC FLARE) === */}
        <g transform="translate(354, 72)">
          {/* Anamorphic Streak */}
          <rect x="-85" y="-1.5" width="170" height="3" rx="1.5" fill="url(#cmp-streak-grad)" />

          {/* Atmospheric Bloom */}
          <circle r="40" fill="url(#cmp-star-bloom)" />

          {/* Primary 4-Point Diamond Rays */}
          <path d="M 0 -34 Q 0 0, -5.5 0 Q 0 0, 0 34 Q 0 0, 5.5 0 Q 0 0, 0 -34 Z" fill="#FFFFFF" />
          <path d="M -34 0 Q 0 0, 0 -5.5 Q 0 0, 34 0 Q 0 0, 0 5.5 Q 0 0, -34 0 Z" fill="#FFFFFF" />

          {/* Secondary 45-degree sparkles */}
          <line x1="-12" y1="-12" x2="12" y2="12" stroke="#67E8F9" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="12" y1="-12" x2="-12" y2="12" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round" />

          {/* Core Specular Point */}
          <circle r="4" fill="#FFFFFF" />
        </g>

        {/* Outer Titanium Housing Border */}
        <rect
          x="22"
          y="22"
          width="468"
          height="468"
          rx="112"
          fill="none"
          stroke="url(#cmp-plate-border)"
          strokeWidth="3"
          opacity="0.9"
        />
      </svg>
    </div>
  );
};

interface NepsAiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Full NepsAI Brand Lockup Component
 * Includes 3D Optical Icon Mark, Wordmark, and Terminal Badges
 */
export const NepsAiLogo: React.FC<NepsAiLogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 28,
    md: 34,
    lg: 44,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NepsAiIcon size={iconSizes[size]} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif] ${textSizes[size]}`}>Neps<span className="text-cyan-400">AI</span></span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold tracking-wider">
            NEPSE
          </span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wider">
            AI 2.0
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[11px] text-neutral-400 font-medium tracking-tight mt-0.5">
            Quantitative NEPSE Analytics &amp; TradingView Platform
          </span>
        )}
      </div>
    </div>
  );
};
