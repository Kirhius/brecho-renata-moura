'use client';
import { useMemo, useState } from 'react';
import { Sheet, Campo } from '../ui';
import { IconMais, IconLixeira } from '../Icons';
import { brl, dataCurta, hojeISO, mesAtualISO, nomeMes } from '@/lib/format';

export default function FinanceiroTab({ dados, exec, mostrar }) {
  const [periodo, setPeriodo] = useState(mesAtualISO());
  const [novo, setNovo] = useState(false);
  const [form, setForm] = useState({ tipo: 'despesa', descricao: '', valor: '', data: hojeISO() });
  const [salvando, setSalvando] = useState(false);

  const meses = useMemo(() => {
    const set = new Set([mesAtualISO()]);
    dados.lancamentos.forEach((l) => l.data && set.add(String(l.data).slice(0, 7)));
    return [...set].sort().reverse();
  }, [dados.lancamentos]);

  const doPeriodo = dados.lancamentos.filter((l) => periodo === 'tudo' || String(l.data).startsWith(periodo));

  const resumo = useMemo(() => {
    const receitas = doPeriodo.filter((l) => l.tipo === 'receita').reduce((s, l) => s + Number(l.valor), 0);
    const despesas = doPeriodo.filter((l) => l.tipo === 'despesa').reduce((s, l) => s + Number(l.valor), 0);
    // lucro nas pecas: venda - custo de cada peca dos pedidos concluidos no periodo
    let lucroPecas = 0;
    let vendidas = 0;
    doPeriodo
      .filter((l) => l.tipo === 'receita' && l.pedido_id)
      .forEach((l) => {
        const ped = dados.pedidos.find((p) => p.id === l.pedido_id);
        if (!ped) return;
        ped.itens.forEach((i) => {
          lucroPecas += Number(i.preco || 0) - Number(i.custo || 0);
          vendidas += 1;
        });
      });
    return { receitas, despesas, resultado: receitas - despesas, lucroPecas, vendidas };
  }, [doPeriodo, dados.pedidos]);

  const estoque = dados.produtos.filter((p) => p.status === 'disponivel');
  const valorEstoque = estoque.reduce((s, p) => s + Number(p.preco || 0), 0);
  const aReceber = dados.pedidos.filter((p) => p.status === 'aberto').reduce((s, p) => s + Number(p.total || 0), 0);

  async function salvar() {
    if (!form.descricao.trim()) return mostrar('Informe uma descrição.', 'erro');
    if (!(Number(String(form.valor).replace(',', '.')) > 0)) return mostrar('Informe um valor maior que zero.', 'erro');
    setSalvando(true);
    const ok = await exec('lancamento.salvar', form, 'Lançamento salvo');
    setSalvando(false);
    if (ok) {
      setNovo(false);
      setForm({ tipo: 'despesa', descricao: '', valor: '', data: hojeISO() });
    }
  }

  async function excluir(l) {
    if (!window.confirm(`Excluir o lançamento “${l.descricao}”?`)) return;
    await exec('lancamento.excluir', { id: l.id }, 'Lançamento excluído');
  }

  return (
    <>
      <div className="admin-titulo">
        <h2>Financeiro</h2>
        <button className="btn solido" onClick={() => setNovo(true)}>
          <IconMais size={18} /> Lançar
        </button>
      </div>

      <div className="campo">
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período">
          {meses.map((m) => (
            <option key={m} value={m}>
              {nomeMes(m)}
            </option>
          ))}
          <option value="tudo">Todo o período</option>
        </select>
      </div>

      <div className="cards-resumo">
        <div className="resumo">
          <small>Vendas</small>
          <b className="pos">{brl(resumo.receitas)}</b>
        </div>
        <div className="resumo">
          <small>Despesas</small>
          <b className="neg">{brl(resumo.despesas)}</b>
        </div>
        <div className="resumo destaque">
          <small>Resultado</small>
          <b>{brl(resumo.resultado)}</b>
        </div>
        <div className="resumo">
          <small>Lucro nas peças</small>
          <b>{brl(resumo.lucroPecas)}</b>
          <div className="mudo">{resumo.vendidas} {resumo.vendidas === 1 ? 'peça vendida' : 'peças vendidas'}</div>
        </div>
        <div className="resumo">
          <small>Em estoque</small>
          <b>{brl(valorEstoque)}</b>
          <div className="mudo">{estoque.length} {estoque.length === 1 ? 'peça' : 'peças'} à venda</div>
        </div>
        <div className="resumo">
          <small>Reservado</small>
          <b>{brl(aReceber)}</b>
          <div className="mudo">aguardando pagamento</div>
        </div>
      </div>

      <h3 className="serif" style={{ fontSize: 22, color: 'var(--wine)', margin: '18px 0 10px' }}>
        Lançamentos
      </h3>
      {doPeriodo.length === 0 ? (
        <div className="vazio">
          <p>Nenhum lançamento neste período. As vendas confirmadas entram aqui automaticamente.</p>
        </div>
      ) : (
        <div className="lista">
          {doPeriodo.map((l) => (
            <div className="linha" key={l.id}>
              <div className="txt">
                <div className="nome" style={{ whiteSpace: 'normal', fontSize: 17 }}>{l.descricao}</div>
                <div className="det">
                  {dataCurta(l.data)} · {l.pedido_id ? 'automático (venda)' : 'manual'}
                </div>
              </div>
              <b className={`serif ${l.tipo === 'receita' ? 'pos' : 'neg'}`} style={{ fontSize: 20, whiteSpace: 'nowrap' }}>
                {l.tipo === 'receita' ? '+' : '−'} {brl(l.valor)}
              </b>
              {!l.pedido_id ? (
                <button className="btn-icone" onClick={() => excluir(l)} aria-label="Excluir lançamento">
                  <IconLixeira size={18} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <Sheet
        aberto={novo}
        onFechar={() => setNovo(false)}
        titulo="Novo lançamento"
        rodape={
          <button className="btn solido cheio" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar lançamento'}
          </button>
        }
      >
        <div className="filtro-status">
          <button
            className={`chip ${form.tipo === 'despesa' ? 'ativo' : ''}`}
            onClick={() => setForm((f) => ({ ...f, tipo: 'despesa' }))}
          >
            Despesa
          </button>
          <button
            className={`chip ${form.tipo === 'receita' ? 'ativo' : ''}`}
            onClick={() => setForm((f) => ({ ...f, tipo: 'receita' }))}
          >
            Receita
          </button>
        </div>
        <Campo rotulo="Descrição">
          <input
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            placeholder={form.tipo === 'despesa' ? 'Ex.: compra de peças, embalagens, frete' : 'Ex.: venda em loja física'}
            maxLength={120}
          />
        </Campo>
        <div className="duas">
          <Campo rotulo="Valor">
            <input
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              inputMode="decimal"
              placeholder="0,00"
            />
          </Campo>
          <Campo rotulo="Data">
            <input type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
          </Campo>
        </div>
      </Sheet>
    </>
  );
}
