import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Campaign } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { 
  ShoppingCart, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle, 
  Trash2, 
  Calendar,
  Target,
  Users,
  Globe,
  Phone,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

interface CampaignsPanelProps {
  onCampaignCreated?: () => void;
}

export default function CampaignsPanel({ onCampaignCreated }: CampaignsPanelProps) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSearchId, setSelectedSearchId] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [searches, setSearches] = useState<any[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState('966');
  const [selectedOfferTemplateId, setSelectedOfferTemplateId] = useState('');
  const [selectedFollowUpTemplateId, setSelectedFollowUpTemplateId] = useState('');

  useEffect(() => {
    loadCampaigns();
    loadSearches();
    loadMessageTemplates();
  }, []);

  const loadCampaigns = async () => {
    try {
      const campaignsData = await BusinessApiService.getCampaigns();
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSearches = async () => {
    try {
      const searchHistory = await BusinessApiService.getSearchHistory();
      setSearches(searchHistory);
    } catch (error) {
      console.error('Failed to load searches:', error);
    }
  };

  const loadMessageTemplates = async () => {
    try {
      const templates = await BusinessApiService.getMessageTemplates();
      setMessageTemplates(templates);
    } catch (error) {
      console.error('Failed to load message templates:', error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedSearchId || !campaignName.trim()) return;

    // Validate that the selected search has results
    const selectedSearch = searches.find(s => s.id === selectedSearchId);
    if (!selectedSearch) {
      toast.error('فشل في العثور على البحث المحدد');
      return;
    }

    if (selectedSearch.results_count === 0) {
      toast.error('لا يمكن إنشاء حملة من بحث لا يحتوي على نتائج. يرجى اختيار بحث يحتوي على أعمال تجارية.');
      return;
    }
    setActionLoading('create');
    try {
      await BusinessApiService.createCampaign(
        selectedSearchId, 
        campaignName.trim(),
        selectedCountryCode,
        selectedOfferTemplateId || undefined,
        selectedFollowUpTemplateId || undefined
      );
      await loadCampaigns();
      
      // Notify parent component to refresh sidebar
      if (onCampaignCreated) {
        onCampaignCreated();
      }
      
      setShowCreateModal(false);
      setCampaignName('');
      setSelectedSearchId('');
      setSelectedCountryCode('966');
      setSelectedOfferTemplateId('');
      setSelectedFollowUpTemplateId('');
      toast.success('تم إنشاء الحملة بنجاح');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل في إنشاء الحملة';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: Campaign['status']) => {
    setActionLoading(campaignId);
    try {
      await BusinessApiService.updateCampaignStatus(campaignId, newStatus);
      await loadCampaigns();
      toast.success('تم تحديث حالة الحملة بنجاح');
    } catch (error) {
      console.error('Failed to update campaign status:', error);
      toast.error('فشل في تحديث حالة الحملة');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحملة؟')) return;

    setActionLoading(campaignId);
    try {
      await BusinessApiService.deleteCampaign(campaignId);
      await loadCampaigns();
      
      // Notify parent component to refresh sidebar
      if (onCampaignCreated) {
        onCampaignCreated();
      }
      toast.success('تم حذف الحملة بنجاح');
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('فشل في حذف الحملة');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (campaign: Campaign) => {
    navigate(`/campaigns/${campaign.id}`);
  };

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'paused': return 'متوقف';
      case 'completed': return 'مكتمل';
      default: return 'مسودة';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Calculate summary stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalBusinesses = campaigns.reduce((sum, c) => sum + c.total_businesses, 0);
  const totalContacted = campaigns.reduce((sum, c) => sum + c.contacted_businesses, 0);

  // Country options
  const countryOptions = [
    { code: '966', name: 'السعودية', flag: '🇸🇦' },
    { code: '20', name: 'مصر', flag: '🇪🇬' },
    { code: '971', name: 'الإمارات', flag: '🇦🇪' },
    { code: '974', name: 'قطر', flag: '🇶🇦' },
    { code: '968', name: 'عمان', flag: '🇴🇲' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل الحملات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            حملة جديدة
          </button>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">الحملات التسويقية</h2>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600">الحملات</p>
            <p className="text-2xl font-bold text-orange-600">{formatArabicNumber(totalCampaigns)}</p>
            <p className="text-xs text-gray-500">حملة</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">تم التواصل</p>
            <p className="text-2xl font-bold text-purple-600">{formatArabicNumber(totalContacted)}</p>
            <p className="text-xs text-gray-500">عمل</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">الأعمال</p>
            <p className="text-2xl font-bold text-green-600">{formatArabicNumber(totalBusinesses)}</p>
            <p className="text-xs text-gray-500">عمل</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">المحملات</p>
            <p className="text-2xl font-bold text-blue-600">{formatArabicNumber(activeCampaigns)}</p>
            <p className="text-xs text-gray-500">نشط</p>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 text-right">الحملات الحديثة</h3>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد حملات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء حملة تسويقية جديدة</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              إنشاء حملة جديدة
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <div 
                key={campaign.id} 
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleViewDetails(campaign)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {actionLoading === campaign.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="حذف الحملة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold text-gray-900 text-lg" dir="rtl">
                      {campaign.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className="text-xs text-gray-500">
                        {formatArabicDate(campaign.created_at)}
                      </span>
                      <Calendar className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(campaign.status)}`}>
                      {getStatusIcon(campaign.status)}
                      {getStatusText(campaign.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600" dir="rtl">
                      البحث: {campaign.search?.keywords}
                    </p>
                    <p className="text-xs text-gray-500" dir="rtl">
                      الموقع: {campaign.search?.location}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      {formatArabicNumber(campaign.progress)}%
                    </span>
                    <span className="text-xs text-gray-600">التقدم</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">النتائج</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatArabicNumber(campaign.total_businesses)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Globe className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">المواقع</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatArabicNumber(campaign.websites_extracted)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">الهواتف</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatArabicNumber(campaign.phones_extracted)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center mb-1">
                      <Target className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-600">المحملات</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatArabicNumber(campaign.contacted_businesses)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {campaign.status !== 'completed' && (
                  <div className="flex items-center gap-2 mt-4 justify-start" onClick={(e) => e.stopPropagation()}>
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                        disabled={actionLoading === campaign.id}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        بدء الحملة
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'paused')}
                          disabled={actionLoading === campaign.id}
                          className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          <Pause className="w-3 h-3" />
                          إيقاف مؤقت
                        </button>
                        <button
                          onClick={() => handleStatusChange(campaign.id, 'completed')}
                          disabled={actionLoading === campaign.id}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          إكمال
                        </button>
                      </>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(campaign.id, 'active')}
                        disabled={actionLoading === campaign.id}
                        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        استئناف
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">
              إنشاء حملة جديدة
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم الحملة
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مثال: حملة المطاعم في الرياض"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  الدولة المستهدفة
                </label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                >
                  {countryOptions.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.name} (+{country.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  قالب العرض الافتراضي (اختياري)
                </label>
                <select
                  value={selectedOfferTemplateId}
                  onChange={(e) => setSelectedOfferTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                >
                  <option value="">بدون قالب عرض افتراضي</option>
                  {messageTemplates.filter(t => t.type === 'offer').map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  قالب المتابعة الافتراضي (اختياري)
                </label>
                <select
                  value={selectedFollowUpTemplateId}
                  onChange={(e) => setSelectedFollowUpTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                >
                  <option value="">بدون قالب متابعة افتراضي</option>
                  {messageTemplates.filter(t => t.type === 'follow_up').map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اختر البحث
                </label>
                <select
                  value={selectedSearchId}
                  onChange={(e) => setSelectedSearchId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                >
                  <option value="">اختر بحث...</option>
                  {searches.map((search) => (
                    <option key={search.id} value={search.id}>
                      {search.keywords} - {search.location} ({formatArabicNumber(search.results_count)} نتيجة)
                      {search.results_count === 0 && ' - لا توجد نتائج'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 justify-start">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!selectedSearchId || !campaignName.trim() || actionLoading === 'create'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                إنشاء الحملة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}