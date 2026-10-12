"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockPasswordIcon, User03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoaderCircleIcon } from "lucide-react";
import { useLoginForm } from "../hooks/useLoginForm";

export const LoginForm = () => {
  const { username, setUsername, password, setPassword, loading, handleSubmit } = useLoginForm();

  return (
    <Card className="bg-card/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-semibold">Welcome Back</CardTitle>
        <CardDescription className="text-center text-sm text-muted-foreground">
          Masuk menggunakan akun internal Travelio untuk mengakses dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={User03Icon}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              />
              <Input
                id="username"
                type="text"
                placeholder="Masukkan Username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <HugeiconsIcon
                icon={LockPasswordIcon}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                aria-hidden={true}
              />
              <Input
                id="password"
                type="password"
                placeholder="Masukkan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <>
                <LoaderCircleIcon className="mr-1 size-4 animate-spin" />
                Sedang Masuk...
              </>
            ) : (
              "Login"
            )}
          </Button>
          <FieldDescription className="text-center">
            Sistem ini hanya dapat diakses oleh staf Travelio yang memiliki izin akses.
          </FieldDescription>
        </form>
      </CardContent>
    </Card>
  );
};
