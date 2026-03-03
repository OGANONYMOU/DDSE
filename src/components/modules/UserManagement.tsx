import { useState } from 'react';
import { 
  Plus, Search, UserCheck, UserX, 
  Mail, Phone, CheckCircle, XCircle, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface User {
  id: string;
  fullName: string;
  appointmentNumber: string;
  rank: string;
  directorate: string;
  phoneNumber: string;
  email: string;
  role: 'super_admin' | 'evaluator' | 'directorate_officer';
  status: 'active' | 'pending' | 'suspended';
  lastLogin?: string;
}

const mockUsers: User[] = [
  {
    id: 'USR-001',
    fullName: 'Major John Smith',
    appointmentNumber: 'APP-78432',
    rank: 'Major',
    directorate: 'Standard & Evaluation',
    phoneNumber: '+1-555-0101',
    email: 'john.smith@military.gov',
    role: 'super_admin',
    status: 'active',
    lastLogin: '2024-01-23 14:30'
  },
  {
    id: 'USR-002',
    fullName: 'Captain Sarah Johnson',
    appointmentNumber: 'APP-78433',
    rank: 'Captain',
    directorate: 'Safety & Manual',
    phoneNumber: '+1-555-0102',
    email: 'sarah.johnson@military.gov',
    role: 'evaluator',
    status: 'active',
    lastLogin: '2024-01-23 10:15'
  },
  {
    id: 'USR-003',
    fullName: 'Lieutenant Michael Davis',
    appointmentNumber: 'APP-78434',
    rank: 'Lieutenant',
    directorate: 'Project Monitoring',
    phoneNumber: '+1-555-0103',
    email: 'michael.davis@military.gov',
    role: 'directorate_officer',
    status: 'pending',
  },
  {
    id: 'USR-004',
    fullName: 'Sergeant Emily Wilson',
    appointmentNumber: 'APP-78435',
    rank: 'Sergeant',
    directorate: 'Standard & Evaluation',
    phoneNumber: '+1-555-0104',
    email: 'emily.wilson@military.gov',
    role: 'evaluator',
    status: 'active',
    lastLogin: '2024-01-22 16:45'
  },
  {
    id: 'USR-005',
    fullName: 'Colonel Robert Brown',
    appointmentNumber: 'APP-78436',
    rank: 'Colonel',
    directorate: 'Standard & Evaluation',
    phoneNumber: '+1-555-0105',
    email: 'robert.brown@military.gov',
    role: 'directorate_officer',
    status: 'suspended',
    lastLogin: '2024-01-15 09:00'
  },
];

const roleLabels = {
  super_admin: 'Super Admin',
  evaluator: 'Evaluator',
  directorate_officer: 'Directorate Officer'
};

const roleBadges = {
  super_admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  evaluator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  directorate_officer: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusBadges = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(1);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.appointmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleApproveUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    setPendingApprovals(pendingApprovals - 1);
    toast.success('User approved successfully');
  };

  const handleRejectUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    setPendingApprovals(pendingApprovals - 1);
    toast.info('User request rejected');
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'suspended' } : u));
    toast.warning('User suspended');
  };

  const handleActivateUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
    toast.success('User activated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F2F5FA]">User Management</h1>
          <p className="text-[#A9B3C2] mt-1">Manage user accounts and access control</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="bg-[#38b6ff] text-[#0B0F17] hover:bg-[#38b6ff]/90">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#111827] border-[rgba(242,245,250,0.12)] text-[#F2F5FA] max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A9B3C2]">Full Name</label>
                  <Input className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="text-sm text-[#A9B3C2]">Appointment</label>
                  <Input className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]" placeholder="APP-XXXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A9B3C2]">Rank</label>
                  <Select>
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Corporal">Corporal</SelectItem>
                      <SelectItem value="Sergeant">Sergeant</SelectItem>
                      <SelectItem value="Lieutenant">Lieutenant</SelectItem>
                      <SelectItem value="Captain">Captain</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Colonel">Colonel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-[#A9B3C2]">Directorate</label>
                  <Select>
                    <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                      <SelectValue placeholder="Select directorate" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                      <SelectItem value="Standard & Evaluation">Standard & Evaluation</SelectItem>
                      <SelectItem value="Safety & Manual">Safety & Manual</SelectItem>
                      <SelectItem value="Project Monitoring">Project Monitoring</SelectItem>
                      <SelectItem value="Standard & Evaluation">Standard & Evaluation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#A9B3C2]">Phone Number</label>
                  <Input className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]" placeholder="+1-555-XXXX" />
                </div>
                <div>
                  <label className="text-sm text-[#A9B3C2]">Email</label>
                  <Input className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]" placeholder="user@military.gov" />
                </div>
              </div>
              <div>
                <label className="text-sm text-[#A9B3C2]">Role</label>
                <Select>
                  <SelectTrigger className="bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="evaluator">Evaluator</SelectItem>
                    <SelectItem value="directorate_officer">Directorate Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => { toast.success('User created'); setIsCreating(false); }} className="flex-1 bg-[#38b6ff] text-[#0B0F17]">Create User</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Total Users</p>
            <p className="text-3xl font-bold text-[#F2F5FA] mt-2">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Active</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{users.filter(u => u.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Pending Approval</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{pendingApprovals}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
          <CardContent className="p-6">
            <p className="text-sm text-[#A9B3C2]">Suspended</p>
            <p className="text-3xl font-bold text-red-400 mt-2">{users.filter(u => u.status === 'suspended').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400">
                <span className="font-semibold">{pendingApprovals}</span> user(s) awaiting approval
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B3C2]" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#0B0F17] border-[rgba(242,245,250,0.12)] text-[#F2F5FA]"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="evaluator">Evaluator</SelectItem>
                <SelectItem value="directorate_officer">Directorate Officer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-[#0B0F17] border-[rgba(242,245,250,0.12)]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[rgba(242,245,250,0.12)]">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-[#111827] border-[rgba(242,245,250,0.08)]">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-[#F2F5FA]">{user.fullName}</span>
                    <Badge variant="outline" className={roleBadges[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                    <Badge variant="outline" className={statusBadges[user.status]}>
                      {user.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#A9B3C2]">{user.rank} • {user.appointmentNumber}</p>
                  <p className="text-sm text-[#A9B3C2]">{user.directorate}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-[#A9B3C2]">
                    <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phoneNumber}</span>
                    {user.lastLogin && <span className="flex items-center gap-1">Last login: {user.lastLogin}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {user.status === 'pending' ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleApproveUser(user.id)}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRejectUser(user.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  ) : user.status === 'active' ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSuspendUser(user.id)}
                      className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Suspend
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleActivateUser(user.id)}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
