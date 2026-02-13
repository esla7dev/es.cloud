import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BusinessApiService } from '../services/businessApi';
import { Campaign } from '../types/business';
import { 
  User, 
  CreditCard, 
  Search, 
  History, 
  ShoppingCart, 
  LogOut, 
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Target,
  BarChart3,
  Crown,
  TrendingUp,
  CheckSquare,
  Tag
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshTrigger?: number;
}

export default function Sidebar({ activeTab, setActiveTab, refreshTrigger }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string>('');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userRole, setUserRole] = useState<'user' | 'owner'>('user');
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showCampaignsDropdown, setShowCampaignsDropdown] = useState(false);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUser(); // This will refresh credits
      loadCampaigns();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    // Auto-expand campaigns dropdown if we're on a campaign page
    if (location.pathname.startsWith('/campaigns/')) {
      setShowCampaignsDropdown(true);
    }
  }, [location.pathname]);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
        
        // Load user profile to get credits
        const profile = await BusinessApiService.getUserProfile();
        setUserCredits(profile.credits);
        setUserRole(profile.role);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const campaignsData = await BusinessApiService.getCampaigns();
      setCampaigns(campaignsData.slice(0, 10)); // Show only recent 10 campaigns
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
  };

  const handleCampaignsMenuClick = () => {
    // Always navigate to campaigns page and toggle dropdown
    setActiveTab('campaigns');
    navigate('/');
    setShowCampaignsDropdown(!showCampaignsDropdown);
  };

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
    { id: 'search', label: 'البحث', icon: Search },
    { id: 'history', label: 'تاريخ البحث', icon: History },
    { id: 'analytics', label: 'التحليلات والتقارير', icon: TrendingUp },
    { id: 'tasks', label: 'المهام', icon: CheckSquare },
    { id: 'tags', label: 'الوسوم', icon: Tag },
    { id: 'templates', label: 'قوالب الرسائل', icon: MessageSquare }
  ];

  const isOnCampaignPage = location.pathname.startsWith('/campaigns/');

  return (
    <div className="hidden md:flex w-80 bg-white border-l border-gray-200 h-screen flex-col">
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-right">
            <h3 className="font-semibold text-gray-900">الحساب</h3>
            <p className="text-sm text-gray-600 truncate" dir="ltr">
              {loading ? '...' : userEmail}
            </p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <div className="text-right">
              <p className="text-sm text-gray-600">الرصيد المتاح</p>
              <p className="text-2xl font-bold text-emerald-600">
                {userCredits}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Campaigns Section with Dropdown */}
          <div className="space-y-1">
            <button
              onClick={handleCampaignsMenuClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                (activeTab === 'campaigns' && !isOnCampaignPage) || isOnCampaignPage
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showCampaignsDropdown ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">الحملات</span>
            </button>

            {/* Campaigns Dropdown */}
            {showCampaignsDropdown && (
              <div className="mr-4 space-y-1">
                {/* View All Campaigns */}
                <button
                  onClick={() => {
                    setActiveTab('campaigns');
                    navigate('/');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-right transition-all duration-200 text-sm ${
                    activeTab === 'campaigns' && !isOnCampaignPage
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                  <span>عرض جميع الحملات</span>
                </button>

                {/* Individual Campaigns */}
                {campaignsLoading ? (
                  <div className="px-4 py-2 text-xs text-gray-500 text-right">
                    جاري التحميل...
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="px-4 py-2 text-xs text-gray-500 text-right">
                    لا توجد حملات
                  </div>
                ) : (
                  campaigns.map((campaign) => (
                    <button
                      key={campaign.id}
                      onClick={() => handleCampaignClick(campaign.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-right transition-all duration-200 text-sm ${
                        location.pathname === `/campaigns/${campaign.id}`
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Target className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate" dir="rtl">
                        {campaign.name}
                      </span>
                    </button>
                  ))
                )}

                {campaigns.length >= 10 && (
                  <div className="px-4 py-1 text-xs text-gray-400 text-right">
                    عرض أحدث 10 حملات
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {userRole === 'owner' && (
          <button
            onClick={() => {
              navigate('/owner-panel');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
              location.pathname === '/owner-panel'
                ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Crown className="w-5 h-5" />
            <span className="font-medium">لوحة المالك</span>
          </button>
        )}
        
        <button
          onClick={() => {
            setActiveTab('settings');
            navigate('/');
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
            activeTab === 'settings' && !isOnCampaignPage && location.pathname !== '/owner-panel'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">الإعدادات</span>
        </button>
        
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );
}