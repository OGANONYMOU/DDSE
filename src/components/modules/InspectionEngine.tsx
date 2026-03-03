import { useState } from 'react';
import { 
  Plus, Search, Filter, Calendar, 
  CheckCircle, FileText, Download, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Inspection {
  id: string;
  directorate: string;
  type: string;
  evaluator: string;
  date: string;
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'draft' | 'in_progress' | 'completed';
  questions: Question[];
}

interface Question {
  id: string;
  text: string;
  category: string;
  weight: number;
  score: number | null;
  remarks: string;
}

const mockInspections: Inspection[] = [
  {
    id: 'INS-2024-001',
    directorate: 'Standard & Evaluation',
    type: 'Operational Readiness',
    evaluator: 'Maj. Johnson',
    date: '2024-01-15',
    score: 87,
    riskLevel: 'low',
    status: 'completed',
    questions: []
  },
  {
    id: 'INS-2024-002',
    directorate: 'Safety & Manual',
    type: 'Supply Chain Audit',
    evaluator: 'Capt. Smith',
    date: '2024-01-18',
    score: 72,
    riskLevel: 'medium',
    status: 'in_progress',
    questions: []
  },
  {
    id: 'INS-2024-003',
    directorate: 'Project Monitoring',
    type: 'Security Compliance',
    evaluator: 'Lt. Davis',
    date: '2024-01-20',
    score: 0,
    riskLevel: 'high',
    status: 'draft',
    questions: []
  },
];

const questionTemplates: Question[] = [
  { id: 'Q1', text: 'Personnel are properly trained and certified for their roles', category: 'Training', weight: 10, score: null, remarks: '' },
  { id: 'Q2', text: 'Equipment is maintained according to schedule', category: 'Maintenance', weight: 15, score: null, remarks: '' },
  { id: 'Q3', text: 'Security protocols are followed at all times', category: 'Security', weight: 20, score: null, remarks: '' },
  { id: 'Q4', text: 'Documentation is complete and up-to-date', category: 'Documentation', weight: 10, score: null, remarks: '' },
  { id: 'Q5', text: 'Emergency procedures are clearly posted and understood', category: 'Safety', weight: 15, score: null, remarks: '' },
  { id: 'Q6', text: 'Communication systems are operational', category: 'Communications', weight: 15, score: null, remarks: '' },
  { id: 'Q7', text: 'Inventory records match physical count', category: 'Inventory', weight: 15, score: null, remarks: '' },
];

interface InspectionEngineProps {
  userRole: 'super_admin' | 'evaluator' | 'directorate_officer' | null;
}

export default function InspectionEngine({ userRole }: InspectionEngineProps) {
  const [inspections, setInspections] = useState<Inspection[]>(mockInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newInspection, setNewInspection] = useState<Partial<Inspection>>({
    directorate: '',
    type: '',
    questions: questionTemplates.map(q => ({ ...q, score: null, remarks: '' }))
  });

  // Use userRole to conditionally show/hide elements
  const canCreateInspection = userRole === 'super_admin' || userRole === 'evaluator';

  const filteredInspections = inspections.filter(ins => {
    const matchesSearch = ins.directorate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ins.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ins.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[risk as keyof typeof styles] || styles.low;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const calculateScore = (questions: Question[]) => {
    const answered = questions.filter(q => q.score !== null);
    if (answered.length === 0) return 0;
    const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
    const scored = questions.reduce((sum, q) => sum + (q.score || 0) * q.weight, 0);
    return Math.round((scored / totalWeight) * 100);
  };

  const determineRiskLevel = (score: number): 'low' | 'medium' | 'high' => {
    if (score >= 85) return 'low';
    if (score >= 70) return 'medium';
    return 'high';
  };

  const handleCreateInspection = () => {
    if (!newInspection.directorate || !newInspection.type) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    const inspection: Inspection = {
      id: `INS-2024-${String(inspections.length + 1).padStart(3, '0')}`,
      directorate: newInspection.directorate,
      type: newInspection.type,
      evaluator: 'Current User',
      date: new Date().toISOString().split('T')[0],
      score: 0,
      riskLevel: 'high',
      status: 'draft',
      questions: newInspection.questions || []
    };
    
    setInspections([inspection, ...inspections]);
    setIsCreating(false);
    setNewInspection({ directorate: '', type: '', questions: questionTemplates.map(q => ({ ...q, score: null, remarks: '' })) });
    toast.success('Inspection created successfully');
  };

  const handleUpdateQuestion = (inspectionId: string, questionId: string, score: number, remarks: string) => {
    setInspections(inspections.map(ins => {
      if (ins.id !== inspectionId) return ins;
      const updatedQuestions = ins.questions.map(q => 
        q.id === questionId ? { ...q, score, remarks } : q
      );
      const newScore = calculateScore(updatedQuestions);
      return {
        ...ins,
        questions: updatedQuestions,
        score: newScore,
        riskLevel: determineRiskLevel(newScore)
      };
    }));
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved automatically');
  };

  const handleSubmitInspection = (inspectionId: string) => {
    setInspections(inspections.map(ins => 
      ins.id === inspectionId ? { ...ins, status: 'completed' } : ins
    ));
    toast.success('Inspection submitted successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F2F5FA]">Inspection Engine</h1>
          <p className="text-[#A9B3C2] mt-1">Dynamic assessment and scoring system</p>
        </div>
        {canCreateInspection && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90">
                <Plus className="w-4 h-4 mr-2" />
                New Inspection
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Inspection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm text-[#A9B3C2]">Directorate</label>
                  <Select onValueChange={(v) => setNewInspection({...newInspection, directorate: v})}>
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue placeholder="Select directorate" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="Standard & Evaluation">Standard & Evaluation</SelectItem>
                      <SelectItem value="Safety & Manual">Safety & Manual</SelectItem>
                      <SelectItem value="Project Monitoring">Project Monitoring</SelectItem>
                      <SelectItem // removed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#A9B3C2]">Inspection Type</label>
                  <Select onValueChange={(v) => setNewInspection({...newInspection, type: v})}>
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="Operational Readiness">Operational Readiness</SelectItem>
                      <SelectItem value="Security Compliance">Security Compliance</SelectItem>
                      <SelectItem value="Supply Chain Audit">Supply Chain Audit</SelectItem>
                      <SelectItem value="Safety Assessment">Safety Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-[#A9B3C2] mb-2">Assessment Questions ({questionTemplates.length})</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {questionTemplates.map((q, i) => (
                      <div key={q.id} className="p-3 bg-[#0B0F17] rounded-lg">
                        <p className="text-sm text-[#F2F5FA]">{i + 1}. {q.text}</p>
                        <p className="text-xs text-[#A9B3C2]">Weight: {q.weight}% • {q.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleCreateInspection} className="flex-1 bg-[#38b6ff] text-[#0B0F17]">Create Inspection</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C2]" />
              <Input
                placeholder="Search inspections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <div className="space-y-4">
        {filteredInspections.map((inspection) => (
          <Card key={inspection.id} className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-[#F2F5FA]">{inspection.id}</span>
                    <Badge variant="outline" className={getStatusBadge(inspection.status)}>
                      {inspection.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className={getRiskBadge(inspection.riskLevel)}>
                      {inspection.riskLevel} risk
                    </Badge>
                  </div>
                  <p className="text-[#F2F5FA]">{inspection.directorate}</p>
                  <p className="text-sm text-[#A9B3C2]">{inspection.type} • Evaluated by {inspection.evaluator}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#A9B3C2]">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {inspection.date}</span>
                    {inspection.status === 'completed' && (
                      <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-[#38b6ff]" /> Score: {inspection.score}%</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-[rgba(242,245,250,0.12)]"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Inspection Details - {inspection.id}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-[#0B0F17] rounded-lg">
                            <p className="text-sm text-[#A9B3C2]">Directorate</p>
                            <p className="text-[#F2F5FA]">{inspection.directorate}</p>
                          </div>
                          <div className="p-4 bg-[#0B0F17] rounded-lg">
                            <p className="text-sm text-[#A9B3C2]">Type</p>
                            <p className="text-[#F2F5FA]">{inspection.type}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Assessment Questions</h3>
                          <div className="space-y-4">
                            {(inspection.questions.length > 0 ? inspection.questions : questionTemplates).map((q, i) => (
                              <div key={q.id} className="p-4 bg-[#0B0F17] rounded-lg border border-[rgba(242,245,250,0.08)]">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <p className="text-[#F2F5FA]">{i + 1}. {q.text}</p>
                                    <p className="text-xs text-[#A9B3C2] mt-1">Weight: {q.weight}% • {q.category}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Select 
                                      value={q.score?.toString() || ''}
                                      onValueChange={(v) => handleUpdateQuestion(inspection.id, q.id, parseInt(v), q.remarks || '')}
                                      disabled={inspection.status === 'completed'}
                                    >
                                      <SelectTrigger className="w-24 bg-[#111827] border-[rgba(242,245,250,0.12)]">
                                        <SelectValue placeholder="Score" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                                        {[1,2,3,4,5].map(n => (
                                          <SelectItem key={n} value={n.toString()}>{n}/5</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                {inspection.status !== 'completed' && (
                                  <Input
                                    placeholder="Add remarks..."
                                    value={q.remarks || ''}
                                    onChange={(e) => handleUpdateQuestion(inspection.id, q.id, q.score || 0, e.target.value)}
                                    className="mt-3 bg-[#111827] border-[rgba(242,245,250,0.12)] text-sm"
                                  />
                                )}
                                {q.remarks && inspection.status === 'completed' && (
                                  <p className="mt-2 text-sm text-[#A9B3C2]">Remarks: {q.remarks}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#0B0F17] rounded-lg">
                          <div>
                            <p className="text-sm text-[#A9B3C2]">Overall Score</p>
                            <p className="text-2xl font-bold text-[#38b6ff]">{inspection.score}%</p>
                          </div>
                          <Badge variant="outline" className={getRiskBadge(inspection.riskLevel)}>
                            {inspection.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>

                        {inspection.status !== 'completed' && (
                          <div className="flex gap-3">
                            <Button 
                              variant="outline" 
                              onClick={handleSaveDraft}
                              className="flex-1"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Draft
                            </Button>
                            <Button 
                              onClick={() => handleSubmitInspection(inspection.id)}
                              className="flex-1 bg-[#38b6ff] text-[#0B0F17]"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Submit Inspection
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
