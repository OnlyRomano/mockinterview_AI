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
import { Eye, EyeOff, Loader, Loader2 } from "lucide-react";

const authFormSchema = (type) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
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

        toast.success("Account Created Successfully Please Sign In.");
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

    if (errors?.password) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    toast.error("Please check your inputs.");
  }

  const isSignIn = type === "sign-in";
  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" width={32} height={38} />
          <h2 className="text-primary-100">HireReady AI</h2>
        </div>
        <div className="text-center">
          <h3>Practice for your next interview</h3>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onError)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="e.g John Doe"
              />
            )}
            {/* Email Input */}
            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="e.g Example@email.com"
              type="email"
            />

            {/* Password Input */}
            <div className="relative">
              <FormField
                control={form.control}
                name="password"
                label="Password"
                placeholder="•••••••••"
                type={showPassword ? "text" : "password"}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                style={{ marginTop: "12px" }}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <Button type="submit" className="btn w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="size-4 animate-spin" />
                  {isSignIn ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {isSignIn ? "Sign In" : "Create an Account"}
                </>
              )}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-gray-500">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-bold text-primary-100 ml-1 hover:underline"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Authform;
