// Expressões faciais: 16 expressões medidas a partir dos pontos do rosto, cada uma com intensidade de 0 a 100%.
// Ajusta-se ao rosto neutro de cada pessoa (botão "Calibrar rosto neutro" na aba Diagnóstico).
// A língua é EXPERIMENTAL: compara a cor da região abaixo do lábio com a cor da pele (depende da luz).
const EX_ORDEM = ['boca aberta','boca em O','bico','lábios apertados','sorriso','cantos para baixo','bochecha inflada','nariz franzido',
  'sobrancelhas erguidas','sobrancelhas franzidas','sobrancelha assimétrica','olhos arregalados','olhos semicerrados','olhos fechados',
  'piscada de um olho','língua para fora'];
const EX_BASE0 = {jaw:0.008, wid:0.38, sm:-0.004, br:0.09, brIn:0.15, ear:0.30, lip:0.042, chk:0.5, nl:0.058};
let EX_BASE = Object.assign({}, EX_BASE0, ls('neutro_rosto', {}));
let EX2 = null, EX_CAL = null, EX_OKCAL = false, EX_CX = null, EX_LT = 0, EX_LG = {v:0, frac:0, rect:null, ok:true};
const exC = x => Math.max(0, Math.min(1, x));

function exprMedidas(l, W, H){
  const d=(a,b)=>Math.hypot((l[a].x-l[b].x)*W,(l[a].y-l[b].y)*H), fH=d(10,152)||1, fW=d(234,454)||1;
  const earL=d(159,145)/(d(33,133)||1), earR=d(386,374)/(d(362,263)||1);
  const mL={x:(l[33].x+l[133].x)/2, y:(l[33].y+l[133].y)/2}, mR={x:(l[263].x+l[362].x)/2, y:(l[263].y+l[362].y)/2};   // meio do olho: não muda quando pisca
  const brL=Math.hypot((l[105].x-mL.x)*W,(l[105].y-mL.y)*H)/fH, brR=Math.hypot((l[334].x-mR.x)*W,(l[334].y-mR.y)*H)/fH;
  return {jaw:d(13,14)/fH, wid:d(61,291)/fW, sm:((l[13].y-(l[61].y+l[291].y)/2)*H)/fH,   // lábio de cima x cantos: não muda ao abrir o queixo
          br:(brL+brR)/2, brL, brR, brIn:d(107,336)/fW,
          ear:(earL+earR)/2, earL, earR, lip:(d(0,13)+d(14,17))/fH, chk:d(205,425)/fW, nl:d(2,0)/fH};
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
  i['língua para fora']=lg.v;
  return i;
}

// língua (experimental): pixel mais vermelho que a pele, na região logo abaixo do lábio inferior
function exprPixel(r, g, b, ref){ const s=r+g+b+1; return s>165 && r/s-ref.rr>0.055 && g/s<ref.gg-0.015; }
function exprAmostra(x0, y0, x1, y1){
  const vw=cv.videoWidth, vh=cv.videoHeight, sx=Math.max(0,x0*vw), sy=Math.max(0,y0*vh);
  EX_CX.drawImage(cv, sx, sy, Math.max(2,Math.min(vw-sx,(x1-x0)*vw)), Math.max(2,Math.min(vh-sy,(y1-y0)*vh)), 0, 0, 48, 32);
  return EX_CX.getImageData(0,0,48,32).data;
}
function exprLingua(l, jaw){
  const now=performance.now();
  if (jaw<0.03){ EX_LG={v:0, frac:0, rect:null, ok:EX_LG.ok}; return EX_LG; }
  if (now-EX_LT<120) return EX_LG; EX_LT=now;
  try{
    if (!EX_CX){ const c=document.createElement('canvas'); c.width=48; c.height=32; EX_CX=c.getContext('2d',{willReadFrequently:true}); }
    if (!cv.videoWidth) return EX_LG;
    let sr=0, sg=0, n=0;
    for (const k of [205,425]){ const p=l[k], d=exprAmostra(p.x-0.02,p.y-0.02,p.x+0.02,p.y+0.02); for (let q=0;q<d.length;q+=4){ const s=d[q]+d[q+1]+d[q+2]+1; sr+=d[q]/s; sg+=d[q+1]/s; n++; } }
    const ref={rr:sr/n, gg:sg/n}, mw=Math.abs(l[291].x-l[61].x), fh=Math.abs(l[152].y-l[10].y);
    const rect={x0:l[17].x-0.35*mw, y0:l[17].y+0.005, x1:l[17].x+0.35*mw, y1:l[17].y+0.16*fh};
    const d=exprAmostra(rect.x0,rect.y0,rect.x1,rect.y1); let pk=0; for (let q=0;q<d.length;q+=4) if (exprPixel(d[q],d[q+1],d[q+2],ref)) pk++;
    const frac=pk/(d.length/4), v0=exC((frac-0.12)/0.35);
    EX_LG={v:EX_LG.v+(v0-EX_LG.v)*0.5, frac, rect, ok:true};
  }catch(e){ EX_LG={v:0, frac:0, rect:null, ok:false}; }
  return EX_LG;
}

// chamado a cada resultado da malha do rosto (03-rosto.js)
function exprStep(l, W, H){
  const now=performance.now(), v=exprMedidas(l,W,H), i=exprIntens(v,EX_BASE,exprLingua(l,v.jaw));
  EX2={t:now, v, i, nomes:EX_ORDEM.filter(k=>i[k]>=0.5), lingua:EX_LG, l};
  if (EX_CAL){ EX_CAL.s.push(v); if (now>=EX_CAL.fim) exprFimCal(); }
  diagFace(now);
}
function exprCalibrar(){ EX_CAL={fim:performance.now()+3000, s:[]}; }
function exprFimCal(){
  const S=EX_CAL.s; EX_CAL=null; EX_OKCAL=S.length>=6; if (!EX_OKCAL) return false;
  Object.keys(EX_BASE0).forEach(k=>EX_BASE[k]=S.reduce((a,q)=>a+q[k],0)/S.length);
  lsSet('neutro_rosto', EX_BASE); return true;
}
function exprRestaurar(){ EX_BASE=Object.assign({}, EX_BASE0); lsSet('neutro_rosto', null); }
