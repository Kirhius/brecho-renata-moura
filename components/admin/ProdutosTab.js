'use client';
import { useEffect, useMemo, useState } from 'react';
import { Sheet, Campo } from '../ui';
import { IconMais, IconEditar, IconCamera, IconFechar, IconCabide } from '../Icons';
import { enviarFoto, enviarVideo } from '@/lib/client';
import { ehVideo, soVideos, capaDe, MAX_MIDIAS, MAX_VIDEOS, MAX_SEGUNDOS_VIDEO } from '@/lib/midia';
import { CATEGORIAS, TAMANHOS, STATUS_PRODUTO } from '@/lib/constants';
import { brl } from '@/lib/format';

const VAZIO = {
  nome: '',
  marca: '',
  categoria: '',
  tamanho: '',
  cor: '',
  preco: '',
  custo: '',
  descricao: '',
  fotos: [],
  status: 'disponivel',
};

function FormProduto({ editando, onFechar, exec, senha, mostrar }) {
  const [f, setF] = useState(VAZIO);
  const [subindo, setSubindo] = useState(0);
  const [videoPct, setVideoPct] = useState(null); // null | numero (preparando) | 'enviando'
  const [salvando, setSalvando] = useState(false);
  const aberto = Boolean(editando);
  const novo = editando === 'novo';

  useEffect(() => {
    if (!editando) return;
    if (editando === 'novo') setF(VAZIO);
    else
      setF({
        ...VAZIO,
        ...editando,
        preco: editando.preco ?? '',
        custo: editando.custo ?? '',
        fotos: editando.fotos || [],
      });
  }, [editando]);

  const set = (campo) => (e) => setF((x) => ({ ...x, [campo]: e.target.value }));

  async function aoEscolher(e) {
    const arquivos = [...e.target.files];
    e.target.value = '';
    const livres = MAX_MIDIAS - f.fotos.length;
    for (const arquivo of arquivos.slice(0, livres)) {
      setSubindo((s) => s + 1);
      try {
        const url = await enviarFoto(arquivo, senha);
        setF((x) => ({ ...x, fotos: [...x.fotos, url] }));
      } catch (err) {
        mostrar(err.message, 'erro');
      } finally {
        setSubindo((s) => s - 1);
      }
    }
  }

  async function aoEscolherVideo(e) {
    const arquivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!arquivo) return;
    if (soVideos(f.fotos).length >= MAX_VIDEOS) return mostrar(`Máximo de ${MAX_VIDEOS} vídeos por peça.`, 'erro');
    setVideoPct(0);
    try {
      const url = await enviarVideo(arquivo, senha, setVideoPct);
      setF((x) => ({ ...x, fotos: [...x.fotos, url] }));
      mostrar('Vídeo adicionado!');
    } catch (err) {
      mostrar(err.message, 'erro');
    } finally {
      setVideoPct(null);
    }
  }

  const removerFoto = (i) => setF((x) => ({ ...x, fotos: x.fotos.filter((_, k) => k !== i) }));
  const tornarCapa = (i) =>
    setF((x) => {
      if (i === 0) return x;
      const fotos = [...x.fotos];
      const [c] = fotos.splice(i, 1);
      return { ...x, fotos: [c, ...fotos] };
    });

  async function salvar() {
    if (!f.nome.trim()) return mostrar('Informe o nome da peça.', 'erro');
    if (!(Number(String(f.preco).replace(',', '.')) > 0)) return mostrar('Informe o preço de venda.', 'erro');
    setSalvando(true);
    const ok = await exec(
      'produto.salvar',
      { ...f, id: novo ? undefined : editando.id },
      novo ? 'Peça cadastrada!' : 'Peça atualizada!'
    );
    setSalvando(false);
    if (ok) onFechar();
  }

  async function excluir() {
    if (!window.confirm('Excluir esta peça do catálogo? Essa ação não pode ser desfeita.')) return;
    const ok = await exec('produto.excluir', { id: editando.id }, 'Peça excluída');
    if (ok) onFechar();
  }

  const lucro = Number(String(f.preco).replace(',', '.')) - Number(String(f.custo || 0).replace(',', '.'));

  return (
    <Sheet
      aberto={aberto}
      onFechar={onFechar}
      titulo={novo ? 'Nova peça' : 'Editar peça'}
      alta
      rodape={
        <div style={{ display: 'flex', gap: 10 }}>
          {!novo ? (
            <button className="btn perigo" onClick={excluir} disabled={salvando}>
              Excluir
            </button>
          ) : null}
          <button className="btn solido cheio" onClick={salvar} disabled={salvando || subindo > 0 || videoPct !== null}>
            {subindo > 0 || videoPct !== null ? 'Aguarde o envio...' : salvando ? 'Salvando...' : 'Salvar peça'}
          </button>
        </div>
      }
    >
      <div className="campo">
        <label>Fotos e vídeos (até {MAX_MIDIAS})</label>
      </div>
      <div className="fotos-edicao">
        {f.fotos.map((src, i) =>
          ehVideo(src) ? (
            <div className="foto-slot" key={src.slice(-40) + i}>
              <video src={`${src}#t=0.1`} muted playsInline preload="metadata" />
              <span className="capa video">▶ Vídeo</span>
              <button
                type="button"
                className="rm"
                aria-label="Remover vídeo"
                onClick={() => removerFoto(i)}
              >
                <IconFechar size={14} />
              </button>
            </div>
          ) : (
            <div className="foto-slot" key={src.slice(-40) + i} onClick={() => tornarCapa(i)}>
              <img src={src} alt={`Foto ${i + 1}`} />
              {src === capaDe(f.fotos) ? <span className="capa">Capa</span> : null}
              <button
                type="button"
                className="rm"
                aria-label="Remover foto"
                onClick={(e) => {
                  e.stopPropagation();
                  removerFoto(i);
                }}
              >
                <IconFechar size={14} />
              </button>
            </div>
          )
        )}
        {Array.from({ length: subindo }).map((_, i) => (
          <div className="foto-slot" key={'s' + i}>
            <span style={{ fontSize: 11 }}>enviando...</span>
          </div>
        ))}
        {videoPct !== null ? (
          <div className="foto-slot">
            <span style={{ fontSize: 11, textAlign: 'center', padding: 4 }}>
              {videoPct === 'enviando' ? 'enviando vídeo...' : `preparando ${videoPct}%`}
            </span>
          </div>
        ) : null}
        {f.fotos.length + subindo + (videoPct !== null ? 1 : 0) < MAX_MIDIAS ? (
          <label className="foto-slot add">
            <input type="file" accept="image/*" multiple onChange={aoEscolher} />
            <span>
              <IconCamera size={24} />
              <br />
              Foto
            </span>
          </label>
        ) : null}
        {f.fotos.length + subindo + (videoPct !== null ? 1 : 0) < MAX_MIDIAS &&
        soVideos(f.fotos).length < MAX_VIDEOS &&
        videoPct === null ? (
          <label className="foto-slot add">
            <input type="file" accept="video/*" onChange={aoEscolherVideo} />
            <span>
              <IconCamera size={24} />
              <br />
              Vídeo
            </span>
          </label>
        ) : null}
      </div>
      {videoPct !== null ? (
        <div className="aviso">
          Preparando o vídeo para ficar leve. Mantenha esta tela aberta até terminar (leva quase o mesmo tempo da
          duração do vídeo).
        </div>
      ) : null}
      <p className="mudo" style={{ marginTop: -6 }}>
        Toque em uma foto para torná-la a capa. Vídeos: até {MAX_SEGUNDOS_VIDEO} segundos, sem som, convertidos
        automaticamente (funciona com vídeos do iPhone) e ficam leves para o site carregar rápido. Máx. {MAX_VIDEOS}{' '}
        vídeos por peça.
      </p>

      <Campo rotulo="Nome da peça *">
        <input value={f.nome} onChange={set('nome')} placeholder="Ex.: Vestido midi de seda" maxLength={120} />
      </Campo>
      <div className="duas">
        <Campo rotulo="Marca">
          <input value={f.marca} onChange={set('marca')} placeholder="Ex.: Farm" maxLength={80} />
        </Campo>
        <Campo rotulo="Tipo">
          <input value={f.categoria} onChange={set('categoria')} list="lista-categorias" placeholder="Vestidos" />
          <datalist id="lista-categorias">
            {CATEGORIAS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Campo>
      </div>
      <div className="duas">
        <Campo rotulo="Tamanho">
          <input value={f.tamanho} onChange={set('tamanho')} list="lista-tamanhos" placeholder="M" maxLength={20} />
          <datalist id="lista-tamanhos">
            {TAMANHOS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </Campo>
        <Campo rotulo="Cor">
          <input value={f.cor} onChange={set('cor')} placeholder="Nude rosado" maxLength={40} />
        </Campo>
      </div>
      <div className="duas">
        <Campo rotulo="Preço de venda *">
          <input value={f.preco} onChange={set('preco')} inputMode="decimal" placeholder="389,00" />
        </Campo>
        <Campo rotulo="Quanto paguei" dica="Só você vê. Usado no lucro.">
          <input value={f.custo} onChange={set('custo')} inputMode="decimal" placeholder="140,00" />
        </Campo>
      </div>
      {Number.isFinite(lucro) && Number(String(f.preco).replace(',', '.')) > 0 && Number(String(f.custo || 0).replace(',', '.')) > 0 ? (
        <p className="mudo" style={{ marginTop: -4 }}>
          Lucro estimado nesta peça: <b>{brl(lucro)}</b>
        </p>
      ) : null}
      <Campo rotulo="Descrição">
        <textarea
          value={f.descricao}
          onChange={set('descricao')}
          placeholder="Tecido, estado de conservação, medidas..."
          maxLength={800}
        />
      </Campo>
      {!novo ? (
        <Campo rotulo="Situação">
          <select value={f.status} onChange={set('status')}>
            {Object.entries(STATUS_PRODUTO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Campo>
      ) : null}
    </Sheet>
  );
}

export default function ProdutosTab({ dados, exec, senha, mostrar }) {
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState(null);

  const contagem = useMemo(() => {
    const c = { todos: dados.produtos.length, disponivel: 0, reservado: 0, vendido: 0 };
    dados.produtos.forEach((p) => {
      c[p.status] = (c[p.status] || 0) + 1;
    });
    return c;
  }, [dados.produtos]);

  const lista = dados.produtos.filter((p) => {
    if (filtro !== 'todos' && p.status !== filtro) return false;
    if (busca) {
      const alvo = [p.nome, p.marca, p.cor, p.categoria].join(' ').toLowerCase();
      if (!alvo.includes(busca.toLowerCase())) return false;
    }
    return true;
  });

  const opcoes = [
    ['todos', 'Todas'],
    ['disponivel', 'Disponíveis'],
    ['reservado', 'Reservadas'],
    ['vendido', 'Vendidas'],
  ];

  return (
    <>
      <div className="admin-titulo">
        <h2>Peças</h2>
        <button className="btn solido" onClick={() => setEditando('novo')}>
          <IconMais size={18} /> Nova peça
        </button>
      </div>

      <div className="campo">
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar peça, marca ou cor" />
      </div>
      <div className="filtro-status">
        {opcoes.map(([id, nome]) => (
          <button key={id} className={`chip ${filtro === id ? 'ativo' : ''}`} onClick={() => setFiltro(id)}>
            {nome} · {contagem[id] || 0}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="vazio">
          <div className="serif">{dados.produtos.length === 0 ? 'Nenhuma peça cadastrada' : 'Nada por aqui'}</div>
          <p>{dados.produtos.length === 0 ? 'Toque em “Nova peça” para começar o catálogo.' : 'Mude o filtro ou a busca.'}</p>
          {dados.produtos.length === 0 ? (
            <button
              className="btn suave pequeno"
              onClick={async () => {
                const r = await exec('exemplos.adicionar', {});
                if (r) mostrar(`${r.adicionados} peças de exemplo adicionadas.`);
              }}
            >
              Adicionar 4 peças de exemplo
            </button>
          ) : null}
        </div>
      ) : (
        <div className="lista">
          {lista.map((p) => (
            <div className="linha" key={p.id}>
              {capaDe(p.fotos) ? (
                <img className="mini" src={capaDe(p.fotos)} alt={p.nome} loading="lazy" />
              ) : (
                <div className="mini" style={{ display: 'grid', placeItems: 'center', color: 'var(--rose)' }}>
                  <IconCabide size={26} />
                </div>
              )}
              <div className="txt">
                <div className="nome">{p.nome}</div>
                <div className="det">
                  {[p.marca, p.tamanho && `Tam. ${p.tamanho}`, p.cor].filter(Boolean).join(' · ') || '—'}
                </div>
                <div className="det">
                  <b>{brl(p.preco)}</b>
                  {Number(p.custo) > 0 ? <span> · custo {brl(p.custo)}</span> : null}
                </div>
                <span className={`tag ${p.status}`}>{STATUS_PRODUTO[p.status]}</span>
              </div>
              <div className="acoes">
                <button
                  className="btn-icone"
                  onClick={() => setEditando(p)}
                  aria-label={`Editar ${p.nome}`}
                  title="Editar"
                >
                  <IconEditar size={19} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormProduto
        editando={editando}
        onFechar={() => setEditando(null)}
        exec={exec}
        senha={senha}
        mostrar={mostrar}
      />
    </>
  );
}
