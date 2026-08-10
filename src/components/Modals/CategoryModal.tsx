import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Category, TransactionType } from '../../types';
import { X, Plus, Trash2 } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
}) => {
  const { addCategory, updateCategory, addSubcategory, deleteSubcategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('#ef4444');
  const [maxBudget, setMaxBudget] = useState('0');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setColor(editingCategory.color);
      setMaxBudget((editingCategory.max_budget || 0).toString());
    } else {
      setName('');
      setType('expense');
      setColor('#ef4444');
      setMaxBudget('0');
    }
    setNewSubcategoryName('');
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      type,
      color,
      icon: 'Tag',
      max_budget: Number(maxBudget) || 0,
    };

    if (editingCategory) {
      await updateCategory(editingCategory.id, payload);
    } else {
      await addCategory(payload);
    }

    onClose();
  };

  const handleAddSub = async () => {
    if (!newSubcategoryName.trim() || !editingCategory) return;
    await addSubcategory(editingCategory.id, newSubcategoryName.trim());
    setNewSubcategoryName('');
  };

  const handleDeleteSub = async (subId: string) => {
    if (confirm('Deseja excluir esta subcategoria?')) {
      await deleteSubcategory(subId);
    }
  };

  const predefinedColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</h3>
          <button className="btn-secondary" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Type */}
            <div className="form-group">
              <label>Tipo da Categoria</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn-secondary ${type === 'expense' ? 'badge-expense' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => setType('expense')}
                >
                  Saída (Gasto)
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${type === 'income' ? 'badge-income' : ''}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => setType('income')}
                >
                  Entrada (Receita)
                </button>
              </div>
            </div>

            {/* Category Name */}
            <div className="form-group">
              <label>Nome da Categoria</label>
              <input
                type="text"
                placeholder="Ex: Moradia, Alimentação..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Color Selector */}
            <div className="form-group">
              <label>Cor de Identificação</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {predefinedColors.map((c) => (
                  <div
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '2px solid white' : 'none',
                      boxShadow: color === c ? '0 0 10px ' + c : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Max Budget Limit (Only for Expense type) */}
            {type === 'expense' && (
              <div className="form-group">
                <label>Teto de Gastos / Orçamento Mensal (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
                <small style={{ color: 'var(--text-muted)' }}>
                  Defina um limite mensal para receber alertas visuais no Dashboard.
                </small>
              </div>
            )}

            {/* Editable Subcategories Section (if editing existing category) */}
            {editingCategory && (
              <div className="form-group" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <label>Subcategorias Vinculadas</label>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Nome da nova subcategoria..."
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                  />
                  <button type="button" className="btn-secondary" onClick={handleAddSub}>
                    <Plus size={16} /> Adicionar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {editingCategory.subcategories && editingCategory.subcategories.length > 0 ? (
                    editingCategory.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '6px',
                        }}
                      >
                        <span style={{ fontSize: '0.9rem' }}>{sub.name}</span>
                        <button
                          type="button"
                          style={{ background: 'none', color: '#f43f5e' }}
                          onClick={() => handleDeleteSub(sub.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <small style={{ color: 'var(--text-muted)' }}>Nenhuma subcategoria cadastrada.</small>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
