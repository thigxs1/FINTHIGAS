-- ==========================================================
-- FINTHIGAS - SCHEMA SQL SUPABASE (VERSÃO MULTIUSUÁRIO)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================
-- ⚠️ ATENÇÃO: Se você já executou o schema anterior (single-tenant),
-- rode apenas as seções "MIGRATION" marcadas. Se for instalação nova,
-- execute o script completo.
-- ==========================================================

-- =========================================================
-- PASSO 1: ADICIONAR user_id NAS TABELAS EXISTENTES (MIGRATION)
-- Se as tabelas JÁ EXISTEM no seu banco, execute somente este bloco:
-- =========================================================

ALTER TABLE public.categories        ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.subcategories     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.scheduled_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.transactions      ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.transactions      ADD COLUMN IF NOT EXISTS receipt_name TEXT;

-- =========================================================
-- PASSO 2: CRIAR TABELAS (instalação nova ou se não existirem)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT NOT NULL DEFAULT 'Tag',
    max_budget NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    payment_method TEXT DEFAULT 'Pix',
    is_paid BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    receipt_url TEXT,
    receipt_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scheduled_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly', 'once')),
    due_date DATE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================
-- PASSO 3: ATIVAR ROW LEVEL SECURITY (RLS)
-- =========================================================

ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (single-tenant abertas)
DROP POLICY IF EXISTS "Anon full access categories"             ON public.categories;
DROP POLICY IF EXISTS "Anon full access subcategories"          ON public.subcategories;
DROP POLICY IF EXISTS "Anon full access transactions"           ON public.transactions;
DROP POLICY IF EXISTS "Anon full access scheduled_transactions" ON public.scheduled_transactions;

-- =========================================================
-- PASSO 4: POLÍTICAS RLS POR USUÁRIO AUTENTICADO
-- Cada usuário só enxerga e manipula seus próprios dados
-- =========================================================

-- CATEGORIES
CREATE POLICY "Users manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SUBCATEGORIES
CREATE POLICY "Users manage own subcategories"
  ON public.subcategories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SCHEDULED TRANSACTIONS
CREATE POLICY "Users manage own scheduled_transactions"
  ON public.scheduled_transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- PASSO 5: TRIGGER — SEED DE CATEGORIAS PADRÃO NO CADASTRO
-- Quando um novo usuário se cadastra, este trigger cria
-- automaticamente todas as categorias e subcategorias padrão
-- vinculadas ao user_id do novo usuário.
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID := NEW.id;
    cat_moradia UUID;
    cat_alimentacao UUID;
    cat_transporte UUID;
    cat_lazer UUID;
    cat_saude UUID;
    cat_salario UUID;
    cat_investimentos UUID;
BEGIN
    -- Saídas
    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Moradia', 'expense', '#ef4444', 'Home', 2500.00)
      RETURNING id INTO cat_moradia;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_moradia, 'Aluguel'),
        (new_user_id, cat_moradia, 'Energia'),
        (new_user_id, cat_moradia, 'Internet'),
        (new_user_id, cat_moradia, 'Condomínio');

    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Alimentação', 'expense', '#f59e0b', 'Utensils', 1800.00)
      RETURNING id INTO cat_alimentacao;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_alimentacao, 'Supermercado'),
        (new_user_id, cat_alimentacao, 'Restaurantes'),
        (new_user_id, cat_alimentacao, 'iFood / Delivery');

    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Transporte', 'expense', '#3b82f6', 'Car', 800.00)
      RETURNING id INTO cat_transporte;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_transporte, 'Combustível'),
        (new_user_id, cat_transporte, 'Uber / Táxi'),
        (new_user_id, cat_transporte, 'Manutenção');

    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Lazer & Estilo', 'expense', '#ec4899', 'Film', 600.00)
      RETURNING id INTO cat_lazer;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_lazer, 'Cinema'),
        (new_user_id, cat_lazer, 'Viagens'),
        (new_user_id, cat_lazer, 'Assinaturas / Streaming');

    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Saúde & Bem-Estar', 'expense', '#10b981', 'HeartPulse', 500.00)
      RETURNING id INTO cat_saude;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_saude, 'Farmácia'),
        (new_user_id, cat_saude, 'Consultas'),
        (new_user_id, cat_saude, 'Academia');

    -- Entradas
    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Salário & Prolabore', 'income', '#10b981', 'Briefcase', 0)
      RETURNING id INTO cat_salario;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_salario, 'Salário Principal'),
        (new_user_id, cat_salario, 'Bônus / PLR');

    INSERT INTO public.categories (user_id, name, type, color, icon, max_budget)
      VALUES (new_user_id, 'Investimentos & Rendimentos', 'income', '#8b5cf6', 'TrendingUp', 0)
      RETURNING id INTO cat_investimentos;
    INSERT INTO public.subcategories (user_id, category_id, name)
      VALUES
        (new_user_id, cat_investimentos, 'Dividendos'),
        (new_user_id, cat_investimentos, 'Rendimento FIIs'),
        (new_user_id, cat_investimentos, 'Venda de Ativos');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger vinculado ao cadastro de novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_categories();
