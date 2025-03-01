import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Users, GitBranch, Code, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface TeamProductivityHeatmapProps {
  repositoryId: number;
  repositoryName: string;
}

// Generate mock team members
const mockTeamMembers = [
  { id: 1, name: "Alex Johnson", avatar: "AJ", role: "Lead Developer" },
  { id: 2, name: "Sam Chen", avatar: "SC", role: "Frontend Engineer" },
  { id: 3, name: "Taylor Kim", avatar: "TK", role: "Backend Engineer" },
  { id: 4, name: "Jamie Smith", avatar: "JS", role: "DevOps Engineer" },
  { id: 5, name: "Riley Garcia", avatar: "RG", role: "QA Engineer" },
];

// Generate mock activity types
const activityTypes = [
  { id: "commits", label: "Commits", icon: Code },
  { id: "pull_requests", label: "Pull Requests", icon: GitBranch },
  { id: "reviews", label: "Reviews", icon: Activity },
  { id: "issues", label: "Issues", icon: Activity },
];

// Generate mock data for days in current month
const generateMockData = (teamMembers, daysInMonth, maxActivity = 20) => {
  const data = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  teamMembers.forEach(member => {
    const memberData = {
      memberId: member.id,
      memberName: member.name,
      activities: []
    };

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      // Don't generate future dates
      if (date > now) break;
      
      // Generate random activity counts (weighted to make weekends less active)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const commitCount = Math.floor(Math.random() * (isWeekend ? 5 : maxActivity));
      const prCount = Math.floor(Math.random() * (isWeekend ? 2 : 5));
      const reviewCount = Math.floor(Math.random() * (isWeekend ? 2 : 8));
      const issueCount = Math.floor(Math.random() * (isWeekend ? 1 : 6));
      
      const totalActivity = commitCount + prCount + reviewCount + issueCount;
      
      memberData.activities.push({
        date: date.toISOString().split('T')[0],
        day,
        month: currentMonth + 1,
        year: currentYear,
        commits: commitCount,
        pull_requests: prCount,
        reviews: reviewCount,
        issues: issueCount,
        totalActivity
      });
    }
    
    data.push(memberData);
  });

  return data;
};

// Get number of days in current month
const getDaysInCurrentMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

// Get activity level class based on count
const getActivityLevelClass = (count) => {
  if (count === 0) return "bg-gray-100";
  if (count < 3) return "bg-green-100";
  if (count < 6) return "bg-green-200";
  if (count < 10) return "bg-green-300";
  if (count < 15) return "bg-green-400";
  return "bg-green-500";
};

// Get activity level label
const getActivityLabel = (count) => {
  if (count === 0) return "No activity";
  if (count < 3) return "Low activity";
  if (count < 6) return "Moderate activity";
  if (count < 10) return "Active";
  if (count < 15) return "Very active";
  return "Extremely active";
};

export default function TeamProductivityHeatmap({ repositoryId, repositoryName }: TeamProductivityHeatmapProps) {
  const [timeRange, setTimeRange] = useState("month");
  const [activityType, setActivityType] = useState("totalActivity");
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call to fetch data
    setIsLoading(true);
    
    setTimeout(() => {
      const daysInMonth = getDaysInCurrentMonth();
      const generatedData = generateMockData(mockTeamMembers, daysInMonth);
      setData(generatedData);
      setIsLoading(false);
      
      toast({
        title: "Productivity data loaded",
        description: `Displaying team productivity for ${repositoryName}`,
      });
    }, 1200);
  }, [repositoryName, toast]);

  // Filter data based on selected member
  const filteredData = selectedMember === "all" 
    ? data 
    : data.filter(d => d.memberId === parseInt(selectedMember, 10));

  // Get day labels (1-31) for the current month
  const dayLabels = Array.from({ length: getDaysInCurrentMonth() }, (_, i) => i + 1);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Productivity Heatmap
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <Tabs defaultValue="month" onValueChange={setTimeRange} className="w-[200px]">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="quarter">Quarter</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select 
                value={selectedMember} 
                onValueChange={setSelectedMember}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All team members</SelectItem>
                  {mockTeamMembers.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={activityType} 
                onValueChange={setActivityType}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalActivity">Total Activity</SelectItem>
                  <SelectItem value="commits">Commits</SelectItem>
                  <SelectItem value="pull_requests">Pull Requests</SelectItem>
                  <SelectItem value="reviews">Reviews</SelectItem>
                  <SelectItem value="issues">Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <motion.div 
                className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Loading team productivity data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Activity level legend */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Activity level:</span>
                {[0, 2, 5, 9, 14, 20].map((level, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-4 h-4 rounded ${getActivityLevelClass(level)}`}></div>
                    <span className="text-xs">{i === 0 ? 'None' : i === 5 ? '15+' : level}</span>
                  </div>
                ))}
              </div>
              
              {/* Day labels row */}
              <div className="pl-[120px] grid grid-cols-31 gap-1">
                {dayLabels.map(day => (
                  <div key={day} className="flex justify-center">
                    <span className="text-xs text-muted-foreground">{day}</span>
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="space-y-2">
                {filteredData.map((memberData) => (
                  <motion.div 
                    key={memberData.memberId}
                    className="flex items-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-[120px] flex items-center">
                      <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-2">
                        {memberData.memberName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm truncate">{memberData.memberName}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-31 gap-1">
                      {memberData.activities.map((activity) => (
                        <motion.div
                          key={activity.date}
                          className={`aspect-square rounded ${getActivityLevelClass(activity[activityType])} relative group cursor-pointer`}
                          whileHover={{ scale: 1.2, zIndex: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-white text-xs rounded p-1 w-[140px] z-10 pointer-events-none">
                            <div className="font-bold mb-1">{activity.date}</div>
                            <div className="grid grid-cols-2 gap-1">
                              <div>Commits:</div>
                              <div className="text-right">{activity.commits}</div>
                              <div>PRs:</div>
                              <div className="text-right">{activity.pull_requests}</div>
                              <div>Reviews:</div>
                              <div className="text-right">{activity.reviews}</div>
                              <div>Issues:</div>
                              <div className="text-right">{activity.issues}</div>
                            </div>
                            <div className="mt-1 font-bold">
                              {getActivityLabel(activity[activityType])}
                            </div>
                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black"></div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Summary statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                {activityTypes.map((type) => {
                  const TypeIcon = type.icon;
                  // Calculate total for this activity type
                  const total = filteredData.reduce((sum, member) => 
                    sum + member.activities.reduce((daySum, day) => daySum + day[type.id], 0)
                  , 0);
                  
                  return (
                    <motion.div 
                      key={type.id}
                      className="flex flex-col items-center p-3 rounded-lg border"
                      whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                    >
                      <TypeIcon className="w-5 h-5 text-primary mb-1" />
                      <div className="text-2xl font-bold">{total}</div>
                      <div className="text-xs text-muted-foreground">{type.label}</div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Export and print buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Report generated",
                      description: "The team productivity report has been generated and is ready for download.",
                    });
                  }}
                >
                  Export Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "Preparing to print",
                      description: "The productivity heatmap is being prepared for printing.",
                    });
                  }}
                >
                  Print View
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
