import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebhookEvent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff, GitCommit, GitPullRequest, Clock } from "lucide-react";
import { format } from "date-fns";

interface RepositoryWebhookProps {
  repositoryId: number;
  fullName: string;
}

export default function RepositoryWebhook({ repositoryId, fullName }: RepositoryWebhookProps) {
  const { toast } = useToast();
  const [isConfiguring, setIsConfiguring] = useState(false);

  const { data: events } = useQuery<WebhookEvent[]>({
    queryKey: [`/api/repositories/${repositoryId}/webhook/events`],
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "POST",
        `/api/repositories/${repositoryId}/webhook/enable`
      );
      return res.json();
    },
    onSuccess: ({ webhookSecret }) => {
      setIsConfiguring(true);
      toast({
        title: "Webhook Enabled",
        description: (
          <div className="mt-2 space-y-2">
            <p>Add this webhook to your GitHub repository:</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded">
              {`${window.location.origin}/api/webhook/${repositoryId}`}
            </p>
            <p className="font-semibold">Secret:</p>
            <p className="font-mono text-xs break-all bg-muted p-2 rounded">
              {webhookSecret}
            </p>
          </div>
        ),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(
        "POST",
        `/api/repositories/${repositoryId}/webhook/disable`
      );
    },
    onSuccess: () => {
      setIsConfiguring(false);
      toast({
        title: "Webhook Disabled",
        description: "Repository webhook has been disabled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Webhook Configuration</h2>
        <Button
          variant={isConfiguring ? "destructive" : "default"}
          onClick={() =>
            isConfiguring
              ? disableMutation.mutate()
              : enableMutation.mutate()
          }
          disabled={enableMutation.isPending || disableMutation.isPending}
        >
          {isConfiguring ? (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Disable Webhook
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Enable Webhook
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Recent webhook events from {fullName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!events?.length ? (
            <p className="text-sm text-muted-foreground">
              No webhook events received yet.
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  {event.type === "push" ? (
                    <GitCommit className="w-5 h-5 mt-1 text-green-500" />
                  ) : (
                    <GitPullRequest className="w-5 h-5 mt-1 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {event.type === "push" ? "Push Event" : "Pull Request"}
                      </span>
                      {event.action && (
                        <span className="text-sm text-muted-foreground">
                          ({event.action})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      by {event.sender}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.createdAt), "PPp")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
