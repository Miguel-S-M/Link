// Abas, senhas, treino, prática, frases, sinais, tela cheia
// ================= Abas, treino, prática, frases, sinais, tela cheia =================
const cyrb53=(str,seed=0)=>{let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0)};
let cfgUnlocked = false; try{ cfgUnlocked = sessionStorage.getItem('linkglove_cfg')==='1' }catch(e){}
// Cada aba só funciona enquanto está aberta: ao sair, o que ela estava fazendo é interrompido e a entrada (luva/câmera) deixa de chegar nela.
let curTab = 'tr';
function tabLeave(prev){
  try{
    if (prev==='tr'){ clearTimeout(idleT); if (spRec) spRec.stop(); try{ synth.cancel() }catch(e){} held=null; sentLetter=false; buf=[]; }
    else if (prev==='games'){ stopGames(); }
    else if (prev==='study'){ if (les.on) lsClose(); }
    else if (prev==='cfg'){
      rec=null;
      if (gd){ gd.stop=true; gd=null; $('btnGuide').textContent='Iniciar treino guiado'; gdMsg('Treino interrompido: você saiu da aba.'); }
      if (acc.on){ acc.on=false; $('btnAcc').textContent='Iniciar teste'; $('acMsg').textContent='Teste interrompido: você saiu da aba.'; }
    }
  }catch(e){ console.warn('tabLeave', e); }
  hist=[]; gestLock=0;
}
function goTab(t){
  if (t!==curTab){ const prev=curTab; curTab=t; tabLeave(prev); }
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x.dataset.tab===t));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='tab-'+t));
}
// Senha da aba "Configurar alfabeto": cada pessoa cria a sua, guardada só neste dispositivo (hash com sal; não vai para a internet).
// Não é segurança forte (os dados ficam no próprio navegador), serve para evitar mexidas sem querer.
const PW_KEY='linkglove_cfgpw';
const pwGet=()=>{ try{ return JSON.parse(localStorage.getItem(PW_KEY)||'null') }catch(e){ return null } };
const pwHex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function pwHash(pw,salt,alg){
  if(alg==='pbkdf2'){
    const enc=new TextEncoder(), key=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveBits']);
    return pwHex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:enc.encode(salt),iterations:150000},key,256));
  }
  return cyrb53(salt+'|'+pw).toString(16);
}
async function pwMake(pw){
  const salt=pwHex(crypto.getRandomValues(new Uint8Array(16))), alg=(window.crypto&&crypto.subtle)?'pbkdf2':'cyrb';
  return {alg,salt,h:await pwHash(pw,salt,alg)};
}
async function pwCheck(pw){ const r=pwGet(); if(!r) return false; try{ return (await pwHash(pw,r.salt,r.alg))===r.h; }catch(e){ return false; } }
let pwMode='enter';
function askPw(mode){
  pwMode=mode||(pwGet()?'enter':'create');
  const c=pwMode==='create', ch=pwMode==='change';
  $('pwTitle').textContent=c?'Crie sua senha':ch?'Trocar senha':'Área protegida';
  $('pwDesc').textContent=c?'Escolha uma senha (mínimo 4 caracteres) para proteger "Configurar alfabeto". Ela fica só neste dispositivo e cada pessoa cria a sua.':ch?'Digite a senha atual e escolha a nova.':'Digite a sua senha para entrar em "Configurar alfabeto".';
  $('pwOld').style.display=ch?'':'none'; $('pwIn2').style.display=(c||ch)?'':'none'; $('pwForgot').style.display=pwMode==='enter'?'':'none';
  $('pwIn').placeholder=(c||ch)?'Nova senha':'Senha'; $('pwOk').textContent=c?'Criar senha e entrar':ch?'Salvar nova senha':'Entrar';
  ['pwOld','pwIn','pwIn2'].forEach(i=>$(i).value=''); $('pwMsg').textContent='';
  $('pwDlg').showModal(); setTimeout(()=>$(ch?'pwOld':'pwIn').focus(),50);
}
function pwUnlock(){ cfgUnlocked=true; try{ sessionStorage.setItem('linkglove_cfg','1') }catch(e){} $('pwDlg').close(); goTab('cfg'); }
async function tryPw(){
  const a=$('pwIn').value.trim(), msg=t=>{ $('pwMsg').textContent=t; };
  if(pwMode==='enter'){ if(await pwCheck(a)) pwUnlock(); else { msg('Senha incorreta.'); $('pwIn').select(); } return; }
  if(pwMode==='change'&&!(await pwCheck($('pwOld').value.trim()))){ msg('A senha atual está incorreta.'); return; }
  if(a.length<4){ msg('Use pelo menos 4 caracteres.'); return; }
  if(a!==$('pwIn2').value.trim()){ msg('As duas senhas não são iguais.'); return; }
  try{ localStorage.setItem(PW_KEY,JSON.stringify(await pwMake(a))); }catch(e){ msg('Não consegui salvar a senha: o armazenamento deste navegador está bloqueado.'); return; }
  if(pwMode==='create') pwUnlock(); else { $('pwDlg').close(); toast('🔑 Senha alterada.'); }
}
$('pwOk').onclick=tryPw; $('pwCancel').onclick=()=>$('pwDlg').close();
['pwOld','pwIn','pwIn2'].forEach(id=>$(id).addEventListener('keydown',e=>{ if(e.key==='Enter') tryPw(); }));
$('pwForgot').onclick=()=>{
  const t=prompt('Se você esqueceu a senha, é preciso APAGAR o treino do alfabeto e os sinais gravados neste dispositivo (de todos os perfis) para criar uma nova senha.\n\nDigite APAGAR para confirmar:');
  if(!t||t.trim().toUpperCase()!=='APAGAR') return;
  try{ Object.keys(localStorage).filter(k=>/^linkglove_(amostras|sinais|calib)/.test(k)).forEach(k=>localStorage.removeItem(k)); localStorage.removeItem(PW_KEY); sessionStorage.removeItem('linkglove_cfg'); }catch(e){}
  location.reload();
};
$('btnPwChange').onclick=()=>askPw(pwGet()?'change':'create');
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{
  if (b.dataset.tab==='cfg' && !cfgUnlocked){ askPw(); return; }
  goTab(b.dataset.tab);
});
$('btnLock').onclick=()=>{ cfgUnlocked=false; try{ sessionStorage.removeItem('linkglove_cfg') }catch(e){} goTab('tr'); };
const kk = x => norm(x).replace(/[^A-Z]/g,'');
const LABELS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ','EU','TUDO BEM',...'0123456789'];
$('trL').innerHTML = LABELS.map(x=>`<option>${x}</option>`).join('');
function trInfo(){
  const c={}; SAMPLES.forEach(x=>c[x.L]=(c[x.L]||0)+1);
  $('trMap').innerHTML = LABELS.map(k=>`<span class="chip ${c[k]>=10?'ok':''}">${k}${c[k]?' '+c[k]:''}</span>`).join('');
  $('trInfo').textContent = SAMPLES.length ? 'Total de gravações: '+SAMPLES.length : 'Nenhuma gravação ainda.';
}
function trSave(){ try{ localStorage.setItem(pk('linkglove_amostras'), JSON.stringify(SAMPLES)) }catch(e){} }
$('btnRec').onclick = () => {
  if (!camOn){ camMsg('Ligue a câmera antes de gravar.'); return; }
  rec = {L:$('trL').value, until:performance.now()+1500};
  $('btnRec').disabled = true; $('btnRec').textContent = 'Gravando '+rec.L+'...';
  setTimeout(()=>{ rec=null; $('btnRec').disabled=false; $('btnRec').textContent='Gravar 1,5 s'; trSave(); trInfo(); }, 1600);
};
$('btnTrOne').onclick = () => {
  const L=$('trL').value, n=SAMPLES.filter(x=>x.L===L).length;
  if (!n){ trInfo(); $('trInfo').textContent='Não há gravações da letra "'+L+'".'; return; }
  if (!confirm('Apagar as '+n+' gravações de "'+L+'"?')) return;
  for (let i=SAMPLES.length-1;i>=0;i--) if (SAMPLES[i].L===L) SAMPLES.splice(i,1);
  trSave(); trInfo(); $('trInfo').textContent+=' · Treino de "'+L+'" apagado.';
};
$('btnTrClear').onclick = () => { if(confirm('Apagar todo o treino?')){ SAMPLES.length=0; trSave(); trInfo(); } };
$('btnExp').onclick = () => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify({a:SAMPLES,s:SIGNSAMP,c:CUSTOM})],{type:'application/json'})); a.download='treino-linkglove.json'; a.click(); };
$('btnImp').onclick = () => $('fileImp').click();
$('fileImp').onchange = async e => {
  try{
    const obj = JSON.parse(await e.target.files[0].text()), arr = Array.isArray(obj) ? obj : obj.a;
    if(!Array.isArray(arr)) throw 0;
    if(Array.isArray(obj.s)){ obj.s.filter(x=>x&&typeof x.S==='string'&&Array.isArray(x.v)&&x.v.length===12).forEach(x=>SIGNSAMP.push(x)); sgSave(); sgInfo(); }
    if(Array.isArray(obj.c)){ obj.c.filter(c=>c&&Array.isArray(c.t)&&c.t.length===5).forEach(c=>{ if(!CUSTOM.some(x=>x.t[0]===c.t[0])){ CUSTOM.push(c); addCustomWord(c); } }); saveCustom(); renderSgSel(); }
    arr.filter(x=>x&&typeof x.L==='string'&&Array.isArray(x.f)&&(x.f.length===10||x.f.length===12)).forEach(x=>SAMPLES.push(x));
    trSave(); trInfo();
  }catch(err){ camMsg('Arquivo de treino inválido.') }
  e.target.value='';
};
trInfo();

// ---- treino guiado ----
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const gdMsg = m => $('gdMsg').textContent = m;
function showGd(L){ const im=IMG[L.toLowerCase()]; $('gdT').innerHTML=(im?`<img src="${im}" alt="" style="width:100%;max-width:200px;border-radius:10px;display:block;margin:0 auto 6px">`:'')+`<b>${L}</b>`; }
$('btnGuide').onclick = async () => {
  if (gd){ gd.stop=true; gd=null; $('btnGuide').textContent='Iniciar treino guiado'; gdMsg('Treino interrompido.'); return; }
  if (!camOn){ camMsg('Ligue a câmera antes.'); return; }
  const me = gd = {stop:false}, seq = [...'ABCDEFGHILMNOPQRSTUVWXY', ...($('gdNum').checked?'0123456789':'')];
  $('btnGuide').textContent='Parar treino';
  for (const L of seq){
    for (let tries=0; tries<3; tries++){
      if (me.stop) return;
      showGd(L);
      for (let c=3;c>0;c--){ gdMsg(`Faça ${L} e segure... ${c}`); await sleep(1000); if(me.stop) return; }
      const n0=recN; rec={L,until:performance.now()+1500}; gdMsg('Gravando '+L+'...'); await sleep(1600); rec=null;
      if (recN-n0>=5){ trSave(); trInfo(); gdMsg('✔ '+L+' gravado'); await sleep(500); break; }
      gdMsg('Não vi a sua mão. Vamos repetir...'); await sleep(900);
    }
  }
  gd=null; $('btnGuide').textContent='Iniciar treino guiado'; gdMsg('Treino concluído! 🎉'); $('gdT').textContent='✅';
};

// ---- prática ----
const pracMsg = m => $('pracMsg').textContent = m;
function pracNext(){
  const num = $('pracMode').value==='N', trained=[...new Set(SAMPLES.map(x=>x.L))];
  const base=[...new Set([...'ABCDEFGILMNOQRUVWY',...trained.filter(x=>/^[A-Z]$/.test(x))])], rev=base.filter(L=>(STATS[L]||{miss:0}).miss>0);
  const pool = num ? trained.filter(x=>/^\d$/.test(x)) : ($('pracMode').value==='R'&&rev.length ? rev : base);
  if (!pool.length){ prac.on=false; $('btnPrac').textContent='Começar prática'; pracMsg('Nenhum número treinado ainda.'); return; }
  const t=pickWeighted(pool,prac.t);
  prac.t=t; prac.t0=0; prac.lock=false; prac.t1=performance.now();
  const im=IMG[t.toLowerCase()]; $('pracImg').style.display=(im&&!num)?'block':'none'; if(im) $('pracImg').src=im;
  $('pracT').textContent=t; pracMsg(`Faça ${num?'o número':'a letra'} ${t}`);
}
function practiceTick(L){
  if (!prac.on||prac.lock) return;
  const now=performance.now();
  if (L===prac.t){
    if (!prac.t0) prac.t0=now;
    if (now-prac.t0>=700){ prac.lock=true; prac.score++; recordResult(prac.t,true); learnLetter(prac.t); pracMsg('✅ Correto! Acertos: '+prac.score); setTimeout(()=>{ if(prac.on) pracNext() },1000); }
  } else { prac.t0=0; pracMsg(`Faça ${prac.t} (vendo: ${L||'–'})`); if (now-prac.t1>8000){ prac.lock=true; recordResult(prac.t,false); pracMsg('⏱ Tempo! Era '+prac.t); setTimeout(()=>{ if(prac.on) pracNext() },1200); } }
}
$('btnPrac').onclick = () => {
  if (prac.on){ prac.on=false; $('btnPrac').textContent='Começar prática'; pracMsg('Prática encerrada. Acertos: '+prac.score); return; }
  if (!camOn){ camMsg('Ligue a câmera antes.'); return; }
  prac.on=true; prac.score=0; prac.t=null; $('btnPrac').textContent='Parar prática'; pracNext();
};

// ---- frases rápidas ----
const QP = `bom dia|buenos días|buongiorno|guten Morgen|good morning
boa tarde|buenas tardes|buon pomeriggio|guten Tag|good afternoon
boa noite|buenas noches|buonanotte|gute Nacht|good night
tudo bem?|¿todo bien?|tutto bene?|alles gut?|all good?
meu nome é...|me llamo...|mi chiamo...|ich heiße...|my name is...
eu sou surdo|soy sordo|sono sordo|ich bin gehörlos|I am deaf
você entende Libras?|¿entiendes Libras?|capisci la Libras?|verstehst du Libras?|do you understand Libras?
pode repetir?|¿puedes repetir?|puoi ripetere?|kannst du das wiederholen?|can you repeat?
preciso de ajuda|necesito ayuda|ho bisogno di aiuto|ich brauche Hilfe|I need help
onde fica o banheiro?|¿dónde está el baño?|dov'è il bagno?|wo ist die Toilette?|where is the bathroom?
quanto custa?|¿cuánto cuesta?|quanto costa?|was kostet das?|how much is it?
eu quero água|quiero agua|voglio acqua|ich möchte Wasser|I want water
estou com dor|me duele|ho dolore|ich habe Schmerzen|I am in pain
chame um médico|llama a un médico|chiama un medico|rufen Sie einen Arzt|call a doctor
obrigado, tchau!|¡gracias, adiós!|grazie, ciao!|danke, tschüss!|thank you, bye!`.split('\n').map(l=>l.split('|'));
$('qp').innerHTML = QP.map((q,i)=>`<button data-qp="${i}">${q[0]}</button>`).join('');
const sinalURL = t => 'https://www.youtube.com/results?search_query='+encodeURIComponent('sinal de '+t+' em Libras');
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-qp]'); if(!b) return;
  const q=QP[+b.dataset.qp];
  $('qpOut').innerHTML = LANGS.map((l,i)=>`<div>${l[0]} <b>${q[i]}</b></div>`).join('')+`<div style="margin-top:8px"><a target="_blank" rel="noopener" href="${sinalURL(q[0])}">🎬 ver como fazer o sinal</a></div>`;
  speak(q[vLang],vLang);
});

// ---- 30 palavras-chave com o sinal ----
const KEY = ['oi','olá','tchau','obrigado','sim','tudo bem','não','eu','você','família','amor','casa','comer','beber'];
$('keys').innerHTML = KEY.map(k=>`<button data-kw="${k}">${k}</button>`).join('');
const sinais = (()=>{ try{ return JSON.parse(localStorage.getItem('linkglove_sinais')||'{}') }catch(e){ return {} } })();
let kwNow = null;
// [forma da mão, local, movimento, nº de mãos, descrição] – esquemas aproximados, só dos sinais de que tenho mais certeza
const SIGNS = {
 'oi':['B','lado','aceno',1,'Mão aberta ao lado do rosto, acenando.'],
 'olá':['B','lado','aceno',1,'Mão aberta ao lado do rosto, acenando.'],
 'tchau':['B','frente','aceno',1,'Mão aberta à frente, acenando.'],
 'obrigado':['B','queixo','afasta',1,'Mão aberta toca o queixo e se afasta para a frente.'],
 'sim':['A','frente','baixo',1,'Mão fechada balança para baixo, como um aceno de "sim".'],
 'não':['D','frente','aceno',1,'Indicador levantado balança de um lado para o outro.'],
 'eu':['D','peito','toque',1,'Indicador aponta para o próprio peito.'],
 'você':['D','frente','afasta',1,'Indicador aponta para a pessoa à sua frente.'],
 'família':['F','frente','circ',2,'As duas mãos em F fazem um círculo à frente do peito, abrindo e se juntando.'],
 'tudo bem':['A','frente','afasta',1,'Mão fechada com o polegar para cima, à frente do corpo (joinha).'],
 'amor':['A','peito','toque',2,'Os braços se cruzam sobre o peito, com as mãos fechadas.'],
 'casa':['B','frente','toque',2,'As duas mãos abertas se encontram em forma de telhado.'],
 'comer':['O','boca','toque',1,'Dedos juntos tocam a boca, como levar comida.'],
 'beber':['C','boca','cima',1,'Mão em C vai à boca e inclina, como beber de um copo.']
};
function drawSign([h,loc,mv,n,cap]){
  const [x,y]={lado:[96,34],frente:[60,118],queixo:[60,57],boca:[60,47],peito:[60,108]}[loc], V={baixo:[0,22],cima:[0,-22],afasta:[16,20]}[mv];
  let m=(n===2&&loc!=='lado'?[[x-16,y],[x+16,y]]:[[x,y]]).map(([a,b])=>`<circle cx="${a}" cy="${b}" r="6" fill="#ffb454"/>`).join('');
  if(V) m+=`<line x1="${x}" y1="${y}" x2="${x+V[0]}" y2="${y+V[1]}" stroke="#5eead4" stroke-width="3" marker-end="url(#ah)"/>`;
  if(mv==='aceno') m+=`<line x1="${x-16}" y1="${y+14}" x2="${x+16}" y2="${y+14}" stroke="#5eead4" stroke-width="3" marker-start="url(#ah)" marker-end="url(#ah)"/>`;
  if(mv==='circ') m+=`<circle cx="${x}" cy="${y}" r="20" fill="none" stroke="#5eead4" stroke-width="3" stroke-dasharray="5 4"/>`;
  if(mv==='toque') m+=`<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#5eead4" stroke-width="2"/>`;
  return `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 120 150" width="120" role="img" aria-label="Local e movimento do sinal"><defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#5eead4"/></marker></defs><circle cx="60" cy="35" r="22" fill="#2c3260"/><path d="M12 150Q12 88 60 88Q108 88 108 150Z" fill="#2c3260"/>${m}</svg><div style="flex:1;min-width:140px"><img src="${IMG[h.toLowerCase()]}" alt="Forma da mão ${h}" style="width:110px;border-radius:8px"><p style="margin-top:6px">${cap}</p><small style="color:var(--mut)">Forma da mão: ${h}${n===2?' (as duas mãos)':''}. Esquema aproximado: confira no vídeo.</small></div></div>`;
}
function openSign(k){
  const w = WORDS.find(x=>x.k===kk(k)); kwNow=k; if(!w) return;
  $('sgTitle').textContent = w.t[0];
  $('sgTr').innerHTML = LANGS.map((l,i)=>`${l[0]} ${w.t[i]}`).join(' &nbsp; ');
  const im = sinais[k], sg = SIGNS[k]; $('sgImg').style.display = im?'block':'none'; if(im) $('sgImg').src=im; $('sgDraw').innerHTML = (!im&&sg) ? drawSign(sg) : ''; $('sgNone').style.display = (im||sg)?'none':'block';
  if(!$('signDlg').open) $('signDlg').showModal();
}
document.addEventListener('click',e=>{ const b=e.target.closest('[data-kw]'); if(b) openSign(b.dataset.kw) });
$('sgClose').onclick = () => $('signDlg').close();
$('sgVid').onclick = () => window.open(sinalURL(kwNow),'_blank','noopener');
$('sgSpeak').onclick = () => { const w=WORDS.find(x=>x.k===kk(kwNow)); if(w) speak(w.t[vLang],vLang) };
$('sgAdd').onclick = () => $('sgFile').click();
$('sgFile').onchange = e => {
  const f=e.target.files[0]; if(!f) return;
  const img=new Image(); img.onload=()=>{
    const sc=Math.min(1,360/Math.max(img.width,img.height)), c=document.createElement('canvas');
    c.width=img.width*sc; c.height=img.height*sc; c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    sinais[kwNow]=c.toDataURL('image/jpeg',0.8);
    try{ localStorage.setItem('linkglove_sinais',JSON.stringify(sinais)) }catch(err){ camMsg('Sem espaço para guardar a imagem.') }
    openSign(kwNow);
  };
  img.src=URL.createObjectURL(f); e.target.value='';
};
$('sgDel').onclick = () => { delete sinais[kwNow]; try{ localStorage.setItem('linkglove_sinais',JSON.stringify(sinais)) }catch(err){} $('sgImg').style.display='none'; $('sgNone').style.display='block'; };

// ---- tela cheia da câmera ----
$('stSel').innerHTML = LANGS.map((l,i)=>`<option value="${i}">${l[0]} ${l[1]}</option>`).join('');
$('stSel').onchange = e => { vLang=+e.target.value; updateVoiceSelect(); translate(); };
$('stSpeak').onclick = () => speakPhrase(vLang);
$('btnExit').onclick = () => { if(document.fullscreenElement) document.exitFullscreen() };
$('btnFull').onclick = async () => {
  const el=$('camStage');
  try{ await (el.requestFullscreen||el.webkitRequestFullscreen).call(el) }catch(err){ camMsg('Não foi possível abrir em tela cheia.'); return; }
  if (!camOn) camStart();
};


// ---- treino de sinais ----
// sinais criados por você (guardados por perfil); entram no dicionário para corrigir e traduzir
let CUSTOM = []; try{ CUSTOM = JSON.parse(localStorage.getItem(pk('linkglove_sinais_criados'))||'[]') }catch(e){}
const saveCustom = () => { try{ localStorage.setItem(pk('linkglove_sinais_criados'),JSON.stringify(CUSTOM)) }catch(e){} };
function addCustomWord(c){ const k=kk(c.t[0]); if(k && !WORDS.some(w=>w.k===k)) WORDS.push({k,t:c.t,n:false,custom:true}); }
CUSTOM.forEach(addCustomWord);
const signList = () => [...KEY, ...CUSTOM.map(c=>c.t[0]), 'Ç','H','J','K','X','Y','Z'];   // palavras + criados + letras com movimento
function renderSgSel(sel){ $('sgL').innerHTML = signList().map(k=>`<option>${k}</option>`).join(''); if(sel) $('sgL').value=sel; }
renderSgSel();
$('btnNewSign').onclick = () => { ['nsPt','nsEs','nsIt','nsDe','nsEn'].forEach(i=>$(i).value=''); $('nsMsg').textContent=''; $('nsDlg').showModal(); $('nsPt').focus(); };
$('nsCancel').onclick = () => $('nsDlg').close();
$('nsOk').onclick = () => {
  const pt=$('nsPt').value.trim().toLowerCase();
  if (!pt){ $('nsMsg').textContent='Digite o nome do sinal.'; return; }
  if (signList().some(x=>kk(x)===kk(pt))){ $('nsMsg').textContent='Já existe um sinal com esse nome.'; return; }
  const t=[pt,...['nsEs','nsIt','nsDe','nsEn'].map(i=>$(i).value.trim()||pt)];
  const c={t}; CUSTOM.push(c); addCustomWord(c); saveCustom(); renderSgSel(pt); sgInfo('Sinal "'+pt+'" criado. Agora clique em "Gravar sinal" (3 vezes).');
  $('nsDlg').close();
};
$('btnDelSign').onclick = () => {
  const n=$('sgL').value, i=CUSTOM.findIndex(c=>c.t[0]===n);
  if (i<0){ sgInfo('Só dá para apagar sinais criados por você.'); return; }
  if (!confirm('Apagar o sinal "'+n+'" e as suas gravações?')) return;
  CUSTOM.splice(i,1); saveCustom();
  const k=kk(n), wi=WORDS.findIndex(w=>w.custom&&w.k===k); if(wi>=0) WORDS.splice(wi,1);
  for (let j=SIGNSAMP.length-1;j>=0;j--) if (SIGNSAMP[j].S===n) SIGNSAMP.splice(j,1);
  sgSave(); renderSgSel(); sgInfo('Sinal apagado.');
};
function sgInfo(m){
  const c={}; SIGNSAMP.forEach(x=>c[x.S]=(c[x.S]||0)+1);
  $('sgMap').innerHTML = signList().map(k=>`<span class="chip ${c[k]>=3?'ok':''}">${k}${c[k]?' '+c[k]:''}</span>`).join('') + (m?`<div style="color:var(--mut);margin-top:6px">${m}</div>`:'');
}
function sgSave(){ try{ localStorage.setItem(pk('linkglove_sinais_mov'), JSON.stringify(SIGNSAMP)) }catch(e){} }
$('btnSgRec').onclick = async () => {
  if (!camOn){ camMsg('Ligue a câmera antes de gravar.'); return; }
  const w=$('sgL').value; $('btnSgRec').disabled=true;
  for (let c=3;c>0;c--){ sgInfo(`Prepare o sinal "${w}"... ${c}`); await sleep(1000); }
  sgRec={frames:[]}; sgInfo(`Gravando "${w}"... faça o sinal agora`); await sleep(2000);
  const fr=sgRec.frames; sgRec=null; $('btnSgRec').disabled=false;
  if (fr.length<10){ sgInfo('Não vi a sua mão. Tente de novo.'); return; }
  SIGNSAMP.push({S:w, v:resample(fr)});
  const mine=SIGNSAMP.filter(x=>x.S===w); if (mine.length>8) SIGNSAMP.splice(SIGNSAMP.indexOf(mine[0]),1);
  sgSave(); sgInfo('✔ Gravado.');
};
$('btnSgOne').onclick = () => {
  const S=$('sgL').value, n=SIGNSAMP.filter(x=>x.S===S).length;
  if (!n){ sgInfo('Não há gravações do sinal "'+S+'".'); return; }
  if (!confirm('Apagar as '+n+' gravações do sinal "'+S+'"?')) return;
  for (let i=SIGNSAMP.length-1;i>=0;i--) if (SIGNSAMP[i].S===S) SIGNSAMP.splice(i,1);
  sgSave(); sgInfo('Gravações de "'+S+'" apagadas.');
};
$('btnSgClear').onclick = () => { if(confirm('Apagar todos os sinais gravados?')){ SIGNSAMP.length=0; sgSave(); sgInfo(); } };
sgInfo();

