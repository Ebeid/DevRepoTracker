import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Repository } from "@shared/schema";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RepositoryAnalytics from "@/components/repository-analytics";
import RepositoryHealthScore from "@/components/repository-health-score";
import RepositoryCodeSearch from "@/components/repository-code-search";
import TeamProductivityHeatmap from "@/components/team-productivity-heatmap";
import RepositoryWebhook from "@/components/repository-webhook";
import DeveloperCollaborationNetwork from "@/components/developer-collaboration-network";
import CodeComplexityHeatmap from "@/components/code-complexity-heatmap";
import RepositoryEvolutionTimeline from "@/components/repository-evolution-timeline";
import { Link } from "wouter";

export default function RepositoryDetailsPage() {
  const [, params] = useRoute("/repository/:id");
  const id = params?.id ? parseInt(params.id, 10) : undefined;

  const { data: repositories, isLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const repository = repositories?.find((repo) => repo.id === id);

  if (!repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Repository not found</h1>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Repositories
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-3xl font-bold">{repository.name}</h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">{repository.fullName}</p>
          <p className="mt-4">{repository.description || "No description provided"}</p>
        </div>

        <div className="mt-6">
          <RepositoryEvolutionTimeline repository={repository} />
        </div>

        <RepositoryCodeSearch 
          repositoryId={repository.id} 
          repositoryName={repository.name} 
        />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <RepositoryHealthScore repository={repository} />
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Repository Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <RepositoryAnalytics repository={repository} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6">
          <TeamProductivityHeatmap 
            repositoryId={repository.id} 
            repositoryName={repository.name} 
          />
        </div>

        <div className="mt-6">
          <DeveloperCollaborationNetwork
            repositoryId={repository.id}
            repositoryName={repository.name}
          />
        </div>

        <div className="mt-6">
          <CodeComplexityHeatmap
            repositoryId={repository.id}
            repositoryName={repository.name}
          />
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <RepositoryWebhook 
                repositoryId={repository.id}
                fullName={repository.fullName} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}