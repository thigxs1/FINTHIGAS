import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, FileText,
  ArrowUpDown, Download, ChevronLeft, ChevronRight, Mic, ChevronDown as ChevronDownIcon,
  X,
} from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
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
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="card tx-toolbar-card">
        {/* Mobile-only primary actions: 2-column grid on top */}
        <div className="tx-create-group-mobile hide-desktop">
          <button
            className="tx-btn-income"
            onClick={() => handleOpenNew('income')}
            title="Nova Entrada"
          >
            <Plus size={16} />
            <span>Nova Entrada</span>
          </button>
          <button
            className="tx-btn-expense"
            onClick={() => handleOpenNew('expense')}
            title="Nova Saída"
          >
            <Plus size={16} />
            <span>Nova Saída</span>
          </button>
        </div>

        {/* Row: Search + Quick Utilities (Voz, CSV, PDF) + Desktop Create Buttons */}
        <div className="tx-toolbar-top">
          {/* Search Bar */}
          <div className="tx-search-wrapper">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Buscar descrição, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Utility Tools */}
          <div className="tx-utility-group">
            <button
              className="tx-tool-btn"
              onClick={() => setIsVoiceModalOpen(true)}
              title="Lançar por Voz"
            >
              <Mic size={16} color="var(--accent-primary)" />
              <span className="hide-mobile">Voz</span>
            </button>

            <button
              className="tx-tool-btn"
              onClick={handleExportCSV}
              title="Exportar CSV"
            >
              <Download size={15} />
              <span className="hide-mobile">CSV</span>
            </button>

            <button
              className="tx-tool-btn"
              onClick={handleExportPDF}
              title="Exportar PDF"
            >
              <FileText size={15} />
              <span className="hide-mobile">PDF</span>
            </button>
          </div>

          {/* Desktop Primary Actions */}
          <div className="tx-create-group hide-mobile">
            <button
              className="tx-btn-income"
              onClick={() => handleOpenNew('income')}
              title="Nova Entrada"
            >
              <Plus size={16} />
              <span>Nova Entrada</span>
            </button>
            <button
              className="tx-btn-expense"
              onClick={() => handleOpenNew('expense')}
              title="Nova Saída"
            >
              <Plus size={16} />
              <span>Nova Saída</span>
            </button>
          </div>
        </div>

        {/* Row: Type filter tabs + Sort */}
        <div className="tx-toolbar-bottom">
          {/* Type filter segmented tabs */}
          <div className="tx-filter-tabs">
            <button
              className={`tx-tab-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button
              className={`tx-tab-btn income ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
              title="Entradas"
            >
              <ArrowUpCircle size={14} />
              <span>Entradas</span>
            </button>
            <button
              className={`tx-tab-btn expense ${filterType === 'expense' ? 'active' : ''}`}
              onClick={() => setFilterType('expense')}
              title="Saídas"
            >
              <ArrowDownCircle size={14} />
              <span>Saídas</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="tx-sort-wrapper">
            <ArrowUpDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="tx-sort-select"
            >
              <option value="date_desc">Mais Recente</option>
              <option value="date_asc">Mais Antigo</option>
              <option value="abc">A → Z</option>
              <option value="payment_date">Data Pagamento</option>
              <option value="created_at">Data Registro</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Desktop Table ─────────────────────────────────────── */}
      <div className="card custom-table-container desktop-only-table">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Categoria &amp; Subcategoria</th>
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
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat?.color || '#64748b', flexShrink: 0 }} />
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
                            style={{ padding: '6px', color: '#7c3aed', borderColor: 'rgba(124,58,237,0.4)' }}
                            onClick={() => setViewingReceiptTx(tx)}
                            title="Ver Comprovante"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                        <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(tx)} title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(tx.id)} title="Excluir">
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

      {/* ── Mobile Card List ──────────────────────────────────── */}
      <div className="tx-card-list">
        {paginatedTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Nenhum lançamento encontrado para os filtros selecionados.
          </div>
        ) : (
          paginatedTransactions.map((tx) => {
            const cat = categories.find((c) => c.id === tx.category_id);
            const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);
            const isExpanded = expandedId === tx.id;
            const isIncome = tx.type === 'income';

            return (
              <div key={tx.id} className={`tx-card${isExpanded ? ' expanded' : ''}`}>
                {/* Summary row — always visible, click to expand */}
                <button className="tx-card-summary" onClick={() => toggleExpand(tx.id)}>
                  {/* Left: type icon + description + category */}
                  <div className="tx-card-main">
                    <div className="tx-card-icon" style={{ color: isIncome ? '#10b981' : '#f43f5e' }}>
                      {isIncome ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <div className="tx-card-info">
                      <span className="tx-card-description">{tx.description}</span>
                      <span className="tx-card-meta">
                        <span
                          style={{
                            display: 'inline-block',
                            width: '7px', height: '7px',
                            borderRadius: '50%',
                            backgroundColor: cat?.color || '#64748b',
                            marginRight: '4px',
                          }}
                        />
                        {cat?.name || 'Sem Categoria'}
                        <span style={{ margin: '0 4px', opacity: 0.4 }}>·</span>
                        {formatDate(tx.date)}
                      </span>
                    </div>
                  </div>

                  {/* Right: value + chevron */}
                  <div className="tx-card-right">
                    <span className="tx-card-amount" style={{ color: isIncome ? '#10b981' : '#f43f5e' }}>
                      {isIncome ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                    </span>
                    <ChevronDownIcon
                      size={16}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                </button>

                {/* Detail panel — visible when expanded */}
                {isExpanded && (
                  <div className="tx-card-detail">
                    <div className="tx-card-detail-grid">
                      {sub && (
                        <div className="tx-card-detail-row">
                          <span className="tx-detail-label">Subcategoria</span>
                          <span className="tx-detail-value">{sub.name}</span>
                        </div>
                      )}
                      <div className="tx-card-detail-row">
                        <span className="tx-detail-label">Pagamento</span>
                        <span className="tx-detail-value">{tx.payment_method || 'Pix'}</span>
                      </div>
                      <div className="tx-card-detail-row">
                        <span className="tx-detail-label">Status</span>
                        <span className="tx-detail-value">
                          <span className={`badge ${tx.is_paid ? 'badge-income' : 'badge-warning'}`}>
                            {tx.is_paid ? 'Pago' : 'Pendente'}
                          </span>
                        </span>
                      </div>
                      {tx.notes && (
                        <div className="tx-card-detail-row">
                          <span className="tx-detail-label">Observações</span>
                          <span className="tx-detail-value">{tx.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="tx-card-actions">
                      {tx.receipt_url && (
                        <button
                          className="btn-secondary"
                          style={{ flex: 1, justifyContent: 'center', color: '#7c3aed', borderColor: 'rgba(124,58,237,0.3)' }}
                          onClick={() => setViewingReceiptTx(tx)}
                        >
                          <FileText size={15} /> Comprovante
                        </button>
                      )}
                      <button
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => handleEdit(tx)}
                      >
                        <Edit2 size={15} /> Editar
                      </button>
                      <button
                        className="btn-danger"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 size={15} /> Excluir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
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
