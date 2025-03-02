import { useState, useEffect } from "react";
import { useLocation, Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { SiGithub } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState("");
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Get token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tokenParam = params.get("token");
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setResetError("No reset token found in URL. Please request a new password reset link.");
    }
  }, [location]);

  // Countdown for redirect after successful reset
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resetSuccess && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resetSuccess, redirectCountdown]);

  // Redirect to login page after countdown
  if (resetSuccess && redirectCountdown === 0) {
    return <Redirect to="/auth" />;
  }

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: { token: string; newPassword: string; confirmPassword: string }) => {
    if (!token) {
      setResetError("No reset token found in URL. Please request a new password reset link.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/reset-password", {
        ...data,
        token,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResetSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. You can now log in with your new password.",
        });
      } else {
        setResetError(result.message || "Failed to reset password. The link may have expired or is invalid.");
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: result.message || "Failed to reset password. Please try again.",
        });
      }
    } catch (error) {
      setResetError("An unexpected error occurred. Please try again later.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/10">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <SiGithub className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {resetSuccess ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle>Password Reset Successful</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Your password has been reset successfully.</p>
                <p>You will be redirected to the login page in {redirectCountdown} seconds...</p>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => window.location.href = "/auth"}
                >
                  Go to Login
                </Button>
              </AlertDescription>
            </Alert>
          ) : resetError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{resetError}</p>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => window.location.href = "/auth"}
                >
                  Return to Login
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Please enter your new password below. Choose a strong password that is at least 8 characters long.
                </div>
                
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1">
                        New Password
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          required
                          placeholder="Enter your new password"
                          className="focus-visible:ring-2 ring-offset-2 ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex gap-1">
                        Confirm New Password
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          required
                          placeholder="Confirm your new password"
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
                      Resetting password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
