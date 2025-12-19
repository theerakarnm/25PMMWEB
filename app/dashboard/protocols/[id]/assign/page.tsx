'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, UserPlus, Play, Pause, Square } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  displayName: string;
  realName: string | null;
  lineUserId: string;
  status: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  userId: string;
  protocolId: string;
  status: 'assigned' | 'active' | 'completed' | 'paused';
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  adherenceRate: string | null;
  user?: {
    displayName: string;
    realName: string | null;
  };
}

export default function AssignProtocolPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const protocolId = params.id as string;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch protocol details
  const { data: protocol } = useQuery({
    queryKey: ['protocol', protocolId],
    queryFn: () => apiClient.getProtocolWithSteps(protocolId),
    enabled: !!protocolId,
  });

  // Fetch available users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/users');
      return response.data as User[];
    }
  });

  // Fetch existing assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['protocol-assignments', protocolId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/protocol-assignments/protocol/${protocolId}`);
      return response.data as Assignment[];
    },
    enabled: !!protocolId,
  });

  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post('/api/protocol-assignments', {
        userId,
        protocolId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol-assignments', protocolId] });
      setSelectedUsers([]);
    },
    onError: (error: unknown) => {
      console.error('Failed to assign protocol:', error);
      alert('เกิดข้อผิดพลาดในการมอบหมายโปรโตคอล');
    }
  });

  // Start assignment mutation
  const startMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/api/protocol-assignments/${assignmentId}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol-assignments', protocolId] });
    }
  });

  // Pause assignment mutation
  const pauseMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/api/protocol-assignments/${assignmentId}/pause`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol-assignments', protocolId] });
    }
  });

  // Resume assignment mutation
  const resumeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/api/protocol-assignments/${assignmentId}/resume`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol-assignments', protocolId] });
    }
  });

  // Complete assignment mutation
  const completeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await apiClient.post(`/api/protocol-assignments/${assignmentId}/complete`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol-assignments', protocolId] });
    }
  });

  const handleAssign = async () => {
    if (selectedUsers.length === 0) return;

    for (const userId of selectedUsers) {
      await assignMutation.mutateAsync(userId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="secondary">มอบหมายแล้ว</Badge>;
      case 'active':
        return <Badge variant="success">กำลังดำเนินการ</Badge>;
      case 'paused':
        return <Badge variant="warning">หยุดชั่วคราว</Badge>;
      case 'completed':
        return <Badge variant="outline">เสร็จสิ้น</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAssignedUserIds = () => {
    return assignments?.map(a => a.userId) || [];
  };

  const getAvailableUsers = () => {
    const assignedUserIds = getAssignedUserIds();
    return users?.filter(user => 
      user.status === 'active' && !assignedUserIds.includes(user.id)
    ) || [];
  };

  if (usersLoading || assignmentsLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/protocols/${protocolId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">มอบหมายโปรโตคอล</h1>
            <p className="text-gray-600 mt-1">{protocol?.name}</p>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            ผู้ป่วยที่ได้รับมอบหมาย ({assignments?.length || 0} คน)
          </CardTitle>
          <CardDescription>
            รายการผู้ป่วยที่ได้รับมอบหมายโปรโตคอลนี้แล้ว
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">
                        {assignment.user?.displayName || 'ไม่ระบุชื่อ'}
                      </p>
                      {assignment.user?.realName && (
                        <p className="text-sm text-gray-500">{assignment.user.realName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(assignment.status)}
                        <span className="text-xs text-gray-500">
                          มอบหมายเมื่อ {new Date(assignment.assignedAt).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-gray-600">
                        ขั้นตอน {assignment.currentStep}/{assignment.totalSteps}
                      </p>
                      {assignment.adherenceRate && (
                        <p className="text-green-600">
                          ปฏิบัติตาม {assignment.adherenceRate}%
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {assignment.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => startMutation.mutate(assignment.id)}
                          disabled={startMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          เริ่ม
                        </Button>
                      )}
                      
                      {assignment.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => pauseMutation.mutate(assignment.id)}
                          disabled={pauseMutation.isPending}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          หยุด
                        </Button>
                      )}
                      
                      {assignment.status === 'paused' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => resumeMutation.mutate(assignment.id)}
                            disabled={resumeMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            ดำเนินการต่อ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => completeMutation.mutate(assignment.id)}
                            disabled={completeMutation.isPending}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            จบ
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีผู้ป่วยที่ได้รับมอบหมายโปรโตคอลนี้</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign New Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            มอบหมายให้ผู้ป่วยใหม่
          </CardTitle>
          <CardDescription>
            เลือกผู้ป่วยที่ต้องการมอบหมายโปรโตคอลนี้
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getAvailableUsers().length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getAvailableUsers().map((user) => (
                  <label key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{user.displayName}</p>
                      {user.realName && (
                        <p className="text-sm text-gray-500">{user.realName}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        เข้าร่วมเมื่อ {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  เลือกแล้ว {selectedUsers.length} คน
                </p>
                <Button 
                  onClick={handleAssign}
                  disabled={selectedUsers.length === 0 || assignMutation.isPending}
                >
                  {assignMutation.isPending ? 'กำลังมอบหมาย...' : 'มอบหมายโปรโตคอล'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ไม่มีผู้ป่วยที่สามารถมอบหมายได้</p>
              <p className="text-sm mt-1">ผู้ป่วยทั้งหมดได้รับมอบหมายโปรโตคอลนี้แล้ว</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}