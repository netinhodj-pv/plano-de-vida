const KEY='planoDeVidaV3';
const seed={
  config:{saldoInicial:2277.21,investimentos:13627.38,metaMensal:6000},
  mov:[
    {id:1,data:'2026-08-01',tipo:'Despesa',cat:'Combustível',desc:'Combustível',valor:30},
    {id:2,data:'2026-08-01',tipo:'Despesa',cat:'Pedágio',desc:'Pedágio',valor:9.95},
    {id:3,data:'2026-08-01',tipo:'Despesa',cat:'Alimentação',desc:'Lanche',valor:10},
    {id:4,data:'2026-08-01',tipo:'Despesa',cat:'Pedágio',desc:'Pedágio da volta',valor:9.95},
    {id:5,data:'2026-08-02',tipo:'Receita',cat:'DJ',desc:'Festa Peter',valor:350},
    {id:6,data:'2026-08-02',tipo:'Receita',cat:'DJ',desc:'Condomínio Oceânico',valor:350},
    {id:7,data:'2026-08-02',tipo:'Receita',cat:'DJ',desc:'Festa antiga recebida em agosto',valor:350}
  ],
  cards:[],
  events:[
    {id:11,data:'2026-08-01',hora:'11:00',nome:'Festa no Sítio 20',cliente:'Peter',local:'Recreio dos Bandeirantes',valor:350,recebido:350,status:'Confirmado'},
    {id:12,data:'2026-08-01',hora:'19:00',nome:'Festa Junina do Condomínio Oceânico',cliente:'Condomínio Oceânico',local:'Barra da Tijuca',valor:350,recebido:350,status:'Confirmado'},
    {id:13,data:'2026-08-08',hora:'',nome:'Festa do Julio',cliente:'Julio',local:'A confirmar',valor:600,recebido:500,status:'Confirmado'},
    {id:14,data:'2026-08-09',hora:'12:30',nome:'Festa do Dia dos Pais',cliente:'Peter',local:'Clube Adolf Block',valor:350,recebido:0,status:'Confirmado'}
  ],
  bills:[{id:21,nome:'Light (Luz)',data:'2026-08-13',valor:625.18,pago:false}]
};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seed;
let financeFilter='Todos';
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR');
function persist(){localStorage.setItem(KEY,JSON.stringify(db));render()}
function calc(){
  const receitas=db.mov.filter(x=>x.tipo==='Receita').reduce((s,x)=>s+x.valor,0);
  const despesas=db.mov.filter(x=>x.tipo==='Despesa').reduce((s,x)=>s+x.valor,0);
  const receber=db.events.reduce((s,x)=>s+Math.max(0,x.valor-x.recebido),0);
  const futuro=db.cards.reduce((s,x)=>s+(x.total/x.partes)*Math.max(0,x.partes-x.atual+1),0);
  const contas=db.bills.filter(x=>!x.pago).reduce((s,x)=>s+x.valor,0);
  const saldo=db.config.saldoInicial+receitas-despesas;
  const score=Math.max(0,Math.min(100,Math.round(82+Math.min(8,db.config.investimentos/4000)+Math.min(5,receber/200)-Math.min(20,contas/150)-Math.min(20,futuro/500))));
  return{receitas,despesas,receber,futuro,contas,saldo,patrimonio:saldo+db.config.investimentos,score}
}
function render(){
  const t=calc();
  saldo.textContent=brl(t.saldo);investimentos.textContent=brl(db.config.investimentos);patrimonio.textContent=brl(t.patrimonio);
  receitas.textContent=brl(t.receitas);despesas.textContent=brl(t.despesas);aReceber.textContent=brl(t.receber);futuroComprometido.textContent=brl(t.futuro);
  rightReceitas.textContent=brl(t.receitas);rightDespesas.textContent=brl(t.despesas);rightInvest.textContent=brl(db.config.investimentos);
  score.textContent=t.score;scoreLabel.textContent=t.score>=75?'Situação confortável':t.score>=50?'Atenção':'Situação apertada';
  goalText.textContent=`${brl(t.receitas)} de ${brl(db.config.metaMensal)}`;goalBig.textContent=goalText.textContent;
  goalBar.style.width=goalBarBig.style.width=Math.min(100,t.receitas/db.config.metaMensal*100)+'%';
  investBig.textContent=brl(db.config.investimentos);futureBig.textContent=brl(t.futuro);

  const futureEvents=[...db.events].sort((a,b)=>a.data.localeCompare(b.data));
  homeEvents.innerHTML=futureEvents.filter(e=>e.data>='2026-08-04').slice(0,3).map(eventMini).join('')||'<div class="meta">Nenhum evento próximo.</div>';
  rightEvents.innerHTML=futureEvents.filter(e=>e.data>='2026-08-04').slice(0,3).map(eventMini).join('')||'<div class="meta">Nenhum evento próximo.</div>';
  eventList.innerHTML=futureEvents.map(eventFull).join('')||'<div class="meta">Nenhum evento.</div>';

  homeBills.innerHTML=db.bills.filter(b=>!b.pago).slice(0,2).map(billMini).join('')||'<div class="meta">Nenhuma conta próxima.</div>';
  billList.innerHTML=db.bills.map(billFull).join('')||'<div class="meta">Nenhuma conta.</div>';
  cardList.innerHTML=db.cards.map(cardFull).join('')||'<div class="meta">Nenhuma compra parcelada.</div>';

  const mov=[...db.mov].sort((a,b)=>b.data.localeCompare(a.data)||b.id-a.id);
  const filtered=financeFilter==='Todos'?mov:mov.filter(m=>m.tipo===financeFilter);
  financeList.innerHTML=filtered.map(movFull).join('')||'<div class="meta">Nenhuma movimentação.</div>';
}
function eventMini(e){const p=Math.max(0,e.valor-e.recebido);const d=new Date(e.data+'T12:00:00');return `<div class="stack-item"><div class="left"><div class="date-box">${String(d.getDate()).padStart(2,'0')}<br><small>${d.toLocaleDateString('pt-BR',{month:'short'}).toUpperCase()}</small></div><div><strong>${e.nome}</strong><div class="meta">${e.hora||'Horário a confirmar'} · ${e.local}</div></div></div><span class="badge">${p?brl(p):'PAGO'}</span></div>`}
function eventFull(e){const p=Math.max(0,e.valor-e.recebido);return `<div class="data-item"><div class="left"><div class="date-box">${fd(e.data).slice(0,5)}</div><div><strong>${e.nome}</strong><div class="meta">${e.cliente} · ${e.local} · ${e.hora||'sem horário'}</div></div></div><div><strong class="${p?'neg':'pos'}">${p?brl(p)+' pendente':'Pago'}</strong><div class="meta">${brl(e.recebido)} recebido</div></div></div>`}
function billMini(b){return `<div class="stack-item"><div class="left"><div class="date-box" style="background:#4c3100;color:#ffc64a">⚡</div><div><strong>${b.nome}</strong><div class="meta">Vence em ${fd(b.data)}</div></div></div><strong class="neg">${brl(b.valor)}</strong></div>`}
function billFull(b){return `<div class="stack-item"><div><strong>${b.nome}</strong><div class="meta">Vence em ${fd(b.data)}</div></div><div><strong class="${b.pago?'pos':'neg'}">${brl(b.valor)}</strong><div><button onclick="toggleBill(${b.id})">${b.pago?'Reabrir':'Marcar paga'}</button></div></div></div>`}
function cardFull(c){const parcela=c.total/c.partes,rest=Math.max(0,c.partes-c.atual+1);return `<div class="stack-item"><div><strong>${c.desc}</strong><div class="meta">${c.cartao} · ${c.atual}/${c.partes} · ${brl(parcela)}/mês</div></div><strong>${brl(parcela*rest)} restante</strong></div>`}
function movFull(m){return `<div class="data-item"><div><strong>${m.desc}</strong><div class="meta">${fd(m.data)} · ${m.cat}</div></div><strong class="${m.tipo==='Receita'?'pos':'neg'}">${m.tipo==='Receita'?'+':'-'} ${brl(m.valor)}</strong></div>`}
function activateTab(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'})}
function goTab(id){activateTab(id)}
function goFinance(type){activateTab('financeiro');setFilter(type)}
function setFilter(type){financeFilter=type;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===type));render()}
function openMov(type){movDate.value=new Date().toISOString().slice(0,10);if(type)movType.value=type;movDialog.showModal()}
function saveMov(){const valor=Number(movValue.value);if(!valor)return alert('Informe o valor.');db.mov.push({id:Date.now(),data:movDate.value,tipo:movType.value,cat:movCat.value||'Outros',desc:movDesc.value||movCat.value||'Movimentação',valor});movDialog.close();movValue.value='';movDesc.value='';persist()}
function openEvent(){eventDate.value=new Date().toISOString().slice(0,10);eventDialog.showModal()}
function saveEvent(){const valor=Number(eventValue.value);if(!eventName.value||!valor)return alert('Informe o evento e o valor.');db.events.push({id:Date.now(),data:eventDate.value,hora:eventTime.value,nome:eventName.value,cliente:eventClient.value,local:eventPlace.value,valor,recebido:Number(eventPaid.value||0),status:'Confirmado'});eventDialog.close();persist()}
function openBill(){billDate.value=new Date().toISOString().slice(0,10);billDialog.showModal()}
function saveBill(){const valor=Number(billValue.value);if(!billName.value||!valor)return alert('Informe a conta e o valor.');db.bills.push({id:Date.now(),nome:billName.value,data:billDate.value,valor,pago:false});billDialog.close();persist()}
function openCard(){cardDialog.showModal()}
function saveCard(){const total=Number(cardTotal.value),partes=Number(cardParts.value||1),atual=Number(cardCurrent.value||1);if(!total)return alert('Informe o valor.');db.cards.push({id:Date.now(),cartao:cardName.value||'Cartão',desc:cardDesc.value||'Compra',total,partes,atual});cardDialog.close();persist()}
function toggleBill(id){const b=db.bills.find(x=>x.id===id);b.pago=!b.pago;if(b.pago)db.mov.push({id:Date.now(),data:new Date().toISOString().slice(0,10),tipo:'Despesa',cat:'Casa',desc:b.nome,valor:b.valor});persist()}
function openTransfer(){alert('Transferência entra na próxima atualização.')}
function fakeVoice(){voiceStatus.textContent='✓ Registrado! O assistente de voz será conectado à IA em uma próxima versão.'}
document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>activateTab(btn.dataset.tab)));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();