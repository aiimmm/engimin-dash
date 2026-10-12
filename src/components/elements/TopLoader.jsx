"use client";
import NextTopLoader from "nextjs-toploader";

export default function TopLoader() {
  return (
    <NextTopLoader
      color="var(--primary)"
      height={3}
      showSpinner={false}
      speed={300}
      easing="ease-in-out"
      shadow="0 0 10px var(--primary) / 0.5), 0 0 5px var(--primary) / 0.3)"
    />
  );
}
