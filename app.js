const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('aor_'+k))??d}catch{return d}},set:(k,v)=>localStorage.setItem('aor_'+k,JSON.stringify(v))};
const state={watchlist:store.get('watchlist',APP_CONFIG.defaultWatchlist),portfolio:store.get('portfolio',APP_CONFIG.defaultPortfolio),journal:store.get('journal',[]),settings:store.get('settings',{apiKey:'',interval:0,notifications:true}),market:new Map(),fearHistory:[],btcHistory:[],timer:null,chartRange:0,providers:{market:'Caché',fear:'Caché',btc:'Caché'},targetAlerts:store.get('targetAlerts',{})};
const cache={market:store.get('marketCache',[]),fear:store.get('fearCache',[]),btc:store.get('btcCache',[])};
let lastRefreshAt=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function notify(message,type='info'){let el=$('#dataNotice');if(!el){el=document.createElement('div');el.id='dataNotice';el.className='data-notice';document.body.appendChild(el)}el.textContent=message;el.className=`data-notice ${type} show`;clearTimeout(notify.t);notify.t=setTimeout(()=>el.classList.remove('show'),5000)}

function playAlertTone(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(880,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(1320,ctx.currentTime+.18);
    gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.16,ctx.currentTime+.02);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.45);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.48);
  }catch{}
}
async function enableTargetNotifications(){
  if(!('Notification' in window)){notify('Este navegador no admite notificaciones.','warn');return}
  const permission=await Notification.requestPermission();
  state.settings.notifications=permission==='granted';store.set('settings',state.settings);updateNotificationButton();
  notify(permission==='granted'?'Alertas de objetivos activadas. Mantén esta página abierta para recibirlas.':'Permiso de notificaciones no concedido.',permission==='granted'?'ok':'warn');
}
function updateNotificationButton(){
  const b=$('#enableAlertsBtn');if(!b)return;
  const granted='Notification' in window&&Notification.permission==='granted'&&state.settings.notifications!==false;
  b.textContent=granted?'🔔 Alertas activadas':'🔕 Activar alertas';b.classList.toggle('alerts-on',granted);
}
function targetAlertKey(p){return `${p.coinId}|${p.entry}|${p.target}`}
function checkTargetAlerts(){
  let changed=false;
  state.portfolio.filter(p=>p.strategy==='Spot rápido'&&p.target>0&&p.status!=='Cerrada').forEach(p=>{
    const c=state.market.get(p.coinId),price=+c?.current_price||0,targetPrice=p.entry*(1+p.target/100),key=targetAlertKey(p),hit=price>=targetPrice;
    if(hit&&!state.targetAlerts[key]){
      state.targetAlerts[key]=true;changed=true;
      const title=`🎯 ${p.symbol} alcanzó el objetivo`;
      const body=`Precio ${usd(price)} · Objetivo ${p.target}% (${usd(targetPrice)})`;
      notify(`${title}: ${body}`,'ok');playAlertTone();
      if('Notification' in window&&Notification.permission==='granted'&&state.settings.notifications!==false){
        try{new Notification(title,{body,icon:c?.image||'',tag:`target-${key}`,requireInteraction:true})}catch{}
      }
    }else if(!hit&&state.targetAlerts[key]){state.targetAlerts[key]=false;changed=true}
  });
  if(changed)store.set('targetAlerts',state.targetAlerts);
}

async function fetchWithRetry(url,options={},retries=1){let last;for(let i=0;i<=retries;i++){try{const r=await fetch(url,{...options,cache:'no-store'});if(r.ok)return r;if((r.status===429||r.status>=500)&&i<retries){await sleep(1200*(i+1));continue}throw new Error(`${r.status} ${r.statusText}`)}catch(e){last=e;if(i<retries){await sleep(1000*(i+1));continue}}}throw last||new Error('Error de red')}
const usd=n=>Number.isFinite(+n)?new Intl.NumberFormat('es-ES',{style:'currency',currency:'USD',maximumFractionDigits:+n<0.01?8:2}).format(+n):'—';
const compact=n=>Number.isFinite(+n)?new Intl.NumberFormat('es-ES',{notation:'compact',maximumFractionDigits:2}).format(+n):'—';
const quantity=n=>Number.isFinite(+n)?new Intl.NumberFormat('es-ES',{minimumFractionDigits:0,maximumFractionDigits:10,useGrouping:true}).format(+n):'—';
function parseFlexibleNumber(value){
  if(typeof value==='number')return Number.isFinite(value)?value:NaN;
  let s=String(value??'').trim().replace(/\s/g,'').replace(/[^0-9,.-]/g,'');
  if(!s)return NaN;
  const lastComma=s.lastIndexOf(','),lastDot=s.lastIndexOf('.');
  if(lastComma!==-1&&lastDot!==-1){
    const decimal=lastComma>lastDot?',':'.',thousands=decimal===','?'.':',';
    s=s.split(thousands).join('').replace(decimal,'.');
  }else if(lastComma!==-1){
    const parts=s.split(',');
    if(parts.length>2)s=parts.join('');
    else s=parts[0]+'.'+parts[1];
  }else if((s.match(/\./g)||[]).length>1){
    const parts=s.split('.'),last=parts.pop();s=parts.join('')+'.'+last;
  }
  return Number(s);
}
const pct=n=>Number.isFinite(+n)?`${+n>=0?'+':''}${(+n).toFixed(2)}%`:'—';
function apiHeaders(){return state.settings.apiKey?{'x-cg-demo-api-key':state.settings.apiKey}:{} }
function coinIds(){return [...new Set([...APP_CONFIG.knownUniverse,...state.watchlist,...state.portfolio.map(p=>p.coinId),'bitcoin'])].filter(Boolean)}
async function fetchMarkets(){
  const ids=coinIds(),chunks=[];for(let i=0;i<ids.length;i+=120)chunks.push(ids.slice(i,i+120));
  const all=[];
  try{
    for(const chunk of chunks){
      const url=`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(chunk.join(','))}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
      const r=await fetchWithRetry(url,{headers:apiHeaders()},1);all.push(...await r.json());
      if(chunks.length>1)await sleep(350);
    }
    state.market=new Map(all.map(c=>[c.id,c]));state.providers.market='CoinGecko';store.set('marketCache',all);return all;
  }catch(err){
    // Respaldo de BTC desde Binance. Para el resto conservamos la última caché,
    // ya que los exchanges no ofrecen market cap ni IDs CoinGecko homogéneos.
    try{
      const r=await fetchWithRetry('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',{},0);
      const b=await r.json();const cached=cache.market.slice();
      const btc={id:'bitcoin',symbol:'btc',name:'Bitcoin',current_price:+b.lastPrice,price_change_percentage_24h:+b.priceChangePercent,total_volume:+b.quoteVolume,image:'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'};
      const i=cached.findIndex(x=>x.id==='bitcoin');if(i>=0)cached[i]={...cached[i],...btc};else cached.push(btc);
      state.market=new Map(cached.map(c=>[c.id,c]));state.providers.market='Binance + caché';store.set('marketCache',cached);return cached;
    }catch{state.providers.market='Caché';throw err}
  }
}
async function fetchFear(){const r=await fetchWithRetry('https://api.alternative.me/fng/?limit=0&format=json',{},1);const d=await r.json();state.fearHistory=(d.data||[]).map(x=>({value:+x.value,label:x.value_classification,ts:+x.timestamp*1000})).sort((a,b)=>a.ts-b.ts);state.providers.fear='Alternative.me';store.set('fearCache',state.fearHistory);return state.fearHistory}
async function fetchBtcHistory(){
  const status=$('#btcChartStatus'); if(status)status.textContent='Cargando BTC…';
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max&interval=daily',{headers:apiHeaders()});
    if(!r.ok)throw new Error('CoinGecko '+r.status);
    const d=await r.json(); state.btcHistory=(d.prices||[]).map(([ts,p])=>({ts,price:+p})).filter(x=>Number.isFinite(x.price));state.providers.btc='CoinGecko';store.set('btcCache',state.btcHistory);
  }catch(e){
    try{
      const all=[]; let start=Date.UTC(2018,0,1), guard=0;
      while(start<Date.now()&&guard++<5){
        const u=`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&startTime=${start}&limit=1000`;
        const r=await fetch(u); if(!r.ok)throw new Error('Binance '+r.status);
        const rows=await r.json(); if(!rows.length)break;
        for(const row of rows)all.push({ts:+row[0],price:+row[4]});
        const next=+rows[rows.length-1][0]+864e5; if(next<=start)break; start=next;
      }
      state.btcHistory=all;state.providers.btc='Binance';store.set('btcCache',state.btcHistory);
    }catch{state.btcHistory=[]}
  }
  if(status)status.textContent=state.btcHistory.length?'':'Precio BTC no disponible';
}
function fearClass(v){if(v<=24)return'Miedo extremo';if(v<=44)return'Miedo';if(v<=55)return'Neutral';if(v<=74)return'Codicia';return'Codicia extrema'}
function fearTone(v){if(v<=24)return'extreme-fear';if(v<=44)return'fear';if(v<=55)return'neutral';if(v<=74)return'greed';return'extreme-greed'}
function updateGauge(){const h=state.fearHistory,cur=h[h.length-1];if(!cur)return;const v=Math.max(0,Math.min(100,cur.value)),status=$('#fearStatus');$('#fearValue').textContent=v;$('#fearLabel').textContent=fearClass(v);status.className=`fear-status ${fearTone(v)}`;$('#fearUpdated').textContent=new Date(cur.ts).toLocaleDateString('es-ES');$('#gaugeNeedle').style.transform=`rotate(${-90+v*1.8}deg)`;$('#gaugeProgress').style.strokeDashoffset=0;const itemFromDays=d=>h.reduce((best,x)=>Math.abs(x.ts-(Date.now()-d*864e5))<Math.abs((best?.ts||0)-(Date.now()-d*864e5))?x:best,null);[['fearYesterday',1],['fearWeek',7],['fearMonth',30]].forEach(([id,d])=>{const x=itemFromDays(d);$('#'+id).textContent=x?`${x.value} · ${fearClass(x.value)}`:'—'})}
function drawFearChart(){
  const cv=$('#fearChart');if(!cv)return;const ctx=cv.getContext('2d'),dpr=devicePixelRatio||1,w=Math.max(360,cv.clientWidth),h=310;
  cv.width=w*dpr;cv.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
  const cutoff=state.chartRange?Date.now()-state.chartRange*864e5:0,f=state.fearHistory.filter(x=>x.ts>=cutoff);if(f.length<2)return;
  const minTs=f[0].ts,maxTs=f[f.length-1].ts,left=56,right=112,top=20,bottom=36,plotW=w-left-right,plotH=h-top-bottom;
  const x=ts=>left+(ts-minTs)/(maxTs-minTs||1)*plotW,yF=v=>top+(100-v)/100*plotH;
  const zones=[
    {a:75,b:100,c:'rgba(28,197,122,.10)',rail:'#17c784',t:'Codicia extrema'},
    {a:55,b:75,c:'rgba(132,204,22,.075)',rail:'#84cc16',t:'Codicia'},
    {a:45,b:55,c:'rgba(69,167,255,.10)',rail:'#45a7ff',t:'Neutral'},
    {a:25,b:45,c:'rgba(255,159,67,.075)',rail:'#ff9f43',t:'Miedo'},
    {a:0,b:25,c:'rgba(255,56,89,.11)',rail:'#ff3859',t:'Miedo extremo'}
  ];
  zones.forEach(z=>{const y1=yF(z.b),y2=yF(z.a);ctx.fillStyle=z.c;ctx.fillRect(left,y1,plotW,y2-y1);ctx.fillStyle=z.rail;ctx.fillRect(left-5,y1,4,y2-y1);ctx.fillRect(left+plotW+1,y1,4,y2-y1);ctx.fillStyle=z.rail;ctx.globalAlpha=.9;ctx.font='10px Inter';ctx.textAlign='left';ctx.fillText(z.t,left+plotW+12,(y1+y2)/2+3);ctx.globalAlpha=1});
  ctx.strokeStyle='#323a4c';ctx.lineWidth=1;ctx.textAlign='right';for(let i=0;i<=4;i++){const val=100-i*25,Y=yF(val);ctx.beginPath();ctx.moveTo(left,Y);ctx.lineTo(left+plotW,Y);ctx.stroke();ctx.fillStyle='#8892a5';ctx.font='11px Inter';ctx.fillText(String(val),left-10,Y+4)}
  const b=state.btcHistory.filter(p=>p.ts>=minTs&&p.ts<=maxTs);
  if(b.length>1){
    const prices=b.map(p=>p.price),minP=Math.min(...prices),maxP=Math.max(...prices),pad=(maxP-minP)*.06||1,lo=minP-pad,hi=maxP+pad,yB=p=>top+(hi-p)/(hi-lo)*plotH;
    ctx.save();ctx.strokeStyle='#a9bddf';ctx.globalAlpha=.9;ctx.lineWidth=1.45;ctx.beginPath();b.forEach((p,i)=>{const X=x(p.ts),Y=yB(p.price);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.stroke();ctx.restore();
    ctx.fillStyle='#a9bddf';ctx.textAlign='left';ctx.font='10px Inter';for(let i=0;i<=4;i++){const val=hi-(hi-lo)*i/4,Y=top+plotH*i/4;ctx.fillText('$'+new Intl.NumberFormat('es-ES',{notation:'compact',maximumFractionDigits:1}).format(val),left+plotW+12,Y+4)}
    const status=$('#btcChartStatus');if(status)status.textContent=`BTC: ${state.providers.btc}`;
  }else{const status=$('#btcChartStatus');if(status)status.textContent='BTC sin histórico disponible'}
  // Línea del sentimiento más fina y sin resplandor para no tapar BTC.
  ctx.save();ctx.strokeStyle='#f5c542';ctx.globalAlpha=.96;ctx.lineWidth=1.25;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();f.forEach((p,i)=>{const X=x(p.ts),Y=yF(p.value);i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.stroke();ctx.restore();
  ctx.fillStyle='#8892a5';ctx.textAlign='left';ctx.font='11px Inter';ctx.fillText(new Date(minTs).toLocaleDateString('es-ES',{month:'short',year:'2-digit'}),left,h-8);ctx.textAlign='right';ctx.fillText(new Date(maxTs).toLocaleDateString('es-ES',{month:'short',year:'2-digit'}),left+plotW,h-8);
}

function scoreCoin(c){let s=0;const ratio=c.market_cap?c.total_volume/c.market_cap:0;s+=Math.min(28,ratio*35);if(c.market_cap>5e6&&c.market_cap<150e6)s+=22;else if(c.market_cap<500e6)s+=10;if(c.total_volume>10e6)s+=20;else if(c.total_volume>2e6)s+=12;const ch=c.price_change_percentage_24h||0;if(ch>-8&&ch<12)s+=12;else if(ch>=12&&ch<30)s+=7;const ath=Math.abs(c.ath_change_percentage||0);if(ath>70&&ath<99)s+=12;else if(ath>50)s+=7;return Math.min(100,Math.round(s))}
function signal(score,c){if((c.total_volume||0)<500000)return['Riesgo extremo','red'];if(score>=78)return['Prioridad','green'];if(score>=62)return['Vigilar','blue'];if(score>=45)return['Esperar','yellow'];return['Débil','red']}
async function refreshAll(){
  const now=Date.now();
  if(now-lastRefreshAt<15000){notify('Espera unos segundos antes de volver a actualizar.','info');return}
  lastRefreshAt=now;const btn=$('#refreshBtn');btn.disabled=true;btn.textContent='Actualizando…';
  const results=await Promise.allSettled([fetchMarkets(),fetchFear(),fetchBtcHistory()]);
  const failed=[];
  if(results[0].status==='rejected')failed.push('precios');
  if(results[1].status==='rejected')failed.push('miedo y codicia');
  if(results[2].status==='rejected')failed.push('histórico BTC');
  updateGauge();renderAll();drawFearChart();checkTargetAlerts();
  const btc=state.market.get('bitcoin');$('#btcPrice').textContent=btc?usd(btc.current_price):'—';$('#btcChange').textContent=btc?pct(btc.price_change_percentage_24h):'—';$('#btcChange').className=(btc?.price_change_percentage_24h||0)>=0?'positive':'negative';
  if(failed.length){notify(`Actualización parcial: no se pudieron renovar ${failed.join(', ')}. Se mantienen los últimos datos guardados.`,'warn')}else notify(`Datos actualizados · Mercado: ${state.providers.market} · Sentimiento: ${state.providers.fear} · BTC: ${state.providers.btc}`,'ok');
  btn.disabled=false;btn.textContent='Actualizar datos';
}
function renderPortfolio(){const long=state.portfolio.filter(p=>p.strategy==='Largo plazo'),scalp=state.portfolio.filter(p=>p.strategy==='Spot rápido');const summary={long:renderPortfolioTable(long,'longRows',false),scalp:renderPortfolioTable(scalp,'scalpRows',true)};const setPnl=(id,pnl,pctv)=>{const el=$(id);el.textContent=`${usd(pnl)} (${pct(pctv)})`;el.className=pnl>=0?'positive':'negative'};$('#longValue').textContent=usd(summary.long.value);setPnl('#longPnl',summary.long.pnl,summary.long.cost?summary.long.pnl/summary.long.cost*100:0);$('#longValueDetail').textContent=usd(summary.long.value);$('#longCost').textContent=usd(summary.long.cost);setPnl('#longPnlDetail',summary.long.pnl,summary.long.cost?summary.long.pnl/summary.long.cost*100:0);$('#scalpValue').textContent=usd(summary.scalp.value);setPnl('#scalpPnl',summary.scalp.pnl,summary.scalp.cost?summary.scalp.pnl/summary.scalp.cost*100:0);$('#scalpCost').textContent=usd(summary.scalp.cost);const budget=+$('#scalpBudgetInput').value||0,free=budget-summary.scalp.cost;$('#scalpAvailable').textContent=usd(free);$('#availableTotal').textContent=usd(free);$('#capitalUsage').textContent=budget?`${Math.round(summary.scalp.cost/budget*100)}% del presupuesto usado`:'Sin presupuesto'}
function renderPortfolioTable(list,tbodyId,isScalp){let value=0,cost=0;$('#'+tbodyId).innerHTML=list.map(p=>{const globalIndex=state.portfolio.indexOf(p),c=state.market.get(p.coinId),price=c?.current_price||0,v=price*p.balance,co=p.entry*p.balance,pnl=v-co,pnlPct=co?pnl/co*100:0;value+=v;cost+=co;const targetPrice=p.entry*(1+(p.target||0)/100),targetHit=isScalp&&price>0&&p.target>0&&price>=targetPrice;const status=targetHit?'<span class="badge green">🎯 Objetivo alcanzado</span>':p.status;return `<tr class="${targetHit?'target-hit':''}"><td><div class="coin-cell">${c?.image?`<img src="${c.image}" alt="">`:''}<b>${p.symbol}</b></div></td><td title="${p.balance}">${quantity(p.balance)}</td><td>${usd(p.entry)}</td><td>${price?usd(price):'—'}</td><td>${price?usd(v):'—'}</td><td class="${pnl>=0?'positive':'negative'}">${price?`${usd(pnl)} (${pct(pnlPct)})`:'—'}</td><td>${p.target?`${p.target}%`:'Bull run'}</td>${isScalp?`<td class="${targetHit?'positive':''}">${p.target?usd(targetPrice):'—'}</td>`:''}<td>${status}</td><td><button class="btn edit-position" data-i="${globalIndex}">Editar</button> <button class="remove delete-position" data-i="${globalIndex}">✕</button></td></tr>`}).join('');return{value,cost,pnl:value-cost}}

function renderScanner(){const max=(+$('#maxMarketCap').value||150)*1e6,min=(+$('#minVolume').value||2)*1e6;const coins=APP_CONFIG.knownUniverse.map(id=>state.market.get(id)).filter(Boolean).filter(c=>c.market_cap<=max&&c.market_cap>=5e6&&c.total_volume>=min).map(c=>({...c,score:scoreCoin(c)})).sort((a,b)=>b.score-a.score);$('#scannerRows').innerHTML=coins.map((c,i)=>{const[label,cls]=signal(c.score,c);return `<tr><td>${i+1}</td><td><div class="coin-cell"><img src="${c.image}" alt=""><b>${c.symbol.toUpperCase()}</b></div></td><td>${usd(c.current_price)}</td><td class="${c.price_change_percentage_24h>=0?'positive':'negative'}">${pct(c.price_change_percentage_24h)}</td><td>${compact(c.market_cap)}</td><td>${compact(c.total_volume)}</td><td>${c.market_cap?(c.total_volume/c.market_cap).toFixed(2):'—'}</td><td class="negative">${pct(c.ath_change_percentage)}</td><td><b>${c.score}</b></td><td><span class="badge ${cls}">${label}</span></td><td><button class="btn add-watch" data-id="${c.id}">+</button></td></tr>`}).join('');$('#scannerMessage').textContent=`${coins.length} monedas cumplen los filtros.`;$$('.add-watch').forEach(b=>b.onclick=()=>addWatch(b.dataset.id))}
function addWatch(id){if(!state.watchlist.includes(id)){state.watchlist.push(id);store.set('watchlist',state.watchlist);renderWatchlist()}}
function renderWatchlist(){$('#watchCards').innerHTML=state.watchlist.map(id=>{const c=state.market.get(id);if(!c)return`<article class="card watch-card"><div class="watch-head"><h3>${id}</h3><button class="remove" data-remove-watch="${id}">✕</button></div><p>Sin datos. Comprueba el ID de CoinGecko.</p></article>`;return`<article class="card watch-card"><div class="watch-head"><div class="coin"><img src="${c.image}" alt=""><h3>${c.symbol.toUpperCase()}</h3></div><button class="remove" data-remove-watch="${id}">✕</button></div><div class="price">${usd(c.current_price)}</div><span class="${c.price_change_percentage_24h>=0?'positive':'negative'}">${pct(c.price_change_percentage_24h)} 24h</span><dl><div><dt>Market cap</dt><dd>${compact(c.market_cap)}</dd></div><div><dt>Volumen</dt><dd>${compact(c.total_volume)}</dd></div><div><dt>Vol/MCap</dt><dd>${c.market_cap?(c.total_volume/c.market_cap).toFixed(2):'—'}</dd></div><div><dt>Score</dt><dd>${scoreCoin(c)}/100</dd></div></dl></article>`}).join('');$$('[data-remove-watch]').forEach(b=>b.onclick=()=>{state.watchlist=state.watchlist.filter(x=>x!==b.dataset.removeWatch);store.set('watchlist',state.watchlist);renderWatchlist()})}
function openPosition(i='',strategy='Largo plazo'){const p=i===''?{coinId:'',symbol:'',strategy,balance:'',entry:'',target:strategy==='Spot rápido'?20:0,status:'Abierta'}:state.portfolio[i];$('#positionIndex').value=i;$('#positionCoinId').value=p.coinId;$('#positionSymbol').value=p.symbol;$('#positionStrategy').value=p.strategy;$('#positionBalance').value=p.balance;$('#positionEntry').value=p.entry;$('#positionTarget').value=p.target;$('#positionStatus').value=p.status;$('#positionDialog').showModal()}
function renderJournal(){$('#journalRows').innerHTML=state.journal.map((j,i)=>`<tr><td>${j.date}</td><td>${j.coin}</td><td>${j.type}</td><td>${j.entry?usd(j.entry):'—'}</td><td>${j.exit?usd(j.exit):'—'}</td><td class="${+j.result>=0?'positive':'negative'}">${j.result!==''?usd(+j.result):'—'}</td><td>${j.notes||''}</td><td><button class="remove delete-journal" data-i="${i}">✕</button></td></tr>`).join('');$$('.delete-journal').forEach(b=>b.onclick=()=>{state.journal.splice(+b.dataset.i,1);store.set('journal',state.journal);renderJournal()})}
function renderAll(){renderPortfolio();renderScanner();renderWatchlist();renderJournal()}
function setupTabs(){$$('.tab').forEach(t=>t.onclick=()=>{$$('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#'+t.dataset.tab).classList.add('active')})}
function buildBackup(){
  const local={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&key.startsWith('aor_'))local[key]=localStorage.getItem(key);
  }
  return {
    app:'Altcoin Opportunity Radar',version:'2.6-final',exportedAt:new Date().toISOString(),
    data:{watchlist:state.watchlist,portfolio:state.portfolio,journal:state.journal,settings:state.settings,scalpBudget:parseFlexibleNumber($('#scalpBudgetInput').value)},
    localStorage:local
  };
}
function downloadJson(data,name){const a=document.createElement('a');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
function exportData(){const day=new Date().toISOString().slice(0,10);downloadJson(buildBackup(),`Altcoin-Radar-TODO-${day}.json`)}
function saveRollbackBackup(){localStorage.setItem('aor_rollbackBackup',JSON.stringify(buildBackup()))}
function applyBackup(d){
  const payload=d?.data||d;
  if(!payload||!Array.isArray(payload.portfolio)||!Array.isArray(payload.watchlist)||!Array.isArray(payload.journal))throw new Error('Formato no válido');
  saveRollbackBackup();
  if(d.localStorage&&typeof d.localStorage==='object')Object.entries(d.localStorage).forEach(([k,v])=>{if(k.startsWith('aor_')&&k!=='aor_rollbackBackup')localStorage.setItem(k,String(v))});
  state.watchlist=payload.watchlist;state.portfolio=payload.portfolio;state.journal=payload.journal;
  state.settings={...state.settings,...(payload.settings||{})};
  store.set('watchlist',state.watchlist);store.set('portfolio',state.portfolio);store.set('journal',state.journal);store.set('settings',state.settings);
  if(payload.scalpBudget!=null){$('#scalpBudgetInput').value=payload.scalpBudget;store.set('scalpBudget',payload.scalpBudget)}
  renderAll();schedule();refreshAll();
}
function importData(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{applyBackup(JSON.parse(r.result));alert('Copia importada correctamente. Se ha guardado una copia anterior por seguridad.')}catch(err){alert('Archivo no válido o incompatible. No se han sustituido tus datos.')}finally{e.target.value=''}};r.readAsText(f)}
function restoreRollback(){try{const raw=localStorage.getItem('aor_rollbackBackup');if(!raw){alert('No hay una copia anterior disponible.');return}const backup=JSON.parse(raw);if(confirm('¿Restaurar el estado anterior a la última importación?')){applyBackup(backup);alert('Copia anterior restaurada.')}}catch{alert('No se pudo restaurar la copia anterior.')}}
function schedule(){if(state.timer)clearInterval(state.timer);if(state.settings.interval)state.timer=setInterval(refreshAll,state.settings.interval)}
function setup(){
  // Corrige una entrada antigua frecuente: Kraken copiado como 26,423.6846 y guardado como 26.4236846.
  if(!store.get('precisionMigrationV24',false)){
    const storj=state.portfolio.find(p=>p.symbol==='STORJ'&&p.balance>20&&p.balance<30&&p.entry>0.04&&p.entry<0.06);
    if(storj)storj.balance*=1000;
    store.set('portfolio',state.portfolio);store.set('precisionMigrationV24',true);
  }
  if(cache.market.length)state.market=new Map(cache.market.map(c=>[c.id,c]));if(cache.fear.length)state.fearHistory=cache.fear;if(cache.btc.length)state.btcHistory=cache.btc;setupTabs();$('#refreshBtn').onclick=refreshAll;$('#enableAlertsBtn').onclick=enableTargetNotifications;updateNotificationButton();$('#settingsBtn').onclick=()=>{$('#apiKeyInput').value=state.settings.apiKey;$('#refreshInterval').value=state.settings.interval;$('#settingsDialog').showModal()};$('#saveSettingsBtn').onclick=()=>{state.settings={apiKey:$('#apiKeyInput').value.trim(),interval:+$('#refreshInterval').value};store.set('settings',state.settings);schedule();setTimeout(refreshAll,100)};$('#watchlistForm').onsubmit=e=>{e.preventDefault();addWatch($('#coinIdInput').value.trim().toLowerCase());$('#coinIdInput').value='';refreshAll()};$$('.add-position').forEach(b=>b.onclick=()=>openPosition('',b.dataset.strategy));$('#positionForm').onsubmit=e=>{e.preventDefault();const p={coinId:$('#positionCoinId').value.trim().toLowerCase(),symbol:$('#positionSymbol').value.trim().toUpperCase(),strategy:$('#positionStrategy').value,balance:parseFlexibleNumber($('#positionBalance').value),entry:parseFlexibleNumber($('#positionEntry').value),target:parseFlexibleNumber($('#positionTarget').value),status:$('#positionStatus').value};if(!Number.isFinite(p.balance)||p.balance<=0||!Number.isFinite(p.entry)||p.entry<=0){alert('Revisa la cantidad y el precio medio. Puedes usar 26423.6846, 26.423,6846 o 26,423.6846.');return;}const i=$('#positionIndex').value;if(i==='')state.portfolio.push(p);else state.portfolio[+i]=p;store.set('portfolio',state.portfolio);$('#positionDialog').close();renderPortfolio();refreshAll()};document.body.addEventListener('click',e=>{const ed=e.target.closest('.edit-position'),del=e.target.closest('.delete-position');if(ed)openPosition(+ed.dataset.i);if(del){state.portfolio.splice(+del.dataset.i,1);store.set('portfolio',state.portfolio);renderPortfolio()}});$('#addJournalBtn').onclick=()=>{$('#journalDate').value=new Date().toISOString().slice(0,10);$('#journalDialog').showModal()};$('#journalForm').onsubmit=e=>{e.preventDefault();state.journal.unshift({date:$('#journalDate').value,coin:$('#journalCoin').value,type:$('#journalType').value,entry:$('#journalEntry').value,exit:$('#journalExit').value,result:$('#journalResult').value,notes:$('#journalNotes').value});store.set('journal',state.journal);$('#journalDialog').close();e.target.reset();renderJournal()};$$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());$('#scalpBudgetInput').value=store.get('scalpBudget',1500);$('#scalpBudgetInput').oninput=e=>{store.set('scalpBudget',+e.target.value);renderPortfolio()};['maxMarketCap','minVolume'].forEach(id=>$('#'+id).oninput=renderScanner);$$('.range-btn').forEach(b=>b.onclick=()=>{$$('.range-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.chartRange=+b.dataset.range;drawFearChart()});$('#exportBtn').onclick=exportData;$('#importInput').onchange=importData;$('#quickExportBtn').onclick=exportData;$('#quickImportInput').onchange=importData;$('#restoreBackupBtn').onclick=restoreRollback;window.addEventListener('resize',()=>requestAnimationFrame(drawFearChart));schedule();renderAll();refreshAll()}
document.addEventListener('DOMContentLoaded',setup);
