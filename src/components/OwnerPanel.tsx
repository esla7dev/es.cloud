import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Upload,
  Image,
  Star,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Code,
  Megaphone,
  Building2,
  ChevronDown
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [imageUploading, setImageUploading] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price_credits: 0,
    type: 'e_commerce_shop',
    category: 'web_dev' as string,
    tier: 'basic' as string,
    price_display: '',
    image_url: '',
    features: [] as string[],
    is_active: true,
    display_order: 0
  });

  const productTypes = [
    { value: 'e_commerce_shop', label: 'متجر إلكتروني', category: 'web_dev' },
    { value: 'business_website', label: 'موقع تجاري', category: 'web_dev' },
    { value: 'web_application', label: 'تطبيق ويب', category: 'web_dev' },
    { value: 'marketing_campaign', label: 'حملة تسويقية', category: 'marketing' },
    { value: 'social_media_management', label: 'إدارة وسائل التواصل', category: 'marketing' },
    { value: 'seo_service', label: 'خدمة تحسين محركات البحث', category: 'marketing' },
    { value: 'content_creation', label: 'إنشاء المحتوى', category: 'marketing' },
    { value: 'brand_identity', label: 'هوية بصرية', category: 'marketing' },
    { value: 'architecture_design', label: 'تصميم معماري', category: 'arch_studio' },
    { value: 'interior_design', label: 'تصميم داخلي', category: 'arch_studio' },
    { value: 'design_consultation', label: 'استشارة تصميمية', category: 'arch_studio' }
  ];

  const categories = [
    { value: 'all', label: 'الكل', icon: Package, color: 'gray' },
    { value: 'web_dev', label: 'تطوير الويب والكلاود', icon: Code, color: 'blue' },
    { value: 'marketing', label: 'وكالة التسويق', icon: Megaphone, color: 'green' },
    { value: 'arch_studio', label: 'الهندسة والتصميم', icon: Building2, color: 'purple' }
  ];

  const tiers = [
    { value: 'basic', label: 'أساسي' },
    { value: 'pro', label: 'احترافي' },
    { value: 'enterprise', label: 'مؤسسي' }
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
        type: productForm.type,
        category: productForm.category,
        tier: productForm.tier,
        price_display: productForm.price_display || undefined,
        image_url: productForm.image_url || undefined,
        features: productForm.features.length > 0 ? productForm.features : undefined,
        is_active: productForm.is_active,
        display_order: productForm.display_order
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
        type: productForm.type,
        category: productForm.category,
        tier: productForm.tier,
        price_display: productForm.price_display || undefined,
        image_url: productForm.image_url || undefined,
        features: productForm.features,
        is_active: productForm.is_active,
        display_order: productForm.display_order
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
      type: product.type,
      category: product.category || 'web_dev',
      tier: product.tier || 'basic',
      price_display: product.price_display || '',
      image_url: product.image_url || '',
      features: product.features || [],
      is_active: product.is_active !== false,
      display_order: product.display_order || 0
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price_credits: 0,
      type: 'e_commerce_shop',
      category: 'web_dev',
      tier: 'basic',
      price_display: '',
      image_url: '',
      features: [],
      is_active: true,
      display_order: 0
    });
    setEditingProduct(null);
    setNewFeature('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setImageUploading(true);
    try {
      const url = await BusinessApiService.uploadProductImage(file);
      setProductForm(prev => ({ ...prev, image_url: url }));
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (productForm.image_url) {
      try {
        await BusinessApiService.deleteProductImage(productForm.image_url);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
      setProductForm(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setProductForm(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleToggleActive = async (product: Product) => {
    setActionLoading(product.id);
    try {
      await BusinessApiService.updateProduct(product.id, { is_active: !product.is_active });
      await loadProducts();
      toast.success(product.is_active ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج');
    } catch (error) {
      console.error('Failed to toggle product:', error);
      toast.error('فشل في تحديث المنتج');
    } finally {
      setActionLoading(null);
    }
  };

  const getProductTypeLabel = (type: string) => {
    const productType = productTypes.find(pt => pt.value === type);
    return productType ? productType.label : type;
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  const getTierLabel = (tier: string) => {
    const t = tiers.find(tr => tr.value === tier);
    return t ? t.label : tier;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-gray-100 text-gray-700';
      case 'pro': return 'bg-blue-100 text-blue-700';
      case 'enterprise': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

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
              إدارة المنتجات والخدمات
            </h2>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1 -mb-px justify-end">
            {categories.map(cat => {
              const Icon = cat.icon;
              const count = cat.value === 'all' ? products.length : products.filter(p => p.category === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeCategory === cat.value
                      ? `border-${cat.color}-600 text-${cat.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeCategory === cat.value ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {formatArabicNumber(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {productsLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-gray-600">جاري تحميل المنتجات...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {activeCategory === 'all' ? 'لا يوجد منتجات' : `لا يوجد منتجات في ${getCategoryLabel(activeCategory)}`}
              </p>
              <button
                onClick={() => {
                  resetProductForm();
                  if (activeCategory !== 'all') {
                    setProductForm(prev => ({ ...prev, category: activeCategory }));
                  }
                  setShowProductModal(true);
                }}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                إنشاء منتج جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${product.is_active === false ? 'opacity-60 border-gray-300' : 'border-gray-200'}`}>
                  {/* Product Image */}
                  {product.image_url && (
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-1">
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
                            <button
                              onClick={() => handleToggleActive(product)}
                              className={`p-1 transition-colors ${product.is_active !== false ? 'text-green-500 hover:text-gray-400' : 'text-gray-400 hover:text-green-500'}`}
                              title={product.is_active !== false ? 'إخفاء' : 'تفعيل'}
                            >
                              {product.is_active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <h3 className="font-semibold text-gray-900" dir="rtl">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          {product.tier && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getTierColor(product.tier)}`}>
                              {getTierLabel(product.tier)}
                            </span>
                          )}
                          {product.category && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                              {getCategoryLabel(product.category)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 text-right line-clamp-2" dir="rtl">
                        {product.description}
                      </p>
                    )}

                    {/* Features */}
                    {product.features && product.features.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {product.features.slice(0, 3).map((feature, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs text-gray-600 justify-end" dir="rtl">
                            <span>{feature}</span>
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          </div>
                        ))}
                        {product.features.length > 3 && (
                          <p className="text-[10px] text-gray-400 text-right">
                            +{formatArabicNumber(product.features.length - 3)} مزايا أخرى
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 border-t border-gray-100 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          {product.price_display || `${formatArabicNumber(product.price_credits)} ريال`}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Name */}
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

                {/* Category & Tier */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      القسم *
                    </label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                    >
                      {categories.filter(c => c.value !== 'all').map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      المستوى
                    </label>
                    <select
                      value={productForm.tier}
                      onChange={(e) => setProductForm({ ...productForm, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                    >
                      {tiers.map((tier) => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
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

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نوع المنتج *
                  </label>
                  <select
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                  >
                    {productTypes
                      .filter(pt => pt.category === productForm.category)
                      .map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Price & Price Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      السعر (ريال) *
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      عرض السعر (اختياري)
                    </label>
                    <input
                      type="text"
                      value={productForm.price_display}
                      onChange={(e) => setProductForm({ ...productForm, price_display: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                      placeholder="مثال: يبدأ من ٥٠٠٠ ريال"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    <Image className="w-4 h-4 inline-block ml-1" />
                    صورة المنتج
                  </label>
                  {productForm.image_url ? (
                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                      <img src={productForm.image_url} alt="Product" className="w-full h-full object-cover" />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 left-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 transition-colors"
                    >
                      {imageUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">انقر لرفع صورة</p>
                          <p className="text-xs text-gray-400">أقصى حجم: 5 ميجابايت</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Features Builder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    المميزات
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={handleAddFeature}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-right text-sm"
                      placeholder="أضف ميزة جديدة..."
                      dir="rtl"
                    />
                  </div>
                  {productForm.features.length > 0 && (
                    <div className="space-y-1 bg-gray-50 rounded-lg p-2">
                      {productForm.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 justify-between bg-white rounded px-2 py-1">
                          <button
                            onClick={() => handleRemoveFeature(index)}
                            className="p-0.5 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-gray-700 flex-1 text-right" dir="rtl">
                            <CheckCircle className="w-3 h-3 text-green-500 inline-block ml-1" />
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Display Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      ترتيب العرض
                    </label>
                    <input
                      type="number"
                      value={productForm.display_order}
                      onChange={(e) => setProductForm({ ...productForm, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-right"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer py-2">
                      <span className="text-sm font-medium text-gray-700">
                        {productForm.is_active ? 'مفعّل' : 'مخفي'}
                      </span>
                      <div
                        onClick={() => setProductForm(prev => ({ ...prev, is_active: !prev.is_active }))}
                        className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                          productForm.is_active ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          productForm.is_active ? 'left-5' : 'left-0.5'
                        }`} />
                      </div>
                    </label>
                  </div>
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