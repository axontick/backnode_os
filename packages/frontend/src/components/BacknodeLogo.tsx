import React from 'react';

interface BacknodeLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showVersion?: boolean;
  className?: string;
}

export const BacknodeLogo: React.FC<BacknodeLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showVersion = false,
  className = '',
}) => {
  const iconDimensions = {
    xs: { px: 20, text: 'text-xs', markGap: 'gap-1.5' },
    sm: { px: 26, text: 'text-sm', markGap: 'gap-2' },
    md: { px: 32, text: 'text-base', markGap: 'gap-2.5' },
    lg: { px: 40, text: 'text-lg', markGap: 'gap-3' },
  }[size];

  const dim = iconDimensions.px;

  return (
    <div className={`flex items-center ${iconDimensions.markGap} select-none ${className}`}>
      {/* Precision Geometric Hex Shield + Lightning Bolt SVG */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        <defs>
          <linearGradient id="backnodeHexGrad" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <filter id="backnodeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#ea580c" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Dark Accent Frame */}
        <path
          d="M16 1.5L29 8.2V23.8L16 30.5L3 23.8V8.2L16 1.5Z"
          fill="#121214"
          stroke="#27272a"
          strokeWidth="1"
        />

        {/* Inner Electric Hexagon with Gradient & Shadow */}
        <path
          d="M16 3.5L27 9.5V22.5L16 28.5L5 22.5V9.5L16 3.5Z"
          fill="url(#backnodeHexGrad)"
          stroke="#fb923c"
          strokeWidth="0.75"
          filter="url(#backnodeGlow)"
        />

        {/* Kinetic Lightning Bolt / Nexus Core Symbol */}
        <path
          d="M17.5 7.5L9.5 17H15.5L14 24.5L22.5 15H16.5L17.5 7.5Z"
          fill="#ffffff"
          stroke="#09090b"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />

        {/* Micro Circuit Accents */}
        <circle cx="16" cy="3.5" r="1" fill="#fed7aa" />
        <circle cx="27" cy="9.5" r="1" fill="#fed7aa" />
        <circle cx="27" cy="22.5" r="1" fill="#fed7aa" />
        <circle cx="16" cy="28.5" r="1" fill="#fed7aa" />
        <circle cx="5" cy="22.5" r="1" fill="#fed7aa" />
        <circle cx="5" cy="9.5" r="1" fill="#fed7aa" />
      </svg>

      {/* Typography Lockup */}
      {showWordmark && (
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-bold tracking-tight text-zinc-100 font-headline ${iconDimensions.text}`}>
            Backnode
          </span>
          <span className={`font-bold font-mono text-orange-500 tracking-wider ${iconDimensions.text}`}>
            OS
          </span>

          {showVersion && (
            <span className="ml-1 font-mono text-[10px] font-semibold text-zinc-400 bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded-[6px]">
              v1.0.0
            </span>
          )}
        </div>
      )}
    </div>
  );
};
