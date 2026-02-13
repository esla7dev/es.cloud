import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, CreditCard, Settings, LogOut, Crown, ShoppingCart, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { BusinessApiService } from '../services/businessApi';
import type { Campaign } from '../types/business';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  userCredits: number;
  userRole?: 'user' | 'owner';
  menuItems: Array<{ id: string; label: string; icon: any }>;
  onSignOut: () => void;
}

export default function MobileNav({
  activeTab,
  setActiveTab,
  userEmail,
  userCredits,
  userRole = 'user',
  menuItems,
  onSignOut
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCampaignsDropdown, setShowCampaignsDropdown] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const data = await BusinessApiService.getCampaigns();
      setCampaigns(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleMenuClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate('/');
    setIsOpen(false);
  };

  const handleCampaignClick = (campaignId: string) => {
    navigate(`/campaigns/${campaignId}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between p-4" dir="rtl">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {userCredits} نقطة
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Sidebar */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-40 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        dir="rtl"
      >
        <div className="flex flex-col h-full">
          {/* User Profile */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-semibold text-gray-900">الحساب</h3>
                <p className="text-sm text-gray-600 truncate" dir="ltr">
                  {userEmail}
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

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
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
                  onClick={() => {
                    setActiveTab('campaigns');
                    setShowCampaignsDropdown(!showCampaignsDropdown);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                    activeTab === 'campaigns' || location.pathname.startsWith('/campaigns/')
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

                {showCampaignsDropdown && (
                  <div className="mr-4 space-y-1">
                    <button
                      onClick={() => handleMenuClick('campaigns')}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-right transition-all duration-200 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                      <span>عرض جميع الحملات</span>
                    </button>

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
                          <span className="truncate" dir="rtl">{campaign.name}</span>
                        </button>
                      ))
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
                  setIsOpen(false);
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
              onClick={() => handleMenuClick('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">الإعدادات</span>
            </button>

            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
