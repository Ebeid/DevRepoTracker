import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code, 
  FileCode, 
  Folder, 
  FolderTree, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Download, 
  Filter, 
  Search,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff
} from "lucide-react";

interface CodeComplexityHeatmapProps {
  repositoryId: number;
  repositoryName: string;
}

// Mock code structure for demonstration
const generateMockCodeStructure = () => {
  // Generate mock directory structure
  const mockStructure = {
    name: "root",
    type: "directory",
    children: [
      {
        name: "src",
        type: "directory",
        children: [
          {
            name: "components",
            type: "directory",
            children: [
              {
                name: "Button.tsx",
                type: "file",
                language: "typescript",
                complexity: 12,
                lines: 122,
                functions: 4,
                dependencies: 3,
                issues: 1,
                lastModified: "2023-11-15"
              },
              {
                name: "Card.tsx",
                type: "file",
                language: "typescript",
                complexity: 8,
                lines: 89,
                functions: 3,
                dependencies: 2,
                issues: 0,
                lastModified: "2023-12-05"
              },
              {
                name: "Dialog.tsx",
                type: "file",
                language: "typescript",
                complexity: 25,
                lines: 215,
                functions: 8,
                dependencies: 6,
                issues: 4,
                lastModified: "2023-10-20"
              },
              {
                name: "Form.tsx",
                type: "file",
                language: "typescript",
                complexity: 32,
                lines: 310,
                functions: 12,
                dependencies: 8,
                issues: 7,
                lastModified: "2023-09-12"
              }
            ]
          },
          {
            name: "hooks",
            type: "directory",
            children: [
              {
                name: "useAuth.ts",
                type: "file",
                language: "typescript",
                complexity: 18,
                lines: 142,
                functions: 6,
                dependencies: 4,
                issues: 2,
                lastModified: "2023-10-18"
              },
              {
                name: "useForm.ts",
                type: "file",
                language: "typescript",
                complexity: 15,
                lines: 120,
                functions: 5,
                dependencies: 3,
                issues: 1,
                lastModified: "2023-11-25"
              }
            ]
          },
          {
            name: "utils",
            type: "directory",
            children: [
              {
                name: "api.ts",
                type: "file",
                language: "typescript",
                complexity: 10,
                lines: 87,
                functions: 7,
                dependencies: 2,
                issues: 0,
                lastModified: "2023-12-12"
              },
              {
                name: "helpers.ts",
                type: "file",
                language: "typescript",
                complexity: 5,
                lines: 45,
                functions: 6,
                dependencies: 0,
                issues: 0,
                lastModified: "2023-12-15"
              }
            ]
          },
          {
            name: "App.tsx",
            type: "file",
            language: "typescript",
            complexity: 22,
            lines: 180,
            functions: 5,
            dependencies: 12,
            issues: 3,
            lastModified: "2023-11-10"
          },
          {
            name: "main.tsx",
            type: "file",
            language: "typescript",
            complexity: 4,
            lines: 25,
            functions: 1,
            dependencies: 3,
            issues: 0,
            lastModified: "2023-12-20"
          }
        ]
      },
      {
        name: "server",
        type: "directory",
        children: [
          {
            name: "controllers",
            type: "directory",
            children: [
              {
                name: "authController.ts",
                type: "file",
                language: "typescript",
                complexity: 28,
                lines: 220,
                functions: 9,
                dependencies: 5,
                issues: 5,
                lastModified: "2023-09-28"
              },
              {
                name: "userController.ts",
                type: "file",
                language: "typescript",
                complexity: 24,
                lines: 190,
                functions: 8,
                dependencies: 4,
                issues: 3,
                lastModified: "2023-10-05"
              }
            ]
          },
          {
            name: "models",
            type: "directory",
            children: [
              {
                name: "User.ts",
                type: "file",
                language: "typescript",
                complexity: 6,
                lines: 75,
                functions: 2,
                dependencies: 2,
                issues: 0,
                lastModified: "2023-11-18"
              },
              {
                name: "Post.ts",
                type: "file",
                language: "typescript",
                complexity: 5,
                lines: 68,
                functions: 2,
                dependencies: 2,
                issues: 0,
                lastModified: "2023-11-22"
              }
            ]
          },
          {
            name: "routes",
            type: "directory",
            children: [
              {
                name: "authRoutes.ts",
                type: "file",
                language: "typescript",
                complexity: 8,
                lines: 65,
                functions: 4,
                dependencies: 3,
                issues: 1,
                lastModified: "2023-11-05"
              },
              {
                name: "userRoutes.ts",
                type: "file",
                language: "typescript",
                complexity: 7,
                lines: 58,
                functions: 4,
                dependencies: 3,
                issues: 1,
                lastModified: "2023-11-08"
              },
              {
                name: "postRoutes.ts",
                type: "file",
                language: "typescript",
                complexity: 6,
                lines: 52,
                functions: 3,
                dependencies: 3,
                issues: 0,
                lastModified: "2023-11-12"
              }
            ]
          },
          {
            name: "middleware",
            type: "directory",
            children: [
              {
                name: "auth.ts",
                type: "file",
                language: "typescript",
                complexity: 16,
                lines: 85,
                functions: 4,
                dependencies: 3,
                issues: 2,
                lastModified: "2023-10-15"
              },
              {
                name: "validation.ts",
                type: "file",
                language: "typescript",
                complexity: 14,
                lines: 95,
                functions: 6,
                dependencies: 2,
                issues: 1,
                lastModified: "2023-10-22"
              }
            ]
          },
          {
            name: "server.ts",
            type: "file",
            language: "typescript",
            complexity: 18,
            lines: 110,
            functions: 4,
            dependencies: 10,
            issues: 2,
            lastModified: "2023-11-05"
          }
        ]
      },
      {
        name: "tests",
        type: "directory",
        children: [
          {
            name: "unit",
            type: "directory",
            children: [
              {
                name: "auth.test.ts",
                type: "file",
                language: "typescript",
                complexity: 8,
                lines: 115,
                functions: 6,
                dependencies: 4,
                issues: 1,
                lastModified: "2023-11-28"
              },
              {
                name: "components.test.ts",
                type: "file",
                language: "typescript",
                complexity: 10,
                lines: 168,
                functions: 8,
                dependencies: 5,
                issues: 2,
                lastModified: "2023-11-20"
              }
            ]
          },
          {
            name: "integration",
            type: "directory",
            children: [
              {
                name: "api.test.ts",
                type: "file",
                language: "typescript",
                complexity: 12,
                lines: 195,
                functions: 7,
                dependencies: 6,
                issues: 2,
                lastModified: "2023-11-15"
              }
            ]
          }
        ]
      }
    ]
  };

  return mockStructure;
};

const calculateComplexityColor = (complexity: number) => {
  // Color scale from green (low complexity) to red (high complexity)
  if (complexity < 8) return "#10b981"; // green
  if (complexity < 15) return "#a3e635"; // lime
  if (complexity < 22) return "#facc15"; // yellow
  if (complexity < 30) return "#f97316"; // orange
  return "#ef4444"; // red
};

// Get complexity rating
const getComplexityRating = (complexity: number) => {
  if (complexity < 8) return "Low";
  if (complexity < 15) return "Moderate";
  if (complexity < 22) return "High";
  if (complexity < 30) return "Very High";
  return "Extreme";
};

// Flatten tree structure for heatmap view
const flattenTree = (node: any, path = "", result: any[] = []) => {
  const currentPath = path ? `${path}/${node.name}` : node.name;

  if (node.type === "file") {
    result.push({
      id: currentPath,
      path: currentPath,
      name: node.name,
      complexity: node.complexity,
      lines: node.lines,
      functions: node.functions,
      dependencies: node.dependencies,
      issues: node.issues,
      lastModified: node.lastModified,
      language: node.language
    });
  } else if (node.children) {
    node.children.forEach((child: any) => flattenTree(child, currentPath, result));
  }

  return result;
};

const CodeComplexityHeatmap: React.FC<CodeComplexityHeatmapProps> = ({ repositoryId, repositoryName }) => {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("heatmap");
  const [selectedPath, setSelectedPath] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["root"]);
  const [filterComplexity, setFilterComplexity] = useState([0, 40]);
  const [searchQuery, setSearchQuery] = useState("");
  const [treeVisible, setTreeVisible] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("complexity");
  const [codeData, setCodeData] = useState<any>(null);
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    setLoading(true);

    // Simulate API call delay
    const timer = setTimeout(() => {
      const data = generateMockCodeStructure();
      setCodeData(data);
      setLoading(false);

      toast({
        title: "Code complexity analysis complete",
        description: `Analyzed repository: ${repositoryName}`,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [repositoryName, toast]);

  // Flatten data for heatmap view
  const flatData = useMemo(() => {
    if (!codeData) return [];
    return flattenTree(codeData);
  }, [codeData]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    if (!flatData.length) return [];

    return flatData.filter((item: any) => {
      // Apply complexity filter
      if (item.complexity < filterComplexity[0] || item.complexity > filterComplexity[1]) {
        return false;
      }

      // Apply search filter
      if (searchQuery && !item.path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [flatData, filterComplexity, searchQuery]);

  // Get complexity statistics
  const stats = useMemo(() => {
    if (!flatData.length) return { avg: 0, max: 0, total: 0, high: 0 };

    const avg = flatData.reduce((sum: number, item: any) => sum + item.complexity, 0) / flatData.length;
    const max = Math.max(...flatData.map((item: any) => item.complexity));
    const highComplexity = flatData.filter((item: any) => item.complexity > 20).length;

    return {
      avg: parseFloat(avg.toFixed(1)),
      max,
      total: flatData.length,
      high: highComplexity
    };
  }, [flatData]);

  // Handle folder expansion
  const toggleFolder = (path: string) => {
    if (expandedFolders.includes(path)) {
      setExpandedFolders(expandedFolders.filter(p => p !== path && !p.startsWith(`${path}/`)));
    } else {
      setExpandedFolders([...expandedFolders, path]);
    }
  };

  // Recursive function to render the tree view
  const renderTree = (node: any, currentPath = "", depth = 0) => {
    const path = currentPath ? `${currentPath}/${node.name}` : node.name;
    const isExpanded = expandedFolders.includes(path);
    const isSelected = selectedPath === path;

    // Skip items that don't match search
    if (searchQuery && !path.toLowerCase().includes(searchQuery.toLowerCase()) && node.type === "file") {
      return null;
    }

    // For file nodes
    if (node.type === "file") {
      // Skip files outside complexity filter
      if (node.complexity < filterComplexity[0] || node.complexity > filterComplexity[1]) {
        return null;
      }

      return (
        <motion.div
          key={path}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: depth * 0.05 }}
          className={`pl-${depth * 4 + 4} py-1 flex items-center cursor-pointer hover:bg-accent/50 rounded transition-colors ${isSelected ? 'bg-accent' : ''}`}
          onClick={() => setSelectedPath(path)}
        >
          <FileCode size={16} className="mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{node.name}</span>
          <div 
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: `${calculateComplexityColor(node.complexity)}20` }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: calculateComplexityColor(node.complexity) }}
            />
            <span style={{ color: calculateComplexityColor(node.complexity) }}>
              {node.complexity}
            </span>
          </div>
        </motion.div>
      );
    }

    // For directory nodes
    if (node.type === "directory") {
      // Check if any children match the filter criteria
      let hasMatchingChildren = false;
      if (node.children) {
        hasMatchingChildren = node.children.some((child: any) => {
          if (child.type === "file") {
            return (child.complexity >= filterComplexity[0] && 
                   child.complexity <= filterComplexity[1] &&
                   (!searchQuery || child.name.toLowerCase().includes(searchQuery.toLowerCase())));
          } else {
            // Recursively check directories
            const checkDir = (dir: any) => {
              if (dir.type === "file") {
                return (dir.complexity >= filterComplexity[0] && 
                       dir.complexity <= filterComplexity[1] &&
                       (!searchQuery || dir.name.toLowerCase().includes(searchQuery.toLowerCase())));
              } else if (dir.children) {
                return dir.children.some((c: any) => checkDir(c));
              }
              return false;
            };
            return checkDir(child);
          }
        });
      }

      // Skip directories with no matching children
      if (!hasMatchingChildren && searchQuery) {
        return null;
      }

      return (
        <div key={path}>
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: depth * 0.05 }}
            className={`pl-${depth * 4} py-1 flex items-center cursor-pointer hover:bg-accent/50 rounded transition-colors ${isSelected ? 'bg-accent' : ''}`}
            onClick={() => toggleFolder(path)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="mr-1 flex-shrink-0" />
            ) : (
              <ChevronRight size={16} className="mr-1 flex-shrink-0" />
            )}
            <Folder size={16} className="mr-2 flex-shrink-0" />
            <span className="text-sm font-medium">{node.name}</span>
          </motion.div>

          {isExpanded && node.children && (
            <div>
              {node.children.map((child: any) => renderTree(child, path, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Render heatmap cell
  const renderHeatmapCell = (file: any) => {
    const size = Math.max(30, Math.min(100, 30 + (file.complexity * 2)));
    const metric = selectedMetric === "complexity" ? file.complexity : 
                  selectedMetric === "lines" ? file.lines :
                  selectedMetric === "issues" ? file.issues : file.dependencies;

    // Adjust color based on selected metric
    const getColor = () => {
      if (selectedMetric === "complexity") return calculateComplexityColor(file.complexity);
      if (selectedMetric === "lines") {
        if (file.lines < 50) return "#10b981";
        if (file.lines < 100) return "#a3e635";
        if (file.lines < 200) return "#facc15";
        if (file.lines < 300) return "#f97316";
        return "#ef4444";
      }
      if (selectedMetric === "issues") {
        if (file.issues === 0) return "#10b981";
        if (file.issues < 2) return "#a3e635";
        if (file.issues < 4) return "#facc15";
        if (file.issues < 6) return "#f97316";
        return "#ef4444";
      }
      // Dependencies
      if (file.dependencies < 3) return "#10b981";
      if (file.dependencies < 5) return "#a3e635";
      if (file.dependencies < 8) return "#facc15";
      if (file.dependencies < 10) return "#f97316";
      return "#ef4444";
    };

    const color = getColor();
    const fileName = file.name.split('/').pop();

    return (
      <TooltipProvider key={file.id}>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <motion.div
              className="rounded-md flex items-center justify-center cursor-pointer border hover:shadow-md transition-shadow relative"
              style={{ 
                width: `${size}px`, 
                height: `${size}px`,
                backgroundColor: `${color}30`,
                borderColor: color
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedPath(file.path)}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-xs font-medium truncate max-w-[80%] text-center">
                {fileName}
              </span>

              {file.issues > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                  {file.issues}
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-[300px]">
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.path}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                <div className="text-xs">Complexity: <span className="font-medium">{file.complexity}</span></div>
                <div className="text-xs">Lines: <span className="font-medium">{file.lines}</span></div>
                <div className="text-xs">Functions: <span className="font-medium">{file.functions}</span></div>
                <div className="text-xs">Dependencies: <span className="font-medium">{file.dependencies}</span></div>
                <div className="text-xs">Issues: <span className="font-medium">{file.issues}</span></div>
                <div className="text-xs">Modified: <span className="font-medium">{file.lastModified}</span></div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // File detail view
  const renderFileDetail = () => {
    if (!selectedPath) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <FileCode size={48} className="mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Select a file</h3>
          <p className="text-sm">
            Click on a file in the tree view or heatmap to see detailed complexity metrics.
          </p>
        </div>
      );
    }

    const file = flatData.find((f: any) => f.path === selectedPath);
    if (!file) return null;

    // Get code snippets with high complexity (mock data)
    const complexSnippets = [
      {
        line: 45,
        code: "function calculateTaxes(income, deductions, credits, state, filingStatus, dependents) {",
        complexity: Math.round(file.complexity * 0.8)
      },
      {
        line: 78,
        code: "if (user && user.permissions.some(p => p.includes('admin') || specialRoles.includes(p))) {",
        complexity: Math.round(file.complexity * 0.6)
      },
      {
        line: 112,
        code: "return items.filter(item => filters.every(filter => filter.validate(item)));",
        complexity: Math.round(file.complexity * 0.5)
      }
    ];

    // Filter snippets based on file complexity
    const snippets = complexSnippets.filter(s => s.complexity <= file.complexity);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileCode size={20} />
              {file.name}
            </h3>
            <p className="text-sm text-muted-foreground">{file.path}</p>
          </div>

          <Badge 
            variant="outline" 
            className="font-medium"
            style={{ 
              backgroundColor: `${calculateComplexityColor(file.complexity)}20`,
              color: calculateComplexityColor(file.complexity),
              borderColor: calculateComplexityColor(file.complexity)
            }}
          >
            {getComplexityRating(file.complexity)} Complexity
          </Badge>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Complexity</div>
            <div className="text-2xl font-bold" style={{ color: calculateComplexityColor(file.complexity) }}>
              {file.complexity}
            </div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Lines</div>
            <div className="text-2xl font-bold">{file.lines}</div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Functions</div>
            <div className="text-2xl font-bold">{file.functions}</div>
          </div>
          <div className="p-3 rounded-lg border">
            <div className="text-sm text-muted-foreground">Dependencies</div>
            <div className="text-2xl font-bold">{file.dependencies}</div>
          </div>
        </div>

        {file.issues > 0 && (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle size={16} />
              <h4 className="font-medium">Code Quality Issues: {file.issues}</h4>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400/80 mt-1">
              This file has {file.issues} complexity-related issues that may make it harder to maintain.
            </p>
          </div>
        )}

        {snippets.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-1">
              <AlertTriangle size={14} className="text-amber-500" />
              Complex Code Snippets
            </h4>
            <div className="space-y-2">
              {snippets.map((snippet, i) => (
                <div key={i} className="rounded border p-2 text-sm bg-muted/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Line {snippet.line}</span>
                    <span className="font-medium">
                      Complexity: {snippet.complexity}
                    </span>
                  </div>
                  <pre className="text-xs overflow-x-auto p-1">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2">
          <h4 className="font-medium text-sm mb-1">Recommendations</h4>
          <ul className="text-sm space-y-1">
            {file.complexity > 20 && (
              <li className="flex items-start gap-1">
                <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>Consider breaking this file into smaller, more focused components</span>
              </li>
            )}
            {file.functions > 8 && (
              <li className="flex items-start gap-1">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>This file contains too many functions, split related functionality</span>
              </li>
            )}
            {file.dependencies > 8 && (
              <li className="flex items-start gap-1">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>High number of dependencies may indicate tight coupling</span>
              </li>
            )}
            {file.lines > 200 && (
              <li className="flex items-start gap-1">
                <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>File exceeds recommended size of 200 lines</span>
              </li>
            )}
            {file.complexity < 10 && file.issues === 0 && (
              <li className="flex items-start gap-1">
                <Info size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>This file has good complexity metrics and no issues</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  // Export complexity data
  const handleExport = () => {
    toast({
      title: "Complexity data exported",
      description: "Code complexity metrics have been exported successfully",
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Code className="w-5 h-5" />
              Code Complexity Heat Map
            </CardTitle>
            <CardDescription>
              Visualize code complexity patterns across {repositoryName}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              title="Export complexity data"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div 
              className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-muted-foreground">Analyzing code complexity...</p>
          </div>
        ) : (
          <div className="space-y-4"><div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Avg. Complexity</div>
                <div className="text-2xl font-bold">{stats.avg}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Max Complexity</div>
                <div className="text-2xl font-bold">{stats.max}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">Files Analyzed</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="p-3 rounded-lg border">
                <div className="text-sm text-muted-foreground">High Complexity Files</div>
                <div className="text-2xl font-bold">{stats.high}</div>
              </div>
            </div>

            <div className="border-t border-b py-3 flex flex-wrap gap-2 items-center justify-between">
              <Tabs value={activeView} onValueChange={setActiveView} className="w-auto">
                <TabsList>
                  <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
                  <TabsTrigger value="treeview">Tree View</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1" 
                    onClick={() => setTreeVisible(!treeVisible)}
                  >
                    {treeVisible ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span className="text-xs">Hide Tree</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">Show Tree</span>
                      </>
                    )}
                  </Button>
                </div>

                {activeView === "heatmap" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Metric:</span>
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Select Metric" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="complexity">Complexity</SelectItem>
                        <SelectItem value="lines">Lines of Code</SelectItem>
                        <SelectItem value="issues">Issues</SelectItem>
                        <SelectItem value="dependencies">Dependencies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm whitespace-nowrap">Complexity Range:</span>
                  <div className="w-[140px]">
                    <Slider
                      value={filterComplexity}
                      min={0}
                      max={40}
                      step={1}
                      onValueChange={setFilterComplexity}
                    />
                  </div>
                  <span className="text-xs">
                    {filterComplexity[0]}-{filterComplexity[1]}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="h-8 w-full rounded-md border pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: treeVisible ? "250px 1fr" : "1fr" }}>
              {/* File tree */}
              {treeVisible && (
                <div className="border rounded-lg p-2 overflow-auto h-[500px]">
                  <div className="py-2">
                    <h3 className="text-sm font-medium flex items-center gap-1 mb-2">
                      <FolderTree className="h-4 w-4" />
                      Repository Structure
                    </h3>
                    {renderTree(codeData)}
                  </div>
                </div>
              )}

              {/* Main content area */}
              <div className="border rounded-lg p-4 h-[500px] overflow-auto">
                <TabsContent value="heatmap" className="m-0 h-full">
                  {!filteredData.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <AlertTriangle className="h-10 w-10 text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium">No Matching Files</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md">
                        {searchQuery ? (
                          <>
                            No files found matching <span className="font-medium">"{searchQuery}"</span> within complexity range {filterComplexity[0]}-{filterComplexity[1]}.
                          </>
                        ) : (
                          <>
                            No files found within complexity range {filterComplexity[0]}-{filterComplexity[1]}.
                          </>
                        )}
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                        setFilterComplexity([0, 40]);
                        setSearchQuery("");
                      }}>
                        Reset Filters
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3 content-start">
                      {filteredData.map((file) => renderHeatmapCell(file))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="treeview" className="m-0 h-full">
                  {renderFileDetail()}
                </TabsContent>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CodeComplexityHeatmap;