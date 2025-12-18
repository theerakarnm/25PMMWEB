'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Search, Filter, Download, UserCheck, UserX } from 'lucide-react';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ['research-patients'],
    queryFn: () => apiClient.getPatientList(),
  });

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiClient.getUserStats(),
  });

  const filteredPatients = patients?.filter(patient => {
    const matchesSearch = !searchTerm || 
      patient.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.realName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.hospitalNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusChange = async (patientId: string, newStatus: 'active' | 'inactive') => {
    try {
      await apiClient.updateUserStatus(patientId, newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to update patient status:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const csvData = await apiClient.exportResearchDataCSV({});
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'patients-data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ป่วย</h1>
          <p className="mt-2 text-gray-600">
            ติดตามและจัดการข้อมูลผู้ป่วยในระบบ
          </p>
        </div>
        <Button onClick={handleExportData} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          ส่งออกข้อมูล
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ผู้ป่วยทั้งหมด
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.totalUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              จำนวนผู้ป่วยที่ลงทะเบียนทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ผู้ป่วยที่ใช้งานอยู่
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.activeUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ผู้ป่วยที่ยังคงใช้งานระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ผู้ป่วยที่ไม่ใช้งาน
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats?.inactiveUsers || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ผู้ป่วยที่หยุดใช้งานระบบ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อผู้ป่วย</CardTitle>
          <CardDescription>
            ค้นหาและจัดการข้อมูลผู้ป่วยในระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อผู้ป่วย, ชื่อจริง, หรือ HN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">ใช้งานอยู่</option>
                <option value="inactive">ไม่ใช้งาน</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>ชื่อจริง</TableHead>
                  <TableHead>HN</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่เข้าร่วม</TableHead>
                  <TableHead>การตอบสนองล่าสุด</TableHead>
                  <TableHead>อัตราการปฏิบัติตาม</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'ไม่พบผู้ป่วยที่ตรงกับเงื่อนไขการค้นหา'
                        : 'ยังไม่มีผู้ป่วยในระบบ'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.displayName || 'ไม่ระบุ'}
                      </TableCell>
                      <TableCell>
                        {patient.realName || '-'}
                      </TableCell>
                      <TableCell>
                        {patient.hospitalNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={patient.status === 'active' ? 'success' : 'secondary'}
                        >
                          {patient.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(patient.joinedAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {patient.lastInteraction 
                          ? new Date(patient.lastInteraction).toLocaleDateString('th-TH')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            {patient.overallAdherenceRate 
                              ? `${Math.round(patient.overallAdherenceRate)}%`
                              : '-'
                            }
                          </div>
                          {patient.overallAdherenceRate && (
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${patient.overallAdherenceRate}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(
                            patient.id, 
                            patient.status === 'active' ? 'inactive' : 'active'
                          )}
                        >
                          {patient.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}