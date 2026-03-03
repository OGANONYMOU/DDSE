import { useState } from 'react';
import { 
  Plus, Search, Calendar, 
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface HazardReport {
  id: string;
  title: string;
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  reportedBy: string;
  reportedDate: string;
  status: 'open' | 'in_review' | 'mitigated' | 'closed';
  description: string;
  mitigation?: string;
}

const mockHazards: HazardReport[] = [
  {
    id: 'HZD-001',
    title: 'Uneven flooring in Armoury B',
    location: 'Armoury B - Section 3',
    severity: 'medium',
    category: 'Physical Hazard',
    reportedBy: 'Sgt. Miller',
    reportedDate: '2024-01-20',
    status: 'in_review',
    description: 'Floor tiles are loose and uneven, creating tripping hazard near weapon storage area.',
    mitigation: 'Maintenance scheduled for 2024-01-25'
  },
  {
    id: 'HZD-002',
    title: 'Faulty emergency lighting',
    location: 'Operations Center',
    severity: 'high',
    category: 'Safety Equipment',
    reportedBy: 'Lt. Johnson',
    reportedDate: '2024-01-18',
    status: 'open',
    description: 'Emergency exit lights not functioning in east corridor.',
  },
  {
    id: 'HZD-003',
    title: 'Chemical storage ventilation issue',
    location: 'Maintenance Depot',
    severity: 'critical',
    category: 'Chemical Hazard',
    reportedBy: 'Cpl. Davis',
    reportedDate: '2024-01-15',
    status: 'mitigated',
    description: 'Ventilation system failure in chemical storage room.',
    mitigation: 'Temporary exhaust fans installed. Permanent repair completed on 2024-01-19.'
  },
  {
    id: 'HZD-004',
    title: 'Missing safety signage',
    location: 'Firing Range',
    severity: 'low',
    category: 'Documentation',
    reportedBy: 'Sgt. Wilson',
    reportedDate: '2024-01-22',
    status: 'closed',
    description: 'Safety procedure signs faded and illegible.',
    mitigation: 'New signage installed and verified.'
  },
];

const severityData = [
  { name: 'Critical', value: 1, color: '#7F1D1D' },
  { name: 'High', value: 1, color: '#EF4444' },
  { name: 'Medium', value: 1, color: '#EAB308' },
  { name: 'Low', value: 1, color: '#38b6ff' },
];

const categoryData = [
  { name: 'Physical', count: 2 },
  { name: 'Safety Eq.', count: 1 },
  { name: 'Chemical', count: 1 },
  { name: 'Documentation', count: 1 },
];

interface SafetyAssessmentProps {
  userRole: 'super_admin' | 'evaluator' | 'directorate_officer' | null;
}

export default function SafetyAssessment({ userRole }: SafetyAssessmentProps) {
  const [hazards, setHazards] = useState<HazardReport[]>(mockHazards);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newHazard, setNewHazard] = useState<Partial<HazardReport>>({
    severity: 'medium',
    category: 'Physical Hazard',
  });

  const filteredHazards = hazards.filter(h => {
    const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || h.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || h.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openCount = hazards.filter(h => h.status === 'open').length;
  const criticalCount = hazards.filter(h => h.severity === 'critical' && h.status !== 'closed').length;
  const mitigatedCount = hazards.filter(h => h.status === 'mitigated' || h.status === 'closed').length;

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      critical: 'bg-red-900/40 text-red-300 border-red-700/50',
    };
    return styles[severity as keyof typeof styles] || styles.low;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-500/20 text-red-400 border-red-500/30',
      in_review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      mitigated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      closed: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return styles[status as keyof typeof styles] || styles.open;
  };

  const handleCreateHazard = () => {
    if (!newHazard.title || !newHazard.location || !newHazard.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const hazard: HazardReport = {
      id: `HZD-${String(hazards.length + 1).padStart(3, '0')}`,
      title: newHazard.title || '',
      location: newHazard.location || '',
      severity: newHazard.severity as HazardReport['severity'] || 'medium',
      category: newHazard.category || 'Physical Hazard',
      reportedBy: 'Current User',
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'open',
      description: newHazard.description || '',
    };
    
    setHazards([hazard, ...hazards]);
    setIsCreating(false);
    setNewHazard({ severity: 'medium', category: 'Physical Hazard' });
    toast.success('Hazard report submitted successfully');
  };

  const handleUpdateStatus = (hazardId: string, newStatus: HazardReport['status']) => {
    setHazards(hazards.map(h => h.id === hazardId ? { ...h, status: newStatus } : h));
    toast.success(`Hazard status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F2F5FA]">Safety & Hazard Assessment</h1>
          <p className="text-[#A9B3C2] mt-1">Compliance checklist and risk management</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90">
              <Plus className="w-4 h-4 mr-2" />
              Report Hazard
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Hazard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-[#A9B3C2]">Title</label>
                <Input
                  value={newHazard.title || ''}
                  onChange={(e) => setNewHazard({...newHazard, title: e.target.value})}
                  className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]"
                  placeholder="Brief description of the hazard"
                />
              </div>
              <div>
                <label className="text-sm text-[#A9B3C2]">Location</label>
                <Input
                  value={newHazard.location || ''}
                  onChange={(e) => setNewHazard({...newHazard, location: e.target.value})}
                  className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]"
                  placeholder="Where is the hazard located?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A9B3C2]">Severity</label>
                  <Select 
                    value={newHazard.severity} 
                    onValueChange={(v) => setNewHazard({...newHazard, severity: v as HazardReport['severity']})}
                  >
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#A9B3C2]">Category</label>
                  <Select 
                    value={newHazard.category} 
                    onValueChange={(v) => setNewHazard({...newHazard, category: v})}
                  >
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="Physical Hazard">Physical Hazard</SelectItem>
                      <SelectItem value="Chemical Hazard">Chemical Hazard</SelectItem>
                      <SelectItem value="Safety Equipment">Safety Equipment</SelectItem>
                      <SelectItem value="Documentation">Documentation</SelectItem>
                      <SelectItem value="Environmental">Environmental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm text-[#A9B3C2]">Description</label>
                <Textarea
                  value={newHazard.description || ''}
                  onChange={(e) => setNewHazard({...newHazard, description: e.target.value})}
                  className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)] min-h-[100px]"
                  placeholder="Detailed description of the hazard and potential risks..."
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreateHazard} className="flex-1 bg-[#38b6ff] text-[#0B0F17]">Submit Report</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Total Reports</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">{hazards.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Open Issues</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{openCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Critical</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{criticalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Mitigated</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{mitigatedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
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

        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardHeader>
            <CardTitle className="text-[#F2F5FA] text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,245,250,0.08)" />
                  <XAxis dataKey="name" stroke="#A9B3C2" fontSize={11} />
                  <YAxis stroke="#A9B3C2" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)' }} />
                  <Bar dataKey="count" fill="#38b6ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C2]" />
              <Input
                placeholder="Search hazards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-32 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hazards List */}
      <div className="space-y-4">
        {filteredHazards.map((hazard) => (
          <Card key={hazard.id} className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-[#F2F5FA]">{hazard.title}</span>
                    <Badge variant="outline" className={getSeverityBadge(hazard.severity)}>
                      {hazard.severity}
                    </Badge>
                    <Badge variant="outline" className={getStatusBadge(hazard.status)}>
                      {hazard.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#A9B3C2]">{hazard.location} • {hazard.category}</p>
                  <p className="text-sm text-[#F2F5FA] mt-2">{hazard.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-[#A9B3C2]">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Reported: {hazard.reportedDate}</span>
                    <span className="flex items-center gap-1">By: {hazard.reportedBy}</span>
                  </div>

                  {hazard.mitigation && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Mitigation: {hazard.mitigation}
                      </p>
                    </div>
                  )}
                </div>

                {userRole !== 'directorate_officer' && hazard.status !== 'closed' && (
                  <div className="flex flex-col gap-2">
                    <Select onValueChange={(v) => handleUpdateStatus(hazard.id, v as HazardReport['status'])}>
                      <SelectTrigger className="w-40 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="mitigated">Mitigated</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
