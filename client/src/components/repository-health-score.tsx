import { Repository } from "@shared/schema";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle, Clock, Award } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from "recharts";
import { useToast } from "@/hooks/use-toast";

interface RepositoryHealthScoreProps {
  repository: Repository;
}

// Health score categories and their weights
const HEALTH_CATEGORIES = {
  activity: { weight: 0.3, label: "Activity" },
  engagement: { weight: 0.2, label: "Engagement" },
  maintenance: { weight: 0.25, label: "Maintenance" },
  collaboration: { weight: 0.25, label: "Collaboration" }
};

// Colors for different health score ranges
const COLORS = {
  excellent: "#10b981", // green
  good: "#3b82f6",      // blue
  fair: "#f59e0b",      // amber
  poor: "#ef4444"       // red
};

// Score rating thresholds
const SCORE_RATINGS = {
  excellent: 80,
  good: 60,
  fair: 40
  // Below 40 is poor
};

export default function RepositoryHealthScore({ repository }: RepositoryHealthScoreProps) {
  const [showScore, setShowScore] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  // Calculate the health score
  const calculateHealthScore = () => {
    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      setShowScore(true);
      setIsCalculating(false);
    }, 1200);
  };

  // Calculate the activity score (0-100)
  const getActivityScore = () => {
    let score = 0;
    
    // Weekly commit count - weight heavily
    score += Math.min(repository.weeklyCommitCount * 5, 50);
    
    // Recent commits - weight based on how recent
    if (repository.lastCommitDate) {
      const daysSinceLastCommit = Math.floor(
        (new Date().getTime() - new Date(repository.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastCommit < 7) score += 25;
      else if (daysSinceLastCommit < 30) score += 15;
      else if (daysSinceLastCommit < 90) score += 5;
    }
    
    // Contributors - more is generally better
    score += Math.min(repository.contributorsCount * 5, 25);
    
    return Math.min(score, 100);
  };

  // Calculate the engagement score (0-100)
  const getEngagementScore = () => {
    let score = 0;
    
    // Stars - popularity indicator
    score += Math.min(repository.stars / 5, 40);
    
    // Watchers - interest indicator
    score += Math.min(repository.watchers * 2, 30);
    
    // Forks - usage/contribution indicator
    score += Math.min(repository.forks * 2, 30);
    
    return Math.min(score, 100);
  };

  // Calculate the maintenance score (0-100)
  const getMaintenanceScore = () => {
    let score = 50; // Start neutral
    
    // Open issues - too many is bad
    const issueDeduction = Math.min(repository.openIssues * 2, 30);
    score -= issueDeduction;
    
    // If has topic tags - good documentation
    if (repository.topics && repository.topics.length > 0) {
      score += Math.min(repository.topics.length * 5, 20);
    }
    
    // If has language specified - properly categorized
    if (repository.language) {
      score += 10;
    }
    
    // Private repos often have better maintenance
    if (repository.isPrivate) {
      score += 10;
    }
    
    return Math.max(Math.min(score, 100), 0);
  };

  // Calculate the collaboration score (0-100)
  const getCollaborationScore = () => {
    let score = 0;
    
    // Contributors count - more contributors means more collaboration
    score += Math.min(repository.contributorsCount * 10, 60);
    
    // Forks also indicate collaboration potential
    score += Math.min(repository.forks * 5, 40);
    
    return Math.min(score, 100);
  };

  // Get overall weighted health score
  const getOverallHealthScore = () => {
    const scores = {
      activity: getActivityScore(),
      engagement: getEngagementScore(),
      maintenance: getMaintenanceScore(),
      collaboration: getCollaborationScore()
    };
    
    let overallScore = 0;
    for (const [category, score] of Object.entries(scores)) {
      overallScore += score * HEALTH_CATEGORIES[category].weight;
    }
    
    return Math.round(overallScore);
  };

  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= SCORE_RATINGS.excellent) return COLORS.excellent;
    if (score >= SCORE_RATINGS.good) return COLORS.good;
    if (score >= SCORE_RATINGS.fair) return COLORS.fair;
    return COLORS.poor;
  };

  // Get rating label based on score
  const getScoreRating = (score) => {
    if (score >= SCORE_RATINGS.excellent) return "Excellent";
    if (score >= SCORE_RATINGS.good) return "Good";
    if (score >= SCORE_RATINGS.fair) return "Fair";
    return "Needs Improvement";
  };

  // Prepare data for pie chart
  const getCategoryScores = () => {
    return [
      { name: "Activity", value: getActivityScore(), color: "#3b82f6" },
      { name: "Engagement", value: getEngagementScore(), color: "#8b5cf6" },
      { name: "Maintenance", value: getMaintenanceScore(), color: "#10b981" },
      { name: "Collaboration", value: getCollaborationScore(), color: "#f59e0b" }
    ];
  };

  const healthScore = getOverallHealthScore();
  const scoreColor = getScoreColor(healthScore);
  const scoreRating = getScoreRating(healthScore);
  const categoryScores = getCategoryScores();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-4 h-4" />
          Repository Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showScore ? (
          <div className="flex flex-col items-center justify-center p-8">
            <p className="mb-4 text-center text-muted-foreground">
              Get an instant analysis of your repository's health based on activity, 
              engagement, maintenance, and collaboration metrics.
            </p>
            <Button 
              onClick={calculateHealthScore} 
              disabled={isCalculating}
              className="mt-2"
            >
              {isCalculating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Calculate Health Score
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center">
              <div 
                className="text-5xl font-bold flex items-center justify-center w-24 h-24 rounded-full border-4"
                style={{ borderColor: scoreColor, color: scoreColor }}
              >
                {healthScore}
              </div>
              <p className="mt-2 text-lg font-medium" style={{ color: scoreColor }}>
                {scoreRating}
              </p>
            </div>
            
            <div className="h-[250px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryScores}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Score: ${value}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryScores.map((category) => (
                <div 
                  key={category.name} 
                  className="border rounded p-2 flex flex-col items-center"
                >
                  <div className="text-sm text-muted-foreground">{category.name}</div>
                  <div className="text-xl font-semibold" style={{ color: category.color }}>
                    {category.value}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-1 flex items-center gap-1">
                {healthScore >= SCORE_RATINGS.good ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                Improvement Suggestions
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {healthScore < 90 && (
                  <li>• Commit more regularly to improve activity score</li>
                )}
                {getEngagementScore() < 70 && (
                  <li>• Promote your repository to gain more stars and watchers</li>
                )}
                {getMaintenanceScore() < 70 && (
                  <li>• Address open issues to improve maintenance score</li>
                )}
                {repository.topics?.length < 3 && (
                  <li>• Add more descriptive topics to improve discoverability</li>
                )}
                {getCollaborationScore() < 60 && (
                  <li>• Encourage more contributors to join the project</li>
                )}
              </ul>
            </div>
            
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => setShowScore(false)}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
