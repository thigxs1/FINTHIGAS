import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Database, RefreshCw, Trash2, LogOut, User, Menu } from 'lucide-react';
import { getMonthName } from '../../utils/formatters';

interface TopbarProps {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const { periodFilter, setPeriodFilter, supabaseConnected, resetToMockData, resetToBlank } = useFinance();
  const { user, signOut } = useAuth();
  
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const resetRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownTop, setDropdownTop] = useState(0);

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, year: Number(e.target.value) }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, month: Number(e.target.value) }));
  };

  const handleToggleMenu = useCallback(() => {
    if (!showResetMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownTop(rect.bottom + 6);
    }
    setShowResetMenu((v) => !v);
  }, [showResetMenu]);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resetRef.current && !resetRef.current.contains(e.target as Node)) setShowResetMenu(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const years = [2024, 2025, 2026, 2027];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Abrir menu">
          <Menu size={24} />
        </button>
        
        {/* Period Filters */}
        <div className="header-filters topbar-period-filters" style={{ display: 'flex', gap: '8px' }}>
          <select value={periodFilter.month} onChange={handleMonthChange} className="topbar-select topbar-select-month">
            <option value={0}>Ano Inteiro</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select value={periodFilter.year} onChange={handleYearChange} className="topbar-select topbar-select-year">
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="topbar-right">
        {/* Supabase Status — icon-only, color indicates status */}
        <div
          className="badge badge-neutral topbar-status-icon"
          title={
            supabaseConnected
              ? 'Conectado ao Supabase — dados em nuvem sincronizados'
              : 'Modo Local (Offline): execute o supabase_schema.sql no painel do Supabase para ativar a nuvem'
          }
          style={{ padding: '7px', lineHeight: 0 }}
        >
          <Database
            size={15}
            style={{ color: supabaseConnected ? 'var(--accent-income)' : 'var(--accent-warning)' }}
          />
        </div>

        {/* Reset Dropdown */}
        <div className="reset-dropdown-wrapper" ref={resetRef}>
          <button
            ref={btnRef}
            className="btn-secondary topbar-reset-btn"
            style={{ padding: '6px 10px', gap: '4px' }}
            onClick={handleToggleMenu}
            title="Opções de Reset de Dados"
          >
            <RefreshCw size={14} />
            <ChevronDown size={12} className="hide-mobile" />
          </button>

          {showResetMenu && (
            <div className="reset-dropdown-menu" style={{ top: dropdownTop, right: 0 }}>
              <button
                className="reset-dropdown-item"
                style={{ padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--text-primary)' }}
                onClick={() => {
                  setShowResetMenu(false);
                  if (confirm('Resetar para os dados de demonstração originais?')) {
                    resetToMockData();
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>🔄 Restaurar Demonstração</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Volta aos dados de exemplo iniciais</div>
              </button>
              <button
                className="reset-dropdown-item"
                style={{ padding: '12px 16px', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => {
                  setShowResetMenu(false);
                  if (confirm('⚠️ Isso apagará TODOS os dados. Deseja começar do zero?')) {
                    resetToBlank();
                  }
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--accent-expense)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Trash2 size={14} /> Limpar Tudo (Blank)
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Apaga todos os registros e categorias</div>
              </button>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        {user && (
          <div ref={userRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              title={user.email}
              className="topbar-user-btn"
            >
              <div className="topbar-user-avatar">
                {userInitials}
              </div>
              <span className="topbar-user-name hide-mobile">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <ChevronDown size={14} className="topbar-user-chevron hide-mobile" />
            </button>

            {showUserMenu && (
              <div className="reset-dropdown-menu" style={{ top: 'calc(100% + 8px)', right: 0, minWidth: '220px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={16} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {user.user_metadata?.full_name || 'Usuário'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    if (confirm('Deseja sair da sua conta?')) await signOut();
                  }}
                  style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--accent-expense)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <LogOut size={14} /> Sair da Conta
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Encerrar sessão atual</div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
