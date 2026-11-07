// Classificador de letras, gestos e estados dos modos

function classify(lm, w, h){
  const d = (a,b) => Math.hypot((lm[a].x-lm[b].x)*w, (lm[a].y-lm[b].y)*h);
  const size = d(0,9);
  const r = [8,12,16,20].map((t,i) => d(t,0) / d([5,9,13,17][i],0));
  const st = r.map((v,i) => v>=EXT[i] ? 'E' : v<=CURL[i] ? 'C' : 'H');
  const thumb = d(4,17)/size, tOut = thumb > THUMB_OUT;
  const gap = d(8,12)/d(5,9), cg = d(4,8)/size, cm = d(4,12)/size, thI = Math.min(d(4,6),d(4,7))/size;   // thI: polegar na frente do indicador
  // direção dos dedos: pulso -> base do dedo médio (cima / baixo / lado)
  const vx=(lm[9].x-lm[0].x)*w, vy=(lm[9].y-lm[0].y)*h, k=vy/Math.hypot(vx,vy);
  const dir = k<-0.5 ? 'cima' : k>0.5 ? 'baixo' : 'lado', down = dir==='baixo';
  // indicador e médio cruzados (R): a ponta do indicador passa da ponta do médio
  const ux=(lm[9].x-lm[5].x)*w, uy=(lm[9].y-lm[5].y)*h;
  const cr = (((lm[8].x-lm[12].x)*w)*ux + ((lm[8].y-lm[12].y)*h)*uy) / Math.hypot(ux,uy) / size;
  const crossed = cr > 0.05;
  const dz = lm[8].z - lm[5].z;
  const tx = (lm[8].x-lm[0].x)*w, ty = (lm[8].y-lm[0].y)*h;
  const toward = (0.5-lm[0].x)*tx>0 && Math.abs(tx)>0.7*size && Math.abs(ty)<1.5*Math.abs(tx);   // indicador aponta para o centro do corpo (até ~55° da horizontal)
  const tvy = (lm[4].y-lm[2].y)*h, thumbUp = tvy < -0.45*size && Math.abs((lm[4].x-lm[2].x)*w) < Math.abs(tvy);   // polegar apontando para cima
  const [i,m,a,p] = st, E = x=>x==='E', C = x=>x==='C';
  const nH = st.filter(x=>x==='H').length, ravg = (r[0]+r[1]+r[2]+r[3])/4;
  let L = null;
  if (down && E(i)&&E(m)&&!E(p)) L = a==='C' ? 'N' : 'M';           // dedos para baixo: anelar esticado/meio = M, dobrado = N
  else if (E(m)&&E(a)&&E(p)&&!tOut&&!down&&(!E(i)||thI<0.35)) L='F';   // indicador dobrado ou escondido atrás do polegar
  else if (E(i)&&E(m)&&E(a)&&E(p)&&tOut&&!down) L='ESPACO';   // mão aberta com o polegar aberto = espaço
  else if (E(i)&&E(m)&&E(a)&&E(p)&&!tOut&&!down) L='B';
  else if (E(i)&&E(m)&&E(a)&&C(p)) L = 'W';
  else if (E(i)&&E(m)&&C(a)&&C(p)&&tOut&&gap<=V_GAP&&!down) L='F';
  else if (E(i)&&E(m)&&C(a)&&C(p)&&!tOut) L = crossed ? 'R' : gap>V_GAP ? 'V' : 'U';
  else if (E(i)&&!E(m)&&!E(a)&&!E(p)) L = tOut ? (down?null:'L') : toward ? 'EU' : down ? 'Q' : dir!=='cima' ? null : cm<0.4 ? 'D' : 'G';
  else if (E(p)&&C(i)&&C(m)&&C(a)) L = tOut ? 'Y' : 'I';
  else if (!tOut && dz>EU_Z && !C(i) && !E(m)&&!E(a)&&!E(p)) L='EU';
  else if (!st.some(E) && st.filter(C).length>=3 && tOut && thumbUp) L='TUDO BEM';   // joinha
  else if (cg<0.3 && nH>=2 && !st.some(E)) L='O';
  else if (st.every(C)) L='A';
  else if (!tOut && !st.some(E) && nH>=1 && ravg<=1.4 && cg<=0.55) L='E';   // dedos dobrados, polegar por baixo, perto das pontas
  else if (nH>=3 && !st.some(E) && cg>0.55 && cg<1.4) L='C';
  const f = [r[0],r[1],r[2],r[3],thumb,gap,cg,cm,k*1.5,cr*3,d(4,6)/size,d(4,7)/size];
  const rule = L; const kn = knn(f); if (kn) L = kn;
  return {L, rule, st, r, thumb, gap, dir, cr, dz, cg, thI, f, size, open: st.every(E)};
}

function camSend(L){
  const now = performance.now();
  if (!L){ held=null; sentLetter=false; $('camBar').style.width='0'; $('camBig').classList.remove('sent'); return; }
  if (L!==held){ held=L; heldSince=now; sentLetter=false; $('camBig').classList.remove('sent'); }
  if (sentLetter) return;
  const p = Math.min(1,(now-heldSince)/HOLD_MS);
  $('camBar').style.width = (p*100)+'%';
  if (p>=1){ sentLetter=true; $('camBig').classList.add('sent'); onData(L,'cam'); }   // mesma função da luva Bluetooth
}

let hist = [], gestLock = 0, gdbg = '', rec = null, recN = 0;
const prac = {on:false, t:null, t0:0, lock:false, score:0};
const game = {on:false, type:null, score:0, end:0, target:null, idx:0, t0:0, lock:false, hold:null, timer:null};
let gd = null;
function detectGesture(){
  const fr = hist.filter(f=>f.h.length===2);
  // PARAR: duas mãos abertas, uma sobre a outra, paradas por ~0,7 s
  const tN = fr.length ? fr[fr.length-1].t : 0, rc = fr.filter(f=>tN-f.t<=900);
  if (rc.length>=6 && rc[rc.length-1].t-rc[0].t>=600){
    const ok = rc.filter(f=>{const [p,q]=f.h; if(!p.open||!q.open) return false; const z=(p.sz+q.sz)/2, dx=Math.abs(p.cx-q.cx)/z, dy=Math.abs(p.cy-q.cy)/z; return dx<=1.2 && dy>=0.3 && dy<=2.2}).length;
    if (ok/rc.length>=0.8) return 'PARAR';
    const okF = rc.filter(f=>f.h.every(q=>q.fist)).length, okT = rc.filter(f=>f.h.every(q=>q.tu)).length;
    if (okF/rc.length>=0.8) return 'APAGAR';     // dois punhos: apaga a última letra
    if (okT/rc.length>=0.8) return 'ENVIAR';     // dois polegares para cima: fala a frase
  }
  if (fr.length<10 || fr[fr.length-1].t-fr[0].t<900) return null;
  const A=fr.map(f=>f.h[0].y), B=fr.map(f=>f.h[1].y), D=fr.map(f=>Math.abs(f.h[1].x-f.h[0].x));
  const rng=a=>Math.max(...a)-Math.min(...a);
  const flips=a=>{let n=0,last=0,ref=a[0];for(const v of a){const d=v-ref;if(Math.abs(d)>0.025){const sg=Math.sign(d);if(last&&sg!==last)n++;last=sg;ref=v}}return n};
  const corr=(a,b)=>{const n=a.length,ma=a.reduce((x,y)=>x+y)/n,mb=b.reduce((x,y)=>x+y)/n;let sab=0,saa=0,sbb=0;for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);saa+=(a[i]-ma)**2;sbb+=(b[i]-mb)**2}return sab/Math.sqrt(saa*sbb||1)};
  // FAMÍLIA (LIBRAS): as duas mãos em F começam juntas, se afastam desenhando UM círculo lento e voltam a se juntar.
  // Não é: bater palma (rápido, repete), aproximar as mãos (começa afastada), mãos abertas/fechadas (formato errado).
  const mx=Math.max(...D), Y=fr.map(f=>(f.h[0].y+f.h[1].y)/2);
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length, k=Math.min(3,fr.length);
  const d0=avg(D.slice(0,k)), d1=avg(D.slice(-k)), iMax=D.indexOf(mx)/(D.length-1);
  const X0=fr.map(f=>f.h[0].x), X1=fr.map(f=>f.h[1].x), lvl=avg(fr.map(f=>Math.abs(f.h[0].y-f.h[1].y)));
  const fG=fr.filter(f=>f.h[0].Fg&&f.h[1].Fg).length/fr.length;                 // formato de F medido pela geometria da mão
  const T=fr.map(f=>f.t), Ds=D.map((v,i)=>avg(D.slice(Math.max(0,i-1),i+2)));  // distância entre as mãos, suavizada
  const lo=Math.min(...Ds), hi=Math.max(...Ds), up=lo+0.6*(hi-lo), dn=lo+0.4*(hi-lo);
  let ep=0, on=false, t0=0, dur=0; for(let i=0;i<Ds.length;i++){ if(!on&&Ds[i]>up){ on=true; ep++; t0=T[i]; } else if(on&&Ds[i]<dn){ on=false; dur=Math.max(dur,T[i]-t0); } } if(on) dur=Math.max(dur,T[T.length-1]-t0);
  let vmax=0; for(let i=0;i+2<Ds.length;i++){ const dt=(T[i+2]-T[i])/1000; if(dt>0.04) vmax=Math.max(vmax,Math.abs(Ds[i+2]-Ds[i])/dt); }
  gdbg=`FAMÍLIA: abre ${rng(D).toFixed(2)} (≥0.18) · começa junta ${(mx-d0).toFixed(2)} / termina junta ${(mx-d1).toFixed(2)} (≥0.15) · pico ${(iMax*100).toFixed(0)}% (15–85) · mãos movem ${rng(X0).toFixed(2)}/${rng(X1).toFixed(2)} (≥0.05) · vertical ${rng(Y).toFixed(2)} (≥0.03) · desnível ${lvl.toFixed(2)} (≤0.2) · F ${(fG*100).toFixed(0)}% (≥${FAM_MIN_F*100}%) · aberturas ${ep} (=1) · aberta ${(dur/1000).toFixed(1)}s (≥0.35) · velocidade ${vmax.toFixed(1)} (≤1.8)`;
  if (rng(D)>=0.18 && mx-d0>=0.15 && mx-d1>=0.15 && iMax>=0.15 && iMax<=0.85 && rng(X0)>=0.05 && rng(X1)>=0.05 && rng(Y)>=0.03 && lvl<=0.2 && fG>=FAM_MIN_F && ep===1 && dur>=350 && vmax<=1.8) return 'FAMILIA';
  // 6-7: as duas mãos sobem e descem alternadas
  if (rng(A)>=0.06 && rng(B)>=0.06 && flips(A)>=2 && flips(B)>=2 && corr(A,B)<-0.3 && rng(D)<0.25) return 'SEIS SETE';
  return null;
}

