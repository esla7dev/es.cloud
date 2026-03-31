import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { SearchParams, SearchResult, Search } from './types/business';
import { BusinessApiService } from './services/businessApi';
import {
  Search as SearchIcon,
  History,
  ShoppingCart,
  MessageSquare,
  BarChart3,
  TrendingUp,
  CheckSquare,
  Tag,
  LogOut
} from 'lucide-react';

import AuthForm from './components/AuthForm';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import SearchForm from './components/SearchForm';
import ResultsPanel from './components/ResultsPanel';
import SearchHistory from './components/SearchHistory';
import CampaignsPanel from './components/CampaignsPanel';
import MessageTemplatesPanel from './components/MessageTemplatesPanel';
import UserSettingsPanel from './components/UserSettingsPanel';
import UserDashboardPanel from './components/UserDashboardPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import TasksPanel from './components/TasksPanel';
import TagsManager from './components/TagsManager';
import CampaignDetailsPage from './pages/CampaignDetailsPage';
import OwnerPanel from './components/OwnerPanel';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMetadata, setSearchMetadata] = useState<{
    pagesProcessed?: number;
    hasMorePages?: boolean;
  }>({});
  const [refreshCredits, setRefreshCredits] = useState(0);
  const [campaignsRefreshTrigger, setCampaignsRefreshTrigger] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [userRole, setUserRole] = useState<'user' | 'owner'>('user');

  const handleCampaignCreated = () => {
    setCampaignsRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserEmail(session.user.email || '');
        loadUserProfile();
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserEmail(session.user.email || '');
        loadUserProfile();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (refreshCredits > 0 && user) {
      loadUserProfile();
    }
  }, [refreshCredits, user]);

  const loadUserProfile = async () => {
    try {
      const profile = await BusinessApiService.getUserProfile();
      setUserCredits(profile.credits);
      setUserRole(profile.role);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will set user → null, triggering re-render to AuthForm.
    // Clear local state so stale data is not visible if the listener fires late.
    setSearchResults([]);
    setSearchMetadata({});
    setUserEmail('');
    setUserCredits(0);
    setUserRole('user');
  };

  const mobileMenuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: BarChart3 },
    { id: 'search', label: 'البحث', icon: SearchIcon },
    { id: 'history', label: 'تاريخ البحث', icon: History },
    { id: 'analytics', label: 'التحليلات', icon: TrendingUp },
    { id: 'tasks', label: 'المهام', icon: CheckSquare },
    { id: 'tags', label: 'الوسوم', icon: Tag },
    { id: 'templates', label: 'قوالب الرسائل', icon: MessageSquare }
  ];

  const handleSearch = async (params: SearchParams) => {
    setSearchLoading(true);
    setSearchResults([]);
    setSearchMetadata({});

    try {
      // Search using real Google Places API (credits are deducted inside this function)
      const { results, pagesProcessed, hasMorePages } = await BusinessApiService.searchBusinesses(params);

      // Save search to database and set results
      if (results.length > 0) {
        await BusinessApiService.saveSearch(params, results);
      }

      setSearchResults(results);

      if (results.length > 0) {
        setSearchMetadata({ pagesProcessed, hasMorePages });
      }

      // Trigger credit refresh in sidebar
      setRefreshCredits(prev => prev + 1);

    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
      toast.error(`خطأ في البحث: ${errorMessage}`);
      setSearchResults([]);
      setSearchMetadata({});
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLoadSearch = (search: Search) => {
    setActiveTab('search');
    if (search.business_results) {
      setSearchResults(search.business_results);
    }
  };

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  const toaster = (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 4000,
        style: { background: '#363636', color: '#fff', direction: 'rtl', textAlign: 'right' },
        success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );

  if (!user) {
    return (
      <ErrorBoundary>
        <>
          {toaster}
          <AuthForm onAuthSuccess={loadUserProfile} />
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
      {toaster}
      <div className="min-h-screen bg-gray-50 flex" dir="rtl">
        {/* Mobile Navigation */}
        <MobileNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userEmail={userEmail}
          userCredits={userCredits}
          userRole={userRole}
          menuItems={mobileMenuItems}
          onSignOut={handleSignOut}
        />
        
        {/* Desktop Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          refreshTrigger={campaignsRefreshTrigger}
        />
        
        <div className="flex-1 p-4 md:p-6 overflow-auto mt-16 md:mt-0">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage setActiveTab={setActiveTab} />} />
              <Route path="/owner-panel" element={<OwnerPanel />} />
              <Route path="/" element={
                <>
                  {activeTab === 'dashboard' && (
                    <UserDashboardPanel setActiveTab={setActiveTab} />
                  )}

                  {activeTab === 'search' && (
                    <div className="mb-6">
                      <SearchForm
                        onSearch={handleSearch}
                        loading={searchLoading}
                      />
                    </div>
                  )}

                  {activeTab === 'search' && (
                    <ResultsPanel
                      results={searchResults}
                      totalResults={searchResults.length}
                      loading={searchLoading}
                      pagesProcessed={searchMetadata.pagesProcessed}
                      hasMorePages={searchMetadata.hasMorePages}
                    />
                  )}

                  {activeTab === 'history' && (
                    <SearchHistory onLoadSearch={handleLoadSearch} />
                  )}

                  {activeTab === 'campaigns' && (
                    <CampaignsPanel onCampaignCreated={handleCampaignCreated} />
                  )}

                  {activeTab === 'analytics' && (
                    <AnalyticsPanel />
                  )}

                  {activeTab === 'tasks' && (
                    <TasksPanel />
                  )}

                  {activeTab === 'tags' && (
                    <TagsManager />
                  )}

                  {activeTab === 'templates' && (
                    <MessageTemplatesPanel />
                  )}

                  {activeTab === 'settings' && (
                    <UserSettingsPanel />
                  )}
                </>
              } />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  </ErrorBoundary>
  );
}

export default App;