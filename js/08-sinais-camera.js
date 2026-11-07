// Sinais com movimento, resultado da câmera, ligar/desligar câmera
// ===== Sinais com movimento: compara o trajeto da mão (últimos ~1–2 s) com as gravações do treino de sinais =====
let sgRec = null, sdbg = '', SIGNSAMP = []; try{ SIGNSAMP = JSON.parse(localStorage.getItem(pk('linkglove_sinais_mov'))||'[]') }catch(e){}
const SIGN_MAX = 0.8;     // distância máxima para aceitar um sinal (menor = mais exigente)
const MOVE_MAX = 0.05;    // mão se movendo mais que isso (fração da imagem em 0,6 s): letras ficam desligadas
const SW = [9,9,9,9,1,1,1,1,1,1,1,1, 1.5,1.5,1.5,1.5, 4,6,8, 9,9,100,150,9];   // do 13º em diante só existem se o rosto (e as expressões) estavam ligados na gravação
function frameVec(all, cl){
  const a=all[0], b=all[all.length-1], f=cl[0].f;
  const v=[a[0].x,a[0].y,b[0].x,b[0].y, f[0],f[1],f[2],f[3],f[4],f[6],f[8], all.length-1];
  const F=FACEON?faceFresh():null;   // com rosto: posição da palma (em larguras de rosto) em relação ao centro do rosto
  if (F){
    v.push((a[9].x-F.cx)/F.w,(a[9].y-F.cy)/F.w,(b[9].x-F.cx)/F.w,(b[9].y-F.cy)/F.w);   // mão em relação ao rosto
    v.push(F.roll||0, F.yaw||0, F.pitch||0);                                            // movimento da cabeça
    if (EXPR && F.ex) v.push(...F.ex);                                                  // expressões (modo Expressões)
  }
  return v;
}
function resample(fr, n=12){
  const t0=fr[0].t, t1=fr[fr.length-1].t, out=[];
  for (let i=0;i<n;i++){ const t=t0+(t1-t0)*i/(n-1); let j=0; while(j<fr.length-1 && fr[j+1].t<=t) j++; out.push(fr[j].v); }
  return out;
}
function seqDist(a,b){
  let d=0; for (let i=0;i<a.length;i++){ let q=0; for (let k=0;k<SW.length;k++){ const x=a[i][k], y=b[i][k]; if (x===undefined||y===undefined) continue; q+=SW[k]*(x-y)**2; } d+=Math.sqrt(q); }
  const rg=q=>Math.max(...[0,1,2,3].map(k=>Math.max(...q.map(r=>r[k]))-Math.min(...q.map(r=>r[k]))));
  return d/a.length + 4*Math.abs(rg(a)-rg(b));   // amplitude do movimento também conta
}
function signTarget(now){
  const S=game.S; if(!S) return null; let best=9, bq=null;
  for (const L of [1000,1500,2000]){
    const fr = hist.filter(f=>f.v && now-f.t<=L).map(f=>({t:f.t,v:f.v}));
    if (fr.length<6 || fr[fr.length-1].t-fr[0].t<L*0.7) continue;
    const q = resample(fr);
    for (const x of SIGNSAMP) if (x.S===S){ const d=seqDist(q,x.v); if (d<best){ best=d; bq=q; } }
  }
  if (bq) learnSign(S,bq,best);
  sdbg = best<9 ? `alvo "${S}": distância ${best.toFixed(2)} (precisa ser menor que ${(SIGN_MAX*1.3).toFixed(2)})` : 'faça o sinal (juntando quadros...)';
  return best<SIGN_MAX*1.3 ? game.target : null;
}
function recogSign(now){
  if (!SIGNSAMP.length) return null;
  const best = {};
  for (const L of [1000,1500,2000]){
    const fr = hist.filter(f=>f.v && now-f.t<=L).map(f=>({t:f.t,v:f.v}));
    if (fr.length<6 || fr[fr.length-1].t-fr[0].t<L*0.7) continue;
    const q = resample(fr);
    for (const x of SIGNSAMP){ const d=seqDist(q,x.v); if (d<(best[x.S]===undefined?9:best[x.S])) best[x.S]=d; }
  }
  const ds = Object.entries(best).sort((a,b)=>a[1]-b[1]);
  sdbg = ds.length ? `sinal mais parecido: ${ds[0][0]} (${ds[0][1].toFixed(2)}; limite ${SIGN_MAX})` : '';
  if (ds.length && ds[0][1]<SIGN_MAX && (ds.length<2 || ds[1][1]>ds[0][1]*1.25)) return norm(ds[0][0]).replace(/[^A-Z]/g,'');
  return null;
}

function onHandResults(res){
  const w = cv.videoWidth, h = cv.videoHeight, now = performance.now();
  if (cc.width!==w || cc.height!==h){ cc.width=w; cc.height=h; }
  cx.clearRect(0,0,w,h);
  drawFace(w,h);
  const all = smoothHands(lockFilter(res.multiHandLandmarks||[],w,h,now).slice(0,2).sort((p,q)=>p[0].x-q[0].x), now, w, h);
  faceStatus(all);
  all.forEach(lm=>{
    cx.lineWidth=3; cx.strokeStyle='#ffb454';
    CONN.forEach(([a,b])=>{cx.beginPath();cx.moveTo(lm[a].x*w,lm[a].y*h);cx.lineTo(lm[b].x*w,lm[b].y*h);cx.stroke()});
    cx.fillStyle='#5eead4';
    lm.forEach(q=>{cx.beginPath();cx.arc(q.x*w,q.y*h,4,0,6.283);cx.fill()});
  });
  document.querySelectorAll('canvas.mirror').forEach(m=>{
    if(!m.offsetParent) return;
    if(m.width!==w||m.height!==h){m.width=w;m.height=h}
    const c=m.getContext('2d'); c.drawImage(cv,0,0,w,h); c.drawImage(cc,0,0);
  });
  const cl = all.map(lm=>classify(lm,w,h));
  LASTF = all.length===1 ? {t:now, f:cl[0].f, n:1} : null;
  if (rec && now<rec.until && all.length===1 && curTab==='cfg'){
    SAMPLES.push({L:rec.L, f:cl[0].f}); recN++;
    const mine = SAMPLES.filter(x=>x.L===rec.L); if (mine.length>60) SAMPLES.splice(SAMPLES.indexOf(mine[0]),1);
  }
  const v = all.length ? frameVec(all,cl) : null;
  if (sgRec && v && curTab==='cfg') sgRec.frames.push({t:now,v});
  hist.push({t:now, v, h:all.map((lm,i)=>({x:lm[0].x, y:lm[9].y, F:cl[i].L==='F', Fg:(cl[i].cg<0.5 && cl[i].st[0]!=='E' && cl[i].st[1]==='E' && cl[i].st[2]==='E' && cl[i].st[3]==='E'), fist:cl[i].st.every(x=>x==='C'), tu:cl[i].L==='TUDO BEM', open:cl[i].open, cx:lm[9].x*w, cy:lm[9].y*h, sz:cl[i].size}))});
  while (hist.length && now-hist[0].t>GEST_WIN) hist.shift();
  const rc6 = hist.filter(f=>now-f.t<=600 && f.h.length), xs6 = rc6.map(f=>f.h[0].x), ys6 = rc6.map(f=>f.h[0].y);
  const mvNow = rc6.length>3 ? Math.max(Math.max(...xs6)-Math.min(...xs6), Math.max(...ys6)-Math.min(...ys6)) : 0;
  poseCheck(all,cl,now);
  if (box.on||tut.on||(mp.live&&mp.mode==='box')) boxInput(all,cl,now,w,h);
  if (calib.on && curTab==='cfg' && all.length===1) calib.s.push({r:cl[0].r.slice(), z:cl[0].size/h});
  const g = now<gestLock ? null : (game.on&&game.type==='sinais' ? (game.builtin ? (sdbg='',detectGesture()) : signTarget(now)) : (detectGesture() || recogSign(now)));
  if ($('gmDbg')) $('gmDbg').textContent = game.on&&game.type==='sinais' ? sdbg : '';
  let L = null;
  if (all.length===1){
    const c = cl[0]; L = mvNow>(game.on?0.09:MOVE_MAX) ? null : c.L;   // mão em movimento não gera letra
    $('camDbg').textContent = `dedos I/M/A/P: ${c.st.join('')} (${c.r.map(v=>v.toFixed(2)).join(' ')}) · polegar ${c.thumb.toFixed(2)} · abertura ${c.gap.toFixed(2)} · dedos para ${c.dir} · cruzado ${c.cr.toFixed(2)} · z ${c.dz.toFixed(2)} · cg ${c.cg.toFixed(2)} · polegar–indic. ${c.thI.toFixed(2)} · lendo: ${c.L||'?'}${c.rule&&c.rule!==c.L?' (regra: '+c.rule+')':''}`;
  } else $('camDbg').textContent = all.length ? `Duas mãos: ${cl.map(c=>c.L||'?').join(' + ')} (só gestos) · ${gdbg}` : 'Nenhuma mão detectada';
  if (sdbg && all.length) $('camDbg').textContent += ' · '+sdbg+' · mov '+mvNow.toFixed(2);
  if (box.on || calib.on || tut.on) return;
  if (now<gestLock) return;                         // pausa depois de um gesto
  if (g && (curTab==='tr'||game.on) && !prac.on && !gd && !sgRec && !acc.on && !rap.on && !(mp.live&&(mp.mode==='rap'||mp.mode==='race')) && !rt.on && !les.on){
    gestLock = now+(game.on||g==='APAGAR'?1200:3000); hist = []; buf = []; held = null; sentLetter = true;
    $('camLetter').textContent = g==='FAMILIA' ? 'FAMÍLIA' : g;
    $('camBar').style.width='100%'; $('camBig').classList.add('sent');
    if (game.on) gameFeed(g); else if (g==='ENVIAR') speakPhrase(vLang); else onData(g,'cam'); return;
  }
  // suavização: a letra só vale se aparecer em 5 dos últimos 7 quadros
  buf.push(L); if (buf.length>7) buf.shift();
  const cnt = {}; buf.forEach(x=>{ if(x) cnt[x]=(cnt[x]||0)+1 });
  const top = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  const stable = top && cnt[top]>=(game.on?4:5) ? top : null;
  $('camLetter').textContent = stable || '–';
  if (les.on){ if (les.cam) lessonTick(stable); return; }
  if (rt.on){ rtTick(stable); return; }
  if (rap.on||(mp.live&&mp.mode==='rap')){ rapTick(stable); return; }
  if (mp.live&&mp.mode==='race'){ cmpTick(stable); return; }
  if (acc.on){ accTick(stable); return; }
  if (prac.on || gd || (game.on && game.type!=='quiz')){ if (prac.on) practiceTick(stable); else if (game.on) gameTick(stable); return; }   // treino/prática não escrevem no texto
  camSend(curTab==='tr' ? stable : null);   // só a aba Tradutor recebe letras soltas da câmera
}

function camMsg(m){ document.querySelectorAll('.cmsg').forEach(e=>e.textContent=m) }
function camBtn(t,dis){ document.querySelectorAll('.btnCam').forEach(b=>{ if(t!==null) b.textContent=t; b.disabled=dis }) }
async function camStart(){
  camMsg('');
  if (typeof Hands==='undefined' || typeof Camera==='undefined'){ camMsg('Não foi possível carregar o MediaPipe (verifique a internet).'); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ camMsg('Este navegador não permite acessar a câmera (é preciso abrir o site por HTTPS).'); return; }
  try{
    if (!hands){
      hands = new Hands({locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`});
      hands.setOptions({maxNumHands:3, modelComplexity:0, minDetectionConfidence:0.6, minTrackingConfidence:0.6});
      hands.onResults(onHandResults);
    }
    cam = new Camera(cv, {onFrame: async()=>{ adapt(); const src = LIGHT.on?enhance():cv; await faceStep(src); await hands.send({image: src}) }, width:640, height:480, facingMode:'user'});
    camBtn(null,true); camMsg('Iniciando câmera...');
    await cam.start();
    camOn = true; buf = []; held = null;
    document.querySelectorAll('.coff').forEach(e=>e.style.display='none'); camBtn('Desligar câmera',false); camMsg(''); linkSay('confiante','Câmera ligada! Mostre a sua mão.'); if(LIGHT.on) hwLight();
  }catch(err){
    camOn = false;
    camMsg(err.name==='NotAllowedError' ? 'Permissão da câmera negada. Libere o acesso no cadeado ao lado do endereço do site e tente de novo.'
         : err.name==='NotFoundError' ? 'Nenhuma câmera encontrada neste dispositivo.'
         : err.name==='NotReadableError' ? 'A câmera está em uso por outro programa.'
         : 'Erro ao ligar a câmera: '+(err.message||err.name));
  }finally{ camBtn(null,false); }
}
async function camStop(){
  try{ if (cam) await cam.stop() }catch(e){}
  if (cv.srcObject){ cv.srcObject.getTracks().forEach(t=>t.stop()); cv.srcObject=null; }
  camOn = false; cx.clearRect(0,0,cc.width,cc.height); camSend(null);
  FACE=null; faceStatus.last=null; document.querySelectorAll('.faceSt').forEach(e=>e.textContent=''); $('camLetter').textContent='–'; $('camDbg').textContent=''; document.querySelectorAll('.coff').forEach(e=>e.style.display='flex');
  camBtn('Ligar câmera',false);
}
document.querySelectorAll('.btnCam').forEach(b=>b.onclick = () => camOn ? camStop() : camStart());
document.querySelectorAll('.btnFace').forEach(b=>b.onclick = () => {
  FACEON=!FACEON; FACEFAIL=false; if(!FACEON){ FACE=null; EXPR=false; try{ localStorage.setItem('linkglove_expr','0') }catch(e){} }
  try{ localStorage.setItem('linkglove_rosto',FACEON?'1':'0') }catch(e){}
  faceUi(); if (FACEON && !camOn) camMsg('Ligue a câmera para o rosto ser reconhecido.'); else camMsg('');
});
document.querySelectorAll('.btnExpr').forEach(b=>b.onclick = () => {
  EXPR=!(FACEON&&EXPR);
  if (EXPR && !FACEON){ FACEON=true; FACEFAIL=false; try{ localStorage.setItem('linkglove_rosto','1') }catch(e){} }
  try{ localStorage.setItem('linkglove_expr',EXPR?'1':'0') }catch(e){}
  FACE=null; faceDet=null; faceMesh=null;   // troca a fonte do rosto (detector leve <-> FaceMesh)
  faceUi(); camMsg(EXPR&&!camOn?'Ligue a câmera para as expressões serem lidas.':'');
});
faceUi();
