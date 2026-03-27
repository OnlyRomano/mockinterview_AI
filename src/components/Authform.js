"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Form } from "@/components/ui/form";
import Image from "next/image";
import { toast } from "sonner";
import FormField from "./FormField";
import { useRouter } from "next/navigation";
import { signIn, signUp } from "@/lib/actions/auth.actions";
import { useState } from "react";
import { Eye, EyeOff, Loader } from "lucide-react";

const authFormSchema = (type) => {
  const emailSchema =
    type === "sign-up"
      ? z
          .string()
          .min(1, "Email is required")
          .refine(
            (val) => val.includes("@"),
            "Please enter a valid email address containing @ and .com"
          )
      : z.string().email("Please enter a valid email address");

  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: emailSchema,
    password: z.string().min(8),
  });
};

const Authform = ({ type }) => {
  const router = useRouter();
  const formSchema = authFormSchema(type);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Define your form.
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  async function onSubmit(values) {
    setIsLoading(true);
    try {
      if (type === "sign-up") {
        const { email, name, password } = values;

        const result = await signUp({
          name,
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result?.message);
          return;
        }

        toast.success(
          "Account Created Successfully. Please check your email to verify your account.",
        );
        router.push("/sign-in");
      } else {
        const { email, password } = values;
        const result = await signIn({
          email,
          password,
        });

        if (!result?.success) {
          toast.error(result?.message);
          return;
        }
        toast.success("Sign in Successfully.");
        router.push("/"); // change it into dashboard route
      }
    } catch (error) {
      console.log(error);
      toast.error(`Something went wrong: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  function onError(errors) {
    const values = form.getValues();
    const isSignIn = type === "sign-in";
    const { name, email, password } = values;
    const fields = isSignIn ? [email, password] : [name, email, password];

    const allEmpty = fields.every((v) => !v || String(v).trim() === "");
    if (allEmpty) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (errors?.email) {
      toast.error(
        type === "sign-up"
          ? "Please enter a valid email address containing @"
          : "Please enter a valid email address."
      );
      return;
    }

    if (errors?.password) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    toast.error("Please check your inputs.");
  }

  const isSignIn = type === "sign-in";

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        {/* Left side: brand / marketing */}
        <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-b from-[#1D4ED8] via-[#312E81] to-[#111827] px-9 py-8 text-card lg:flex">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">
                HR
              </div>
              <span className="text-sm font-semibold tracking-wide">
                HireReady AI
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-semibold leading-snug">
              Mock interviews that feel real,
              <br />
              feedback that helps you grow.
            </h2>
            <p className="mt-3 text-sm text-slate-200/80">
              Practice behavioral and technical interviews with an AI
              interviewer, then review detailed transcripts and personalized
              feedback after every session.
            </p>
          </div>

          <div className="mt-8 space-y-3 text-xs text-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Real-time voice interviews, not static question lists.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              <span>Instant scoring and feedback after each attempt.</span>
            </div>
          </div>
        </div>

        {/* Right side: auth form */}
        <div className="w-full px-6 py-8 sm:px-10 lg:w-1/2 lg:py-10">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                HireReady AI
              </p>
              <p className="text-xs text-muted-foreground">
                AI-powered interview practice
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-1">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              {isSignIn ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignIn
                ? "Sign in to continue your interview practice."
                : "Join HireReady AI and start preparing with smart mock interviews."}
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, onError)}
              className="w-full space-y-5"
            >
              {!isSignIn && (
                <FormField
                  control={form.control}
                  name="name"
                  label="Full name"
                  placeholder="e.g. John Doe"
                />
              )}

              <FormField
                control={form.control}
                name="email"
                label="Email"
                placeholder="e.g. you@example.com"
                type="email"
              />

              <div className="relative">
                <FormField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="e.g Example@123"
                  type={showPassword ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 w-full rounded-full text-sm font-semibold shadow-[var(--shadow-sm)]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {isSignIn ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>{isSignIn ? "Sign in" : "Create account"}</>
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className="font-semibold text-primary"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Authform;
