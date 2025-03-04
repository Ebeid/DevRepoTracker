import { Repository } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GitCommit,
  GitPullRequest,
  Users,
  Star,
  GitFork,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface RepositoryEvolutionTimelineProps {
  repository: Repository;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'creation' | 'commit' | 'star' | 'fork' | 'contributor';
  title: string;
  description: string;
  icon: any;
}

export default function RepositoryEvolutionTimeline({
  repository,
}: RepositoryEvolutionTimelineProps) {
  // Query to fetch timeline events
  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: [`/api/repositories/${repository.id}/timeline`],
    // Temporary mock data for demonstration
    queryFn: async () => {
      const mockEvents: TimelineEvent[] = [
        {
          id: '1',
          date: new Date().toISOString(),
          type: 'creation',
          title: 'Repository Created',
          description: `${repository.name} was created`,
          icon: Calendar,
        },
        {
          id: '2',
          date: new Date(Date.now() - 86400000).toISOString(),
          type: 'commit',
          title: 'First Commit',
          description: 'Initial project setup',
          icon: GitCommit,
        },
        {
          id: '3',
          date: new Date(Date.now() - 172800000).toISOString(),
          type: 'star',
          title: 'First Star',
          description: 'Repository received its first star',
          icon: Star,
        },
      ];
      return mockEvents;
    },
  });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'creation':
        return 'text-blue-500';
      case 'commit':
        return 'text-green-500';
      case 'star':
        return 'text-amber-500';
      case 'fork':
        return 'text-purple-500';
      case 'contributor':
        return 'text-pink-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Repository Evolution Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative pl-10 pb-8 last:pb-0"
              >
                {/* Timeline dot */}
                <motion.div
                  className={`absolute left-3 w-3 h-3 rounded-full border-2 bg-background ${getEventColor(
                    event.type
                  )} -translate-x-1/2`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.2 + 0.2 }}
                />

                <div className="bg-card rounded-lg p-4 border shadow-sm">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${getEventColor(
                        event.type
                      )} bg-opacity-10`}
                    >
                      <event.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(event.date), "PPp")}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
