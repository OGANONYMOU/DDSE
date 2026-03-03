import { useState } from 'react';
import { 
  FileBarChart, Download, TrendingUp, PieChart as PieChartIcon, BarChart3, Activity,
  CheckCircle, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const inspectionTrendData = [
  { month: 'Aug', inspections: 18, score: 82 },
  { month: 'Sep', inspections: 22, score: 85 },
  { month: 'Oct', inspections: 25, score: 87 },
  { month: 'Nov', inspections: 20, score: 86 },
  { month: 'Dec', inspections: 28, score: 89 },
  { month: 'Jan', inspections: 24, score: 91 },
];

const directoratePerformance = [
  { name: 'Operations', score: 94, inspections: 45 },
  { name: 'Logistics', score: 78, inspections: 38 },
  { name: 'Communications', score: 91, inspections: 42 },
  { name: 'Intelligence', score: 96, inspections: 50 },
];

const riskDistribution = [
  { name: 'Low Risk', value: 65, color: '#38b6ff' },
  { name: 'Medium Risk', value: 25, color: '#EAB308' },
  { name: 'High Risk', value: 10, color: '#EF4444' },
];

const recentReports = [
  { id: 'RPT-2024-001', title: 'Monthly Inspection Summary', type: 'Inspection', date: '2024-01-31', status: 'completed', size: '2.4 MB' },
  { id: 'RPT-2024-002', title: 'Q4 Compliance Report', type: 'Compliance', date: '2024-01-15', status: 'completed', size: '5.1 MB' },
  { id: 'RPT-2024-003', title: 'Armoury Audit Report', type: 'Audit', date: '2024-01-20', status: 'completed', size: '3.2 MB' },
  { id: 'RPT-2024-004', title: 'Safety Assessment Summary', type: 'Safety', date: '2024-01-25', status: 'generating', size: '-' },
];

interface ReportingEngineProps {
  userRole: 'super_admin' | 'evaluator' | 'directorate_officer' | null;
}

export default function ReportingEngine({ userRole }: ReportingEngineProps) {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Use userRole for conditional rendering
  const canGenerateReport = userRole === 'super_admin' || userRole === 'evaluator';

  const handleGenerateReport = () => {
    setIsGenerating(true);
    toast.info('Generating report...');
    setTimeout(() => {
      setIsGenerating(false);
      toast.success('Report generated successfully');
    }, 3000);
  };

  const handleDownload = (reportId: string) => {
    toast.success(`Downloading ${reportId}...`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F2F5FA]">Reporting Engine</h1>
        <p className="text-[#A9B3C2] mt-1">Analytics, exports, and audit history</p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A9B3C2]">Total Inspections</p>
                <p className="text-3xl font-bold text-[#F2F5FA] mt-2">137</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#38b6ff]/10 flex items-center justify-center">
                <FileBarChart className="w-6 h-6 text-[#38b6ff]" />
              </div>
            </div>
            <p className="text-sm text-[#38b6ff] mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12% from last period
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A9B3C2]">Avg Score</p>
                <p className="text-3xl font-bold text-[#38b6ff] mt-2">87.3%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#38b6ff]/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#38b6ff]" />
              </div>
            </div>
            <p className="text-sm text-[#38b6ff] mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +3.2% improvement
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A9B3C2]">Compliance Rate</p>
                <p className="text-3xl font-bold text-green-400 mt-2">94.2%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm text-green-400 mt-2">Above target (90%)</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#A9B3C2]">Pending Reports</p>
                <p className="text-3xl font-bold text-yellow-400 mt-2">3</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-sm text-yellow-400 mt-2">In generation queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#38b6ff]" />
              Inspection Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inspectionTrendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38b6ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#38b6ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,245,250,0.08)" />
                  <XAxis dataKey="month" stroke="#A9B3C2" fontSize={12} />
                  <YAxis stroke="#A9B3C2" fontSize={12} domain={[70, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="score" stroke="#38b6ff" fill="url(#colorScore)" strokeWidth={2} name="Avg Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#38b6ff]" />
              Directorate Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={directoratePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,245,250,0.08)" />
                  <XAxis dataKey="name" stroke="#A9B3C2" fontSize={11} />
                  <YAxis stroke="#A9B3C2" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)', borderRadius: '8px' }} />
                  <Bar dataKey="score" fill="#38b6ff" radius={[4, 4, 0, 0]} name="Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#38b6ff]" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base">Generate Custom Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm text-[#A9B3C2] mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_quarter">Last Quarter</SelectItem>
                    <SelectItem value="last_year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-[#A9B3C2] mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="inspection">Inspection Report</SelectItem>
                    <SelectItem value="compliance">Compliance Report</SelectItem>
                    <SelectItem value="audit">Audit Report</SelectItem>
                    <SelectItem value="safety">Safety Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                {canGenerateReport && (
                  <Button 
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90"
                  >
                    <FileBarChart className="w-4 h-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-[#0B0F17] text-[#A9B3C2]">PDF</Badge>
              <Badge variant="outline" className="bg-[#0B0F17] text-[#A9B3C2]">CSV</Badge>
              <Badge variant="outline" className="bg-[#0B0F17] text-[#A9B3C2]">Excel</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardHeader>
          <CardTitle className="text-[#F2F5FA]">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-[#0B0F17] rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#38b6ff]/10 flex items-center justify-center">
                    <FileBarChart className="w-5 h-5 text-[#38b6ff]" />
                  </div>
                  <div>
                    <p className="text-[#F2F5FA] font-medium">{report.title}</p>
                    <div className="flex items-center gap-3 text-sm text-[#A9B3C2]">
                      <span>{report.id}</span>
                      <span>•</span>
                      <span>{report.type}</span>
                      <span>•</span>
                      <span>{report.date}</span>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={
                    report.status === 'completed' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }>
                    {report.status}
                  </Badge>
                  {report.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(report.id)}
                      className="border-[rgba(242,245,250,0.12)]"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
