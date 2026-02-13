import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserProfile } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Calendar
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

export default function UserSettingsPanel() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    company_name: '',
    sender_name: '',
    phone: '',
    address: '',
    website: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await BusinessApiService.getUserProfile();
      setProfile(profileData);
      
      // Initialize form data with profile values
      setFormData({
        company_name: profileData.company_name || '',
        sender_name: profileData.sender_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        website: profileData.website || ''
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setSaveStatus('idle'); // Reset save status when user makes changes
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      
      await BusinessApiService.updateUserProfile(formData);
      
      // Reload profile to get updated data
      await loadProfile();
      
      toast.success('تم حفظ التغييرات بنجاح');
      setSaveStatus('success');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('فشل في حفظ التغييرات');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const isFormChanged = () => {
    if (!profile) return false;
    
    return (
      formData.company_name !== (profile.company_name || '') ||
      formData.sender_name !== (profile.sender_name || '') ||
      formData.phone !== (profile.phone || '') ||
      formData.address !== (profile.address || '') ||
      formData.website !== (profile.website || '')
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">خطأ في تحميل البيانات</h3>
          <p className="text-gray-600">فشل في تحميل بيانات المستخدم</p>
          <button
            onClick={loadProfile}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">إعدادات الحساب</h2>
        </div>

        {/* Account Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">البريد الإلكتروني</p>
            <p className="text-sm font-medium text-blue-600 truncate" dir="ltr">
              {profile.email}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">الرصيد المتاح</p>
            <p className="text-lg font-bold text-green-600">
              {formatArabicNumber(profile.credits)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">تاريخ التسجيل</p>
            <p className="text-sm font-medium text-purple-600">
              {formatArabicDate(profile.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Settings Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم الحفظ بنجاح</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">فشل في الحفظ</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">البيانات الشخصية والتجارية</h3>
        </div>

        <div className="space-y-6">
          {/* Company Information */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 text-right flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              معلومات الشركة
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم الشركة
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مثال: شركة التقنية المتقدمة"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  سيتم استخدام هذا الاسم في قوالب الرسائل والفواتير
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  الموقع الإلكتروني
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  pattern="https?://.*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="https://example.com"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="border-b border-gray-200 pb-6">
            <h4 className="text-md font-medium text-gray-900 mb-4 text-right flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              المعلومات الشخصية
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  اسم المرسل
                </label>
                <input
                  type="text"
                  value={formData.sender_name}
                  onChange={(e) => handleInputChange('sender_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مثال: أحمد محمد"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  الاسم الذي سيظهر في رسائل التسويق
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مثال: +966501234567"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4 text-right flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              معلومات العنوان
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                العنوان التجاري
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                placeholder="مثال: شارع الملك فهد، الرياض 12345، المملكة العربية السعودية"
                dir="rtl"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                سيتم استخدام هذا العنوان في الفواتير والمراسلات الرسمية
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-start mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || !isFormChanged()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
          {!isFormChanged() && (
            <p className="text-sm text-gray-500 mr-4">لا توجد تغييرات للحفظ</p>
          )}
        </div>
      </div>

      {/* Usage Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h4 className="text-md font-medium text-gray-900 mb-3 text-right">كيف يتم استخدام هذه البيانات؟</h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2 text-right">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span dir="rtl">
              <strong>قوالب الرسائل:</strong> يتم استخدام اسم الشركة واسم المرسل تلقائياً في رسائل الواتساب
            </span>
          </div>
          <div className="flex items-start gap-2 text-right">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span dir="rtl">
              <strong>الفواتير المستقبلية:</strong> ستستخدم هذه البيانات في نظام الفوترة والمحاسبة
            </span>
          </div>
          <div className="flex items-start gap-2 text-right">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span dir="rtl">
              <strong>نظام CRM:</strong> ستساعد في تخصيص تجربة العملاء وإدارة العلاقات
            </span>
          </div>
          <div className="flex items-start gap-2 text-right">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span dir="rtl">
              <strong>الأمان:</strong> جميع البيانات محمية ومشفرة ولن يتم مشاركتها مع أطراف ثالثة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}