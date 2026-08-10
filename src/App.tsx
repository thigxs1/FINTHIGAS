import { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navigation, type TabType } from './components/Navigation';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { ScheduledView } from './components/Scheduled/ScheduledView';
import { CategoriesView } from './components/Categories/CategoriesView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="app-container">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

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
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
