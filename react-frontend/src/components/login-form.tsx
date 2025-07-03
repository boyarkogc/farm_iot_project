import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import farmImage from "@/assets/optimized/farm1.jpg";
import { useAuth } from "./contexts/auth-provider";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

export function LoginForm({
  className,
  isSignup = false,
  ...props
}: React.ComponentProps<"div"> & { isSignup: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { user, login, signUp, isAuthenticating } = useAuth();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isSignup) {
        await signUp(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isSignup
            ? "Failed to sign up"
            : "Failed to login",
      );
    }
  };
  if (user) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">
                      {isSignup ? "Create an account" : "Welcome back"}
                    </h1>
                    <p className="text-muted-foreground text-balance">
                      {isSignup
                        ? "Sign up for an SyncSeed account"
                        : "Login to your SyncSeed account"}
                    </p>
                  </div>
                  {error && (
                    <div className="text-red-600 p-2 text-sm">{error}</div>
                  )}
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="ml-auto text-sm underline-offset-2 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {isSignup ? (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isAuthenticating}
                    >
                      Sign up
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isAuthenticating}
                      >
                        Login
                      </Button>
                      <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link
                          to="/signup"
                          className="underline underline-offset-4"
                        >
                          Sign up
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </form>
              <div className="bg-muted relative hidden md:block">
                <img
                  src={farmImage}
                  alt="Image"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            By clicking continue, you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
