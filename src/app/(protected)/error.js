"use client";

import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }) {
  return (
    <div className="grid min-h-[85vh] place-items-center text-center">
      <div>
        <TriangleAlert className="mx-auto size-11 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold">Ada sesuatu yang tidak beres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman tidak dapat ditampilkan saat ini.
        </p>
        <Button className="mt-5" onClick={reset}>
          Muat ulang
        </Button>
      </div>
    </div>
  );
}
