'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Eye } from 'lucide-react';

const protocolSchema = z.object({
  name: z.string().min(1, 'กรุณาใส่ชื่อโปรโตคอล'),
  description: z.string().optional(),
});

const stepSchema = z.object({
  stepOrder: z.string().min(1),
  triggerType: z.enum(['immediate', 'delay', 'scheduled']),
  triggerValue: z.string().min(1, 'กรุณาใส่ค่าการเรียกใช้'),
  messageType: z.enum(['text', 'image', 'link', 'flex']),
  contentPayload: z.object({
    text: z.string().optional(),
    imageUrl: z.string().optional(),
    linkUrl: z.string().optional(),
    linkText: z.string().optional(),
    flexMessage: z.any().optional(),
  }),
  requiresAction: z.boolean(),
  feedbackConfig: z.object({
    question: z.string().min(1),
    buttons: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
      action: z.enum(['complete', 'postpone', 'skip']),
    })).min(1).max(5),
  }).optional(),
});

type ProtocolForm = z.infer<typeof protocolSchema>;
type StepForm = z.infer<typeof stepSchema>;

export default function NewProtocolPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [steps, setSteps] = useState<StepForm[]>([]);
  const [currentStep, setCurrentStep] = useState<Partial<StepForm>>({
    stepOrder: '1',
    triggerType: 'immediate',
    triggerValue: '0',
    messageType: 'text',
    contentPayload: { text: '' },
    requiresAction: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProtocolForm>({
    resolver: zodResolver(protocolSchema),
  });

  const addStep = () => {
    if (currentStep.triggerType && currentStep.messageType && currentStep.triggerValue) {
      const newStep: StepForm = {
        stepOrder: String(steps.length + 1),
        triggerType: currentStep.triggerType,
        triggerValue: currentStep.triggerValue,
        messageType: currentStep.messageType,
        contentPayload: currentStep.contentPayload || { text: '' },
        requiresAction: currentStep.requiresAction || false,
        feedbackConfig: currentStep.requiresAction ? currentStep.feedbackConfig : undefined,
      };
      setSteps([...steps, newStep]);
      setCurrentStep({
        stepOrder: String(steps.length + 2),
        triggerType: 'immediate',
        triggerValue: '0',
        messageType: 'text',
        contentPayload: { text: '' },
        requiresAction: false,
      });
    }
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder steps
    const reorderedSteps = newSteps.map((step, i) => ({
      ...step,
      stepOrder: String(i + 1),
    }));
    setSteps(reorderedSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      // Reorder steps
      const reorderedSteps = newSteps.map((step, i) => ({
        ...step,
        stepOrder: String(i + 1),
      }));
      setSteps(reorderedSteps);
    }
  };

  const onSubmit = async (data: ProtocolForm) => {
    setIsLoading(true);
    try {
      const protocol = await apiClient.createProtocol(data);
      
      // Create steps
      for (const step of steps) {
        await apiClient.createProtocolStep(protocol.id, step);
      }
      
      router.push('/dashboard/protocols');
    } catch (error) {
      console.error('Failed to create protocol:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">สร้างโปรโตคอลใหม่</h1>
        <p className="mt-2 text-gray-600">
          สร้างโปรโตคอลการดูแลผู้ป่วยพร้อมขั้นตอนการส่งข้อความ
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Protocol Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลพื้นฐานโปรโตคอล</CardTitle>
            <CardDescription>
              กำหนดชื่อและคำอธิบายของโปรโตคอล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อโปรโตคอล *
              </label>
              <Input
                id="name"
                {...register('name')}
                placeholder="เช่น โปรโตคอลการทานยาประจำวัน"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                คำอธิบาย
              </label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="อธิบายรายละเอียดของโปรโตคอล..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step Builder */}
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มขั้นตอนใหม่</CardTitle>
            <CardDescription>
              สร้างขั้นตอนการส่งข้อความในโปรโตคอล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทการเรียกใช้
                </label>
                <Select
                  value={currentStep.triggerType}
                  onValueChange={(value) => setCurrentStep({
                    ...currentStep,
                    triggerType: value as 'immediate' | 'delay' | 'scheduled'
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">ส่งทันที</SelectItem>
                    <SelectItem value="delay">หน่วงเวลา (นาที)</SelectItem>
                    <SelectItem value="scheduled">กำหนดเวลา (HH:MM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ค่าการเรียกใช้
                </label>
                <Input
                  value={currentStep.triggerValue}
                  onChange={(e) => setCurrentStep({
                    ...currentStep,
                    triggerValue: e.target.value
                  })}
                  placeholder={
                    currentStep.triggerType === 'delay' ? 'เช่น 60 (นาที)' :
                    currentStep.triggerType === 'scheduled' ? 'เช่น 08:00' : '0'
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเภทข้อความ
              </label>
              <Select
                value={currentStep.messageType}
                onValueChange={(value) => setCurrentStep({
                  ...currentStep,
                  messageType: value as 'text' | 'image' | 'link' | 'flex'
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">ข้อความธรรมดา</SelectItem>
                  <SelectItem value="image">รูปภาพ</SelectItem>
                  <SelectItem value="link">ลิงก์</SelectItem>
                  <SelectItem value="flex">Flex Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content based on message type */}
            {currentStep.messageType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เนื้อหาข้อความ
                </label>
                <Textarea
                  value={currentStep.contentPayload?.text || ''}
                  onChange={(e) => setCurrentStep({
                    ...currentStep,
                    contentPayload: { ...currentStep.contentPayload, text: e.target.value }
                  })}
                  placeholder="พิมพ์ข้อความที่ต้องการส่ง..."
                  rows={3}
                />
              </div>
            )}

            {currentStep.messageType === 'image' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL รูปภาพ
                  </label>
                  <Input
                    value={currentStep.contentPayload?.imageUrl || ''}
                    onChange={(e) => setCurrentStep({
                      ...currentStep,
                      contentPayload: { ...currentStep.contentPayload, imageUrl: e.target.value }
                    })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อความประกอบ (ไม่บังคับ)
                  </label>
                  <Input
                    value={currentStep.contentPayload?.text || ''}
                    onChange={(e) => setCurrentStep({
                      ...currentStep,
                      contentPayload: { ...currentStep.contentPayload, text: e.target.value }
                    })}
                    placeholder="ข้อความประกอบรูปภาพ"
                  />
                </div>
              </div>
            )}

            {currentStep.messageType === 'link' && (
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL ลิงก์
                  </label>
                  <Input
                    value={currentStep.contentPayload?.linkUrl || ''}
                    onChange={(e) => setCurrentStep({
                      ...currentStep,
                      contentPayload: { ...currentStep.contentPayload, linkUrl: e.target.value }
                    })}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อความลิงก์
                  </label>
                  <Input
                    value={currentStep.contentPayload?.linkText || ''}
                    onChange={(e) => setCurrentStep({
                      ...currentStep,
                      contentPayload: { ...currentStep.contentPayload, linkText: e.target.value }
                    })}
                    placeholder="คลิกที่นี่"
                  />
                </div>
              </div>
            )}

            {/* Action Required Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresAction"
                checked={currentStep.requiresAction}
                onChange={(e) => setCurrentStep({
                  ...currentStep,
                  requiresAction: e.target.checked
                })}
                className="rounded border-gray-300"
              />
              <label htmlFor="requiresAction" className="text-sm font-medium text-gray-700">
                ต้องการการตอบกลับจากผู้ป่วย
              </label>
            </div>

            {/* Feedback Configuration */}
            {currentStep.requiresAction && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำถามสำหรับผู้ป่วย
                  </label>
                  <Input
                    value={currentStep.feedbackConfig?.question || ''}
                    onChange={(e) => setCurrentStep({
                      ...currentStep,
                      feedbackConfig: {
                        question: e.target.value,
                        buttons: [
                          { label: 'เรียบร้อยแล้ว', value: 'completed', action: 'complete' },
                          { label: 'ยังไม่ทำ', value: 'not_done', action: 'postpone' }
                        ]
                      }
                    })}
                    placeholder="คุณได้ทำตามคำแนะนำแล้วหรือยัง?"
                  />
                </div>
                <p className="text-xs text-gray-500">
                 {' ปุ่มตอบกลับมาตรฐาน: "เรียบร้อยแล้ว" และ "ยังไม่ทำ&quot;'}
                </p>
              </div>
            )}

            <Button type="button" onClick={addStep} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มขั้นตอน
            </Button>
          </CardContent>
        </Card>

        {/* Steps List */}
        {steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ขั้นตอนในโปรโตคอล ({steps.length} ขั้นตอน)</CardTitle>
              <CardDescription>
                จัดการลำดับและรายละเอียดของขั้นตอน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">ขั้นตอน {step.stepOrder}</Badge>
                        <Badge variant="secondary">{getTriggerTypeLabel(step.triggerType)}</Badge>
                        <Badge variant="secondary">{getMessageTypeLabel(step.messageType)}</Badge>
                        {step.requiresAction && (
                          <Badge variant="warning">ต้องการตอบกลับ</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {step.messageType === 'text' && step.contentPayload.text}
                        {step.messageType === 'image' && `รูปภาพ: ${step.contentPayload.imageUrl}`}
                        {step.messageType === 'link' && `ลิงก์: ${step.contentPayload.linkText} (${step.contentPayload.linkUrl})`}
                        {step.messageType === 'flex' && 'Flex Message'}
                      </p>
                      <p className="text-xs text-gray-500">
                        เรียกใช้: {step.triggerValue} {step.triggerType === 'delay' ? 'นาทีหลังขั้นตอนก่อนหน้า' : step.triggerType === 'scheduled' ? 'น.' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isLoading || steps.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'กำลังบันทึก...' : 'บันทึกโปรโตคอล'}
          </Button>
        </div>
      </form>
    </div>
  );
}