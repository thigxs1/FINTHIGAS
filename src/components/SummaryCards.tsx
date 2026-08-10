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
          <span>SALDO ATUAL</span>
          <div className="summary-icon balance">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="summary-value" style={{ color: summary.balance >= 0 ? '#f8fafc' : '#f43f5e' }}>
          {formatCurrency(summary.balance)}
        </div>
        <div className="summary-subtitle">
          Taxa de Economia: <strong style={{ color: '#10b981' }}>{summary.savingsRate}%</strong>
        </div>
      </div>

      {/* Incomes Card */}
      <div className="glass-card summary-card income">
        <div className="summary-header">
          <span>TOTAL ENTRADAS</span>
          <div className="summary-icon income">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#10b981' }}>
          {formatCurrency(summary.totalIncome)}
        </div>
        <div className="summary-subtitle">Receitas confirmadas no período</div>
      </div>

      {/* Expenses Card */}
      <div className="glass-card summary-card expense">
        <div className="summary-header">
          <span>TOTAL SAÍDAS (GASTOS)</span>
          <div className="summary-icon expense">
            <TrendingDown size={20} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#f43f5e' }}>
          {formatCurrency(summary.totalExpense)}
        </div>
        <div className="summary-subtitle">Despesas pagas no período</div>
      </div>

      {/* Scheduled Pending Card */}
      <div className="glass-card summary-card scheduled">
        <div className="summary-header">
          <span>SAÍDAS PROGRAMADAS</span>
          <div className="summary-icon scheduled">
            <Clock size={20} />
          </div>
        </div>
        <div className="summary-value" style={{ color: '#f59e0b' }}>
          {formatCurrency(summary.pendingScheduledExpenses)}
        </div>
        <div className="summary-subtitle">Previsão a vencer</div>
      </div>
    </div>
  );
};
