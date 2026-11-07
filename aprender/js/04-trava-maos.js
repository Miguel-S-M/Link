// Trava: só as mãos de quem travou
// ===== Trava de mãos: depois de travar, só as mãos de quem travou entram (tamanho da mão; com rosto, tamanho da mão em relação ao rosto) =====
let LOCK = null, LOCKREQ = null;
const handPx = (lm,w,h) => Math.max(Math.hypot((lm[9].x-lm[0].x)*w,(lm[9].y-lm[0].y)*h), Math.hypot((lm[5].x-lm[17].x)*w,(lm[5].y-lm[17].y)*h));
const medOf = a => { const q=[...a].sort((x,y)=>x-y); return q[q.length>>1]; };
function lockUi(msg){
  document.querySelectorAll('.btnLock').forEach(b=>{ b.disabled=!!(LOCK||LOCKREQ); });
  document.querySelectorAll('.btnUnlock').forEach(b=>{ b.disabled=!(LOCK||LOCKREQ); });
  if (msg!==undefined) lockTxt(msg);
}
function lockTxt(t){ if (t!==lockTxt.last){ lockTxt.last=t; document.querySelectorAll('.lockSt').forEach(e=>e.textContent=t); } }
function lockFilter(raw,w,h,now){
  if (LOCKREQ){
    if (now>LOCKREQ.until){ LOCKREQ=null; if(hands) hands.setOptions({maxNumHands:3}); lockUi('Não consegui travar: não vi as suas mãos. Ligue a câmera e deixe só você na imagem.'); return raw; }
    if (raw.length){
      const F=faceFresh();
      raw.forEach(lm=>{ const px=handPx(lm,w,h); LOCKREQ.abs.push(px/h); if(F) LOCKREQ.rat.push(px/(F.w*w)); });
      LOCKREQ.n++;
      if (LOCKREQ.n>=15){
        const useRat = LOCKREQ.rat.length>=10 && F;
        LOCK = {abs:medOf(LOCKREQ.abs), ratio:useRat?medOf(LOCKREQ.rat):null, face:useRat?{cx:F.cx,cy:F.cy}:null, ignT:0};
        LOCKREQ=null; lockUi(); lockStatus(now);
      } else lockTxt('Travando... mantenha as mãos na imagem ('+LOCKREQ.n+'/15)');
    }
    return raw;
  }
  if (!LOCK) return bgFilter(raw,w,h,now);   // sem trava: ainda assim ignora mãos pequenas/distantes (fundo)
  const F=faceFresh(); let ign=0;
  const keep = raw.filter(lm=>{
    const px=handPx(lm,w,h); let ok;
    if (LOCK.ratio && F){ const r=px/(F.w*w); ok = r>=LOCK.ratio*0.7 && r<=LOCK.ratio*1.3; }   // mão tem de estar à mesma distância do rosto travado
    else { const a=px/h; ok = a>=LOCK.abs*0.65 && a<=LOCK.abs*1.5; }
    if (!ok) ign++; return ok;
  });
  if (ign) LOCK.ignT=now;
  lockStatus(now);
  return keep;
}
function lockStatus(now){
  if (!LOCK) return;
  lockTxt('🔒 Travado nas suas mãos ('+(LOCK.ratio?'tamanho da mão em relação ao rosto':'tamanho da mão')+')'+(now-LOCK.ignT<1000?' · ignorando outra mão':''));
}
document.querySelectorAll('.btnLock').forEach(b=>b.onclick = () => {
  if (!camOn){ lockUi('Ligue a câmera antes de travar.'); return; }
  if (!FACEON){ FACEON=true; FACEFAIL=false; try{ localStorage.setItem('linkglove_rosto','1') }catch(e){} faceUi(); }   // o rosto deixa a trava bem mais precisa
  if (hands) hands.setOptions({maxNumHands:4});   // enxerga mais mãos para não perder as suas se houver outras pessoas
  LOCKREQ = {until:performance.now()+6000, n:0, abs:[], rat:[]};
  lockUi('Travando... mostre as suas mãos, com só você na imagem.');
});
document.querySelectorAll('.btnUnlock').forEach(b=>b.onclick = () => {
  LOCK=null; LOCKREQ=null; if (hands) hands.setOptions({maxNumHands:3});
  lockUi('Trava solta: qualquer mão volta a ser lida.');
});
lockUi();

// ===== Ignorar mãos do fundo (automático, sem precisar travar): quem passa atrás tem a mão bem menor que a de quem está sinalizando =====
let BGON = true; try{ BGON = localStorage.getItem('linkglove_fundo')!=='0' }catch(e){}
const BG = {ref:0, t:0, ignT:0, shown:false};
function bgFilter(raw,w,h,now){
  if (!BGON || !raw.length) return raw;
  const sz = raw.map(lm=>handPx(lm,w,h)/h), big = Math.max(...sz);
  const fresh = BG.ref>0 && now-BG.t<3000;                  // lembra do tamanho da mão de quem sinaliza por 3 s
  let idx = raw.map((_,i)=>i).filter(i => sz[i]>=0.45*big && (!fresh || sz[i]>=0.42*BG.ref));   // limites folgados: no boxe uma mão pode ficar bem maior que a outra num golpe
  idx.sort((p,q)=>sz[q]-sz[p]); idx = idx.slice(0,2);       // no máximo duas mãos: as maiores (as mais perto da câmera)
  const keep = idx.map(i=>raw[i]);
  if (keep.length){
    const m = idx.reduce((a,i)=>a+sz[i],0)/idx.length;
    BG.ref = fresh ? BG.ref*0.85+m*0.15 : m; BG.t = now;    // acompanha aos poucos se você chega perto ou se afasta
  }
  if (keep.length<raw.length) BG.ignT = now;
  if (!LOCK && !LOCKREQ){
    if (now-BG.ignT<1500){ lockTxt('👥 Ignorando mão de fundo (menor ou mais distante que a sua)'); BG.shown=true; }
    else if (BG.shown){ lockTxt(''); BG.shown=false; }
  }
  return keep;
}
function bgUi(){ document.querySelectorAll('.btnBg').forEach(b=>{ b.textContent='👥 Ignorar mãos do fundo: '+(BGON?'ligado':'desligado'); b.classList.toggle('primary',BGON); b.setAttribute('aria-pressed',BGON?'true':'false'); }); }
document.querySelectorAll('.btnBg').forEach(b=>b.onclick = () => { BGON=!BGON; try{ localStorage.setItem('linkglove_fundo',BGON?'1':'0') }catch(e){} bgUi(); });
bgUi();

