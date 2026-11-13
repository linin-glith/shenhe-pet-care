"""Bake the factory location map into static images.

WHY BAKED, NOT EMBEDDED
The site is a static export, so a live tile map would need a JS SDK, an API
key and a network round trip per visitor — and Chinese map tiles are not
reachable from most of the world. Instead the tiles are fetched ONCE at build
time, stitched and shipped as images. The result works offline, loads fast,
and looks exactly like a real map.

TILE SOURCE
Amap (高德地图) `appmaptile`, `lang=en` for English place names — the same
map a Chinese exporter's buyer would recognise, in the language the rest of
the site is written in.

COORDINATE WARNING — read this before moving the pin
Amap tiles are drawn in GCJ-02 ("Mars coordinates"), which in China is
offset from WGS84 by 300–600 m. The pin is therefore converted from WGS84
to GCJ-02 before it is placed. If you ever swap in a WGS84 tile source
(OpenStreetMap), DROP the conversion — otherwise the pin lands in the wrong
street.

OUTPUT
  public/assets/img/map/heyuan-z11.webp   prefecture
  public/assets/img/map/heyuan-z13.webp   district
  public/assets/img/map/heyuan-z15.webp   campus
  lib/factory-map.ts                      image paths + pin position

Run:  python scripts/build_factory_map.py
"""

import math, os, sys, time, urllib.request
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_IMG = os.path.join(ROOT, "public", "assets", "img", "map")
OUT_TS = os.path.join(ROOT, "lib", "factory-map.ts")

# --- the plant -------------------------------------------------------------
# 高埔岗, 源城区, 河源市, 广东省 — geocoded from the address printed on the
# company's own laboratory reports ("广东省河源市源城区高埔岗龙腾路141号-1").
# WGS84. Change this ONE pair to move the pin.
PLANT_WGS84 = (23.6199122, 114.6296739)
PLANT_LABEL = "高埔岗, 源城区, 河源市, 广东省"

UA = "shenhe-site-build/1.0 (contact: sales@shenhezhongke.com)"
# Amap serves 256 px tiles for the English layer; only the Chinese layer has
# a 512 px variant. A 256 px tile is one zoom level's worth of map at 1:1,
# which is what every web map ships, so the bake is NOT downscaled.
TILE_PX = 256
TILE_GRID = (5, 3)     # tiles across / down per baked image
VIEW = (TILE_GRID[0] * TILE_PX, TILE_GRID[1] * TILE_PX)
ZOOMS = [11, 13, 15]

# --- WGS84 -> GCJ-02 -------------------------------------------------------

def _out_of_china(lat, lng):
    return not (72.004 <= lng <= 137.8347 and 0.8293 <= lat <= 55.8271)


def _tf(lat, lng):
    a, ee = 6378245.0, 0.00669342162296594323
    dlat = _transform_lat(lng - 105.0, lat - 35.0)
    dlng = _transform_lng(lng - 105.0, lat - 35.0)
    rad = lat / 180.0 * math.pi
    magic = math.sin(rad)
    magic = 1 - ee * magic * magic
    sqrt_magic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrt_magic) * math.pi)
    dlng = (dlng * 180.0) / (a / sqrt_magic * math.cos(rad) * math.pi)
    return dlat, dlng


def _transform_lat(x, y):
    r = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * math.sqrt(abs(x))
    r += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    r += (20.0 * math.sin(y * math.pi) + 40.0 * math.sin(y / 3.0 * math.pi)) * 2.0 / 3.0
    r += (160.0 * math.sin(y / 12.0 * math.pi) + 320.0 * math.sin(y * math.pi / 30.0)) * 2.0 / 3.0
    return r


def _transform_lng(x, y):
    r = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * math.sqrt(abs(x))
    r += (20.0 * math.sin(6.0 * x * math.pi) + 20.0 * math.sin(2.0 * x * math.pi)) * 2.0 / 3.0
    r += (20.0 * math.sin(x * math.pi) + 40.0 * math.sin(x / 3.0 * math.pi)) * 2.0 / 3.0
    r += (150.0 * math.sin(x / 12.0 * math.pi) + 300.0 * math.sin(x / 30.0 * math.pi)) * 2.0 / 3.0
    return r


def wgs84_to_gcj02(lat, lng):
    if _out_of_china(lat, lng):
        return lat, lng
    dlat, dlng = _tf(lat, lng)
    rad = lat / 180.0 * math.pi
    magic = math.sin(rad)
    magic = 1 - 0.00669342162296594323 * magic * magic
    sqrt_magic = math.sqrt(magic)
    dlat = (dlat * 180.0) / ((6335552.717000426 / (magic * sqrt_magic)) * math.pi)
    dlng = (dlng * 180.0) / ((6378245.0 / sqrt_magic) * math.cos(rad) * math.pi)
    return lat + dlat, lng + dlng


# --- slippy-map tile maths -------------------------------------------------

def tile_fraction(lat, lng, z):
    n = 2 ** z
    fx = (lng + 180.0) / 360.0 * n
    lat_r = math.radians(lat)
    fy = (1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n
    return fx, fy


def fetch_tile(x, y, z, host):
    url = (f"https://{host}/appmaptile?lang=en&size=1&scale=1&style=8"
           f"&x={x}&y={y}&z={z}")
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": UA,
                "Referer": "https://www.amap.com/",
            })
            with urllib.request.urlopen(req, timeout=30) as r:
                return Image.open(__import__("io").BytesIO(r.read())).convert("RGB")
        except Exception as e:
            if attempt == 2:
                raise RuntimeError(f"tile {z}/{x}/{y} failed: {e}")
            time.sleep(1.2 * (attempt + 1))


def bake(z, host):
    gx, gy = wgs84_to_gcj02(*PLANT_WGS84)
    fx, fy = tile_fraction(gx, gy, z)
    cx, cy = int(math.floor(fx)), int(math.floor(fy))
    tw, th = TILE_GRID
    x0, y0 = cx - tw // 2, cy - th // 2

    sheet = Image.new("RGB", (tw * TILE_PX, th * TILE_PX))
    for i in range(tw):
        for j in range(th):
            t = fetch_tile(x0 + i, y0 + j, z, host)
            sheet.paste(t, (i * TILE_PX, j * TILE_PX))

    # pin position inside the stitched sheet
    pin_x = (fx - x0) * TILE_PX
    pin_y = (fy - y0) * TILE_PX

    W, H = VIEW
    os.makedirs(OUT_IMG, exist_ok=True)
    path = os.path.join(OUT_IMG, f"heyuan-z{z}.webp")
    sheet.save(path, "WEBP", quality=84, method=6)
    print(f"  z={z}: {sheet.size[0]}x{sheet.size[1]}  pin at "
          f"({pin_x:.1f}, {pin_y:.1f}) px  {os.path.getsize(path)//1024} KB")
    return {"z": z, "file": f"/assets/img/map/heyuan-z{z}.webp",
            "pinX": round(pin_x, 1), "pinY": round(pin_y, 1)}


def main():
    host = sys.argv[1] if len(sys.argv) > 1 else "webrd01.is.autonavi.com"
    print(f"plant (WGS84) {PLANT_WGS84}  ->  GCJ-02 {wgs84_to_gcj02(*PLANT_WGS84)}")
    levels = [bake(z, host) for z in ZOOMS]

    body = ",\n".join(
        f"  {{ z: {l['z']}, src: '{l['file']}', pinX: {l['pinX']}, pinY: {l['pinY']} }}"
        for l in levels
    )
    ts = f"""/**
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

export type MapLevel = {{
  z: number;
  src: string;
  /** Pin position inside the image, in CSS pixels. */
  pinX: number;
  pinY: number;
}};

export const MAP_LEVELS: MapLevel[] = [
{body}
];

/** The plant's place label, shown under the map. */
export const MAP_PLACE = '{PLANT_LABEL}';

/** The plant's address, verbatim from the laboratory reports. */
export const MAP_ADDRESS = 'No.141-1 Longteng Road, Gaopugang, Yuancheng District, Heyuan, Guangdong, China';
"""
    with open(OUT_TS, "w", encoding="utf-8", newline="\n") as f:
        f.write(ts)
    print("written:", OUT_TS, os.path.getsize(OUT_TS), "bytes")


if __name__ == "__main__":
    main()
