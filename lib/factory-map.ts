/**
 * Factory location map — baked street map.
 *
 * WHY IT IS BAKED
 * The site is a static export, so a live tile map would need a JS SDK, an API
 * key and a network round trip for every visitor — and Chinese map tiles are
 * unreachable from most of the world. The tiles are fetched once at build
 * time by scripts/build_factory_map.py and shipped as images, so the map
 * works offline, loads fast and never breaks.
 *
 * SOURCE: Amap (高德地图) appmaptile, lang=en. Amap draws in GCJ-02, so the
 * pin is converted from WGS84 before it is placed — see the build script.
 *
 * Regenerate with:  python scripts/build_factory_map.py
 *
 * The pin sits on 高埔岗, 源城区, 河源市 — the address printed on the
 * company's own laboratory reports.
 */

export type MapLevel = {
  z: number;
  src: string;
  /** Pin position inside the image, in CSS pixels. */
  pinX: number;
  pinY: number;
};

export const MAP_LEVELS: MapLevel[] = [
  { z: 11, src: '/assets/img/map/heyuan-z11.webp', pinX: 541.6, pinY: 423.1 },
  { z: 13, src: '/assets/img/map/heyuan-z13.webp', pinX: 630.2, pinY: 412.5 },
  { z: 15, src: '/assets/img/map/heyuan-z15.webp', pinX: 729.0, pinY: 370.0 }
];

/** The plant's place label, shown under the map. */
export const MAP_PLACE = '高埔岗, 源城区, 河源市, 广东省';

/**
 * The same place, in the language the site speaks.
 *
 * The map itself carries the Chinese place names, so the Chinese label
 * belongs under it. The image alt does not: an alt is read by a search
 * engine and by a screen reader, and the buyer reading it is looking for
 * "Heyuan" — the pinyin, the way the address is written on the reports.
 */
export const MAP_PLACE_EN = 'Gaopugang, Yuancheng District, Heyuan, Guangdong';

/** The plant's address, verbatim from the laboratory reports. */
export const MAP_ADDRESS = 'No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China';
