import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Layout, type TabType } from './components/Layout/Layout';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { ScheduledView } from './components/Scheduled/ScheduledView';
import { CategoriesView } from './components/Categories/CategoriesView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthView } from './components/Auth/AuthView';
import { AlertTriangle, X, Loader2, Mic, CalendarAlert } from 'lucide-react';
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
    <Layout activeTab={activeTab} setActiveTab={handleSetActiveTab}>
      {!hideNotification && pendingScheduled.length > 0 && (
        <div className="alert-banner">
          <div className="alert-content">
            <CalendarAlert size={18} />
            <span>
              Você tem <strong>{pendingScheduled.length}</strong> conta(s) programada(s) vencendo hoje ou atrasada(s).
              <button 
                onClick={() => handleSetActiveTab('scheduled')}
                style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', marginLeft: '8px', cursor: 'pointer', padding: 0 }}
              >
                Ver Contas
              </button>
            </span>
          </div>
          <button 
            onClick={() => setHideNotification(true)}
            aria-label="Fechar alerta"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'transactions' && <TransactionsView />}
      {activeTab === 'scheduled' && <ScheduledView />}
      {activeTab === 'categories' && <CategoriesView />}

      {/* Global Floating Action Button for Voice */}
      <button
        type="button"
        onClick={() => setIsVoiceModalOpen(true)}
        className="floating-voice-btn"
        title="Lançamento Rápido por Voz"
      >
        <Mic size={24} />
      </button>

      <VoiceTransactionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </Layout>
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
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent-primary)' }} />
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
