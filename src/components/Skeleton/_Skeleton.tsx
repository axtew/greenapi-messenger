import { SRoot } from "./_styles";

interface ISkeletonProps {
  /** CSS-длина: `54px`, `45%`, `min(160px, 50%)`. */
  width: string;
  /** CSS-длина. */
  height: string;
}

/** Пульсирующий плейсхолдер со скруглёнными краями на место ещё не загруженного содержимого. */
export function Skeleton({ width, height }: ISkeletonProps) {
  return <SRoot $width={width} $height={height} />;
}
