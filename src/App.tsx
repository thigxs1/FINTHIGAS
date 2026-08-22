import { useState, useEffect } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navigation, type TabType } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { ScheduledView } from './components/Scheduled/ScheduledView';
import { CategoriesView } from './components/Categories/CategoriesView';
import { ErrorBoundary } from './components/ErrorBoundary';

const VALID_TABS: TabType[] = ['dashboard', 'transactions', 'scheduled', 'categories'];
const TAB_STORAGE_KEY = 'finthigas_active_tab';

function getInitialTab(): TabType {
  try {
    const saved = localStorage.getItem(TAB_STORAGE_KEY) as TabType | null;
    if (saved && VALID_TABS.includes(saved)) return saved;
  } catch {}
  return 'dashboard';
}

import { useFinance } from './context/FinanceContext';
import { AlertTriangle, X } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  const [hideNotification, setHideNotification] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);
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
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <FinanceProvider>
        <AppContent />
      </FinanceProvider>
    </ErrorBoundary>
  );
}

