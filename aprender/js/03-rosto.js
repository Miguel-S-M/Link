// Rosto, cabeça e expressões (Face Detection / FaceMesh)
// ===== Rosto (opcional, só nas abas Tradutor e Treino): detecta o rosto para saber onde a mão está em relação a ele =====
let FACEON = false; try{ FACEON = localStorage.getItem('linkglove_rosto')==='1' }catch(e){}
let faceDet = null, FACE = null, faceN = 0, FACEFAIL = false;
let faceMesh = null, EXPR = false, HEADH = []; try{ EXPR = localStorage.getItem('linkglove_expr')==='1' }catch(e){}
const faceTabOk = () => ['tab-tr','tab-cfg'].some(id => { const q=$(id); return q && q.classList.contains('on'); });
const faceFresh = () => (FACE && performance.now()-FACE.t<1500) ? FACE : null;   // se a mão tapar o rosto, vale o último por 1,5 s
function faceUi(){
  document.querySelectorAll('.btnFace').forEach(b=>{ b.textContent = FACEON ? '👤 Rosto: ligado' : '👤 Reconhecer rosto'; b.classList.toggle('primary',FACEON); b.setAttribute('aria-pressed',FACEON?'true':'false'); });
  document.querySelectorAll('.btnExpr').forEach(b=>{ const on=FACEON&&EXPR; b.textContent=on?'😀 Expressões: ligado':'😀 Expressões'; b.classList.toggle('primary',on); b.setAttribute('aria-pressed',on?'true':'false'); });
  if (!FACEON){ faceStatus.last=null; document.querySelectorAll('.faceSt').forEach(e=>e.textContent=''); }
}
function headOf(eA,eB,nose){   // inclinação (roll), giro (yaw) e cabeceio (pitch) da cabeça, a partir dos olhos e do nariz
  const W=cv.videoWidth||640, H=cv.videoHeight||480;
  const eL=eA.x<eB.x?eA:eB, eR=eA.x<eB.x?eB:eA;
  const dx=(eR.x-eL.x)*W, dy=(eR.y-eL.y)*H, ed=Math.hypot(dx,dy)||1, mx=(eL.x+eR.x)/2, my=(eL.y+eR.y)/2;
  return {roll:Math.atan2(dy,dx), yaw:((nose.x-mx)*W)/ed, pitch:((nose.y-my)*H)/ed};
}
function setFace(f){
  FACE = Object.assign({t:performance.now()}, f);
  if (LOCK && LOCK.face) LOCK.face={cx:f.cx, cy:f.cy};
  HEADH.push({t:FACE.t, yaw:f.yaw, pitch:f.pitch}); while (HEADH.length && FACE.t-HEADH[0].t>1200) HEADH.shift();
}
function onFaceResults(res){
  const ds=(res.detections||[]).filter(q=>q&&q.boundingBox); if(!ds.length) return;
  const dist=q=>Math.hypot(q.boundingBox.xCenter-LOCK.face.cx, q.boundingBox.yCenter-LOCK.face.cy);
  let d;
  if (LOCK && LOCK.face){ d=ds.reduce((m,q)=>dist(q)<dist(m)?q:m); if (dist(d)>0.35) return; }   // travado: segue só o rosto de quem travou
  else d=ds.reduce((m,q)=>q.boundingBox.width>m.boundingBox.width?q:m);                           // sem trava: o rosto maior (o mais perto)
  const b=d.boundingBox, k=d.landmarks||[], cy=b.yCenter, h=b.height;
  const eA=k[0]||{x:b.xCenter-b.width*0.2,y:cy-h*0.15}, eB=k[1]||{x:b.xCenter+b.width*0.2,y:cy-h*0.15}, nose=k[2]||{x:b.xCenter,y:cy+h*0.05};
  setFace(Object.assign({cx:b.xCenter, cy, w:b.width, h,
    eyeY:(eA.y+eB.y)/2, noseY:nose.y, mouthY:k[3]?k[3].y:cy+h*0.22,
    kp:k.map(q=>({x:q.x,y:q.y}))}, headOf(eA,eB,nose)));
}
function onMeshResults(res){   // FaceMesh (modo Expressões): além do rosto e da cabeça, mede boca, sorriso, sobrancelha e olhos
  const W=cv.videoWidth||640, H=cv.videoHeight||480;
  const fs=(res.multiFaceLandmarks||[]).filter(l=>l&&l.length>=400).map(l=>{
    let x0=1,x1=0,y0=1,y1=0; for(const q of l){ if(q.x<x0)x0=q.x; if(q.x>x1)x1=q.x; if(q.y<y0)y0=q.y; if(q.y>y1)y1=q.y; }
    return {l, cx:(x0+x1)/2, cy:(y0+y1)/2, w:x1-x0, h:y1-y0};
  });
  if (!fs.length) return;
  let f;
  if (LOCK && LOCK.face){ const dd=q=>Math.hypot(q.cx-LOCK.face.cx,q.cy-LOCK.face.cy); f=fs.reduce((m,q)=>dd(q)<dd(m)?q:m); if (dd(f)>0.35) return; }
  else f=fs.reduce((m,q)=>q.w>m.w?q:m);
  const l=f.l, d=(a,b)=>Math.hypot((l[a].x-l[b].x)*W,(l[a].y-l[b].y)*H);
  const fH=d(10,152)||1, fW=d(234,454)||1;
  const ex=[ d(13,14)/fH,                                                        // boca aberta
             d(61,291)/fW,                                                       // largura da boca
             (((l[13].y+l[14].y)/2-(l[61].y+l[291].y)/2)*H)/fH,                  // cantos da boca para cima (sorriso)
             ((d(105,159)+d(334,386))/2)/fH,                                     // sobrancelha longe do olho (erguida)
             (d(159,145)/(d(33,133)||1)+d(386,374)/(d(362,263)||1))/2 ];        // olho aberto
  setFace(Object.assign({cx:f.cx, cy:f.cy, w:f.w, h:f.h, eyeY:(l[33].y+l[263].y)/2, noseY:l[1].y, mouthY:(l[13].y+l[14].y)/2,
    kp:[33,263,1,13,61,291,105,334,159,386].map(i=>({x:l[i].x,y:l[i].y})), ex}, headOf(l[33],l[263],l[1])));
}
async function faceStep(src){
  if (!FACEON || FACEFAIL || !faceTabOk()) return;
  if (EXPR && typeof FaceMesh==='undefined'){ EXPR=false; faceUi(); camMsg('Não foi possível carregar as expressões (verifique a internet). Seguindo só com o rosto.'); }
  if (!EXPR && typeof FaceDetection==='undefined'){ FACEFAIL=true; camMsg('Não foi possível carregar o reconhecimento de rosto (verifique a internet).'); return; }
  try{
    if (EXPR){
      if (!faceMesh){
        faceMesh = new FaceMesh({locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`});
        faceMesh.setOptions({maxNumFaces:2, refineLandmarks:false, minDetectionConfidence:0.5, minTrackingConfidence:0.5});
        faceMesh.onResults(onMeshResults);
      }
      if ((faceN++ & 1) && FACE) return;
      await faceMesh.send({image:src});
    } else {
      if (!faceDet){
        faceDet = new FaceDetection({locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/${f}`});
        faceDet.setOptions({model:'short', minDetectionConfidence:0.5});
        faceDet.onResults(onFaceResults);
      }
      if ((faceN++ & 1) && FACE) return;   // depois do primeiro rosto, roda a cada 2 quadros
      await faceDet.send({image:src});
    }
  }catch(e){
    if (EXPR){ EXPR=false; faceMesh=null; faceUi(); camMsg('As expressões não funcionaram neste navegador. Seguindo só com o rosto.'); }
    else { FACEFAIL=true; faceDet=null; camMsg('O reconhecimento de rosto não funcionou neste navegador. A câmera continua só com as mãos.'); }
  }
}
function faceZone(hx,hy){
  const F=faceFresh(); if(!F) return '';
  const dx=Math.abs(hx-F.cx)/F.w;
  if (hy>F.cy+F.h*1.6 || hy<F.cy-F.h*1.3 || dx>1.8) return 'longe do rosto';
  if (dx>0.9) return 'ao lado do rosto';
  if (hy<F.eyeY-F.h*0.12) return 'na testa';
  if (hy<(F.eyeY+F.noseY)/2) return 'nos olhos';
  if (hy<(F.noseY+F.mouthY)/2) return 'no nariz';
  if (hy<F.mouthY+F.h*0.15) return 'na boca';
  if (hy<F.cy+F.h*0.7) return 'no queixo';
  return 'abaixo do rosto';
}
function exprLabel(e){   // limites aproximados: servem só para mostrar na tela; a gravação usa os números
  const o=[]; if (e[0]>0.07) o.push('boca aberta'); if (e[2]>0.012||(e[1]>0.5&&e[0]<0.05)) o.push('sorrindo');
  if (e[3]>0.085) o.push('sobrancelhas erguidas'); if (e[4]<0.17) o.push('olhos fechados'); return o.join(', ');
}
function headLabel(){
  if (HEADH.length<6) return '';
  const ys=HEADH.map(q=>q.yaw), ps=HEADH.map(q=>q.pitch), ry=Math.max(...ys)-Math.min(...ys), rp=Math.max(...ps)-Math.min(...ps);
  if (rp>0.12 && rp>1.5*ry) return 'cabeça: sim'; if (ry>0.3 && ry>1.5*rp) return 'cabeça: não'; return '';
}
function faceStatus(all){
  if (!FACEON || !faceTabOk()) return;
  const F=faceFresh(); let t='';
  if (camOn){
    if (FACEFAIL) t='Rosto indisponível';
    else if (!F) t='Procurando o rosto...';
    else {
      t='Rosto detectado';
      if (all.length){ const m=all.map(l=>l[9]).sort((p,q)=>Math.hypot(p.x-F.cx,p.y-F.cy)-Math.hypot(q.x-F.cx,q.y-F.cy))[0]; t+=' · mão '+faceZone(m.x,m.y); }
      if (EXPR && F.ex){ const x=exprLabel(F.ex); if (x) t+=' · '+x; }
      const hl=headLabel(); if (hl) t+=' · '+hl;
    }
  }
  if (t!==faceStatus.last){ faceStatus.last=t; document.querySelectorAll('.faceSt').forEach(e=>e.textContent=t); }
}
function drawFace(w,h){
  if (!FACEON) return; const F=faceFresh(); if(!F) return;
  cx.lineWidth=2; cx.strokeStyle='#a78bfa'; cx.strokeRect((F.cx-F.w/2)*w,(F.cy-F.h/2)*h,F.w*w,F.h*h);
  cx.fillStyle='#a78bfa'; F.kp.forEach(q=>{ cx.beginPath(); cx.arc(q.x*w,q.y*h,4,0,6.283); cx.fill(); });
}

