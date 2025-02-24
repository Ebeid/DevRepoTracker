import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRepositorySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, CheckCircle2, AlertCircle } from "lucide-react";

export default function AddRepository() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertRepositorySchema),
    defaultValues: {
      name: "",
      fullName: "",
      description: "",
      url: "",
      stars: 0,
      isPrivate: false,
    },
  });

  const addRepoMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/repositories", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setOpen(false);
      form.reset();

      // Show notification status in toast
      const notificationStatus = data.notification === 'queued' 
        ? { icon: CheckCircle2, message: 'Repository added and notification queued successfully.' }
        : { 
            icon: AlertCircle, 
            message: `Repository added but notification queuing had errors. ${
              data.retryStatus 
                ? `Retry attempt ${data.retryStatus.retryAttempts} of 3 scheduled.` 
                : ''
            }`
          };

      toast({
        title: "Repository added",
        description: (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <notificationStatus.icon className={`w-4 h-4 ${data.notification === 'queued' ? 'text-green-500' : 'text-yellow-500'}`} />
              <span>{notificationStatus.message}</span>
            </div>
            {data.emailStatus === false && (
              <div className="flex items-center gap-2 mt-1">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span>Email notification failed to send. Will retry with next event.</span>
              </div>
            )}
          </div>
        ),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Repository
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Repository</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => addRepoMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="owner/repo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repository URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={addRepoMutation.isPending}
            >
              Add Repository
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}