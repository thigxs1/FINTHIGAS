import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({ transaction, onClose }) => {
  if (!transaction || !transaction.receipt_url) return null;

  const isPdf = transaction.receipt_url.startsWith('data:application/pdf') || transaction.receipt_name?.endsWith('.pdf');

  const handleDownload = () => {
    if (!transaction.receipt_url) return;
    const link = document.createElement('a');
    link.href = transaction.receipt_url;
    link.download = transaction.receipt_name || `comprovante-${transaction.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--accent-primary)" />
            <div>
              <h3 style={{ margin: 0 }}>Comprovante de Pagamento</h3>
              <small style={{ color: 'var(--text-muted)' }}>
                {transaction.description} • {formatCurrency(transaction.amount)} ({formatDate(transaction.date)})
              </small>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {isPdf ? (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px dashed var(--border-color)',
                textAlign: 'center',
              }}
            >
              <FileText size={56} color="#7c3aed" style={{ marginBottom: '12px' }} />
              <span style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                {transaction.receipt_name || 'Comprovante_Pagamento.pdf'}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Documento em formato PDF
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Baixar PDF
                </button>
                <a
                  href={transaction.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  <ExternalLink size={16} /> Abrir em Nova Aba
                </a>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: '#000',
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <img
                  src={transaction.receipt_url}
                  alt={transaction.receipt_name || 'Comprovante de pagamento'}
                  style={{ maxWidth: '100%', maxHeight: '55vh', objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {transaction.receipt_name || 'comprovante.jpg'}
                </span>
                <button className="btn-primary" onClick={handleDownload}>
                  <Download size={16} /> Baixar Comprovante
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
