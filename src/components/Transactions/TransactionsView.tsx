import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { TransactionModal } from '../Modals/TransactionModal';

export const TransactionsView: React.FC = () => {
  const { filteredTransactions, categories, deleteTransaction } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');

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
  const displayedTransactions = filteredTransactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const cat = categories.find((c) => c.id === tx.category_id);
    const sub = cat?.subcategories?.find((s) => s.id === tx.subcategory_id);

    const text = `${tx.description} ${cat?.name || ''} ${sub?.name || ''} ${tx.payment_method || ''}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
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

          {/* New Transaction Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" style={{ background: '#10b981' }} onClick={() => handleOpenNew('income')}>
              <Plus size={16} /> Nova Entrada
            </button>
            <button className="btn-primary" style={{ background: '#f43f5e' }} onClick={() => handleOpenNew('expense')}>
              <Plus size={16} /> Nova Saída
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
            {displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhum lançamento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              displayedTransactions.map((tx) => {
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

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalInitialType}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};
