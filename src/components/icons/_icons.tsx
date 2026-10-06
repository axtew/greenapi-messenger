/**
 * Иконки Material Symbols Rounded (Google, Apache 2.0).
 *
 * Пути — `d` из SVG репозитория google/material-design-icons (`symbols/web/<имя>/materialsymbolsrounded/`); цвет — `currentColor`.
 */

interface IIconProps {
  /** Ширина и высота в пикселях. */
  size?: number;
}

/** Общая обёртка иконок: сетка Material Symbols и один путь `d`. */
function SvgIcon({ d, size = 24 }: IIconProps & { d: string }) {
  return (
    <svg viewBox="0 -960 960 960" width={size} height={size} fill="currentColor" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function MenuIcon({ size }: IIconProps) {
  return (
    <SvgIcon
      size={size}
      d="M160-240q-17 0-28.5-11.5T120-280q0-17 11.5-28.5T160-320h640q17 0 28.5 11.5T840-280q0 17-11.5 28.5T800-240H160Zm0-200q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520h640q17 0 28.5 11.5T840-480q0 17-11.5 28.5T800-440H160Zm0-200q-17 0-28.5-11.5T120-680q0-17 11.5-28.5T160-720h640q17 0 28.5 11.5T840-680q0 17-11.5 28.5T800-640H160Z"
    />
  );
}

export function LogoutIcon({ size }: IIconProps) {
  return (
    <SvgIcon
      size={size}
      d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h240q17 0 28.5 11.5T480-800q0 17-11.5 28.5T440-760H200v560h240q17 0 28.5 11.5T480-160q0 17-11.5 28.5T440-120H200Zm487-320H400q-17 0-28.5-11.5T360-480q0-17 11.5-28.5T400-520h287l-75-75q-11-11-11-27t11-28q11-12 28-12.5t29 11.5l143 143q12 12 12 28t-12 28L669-309q-12 12-28.5 11.5T612-310q-11-12-10.5-28.5T613-366l74-74Z"
    />
  );
}

export function PencilIcon({ size }: IIconProps) {
  return (
    <SvgIcon
      size={size}
      d="M160-120q-17 0-28.5-11.5T120-160v-97q0-16 6-30.5t17-25.5l505-504q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L313-143q-11 11-25.5 17t-30.5 6h-97Zm544-528 56-56-56-56-56 56 56 56Z"
    />
  );
}

export function BackIcon({ size }: IIconProps) {
  return (
    <SvgIcon
      size={size}
      d="m313-440 196 196q12 12 11.5 28T508-188q-12 11-28 11.5T452-188L188-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l264-264q11-11 27.5-11t28.5 11q12 12 12 28.5T508-715L313-520h447q17 0 28.5 11.5T800-480q0 17-11.5 28.5T760-440H313Z"
    />
  );
}

export function SendIcon({ size }: IIconProps) {
  return (
    <SvgIcon
      size={size}
      d="M176-183q-20 8-38-3.5T120-220v-180l320-80-320-80v-180q0-22 18-33.5t38-3.5l616 260q25 11 25 37t-25 37L176-183Z"
    />
  );
}
