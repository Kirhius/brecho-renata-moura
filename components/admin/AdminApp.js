'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../Logo';
import AdminLogin, { CHAVE_SENHA } from '../AdminLogin';
import { useToast } from '../ui';
import {
  IconProdutos,
  IconPedidos,
  IconRelogio,
  IconDinheiro,
  IconEngrenagem,
  IconSair,
  IconOlho,
} from '../Icons';
import { chamar, MODO_DEMO } from '@/lib/client';
import ProdutosTab from './ProdutosTab';
import { PedidosTab, ReservasTab } from './PedidosTab';
import FinanceiroTab from './FinanceiroTab';
import AjustesTab from './AjustesTab';

const ABAS = [
  { id: 'produtos', nome: 'Peças', Icone: IconProdutos },
  { id: 'pedidos', nome: 'Pedidos', Icone: IconPedidos },
  { id: 'reservas', nome: 'Reservas', Icone: IconRelogio },
  { id: 'financeiro', nome: 'Financeiro', Icone: IconDinheiro },
  { id: 'ajustes', nome: 'Ajustes', Icone: IconEngrenagem },
];

export default function AdminApp() {
  const router = useRouter();
  const { mostrar, node: toastNode } = useToast();
  const [senha, setSenha] = useState(null); // null = ainda verificando, '' = sem login
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('produtos');

  useEffect(() => {
    let s = '';
    try {
      s = sessionStorage.getItem(CHAVE_SENHA) || '';
    } catch {
      /* ok */
    }
    setSenha(s);
  }, []);

  const sair = useCallback(() => {
    try {
      sessionStorage.removeItem(CHAVE_SENHA);
    } catch {
      /* ok */
    }
    setDados(null);
    setSenha('');
  }, []);

  const recarregar = useCallback(async () => {
    if (!senha) return;
    try {
      const r = await chamar('admin.carregar', {}, senha);
      setDados(r);
      setErro('');
    } catch (e) {
      if (e.message === 'Senha incorreta.') sair();
      else setErro(e.message);
    }
  }, [senha, sair]);

  useEffect(() => {
    if (senha) recarregar();
  }, [senha, recarregar]);

  // Executa uma acao de admin, avisa o resultado e atualiza os dados
  const exec = useCallback(
    async (acao, payload, mensagemOk) => {
      try {
        const r = await chamar(acao, payload, senha);
        if (mensagemOk) mostrar(mensagemOk);
        await recarregar();
        return r === undefined ? true : r;
      } catch (e) {
        if (e.message === 'Senha incorreta.') sair();
        else mostrar(e.message, 'erro');
        return null;
      }
    },
    [senha, recarregar, mostrar, sair]
  );

  if (senha === null) return null;
  if (!senha) return <AdminLogin onSucesso={setSenha} onVoltar={() => router.push('/')} />;

  const abertos = dados ? dados.pedidos.filter((p) => p.status === 'aberto').length : 0;
  const reservadas = dados ? dados.produtos.filter((p) => p.status === 'reservado').length : 0;
  const badge = { pedidos: abertos, reservas: reservadas };

  const ctx = { dados, senha, exec, mostrar, recarregar };

  return (
    <div className="admin">
      {MODO_DEMO ? (
        <div className="demo-faixa">Modo demonstração · os dados ficam salvos só neste aparelho</div>
      ) : null}
      <header className="topbar">
        <div className="marca" style={{ cursor: 'default' }}>
          <Logo className="logo" />
          <span className="marca-texto">
            <span className="marca-nome" style={{ fontSize: 18 }}>Área da loja</span>
            <span className="marca-sub">Renata Moura</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-icone" onClick={() => router.push('/')} aria-label="Ver catálogo" title="Ver catálogo">
            <IconOlho size={20} />
          </button>
          <button className="btn-icone" onClick={sair} aria-label="Sair" title="Sair">
            <IconSair size={20} />
          </button>
        </div>
      </header>

      <main className="admin-corpo">
        {erro ? (
          <div className="vazio">
            <div className="serif">Não foi possível carregar</div>
            <p>{erro}</p>
            <button className="btn" onClick={recarregar}>
              Tentar de novo
            </button>
          </div>
        ) : !dados ? (
          <div className="vazio">Carregando...</div>
        ) : aba === 'produtos' ? (
          <ProdutosTab {...ctx} />
        ) : aba === 'pedidos' ? (
          <PedidosTab {...ctx} />
        ) : aba === 'reservas' ? (
          <ReservasTab {...ctx} />
        ) : aba === 'financeiro' ? (
          <FinanceiroTab {...ctx} />
        ) : (
          <AjustesTab {...ctx} />
        )}
      </main>

      <nav className="tabs" aria-label="Seções">
        <div className="tabs-in">
          {ABAS.map(({ id, nome, Icone }) => (
            <button key={id} className={`tab ${aba === id ? 'ativo' : ''}`} onClick={() => setAba(id)}>
              <Icone size={22} />
              {nome}
              {badge[id] > 0 ? <span className="bolinha">{badge[id]}</span> : null}
            </button>
          ))}
        </div>
      </nav>

      {toastNode}
    </div>
  );
}
