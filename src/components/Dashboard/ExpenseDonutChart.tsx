import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Chart as ChartJS, ArcElement, Tooltip as ChartJsTooltip, Legend as ChartJsLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartJsTooltip, ChartJsLegend);

export const ExpenseDonutChart: React.FC = () => {
  const { categories, filteredTransactions } = useFinance();
  const [viewMode, setViewMode] = useState<'category' | 'subcategory'>('category');

  // Filter only expense transactions
  const expenses = filteredTransactions.filter((tx) => tx.type === 'expense');

  // Calculate expense totals by Category
  const categoryTotals: Record<string, { name: string; color: string; total: number }> = {};

  expenses.forEach((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id);
    const catId = cat?.id || 'outros';
    const catName = cat?.name || 'Outros / Sem Categoria';
    const catColor = cat?.color || '#64748b';

    if (!categoryTotals[catId]) {
      categoryTotals[catId] = { name: catName, color: catColor, total: 0 };
    }
    categoryTotals[catId].total += Number(tx.amount);
  });

  const categoryData = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

  // Calculate expense totals by Subcategory
  const subcategoryTotals: Record<string, { name: string; color: string; total: number }> = {};
  expenses.forEach((tx) => {
    const cat = categories.find((c) => c.id === tx.category_id);
    const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);
    const subName = sub?.name ? `${cat?.name}: ${sub.name}` : cat?.name || 'Outros';
    const color = cat?.color || '#64748b';

    if (!subcategoryTotals[subName]) {
      subcategoryTotals[subName] = { name: subName, color, total: 0 };
    }
    subcategoryTotals[subName].total += Number(tx.amount);
  });

  const subcategoryData = Object.values(subcategoryTotals).sort((a, b) => b.total - a.total);

  const activeData = viewMode === 'category' ? categoryData : subcategoryData;

  const totalExpenseSum = activeData.reduce((acc, curr) => acc + curr.total, 0);

  const chartData = {
    labels: activeData.map((d) => d.name),
    datasets: [
      {
        data: activeData.map((d) => d.total),
        backgroundColor: activeData.map((d) => d.color),
        borderColor: '#090d16',
        borderWidth: 3,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: 12,
          },
          padding: 14,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            const percentage = totalExpenseSum > 0 ? ((val / totalExpenseSum) * 100).toFixed(1) : 0;
            return ` ${formatCurrency(val)} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="section-header">
        <h3 className="section-title">
          <span style={{ color: '#f43f5e' }}>●</span> Distribuição de Saídas (Gastos)
        </h3>

        {/* Category vs Subcategory Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
          <button
            className={`btn-secondary ${viewMode === 'category' ? 'active' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              background: viewMode === 'category' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'category' ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => setViewMode('category')}
          >
            Por Categoria
          </button>
          <button
            className={`btn-secondary ${viewMode === 'subcategory' ? 'active' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              background: viewMode === 'subcategory' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'subcategory' ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => setViewMode('subcategory')}
          >
            Por Subcategoria
          </button>
        </div>
      </div>

      {activeData.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          Nenhuma saída registrada neste período.
        </div>
      ) : (
        <div style={{ position: 'relative', height: '280px', width: '100%', marginTop: '10px' }}>
          <Doughnut data={chartData} options={chartOptions} />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '35%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL GASTOS</span>
            <strong style={{ fontSize: '1.2rem', color: '#f43f5e' }}>{formatCurrency(totalExpenseSum)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
