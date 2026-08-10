import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CalendarClock, Tags } from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'scheduled' | 'categories';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="nav-tabs">
      <button
        id="nav-dashboard"
        className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <LayoutDashboard size={17} />
        <span className="nav-label">Dashboard</span>
      </button>

      <button
        id="nav-transactions"
        className={`nav-button ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => setActiveTab('transactions')}
      >
        <ArrowLeftRight size={17} />
        <span className="nav-label">Entradas & Saídas</span>
      </button>

      <button
        id="nav-scheduled"
        className={`nav-button ${activeTab === 'scheduled' ? 'active' : ''}`}
        onClick={() => setActiveTab('scheduled')}
      >
        <CalendarClock size={17} />
        <span className="nav-label">Programados</span>
      </button>

      <button
        id="nav-categories"
        className={`nav-button ${activeTab === 'categories' ? 'active' : ''}`}
        onClick={() => setActiveTab('categories')}
      >
        <Tags size={17} />
        <span className="nav-label">Categorias</span>
      </button>
    </nav>
  );
};
