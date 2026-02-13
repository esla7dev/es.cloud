import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BusinessApiService } from '../services/businessApi';
import { 
  BarChart3,
  Search,
  ShoppingCart,
  MessageSquare,
  User,
  CreditCard,
  Target,
  Globe,
  Phone,
  TrendingUp,
  Calendar,
  ArrowRight,
  Loader2,
  Plus,
  Eye,
  Activity,
  Zap
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

interface DashboardStats {
  profile: {
    email: string;
    credits: number;
    created_at: string;
  };
  campaigns: {
    total: number;
    active: number;
    totalBusinesses: number;
    contactedBusinesses: number;
    totalMRR: number;
    totalDeals: number;
  };
  searches: {
    total: number;
    totalResults: number;
    withWebsites: number;
    withPhones: number;
  };
  recentActivity: Array<{
    type: 'campaign' | 'search' | 'template';
    name: string;
    date: string;
    id?: string;
  }>;
}

interface UserDashboardPanelProps {
  setActiveTab: (tab: string) => void;
}

export default function UserDashboardPanel({ setActiveTab }: UserDashboardPanelProps) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [profile, campaigns, searches, templates] = await Promise.all([
        BusinessApiService.getUserProfile(),
        BusinessApiService.getCampaigns(),
        BusinessApiService.getSearchHistory(),
        BusinessApiService.getMessageTemplates()
      ]);

      // Calculate campaign stats
      const campaignStats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        totalBusinesses: campaigns.reduce((sum, c) => sum + c.total_businesses, 0),
        contactedBusinesses: campaigns.reduce((sum, c) => sum + c.contacted_businesses, 0),
        totalMRR: 0, // Will be calculated from interactions if needed
        totalDeals: 0 // Will be calculated from interactions if needed
      };

      // Calculate search stats
      const searchStats = {
        total: searches.length,
        totalResults: searches.reduce((sum, s) => sum + s.results_count, 0),
        withWebsites: searches.reduce((sum, s) => 
          sum + (s.business_results?.filter(r => r.website).length || 0), 0),
        withPhones: searches.reduce((sum, s) => 
          sum + (s.business_results?.filter(r => r.phone).length || 0), 0)
      };

      // Create recent activity
      const recentActivity = [
        ...campaigns.slice(0, 3).map(c => ({
          type: 'campaign' as const,
          name: c.name,
          date: c.created_at,
          id: c.id
        })),
        ...searches.slice(0, 3).map(s => ({
          type: 'search' as const,
          name: `${s.keywords} - ${s.location}`,
          date: s.created_at
        })),
        ...templates.slice(0, 2).map(t => ({
          type: 'template' as const,
          name: t.name,
          date: t.created_at
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      setStats({
        profile: {
          email: profile.email,
          credits: profile.credits,
          created_at: profile.created_at
        },
        campaigns: campaignStats,
        searches: searchStats,
        recentActivity
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('فشل في تحميل بيانات لوحة التحكم');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setActiveTab(action);
    if (action !== 'dashboard') {
      navigate('/');
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-gray-600 mb-4">فشل في تحميل بيانات لوحة التحكم</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQuickAction('search')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              بحث جديد
            </button>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h1>
            <p className="text-blue-100" dir="ltr">{stats.profile.email}</p>
            <p className="text-blue-200 text-sm">
              عضو منذ {formatArabicDate(stats.profile.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">الرصيد المتاح</p>
          <p className="text-2xl font-bold text-green-600">{formatArabicNumber(stats.profile.credits)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">الحملات النشطة</p>
          <p className="text-2xl font-bold text-blue-600">{formatArabicNumber(stats.campaigns.active)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">تم التواصل</p>
          <p className="text-2xl font-bold text-purple-600">{formatArabicNumber(stats.campaigns.contactedBusinesses)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">إجمالي النتائج</p>
          <p className="text-2xl font-bold text-orange-600">{formatArabicNumber(stats.searches.totalResults)}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Campaign Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleQuickAction('campaigns')}
              className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              عرض الكل
            </button>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              الحملات التسويقية
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-lg font-bold text-gray-900">{formatArabicNumber(stats.campaigns.total)}</span>
              <span className="text-sm text-gray-600">إجمالي الحملات</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-lg font-bold text-blue-600">{formatArabicNumber(stats.campaigns.active)}</span>
              <span className="text-sm text-gray-600">حملات نشطة</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-lg font-bold text-green-600">{formatArabicNumber(stats.campaigns.totalBusinesses)}</span>
              <span className="text-sm text-gray-600">إجمالي الأعمال</span>
            </div>
          </div>

          <button
            onClick={() => handleQuickAction('campaigns')}
            className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            إدارة الحملات
          </button>
        </div>

        {/* Search Overview */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleQuickAction('history')}
              className="text-green-600 hover:text-green-800 transition-colors text-sm font-medium flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4" />
              عرض الكل
            </button>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-green-600" />
              عمليات البحث
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-lg font-bold text-gray-900">{formatArabicNumber(stats.searches.total)}</span>
              <span className="text-sm text-gray-600">عمليات بحث</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-lg font-bold text-orange-600">{formatArabicNumber(stats.searches.totalResults)}</span>
              <span className="text-sm text-gray-600">نتائج البحث</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <span className="text-sm font-bold text-purple-600">{formatArabicNumber(stats.searches.withWebsites)}</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-purple-600" />
                  <span className="text-xs text-gray-600">مواقع</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                <span className="text-sm font-bold text-indigo-600">{formatArabicNumber(stats.searches.withPhones)}</span>
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-indigo-600" />
                  <span className="text-xs text-gray-600">هواتف</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleQuickAction('search')}
            className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            بحث جديد
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            إجراءات سريعة
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => handleQuickAction('search')}
              className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-between"
            >
              <ArrowRight className="w-4 h-4 text-blue-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">بحث جديد</p>
                <p className="text-xs text-gray-600">ابحث عن أعمال جديدة</p>
              </div>
              <Search className="w-5 h-5 text-blue-600" />
            </button>

            <button
              onClick={() => handleQuickAction('templates')}
              className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center justify-between"
            >
              <ArrowRight className="w-4 h-4 text-purple-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">قوالب الرسائل</p>
                <p className="text-xs text-gray-600">إدارة قوالب الواتساب</p>
              </div>
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </button>

            <button
              onClick={() => handleQuickAction('settings')}
              className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
            >
              <ArrowRight className="w-4 h-4 text-gray-600" />
              <div className="text-right">
                <p className="font-medium text-gray-900">إعدادات الحساب</p>
                <p className="text-xs text-gray-600">تحديث البيانات الشخصية</p>
              </div>
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-600" />
          النشاط الأخير
        </h3>

        {stats.recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا يوجد نشاط حديث</p>
            <p className="text-sm text-gray-500">ابدأ بإنشاء حملة أو البحث عن أعمال</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                  activity.type === 'campaign' 
                    ? 'bg-blue-50 border-blue-500' 
                    : activity.type === 'search'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-purple-50 border-purple-500'
                } ${activity.type === 'campaign' && activity.id ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                onClick={() => {
                  if (activity.type === 'campaign' && activity.id) {
                    handleViewCampaign(activity.id);
                  }
                }}
              >
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{formatArabicDate(activity.date)}</span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900" dir="rtl">{activity.name}</p>
                  <p className="text-xs text-gray-600">
                    {activity.type === 'campaign' ? 'حملة تسويقية' : 
                     activity.type === 'search' ? 'عملية بحث' : 'قالب رسالة'}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'campaign' 
                    ? 'bg-blue-100' 
                    : activity.type === 'search'
                    ? 'bg-green-100'
                    : 'bg-purple-100'
                }`}>
                  {activity.type === 'campaign' ? (
                    <ShoppingCart className={`w-4 h-4 text-blue-600`} />
                  ) : activity.type === 'search' ? (
                    <Search className={`w-4 h-4 text-green-600`} />
                  ) : (
                    <MessageSquare className={`w-4 h-4 text-purple-600`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}