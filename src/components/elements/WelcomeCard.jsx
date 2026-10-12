"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth/useSession";
import { ClockIcon, SparklesIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Typography } from "./Typography";

export function WelcomeCard({ user: propUser }) {
  const { user: sessionUser } = useSession();
  const currentUser = propUser || sessionUser;
  const userName = currentUser?.name || currentUser?.username || "Admin Engineering";

  const [time, setTime] = useState(null);

  useEffect(() => {
    // Defer initial set to avoid calling setState synchronously in effect body
    // (null state during SSR prevents hydration mismatch)
    const init = setTimeout(() => setTime(new Date()), 0);
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => {
      clearTimeout(init);
      clearInterval(timer);
    };
  }, []);

  // Format hari & tanggal: Contoh "Rabu, 30 September 2026"
  const formattedDate = time?.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Format jam dengan detik: Contoh "07:15:30 WIB"
  const formattedTime = time?.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Greeting berdasarkan jam
  const hours = time?.getHours() ?? new Date().getHours();
  let greeting = "Selamat Datang";
  if (hours >= 4 && hours < 11) greeting = "Selamat Pagi";
  else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
  else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";
  else greeting = "Selamat Malam";

  return (
    <>
      <Card className="relative overflow-hidden">
        <CardContent className="">
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  <SparklesIcon className="mr-1 size-3.5" />
                  {greeting}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  <UserIcon className="mr-1 size-3.5" />
                  {userName}
                </Badge>
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  <span className="text-muted-foreground">Halo,</span> {userName}!{" "}
                  <span className="inline-block origin-[70%_80%] animate-wave invert-0 brightness-100 grayscale-100">
                    👋
                  </span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-3xl">
                  Selamat bekerja di portal manajemen Work Order Engineering Travelio. Pastikan
                  seluruh penugasan dan update status dilakukan sesuai prosedur operasional. Jangan
                  lupa josjis &nbsp;
                  <span className="inline-block align-middle animate-wave invert-0 brightness-100 grayscale-100">
                    🤙
                  </span>
                  <span className="inline-block align-middle animate-wave-delayed invert-0 brightness-100 grayscale-100">
                    🤙
                  </span>
                </p>
              </div>
            </div>

            {/* Jam Realtime Card */}
            <div className="flex flex-col items-start justify-center bg-muted border p-4 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <ClockIcon className="size-3.5" />
                Waktu Sistem
              </div>
              <Typography as="h2" className="font-bold tracking-tight text-foreground">
                {formattedTime ?? "——:——:——"}{" "}
                <span className="text-xs font-sans text-muted-foreground  tracking-wider font-normal">
                  WIB
                </span>
              </Typography>
              <Typography as="p" className="text-xs font-medium mt-1 capitalize">
                {formattedDate ?? "—"}
              </Typography>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default WelcomeCard;
