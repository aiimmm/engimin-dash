"use client";

import { Typography } from "@/components/elements/Typography";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSession } from "@/lib/auth/useSession";
import {
  AiSparklesIcon,
  DateTimeIcon,
  Shaka03Icon,
  Shaka04Icon,
  WavingHand02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* Data & logic (dipakai semua layout, tidak berubah)                  */
/* ------------------------------------------------------------------ */
function useDashboardData(propUser) {
  const { user: sessionUser } = useSession();
  const currentUser = propUser || sessionUser;
  const userName = currentUser?.name || currentUser?.username || "Admin Engineering";

  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = time.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const hours = time.getHours();
  let greeting = "Selamat Datang";
  if (hours >= 4 && hours < 11) greeting = "Selamat Pagi";
  else if (hours >= 11 && hours < 15) greeting = "Selamat Siang";
  else if (hours >= 15 && hours < 18) greeting = "Selamat Sore";
  else greeting = "Selamat Malam";

  return { userName, greeting, formattedDate, formattedTime };
}

/* ------------------------------------------------------------------ */
/* Potongan UI (warna & class sama persis dengan versi asli)           */
/* ------------------------------------------------------------------ */
function GreetingBadge({ greeting }) {
  return (
    <Badge variant="default">
      <HugeiconsIcon icon={AiSparklesIcon} />
      {greeting}
    </Badge>
  );
}

function Title({ userName, className = "" }) {
  return (
    <h1
      className={`flex items-center gap-2 text-2xl font-extrabold tracking-tight md:text-3xl ${className}`}
    >
      <span>
        <span className="text-muted-foreground">Halo,</span> {userName}!
      </span>
      <HugeiconsIcon
        icon={WavingHand02Icon}
        className="size-7 shrink-0 origin-[70%_70%] animate-wave md:size-8"
        aria-hidden="true"
      />
    </h1>
  );
}

function Message({ className = "" }) {
  return (
    <p className={`max-w-3xl text-sm text-muted-foreground ${className}`}>
      Welcome Back! Selamat beraktivitas! Semoga semua pekerjaan hari ini berjalan lancar dan
      selesai tepat waktu. Jangan Lupa Joss Jiss&nbsp;
      <span className="ml-1 inline-flex translate-y-0.5 items-center gap-1 align-middle -mt-2">
        <HugeiconsIcon
          icon={Shaka03Icon}
          className="size-5 shrink-0 animate-wave"
          aria-hidden="true"
        />
        <HugeiconsIcon
          icon={Shaka04Icon}
          className="size-5 shrink-0 animate-wave-delayed"
          aria-hidden="true"
        />
      </span>
    </p>
  );
}

function ClockBox({ formattedDate, formattedTime, className = "", align = "items-start" }) {
  return (
    <div className={`flex flex-col justify-center rounded-xl border p-4 ${align} ${className}`}>
      <Typography as="small" className="mb-3 flex items-center gap-2" suppressHydrationWarning>
        <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
        {formattedDate}
      </Typography>
      <Typography as="h2" className="font-bold" suppressHydrationWarning>
        {formattedTime}
      </Typography>
      <Typography as="p" className="text-xs text-muted-foreground" suppressHydrationWarning>
        Waktu saat ini · WIB (UTC+7)
      </Typography>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT A — Asli (vertikal: sapaan di atas, jam di bawah)            */
/* ------------------------------------------------------------------ */
function LayoutA(d) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <GreetingBadge greeting={d.greeting} />
            <div className="space-y-2">
              <Title userName={d.userName} />
              <Message />
            </div>
          </div>
          <ClockBox {...d} />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT B — Garis pemisah vertikal: sapaan kiri, jam kanan          */
/*            tanpa kotak, dipisah border-l (di mobile jadi border-t)  */
/* ------------------------------------------------------------------ */
function LayoutB(d) {
  return (
    <Card className="relative overflow-hidden bg-linear-to-t from-primary/5 to-card">
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:gap-8">
          <div className="space-y-4">
            <GreetingBadge greeting={d.greeting} />
            <div className="space-y-2">
              <Title userName={d.userName} />
              <Message />
            </div>
          </div>
          <div className="flex flex-col justify-center border-t pt-6 lg:min-w-64 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <Typography
              as="small"
              className="mb-3 flex items-center gap-2"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
              {d.formattedDate}
            </Typography>
            <Typography as="h2" className="font-bold tabular-nums" suppressHydrationWarning>
              {d.formattedTime}
            </Typography>
            <Typography as="p" className="text-xs text-muted-foreground" suppressHydrationWarning>
              Waktu saat ini · WIB (UTC+7)
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT C — Compact: badge + judul di kiri, jam kecil di kanan atas, */
/*            pesan di bawah. Tinggi card paling ramping               */
/* ------------------------------------------------------------------ */
function LayoutC(d) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <GreetingBadge greeting={d.greeting} />
              <Title userName={d.userName} className="text-xl md:text-2xl" />
            </div>
            <div className="flex flex-col sm:items-end">
              <Typography as="h2" className="font-bold tabular-nums" suppressHydrationWarning>
                {d.formattedTime}
              </Typography>
              <Typography
                as="small"
                className="flex items-center gap-2 text-muted-foreground"
                suppressHydrationWarning
              >
                <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
                {d.formattedDate}
              </Typography>
            </div>
          </div>
          <Message />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT D — Clock hero: jam digital besar jadi fokus utama di atas,  */
/*            sapaan & pesan di bawahnya                               */
/* ------------------------------------------------------------------ */
function LayoutD(d) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Typography
              as="small"
              className="flex items-center gap-2 text-muted-foreground"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
              {d.formattedDate}
            </Typography>
            <span
              className="text-5xl font-extrabold tracking-tight tabular-nums md:text-6xl"
              suppressHydrationWarning
            >
              {d.formattedTime}
            </span>
            <Typography as="p" className="text-xs text-muted-foreground" suppressHydrationWarning>
              Waktu saat ini · WIB (UTC+7)
            </Typography>
          </div>
          <div className="space-y-4 border-t pt-6">
            <GreetingBadge greeting={d.greeting} />
            <div className="space-y-2">
              <Title userName={d.userName} />
              <Message />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT E — Header bar: jam & tanggal satu baris di atas, sapaan     */
/*            di bawah dipisah garis                                   */
/* ------------------------------------------------------------------ */
function LayoutE(d) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <GreetingBadge greeting={d.greeting} />
            <div className="flex items-center gap-3 text-sm">
              <Typography as="small" className="flex items-center gap-2" suppressHydrationWarning>
                <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
                {d.formattedDate}
              </Typography>
              <span className="text-muted-foreground">·</span>
              <Typography as="small" className="font-bold tabular-nums" suppressHydrationWarning>
                {d.formattedTime}
              </Typography>
              <span className="text-xs text-muted-foreground">WIB</span>
            </div>
          </div>
          <div className="space-y-2 border-t pt-5">
            <Title userName={d.userName} />
            <Message />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT F — Dua tile: tanggal & jam dipisah jadi dua kotak sejajar   */
/*            di bawah sapaan                                          */
/* ------------------------------------------------------------------ */
function LayoutF(d) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <GreetingBadge greeting={d.greeting} />
            <div className="space-y-2">
              <Title userName={d.userName} />
              <Message />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col justify-center rounded-xl border p-4">
              <Typography as="small" className="mb-3 flex items-center gap-2 text-muted-foreground">
                <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
                Tanggal
              </Typography>
              <Typography as="h2" className="font-bold" suppressHydrationWarning>
                {d.formattedDate}
              </Typography>
            </div>
            <div className="flex flex-col justify-center rounded-xl border p-4">
              <Typography as="small" className="mb-3 text-muted-foreground">
                Waktu saat ini · WIB (UTC+7)
              </Typography>
              <Typography as="h2" className="font-bold tabular-nums" suppressHydrationWarning>
                {d.formattedTime}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* LAYOUT G — Bento 3 Card: sapaan besar di kiri (2 baris),            */
/*            kartu tanggal & kartu jam bertumpuk di kanan             */
/* ------------------------------------------------------------------ */
function LayoutG(d) {
  return (
    <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
      <Card className="relative overflow-hidden md:col-span-2 md:row-span-2">
        <CardContent className="flex h-full flex-col justify-center">
          <div className="space-y-4">
            <GreetingBadge greeting={d.greeting} />
            <div className="space-y-2">
              <Title userName={d.userName} />
              <Message />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden">
        <CardContent className="flex h-full flex-col justify-center">
          <Typography as="small" className="mb-2 flex items-center gap-2" suppressHydrationWarning>
            <HugeiconsIcon icon={DateTimeIcon} className="size-4" />
            {d.formattedDate}
          </Typography>
        </CardContent>
      </Card>
      <Card className="relative overflow-hidden">
        <CardContent className="flex h-full flex-col justify-center">
          <Typography as="h2" className="font-bold tabular-nums" suppressHydrationWarning>
            {d.formattedTime}
          </Typography>
          <Typography as="p" className="text-xs text-muted-foreground" suppressHydrationWarning>
            Waktu saat ini · WIB (UTC+7)
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pemilih layout: <WelcomeCard variant="B" />                    */
/* ------------------------------------------------------------------ */
const LAYOUTS = {
  A: LayoutA,
  B: LayoutB,
  C: LayoutC,
  D: LayoutD,
  E: LayoutE,
  F: LayoutF,
  G: LayoutG,
};

export function WelcomeCard({ user: propUser, variant = "B" }) {
  const data = useDashboardData(propUser);
  const Layout = LAYOUTS[variant] ?? LayoutA;
  return <Layout {...data} />;
}

export default WelcomeCard;
