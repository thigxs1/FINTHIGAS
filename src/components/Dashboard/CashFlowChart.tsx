import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, getMonthName } from '../../utils/formatters';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartJsTooltip,
  Legend as ChartJsLegend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartJsTooltip, ChartJsLegend);

export const CashFlowChart: React.FC = () => {
  const { transactions } = useFinance();

  // Aggregate monthly amounts for the current year
  const currentYear = new Date().getFullYear();
  const monthlyIncomes = Array(12).fill(0);
  const monthlyExpenses = Array(12).fill(0);

  transactions.forEach((tx) => {
    if (!tx.date) return;
    const [y, m] = tx.date.split('-').map(Number);
    if (y === currentYear && m >= 1 && m <= 12) {
      const val = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        monthlyIncomes[m - 1] += val;
      } else {
        monthlyExpenses[m - 1] += val;
      }
    }
  });

  const monthLabels = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1).substring(0, 3));

  const data = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Entradas (Receitas)',
        data: monthlyIncomes,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
      {
        label: 'Saídas (Gastos)',
        data: monthlyExpenses,
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.raw)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          callback: (value: any) => `R$ ${value}`,
        },
      },
    },
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header">
        <h3 className="section-title">📊 Fluxo Anual: Entradas vs Saídas ({currentYear})</h3>
      </div>
      <div style={{ position: 'relative', height: '280px', width: '100%', marginTop: '10px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
