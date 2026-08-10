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
        className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <LayoutDashboard size={18} />
        Dashboard & Análises
      </button>

      <button
        className={`nav-button ${activeTab === 'transactions' ? 'active' : ''}`}
        onClick={() => setActiveTab('transactions')}
      >
        <ArrowLeftRight size={18} />
        Entradas e Saídas
      </button>

      <button
        className={`nav-button ${activeTab === 'scheduled' ? 'active' : ''}`}
        onClick={() => setActiveTab('scheduled')}
      >
        <CalendarClock size={18} />
        Lançamentos Programados
      </button>

      <button
        className={`nav-button ${activeTab === 'categories' ? 'active' : ''}`}
        onClick={() => setActiveTab('categories')}
      >
        <Tags size={18} />
        Categorias & Subcategorias
      </button>
    </nav>
  );
};
