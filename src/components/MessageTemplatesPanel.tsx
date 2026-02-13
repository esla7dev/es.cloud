import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MessageTemplate } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { 
  MessageSquare, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  FileText,
  Send
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

export default function MessageTemplatesPanel() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'offer' as MessageTemplate['type'],
    subject: '',
    content: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await BusinessApiService.getMessageTemplates();
      
      // If no templates exist, create default ones
      if (templatesData.length === 0) {
        await BusinessApiService.createDefaultTemplates();
        const newTemplatesData = await BusinessApiService.getMessageTemplates();
        setTemplates(newTemplatesData);
      } else {
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setActionLoading('create');
    try {
      await BusinessApiService.createMessageTemplate(formData);
      await loadTemplates();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('فشل في إنشاء القالب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim() || !formData.subject.trim() || !formData.content.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setActionLoading(editingTemplate.id);
    try {
      await BusinessApiService.updateMessageTemplate(editingTemplate.id, {
        name: formData.name,
        subject: formData.subject,
        content: formData.content
      });
      await loadTemplates();
      setEditingTemplate(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('فشل في تحديث القالب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    setActionLoading(templateId);
    try {
      await BusinessApiService.deleteMessageTemplate(templateId);
      await loadTemplates();
      toast.success('تم حذف القالب بنجاح');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('فشل في حذف القالب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      type: template.type,
      subject: template.subject,
      content: template.content
    });
  };

  const handleCopyTemplate = (template: MessageTemplate) => {
    setFormData({
      name: `نسخة من ${template.name}`,
      type: template.type,
      subject: template.subject,
      content: template.content
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'offer',
      subject: '',
      content: ''
    });
  };

  const getTypeText = (type: MessageTemplate['type']) => {
    return type === 'offer' ? 'عرض' : 'متابعة';
  };

  const getTypeColor = (type: MessageTemplate['type']) => {
    return type === 'offer' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  // Calculate stats
  const offerTemplates = templates.filter(t => t.type === 'offer').length;
  const followUpTemplates = templates.filter(t => t.type === 'follow_up').length;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل القوالب...</p>
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
            قالب جديد
          </button>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">قوالب الرسائل</h2>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">إجمالي القوالب</p>
            <p className="text-2xl font-bold text-purple-600">{formatArabicNumber(templates.length)}</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">قوالب العروض</p>
            <p className="text-2xl font-bold text-blue-600">{formatArabicNumber(offerTemplates)}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">قوالب المتابعة</p>
            <p className="text-2xl font-bold text-green-600">{formatArabicNumber(followUpTemplates)}</p>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 text-right">القوالب المحفوظة</h3>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء قالب رسالة جديد</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              إنشاء قالب جديد
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {actionLoading === template.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="حذف القالب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyTemplate(template)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="نسخ القالب"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="تعديل القالب"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewTemplate(template)}
                          className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                          title="معاينة القالب"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold text-gray-900 text-lg" dir="rtl">
                      {template.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <span className="text-xs text-gray-500">
                        {formatArabicDate(template.created_at)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                        {getTypeText(template.type)}
                      </span>
                      {template.is_default && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-50">
                          افتراضي
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium text-gray-800 mb-2" dir="rtl">
                    الموضوع: {template.subject}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-3" dir="rtl">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'تعديل القالب' : 'إنشاء قالب جديد'}
                </h3>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    اسم القالب *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="مثال: قالب العرض الأساسي"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نوع القالب *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MessageTemplate['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  >
                    <option value="offer">عرض</option>
                    <option value="follow_up">متابعة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    موضوع الرسالة *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="مثال: عرض خاص لـ {businessName}"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    محتوى الرسالة *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="اكتب محتوى الرسالة هنا..."
                    dir="rtl"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    يمكنك استخدام المتغيرات: {'{businessName}'}, {'{companyName}'}, {'{senderName}'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center gap-3 justify-start">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  disabled={actionLoading === 'create' || (editingTemplate && actionLoading === editingTemplate.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(actionLoading === 'create' || (editingTemplate && actionLoading === editingTemplate.id)) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'حفظ التغييرات' : 'إنشاء القالب'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">معاينة القالب</h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 text-right">اسم القالب:</p>
                  <p className="text-gray-900" dir="rtl">{previewTemplate.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 text-right">النوع:</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(previewTemplate.type)}`}>
                    {getTypeText(previewTemplate.type)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 text-right">الموضوع:</p>
                  <p className="text-gray-900" dir="rtl">{previewTemplate.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1 text-right">المحتوى:</p>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-wrap text-sm" dir="rtl">
                      {previewTemplate.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}