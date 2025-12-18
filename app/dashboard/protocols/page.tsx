'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Search, Play, Pause, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ProtocolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'active' | 'paused' | 'completed'>('all');

  const { data: protocols, isLoading, refetch } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => apiClient.getProtocols(),
  });

  const filteredProtocols = protocols?.filter(protocol => {
    const matchesSearch = !searchTerm || 
      protocol.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || protocol.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleActivateProtocol = async (protocolId: string) => {
    try {
      await apiClient.activateProtocol(protocolId);
      refetch();
    } catch (error) {
      console.error('Failed to activate protocol:', error);
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบโปรโตคอลนี้?')) {
      try {
        await apiClient.deleteProtocol(protocolId);
        refetch();
      } catch (error) {
        console.error('Failed to delete protocol:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">ใช้งานอยู่</Badge>;
      case 'draft':
        return <Badge variant="secondary">ร่าง</Badge>;
      case 'paused':
        return <Badge variant="warning">หยุดชั่วคราว</Badge>;
      case 'completed':
        return <Badge variant="outline">เสร็จสิ้น</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const activeProtocols = protocols?.filter(p => p.status === 'active').length || 0;
  const draftProtocols = protocols?.filter(p => p.status === 'draft').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการโปรโตคอล</h1>
          <p className="mt-2 text-gray-600">
            สร้างและจัดการโปรโตคอลการดูแลผู้ป่วย
          </p>
        </div>
        <Link href="/dashboard/protocols/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            สร้างโปรโตคอลใหม่
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              โปรโตคอลทั้งหมด
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {protocols?.length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              จำนวนโปรโตคอลทั้งหมดในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              โปรโตคอลที่ใช้งาน
            </CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeProtocols}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              โปรโตคอลที่กำลังดำเนินการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              โปรโตคอลร่าง
            </CardTitle>
            <Edit className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {draftProtocols}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              โปรโตคอลที่ยังไม่เสร็จสิ้น
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protocols List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการโปรโตคอล</CardTitle>
          <CardDescription>
            จัดการและติดตามโปรโตคอลการดูแลผู้ป่วย
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อโปรโตคอลหรือคำอธิบาย..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="draft">ร่าง</option>
              <option value="active">ใช้งานอยู่</option>
              <option value="paused">หยุดชั่วคราว</option>
              <option value="completed">เสร็จสิ้น</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อโปรโตคอล</TableHead>
                  <TableHead>คำอธิบาย</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead>วันที่อัปเดต</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProtocols.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'ไม่พบโปรโตคอลที่ตรงกับเงื่อนไขการค้นหา'
                        : 'ยังไม่มีโปรโตคอลในระบบ'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProtocols.map((protocol) => (
                    <TableRow key={protocol.id}>
                      <TableCell className="font-medium">
                        {protocol.name}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {protocol.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(protocol.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(protocol.createdAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        {new Date(protocol.updatedAt).toLocaleDateString('th-TH')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/protocols/${protocol.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/protocols/${protocol.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          {protocol.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivateProtocol(protocol.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProtocol(protocol.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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