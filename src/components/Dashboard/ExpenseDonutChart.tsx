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
        display: false, // Custom HTML legend used for perfect crispness & layout
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
    cutout: '74%',
  };

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
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? '16px' : '24px',
            marginTop: '10px',
          }}
        >
          {/* Donut Chart Container with Math Center Overlay */}
          <div
            style={{
              position: 'relative',
              width: isMobile ? '100%' : '55%',
              height: isMobile ? '210px' : '250px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Doughnut data={chartData} options={chartOptions} />

            {/* Crisp Vector HTML Overlay centered inside donut hole */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', display: 'block' }}>
                TOTAL GASTOS
              </span>
              <strong style={{ fontSize: '1.25rem', color: '#f43f5e', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>
                {formatCurrency(totalExpenseSum)}
              </strong>
            </div>
          </div>

          {/* HTML Legend List */}
          <div
            style={{
              flex: 1,
              width: isMobile ? '100%' : '45%',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: isMobile ? 'center' : 'flex-start',
              gap: isMobile ? '10px 14px' : '10px',
              maxHeight: isMobile ? 'none' : '250px',
              overflowY: isMobile ? 'visible' : 'auto',
              paddingRight: isMobile ? '0' : '4px',
            }}
          >
            {activeData.map((item) => {
              const percentage = totalExpenseSum > 0 ? ((item.total / totalExpenseSum) * 100).toFixed(1) : 0;
              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    width: isMobile ? 'auto' : '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        backgroundColor: item.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{item.name}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f43f5e', marginLeft: '6px' }}>
                      {formatCurrency(item.total)}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>
                      ({percentage}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
