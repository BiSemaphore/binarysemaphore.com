import Image, { type StaticImageData } from "next/image";

type PhotoProps = {
  /** A statically-imported image (so a blur placeholder is generated). */
  src: StaticImageData;
  alt: string;
  /** Container classes: set aspect ratio, rounding, borders here. */
  className?: string;
  /** Extra classes on the image itself (e.g. object-position). */
  imgClassName?: string;
  /** Responsive `sizes` hint. Default assumes full viewport width. */
  sizes?: string;
  /** Eager-load above-the-fold images. Off by default, so images lazy-load. */
  priority?: boolean;
};

/**
 * A photo that fills its container (object-cover), lazy-loads by default, and
 * fades up from a blurred low-res placeholder (auto-generated from the static
 * import). A shimmer skeleton sits behind it for the brief moment before the
 * blur paints. Pass aspect ratio, rounding, and borders via `className`.
 */
export function Photo({
  src,
  alt,
  className = "",
  imgClassName = "",
  sizes = "100vw",
  priority = false,
}: PhotoProps) {
  return (
    <div className={`shimmer relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        placeholder="blur"
        className={`object-cover ${imgClassName}`}
      />
    </div>
  );
}
