# Renata Moura | Brechó de Grife

Catálogo de roupas femininas (PWA) feito com Next.js + Supabase, pronto para a Vercel.
Pensado para celular: a cliente reserva as peças, monta a sacola e finaliza o pedido direto no WhatsApp da dona.

## O que tem

**Para as clientes**
- Catálogo com foto, marca, tamanho, cor e preço (cada peça é única).
- Busca, filtro por tipo e tamanho, ordenação por preço.
- Botão **Reservar** em cada peça, sacola com várias peças e botão **Finalizar pedido** com o ícone do WhatsApp.
- O pedido abre o WhatsApp da dona com a lista das peças, valores e o link da foto de cada uma.
- Depois do pedido, aparece o botão **Enviar fotos**, que abre o compartilhamento do celular com as fotos anexadas (a cliente escolhe o WhatsApp da Renata).
- Instalável na tela inicial do celular (PWA).

**Área da loja (rodapé do site → "Área da loja", senha padrão `1602`)**
- **Peças**: cadastrar, editar e excluir com várias fotos (tiradas na hora ou da galeria), preço, quanto pagou, tamanho, cor, descrição e situação.
- **Pedidos**: ver pedidos, marcar como vendido (entra no financeiro) ou cancelar (peças voltam ao catálogo).
- **Reservas**: peças reservadas, por quem e há quanto tempo; liberar peça.
- **Financeiro**: vendas, despesas, resultado, lucro nas peças, estoque e valor reservado, por mês; lançamentos manuais.
- **Ajustes**: WhatsApp que recebe os pedidos, Instagram, nome e frase de destaque.

## Modo demonstração

Sem as variáveis do Supabase, o site roda em **modo demonstração**: usa peças de exemplo e salva tudo só no navegador.
Serve para conhecer e testar. Para uso real, ligue o Supabase (abaixo).

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000

## Colocar no ar (Supabase + Vercel)

### 1. Supabase
1. Crie um projeto em https://supabase.com
2. Abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   Isso cria as tabelas e o bucket público `produtos` (fotos).
3. Em **Project Settings → API**, copie:
   - **Project URL**
   - **service_role key** (secreta: nunca coloque em código público)

### 2. Vercel
1. Suba o projeto para um repositório (sem o arquivo `.env.local`) e importe na Vercel.
2. Em **Settings → Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `ADMIN_PASSWORD` | senha da área da loja (se não definir, vale `1602`) |

3. Faça o deploy. Entre em **Área da loja → Ajustes** e preencha o **WhatsApp** da Renata (com DDD).

## Segurança

- O banco usa RLS sem políticas públicas: o site só acessa os dados pelo servidor (rotas `/api`), nunca direto do navegador.
- A coluna "quanto paguei" (custo) nunca é enviada ao catálogo público.
- Troque a senha `1602` pela variável `ADMIN_PASSWORD` antes de divulgar o site.

## Estrutura

```
app/                páginas (/ catálogo, /admin) e rotas /api
components/         Vitrine (clientes) e admin/ (área da loja)
lib/handlers.js     regras de negócio (reservar, vender, cancelar, financeiro)
lib/adapter-*.js    Supabase (produção) e localStorage (demonstração)
supabase/schema.sql tabelas e bucket de fotos
public/             ícones PWA, logo RM e service worker
```

## Observações

- O WhatsApp não permite anexar imagens por link `wa.me`. Por isso a mensagem leva o **link de cada foto** e, depois, o botão **Enviar fotos** usa o compartilhamento do celular para anexar as imagens.
- As fotos são reduzidas no próprio aparelho antes do envio para o site carregar rápido.
