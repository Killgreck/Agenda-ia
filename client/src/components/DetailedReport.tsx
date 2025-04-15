import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from "recharts";
import { RefreshCw, Lightbulb, CheckCircle, Calendar } from "lucide-react";
import { useStats, DetailedStats } from "@/hooks/useStats";
import { useToast } from "@/hooks/use-toast";

export default function DetailedReport() {
  const { toast } = useToast();
  const { 
    currentWeekData, 
    historicalData = [], 
    generateWeeklyReport,
    refreshAllStats,
    refetchWeeklyStats,
    isLoading
  } = useStats();
  
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Force refresh data when component mounts
  useEffect(() => {
    console.log("DetailedReport mounted, refreshing statistics...");
    const refreshData = async () => {
      try {
        // Check if we have the refreshAllStats function
        if (refreshAllStats) {
          await refreshAllStats();
        } else if (refetchWeeklyStats) {
          await refetchWeeklyStats();
        } else {
          // Fallback to old method
          await generateWeeklyReport();
        }
      } catch (error) {
        console.error("Error refreshing stats on mount:", error);
      }
    };
    
    refreshData();
  }, []);
  
  // Handle regenerate weekly report
  const handleRegenerateReport = async () => {
    setIsRegenerating(true);
    try {
      if (refreshAllStats) {
        await refreshAllStats();
      } else {
        await generateWeeklyReport();
      }
      toast({
        title: "Report Regenerated",
        description: "Weekly statistics have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate weekly report.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Format data for charts - sorted by week
  const sortedHistoricalData = [...(historicalData || [])].sort((a, b) => {
    return new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime();
  });
  
  // Create a key to force re-render when data changes but maintain the same layout
  const chartKey = historicalData?.length > 0 ? 'stats-chart' : 'stats-chart-empty';
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Productivity Analytics</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRegenerateReport}
          disabled={isRegenerating}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Current Week Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Task Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {currentWeekData?.tasksCompletionRate || 0}%
                </div>
                <Progress value={currentWeekData?.tasksCompletionRate || 0} className="h-2" />
                <div className="mt-2 text-sm text-gray-500">
                  {currentWeekData?.tasksCompleted || 0} of {currentWeekData?.tasksTotal || 0} tasks completed
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Productivity Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {currentWeekData?.productivityScore || 0}%
                </div>
                <Progress value={currentWeekData?.productivityScore || 0} className="h-2 bg-gray-200 [&>*]:bg-green-600" />
                <div className="mt-2 text-sm text-gray-500">
                  Average daily rating: {currentWeekData?.avgProductivity?.toFixed(1) || 0}/5
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-amber-500" />
                  AI Suggestion Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {currentWeekData?.aiSuggestionsRate || 0}%
                </div>
                <Progress value={currentWeekData?.aiSuggestionsRate || 0} className="h-2 bg-gray-200 [&>*]:bg-amber-500" />
                <div className="mt-2 text-sm text-gray-500">
                  {currentWeekData?.aiSuggestionsAccepted || 0} of {currentWeekData?.aiSuggestionsTotal || 0} suggestions used
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Weekly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel" 
                      tick={{ fontSize: 12 }}
                      height={50}
                    />
                    <YAxis 
                      yAxisId="left"
                      orientation="left"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`]}
                      labelFormatter={(label) => `Week: ${label}`}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="tasksCompletionRate"
                      name="Tasks Completed"
                      stroke="#0ea5e9"
                      activeDot={{ r: 8 }}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="productivityScore"
                      name="Productivity"
                      stroke="#10b981"
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="aiSuggestionsRate"
                      name="AI Usage"
                      stroke="#f59e0b"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Task Completion by Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel" 
                      height={50}
                    />
                    <YAxis 
                      width={45}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Bar
                      dataKey="tasksCompleted"
                      name="Completed"
                      stackId="a"
                      fill="#0ea5e9"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey={(data) => data.tasksTotal - data.tasksCompleted}
                      name="Incomplete"
                      stackId="a"
                      fill="#e2e8f0"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel" 
                      height={50}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`]}
                      labelFormatter={(label) => `Week: ${label}`}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tasksCompletionRate"
                      name="Completion Rate"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Productivity Tab */}
        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel"
                      height={50}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`]}
                      labelFormatter={(label) => `Week: ${label}`}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="productivityScore"
                      name="Productivity Score"
                      stroke="#10b981"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Average Daily Productivity Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel"
                      height={50}
                    />
                    <YAxis 
                      domain={[0, 5]}
                      tickFormatter={(value) => `${value}`}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}/5`]}
                      labelFormatter={(label) => `Week: ${label}`}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgProductivity"
                      name="Daily Rating"
                      stroke="#10b981"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestion Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel"
                      height={50}
                    />
                    <YAxis 
                      width={45}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Bar
                      dataKey="aiSuggestionsAccepted"
                      name="Accepted"
                      stackId="a"
                      fill="#f59e0b"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey={(data) => data.aiSuggestionsTotal - data.aiSuggestionsAccepted}
                      name="Declined"
                      stackId="a"
                      fill="#e2e8f0"
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Suggestion Acceptance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    key={chartKey}
                    data={sortedHistoricalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weekLabel"
                      height={50}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={45}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`]}
                      labelFormatter={(label) => `Week: ${label}`}
                      isAnimationActive={false}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="aiSuggestionsRate"
                      name="Acceptance Rate"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}