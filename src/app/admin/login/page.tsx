"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Flame, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/components/admin/api";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is at least 6 characters"),
});
type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginValues) {
    setServerError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data !== "object" || !("ok" in data) || data.ok !== true) {
        const msg =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "Login failed";
        throw new Error(msg);
      }
      toast.success("Welcome back to the fire");
      const next = params.get("next") || "/admin";
      router.push(next);
      router.refresh();
    } catch (err) {
      const msg = errorMessage(err);
      setServerError(msg);
      toast.error(msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@abemrestaurant.et"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gold"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
      </div>

      {serverError ? (
        <div role="alert" className="rounded-lg border border-ember/40 bg-ember/10 px-3 py-2 text-xs text-red-300">
          {serverError}
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="btn-gold btn-sm w-full !min-w-0 !rounded-xl !px-4 !normal-case !tracking-normal !text-sm">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Flame className="h-4 w-4" aria-hidden="true" />}
        {isSubmitting ? "Stoking the fire…" : "Enter the Control Room"}
      </Button>

      <div className="rounded-lg border border-gold/15 bg-muted/40 px-3 py-2.5 text-center text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider text-gold/80">Demo access</span>
        <br />
        owner@abemrestaurant.et · Abem@2024!
      </div>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      {/* ember-glow backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[30%] h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/20 blur-[130px]" />
        <div className="absolute bottom-[8%] right-[12%] h-[300px] w-[300px] rounded-full bg-gold/10 blur-[110px]" />
        <div className="absolute left-[8%] top-[12%] h-[220px] w-[220px] rounded-full bg-gold/[0.07] blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(circle at 50% 120%, rgba(179,38,30,0.22), transparent 55%), radial-gradient(circle at 85% -10%, rgba(232,163,23,0.08), transparent 50%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass card-elevated rounded-2xl px-6 py-8 sm:px-8">
          <div className="mb-7 flex flex-col items-center text-center">
            <LogoMark className="h-14 w-14" animated />
            <h1 className="display-2 mt-4 text-cream">Abem Control Room</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Reservations, orders & the whole house — one login.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-4" aria-hidden="true">
                <div className="skeleton-shimmer h-11 rounded-xl" />
                <div className="skeleton-shimmer h-11 rounded-xl" />
                <div className="skeleton-shimmer h-12 rounded-xl" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Abem Admin · Designed by Joseph James
        </p>
      </div>
    </div>
  );
}
