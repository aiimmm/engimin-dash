// ============================================================================
// MODULES / AUTH — Login Form Fields Component
// Purpose: Field group layout containing Username/Email and Password inputs
// ============================================================================

"use client";

import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordField } from "./PasswordField";

export function LoginFormFields({ register, errors, disabled }) {
  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.username)}>
        <FieldLabel htmlFor="username">Username atau Email</FieldLabel>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="Masukkan username atau email"
          disabled={disabled}
          aria-invalid={Boolean(errors.username)}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
        />
        {errors.username && <FieldError id="username-error">{errors.username.message}</FieldError>}
      </Field>

      <PasswordField register={register} error={errors.password} disabled={disabled} />
    </FieldGroup>
  );
}
