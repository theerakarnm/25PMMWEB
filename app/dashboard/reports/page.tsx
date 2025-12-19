/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  Users, 
  Download, 
  Clock,
  Target
} from 'lucide-react';

export default function ReportsPage() {
  const [selectedProtocol, setSelectedProtocol] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const { data: dashboardMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
  });

  const { data: protocols } = useQuery({
    queryKey: ['protocols'],
    queryFn: () => apiClient.getProtocols(),
  });

  const { data: adherenceMetrics } = useQuery({
    queryKey: ['adherence-metrics', selectedProtocol],
    queryFn: () => selectedProtocol !== 'all' ? apiClient.getAdherenceMetrics(selectedProtocol) : null,
    enabled: selectedProtocol !== 'all',
  });

  const { data: patients } = useQuery({
    queryKey: ['research-patients'],
    queryFn: () => apiClient.getPatientList(),
  });

  const handleExportData = async () => {
    try {
      const query = {
        protocolId: selectedProtocol !== 'all' ? selectedProtocol : undefined,
        format: exportFormat,
      };

      if (exportFormat === 'csv') {
        const csvData = await apiClient.exportResearchDataCSV(query);
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const jsonData = await apiClient.exportResearchData(query);
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `research-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)} วินาที`;
    if (ms < 3600000) return `${Math.round(ms / 60000)} นาที`;
    return `${Math.round(ms / 3600000)} ชั่วโมง`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">รายงานและการวิเคราะห์</h1>
          <p className="mt-2 text-gray-600">
            ติดตามประสิทธิภาพและอัตราการปฏิบัติตามของผู้ป่วย
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as 'csv' | 'json')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            ส่งออกข้อมูล
          </Button>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              ผู้ป่วยทั้งหมด
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                dashboardMetrics?.totalPatients || 0
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ผู้ป่วยที่ลงทะเบียนในระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              โปรโตคอลที่ใช้งาน
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                dashboardMetrics?.activeProtocols || 0
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              โปรโตคอลที่กำลังดำเนินการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              อัตราการปฏิบัติตามโดยรวม
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                `${Math.round(dashboardMetrics?.overallAdherenceRate || 0)}%`
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              เฉลี่ยจากทุกโปรโตคอล
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              เวลาตอบสนองเฉลี่ย
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              ) : (
                dashboardMetrics?.averageResponseTime 
                  ? formatResponseTime(dashboardMetrics.averageResponseTime)
                  : '-'
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              เวลาเฉลี่ยในการตอบกลับ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Selection */}
      <Card>
        <CardHeader>
          <CardTitle>เลือกโปรโตคอลสำหรับการวิเคราะห์</CardTitle>
          <CardDescription>
            ดูรายละเอียดการปฏิบัติตามของโปรโตคอลเฉพาะ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProtocol}
            onValueChange={(value) => setSelectedProtocol(value)}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="เลือกโปรโตคอล" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกโปรโตคอล</SelectItem>
              {protocols?.map((protocol) => (
                <SelectItem key={protocol.id} value={protocol.id}>
                  {protocol.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Protocol-specific Metrics */}
      {selectedProtocol !== 'all' && adherenceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>รายงานโปรโตคอล: {adherenceMetrics.protocolName}</CardTitle>
            <CardDescription>
              สถิติการปฏิบัติตามและประสิทธิภาพของโปรโตคอล
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {adherenceMetrics.totalPatients}
                </div>
                <div className="text-sm text-gray-600">ผู้ป่วยทั้งหมด</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(adherenceMetrics.completionRate)}%
                </div>
                <div className="text-sm text-gray-600">อัตราการเสร็จสิ้น</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {adherenceMetrics.averageResponseTime 
                    ? formatResponseTime(adherenceMetrics.averageResponseTime)
                    : '-'
                  }
                </div>
                <div className="text-sm text-gray-600">เวลาตอบสนองเฉลี่ย</div>
              </div>
            </div>

            {/* Step Metrics */}
            {adherenceMetrics.stepMetrics && adherenceMetrics.stepMetrics.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">สถิติแต่ละขั้นตอน</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ขั้นตอน</TableHead>
                      <TableHead>ส่งแล้ว</TableHead>
                      <TableHead>ตอบกลับ</TableHead>
                      <TableHead>อัตราการปฏิบัติตาม</TableHead>
                      <TableHead>เวลาตอบสนองเฉลี่ย</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adherenceMetrics.stepMetrics.map((step: any) => (
                      <TableRow key={step.stepId}>
                        <TableCell>ขั้นตอน {step.stepOrder}</TableCell>
                        <TableCell>{step.sentCount}</TableCell>
                        <TableCell>{step.responseCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={step.adherenceRate >= 80 ? 'success' : 
                                     step.adherenceRate >= 60 ? 'warning' : 'destructive'}
                            >
                              {Math.round(step.adherenceRate)}%
                            </Badge>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${step.adherenceRate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {step.averageResponseTime 
                            ? formatResponseTime(step.averageResponseTime)
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Patient Adherence Summary */}
      <Card>
        <CardHeader>
          <CardTitle>สรุปการปฏิบัติตามของผู้ป่วย</CardTitle>
          <CardDescription>
            ภาพรวมการปฏิบัติตามของผู้ป่วยแต่ละคน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ป่วย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>โปรโตคอลที่ใช้งาน</TableHead>
                <TableHead>อัตราการปฏิบัติตาม</TableHead>
                <TableHead>การตอบสนองล่าสุด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients?.slice(0, 10).map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.displayName || patient.realName || 'ไม่ระบุ'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.status === 'active' ? 'success' : 'secondary'}>
                      {patient.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {patient.activeProtocols || 0} โปรโตคอล
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {patient.overallAdherenceRate 
                          ? `${Math.round(patient.overallAdherenceRate)}%`
                          : '-'
                        }
                      </span>
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
                    {patient.lastInteraction 
                      ? new Date(patient.lastInteraction).toLocaleDateString('th-TH')
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}