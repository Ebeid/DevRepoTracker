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
import { Plus } from "lucide-react";

export default function AddRepository() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertRepositorySchema.pick({ name: true, url: true })),
    defaultValues: {
      name: "",
      url: "",
    },
  });

  const addRepoMutation = useMutation({
    mutationFn: async (data: typeof form.getValues) => {
      const res = await apiRequest("POST", "/api/repositories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setOpen(false);
      form.reset();

      toast({
        title: "Repository added",
        description: "The repository has been added successfully.",
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
                    <Input {...field} placeholder="my-awesome-repo" />
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
                    <Input {...field} type="url" placeholder="https://github.com/username/repo" />
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