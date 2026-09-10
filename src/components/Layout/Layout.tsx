import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
// For now, let's redefine TabType here
export type TabType = 'dashboard' | 'transactions' | 'scheduled' | 'categories';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleCollapse = () => setIsCollapsed(prev => !prev);

  return (
    <div className="layout-wrapper">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />
      
      <div className="main-wrapper">
        <Topbar onToggleSidebar={toggleSidebar} />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};
