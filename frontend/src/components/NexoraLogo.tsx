interface NexoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export default function NexoraLogo({
  size = 'md',
  showWordmark = true,
  className = '',
}: NexoraLogoProps) {
  const iconSizes = {
    sm: { w: 26, h: 26 },
    md: { w: 34, h: 34 },
    lg: { w: 44, h: 44 },
    xl: { w: 58, h: 58 },
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const { w, h } = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* 
        Crisp, unmistakable Geometric 'N' Logo Mark:
        High-definition sharp geometric lines forming a distinct, elegant 3D 'N'
      */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Main Gradient */}
          <linearGradient id="nexoraNPrimary" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Accent Fold Gradient */}
          <linearGradient id="nexoraNAccent" x1="100" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>

        {/* Left vertical stem of N */}
        <rect
          x="12"
          y="14"
          width="20"
          height="72"
          rx="10"
          fill="url(#nexoraNPrimary)"
        />

        {/* Right vertical stem of N */}
        <rect
          x="68"
          y="14"
          width="20"
          height="72"
          rx="10"
          fill="url(#nexoraNPrimary)"
        />

        {/* Sharp diagonal bridge joining left-top to right-bottom forming a bold, clear 'N' */}
        <path
          d="M 18 14 C 18 14 30 14 34 18 L 82 82 C 86 86 68 86 68 86 L 18 14 Z"
          fill="url(#nexoraNAccent)"
        />

        {/* Subtle glass reflection stroke */}
        <path
          d="M 16 20 L 76 80"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span className={`font-black tracking-tight text-[var(--text-main)] ${textSizes[size]}`} style={{ fontFamily: "'Inter', sans-serif" }}>
          Nexora
        </span>
      )}
    </div>
  );
}
