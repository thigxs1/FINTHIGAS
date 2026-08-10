import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Flame } from 'lucide-react';

export const TopExpenses: React.FC = () => {
  const { filteredTransactions, categories } = useFinance();

  const topExpenses = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5);

  return (
    <div className="glass-card">
      <div className="section-header">
        <h3 className="section-title">
          <Flame size={20} color="#f43f5e" /> Maiores Saídas do Período (Top Gastos)
        </h3>
      </div>

      {topExpenses.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum gasto registrado neste período.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {topExpenses.map((tx, idx) => {
            const cat = categories.find((c) => c.id === tx.category_id);
            const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);

            return (
              <div
                key={tx.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  borderLeft: `4px solid ${cat?.color || '#f43f5e'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      width: '18px',
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{tx.description}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {cat?.name || 'Sem Categoria'} {sub ? `• ${sub.name}` : ''} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color: '#f43f5e', fontSize: '1rem' }}>
                    - {formatCurrency(Number(tx.amount))}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
