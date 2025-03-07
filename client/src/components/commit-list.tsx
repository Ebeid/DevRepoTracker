import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface Commit {
  hash: string;
  message: string;
  author: {
    name: string;
    email: string;
    avatar: string;
  };
  date: string;
}

// Mock data
const mockCommits: Commit[] = [
  {
    hash: "8f34c9d2",
    message: "Add authentication flow and user management",
    author: {
      name: "Alex Johnson",
      email: "alex@example.com",
      avatar: "https://github.com/shadcn.png",
    },
    date: "2024-03-07T10:30:00Z",
  },
  {
    hash: "6b2e1fa4",
    message: "Update README with installation instructions",
    author: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      avatar: "https://github.com/shadcn.png",
    },
    date: "2024-03-07T09:15:00Z",
  },
  {
    hash: "3a9d8c1e",
    message: "Fix responsive layout issues in dashboard\n\nThis commit addresses various responsive design issues in the dashboard component, specifically:\n- Fixed overflow in mobile view\n- Adjusted grid layout for tablets\n- Improved spacing in card components",
    author: {
      name: "Mike Brown",
      email: "mike@example.com",
      avatar: "https://github.com/shadcn.png",
    },
    date: "2024-03-07T08:45:00Z",
  },
];

export default function CommitList() {
  return (
    <div className="space-y-4">
      {mockCommits.map((commit) => (
        <Card key={commit.hash} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
          <div className="flex items-start gap-4">
            <Avatar className="w-8 h-8">
              <AvatarImage src={commit.author.avatar} />
              <AvatarFallback>
                {commit.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h3 className="font-medium leading-none flex-1 truncate">
                  {commit.message.split('\n')[0]}
                </h3>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {commit.hash}
                  </code>
                </div>
              </div>
              {commit.message.includes('\n') && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {commit.message.split('\n').slice(2).join('\n')}
                </p>
              )}
              <div className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium">{commit.author.name}</span>
                {' committed '}
                {format(new Date(commit.date), 'MMM d, yyyy h:mm a')}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
