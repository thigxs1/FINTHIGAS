import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ScheduledTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, CalendarClock, CheckCircle, Edit2, Trash2, Repeat } from 'lucide-react';
import { ScheduledModal } from '../Modals/ScheduledModal';

export const ScheduledView: React.FC = () => {
  const { scheduledTransactions, categories, executeScheduledTransaction, deleteScheduledTransaction } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledTransaction | null>(null);

  const handleOpenNew = () => {
    setEditingScheduled(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stx: ScheduledTransaction) => {
    setEditingScheduled(stx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este agendamento programado?')) {
      await deleteScheduledTransaction(id);
    }
  };

  const handleExecute = async (stx: ScheduledTransaction) => {
    if (confirm(`Confirmar efetivação de "${stx.description}" no valor de ${formatCurrency(stx.amount)}?`)) {
      await executeScheduledTransaction(stx);
    }
  };

  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensal',
    weekly: 'Semanal',
    yearly: 'Anual',
    once: 'Única Vez',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="section-title">
              <CalendarClock size={22} color="var(--accent-warning)" /> Programação de Contas & Receitas Futuras
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Gerencie despesas recorrentes (aluguel, contas, assinaturas) e receitas esperadas. Efetive com 1 clique.
            </p>
          </div>

          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Nova Programação
          </button>
        </div>
      </div>

      {/* Grid of Scheduled Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {scheduledTransactions.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Nenhum agendamento programado cadastrado.</p>
          </div>
        ) : (
          scheduledTransactions.map((stx) => {
            const cat = categories.find((c) => c.id === stx.category_id);
            const sub = cat?.subcategories?.find((s) => s.id === stx.subcategory_id);

            return (
              <div
                key={stx.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${stx.type === 'income' ? '#10b981' : '#f43f5e'}`,
                  opacity: stx.is_active ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span className={`badge ${stx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {stx.type === 'income' ? 'Entrada Programada' : 'Saída Programada'}
                      </span>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '8px' }}>{stx.description}</h4>
                    </div>
                    <strong style={{ fontSize: '1.2rem', color: stx.type === 'income' ? '#10b981' : '#f43f5e' }}>
                      {formatCurrency(Number(stx.amount))}
                    </strong>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: cat?.color || '#64748b',
                        }}
                      />
                      {cat?.name || 'Geral'} {sub ? `• ${sub.name}` : ''}
                    </span>
                  </p>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Repeat size={14} /> {frequencyLabels[stx.frequency] || stx.frequency}
                    </span>
                    <span>Vencimento: {formatDate(stx.due_date)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  {stx.is_active && (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: '#10b981' }}
                      onClick={() => handleExecute(stx)}
                      title="Efetivar e registrar como transação real"
                    >
                      <CheckCircle size={14} /> Efetivar Lançamento
                    </button>
                  )}
                  <button className="btn-secondary" style={{ padding: '8px' }} onClick={() => handleEdit(stx)}>
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-danger" style={{ padding: '8px' }} onClick={() => handleDelete(stx.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ScheduledModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingScheduled={editingScheduled}
      />
    </div>
  );
};
