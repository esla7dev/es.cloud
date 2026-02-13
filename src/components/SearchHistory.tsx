import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Search } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { History, Filter, Calendar, MapPin, Download, Trash2, Loader2, X } from 'lucide-react';
import { formatArabicDate, formatArabicTime, formatArabicNumber } from '../utils/arabicHelpers';

interface SearchHistoryProps {
  onLoadSearch: (search: Search) => void;
}

export default function SearchHistory({ onLoadSearch }: SearchHistoryProps) {
  const [searches, setSearches] = useState<Search[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await BusinessApiService.getSearchHistory();
      setSearches(history);
    } catch (error) {
      console.error('Failed to load search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البحث؟ سيتم حذف جميع النتائج المرتبطة به أيضاً.')) {
      return;
    }

    setDeleteLoading(searchId);
    try {
      await BusinessApiService.deleteSearch(searchId);
      await loadSearchHistory(); // Reload the list
      toast.success('تم حذف البحث بنجاح');
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast.error('فشل في حذف البحث');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredSearches = searches.filter(search => {
    const keywordMatch = search.keywords.toLowerCase().includes(filter.toLowerCase());
    const locationMatch = search.location.toLowerCase().includes(locationFilter.toLowerCase());
    return keywordMatch && locationMatch;
  });

  const exportSearch = (search: Search) => {
    if (search.business_results) {
      BusinessApiService.exportToCSV(search.business_results);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل التاريخ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">تاريخ البحث</h2>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
            ({formatArabicNumber(filteredSearches.length)})
          </span>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-right">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">الفلاتر</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1 text-right">
                تصفية حسب الكلمات المفتاحية
              </label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="البحث في الكلمات..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1 text-right">
                تصفية حسب الموقع
              </label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="البحث في المواقع..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">عمليات البحث</p>
            <p className="text-lg font-bold text-blue-600">
              {formatArabicNumber(filteredSearches.length)}
            </p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600">إجمالي النتائج</p>
            <p className="text-lg font-bold text-green-600">
              {formatArabicNumber(filteredSearches.reduce((sum, s) => sum + s.results_count, 0))}
            </p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600">مواقع إلكترونية</p>
            <p className="text-lg font-bold text-purple-600">
              {formatArabicNumber(
                filteredSearches.reduce((sum, s) => 
                  sum + (s.business_results?.filter(r => r.website).length || 0), 0)
              )}
            </p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-600">مع هاتف</p>
            <p className="text-lg font-bold text-orange-600">
              {formatArabicNumber(
                filteredSearches.reduce((sum, s) => 
                  sum + (s.business_results?.filter(r => r.phone).length || 0), 0)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredSearches.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد عمليات بحث</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSearches.map((search) => (
              <div key={search.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {deleteLoading === search.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    ) : (
                      <button
                        onClick={() => handleDeleteSearch(search.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="حذف البحث"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => exportSearch(search)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="تصدير CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onLoadSearch(search)}
                      className="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                    >
                      تحميل
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900" dir="rtl">
                      الكلمات المفتاحية: {search.keywords}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 justify-end">
                      <span>{formatArabicTime(search.created_at)}</span>
                      <span>{formatArabicDate(search.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-green-600">
                      <span>{formatArabicNumber(search.results_count)}</span>
                      <span>النتائج</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600">
                      <span>
                        {formatArabicNumber(
                          search.business_results?.filter(r => r.website).length || 0
                        )}
                      </span>
                      <span>مواقع</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600">
                      <span>
                        {formatArabicNumber(
                          search.business_results?.filter(r => r.phone).length || 0
                        )}
                      </span>
                      <span>هواتف</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-32" dir="rtl">
                      {search.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}