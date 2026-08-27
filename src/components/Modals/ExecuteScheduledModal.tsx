import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ScheduledTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { X, CheckCircle, Upload, AlertTriangle, Calculator, DollarSign } from 'lucide-react';

interface ExecuteScheduledModalProps {
  scheduled: ScheduledTransaction | null;
  onClose: () => void;
}

export const ExecuteScheduledModal: React.FC<ExecuteScheduledModalProps> = ({ scheduled, onClose }) => {
  const { executeScheduledTransaction } = useFinance();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [penalty, setPenalty] = useState('');
  const [interest, setInterest] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (scheduled) {
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Pix');
      setPenalty('');
      setInterest('');
      setNotes(`Baixa de agendamento (${scheduled.frequency})`);
      setReceiptUrl(undefined);
      setReceiptName(undefined);
    }
  }, [scheduled]);

  if (!scheduled) return null;

  // Calculate delay in days
  const dueDate = new Date(scheduled.due_date + 'T00:00:00');
  const paymentDate = new Date(date + 'T00:00:00');
  const diffDays = Math.round((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const isDelayed = diffDays > 0;

  // Calculate totals
  const originalAmount = Number(scheduled.amount) || 0;
  const penaltyAmount = Number(penalty) > 0 ? Number(penalty) : 0;
  const interestAmount = Number(interest) > 0 ? Number(interest) : 0;
  const totalAmount = originalAmount + penaltyAmount + interestAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo é maior que 5MB. Por favor, escolha um arquivo menor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptUrl(event.target?.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(undefined);
    setReceiptName(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalNotes = notes.trim();
    if (penaltyAmount > 0 || interestAmount > 0) {
      const extraParts: string[] = [];
      if (penaltyAmount > 0) extraParts.push(`Multa: ${formatCurrency(penaltyAmount)}`);
      if (interestAmount > 0) extraParts.push(`Juros: ${formatCurrency(interestAmount)}`);
      const extraStr = `[Original: ${formatCurrency(originalAmount)}, ${extraParts.join(', ')}]`;
      if (!finalNotes.includes('Multa:') && !finalNotes.includes('Juros:')) {
        finalNotes = finalNotes ? `${finalNotes} ${extraStr}` : extraStr;
      }
    }

    await executeScheduledTransaction(scheduled, {
      amount: totalAmount,
      date,
      payment_method: paymentMethod,
      notes: finalNotes,
      receipt_url: receiptUrl,
      receipt_name: receiptName,
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={20} color="#10b981" />
            <h3 style={{ margin: 0 }}>Efetivar / Baixa de Lançamento</h3>
          </div>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Description & Base Value Info Box */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', display: 'block' }}>{scheduled.description}</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {scheduled.frequency === 'once'
                    ? 'Agendamento único (será removido após a baixa)'
                    : `Recorrência ${scheduled.frequency} (avançará para o próximo vencimento)`}
                </span>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Vencimento original: <strong>{formatDate(scheduled.due_date)}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Valor Original</span>
                <strong style={{ fontSize: '1.15rem', color: scheduled.type === 'income' ? '#10b981' : '#f43f5e' }}>
                  {formatCurrency(originalAmount)}
                </strong>
              </div>
            </div>

            {/* Overdue Alert Banner if delayed */}
            {isDelayed && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.82rem',
                  color: '#fcd34d',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  Pagamento com <strong>{diffDays} dia(s)</strong> de atraso em relação ao vencimento original ({formatDate(scheduled.due_date)}). Você pode informar multa e juros abaixo.
                </span>
              </div>
            )}

            {/* Date & Payment Method */}
            <div className="form-row">
              <div className="form-group">
                <label>Data da Efetivação/Baixa</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência / TED</option>
                </select>
              </div>
            </div>

            {/* Fines and Interests by Delay */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <DollarSign size={15} color="var(--accent-warning)" />
                <span>Multa &amp; Juros por Atraso (Opcional)</span>
              </div>

              <div className="form-row" style={{ margin: 0 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Multa por Atraso (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={penalty}
                    onChange={(e) => setPenalty(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.8rem' }}>Juros / Encargos (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                  />
                </div>
              </div>

              {/* Total Calculation breakdown */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
                  paddingTop: '8px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                  <Calculator size={14} />
                  <span>Valor Total da Baixa:</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {(penaltyAmount > 0 || interestAmount > 0) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '6px' }}>
                      ({formatCurrency(originalAmount)} + {formatCurrency(penaltyAmount + interestAmount)}) =
                    </span>
                  )}
                  <strong
                    style={{
                      fontSize: '1.05rem',
                      color: scheduled.type === 'income' ? '#10b981' : '#f43f5e',
                    }}
                  >
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Receipt Upload */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} color="var(--accent-primary)" /> Anexar Comprovante (opcional)
              </label>
              <small>Envie comprovante Pix, recibo ou nota fiscal (JPG, PNG, PDF)</small>

              {receiptUrl ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(124, 58, 237, 0.1)',
                    border: '1px solid rgba(124, 58, 237, 0.3)',
                    borderRadius: '8px',
                    marginTop: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '1.1rem' }}>📄</span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {receiptName || 'Comprovante_Anexado'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-danger"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    onClick={handleRemoveReceipt}
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleFileChange}
                  style={{ marginTop: '4px' }}
                />
              )}
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Observações</label>
              <textarea
                rows={2}
                placeholder="Observações adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#10b981' }}>
              <CheckCircle size={16} /> Confirmar Baixa ({formatCurrency(totalAmount)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

