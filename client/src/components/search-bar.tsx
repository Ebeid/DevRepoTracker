import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function SearchBar() {
  const { register, watch } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const searchParams = new URLSearchParams({ q: query });
      const response = await fetch(`/api/repositories/search?${searchParams}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/repositories"], data);
    },
  });

  // Debounced search
  const search = watch("search");
  let debounceTimeout: NodeJS.Timeout;
  const handleSearch = (value: string) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      if (value.trim()) {
        searchMutation.mutate(value);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      }
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        {...register("search")}
        className="pl-10"
        placeholder="Search repositories..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
