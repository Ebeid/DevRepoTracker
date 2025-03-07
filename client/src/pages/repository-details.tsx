import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Repository } from "@shared/schema";
import { Loader2, ArrowLeft, ExternalLink, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Link } from "wouter";
import TeamProductivityHeatmap from "@/components/team-productivity-heatmap";

// Mock data for branches and users
const mockBranches = [
  { id: "main", name: "main" },
  { id: "develop", name: "develop" },
  { id: "feature/auth", name: "feature/auth" },
  { id: "feature/analytics", name: "feature/analytics" },
];

const mockUsers = [
  { id: "1", name: "Alex Johnson" },
  { id: "2", name: "Sarah Chen" },
  { id: "3", name: "Mike Brown" },
  { id: "4", name: "Lisa Wong" },
];

export default function RepositoryDetailsPage() {
  const [, params] = useRoute("/repository/:id");
  const id = params?.id ? parseInt(params.id, 10) : undefined;

  // Filter states
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

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
        {/* Header Section */}
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="commits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="experimental">Experimental Features</TabsTrigger>
          </TabsList>

          <TabsContent value="commits">
            <div className="space-y-6">
              <Card>
                <CardContent className="py-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedUser}
                      onValueChange={setSelectedUser}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All users</SelectItem>
                        {mockUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <DateRangePicker
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="experimental">
            <div className="space-y-6">
              {/* Team Productivity */}
              <Card>
                <CardContent>
                  <TeamProductivityHeatmap
                    repositoryId={repository.id}
                    repositoryName={repository.name}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}