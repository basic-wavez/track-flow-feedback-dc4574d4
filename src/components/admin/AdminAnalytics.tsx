
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface DailyData {
  date: string;
  count: number;
}

interface AnalyticsSummary {
  totalUsers: number;
  totalTracks: number;
  totalFeedback: number;
  activeShareLinks: number;
  storageUsed: number; // In MB
}

const AdminAnalytics = () => {
  const [registrations, setRegistrations] = useState<DailyData[]>([]);
  const [uploads, setUploads] = useState<DailyData[]>([]);
  const [feedback, setFeedback] = useState<DailyData[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalUsers: 0,
    totalTracks: 0,
    totalFeedback: 0,
    activeShareLinks: 0,
    storageUsed: 0,
  });
  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);
  
  const fetchAnalyticsData = async () => {
    setLoading(true);
    
    try {
      // Fetch summary statistics
      const [
        { count: userCount },
        { count: trackCount },
        { count: feedbackCount },
        { count: shareLinkCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tracks').select('*', { count: 'exact', head: true }),
        supabase.from('feedback').select('*', { count: 'exact', head: true }),
        supabase.from('share_links').select('*', { count: 'exact', head: true }),
      ]);
      
      // Calculate approximate storage used (This is an approximation since we don't have direct access to storage metrics)
      // We'll assume each track uses about 10MB on average between the original and compressed versions
      const estimatedStorageUsed = (trackCount || 0) * 10; // MB
      
      setSummary({
        totalUsers: userCount || 0,
        totalTracks: trackCount || 0,
        totalFeedback: feedbackCount || 0,
        activeShareLinks: shareLinkCount || 0,
        storageUsed: estimatedStorageUsed,
      });
      
      // Fetch daily statistics
      const days = parseInt(timeRange);
      const [
        { data: registrationsData },
        { data: uploadsData },
        { data: feedbackData },
      ] = await Promise.all([
        supabase.rpc('get_user_registrations_by_date', { days_back: days }),
        supabase.rpc('get_track_uploads_by_date', { days_back: days }),
        supabase.rpc('get_feedback_by_date', { days_back: days }),
      ]);
      
      // Fill in missing dates
      const filledRegistrations = fillMissingDates(registrationsData || [], days);
      const filledUploads = fillMissingDates(uploadsData || [], days);
      const filledFeedback = fillMissingDates(feedbackData || [], days);
      
      setRegistrations(filledRegistrations);
      setUploads(filledUploads);
      setFeedback(filledFeedback);
      
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to fill in missing dates
  const fillMissingDates = (data: DailyData[], days: number): DailyData[] => {
    const result: DailyData[] = [];
    const dateMap = new Map<string, number>();
    
    // Create a map of existing data
    data.forEach(item => {
      dateMap.set(item.date, item.count);
    });
    
    // Generate a complete date range
    for (let i = days; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      result.push({
        date,
        count: dateMap.get(date) || 0,
      });
    }
    
    return result;
  };
  
  // Get human readable date for chart tooltip
  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d');
  };
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalUsers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Total Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalTracks}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Feedback Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalFeedback}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Active Share Links</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.activeShareLinks}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary.storageUsed < 1000 
                ? `${summary.storageUsed} MB` 
                : `${(summary.storageUsed / 1000).toFixed(1)} GB`}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Time Range Filter */}
      <div className="flex justify-end">
        <Tabs
          value={timeRange}
          onValueChange={setTimeRange}
          className="w-[400px]"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
            <TabsTrigger value="90">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Charts */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-wip-pink border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* User Registrations Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Registrations</CardTitle>
              <CardDescription>New user signups over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} registrations`, 'Users']}
                    labelFormatter={formatDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#FF4ECF" 
                    name="Users" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Track Uploads Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Track Uploads</CardTitle>
              <CardDescription>New tracks uploaded over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uploads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} uploads`, 'Tracks']}
                    labelFormatter={formatDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    name="Tracks" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Feedback Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Submissions</CardTitle>
              <CardDescription>Feedback given on tracks over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedback}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [`${value} submissions`, 'Feedback']}
                    labelFormatter={formatDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    name="Feedback" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Combined Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Activity</CardTitle>
              <CardDescription>Combined view of all platform metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={
                    registrations.map((item, index) => ({
                      date: item.date,
                      Users: item.count,
                      Tracks: uploads[index]?.count || 0,
                      Feedback: feedback[index]?.count || 0
                    }))
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    labelFormatter={formatDate}
                  />
                  <Legend />
                  <Bar dataKey="Users" fill="#FF4ECF" />
                  <Bar dataKey="Tracks" fill="#3B82F6" />
                  <Bar dataKey="Feedback" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
