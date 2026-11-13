/**
 * PackageMock — a designed packaging render for SKUs without verified photography.
 *
 * WHY THIS AND NOT A GENERATED PHOTO
 * The factory is unreachable for photography, and an AI-generated photorealistic
 * bottle would be a lie a procurement lead can disprove the moment the goods
 * arrive. So this draws a PACKAGE DESIGN instead: flat vector, real label
 * architecture, honest at a glance.
 *
 * WHAT MAKES IT WORTH RENDERING
 * The label is populated from the real product record — line name, English
 * product name, specification, minimum order. So the mock is not decoration
 * filling a hole; it is a second read of the same data, in the shape the buyer
 * will actually receive. If the copy on the carton is wrong, it is wrong here
 * too, and someone will catch it.
 *
 * THE HONESTY MARK IS NOT OPTIONAL
 * Every mock carries a "PACKAGE MOCKUP — NOT A PHOTOGRAPH" strip. Removing it
 * would convert this component into a deception tool, which is the one thing
 * this file exists to avoid.
 */

type Kind = 'atomiser' | 'trigger' | 'sachet' | 'tub' | 'jug' | 'bottle';

const LINE = {
  disinfection_odor_control: {
    name: 'DEODORIZING',
    band: '#0f766e',
    soft: '#d7f0ec',
    deep: '#134e4a',
    ink: '#0b0f12',
  },
  cleansing_grooming: {
    name: 'CLEANSING',
    band: '#2f6690',
    soft: '#dbe9f3',
    deep: '#1d4258',
    ink: '#0b0f12',
  },
  outdoor_protection: {
    name: 'OUTDOOR',
    band: '#8a5a2b',
    soft: '#f3e6d5',
    deep: '#5c3a1a',
    ink: '#0b0f12',
  },
} as const;

type Palette = (typeof LINE)[keyof typeof LINE];

function profile(spec: string, name: string) {
  const s = `${spec} ${name}`.toLowerCase();

  if (s.includes('sachet')) return { kind: 'sachet' as Kind, h: 250, w: 176 };
  if (s.includes('gun') || s.includes('kit')) return { kind: 'trigger' as Kind, h: 268, w: 150 };
  if (/kg/i.test(spec)) return { kind: 'jug' as Kind, h: 300, w: 210 };

  const g = /^([\d.]+)\s*g\b/i.exec(spec);
  if (g) return { kind: 'tub' as Kind, h: Math.min(320, 200 + parseFloat(g[1]) * 0.5), w: 210 };

  const ml = /([\d.]+)\s*ml/i.exec(spec);
  const n = ml ? parseFloat(ml[1]) : 350;
  if (n <= 100) return { kind: 'atomiser' as Kind, h: 196, w: 116 };
  return {
    kind: 'bottle' as Kind,
    h: Math.max(196, Math.min(330, 190 + n * 0.2)),
    w: Math.max(120, Math.min(210, 124 + n * 0.12)),
  };
}

/** Greedy wrap so long product names stay inside the label. */
function wrap(text: string, max: number): string[] {
  const words = text.replace(/\s*\(\s*Extra Strength\s*\)/i, '').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function PackageMock({
  name,
  spec,
  category,
  moq,
  className = '',
  compact = false,
}: {
  name: string;
  spec: string;
  category: string;
  moq: number;
  className?: string;
  /**
   * Compact drops the full-width honesty strip and crops the canvas to the
   * vessel. At catalogue-card size that strip ate ~40% of the height and left
   * a thumbnail-sized bottle. Honesty is preserved instead by the card's own
   * "MOCK" badge, which is legible at that scale — a 12px illegible strip is
   * not an honesty measure, it is just a bug.
   */
  compact?: boolean;
}) {
  const c: Palette = LINE[category as keyof typeof LINE] ?? LINE.disinfection_odor_control;
  const { kind, h, w } = profile(spec, name);

  const W = 420;
  const H = compact ? 470 : 540;
  const cx = W / 2;
  const baseY = H - (compact ? 26 : 58);
  const topY = baseY - h;

  // Long product names used to collide with the size line, and long spec
  // strings overflowed the label plate entirely. Both are now bounded: the
  // label grows to fit the wrapped name, and the size line is capped.
  const rawSize = spec.split('/')[0].trim();
  const sizeText = rawSize.length <= 12 ? rawSize : rawSize.slice(0, 11) + '…';
  const nameLines = wrap(name, 20);
  const labelH = Math.min(h * 0.56, 92 + nameLines.length * 19);
  const labelTop = Math.max(topY + 28, topY + h * 0.18);

  /**
   * COMPACT = the card size, and the size the label has to survive.
   *
   * A card is 160 pixels tall. A 420-unit-wide viewBox rendered into 110
   * pixels turns 14-unit type into 3.7 pixels — noise, not information. The
   * old compact render put the product name, the brand line, the wrapped name
   * AND the MOQ on the label, so at card size it read as a smudge next to
   * nineteen real photographs, and the card's own "mock" badge had to carry
   * the honesty on its own.
   *
   * So compact shows ONE thing at a size that survives: the vessel, the
   * brand band, and the size in type large enough to read. The product name
   * and the minimum order are already on the card, directly underneath the
   * image, and repeating them on a 4-pixel label is decoration, not
   * information.
   */
  if (compact) {
    /*
     * The vessel is drawn LARGER than the full-size version, on purpose.
     * A photograph fills the plate; a small drawing in a big empty field reads
     * as "the picture failed to load" even when it is perfectly legible. So
     * the compact render has its own canvas and its own scale, and the bottle
     * occupies the same share of the plate that the real photographs do.
     */
    const CH = 410;
    const cw = Math.round(w * 1.26);
    const ch = Math.round(h * 1.26);
    const cBaseY = CH - 34;
    const cTopY = cBaseY - ch;
    const cW = 420;
    const cCx = cW / 2;

    return (
      <svg
        viewBox={`0 0 ${cW} ${CH}`}
        className={className}
        role="img"
        aria-label={`Packaging design for ${name}, ${spec} — a drawn package, not a photograph`}
      >
        <defs>
          <linearGradient id={`compact-sheen-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="34%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx={cCx} cy={cBaseY + 14} rx={cw * 0.72} ry={15} fill="#0b0f12" opacity="0.1" />

        {/* ---------------- vessel ---------------- */}
        {kind === 'sachet' && (
          <>
            <path
              d={`M${cCx - cw / 2} ${cTopY + 22} l18 -22 H${cCx + cw / 2 - 18} l18 22 V${cBaseY} a12 12 0 0 1 -12 12 H${cCx - cw / 2 + 12} a12 12 0 0 1 -12 -12 Z`}
              fill={c.soft}
              stroke={c.band}
              strokeWidth="5"
            />
            <path d={`M${cCx - cw / 2 + 10} ${cTopY + 58} h${cw - 20}`} stroke={c.band} strokeWidth="4" opacity="0.4" />
          </>
        )}

        {kind === 'tub' && (
          <>
            <path
              d={`M${cCx - cw / 2} ${cTopY + 18} h${cw} v${ch - 18} a12 12 0 0 1 -12 12 H${cCx - cw / 2 + 12} a12 12 0 0 1 -12 -12 Z`}
              fill={c.soft}
              stroke={c.band}
              strokeWidth="5"
            />
            <rect x={cCx - cw / 2 - 12} y={cTopY} width={cw + 24} height={38} rx="9" fill={c.deep} />
          </>
        )}

        {kind === 'jug' && (
          <>
            <path
              d={`M${cCx - cw / 2 + 22} ${cTopY + 30} h${cw - 44} v${ch - 30} a14 14 0 0 1 -14 14 H${cCx - cw / 2 + 22} a14 14 0 0 1 -14 -14 Z`}
              fill={c.soft}
              stroke={c.band}
              strokeWidth="5"
            />
            <path
              d={`M${cCx + cw / 2 - 10} ${cTopY + 70} q34 20 34 62`}
              fill="none"
              stroke={c.band}
              strokeWidth="12"
              strokeLinecap="round"
            />
            <rect x={cCx - 60} y={cTopY} width={120} height={42} rx="9" fill={c.deep} />
          </>
        )}

        {(kind === 'bottle' || kind === 'atomiser' || kind === 'trigger') && (
          <>
            <path
              d={`M${cCx - cw / 2} ${cTopY + 34} h${cw} v${ch - 34} a18 18 0 0 1 -18 18 H${cCx - cw / 2 + 18} a18 18 0 0 1 -18 -18 Z`}
              fill={c.soft}
              stroke={c.band}
              strokeWidth="5"
            />
            {kind === 'trigger' ? (
              <>
                <rect x={cCx - 28} y={cTopY - 18} width={56} height={58} rx="8" fill={c.deep} />
                <path
                  d={`M${cCx + 28} ${cTopY - 4} h86 v30 h-44 l-24 36`}
                  fill="none"
                  stroke={c.deep}
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : kind === 'atomiser' ? (
              <>
                <rect x={cCx - 13} y={cTopY - 14} width={26} height={58} rx="6" fill={c.deep} />
                <circle cx={cCx} cy={cTopY - 22} r={13} fill={c.band} />
              </>
            ) : (
              <>
                <rect x={cCx - 42} y={cTopY} width={84} height={46} rx="8" fill={c.deep} />
                <rect x={cCx - 13} y={cTopY - 30} width={26} height={34} rx="5" fill={c.band} />
              </>
            )}
          </>
        )}

        {/* sheen */}
        <rect
          x={cCx - cw / 2}
          y={cTopY + 34}
          width={cw}
          height={ch - 34}
          rx="14"
          fill={`url(#compact-sheen-${kind})`}
        />

        {/* ---------------- label: the size, big enough to read ---------------- */}
        <g>
          <rect
            x={cCx - cw / 2 + 14}
            y={cTopY + ch * 0.3}
            width={cw - 28}
            height={ch * 0.42}
            rx="10"
            fill="#ffffff"
            stroke={c.band}
            strokeWidth="2.5"
          />
          <rect
            x={cCx - cw / 2 + 14}
            y={cTopY + ch * 0.3}
            width={cw - 28}
            height={30}
            rx="10"
            fill={c.band}
          />
          <rect x={cCx - cw / 2 + 14} y={cTopY + ch * 0.3 + 20} width={cw - 28} height="10" fill={c.band} />
          <text
            x={cCx}
            y={cTopY + ch * 0.3 + 30 + ch * 0.24}
            textAnchor="middle"
            fontFamily="Helvetica,Arial,sans-serif"
            fontSize={Math.round((cw - 44) / (sizeText.length * 0.62))}
            fontWeight="700"
            fill={c.deep}
          >
            {sizeText}
          </text>
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Package mockup for ${name}, ${spec}`}
    >
      <defs>
        <linearGradient id={`sheen-${kind}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="28%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="72%" stopColor="#000000" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx={cx} cy={baseY + 16} rx={w * 0.72} ry={16} fill="#0b0f12" opacity="0.1" />

      {/* ---------------- vessel ---------------- */}
      {kind === 'sachet' && (
        <>
          <path
            d={`M${cx - w / 2} ${topY + 22} l18 -22 H${cx + w / 2 - 18} l18 22 V${baseY} a12 12 0 0 1 -12 12 H${cx - w / 2 + 12} a12 12 0 0 1 -12 -12 Z`}
            fill={c.soft}
            stroke={c.band}
            strokeWidth="3"
          />
          <path d={`M${cx - w / 2} ${topY + 54} h${w}`} stroke={c.band} strokeWidth="2" opacity="0.45" />
          <path d={`M${cx - w / 2} ${baseY - 62} h${w}`} stroke={c.band} strokeWidth="2" opacity="0.3" />
        </>
      )}

      {kind === 'tub' && (
        <>
          <path
            d={`M${cx - w / 2} ${topY + 18} h${w} v${h - 18} a12 12 0 0 1 -12 12 H${cx - w / 2 + 12} a12 12 0 0 1 -12 -12 Z`}
            fill={c.soft}
            stroke={c.band}
            strokeWidth="3"
          />
          <rect x={cx - w / 2 - 10} y={topY} width={w + 20} height={30} rx={7} fill={c.deep} />
        </>
      )}

      {kind === 'jug' && (
        <>
          <path
            d={`M${cx - w / 2 + 22} ${topY + 30} h${w - 44} v${h - 30} a14 14 0 0 1 -14 14 H${cx - w / 2 + 22} a14 14 0 0 1 -14 -14 Z`}
            fill={c.soft}
            stroke={c.band}
            strokeWidth="3"
          />
          <path
            d={`M${cx + w / 2 - 10} ${topY + 70} q34 20 34 62`}
            fill="none"
            stroke={c.band}
            strokeWidth="8"
            strokeLinecap="round"
          />
          <rect x={cx - 54} y={topY} width={108} height={36} rx={7} fill={c.deep} />
        </>
      )}

      {(kind === 'bottle' || kind === 'atomiser' || kind === 'trigger') && (
        <>
          <path
            d={`M${cx - w / 2} ${topY + 34} h${w} v${h - 34} a18 18 0 0 1 -18 18 H${cx - w / 2 + 18} a18 18 0 0 1 -18 -18 Z`}
            fill={c.soft}
            stroke={c.band}
            strokeWidth="3"
          />
          {kind === 'trigger' ? (
            <>
              <rect x={cx - 24} y={topY - 14} width={48} height={50} rx={6} fill={c.deep} />
              <path
                d={`M${cx + 24} ${topY - 4} h72 v26 h-38 l-20 30`}
                fill="none"
                stroke={c.deep}
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : kind === 'atomiser' ? (
            <>
              <rect x={cx - 11} y={topY - 10} width={22} height={50} rx={4} fill={c.deep} />
              <circle cx={cx} cy={topY - 18} r={11} fill={c.band} />
            </>
          ) : (
            <>
              <rect x={cx - 34} y={topY} width={68} height={38} rx={6} fill={c.deep} />
              <rect x={cx - 11} y={topY - 26} width={22} height={30} rx={4} fill={c.band} />
            </>
          )}
        </>
      )}

      {/* specular sheen across the body */}
      <rect
        x={cx - w / 2}
        y={topY + 34}
        width={w}
        height={h - 34}
        rx="14"
        fill={`url(#sheen-${kind})`}
      />

      {/* ---------------- label ---------------- */}
      <g>
        <rect
          x={cx - w / 2 + 10}
          y={labelTop}
          width={w - 20}
          height={labelH}
          rx="8"
          fill="#ffffff"
          stroke={c.band}
          strokeWidth="1.5"
        />
        {/* line band across the top of the label */}
        <rect x={cx - w / 2 + 10} y={labelTop} width={w - 20} height={22} rx="8" fill={c.band} />
        <rect x={cx - w / 2 + 10} y={labelTop + 14} width={w - 20} height={8} fill={c.band} />

        <text
          x={cx}
          y={labelTop + 16}
          textAnchor="middle"
          fontFamily="Helvetica,Arial,sans-serif"
          fontSize="11"
          fontWeight="700"
          letterSpacing="2.4"
          fill="#ffffff"
        >
          {c.name}
        </text>

        <text
          x={cx}
          y={labelTop + 52}
          textAnchor="middle"
          fontFamily="Helvetica,Arial,sans-serif"
          fontSize="12"
          fontWeight="700"
          letterSpacing="1.6"
          fill={c.deep}
        >
          SHENHE ZHONGKE
        </text>

        {nameLines.map((ln, i) => (
          <text
            key={i}
            x={cx}
            y={labelTop + 78 + i * 17}
            textAnchor="middle"
            fontFamily="Helvetica,Arial,sans-serif"
            fontSize="14"
            fontWeight="600"
            fill={c.ink}
          >
            {ln}
          </text>
        ))}

        <text
          x={cx}
          y={labelTop + labelH - 34}
          textAnchor="middle"
          fontFamily="Helvetica,Arial,sans-serif"
          fontSize="26"
          fontWeight="700"
          fill={c.band}
        >
          {sizeText}
        </text>

        <text
          x={cx}
          y={labelTop + labelH - 14}
          textAnchor="middle"
          fontFamily="Helvetica,Arial,sans-serif"
          fontSize="11"
          fontWeight="600"
          fill={c.deep}
        >
          MOQ {moq.toLocaleString()}
        </text>
      </g>

      {/* ---------------- honesty strip ---------------- */}
      {!compact && (
        <>
          <rect x="0" y={H - 40} width={W} height="40" fill={c.deep} opacity="0.94" />
          <text
            x={cx}
            y={H - 15}
            textAnchor="middle"
            fontFamily="Helvetica,Arial,sans-serif"
            fontSize="12"
            fontWeight="700"
            letterSpacing="2.6"
            fill="#ffffff"
          >
            PACKAGE MOCKUP — NOT A PHOTOGRAPH
          </text>
        </>
      )}
    </svg>
  );
}
