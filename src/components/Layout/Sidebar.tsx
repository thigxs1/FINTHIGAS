import React from 'react';
import { LayoutDashboard, ArrowLeftRight, CalendarClock, Tags, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { TabType } from './Layout';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
}) => {
  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    onClose(); // Close sidebar on mobile after clicking
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img
              src="/icon-192.png"
              alt="FINTHIGAS"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
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
            title="Dashboard"
          >
            <LayoutDashboard size={20} className="nav-icon" />
            <span className="nav-item-label">Dashboard</span>
          </button>
          
          <button
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => handleTabClick('transactions')}
            title="Entradas & Saídas"
          >
            <ArrowLeftRight size={20} className="nav-icon" />
            <span className="nav-item-label">Entradas &amp; Saídas</span>
          </button>
          
          <button
            className={`nav-item ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => handleTabClick('scheduled')}
            title="Programados"
          >
            <CalendarClock size={20} className="nav-icon" />
            <span className="nav-item-label">Programados</span>
          </button>
          
          <button
            className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
            title="Categorias"
          >
            <Tags size={20} className="nav-icon" />
            <span className="nav-item-label">Categorias</span>
          </button>
        </nav>

        {/* Desktop-only collapse toggle at the bottom */}
        <div className="sidebar-footer desktop-only">
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed
              ? <PanelLeftOpen size={18} />
              : <PanelLeftClose size={18} />
            }
            <span className="nav-item-label">{isCollapsed ? 'Expandir' : 'Recolher'}</span>
          </button>
        </div>
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
