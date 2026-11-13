/**
 * Pet Art — original vector artwork for the catalogue.
 *
 * WHY THIS EXISTS AT ALL
 * The site had a typography system and an icon set, but no drawn language. It
 * read as a typeset document with product photography dropped into it — which
 * is exactly how a buyer describes "it looks like an HTML page". Drawings give
 * the page a voice: a paw field behind a heading says "pet" in a way no
 * headline can, and a litter-box diagram says more than a sentence about
 * ammonia removal.
 *
 * ALL PATHS ARE ORIGINAL
 * Drawn here from primitives, not traced from stock art or lifted from an icon
 * set. That keeps the licence clean for a commercial site and means the shapes
 * can be tuned to this catalogue rather than fought with.
 *
 * The rule these follow: every drawing must label something. PawField orients
 * the eye, LitterBoxDiagram explains a mechanism, PetPair identifies the
 * audience. Decoration that does none of those is omitted.
 */

export type PetMarkProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/* ------------------------------------------------------------------ */
/* Paw — the core motif, drawn once and reused at every scale           */
/* ------------------------------------------------------------------ */

export function PawMark({ size = 64, className = '', strokeWidth = 1.6 }: PetMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        <ellipse cx="32" cy="42.5" rx="13.5" ry="10.5" />
        <ellipse cx="19.5" cy="28.5" rx="6" ry="7.5" transform="rotate(-16 19.5 28.5)" />
        <ellipse cx="29" cy="22" rx="5.8" ry="7.8" />
        <ellipse cx="39.5" cy="22.8" rx="5.8" ry="7.6" transform="rotate(12 39.5 22.8)" />
        <ellipse cx="48" cy="31" rx="5.8" ry="7.2" transform="rotate(22 48 31)" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Paw field — a walking trail, used as a low-contrast section backdrop */
/* ------------------------------------------------------------------ */

const TRAIL: { x: number; y: number; r: number; o: number }[] = [
  { x: 6, y: 58, r: -14, o: 1 },
  { x: 22, y: 44, r: 10, o: 0.85 },
  { x: 13, y: 28, r: -22, o: 0.7 },
  { x: 30, y: 18, r: 6, o: 0.9 },
  { x: 47, y: 24, r: -10, o: 0.75 },
  { x: 56, y: 40, r: 16, o: 0.85 },
  { x: 44, y: 54, r: -6, o: 1 },
  { x: 62, y: 12, r: 20, o: 0.6 },
  { x: 74, y: 62, r: -18, o: 0.7 },
  { x: 86, y: 36, r: 8, o: 0.8 },
  { x: 94, y: 8, r: -12, o: 0.55 },
];

export function PawField({
  width = 960,
  height = 120,
  opacity = 0.06,
  className = '',
}: {
  width?: number;
  height?: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ width, height, opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="currentColor">
        {TRAIL.map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${0.42 * (p.o + 0.4)})`}>
            <ellipse cx="0" cy="14" rx="13.5" ry="10.5" />
            <ellipse cx="-12.5" cy="0" rx="6" ry="7.5" />
            <ellipse cx="-3" cy="-6.5" rx="5.8" ry="7.8" />
            <ellipse cx="7.5" cy="-5.7" rx="5.8" ry="7.6" />
            <ellipse cx="16" cy="2.5" rx="5.8" ry="7.2" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Cat — sitting, three-quarter. Recognisable at 40px and at 400px.      */
/* ------------------------------------------------------------------ */

export function CatFigure({ size = 120, className = '' }: PetMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* ears + head */}
        <path d="M36 44 30 22c-.5-2 1.8-3.4 3.4-2.1L48 30" />
        <path d="M84 44 90 22c.5-2-1.8-3.4-3.4-2.1L72 30" />
        <path d="M60 28c17 0 29 11 29 26 0 13-11 22-29 22s-29-9-29-22c0-15 12-26 29-26Z" />
        {/* eyes, nose, mouth */}
        <path d="M47 54c1.8-2.4 5-2.4 6.8 0" />
        <path d="M66.2 54c1.8-2.4 5-2.4 6.8 0" />
        <path d="m60 66-4.4 3.6h8.8L60 66Z" />
        <path d="M60 69.6c-1.4 3.4-4.6 4.6-7.4 3.4M60 69.6c1.4 3.4 4.6 4.6 7.4 3.4" />
        {/* whiskers */}
        <path d="M28 58h11M28 66h11M31 74l9-2M92 58H81M92 66h-11M89 74l-9-2" />
        {/* body + front legs */}
        <path d="M60 76v28M40 84c0 12 4 20 10 24M80 84c0 12-4 20-10 24" />
        {/* curled tail */}
        <path d="M84 106c14 0 20-8 20-17 0-7-5-12-11-12-5 0-9 4-9 9" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Dog — standing, friendly. Squarer head, drop ears, plumed tail.      */
/* ------------------------------------------------------------------ */

export function DogFigure({ size = 120, className = '' }: PetMarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        {/* drop ears behind the head */}
        <path d="M36 42c-7 3-10 12-8 22 1.6 8 6 12 11 12" />
        <path d="M84 42c7 3 10 12 8 22-1.6 8-6 12-11 12" />
        {/* head */}
        <path d="M60 26c16 0 27 10 27 23 0 12-11 20-27 20s-27-8-27-20c0-13 11-23 27-23Z" />
        {/* muzzle + nose */}
        <path d="M60 50c7 0 11 4 11 8s-4 7-11 7-11-3-11-7 4-8 11-8Z" />
        <path d="M55.5 58h9M60 58v4" />
        <path d="M60 62c-1.4 3.6-5 4.8-8 3.4M60 62c1.4 3.6 5 4.8 8 3.4" />
        {/* eyes */}
        <path d="M47 44c1.6-2.2 4.6-2.2 6.2 0M66.8 44c1.6-2.2 4.6-2.2 6.2 0" />
        {/* body */}
        <path d="M60 69c10 0 17 7 17 16v14H43V85c0-9 7-16 17-16Z" />
        {/* legs */}
        <path d="M52 99v9M68 99v9" />
        {/* tail */}
        <path d="M77 78c10-2 14-9 12-16" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Mechanism diagram — the one drawing that carries a technical claim  */
/* ------------------------------------------------------------------ */

/**
 * Litter-box diagram for the odour line.
 *
 * This exists because ">94.2% ammonia removal" is a number the buyer cannot
 * picture. The drawing shows where the odour comes from and where the
 * product goes, which is the whole argument in one image.
 */
export function LitterBoxDiagram({ size = 200, className = '' }: PetMarkProps) {
  return (
    <svg width={size} height={size * 0.72} viewBox="0 0 200 144" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        {/* box */}
        <path d="M28 78h144v46a4 4 0 0 1-4 4H32a4 4 0 0 1-4-4V78Z" />
        <path d="M24 66h152v12H24z" />
        {/* litter fill */}
        <path d="M34 92c22-6 42 4 66-2s44 4 66-2v22H34V92Z" strokeDasharray="4 5" opacity="0.65" />
        {/* odour rising — the problem */}
        <g opacity="0.9">
          <path d="M62 60c-6-6 6-11 0-17M78 58c-6-6 6-11 0-17M94 60c-6-6 6-11 0-17" />
        </g>
        {/* application — the fix */}
        <g opacity="0.95">
          <path d="M148 34v18M142 46l6 6 6-6" />
          <path d="M136 58h24l-4 8h-16l-4-8Z" />
        </g>
        {/* target callout */}
        <circle cx="70" cy="104" r="13" strokeDasharray="3 4" opacity="0.8" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Audience pair — the quickest possible "is this for my animal" cue    */
/* ------------------------------------------------------------------ */

export function PetPair({ size = 72, className = '' }: PetMarkProps) {
  return (
    <span className={`inline-flex items-end gap-1 ${className}`}>
      <CatFigure size={size * 0.92} className="opacity-90" />
      <DogFigure size={size * 0.92} className="opacity-90" />
    </span>
  );
}
