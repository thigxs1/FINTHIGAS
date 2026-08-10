import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { ScheduledTransaction, TransactionType, FrequencyType } from '../../types';
import { X } from 'lucide-react';

interface ScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingScheduled?: ScheduledTransaction | null;
}

export const ScheduledModal: React.FC<ScheduledModalProps> = ({
  isOpen,
  onClose,
  editingScheduled,
}) => {
  const { categories, addScheduledTransaction, updateScheduledTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');

  useEffect(() => {
    if (editingScheduled) {
      setType(editingScheduled.type);
      setDescription(editingScheduled.description);
      setAmount(editingScheduled.amount.toString());
      setFrequency(editingScheduled.frequency);
      setDueDate(editingScheduled.due_date);
      setCategoryId(editingScheduled.category_id || '');
      setSubcategoryId(editingScheduled.subcategory_id || '');
    } else {
      setType('expense');
      setDescription('');
      setAmount('');
      setFrequency('monthly');
      setDueDate(new Date().toISOString().split('T')[0]);
      const expCat = categories.filter((c) => c.type === 'expense');
      setCategoryId(expCat[0]?.id || '');
      setSubcategoryId('');
    }
  }, [editingScheduled, isOpen, categories]);

  if (!isOpen) return null;

  const availableCategories = categories.filter((c) => c.type === type);
  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      alert('Por favor, preencha a descrição e valor corretamente.');
      return;
    }

    const payload = {
      description,
      amount: Number(amount),
      type,
      frequency,
      due_date: dueDate,
      category_id: categoryId || undefined,
      subcategory_id: subcategoryId || undefined,
      is_active: true,
    };

    if (editingScheduled) {
      await updateScheduledTransaction(editingScheduled.id, payload);
    } else {
      await addScheduledTransaction(payload);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingScheduled ? 'Editar Lançamento Programado' : 'Novo Lançamento Programado'}</h3>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type Selector */}
            <div className="form-group">
              <label>Tipo de Programação</label>
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
                  Entrada Programada
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
                  Saída Programada
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Descrição do Agendamento</label>
              <input
                type="text"
                placeholder="Ex: Aluguel, Assinatura Netflix, Salário..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Amount & Frequency */}
            <div className="form-row">
              <div className="form-group">
                <label>Valor Previsto (R$)</label>
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
                <label>Frequência / Recorrência</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                >
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                  <option value="once">Data Única Futura</option>
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label>Data de Vencimento / Próximo Cobrança</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
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
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingScheduled ? 'Salvar Programação' : 'Criar Programação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
