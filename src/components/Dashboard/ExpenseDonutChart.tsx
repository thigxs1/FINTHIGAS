import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Chart as ChartJS, ArcElement, Tooltip as ChartJsTooltip, Legend as ChartJsLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, ChartJsTooltip, ChartJsLegend);

export const ExpenseDonutChart: React.FC = () => {
  const { categories, filteredTransactions } = useFinance();
  const [viewMode, setViewMode] = useState<'category' | 'subcategory'>('category');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile breakpoint via ResizeObserver
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(entry.contentRect.width < 520);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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
        // Move legend below chart on mobile to prevent clipping
        position: (isMobile ? 'bottom' : 'right') as 'bottom' | 'right',
        labels: {
          color: '#94a3b8',
          font: {
            family: 'Inter',
            size: isMobile ? 11 : 12,
          },
          padding: isMobile ? 10 : 14,
          // Safely format legend labels on mobile
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller ? meta.controller.getStyle(i, true) : {};
                const text = isMobile && label.length > 18 ? label.substring(0, 18) + '…' : label;
                return {
                  text,
                  fillStyle: style.backgroundColor || (data.datasets[0].backgroundColor as string[])?.[i],
                  strokeStyle: style.borderColor || '#090d16',
                  lineWidth: style.borderWidth || 2,
                  hidden: meta.data?.[i]?.hidden || false,

                  index: i,
                };
              });
            }
            return [];
          },

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

  // Chart height: taller on mobile because legend goes below
  const chartHeight = isMobile ? 220 : 280;

  return (
    <div className="glass-card" ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        <div style={{ position: 'relative', height: `${chartHeight}px`, width: '100%', marginTop: '10px' }}>
          <Doughnut data={chartData} options={chartOptions} />

          {/* Center label — only shown when legend is on the right (desktop) */}
          {!isMobile && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                // On desktop with right legend, chart area is ~65-70% of width; center at 32%
                left: '32%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL GASTOS</span>
              <strong style={{ fontSize: '1.1rem', color: '#f43f5e' }}>{formatCurrency(totalExpenseSum)}</strong>
            </div>
          )}
        </div>
      )}

      {/* On mobile, show total below chart since center text doesn't fit well */}
      {isMobile && activeData.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '8px', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL GASTOS</span>
          <div>
            <strong style={{ fontSize: '1.1rem', color: '#f43f5e' }}>{formatCurrency(totalExpenseSum)}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
