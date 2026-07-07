import type { SVGProps } from "react";
import type { Facing } from "../types";

type IconProps = SVGProps<SVGSVGElement>;

export function ExportIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 16V4m0 0 4 4m-4-4L8 8M5 14v6h14v-6" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />
    </svg>
  );
}

export function FacingIcon({ facing }: { facing: Exclude<Facing, null> }) {
  const label = `${facing} edge facing`;
  return <span className={`facing-icon ${facing}`} role="img" aria-label={label} title={label} />;
}
