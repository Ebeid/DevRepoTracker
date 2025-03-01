import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Users, GitBranch, Code, AlertCircle, RefreshCw, Maximize2, Download } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface DeveloperCollaborationNetworkProps {
  repositoryId: number;
  repositoryName: string;
}

// Mock developer data
const mockDevelopers = [
  { id: 1, name: "Alex Johnson", avatar: "AJ", role: "Lead Developer", team: "Core", commits: 243, prs: 56 },
  { id: 2, name: "Sam Chen", avatar: "SC", role: "Frontend Engineer", team: "UI", commits: 187, prs: 42 },
  { id: 3, name: "Taylor Kim", avatar: "TK", role: "Backend Engineer", team: "API", commits: 215, prs: 38 },
  { id: 4, name: "Jamie Smith", avatar: "JS", role: "DevOps Engineer", team: "Infra", commits: 145, prs: 28 },
  { id: 5, name: "Riley Garcia", avatar: "RG", role: "QA Engineer", team: "QA", commits: 112, prs: 63 },
  { id: 6, name: "Morgan Lee", avatar: "ML", role: "UX Designer", team: "UI", commits: 57, prs: 31 },
  { id: 7, name: "Casey Wilson", avatar: "CW", role: "Data Scientist", team: "Data", commits: 94, prs: 22 },
  { id: 8, name: "Jordan Taylor", avatar: "JT", role: "Security Engineer", team: "Infra", commits: 126, prs: 43 },
];

// Generate mock collaboration connections
const generateCollaborationData = (developers) => {
  const nodes = developers.map(dev => ({
    id: dev.id,
    name: dev.name,
    avatar: dev.avatar,
    role: dev.role,
    team: dev.team,
    commits: dev.commits,
    prs: dev.prs,
    // Size node based on commit activity
    size: 20 + (dev.commits / 25)
  }));

  const links = [];
  const maxLinks = 25; // Limit number of connections to avoid overcrowding
  let linkCount = 0;
  
  // Generate collaboration links (connections between developers)
  for (let i = 0; i < developers.length && linkCount < maxLinks; i++) {
    for (let j = i + 1; j < developers.length && linkCount < maxLinks; j++) {
      // Create stronger connections between same team members
      const sameTeam = developers[i].team === developers[j].team;
      
      // Create connections with varying strengths
      const randomFactor = Math.random();
      
      // Only create some connections, not all possible ones
      if (sameTeam || randomFactor > 0.5) {
        // Calculate weighted strength based on team and activity
        const baseStrength = sameTeam ? 0.7 : 0.3;
        const activityFactor = (developers[i].commits + developers[j].commits) / 500;
        const strength = Math.min(0.95, Math.max(0.1, baseStrength + activityFactor + (randomFactor * 0.2)));
        
        links.push({
          source: developers[i].id,
          target: developers[j].id,
          value: strength,
          // Number of shared PRs/code reviews
          collaborations: Math.floor(
            (developers[i].prs + developers[j].prs) * strength * (sameTeam ? 0.5 : 0.2)
          )
        });
        linkCount++;
      }
    }
  }

  return { nodes, links };
};

// Color scale for visualization
const getTeamColor = (team) => {
  const teamColors = {
    Core: "#3b82f6", // blue
    UI: "#8b5cf6",   // purple
    API: "#10b981",  // green
    Infra: "#f59e0b", // amber
    QA: "#ef4444",   // red
    Data: "#06b6d4"  // cyan
  };
  
  return teamColors[team] || "#6b7280"; // default gray
};

export default function DeveloperCollaborationNetwork({ repositoryId, repositoryName }: DeveloperCollaborationNetworkProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [viewMode, setViewMode] = useState("force"); // force, radial, chord
  const [highlightedDeveloper, setHighlightedDeveloper] = useState<number | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call to fetch collaboration data
    setIsLoading(true);
    
    setTimeout(() => {
      const data = generateCollaborationData(mockDevelopers);
      setNetworkData(data);
      setIsLoading(false);
      
      toast({
        title: "Collaboration network loaded",
        description: `Visualizing team connections for ${repositoryName}`,
      });
    }, 1500);
  }, [repositoryName, toast]);

  const handleExportNetwork = () => {
    toast({
      title: "Network exported",
      description: "Collaboration network data has been exported to CSV",
      icon: <CheckCircle className="h-4 w-4" />
    });
  };

  // Calculate network metrics
  const networkMetrics = useMemo(() => {
    if (!networkData.nodes.length) return null;
    
    const totalDevelopers = networkData.nodes.length;
    const totalConnections = networkData.links.length;
    const maxPossibleConnections = (totalDevelopers * (totalDevelopers - 1)) / 2;
    const networkDensity = totalConnections / maxPossibleConnections;
    
    // Calculate average collaborations per developer
    const totalCollaborations = networkData.links.reduce((sum, link) => sum + link.collaborations, 0);
    const avgCollaborations = totalCollaborations / totalDevelopers;
    
    // Find most connected developer
    const developerConnections = networkData.nodes.map(node => {
      const connections = networkData.links.filter(
        link => link.source === node.id || link.target === node.id
      ).length;
      return { id: node.id, name: node.name, connections };
    });
    
    const mostConnected = developerConnections.sort((a, b) => b.connections - a.connections)[0];
    
    return {
      totalDevelopers,
      totalConnections,
      networkDensity,
      avgCollaborations,
      mostConnected
    };
  }, [networkData]);

  // D3 force simulation would normally be used here
  // For this implementation, we'll use a simplified version with Framer Motion
  
  // Create positions for nodes in a force-directed layout
  const forceDirectedPositions = useMemo(() => {
    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Simple circular layout as placeholder for force-directed layout
    return networkData.nodes.map((node, index) => {
      const angle = (index / networkData.nodes.length) * 2 * Math.PI;
      const radius = 180;
      
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
  }, [networkData.nodes]);

  // Filter links based on highlighted developer
  const filteredLinks = useMemo(() => {
    if (!highlightedDeveloper) return networkData.links;
    
    return networkData.links.filter(
      link => link.source === highlightedDeveloper || link.target === highlightedDeveloper
    );
  }, [networkData.links, highlightedDeveloper]);

  return (
    <Card className={fullscreen ? "fixed inset-4 z-50 overflow-auto" : "mb-6"}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Developer Collaboration Network
          </CardTitle>
          <CardDescription>
            Visualize how team members collaborate across {repositoryName}
          </CardDescription>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportNetwork}
            title="Export network data"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div 
                className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-muted-foreground">Analyzing developer collaboration patterns...</p>
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="min-h-[500px]">
              {/* Network Visualization Panel */}
              <ResizablePanel defaultSize={75}>
                <div className="p-2 h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Select value={viewMode} onValueChange={setViewMode}>
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Select view mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="force">Force-directed</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                          <SelectItem value="chord">Chord diagram</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowLabels(!showLabels)}
                      >
                        {showLabels ? "Hide Labels" : "Show Labels"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select 
                        value={highlightedDeveloper ? String(highlightedDeveloper) : "all"} 
                        onValueChange={val => setHighlightedDeveloper(val === "all" ? null : Number(val))}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Highlight developer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All developers</SelectItem>
                          {networkData.nodes.map(node => (
                            <SelectItem key={node.id} value={String(node.id)}>
                              {node.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Network visualization */}
                  <div className="relative border rounded-lg bg-card h-[400px] overflow-hidden">
                    <div className="absolute inset-0">
                      {/* Links/Connections */}
                      <svg width="100%" height="100%" className="absolute inset-0">
                        {filteredLinks.map((link, index) => {
                          const source = forceDirectedPositions.find(n => n.id === link.source);
                          const target = forceDirectedPositions.find(n => n.id === link.target);
                          
                          if (!source || !target) return null;
                          
                          return (
                            <motion.line
                              key={`link-${index}`}
                              initial={{ opacity: 0 }}
                              animate={{ 
                                opacity: 0.7,
                                x1: source.x,
                                y1: source.y,
                                x2: target.x,
                                y2: target.y
                              }}
                              transition={{ duration: 0.5, delay: index * 0.01 }}
                              stroke="#9ca3af"
                              strokeWidth={link.value * 5}
                              strokeOpacity={0.4}
                            />
                          );
                        })}
                      </svg>
                      
                      {/* Nodes/Developers */}
                      {forceDirectedPositions.map((node) => {
                        const isHighlighted = 
                          !highlightedDeveloper || 
                          highlightedDeveloper === node.id || 
                          filteredLinks.some(l => 
                            (l.source === highlightedDeveloper && l.target === node.id) || 
                            (l.target === highlightedDeveloper && l.source === node.id)
                          );
                        
                        return (
                          <motion.div
                            key={`node-${node.id}`}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                              opacity: isHighlighted ? 1 : 0.3,
                              scale: isHighlighted ? 1 : 0.8,
                              x: node.x,
                              y: node.y,
                            }}
                            transition={{ type: "spring", duration: 0.8, delay: node.id * 0.05 }}
                            style={{ zIndex: isHighlighted ? 2 : 1 }}
                            whileHover={{ scale: 1.15, zIndex: 10 }}
                          >
                            <div 
                              className="rounded-full flex items-center justify-center border-2 border-background shadow-md relative cursor-pointer"
                              style={{ 
                                width: `${node.size}px`, 
                                height: `${node.size}px`,
                                backgroundColor: getTeamColor(node.team)
                              }}
                              title={`${node.name} (${node.role})`}
                            >
                              <span className="text-sm font-bold text-white">{node.avatar}</span>
                              
                              {/* Connection count badge */}
                              <div className="absolute -top-1 -right-1 bg-background rounded-full w-5 h-5 flex items-center justify-center text-[10px] border border-current">
                                {filteredLinks.filter(l => l.source === node.id || l.target === node.id).length}
                              </div>
                            </div>
                            
                            {/* Developer name label */}
                            {showLabels && (
                              <motion.div 
                                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap bg-background/80 text-xs rounded px-1 border"
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (node.id * 0.05) }}
                              >
                                {node.name}
                              </motion.div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs">
                    <span className="text-muted-foreground">Teams:</span>
                    {["Core", "UI", "API", "Infra", "QA", "Data"].map(team => (
                      <div key={team} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getTeamColor(team) }}
                        ></div>
                        <span>{team}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* Network Metrics Panel */}
              <ResizablePanel defaultSize={25}>
                <div className="p-4 h-full">
                  <h3 className="font-medium text-sm mb-3">Network Insights</h3>
                  
                  {networkMetrics && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">Developers</span>
                          <span className="text-lg font-semibold">{networkMetrics.totalDevelopers}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">Connections</span>
                          <span className="text-lg font-semibold">{networkMetrics.totalConnections}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">Network Density</span>
                          <span className="text-lg font-semibold">{(networkMetrics.networkDensity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-muted-foreground">Avg. Collaborations</span>
                          <span className="text-lg font-semibold">{networkMetrics.avgCollaborations.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Key Contributors</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: getTeamColor('Core') }}
                              >
                                <span className="text-xs text-white font-bold">
                                  {networkMetrics.mostConnected?.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{networkMetrics.mostConnected?.name}</div>
                                <div className="text-xs text-muted-foreground">Most connected developer</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold">
                              {networkMetrics.mostConnected?.connections} links
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Cross-team Collaboration</h4>
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-muted-foreground mr-2">Low</span>
                          <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${(networkMetrics.networkDensity * 100)}%` }}
                              transition={{ delay: 0.5, duration: 1 }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">High</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-2">Collaboration Insights</h4>
                        <div className="text-xs space-y-2">
                          {networkMetrics.networkDensity < 0.3 ? (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                              <p>Team collaboration appears siloed. Consider implementing cross-team initiatives.</p>
                            </div>
                          ) : networkMetrics.networkDensity > 0.7 ? (
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                              <p>Excellent team connectivity. Knowledge sharing is likely efficient in this repository.</p>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <GitBranch className="w-4 h-4 text-blue-500 mt-0.5" />
                              <p>Healthy collaboration patterns. The team shows good cross-functional communication.</p>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2">
                            <Code className="w-4 h-4 text-purple-500 mt-0.5" />
                            <p>
                              {networkMetrics.avgCollaborations > 10 
                                ? "High volume of code collaborations indicates active review practices." 
                                : "Consider establishing more robust code review practices to increase collaboration."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
