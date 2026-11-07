// Boxe contra a máquina
// ================= Boxe contra a máquina =================
const BXL={
 1:{nome:'Fácil',oppHp:60,plHp:100,gap:[2.4,3.6],tele:1.5,dmg:8,combo:1,feint:0,guard:0,both:0,plDmg:10,stam:false,drain:0,pcost:0,tvar:0,stagger:1.1},
 2:{nome:'Médio',oppHp:110,plHp:100,gap:[1.0,1.7],tele:0.62,dmg:15,combo:2,feint:0.2,guard:0.3,both:0.15,plDmg:7,stam:true,drain:8,pcost:25,tvar:0.2,stagger:0.8},
 3:{nome:'Difícil',oppHp:150,plHp:90,gap:[0.8,1.4],tele:0.5,dmg:17,combo:3,feint:0.3,guard:0.5,both:0.25,plDmg:5,stam:true,drain:16,pcost:30,tvar:0.3,stagger:0.5}
};
const box={on:false,lv:1,t:0,end:0,msg:'',flash:0,lastPunch:0,prev:{},pl:{hp:100,st:100,gL:0,gR:0,exh:0},opp:{hp:60,st:'idle',t:1,tot:1,side:'L',q:[],guard:false,gt:0,feint:false}};
// ---- multiplayer online (estado) ----
const MPR={windup:[1.1,0.8,0.6],dmg:12,drain:12,regen:16,pcost:16,recover:0.7,time:90,cd:3,tick:50};
const MP_PREFIX='linkglove-box-', MP_ALPHA='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MP_ICE={iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]};
const mp={mode:'box',switching:false,peer:null,conn:null,host:false,me:'link',guestRole:'null',code:'',active:false,live:false,keys:false,view:null,sim:null,peerCam:false,ping:0,seen:{link:0,null:0},flash:0,over:null,timers:[]};
const rmp={rs:null,v:null,round:0,beat:-9,seen:{link:0,null:0},hurt:{link:0,null:0},lv:1};
const cmp={rs:null,v:null,seq:[],goal:15,n:0,hold:null,t0:0,lock:false,ok:0};
const bxCv=$('bxCv'), bx=bxCv.getContext('2d'), rr=a=>a[0]+Math.random()*(a[1]-a[0]);
// ---- golpes do boxe: jab, direto, gancho e uppercut + tutorial de calibragem ----
const _bc = ls('linkglove_box_cal',{});
const BXC = Object.assign({speed:1.3, grow:0.8, guardY:0.58, cx:1.7}, _bc.c||{});   // limites pessoais (a calibragem ajusta)
let bxCalDone = !!_bc.done;
const BXBASE = {speed:BXC.speed, grow:BXC.grow, cx:BXC.cx};   // calibragem de referência (tutorial); o jogo só ajusta perto dela
const BXP = {lat:[], fwd:[], n:0};
function boxLearn(type,ms,mg){   // cada golpe reconhecido na luta mostra a velocidade/avanço reais da sua mão
  if (!LEARN) return;
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)), lat=type==='gancho'||type==='upper';
  const A=lat?BXP.lat:BXP.fwd; A.push(lat?ms:mg); while(A.length>16) A.shift(); BXP.n++;
  if (BXP.lat.length>=6) BXC.speed += (clamp(0.6*median(BXP.lat),BXBASE.speed*0.8,BXBASE.speed*1.25)-BXC.speed)*0.25;
  if (BXP.fwd.length>=6) BXC.grow  += (clamp(0.55*median(BXP.fwd),BXBASE.grow*0.8,BXBASE.grow*1.25)-BXC.grow)*0.25;
  if (BXP.n%6===0) lsSet('linkglove_box_cal',{c:BXC,done:bxCalDone});
  learnUi();
}
const BXT = {
 jab:   {n:'Jab',      dmg:0.7, cost:0.6, pose:'link_jab'},
 cross: {n:'Direto',   dmg:1.4, cost:1.4, pose:'link_cross'},
 gancho:{n:'Gancho',   dmg:1.0, cost:1.0, pose:'link_gancho'},
 upper: {n:'Uppercut', dmg:1.2, cost:1.1, pose:'link_upper'}
};
const TUT = [
 {id:'pos',   t:'Coloque a mão fechada no centro da imagem, a uma distância confortável', pose:'link_idle', ar:''},
 {id:'gL',    t:'GUARDA ESQUERDA: punho fechado perto do rosto, do lado esquerdo da tela', pose:'link_esq', ar:'◀'},
 {id:'gR',    t:'GUARDA DIREITA: agora o punho do lado direito da tela', pose:'link_esq', ar:'▶'},
 {id:'jab',   t:'JAB: soco reto e rápido para a frente, na direção da câmera', pose:'link_jab', ar:'→'},
 {id:'cross', t:'DIRETO: um soco mais forte, esticando bem o braço', pose:'link_cross', ar:'⇒'},
 {id:'gancho',t:'GANCHO: um arco lateral, de fora para dentro', pose:'link_gancho', ar:'↔'},
 {id:'upper', t:'UPPERCUT: de baixo para cima, como um soco no queixo', pose:'link_upper', ar:'↑'}
];
const tut = {on:false,i:0,n:0,miss:0,h0:0,gy:[],peaks:[],cur:null,fb:'',then:false,fin:0};
function punchType(ref,cx,cy,speed,grow){
  const dx=cx-ref.x, dy=cy-ref.y;
  if(dy<-0.09 && -dy>1.2*Math.abs(dx)) return 'upper';
  if(Math.abs(dx)>0.10 && Math.abs(dx)>1.2*Math.abs(dy)) return 'gancho';
  if(grow>BXC.grow*BXC.cx || speed>BXC.speed*BXC.cx) return 'cross';
  return 'jab';
}
function boxInput(all,cl,now,w,h){
  box.hh=box.hh||{}; box.pend=box.pend||{};
  all.forEach((lm,i)=>{
    const cx=1-lm[9].x, cy=lm[9].y, sz=cl[i].size, nC=cl[i].st.filter(x=>x==='C').length;
    const H=box.hh[i]||(box.hh[i]=[]); H.push({t:now,x:cx,y:cy,s:sz}); while(H.length&&now-H[0].t>500) H.shift();
    const gy=tut.on?0.75:BXC.guardY;
    if(nC>=2&&cy<gy&&now>=box.pl.exh){ if(cx<0.58) box.pl.gL=now+250; if(cx>0.42) box.pl.gR=now+250; }          // guarda: punho levantado
    const q=H.find(a=>now-a.t<=160), dt=q?(now-q.t)/1000:0;
    const speed=dt>=0.07?Math.hypot(cx-q.x,cy-q.y)/dt:0, grow=dt>=0.07?(sz-q.s)/q.s/dt:0, ref=H.find(a=>now-a.t<=320)||H[0];
    if(tut.on){ tutHand({now,cx,cy,sr:sz/h,nC,speed,grow,ref,i}); return; }
    const p=box.pend[i];
    if(p){ p.ms=Math.max(p.ms||0,speed); p.mg=Math.max(p.mg||0,grow); if(now-p.t>=140){ box.pend[i]=null; box.lastPunch=now; const ty=punchType(p.ref,cx,cy,speed,grow); boxLearn(ty,p.ms,p.mg); boxPunch(ty, cx<0.5?'L':'R'); } return; }   // espera um instante para ver o desenho do golpe
    if(nC>=3&&(speed>BXC.speed||grow>BXC.grow)&&now-box.lastPunch>380) box.pend[i]={t:now,ref,ms:speed,mg:grow};
  });
}
function hurt(d){
  const o=box.opp; o.hp-=d; if(o.hp<=0) boxEnd('win');
}
function boxPunch(type='jab',side){
  if(mp.live&&mp.mode==='box'){ mpLocalPunch(type,side||'L'); return; }
  const L=BXL[box.lv], o=box.opp, p=box.pl, now=performance.now(), T=BXT[type]; box.lastPunch=now; p.pu=now+300; p.pty=type;
  if(L.stam){ const c=L.pcost*T.cost; if(p.st<c){ box.msg='Sem fôlego!'; return; } p.st-=c; }
  box.cb = (now-(box.cbT||0)<1300 && box.lastType!==type) ? (box.cb||0)+1 : 1; box.cbT=now; box.lastType=type;
  const base=L.plDmg*T.dmg*Math.min(1.5,1+0.12*(box.cb-1)), cm=box.cb>1?' · combo ×'+box.cb:'';
  if(o.st==='recover'){ box.msg='💥 '+T.n+' certeiro!'+cm; hurt(base*1.5); }
  else if(o.st==='tele'){
    const pInt=type==='cross'?0.75:type==='upper'?0.6:0.4;
    if(box.lv<3&&Math.random()<pInt){ o.st='recover'; o.t=L.stagger*0.6; o.q=[]; box.msg='Interrompeu o golpe! ('+T.n+')'+cm; hurt(base*0.6); }
    else { box.msg='Acertou de raspão'+cm; hurt(base*0.4); }
  } else if(o.guard){
    if(type==='gancho'){ box.msg='↪ O gancho contornou a guarda!'+cm; hurt(base*0.5); }
    else if(type==='upper'){ box.msg='⬆ O uppercut quebrou a guarda!'+cm; o.guard=false; o.st='recover'; o.t=L.stagger*0.5; hurt(base*0.4); }
    else { box.msg='🛡 Ele bloqueou o '+T.n.toLowerCase()+'!'; if(L.stam) p.st=Math.max(0,p.st-15); }
  } else { box.msg='👊 '+T.n+'!'+cm; hurt(base); }
}
// ---- tutorial / calibragem ----
function tutOk(msg){ tut.fb='✔ '+msg; tut.i++; tut.n=0; tut.miss=0; tut.h0=0; tut.cur=null; if(tut.i>=TUT.length) tutFinish(); }
function tutAttempt(type,ms,mg){
  const st=TUT[tut.i]; if(!st) return;
  const ok = st.id==='jab' ? (type==='jab'||type==='cross') : type===st.id;
  tut.peaks.push({id:st.id,type,ms,mg,ok});
  if(ok){ tut.n++; tut.fb='✔ '+BXT[type].n+' reconhecido ('+tut.n+'/2)'; if(tut.n>=2) tutOk(BXT[type].n+' calibrado!'); }
  else { tut.miss++; tut.fb='Li um '+BXT[type].n+'. Tente fazer o '+st.id.replace('cross','direto').replace('upper','uppercut')+'.'; if(tut.miss>=6) tutOk('Vamos seguir (você pode treinar depois)'); }
}
function tutHand(v){
  const st=TUT[tut.i]; if(!st) return; const now=v.now;
  if(st.id==='pos'){
    if(v.sr>=0.13&&v.sr<=0.45){ if(!tut.h0) tut.h0=now; tut.fb='Segure assim...'; if(now-tut.h0>900) tutOk('Distância boa!'); }
    else { tut.h0=0; tut.fb=v.sr<0.13?'Aproxime a mão da câmera':'Afaste a mão da câmera'; }
  } else if(st.id==='gL'||st.id==='gR'){
    const side=st.id==='gL'?v.cx<0.5:v.cx>0.5;
    if(v.nC>=2&&v.cy<0.75&&side){ if(!tut.h0) tut.h0=now; tut.gy.push(v.cy); tut.fb='Segure a guarda...'; if(now-tut.h0>800) tutOk('Guarda reconhecida!'); }
    else { tut.h0=0; tut.fb=v.nC<2?'Feche o punho':'Levante o punho perto do rosto, do lado '+(st.id==='gL'?'esquerdo':'direito')+' da tela'; }
  } else {
    if(v.nC>=3&&(v.speed>0.9||v.grow>0.45)){ if(!tut.cur) tut.cur={t:now,ms:0,mg:0,ref:v.ref}; tut.cur.ms=Math.max(tut.cur.ms,v.speed); tut.cur.mg=Math.max(tut.cur.mg,v.grow); tut.cur.l=now; }
    if(tut.cur&&(now-tut.cur.l>150||now-tut.cur.t>650)){ const c=tut.cur; tut.cur=null; tutAttempt(punchType(c.ref,v.cx,v.cy,c.ms,c.mg),c.ms,c.mg); }
  }
}
function tutFinish(){
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)), okp=id=>tut.peaks.filter(p=>p.ok&&p.id===id);
  const lat=[...okp('gancho'),...okp('upper')], fwd=[...okp('jab'),...okp('cross')];
  if(lat.length>=2) BXC.speed=clamp(0.6*median(lat.map(p=>p.ms)),0.9,2.2);       // golpes laterais/verticais medem a velocidade
  if(fwd.length>=2) BXC.grow=clamp(0.55*median(fwd.map(p=>p.mg)),0.4,1.4);       // golpes retos medem o crescimento da mão
  const jb=okp('jab').map(p=>p.mg), cr=okp('cross').map(p=>p.mg);
  if(jb.length&&cr.length) BXC.cx=clamp(((median(jb)+median(cr))/2)/BXC.grow,1.15,2.5);
  if(tut.gy.length>=10) BXC.guardY=clamp(median(tut.gy)+0.12,0.45,0.75);
  Object.assign(BXBASE,{speed:BXC.speed,grow:BXC.grow,cx:BXC.cx});
  bxCalDone=true; lsSet('linkglove_box_cal',{c:BXC,done:true});
  tut.on=false; $('btnBxSkip').style.display='none'; tut.fin=performance.now();
  $('bxMsg').textContent='✅ Calibrado! Seus limites foram ajustados.';
  if(tut.then){ tut.then=false; setTimeout(()=>{ if(!box.on&&!tut.on) startFight(); },1200); }
}
function startTut(then){
  if(!camOn){ camMsg('Ligue a câmera para o tutorial.'); return; }
  Object.assign(tut,{on:true,i:0,n:0,miss:0,h0:0,gy:[],peaks:[],cur:null,fb:'Mostre a mão para a câmera',then:!!then});
  box.on=false; box.hh={}; box.pend={}; box.pl={hp:100,st:100,gL:0,gR:0,exh:0};
  $('btnBxSkip').style.display=''; $('btnBx').textContent='Cancelar tutorial'; $('bxMsg').textContent='Siga os passos na tela. Cada golpe é reconhecido duas vezes.';
  requestAnimationFrame(tutStep);
}
function tutStep(){ if(!tut.on) return; tutDraw(); requestAnimationFrame(tutStep); }
function tutEnd(){ tut.on=false; tut.then=false; $('btnBxSkip').style.display='none'; $('btnBx').textContent='Começar luta'; $('bxMsg').textContent='Tutorial encerrado.'; boxDraw(); }
function startFight(){
  if(!camOn){ camMsg('Ligue a câmera para lutar.'); return; }
  const lv=+$('bxLv').value, L=BXL[lv], now=performance.now();
  Object.assign(box,{on:true,lv,t:now,end:now+90000,msg:'Prepare-se!',flash:0,lastPunch:0,hh:{},pend:{},cb:0,cbT:0,lastType:null});
  box.pl={hp:L.plHp,st:100,gL:0,gR:0,exh:0}; Object.assign(box.opp,{hp:L.oppHp,st:'idle',t:2,tot:1,q:[],guard:false,gt:0.5,feint:false});
  $('btnBx').textContent='Parar luta'; $('bxMsg').textContent='Defenda com o punho levantado no lado indicado. Ataque com jab, direto, gancho (arco lateral) ou uppercut (de baixo para cima); misturar golpes dá combo.';
  requestAnimationFrame(boxStep);
}
function nextTele(L,mult){ const o=box.opp; o.side=o.q.shift(); o.st='tele'; o.tot=o.t=L.tele*mult*(1+(Math.random()*2-1)*L.tvar); }
function startAttack(L){
  const o=box.opp, n=L.combo>1?1+Math.floor(Math.random()*L.combo):1; o.q=[];
  for(let i=0;i<n;i++) o.q.push(Math.random()<L.both?'B':Math.random()<0.5?'L':'R');
  o.feint=Math.random()<L.feint; nextTele(L,1);
}
function strike(L){
  const o=box.opp, p=box.pl, now=performance.now(), gl=now<p.gL, gr=now<p.gR; o.su=now+280;
  const blocked=(!L.stam||p.st>0)&&(o.side==='L'?gl:o.side==='R'?gr:(gl&&gr));
  if(blocked){
    box.msg='✅ Defendeu!'; if(L.stam) p.st=Math.min(100,p.st+15);
    if(box.lv===3&&o.q.length) nextTele(L,0.85); else { o.q=[]; o.st='recover'; o.t=L.stagger; }
  } else {
    p.hp-=L.dmg; box.flash=now+300; box.msg='💥 Levou um golpe!';
    if(p.hp<=0){ boxEnd('ko'); return; }
    if(o.q.length) nextTele(L,0.8); else { o.st='idle'; o.t=rr(L.gap); }
  }
}
function boxStep(ts){
  if(!box.on) return;
  const dt=Math.min(0.05,(ts-box.t)/1000); box.t=ts; const L=BXL[box.lv], o=box.opp, p=box.pl;
  if(L.stam){
    const now=performance.now(), act=(now<p.gL?1:0)+(now<p.gR?1:0);
    p.st = act ? p.st-L.drain*act*dt : Math.min(100,p.st+18*dt);        // segurar a guarda cansa
    if(p.st<=0){ p.st=0; p.gL=p.gR=0; p.exh=now+1500; box.msg='😮‍💨 Sem fôlego: guarda caiu!'; }
  }
  o.t-=dt;
  if(o.st==='idle'){ o.gt-=dt; if(o.gt<=0){ o.guard=Math.random()<L.guard; o.gt=0.7+Math.random()*0.5; } if(o.t<=0){ o.guard=false; startAttack(L); } }
  else if(o.st==='tele'&&o.t<=0){ if(o.feint){ o.feint=false; o.q=[]; o.st='idle'; o.t=0.5+Math.random()*0.4; box.msg='Era uma finta!'; } else strike(L); }
  else if(o.st==='recover'&&o.t<=0){ o.st='idle'; o.t=rr(L.gap)*0.5; }
  if(box.on&&performance.now()>box.end) boxEnd('time');
  boxDraw(); if(box.on) requestAnimationFrame(boxStep);
}
const bxBar=(x,y,w,h,f,c)=>{ bx.fillStyle='#0d1024'; bx.fillRect(x,y,w,h); bx.fillStyle=c; bx.fillRect(x,y,Math.max(0,w*Math.min(1,f)),h); bx.strokeStyle='#2c3260'; bx.lineWidth=1; bx.strokeRect(x,y,w,h); };
const bxText=(t,x,y,s,c,al='center')=>{ bx.font='bold '+s+'px sans-serif'; bx.fillStyle=c; bx.textAlign=al; bx.fillText(t,x,y); };
function boxDrawOld(){
  const o=box.opp, p=box.pl, L=BXL[box.lv], now=performance.now();
  bx.fillStyle='#161a36'; bx.fillRect(0,0,640,360);
  bx.strokeStyle='#2c3260'; bx.lineWidth=4; [250,285,320].forEach(y=>{ bx.beginPath(); bx.moveTo(0,y); bx.lineTo(640,y); bx.stroke(); });
  let gl=[[270,185],[370,185]], head=[320,115], col='#ffb454';
  if(o.st==='tele'){ gl=o.side==='L'?[[215,120],[370,185]]:o.side==='R'?[[270,185],[425,120]]:[[215,120],[425,120]]; }
  else if(o.st==='recover'){ gl=[[255,240],[385,240]]; head=[320,128]; }
  else if(o.guard){ gl=[[295,120],[345,120]]; col='#5eead4'; }
  bx.fillStyle='#2c3260'; bx.fillRect(270,150,100,110);
  bx.fillStyle='#e8c7a0'; bx.beginPath(); bx.arc(head[0],head[1],36,0,7); bx.fill();
  gl.forEach(([x,y])=>{ bx.fillStyle=col; bx.beginPath(); bx.arc(x,y,24,0,7); bx.fill(); });
  bxBar(20,16,250,16,p.hp/L.plHp,'#5eead4'); bxBar(370,16,250,16,o.hp/L.oppHp,'#ff7a8a');
  if(L.stam) bxBar(20,38,250,8,p.st/100,'#ffb454');
  bxText('VOCÊ',20,66,14,'#9aa1cc','left'); bxText('MÁQUINA · '+L.nome.toUpperCase(),620,66,14,'#9aa1cc','right');
  bxText(Math.max(0,Math.ceil((box.end-now)/1000))+' s',320,34,16,'#9aa1cc');
  if(o.st==='tele'){ bxText(o.side==='L'?'◀ DEFENDA À ESQUERDA':o.side==='R'?'DEFENDA À DIREITA ▶':'▲ DEFENDA COM AS DUAS MÃOS ▲',320,312,24,'#ffb454'); bxBar(170,326,300,10,o.t/o.tot,'#ffb454'); }
  else if(o.st==='recover') bxText('ATAQUE AGORA!',320,312,28,'#5eead4');
  else if(o.guard) bxText('ele está se protegendo',320,312,20,'#9aa1cc');
  [['E',p.gL],['D',p.gR]].forEach(([s,u],i)=>{ bx.fillStyle=now<u?'#5eead4':'#2c3260'; bx.fillRect(i?580:20,296,40,40); bxText(s,i?600:40,326,20,'#0d1024'); });
  if(now<box.flash){ bx.strokeStyle='#ff7a8a'; bx.lineWidth=8; bx.strokeRect(4,4,632,352); }
  bxText(box.msg,320,92,18,'#eef0fb');
}
const bxRankGet=()=>rankGet()['boxe'+$('bxLv').value]||[];
function renderBxRank(){ const L=bxRankGet(); $('bxRank').innerHTML=L.length?'<ol style="padding-left:20px">'+L.map(x=>`<li>${x.n}: <b>${x.s}</b> <small style="color:var(--mut)">${x.d}</small></li>`).join('')+'</ol>':'<small style="color:var(--mut)">Ninguém venceu este nível ainda.</small>'; }
function boxEnd(reason){
  if(!box.on) return; box.on=false;
  const L=BXL[box.lv], o=box.opp, p=box.pl, left=Math.max(0,(box.end-performance.now())/1000);
  const win=reason==='win'||(reason==='time'&&o.hp/L.oppHp<p.hp/L.plHp);
  const score=win?Math.round((Math.max(0,p.hp)/L.plHp*100+left)*[1,2,4][box.lv-1]):0;
  box.msg=win?'🏆 Você venceu!':reason==='ko'?'💀 Nocaute! A máquina venceu.':'⏱ Tempo esgotado: a máquina venceu.';
  $('bxMsg').textContent=box.msg+(win?' Pontos: '+score:''); $('btnBx').textContent='Começar luta'; boxDraw();
  if(win){ PRG.box=Math.max(PRG.box||0,box.lv); award(20*box.lv); rankAdd('boxe'+box.lv,score); }
  renderBxRank();
}
$('btnBx').onclick=()=>{
  if(mp.mode==='box'&&mp.conn&&mp.conn.open){ if(mp.host){ if(mp.live) mpStop(); else mpStart(); } else toast('Só o anfitrião começa a luta. Deixe a câmera ligada.'); return; }
  if(tut.on){ tutEnd(); return; }
  if(box.on){ box.on=false; $('btnBx').textContent='Começar luta'; $('bxMsg').textContent='Luta encerrada.'; return; }
  if(!camOn){ camMsg('Ligue a câmera para lutar.'); return; }
  if(!bxCalDone){ startTut(true); return; }
  startFight();
};
$('btnBxTut').onclick=()=>{ if(box.on||mp.live) return; if(tut.on) tutEnd(); else startTut(false); };
$('btnBxSkip').onclick=()=>{
  if(!tut.on) return; const then=tut.then; bxCalDone=true; lsSet('linkglove_box_cal',{c:BXC,done:true});
  tut.on=false; tut.then=false; $('btnBxSkip').style.display='none'; $('bxMsg').textContent='Tutorial pulado: usando os limites padrão.';
  if(then) startFight(); else { $('btnBx').textContent='Começar luta'; boxDraw(); }
};
$('bxLv').onchange=renderBxRank;

renderPrg(); renderMods(); renderFav(); renderBxRank();

