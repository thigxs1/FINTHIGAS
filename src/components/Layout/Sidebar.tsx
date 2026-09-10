import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CalendarClock, Tags, X } from 'lucide-react';
import { TabType } from './Layout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    onClose(); // Close sidebar on mobile after clicking
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
            }}>
              F
            </div>
            <span className="sidebar-brand-text">FINTHIGAS</span>
          </div>
          {isOpen && (
            <button className="menu-toggle" onClick={onClose} style={{ display: 'flex' }} aria-label="Fechar menu">
              <X size={20} />
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabClick('dashboard')}
          >
            <LayoutDashboard size={20} className="nav-icon" />
            <span className="nav-item-label">Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleTabClick('transactions')}
          >
            <ArrowLeftRight size={20} className="nav-icon" />
            <span className="nav-item-label">Entradas & Saídas</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => handleTabClick('scheduled')}
          >
            <CalendarClock size={20} className="nav-icon" />
            <span className="nav-item-label">Programados</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
          >
            <Tags size={20} className="nav-icon" />
            <span className="nav-item-label">Categorias</span>
          </button>
        </nav>
      </aside>
      
      {/* Mobile Overlay */}
      <div 
        className="sidebar-overlay" 
        onClick={onClose} 
        style={{ display: isOpen ? 'block' : 'none' }}
      />
    </>
  );
};
