'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiClient.getUserStats(),
  });

  const { data: dashboardMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const stats = [
    {
      title: 'ผู้ป่วยทั้งหมด',
      value: dashboardMetrics?.totalPatients || userStats?.totalUsers || 0,
      icon: Users,
      description: 'จำนวนผู้ป่วยที่ลงทะเบียนในระบบ',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'ผู้ป่วยที่ใช้งานอยู่',
      value: dashboardMetrics?.activePatients || userStats?.activeUsers || 0,
      icon: TrendingUp,
      description: 'ผู้ป่วยที่ยังคงใช้งานระบบ',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'โปรโตคอลที่ใช้งาน',
      value: dashboardMetrics?.activeProtocols || 0,
      icon: FileText,
      description: 'โปรโตคอลที่กำลังดำเนินการ',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'อัตราการปฏิบัติตาม',
      value: dashboardMetrics?.overallAdherenceRate ? `${Math.round(dashboardMetrics.overallAdherenceRate)}%` : '0%',
      icon: Clock,
      description: 'อัตราการปฏิบัติตามโดยรวม',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ภาพรวมระบบ</h1>
        <p className="mt-2 text-gray-600">
          ติดตามสถานะและประสิทธิภาพของระบบการแจ้งเตือนผู้ป่วย
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats || isLoadingMetrics ? (
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                ) : (
                  typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ผู้ป่วยที่เข้าร่วมล่าสุด</CardTitle>
            <CardDescription>
              ผู้ป่วยที่ลงทะเบียนเข้าใช้งานระบบล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users && users.length > 0 ? (
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || 'ไม่ระบุชื่อ'}
                      </p>
                      <p className="text-xs text-gray-500">
                        เข้าร่วมเมื่อ {new Date(user.joinedAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                ยังไม่มีผู้ป่วยในระบบ
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
            <CardDescription>
              กิจกรรมและการแจ้งเตือนที่เกิดขึ้นล่าสุด
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>ยังไม่มีกิจกรรมในระบบ</p>
              <p className="text-sm mt-1">
                กิจกรรมจะแสดงที่นี่เมื่อมีการส่งข้อความหรือการตอบกลับ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}