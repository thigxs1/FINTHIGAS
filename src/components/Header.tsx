import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Database, CheckCircle2, AlertTriangle, RefreshCw, Trash2, LogOut, User } from 'lucide-react';
import { getMonthName } from '../utils/formatters';

export const Header: React.FC = () => {
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
    <header className="app-header glass-card">
      {/* Brand */}
      <div className="brand-logo">
        <img
          src="/icon.png"
          alt="FINTHIGAS"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            objectFit: 'cover',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
            flexShrink: 0,
          }}
        />
        <div>
          <h1 className="brand-title">FINTHIGAS</h1>
          <p className="brand-subtitle">Gestão Financeira & Controle de Gastos</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="header-actions">
        {/* Period Filters */}
        <div className="header-filters">
          <select value={periodFilter.month} onChange={handleMonthChange}>
            <option value={0}>Ano Inteiro</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{getMonthName(m)}</option>
            ))}
          </select>
          <select value={periodFilter.year} onChange={handleYearChange}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Supabase Status Badge */}
        <div
          className="status-badge"
          title={
            supabaseConnected
              ? 'Conectado ao Supabase — dados em nuvem sincronizados'
              : 'Modo Local: execute o supabase_schema.sql no painel do Supabase para ativar a nuvem'
          }
        >
          <Database size={13} style={{ color: supabaseConnected ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
          <span>{supabaseConnected ? 'Supabase Ativo' : 'Local (Offline)'}</span>
          {supabaseConnected
            ? <CheckCircle2 size={12} color="#10b981" />
            : <AlertTriangle size={12} color="#f59e0b" />
          }
        </div>

        {/* Reset Dropdown */}
        <div className="reset-dropdown-wrapper" ref={resetRef}>
          <button
            ref={btnRef}
            className="btn-secondary"
            style={{ padding: '8px 10px', gap: '4px' }}
            onClick={handleToggleMenu}
            title="Opções de Reset de Dados"
          >
            <RefreshCw size={13} />
            <ChevronDown size={12} />
          </button>

          {showResetMenu && (
            <div className="reset-dropdown-menu" style={{ top: dropdownTop }}>
              <button
                className="reset-dropdown-item"
                onClick={() => {
                  setShowResetMenu(false);
                  if (confirm('Resetar para os dados de demonstração originais?')) {
                    resetToMockData();
                  }
                }}
              >
                <strong>🔄 Restaurar Demonstração</strong>
                <small>Volta aos dados de exemplo iniciais</small>
              </button>
              <button
                className="reset-dropdown-item"
                onClick={() => {
                  setShowResetMenu(false);
                  if (confirm('⚠️ Isso apagará TODOS os dados. Deseja começar do zero?')) {
                    resetToBlank();
                  }
                }}
              >
                <strong style={{ color: '#f43f5e' }}>
                  <Trash2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Limpar Tudo (Blank)
                </strong>
                <small>Apaga todos os registros e categorias</small>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(124, 58, 237, 0.15)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                borderRadius: '20px',
                padding: '5px 10px 5px 5px',
                cursor: 'pointer',
                color: '#c4b5fd',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800, color: 'white', flexShrink: 0,
              }}>
                {userInitials}
              </div>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <ChevronDown size={12} />
            </button>

            {showUserMenu && (
              <div className="reset-dropdown-menu" style={{ top: 44, right: 0, left: 'auto', minWidth: '200px' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} color="var(--text-muted)" />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        {user.user_metadata?.full_name || 'Usuário'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  className="reset-dropdown-item"
                  onClick={async () => {
                    setShowUserMenu(false);
                    if (confirm('Deseja sair da sua conta?')) await signOut();
                  }}
                  style={{ color: '#f43f5e' }}
                >
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e' }}>
                    <LogOut size={13} /> Sair da Conta
                  </strong>
                  <small style={{ color: 'var(--text-muted)' }}>Encerrar sessão atual</small>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
