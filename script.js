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
  bills:[{id:21,nome:'Light (Luz)',data:'2026-08-13',valor:625.18,pago:false}],
  investmentHistory:[{id:31,data:'2026-08-04',tipo:'Saldo atual',valor:13627.38,observacao:'Valor inicial informado'}],
  goals:[{id:41,nome:'Comprar novo equipamento',meta:5000,guardado:0,prazo:'2026-12-31',observacao:''}]
};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||seed;
if(!db.investmentHistory) db.investmentHistory=[];
if(!db.cards) db.cards=[];
if(!db.bills) db.bills=[];
if(!db.events) db.events=[];
if(!db.mov) db.mov=[];
if(!db.goals) db.goals=[];
let editContext={type:null,id:null};
let financeFilter='Todos';
let balanceHidden=false;
function toggleBalance(){
  balanceHidden=!balanceHidden;
  eyeIcon.innerHTML=`<use href="${balanceHidden?'#ic-eye-off':'#ic-eye'}"/>`;
  render();
}
function updateGreeting(){
  const h=new Date().getHours();
  const saud=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  greeting.textContent=`${saud}, Neto! 👋`;
}

function reconcilePendingBills(){
  if(!Array.isArray(db.bills) || !Array.isArray(db.mov)) return;

  const unpaidBills=db.bills.filter(b=>!b.pago);

  db.mov=db.mov.filter(m=>{
    // New-format automatic expense linked to an unpaid bill.
    if(m.billId && unpaidBills.some(b=>b.id===m.billId)) return false;

    // Legacy versions created the bill expense without billId.
    const legacyMatch=unpaidBills.some(b=>
      m.tipo==='Despesa' &&
      Number(m.valor)===Number(b.valor) &&
      String(m.desc||'').trim().toLowerCase()===String(b.nome||'').trim().toLowerCase()
    );

    return !legacyMatch;
  });
}
reconcilePendingBills();

const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fd=d=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR');
function persist(){reconcilePendingBills();localStorage.setItem(KEY,JSON.stringify(db));render()}
function calc(){
  const receitas=db.mov.filter(x=>x.tipo==='Receita').reduce((s,x)=>s+x.valor,0);
  const unpaidBillIds=new Set(db.bills.filter(b=>!b.pago).map(b=>b.id));
  const despesas=db.mov
    .filter(x=>x.tipo==='Despesa' && !(x.billId && unpaidBillIds.has(x.billId)))
    .reduce((s,x)=>s+x.valor,0);
  const receber=db.events.reduce((s,x)=>s+Math.max(0,x.valor-x.recebido),0);
  const futuro=db.cards.reduce((s,x)=>s+(x.total/x.partes)*Math.max(0,x.partes-x.atual+1),0);
  const contas=db.bills.filter(x=>!x.pago).reduce((s,x)=>s+x.valor,0);
  const saldo=db.config.saldoInicial+receitas-despesas;
  const score=Math.max(0,Math.min(100,Math.round(82+Math.min(8,db.config.investimentos/4000)+Math.min(5,receber/200)-Math.min(20,contas/150)-Math.min(20,futuro/500))));
  const saldoProjetado=saldo-contas+receber;
  return{receitas,despesas,receber,futuro,contas,saldo,saldoProjetado,patrimonio:saldo+db.config.investimentos,score}
}
function render(){
  const t=calc();
  saldo.textContent=balanceHidden?'R$ ••••••':brl(t.saldo);investimentos.textContent=brl(db.config.investimentos);patrimonio.textContent=brl(t.patrimonio);
  receitas.textContent=brl(t.receitas);despesas.textContent=brl(t.despesas);aReceber.textContent=brl(t.receber);futuroComprometido.textContent=brl(t.futuro);
  rightReceitas.textContent=brl(t.receitas);rightDespesas.textContent=brl(t.despesas);rightInvest.textContent=brl(db.config.investimentos);
  score.textContent=t.score;scoreLabel.textContent=t.score>=75?'Situação confortável':t.score>=50?'Atenção':'Situação apertada';
  goalText.textContent=`${brl(t.receitas)} de ${brl(db.config.metaMensal)}`;
  goalBar.style.width=Math.min(100,t.receitas/db.config.metaMensal*100)+'%';
  investBig.textContent=brl(db.config.investimentos);futureBig.textContent=brl(t.futuro);
  investmentHistory.innerHTML=[...db.investmentHistory].sort((a,b)=>b.data.localeCompare(a.data)||b.id-a.id).map(investmentEntry).join('')||'<div class="meta">Nenhuma atualização registrada.</div>';

  const futureEvents=[...db.events].sort((a,b)=>a.data.localeCompare(b.data));
  homeEvents.innerHTML=futureEvents.filter(e=>e.data>='2026-08-04').slice(0,3).map(eventMini).join('')||'<div class="meta">Nenhum evento próximo.</div>';
  rightEvents.innerHTML=futureEvents.filter(e=>e.data>='2026-08-04').slice(0,3).map(eventMini).join('')||'<div class="meta">Nenhum evento próximo.</div>';
  eventList.innerHTML=futureEvents.map(eventFull).join('')||'<div class="meta">Nenhum evento.</div>';

  homeBills.innerHTML=db.bills.filter(b=>!b.pago).slice(0,2).map(billMini).join('')||'<div class="meta">Nenhuma conta próxima.</div>';
  billList.innerHTML=db.bills.map(billFull).join('')||'<div class="meta">Nenhuma conta.</div>';
  cardList.innerHTML=db.cards.map(cardFull).join('')||'<div class="meta">Nenhuma compra parcelada.</div>';
  goalList.innerHTML=db.goals.map(goalFull).join('')||'<div class="meta">Nenhuma meta cadastrada.</div>';
  const firstGoal=db.goals[0];
  rightGoalSummary.innerHTML=firstGoal?(()=>{
    const pct=Math.max(0,Math.min(100,Math.round((Number(firstGoal.guardado||0)/Math.max(1,Number(firstGoal.meta||1)))*100)));
    return `<strong>${firstGoal.nome}</strong><small>${brl(firstGoal.guardado)} / ${brl(firstGoal.meta)}</small><div class="progress"><span style="width:${pct}%"></span></div>`;
  })():'<div class="meta">Nenhuma meta.</div>';

  const mov=[...db.mov].sort((a,b)=>b.data.localeCompare(a.data)||b.id-a.id);
  const filtered=financeFilter==='Todos'?mov:mov.filter(m=>m.tipo===financeFilter);
  financeList.innerHTML=filtered.map(movFull).join('')||'<div class="meta">Nenhuma movimentação.</div>';
}
function eventMini(e){const p=Math.max(0,e.valor-e.recebido);const d=new Date(e.data+'T12:00:00');return `<div class="stack-item"><div class="left"><div class="date-box">${String(d.getDate()).padStart(2,'0')}<br><small>${d.toLocaleDateString('pt-BR',{month:'short'}).toUpperCase()}</small></div><div><strong>${e.nome}</strong><div class="meta">${e.hora||'Horário a confirmar'} · ${e.local}</div></div></div><span class="badge">${p?brl(p):'PAGO'}</span></div>`}
function eventFull(e){
  const p=Math.max(0,e.valor-e.recebido);
  return `<div class="data-item">
    <div class="left">
      <div class="date-box">${fd(e.data).slice(0,5)}</div>
      <div><strong>${e.nome}</strong><div class="meta">${e.cliente} · ${e.local} · ${e.hora||'sem horário'}</div></div>
    </div>
    <div>
      <strong class="${p?'neg':'pos'}">${p?brl(p)+' pendente':'Pago'}</strong>
      <div class="meta">${brl(e.recebido)} recebido</div>
      <div class="item-actions">
        <button onclick="openEdit('event',${e.id})">✏️ Editar</button>
        <button class="delete" onclick="deleteItem('event',${e.id})">🗑 Excluir</button>
      </div>
    </div>
  </div>`
}
function billMini(b){return `<div class="stack-item"><div class="left"><div class="date-box" style="background:#4c3100;color:#ffc64a">⚡</div><div><strong>${b.nome}</strong><div class="meta">Vence em ${fd(b.data)}</div></div></div><strong class="neg">${brl(b.valor)}</strong></div>`}
function billFull(b){
  return `<div class="stack-item">
    <div><strong>${b.nome}</strong><div class="meta">Vence em ${fd(b.data)} · ${b.pago?'Paga':'Pendente'}</div></div>
    <div>
      <strong class="${b.pago?'pos':'neg'}">${brl(b.valor)}</strong>
      <div class="item-actions">
        <button onclick="toggleBill(${b.id})">${b.pago?'↩ Reabrir':'✓ Marcar paga'}</button>
        <button onclick="openEdit('bill',${b.id})">✏️ Editar</button>
        <button class="delete" onclick="deleteItem('bill',${b.id})">🗑 Excluir</button>
      </div>
    </div>
  </div>`
}
function cardFull(c){
  const parcela=c.total/c.partes,rest=Math.max(0,c.partes-c.atual+1);
  return `<div class="stack-item">
    <div><strong>${c.desc}</strong><div class="meta">${c.cartao} · ${c.atual}/${c.partes} · ${brl(parcela)}/mês</div></div>
    <div>
      <strong>${brl(parcela*rest)} restante</strong>
      <div class="item-actions">
        <button onclick="openEdit('card',${c.id})">✏️ Editar</button>
        <button class="delete" onclick="deleteItem('card',${c.id})">🗑 Excluir</button>
      </div>
    </div>
  </div>`
}
function movFull(m){
  return `<div class="data-item">
    <div><strong>${m.desc}</strong><div class="meta">${fd(m.data)} · ${m.cat}</div></div>
    <div>
      <strong class="${m.tipo==='Receita'?'pos':'neg'}">${m.tipo==='Receita'?'+':'-'} ${brl(m.valor)}</strong>
      <div class="item-actions">
        <button onclick="openEdit('mov',${m.id})">✏️ Editar</button>
        <button class="delete" onclick="deleteItem('mov',${m.id})">🗑 Excluir</button>
      </div>
    </div>
  </div>`
}
function investmentEntry(i){
  const cls=i.tipo==='Aporte'||i.tipo==='Rendimento'?'amount-positive':i.tipo==='Resgate'?'amount-negative':'amount-neutral';
  const sinal=i.tipo==='Aporte'||i.tipo==='Rendimento'?'+':i.tipo==='Resgate'?'-':'';
  return `<div class="investment-entry">
    <div><strong>${i.tipo}</strong><div class="meta">${fd(i.data)}${i.observacao?' · '+i.observacao:''}</div></div>
    <div>
      <strong class="${cls}">${sinal}${brl(i.valor)}</strong>
      <div class="item-actions">
        <button onclick="openEdit('investment',${i.id})">✏️ Editar</button>
        <button class="delete" onclick="deleteItem('investment',${i.id})">🗑 Excluir</button>
      </div>
    </div>
  </div>`
}

function goalFull(g){
  const pct=Math.max(0,Math.min(100,Math.round((Number(g.guardado||0)/Math.max(1,Number(g.meta||1)))*100)));
  return `<div class="goal-item">
    <h3>${g.nome}</h3>
    <div class="meta">${g.prazo?`Prazo: ${fd(g.prazo)}`:'Sem prazo'}${g.observacao?' · '+g.observacao:''}</div>
    <div class="goal-values">
      <span>${brl(g.guardado)} de ${brl(g.meta)}</span>
      <span class="goal-percent">${pct}%</span>
    </div>
    <div class="progress"><span style="width:${pct}%"></span></div>
    <div class="goal-actions">
      <button onclick="openGoal(${g.id})">✏️ Editar</button>
      <button class="delete" onclick="deleteGoal(${g.id})">🗑 Excluir</button>
    </div>
  </div>`;
}

let editingGoalId=null;
function openGoal(id=null){
  editingGoalId=id;
  goalDialogTitle.textContent=id?'Editar meta':'Nova meta';
  if(id){
    const g=db.goals.find(x=>x.id===id);
    if(!g) return;
    goalName.value=g.nome||'';
    goalTarget.value=g.meta||0;
    goalSaved.value=g.guardado||0;
    goalDate.value=g.prazo||'';
    goalNote.value=g.observacao||'';
  }else{
    goalName.value='';
    goalTarget.value='';
    goalSaved.value=0;
    goalDate.value='';
    goalNote.value='';
  }
  goalDialog.showModal();
}
function saveGoal(){
  const nome=goalName.value.trim();
  const meta=Number(goalTarget.value);
  const guardado=Number(goalSaved.value||0);
  if(!nome||!meta) return alert('Informe o nome e o valor da meta.');
  if(editingGoalId){
    const g=db.goals.find(x=>x.id===editingGoalId);
    g.nome=nome;g.meta=meta;g.guardado=guardado;g.prazo=goalDate.value;g.observacao=goalNote.value;
  }else{
    db.goals.push({id:Date.now(),nome,meta,guardado,prazo:goalDate.value,observacao:goalNote.value});
  }
  goalDialog.close();
  persist();
}
function deleteGoal(id){
  if(!confirm('Excluir esta meta?')) return;
  db.goals=db.goals.filter(x=>x.id!==id);
  persist();
}

function parseMoney(text){
  const normalized=text.replace(/\./g,'').replace(',','.');
  const match=normalized.match(/(\d+(?:\.\d{1,2})?)/);
  return match?Number(match[1]):0;
}
function inferCategory(text){
  const t=text.toLowerCase();
  if(t.includes('combust')||t.includes('gasolina')||t.includes('álcool')) return 'Combustível';
  if(t.includes('pedágio')) return 'Pedágio';
  if(t.includes('lanche')||t.includes('comida')||t.includes('almoço')||t.includes('jantar')||t.includes('ifood')) return 'Alimentação';
  if(t.includes('mercado')) return 'Mercado';
  if(t.includes('luz')||t.includes('light')) return 'Casa';
  if(t.includes('festa')||t.includes('dj')) return 'DJ';
  if(t.includes('filmagem')||t.includes('vídeo')) return 'Filmagem';
  return 'Outros';
}
function parseAssistantCommand(text){
  const original=text.trim();
  const lower=original.toLowerCase();
  const valor=parseMoney(original);
  if(!valor) return {ok:false,message:'Não consegui identificar o valor.'};

  let tipo=null;
  if(lower.includes('gastei')||lower.includes('paguei')||lower.includes('comprei')) tipo='Despesa';
  if(lower.includes('recebi')||lower.includes('entrou')||lower.includes('ganhei')) tipo='Receita';
  if(!tipo) return {ok:false,message:'Diga se você gastou ou recebeu.'};

  const categoria=inferCategory(lower);
  const desc=original.charAt(0).toUpperCase()+original.slice(1);
  return {ok:true,tipo,valor,categoria,desc};
}
function processAssistantText(textOverride=null){
  const text=(textOverride||assistantText.value||'').trim();
  if(!text){
    assistantPreview.className='assistant-preview error';
    assistantPreview.textContent='Digite ou fale uma movimentação.';
    return;
  }
  const parsed=parseAssistantCommand(text);
  if(!parsed.ok){
    assistantPreview.className='assistant-preview error';
    assistantPreview.textContent=parsed.message;
    return;
  }
  db.mov.push({
    id:Date.now(),
    data:new Date().toISOString().slice(0,10),
    tipo:parsed.tipo,
    cat:parsed.categoria,
    desc:parsed.desc,
    valor:parsed.valor
  });
  assistantPreview.className='assistant-preview success';
  assistantPreview.textContent=`✓ ${parsed.tipo} de ${brl(parsed.valor)} registrada em ${parsed.categoria}.`;
  assistantText.value='';
  persist();
}
function startVoice(){
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    voiceTitle.textContent='Voz indisponível neste navegador';
    voiceStatus.textContent='Use o campo de texto abaixo ou o ditado do teclado do iPhone.';
    assistantText.focus();
    return;
  }
  const recognition=new SpeechRecognition();
  recognition.lang='pt-BR';
  recognition.interimResults=false;
  recognition.maxAlternatives=1;
  voiceTitle.textContent='Ouvindo...';
  voiceStatus.textContent='Fale uma movimentação.';
  recognition.onresult=(event)=>{
    const text=event.results[0][0].transcript;
    assistantText.value=text;
    voiceTitle.textContent='Entendi';
    voiceStatus.textContent=text;
    processAssistantText(text);
  };
  recognition.onerror=()=>{
    voiceTitle.textContent='Não consegui ouvir';
    voiceStatus.textContent='Tente novamente ou use o campo de texto.';
  };
  recognition.onend=()=>{
    if(voiceTitle.textContent==='Ouvindo...') voiceTitle.textContent='Toque para falar';
  };
  recognition.start();
}

function activateTab(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));window.scrollTo({top:0,behavior:'smooth'})}
function goTab(id){activateTab(id)}
function goFinance(type){activateTab('financeiro');setFilter(type)}
function setFilter(type){
  financeFilter=type;
  document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter===type));
  const titles={Todos:['Financeiro','Receitas e despesas em um só lugar.','+ Nova movimentação'],Receita:['Receitas','Tudo que você recebeu.','+ Nova receita'],Despesa:['Despesas','Tudo que você gastou.','+ Nova despesa']};
  const [title,subtitle,btn]=titles[type]||titles.Todos;
  financeTitle.textContent=title;financeSubtitle.textContent=subtitle;financeAddBtn.textContent=btn;
  render();
}
function openMov(type){movDate.value=new Date().toISOString().slice(0,10);if(type)movType.value=type;movDialog.showModal()}
function saveMov(){const valor=Number(movValue.value);if(!valor)return alert('Informe o valor.');db.mov.push({id:Date.now(),data:movDate.value,tipo:movType.value,cat:movCat.value||'Outros',desc:movDesc.value||movCat.value||'Movimentação',valor});movDialog.close();movValue.value='';movDesc.value='';persist()}
function openEvent(){eventDate.value=new Date().toISOString().slice(0,10);eventDialog.showModal()}
function saveEvent(){const valor=Number(eventValue.value);if(!eventName.value||!valor)return alert('Informe o evento e o valor.');db.events.push({id:Date.now(),data:eventDate.value,hora:eventTime.value,nome:eventName.value,cliente:eventClient.value,local:eventPlace.value,valor,recebido:Number(eventPaid.value||0),status:'Confirmado'});eventDialog.close();persist()}
function openBill(){billDate.value=new Date().toISOString().slice(0,10);billDialog.showModal()}
function saveBill(){const valor=Number(billValue.value);if(!billName.value||!valor)return alert('Informe a conta e o valor.');db.bills.push({id:Date.now(),nome:billName.value,data:billDate.value,valor,pago:false});billDialog.close();persist()}
function openCard(){cardDialog.showModal()}
function saveCard(){const total=Number(cardTotal.value),partes=Number(cardParts.value||1),atual=Number(cardCurrent.value||1);if(!total)return alert('Informe o valor.');db.cards.push({id:Date.now(),cartao:cardName.value||'Cartão',desc:cardDesc.value||'Compra',total,partes,atual});cardDialog.close();persist()}
function toggleBill(id){
  const b=db.bills.find(x=>x.id===id);
  if(!b) return;
  if(!b.pago){
    b.pago=true;
    b.dataPagamento=new Date().toISOString().slice(0,10);
    const existing=db.mov.find(m=>m.billId===b.id);
    if(!existing){
      db.mov.push({id:Date.now(),billId:b.id,data:b.dataPagamento,tipo:'Despesa',cat:'Casa',desc:b.nome,valor:b.valor});
    }
  }else{
    b.pago=false;
    delete b.dataPagamento;
    db.mov=db.mov.filter(m=>m.billId!==b.id);
  }
  persist();
}

function openInvestment(){
  investmentDate.value=new Date().toISOString().slice(0,10);
  investmentType.value='Saldo atual';
  investmentValue.value=db.config.investimentos;
  investmentNote.value='';
  investmentDialog.showModal();
}
function saveInvestment(){
  const tipo=investmentType.value;
  const valor=Number(investmentValue.value);
  if(!valor && valor!==0) return alert('Informe o valor.');
  if(tipo==='Saldo atual'){
    db.config.investimentos=valor;
  }else if(tipo==='Aporte'||tipo==='Rendimento'){
    db.config.investimentos+=valor;
  }else if(tipo==='Resgate'){
    db.config.investimentos-=valor;
  }
  db.investmentHistory.push({
    id:Date.now(),
    data:investmentDate.value||new Date().toISOString().slice(0,10),
    tipo,
    valor,
    observacao:investmentNote.value||''
  });
  investmentDialog.close();
  persist();
}
function deleteItem(type,id){
  if(!confirm('Tem certeza que deseja excluir este item?')) return;
  if(type==='mov') db.mov=db.mov.filter(x=>x.id!==id);
  if(type==='event') db.events=db.events.filter(x=>x.id!==id);
  if(type==='bill'){
    db.bills=db.bills.filter(x=>x.id!==id);
    db.mov=db.mov.filter(m=>m.billId!==id);
  }
  if(type==='card') db.cards=db.cards.filter(x=>x.id!==id);
  if(type==='investment'){
    const item=db.investmentHistory.find(x=>x.id===id);
    if(item){
      if(item.tipo==='Aporte'||item.tipo==='Rendimento') db.config.investimentos-=item.valor;
      else if(item.tipo==='Resgate') db.config.investimentos+=item.valor;
      db.investmentHistory=db.investmentHistory.filter(x=>x.id!==id);
      const lastBalance=[...db.investmentHistory].reverse().find(x=>x.tipo==='Saldo atual');
      if(item.tipo==='Saldo atual' && lastBalance) db.config.investimentos=lastBalance.valor;
    }
  }
  persist();
}
function openEdit(type,id){
  editContext={type,id};
  let item;
  if(type==='mov') item=db.mov.find(x=>x.id===id);
  if(type==='event') item=db.events.find(x=>x.id===id);
  if(type==='bill') item=db.bills.find(x=>x.id===id);
  if(type==='card') item=db.cards.find(x=>x.id===id);
  if(type==='investment') item=db.investmentHistory.find(x=>x.id===id);
  if(!item) return;

  let fields='';
  if(type==='mov'){
    editTitle.textContent='Editar movimentação';
    fields=`
      <label>Tipo</label><select id="edType"><option ${item.tipo==='Despesa'?'selected':''}>Despesa</option><option ${item.tipo==='Receita'?'selected':''}>Receita</option></select>
      <label>Data</label><input id="edDate" type="date" value="${item.data}">
      <label>Categoria</label><input id="edCat" value="${item.cat||''}">
      <label>Descrição</label><input id="edDesc" value="${item.desc||''}">
      <label>Valor</label><input id="edValue" type="number" step="0.01" value="${item.valor}">`;
  }
  if(type==='event'){
    editTitle.textContent='Editar evento';
    fields=`
      <label>Data</label><input id="edDate" type="date" value="${item.data}">
      <label>Hora</label><input id="edTime" type="time" value="${item.hora||''}">
      <label>Evento</label><input id="edName" value="${item.nome||''}">
      <label>Cliente</label><input id="edClient" value="${item.cliente||''}">
      <label>Local</label><input id="edPlace" value="${item.local||''}">
      <label>Valor contratado</label><input id="edValue" type="number" step="0.01" value="${item.valor}">
      <label>Valor recebido</label><input id="edPaid" type="number" step="0.01" value="${item.recebido||0}">`;
  }
  if(type==='bill'){
    editTitle.textContent='Editar conta';
    fields=`
      <label>Conta</label><input id="edName" value="${item.nome||''}">
      <label>Vencimento</label><input id="edDate" type="date" value="${item.data}">
      <label>Valor</label><input id="edValue" type="number" step="0.01" value="${item.valor}">`;
  }
  if(type==='card'){
    editTitle.textContent='Editar compra no cartão';
    fields=`
      <label>Cartão</label><input id="edCard" value="${item.cartao||''}">
      <label>Compra</label><input id="edDesc" value="${item.desc||''}">
      <label>Valor total</label><input id="edValue" type="number" step="0.01" value="${item.total}">
      <label>Parcelas</label><input id="edParts" type="number" value="${item.partes}">
      <label>Parcela atual</label><input id="edCurrent" type="number" value="${item.atual}">`;
  }
  if(type==='investment'){
    editTitle.textContent='Editar atualização do investimento';
    fields=`
      <label>Tipo</label>
      <select id="edInvType">
        <option ${item.tipo==='Saldo atual'?'selected':''}>Saldo atual</option>
        <option ${item.tipo==='Aporte'?'selected':''}>Aporte</option>
        <option ${item.tipo==='Rendimento'?'selected':''}>Rendimento</option>
        <option ${item.tipo==='Resgate'?'selected':''}>Resgate</option>
      </select>
      <label>Data</label><input id="edDate" type="date" value="${item.data}">
      <label>Valor</label><input id="edValue" type="number" step="0.01" value="${item.valor}">
      <label>Observação</label><input id="edNote" value="${item.observacao||''}">`;
  }
  editFields.innerHTML=fields;
  editDialog.showModal();
}
function saveEdit(){
  const {type,id}=editContext;
  if(type==='mov'){
    const item=db.mov.find(x=>x.id===id);
    item.tipo=edType.value;item.data=edDate.value;item.cat=edCat.value;item.desc=edDesc.value;item.valor=Number(edValue.value);
  }
  if(type==='event'){
    const item=db.events.find(x=>x.id===id);
    item.data=edDate.value;item.hora=edTime.value;item.nome=edName.value;item.cliente=edClient.value;item.local=edPlace.value;item.valor=Number(edValue.value);item.recebido=Number(edPaid.value||0);
  }
  if(type==='bill'){
    const item=db.bills.find(x=>x.id===id);
    const oldValue=item.valor;
    item.nome=edName.value;item.data=edDate.value;item.valor=Number(edValue.value);
    const mov=db.mov.find(m=>m.billId===id);
    if(mov){mov.desc=item.nome;mov.valor=item.valor;}
  }
  if(type==='card'){
    const item=db.cards.find(x=>x.id===id);
    item.cartao=edCard.value;item.desc=edDesc.value;item.total=Number(edValue.value);item.partes=Number(edParts.value);item.atual=Number(edCurrent.value);
  }
  if(type==='investment'){
    const item=db.investmentHistory.find(x=>x.id===id);
    if(item.tipo==='Aporte'||item.tipo==='Rendimento') db.config.investimentos-=item.valor;
    else if(item.tipo==='Resgate') db.config.investimentos+=item.valor;
    item.tipo=edInvType.value;item.data=edDate.value;item.valor=Number(edValue.value);item.observacao=edNote.value;
    if(item.tipo==='Saldo atual') db.config.investimentos=item.valor;
    else if(item.tipo==='Aporte'||item.tipo==='Rendimento') db.config.investimentos+=item.valor;
    else if(item.tipo==='Resgate') db.config.investimentos-=item.valor;
  }
  editDialog.close();
  persist();
}
function openTransfer(){alert('Transferência entra na próxima atualização.')}

document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>activateTab(btn.dataset.tab)));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
updateGreeting();
render();