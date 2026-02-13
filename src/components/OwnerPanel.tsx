import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserProfile, Product } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import { 
  Crown,
  Users, 
  Package,
  Plus,
  Edit3,
  Trash2,
  CreditCard,
  Loader2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Mail,
  Calendar,
  DollarSign,
  ShoppingBag,
  Target,
  Globe,
  Zap
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

export default function OwnerPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // User management state
  const [creditAmounts, setCreditAmounts] = useState<{ [key: string]: string }>({});
  
  // Product management state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_credits: 0,
    type: 'e_commerce_shop'
  });

  const productTypes = [
    { value: 'e_commerce_shop', label: 'متجر إلكتروني' },
    { value: 'business_website', label: 'موقع تجاري' },
    { value: 'marketing_campaign', label: 'حملة تسويقية' },
    { value: 'social_media_management', label: 'إدارة وسائل التواصل' },
    { value: 'seo_service', label: 'خدمة تحسين محركات البحث' },
    { value: 'content_creation', label: 'إنشاء المحتوى' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUsers(), loadProducts()]);
    } catch (error) {
      console.error('Failed to load owner panel data:', error);
      toast.error('فشل في تحميل بيانات لوحة المالك');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await BusinessApiService.getAllUsers();
      setUsers(usersData);
      
      // Initialize credit amounts
      const initialAmounts: { [key: string]: string } = {};
      usersData.forEach(user => {
        initialAmounts[user.id] = '';
      });
      setCreditAmounts(initialAmounts);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('فشل في تحميل قائمة المستخدمين');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const productsData = await BusinessApiService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('فشل في تحميل قائمة المنتجات');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddCredits = async (userId: string) => {
    const amount = parseInt(creditAmounts[userId]);
    
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setActionLoading(userId);
    try {
      await BusinessApiService.addCreditsToUser(userId, amount);
      await loadUsers(); // Refresh users list
      setCreditAmounts(prev => ({ ...prev, [userId]: '' }));
      toast.success(`تم إضافة ${formatArabicNumber(amount)} رصيد بنجاح`);
    } catch (error) {
      console.error('Failed to add credits:', error);
      toast.error('فشل في إضافة الرصيد');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProduct = async () => {
    if (!productForm.name.trim()) {
      toast.error('اسم المنتج مطلوب');
      return;
    }

    setActionLoading('create-product');
    try {
      await BusinessApiService.createProduct({
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        price_credits: productForm.price_credits,
        type: productForm.type
      });
      
      await loadProducts();
      setShowProductModal(false);
      resetProductForm();
      toast.success('تم إنشاء المنتج بنجاح');
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('فشل في إنشاء المنتج');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !productForm.name.trim()) {
      toast.error('اسم المنتج مطلوب');
      return;
    }

    setActionLoading('update-product');
    try {
      await BusinessApiService.updateProduct(editingProduct.id, {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        price_credits: productForm.price_credits,
        type: productForm.type
      });
      
      await loadProducts();
      setEditingProduct(null);
      setShowProductModal(false);
      resetProductForm();
      toast.success('تم تحديث المنتج بنجاح');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('فشل في تحديث المنتج');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    setActionLoading(productId);
    try {
      await BusinessApiService.deleteProduct(productId);
      await loadProducts();
      toast.success('تم حذف المنتج بنجاح');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('فشل في حذف المنتج');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price_credits: product.price_credits,
      type: product.type
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price_credits: 0,
      type: 'e_commerce_shop'
    });
    setEditingProduct(null);
  };

  const getProductTypeLabel = (type: string) => {
    const productType = productTypes.find(pt => pt.value === type);
    return productType ? productType.label : type;
  };

  // Calculate stats
  const totalUsers = users.length;
  const totalOwners = users.filter(u => u.role === 'owner').length;
  const totalCreditsDistributed = users.reduce((sum, u) => sum + u.credits, 0);
  const totalProducts = products.length;
  const averageProductPrice = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.price_credits, 0) / products.length)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">جاري تحميل لوحة المالك...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-8 h-8 text-yellow-300" />
          <h1 className="text-2xl font-bold">لوحة تحكم المالك</h1>
        </div>
        <p className="text-purple-100">إدارة المستخدمين والمنتجات والخدمات</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">إجمالي المستخدمين</p>
          <p className="text-2xl font-bold text-blue-600">{formatArabicNumber(totalUsers)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">المالكين</p>
          <p className="text-2xl font-bold text-purple-600">{formatArabicNumber(totalOwners)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">إجمالي الرصيد</p>
          <p className="text-2xl font-bold text-green-600">{formatArabicNumber(totalCreditsDistributed)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">المنتجات</p>
          <p className="text-2xl font-bold text-orange-600">{formatArabicNumber(totalProducts)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm text-gray-600 mb-1">متوسط السعر</p>
          <p className="text-2xl font-bold text-indigo-600">{formatArabicNumber(averageProductPrice)}</p>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            إدارة المستخدمين
          </h2>
        </div>

        <div className="p-6">
          {usersLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">جاري تحميل المستخدمين...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا يوجد مستخدمين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">إضافة رصيد</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الرصيد الحالي</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">الدور</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">تاريخ التسجيل</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">البريد الإلكتروني</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddCredits(user.id)}
                            disabled={actionLoading === user.id || !creditAmounts[user.id]}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            إضافة
                          </button>
                          <input
                            type="number"
                            value={creditAmounts[user.id] || ''}
                            onChange={(e) => setCreditAmounts(prev => ({
                              ...prev,
                              [user.id]: e.target.value
                            }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            placeholder="0"
                            min="1"
                          />
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            {formatArabicNumber(user.credits)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'owner' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'owner' ? 'مالك' : 'مستخدم'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatArabicDate(user.created_at)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm" dir="ltr">{user.email}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Product Management Section */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                resetProductForm();
                setShowProductModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              منتج جديد
            </button>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-6 h-6 text-orange-600" />
              إدارة المنتجات
            </h2>
          </div>
        </div>

        <div className="p-6">
          {productsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-gray-600">جاري تحميل المنتجات...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا يوجد منتجات</p>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowProductModal(true);
                }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                إنشاء منتج جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {actionLoading === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="حذف المنتج"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="تعديل المنتج"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <h3 className="font-semibold text-gray-900" dir="rtl">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {formatArabicDate(product.created_at)}
                      </p>
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 text-right" dir="rtl">
                      {product.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-green-600">
                        {formatArabicNumber(product.price_credits)} رصيد
                      </span>
                      <span className="text-sm text-gray-600">السعر</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {getProductTypeLabel(product.type)}
                      </span>
                      <span className="text-sm text-gray-600">النوع</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingProduct ? 'تعديل المنتج' : 'إنشاء منتج جديد'}
                </h3>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                    placeholder="مثال: متجر إلكتروني متكامل"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    الوصف
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                    placeholder="وصف تفصيلي للمنتج..."
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نوع المنتج *
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                  >
                    {productTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    السعر بالرصيد *
                  </label>
                  <input
                    type="number"
                    value={productForm.price_credits}
                    onChange={(e) => setProductForm({ ...productForm, price_credits: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center gap-3 justify-start">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleCreateProduct}
                  disabled={actionLoading === 'create-product' || actionLoading === 'update-product'}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(actionLoading === 'create-product' || actionLoading === 'update-product') && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <Save className="w-4 h-4" />
                  {editingProduct ? 'حفظ التغييرات' : 'إنشاء المنتج'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}