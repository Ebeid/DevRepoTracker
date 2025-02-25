import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGithub } from "react-icons/si";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

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
            <Tabs defaultValue="login">
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
                        Login
                      </Button>
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
                        Register
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
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