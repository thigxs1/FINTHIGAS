import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, RefreshCw, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getMonthName } from '../utils/formatters';

export const Header: React.FC = () => {
  const { periodFilter, setPeriodFilter, supabaseConnected, resetToMockData } = useFinance();

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, year: Number(e.target.value) }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodFilter((prev) => ({ ...prev, month: Number(e.target.value) }));
  };

  const years = [2024, 2025, 2026, 2027];

  return (
    <header className="app-header glass-card">
      <div className="brand-logo">
        <div className="brand-icon">
          <Wallet size={24} />
        </div>
        <div>
          <h1 className="brand-title">FINTHIGAS</h1>
          <p className="brand-subtitle">Gestão Financeira & Controle de Gastos</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Period Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select value={periodFilter.month} onChange={handleMonthChange}>
            <option value={0}>Ano Inteiro</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>

          <select value={periodFilter.year} onChange={handleYearChange}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Supabase Connection Status Badge */}
        <div
          className="status-badge"
          title={
            supabaseConnected
              ? 'Conectado ao Supabase com sucesso'
              : 'Modo Offline (LocalStorage) - Execute o supabase_schema.sql no Supabase'
          }
        >
          <Database size={14} style={{ color: supabaseConnected ? '#10b981' : '#f59e0b' }} />
          <span>{supabaseConnected ? 'Supabase Conectado' : 'Modo Local (Offline)'}</span>
          {supabaseConnected ? (
            <CheckCircle2 size={14} color="#10b981" />
          ) : (
            <AlertTriangle size={14} color="#f59e0b" />
          )}
        </div>

        {/* Reset Demo Data Button */}
        <button
          className="btn-secondary"
          onClick={() => {
            if (confirm('Deseja resetar para os dados de demonstração originais?')) {
              resetToMockData();
            }
          }}
          title="Resetar Dados de Exemplo"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
};
