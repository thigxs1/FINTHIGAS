import { useState } from 'react';
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

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);

  const handleSetActiveTab = (tab: TabType) => {
    setActiveTab(tab);
    try { localStorage.setItem(TAB_STORAGE_KEY, tab); } catch {}
  };

  return (
    <div className="app-container">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={handleSetActiveTab} />

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

