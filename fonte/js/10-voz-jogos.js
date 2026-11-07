// Status, conversa por voz, tradução, jogos de letras e perfis
// ================= Status, compatibilidade, conversa por voz, jogos, perfis =================
function updStatus(){
  const ble=!!(device&&device.gatt&&device.gatt.connected);
  const mode = ble&&camOn ? ['🔀','Híbrido'] : ble ? ['🧤','Hardware'] : camOn ? ['📷','Software'] : ['⏸','Nenhum'];
  const ago = lastGlove ? Math.round((Date.now()-lastGlove)/1000) : null;
  $('stMode').textContent = `${mode[0]} Modo: ${mode[1]}`;
  $('stBle').textContent = ble ? '🟢 Luva conectada' : '❌ Luva desconectada';
  $('stData').textContent = !ble ? '📡 –' : ago===null ? '📡 aguardando dados' : ago<4 ? '📡 dados em tempo real' : `📡 sem dados há ${ago} s`;
  $('stBat').textContent = '🔋 '+(!ble ? '–' : batLevel===null ? 'bateria não informada' : batLevel+'%');
  $('stCam').textContent = camOn ? '📷 Câmera ligada' : '📷 Câmera desligada';
}
setInterval(updStatus,1000); updStatus();

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
(function(){
  const CAP=[['Câmera',!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)],['Bluetooth (luva)',!!navigator.bluetooth],['Ouvir e traduzir',!!SR],['Voz (fala)',!!synth]];
  $('compat').innerHTML = CAP.map(([n,ok])=>`<span class="chip ${ok?'ok':''}">${ok?'✔':'✖'} ${n}</span>`).join('')
    + (navigator.bluetooth?'':' <small style="color:var(--mut)">Sem Bluetooth neste navegador: use a câmera, ou o Chrome/Edge (Android e computador), ou o app Bluefy no iPhone.</small>')
    + (SR?'':' <small style="color:var(--mut)">Sem reconhecimento de voz aqui: dá para digitar o texto para traduzir.</small>');
})();

// ---- conversa: escutar e traduzir ----
$('spLang').innerHTML = LANGS.map((l,i)=>`<option value="${i}">${l[0]} ${l[1]}</option>`).join('');
async function translateText(text,from,to){
  if (from===to) return text;
  try{ if ('Translator' in self){ const o={sourceLanguage:from,targetLanguage:to}; if ((await Translator.availability(o))!=='unavailable') return await (await Translator.create(o)).translate(text); } }catch(e){}
  try{ const r=await fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+encodeURIComponent(from+'|'+to)); const j=await r.json(), t=j.responseData&&j.responseData.translatedText; if(t&&!/MYMEMORY WARNING|INVALID/i.test(t)) return t; }catch(e){}
  return null;
}
async function doTr(text){
  text=text.trim(); if(!text) return;
  $('spOrig').textContent=text; $('spTr').textContent='…';
  const t=await translateText(text,LANGS[+$('spLang').value][2].slice(0,2),LANGS[vLang][2].slice(0,2));
  $('spTr').textContent=t||text;
  $('spMsg').textContent=t?'':'Não consegui traduzir (sem internet?). Mostrando o texto original.';
}
let spRec=null;
$('btnListen').onclick=()=>{
  if(!SR){ $('spMsg').textContent='Este navegador não tem reconhecimento de voz (use Chrome, Edge ou Safari). Digite o texto abaixo.'; return; }
  if(spRec){ spRec.stop(); return; }
  const r=spRec=new SR(); r.lang=LANGS[+$('spLang').value][2]; r.interimResults=true; r.continuous=false;
  r.onstart=()=>{ $('btnListen').textContent='⏹ Ouvindo...'; $('spMsg').textContent=''; };
  r.onresult=e=>{ let txt='',fin=false; for(const x of e.results){ txt+=x[0].transcript; if(x.isFinal) fin=true; } $('spOrig').textContent=txt; if(fin) doTr(txt); };
  r.onerror=e=>{ $('spMsg').textContent = e.error==='not-allowed' ? 'Permita o microfone no navegador.' : e.error==='no-speech' ? 'Não ouvi nada. Tente de novo.' : 'Erro no microfone: '+e.error; };
  r.onend=()=>{ spRec=null; $('btnListen').textContent='🎤 Escutar e traduzir'; };
  r.start();
};
$('btnSpTr').onclick=()=>doTr($('spIn').value);
$('spSpeak').onclick=()=>speak($('spTr').textContent,vLang);

// ---- jogos de tempo ----
const GAMES={letras:['Corrida das letras (60 s)',60],palavras:['Soletrar palavras (90 s)',90],sinais:['Sinais com movimento (60 s)',60],quiz:['Quiz de tradução (60 s)',60]};
$('gmSel').innerHTML=Object.entries(GAMES).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('');
const gmMsg=m=>$('gmMsg').textContent=m;
const gmPts=()=>$('gmScore').textContent=game.score+' pts';
const letterPool=()=>[...new Set([...'ABCDEFGILMNOQRUVWY',...SAMPLES.map(x=>x.L).filter(x=>/^[A-Z]$/.test(x))])];
const rnd=a=>a[Math.random()*a.length|0];
function gmShowImg(L){ const im=IMG[(L||'').toLowerCase()]; $('gmImg').style.display=im?'block':'none'; if(im) $('gmImg').src=im; }
function gmNext(){
  $('gmOpts').innerHTML='';
  if(game.type==='letras'){ const p=letterPool(); const t=pickWeighted(p,game.target); game.target=t; $('gmT').textContent=t; gmShowImg(t); gmMsg('Faça a letra'); }
  else if(game.type==='palavras'){
    const p=letterPool(), ws=game.pool ? WORDS.filter(w=>game.pool.includes(w.k)) : WORDS.filter(w=>!w.n&&w.k.length>=2&&w.k.length<=6&&[...w.k].every(c=>p.includes(c)));
    if(!ws.length){ gmMsg('Treine mais letras para jogar este jogo.'); gmEnd(true,true); return; }
    game.target=rnd(ws).k; game.idx=0; gmShow();
  }
  else if(game.type==='sinais'){
    const tr=[...new Set(SIGNSAMP.map(x=>x.S))], bi=['parar','família','seis sete'].filter(b=>!tr.some(t=>norm(t)===norm(b)));
    const p=tr.map(s=>({s,b:false})).concat(bi.map(s=>({s,b:true})));
    let it; do{ it=rnd(p) }while(it.s===game.S&&p.length>1);
    game.S=it.s; game.builtin=it.b; game.target=norm(it.s).replace(/[^A-Z]/g,'');
    $('gmT').textContent=it.s; gmShowImg(''); gmMsg(it.b?'Faça este sinal (gesto do site)':'Faça o sinal que você gravou');
  }
  else{
    const ti = vLang || (1+(Math.random()*4|0)), pool=WORDS.filter(w=>!w.n&&w.t[ti]!==w.t[0]), w=rnd(pool), ans=w.t[ti], opts=new Set([ans]); let g=0;
    while(opts.size<4&&g++<60) opts.add(rnd(pool).t[ti]);
    game.target=ans; $('gmT').textContent=w.t[0]; gmShowImg(''); gmMsg(LANGS[ti][0]+' Como se diz em '+LANGS[ti][1]+'?');
    $('gmOpts').innerHTML=[...opts].sort(()=>Math.random()-.5).map(o=>`<button data-qz="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('');
  }
  gmPts();
}
function gmShow(){ const t=game.target; $('gmT').innerHTML=`<span style="color:var(--ok)">${t.slice(0,game.idx)}</span>${t.slice(game.idx)}`; gmShowImg(t[game.idx]); gmMsg('Soletre a palavra, letra por letra'); }
function gameFeed(tok){
  if(!game.on) return; tok=norm(tok).replace(/[^A-Z0-9]/g,'');
  if(game.type==='palavras'){
    if(tok===game.target[game.idx]){ recordResult(tok,true); learnLetter(tok); game.idx++; if(game.idx>=game.target.length){ game.score+=game.target.length; gmMsg('✅ '+game.target); gmNext(); } else gmShow(); gmPts(); }
  } else if(game.type!=='quiz' && tok===game.target){ game.score++; if(game.type==='letras'){ recordResult(tok,true); learnLetter(tok); } else hit(); gmMsg('✅ Certo!'); gmNext(); }
}
function gameTick(L){   // letras da câmera: segurar 0,6 s
  if(!game.on||game.type==='quiz'||game.type==='sinais') return;
  const now=performance.now();
  if(!L){ game.hold=null; game.lock=false; return; }
  if(L!==game.hold){ game.hold=L; game.t0=now; game.lock=false; return; }
  if(!game.lock&&now-game.t0>=450){ game.lock=true; gameFeed(L); }
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-qz]'); if(!b||!game.on||game.type!=='quiz'||game.busy) return;
  game.busy=true; const ok=b.dataset.qz===game.target;
  document.querySelectorAll('#gmOpts button').forEach(x=>{ if(x.dataset.qz===game.target) x.classList.add('qz-ok'); });
  if(ok){ game.score++; gmPts(); hit(); } else b.classList.add('qz-bad');
  gmMsg(ok?'✅ Certo!':'❌ Era: '+game.target);
  setTimeout(()=>{
    game.busy=false; if(!game.on) return;
    if(!ok&&game.hc){ gmMsg('❌ Errou: fim de jogo no modo hardcore. Pontos: '+game.score); gmEnd(false,true); }
    else gmNext();
  }, ok?600:1100);
});
function gmTimer(){ const left=Math.max(0,(game.end-performance.now())/1000); $('gmTime').textContent=Math.ceil(left)+' s'; if(left<=0) gmEnd(false); }
function gmEnd(manual,keep){
  clearInterval(game.timer); const was=game.on; game.on=false; game.pool=null; $('btnGm').textContent='Começar jogo';
  if(!was) return;
  if(!manual && game.score>0) rankAdd(game.type+(game.hc?'hc':''),game.score);
  if(!keep) gmMsg('Fim de jogo! Pontos: '+game.score);
  renderRank();
}
$('btnGm').onclick=()=>{
  if(mp.mode==='race'&&mp.conn&&mp.conn.open){ if(mp.host){ if(mp.live) cmpStop(); else cmpStart(); } else toast('Só o anfitrião começa a corrida. Deixe a câmera ligada.'); return; }
  if(game.on){ gmEnd(true); return; }
  const type=$('gmSel').value;
  if(type!=='quiz' && !camOn && !(device&&device.gatt&&device.gatt.connected)){ gmMsg('Ligue a câmera ou conecte a luva para este jogo.'); return; }
  Object.assign(game,{on:true,type,hc:type==='quiz'&&$('gmMode').value==='hc',busy:false,S:null,builtin:false,score:0,end:performance.now()+GAMES[type][1]*1000,idx:0,lock:false,hold:null,target:null});
  $('btnGm').textContent='Parar'; gmNext(); game.timer=setInterval(gmTimer,200); gmTimer();
};
const rankGet=()=>{ try{ return JSON.parse(localStorage.getItem('linkglove_rank')||'{}') }catch(e){ return {} } };
function rankAdd(type,score){
  const name=(prompt('Pontos: '+score+'. Seu nome para o ranking:',PROF||'Jogador')||'').trim()||'Jogador', R=rankGet();
  (R[type]=R[type]||[]).push({n:name,s:score,d:new Date().toLocaleDateString('pt-BR')});
  R[type].sort((a,b)=>b.s-a.s); R[type]=R[type].slice(0,10);
  try{ localStorage.setItem('linkglove_rank',JSON.stringify(R)) }catch(e){}
}
function renderRank(){
  const sel=$('gmSel').value, t=sel+(sel==='quiz'&&$('gmMode').value==='hc'?'hc':''), L=(rankGet()[t]||[]);
  $('gmRank').innerHTML=L.length?'<ol style="padding-left:20px">'+L.map(x=>`<li>${x.n}: <b>${x.s}</b> <small style="color:var(--mut)">${x.d}</small></li>`).join('')+'</ol>':'<small style="color:var(--mut)">Ainda sem pontuações neste jogo.</small>';
}
const gmUpd=()=>{ $('gmMode').style.display=$('gmSel').value==='quiz'?'':'none'; renderRank(); };
$('gmSel').onchange=gmUpd; $('gmMode').onchange=renderRank; gmUpd();

// ---- perfis de treino ----
const PROFS=(()=>{ try{ return JSON.parse(localStorage.getItem('linkglove_perfis')||'[]') }catch(e){ return [] } })();
$('profSel').innerHTML=['',...PROFS].map(n=>`<option value="${n}" ${n===PROF?'selected':''}>${n||'(padrão)'}</option>`).join('');
$('profSel').onchange=e=>{ try{ localStorage.setItem('linkglove_perfil',e.target.value) }catch(err){} location.reload(); };
$('btnProf').onclick=()=>{
  const n=(prompt('Nome do novo perfil (ex.: Ana):')||'').trim().replace(/[^\wÀ-ÿ-]/g,''); if(!n) return;
  if(!PROFS.includes(n)) PROFS.push(n);
  try{ localStorage.setItem('linkglove_perfis',JSON.stringify(PROFS)); localStorage.setItem('linkglove_perfil',n); }catch(err){}
  location.reload();
};

