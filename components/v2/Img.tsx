/**
 * A picture that hands the browser the small file.
 *
 * WHY THIS EXISTS
 * The catalogue cards render a `<picture>` with a WebP source and a
 * PNG fallback, so a browser that supports WebP gets the small file.
 * The rest of the site did not: the product scenes, the SKU
 * composer, the home hero and the factory photographs were plain
 * `<img src>` tags pointing at the originals.
 *
 * That cost real money. Measured on the live site:
 *
 *     /products.html                        21 images   6.7 MB
 *     /factory.html                         12 images   4.1 MB
 *     /                                    14 images   3.0 MB
 *
 * A single catalogue photograph was 1.7 MB. The WebP sibling of the
 * same picture is 158 KB — the compression script had made it, and
 * nothing pointed at it. A buyer on a phone in Rotterdam, Moscow or
 * Sao Paulo waits eight to thirty seconds for those bytes, and a
 * buyer who waits that long opens the next supplier's site instead.
 *
 * WHY THE LIST IS A FILE AND NOT A CHECK
 * The first version asked the filesystem whether the WebP sibling
 * existed, using `node:fs`. That cannot work: the components that
 * use this are client components, and a client bundle cannot read
 * the disk. The build failed with "the chunking context does not
 * support external modules".
 *
 * So the list of pictures that have a WebP sibling is written at
 * build time, into `content/v2/webp-manifest.json`, and this
 * component reads that. The list is also what
 * `scripts/audit_images.py` checks against, so a picture that
 * arrives without its sibling fails the build instead of quietly
 * serving the original.
 */
import WEBP_SIBLINGS from '@/content/v2/webp-manifest.json';
import IMAGE_SIZES from '@/content/v2/image-dimensions.json';
import IMAGE_VARIANTS from '@/content/v2/image-variants.json';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  /** Set for the one image above the fold: the preload should win. */
  priority?: boolean;
};

/** One smaller version of a picture: the file and the width it is. */
type Variant = { w: number; src: string };
type VariantEntry = { width: number; height: number; variants: Variant[] };

export default function Img({ src, priority = false, alt, sizes, ...rest }: Props) {
  // The map is typed from the generated file, so an index by a
  // runtime string needs one narrowing step.
  const webp = (WEBP_SIBLINGS as Record<string, string>)[src];
  const loading = priority ? 'eager' : (rest.loading ?? 'lazy');
  /*
   * THE SIZE OF THE FILE, so the browser has something to reserve.
   *
   * Without width and height the picture has no size until it arrives,
   * and the page jumps when it lands. The sizes were measured at build
   * time into content/v2/image-dimensions.json, because a client
   * component cannot read the disk. A size that is given in the markup
   * wins - the hero knows its own box.
   */
  const size = (IMAGE_SIZES as Record<string, number[]>)[src];
  const width = rest.width ?? size?.[0];
  const height = rest.height ?? size?.[1];

  /*
   * THE SMALLER VERSIONS.
   *
   * A browser downloads one file per picture and picks the one that fits
   * the box - but only when it is told what the box is. Without that it
   * takes the biggest file it can find, which is how a 64 KB packshot
   * ended up in a 116 px slot.
   *
   * The smaller versions were made at build time (scripts/gen_image_
   * variants.py) and are written down with the picture's real size, so
   * the component can offer them and the layout can say how big the box
   * is.
   */
  const entry = (IMAGE_VARIANTS as Record<string, VariantEntry>)[src];
  const candidates = entry?.variants ?? [];
  const srcSet = candidates.length
    ? candidates.map((v) => `${v.src} ${v.w}w`).join(', ')
    : undefined;
  /*
   * The WebP source gets the list, and the list ends with the picture at
   * its own size - so a browser that wants the full width gets it.
   */
  const webpSet = candidates.length ? srcSet : webp;
  /*
   * The fallback keeps the original file.
   *
   * The smaller versions are WebP, and the <img> is what a browser
   * WITHOUT WebP reads. Listing WebP files there would give that browser
   * a list it cannot use - so the fallback only carries a list when the
   * picture itself is already a WebP (the hero is).
   */
  const fallbackSet = webp ? undefined : srcSet;

  if (!webp) {
    return (
      <img
        src={src}
        alt={alt}
        srcSet={fallbackSet}
        sizes={sizes}
        width={width}
        height={height}
        loading={loading}
        decoding={rest.decoding ?? 'async'}
        {...rest}
      />
    );
  }

  return (
    <picture>
      <source srcSet={webpSet} sizes={sizes} type="image/webp" />
      <img
        src={src}
        alt={alt}
        srcSet={fallbackSet}
        sizes={sizes}
        width={width}
        height={height}
        loading={loading}
        decoding={rest.decoding ?? 'async'}
        {...rest}
      />
    </picture>
  );
}
