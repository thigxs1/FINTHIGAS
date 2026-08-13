import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ScheduledTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, CalendarClock, CheckCircle, Edit2, Trash2, Repeat, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { ScheduledModal } from '../Modals/ScheduledModal';

// Returns status info based on due_date
function getScheduledStatus(dueDateStr: string): { label: string; color: string; icon: React.ReactNode } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr + 'T00:00:00');

  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Vencido há ${Math.abs(diffDays)}d`, color: '#f43f5e', icon: <AlertCircle size={12} /> };
  } else if (diffDays === 0) {
    return { label: 'Vence hoje', color: '#f59e0b', icon: <Clock size={12} /> };
  } else if (diffDays <= 7) {
    return { label: `Vence em ${diffDays}d`, color: '#f59e0b', icon: <Clock size={12} /> };
  } else {
    return { label: `Vence em ${diffDays}d`, color: '#64748b', icon: <CheckCircle2 size={12} /> };
  }
}

export const ScheduledView: React.FC = () => {
  const { scheduledTransactions, categories, executeScheduledTransaction, deleteScheduledTransaction } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledTransaction | null>(null);

  // Only show active scheduled items
  const activeScheduled = scheduledTransactions.filter((s) => s.is_active);

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
    const actionLabel = stx.frequency === 'once'
      ? 'O agendamento será removido após a efetivação.'
      : `Próximo vencimento será avançado automaticamente.`;
    if (confirm(`Confirmar efetivação de "${stx.description}" no valor de ${formatCurrency(stx.amount)}?\n\n${actionLabel}`)) {
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
              <CalendarClock size={22} color="var(--accent-warning)" /> Programação de Contas &amp; Receitas Futuras
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Gerencie despesas recorrentes (aluguel, contas, assinaturas) e receitas esperadas. Efetive com 1 clique.
            </p>
          </div>

          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Nova Programação
          </button>
        </div>

        {/* Summary counters */}
        {activeScheduled.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{activeScheduled.length}</span> ativo(s)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#f43f5e' }}>
              {activeScheduled.filter(s => new Date(s.due_date + 'T00:00:00') < new Date(new Date().setHours(0,0,0,0))).length} vencido(s)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
              Total a vencer: {formatCurrency(activeScheduled.filter(s => s.type === 'expense').reduce((acc, s) => acc + Number(s.amount), 0))}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Scheduled Items */}
      <div className="scheduled-grid">
        {activeScheduled.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px' }}>
            <CalendarClock size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Nenhum agendamento ativo.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
              Crie uma programação para contas recorrentes como aluguel, luz e internet.
            </p>
          </div>
        ) : (
          activeScheduled.map((stx) => {
            const cat = categories.find((c) => c.id === stx.category_id);
            const sub = cat?.subcategories?.find((s) => s.id === stx.subcategory_id);
            const status = getScheduledStatus(stx.due_date);

            return (
              <div
                key={stx.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${stx.type === 'income' ? '#10b981' : '#f43f5e'}`,
                }}
              >
                <div>
                  {/* Header row: badge + amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span className={`badge ${stx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {stx.type === 'income' ? 'Entrada Programada' : 'Saída Programada'}
                      </span>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '8px', lineHeight: 1.3 }}>{stx.description}</h4>
                    </div>
                    <strong style={{ fontSize: '1.15rem', color: stx.type === 'income' ? '#10b981' : '#f43f5e', flexShrink: 0, marginLeft: '8px' }}>
                      {formatCurrency(Number(stx.amount))}
                    </strong>
                  </div>

                  {/* Category */}
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: cat?.color || '#64748b',
                          flexShrink: 0,
                        }}
                      />
                      {cat?.name || 'Geral'} {sub ? `• ${sub.name}` : ''}
                    </span>
                  </p>

                  {/* Frequency + Status row */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem', marginBottom: '16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                      <Repeat size={13} /> {frequencyLabels[stx.frequency] || stx.frequency}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: status.color,
                        fontWeight: 600,
                      }}
                    >
                      {status.icon} {formatDate(stx.due_date)} · {status.label}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: '#10b981' }}
                    onClick={() => handleExecute(stx)}
                    title={stx.frequency === 'once' ? 'Efetivar e remover da lista' : 'Efetivar e avançar data'}
                  >
                    <CheckCircle size={14} /> Efetivar
                  </button>
                  <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => handleEdit(stx)} title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-danger" style={{ padding: '8px 12px' }} onClick={() => handleDelete(stx.id)} title="Excluir">
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
