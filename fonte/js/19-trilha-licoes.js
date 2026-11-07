// Trilha de aprendizado e lições
// ================= Trilha de aprendizado e lições (estilo "caminho") =================
const UNITS=[
 {nome:'Alfabeto 1',icon:'🔤',cor:'#00e5ff',desc:'As primeiras letras',lessons:[['ABC','Letras A B C'],['DEF','Letras D E F'],['GIL','Letras G I L']].map(([x,t],i)=>({id:'a1'+i,kind:'letters',items:[...x],title:t}))},
 {nome:'Alfabeto 2',icon:'🔠',cor:'#3b82f6',desc:'Mais letras',lessons:[['MNO','Letras M N O'],['PQR','Letras P Q R'],['STU','Letras S T U']].map(([x,t],i)=>({id:'a2'+i,kind:'letters',items:[...x],title:t}))},
 {nome:'Alfabeto 3',icon:'✋',cor:'#8b5cf6',desc:'Fechando o alfabeto',lessons:[['VWY','Letras V W Y'],['BFN','Revisão 1'],['ORU','Revisão 2']].map(([x,t],i)=>({id:'a3'+i,kind:'letters',items:[...x],title:t}))}
].concat(MODULES.map((m,mi)=>({nome:m.nome,icon:['👋','👪','🔢','🏠','🚑'][mi]||'⭐',cor:['#22c55e','#ff9500','#ff2dd1','#14b8a6','#ef4444'][mi]||'#00e5ff',desc:m.desc,
  lessons:Array.from({length:Math.ceil(m.pal.length/4)},(_,i)=>({id:m.id+i,kind:'words',items:m.pal.slice(i*4,i*4+4),title:m.pal.slice(i*4,i*4+4).join(', ')}))})));
const ALL=UNITS.flatMap(u=>u.lessons);
function renderTrail(){
  const off=[0,48,78,48,0,-48,-78,-48], lessons=PRG.lessons||{};
  const goal=30, xpDay=(PRG.day&&PRG.day.d===dayKey(new Date()))?PRG.day.xp:0;
  $('goal').innerHTML=`<img src="${ART.link_mascote}" alt="" style="height:90px;mix-blend-mode:lighten"><div style="flex:1;min-width:200px"><b>Meta de hoje: ${Math.min(xpDay,goal)}/${goal} XP</b><div class="bar"><i style="width:${Math.min(100,xpDay/goal*100)}%"></i></div><small style="color:var(--mut)">${xpDay>=goal?'Meta cumprida! 🎉':'Faça uma lição para avançar.'}</small></div>`;
  let first=true;
  $('trailBody').innerHTML=UNITS.map(u=>{
    const nodes=u.lessons.map(l=>{
      const gi=ALL.indexOf(l), done=!!lessons[l.id], unlocked=gi===0||!!lessons[ALL[gi-1].id], cur=unlocked&&!done&&first; if(cur) first=false;
      return `<div class="nw" style="transform:translateX(${off[gi%off.length]}px)"><button class="node ${done?'done':''} ${unlocked?'':'lock'} ${cur?'cur':''}" data-les="${l.id}" ${unlocked?'':'disabled'} aria-label="${u.nome}: ${l.title}">${done?'⭐':unlocked?'▶':'🔒'}</button><span class="nl">${l.title}</span></div>`;
    }).join('');
    return `<div class="unit" style="--c:${u.cor}"><div class="uhead"><span>${u.icon}</span><div><b>${u.nome}</b><small>${u.desc}</small></div></div><div class="unodes">${nodes}</div></div>`;
  }).join('');
}
// ---- motor das lições ----
const les={on:false,steps:[],i:0,bad:0,l:null,cam:false,target:'',t0:0,hold:0,t1:0,answered:false};
const shuffle=a=>[...a].sort(()=>Math.random()-.5);
function optsLetters(L){ const o=new Set([L]); const pool=[...'ABCDEFGHILMNOPQRSTUVWXYZ']; while(o.size<4) o.add(rnd(pool)); return shuffle(o); }
function optsWords(w,ws,ti,rev){ const k=rev?0:ti, o=new Set([w.t[k]]), pool=[...ws,...WORDS.filter(x=>!x.n)]; let g=0; while(o.size<4&&g++<80) o.add(rnd(pool).t[k]); return shuffle(o); }
function lessonSteps(l){
  const st=[], ti=vLang||(1+(Math.random()*4|0));
  if(l.kind==='letters'){
    l.items.forEach(L=>{ st.push({t:'intro',L}); st.push({t:'id',L,opts:optsLetters(L)}); });
    l.items.forEach(L=>{ if(letterPool().includes(L)) st.push({t:'cam',L}); });
    for(let k=0;k<2;k++){ const L=rnd(l.items); st.push({t:'id',L,opts:optsLetters(L)}); }
  } else {
    const ws=l.items.map(p=>WORDS.find(w=>w.k===kk(p))).filter(Boolean);
    ws.forEach(w=>st.push({t:'wintro',w,ti})); ws.forEach(w=>st.push({t:'wmc',w,ti,opts:optsWords(w,ws,ti,false)})); ws.slice(0,2).forEach(w=>st.push({t:'wrev',w,ti,opts:optsWords(w,ws,ti,true)}));
  }
  return st;
}
function lsFace(expr,msg){ $('lsFbImg').src=ART[expr]||ART.feliz; $('lsMsg').textContent=msg; }
function lsShow(){
  const s=les.steps[les.i]; les.answered=false; les.cam=false; $('lsFb').className=''; $('lsBar').style.width=(les.i/les.steps.length*100)+'%';
  const body=$('lsBody'), btn=$('lsGo'); btn.style.display='none'; $('lsSkip').style.display='none';
  const optsHtml=o=>`<div class="lsopts">${o.map(x=>`<button data-lo="${String(x).replace(/"/g,'&quot;')}">${x}</button>`).join('')}</div>`;
  const im=L=>IMG[L.toLowerCase()]?`<img class="lsimg" src="${IMG[L.toLowerCase()]}" alt="Sinal da letra ${L}">`:'';
  if(s.t==='intro'){ body.innerHTML=`<h2>Letra ${s.L}</h2>${im(s.L)}<p style="color:var(--mut)">Observe a posição dos dedos.</p>`; btn.style.display=''; btn.textContent='Continuar'; les.go=lsNext; lsFace('dica','Essa é a letra '+s.L+'. Observe bem a posição dos dedos.'); }
  else if(s.t==='id'){ body.innerHTML=`<h2>Qual é esta letra?</h2>${im(s.L)}${optsHtml(s.opts)}`; les.ans=s.L; lsFace('pensando','Qual letra é essa?'); }
  else if(s.t==='cam'){
    les.cam=true; les.target=s.L; les.t0=0; les.t1=performance.now(); $('lsSkip').style.display='';
    body.innerHTML=`<h2>Faça a letra ${s.L}</h2><div class="row" style="justify-content:center;gap:16px">${im(s.L)}<div class="cam" style="width:min(380px,90vw)"><canvas class="mirror"></canvas><div class="off coff" style="display:${camOn?'none':'flex'}">Câmera desligada</div></div></div>${camOn?'':'<button id="lsCam" class="primary">Ligar câmera</button>'}<small id="lsHint" style="color:var(--mut)">Segure a letra por um instante.</small>`;
    lsFace('confiante','Sua vez! Faça a letra '+s.L+'.');
  }
  else if(s.t==='wintro'){
    const w=s.w, sg=SIGNS[w.t[0]];
    body.innerHTML=`<h2>${w.t[0]}</h2><div style="font-size:1.2rem">${LANGS.slice(1).map((l,i)=>`${l[0]} ${w.t[i+1]}`).join(' &nbsp; ')}</div>${sg?drawSign(sg):'<p style="color:var(--mut)">Veja como se faz este sinal no vídeo.</p>'}<a target="_blank" rel="noopener" href="${sinalURL(w.t[0])}">🎬 ver o sinal em vídeo</a>`;
    btn.style.display=''; btn.textContent='Continuar'; les.go=lsNext; lsFace('dica','Palavra nova: '+w.t[0]+'.');
  }
  else if(s.t==='wmc'){ body.innerHTML=`<h2>Como se diz «${s.w.t[0]}» em ${LANGS[s.ti][1]}? ${LANGS[s.ti][0]}</h2>${optsHtml(s.opts)}`; les.ans=s.w.t[s.ti]; lsFace('pensando','Qual é a tradução?'); }
  else if(s.t==='wrev'){ body.innerHTML=`<h2>O que significa «${s.w.t[s.ti]}» ${LANGS[s.ti][0]}?</h2>${optsHtml(s.opts)}`; les.ans=s.w.t[0]; lsFace('pensando','Em português, o que é?'); }
  if(['intro','wintro','cam'].includes(s.t)) $('lsFb').className='show';
}
function lsFeedback(ok,msg){
  les.answered=true; if(!ok) les.bad++;
  $('lsFb').className='show '+(ok?'ok':'bad'); lsFace(ok?'feliz':'erro',msg);
  const b=$('lsGo'); b.style.display=''; b.textContent='Continuar'; les.go=lsNext;
}
function lsNext(){
  les.i++; if(les.i>=les.steps.length){ lsFinish(); return; } lsShow();
}
function lsFinish(){
  const xp=10+(les.bad===0?5:0), first=!PRG.lessons[les.l.id]; PRG.lessons[les.l.id]=true; les.on=false;
  $('lsBar').style.width='100%'; $('lsFb').className='';
  $('lsBody').innerHTML=`<img src="${ART.conquista}" alt="" style="height:140px;mix-blend-mode:lighten"><h2>Lição concluída!</h2><p>${les.bad===0?'Sem erros! ':''}+${xp} XP</p>`;
  lsFace('conquista','Incrível! Você completou a lição!'); $('lsFb').className='show ok'; $('lsGo').style.display=''; $('lsGo').textContent='Voltar à trilha'; les.go=lsClose;
  award(first?xp:Math.ceil(xp/2)); renderTrail();
}
function lsClose(){ les.on=false; $('lesson').classList.remove('on'); renderTrail(); linkSay('feliz','Quer fazer mais uma lição?'); }
function startLesson(id){
  const l=ALL.find(x=>x.id===id); if(!l) return;
  Object.assign(les,{on:true,l,steps:lessonSteps(l),i:0,bad:0}); $('lesson').classList.add('on'); lsShow();
}
function lessonTick(L){
  if(!les.on||!les.cam||les.answered) return; const now=performance.now();
  if(L===les.target){ if(!les.t0) les.t0=now; if(now-les.t0>=600){ recordResult(L,true); les.cam=false; lsFeedback(true,'Boa! Você acertou!'); } }
  else { les.t0=0; if(now-les.t1>12000){ les.cam=false; recordResult(les.target,false); lsFeedback(false,'Quase! Veja a posição dos dedos e tente novamente depois.'); } }
}
document.addEventListener('click',e=>{
  const n=e.target.closest('[data-les]'); if(n){ startLesson(n.dataset.les); return; }
  const o=e.target.closest('[data-lo]');
  if(o&&les.on&&!les.answered){
    const ok=o.dataset.lo===String(les.ans); o.classList.add(ok?'qz-ok':'qz-bad');
    document.querySelectorAll('#lsBody [data-lo]').forEach(x=>{ if(x.dataset.lo===String(les.ans)) x.classList.add('qz-ok'); x.disabled=true; });
    if(ok) hit(); else if(/^[A-Z]$/.test(les.ans)) recordResult(les.ans,false);
    lsFeedback(ok,ok?'Boa! Você acertou!':'Quase! A resposta era '+les.ans+'.');
  }
  if(e.target.id==='lsCam') camStart();
});
$('lsGo').onclick=()=>{ if(les.go) les.go(); };
$('lsSkip').onclick=()=>{ if(les.on&&les.cam){ les.cam=false; lsNext(); } };
$('lsX').onclick=()=>{ if(!les.on||confirm('Sair da lição? O progresso desta lição será perdido.')) lsClose(); };
renderTrail();

// ---- ajuste de luz: sobe o brilho da imagem que a câmera "enxerga" quando o local está escuro ----
const LIGHT={on:!!ls('linkglove_luz',false),gain:1,con:1,last:0,hw:false};
const lc=document.createElement('canvas'), lx=lc.getContext('2d',{willReadFrequently:true});
function enhance(){
  const w=cv.videoWidth, h=cv.videoHeight; if(!w) return cv;
  if(lc.width!==w||lc.height!==h){ lc.width=w; lc.height=h; }
  if('filter' in lx){ lx.filter='brightness('+LIGHT.gain.toFixed(2)+') contrast('+LIGHT.con.toFixed(2)+')'; lx.drawImage(cv,0,0,w,h); lx.filter='none'; }
  else {   // navegadores sem filtro no canvas: ajuste manual dos pixels
    lx.drawImage(cv,0,0,w,h); const d=lx.getImageData(0,0,w,h), a=d.data, g=LIGHT.gain;
    for(let i=0;i<a.length;i+=4){ a[i]=Math.min(255,a[i]*g); a[i+1]=Math.min(255,a[i+1]*g); a[i+2]=Math.min(255,a[i+2]*g); }
    lx.putImageData(d,0,0);
  }
  return lc;
}
function lightUI(){
  document.documentElement.style.setProperty('--bri',LIGHT.on?LIGHT.gain.toFixed(2):'1'); document.documentElement.style.setProperty('--con',LIGHT.on?LIGHT.con.toFixed(2):'1');
  document.querySelectorAll('.btnLight').forEach(b=>{ b.textContent=LIGHT.on?'💡 Luz ajustada ×'+LIGHT.gain.toFixed(1)+' (desligar)':'💡 Ajustar luz'; b.classList.toggle('primary',LIGHT.on); });
}
function adapt(force){
  const now=performance.now(); if(!LIGHT.on||(!force&&now-LIGHT.last<1500)) return; LIGHT.last=now;
  const lv=lightLevel(); if(lv===null) return;
  const target=lv<115?Math.min(3.2,115/Math.max(lv,15)):lv>190?Math.max(0.6,150/lv):1;
  LIGHT.gain+=(target-LIGHT.gain)*(force?1:0.5); LIGHT.con=LIGHT.gain>1.4?1.15:1; lightUI(); return lv;
}
async function hwLight(){   // tenta também a exposição da própria câmera (Chrome/Edge/Android; o Firefox não permite)
  try{
    const tr=cv.srcObject&&cv.srcObject.getVideoTracks()[0]; if(!tr||!tr.getCapabilities) return false;
    const cap=tr.getCapabilities(), adv={};
    if(cap.exposureMode&&cap.exposureMode.includes('continuous')) adv.exposureMode='continuous';
    if(cap.exposureCompensation) adv.exposureCompensation=cap.exposureCompensation.max*0.7;
    if(cap.brightness) adv.brightness=cap.brightness.min+(cap.brightness.max-cap.brightness.min)*0.7;
    if(Object.keys(adv).length){ await tr.applyConstraints({advanced:[adv]}); LIGHT.hw=true; return true; }
  }catch(e){}
  return false;
}
async function toggleLight(){
  if(!camOn){ camMsg('Ligue a câmera primeiro para ajustar a luz.'); return; }
  if(LIGHT.on){ LIGHT.on=false; LIGHT.gain=1; LIGHT.con=1; lsSet('linkglove_luz',false); lightUI(); camMsg('Ajuste de luz desligado.'); return; }
  LIGHT.on=true; lsSet('linkglove_luz',true); const hw=await hwLight(); await sleep(hw?1000:200);
  const lv=adapt(true); lightUI();
  const nivel=lv===null||lv===undefined?'':lv<45?'muito baixa':lv<80?'baixa':lv>190?'alta demais':'boa';
  camMsg('Luz '+nivel+(lv!=null?' ('+Math.round(lv)+'/255)':'')+': brilho ×'+LIGHT.gain.toFixed(1)+(hw?' e exposição da câmera ajustados.':' ajustado na imagem.')+(lv<80?' Se puder, acenda uma luz de frente para você.':''));
  linkSay('dica','Ajustei a luz! Fique de frente para a luz, não de costas.');
}
document.querySelectorAll('.btnCam').forEach(b=>{ const l=document.createElement('button'); l.className='btnLight'; l.textContent='💡 Ajustar luz'; b.after(l); });
document.addEventListener('click',e=>{ if(e.target.closest('.btnLight')) toggleLight(); });
lightUI();

$('heroL').src=ART.link_big; $('heroN').src=ART.null_big; $('brandLogo').src=ART.logo; $('lkImg').src=ART.feliz; boxDraw();
loadVid(PLAYLIST_ID||VIDEOS[0][1], !!PLAYLIST_ID);
translate();
