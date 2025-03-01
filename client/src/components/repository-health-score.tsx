import { Repository } from "@shared/schema";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, AlertCircle, CheckCircle, Clock, Award, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

// Generate mock historical data for trends
const generateHistoricalData = (currentScore, count = 5) => {
  const data = [];
  let prevScore = currentScore - Math.floor(Math.random() * 15) - 5; // Start lower

  for (let i = count; i > 0; i--) {
    // Keep scores within reasonable bounds
    prevScore = Math.max(20, Math.min(95, prevScore));

    data.push({
      date: `${i} week${i > 1 ? 's' : ''} ago`,
      score: prevScore
    });

    // Random adjustment for next score
    prevScore += Math.floor(Math.random() * 10) - 3;
  }

  // Add current score
  data.push({
    date: "Current",
    score: currentScore
  });

  return data;
};

export default function RepositoryHealthScore({ repository }: RepositoryHealthScoreProps) {
  const [showScore, setShowScore] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [categoryScoresVisible, setCategoryScoresVisible] = useState(false);
  const { toast } = useToast();

  // Calculate the health score
  const calculateHealthScore = () => {
    setIsCalculating(true);

    // Simulate calculation delay
    setTimeout(() => {
      setShowScore(true);
      setIsCalculating(false);

      // Generate historical data based on the current score
      setHistoricalData(generateHistoricalData(healthScore));

      // Trigger animations sequentially
      setTimeout(() => setScoreVisible(true), 200);
      setTimeout(() => setCategoryScoresVisible(true), 800);
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

  // Get trend indicator based on historical data
  const getTrendIndicator = (history) => {
    if (!history || history.length < 2) return { icon: Minus, color: "text-gray-500", label: "Stable" };

    const currentScore = history[history.length - 1].score;
    const previousScore = history[history.length - 2].score;
    const diff = currentScore - previousScore;

    if (diff > 5) return { icon: ArrowUp, color: "text-green-500", label: "Improving" };
    if (diff < -5) return { icon: ArrowDown, color: "text-red-500", label: "Declining" };
    return { icon: Minus, color: "text-amber-500", label: "Stable" };
  };

  // Prepare data for pie chart
  const getCategoryScores = () => {
    return [
      { name: "Activity", value: getActivityScore(), color: "#3b82f6", prevValue: getActivityScore() - Math.floor(Math.random() * 10) - 5 },
      { name: "Engagement", value: getEngagementScore(), color: "#8b5cf6", prevValue: getEngagementScore() - Math.floor(Math.random() * 10) - 5 },
      { name: "Maintenance", value: getMaintenanceScore(), color: "#10b981", prevValue: getMaintenanceScore() - Math.floor(Math.random() * 10) - 5 },
      { name: "Collaboration", value: getCollaborationScore(), color: "#f59e0b", prevValue: getCollaborationScore() - Math.floor(Math.random() * 10) - 5 }
    ];
  };

  const healthScore = getOverallHealthScore();
  const scoreColor = getScoreColor(healthScore);
  const scoreRating = getScoreRating(healthScore);
  const categoryScores = getCategoryScores();
  const trend = getTrendIndicator(historicalData);

  // Get CSS classes for trend
  const getTrendClasses = (category) => {
    const current = category.value;
    const previous = category.prevValue;
    const diff = current - previous;

    if (diff > 5) return "text-green-500";
    if (diff < -5) return "text-red-500";
    return "text-amber-500";
  };

  // Get trend icon for a category
  const getCategoryTrendIcon = (category) => {
    const current = category.value;
    const previous = category.prevValue;
    const diff = current - previous;

    if (diff > 5) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (diff < -5) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-amber-500" />;
  };

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
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={scoreVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
            >
              <div 
                className="text-5xl font-bold flex items-center justify-center w-24 h-24 rounded-full border-4 relative"
                style={{ borderColor: scoreColor, color: scoreColor }}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {healthScore}
                </motion.span>

                {/* Trend indicator badge */}
                <motion.div 
                  className={`absolute -top-1 -right-1 rounded-full p-1 ${trend.color} bg-background border border-current`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <trend.icon className="w-4 h-4" />
                </motion.div>
              </div>
              <p className="mt-2 text-lg font-medium" style={{ color: scoreColor }}>
                {scoreRating}
              </p>
              <div className="flex items-center gap-1 text-sm mt-1">
                <trend.icon className={`w-3 h-3 ${trend.color}`} />
                <span className={trend.color}>{trend.label}</span>
              </div>
            </motion.div>

            <motion.div 
              className="h-[200px] mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scoreColor} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={scoreColor} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke={scoreColor} 
                    fillOpacity={1}
                    fill="url(#scoreColor)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 gap-2 mt-4"
              initial={{ opacity: 0 }}
              animate={categoryScoresVisible ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {categoryScores.map((category, index) => (
                <motion.div 
                  key={category.name} 
                  className="border rounded p-2 flex flex-col items-center relative overflow-hidden"
                  initial={{ x: index % 2 === 0 ? -20 : 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (index * 0.15), duration: 0.5 }}
                >
                  <div className="text-sm text-muted-foreground">{category.name}</div>
                  <div className="text-xl font-semibold flex items-center gap-1" style={{ color: category.color }}>
                    {category.value}
                    <span className="text-xs font-normal">/ 100</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs mt-1">
                    {getCategoryTrendIcon(category)}
                    <span className={getTrendClasses(category)}>
                      {Math.abs(category.value - category.prevValue)}%
                    </span>
                  </div>

                  {/* Background progress bar */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${category.value}%`, 
                      backgroundColor: category.color,
                      opacity: 0.3
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="mt-4 p-3 bg-muted rounded-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
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
            </motion.div>

            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => {
                setShowScore(false);
                setScoreVisible(false);
                setCategoryScoresVisible(false);
              }}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}