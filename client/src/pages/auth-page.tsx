import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, resetPasswordRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGithub } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot-password">("login");
  const [forgotPasswordSubmitted, setForgotPasswordSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const forgotPasswordForm = useForm({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      username: "",
    },
  });

  const handleForgotPassword = async (data: { username: string }) => {
    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/forgot-password", data);
      const result = await response.json();

      if (result.success) {
        setForgotPasswordSubmitted(true);

        // For development purposes, get a sample token
        try {
          const tokenResponse = await apiRequest("GET", "/api/dev/reset-token?username=" + encodeURIComponent(data.username));
          const tokenData = await tokenResponse.json();
          if (tokenData.token) {
            setDevResetToken(tokenData.token);
          }
        } catch (e) {
          console.log("Developer token not available");
        }

        toast({
          title: "Password Reset Email Sent",
          description: "If an account with this email exists, you'll receive instructions to reset your password.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Failed to process your request. Please try again later.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <SiGithub className="w-8 h-8" />
              <CardTitle className="text-2xl">Git-Plus</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {authMode === "forgot-password" ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 mr-2"
                    onClick={() => setAuthMode("login")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to login
                  </Button>
                  <h2 className="text-xl font-semibold">Reset Password</h2>
                </div>

                {forgotPasswordSubmitted ? (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                      <AlertTitle>Check your email</AlertTitle>
                      <AlertDescription>
                        If an account exists with the email you provided, we've sent instructions to reset your password.
                      </AlertDescription>
                    </Alert>

                    {devResetToken && (
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900">
                        <AlertTitle>Development Mode</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>Since email delivery is not configured, use this link for testing:</p>
                          <a 
                            href={`/auth/reset-password?token=${devResetToken}`}
                            className="text-primary hover:underline break-all text-sm"
                          >
                            {`/auth/reset-password?token=${devResetToken}`}
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button 
                      className="w-full" 
                      onClick={() => {
                        setAuthMode("login");
                        setForgotPasswordSubmitted(false);
                        setDevResetToken(null);
                      }}
                    >
                      Return to Login
                    </Button>
                  </div>
                ) : (
                  <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        Enter your email address and we'll send you instructions to reset your password.
                      </div>
                      <FormField
                        control={forgotPasswordForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex gap-1">
                              Email
                              <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="email" 
                                required 
                                placeholder="Enter your email"
                                className="focus-visible:ring-2 ring-offset-2 ring-primary"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Instructions"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            ) : (
              <>
                <Tabs defaultValue={authMode} onValueChange={(value) => setAuthMode(value as "login" | "register")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))}>
                        <div className="space-y-4">
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex gap-1">
                                  Email
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email" 
                                    required 
                                    placeholder="Enter your email"
                                    className="focus-visible:ring-2 ring-offset-2 ring-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex gap-1">
                                  Password
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    required
                                    placeholder="Enter your password"
                                    className="focus-visible:ring-2 ring-offset-2 ring-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loginMutation.isPending}
                          >
                            {loginMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Logging in...
                              </>
                            ) : (
                              "Login"
                            )}
                          </Button>
                          <div className="text-center mt-2">
                            <Button
                              variant="link"
                              className="text-sm p-0 h-auto"
                              onClick={() => setAuthMode("forgot-password")}
                            >
                              Forgot your password?
                            </Button>
                          </div>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>
                        <div className="space-y-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex gap-1">
                                  Email
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email" 
                                    required
                                    placeholder="Enter your email"
                                    className="focus-visible:ring-2 ring-offset-2 ring-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex gap-1">
                                  Password
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    required
                                    placeholder="Choose a password"
                                    className="focus-visible:ring-2 ring-offset-2 ring-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex gap-1">
                                  Confirm Password
                                  <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    {...field} 
                                    required
                                    placeholder="Confirm your password"
                                    className="focus-visible:ring-2 ring-offset-2 ring-primary"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Registering...
                              </>
                            ) : (
                              "Register"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
        <div className="max-w-xl text-primary-foreground">
          <h1 className="text-4xl font-bold mb-4">
            Git-Plus is not another Git service
          </h1>
          <p className="text-lg opacity-90">
            Your code repositories are more than code files. Register now to work with your respository as you never before.
          </p>
        </div>
      </div>
    </div>
  );
}