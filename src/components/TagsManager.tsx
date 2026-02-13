import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag as TagIcon } from 'lucide-react';
import { BusinessApiService } from '../services/businessApi';
import type { BusinessTag } from '../types/business';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export default function TagsManager() {
  const [tags, setTags] = useState<BusinessTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTag, setNewTag] = useState({
    name: '',
    color: PRESET_COLORS[0]
  });
  const [editData, setEditData] = useState({
    name: '',
    color: ''
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await BusinessApiService.getBusinessTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.name.trim()) return;

    try {
      await BusinessApiService.createBusinessTag(
        newTag.name.trim(),
        newTag.color
      );
      setNewTag({ name: '', color: PRESET_COLORS[0] });
      setShowAddForm(false);
      await loadTags();
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    if (!editData.name.trim()) return;

    try {
      await BusinessApiService.updateBusinessTag(
        tagId,
        editData.name.trim(),
        editData.color
      );
      setEditingTag(null);
      setEditData({ name: '', color: '' });
      await loadTags();
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الوسم؟ سيتم إزالته من جميع الأعمال المرتبطة به.')) {
      return;
    }

    try {
      await BusinessApiService.deleteBusinessTag(tagId);
      await loadTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const startEditing = (tag: BusinessTag) => {
    setEditingTag(tag.id);
    setEditData({ name: tag.name, color: tag.color });
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الوسوم</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          وسم جديد
        </button>
      </div>

      {/* Add Tag Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الوسم *
              </label>
              <input
                type="text"
                value={newTag.name}
                onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="مثال: عميل مهم، متابعة لاحقاً، إلخ"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اللون
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewTag({ ...newTag, color })}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      newTag.color === color
                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                معاينة
              </label>
              <div
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: newTag.color }}
              >
                <TagIcon className="w-3 h-3" />
                {newTag.name || 'اسم الوسم'}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إنشاء الوسم
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTag({ name: '', color: PRESET_COLORS[0] });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tags List */}
      {loading ? (
        <div className="text-center text-gray-600 py-8">جاري التحميل...</div>
      ) : tags.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <TagIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>لا توجد وسوم حتى الآن</p>
          <p className="text-sm mt-1">قم بإنشاء وسوم لتنظيم الأعمال التجارية</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              {editingTag === tag.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setEditData({ ...editData, color })}
                        className={`w-8 h-8 rounded transition-all ${
                          editData.color === color
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: editData.color }}
                  >
                    <TagIcon className="w-3 h-3" />
                    {editData.name || tag.name}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateTag(tag.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      حفظ
                    </button>
                    <button
                      onClick={() => {
                        setEditingTag(null);
                        setEditData({ name: '', color: '' });
                      }}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: tag.color }}
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.name}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      استخدم {tag.usage_count || 0} مرة
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(tag)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
