import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // Defer initial check to avoid calling setState synchronously in effect body
    const timeout = setTimeout(onChange, 0);
    return () => {
      clearTimeout(timeout);
      mql.removeEventListener("change", onChange);
    };
  }, []);

  return !!isMobile;
}
