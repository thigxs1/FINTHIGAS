import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { Target, AlertCircle } from 'lucide-react';

export const BudgetProgress: React.FC = () => {
  const { categories, filteredTransactions } = useFinance();

  const expenseCategories = categories.filter((c) => c.type === 'expense' && (c.max_budget || 0) > 0);

  // Calculate total spent for each category in current period
  const categorySpent: Record<string, number> = {};
  filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      if (tx.category_id) {
        categoryTotalsAdd(categorySpent, tx.category_id, Number(tx.amount));
      }
    });

  function categoryTotalsAdd(obj: Record<string, number>, catId: string, val: number) {
    obj[catId] = (obj[catId] || 0) + val;
  }

  return (
    <div className="glass-card">
      <div className="section-header">
        <h3 className="section-title">
          <Target size={20} color="var(--accent-primary)" /> Limite de Gastos por Categoria (Orçamento)
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {expenseCategories.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nenhum teto de gastos configurado. Defina limites na aba <strong>Categorias</strong>.
          </p>
        ) : (
          expenseCategories.map((cat) => {
            const spent = categorySpent[cat.id] || 0;
            const max = cat.max_budget || 1;
            const percentage = Math.min(100, Math.round((spent / max) * 100));
            const isExceeded = spent > max;
            const isWarning = percentage >= 80 && !isExceeded;

            const barColor = isExceeded ? '#f43f5e' : isWarning ? '#f59e0b' : cat.color || '#10b981';

            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span>
                    <strong style={{ color: isExceeded ? '#f43f5e' : 'var(--text-primary)' }}>
                      {formatCurrency(spent)}
                    </strong>{' '}
                    / <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(max)}</span>
                  </span>
                </div>

                <div className="budget-bar-bg">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>

                {isExceeded && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#f43f5e', marginTop: '4px' }}>
                    <AlertCircle size={12} />
                    <span>Limite excedido em {formatCurrency(spent - max)}!</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
