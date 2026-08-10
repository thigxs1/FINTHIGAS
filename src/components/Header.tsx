import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, ChevronDown, Database, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { getMonthName } from '../utils/formatters';

export const Header: React.FC = () => {
  const { periodFilter, setPeriodFilter, supabaseConnected, resetToMockData, resetToBlank } = useFinance();
  const [showResetMenu, setShowResetMenu] = useState(false);
  const resetRef = useRef<HTMLDivElement>(null);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, year: Number(e.target.value) }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, month: Number(e.target.value) }));
  };

  // Close reset menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (resetRef.current && !resetRef.current.contains(e.target as Node)) {
        setShowResetMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const years = [2024, 2025, 2026, 2027];

  return (
    <header className="app-header glass-card">
      {/* Brand */}
      <div className="brand-logo">
        <div className="brand-icon">
          <Wallet size={20} />
        </div>
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
            className="btn-secondary"
            style={{ padding: '8px 10px', gap: '4px' }}
            onClick={() => setShowResetMenu((v) => !v)}
            title="Opções de Reset de Dados"
          >
            <RefreshCw size={13} />
            <ChevronDown size={12} />
          </button>

          {showResetMenu && (
            <div className="reset-dropdown-menu">
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
      </div>
    </header>
  );
};
