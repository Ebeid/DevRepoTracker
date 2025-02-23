import { Repository } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, GitFork, Star, Eye, GitPullRequest } from "lucide-react";

interface RepositoryAnalyticsProps {
  repository: Repository;
}

export default function RepositoryAnalytics({ repository }: RepositoryAnalyticsProps) {
  const stats = [
    { name: "Stars", value: repository.stars, icon: Star },
    { name: "Forks", value: repository.forks, icon: GitFork },
    { name: "Watchers", value: repository.watchers, icon: Eye },
    { name: "Issues", value: repository.openIssues, icon: GitPullRequest },
  ];

  const contributionData = [
    { name: "Weekly Commits", value: repository.weeklyCommitCount },
    { name: "Contributors", value: repository.contributorsCount },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Repository Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <div key={stat.name} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{stat.name}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {repository.language && (
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repository.language}</div>
          </CardContent>
        </Card>
      )}

      {repository.topics && repository.topics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Topics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {repository.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-1 text-sm rounded-full bg-primary/10 text-primary"
                >
                  {topic}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
