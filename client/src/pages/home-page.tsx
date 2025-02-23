import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SiGithub } from "react-icons/si";
import RepositoryList from "@/components/repository-list";
import AddRepository from "@/components/add-repository";
import SearchBar from "@/components/search-bar";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SiGithub className="w-6 h-6" />
            <span className="font-semibold">Repository Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <h1 className="text-3xl font-bold">Your Repositories</h1>
            <AddRepository />
          </div>

          <SearchBar />
          <RepositoryList />
        </div>
      </main>
    </div>
  );
}
