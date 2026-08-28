import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, FileText, ArrowUpDown, Download, ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type SortOption = 'date_desc' | 'date_asc' | 'abc' | 'created_at' | 'payment_date';
import { TransactionModal } from '../Modals/TransactionModal';
import { ReceiptViewerModal } from '../Modals/ReceiptViewerModal';
import { VoiceTransactionModal } from '../Modals/VoiceTransactionModal';

export const TransactionsView: React.FC = () => {
  const { filteredTransactions, categories, deleteTransaction } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleOpenNew = (type: TransactionType) => {
    setEditingTransaction(null);
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      await deleteTransaction(id);
    }
  };

  // Filter list by search and type
  const filteredList = filteredTransactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const cat = categories.find((c) => c.id === tx.category_id);
    const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);
    const text = `${tx.description} ${cat?.name || ''} ${sub?.name || ''} ${tx.payment_method || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Sort
  const displayedTransactions = [...filteredList].sort((a, b) => {
    switch (sortOption) {
      case 'abc':
        return a.description.localeCompare(b.description, 'pt-BR', { sensitivity: 'base' });
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'payment_date':
        // date = data de pagamento informada
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'created_at':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'date_desc':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, sortOption]);

  const totalPages = Math.ceil(displayedTransactions.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = displayedTransactions.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  const handleExportCSV = () => {
    if (displayedTransactions.length === 0) return;
    const headers = ['Tipo', 'Descricao', 'Categoria', 'Subcategoria', 'Data', 'Pagamento', 'Valor', 'Status'];
    const csvRows = [headers.join(',')];
    displayedTransactions.forEach(tx => {
      const cat = categories.find((c) => c.id === tx.category_id);
      const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);
      const tipo = tx.type === 'income' ? 'Entrada' : 'Saida';
      const desc = `"${tx.description.replace(/"/g, '""')}"`;
      const categoria = `"${cat?.name || 'Sem Categoria'}"`;
      const subcategoria = `"${sub?.name || ''}"`;
      const data = formatDate(tx.date);
      const pagamento = `"${tx.payment_method || 'Pix'}"`;
      const valor = tx.amount;
      const status = tx.is_paid ? 'Pago' : 'Pendente';
      csvRows.push([tipo, desc, categoria, subcategoria, data, pagamento, valor, status].join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (displayedTransactions.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatorio de Transacoes - Finthigas', 14, 15);
    const tableData = displayedTransactions.map(tx => {
      const cat = categories.find((c) => c.id === tx.category_id);
      return [
        tx.type === 'income' ? 'Entrada' : 'Saída',
        tx.description,
        cat?.name || '-',
        formatDate(tx.date),
        tx.payment_method || '-',
        `${tx.type === 'income' ? '+' : '-'} ${formatCurrency(Number(tx.amount))}`
      ];
    });
    autoTable(doc, {
      startY: 20,
      head: [['Tipo', 'Descrição', 'Categoria', 'Data', 'Pag.', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save(`transacoes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar Actions & Filters */}
      <div className="glass-card" style={{ padding: '16px 24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por descrição, categoria ou forma de pagamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Type Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn-secondary ${filterType === 'all' ? 'active' : ''}`}
              style={{ background: filterType === 'all' ? 'rgba(255, 255, 255, 0.15)' : 'transparent' }}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button
              className={`btn-secondary ${filterType === 'income' ? 'badge-income' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Entradas
            </button>
            <button
              className={`btn-secondary ${filterType === 'expense' ? 'badge-expense' : ''}`}
              onClick={() => setFilterType('expense')}
            >
              Saídas
            </button>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                padding: '6px 10px',
                fontSize: '0.83rem',
                cursor: 'pointer',
              }}
            >
              <option value="date_desc">Mais Recente</option>
              <option value="date_asc">Mais Antigo</option>
              <option value="abc">A → Z (Descrição)</option>
              <option value="payment_date">Data de Pagamento</option>
              <option value="created_at">Data de Registro</option>
            </select>
          </div>

          {/* New Transaction Buttons & Export */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)',
              }}
              onClick={() => setIsVoiceModalOpen(true)}
              title="Lançamento Rápido por Voz"
            >
              <Mic size={16} /> <span>Lançar por Voz</span>
            </button>
            <button className="btn-secondary" style={{ padding: '8px 12px', gap: '6px' }} onClick={handleExportCSV} title="Exportar CSV">
              <Download size={16} /> <span className="hide-mobile">CSV</span>
            </button>
            <button className="btn-secondary" style={{ padding: '8px 12px', gap: '6px' }} onClick={handleExportPDF} title="Exportar PDF">
              <Download size={16} /> <span className="hide-mobile">PDF</span>
            </button>
            <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => handleOpenNew('income')}>
              <Plus size={16} /> <span className="hide-mobile">Nova Entrada</span>
            </button>
            <button className="btn-primary" style={{ background: '#f43f5e' }} onClick={() => handleOpenNew('expense')}>
              <Plus size={16} /> <span className="hide-mobile">Nova Saída</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Categoria & Subcategoria</th>
              <th>Data</th>
              <th>Pagamento</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum lançamento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.category_id);
                const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);

                return (
                  <tr key={tx.id}>
                    <td>
                      {tx.type === 'income' ? (
                        <span className="badge badge-income" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowUpCircle size={14} /> Entrada
                        </span>
                      ) : (
                        <span className="badge badge-expense" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ArrowDownCircle size={14} /> Saída
                        </span>
                      )}
                    </td>
                    <td>
                      <strong>{tx.description}</strong>
                      {tx.notes && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tx.notes}</p>}
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: cat?.color || '#64748b',
                          }}
                        />
                        {cat?.name || 'Sem Categoria'}
                      </span>
                      {sub && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}> • {sub.name}</span>}
                    </td>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.payment_method || 'Pix'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: tx.type === 'income' ? '#10b981' : '#f43f5e', fontSize: '1rem' }}>
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                      </strong>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        {tx.receipt_url && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '6px', color: '#7c3aed', borderColor: 'rgba(124, 58, 237, 0.4)' }}
                            onClick={() => setViewingReceiptTx(tx)}
                            title="Ver Comprovante de Pagamento"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(tx)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(tx.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
          <button
            className="btn-secondary"
            disabled={validCurrentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ padding: '8px' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Página {validCurrentPage} de {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={validCurrentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '8px' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        editingTransaction={editingTransaction}
      />

      <ReceiptViewerModal
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />

      <VoiceTransactionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />
    </div>
  );
};
