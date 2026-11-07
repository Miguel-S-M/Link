// Mascote Link, menu de minigames, rap e boxe com sprites
// ================= Mascote Link, menu de minigames, trilha, lições, rap e boxe com sprites =================
function linkSay(expr,msg){ if(ART[expr]&&$('lkImg')) $('lkImg').src=ART[expr]; if($('lkSay')) $('lkSay').textContent=msg; }
const SPR={}; ['link_idle','link_esq','link_jab','link_cross','link_gancho','link_upper','null_idle','null_esq','null_jab','null_cross','null_gancho','null_upper'].forEach(k=>{ const im=new Image(); im.onload=()=>{ if(!box.on) boxDraw(); if(!rap.on&&typeof rapDraw==='function') rapDraw(performance.now()); }; im.src=ART[k]; SPR[k]=im; });
function spr(k,x,y,h,flip,rot,c=bx){
  const im=SPR[k]; if(!im||!im.complete||!im.naturalHeight) return 150; const w=im.naturalWidth*h/im.naturalHeight;
  c.save(); c.globalCompositeOperation='lighten'; c.translate(x+w/2,y+h/2); if(rot) c.rotate(rot); if(flip) c.scale(-1,1); c.drawImage(im,-w/2,-h/2,w,h); c.restore(); return w;
}
const tx=(c,t,x,y,s,col,al='center')=>{ c.font='bold '+s+'px sans-serif'; c.fillStyle=col; c.textAlign=al; c.fillText(t,x,y); };
const rrect=(c,x,y,w,h,r)=>{ c.beginPath(); if(c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };

// ---- boxe com os personagens ----
function boxDraw(){
  if(mp.active&&mp.mode==='box'){ mpDraw(); return; }
  const o=box.opp, p=box.pl, L=BXL[box.lv], now=performance.now();
  const g=bx.createLinearGradient(0,0,0,360); g.addColorStop(0,'#0a1230'); g.addColorStop(1,'#1a0a3a'); bx.fillStyle=g; bx.fillRect(0,0,640,360);
  bx.strokeStyle='rgba(0,229,255,.22)'; bx.lineWidth=2; for(let i=0;i<5;i++){ bx.beginPath(); bx.moveTo(0,275+i*18); bx.lineTo(640,275+i*18); bx.stroke(); }
  let lk='link_idle'; if(now<(p.pu||0)) lk=BXT[p.pty||'jab'].pose; else if(now<p.gL||now<p.gR) lk='link_esq';
  spr(lk,26,96,215,false);
  let nk='null_idle', rot=0; if(now<(o.su||0)) nk='null_jab'; else if(o.st==='tele') nk=o.side==='L'?'null_gancho':o.side==='R'?'null_cross':'null_upper'; else if(o.guard) nk='null_esq'; else if(o.st==='recover') rot=0.14;
  const im=SPR[nk], wn=im&&im.naturalHeight?im.naturalWidth*215/im.naturalHeight:150; spr(nk,640-26-wn,96,215,true,rot);
  bxBar(20,16,250,16,p.hp/L.plHp,'#00e5ff'); bxBar(370,16,250,16,o.hp/L.oppHp,'#ff2dd1');
  if(L.stam) bxBar(20,38,250,8,p.st/100,'#ff9500');
  bxText('LINK (VOCÊ)',20,66,14,'#9ca3af','left'); bxText('NULL · '+L.nome.toUpperCase(),620,66,14,'#ff2dd1','right');
  bxText(Math.max(0,Math.ceil((box.end-now)/1000))+' s',320,34,16,'#9ca3af');
  if(o.st==='tele'){ bxText(o.side==='L'?'◀ DEFENDA À ESQUERDA':o.side==='R'?'DEFENDA À DIREITA ▶':'▲ DEFENDA COM AS DUAS MÃOS ▲',320,312,24,'#ff9500'); bxBar(170,326,300,10,o.t/o.tot,'#ff9500'); }
  else if(o.st==='recover') bxText('ATAQUE AGORA!',320,312,28,'#34d399');
  else if(o.guard) bxText('ele está se protegendo',320,312,20,'#9ca3af');
  [['E',p.gL],['D',p.gR]].forEach(([s,u],i)=>{ bx.fillStyle=now<u?'#34d399':'#13203b'; bx.fillRect(i?580:20,296,40,40); bxText(s,i?600:40,326,20,'#03131f'); });
  if(now<box.flash){ bx.strokeStyle='#ff4d6d'; bx.lineWidth=8; bx.strokeRect(4,4,632,352); }
  bxText(box.msg,320,92,18,'#f8fafc');
}

// ---- desenho do tutorial ----
function tutDraw(){
  const st=TUT[Math.min(tut.i,TUT.length-1)], now=performance.now(), p=box.pl;
  const g=bx.createLinearGradient(0,0,0,360); g.addColorStop(0,'#0a1230'); g.addColorStop(1,'#1a0a3a'); bx.fillStyle=g; bx.fillRect(0,0,640,360);
  bx.strokeStyle='rgba(0,229,255,.22)'; bx.lineWidth=2; for(let i=0;i<5;i++){ bx.beginPath(); bx.moveTo(0,275+i*18); bx.lineTo(640,275+i*18); bx.stroke(); }
  spr(st.pose,26,92,215,false);
  bxText('TUTORIAL · PASSO '+(Math.min(tut.i+1,TUT.length))+' DE '+TUT.length,330,38,18,'#00e5ff','left');
  const words=st.t.split(' '); let line='', y=72; bx.font='bold 17px sans-serif';
  words.forEach(wd=>{ const tst=line+wd+' '; if(bx.measureText(tst).width>340){ bxText(line,330,y,17,'#f8fafc','left'); y+=24; line=wd+' '; } else line=tst; }); bxText(line,330,y,17,'#f8fafc','left');
  if(st.ar) bxText(st.ar,470,235,96,'#ff9500');
  bxText(tut.fb,330,300,16,'#34d399','left');
  for(let i=0;i<TUT.length;i++){ bx.fillStyle=i<tut.i?'#34d399':i===tut.i?'#00e5ff':'#13203b'; bx.beginPath(); bx.arc(334+i*26,330,8,0,7); bx.fill(); }
  [['E',p.gL],['D',p.gR]].forEach(([s,u],i)=>{ bx.fillStyle=now<u?'#34d399':'#13203b'; bx.fillRect(i?580:20,296,40,40); bxText(s,i?600:40,326,20,'#03131f'); });
}

// ---- rap de libras ----
const RAPL={1:{nome:'Fácil',bpm:80,rounds:10,bot:.45,dP:14,dB:8,dM:6},2:{nome:'Médio',bpm:95,rounds:12,bot:.65,dP:12,dB:11,dM:8},3:{nome:'Difícil',bpm:115,rounds:14,bot:.85,dP:10,dB:14,dM:10}};
const rap={on:false,lv:1,t0:0,beat:-9,bm:700,round:0,target:'',done:false,hold:null,hs:0,tb:0,score:0,combo:0,pl:100,nl:100,msg:'',pu:0,nu:0,ctx:null};
const rapCv=$('rapCv'), rx=rapCv.getContext('2d'), IMGC={};
const imgOf=L=>{ const k=(L||'').toLowerCase(); if(!IMG[k]) return null; if(!IMGC[k]){ const i=new Image(); i.onload=()=>{ if(!rap.on) rapDraw(performance.now()); }; i.src=IMG[k]; IMGC[k]=i; } return IMGC[k]; };
function rapSound(b){
  if(!$('rapSnd').checked||!rap.ctx) return;
  const c=rap.ctx, o=c.createOscillator(), g=c.createGain(), t=c.currentTime; o.connect(g); g.connect(c.destination);
  if(b%2===0){ o.type='sine'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(45,t+.15); g.gain.setValueAtTime(.5,t); g.gain.exponentialRampToValueAtTime(.001,t+.18); o.start(t); o.stop(t+.2); }
  else { o.type='square'; o.frequency.value=900; g.gain.setValueAtTime(.06,t); g.gain.exponentialRampToValueAtTime(.001,t+.05); o.start(t); o.stop(t+.06); }
}
function rapResolve(){
  const L=RAPL[rap.lv], now=performance.now();
  if(rap.done){ rap.nl=Math.max(0,rap.nl-L.dP*(1+Math.min(rap.combo,5)*0.1)); rap.nu=now+350; }
  else { rap.combo=0; rap.pl=Math.max(0,rap.pl-L.dM); rap.pu=now+350; rap.msg='Errou o sinal!'; recordResult(rap.target,false); }
  if(Math.random()<L.bot){ rap.pl=Math.max(0,rap.pl-L.dB); rap.pu=now+350; rap.msg+=' Null acertou!'; } else rap.msg+=' Null errou!';
}
function rapNext(){
  const L=RAPL[rap.lv]; if(rap.round>0) rapResolve();
  if(rap.round>=L.rounds||rap.pl<=0||rap.nl<=0){ rapEnd(false); return; }
  rap.target=pickWeighted(letterPool(),rap.target); rap.done=false; rap.hold=null; rap.round++;
}
function rapTick(L){
  if(!(rap.on||(mp.live&&mp.mode==='rap'))||rap.done||!rap.round) return; const now=performance.now();
  if(L===rap.target){ if(rap.hold!==L){ rap.hold=L; rap.hs=now; } else if(now-rap.hs>=450){ rap.done=true; rap.combo++; const early=now-rap.tb<rap.bm*2; rap.score+=Math.round((early?150:100)*(1+Math.min(rap.combo,10)*0.1)); rap.msg=early?'PERFEITO!':'BOM!'; recordResult(L,true); learnLetter(L); if(mp.live&&mp.mode==='rap') rmpDone(early); } } else rap.hold=null;
}
function rapDraw(now){
  if(mp.active&&mp.mode==='rap'){ rmpDraw(); return; }
  const c=rx, L=RAPL[rap.lv], ph=(((now-rap.t0)/rap.bm)%1+1)%1, bob=Math.sin(ph*Math.PI*2)*5;
  const g=c.createLinearGradient(0,0,0,360); g.addColorStop(0,'#0a0f2e'); g.addColorStop(1,'#240a48'); c.fillStyle=g; c.fillRect(0,0,640,360);
  c.fillStyle='#0b1226'; for(let i=0;i<14;i++){ c.beginPath(); c.arc(25+i*46,352+Math.sin(i+now/700)*3,26,0,7); c.fill(); }
  bxBarC(c,20,14,240,14,rap.pl/100,'#00e5ff'); bxBarC(c,380,14,240,14,rap.nl/100,'#ff2dd1');
  tx(c,'LINK (VOCÊ)',20,46,13,'#9ca3af','left'); tx(c,'NULL (INIMIGO)',620,46,13,'#ff2dd1','right'); tx(c,'VS',320,36,28,'#f8fafc');
  spr(now<rap.pu?'link_esq':(rap.done?'link_jab':'link_idle'),14,100+bob,195,false,0,c);
  const nk=now<rap.nu?'null_esq':'null_idle', im=SPR[nk], wn=im&&im.naturalHeight?im.naturalWidth*195/im.naturalHeight:140; spr(nk,640-14-wn,100-bob,195,true,0,c);
  c.fillStyle='rgba(8,18,40,.88)'; c.strokeStyle='#00e5ff'; c.lineWidth=3; rrect(c,210,66,220,160,14); c.fill(); c.stroke();
  tx(c,rap.round?'Faça o sinal de Libras:':'Prepare-se...',320,92,15,'#f8fafc');
  if(rap.round){ const a=imgOf(rap.target); if(a&&a.complete&&a.naturalWidth) c.drawImage(a,265,100,110,81); tx(c,'"'+rap.target+'"',320,214,22,'#00e5ff'); }
  const AR=['◀','▼','▲','▶'], col=['#00b8d9','#3b82f6','#22c55e','#ff9500'], cur=((rap.beat%4)+4)%4;
  for(let i=0;i<4;i++){ const on=rap.beat>=0&&cur===i; c.fillStyle=on?col[i]:'#0f172a'; c.strokeStyle=col[i]; c.lineWidth=3; rrect(c,200+i*60,258,52,52,10); c.fill(); c.stroke(); tx(c,AR[i],226+i*60,293,24,on?'#03131f':col[i]); }
  c.fillStyle='rgba(8,18,40,.85)'; c.strokeStyle='#00e5ff'; c.lineWidth=2; rrect(c,18,262,150,50,10); c.fill(); c.stroke(); tx(c,'COMBO x'+rap.combo,93,294,18,'#00e5ff');
  c.fillStyle='rgba(8,18,40,.85)'; c.strokeStyle='#ff2dd1'; rrect(c,472,262,150,50,10); c.fill(); c.stroke(); tx(c,'PONTOS '+rap.score,547,294,17,'#ff2dd1');
  bxBarC(c,150,336,340,10,rap.round/L.rounds,'#8b5cf6'); tx(c,'♪ Ritmo: Libras Flow',150,331,12,'#9ca3af','left');
  tx(c,rap.msg,320,56,15,'#f8fafc');
  if($('rapPulse').checked&&(rap.on||rt.on)){ c.strokeStyle='rgba(0,229,255,'+(0.55*(1-ph)).toFixed(2)+')'; c.lineWidth=8; c.strokeRect(4,4,632,352); }
}
const bxBarC=(c,x,y,w,h,f,col)=>{ c.fillStyle='#070d1a'; c.fillRect(x,y,w,h); c.fillStyle=col; c.fillRect(x,y,Math.max(0,w*Math.min(1,f)),h); c.strokeStyle='#1e3a8a'; c.lineWidth=1; c.strokeRect(x,y,w,h); };
function rapStep(){
  if(!rap.on) return; const now=performance.now(), b=Math.floor((now-rap.t0)/rap.bm);
  if(b!==rap.beat){ rap.beat=b; if(b>=0){ rapSound(b); if($('rapVib').checked&&navigator.vibrate) navigator.vibrate(b%4===0?60:25); } if(b>=0&&b%4===0){ rapNext(); rap.tb=now; } }
  rapDraw(now); if(rap.on) requestAnimationFrame(rapStep);
}
function rapEnd(manual){
  if(!rap.on) return; rap.on=false; const L=RAPL[rap.lv];
  const win=!manual&&(rap.nl<=0||(rap.pl>0&&rap.nl<rap.pl));
  rap.msg=manual?'Batalha encerrada.':win?'🏆 Link venceu! Pontos: '+rap.score:'💀 Null venceu desta vez.';
  $('rapMsg').textContent=rap.msg; $('btnRap').textContent='Começar batalha'; rapDraw(performance.now());
  if(win){ award(15*rap.lv); rankAdd('rap'+rap.lv,rap.score); linkSay('conquista','Você venceu o Null!'); } else if(!manual) linkSay('triste','O Null levou essa. Quer tentar de novo?');
  renderRapRank();
}
function renderRapRank(){ const l=rankGet()['rap'+$('rapLv').value]||[]; $('rapRank').innerHTML=l.length?'<ol style="padding-left:20px">'+l.map(x=>`<li>${x.n}: <b>${x.s}</b> <small style="color:var(--mut)">${x.d}</small></li>`).join('')+'</ol>':'<small style="color:var(--mut)">Ninguém venceu este nível ainda.</small>'; }
$('rapLv').onchange=renderRapRank;
$('btnRap').onclick=()=>{
  if(mp.mode==='rap'&&mp.conn&&mp.conn.open){ if(mp.host){ if(mp.live) rmpStop(); else rmpStart(); } else toast('Só o anfitrião começa a batalha. Deixe a câmera ligada.'); return; }
  if(rap.on){ rapEnd(true); return; }
  if(!camOn){ camMsg('Ligue a câmera para a batalha.'); return; }
  if(!rtSeen&&!rt.on){ startRapTut(true); return; }
  const lv=+$('rapLv').value, L=RAPL[lv], now=performance.now();
  try{ rap.ctx=rap.ctx||new (window.AudioContext||window.webkitAudioContext)(); rap.ctx.resume(); }catch(e){}
  Object.assign(rap,{on:true,lv,bm:60000/L.bpm,t0:now+60000/L.bpm*2,beat:-9,round:0,target:'',done:false,hold:null,score:0,combo:0,pl:100,nl:100,msg:'',pu:0,nu:0});
  $('btnRap').textContent='Parar batalha'; $('rapMsg').textContent='Faça a letra que aparecer no painel antes do fim do compasso. Acertar machuca o Null; errar machuca o Link.';
  requestAnimationFrame(rapStep);
};

// ---- tutorial interativo do rap de libras (tudo visual: balões, destaques, cores, vibração opcional) ----
const rapTutDone = !!ls('linkglove_rap_tut',false); let rtSeen = rapTutDone;
const RTS=[
 {t:'Bem-vindo à batalha de rap! Aqui tudo é visual: setas, cores e luz. Você é o Link. O rival é o Null.',ex:'animado',round:0},
 {t:'A BATIDA: as 4 setas acendem uma de cada vez. 4 setas = 1 compasso. Toque no botão (ou ESPAÇO) quando uma seta acender.',ex:'dica',round:0,spot:[196,254,248,62],task:'tap',need:4},
 {t:'O SINAL: este painel mostra a letra que você deve fazer. Você tem 1 compasso (4 setas) para acertar.',ex:'pensando',round:1,tg:'A',spot:[206,62,228,168]},
 {t:'FAÇA O SINAL: mostre a letra para a câmera e segure um instante. Acerte 2 vezes.',ex:'confiante',round:1,spot:[206,62,228,168],task:'sign',need:2},
 {t:'A VIDA: acertar tira vida do Null (barra rosa). Errar tira vida do Link (barra azul).',ex:'dica',round:1,tg:'A',spot:[14,8,612,42],demo:true},
 {t:'O COMBO: acertar em sequência aumenta o combo e os pontos. Faça mais 3 sinais seguidos!',ex:'animado',round:1,spot:[18,258,150,56],task:'sign',need:3},
 {t:'Tudo pronto! Aperte "Começar batalha" quando quiser. Boa sorte contra o Null!',ex:'conquista',round:0}
];
const rt={on:false,i:0,k:0,done:true,t0:0,bm:750,beat:-9,lastB:-9,tg:'A',hold:null,hs:0,pl:100,nl:100,combo:0,score:0,fb:'',pu:0,nu:0,hit:0,demoT:0,then:false};
const EXI={}, exImg=k=>{ if(!EXI[k]){ const i=new Image(); i.src=ART[k]; EXI[k]=i; } return EXI[k]; };
function wrapText(c,t,x,y,maxW,lh,font,col){
  c.font=font; c.fillStyle=col; c.textAlign='left'; let line='';
  t.split(' ').forEach(w=>{ const s=line+w+' '; if(c.measureText(s).width>maxW){ c.fillText(line,x,y); y+=lh; line=w+' '; } else line=s; }); c.fillText(line,x,y); return y;
}
const easyPool=()=>{ const p=letterPool(), e=['A','B','L','V','Y','I','U','W'].filter(x=>p.includes(x)); return e.length?e:p; };
function rtSetStep(i){
  rt.i=Math.max(0,Math.min(RTS.length-1,i)); const S=RTS[rt.i]; rt.k=0; rt.done=!S.task; rt.hold=null; rt.fb='';
  rt.tg=S.tg||rnd(easyPool()); if(S.id==='x'){} rt.combo=S.task==='sign'&&rt.i>=5?0:rt.combo;
  if(rt.i===4){ rt.pl=100; rt.nl=100; rt.demoT=performance.now()+900; }
  rtButtons(); linkSay(S.ex||'feliz','Tutorial do Rap: passo '+(rt.i+1)+' de '+RTS.length);
}
function rtButtons(){
  const S=RTS[rt.i], last=rt.i===RTS.length-1;
  $('rtBar').style.display=rt.on?'flex':'none';
  $('btnRtPrev').disabled=rt.i===0; $('btnRtNext').disabled=!rt.done; $('btnRtNext').textContent=last?'Concluir ✔':'Próximo ▶';
  $('btnRtTap').style.display=(S.task==='tap'&&!rt.done)?'':'none'; $('btnRtSim').style.display=(S.task==='sign'&&!rt.done)?'':'none';
}
function rtProgress(){ rt.k++; const S=RTS[rt.i]; if(rt.k>=S.need){ rt.done=true; rt.fb='✔ Passo concluído!'; rtButtons(); } }
function rtTap(){
  const S=RTS[rt.i]; if(!rt.on||S.task!=='tap'||rt.done) return;
  const now=performance.now(), k=Math.round((now-rt.t0)/rt.bm), d=Math.abs(now-(rt.t0+k*rt.bm));
  if(d<=260){ rt.fb='NO RITMO! ('+(rt.k+1)+'/'+S.need+')'; rt.hit=now+300; rtProgress(); } else rt.fb='Quase! Toque quando a seta acender.';
}
function rtSign(){
  const now=performance.now(); rt.hit=now+450; rt.combo++; rt.score+=100*Math.min(5,rt.combo); rt.nl=Math.max(20,rt.nl-12); rt.nu=now+350;
  rt.fb=(rt.combo>1?'COMBO x'+rt.combo+'! ':'PERFEITO! ')+'+'+(100*Math.min(5,rt.combo)); const S=RTS[rt.i];
  rt.tg=rnd(easyPool()); rtProgress();
}
function rtTick(L){
  const S=RTS[rt.i]; if(!rt.on||S.task!=='sign'||rt.done) return; const now=performance.now();
  if(L===rt.tg){ if(rt.hold!==L){ rt.hold=L; rt.hs=now; } else if(now-rt.hs>=450){ rt.hold=null; learnLetter(L); rtSign(); } } else rt.hold=null;
}
function rtDraw(now){
  const S=RTS[rt.i], b=Math.floor((now-rt.t0)/rt.bm);
  if(b!==rt.lastB){ rt.lastB=b; rt.beat=b; if(b>=0){ rapSound(b); if($('rapVib').checked&&navigator.vibrate) navigator.vibrate(b%4===0?60:25); } }
  if(S.demo&&now>rt.demoT){ rt.demoT=now+1500; if(rt.nl<=30||rt.pl<=30){ rt.nl=100; rt.pl=100; } if((Math.round(now/1500))%2){ rt.nl-=14; rt.fb='Acertou! O Null perde vida.'; rt.nu=now+350; rt.hit=now+400; } else { rt.pl-=12; rt.fb='Errou! O Link perde vida.'; rt.pu=now+350; } }
  Object.assign(rap,{t0:rt.t0,bm:rt.bm,beat:rt.beat,round:S.round?1:0,target:rt.tg,pl:rt.pl,nl:rt.nl,combo:rt.combo,score:rt.score,msg:rt.fb,done:now<rt.hit,pu:rt.pu,nu:rt.nu});
  rapDraw(now);
  const c=rx; c.save(); c.fillStyle='rgba(3,8,18,.76)'; c.beginPath(); c.rect(0,0,640,360); if(S.spot) c.rect(...S.spot); c.fill('evenodd'); c.restore();
  if(S.spot){ c.strokeStyle='#ff9500'; c.lineWidth=4; c.setLineDash([10,6]); rrect(c,S.spot[0],S.spot[1],S.spot[2],S.spot[3],12); c.stroke(); c.setLineDash([]); }
  const top=!!(S.spot&&S.spot[1]>200), by=top?52:224;
  c.fillStyle='rgba(8,18,40,.96)'; c.strokeStyle='#00e5ff'; c.lineWidth=3; rrect(c,16,by,608,126,16); c.fill(); c.stroke();
  const im=exImg(S.ex||'feliz'); if(im.complete&&im.naturalWidth){ c.save(); c.globalCompositeOperation='lighten'; c.drawImage(im,28,by+14,82,82); c.restore(); }
  tx(c,'PASSO '+(rt.i+1)+' DE '+RTS.length,126,by+26,13,'#00e5ff','left');
  wrapText(c,S.t,126,by+50,486,21,'bold 16px sans-serif','#f8fafc');
  for(let i=0;i<RTS.length;i++){ c.fillStyle=i<rt.i?'#34d399':i===rt.i?'#00e5ff':'#13203b'; c.beginPath(); c.arc(130+i*20,by+112,6,0,7); c.fill(); }
  if(rt.done&&S.task) tx(c,'Pronto! Toque em Próximo ▶',620,by+116,14,'#34d399','right');
  else if(S.task==='sign'&&!camOn) tx(c,'Sem câmera? Use o botão Simular',620,by+116,13,'#ff9500','right');
}
function rtStep(){ if(!rt.on) return; rtDraw(performance.now()); requestAnimationFrame(rtStep); }
function startRapTut(then){
  if(rap.on) rapEnd(true);
  try{ rap.ctx=rap.ctx||new (window.AudioContext||window.webkitAudioContext)(); rap.ctx.resume(); }catch(e){}
  Object.assign(rt,{on:true,i:0,t0:performance.now()+rt.bm,beat:-9,lastB:-9,pl:100,nl:100,combo:0,score:0,fb:'',then:!!then});
  $('btnRap').disabled=true; $('rapMsg').textContent='Tutorial: siga os balões. Tudo é visual; a vibração e a batida sonora são opcionais.';
  rtSetStep(0); requestAnimationFrame(rtStep);
}
function rtEnd(finished){
  if(!rt.on) return; rt.on=false; $('rtBar').style.display='none'; $('btnRap').disabled=false;
  Object.assign(rap,{round:0,combo:0,score:0,pl:100,nl:100,msg:'',done:false,pu:0,nu:0}); rapDraw(performance.now());
  if(finished){ lsSet('linkglove_rap_tut',true); rtSeen=true; $('rapMsg').textContent='Tutorial concluído!'; award(10); linkSay('conquista','Você completou o tutorial do Rap!'); if(rt.then){ rt.then=false; setTimeout(()=>{ if(!rap.on&&!rt.on) $('btnRap').click(); },900); } }
  else $('rapMsg').textContent='Tutorial encerrado.';
}
$('btnRtNext').onclick=()=>{ if(!rt.done) return; if(rt.i>=RTS.length-1) rtEnd(true); else rtSetStep(rt.i+1); };
$('btnRtPrev').onclick=()=>rtSetStep(rt.i-1);
$('btnRtSkip').onclick=()=>{ const t=rt.then; rtEnd(false); lsSet('linkglove_rap_tut',true); rtSeen=true; if(t) setTimeout(()=>$('btnRap').click(),200); };
$('btnRtTap').onclick=rtTap; $('btnRtSim').onclick=()=>{ if(rt.on&&RTS[rt.i].task==='sign'&&!rt.done) rtSign(); };
$('rapCv').addEventListener('pointerdown',()=>rtTap());
document.addEventListener('keydown',e=>{ if(rt.on&&(e.code==='Space'||e.code==='Enter')&&e.target.tagName!=='BUTTON'&&RTS[rt.i].task==='tap'){ e.preventDefault(); rtTap(); } });
$('btnRapTut').onclick=()=>{ if(mp.live) return; if(rt.on) rtEnd(false); else startRapTut(false); };

// ---- menu de minigames ----
const HUB=[
 {id:'boxe',t:'Boxe: Link vs Null',d:'Jab, direto, gancho e uppercut contra o Null, com tutorial de calibragem. Três níveis.',tag:['📷 Câmera','🥊 3 níveis'],say:'Luvas no lugar! Defenda no lado certo.',cv:()=>`<img class="s" style="left:4%" src="${ART.link_jab}" alt=""><img class="s" style="right:4%;transform:scaleX(-1)" src="${ART.null_jab}" alt="">`},
 {id:'rap',t:'Rap de Libras · Libras Flow',d:'Faça o sinal no ritmo e vença a batalha contra o Null.',tag:['📷 Câmera','🎵 Ritmo'],say:'Segue a batida e acerta o sinal!',cv:()=>`<img class="full" src="${ART.capa_rap}" alt="">`},
 {id:'letras',t:'Corrida das letras',d:'Quantas letras você faz em 60 segundos?',tag:['📷 Câmera','⏱ 60 s'],say:'Rápido! Cada letra vale ponto.',cv:()=>`<img class="full" src="${ART.capa_corrida}" alt="">`},
 {id:'palavras',t:'Soletrar palavras',d:'Forme palavras letra por letra com o alfabeto manual.',tag:['📷 Câmera','⏱ 90 s'],say:'Letra por letra, sem pressa demais.',cv:()=>`<img class="s" style="left:6%;height:80%" src="${ART.link_idle}" alt=""><div class="big1" style="justify-content:flex-end;padding-right:8%">L I B R A S</div>`},
 {id:'sinais',t:'Sinais com movimento',d:'Repita os sinais que você gravou (e alguns gestos do site).',tag:['📷 Câmera','🤟 Sinais'],say:'Mostra o sinal inteiro, com o movimento!',cv:()=>`<img class="full" src="${ART.capa_casa}" alt="">`},
 {id:'quiz',t:'Quiz de tradução',d:'Português para outros idiomas. Normal ou hardcore.',tag:['🖱 Sem câmera','❓ 2 modos'],say:'Pensa bem: no hardcore, um erro acaba o jogo.',cv:()=>`<img class="s" style="left:30%;height:78%" src="${ART.pensando}" alt=""><div class="big1" style="justify-content:flex-end;padding-right:12%;font-size:3.4rem">?</div>`},
 {id:'pratica',t:'Prática com a câmera',d:'Treino livre de letras, números e revisão do que você erra.',tag:['📷 Câmera','♻ Revisão'],say:'Praticar é o melhor caminho.',cv:()=>`<img class="s" style="left:34%;height:78%" src="${ART.confiante}" alt=""><div class="big1" style="justify-content:flex-end;padding-right:14%;font-size:3rem">✋</div>`}
];
const SECIDS={boxe:'gm-boxe',rap:'gm-rap',letras:'gm-timed',palavras:'gm-timed',sinais:'gm-timed',quiz:'gm-timed',pratica:'gm-pratica'};
$('hubCards').innerHTML=HUB.map(h=>`<button class="gcard" data-open="${h.id}" aria-label="Abrir ${h.t}"><div class="gcover">${h.cv()}</div><div class="gbody"><b>${h.t}</b><span class="d">${h.d}</span><div>${h.tag.map(t=>`<span class="tag">${t}</span>`).join('')}</div><span class="play">▶ Jogar</span></div></button>`).join('');
function stopGames(){
  if((mp.active||mp.peer)&&!mp.switching) mpLeave();
  if(game.on) gmEnd(true);
  if(tut.on) tutEnd();
  if(box.on){ box.on=false; $('btnBx').textContent='Começar luta'; }
  if(prac.on){ prac.on=false; $('btnPrac').textContent='Começar prática'; }
  if(rap.on) rapEnd(true);
  if(rt.on) rtEnd(false);
}
function openGame(id){
  stopGames(); $('hub').style.display='none'; $('gstage').style.display='';
  ['gm-boxe','gm-rap','gm-timed','gm-pratica'].forEach(s=>$(s).style.display=s===SECIDS[id]?'':'none');
  const h=HUB.find(x=>x.id===id); $('gTitle').textContent=h.t; mpPlace(id);
  if(SECIDS[id]==='gm-timed'){ $('gmSel').value=id; $('gmSel').style.display='none'; gmUpd(); }
  linkSay('animado',h.say); window.scrollTo({top:0});
}
function closeGame(){ stopGames(); $('hub').style.display=''; $('gstage').style.display='none'; linkSay('feliz','Escolha outro minigame!'); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-open]'); if(b) openGame(b.dataset.open); });
$('gBack').onclick=closeGame;
renderRapRank(); rapDraw(performance.now());

