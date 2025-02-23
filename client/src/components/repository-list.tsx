import { useQuery } from "@tanstack/react-query";
import { Repository } from "@shared/schema";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, Lock, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepositoryList() {
  const { data: repositories, isLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!repositories?.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No repositories found. Add your first repository to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Card key={repo.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {repo.isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {repo.name}
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {repo.description || "No description provided"}
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Star className="w-4 h-4 mr-1" />
              {repo.stars}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
