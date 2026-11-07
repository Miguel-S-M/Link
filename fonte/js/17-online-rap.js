// Rap de Libras online
// ================= Rap de Libras online (Link × Null) =================
// Mesmo princípio do boxe: o anfitrião sorteia a letra e fecha o resultado de cada compasso;
// cada jogador reconhece o próprio sinal pela câmera e avisa "acertei" (com o tempo que levou).
const MP_HOW={
  box:'Quem cria a sala escolhe o personagem; o convidado fica com o outro. Os dois abrem este mesmo site (GitHub Pages), um cria a sala e o outro digita o código (ou abre o link do convite). Cada um joga com a própria câmera. O golpe do adversário aparece como aviso visual: levante o punho do lado indicado antes de a barra laranja acabar. Defender com sucesso deixa quem bateu exposto (leva 50% a mais). O seletor de nível, quando o anfitrião cria a sala, define a velocidade dos golpes (1 = lento, 3 = rápido).',
  rap:'Quem cria a sala escolhe o personagem; o convidado fica com o outro. A cada compasso aparece a mesma letra para os dois: faça o sinal com a câmera antes do fim do compasso. Quem acerta machuca o adversário; quem erra perde vida. Se os dois acertarem, quem sinalizou primeiro causa o dano total e o outro causa só 40%. O nível escolhido pelo anfitrião define o ritmo, o número de rodadas e o dano. Cada jogador usa o reconhecimento de letras e o alfabeto do próprio navegador.',
  race:'Quem cria a sala escolhe o personagem; o convidado fica com o outro. Os dois recebem a mesma sequência de letras. Faça cada letra com a câmera (segure a mão firme por um instante) para avançar na pista: o primeiro a completar 15 letras vence. Se os 60 segundos acabarem antes, vence quem fez mais letras. Cada um corre no próprio ritmo, sem esperar o adversário. Cada jogador usa o reconhecimento de letras e o alfabeto do próprio navegador.'
};
const MP_KEYS={
  box:'Jogar com o teclado (teste): ← → guarda · Z jab · X direto · C gancho · V uppercut · Shift = golpe do lado direito',
  rap:'Jogar com o teclado (teste): a barra de espaço faz o sinal da letra atual',
  race:'Jogar com o teclado (teste): a barra de espaço faz a letra atual'
};
function mpPlace(id){
  const md=MP_MODE[id]; $('mpBox').style.display=md?'':'none'; if(!md) return;
  mp.mode=md;
  const sec=$(md==='rap'?'gm-rap':md==='race'?'gm-timed':'gm-boxe'), row=sec&&sec.querySelector(':scope > .row');
  if(row&&$('mpBox').parentNode!==sec) sec.insertBefore($('mpBox'),row);
  $('mpHow').textContent=MP_HOW[mp.mode]; $('mpKeysTxt').textContent=MP_KEYS[mp.mode];
}
function rmpAudio(){ try{ rap.ctx=rap.ctx||new (window.AudioContext||window.webkitAudioContext)(); rap.ctx.resume(); }catch(e){} }
const rmpP=()=>({hp:100,score:0,combo:0,hit:0});
const rmpR=(n,tgt)=>({round:n,tgt,link:{done:false,el:0,early:false},null:{done:false,el:0,early:false}});
function rmpStart(){
  if(!mp.host||!mp.conn||!mp.conn.open){ mpSay('Crie uma sala e espere o adversário entrar.','bad'); return; }
  if(!(camOn||mp.keys)){ camMsg('Ligue a câmera (ou marque o teclado de teste).'); mpSay('Ligue a câmera antes de começar.','bad'); return; }
  if(!mp.peerCam){ mpSay('Aguardando o adversário ligar a câmera (ou o modo teclado).','bad'); return; }
  rmpAudio();
  const lv=Math.min(3,Math.max(1,+$('rapLv').value||1)), L=RAPL[lv], bm=60000/L.bpm, now=performance.now();
  rmp.lv=lv;
  rmp.rs={lv,L,bm,t0:now+bm*2,beat:-9,round:0,cur:null,prev:null,resAt:0,over:null,last:0,p:{link:rmpP(),null:rmpP()},msg:{link:'',null:''},msgT:{link:0,null:0}};
  mp.live=true; mp.over=null; rmp.seen={link:0,null:0}; rmp.round=0; rmp.beat=-9; rap.round=0; rap.done=false;
  mpSay('Batalha começando!','ok'); mpUi();
}
function rmpStop(){ const S=rmp.rs; if(S&&!S.over) rmpEnd('draw','quit'); }
function rmpEnd(w,why){ const S=rmp.rs; if(!S||S.over) return; S.over={w,why}; }
function rmpMsg(r,t){ const S=rmp.rs; if(S){ S.msg[r]=t; S.msgT[r]=performance.now()+1800; } }
function rmpFinish(why){
  const S=rmp.rs, A=S.p.link, B=S.p.null; let w;
  if(A.hp!==B.hp) w=A.hp>B.hp?'link':'null'; else if(A.score!==B.score) w=A.score>B.score?'link':'null'; else w='draw';
  rmpEnd(w,why||'rounds');
}
function rmpHostDone(r,round,early,el){
  const S=rmp.rs; if(!S||S.over||(r!=='link'&&r!=='null')) return;
  const R=(S.cur&&S.cur.round===round)?S.cur:(S.prev&&S.prev.round===round?S.prev:null); if(!R||R[r].done) return;
  R[r]={done:true,el:Math.min(S.bm*8,Math.max(0,isFinite(el)?el:S.bm*4)),early:!!early};
  const P=S.p[r]; P.combo++; P.score+=Math.round((early?150:100)*(1+Math.min(P.combo,10)*0.1));
  rmpMsg(r,early?'PERFEITO!':'BOM!');
}
function rmpResolve(R){
  const S=rmp.rs, L=S.L, a=R.link, b=R.null, to={link:0,null:0}, msg={link:'',null:''};
  const dm=P=>L.dP*(1+Math.min(P.combo,5)*0.1);
  if(a.done&&b.done){ const f=a.el<=b.el?'link':'null', s=mpOther(f); to[s]=dm(S.p[f]); to[f]=dm(S.p[s])*0.4; msg[f]='⚡ Mais rápido! Acertou o adversário.'; msg[s]='O adversário foi mais rápido.'; }
  else if(a.done||b.done){ const w=a.done?'link':'null', l=mpOther(w); to[l]=dm(S.p[w]); msg[w]='✔ Acertou! O adversário errou.'; msg[l]='Errou o sinal! Levou dano.'; }
  else { msg.link=msg.null='Ninguém acertou!'; }
  ['link','null'].forEach(r=>{
    const P=S.p[r]; let d=to[r];
    if(!R[r].done){ P.combo=0; d+=L.dM; }
    if(d>0){ P.hp=Math.max(0,P.hp-d); P.hit++; }
    rmpMsg(r,msg[r]);
  });
  if(S.p.link.hp<=0||S.p.null.hp<=0) rmpFinish('ko');
}
function rmpTick(){
  const S=rmp.rs; if(!S) return; const now=performance.now(); let push=false;
  if(!S.over){
    const b=Math.floor((now-S.t0)/S.bm);
    if(b!==S.beat){
      S.beat=b; push=true;
      if(b>=0&&b%4===0){
        S.prev=S.cur; S.resAt=S.prev?now+200:0;
        if(S.round<S.L.rounds){ S.round++; S.cur=rmpR(S.round,pickWeighted(letterPool(),S.prev?S.prev.tgt:'')); } else S.cur=null;
      }
    }
    if(S.prev&&now>=S.resAt){ const R=S.prev; S.prev=null; rmpResolve(R); push=true; }
    if(!S.over&&!S.cur&&!S.prev&&S.round>=S.L.rounds) rmpFinish('rounds');
  }
  if(push||now-S.last>=MPR.tick){ S.last=now; const v=rmpBuildView(); rmpApplyView(v); mpSend({t:'rv',v}); }
}
function rmpBuildView(){
  const S=rmp.rs, now=performance.now(), c=S.cur, r1=x=>Math.round(x*10)/10;
  const pk=r=>{ const P=S.p[r]; return {hp:r1(P.hp),score:P.score,combo:P.combo,done:c?c[r].done:false,hit:P.hit}; };
  return {bm:S.bm,ph:Math.round(now-S.t0),beat:S.beat,round:c?c.round:S.round,rounds:S.L.rounds,tgt:c?c.tgt:'',over:S.over,
    p:{link:pk('link'),null:pk('null')},msg:{link:now<S.msgT.link?S.msg.link:'',null:now<S.msgT.null?S.msg.null:''}};
}
function rmpApplyView(v){
  const now=performance.now(); v.at=now; rmp.v=v;
  if(v.round!==rmp.round||v.tgt!==rap.target){ rmp.round=v.round; rap.round=v.round; rap.target=v.tgt; rap.done=false; rap.hold=null; rap.tb=now; rap.bm=v.bm; }
  if(v.beat!==rmp.beat){ rmp.beat=v.beat; if(v.beat>=0){ rapSound(v.beat); if($('rapVib').checked&&navigator.vibrate) navigator.vibrate(v.beat%4===0?60:25); } }
  ['link','null'].forEach(r=>{ const h=v.p[r].hit; if(h>rmp.seen[r]){ rmp.hurt[r]=now+350; if(r===mp.me) mp.flash=now+300; } rmp.seen[r]=h; });
  if(!v.over){ mp.over=null; if(!mp.live&&!mp.host) mp.live=true; }
  else if(!mp.over){ mp.over=v.over; mp.live=false; rap.round=0; mpOver(v.over); }
  mpUi();
}
function rmpDone(early){
  const el=performance.now()-rap.tb;
  if(mp.host) rmpHostDone(mp.me,rmp.round,early,el); else mpSend({t:'rdone',round:rmp.round,early:!!early,el:Math.round(el+(mp.ping||0)/2)});
}
function rmpKeySign(){
  if(!mp.live||mp.mode!=='rap'||!rap.round||rap.done) return;
  rap.done=true; rmpDone(performance.now()-rap.tb<rap.bm*2);
}
function rmpDraw(){
  const c=rx, now=performance.now(), v=rmp.v, me=mp.me;
  const bm=v?v.bm:700, t0=v?v.at-v.ph:now, lb=Math.floor((now-t0)/bm), ph=(((now-t0)/bm)%1+1)%1, bob=Math.sin(ph*Math.PI*2)*5;
  const g=c.createLinearGradient(0,0,0,360); g.addColorStop(0,'#0a0f2e'); g.addColorStop(1,'#240a48'); c.fillStyle=g; c.fillRect(0,0,640,360);
  c.fillStyle='#0b1226'; for(let i=0;i<14;i++){ c.beginPath(); c.arc(25+i*46,352+Math.sin(i+now/700)*3,26,0,7); c.fill(); }
  const PL=v&&v.p.link, PN=v&&v.p.null;
  bxBarC(c,20,14,240,14,(PL?PL.hp:100)/100,'#00e5ff'); bxBarC(c,380,14,240,14,(PN?PN.hp:100)/100,'#ff2dd1');
  tx(c,'LINK'+(me==='link'?' (VOCÊ)':''),20,46,13,'#00e5ff','left'); tx(c,'NULL'+(me==='null'?' (VOCÊ)':''),620,46,13,'#ff2dd1','right'); tx(c,'VS',320,36,28,'#f8fafc');
  spr(now<rmp.hurt.link?'link_esq':(PL&&PL.done?'link_jab':'link_idle'),14,100+bob,195,false,0,c);
  const nk=now<rmp.hurt.null?'null_esq':(PN&&PN.done?'null_jab':'null_idle'), im=SPR[nk], wn=im&&im.naturalHeight?im.naturalWidth*195/im.naturalHeight:140; spr(nk,640-14-wn,100-bob,195,true,0,c);
  c.fillStyle='rgba(8,18,40,.88)'; c.strokeStyle='#00e5ff'; c.lineWidth=3; rrect(c,210,66,220,160,14); c.fill(); c.stroke();
  if(!v){ tx(c,mp.host?'Aguardando você começar…':'Aguardando o anfitrião…',320,150,15,'#f8fafc'); return; }
  tx(c,v.round?'Faça o sinal de Libras:':'Prepare-se...',320,92,15,'#f8fafc');
  if(v.round){ const a=imgOf(v.tgt); if(a&&a.complete&&a.naturalWidth) c.drawImage(a,265,100,110,81); tx(c,'"'+v.tgt+'"',320,214,22,'#00e5ff'); }
  if(PL.done) tx(c,'✔ sinalizou',20,62,12,'#34d399','left'); if(PN.done) tx(c,'sinalizou ✔',620,62,12,'#34d399','right');
  const AR=['◀','▼','▲','▶'], col=['#00b8d9','#3b82f6','#22c55e','#ff9500'], cur=((lb%4)+4)%4;
  for(let i=0;i<4;i++){ const on=v.beat>=0&&cur===i; c.fillStyle=on?col[i]:'#0f172a'; c.strokeStyle=col[i]; c.lineWidth=3; rrect(c,200+i*60,258,52,52,10); c.fill(); c.stroke(); tx(c,AR[i],226+i*60,293,24,on?'#03131f':col[i]); }
  c.fillStyle='rgba(8,18,40,.85)'; c.strokeStyle='#00e5ff'; c.lineWidth=2; rrect(c,18,262,170,50,10); c.fill(); c.stroke(); tx(c,'PONTOS '+PL.score,103,284,16,'#00e5ff'); tx(c,'COMBO x'+PL.combo,103,303,12,'#9ca3af');
  c.fillStyle='rgba(8,18,40,.85)'; c.strokeStyle='#ff2dd1'; rrect(c,452,262,170,50,10); c.fill(); c.stroke(); tx(c,'PONTOS '+PN.score,537,284,16,'#ff2dd1'); tx(c,'COMBO x'+PN.combo,537,303,12,'#9ca3af');
  bxBarC(c,150,336,340,10,v.round/v.rounds,'#8b5cf6'); tx(c,'♪ Rodada '+v.round+' de '+v.rounds,150,331,12,'#9ca3af','left');
  tx(c,v.msg[me]||'',320,56,15,'#f8fafc');
  if($('rapPulse').checked&&!v.over){ c.strokeStyle='rgba(0,229,255,'+(0.55*(1-ph)).toFixed(2)+')'; c.lineWidth=8; c.strokeRect(4,4,632,352); }
  if(now<mp.flash){ c.strokeStyle='#ff4d6d'; c.lineWidth=8; c.strokeRect(4,4,632,352); }
  if(v.over){ const o=v.over, t=o.w==='draw'?'EMPATE':o.w===me?'VOCÊ VENCEU!':'VOCÊ PERDEU'; c.fillStyle='rgba(3,19,31,.72)'; c.fillRect(0,125,640,110); tx(c,t,320,190,44,o.w===me?'#34d399':o.w==='draw'?'#9ca3af':'#ff4d6d'); }
}

