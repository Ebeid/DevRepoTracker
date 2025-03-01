import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookEvent } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, 
  BellOff, 
  GitCommit, 
  GitPullRequest, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  ChevronRight,
  Star,
  GitFork 
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RepositoryWebhookProps {
  repositoryId: number;
  fullName: string;
}

export default function RepositoryWebhook({ repositoryId, fullName }: RepositoryWebhookProps) {
  const { toast } = useToast();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const [newEvent, setNewEvent] = useState<WebhookEvent | null>(null);
  const [copied, setCopied] = useState(false);

  // Query to fetch webhook events
  const { data: events = [], refetch: refetchEvents } = useQuery<WebhookEvent[]>({
    queryKey: [`/api/repositories/${repositoryId}/webhook/events`],
    refetchInterval: 10000, // Poll every 10 seconds for new events
  });

  // Check for new events and trigger a notification
  useEffect(() => {
    if (events.length > 0 && !newEvent) {
      // Set the most recent event as new
      setNewEvent(events[0]);

      // Clear the new event notification after 5 seconds
      const timer = setTimeout(() => {
        setNewEvent(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [events]);

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
      setActiveTab("setup");
      toast({
        title: "Webhook Enabled",
        description: "Repository webhook has been enabled successfully.",
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
      setActiveTab("events");
      toast({
        title: "Webhook Disabled",
        description: "Repository webhook has been disabled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
    },
  });

  // Helper function to get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case "push":
        return <GitCommit className="w-5 h-5" />;
      case "pull_request":
        return <GitPullRequest className="w-5 h-5" />;
      case "star":
        return <Star className="w-5 h-5" />;
      case "fork":
        return <GitFork className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  // Helper function to get color for event type
  const getEventColor = (type: string) => {
    switch (type) {
      case "push":
        return "text-green-500";
      case "pull_request":
        return "text-blue-500";
      case "star":
        return "text-amber-500";
      case "fork":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  // Copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/api/webhook/${repositoryId}`;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/webhook/${repositoryId}`;

  return (
    <div className="space-y-4">
      {/* New event notification */}
      <AnimatePresence>
        {newEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className={`border-l-4 ${getEventColor(newEvent.type)} border-l-current`}>
              <div className={`${getEventColor(newEvent.type)}`}>
                {getEventIcon(newEvent.type)}
              </div>
              <AlertTitle>New {newEvent.type} event received!</AlertTitle>
              <AlertDescription>
                {newEvent.sender} just triggered a {newEvent.type} event
                {newEvent.action ? ` (${newEvent.action})` : ""}.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Real-time Repository Notifications</h2>
        <Button
          variant={isConfiguring ? "destructive" : "default"}
          onClick={() =>
            isConfiguring
              ? disableMutation.mutate()
              : enableMutation.mutate()
          }
          disabled={enableMutation.isPending || disableMutation.isPending}
        >
          {enableMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isConfiguring ? (
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {!events?.length ? (
            <div className="text-center p-8 border border-dashed rounded-lg">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhook events yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enable webhooks and configure your GitHub repository to send events to this URL.
              </p>
              <Button variant="outline" onClick={() => setActiveTab("setup")}>
                View Setup Instructions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {events.length} recent events for {fullName}
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetchEvents()}>
                  <Clock className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className={`p-2 rounded-full ${getEventColor(event.type)} bg-opacity-10`}>
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Event
                          </span>
                          {event.action && (
                            <Badge variant="outline">
                              {event.action}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mt-1">
                          Triggered by <span className="font-medium">{event.sender}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.createdAt), "PPp")}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Configuration Guide</CardTitle>
              <CardDescription>
                Follow these steps to set up GitHub webhooks for {fullName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Step 1: Copy the webhook URL</h3>
                <div className="flex items-center gap-2">
                  <code className="p-2 bg-muted rounded text-sm flex-1 overflow-x-auto">
                    {webhookUrl}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyWebhookUrl}>
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Step 2: Set up webhook in GitHub</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  <li>Navigate to your repository on GitHub</li>
                  <li>Go to <strong>Settings → Webhooks → Add webhook</strong></li>
                  <li>Enter the webhook URL from Step 1</li>
                  <li>Set content type to <code>application/json</code></li>
                  <li>Generate a secret and enter it securely</li>
                  <li>Choose which events to trigger the webhook (recommended: Pushes, Pull Requests)</li>
                  <li>Click <strong>Add webhook</strong></li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Step 3: Verify webhook connectivity</h3>
                <p className="text-sm">
                  After adding the webhook to GitHub, you should see a successful delivery in GitHub's webhook delivery log. 
                  You can also trigger a manual ping event to test the connection.
                </p>
              </div>

              <div className="pt-2">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Security Note</AlertTitle>
                  <AlertDescription>
                    Keep your webhook secret secure. It's used to verify that webhook requests come from GitHub.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}