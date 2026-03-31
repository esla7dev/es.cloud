import { supabase } from '../lib/supabase';
import { 
  SearchParams, 
  SearchResult, 
  Search, 
  Campaign, 
  CampaignBusinessInteraction, 
  Product, 
  UserProfile,
  BusinessNote,
  BusinessTag,
  Task,
  InteractionStatusHistory,
  AnalyticsData,
  CampaignRevenue,
  RevenueByDate,
  ConversionFunnel,
  ProductRevenueData
} from '../types/business';

export interface SearchResponse {
  results: SearchResult[];
  pagesProcessed?: number;
  hasMorePages?: boolean;
}

export class BusinessApiService {
  static async searchBusinesses(params: SearchParams): Promise<SearchResponse> {
    try {
      // Check if user has enough credits before searching
      const profile = await this.getUserProfile();
      if (profile.credits < 1) {
        throw new Error('رصيدك غير كافي للبحث. تحتاج إلى رصيد واحد على الأقل.');
      }

      // Call Supabase Edge Function FIRST — only deduct credits on success
      const { data, error } = await supabase.functions.invoke('google-places-search', {
        body: {
          query: params.keywords,
          location: params.location,
          placeId: params.placeId,
          coordinates: params.coordinates,
          radius: params.radius,
          type: params.category === 'all' ? undefined : params.category
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`فشل في الاتصال بخدمة البحث: ${error.message}`);
      }

      if (!data?.results || data.results.length === 0) {
        console.warn('No results returned from API');
        // Don't deduct credits if no results found
        return { results: [] };
      }

      // Deduct credits ONLY after successful search with results
      await this.deductCredits(1);

      return {
        results: data.results as SearchResult[],
        pagesProcessed: data.pagesProcessed,
        hasMorePages: data.hasMorePages,
      };
    } catch (error) {
      console.error('Business search error:', error);
      // Re-throw the error to be handled by the calling component
      throw new Error(error instanceof Error ? error.message : 'حدث خطأ في البحث');
    }
  }

  static async saveSearch(params: SearchParams, results: SearchResult[]): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Insert search record
      const { data: searchData, error: searchError } = await supabase
        .from('searches')
        .insert({
          user_id: userData.user.id,
          keywords: params.keywords,
          location: params.location,
          category: params.category,
          radius: params.radius,
          coordinates: params.coordinates || null,
          results_count: results.length
        })
        .select()
        .single();

      if (searchError) {
        throw new Error('فشل في حفظ البحث');
      }

      // Insert business results
      const businessResults = results.map(result => ({
        search_id: searchData.id,
        name: result.name,
        address: result.address,
        phone: result.phone,
        website: result.website,
        rating: result.rating,
        review_count: result.reviewCount,
        category: result.category,
        coordinates: result.coordinates,
        hours: result.hours,
        price_level: result.priceLevel
      }));

      const { error: resultsError } = await supabase
        .from('business_results')
        .insert(businessResults);

      if (resultsError) {
        throw new Error('فشل في حفظ نتائج البحث');
      }

      return searchData.id;
    } catch (error) {
      console.error('Save search error:', error);
      throw error;
    }
  }

  static async getSearchHistory(): Promise<Search[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('searches')
        .select(`
          *,
          business_results(*)
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل تاريخ البحث');
      }

      return data || [];
    } catch (error) {
      console.error('Get search history error:', error);
      throw error;
    }
  }

  static async deleteSearch(searchId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Delete the search (business_results will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في حذف البحث');
      }
    } catch (error) {
      console.error('Delete search error:', error);
      throw error;
    }
  }

  static async getUserProfile() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // First try to get existing profile
      let { data, error } = await supabase
        .from('profiles')
        .select('*, role')
        .eq('id', userData.user.id)
        .single();

      // If profile exists, return it
      if (data && !error) {
        return data;
      }

      // If profile doesn't exist (404 or other error), try to create one
      if (error?.code === 'PGRST116' || !data) {
        try {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userData.user.id,
             email: userData.user.email || ''
            })
            .select()
            .single();

          if (insertError) {
            console.error('Profile creation error:', insertError);
            throw new Error('فشل في إنشاء بيانات المستخدم. يرجى المحاولة مجددًا.');
          }

          return newProfile;
        } catch (createError) {
          console.error('Failed to create profile:', createError);
          throw new Error('فشل في إنشاء بيانات المستخدم. يرجى المحاولة مجددًا.');
        }
      }

      // If there's another error, throw it
      throw new Error('فشل في تحميل بيانات المستخدم');
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  static async deductCredits(amount: number): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase.rpc('deduct_credits', {
        user_id: userData.user.id,
        amount: amount
      });

      if (error) {
        throw new Error('فشل في خصم الرصيد');
      }
    } catch (error) {
      console.error('Deduct credits error:', error);
      throw error;
    }
  }

  static async updateUserProfile(updates: {
    company_name?: string;
    sender_name?: string;
    phone?: string;
    address?: string;
    website?: string;
  }): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.user.id);

      if (error) {
        throw new Error('فشل في تحديث بيانات المستخدم');
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  static exportToCSV(results: SearchResult[]): void {
    const headers = ['الاسم', 'العنوان', 'الهاتف', 'الموقع الإلكتروني', 'التقييم', 'عدد المراجعات', 'الفئة'];
    const csvContent = [
      headers.join(','),
      ...results.map(result => [
        `"${result.name}"`,
        `"${result.address || ''}"`,
        `"${result.phone || ''}"`,
        `"${result.website || ''}"`,
        result.rating,
        result.reviewCount,
        `"${result.category}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-data-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  static exportToJSON(results: SearchResult[]): void {
    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `business-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  static exportToXLSX(results: SearchResult[]): void {
    import('xlsx').then((XLSX) => {
      const worksheetData = results.map(result => ({
        'الاسم': result.name,
        'العنوان': result.address || '',
        'الهاتف': result.phone || '',
        'الموقع الإلكتروني': result.website || '',
        'التقييم': result.rating,
        'عدد المراجعات': result.reviewCount,
        'الفئة': result.category,
        'الحالة': result.businessStatus || '',
        'ساعات العمل': result.hours || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'بيانات الأعمال');

      // Auto-size columns
      const colWidths = Object.keys(worksheetData[0] || {}).map(key => ({
        wch: Math.max(key.length, ...worksheetData.map(row => String((row as any)[key] || '').length))
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `business-data-${new Date().toISOString().split('T')[0]}.xlsx`);
    }).catch(error => {
      console.error('XLSX export error:', error);
      throw new Error('فشل في تصدير البيانات بصيغة Excel');
    });
  }

  // Campaign Management Methods
  static async createCampaign(
    searchId: string, 
    campaignName: string,
    targetCountryCode: string = '966',
    defaultOfferTemplateId?: string,
    defaultFollowUpTemplateId?: string
  ): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Fetch search data with business results
      const { data: searchData, error: searchError } = await supabase
        .from('searches')
        .select(`
          *,
          business_results(*)
        `)
        .eq('id', searchId)
        .eq('user_id', userData.user.id)
        .single();

      if (searchError || !searchData) {
        throw new Error('فشل في العثور على بيانات البحث');
      }

      // Check if search has business results
      const businessResults = searchData.business_results || [];
      if (businessResults.length === 0) {
        throw new Error('لا يمكن إنشاء حملة من بحث لا يحتوي على نتائج. يرجى اختيار بحث يحتوي على أعمال تجارية.');
      }
      // Calculate metrics from business results
      const totalBusinesses = businessResults.length;
      const websitesExtracted = businessResults.filter(b => b.website).length;
      const phonesExtracted = businessResults.filter(b => b.phone).length;

      // Create campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          user_id: userData.user.id,
          name: campaignName,
          search_id: searchId,
          status: 'draft',
          progress: 0,
          total_businesses: totalBusinesses,
          websites_extracted: websitesExtracted,
          phones_extracted: phonesExtracted,
          contacted_businesses: 0,
          target_country_code: targetCountryCode,
          default_offer_template_id: defaultOfferTemplateId,
          default_follow_up_template_id: defaultFollowUpTemplateId
        })
        .select()
        .single();

      if (campaignError) {
        throw new Error('فشل في إنشاء الحملة');
      }

      // Create interaction records for each business result
      // Create interaction records for each business result (this is critical)
      const interactions = businessResults.map(business => ({
        campaign_id: campaignData.id,
        business_result_id: business.id,
        status: 'not_contacted' as const,
        last_action: null,
        last_action_at: null,
        mrr_value: null,
        one_time_deal_value: null
      }));

      const { error: interactionsError } = await supabase
        .from('campaign_business_interactions')
        .insert(interactions);

      if (interactionsError) {
        console.error('Failed to create business interactions:', interactionsError);
        
        // Clean up the campaign that was created since interactions failed
        await supabase
          .from('campaigns')
          .delete()
          .eq('id', campaignData.id);
        
        throw new Error('فشل في إنشاء تفاعلات الأعمال للحملة. يرجى المحاولة مرة أخرى.');
      }

      return campaignData.id;
    } catch (error) {
      console.error('Create campaign error:', error);
      throw error;
    }
  }

  static async getCampaigns(): Promise<Campaign[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          searches(
            id,
            keywords,
            location,
            category,
            created_at
          )
        `)
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل الحملات');
      }

      return data.map(campaign => ({
        ...campaign,
        search: campaign.searches
      })) || [];
    } catch (error) {
      console.error('Get campaigns error:', error);
      throw error;
    }
  }

  static async getCampaignBusinessInteractions(campaignId: string): Promise<CampaignBusinessInteraction[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // First verify the campaign belongs to the user
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', userData.user.id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('فشل في العثور على الحملة');
      }

      // Fetch interactions with business result details
      const { data, error } = await supabase
        .from('campaign_business_interactions')
        .select(`
          *,
          business_results(
            id,
            name,
            address,
            phone,
            website,
            rating,
            review_count,
            category,
            coordinates,
            hours,
            price_level
          )
        `)
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل تفاعلات الحملة');
      }

      return data.map(interaction => ({
        ...interaction,
        business_result: interaction.business_results ? {
          id: interaction.business_results.id,
          name: interaction.business_results.name,
          address: interaction.business_results.address || '',
          phone: interaction.business_results.phone,
          website: interaction.business_results.website,
          rating: interaction.business_results.rating || 0,
          reviewCount: interaction.business_results.review_count || 0,
          category: interaction.business_results.category || '',
          coordinates: interaction.business_results.coordinates || { lat: 0, lng: 0 },
          hours: interaction.business_results.hours,
          priceLevel: interaction.business_results.price_level
        } : undefined
      })) || [];
    } catch (error) {
      console.error('Get campaign business interactions error:', error);
      throw error;
    }
  }

  static async updateCampaignBusinessInteraction(
    interactionId: string,
    updates: {
      status?: CampaignBusinessInteraction['status'];
      last_action?: string;
      mrr_value?: number;
      one_time_deal_value?: number;
    }
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // If status is being updated, get the old status first for history tracking
      let oldStatus: string | null = null;
      if (updates.status) {
        const { data: currentInteraction } = await supabase
          .from('campaign_business_interactions')
          .select('status')
          .eq('id', interactionId)
          .single();
        
        if (currentInteraction) {
          oldStatus = currentInteraction.status;
        }
      }

      // Prepare update data
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Set last_action_at if last_action is being updated
      if (updates.last_action) {
        updateData.last_action_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('campaign_business_interactions')
        .update(updateData)
        .eq('id', interactionId);

      if (error) {
        throw new Error('فشل في تحديث تفاعل العمل');
      }

      // Record status change in history if status was updated
      if (updates.status && oldStatus !== updates.status) {
        await this.recordStatusChange(interactionId, oldStatus, updates.status);
      }

      // Update campaign progress if status changed to a "contacted" status
      if (updates.status && ['sent', 'in_progress', 'client_acquired'].includes(updates.status)) {
        await this.updateCampaignProgressFromInteractions(interactionId);
      }
    } catch (error) {
      console.error('Update campaign business interaction error:', error);
      throw error;
    }
  }

  static async updateCampaignProgressFromInteractions(interactionId: string): Promise<void> {
    try {
      // Get the campaign ID from the interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('campaign_business_interactions')
        .select('campaign_id')
        .eq('id', interactionId)
        .single();

      if (interactionError || !interaction) {
        return; // Silently fail to avoid breaking the main update
      }

      // Count contacted businesses for this campaign
      const { data: contactedCount, error: countError } = await supabase
        .from('campaign_business_interactions')
        .select('id', { count: 'exact' })
        .eq('campaign_id', interaction.campaign_id)
        .in('status', ['sent', 'in_progress', 'client_acquired']);

      if (countError) {
        return; // Silently fail
      }

      const contactedBusinesses = contactedCount?.length || 0;

      // Update campaign progress
      await this.updateCampaignProgress(interaction.campaign_id, contactedBusinesses);
    } catch (error) {
      console.error('Update campaign progress from interactions error:', error);
      // Don't throw error to avoid breaking the main interaction update
    }
  }

  static async bulkUpdateInteractionStatus(
    campaignId: string,
    businessIds: string[],
    status: CampaignBusinessInteraction['status'],
    lastAction?: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Verify campaign ownership
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', userData.user.id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('فشل في العثور على الحملة');
      }

      // Prepare update data
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (lastAction) {
        updateData.last_action = lastAction;
        updateData.last_action_at = new Date().toISOString();
      }

      // Update interactions for specified businesses
      const { error } = await supabase
        .from('campaign_business_interactions')
        .update(updateData)
        .eq('campaign_id', campaignId)
        .in('business_result_id', businessIds);

      if (error) {
        throw new Error('فشل في تحديث حالة التفاعلات');
      }

      // Update campaign progress
      await this.updateCampaignProgressFromInteractions(campaignId);
    } catch (error) {
      console.error('Bulk update interaction status error:', error);
      throw error;
    }
  }

  static async updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('campaigns')
        .update({ status })
        .eq('id', campaignId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في تحديث حالة الحملة');
      }
    } catch (error) {
      console.error('Update campaign status error:', error);
      throw error;
    }
  }

  static async updateCampaignProgress(campaignId: string, contactedBusinesses: number): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Get campaign to calculate progress
      const { data: campaign, error: fetchError } = await supabase
        .from('campaigns')
        .select('total_businesses')
        .eq('id', campaignId)
        .eq('user_id', userData.user.id)
        .single();

      if (fetchError || !campaign) {
        throw new Error('فشل في العثور على الحملة');
      }

      const progress = campaign.total_businesses > 0 
        ? Math.min((contactedBusinesses / campaign.total_businesses) * 100, 100)
        : 0;

      const { error } = await supabase
        .from('campaigns')
        .update({ 
          contacted_businesses: contactedBusinesses,
          progress: Math.round(progress * 100) / 100 // Round to 2 decimal places
        })
        .eq('id', campaignId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في تحديث تقدم الحملة');
      }
    } catch (error) {
      console.error('Update campaign progress error:', error);
      throw error;
    }
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في حذف الحملة');
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
      throw error;
    }
  }

  // Message Template Management Methods
  static async getMessageTemplates(): Promise<MessageTemplate[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل قوالب الرسائل');
      }

      return data || [];
    } catch (error) {
      console.error('Get message templates error:', error);
      throw error;
    }
  }

  static async createMessageTemplate(template: {
    name: string;
    type: MessageTemplate['type'];
    subject: string;
    content: string;
  }): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          user_id: userData.user.id,
          name: template.name,
          type: template.type,
          subject: template.subject,
          content: template.content,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        throw new Error('فشل في إنشاء قالب الرسالة');
      }

      return data.id;
    } catch (error) {
      console.error('Create message template error:', error);
      throw error;
    }
  }

  static async updateMessageTemplate(
    templateId: string,
    updates: {
      name?: string;
      subject?: string;
      content?: string;
    }
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('message_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في تحديث قالب الرسالة');
      }
    } catch (error) {
      console.error('Update message template error:', error);
      throw error;
    }
  }

  static async deleteMessageTemplate(templateId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في حذف قالب الرسالة');
      }
    } catch (error) {
      console.error('Delete message template error:', error);
      throw error;
    }
  }

  static async createDefaultTemplates(): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Check if user already has templates
      const { data: existingTemplates } = await supabase
        .from('message_templates')
        .select('id')
        .eq('user_id', userData.user.id)
        .limit(1);

      if (existingTemplates && existingTemplates.length > 0) {
        return; // User already has templates
      }

      const defaultTemplates = [
        {
          user_id: userData.user.id,
          name: 'قالب العرض الأساسي',
          type: 'offer' as const,
          subject: 'عرض خاص لـ {businessName}',
          content: `مرحباً من شركة {companyName}

نحن متخصصون في تقديم حلول رقمية متميزة للأعمال مثل {businessName}.

نود أن نقدم لكم عرضاً خاصاً يمكن أن يساعد في تطوير أعمالكم وزيادة أرباحكم.

هل يمكننا ترتيب مكالمة قصيرة لمناقشة كيف يمكننا مساعدتكم؟

مع أطيب التحيات
{senderName}`,
          is_default: true
        },
        {
          user_id: userData.user.id,
          name: 'قالب المتابعة الأساسي',
          type: 'follow_up' as const,
          subject: 'متابعة عرضنا لـ {businessName}',
          content: `مرحباً مرة أخرى

أردت المتابعة معكم بخصوص العرض الذي أرسلته لـ {businessName} منذ بضعة أيام.

نحن نؤمن بأن خدماتنا يمكن أن تحدث فرقاً حقيقياً في أعمالكم.

هل لديكم أي أسئلة؟ أم يمكننا ترتيب مكالمة سريعة؟

في انتظار ردكم
{senderName}`,
          is_default: true
        }
      ];

      const { error } = await supabase
        .from('message_templates')
        .insert(defaultTemplates);

      if (error) {
        console.error('Failed to create default templates:', error);
      }
    } catch (error) {
      console.error('Create default templates error:', error);
    }
  }

  // WhatsApp Message Generation
  static generateWhatsAppLink(phone: string, message: string, countryCode: string = '966'): string {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    let formattedPhone = cleanPhone;
    
    // Handle different phone number formats
    if (formattedPhone.startsWith('+')) {
      // Already has country code, remove + for wa.me format
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('00')) {
      // International format starting with 00, remove 00
      formattedPhone = formattedPhone.substring(2);
    } else if (formattedPhone.startsWith('0')) {
      // Local format starting with 0, replace with country code
      formattedPhone = countryCode + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith(countryCode)) {
      // Already has the correct country code
      formattedPhone = formattedPhone;
    } else {
      // Assume it's a local number without leading 0, prepend country code
      formattedPhone = countryCode + formattedPhone;
    }
    
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }

  static processMessageTemplate(
    template: MessageTemplate,
    businessName: string,
    placeholders: {
      companyName?: string;
      senderName?: string;
      [key: string]: string | undefined;
    } = {}
  ): string {
    let processedContent = template.content;
    
    // Replace business name
    processedContent = processedContent.replace(/{businessName}/g, businessName);
    
    // Replace other placeholders
    Object.entries(placeholders).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`{${key}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      }
    });
    
    return processedContent;
  }

  // Owner Management Methods
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Check if current user is owner
      const currentUser = await this.getUserProfile();
      if (currentUser.role !== 'owner') {
        throw new Error('غير مصرح لك بعرض جميع المستخدمين');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل قائمة المستخدمين');
      }

      return data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  static async addCreditsToUser(targetUserId: string, amount: number): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('add-credits', {
        body: {
          target_user_id: targetUserId,
          amount: amount
        }
      });

      if (error) {
        throw new Error(`فشل في إضافة الرصيد: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في إضافة الرصيد');
      }
    } catch (error) {
      console.error('Add credits error:', error);
      throw error;
    }
  }

  // Product Management Methods
  static async getProducts(filters?: { category?: string; activeOnly?: boolean }): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('فشل في تحميل المنتجات');
      }

      return (data || []).map(p => ({
        ...p,
        features: p.features || []
      }));
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  static async createProduct(productData: {
    name: string;
    description?: string;
    price_credits: number;
    type: string;
    category?: 'web_dev' | 'marketing' | 'arch_studio';
    image_url?: string;
    features?: string[];
    is_active?: boolean;
    display_order?: number;
    price_display?: string;
    tier?: 'basic' | 'pro' | 'enterprise';
  }): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          created_by: userData.user.id
        })
        .select()
        .single();

      if (error) {
        throw new Error('فشل في إنشاء المنتج');
      }

      return data.id;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  static async updateProduct(
    productId: string,
    updates: {
      name?: string;
      description?: string;
      price_credits?: number;
      type?: string;
      category?: 'web_dev' | 'marketing' | 'arch_studio';
      image_url?: string;
      features?: string[];
      is_active?: boolean;
      display_order?: number;
      price_display?: string;
      tier?: 'basic' | 'pro' | 'enterprise';
    }
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) {
        throw new Error('فشل في تحديث المنتج');
      }
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw new Error('فشل في حذف المنتج');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  }

  static async uploadProductImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error('فشل في رفع الصورة');
      }

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload product image error:', error);
      throw error;
    }
  }

  static async deleteProductImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/product-images/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];
      await supabase.storage
        .from('product-images')
        .remove([filePath]);
    } catch (error) {
      console.error('Delete product image error:', error);
      // Don't throw - image deletion failure is not critical
    }
  }

  static async getRevenueByProduct(dateFrom?: string, dateTo?: string): Promise<ProductRevenueData[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase.rpc('get_revenue_by_product', {
        p_user_id: userData.user.id,
        p_date_from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_date_to: dateTo || new Date().toISOString()
      });

      if (error) {
        throw new Error('فشل في تحميل تحليلات المنتجات');
      }

      return data || [];
    } catch (error) {
      console.error('Get revenue by product error:', error);
      throw error;
    }
  }

  // ==================== CRM Methods ====================

  // Business Notes
  static async getBusinessNotes(businessResultId: string): Promise<BusinessNote[]> {
    try {
      const { data, error } = await supabase
        .from('business_notes')
        .select('*')
        .eq('business_result_id', businessResultId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل الملاحظات');
      }

      return data || [];
    } catch (error) {
      console.error('Get business notes error:', error);
      throw error;
    }
  }

  static async createBusinessNote(businessResultId: string, note: string): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('business_notes')
        .insert({
          business_result_id: businessResultId,
          user_id: userData.user.id,
          note: note.trim()
        })
        .select()
        .single();

      if (error) {
        throw new Error('فشل في إنشاء الملاحظة');
      }

      return data.id;
    } catch (error) {
      console.error('Create business note error:', error);
      throw error;
    }
  }

  static async updateBusinessNote(noteId: string, note: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_notes')
        .update({
          note: note.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) {
        throw new Error('فشل في تحديث الملاحظة');
      }
    } catch (error) {
      console.error('Update business note error:', error);
      throw error;
    }
  }

  static async deleteBusinessNote(noteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_notes')
        .delete()
        .eq('id', noteId);

      if (error) {
        throw new Error('فشل في حذف الملاحظة');
      }
    } catch (error) {
      console.error('Delete business note error:', error);
      throw error;
    }
  }

  // Business Tags
  static async getBusinessTags(): Promise<BusinessTag[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('business_tags')
        .select('*, business_result_tags(count)')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل الوسوم');
      }

      // Map the count from the relation
      return (data || []).map(tag => ({
        ...tag,
        usage_count: tag.business_result_tags?.[0]?.count || 0,
        business_result_tags: undefined
      }));
    } catch (error) {
      console.error('Get business tags error:', error);
      throw error;
    }
  }

  static async createBusinessTag(name: string, color: string = '#3B82F6'): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('business_tags')
        .insert({
          user_id: userData.user.id,
          name: name.trim(),
          color
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('الوسم موجود بالفعل');
        }
        throw new Error('فشل في إنشاء الوسم');
      }

      return data.id;
    } catch (error) {
      console.error('Create business tag error:', error);
      throw error;
    }
  }

  static async updateBusinessTag(tagId: string, name: string, color: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_tags')
        .update({ name: name.trim(), color })
        .eq('id', tagId);

      if (error) {
        throw new Error('فشل في تحديث الوسم');
      }
    } catch (error) {
      console.error('Update business tag error:', error);
      throw error;
    }
  }

  static async deleteBusinessTag(tagId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('business_tags')
        .delete()
        .eq('id', tagId);

      if (error) {
        throw new Error('فشل في حذف الوسم');
      }
    } catch (error) {
      console.error('Delete business tag error:', error);
      throw error;
    }
  }

  static async getBusinessResultTags(businessResultId: string): Promise<BusinessTag[]> {
    try {
      const { data, error } = await supabase
        .from('business_result_tags')
        .select(`
          tag_id,
          business_tags(*)
        `)
        .eq('business_result_id', businessResultId);

      if (error) {
        throw new Error('فشل في تحميل وسوم العمل');
      }

      return data?.map(item => (item as any).business_tags).filter(Boolean) || [];
    } catch (error) {
      console.error('Get business result tags error:', error);
      throw error;
    }
  }

  static async assignTagsToBusinessResult(businessResultId: string, tagIds: string[]): Promise<void> {
    try {
      // Remove existing tags first
      await supabase
        .from('business_result_tags')
        .delete()
        .eq('business_result_id', businessResultId);

      // Insert new tags
      if (tagIds.length > 0) {
        const inserts = tagIds.map(tagId => ({
          business_result_id: businessResultId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('business_result_tags')
          .insert(inserts);

        if (error) {
          throw new Error('فشل في تعيين الوسوم');
        }
      }
    } catch (error) {
      console.error('Assign tags error:', error);
      throw error;
    }
  }

  // Tasks
  static async getTasks(filters?: { completed?: boolean; interactionId?: string }): Promise<Task[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters?.interactionId) {
        query = query.eq('interaction_id', filters.interactionId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('فشل في تحميل المهام');
      }

      return data || [];
    } catch (error) {
      console.error('Get tasks error:', error);
      throw error;
    }
  }

  static async createTask(taskData: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: 'low' | 'medium' | 'high';
    interaction_id?: string;
  }): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userData.user.id,
          title: taskData.title.trim(),
          description: taskData.description?.trim() || null,
          due_date: taskData.due_date || null,
          priority: taskData.priority || 'medium',
          interaction_id: taskData.interaction_id || null
        })
        .select()
        .single();

      if (error) {
        throw new Error('فشل في إنشاء المهمة');
      }

      return data.id;
    } catch (error) {
      console.error('Create task error:', error);
      throw error;
    }
  }

  static async updateTaskStatus(taskId: string, completed: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        throw new Error('فشل في تحديث حالة المهمة');
      }
    } catch (error) {
      console.error('Update task status error:', error);
      throw error;
    }
  }

  static async updateTask(taskId: string, updates: {
    title?: string;
    description?: string;
    due_date?: string | null;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        throw new Error('فشل في تحديث المهمة');
      }
    } catch (error) {
      console.error('Update task error:', error);
      throw error;
    }
  }

  static async deleteTask(taskId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        throw new Error('فشل في حذف المهمة');
      }
    } catch (error) {
      console.error('Delete task error:', error);
      throw error;
    }
  }

  // Interaction Status History
  static async getInteractionHistory(interactionId: string): Promise<InteractionStatusHistory[]> {
    try {
      const { data, error } = await supabase
        .from('interaction_status_history')
        .select('*')
        .eq('interaction_id', interactionId)
        .order('changed_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل سجل التفاعل');
      }

      return data || [];
    } catch (error) {
      console.error('Get interaction history error:', error);
      throw error;
    }
  }

  static async recordStatusChange(
    interactionId: string,
    oldStatus: string | null,
    newStatus: string
  ): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { error } = await supabase
        .from('interaction_status_history')
        .insert({
          interaction_id: interactionId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: userData.user.id
        });

      if (error) {
        throw new Error('فشل في تسجيل تغيير الحالة');
      }
    } catch (error) {
      console.error('Record status change error:', error);
      // Don't throw error to avoid breaking the main update flow
      console.warn('Status history recording failed but continuing');
    }
  }

  // ==================== Analytics Methods ====================

  static async getAnalytics(dateFrom?: string, dateTo?: string): Promise<AnalyticsData> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase.rpc('get_user_analytics', {
        p_user_id: userData.user.id,
        p_date_from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        p_date_to: dateTo || new Date().toISOString()
      });

      if (error) {
        throw new Error('فشل في تحميل التحليلات');
      }

      // Fetch conversion funnel data from interactions
      const conversionFunnel = await this.getConversionFunnel(userData.user.id);

      const rawBaseData = data[0] || {
        total_revenue: 0,
        total_mrr: 0,
        total_deals: 0,
        clients_acquired: 0,
        total_contacted: 0,
        conversion_rate: 0,
        avg_deal_size: 0,
        campaigns_count: 0,
        active_campaigns_count: 0
      };

      const baseData = {
        total_revenue: rawBaseData.total_revenue ?? 0,
        total_mrr: rawBaseData.total_mrr ?? 0,
        total_deals: rawBaseData.total_deals ?? 0,
        clients_acquired: rawBaseData.clients_acquired ?? 0,
        total_contacted: rawBaseData.total_contacted ?? 0,
        conversion_rate: rawBaseData.conversion_rate ?? 0,
        avg_deal_size: rawBaseData.avg_deal_size ?? 0,
        campaigns_count: rawBaseData.campaigns_count ?? 0,
        active_campaigns_count: rawBaseData.active_campaigns_count ?? 0
      };

      return {
        ...baseData,
        conversion_funnel: conversionFunnel
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  }

  static async getConversionFunnel(userId: string): Promise<ConversionFunnel> {
    try {
      const { data, error } = await supabase
        .from('campaign_business_interactions')
        .select('status, campaigns!inner(user_id)')
        .eq('campaigns.user_id', userId);

      if (error) {
        return { not_contacted: 0, sent: 0, in_progress: 0, client_acquired: 0, lost_rejected: 0 };
      }

      const funnel: ConversionFunnel = {
        not_contacted: 0,
        sent: 0,
        in_progress: 0,
        client_acquired: 0,
        lost_rejected: 0
      };

      data?.forEach((interaction: any) => {
        const status = interaction.status as keyof ConversionFunnel;
        if (status in funnel) {
          funnel[status]++;
        }
      });

      return funnel;
    } catch (error) {
      console.error('Get conversion funnel error:', error);
      return { not_contacted: 0, sent: 0, in_progress: 0, client_acquired: 0, lost_rejected: 0 };
    }
  }

  static async getCampaignRevenueAnalytics(): Promise<CampaignRevenue[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      const { data, error } = await supabase
        .from('campaign_revenue_analytics')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('campaign_created_at', { ascending: false });

      if (error) {
        throw new Error('فشل في تحميل تحليلات الحملات');
      }

      return data || [];
    } catch (error) {
      console.error('Get campaign revenue analytics error:', error);
      throw error;
    }
  }

  static async getRevenueByDate(dateFrom: string, dateTo: string): Promise<RevenueByDate[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('المستخدم غير مسجل الدخول');
      }

      // Get all interactions with revenue within date range
      const { data, error } = await supabase
        .from('campaign_business_interactions')
        .select(`
          created_at,
          mrr_value,
          one_time_deal_value,
          campaigns!inner(user_id)
        `)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)
        .eq('campaigns.user_id', userData.user.id);

      if (error) {
        throw new Error('فشل في تحميل بيانات الإيرادات');
      }

      // Group by date
      const revenueByDate: { [key: string]: RevenueByDate } = {};
      
      data?.forEach(interaction => {
        const date = new Date(interaction.created_at).toISOString().split('T')[0];
        
        if (!revenueByDate[date]) {
          revenueByDate[date] = {
            date,
            mrr: 0,
            deals: 0,
            total: 0
          };
        }
        
        const mrr = interaction.mrr_value || 0;
        const deals = interaction.one_time_deal_value || 0;
        
        revenueByDate[date].mrr += mrr;
        revenueByDate[date].deals += deals;
        revenueByDate[date].total += mrr + deals;
      });

      return Object.values(revenueByDate).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Get revenue by date error:', error);
      throw error;
    }
  }

  static async exportAnalyticsToCSV(dateFromOrData: string | any[], dateTo?: string): Promise<void> {
    try {
      let data: any[];
      let filename = 'analytics';

      if (typeof dateFromOrData === 'string') {
        // Called with date range - fetch data first
        const [analytics, campaignData] = await Promise.all([
          this.getAnalytics(dateFromOrData, dateTo),
          this.getCampaignRevenueAnalytics()
        ]);
        
        data = [
          {
            'إجمالي الإيرادات': analytics.total_revenue,
            'الإيرادات الشهرية المتكررة': analytics.total_mrr,
            'إجمالي الصفقات': analytics.total_deals,
            'العملاء المكتسبون': analytics.clients_acquired,
            'إجمالي التواصل': analytics.total_contacted,
            'معدل التحويل': `${analytics.conversion_rate}%`,
            'متوسط قيمة الصفقة': analytics.avg_deal_size,
            'عدد الحملات': analytics.campaigns_count,
            'الحملات النشطة': analytics.active_campaigns_count
          },
          ...campaignData.map(c => ({
            'اسم الحملة': c.campaign_name,
            'إجمالي التفاعلات': c.total_interactions,
            'العملاء المكتسبون': c.clients_acquired,
            'الإيرادات الشهرية': c.total_mrr,
            'إجمالي الصفقات': c.total_deals,
            'معدل التحويل': `${c.conversion_rate}%`
          }))
        ];
        filename = `analytics-${dateFromOrData}-${dateTo}`;
      } else {
        data = dateFromOrData;
      }

      if (data.length === 0) return;

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Export to CSV error:', error);
      throw new Error('فشل في تصدير البيانات');
    }
  }
}