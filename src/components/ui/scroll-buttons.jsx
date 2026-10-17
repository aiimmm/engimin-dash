"use client";

import { Button } from "@/components/ui/button";
import { ArrowDownToLineIcon, ArrowUpToLineIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Hook ────────────────────────────────────────────────────────────────────

function useScrollState() {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  // isScrolling default false — aman untuk SSR (tidak ada hydration mismatch)
  const [isScrolling, setIsScrolling] = useState(false);
  // isMounted hanya dipakai sebagai flag internal; ubah ke ref agar tidak
  // memicu setState di body effect (react-hooks/set-state-in-effect)
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    let idleTimer = null;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;

      setAtTop(scrollY < 80);
      setAtBottom(scrollY + windowH >= docH - 80);
      setIsScrolling(true);

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setIsScrolling(false), 1500);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  // Sebelum mount (SSR / hydration) isScrolling=false → semua button tersembunyi
  return { atTop, atBottom, isScrolling };
}

// ─── Individual buttons ───────────────────────────────────────────────────────

/**
 * Scroll to top button — muncul saat scroll aktif dan belum di posisi paling atas.
 * Bisa dipakai standalone (punya animasinya sendiri).
 */
export function ScrollToTopButton({ className = "" }) {
  const { atTop, isScrolling } = useScrollState();
  const visible = isScrolling && !atTop;

  return (
    <div
      className={`transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
      } ${className}`}
    >
      <Button
        variant="default"
        size="icon"
        className="size-9 rounded-full shadow-md"
        title="Ke atas"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
      >
        <ArrowUpToLineIcon className="size-4" />
      </Button>
    </div>
  );
}

/**
 * Scroll to bottom button — muncul saat scroll aktif dan belum di posisi paling bawah.
 * Bisa dipakai standalone (punya animasinya sendiri).
 */
export function ScrollToBottomButton({ className = "" }) {
  const { atBottom, isScrolling } = useScrollState();
  const visible = isScrolling && !atBottom;

  return (
    <div
      className={`transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-2"
      } ${className}`}
    >
      <Button
        variant="default"
        size="icon"
        className="size-9 rounded-full shadow-md"
        title="Ke bawah"
        onClick={() =>
          window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })
        }
        aria-label="Scroll to bottom"
      >
        <ArrowDownToLineIcon className="size-4" />
      </Button>
    </div>
  );
}

// ─── Combined floating group ──────────────────────────────────────────────────

/**
 * Floating scroll buttons fixed ke pojok kanan bawah.
 * Wrapper (border + backdrop) muncul/hilang bersama kedua button.
 * Taruh sekali di layout, kedua button langsung tersedia.
 *
 * Usage:
 *   import { ScrollButtons } from "@/components/ui/scroll-buttons";
 *   <ScrollButtons />
 *
 * Props:
 *   bottom  — Tailwind bottom offset (default: "bottom-6")
 *   right   — Tailwind right offset  (default: "right-6")
 */
export function ScrollButtons({ bottom = "bottom-6", right = "right-6" }) {
  const { atTop, atBottom, isScrolling } = useScrollState();

  // Wrapper visible jika sedang scroll
  const wrapperVisible = isScrolling;
  // Button top visible jika wrapper visible + belum di atas
  const topVisible = wrapperVisible && !atTop;
  // Button bottom visible jika wrapper visible + belum di bawah
  const bottomVisible = wrapperVisible && !atBottom;

  return (
    <div className={`fixed ${bottom} ${right} z-50`}>
      {/* Wrapper pill — fade in/out saat scroll aktif */}
      <div
        className={`flex flex-col gap-1 items-center transition-all duration-300 border bg-background/10 p-1 rounded-full shadow-md backdrop-blur-xs ${
          wrapperVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 pointer-events-none translate-y-2"
        }`}
      >
        {/* Button atas — hilang saat sudah di top */}
        <div
          className={`transition-all duration-200 overflow-hidden ${
            topVisible ? "max-h-12 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <Button
            variant="default"
            size="icon"
            className="size-9 rounded-full"
            title="Ke atas"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll to top"
          >
            <ArrowUpToLineIcon className="size-4" />
          </Button>
        </div>

        {/* Button bawah — hilang saat sudah di bottom */}
        <div
          className={`transition-all duration-200 overflow-hidden ${
            bottomVisible ? "max-h-12 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <Button
            variant="default"
            size="icon"
            className="size-9 rounded-full"
            title="Ke bawah"
            onClick={() =>
              window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })
            }
            aria-label="Scroll to bottom"
          >
            <ArrowDownToLineIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
