// Estatísticas, conquistas e revisão espaçada
// ================= Estatísticas, progresso, conquistas e revisão espaçada =================
const ls = (k,d) => { try{ const v=JSON.parse(localStorage.getItem(pk(k))||'null'); return v===null?d:v }catch(e){ return d } };
const lsSet = (k,v) => { try{ localStorage.setItem(pk(k),JSON.stringify(v)) }catch(e){} };
let STATS = ls('linkglove_stats',{}), PRG = Object.assign({xp:0,hits:0,days:[],medals:{},mods:{},box:0,acc:0,lessons:{}}, ls('linkglove_prog',{}));
const dayKey = d => d.toISOString().slice(0,10);
function touchDay(){ const d=dayKey(new Date()); if(!PRG.days.includes(d)) PRG.days.push(d); PRG.days=PRG.days.slice(-120); }
function streak(){ const d=new Date(); if(!PRG.days.includes(dayKey(d))) d.setDate(d.getDate()-1); let n=0; while(PRG.days.includes(dayKey(d))){ n++; d.setDate(d.getDate()-1); } return n; }
const MODULES = [
 {id:'cumprimentos',nome:'Cumprimentos',desc:'Oi, tchau, obrigado e tudo bem.',pal:['oi','olá','tchau','obrigado','bom dia','boa tarde','boa noite','tudo bem'],vid:0},
 {id:'familia',nome:'Família e afeto',desc:'As pessoas mais próximas.',pal:['família','mãe','pai','irmão','irmã','filho','filha','amigo','amiga','amor'],vid:1},
 {id:'numeros',nome:'Números',desc:'De zero a dez.',pal:['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez'],vid:2},
 {id:'casa',nome:'Casa e comida',desc:'O dia a dia em casa.',pal:['casa','água','comer','beber','comida','café','pão','leite','fruta','arroz'],vid:3},
 {id:'saude',nome:'Saúde e ajuda',desc:'Pedir ajuda numa emergência.',pal:['ajuda','socorro','médico','hospital','dor','remédio','doente','emergência'],vid:4}
];
const MEDALS = [
 ['p1','🥉 Primeiro acerto',p=>p.hits>=1],['p10','🥈 10 acertos',p=>p.hits>=10],['p50','🥇 50 acertos',p=>p.hits>=50],
 ['d3','🔥 3 dias seguidos',()=>streak()>=3],['d7','🔥 7 dias seguidos',()=>streak()>=7],
 ['m1','📘 Primeiro módulo',p=>Object.keys(p.mods).length>=1],['mall','🎓 Todos os módulos',p=>Object.keys(p.mods).length>=MODULES.length],
 ['b1','🥊 Boxe fácil vencido',p=>p.box>=1],['b2','🥊 Boxe médio vencido',p=>p.box>=2],['b3','🏆 Boxe difícil vencido',p=>p.box>=3],
 ['a90','🎯 90% no teste de precisão',p=>p.acc>=90]
];
function toast(m){ linkSay('conquista',m.replace(/^🏅\s*/,'')); const t=$('toast'); t.textContent=m; t.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>t.style.display='none',3200); }
function award(xp){
  PRG.xp+=xp; touchDay(); { const dk=dayKey(new Date()); if(!PRG.day||PRG.day.d!==dk) PRG.day={d:dk,xp:0}; PRG.day.xp+=xp; }
  MEDALS.forEach(([id,nome,ok])=>{ if(!PRG.medals[id]&&ok(PRG)){ PRG.medals[id]=1; toast('🏅 Nova conquista: '+nome); } });
  lsSet('linkglove_prog',PRG); renderPrg();
}
const hit = () => { PRG.hits++; award(1); };
function recordResult(L,ok){
  linkSay(ok?'feliz':'erro', ok?'Boa! Você acertou!':'Quase! Veja a posição dos dedos e tente novamente.');
  const s=STATS[L]||(STATS[L]={ok:0,miss:0}); ok?s.ok++:s.miss++; lsSet('linkglove_stats',STATS);
  if(ok) hit(); else { touchDay(); lsSet('linkglove_prog',PRG); renderPrg(); }
}
function pickWeighted(pool,avoid){
  const w=pool.map(L=>{ const s=STATS[L]||{ok:0,miss:0}; return (L===avoid&&pool.length>1)?0:1+4*s.miss/(s.ok+s.miss+1)+(s.ok+s.miss?0:0.5); });
  let r=Math.random()*w.reduce((a,b)=>a+b,0); for(let i=0;i<pool.length;i++){ r-=w[i]; if(r<=0) return pool[i]; } return pool[0];
}
function renderPrg(){
  const lvl=Math.floor(Math.sqrt(PRG.xp/10))+1, lo=(lvl-1)**2*10, hi=lvl**2*10, f=Math.min(1,(PRG.xp-lo)/(hi-lo));
  const weak=Object.entries(STATS).filter(([,s])=>s.miss>0).sort((a,b)=>b[1].miss-a[1].miss).slice(0,6).map(([L,s])=>`${L} (${s.miss} erro${s.miss>1?'s':''})`).join(', ');
  $('prg').innerHTML=`<div class="row"><span class="chip ok">🔥 ${streak()} dia(s) seguidos</span><span class="chip">⭐ Nível ${lvl}</span><span class="chip">${PRG.xp} XP</span><span class="chip">✅ ${PRG.hits} acertos</span></div>
   <div class="bar"><i style="width:${f*100}%"></i></div>
   <h3>Conquistas</h3><div>${MEDALS.map(([id,n])=>`<span class="chip ${PRG.medals[id]?'ok':''}" style="${PRG.medals[id]?'':'opacity:.45'}">${n}</span>`).join('')}</div>
   <h3>Caminho de módulos</h3><div>${MODULES.map(m=>`<span class="chip ${PRG.mods[m.id]?'ok':''}">${PRG.mods[m.id]?'✔':'○'} ${m.nome}</span>`).join(' → ')}</div>
   <h3>Para revisar</h3><div style="color:var(--mut)">${weak||'Nada ainda: pratique para o site aprender onde você erra.'}</div>`;
}

// ---- módulos por tema ----
function renderMods(){
  $('mods').innerHTML=MODULES.map((m,i)=>`<div class="card" style="margin-bottom:10px"><h3>${i+1}. ${m.nome} ${PRG.mods[m.id]?'✅':''}</h3>
   <p style="font-size:.95rem;min-height:0;color:var(--mut)">${m.desc}</p>
   <div class="row" style="margin:8px 0">${m.pal.map(p=>`<button class="pill" data-kw="${p}">${p}</button>`).join('')}</div>
   <div class="row"><button data-mod="${m.id}" data-act="vid">🎬 Vídeo</button><button data-mod="${m.id}" data-act="quiz">❓ Quiz</button><button data-mod="${m.id}" data-act="game">🎮 Soletrar</button></div></div>`).join('');
}
const mq={mod:null,qs:[],i:0,score:0,busy:false,ti:1,ans:'',pool:[]};
function mqNext(){
  if(mq.i>=mq.qs.length){ mqEnd(); return; }
  const w=mq.qs[mq.i], ans=w.t[mq.ti], opts=new Set([ans]), pool=[...mq.pool,...WORDS.filter(x=>!x.n)]; let g=0;
  while(opts.size<4&&g++<80) opts.add(rnd(pool).t[mq.ti]);
  mq.ans=ans; mq.busy=false; $('mqQ').textContent=`${mq.i+1}/${mq.qs.length}: ${w.t[0]}`; $('mqMsg').textContent='Como se diz em '+LANGS[mq.ti][1]+'?';
  $('mqOpts').innerHTML=[...opts].sort(()=>Math.random()-.5).map(o=>`<button data-mq="${o.replace(/"/g,'&quot;')}">${o}</button>`).join('');
}
function mqEnd(){
  const pass=mq.score>=Math.ceil(mq.qs.length*0.8);
  $('mqQ').textContent=`Resultado: ${mq.score}/${mq.qs.length}`; $('mqOpts').innerHTML='';
  $('mqMsg').textContent=pass?'🎉 Módulo concluído!':'Quase! Revise os sinais e tente de novo.';
  if(pass){ const nova=!PRG.mods[mq.mod.id]; PRG.mods[mq.mod.id]=true; award(nova?20:5); }
  renderMods();
}
document.addEventListener('click',e=>{
  const m=e.target.closest('[data-mod]');
  if(m){
    const mod=MODULES.find(x=>x.id===m.dataset.mod), act=m.dataset.act;
    if(act==='vid'){ loadVid(VIDEOS[mod.vid][1]); $('video').scrollIntoView({behavior:'smooth',block:'center'}); }
    else if(act==='quiz'){
      const ws=mod.pal.map(p=>WORDS.find(w=>w.k===kk(p))).filter(Boolean);
      Object.assign(mq,{mod,ti:vLang||(1+(Math.random()*4|0)),qs:[...ws].sort(()=>Math.random()-.5).slice(0,5),i:0,score:0,pool:ws});
      $('mqTitle').textContent=mod.nome+' · quiz '+LANGS[mq.ti][0]; $('mqDlg').showModal(); mqNext();
    } else if(act==='game'){
      goTab('games'); openGame('palavras');
      if(game.on) gmEnd(true);
      game.pool=mod.pal.map(p=>kk(p)).filter(k=>k.length>=2&&k.length<=9); $('btnGm').click();
    }
    return;
  }
  const q=e.target.closest('[data-mq]'); if(!q||mq.busy) return;
  mq.busy=true; const ok=q.dataset.mq===mq.ans;
  document.querySelectorAll('#mqOpts button').forEach(x=>{ if(x.dataset.mq===mq.ans) x.classList.add('qz-ok'); });
  if(ok){ mq.score++; hit(); } else q.classList.add('qz-bad');
  setTimeout(()=>{ mq.i++; mqNext(); }, ok?600:1100);
});
$('mqClose').onclick=()=>$('mqDlg').close();

