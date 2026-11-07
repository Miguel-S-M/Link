// Corrida das letras online
// ================= Corrida das letras online (Link × Null) =================
// O anfitrião sorteia uma sequência de letras igual para os dois; cada um corre no próprio ritmo e avisa o anfitrião a cada letra.
const cmx=$('cmpCv').getContext('2d');
function cmpClear(){
  cmp.rs=null; cmp.v=null; cmp.seq=[]; cmp.n=0; cmp.hold=null; cmp.lock=false;
  if(mp.mode==='race'){ $('gmT').textContent='–'; gmShowImg(''); $('gmTime').textContent='–'; $('gmScore').textContent='0 pts'; $('btnGm').textContent='Começar jogo'; }
}
function cmpUi(){
  const v=cmp.v, t=cmp.seq[cmp.n], active=!!(mp.live&&v&&v.run&&!v.over&&cmp.n<cmp.goal);
  $('gmT').textContent=active?t:(mp.live&&v&&!v.run&&!v.over?'…':'–'); gmShowImg(active?t:'');
  $('gmTime').textContent=v&&v.run&&!v.over?Math.ceil(v.left)+' s':'–'; $('gmScore').textContent=cmp.n+'/'+cmp.goal+' letras';
  if(active) gmMsg('Faça a letra '+t+' (segure a mão firme)');
}
function cmpStart(){
  if(!mp.host||!mp.conn||!mp.conn.open){ mpSay('Crie uma sala e espere o adversário entrar.','bad'); return; }
  if(!(camOn||mp.keys)){ camMsg('Ligue a câmera (ou marque o teclado de teste).'); mpSay('Ligue a câmera antes de começar.','bad'); return; }
  if(!mp.peerCam){ mpSay('Aguardando o adversário ligar a câmera (ou o modo teclado).','bad'); return; }
  const pool=letterPool(), seq=[]; for(let i=0;i<40;i++) seq.push(pickWeighted(pool,seq[i-1]||''));
  const goal=15, time=60, now=performance.now();
  cmp.rs={goal,time,cd:3,t:now,last:0,run:false,endAt:0,over:null,p:{link:{n:0,at:0},null:{n:0,at:0}}};
  cmp.seq=seq; cmp.goal=goal; cmp.n=0; cmp.hold=null; cmp.lock=false; cmp.v=null;
  mp.live=true; mp.over=null; mpSend({t:'cstart',seq,goal,time});
  mpSay('Corrida começando!','ok'); cmpUi(); mpUi();
}
function cmpStop(){ const S=cmp.rs; if(S&&!S.over){ S.over={w:'draw',why:'quit'}; S.run=false; } }
function cmpHostProgress(r,n){
  const S=cmp.rs; if(!S||!S.run||S.over||(r!=='link'&&r!=='null')) return;
  const P=S.p[r]; if(n!==P.n+1) return;
  P.n=n;
  if(n>=S.goal){ S.over={w:r,why:'goal'}; S.run=false; }
}
function cmpStep(){
  const S=cmp.rs; if(!S) return; const now=performance.now(); let push=false, dt=Math.min(0.1,(now-S.t)/1000); S.t=now;
  if(!S.over){
    if(!S.run){ const was=Math.ceil(S.cd); S.cd-=dt; if(S.cd<=0){ S.cd=0; S.run=true; S.endAt=now+S.time*1000; push=true; } else if(Math.ceil(S.cd)!==was) push=true; }
    else if(now>S.endAt){ const a=S.p.link.n, b=S.p.null.n; S.over={w:a===b?'draw':a>b?'link':'null',why:'time'}; S.run=false; push=true; }
  }
  if(push||now-S.last>=MPR.tick){ S.last=now; const v=cmpBuild(); cmpApplyView(v); mpSend({t:'cv',v}); }
}
function cmpBuild(){
  const S=cmp.rs, now=performance.now();
  return {cd:Math.round(S.cd*100)/100,run:S.run,left:S.run?Math.max(0,(S.endAt-now)/1000):S.time,over:S.over,goal:S.goal,p:{link:{n:S.p.link.n},null:{n:S.p.null.n}}};
}
function cmpApplyView(v){
  v.at=performance.now(); cmp.v=v;
  if(!v.over){ mp.over=null; if(!mp.live&&!mp.host) mp.live=true; }
  else if(!mp.over){ mp.over=v.over; mp.live=false; mpOver(v.over); }
  cmpUi(); mpUi();
}
function cmpSign(){
  const t=performance.now(); if(t-(cmp.last||0)<300) return; cmp.last=t;
  cmp.n++; try{ recordResult(cmp.seq[cmp.n-1],true); }catch(e){}
  if(mp.host) cmpHostProgress(mp.me,cmp.n); else mpSend({t:'cp',n:cmp.n});
  cmp.ok=performance.now()+400; cmpUi();
}
function cmpTick(L){   // letras da câmera: segurar 0,45 s (igual ao jogo solo)
  const v=cmp.v; if(!v||!v.run||v.over||cmp.n>=cmp.goal) return; const now=performance.now();
  if(!L){ cmp.hold=null; cmp.lock=false; return; }
  if(L!==cmp.hold){ cmp.hold=L; cmp.t0=now; cmp.lock=false; return; }
  if(!cmp.lock&&now-cmp.t0>=450&&L===cmp.seq[cmp.n]){ cmp.lock=true; learnLetter(L); cmpSign(); }
}
function cmpKeySign(){ const v=cmp.v; if(!mp.live||mp.mode!=='race'||!v||!v.run||v.over||cmp.n>=cmp.goal) return; cmpSign(); }
function cmpDraw(){
  const c=cmx, v=cmp.v, me=mp.me, now=performance.now(), goal=cmp.goal||15;
  const g=c.createLinearGradient(0,0,0,220); g.addColorStop(0,'#0a1230'); g.addColorStop(1,'#1a0a3a'); c.fillStyle=g; c.fillRect(0,0,640,220);
  const X0=40, X1=520, lanes=[['link',34,'#00e5ff'],['null',120,'#ff2dd1']];
  lanes.forEach(([r,y,col])=>{
    c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(20,y,600,70); c.strokeStyle='rgba(255,255,255,.12)'; c.setLineDash([10,10]); c.lineWidth=2; c.beginPath(); c.moveTo(20,y+35); c.lineTo(620,y+35); c.stroke(); c.setLineDash([]);
    const n=v?v.p[r].n:0, f=Math.min(1,n/goal), x=X0+f*(X1-X0-30), bob=Math.sin(now/90+(r==='null'?2:0))*(v&&v.run&&!v.over?3:0);
    spr(v&&v.run&&!v.over&&Math.floor(now/160)%2?r+'_jab':r+'_idle',x,y+2+bob,66,false,0,c);
    tx(c,(r==='link'?'LINK':'NULL')+(me===r?' (VOCÊ)':'')+'  '+n+'/'+goal,24,y-6,13,col,'left');
  });
  for(let i=0;i<9;i++){ c.fillStyle=i%2?'#f8fafc':'#111827'; c.fillRect(586,34+i*(156/9),10,156/9); c.fillStyle=i%2?'#111827':'#f8fafc'; c.fillRect(596,34+i*(156/9),10,156/9); }
  if(!v){ tx(c,mp.host?'Aguardando você começar…':'Aguardando o anfitrião…',320,112,16,'#9ca3af'); return; }
  if(v.run&&!v.over) tx(c,Math.ceil(Math.max(0,v.left-(now-v.at)/1000))+' s',320,18,15,'#9ca3af');
  if(!v.run&&!v.over&&v.cd>0) tx(c,String(Math.ceil(Math.max(0,v.cd-(now-v.at)/1000))),320,128,80,'#00e5ff');
  if(now<cmp.ok) tx(c,'✅',320,112,30,'#34d399');
  if(v.over){ const o=v.over, t=o.w==='draw'?'EMPATE':o.w===me?'VOCÊ VENCEU!':'VOCÊ PERDEU'; c.fillStyle='rgba(3,19,31,.72)'; c.fillRect(0,75,640,70); tx(c,t,320,125,40,o.w===me?'#34d399':o.w==='draw'?'#9ca3af':'#ff4d6d'); }
}

// ---------- ligações da interface ----------
$('mpCreate').onclick=()=>mpCreate();
$('mpJoin').onclick=mpJoin;
$('mpLeave').onclick=mpLeave;
$('mpCode').addEventListener('keydown',e=>{ if(e.key==='Enter') mpJoin(); });
$('mpKeys').onchange=e=>{ mp.keys=e.target.checked; if(!mp.keys){ mpK.L=mpK.R=false; } };
$('mpCopy').onclick=async()=>{
  const url=location.origin+location.pathname+'#sala='+mp.code+'&jogo='+MP_GAME[mp.mode];
  try{ await navigator.clipboard.writeText(url); toast('Link do convite copiado!'); }catch(e){ prompt('Copie o link do convite:',url); }
};
addEventListener('pagehide',()=>{ if(mp.active) mpSend({t:'bye'}); });
// convite por link: abre o boxe e entra na sala automaticamente
(function(){
  const m=/sala=([A-Za-z0-9]{4,8})/.exec(location.hash); if(!m) return;
  const tab=document.querySelector('[data-tab="games"]'); if(tab) tab.click();
  const gm=/jogo=(rap|boxe|letras)/.exec(location.hash);
  openGame(gm?gm[1]:'boxe'); $('mpBox').open=true; $('mpCode').value=m[1].toUpperCase(); mpJoin();
})();

