import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Transaction, TransactionType } from '../../types';
import { X } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  editingTransaction,
}) => {
  const { categories, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setCategoryId(editingTransaction.category_id || '');
      setSubcategoryId(editingTransaction.subcategory_id || '');
      setPaymentMethod(editingTransaction.payment_method || 'Pix');
      setIsPaid(editingTransaction.is_paid);
      setNotes(editingTransaction.notes || '');
    } else {
      setType(initialType);
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      const availableCategories = categories.filter((c) => c.type === initialType);
      setCategoryId(availableCategories[0]?.id || '');
      setSubcategoryId('');
      setPaymentMethod('Pix');
      setIsPaid(true);
      setNotes('');
    }
  }, [editingTransaction, initialType, isOpen, categories]);

  if (!isOpen) return null;

  // Filter categories by selected transaction type
  const availableCategories = categories.filter((c) => c.type === type);
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      alert('Por favor, informe uma descrição válida e valor maior que zero.');
      return;
    }

    const payload = {
      description,
      amount: Number(amount),
      type,
      date,
      category_id: categoryId || undefined,
      subcategory_id: subcategoryId || undefined,
      payment_method: paymentMethod,
      is_paid: isPaid,
      notes,
    };

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
    } else {
      await addTransaction(payload);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingTransaction ? 'Editar Movimentação' : 'Nova Movimentação'}</h3>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type Selector Tabs */}
            <div className="form-group">
              <label>Tipo de Lançamento</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn-secondary ${type === 'income' ? 'badge-income' : ''}`}
                  style={{ justifyContent: 'center', padding: '10px' }}
                  onClick={() => {
                    setType('income');
                    const incCat = categories.filter((c) => c.type === 'income');
                    setCategoryId(incCat[0]?.id || '');
                    setSubcategoryId('');
                  }}
                >
                  Entrada (Receita)
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${type === 'expense' ? 'badge-expense' : ''}`}
                  style={{ justifyContent: 'center', padding: '10px' }}
                  onClick={() => {
                    setType('expense');
                    const expCat = categories.filter((c) => c.type === 'expense');
                    setCategoryId(expCat[0]?.id || '');
                    setSubcategoryId('');
                  }}
                >
                  Saída (Gasto)
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Descrição</label>
              <input
                type="text"
                placeholder="Ex: Supermercado, Salário..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Amount & Date */}
            <div className="form-row">
              <div className="form-group">
                <label>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Category & Subcategory */}
            <div className="form-row">
              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                  }}
                >
                  <option value="">Selecione uma Categoria</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subcategoria</label>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!availableSubcategories.length}
                >
                  <option value="">Nenhuma / Geral</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="form-row">
              <div className="form-group">
                <label>Forma de Pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Pix">Pix</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência / TED</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={isPaid ? 'true' : 'false'}
                  onChange={(e) => setIsPaid(e.target.value === 'true')}
                >
                  <option value="true">{type === 'income' ? 'Recebido' : 'Pago'}</option>
                  <option value="false">{type === 'income' ? 'Pendente' : 'Não Pago'}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Observações (opcional)</label>
              <textarea
                rows={2}
                placeholder="Detalhes adicionais..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
