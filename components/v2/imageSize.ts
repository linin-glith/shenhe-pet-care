/**
 * THE SIZE OF A PICTURE, so the browser has something to reserve.
 *
 * An <img> without width and height has no size until the file arrives,
 * so the browser reserves nothing and the page jumps when the picture
 * lands. The sizes were measured at build time - a client component
 * cannot read the disk - and written into
 * content/v2/image-dimensions.json.
 *
 * This is the same list the <Img> component reads; it is here for the
 * places that need a bare <img> and cannot have a <picture> wrapped
 * around it.
 */
import IMAGE_SIZES from '@/content/v2/image-dimensions.json';

const SIZES = IMAGE_SIZES as Record<string, number[]>;

export function imageSize(src: string): { width?: number; height?: number } {
  const size = SIZES[src];
  if (!size || size.length < 2) return {};
  return { width: size[0], height: size[1] };
}
