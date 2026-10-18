import { useId } from "react";
import { LOGO_PATHS } from "@/lib/brandPaths";

const OR = ["#B07AE6", "#8A55C9", "#C2508A"];
const RO = ["#E7A6C4", "#C2508A"];
const INK = ["#3B2650", "#22162F"];

function Grad({ id, colors, rect }: { id: string; colors: string[]; rect?: [number, number, number, number] }) {
  // الحبر الداكن يصير فاتحاً في الوضع الليلي (متغيرات --logo-ink-*).
  const vars = colors === INK ? ["var(--logo-ink-a, #3B2650)", "var(--logo-ink-b, #22162F)"] : null;
  const stops = colors.map((c, i) => <stop key={c} offset={i / (colors.length - 1)} style={{ stopColor: vars ? vars[i] : c }} />);
  return rect ? (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={rect[0]} y1={rect[1]} x2={rect[2]} y2={rect[3]}>
      {stops}
    </linearGradient>
  ) : (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      {stops}
    </linearGradient>
  );
}

/**
 * شعار ديما الحياة الجديد (نفس متجهات التطبيق — core/brand).
 * mark: الخصلات والحاجب فقط. color: لون واحد (مثلاً أبيض فوق خلفية ملوّنة).
 */
export function BrandLogo({ mark, color, className, title = "ديما الحياة" }: { mark?: boolean; color?: string; className?: string; title?: string }) {
  const uid = useId().replace(/:/g, "");
  const f = (g: string) => (color ? color : `url(#${g}${uid})`);
  const P = LOGO_PATHS;
  return (
    <svg viewBox={mark ? "198 1 105 154" : "1 1 302 154"} className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      {!color && (
        <defs>
          <Grad id={`or${uid}`} colors={OR} />
          <Grad id={`ro${uid}`} colors={RO} />
          <Grad id={`ink${uid}`} colors={INK} />
          <Grad id={`al${uid}`} colors={OR} rect={[1, 68, 53, 119]} />
          <Grad id={`hy${uid}`} colors={INK} rect={[63, 68, 250, 136]} />
          <Grad id={`dm${uid}`} colors={OR} rect={[77, 55, 182, 78]} />
        </defs>
      )}
      <path fill={f("or")} d={P.strands[0]} />
      <path fill={f("ro")} d={P.strands[1]} />
      <path fill={f("or")} d={P.strands[2]} />
      <path fill={f("ink")} d={P.brow[0]} />
      {!mark && (
        <>
          {P.al.map((d) => (
            <path key={d.slice(0, 24)} fill={f("al")} d={d} />
          ))}
          {P.hayat.map((d) => (
            <path key={d.slice(0, 24)} fill={f("hy")} d={d} />
          ))}
          {P.deema.map((d) => (
            <path key={d.slice(0, 24)} fill={f("dm")} d={d} />
          ))}
        </>
      )}
    </svg>
  );
}
