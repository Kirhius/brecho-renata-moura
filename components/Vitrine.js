'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import AdminLogin from './AdminLogin';
import { Sheet, Campo, Ornamento, useToast } from './ui';
import {
  IconSacola,
  IconBusca,
  IconCheck,
  IconCabide,
  IconLixeira,
  IconWhatsapp,
  IconInstagram,
  IconCadeado,
} from './Icons';
import { chamar, MODO_DEMO } from '@/lib/client';
import { CATEGORIAS } from '@/lib/constants';
import { brl } from '@/lib/format';
import { ehVideo, soImagens, soVideos, capaDe } from '@/lib/midia';
import { montarMensagem, linkWhatsapp, compartilharFotos } from '@/lib/whatsapp';

const CHAVE_SACOLA = 'rm_sacola';
const CHAVE_NOME = 'rm_cliente_nome';
const CHAVE_ULTIMO = 'rm_ultimo_pedido';

const normalizar = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function lerLS(chave, padrao) {
  try {
    const v = localStorage.getItem(chave);
    return v ? JSON.parse(v) : padrao;
  } catch {
    return padrao;
  }
}
function gravarLS(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem espaco ou modo privado */
  }
}

function Foto({ src, alt }) {
  if (!src) {
    return (
      <div className="sem-foto">
        <IconCabide size={44} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" decoding="async" />;
}

function CartaoProduto({ p, naSacola, onAbrir, onAlternar }) {
  const indisponivel = p.status !== 'disponivel';
  return (
    <article className={`produto ${indisponivel ? 'indisponivel' : ''}`}>
      <button className="produto-foto" onClick={() => onAbrir(p.id)} aria-label={`Ver ${p.nome}`}>
        <Foto src={capaDe(p.fotos)} alt={p.nome} />
        {indisponivel ? <span className="selo">Reservada</span> : null}
        {(() => {
          const partes = [];
          const n = soImagens(p.fotos).length;
          if (n > 1) partes.push(`${n} fotos`);
          if (soVideos(p.fotos).length > 0) partes.push('▶ vídeo');
          return partes.length ? <span className="selo fotos">{partes.join(' · ')}</span> : null;
        })()}
      </button>
      <div className="produto-info">
        {p.marca ? <div className="produto-marca">{p.marca}</div> : null}
        <button className="produto-nome" onClick={() => onAbrir(p.id)}>
          {p.nome}
        </button>
        <div className="produto-det">
          {[p.tamanho && `Tam. ${p.tamanho}`, p.cor].filter(Boolean).join(' · ')}
        </div>
        <div className="produto-preco">{brl(p.preco)}</div>
        {indisponivel ? (
          <button className="btn cheio" disabled>
            Reservada
          </button>
        ) : (
          <button
            className={`btn cheio ${naSacola ? 'na-sacola' : ''}`}
            onClick={() => onAlternar(p.id)}
          >
            {naSacola ? (
              <>
                <IconCheck size={16} /> Na sacola
              </>
            ) : (
              'Reservar'
            )}
          </button>
        )}
      </div>
    </article>
  );
}

function DetalheProduto({ p, naSacola, onFechar, onAlternar }) {
  const [indice, setIndice] = useState(0);
  const fotos = p && p.fotos && p.fotos.length ? p.fotos : [null];
  const indisponivel = p && p.status !== 'disponivel';

  return (
    <Sheet
      aberto={Boolean(p)}
      onFechar={onFechar}
      titulo={p ? p.marca || 'Peça única' : ''}
      alta
      rodape={
        p ? (
          indisponivel ? (
            <button className="btn cheio" disabled>
              Peça reservada
            </button>
          ) : (
            <button
              className={`btn cheio ${naSacola ? 'na-sacola' : 'solido'}`}
              onClick={() => onAlternar(p.id)}
            >
              {naSacola ? (
                <>
                  <IconCheck size={16} /> Na sacola · remover
                </>
              ) : (
                `Reservar · ${brl(p.preco)}`
              )}
            </button>
          )
        ) : null
      }
    >
      {p ? (
        <>
          <div
            className="carrossel"
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndice(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {fotos.map((f, i) => (
              <div key={i}>
                {f && ehVideo(f) ? (
                  <video
                    src={f.includes('#') ? f : `${f}#t=0.1`}
                    controls
                    playsInline
                    muted
                    loop
                    preload="metadata"
                    aria-label={`${p.nome} - vídeo`}
                  />
                ) : (
                  <Foto src={f} alt={`${p.nome} - foto ${i + 1}`} />
                )}
              </div>
            ))}
          </div>
          {fotos.length > 1 ? (
            <div className="pontos">
              {fotos.map((_, i) => (
                <i key={i} className={i === indice ? 'on' : ''} />
              ))}
            </div>
          ) : null}
          <div className="detalhe">
            <h3>{p.nome}</h3>
            <div className="preco">{brl(p.preco)}</div>
            <div className="ficha">
              <div>
                <small>Tamanho</small>
                <b>{p.tamanho || '—'}</b>
              </div>
              <div>
                <small>Cor</small>
                <b>{p.cor || '—'}</b>
              </div>
              <div>
                <small>Tipo</small>
                <b>{p.categoria || '—'}</b>
              </div>
            </div>
            {p.descricao ? <p className="descricao">{p.descricao}</p> : null}
            <p className="mudo" style={{ marginTop: 14 }}>
              Peça única: existe apenas 1 unidade deste modelo.
            </p>
          </div>
        </>
      ) : null}
    </Sheet>
  );
}

export default function Vitrine() {
  const router = useRouter();
  const { mostrar, node: toastNode } = useToast();

  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [ordem, setOrdem] = useState('novas');

  const [sacola, setSacola] = useState([]);
  const [sacolaPronta, setSacolaPronta] = useState(false);
  const [sacolaAberta, setSacolaAberta] = useState(false);
  const [abertoId, setAbertoId] = useState(null);
  const [nomeCliente, setNomeCliente] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroSacola, setErroSacola] = useState('');
  const [ultimoPedido, setUltimoPedido] = useState(null);
  const [areaLoja, setAreaLoja] = useState(false);
  const linkProfundoFeito = useRef(false);

  // ---- carga inicial do aparelho
  useEffect(() => {
    setSacola(lerLS(CHAVE_SACOLA, []));
    setNomeCliente(lerLS(CHAVE_NOME, ''));
    const ult = lerLS(CHAVE_ULTIMO, null);
    if (ult && Date.now() - ult.em < 48 * 3600 * 1000) setUltimoPedido(ult);
    setSacolaPronta(true);
  }, []);

  useEffect(() => {
    if (sacolaPronta) gravarLS(CHAVE_SACOLA, sacola);
  }, [sacola, sacolaPronta]);

  const carregar = useCallback(async (silencioso = false) => {
    try {
      const r = await chamar('loja.carregar');
      setDados(r);
      setErro('');
    } catch (e) {
      if (!silencioso) setErro(e.message);
    }
  }, []);

  useEffect(() => {
    carregar();
    const aoVoltar = () => document.visibilityState === 'visible' && carregar(true);
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [carregar]);

  // ---- tira da sacola o que nao esta mais disponivel
  useEffect(() => {
    if (!dados || !sacolaPronta) return;
    const validos = sacola.filter((id) => {
      const p = dados.produtos.find((x) => x.id === id);
      return p && p.status === 'disponivel';
    });
    if (validos.length !== sacola.length) {
      setSacola(validos);
      mostrar('Algumas peças da sua sacola foram reservadas por outra cliente.', 'erro');
    }
  }, [dados, sacola, sacolaPronta, mostrar]);

  // ---- link direto para uma peca (?p=ID)
  useEffect(() => {
    if (!dados || linkProfundoFeito.current) return;
    linkProfundoFeito.current = true;
    const id = new URLSearchParams(window.location.search).get('p');
    if (id && dados.produtos.some((p) => p.id === id)) setAbertoId(id);
  }, [dados]);

  const produtos = dados ? dados.produtos : [];
  const config = dados ? dados.config : { nome_loja: 'Renata Moura', destaque: '', whatsapp: '', instagram: '' };

  const categorias = useMemo(() => {
    const presentes = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    const ordenadas = CATEGORIAS.filter((c) => presentes.has(c));
    const extras = [...presentes].filter((c) => !CATEGORIAS.includes(c));
    return [...ordenadas, ...extras];
  }, [produtos]);

  const tamanhos = useMemo(
    () => [...new Set(produtos.map((p) => p.tamanho).filter(Boolean))],
    [produtos]
  );

  const lista = useMemo(() => {
    const q = normalizar(busca);
    let l = produtos.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (tamanho && p.tamanho !== tamanho) return false;
      if (q) {
        const alvo = normalizar([p.nome, p.marca, p.cor, p.categoria, p.descricao].join(' '));
        if (!alvo.includes(q)) return false;
      }
      return true;
    });
    const peso = (p) => (p.status === 'disponivel' ? 0 : 1);
    l = [...l].sort((a, b) => {
      if (peso(a) !== peso(b)) return peso(a) - peso(b);
      if (ordem === 'menor') return Number(a.preco) - Number(b.preco);
      if (ordem === 'maior') return Number(b.preco) - Number(a.preco);
      return String(b.created_at).localeCompare(String(a.created_at));
    });
    return l;
  }, [produtos, busca, categoria, tamanho, ordem]);

  const itensSacola = sacola.map((id) => produtos.find((p) => p.id === id)).filter(Boolean);
  const total = itensSacola.reduce((s, p) => s + Number(p.preco || 0), 0);
  const aberto = abertoId ? produtos.find((p) => p.id === abertoId) : null;

  function alternar(id) {
    setErroSacola('');
    setSacola((atual) => {
      if (atual.includes(id)) {
        return atual.filter((x) => x !== id);
      }
      mostrar('Peça adicionada à sacola');
      return [...atual, id];
    });
  }

  async function finalizar() {
    setErroSacola('');
    if (!config.whatsapp) {
      setErroSacola('O WhatsApp da loja ainda não foi configurado. Avise a Renata, por favor.');
      return;
    }
    const nome = nomeCliente.trim();
    if (!nome) {
      setErroSacola('Digite seu nome para a Renata saber quem está reservando.');
      return;
    }
    setEnviando(true);
    try {
      gravarLS(CHAVE_NOME, nome);
      const { pedido, indisponiveis } = await chamar('pedido.criar', { nome, ids: sacola });
      if (!pedido) {
        setSacola([]);
        setErroSacola('Poxa! Essas peças acabaram de ser reservadas por outra cliente. Que tal conferir as outras?');
        await carregar(true);
        return;
      }
      const mensagem = montarMensagem({
        nome,
        codigo: pedido.codigo,
        itens: pedido.itens,
        total: pedido.total,
        origem: window.location.origin,
      });
      gravarLS(CHAVE_ULTIMO, {
        codigo: pedido.codigo,
        em: Date.now(),
        mensagem,
        whatsapp: config.whatsapp,
        itens: pedido.itens.map((i) => ({ nome: i.nome, fotos: (i.fotos || []).slice(0, 1) })),
      });
      setSacola([]);
      setSacolaAberta(false);
      if (indisponiveis.length) {
        mostrar('Uma ou mais peças já tinham sido reservadas e ficaram de fora.', 'erro');
      }
      carregar(true);
      window.location.href = linkWhatsapp(config.whatsapp, mensagem);
    } catch (e) {
      setErroSacola(e.message);
    } finally {
      setEnviando(false);
    }
  }

  async function enviarFotos() {
    if (!ultimoPedido) return;
    const r = await compartilharFotos(
      ultimoPedido.itens,
      `Fotos do meu pedido #${ultimoPedido.codigo}`
    );
    if (!r.ok && r.motivo === 'nao-suportado') {
      mostrar('Seu aparelho não permite anexar fotos por aqui. Os links já foram na mensagem.', 'erro');
    } else if (!r.ok && r.motivo === 'sem-fotos') {
      mostrar('Não encontrei fotos para anexar.', 'erro');
    }
  }

  function fecharFaixa() {
    setUltimoPedido(null);
    try {
      localStorage.removeItem(CHAVE_ULTIMO);
    } catch {
      /* ok */
    }
  }

  if (areaLoja) {
    return (
      <AdminLogin
        onSucesso={() => router.push('/admin')}
        onVoltar={() => setAreaLoja(false)}
      />
    );
  }

  return (
    <>
      {MODO_DEMO ? (
        <div className="demo-faixa">Modo demonstração · peças de exemplo salvas só neste aparelho</div>
      ) : null}

      <header className="topbar">
        <button className="marca" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Início">
          <Logo className="logo" />
          <span className="marca-texto">
            <span className="marca-nome">{config.nome_loja || 'Renata Moura'}</span>
            <span className="marca-sub">Achadinhos e Desapegos</span>
          </span>
        </button>
        <button className="btn-icone" onClick={() => setSacolaAberta(true)} aria-label={`Sacola com ${sacola.length} peças`}>
          <IconSacola />
          {sacola.length > 0 ? <span className="contador">{sacola.length}</span> : null}
        </button>
      </header>

      <main className="container">
        <section className="hero">
          <Ornamento />
          <h1>{config.destaque || 'Peças de grife selecionadas com carinho'}</h1>
          <p>Cada peça é única. Reserve suas favoritas e finalize o pedido direto no WhatsApp.</p>
        </section>

        <section className="filtros" aria-label="Filtros">
          <div className="busca">
            <IconBusca size={18} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por peça, marca ou cor"
              aria-label="Buscar"
            />
          </div>
          {categorias.length > 0 ? (
            <div className="chips">
              <button className={`chip ${categoria === '' ? 'ativo' : ''}`} onClick={() => setCategoria('')}>
                Todas
              </button>
              {categorias.map((c) => (
                <button
                  key={c}
                  className={`chip ${categoria === c ? 'ativo' : ''}`}
                  onClick={() => setCategoria(categoria === c ? '' : c)}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
          <div className="linha-filtros">
            <select className="select" value={tamanho} onChange={(e) => setTamanho(e.target.value)} aria-label="Tamanho">
              <option value="">Todos os tamanhos</option>
              {tamanhos.map((t) => (
                <option key={t} value={t}>
                  Tam. {t}
                </option>
              ))}
            </select>
            <select className="select" value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar">
              <option value="novas">Mais novas</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
          </div>
          {dados ? (
            <div className="qtd">
              {lista.length} {lista.length === 1 ? 'peça' : 'peças'}
            </div>
          ) : null}
        </section>

        {erro ? (
          <div className="vazio">
            <div className="serif">Não foi possível carregar o catálogo</div>
            <p>{erro}</p>
            <button className="btn" onClick={() => carregar()}>
              Tentar de novo
            </button>
          </div>
        ) : !dados ? (
          <div className="grade" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="sk" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <div className="vazio">
            <div className="serif">{produtos.length === 0 ? 'Novidades chegando em breve' : 'Nenhuma peça encontrada'}</div>
            <p>
              {produtos.length === 0
                ? 'Estamos preparando novas peças para o catálogo.'
                : 'Tente limpar os filtros ou buscar por outra palavra.'}
            </p>
          </div>
        ) : (
          <div className="grade">
            {lista.map((p) => (
              <CartaoProduto
                key={p.id}
                p={p}
                naSacola={sacola.includes(p.id)}
                onAbrir={setAbertoId}
                onAlternar={alternar}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="rodape" style={ultimoPedido ? { paddingBottom: 190 } : undefined}>
        <Logo className="logo" />
        <div className="serif" style={{ fontSize: 22, color: 'var(--wine)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          {config.nome_loja || 'Renata Moura'}
        </div>
        <p>Brechó de grife · peças únicas, selecionadas e revisadas.</p>
        {config.instagram ? (
          <a className="insta" href={`https://instagram.com/${config.instagram}`} target="_blank" rel="noopener noreferrer">
            <IconInstagram size={18} /> @{config.instagram}
          </a>
        ) : null}
        <div>
          <button className="link-admin" onClick={() => setAreaLoja(true)}>
            <IconCadeado size={14} /> Área da loja
          </button>
        </div>
      </footer>

      <DetalheProduto
        p={aberto}
        naSacola={aberto ? sacola.includes(aberto.id) : false}
        onFechar={() => setAbertoId(null)}
        onAlternar={alternar}
      />

      <Sheet
        aberto={sacolaAberta}
        onFechar={() => setSacolaAberta(false)}
        titulo="Minha sacola"
        rodape={
          itensSacola.length > 0 ? (
            <button className="btn zap cheio" onClick={finalizar} disabled={enviando}>
              <IconWhatsapp size={22} /> {enviando ? 'Reservando...' : 'Finalizar pedido'}
            </button>
          ) : null
        }
      >
        {itensSacola.length === 0 ? (
          <div className="vazio">
            <div className="serif">Sua sacola está vazia</div>
            <p>Toque em “Reservar” nas peças que você amou.</p>
            <button className="btn" onClick={() => setSacolaAberta(false)}>
              Ver catálogo
            </button>
            {erroSacola ? <div className="aviso erro" style={{ marginTop: 14 }}>{erroSacola}</div> : null}
          </div>
        ) : (
          <>
            {itensSacola.map((p) => (
              <div key={p.id} className="item-sacola">
                {capaDe(p.fotos) ? <img src={capaDe(p.fotos)} alt={p.nome} /> : <div className="mini" />}
                <div className="txt">
                  <div className="nome">{p.nome}</div>
                  <div className="det">
                    {[p.marca, p.tamanho && `Tam. ${p.tamanho}`, p.cor].filter(Boolean).join(' · ')}
                  </div>
                  <div className="val">{brl(p.preco)}</div>
                </div>
                <button className="btn-icone" onClick={() => alternar(p.id)} aria-label={`Remover ${p.nome}`}>
                  <IconLixeira size={18} />
                </button>
              </div>
            ))}
            <div className="total-linha">
              <span>Total</span>
              <b>{brl(total)}</b>
            </div>
            <Campo rotulo="Seu nome">
              <input
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Como podemos te chamar?"
                autoComplete="name"
                maxLength={80}
              />
            </Campo>
            <div className="aviso">
              Ao finalizar, as peças ficam reservadas para você e uma mensagem com o pedido é aberta no WhatsApp da
              Renata para combinar pagamento e entrega.
            </div>
            {erroSacola ? <div className="aviso erro">{erroSacola}</div> : null}
          </>
        )}
      </Sheet>

      {ultimoPedido && !sacolaAberta && !aberto ? (
        <div className="faixa-pedido" role="status">
          <b>Pedido #{ultimoPedido.codigo} reservado ✓</b>
          <p>Suas peças estão guardadas para você. Confirme o envio no WhatsApp e, se quiser, mande as fotos também.</p>
          <div className="acoes">
            {ultimoPedido.mensagem && ultimoPedido.whatsapp ? (
              <a
                className="btn solido pequeno"
                href={linkWhatsapp(ultimoPedido.whatsapp, ultimoPedido.mensagem)}
              >
                <IconWhatsapp size={16} /> WhatsApp
              </a>
            ) : null}
            <button className="btn pequeno" onClick={enviarFotos}>
              Enviar fotos
            </button>
            <button className="btn pequeno" onClick={fecharFaixa}>
              Fechar
            </button>
          </div>
        </div>
      ) : null}

      {toastNode}
    </>
  );
}
