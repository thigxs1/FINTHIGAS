-- ==========================================================
-- FINTHIGAS - SCHEME SQL SUPABASE
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#3b82f6',
    icon TEXT NOT NULL DEFAULT 'Tag',
    max_budget NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE SUBCATEGORIAS
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE TRANSAÇÕES (ENTRADAS E SAÍDAS)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Garantir adição das colunas caso a tabela já exista
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_name TEXT;

-- 4. TABELA DE TRANSAÇÕES PROGRAMADAS (RECORRENTES)
CREATE TABLE IF NOT EXISTS public.scheduled_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- PERMISSÕES / RLS (Permitir acesso de leitura/escrita para a chave anon)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon full access categories" ON public.categories;
CREATE POLICY "Anon full access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access subcategories" ON public.subcategories;
CREATE POLICY "Anon full access subcategories" ON public.subcategories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access transactions" ON public.transactions;
CREATE POLICY "Anon full access transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access scheduled_transactions" ON public.scheduled_transactions;
CREATE POLICY "Anon full access scheduled_transactions" ON public.scheduled_transactions FOR ALL USING (true) WITH CHECK (true);

-- SEED INICIAL DE CATEGORIAS PADRÃO (SE ESTIVER VAZIA)
DO $$
DECLARE
    cat_moradia UUID;
    cat_alimentacao UUID;
    cat_transporte UUID;
    cat_lazer UUID;
    cat_saude UUID;
    cat_salario UUID;
    cat_investimentos UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.categories) THEN
        -- Saídas
        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Moradia', 'expense', '#ef4444', 'Home', 2500.00) RETURNING id INTO cat_moradia;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_moradia, 'Aluguel'), (cat_moradia, 'Energia'), (cat_moradia, 'Internet'), (cat_moradia, 'Condomínio');

        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Alimentação', 'expense', '#f59e0b', 'Utensils', 1800.00) RETURNING id INTO cat_alimentacao;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_alimentacao, 'Supermercado'), (cat_alimentacao, 'Restaurantes'), (cat_alimentacao, 'iFood / Delivery');

        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Transporte', 'expense', '#3b82f6', 'Car', 800.00) RETURNING id INTO cat_transporte;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_transporte, 'Combustível'), (cat_transporte, 'Uber / Táxi'), (cat_transporte, 'Manutenção');

        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Lazer & Estilo', 'expense', '#ec4899', 'Film', 600.00) RETURNING id INTO cat_lazer;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_lazer, 'Cinema'), (cat_lazer, 'Viagens'), (cat_lazer, 'Assinaturas / Streaming');

        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Saúde & Bem-Estar', 'expense', '#10b981', 'HeartPulse', 500.00) RETURNING id INTO cat_saude;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_saude, 'Farmácia'), (cat_saude, 'Consultas'), (cat_saude, 'Academia');

        -- Entradas
        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Salário & Prolabore', 'income', '#10b981', 'Briefcase', 0) RETURNING id INTO cat_salario;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_salario, 'Salário Principal'), (cat_salario, 'Bônus / PLR');

        INSERT INTO public.categories (name, type, color, icon, max_budget) VALUES ('Investimentos & Rendimentos', 'income', '#8b5cf6', 'TrendingUp', 0) RETURNING id INTO cat_investimentos;
        INSERT INTO public.subcategories (category_id, name) VALUES (cat_investimentos, 'Dividendos'), (cat_investimentos, 'Rendimento FIIs'), (cat_investimentos, 'Venda de Ativos');
    END IF;
END $$;
