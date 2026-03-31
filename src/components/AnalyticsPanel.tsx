import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, Users, Download, Calendar, Package } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BusinessApiService } from '../services/businessApi';
import type { AnalyticsData, CampaignRevenue, RevenueByDate, ConversionFunnel, ProductRevenueData } from '../types/business';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CATEGORY_COLORS: Record<string, string> = {
  'web_dev': '#3b82f6',
  'marketing': '#10b981',
  'arch_studio': '#8b5cf6'
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'web_dev': return 'تطوير الويب';
    case 'marketing': return 'التسويق';
    case 'arch_studio': return 'الهندسة والتصميم';
    default: return category;
  }
};

export default function AnalyticsPanel() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [campaignRevenue, setCampaignRevenue] = useState<CampaignRevenue[]>([]);
  const [revenueByDate, setRevenueByDate] = useState<RevenueByDate[]>([]);
  const [productRevenue, setProductRevenue] = useState<ProductRevenueData[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [analyticsData, campaignData, revenueData, productRevenueData] = await Promise.all([
        BusinessApiService.getAnalytics(dateRange.startDate, dateRange.endDate),
        BusinessApiService.getCampaignRevenueAnalytics(),
        BusinessApiService.getRevenueByDate(dateRange.startDate, dateRange.endDate),
        BusinessApiService.getRevenueByProduct(dateRange.startDate, dateRange.endDate)
      ]);

      setAnalytics(analyticsData);
      setCampaignRevenue(campaignData);
      setRevenueByDate(revenueData);
      setProductRevenue(productRevenueData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await BusinessApiService.exportAnalyticsToCSV(dateRange.startDate, dateRange.endDate);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const pieData = analytics ? [
    { name: 'لم يتم الاتصال', value: analytics.conversion_funnel.not_contacted },
    { name: 'تم الإرسال', value: analytics.conversion_funnel.sent },
    { name: 'قيد التنفيذ', value: analytics.conversion_funnel.in_progress },
    { name: 'عميل مكتسب', value: analytics.conversion_funnel.client_acquired },
    { name: 'مفقود/مرفوض', value: analytics.conversion_funnel.lost_rejected }
  ] : [];

  const safeConversionRate = Number(analytics?.conversion_rate ?? 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">التحليلات والتقارير</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          تصدير التقرير
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm text-gray-600 mb-1">من تاريخ</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">إلى تاريخ</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الإيرادات الشهرية المتكررة</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics.total_mrr.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط قيمة الصفقة</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${analytics.avg_deal_size.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">معدل التحويل</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {safeConversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">اتجاه الإيرادات</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueByDate}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => format(new Date(date), 'MMM dd', { locale: ar })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => format(new Date(date), 'PPP', { locale: ar })}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              name="إجمالي الإيرادات"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="mrr" 
              stroke="#10b981" 
              name="الإيرادات الشهرية المتكررة"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="deals" 
              stroke="#f59e0b" 
              name="الصفقات الفردية"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Campaign Revenue Comparison */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">مقارنة إيرادات الحملات</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={campaignRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="campaign_name" />
            <YAxis />
            <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="total_mrr" fill="#10b981" name="الإيرادات الشهرية المتكررة" />
            <Bar dataKey="total_deals" fill="#f59e0b" name="الصفقات الفردية" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product */}
      {productRevenue.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            إيرادات المنتجات والخدمات
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="product_name" 
                  type="category" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()} ريال`} />
                <Legend />
                <Bar dataKey="total_revenue" fill="#f59e0b" name="إجمالي الإيرادات" />
                <Bar dataKey="total_mrr" fill="#10b981" name="MRR" />
              </BarChart>
            </ResponsiveContainer>

            {/* Revenue by Category Summary */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">حسب القسم</h3>
              {(() => {
                const categoryTotals: Record<string, { revenue: number; clients: number }> = {};
                productRevenue.forEach(pr => {
                  const cat = pr.category || 'other';
                  if (!categoryTotals[cat]) categoryTotals[cat] = { revenue: 0, clients: 0 };
                  categoryTotals[cat].revenue += pr.total_revenue;
                  categoryTotals[cat].clients += pr.client_count;
                });
                return Object.entries(categoryTotals).map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: (CATEGORY_COLORS[cat] || '#6b7280') + '15' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: CATEGORY_COLORS[cat] || '#6b7280' }}>
                        {data.revenue.toLocaleString()} ريال
                      </span>
                      <span className="text-xs text-gray-500">({data.clients} عميل)</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{getCategoryLabel(cat)}</span>
                  </div>
                ));
              })()}

              {/* Top Products List */}
              <h3 className="font-semibold text-gray-900 mt-4">أعلى المنتجات</h3>
              {productRevenue
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .slice(0, 5)
                .map((pr, i) => (
                  <div key={pr.product_id || i} className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {pr.total_revenue.toLocaleString()} ريال
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-700">{pr.product_name}</span>
                      {pr.category && (
                        <span className="text-xs text-gray-400 mr-2">
                          ({getCategoryLabel(pr.category)})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">قمع التحويل</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">تفاصيل القمع</h3>
            {analytics && (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-700">لم يتم الاتصال</span>
                  <span className="font-semibold text-blue-600">
                    {analytics.conversion_funnel.not_contacted}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">تم الإرسال</span>
                  <span className="font-semibold text-green-600">
                    {analytics.conversion_funnel.sent}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-700">قيد التنفيذ</span>
                  <span className="font-semibold text-yellow-600">
                    {analytics.conversion_funnel.in_progress}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-700">عميل مكتسب</span>
                  <span className="font-semibold text-purple-600">
                    {analytics.conversion_funnel.client_acquired}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">مفقود/مرفوض</span>
                  <span className="font-semibold text-red-600">
                    {analytics.conversion_funnel.lost_rejected}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
