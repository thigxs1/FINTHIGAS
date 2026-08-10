import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

export const SummaryCards: React.FC = () => {
  const { summary } = useFinance();

  return (
    <div className="summary-grid">
      {/* Balance Card */}
      <div className="glass-card summary-card balance">
        <div className="summary-header">
          <span>Saldo Atual</span>
          <div className="summary-icon balance">
            <DollarSign size={16} />
          </div>
        </div>
        <div className="summary-value" style={{ color: summary.balance >= 0 ? '#f0f0f0' : '#f43f5e' }}>
          {formatCurrency(summary.balance)}
        </div>
        <div className="summary-subtitle">
          Economia: <strong style={{ color: '#10b981' }}>{summary.savingsRate}%</strong>
        </div>
      </div>

      {/* Incomes Card */}
      <div className="glass-card summary-card income">
        <div className="summary-header">
          <span>Entradas</span>
          <div className="summary-icon income">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#10b981' }}>
          {formatCurrency(summary.totalIncome)}
        </div>
        <div className="summary-subtitle">Receitas no período</div>
      </div>

      {/* Expenses Card */}
      <div className="glass-card summary-card expense">
        <div className="summary-header">
          <span>Saídas</span>
          <div className="summary-icon expense">
            <TrendingDown size={16} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#f43f5e' }}>
          {formatCurrency(summary.totalExpense)}
        </div>
        <div className="summary-subtitle">Despesas no período</div>
      </div>

      {/* Scheduled Pending Card */}
      <div className="glass-card summary-card scheduled">
        <div className="summary-header">
          <span>Programadas</span>
          <div className="summary-icon scheduled">
            <Clock size={16} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#f59e0b' }}>
          {formatCurrency(summary.pendingScheduledExpenses)}
        </div>
        <div className="summary-subtitle">Saídas a vencer</div>
      </div>
    </div>
  );
};
