// Boxe online (WebRTC / PeerJS)
// ================= Boxe online (2 jogadores): Link × Null via WebRTC (PeerJS) =================
// O anfitrião (quem cria a sala) roda a simulação; o convidado envia guarda/golpes e recebe o estado ~20×/s.
// Não há servidor próprio: o PeerJS Cloud só apresenta os dois computadores, depois os dados vão direto entre eles.
const MP_GAME={box:'boxe',rap:'rap',race:'letras'};
const MP_MODE={boxe:'box',rap:'rap',letras:'race'};
const MP_BTN={box:['btnBx','Começar luta online','Parar luta','Começar luta'],rap:['btnRap','Começar batalha online','Parar batalha','Começar batalha'],race:['btnGm','Começar corrida online','Parar corrida','Começar jogo']};
const mpOther=r=>r==='link'?'null':'link';
const mpName=r=>r==='link'?'Link':'Null';
const mpK={L:false,R:false};
function mpSay(m,cls){ const e=$('mpStatus'); e.textContent=m; e.className=cls||''; }
function mpSend(m){ try{ if(mp.conn&&mp.conn.open) mp.conn.send(m); }catch(e){} }
function mpErr(e){ return (e&&(e.type||e.message))||'desconhecido'; }
function mpLib(){ if(typeof Peer==='undefined'){ mpSay('A biblioteca de rede (PeerJS) não carregou. Verifique a internet ou bloqueadores de anúncio/scripts.','bad'); return false; } return true; }

function mpUi(){
  const open=!!(mp.conn&&mp.conn.open), busy=!!(mp.peer||mp.active);
  $('mpCreate').disabled=busy; $('mpJoin').disabled=busy; $('mpRole').disabled=busy;
  $('mpLeave').style.display=busy?'':'none';
  $('mpRoom').style.display=(mp.host&&mp.code)?'flex':'none'; $('mpRoomCode').textContent=mp.code||'';
  $('mpInfo').textContent=open?('Você: '+mpName(mp.me)+' · Adversário: '+mpName(mpOther(mp.me))+(mp.host?'':(mp.ping?' · latência '+mp.ping+' ms':''))):'';
  if(open){ const B=MP_BTN[mp.mode]; $(B[0]).textContent=mp.host?(mp.live?B[2]:B[1]):(mp.live?'Em andamento…':'Aguardando o anfitrião'); }
  $('cmpCv').style.display=(mp.active&&mp.mode==='race')?'block':'none';
}

function mpStopLoops(){ mp.timers.forEach(clearInterval); mp.timers=[]; }
function mpStartLoops(){
  mpStopLoops();
  mp.timers.push(setInterval(mpSample,50));
  mp.timers.push(setInterval(()=>{ if(mp.host){ mpTick(); rmpTick(); cmpStep(); } },40));
  mp.timers.push(setInterval(()=>{ if(!mp.host) mpSend({t:'ping',ts:performance.now()}); },2000));
  if(!mp.raf){ mp.raf=true; requestAnimationFrame(mpFrame); }
}
function mpFrame(){ if(!mp.active){ mp.raf=false; return; } if(mp.mode==='rap') rmpDraw(); else if(mp.mode==='race') cmpDraw(); else mpDraw(); requestAnimationFrame(mpFrame); }

function mpReset(keepUi){
  mpStopLoops(); clearTimeout(mp.timer);
  try{ if(mp.conn) mp.conn.close(); }catch(e){}
  try{ if(mp.peer) mp.peer.destroy(); }catch(e){}
  Object.assign(mp,{peer:null,conn:null,host:false,code:'',active:false,live:false,view:null,sim:null,peerCam:false,ping:0,over:null,seen:{link:0,null:0},flash:0});
  rmp.rs=null; rmp.v=null; rmp.round=0; rmp.beat=-9; rmp.seen={link:0,null:0}; rap.round=0; cmpClear();
  mpK.L=mpK.R=false; if(!keepUi){ $('btnBx').textContent='Começar luta'; $('btnRap').textContent='Começar batalha'; $('btnGm').textContent='Começar jogo'; }
  mpUi();
}
function mpLeave(){ mpSend({t:'bye'}); mpReset(); mpSay('Você saiu da sala.'); boxDraw(); rapDraw(performance.now()); }

// ---------- criar / entrar ----------
function mpCreate(tries){
  tries=tries||0; if(!mpLib()) return; if(mp.mode==='rap') rmpAudio();
  mpReset(true); mp.host=true; mp.me=$('mpRole').value; mp.guestRole=mpOther(mp.me);
  mp.code=Array.from({length:5},()=>MP_ALPHA[Math.floor(Math.random()*MP_ALPHA.length)]).join('');
  mpSay('Criando sala…'); mpUi();
  const p=mp.peer=new Peer(MP_PREFIX+mp.code,{debug:1,config:MP_ICE});
  p.on('open',()=>{ mp.active=true; mpSay('Sala criada! Passe o código '+mp.code+' (ou o link do convite) para o outro jogador.','ok'); mpStartLoops(); mpUi(); });
  p.on('connection',c=>{ if(mp.conn&&mp.conn.open){ c.on('open',()=>c.close()); return; } mpAttach(c); });
  p.on('error',e=>{ if(e.type==='unavailable-id'&&tries<4){ mpCreate(tries+1); return; } mpSay('Erro de rede: '+mpErr(e),'bad'); });
  p.on('disconnected',()=>{ try{ p.reconnect(); }catch(e){} });
}
function mpJoin(){
  if(!mpLib()) return; if(mp.mode==='rap') rmpAudio();
  const code=$('mpCode').value.trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length<4){ mpSay('Digite o código da sala.','bad'); return; }
  mpReset(true); mp.host=false; mp.code=code; mpSay('Conectando…'); mpUi();
  const p=mp.peer=new Peer(undefined,{debug:1,config:MP_ICE});
  p.on('open',()=>{
    mpAttach(p.connect(MP_PREFIX+code,{reliable:true,serialization:'json'}));
    mp.timer=setTimeout(()=>{ if(!mp.conn||!mp.conn.open) mpSay('Não consegui conectar. Confira o código e se o anfitrião ainda está com a sala aberta. Redes muito restritas (empresa/escola) podem bloquear a conexão direta.','bad'); },15000);
  });
  p.on('error',e=>mpSay(e.type==='peer-unavailable'?'Sala não encontrada. Confira o código.':'Erro de rede: '+mpErr(e),'bad'));
}
function mpAttach(c){
  mp.conn=c;
  c.on('open',()=>{
    clearTimeout(mp.timer); mp.active=true; mp.peerCam=false;
    if(mp.host){ mpSend({t:'hello',role:mp.guestRole,mode:mp.mode}); mpSay('Adversário conectado! Você é o '+mpName(mp.me)+'. Ligue a câmera e clique em "'+(mp.mode==='rap'?'Começar batalha online':'Começar luta online')+'".','ok'); }
    mpStartLoops(); mpUi();
  });
  c.on('data',mpOnData);
  c.on('close',()=>{ if(mp.conn===c) mpPeerGone(); });
  c.on('error',()=>{ if(mp.conn===c) mpPeerGone(); });
}
function mpPeerGone(){
  const wasHost=mp.host; mp.conn=null; mp.live=false; mp.sim=null; mp.view=null; mp.peerCam=false; rmp.rs=null; rmp.v=null; rap.round=0; cmpClear();
  if(wasHost){ mpSay('O adversário saiu. A sala continua aberta com o código '+mp.code+'.'); mpUi(); }
  else { mpReset(); mpSay('O anfitrião encerrou a sala.','bad'); }
  $('btnBx').textContent=wasHost&&mp.mode==='box'?'Começar luta online':'Começar luta'; $('btnRap').textContent=wasHost&&mp.mode==='rap'?'Começar batalha online':'Começar batalha'; $('btnGm').textContent=wasHost&&mp.mode==='race'?'Começar corrida online':'Começar jogo';
}
function mpOnData(m){
  if(!m||typeof m!=='object') return;
  switch(m.t){
    case 'hello': if(m.role==='link'||m.role==='null'){ const want=(m.mode==='rap'||m.mode==='race')?m.mode:'box'; if(want!==mp.mode){ mp.switching=true; try{ openGame(MP_GAME[want]); }finally{ mp.switching=false; } } mp.me=m.role; $('mpRole').value=m.role; mpSay('Conectado! Você é o '+mpName(mp.me)+'. Ligue a câmera e aguarde o anfitrião começar.','ok'); mpUi(); } break;
    case 'v': if(!mp.host&&mp.mode==='box'&&m.v&&m.v.p) mpApplyView(m.v); break;
    case 'rv': if(!mp.host&&mp.mode==='rap'&&m.v&&m.v.p) rmpApplyView(m.v); break;
    case 'cstart': if(!mp.host&&mp.mode==='race'&&Array.isArray(m.seq)&&m.seq.length>=5&&m.seq.length<=80){ cmp.seq=m.seq.map(x=>String(x).slice(0,2)); cmp.goal=Math.min(60,Math.max(3,+m.goal||15)); cmp.n=0; cmp.v=null; cmp.hold=null; cmp.lock=false; mp.live=true; mp.over=null; cmpUi(); mpUi(); } break;
    case 'cv': if(!mp.host&&mp.mode==='race'&&m.v&&m.v.p) cmpApplyView(m.v); break;
    case 'cp': if(mp.host&&mp.mode==='race') cmpHostProgress(mp.guestRole,+m.n); break;
    case 'rdone': if(mp.host&&mp.mode==='rap') rmpHostDone(mp.guestRole,m.round,!!m.early,+m.el); break;
    case 'in': if(mp.host){ mp.peerCam=!!m.c; const S=mp.sim; if(S&&Array.isArray(m.g)){ const P=S.p[mp.guestRole]; P.g=[!!m.g[0],!!m.g[1]]; P.gAt=performance.now(); } } break;
    case 'punch': if(mp.host&&mp.mode==='box') mpHostPunch(mp.guestRole,m.type,m.side); break;
    case 'ping': mpSend({t:'pong',ts:m.ts}); break;
    case 'pong': mp.ping=Math.round(performance.now()-m.ts); mpUi(); break;
    case 'bye': break;
  }
}

// ---------- entrada local (câmera ou teclado) ----------
function mpSample(){
  const now=performance.now();
  if(mp.keys){ if(mpK.L) box.pl.gL=now+250; if(mpK.R) box.pl.gR=now+250; }
  const g=[now<box.pl.gL, now<box.pl.gR], c=!!(camOn||mp.keys);
  if(mp.host){ mp.hostCam=c; const S=mp.sim; if(S){ const P=S.p[mp.me]; P.g=g; P.gAt=now; } }
  else mpSend({t:'in',g,c});
}
function mpLocalPunch(type,side){
  if(!mp.live) return;
  if(mp.host) mpHostPunch(mp.me,type,side); else mpSend({t:'punch',type,side});
}
const MPKEYS={KeyZ:'jab',KeyX:'cross',KeyC:'gancho',KeyV:'upper'};
addEventListener('keydown',e=>{
  if(!mp.keys||!mp.active||/INPUT|SELECT|TEXTAREA/.test((e.target.tagName||''))) return;
  if(mp.mode==='rap'||mp.mode==='race'){ if(e.code==='Space'&&!e.repeat){ e.preventDefault(); if(mp.mode==='rap') rmpKeySign(); else cmpKeySign(); } return; }
  if(e.code==='ArrowLeft'){ mpK.L=true; e.preventDefault(); }
  else if(e.code==='ArrowRight'){ mpK.R=true; e.preventDefault(); }
  else if(MPKEYS[e.code]&&!e.repeat) mpLocalPunch(MPKEYS[e.code],e.shiftKey?'R':'L');
});
addEventListener('keyup',e=>{ if(e.code==='ArrowLeft') mpK.L=false; if(e.code==='ArrowRight') mpK.R=false; });

// ---------- simulação (somente no anfitrião) ----------
function mpMsg(r,t){ const S=mp.sim; if(!S) return; S.msg[r]=t; S.msgT[r]=performance.now()+1800; }
function mpStart(){
  if(!mp.host||!mp.conn||!mp.conn.open){ mpSay('Crie uma sala e espere o adversário entrar.','bad'); return; }
  if(!(camOn||mp.keys)){ camMsg('Ligue a câmera (ou marque o teclado de teste).'); mpSay('Ligue a câmera antes de começar.','bad'); return; }
  if(!mp.peerCam){ mpSay('Aguardando o adversário ligar a câmera (ou o modo teclado).','bad'); return; }
  const mk=()=>({hp:100,st:100,g:[false,false],gAt:performance.now(),on:false,exh:0,brk:0,rec:0,pu:0,pty:'jab',cb:0,cbT:0,lt:null,next:0,hit:0});
  mp.sim={t:performance.now(),acc:0,cd:MPR.cd,run:false,endAt:0,over:null,atk:[],msg:{link:'',null:''},msgT:{link:0,null:0},p:{link:mk(),null:mk()},lv:Math.min(3,Math.max(1,+$('bxLv').value||1))};
  mp.live=true; mp.over=null; mp.seen={link:0,null:0}; box.pl.gL=box.pl.gR=0;
  mpSay('Luta começando!','ok'); mpUi();
}
function mpStop(){ const S=mp.sim; if(S&&!S.over) mpEnd('draw','quit'); }
function mpEnd(w,why){ const S=mp.sim; if(!S||S.over) return; S.over={w,why}; S.run=false; S.atk=[]; }
function mpHostPunch(from,type,side){
  const S=mp.sim; if(!S||!S.run||S.over||!BXT[type]||(side!=='L'&&side!=='R')) return;
  const P=S.p[from], now=performance.now(); if(now<P.next) return; P.next=now+380;
  const T=BXT[type], cost=MPR.pcost*T.cost; if(P.st<cost){ mpMsg(from,'Sem fôlego!'); return; }
  P.st-=cost; P.pu=now+300; P.pty=type;
  P.cb=(now-P.cbT<1300&&P.lt!==type)?P.cb+1:1; P.cbT=now; P.lt=type;
  const w=MPR.windup[S.lv-1];
  S.atk.push({from,to:mpOther(from),type,side,t:w,tot:w,cb:P.cb});
  mpMsg(from,'🥊 '+T.n+(P.cb>1?' · combo ×'+P.cb:''));
}
function mpResolve(a){
  const S=mp.sim, D=S.p[a.to], A=S.p[a.from], now=performance.now(), T=BXT[a.type];
  const base=MPR.dmg*T.dmg*Math.min(1.5,1+0.12*(a.cb-1))*(D.rec>0?1.5:1);
  const guarded=D.on&&(a.side==='L'?D.g[0]:D.g[1]);
  const hurt=d=>{ D.hp-=d; D.hit++; };
  if(guarded){
    if(a.type==='gancho'){ hurt(base*0.5); mpMsg(a.to,'💥 O gancho contornou a sua guarda!'); mpMsg(a.from,'↪ O gancho contornou a guarda!'); }
    else if(a.type==='upper'){ hurt(base*0.4); D.brk=now+900; mpMsg(a.to,'⬆ O uppercut quebrou a sua guarda!'); mpMsg(a.from,'⬆ O uppercut quebrou a guarda!'); }
    else { A.rec=MPR.recover; D.st=Math.min(100,D.st+10); mpMsg(a.to,'✅ Defendeu!'); mpMsg(a.from,'🛡 Bloqueado! Você ficou exposto.'); }
  } else { hurt(base); mpMsg(a.to,'💥 Levou um golpe!'); mpMsg(a.from,'💥 '+T.n+' certeiro!'); }
  if(D.hp<=0){ D.hp=0; mpEnd(a.from,'ko'); }
}
function mpTick(){
  const S=mp.sim; if(!S) return;
  const now=performance.now(), dt=Math.min(0.1,(now-S.t)/1000); S.t=now;
  if(!S.over){
    if(S.cd>0){ S.cd-=dt; if(S.cd<=0){ S.cd=0; S.run=true; S.endAt=now+MPR.time*1000; mpMsg('link','Lutem!'); mpMsg('null','Lutem!'); } }
    else if(S.run){
      ['link','null'].forEach(r=>{
        const P=S.p[r];
        if(now-P.gAt>700) P.g=[false,false];
        P.on=(P.g[0]||P.g[1])&&now>=P.exh&&now>=P.brk;
        P.st=P.on?P.st-MPR.drain*dt*((P.g[0]&&P.g[1])?2:1):Math.min(100,P.st+MPR.regen*dt);
        if(P.st<=0){ P.st=0; P.exh=now+1500; P.on=false; mpMsg(r,'😮‍💨 Sem fôlego: a guarda caiu!'); }
        if(P.rec>0) P.rec=Math.max(0,P.rec-dt);
      });
      S.atk.forEach(a=>a.t-=dt);
      const due=S.atk.filter(a=>a.t<=0); S.atk=S.atk.filter(a=>a.t>0);
      due.forEach(a=>{ if(!S.over) mpResolve(a); });
      if(!S.over&&now>S.endAt){ const x=S.p.link.hp, y=S.p.null.hp; mpEnd(x===y?'draw':x>y?'link':'null','time'); }
    }
  }
  S.acc+=dt;
  if(S.acc>=MPR.tick/1000){ S.acc=0; const v=mpBuildView(); mpApplyView(v); mpSend({t:'v',v}); }
}
function mpBuildView(){
  const S=mp.sim, now=performance.now(), r1=x=>Math.round(x*10)/10;
  const pk=r=>{ const P=S.p[r]; return {hp:r1(P.hp),st:Math.round(P.st),g:[P.on&&P.g[0],P.on&&P.g[1]],pu:Math.max(0,Math.round(P.pu-now)),pty:P.pty,rec:Math.round(P.rec*100)/100,exh:Math.max(0,Math.round(P.exh-now)),hit:P.hit}; };
  return {cd:Math.round(S.cd*100)/100,run:S.run,left:S.run?Math.max(0,(S.endAt-now)/1000):MPR.time,over:S.over,p:{link:pk('link'),null:pk('null')},
    atk:S.atk.map(a=>({from:a.from,to:a.to,side:a.side,type:a.type,left:Math.round(a.t*100)/100,tot:a.tot})),
    msg:{link:now<S.msgT.link?S.msg.link:'',null:now<S.msgT.null?S.msg.null:''}};
}

// ---------- estado recebido (anfitrião e convidado usam o mesmo caminho) ----------
function mpApplyView(v){
  v.at=performance.now(); mp.view=v;
  ['link','null'].forEach(r=>{ const h=v.p[r].hit; if(!v.run) mp.seen[r]=h; else if(h>mp.seen[r]){ if(r===mp.me) mp.flash=v.at+300; mp.seen[r]=h; } });
  if(!v.over){ mp.over=null; if(!mp.live&&!mp.host){ mp.live=true; } }
  else if(!mp.over){ mp.over=v.over; mp.live=false; mpOver(v.over); }
  mpUi();
}
function mpOver(o){
  const draw=o.w==='draw', win=o.w===mp.me;
  const why={ko:'nocaute',time:'fim do tempo',goal:win?'você chegou primeiro':'o adversário chegou primeiro',rounds:'fim das rodadas'}[o.why]||'encerrado';
  const msg=draw?'🤝 Empate ('+why+').':win?'🏆 Você venceu! ('+why+')':'💀 Você perdeu ('+why+').';
  mpSay(msg,win?'ok':draw?'':'bad'); $(mp.mode==='rap'?'rapMsg':mp.mode==='race'?'gmMsg':'bxMsg').textContent=msg;
  if(win){ try{ award(mp.mode==='rap'?15*(rmp.lv||1):mp.mode==='race'?15:25); }catch(e){} }
  mpUi();
}

// ---------- desenho ----------
function mpDraw(){
  const now=performance.now(), v=mp.view, me=mp.me, c=bx;
  const g=c.createLinearGradient(0,0,0,360); g.addColorStop(0,'#0a1230'); g.addColorStop(1,'#1a0a3a'); c.fillStyle=g; c.fillRect(0,0,640,360);
  c.strokeStyle='rgba(0,229,255,.22)'; c.lineWidth=2; for(let i=0;i<5;i++){ c.beginPath(); c.moveTo(0,275+i*18); c.lineTo(640,275+i*18); c.stroke(); }
  const el=v?(now-v.at):0, PL=v&&v.p.link, PN=v&&v.p.null;
  const pose=(r,P)=>P&&P.pu-el>0?r+'_'+P.pty:(P&&(P.g[0]||P.g[1])?r+'_esq':r+'_idle');
  spr(pose('link',PL),26,96,215,false,PL&&PL.rec>0?-0.1:0);
  const nk=pose('null',PN), im=SPR[nk], wn=im&&im.naturalHeight?im.naturalWidth*215/im.naturalHeight:150;
  spr(nk,640-26-wn,96,215,true,PN&&PN.rec>0?0.14:0);
  bxText('LINK'+(me==='link'?' (VOCÊ)':''),20,66,14,'#00e5ff','left'); bxText('NULL'+(me==='null'?' (VOCÊ)':''),620,66,14,'#ff2dd1','right');
  if(!v){ bxBar(20,16,250,16,1,'#00e5ff'); bxBar(370,16,250,16,1,'#ff2dd1'); bxText(mp.host?'Aguardando você começar a luta…':'Aguardando o anfitrião começar a luta…',320,312,20,'#9ca3af'); return; }
  bxBar(20,16,250,16,PL.hp/100,'#00e5ff'); bxBar(370,16,250,16,PN.hp/100,'#ff2dd1');
  if(me==='link') bxBar(20,38,250,8,PL.st/100,'#ff9500'); else bxBar(370,38,250,8,PN.st/100,'#ff9500');
  if(v.run) bxText(Math.ceil(Math.max(0,v.left-el/1000))+' s',320,34,16,'#9ca3af');
  const inc=v.atk.filter(a=>a.to===me).sort((a,b)=>a.left-b.left)[0], mine=v.p[me], opp=v.p[mpOther(me)];
  if(inc){ const left=Math.max(0,inc.left-el/1000); bxText(inc.side==='L'?'◀ DEFENDA À ESQUERDA':'DEFENDA À DIREITA ▶',320,312,24,'#ff9500'); bxBar(170,326,300,10,left/inc.tot,'#ff9500'); }
  else if(v.run&&opp.rec>0) bxText('ATAQUE AGORA!',320,312,28,'#34d399');
  else if(v.run&&mine.rec>0) bxText('você ficou exposto!',320,312,22,'#ff4d6d');
  else if(v.run&&v.atk.some(a=>a.from===me)) bxText('seu golpe está a caminho…',320,312,18,'#9ca3af');
  [['E',box.pl.gL],['D',box.pl.gR]].forEach(([s,u],i)=>{ c.fillStyle=now<u?'#34d399':'#13203b'; c.fillRect(i?580:20,296,40,40); bxText(s,i?600:40,326,20,'#03131f'); });
  if(now<mp.flash){ c.strokeStyle='#ff4d6d'; c.lineWidth=8; c.strokeRect(4,4,632,352); }
  bxText(v.msg[me]||'',320,92,18,'#f8fafc');
  if(!v.run&&!v.over&&v.cd>0){ bxText(String(Math.ceil(Math.max(0,v.cd-el/1000))),320,215,96,'#00e5ff'); bxText('Prepare-se!',320,255,22,'#f8fafc'); }
  if(v.over){ const o=v.over, t=o.w==='draw'?'EMPATE':o.w===me?'VOCÊ VENCEU!':'VOCÊ PERDEU'; c.fillStyle='rgba(3,19,31,.72)'; c.fillRect(0,125,640,110); bxText(t,320,190,44,o.w===me?'#34d399':o.w==='draw'?'#9ca3af':'#ff4d6d'); }
}

