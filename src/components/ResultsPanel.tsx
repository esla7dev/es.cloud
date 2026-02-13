import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SearchResult } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { Download, FileText, Database, Star, Phone, Globe, Clock, MapPin, FileSpreadsheet } from 'lucide-react';
import { formatArabicNumber } from '../utils/arabicHelpers';
import BusinessCard from './BusinessCard';

interface ResultsPanelProps {
  results: SearchResult[];
  totalResults: number;
  loading: boolean;
  pagesProcessed?: number;
  hasMorePages?: boolean;
}

export default function ResultsPanel({ results, totalResults, loading, pagesProcessed, hasMorePages }: ResultsPanelProps) {
  const [exportLoading, setExportLoading] = useState<'csv' | 'json' | 'xlsx' | null>(null);

  const handleExportCSV = async () => {
    setExportLoading('csv');
    try {
      BusinessApiService.exportToCSV(results);
      toast.success('تم تصدير البيانات بصيغة CSV بنجاح');
    } catch (error) {
      console.error('CSV export error:', error);
      toast.error('فشل في تصدير البيانات');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportJSON = async () => {
    setExportLoading('json');
    try {
      BusinessApiService.exportToJSON(results);
      toast.success('تم تصدير البيانات بصيغة JSON بنجاح');
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error('فشل في تصدير البيانات');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportXLSX = async () => {
    setExportLoading('xlsx');
    try {
      BusinessApiService.exportToXLSX(results);
      toast.success('تم تصدير البيانات بصيغة Excel بنجاح');
    } catch (error) {
      console.error('XLSX export error:', error);
      toast.error('فشل في تصدير البيانات');
    } finally {
      setExportLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
          <p className="text-gray-600">ابدأ بالبحث لرؤية النتائج هنا</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exportLoading === 'csv'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {exportLoading === 'csv' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              CSV
            </button>
            <button
              onClick={handleExportJSON}
              disabled={exportLoading === 'json'}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {exportLoading === 'json' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              JSON
            </button>
            <button
              onClick={handleExportXLSX}
              disabled={exportLoading === 'xlsx'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {exportLoading === 'xlsx' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Excel
            </button>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">النتائج</h2>
            <p className="text-sm text-gray-600">
              {formatArabicNumber(totalResults)} نتيجة
              {pagesProcessed && (
                <span className="text-xs text-gray-500 block">
                  من {formatArabicNumber(pagesProcessed)} صفحات
                  {hasMorePages && ' (يوجد المزيد)'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">البحث</p>
            <p className="text-lg font-bold text-blue-600">{formatArabicNumber(totalResults)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Globe className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">مواقع إلكترونية</p>
            <p className="text-lg font-bold text-green-600">
              {formatArabicNumber(results.filter(r => r.website).length)}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">مع هاتف</p>
            <p className="text-lg font-bold text-purple-600">
              {formatArabicNumber(results.filter(r => r.phone).length)}
            </p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">مقيمة</p>
            <p className="text-lg font-bold text-yellow-600">
              {formatArabicNumber(results.filter(r => r.rating > 0).length)}
            </p>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="p-4 space-y-3">
          {results.map((result) => (
            <BusinessCard key={result.id} business={result} />
          ))}
        </div>
      </div>
    </div>
  );
}