import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { Dashboard } from './components/Dashboard';
import AINotesEngine from './pages/AINotesEngine';
import Timetable from './pages/Timetable';
import ExamRoadmap from './pages/ExamRoadmap';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

type View = 'dashboard' | 'notes' | 'timetable' | 'roadmap' | 'analytics';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    const handleViewChange = (e: any) => {
      if (e.detail) setCurrentView(e.detail as View);
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Login />;
  if (!profile) return <Onboarding />;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'notes': return <AINotesEngine />;
      case 'timetable': return <Timetable />;
      case 'roadmap': return <ExamRoadmap />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar
        onViewChange={(view: View) => setCurrentView(view)}
        currentView={currentView}
        onShowPricing={() => setShowPricing(true)}
      />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopHeader onShowPricing={() => setShowPricing(true)} />
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>
      {showPricing && <Pricing onClose={() => setShowPricing(false)} />}
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
