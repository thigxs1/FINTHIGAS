import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navigation, type TabType } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { ScheduledView } from './components/Scheduled/ScheduledView';
import { CategoriesView } from './components/Categories/CategoriesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthView } from './components/Auth/AuthView';
import { AlertTriangle, X, Loader2, Mic } from 'lucide-react';
import { useFinance } from './context/FinanceContext';
import { VoiceTransactionModal } from './components/Modals/VoiceTransactionModal';

const VALID_TABS: TabType[] = ['dashboard', 'transactions', 'scheduled', 'categories'];
const TAB_STORAGE_KEY = 'finthigas_active_tab';

function getInitialTab(): TabType {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabType | null;
    if (saved && VALID_TABS.includes(saved)) return saved;
  } catch {}
  return 'dashboard';
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [hideNotification, setHideNotification] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const { scheduledTransactions } = useFinance();

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    try { localStorage.setItem(TAB_STORAGE_KEY, tab); } catch {}
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingScheduled = scheduledTransactions.filter(
    (stx) => stx.is_active && stx.due_date <= todayStr
  );

  useEffect(() => {
    if (pendingScheduled.length > 0 && !hideNotification && !notificationSent) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Aviso - Finthigas', {
            body: `Você tem ${pendingScheduled.length} conta(s) programada(s) vencendo hoje ou atrasada(s).`,
          });
          setNotificationSent(true);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Aviso - Finthigas', {
                body: `Você tem ${pendingScheduled.length} conta(s) programada(s) vencendo hoje ou atrasada(s).`,
              });
              setNotificationSent(true);
            }
          });
        }
      }
    }
  }, [pendingScheduled.length, hideNotification, notificationSent]);

  return (
    <div className="app-container">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />
      
      {!hideNotification && pendingScheduled.length > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          borderLeft: '4px solid #f59e0b',
          margin: '0 0 16px 0',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '4px',
          width: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fcd34d' }}>
            <AlertTriangle size={18} />
            <span>
              Você tem <strong>{pendingScheduled.length}</strong> conta(s) programada(s) vencendo hoje ou atrasada(s).
              <button 
                onClick={() => handleSetActiveTab('scheduled')}
                style={{ background: 'none', border: 'none', color: '#fcd34d', textDecoration: 'underline', marginLeft: '8px', cursor: 'pointer', padding: 0 }}
              >
                Ver Contas
              </button>
            </span>
          </div>
          <button 
            onClick={() => setHideNotification(true)}
            style={{ background: 'none', border: 'none', color: '#fcd34d', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <main>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'scheduled' && <ScheduledView />}
        {activeTab === 'categories' && <CategoriesView />}
      </main>

      {/* Global Floating Action Button for Voice */}
      <button
        type="button"
        onClick={() => setIsVoiceModalOpen(true)}
        className="floating-voice-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 8px 28px rgba(124, 58, 237, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 99,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        title="Lançamento Rápido por Voz"
      >
        <Mic size={24} />
      </button>

      <VoiceTransactionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
}

// Gate: shows loading spinner, AuthView or the main app based on auth state
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '12px',
        color: 'var(--text-muted)',
      }}>
        <Loader2 size={32} className="spin" style={{ color: '#7c3aed' }} />
        <span style={{ fontSize: '0.9rem' }}>Carregando...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
