import Image from "next/image";

export const BRAND_LOGO =
  "https://res.cloudinary.com/dv0uopb3q/image/upload/v1791615631/Cokelat_Minimalis_Kedai_Kopi_Logo_iqlngj.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src={BRAND_LOGO}
      alt="Logo GOMOV"
      width={128}
      height={128}
      className={`h-11 w-11 object-contain ${className}`}
    />
  );
}