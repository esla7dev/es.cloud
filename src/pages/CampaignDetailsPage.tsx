import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Campaign, CampaignBusinessInteraction, MessageTemplate, BusinessTag, Task, Product } from '../types/business';
import { BusinessApiService } from '../services/businessApi';
import BusinessNotesModal from '../components/BusinessNotesModal';
import { 
  ArrowLeft,
  User, 
  Phone, 
  Globe, 
  MapPin, 
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  UserCheck,
  UserX,
  Loader2,
  Target,
  TrendingUp,
  MessageCircle,
  Mail,
  Eye,
  Search,
  Filter,
  Save,
  X,
  Edit3,
  StickyNote,
  Tag,
  ListTodo,
  Plus,
  ChevronDown,
  Package
} from 'lucide-react';
import { formatArabicDate, formatArabicNumber } from '../utils/arabicHelpers';

interface CampaignDetailsPageProps {
  setActiveTab: (tab: string) => void;
}

export default function CampaignDetailsPage({ setActiveTab }: CampaignDetailsPageProps) {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [interactions, setInteractions] = useState<CampaignBusinessInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [selectedInteractions, setSelectedInteractions] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<CampaignBusinessInteraction['status'] | ''>('');
  const [filterStatus, setFilterStatus] = useState<CampaignBusinessInteraction['status'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showPhoneOnly, setShowPhoneOnly] = useState(false);
  const [showWebsiteOnly, setShowWebsiteOnly] = useState(false);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<CampaignBusinessInteraction | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [messagePreview, setMessagePreview] = useState('');
  const [senderName, setSenderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Financial editing states
  const [editingFinancials, setEditingFinancials] = useState<{ [key: string]: boolean }>({});
  const [financialValues, setFinancialValues] = useState<{ [key: string]: { mrr: string; deal: string } }>({});

  // Notes modal state
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notesBusinessId, setNotesBusinessId] = useState('');
  const [notesBusinessName, setNotesBusinessName] = useState('');

  // Tags state
  const [availableTags, setAvailableTags] = useState<BusinessTag[]>([]);
  const [businessTagsMap, setBusinessTagsMap] = useState<{ [key: string]: BusinessTag[] }>({});
  const [showTagDropdown, setShowTagDropdown] = useState<string | null>(null);

  // Tasks state
  const [interactionTasksMap, setInteractionTasksMap] = useState<{ [key: string]: Task[] }>({});
  const [showTaskForm, setShowTaskForm] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  // Client acquired modal state
  const [showAcquiredModal, setShowAcquiredModal] = useState(false);
  const [acquiredInteraction, setAcquiredInteraction] = useState<CampaignBusinessInteraction | null>(null);
  const [acquiredProductId, setAcquiredProductId] = useState('');
  const [acquiredMrr, setAcquiredMrr] = useState('');
  const [acquiredDeal, setAcquiredDeal] = useState('');

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
      loadInteractions();
      loadTemplates();
      loadUserProfile();
      loadAvailableTags();
      loadProducts();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    try {
      const campaigns = await BusinessApiService.getCampaigns();
      const foundCampaign = campaigns.find(c => c.id.toString() === campaignId);
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        navigate('/');
        setActiveTab('campaigns');
      }
    } catch (error) {
      console.error('CampaignDetailsPage: Failed to load campaign:', error);
      navigate('/');
      setActiveTab('campaigns');
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await BusinessApiService.getUserProfile();
      setUserProfile(profile);
      
      if (profile.company_name) setCompanyName(profile.company_name);
      if (profile.sender_name) setSenderName(profile.sender_name);
    } catch (error) {
      console.error('CampaignDetailsPage: Failed to load user profile:', error);
    }
  };

  const loadInteractions = async () => {
    if (!campaignId) return;
    
    try {
      setLoading(true);
      const data = await BusinessApiService.getCampaignBusinessInteractions(campaignId);
      setInteractions(data);
      
      // Initialize financial values
      const initialFinancials: { [key: string]: { mrr: string; deal: string } } = {};
      data.forEach(interaction => {
        initialFinancials[interaction.id] = {
          mrr: interaction.mrr_value?.toString() || '',
          deal: interaction.one_time_deal_value?.toString() || ''
        };
      });
      setFinancialValues(initialFinancials);

      // Load tags and tasks for all interactions
      await loadBusinessTags(data);
      await loadInteractionTasks();
    } catch (error) {
      console.error('CampaignDetailsPage: Failed to load campaign interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await BusinessApiService.getMessageTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('CampaignDetailsPage: Failed to load templates:', error);
    }
  };

  const loadAvailableTags = async () => {
    try {
      const tags = await BusinessApiService.getBusinessTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const loadBusinessTags = async (interactionsData: CampaignBusinessInteraction[]) => {
    try {
      const tagsMap: { [key: string]: BusinessTag[] } = {};
      const promises = interactionsData.map(async (interaction) => {
        if (interaction.business_result_id) {
          try {
            const tags = await BusinessApiService.getBusinessResultTags(interaction.business_result_id);
            tagsMap[interaction.business_result_id] = tags;
          } catch {
            tagsMap[interaction.business_result_id] = [];
          }
        }
      });
      await Promise.all(promises);
      setBusinessTagsMap(tagsMap);
    } catch (error) {
      console.error('Failed to load business tags:', error);
    }
  };

  const loadInteractionTasks = async () => {
    try {
      const allTasks = await BusinessApiService.getTasks();
      const tasksMap: { [key: string]: Task[] } = {};
      allTasks.forEach(task => {
        if (task.interaction_id) {
          if (!tasksMap[task.interaction_id]) {
            tasksMap[task.interaction_id] = [];
          }
          tasksMap[task.interaction_id].push(task);
        }
      });
      setInteractionTasksMap(tasksMap);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await BusinessApiService.getProducts({ activeOnly: true });
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleOpenNotes = (businessResultId: string, businessName: string) => {
    setNotesBusinessId(businessResultId);
    setNotesBusinessName(businessName);
    setNotesModalOpen(true);
  };

  const handleToggleTag = async (businessResultId: string, tagId: string) => {
    const currentTags = businessTagsMap[businessResultId] || [];
    const hasTag = currentTags.some(t => t.id === tagId);
    
    let newTagIds: string[];
    if (hasTag) {
      newTagIds = currentTags.filter(t => t.id !== tagId).map(t => t.id);
    } else {
      newTagIds = [...currentTags.map(t => t.id), tagId];
    }

    try {
      await BusinessApiService.assignTagsToBusinessResult(businessResultId, newTagIds);
      const newTags = availableTags.filter(t => newTagIds.includes(t.id));
      setBusinessTagsMap(prev => ({ ...prev, [businessResultId]: newTags }));
    } catch (error) {
      console.error('Failed to toggle tag:', error);
      toast.error('فشل في تحديث الوسوم');
    }
    setShowTagDropdown(null);
  };

  const handleCreateTask = async (interactionId: string) => {
    if (!newTaskTitle.trim()) {
      toast.error('عنوان المهمة مطلوب');
      return;
    }

    try {
      await BusinessApiService.createTask({
        title: newTaskTitle.trim(),
        due_date: newTaskDueDate || undefined,
        priority: newTaskPriority,
        interaction_id: interactionId
      });
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setNewTaskPriority('medium');
      setShowTaskForm(null);
      await loadInteractionTasks();
      toast.success('تم إنشاء المهمة بنجاح');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('فشل في إنشاء المهمة');
    }
  };

  const handleToggleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await BusinessApiService.updateTaskStatus(taskId, !completed);
      await loadInteractionTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleClientAcquired = (interaction: CampaignBusinessInteraction) => {
    setAcquiredInteraction(interaction);
    setAcquiredProductId(interaction.product_id || '');
    setAcquiredMrr(interaction.mrr_value?.toString() || '');
    setAcquiredDeal(interaction.one_time_deal_value?.toString() || '');
    setShowAcquiredModal(true);
  };

  const handleConfirmAcquired = async () => {
    if (!acquiredInteraction) return;

    const product = acquiredProductId ? products.find(p => p.id === acquiredProductId) : null;
    
    const updates: any = {
      status: 'client_acquired' as const,
      last_action: 'تم اكتساب العميل'
    };

    if (acquiredProductId) updates.product_id = acquiredProductId;
    if (acquiredMrr) updates.mrr_value = parseFloat(acquiredMrr) || 0;
    if (acquiredDeal) updates.one_time_deal_value = parseFloat(acquiredDeal) || 0;

    if (product && !acquiredMrr && !acquiredDeal) {
      updates.one_time_deal_value = product.price_credits;
    }

    await handleUpdateInteraction(acquiredInteraction.id, updates);
    setShowAcquiredModal(false);
    setAcquiredInteraction(null);
    toast.success('تم اكتساب العميل بنجاح! 🎉');
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'web_dev': return 'تطوير الويب';
      case 'marketing': return 'التسويق';
      case 'arch_studio': return 'الهندسة والتصميم';
      default: return category;
    }
  };

  const getTaskStats = (interactionId: string) => {
    const tasks = interactionTasksMap[interactionId] || [];
    const total = tasks.length;
    const overdue = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length;
    const pending = tasks.filter(t => !t.completed).length;
    return { total, overdue, pending };
  };

  const handleSendOfferMessage = (interaction: CampaignBusinessInteraction) => {
    if (!interaction.business_result?.phone) {
      toast.error('لا يوجد رقم هاتف لهذا العمل');
      return;
    }

    let offerTemplate = null;
    
    if (campaign?.default_offer_template_id) {
      offerTemplate = templates.find(t => t.id === campaign.default_offer_template_id);
    }
    
    if (!offerTemplate) {
      offerTemplate = templates.find(t => t.type === 'offer');
    }
    
    if (!offerTemplate) {
      toast.error('لا يوجد قالب عرض متاح. يرجى إنشاء قالب عرض أولاً.');
      return;
    }
    
    const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;

    let processedMessage = BusinessApiService.processMessageTemplate(
      offerTemplate,
      interaction.business_result?.name || '',
      {
        companyName: companyName || userProfile?.company_name || 'شركتنا',
        senderName: senderName || userProfile?.sender_name || 'فريق المبيعات'
      }
    );

    if (selectedProduct) {
      processedMessage = processedMessage
        .replace(/\{productName\}/g, selectedProduct.name)
        .replace(/\{productPrice\}/g, selectedProduct.price_display || `${selectedProduct.price_credits}`)
        .replace(/\{productFeatures\}/g, (selectedProduct.features || []).join('، '));
    }

    const whatsappLink = BusinessApiService.generateWhatsAppLink(
      interaction.business_result.phone,
      processedMessage,
      campaign?.target_country_code || '966'
    );

    window.open(whatsappLink, '_blank');

    handleUpdateInteraction(interaction.id, {
      status: 'sent',
      last_action: 'تم إرسال عرض عبر واتساب',
      product_id: selectedProductId || undefined
    });
  };

  const handleSendFollowUpMessage = (interaction: CampaignBusinessInteraction) => {
    if (!interaction.business_result?.phone) {
      toast.error('لا يوجد رقم هاتف لهذا العمل');
      return;
    }

    let followUpTemplate = null;
    
    if (campaign?.default_follow_up_template_id) {
      followUpTemplate = templates.find(t => t.id === campaign.default_follow_up_template_id);
    }
    
    if (!followUpTemplate) {
      followUpTemplate = templates.find(t => t.type === 'follow_up');
    }
    
    if (!followUpTemplate) {
      toast.error('لا يوجد قالب متابعة متاح. يرجى إنشاء قالب متابعة أولاً.');
      return;
    }
    
    setSelectedBusiness(interaction);
    setShowWhatsAppModal(true);
    setSelectedTemplate(followUpTemplate.id);
    handleTemplateChange(followUpTemplate.id);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId && selectedBusiness) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        let processedMessage = BusinessApiService.processMessageTemplate(
          template,
          selectedBusiness.business_result?.name || '',
          {
            companyName: companyName || 'شركتنا',
            senderName: senderName || 'فريق المبيعات'
          }
        );
        const selectedProduct = selectedProductId ? products.find(p => p.id === selectedProductId) : null;
        if (selectedProduct) {
          processedMessage = processedMessage
            .replace(/\{productName\}/g, selectedProduct.name)
            .replace(/\{productPrice\}/g, selectedProduct.price_display || `${selectedProduct.price_credits}`)
            .replace(/\{productFeatures\}/g, (selectedProduct.features || []).join('، '));
        }
        setMessagePreview(processedMessage);
        setCustomMessage(processedMessage);
      }
    } else {
      setMessagePreview('');
      setCustomMessage('');
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedBusiness?.business_result?.phone || !customMessage.trim()) {
      toast.error('يرجى التأكد من وجود رقم الهاتف والرسالة');
      return;
    }

    const whatsappLink = BusinessApiService.generateWhatsAppLink(
      selectedBusiness.business_result.phone,
      customMessage.trim(),
      campaign?.target_country_code || '966'
    );

    window.open(whatsappLink, '_blank');

    const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);
    const actionMessage = selectedTemplateObj 
      ? `تم إرسال ${selectedTemplateObj.type === 'offer' ? 'عرض' : 'متابعة'} عبر واتساب`
      : 'تم إرسال رسالة واتساب';
      
    handleUpdateInteraction(selectedBusiness.id, {
      status: 'sent',
      last_action: actionMessage,
      product_id: selectedProductId || undefined
    });

    setShowWhatsAppModal(false);
    setSelectedBusiness(null);
  };

  const handleUpdateInteraction = async (
    interactionId: string, 
    updates: {
      status?: CampaignBusinessInteraction['status'];
      last_action?: string;
      mrr_value?: number;
      one_time_deal_value?: number;
      product_id?: string;
    }
  ) => {
    setUpdateLoading(interactionId);
    try {
      await BusinessApiService.updateCampaignBusinessInteraction(interactionId, updates);
      await loadInteractions();
    } catch (error) {
      console.error('Failed to update interaction:', error);
      toast.error('فشل في تحديث التفاعل');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkAction || selectedInteractions.length === 0 || !campaignId) return;

    setUpdateLoading('bulk');
    try {
      const businessIds = selectedInteractions.map(id => {
        const interaction = interactions.find(i => i.id === id);
        return interaction?.business_result_id;
      }).filter(Boolean) as string[];

      await BusinessApiService.bulkUpdateInteractionStatus(
        campaignId,
        businessIds,
        bulkAction,
        `تحديث جماعي إلى ${getStatusText(bulkAction)}`
      );
      
      await loadInteractions();
      setSelectedInteractions([]);
      setBulkAction('');
    } catch (error) {
      console.error('Failed to bulk update:', error);
      toast.error('فشل في التحديث الجماعي');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleEditFinancials = (interactionId: string) => {
    setEditingFinancials(prev => ({ ...prev, [interactionId]: true }));
  };

  const handleSaveFinancials = async (interactionId: string) => {
    const values = financialValues[interactionId];
    if (!values) return;

    const updates: any = {};
    if (values.mrr !== '') updates.mrr_value = parseFloat(values.mrr) || 0;
    if (values.deal !== '') updates.one_time_deal_value = parseFloat(values.deal) || 0;

    await handleUpdateInteraction(interactionId, updates);
    setEditingFinancials(prev => ({ ...prev, [interactionId]: false }));
  };

  const handleCancelFinancials = (interactionId: string) => {
    const interaction = interactions.find(i => i.id === interactionId);
    if (interaction) {
      setFinancialValues(prev => ({
        ...prev,
        [interactionId]: {
          mrr: interaction.mrr_value?.toString() || '',
          deal: interaction.one_time_deal_value?.toString() || ''
        }
      }));
    }
    setEditingFinancials(prev => ({ ...prev, [interactionId]: false }));
  };

  const getStatusColor = (status: CampaignBusinessInteraction['status']) => {
    switch (status) {
      case 'not_contacted': return 'text-gray-600 bg-gray-50';
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50';
      case 'client_acquired': return 'text-green-600 bg-green-50';
      case 'lost_rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: CampaignBusinessInteraction['status']) => {
    switch (status) {
      case 'not_contacted': return 'لم يتم التواصل';
      case 'sent': return 'تم الإرسال';
      case 'in_progress': return 'قيد المتابعة';
      case 'client_acquired': return 'عميل مكتسب';
      case 'lost_rejected': return 'مرفوض/مفقود';
      default: return 'غير محدد';
    }
  };

  const getStatusIcon = (status: CampaignBusinessInteraction['status']) => {
    switch (status) {
      case 'not_contacted': return <Clock className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'client_acquired': return <UserCheck className="w-4 h-4" />;
      case 'lost_rejected': return <UserX className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Apply filters and sorting
  const filteredInteractions = interactions
    .filter(interaction => {
      const statusMatch = filterStatus === 'all' || interaction.status === filterStatus;
      const searchMatch = !searchTerm || 
        interaction.business_result?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = !showPhoneOnly || interaction.business_result?.phone;
      const websiteMatch = !showWebsiteOnly || !interaction.business_result?.website;
      
      return statusMatch && searchMatch && phoneMatch && websiteMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = (a.business_result?.name || '').localeCompare(b.business_result?.name || '');
          break;
        case 'date':
          const dateA = new Date(a.last_action_at || a.updated_at).getTime();
          const dateB = new Date(b.last_action_at || b.updated_at).getTime();
          comparison = dateB - dateA; // Default to newest first
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const stats = {
    total: interactions.length,
    not_contacted: interactions.filter(i => i.status === 'not_contacted').length,
    sent: interactions.filter(i => i.status === 'sent').length,
    in_progress: interactions.filter(i => i.status === 'in_progress').length,
    client_acquired: interactions.filter(i => i.status === 'client_acquired').length,
    lost_rejected: interactions.filter(i => i.status === 'lost_rejected').length,
    total_mrr: interactions.reduce((sum, i) => sum + (i.mrr_value || 0), 0),
    total_deals: interactions.reduce((sum, i) => sum + (i.one_time_deal_value || 0), 0)
  };

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل تفاصيل الحملة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                navigate('/');
                setActiveTab('campaigns');
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للحملات
            </button>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-gray-900" dir="rtl">
                {campaign.name}
              </h1>
              <p className="text-sm text-gray-600" dir="rtl">
                البحث: {campaign.search?.keywords} - {campaign.search?.location}
              </p>
              <p className="text-xs text-gray-500">
                تم الإنشاء: {formatArabicDate(campaign.created_at)}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-6 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Target className="w-5 h-5 text-gray-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">الإجمالي</p>
              <p className="text-lg font-bold text-gray-900">{formatArabicNumber(stats.total)}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Send className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">مرسل</p>
              <p className="text-lg font-bold text-blue-600">{formatArabicNumber(stats.sent)}</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">متابعة</p>
              <p className="text-lg font-bold text-yellow-600">{formatArabicNumber(stats.in_progress)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">عملاء</p>
              <p className="text-lg font-bold text-green-600">{formatArabicNumber(stats.client_acquired)}</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">MRR</p>
              <p className="text-lg font-bold text-purple-600">{formatArabicNumber(stats.total_mrr)}</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-orange-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">صفقات</p>
              <p className="text-lg font-bold text-orange-600">{formatArabicNumber(stats.total_deals)}</p>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="space-y-4">
            {/* Search and Filters Row */}
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-2">
                {selectedInteractions.length > 0 && (
                  <>
                    <select
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value as CampaignBusinessInteraction['status'])}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">اختر إجراء...</option>
                      <option value="sent">تم الإرسال</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="client_acquired">عميل مكتسب</option>
                      <option value="lost_rejected">مرفوض/مفقود</option>
                    </select>
                    <button
                      onClick={handleBulkUpdate}
                      disabled={!bulkAction || updateLoading === 'bulk'}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {updateLoading === 'bulk' && <Loader2 className="w-3 h-3 animate-spin" />}
                      تطبيق ({formatArabicNumber(selectedInteractions.length)})
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="البحث في الأعمال..."
                    className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm w-64 text-right"
                    dir="rtl"
                  />
                </div>
                
                {/* Sort */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as 'name' | 'date' | 'status');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="date-desc">الأحدث أولاً</option>
                  <option value="date-asc">الأقدم أولاً</option>
                  <option value="name-asc">الاسم أ-ي</option>
                  <option value="name-desc">الاسم ي-أ</option>
                  <option value="status-asc">الحالة</option>
                </select>
              </div>
            </div>

            {/* Filter Checkboxes and Status Filter */}
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showPhoneOnly}
                    onChange={(e) => setShowPhoneOnly(e.target.checked)}
                    className="rounded"
                  />
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>مع هاتف فقط</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showWebsiteOnly}
                    onChange={(e) => setShowWebsiteOnly(e.target.checked)}
                    className="rounded"
                  />
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span>بدون موقع فقط</span>
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">الحالة:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as CampaignBusinessInteraction['status'] | 'all')}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">الكل ({formatArabicNumber(stats.total)})</option>
                  <option value="not_contacted">لم يتم التواصل ({formatArabicNumber(stats.not_contacted)})</option>
                  <option value="sent">تم الإرسال ({formatArabicNumber(stats.sent)})</option>
                  <option value="in_progress">قيد المتابعة ({formatArabicNumber(stats.in_progress)})</option>
                  <option value="client_acquired">عميل مكتسب ({formatArabicNumber(stats.client_acquired)})</option>
                  <option value="lost_rejected">مرفوض/مفقود ({formatArabicNumber(stats.lost_rejected)})</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Interactions List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 text-right">
              تفاعلات الأعمال ({formatArabicNumber(filteredInteractions.length)})
            </h3>
          </div>

          {filteredInteractions.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">لا توجد تفاعلات تطابق الفلاتر المحددة</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredInteractions.map((interaction) => (
                <div key={interaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    {/* Checkbox */}
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedInteractions.includes(interaction.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInteractions([...selectedInteractions, interaction.id]);
                          } else {
                            setSelectedInteractions(selectedInteractions.filter(id => id !== interaction.id));
                          }
                        }}
                        className="rounded"
                      />
                    </div>

                    {/* Business Info */}
                    <div className="col-span-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(interaction.status)}`}>
                            {getStatusIcon(interaction.status)}
                            {getStatusText(interaction.status)}
                          </span>
                          {updateLoading === interaction.id && (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </div>
                        <div className="text-right">
                          <h4 className="font-semibold text-gray-900" dir="rtl">
                            {interaction.business_result?.name}
                          </h4>
                          {interaction.business_result?.rating && interaction.business_result.rating > 0 && (
                            <div className="flex items-center gap-1 justify-end mt-1">
                              <span className="text-xs text-gray-600">
                                ({formatArabicNumber(interaction.business_result.reviewCount)})
                              </span>
                              <span className="text-xs font-medium text-gray-900">
                                {interaction.business_result.rating.toFixed(1)}
                              </span>
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        {interaction.business_result?.address && (
                          <div className="flex items-start gap-2 text-right">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 text-xs" dir="rtl">
                              {interaction.business_result.address}
                            </span>
                          </div>
                        )}
                        {interaction.business_result?.phone && (
                          <div className="flex items-center gap-2 text-right">
                            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 text-xs" dir="ltr">
                              {interaction.business_result.phone}
                            </span>
                          </div>
                        )}
                        {interaction.business_result?.website && (
                          <div className="flex items-center gap-2 text-right">
                            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <a 
                              href={interaction.business_result.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors text-xs"
                            >
                              {interaction.business_result.website}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {interaction.business_result_id && (
                        <div className="flex flex-wrap gap-1 mt-2 items-center justify-end">
                          {(businessTagsMap[interaction.business_result_id] || []).map(tag => (
                            <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: tag.color + '30', color: tag.color }}>
                              {tag.name}
                            </span>
                          ))}
                          <div className="relative">
                            <button
                              onClick={() => setShowTagDropdown(showTagDropdown === interaction.id ? null : interaction.id)}
                              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                              title="إضافة وسم"
                            >
                              <Tag className="w-3 h-3" />
                            </button>
                            {showTagDropdown === interaction.id && (
                              <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                                {availableTags.map(tag => {
                                  const hasTag = (businessTagsMap[interaction.business_result_id!] || []).some(t => t.id === tag.id);
                                  return (
                                    <button
                                      key={tag.id}
                                      onClick={() => handleToggleTag(interaction.business_result_id!, tag.id)}
                                      className={`w-full px-3 py-1.5 text-xs text-right hover:bg-gray-50 flex items-center gap-2 justify-end ${hasTag ? 'bg-blue-50' : ''}`}
                                    >
                                      <span>{tag.name}</span>
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                    </button>
                                  );
                                })}
                                {availableTags.length === 0 && (
                                  <div className="px-3 py-2 text-xs text-gray-500 text-right">لا توجد وسوم</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* CRM Quick Actions */}
                      <div className="flex items-center gap-1 mt-2 justify-end">
                        {interaction.business_result_id && (
                          <button
                            onClick={() => handleOpenNotes(interaction.business_result_id!, interaction.business_result?.name || '')}
                            className="p-1 hover:bg-yellow-50 rounded text-gray-400 hover:text-yellow-600 transition-colors"
                            title="ملاحظات"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="relative">
                          <button
                            onClick={() => setShowTaskForm(showTaskForm === interaction.id ? null : interaction.id)}
                            className="p-1 hover:bg-indigo-50 rounded text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-0.5"
                            title="مهام"
                          >
                            <ListTodo className="w-3.5 h-3.5" />
                            {getTaskStats(interaction.id).total > 0 && (
                              <span className={`text-[10px] font-bold ${getTaskStats(interaction.id).overdue > 0 ? 'text-red-600' : 'text-indigo-600'}`}>
                                {formatArabicNumber(getTaskStats(interaction.id).pending)}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Inline Task Form & List */}
                      {showTaskForm === interaction.id && (
                        <div className="mt-2 bg-indigo-50 rounded-lg p-2 space-y-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder="عنوان المهمة..."
                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded text-right"
                              dir="rtl"
                            />
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="px-1 py-1 text-xs border border-gray-300 rounded w-28"
                            />
                            <button
                              onClick={() => handleCreateTask(interaction.id)}
                              className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {(interactionTasksMap[interaction.id] || []).map(task => (
                            <div key={task.id} className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => handleToggleTaskComplete(task.id, task.completed)}
                                className="rounded"
                              />
                              <span className={`flex-1 text-right ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {task.title}
                              </span>
                              {task.due_date && new Date(task.due_date) < new Date() && !task.completed && (
                                <span className="text-red-500 text-[10px]">متأخر</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {interaction.last_action && (
                        <div className="text-right text-xs text-gray-500 mt-2" dir="rtl">
                          آخر إجراء: {interaction.last_action}
                          {interaction.last_action_at && (
                            <div className="text-xs text-gray-400">
                              {formatArabicDate(interaction.last_action_at)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-3">
                      <div className="flex flex-wrap gap-1 justify-end mb-2">
                        {interaction.business_result?.phone && (
                          <>
                            <button
                              onClick={() => handleSendOfferMessage(interaction)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                              title="إرسال عرض"
                            >
                              <Send className="w-3 h-3" />
                              عرض
                            </button>
                            <button
                              onClick={() => handleSendFollowUpMessage(interaction)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                              title="إرسال متابعة"
                            >
                              <MessageCircle className="w-3 h-3" />
                              متابعة
                            </button>
                          </>
                        )}
                        
                        {interaction.status === 'sent' && (
                          <>
                            <button
                              onClick={() => handleUpdateInteraction(interaction.id, { 
                                status: 'in_progress', 
                                last_action: 'بدء المتابعة' 
                              })}
                              disabled={updateLoading === interaction.id}
                              className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                            >
                              متابعة
                            </button>
                            <button
                              onClick={() => handleUpdateInteraction(interaction.id, { 
                                status: 'lost_rejected', 
                                last_action: 'تم الرفض' 
                              })}
                              disabled={updateLoading === interaction.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              رفض
                            </button>
                          </>
                        )}
                        {interaction.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleClientAcquired(interaction)}
                              disabled={updateLoading === interaction.id}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              عميل
                            </button>
                            <button
                              onClick={() => handleUpdateInteraction(interaction.id, { 
                                status: 'lost_rejected', 
                                last_action: 'فقدان العميل' 
                              })}
                              disabled={updateLoading === interaction.id}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              فقدان
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Financial Values */}
                    <div className="col-span-4">
                      {editingFinancials[interaction.id] ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-gray-600 block text-right">MRR (ريال)</label>
                            <input
                              type="number"
                              value={financialValues[interaction.id]?.mrr || ''}
                              onChange={(e) => setFinancialValues(prev => ({
                                ...prev,
                                [interaction.id]: {
                                  ...prev[interaction.id],
                                  mrr: e.target.value
                                }
                              }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 block text-right">صفقة واحدة (ريال)</label>
                            <input
                              type="number"
                              value={financialValues[interaction.id]?.deal || ''}
                              onChange={(e) => setFinancialValues(prev => ({
                                ...prev,
                                [interaction.id]: {
                                  ...prev[interaction.id],
                                  deal: e.target.value
                                }
                              }))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSaveFinancials(interaction.id)}
                              className="flex-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <Save className="w-3 h-3" />
                              حفظ
                            </button>
                            <button
                              onClick={() => handleCancelFinancials(interaction.id)}
                              className="flex-1 px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right text-xs space-y-1">
                          <div 
                            className="cursor-pointer hover:bg-purple-50 p-1 rounded transition-colors"
                            onClick={() => handleEditFinancials(interaction.id)}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Edit3 className="w-3 h-3 text-gray-400" />
                              <span className="text-purple-600">
                                MRR: {formatArabicNumber(interaction.mrr_value || 0)} ريال
                              </span>
                            </div>
                          </div>
                          <div 
                            className="cursor-pointer hover:bg-orange-50 p-1 rounded transition-colors"
                            onClick={() => handleEditFinancials(interaction.id)}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <Edit3 className="w-3 h-3 text-gray-400" />
                              <span className="text-orange-600">
                                صفقة: {formatArabicNumber(interaction.one_time_deal_value || 0)} ريال
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setSelectedBusiness(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-gray-900">إرسال رسالة واتساب</h3>
                  {selectedBusiness && (
                    <p className="text-sm text-gray-600" dir="rtl">
                      إلى: {selectedBusiness.business_result?.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Sender Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      اسم الشركة
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder={userProfile?.company_name || "اسم شركتك"}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      اسم المرسل
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder={userProfile?.sender_name || "اسمك"}
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    اختر قالب الرسالة
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  >
                    <option value="">اختر قالب...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.type === 'offer' ? 'عرض' : 'متابعة'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Selection */}
                {products.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                      <Package className="w-4 h-4 inline-block ml-1" />
                      ربط بمنتج/خدمة (اختياري)
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        if (selectedTemplate) handleTemplateChange(selectedTemplate);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    >
                      <option value="">بدون منتج</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} — {getCategoryLabel(product.category || '')} {product.tier ? `(${product.tier})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Message Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    نص الرسالة
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="اكتب رسالتك هنا..."
                    dir="rtl"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    عدد الأحرف: {formatArabicNumber(customMessage.length)}
                  </p>
                </div>

                {/* Phone Number Display */}
                {selectedBusiness?.business_result?.phone && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm text-blue-800" dir="ltr">
                        +{campaign?.target_country_code} {selectedBusiness.business_result.phone}
                      </span>
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">رقم الهاتف:</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center gap-3 justify-start">
                <button
                  onClick={() => {
                    setShowWhatsAppModal(false);
                    setSelectedBusiness(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  disabled={!customMessage.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-4 h-4" />
                  إرسال عبر واتساب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Acquired Modal */}
      {showAcquiredModal && acquiredInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <button onClick={() => setShowAcquiredModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900">اكتساب العميل 🎉</h3>
              </div>
              <p className="text-sm text-gray-600 text-right mt-2" dir="rtl">
                {acquiredInteraction.business_result?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                    <Package className="w-4 h-4 inline-block ml-1" />
                    المنتج/الخدمة المباعة
                  </label>
                  <select
                    value={acquiredProductId}
                    onChange={(e) => {
                      setAcquiredProductId(e.target.value);
                      const p = products.find(pr => pr.id === e.target.value);
                      if (p && !acquiredDeal && !acquiredMrr) {
                        setAcquiredDeal(p.price_credits.toString());
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                  >
                    <option value="">اختر منتج...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {getCategoryLabel(product.category || '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">MRR شهري (ريال)</label>
                <input
                  type="number"
                  value={acquiredMrr}
                  onChange={(e) => setAcquiredMrr(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">قيمة الصفقة (ريال)</label>
                <input
                  type="number"
                  value={acquiredDeal}
                  onChange={(e) => setAcquiredDeal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex items-center gap-3 justify-start">
              <button onClick={() => setShowAcquiredModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                إلغاء
              </button>
              <button
                onClick={handleConfirmAcquired}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                تأكيد الاكتساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Business Notes Modal */}
      {notesModalOpen && notesBusinessId && (
        <BusinessNotesModal
          isOpen={notesModalOpen}
          onClose={() => setNotesModalOpen(false)}
          businessResultId={notesBusinessId}
          businessName={notesBusinessName}
        />
      )}
    </div>
  );
}