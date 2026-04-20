import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import AINotesEngine from './pages/AINotesEngine';
import Timetable from './pages/Timetable';
import ExamRoadmap from './pages/ExamRoadmap';
import GradeAnalytics from './pages/GradeAnalytics';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useExamNotifications } from './hooks/useExamNotifications';
import { OnboardingTour } from './components/OnboardingTour';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

type View = 'dashboard' | 'notes' | 'timetable' | 'roadmap' | 'analytics';

function AppContent() {
  const { user, profile, loading } = useAuth();
  useExamNotifications(user?.id);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleViewChange = (e: Event) => {
      const detail = (e as CustomEvent<View>).detail;
      if (detail) setCurrentView(detail);
    };
    window.addEventListener('change-view', handleViewChange);
    const handleShowPricing = () => setShowPricing(true);
    window.addEventListener('show-pricing', handleShowPricing);

    // Gestisci ritorno da Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Pagamento completato! Il tuo piano è stato aggiornato 🎉');
      window.history.replaceState({}, '', '/');
    } else if (params.get('payment') === 'cancelled') {
      toast.error('Pagamento annullato.');
      window.history.replaceState({}, '', '/');
    }

    return () => {
      window.removeEventListener('change-view', handleViewChange);
      window.removeEventListener('show-pricing', handleShowPricing);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile) return <Onboarding />;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'notes': return <AINotesEngine searchQuery={searchQuery} />;
      case 'timetable': return <Timetable />;
      case 'roadmap': return <ExamRoadmap />;
      case 'analytics': return <GradeAnalytics />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      <Sidebar
        onViewChange={(view) => { setCurrentView(view as View); setMobileSidebarOpen(false); }}
        currentView={currentView}
        onShowPricing={() => setShowPricing(true)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      <main className="flex-1 lg:ml-[164px] flex flex-col min-h-screen">
        <TopHeader
          onShowPricing={() => setShowPricing(true)}
          onMenuClick={() => setMobileSidebarOpen(true)}
          currentView={currentView}
          searchQuery={currentView === 'notes' ? searchQuery : ''}
          onSearchChange={currentView === 'notes' ? setSearchQuery : undefined}
        />
        <div className="flex-1 overflow-y-auto">
          <div key={currentView} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderView()}
          </div>
        </div>
      </main>
      {showPricing && <Pricing onClose={() => setShowPricing(false)} />}
      <OnboardingTour />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" expand={false} richColors />
    </AuthProvider>
  );
}

export default App;
