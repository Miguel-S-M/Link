// Expressões faciais: 23 expressões, cada uma com intensidade de 0 a 100%.
// Principal: modelo de "blendshapes" do MediaPipe Face Landmarker (piscada, bochecha, boca, sobrancelhas, olhar...).
// Se o modelo não carregar, usa medidas geométricas dos pontos do rosto (menos precisas).
// A língua não existe nesse modelo: é EXPERIMENTAL (compara a cor abaixo do lábio com a cor da pele; depende da luz).
const EX_ORDEM = ['boca aberta','boca em O','bico','lábios apertados','lábios para dentro','sorriso','cantos para baixo','bochecha inflada',
  'nariz franzido','boca para o lado','maxilar para frente','sobrancelhas erguidas','sobrancelhas franzidas','sobrancelha assimétrica',
  'olhos arregalados','olhos semicerrados','olhos fechados','piscada de um olho','olhar para cima','olhar para baixo',
  'olhar para a esquerda','olhar para a direita','língua para fora'];
const EX_BASE0 = {jaw:0.008, wid:0.38, sm:-0.004, br:0.09, brIn:0.15, ear:0.30, lip:0.042, chk:0.5, nl:0.058};
let EX_BASE = Object.assign({}, EX_BASE0, ls('neutro_rosto', {}));
let EX2 = null, EX_CAL = null, EX_OKCAL = false, EX_CX = null, EX_LT = 0, EX_LG = {v:0, frac:0, a:0, rect:null, ok:true};
const exC = x => Math.max(0, Math.min(1, x));

// ---------- modelo de blendshapes (Face Landmarker) ----------
const ML = {fl:null, estado:'', erro:'', bs:null, t:0, n:0, k:0, hist:{}, auto:{}, man:ls('neutro_ml', null)};
const ML_MODELO = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const ML_CAND = [['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14','/vision_bundle.mjs'],
                 ['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14','/+esm'],
                 ['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3','/vision_bundle.js']];
async function mlCarregar(){
  if (ML.estado==='carregando'||ML.estado==='ok') return;
  ML.estado='carregando'; ML.erro='';
  for (const [base,arq] of ML_CAND){
    try{
      const mod=await import(base+arq), fs=await mod.FilesetResolver.forVisionTasks(base+'/wasm');
      const opc=d=>({baseOptions:{modelAssetPath:ML_MODELO, delegate:d}, runningMode:'VIDEO', numFaces:1, outputFaceBlendshapes:true});
      try{ ML.fl=await mod.FaceLandmarker.createFromOptions(fs,opc('GPU')); }catch(e){ ML.fl=await mod.FaceLandmarker.createFromOptions(fs,opc('CPU')); }
      ML.estado='ok'; return;
    }catch(e){ ML.erro=String(e&&e.message||e).slice(0,90); }
  }
  ML.estado='falhou';
}
async function mlStep(src){   // true = o modelo cuidou deste quadro; false = use a malha antiga
  if (ML.estado==='falhou') return false;
  if (!ML.fl){ if (ML.estado!=='carregando') mlCarregar(); return false; }
  if ((ML.n++ & 1) && FACE) return true;
  let res; try{ res=ML.fl.detectForVideo(src, performance.now()); }catch(e){ ML.estado='falhou'; ML.erro='leitura: '+String(e&&e.message||e).slice(0,70); return false; }
  const f=res&&res.faceLandmarks&&res.faceLandmarks[0], b=res&&res.faceBlendshapes&&res.faceBlendshapes[0];
  if (!f) return true;
  ML.bs=null; if (b){ const m={}; b.categories.forEach(q=>m[q.categoryName]=q.score); ML.bs=m; ML.t=performance.now(); }
  onMeshResults({multiFaceLandmarks:[f]});
  return true;
}
function mlBaseAtual(){ return ML.man || ML.auto; }
function mlAprende(bs){   // linha de base automática: mediana dos últimos ~12 s (o rosto fica neutro a maior parte do tempo)
  if (++ML.k%3) return;
  for (const n in bs){ const h=ML.hist[n]||(ML.hist[n]=[]); h.push(bs[n]); if (h.length>60) h.shift();
    if (h.length>=20){ const s=h.slice().sort((a,b)=>a-b); ML.auto[n]=Math.min(0.35,s[s.length>>1]); } }
}
function mlIntens(bs, base){
  const s=n=>Math.max(0,(bs[n]||0)-(base[n]||0)), av=(a,b)=>(s(a)+s(b))/2, mn=(a,b)=>Math.min(s(a),s(b)), mx=(a,b)=>Math.max(s(a),s(b)), c=exC, i={};
  const dB=Math.abs(s('eyeBlinkLeft')-s('eyeBlinkRight'));
  i['olhos fechados']=c(mn('eyeBlinkLeft','eyeBlinkRight')/0.8);
  i['piscada de um olho']=mx('eyeBlinkLeft','eyeBlinkRight')>0.45 ? c(dB/0.7) : 0;
  i['olhos semicerrados']=c(av('eyeSquintLeft','eyeSquintRight')/0.8);
  i['olhos arregalados']=c(av('eyeWideLeft','eyeWideRight')/0.6);
  i['boca aberta']=c(s('jawOpen')/0.5);
  i['boca em O']=c(s('mouthFunnel')/0.6);
  i['bico']=c(s('mouthPucker')/0.6);
  i['lábios apertados']=c(av('mouthPressLeft','mouthPressRight')/0.6);
  i['lábios para dentro']=c(av('mouthRollLower','mouthRollUpper')/0.6);
  i['sorriso']=c(av('mouthSmileLeft','mouthSmileRight')/0.7);
  i['cantos para baixo']=c(av('mouthFrownLeft','mouthFrownRight')/0.6);
  i['bochecha inflada']=c(s('cheekPuff')/0.5);
  i['nariz franzido']=c(av('noseSneerLeft','noseSneerRight')/0.6);
  i['boca para o lado']=c(mx('mouthLeft','mouthRight')/0.5);
  i['maxilar para frente']=c(s('jawForward')/0.5);
  i['sobrancelhas erguidas']=c(Math.max(s('browInnerUp'),av('browOuterUpLeft','browOuterUpRight'))/0.6);
  i['sobrancelhas franzidas']=c(av('browDownLeft','browDownRight')/0.6);
  i['sobrancelha assimétrica']=c(Math.max(Math.abs(s('browDownLeft')-s('browDownRight')),Math.abs(s('browOuterUpLeft')-s('browOuterUpRight')))/0.6);
  i['olhar para cima']=c(av('eyeLookUpLeft','eyeLookUpRight')/0.6);
  i['olhar para baixo']=c(av('eyeLookDownLeft','eyeLookDownRight')/0.6);
  i['olhar para a esquerda']=c(av('eyeLookOutLeft','eyeLookInRight')/0.6);   // esquerda de quem sinaliza
  i['olhar para a direita']=c(av('eyeLookOutRight','eyeLookInLeft')/0.6);
  return i;
}

// ---------- plano B: medidas geométricas dos pontos do rosto ----------
function exprMedidas(l, W, H){
  const d=(a,b)=>Math.hypot((l[a].x-l[b].x)*W,(l[a].y-l[b].y)*H), fH=d(10,152)||1, fW=d(234,454)||1;
  const earL=d(159,145)/(d(33,133)||1), earR=d(386,374)/(d(362,263)||1);
  const mL={x:(l[33].x+l[133].x)/2, y:(l[33].y+l[133].y)/2}, mR={x:(l[263].x+l[362].x)/2, y:(l[263].y+l[362].y)/2};   // meio do olho: não muda quando pisca
  const brL=Math.hypot((l[105].x-mL.x)*W,(l[105].y-mL.y)*H)/fH, brR=Math.hypot((l[334].x-mR.x)*W,(l[334].y-mR.y)*H)/fH;
  return {jaw:d(13,14)/fH, wid:d(61,291)/fW, sm:((l[13].y-(l[61].y+l[291].y)/2)*H)/fH,
          br:(brL+brR)/2, brL, brR, brIn:d(107,336)/fW, ear:(earL+earR)/2, earL, earR, lip:(d(0,13)+d(14,17))/fH, chk:d(205,425)/fW, nl:d(2,0)/fH};
}
function exprIntens(v, b, lg){
  const c=exC, shrink=c((b.wid-v.wid)/0.08), eMax=Math.max(v.earL,v.earR), eMin=Math.min(v.earL,v.earR), fech=c((b.ear*0.55-eMax)/(b.ear*0.25)), i={};
  i['boca aberta']=c((v.jaw-b.jaw)/0.10);
  i['boca em O']=v.jaw>0.05 ? shrink : 0;
  i['bico']=v.jaw<=0.05 ? shrink : 0;
  i['lábios apertados']=v.jaw<0.03 ? c((b.lip*0.7-v.lip)/(b.lip*0.25)) : 0;
  i['sorriso']=c((v.sm-b.sm)/0.035);
  i['cantos para baixo']=c((b.sm-v.sm)/0.03);
  i['bochecha inflada']=v.jaw<0.05 ? c((v.chk-b.chk)/0.05) : 0;
  i['nariz franzido']=c((b.nl-v.nl)/0.012)*(1-shrink);
  i['sobrancelhas erguidas']=c((Math.min(v.brL,v.brR)-b.br)/0.03);
  i['sobrancelhas franzidas']=Math.max(c((b.br-Math.max(v.brL,v.brR))/0.018), c((b.brIn-v.brIn)/0.04));
  i['sobrancelha assimétrica']=c((Math.abs(v.brL-v.brR)-0.01)/0.02);
  i['olhos arregalados']=c((eMin-b.ear)/0.10);
  i['olhos semicerrados']=c((b.ear*0.85-eMax)/(b.ear*0.15))*(1-fech);
  i['olhos fechados']=fech;
  i['piscada de um olho']=(Math.min(v.earL,v.earR)<b.ear*0.55 && Math.max(v.earL,v.earR)>b.ear*0.8) ? 1 : 0;
  return i;
}

// ---------- língua (experimental): pixels mais avermelhados que a pele, logo abaixo do lábio inferior ----------
function exprLab(r, g, b){
  const f=v=>{ v/=255; return v<=0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }, R=f(r), G=f(g), B=f(b), h=t=>t>0.008856 ? Math.cbrt(t) : 7.787*t+16/116;
  const X=(0.4124*R+0.3576*G+0.1805*B)/0.95047, Y=0.2126*R+0.7152*G+0.0722*B, Z=(0.0193*R+0.1192*G+0.9505*B)/1.08883;
  return [116*h(Y)-16, 500*(h(X)-h(Y)), 200*(h(Y)-h(Z))];
}
function exprPixel(r, g, b, ref){ const q=exprLab(r,g,b); return q[0]>25 && q[0]<88 && q[1]>24 && q[1]>ref.a+12; }
function exprAmostra(x0, y0, x1, y1){
  const vw=cv.videoWidth, vh=cv.videoHeight, sx=Math.max(0,x0*vw), sy=Math.max(0,y0*vh);
  EX_CX.drawImage(cv, sx, sy, Math.max(2,Math.min(vw-sx,(x1-x0)*vw)), Math.max(2,Math.min(vh-sy,(y1-y0)*vh)), 0, 0, 48, 32);
  return EX_CX.getImageData(0,0,48,32).data;
}
function exprLingua(l, jaw){
  const now=performance.now();
  if (jaw<0.02){ EX_LG={v:0, frac:0, a:EX_LG.a, rect:null, ok:EX_LG.ok}; return EX_LG; }
  if (now-EX_LT<120) return EX_LG; EX_LT=now;
  try{
    if (!EX_CX){ const c=document.createElement('canvas'); c.width=48; c.height=32; EX_CX=c.getContext('2d',{willReadFrequently:true}); }
    if (!cv.videoWidth) return EX_LG;
    const fh=Math.abs(l[152].y-l[10].y), mw=Math.abs(l[291].x-l[61].x);
    let sa=0, n=0;   // cor da pele: queixo + bochechas
    for (const [px,py] of [[l[152].x,l[152].y-0.05*fh],[l[205].x,l[205].y],[l[425].x,l[425].y]]){
      const d=exprAmostra(px-0.02,py-0.02,px+0.02,py+0.02); for (let q=0;q<d.length;q+=4){ sa+=exprLab(d[q],d[q+1],d[q+2])[1]; n++; } }
    const ref={a:sa/n}, rect={x0:l[17].x-0.35*mw, y0:l[17].y+0.005, x1:l[17].x+0.35*mw, y1:l[17].y+0.14*fh};
    const d=exprAmostra(rect.x0,rect.y0,rect.x1,rect.y1); let pk=0; for (let q=0;q<d.length;q+=4) if (exprPixel(d[q],d[q+1],d[q+2],ref)) pk++;
    const frac=pk/(d.length/4), v0=exC((frac-0.10)/0.30);
    EX_LG={v:EX_LG.v+(v0-EX_LG.v)*0.5, frac, a:ref.a, rect, ok:true};
  }catch(e){ EX_LG={v:0, frac:0, a:0, rect:null, ok:false}; }
  return EX_LG;
}

// chamado a cada rosto detectado (03-rosto.js)
function exprStep(l, W, H){
  const now=performance.now(), v=exprMedidas(l,W,H), lg=exprLingua(l,v.jaw), ml=!!(ML.bs && now-ML.t<400);
  let i;
  if (ml){ mlAprende(ML.bs); i=mlIntens(ML.bs, mlBaseAtual()); } else i=exprIntens(v,EX_BASE,lg);
  i['língua para fora']=lg.v; EX_ORDEM.forEach(k=>{ if (i[k]==null) i[k]=0; });
  EX2={t:now, v, i, nomes:EX_ORDEM.filter(k=>i[k]>=0.5), lingua:EX_LG, l, ml};
  if (EX_CAL){ EX_CAL.s.push(v); if (ml) EX_CAL.b.push(ML.bs); if (now>=EX_CAL.fim) exprFimCal(); }
  diagFace(now);
}
function exprCalibrar(){ EX_CAL={fim:performance.now()+3000, s:[], b:[]}; }
function exprFimCal(){
  const S=EX_CAL.s, B=EX_CAL.b; EX_CAL=null; EX_OKCAL=S.length>=6; if (!EX_OKCAL) return false;
  Object.keys(EX_BASE0).forEach(k=>EX_BASE[k]=S.reduce((a,q)=>a+q[k],0)/S.length); lsSet('neutro_rosto', EX_BASE);
  if (B.length>=6){ const m={}; Object.keys(B[0]).forEach(n=>m[n]=B.reduce((a,q)=>a+(q[n]||0),0)/B.length); ML.man=m; lsSet('neutro_ml', m); }
  return true;
}
function exprRestaurar(){ EX_BASE=Object.assign({}, EX_BASE0); lsSet('neutro_rosto', null); ML.man=null; lsSet('neutro_ml', null); }
