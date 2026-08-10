import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import type { Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Plus, Tags, Edit2, Trash2 } from 'lucide-react';
import { CategoryModal } from '../Modals/CategoryModal';

export const CategoriesView: React.FC = () => {
  const { categories, deleteCategory } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleOpenNew = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Atenção: Ao excluir uma categoria, todas as suas subcategorias também serão removidas. Continuar?')) {
      await deleteCategory(id);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 className="section-title">
              <Tags size={22} color="var(--accent-primary)" /> Categorias e Subcategorias Editáveis
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Personalize suas categorias de Entradas e Saídas, vincule subcategorias e defina tetos de gastos.
            </p>
          </div>

          <button className="btn-primary" onClick={handleOpenNew}>
            <Plus size={16} /> Nova Categoria
          </button>
        </div>
      </div>

      {/* Expenses Categories Section */}
      <div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#f43f5e' }}>
          ● Categorias de Saídas (Gastos)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {expenseCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${cat.color}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.name}
                  </h5>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(cat)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Orçamento Limite:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {cat.max_budget ? formatCurrency(cat.max_budget) : 'Sem limite'}
                  </strong>
                </p>

                {/* Subcategories list */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Subcategorias ({cat.subcategories?.length || 0})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          style={{
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nenhuma subcategoria</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incomes Categories Section */}
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#10b981' }}>
          ● Categorias de Entradas (Receitas)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {incomeCategories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderTop: `4px solid ${cat.color}`,
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }} />
                    {cat.name}
                  </h5>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-secondary" style={{ padding: '6px' }} onClick={() => handleEdit(cat)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Subcategories list */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Subcategorias ({cat.subcategories?.length || 0})
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          style={{
                            fontSize: '0.8rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Nenhuma subcategoria</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCategory={editingCategory}
      />
    </div>
  );
};
