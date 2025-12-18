/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Play, Pause, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function ProtocolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = params.id as string;

  const { data: protocol, isLoading, refetch } = useQuery({
    queryKey: ['protocol', protocolId],
    queryFn: () => apiClient.getProtocolWithSteps(protocolId),
    enabled: !!protocolId,
  });

  const { data: adherenceMetrics } = useQuery({
    queryKey: ['adherence-metrics', protocolId],
    queryFn: () => apiClient.getAdherenceMetrics(protocolId),
    enabled: !!protocolId && protocol?.status === 'active',
  });

  const handleActivateProtocol = async () => {
    try {
      await apiClient.activateProtocol(protocolId);
      refetch();
    } catch (error) {
      console.error('Failed to activate protocol:', error);
    }
  };

  const handleDeleteProtocol = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบโปรโตคอลนี้?')) {
      try {
        await apiClient.deleteProtocol(protocolId);
        router.push('/dashboard/protocols');
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

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'immediate': return 'ส่งทันที';
      case 'delay': return 'หน่วงเวลา';
      case 'scheduled': return 'กำหนดเวลา';
      default: return type;
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'ข้อความ';
      case 'image': return 'รูปภาพ';
      case 'link': return 'ลิงก์';
      case 'flex': return 'Flex Message';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบโปรโตคอลที่ระบุ</p>
        <Link href="/dashboard/protocols">
          <Button className="mt-4">กลับไปยังรายการโปรโตคอล</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/protocols">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{protocol.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(protocol.status)}
              <span className="text-sm text-gray-500">
                สร้างเมื่อ {new Date(protocol.createdAt).toLocaleDateString('th-TH')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/protocols/${protocolId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </Button>
          </Link>
          {protocol.status === 'draft' && (
            <Button onClick={handleActivateProtocol}>
              <Play className="h-4 w-4 mr-2" />
              เปิดใช้งาน
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteProtocol}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Protocol Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลโปรโตคอล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">คำอธิบาย</h3>
              <p className="text-gray-600">
                {protocol.description || 'ไม่มีคำอธิบาย'}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">สถิติ</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนขั้นตอน:</span>
                  <span className="font-medium">{protocol.steps?.length || 0} ขั้นตอน</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">อัปเดตล่าสุด:</span>
                  <span className="font-medium">
                    {new Date(protocol.updatedAt).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adherence Metrics (if active) */}
      {protocol.status === 'active' && adherenceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>สถิติการปฏิบัติตาม</CardTitle>
            <CardDescription>
              ข้อมูลการปฏิบัติตามของผู้ป่วยในโปรโตคอลนี้
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
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
                    ? `${Math.round(adherenceMetrics.averageResponseTime / 60000)} นาที`
                    : '-'
                  }
                </div>
                <div className="text-sm text-gray-600">เวลาตอบสนองเฉลี่ย</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Protocol Steps */}
      <Card>
        <CardHeader>
          <CardTitle>ขั้นตอนในโปรโตคอล</CardTitle>
          <CardDescription>
            รายละเอียดของแต่ละขั้นตอนในโปรโตคอล
          </CardDescription>
        </CardHeader>
        <CardContent>
          {protocol.steps && protocol.steps.length > 0 ? (
            <div className="space-y-4">
              {protocol.steps
                .sort((a: any, b: any) => a.stepOrder - b.stepOrder)
                .map((step: any, index: number) => (
                  <div key={step.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">ขั้นตอน {step.stepOrder}</Badge>
                        <Badge variant="secondary">{getTriggerTypeLabel(step.triggerType)}</Badge>
                        <Badge variant="secondary">{getMessageTypeLabel(step.messageType)}</Badge>
                        {step.requiresAction && (
                          <Badge variant="warning">ต้องการตอบกลับ</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">การเรียกใช้: </span>
                        <span className="text-sm text-gray-600">
                          {step.triggerValue} {step.triggerType === 'delay' ? 'นาทีหลังขั้นตอนก่อนหน้า' : 
                                            step.triggerType === 'scheduled' ? 'น.' : ''}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">เนื้อหา: </span>
                        <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                          {step.messageType === 'text' && step.contentPayload.text}
                          {step.messageType === 'image' && (
                            <div>
                              <p>รูปภาพ: {step.contentPayload.imageUrl}</p>
                              {step.contentPayload.text && (
                                <p className="mt-1">ข้อความประกอบ: {step.contentPayload.text}</p>
                              )}
                            </div>
                          )}
                          {step.messageType === 'link' && (
                            <div>
                              <p>ลิงก์: {step.contentPayload.linkText}</p>
                              <p className="text-blue-600">{step.contentPayload.linkUrl}</p>
                            </div>
                          )}
                          {step.messageType === 'flex' && (
                            <p>Flex Message (ข้อมูล JSON)</p>
                          )}
                        </div>
                      </div>

                      {step.requiresAction && step.feedbackConfig && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">คำถามสำหรับผู้ป่วย: </span>
                          <span className="text-sm text-gray-600">
                            {step.feedbackConfig.question || 'คุณได้ทำตามคำแนะนำแล้วหรือยัง?'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>ยังไม่มีขั้นตอนในโปรโตคอลนี้</p>
              <Link href={`/dashboard/protocols/${protocolId}/edit`}>
                <Button className="mt-4">เพิ่มขั้นตอน</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}