// ============================================================================
// MODULES / AUTH — Password Field Component
// Purpose: Reusable password input with visibility toggle & accessibility
// ============================================================================

"use client";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

export function PasswordField({ register, error, disabled }) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <Field data-invalid={Boolean(error)}>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor="password">Password</FieldLabel>
      </div>
      <InputGroup>
        <InputGroupInput
          id="password"
          type={isVisible ? "text" : "password"}
          placeholder="••••••••••"
          autoComplete="current-password"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "password-error" : undefined}
          className="mr-1 rounded-l-xl"
          {...register("password")}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            className="rounded-full"
            disabled={disabled}
            aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <EyeOffIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <EyeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && <FieldError id="password-error">{error.message}</FieldError>}
    </Field>
  );
}
