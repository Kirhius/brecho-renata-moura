-- Brecho Renata Moura - estrutura do banco (Supabase)
-- Cole este arquivo inteiro em: Supabase > SQL Editor > New query > Run

create extension if not exists "pgcrypto";

-- Pecas do catalogo (cada peca e unica)
create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  marca text default '',
  categoria text default '',
  tamanho text default '',
  cor text default '',
  descricao text default '',
  preco numeric(10,2) not null default 0,
  custo numeric(10,2) not null default 0,
  fotos text[] not null default '{}',
  status text not null default 'disponivel' check (status in ('disponivel','reservado','vendido')),
  created_at timestamptz not null default now()
);

-- Pedidos / reservas feitos pelas clientes
create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  cliente_nome text not null,
  itens jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null default 0,
  status text not null default 'aberto' check (status in ('aberto','concluido','cancelado')),
  created_at timestamptz not null default now()
);

-- Controle financeiro (vendas entram automaticamente; despesas e outros lancamentos manuais)
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita','despesa')),
  descricao text not null,
  valor numeric(10,2) not null default 0,
  data date not null default current_date,
  pedido_id uuid references public.pedidos(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Configuracoes da loja (uma unica linha)
create table if not exists public.config (
  id text primary key default 'main',
  nome_loja text default 'Renata Moura',
  whatsapp text default '',
  instagram text default '',
  destaque text default 'Peças de grife selecionadas com carinho',
  created_at timestamptz not null default now()
);
insert into public.config (id) values ('main') on conflict (id) do nothing;

create index if not exists produtos_status_idx on public.produtos (status);
create index if not exists pedidos_status_idx on public.pedidos (status);
create index if not exists lancamentos_data_idx on public.lancamentos (data);

-- Seguranca: o site acessa o banco somente pelo servidor (service role).
-- Com RLS ligado e sem politicas, ninguem consegue ler/gravar direto pela chave publica.
alter table public.produtos enable row level security;
alter table public.pedidos enable row level security;
alter table public.lancamentos enable row level security;
alter table public.config enable row level security;

-- Bucket publico para as fotos das pecas
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;
