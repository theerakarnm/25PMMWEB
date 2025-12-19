/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';

// Validation schemas
const protocolStepSchema = z.object({
  stepOrder: z.string().min(1),
  triggerType: z.enum(['immediate', 'delay', 'scheduled']),
  triggerValue: z.string().min(1),
  messageType: z.enum(['text', 'image', 'link', 'flex']),
  contentPayload: z.object({
    text: z.string().optional(),
    imageUrl: z.string().optional(),
    linkText: z.string().optional(),
    linkUrl: z.string().optional(),
    flexData: z.any().optional(),
  }),
  requiresAction: z.boolean(),
  feedbackConfig: z.object({
    question: z.string().optional(),
    responseType: z.enum(['yes_no', 'scale', 'text']).optional(),
  }).optional(),
});

const protocolSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อโปรโตคอล'),
  description: z.string().optional(),
  steps: z.array(protocolStepSchema),
});

type ProtocolFormData = z.infer<typeof protocolSchema>;

export default function EditProtocolPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const protocolId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: protocol, isLoading } = useQuery({
    queryKey: ['protocol', protocolId],
    queryFn: () => apiClient.getProtocolWithSteps(protocolId),
    enabled: !!protocolId,
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProtocolFormData>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      name: '',
      description: '',
      steps: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'steps',
  });

  // Reset form when protocol data is loaded
  useEffect(() => {
    if (protocol) {
      reset({
        name: protocol.name,
        description: protocol.description || '',
        steps: protocol.steps?.map((step: any) => ({
          stepOrder: step.stepOrder,
          triggerType: step.triggerType,
          triggerValue: step.triggerValue,
          messageType: step.messageType,
          contentPayload: step.contentPayload,
          requiresAction: step.requiresAction,
          feedbackConfig: step.feedbackConfig || { question: '', responseType: 'yes_no' },
        })) || [],
      });
    }
  }, [protocol, reset]);

  const updateProtocolMutation = useMutation({
    mutationFn: (data: ProtocolFormData) => apiClient.updateProtocolWithSteps(protocolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocol', protocolId] });
      queryClient.invalidateQueries({ queryKey: ['protocols'] });
      router.push(`/dashboard/protocols/${protocolId}`);
    },
    onError: (error) => {
      console.error('Failed to update protocol:', error);
      alert('เกิดข้อผิดพลาดในการอัปเดตโปรโตคอล');
    },
  });

  const onSubmit = async (data: ProtocolFormData) => {
    setIsSubmitting(true);
    try {
      // Reorder steps based on their position in the array
      const orderedSteps = data.steps.map((step, index) => ({
        ...step,
        stepOrder: String(index + 1),
      }));

      await updateProtocolMutation.mutateAsync({
        ...data,
        steps: orderedSteps,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStep = () => {
    append({
      stepOrder: String(fields.length + 1),
      triggerType: 'immediate',
      triggerValue: '0',
      messageType: 'text',
      contentPayload: { text: '' },
      requiresAction: false,
      feedbackConfig: { question: '', responseType: 'yes_no' },
    });
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
          <Link href={`/dashboard/protocols/${protocolId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">แก้ไขโปรโตคอล</h1>
            <p className="text-gray-600 mt-1">แก้ไขข้อมูลและขั้นตอนของโปรโตคอล</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
            <CardDescription>
              ข้อมูลทั่วไปของโปรโตคอล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">ชื่อโปรโตคอล *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="ระบุชื่อโปรโตคอล"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="อธิบายรายละเอียดของโปรโตคอล"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Protocol Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>ขั้นตอนในโปรโตคอล</CardTitle>
                <CardDescription>
                  กำหนดขั้นตอนและเนื้อหาที่จะส่งให้ผู้ป่วย
                </CardDescription>
              </div>
              <Button type="button" onClick={addStep} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มขั้นตอน
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>ยังไม่มีขั้นตอนในโปรโตคอล</p>
                <Button type="button" onClick={addStep} className="mt-4">
                  เพิ่มขั้นตอนแรก
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">ขั้นตอน {index + 1}</Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Trigger Type */}
                      <div>
                        <Label>การเรียกใช้</Label>
                        <Select
                          value={watch(`steps.${index}.triggerType`)}
                          onValueChange={(value) => {
                            register(`steps.${index}.triggerType`).onChange({
                              target: { value, name: `steps.${index}.triggerType` }
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">ส่งทันที</SelectItem>
                            <SelectItem value="delay">หน่วงเวลา</SelectItem>
                            <SelectItem value="scheduled">กำหนดเวลา</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Trigger Value */}
                      <div>
                        <Label>
                          {watch(`steps.${index}.triggerType`) === 'delay' ? 'จำนวนนาที' :
                           watch(`steps.${index}.triggerType`) === 'scheduled' ? 'เวลา (ชั่วโมง)' : 'ค่า'}
                        </Label>
                        <Input
                          {...register(`steps.${index}.triggerValue`)}
                          placeholder={
                            watch(`steps.${index}.triggerType`) === 'delay' ? '30' :
                            watch(`steps.${index}.triggerType`) === 'scheduled' ? '09:00' : '0'
                          }
                        />
                      </div>

                      {/* Message Type */}
                      <div>
                        <Label>ประเภทข้อความ</Label>
                        <Select
                          value={watch(`steps.${index}.messageType`)}
                          onValueChange={(value) => {
                            register(`steps.${index}.messageType`).onChange({
                              target: { value, name: `steps.${index}.messageType` }
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">ข้อความ</SelectItem>
                            <SelectItem value="image">รูปภาพ</SelectItem>
                            <SelectItem value="link">ลิงก์</SelectItem>
                            <SelectItem value="flex">Flex Message</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Requires Action */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`requiresAction-${index}`}
                          {...register(`steps.${index}.requiresAction`)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`requiresAction-${index}`}>
                          ต้องการตอบกลับจากผู้ป่วย
                        </Label>
                      </div>
                    </div>

                    {/* Content based on message type */}
                    <div>
                      <Label>เนื้อหา</Label>
                      {watch(`steps.${index}.messageType`) === 'text' && (
                        <Textarea
                          {...register(`steps.${index}.contentPayload.text`)}
                          placeholder="ระบุข้อความที่จะส่ง"
                          rows={3}
                        />
                      )}

                      {watch(`steps.${index}.messageType`) === 'image' && (
                        <div className="space-y-2">
                          <Input
                            {...register(`steps.${index}.contentPayload.imageUrl`)}
                            placeholder="URL ของรูปภาพ"
                          />
                          <Textarea
                            {...register(`steps.${index}.contentPayload.text`)}
                            placeholder="ข้อความประกอบ (ไม่บังคับ)"
                            rows={2}
                          />
                        </div>
                      )}

                      {watch(`steps.${index}.messageType`) === 'link' && (
                        <div className="space-y-2">
                          <Input
                            {...register(`steps.${index}.contentPayload.linkText`)}
                            placeholder="ข้อความของลิงก์"
                          />
                          <Input
                            {...register(`steps.${index}.contentPayload.linkUrl`)}
                            placeholder="URL ของลิงก์"
                          />
                        </div>
                      )}

                      {watch(`steps.${index}.messageType`) === 'flex' && (
                        <Textarea
                          {...register(`steps.${index}.contentPayload.flexData`)}
                          placeholder="JSON ของ Flex Message"
                          rows={4}
                        />
                      )}
                    </div>

                    {/* Feedback Configuration */}
                    {watch(`steps.${index}.requiresAction`) && (
                      <div>
                        <Label>คำถามสำหรับผู้ป่วย</Label>
                        <Input
                          {...register(`steps.${index}.feedbackConfig.question`)}
                          placeholder="คุณได้ทำตามคำแนะนำแล้วหรือยัง?"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/dashboard/protocols/${protocolId}`}>
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </Button>
        </div>
      </form>
    </div>
  );
}