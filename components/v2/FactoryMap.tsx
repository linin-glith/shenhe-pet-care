'use client';

import Img from '@/components/v2/Img';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MAP_ADDRESS, MAP_LEVELS, MAP_PLACE, MAP_PLACE_EN } from '@/lib/factory-map';

/**
 * Factory location map.
 *
 * WHY IT IS A BAKEN IMAGE, NOT A LIVE TILE MAP
 * The site is a static export: a live map would need a JS SDK, an API key
 * and a network round trip for every visitor, and Chinese map tiles are not
 * reachable from most of the world. The tiles are fetched once at build time
 * by scripts/build_factory_map.py and shipped as images, so the map works
 * offline, loads fast and cannot break.
 *
 * THREE LEVELS
 *   z11  prefecture   z13  district   z15  campus
 * Each level is one image, so "zooming" swaps the image rather than
 * refetching tiles. The pin is drawn as SVG on top, so it stays crisp and
 * can animate.
 */

type Variant = 'interactive' | 'backdrop';

const VIEW_H = 400;

export default function FactoryMap({ variant = 'interactive' }: { variant?: Variant }) {
  const [level, setLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [box, setBox] = useState({ w: 640, h: VIEW_H });

  const cur = MAP_LEVELS[level];
  const imgW = 1280;
  const imgH = 768;

  const maxPan = {
    x: Math.max(0, imgW - box.w),
    y: Math.max(0, imgH - box.h),
  };

  // Centre the pin when the level changes or the panel resizes.
  const centrePin = useCallback(
    (lvl: number) => {
      const lv = MAP_LEVELS[lvl];
      setPan({
        x: Math.max(0, Math.min(lv.pinX - box.w / 2, Math.max(0, imgW - box.w))),
        y: Math.max(0, Math.min(lv.pinY - box.h / 2, Math.max(0, imgH - box.h))),
      });
    },
    [box.w, box.h],
  );

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.min(imgW, Math.round(r.width)), h: VIEW_H });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Centre the pin on first paint and whenever the level or the panel size
  // changes — otherwise the map opens on the top-left corner of the sheet,
  // which is the opposite of the point.
  useEffect(() => {
    centrePin(level);
  }, [level, centrePin]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (variant !== 'interactive') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({
      x: Math.max(0, Math.min(drag.current.ox + (drag.current.x - e.clientX), maxPan.x)),
      y: Math.max(0, Math.min(drag.current.oy + (drag.current.y - e.clientY), maxPan.y)),
    });
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };

  const step = (d: number) => {
    const next = Math.max(0, Math.min(MAP_LEVELS.length - 1, level + d));
    if (next === level) return;
    setLevel(next);
    centrePin(next);
  };

  if (variant === 'backdrop') {
    return (
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <Img
          src={MAP_LEVELS[1].src}
          alt=""
          className="h-full w-full scale-[1.35] object-cover blur-[14px] opacity-60"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-v2-ink-900/40 via-v2-ink-900/70 to-v2-ink-900" />
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative overflow-hidden rounded-v2-lg border border-white/12 bg-[#e9e6df] select-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ height: VIEW_H }}
      >
        <Img
          src={cur.src}
          alt={`Street map of ${MAP_PLACE_EN}`}
          className="pointer-events-none absolute left-0 top-0 max-w-none"
          style={{ width: imgW, height: imgH, transform: `translate(${-pan.x}px, ${-pan.y}px)` }}
          draggable={false}
          loading="eager"
          decoding="async"
        />

        {/* the pin, drawn on top so it stays crisp and can animate */}
        <span
          className="pointer-events-none absolute"
          style={{ left: cur.pinX - pan.x, top: cur.pinY - pan.y, transform: 'translate(-50%, -100%)' }}
        >
          <svg width="34" height="46" viewBox="0 0 34 46" aria-hidden>
            <ellipse cx="17" cy="43" rx="7" ry="2.6" fill="rgba(0,0,0,0.28)" />
            <path
              d="M17 0C9.3 0 3 6.2 3 13.8 3 23.6 17 43 17 43s14-19.4 14-29.2C31 6.2 24.7 0 17 0Z"
              fill="#d92626"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx="17" cy="13.8" r="5" fill="#fff" />
          </svg>
        </span>

        {/* zoom controls */}
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <MapBtn label="Zoom in" disabled={level === MAP_LEVELS.length - 1} onClick={() => step(1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </MapBtn>
          <MapBtn label="Zoom out" disabled={level === 0} onClick={() => step(-1)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </MapBtn>
          <MapBtn
            label="Reset view"
            onClick={() => {
              setLevel(1);
              centrePin(1);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4h-4" />
            </svg>
          </MapBtn>
        </div>

        {/* level readout - on a photograph, so the plate behind the text has
            to be dark enough for the text to reach the standard */}
        <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/85">
          {['Prefecture', 'District', 'Campus'][level]} · z{cur.z}
        </p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/55">
        {MAP_ADDRESS}
        <br />
        <span className="text-white/50">{MAP_PLACE} · Map data © Amap (高德地图)</span>
      </p>
    </div>
  );
}

function MapBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/20 bg-black/55 text-white/85 transition-colors hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-v2-accent-500"
    >
      {children}
    </button>
  );
}
