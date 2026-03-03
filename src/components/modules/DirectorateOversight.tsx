import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const directorates = [
  {
    id: 'DIR-001',
    name: 'Standard & Evaluation',
    formation: 'Alpha Command',
    complianceScore: 94,
    lastInspection: '2024-01-15',
    nextInspection: '2024-04-15',
    status: 'compliant',
    trends: [
      { month: 'Oct', score: 88 },
      { month: 'Nov', score: 91 },
      { month: 'Dec', score: 89 },
      { month: 'Jan', score: 94 },
    ],
    recentReports: [
      { id: 'RPT-001', type: 'Operational Readiness', date: '2024-01-15', score: 94 },
      { id: 'RPT-002', type: 'Security Audit', date: '2023-10-20', score: 88 },
    ]
  },
  {
    id: 'DIR-002',
    name: 'Safety & Manual',
    formation: 'Support Command',
    complianceScore: 78,
    lastInspection: '2024-01-10',
    nextInspection: '2024-03-10',
    status: 'at_risk',
    trends: [
      { month: 'Oct', score: 82 },
      { month: 'Nov', score: 79 },
      { month: 'Dec', score: 75 },
      { month: 'Jan', score: 78 },
    ],
    recentReports: [
      { id: 'RPT-003', type: 'Supply Chain Audit', date: '2024-01-10', score: 78 },
      { id: 'RPT-004', type: 'Inventory Check', date: '2023-11-15', score: 82 },
    ]
  },
  {
    id: 'DIR-003',
    name: 'Project Monitoring',
    formation: 'Tech Command',
    complianceScore: 91,
    lastInspection: '2024-01-20',
    nextInspection: '2024-04-20',
    status: 'compliant',
    trends: [
      { month: 'Oct', score: 87 },
      { month: 'Nov', score: 89 },
      { month: 'Dec', score: 90 },
      { month: 'Jan', score: 91 },
    ],
    recentReports: [
      { id: 'RPT-005', type: 'Security Compliance', date: '2024-01-20', score: 91 },
      { id: 'RPT-006', type: 'System Audit', date: '2023-12-10', score: 90 },
    ]
  },
  {
    id: 'DIR-004',
    name: 'Standard & Evaluation',
    formation: 'Strategic Command',
    complianceScore: 96,
    lastInspection: '2024-01-25',
    nextInspection: '2024-04-25',
    status: 'excellent',
    trends: [
      { month: 'Oct', score: 93 },
      { month: 'Nov', score: 94 },
      { month: 'Dec', score: 95 },
      { month: 'Jan', score: 96 },
    ],
    recentReports: [
      { id: 'RPT-007', type: 'Data Security Audit', date: '2024-01-25', score: 96 },
      { id: 'RPT-008', type: 'Access Control Review', date: '2023-12-20', score: 95 },
    ]
  },
];

const complianceData = [
  { name: 'Operations', score: 94, target: 90 },
  { name: 'Logistics', score: 78, target: 90 },
  { name: 'Communications', score: 91, target: 90 },
  { name: 'Intelligence', score: 96, target: 90 },
];

interface DirectorateOversightProps {
  userRole: 'super_admin' | 'evaluator' | 'directorate_officer' | null;
}

export default function DirectorateOversight({ userRole }: DirectorateOversightProps) {
  const [selectedDirectorate, setSelectedDirectorate] = useState<typeof directorates[0] | null>(null);
  // Use userRole for conditional rendering
  const canViewDetails = userRole === 'super_admin' || userRole === 'directorate_officer';

  const getStatusBadge = (status: string) => {
    const styles = {
      compliant: 'bg-green-500/20 text-green-400 border-green-500/30',
      at_risk: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      excellent: 'bg-[#38b6ff]/20 text-[#38b6ff] border-[#38b6ff]/30',
      non_compliant: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status as keyof typeof styles] || styles.compliant;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#38b6ff';
    if (score >= 75) return '#EAB308';
    return '#EF4444';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#F2F5FA]">Directorate Oversight</h1>
        <p className="text-[#A9B3C2] mt-1">Compliance tracking and performance trends</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Total Directorates</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">4</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Compliant</p>
            <p className="text-3xl font-bold text-green-400 mt-2">3</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">At Risk</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">1</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Avg Compliance</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">89.8%</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Chart */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardHeader>
          <CardTitle className="text-[#F2F5FA]">Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,245,250,0.08)" />
                <XAxis dataKey="name" stroke="#A9B3C2" fontSize={12} />
                <YAxis stroke="#A9B3C2" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)', borderRadius: '8px' }}
                  labelStyle={{ color: '#F2F5FA' }}
                />
                <Bar dataKey="score" fill="#38b6ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="rgba(242,245,250,0.1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Directorates List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {directorates.map((directorate) => (
          <Card key={directorate.id} className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#F2F5FA]">{directorate.name}</h3>
                  <p className="text-sm text-[#A9B3C2]">{directorate.formation}</p>
                </div>
                <Badge variant="outline" className={getStatusBadge(directorate.status)}>
                  {directorate.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-[#0B0F17] rounded-lg">
                  <p className="text-xs text-[#A9B3C2]">Compliance Score</p>
                  <p className={`text-2xl font-bold`} style={{ color: getScoreColor(directorate.complianceScore) }}>
                    {directorate.complianceScore}%
                  </p>
                </div>
                <div className="p-3 bg-[#0B0F17] rounded-lg">
                  <p className="text-xs text-[#A9B3C2]">Next Inspection</p>
                  <p className="text-sm text-[#F2F5FA] mt-1">{directorate.nextInspection}</p>
                </div>
              </div>

              <div className="h-32 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={directorate.trends}>
                    <defs>
                      <linearGradient id={`gradient-${directorate.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38b6ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#38b6ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#38b6ff" 
                      fill={`url(#gradient-${directorate.id})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {canViewDetails && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full border-[rgba(242,245,250,0.12)]"
                      onClick={() => setSelectedDirectorate(directorate)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{selectedDirectorate?.name || directorate.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#0B0F17] rounded-lg">
                          <p className="text-sm text-[#A9B3C2]">Formation</p>
                          <p className="text-[#F2F5FA]">{directorate.formation}</p>
                        </div>
                        <div className="p-4 bg-[#0B0F17] rounded-lg">
                          <p className="text-sm text-[#A9B3C2]">Current Score</p>
                          <p className="text-2xl font-bold" style={{ color: getScoreColor(directorate.complianceScore) }}>
                            {directorate.complianceScore}%
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-[#A9B3C2] mb-2">Recent Reports</h4>
                        <div className="space-y-2">
                          {directorate.recentReports.map((report) => (
                            <div key={report.id} className="flex items-center justify-between p-3 bg-[#0B0F17] rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-[#A9B3C2]" />
                                <div>
                                  <p className="text-sm text-[#F2F5FA]">{report.type}</p>
                                  <p className="text-xs text-[#A9B3C2]">{report.date}</p>
                                </div>
                              </div>
                              <span className={`text-sm font-medium`} style={{ color: getScoreColor(report.score) }}>
                                {report.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[#0B0F17] rounded-lg">
                        <div>
                          <p className="text-sm text-[#A9B3C2]">Last Inspection</p>
                          <p className="text-[#F2F5FA]">{directorate.lastInspection}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-[#A9B3C2]">Next Due</p>
                          <p className="text-[#F2F5FA]">{directorate.nextInspection}</p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
