interface CategoryIconProps {
  categoryId: string;
  size?: number;
  className?: string;
}

// SVG inner paths per category — rendered inside a single <svg> wrapper
const svgPaths: Record<string, React.ReactNode> = {
  zirconia: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="3" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="21" />
      <line x1="3" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
    </>
  ),
  'glass-ceramic': (
    <>
      <polygon points="12,2 19,8 19,16 12,22 5,16 5,8" />
      <polyline points="5,8 12,14 19,8" />
      <line x1="12" y1="14" x2="12" y2="22" />
    </>
  ),
  'milling-machines': (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  'scanners-printers': (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="2 2" />
      <line x1="7" y1="8" x2="7" y2="10" />
      <line x1="12" y1="8" x2="12" y2="10" />
      <line x1="17" y1="8" x2="17" y2="10" />
    </>
  ),
  'peek-pmma-wax': (
    <>
      <ellipse cx="12" cy="17" rx="8" ry="3" />
      <rect x="4" y="10" width="16" height="7" />
      <ellipse cx="12" cy="10" rx="8" ry="3" />
    </>
  ),
  'composite-materials': (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <circle cx="5" cy="8" r="1.8" />
      <circle cx="19" cy="8" r="1.8" />
      <circle cx="5" cy="16" r="1.8" />
      <circle cx="19" cy="16" r="1.8" />
      <line x1="7" y1="9" x2="10" y2="11" />
      <line x1="17" y1="9" x2="14" y2="11" />
      <line x1="7" y1="15" x2="10" y2="13" />
      <line x1="17" y1="15" x2="14" y2="13" />
    </>
  ),
  _fallback: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

export default function CategoryIcon({ categoryId, size = 20, className = '' }: CategoryIconProps) {
  const paths = svgPaths[categoryId] ?? svgPaths['_fallback'];
  return (
    <span
      className={`cat-svg-icon ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        width={size}
        height={size}
        style={{ display: 'block' }}
      >
        {paths}
      </svg>
    </span>
  );
}
