'use client';
import { useState } from 'react';
import { IconCheck } from '../Icons';
import { STATUS_PEDIDO } from '@/lib/constants';
import { capaDe } from '@/lib/midia';
import { brl, dataHora, tempoAtras } from '@/lib/format';

export function PedidosTab({ dados, exec }) {
  const [filtro, setFiltro] = useState('aberto');
  const [ocupado, setOcupado] = useState('');

  const contagem = { todos: dados.pedidos.length, aberto: 0, concluido: 0, cancelado: 0 };
  dados.pedidos.forEach((p) => {
    contagem[p.status] = (contagem[p.status] || 0) + 1;
  });
  const lista = dados.pedidos.filter((p) => filtro === 'todos' || p.status === filtro);

  const opcoes = [
    ['aberto', 'Em aberto'],
    ['concluido', 'Vendidos'],
    ['cancelado', 'Cancelados'],
    ['todos', 'Todos'],
  ];

  async function concluir(p) {
    if (!window.confirm(`Confirmar a venda do pedido #${p.codigo} (${brl(p.total)})? A receita entra no financeiro.`)) return;
    setOcupado(p.id);
    await exec('pedido.concluir', { id: p.id }, 'Venda registrada!');
    setOcupado('');
  }

  async function cancelar(p) {
    if (!window.confirm(`Cancelar o pedido #${p.codigo}? As peças voltam para o catálogo.`)) return;
    setOcupado(p.id);
    await exec('pedido.cancelar', { id: p.id }, 'Pedido cancelado e peças liberadas');
    setOcupado('');
  }

  return (
    <>
      <div className="admin-titulo">
        <h2>Pedidos</h2>
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
          <div className="serif">Nenhum pedido aqui</div>
          <p>Quando uma cliente finalizar pela sacola, o pedido aparece nesta lista.</p>
        </div>
      ) : (
        <div className="lista">
          {lista.map((p) => (
            <div className="pedido" key={p.id}>
              <div className="pedido-topo">
                <div>
                  <b>{p.cliente_nome}</b>
                  <div className="mudo">
                    #{p.codigo} · {dataHora(p.created_at)} · {tempoAtras(p.created_at)}
                  </div>
                </div>
                <span className={`tag ${p.status}`}>{STATUS_PEDIDO[p.status]}</span>
              </div>
              <div className="pedido-itens">
                {p.itens.map((i) => (
                  <div className="pedido-item" key={i.id}>
                    {capaDe(i.fotos) ? <img src={capaDe(i.fotos)} alt={i.nome} loading="lazy" /> : <div className="mini" />}
                    <div className="grow">
                      <div>{i.nome}</div>
                      <div className="mudo">
                        {[i.marca, i.tamanho && `Tam. ${i.tamanho}`, i.cor].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <b>{brl(i.preco)}</b>
                  </div>
                ))}
              </div>
              <div className="total-linha" style={{ margin: '0 0 10px' }}>
                <span>Total</span>
                <b style={{ fontSize: 24 }}>{brl(p.total)}</b>
              </div>
              {p.status === 'aberto' ? (
                <div className="acoes">
                  <button className="btn solido pequeno" onClick={() => concluir(p)} disabled={ocupado === p.id}>
                    <IconCheck size={16} /> Marcar como vendido
                  </button>
                  <button className="btn perigo pequeno" onClick={() => cancelar(p)} disabled={ocupado === p.id}>
                    Cancelar reserva
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function ReservasTab({ dados, exec }) {
  const reservadas = dados.produtos.filter((p) => p.status === 'reservado');

  const pedidoDe = (id) => dados.pedidos.find((p) => p.status === 'aberto' && p.itens.some((i) => i.id === id));

  async function liberar(p) {
    if (!window.confirm(`Liberar “${p.nome}” de volta para o catálogo?`)) return;
    await exec('reserva.liberar', { produtoId: p.id }, 'Peça liberada');
  }

  return (
    <>
      <div className="admin-titulo">
        <h2>Reservas</h2>
        <span className="mudo">{reservadas.length} {reservadas.length === 1 ? 'peça' : 'peças'}</span>
      </div>
      {reservadas.length === 0 ? (
        <div className="vazio">
          <div className="serif">Nenhuma peça reservada</div>
          <p>As peças reservadas pelas clientes aparecem aqui até a venda ser confirmada.</p>
        </div>
      ) : (
        <div className="lista">
          {reservadas.map((p) => {
            const ped = pedidoDe(p.id);
            return (
              <div className="linha" key={p.id}>
                {capaDe(p.fotos) ? <img className="mini" src={capaDe(p.fotos)} alt={p.nome} loading="lazy" /> : <div className="mini" />}
                <div className="txt">
                  <div className="nome">{p.nome}</div>
                  <div className="det">
                    {[p.marca, p.tamanho && `Tam. ${p.tamanho}`].filter(Boolean).join(' · ')} · <b>{brl(p.preco)}</b>
                  </div>
                  <div className="det">
                    {ped ? (
                      <>
                        Reservada por <b>{ped.cliente_nome}</b> · #{ped.codigo} · {tempoAtras(ped.created_at)}
                      </>
                    ) : (
                      'Reserva manual'
                    )}
                  </div>
                </div>
                <div className="acoes">
                  <button className="btn pequeno perigo" onClick={() => liberar(p)}>
                    Liberar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mudo" style={{ marginTop: 14 }}>
        Para confirmar o pagamento e registrar a venda, use a aba Pedidos.
      </p>
    </>
  );
}
