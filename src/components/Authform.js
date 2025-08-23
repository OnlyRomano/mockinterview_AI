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

const authFormSchema = (type) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(8),
  });
};

const Authform = ({ type }) => {
  const router = useRouter()
  const formSchema = authFormSchema(type);

  // 1. Define your form.
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values) {
    try {
      if (type === "sign-up") {
        toast.success("Account Created Successfully Please Sign In.")
        router.push('/sign-in')
      } else {
        toast.success("Sign in Successfully.")
        router.push('/') // change it into dashboard route
      }
    } catch (error) {
      console.log(error);
      toast.error(`Something went wrong: ${error.message}`);
    }
  }

  const isSignIn = type === "sign-in";
  return (
    <div className="card-border min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" width={32} height={38} />
          <h2 className="text-primary-100">HireReady AI</h2>
        </div>
        <h3>Practice for your next interview</h3>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
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
              placeholder="Example@email.cgom"
              type="email"
            />

            {/* Password Input */}
            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="•••••••••"
              type="password"
            />

            <Button type="submit" className="btn">
              {isSignIn ? "Sign In" : "Create an Account"}
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
