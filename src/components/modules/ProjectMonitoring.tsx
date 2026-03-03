import { useState } from 'react';
import { 
  Plus, Search, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Project {
  id: string;
  name: string;
  directorate: string;
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
}

const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Communications Infrastructure Upgrade',
    directorate: 'Project Monitoring',
    status: 'on_track',
    progress: 75,
    budget: 2500000,
    spent: 1800000,
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    milestones: [
      { id: 'M1', name: 'Phase 1: Planning', dueDate: '2023-08-01', status: 'completed' },
      { id: 'M2', name: 'Phase 2: Procurement', dueDate: '2023-11-01', status: 'completed' },
      { id: 'M3', name: 'Phase 3: Installation', dueDate: '2024-03-01', status: 'pending' },
      { id: 'M4', name: 'Phase 4: Testing', dueDate: '2024-05-01', status: 'pending' },
    ]
  },
  {
    id: 'PRJ-002',
    name: 'Vehicle Fleet Modernization',
    directorate: 'Safety & Manual',
    status: 'at_risk',
    progress: 45,
    budget: 5000000,
    spent: 2400000,
    startDate: '2023-04-01',
    endDate: '2024-12-01',
    milestones: [
      { id: 'M1', name: 'Vendor Selection', dueDate: '2023-06-01', status: 'completed' },
      { id: 'M2', name: 'Initial Delivery', dueDate: '2023-10-01', status: 'overdue' },
      { id: 'M3', name: 'Full Deployment', dueDate: '2024-08-01', status: 'pending' },
    ]
  },
  {
    id: 'PRJ-003',
    name: 'Secure Data Center Migration',
    directorate: 'Standard & Evaluation',
    status: 'on_track',
    progress: 90,
    budget: 1800000,
    spent: 1650000,
    startDate: '2023-08-01',
    endDate: '2024-02-01',
    milestones: [
      { id: 'M1', name: 'Infrastructure Setup', dueDate: '2023-10-01', status: 'completed' },
      { id: 'M2', name: 'Data Migration', dueDate: '2023-12-01', status: 'completed' },
      { id: 'M3', name: 'Security Audit', dueDate: '2024-01-15', status: 'pending' },
      { id: 'M4', name: 'Go Live', dueDate: '2024-02-01', status: 'pending' },
    ]
  },
  {
    id: 'PRJ-004',
    name: 'Training Facility Renovation',
    directorate: 'Standard & Evaluation',
    status: 'delayed',
    progress: 30,
    budget: 1200000,
    spent: 450000,
    startDate: '2023-09-01',
    endDate: '2024-05-01',
    milestones: [
      { id: 'M1', name: 'Design Approval', dueDate: '2023-10-01', status: 'completed' },
      { id: 'M2', name: 'Construction Start', dueDate: '2023-11-01', status: 'overdue' },
      { id: 'M3', name: 'Phase 1 Complete', dueDate: '2024-02-01', status: 'pending' },
    ]
  },
];

const budgetData = mockProjects.map(p => ({
  name: p.name.split(' ').slice(0, 2).join(' '),
  budget: p.budget / 1000000,
  spent: p.spent / 1000000,
}));

interface ProjectMonitoringProps {
  userRole: 'super_admin' | 'evaluator' | 'directorate_officer' | null;
}

export default function ProjectMonitoring({ userRole }: ProjectMonitoringProps) {
  const [projects] = useState<Project[]>(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.directorate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  const getStatusBadge = (status: string) => {
    const styles = {
      on_track: 'bg-green-500/20 text-green-400 border-green-500/30',
      at_risk: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      delayed: 'bg-red-500/20 text-red-400 border-red-500/30',
      completed: 'bg-[#38b6ff]/20 text-[#38b6ff] border-[#38b6ff]/30',
    };
    return styles[status as keyof typeof styles] || styles.on_track;
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <span className="w-2 h-2 bg-green-400 rounded-full" />;
      case 'overdue': return <span className="w-2 h-2 bg-red-400 rounded-full" />;
      default: return <span className="w-2 h-2 bg-[#A9B3C2] rounded-full" />;
    }
  };

  const getVariance = (project: Project) => {
    const expectedSpend = (project.progress / 100) * project.budget;
    const variance = ((project.spent - expectedSpend) / expectedSpend) * 100;
    return variance;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F2F5FA]">Project Monitoring</h1>
          <p className="text-[#A9B3C2] mt-1">Budget tracking and completion analysis</p>
        </div>
        {userRole === 'super_admin' && (
          <Button className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Active Projects</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">{projects.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Total Budget</p>
            <p className="text-3xl font-bold text-[#38b6ff] mt-2">${(totalBudget / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Spent to Date</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">${(totalSpent / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Avg Progress</p>
            <p className="text-3xl font-bold text-[#38b6ff] mt-2">{avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Chart */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardHeader>
          <CardTitle className="text-[#F2F5FA]">Budget vs Actual Spend (Millions)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,245,250,0.08)" />
                <XAxis dataKey="name" stroke="#A9B3C2" fontSize={11} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#A9B3C2" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(242,245,250,0.12)', borderRadius: '8px' }}
                  labelStyle={{ color: '#F2F5FA' }}
                  formatter={(value: number) => `$${value.toFixed(2)}M`}
                />
                <Bar dataKey="budget" fill="rgba(242,245,250,0.2)" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="#38b6ff" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C2]" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on_track">On Track</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const variance = getVariance(project);
          return (
            <Card key={project.id} className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold text-[#F2F5FA]">{project.name}</span>
                      <Badge variant="outline" className={getStatusBadge(project.status)}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#A9B3C2]">{project.directorate}</p>
                    
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-[#A9B3C2]">Progress</span>
                        <span className="text-sm font-medium text-[#F2F5FA]">{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#0B0F17] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#38b6ff]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 text-sm">
                      <span className="flex items-center gap-1 text-[#A9B3C2]">
                        <Calendar className="w-4 h-4" /> {project.startDate} - {project.endDate}
                      </span>
                      <span className="flex items-center gap-1 text-[#A9B3C2]">
                        <DollarSign className="w-4 h-4" /> ${(project.spent / 1000000).toFixed(1)}M / ${(project.budget / 1000000).toFixed(1)}M
                      </span>
                      <span className={`flex items-center gap-1 ${variance > 10 ? 'text-red-400' : variance < -10 ? 'text-green-400' : 'text-[#A9B3C2]'}`}>
                        {variance > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(variance).toFixed(1)}% variance
                      </span>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="self-start">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{project.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-[#0B0F17] rounded-lg">
                            <p className="text-xs text-[#A9B3C2]">Budget</p>
                            <p className="text-[#F2F5FA]">${project.budget.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-[#0B0F17] rounded-lg">
                            <p className="text-xs text-[#A9B3C2]">Spent</p>
                            <p className="text-[#F2F5FA]">${project.spent.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-[#0B0F17] rounded-lg">
                            <p className="text-xs text-[#A9B3C2]">Timeline</p>
                            <p className="text-[#F2F5FA]">{project.startDate} to {project.endDate}</p>
                          </div>
                          <div className="p-3 bg-[#0B0F17] rounded-lg">
                            <p className="text-xs text-[#A9B3C2]">Progress</p>
                            <p className="text-[#38b6ff]">{project.progress}%</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-[#A9B3C2] mb-2">Milestones</h4>
                          <div className="space-y-2">
                            {project.milestones.map((milestone) => (
                              <div key={milestone.id} className="flex items-center justify-between p-3 bg-[#0B0F17] rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getMilestoneStatusIcon(milestone.status)}
                                  <span className="text-sm text-[#F2F5FA]">{milestone.name}</span>
                                </div>
                                <span className="text-xs text-[#A9B3C2]">{milestone.dueDate}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
