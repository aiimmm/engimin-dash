// ============================================================================
// MODULES / AUTH — Main LoginForm Component
// Purpose: Primary login card container, accessible form layout, loading & error states
// ============================================================================

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";
import { LoginFormFields } from "./components/LoginFormFields";
import { useLogin } from "./hooks/useLogin";

export function LoginForm() {
  const { register, handleSubmit, errors, isSubmitting, serverError } = useLogin();

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <Card className="shadow-lg border-border/50">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Selamat Datang</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Masuk menggunakan akun internal Travelio Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {serverError && (
              <Alert variant="destructive" className="py-2.5 px-3">
                <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                <AlertDescription className="text-xs font-medium">{serverError}</AlertDescription>
              </Alert>
            )}

            <LoginFormFields register={register} errors={errors} disabled={isSubmitting} />

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
                    <span>Sedang Masuk...</span>
                  </div>
                ) : (
                  "Login"
                )}
              </Button>

              <FieldDescription className="text-center text-xs text-muted-foreground">
                Hanya staf Travelio yang berwenang yang dapat mengakses sistem ini.
              </FieldDescription>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;
