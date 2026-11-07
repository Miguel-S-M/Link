// Teste de precisão e calibração guiada
// ================= Teste de precisão =================
const acc={on:false,seq:[],i:0,res:{},reads:{},hold:null,hs:0,dead:0,wait:0,target:''};
function accNext(){
  if(acc.i>=acc.seq.length){ accEnd(); return; }
  acc.target=acc.seq[acc.i]; acc.reads={}; acc.hold=null; acc.dead=performance.now()+4500; acc.wait=0;
  const im=IMG[acc.target.toLowerCase()];
  $('acT').innerHTML=(im?`<img src="${im}" alt="" style="width:100%;max-width:150px;border-radius:10px;display:block;margin:0 auto 6px">`:'')+`<b>${acc.target}</b>`;
  $('acMsg').textContent=`Letra ${acc.i+1} de ${acc.seq.length}: faça e segure`;
}
function accTick(L){
  const now=performance.now(); if(now<acc.wait) return;
  if(L) acc.reads[L]=(acc.reads[L]||0)+1;
  if(L===acc.target){ if(acc.hold!==L){ acc.hold=L; acc.hs=now; } else if(now-acc.hs>=450){ accRes(true); return; } } else acc.hold=null;
  if(now>acc.dead) accRes(false);
}
function accRes(ok){
  const t=acc.target, r=acc.res[t]||(acc.res[t]={ok:0,n:0,wrong:{}}); r.n++; if(ok) r.ok++;
  else { const top=Object.entries(acc.reads).sort((a,b)=>b[1]-a[1])[0], k=top?top[0]:'(nada)'; r.wrong[k]=(r.wrong[k]||0)+1; }
  recordResult(t,ok); acc.i++; acc.wait=performance.now()+800; $('acMsg').textContent=ok?'✔ Acertou':'✖ Não reconheci';
  setTimeout(()=>{ if(acc.on) accNext(); },800);
}
function accEnd(){
  acc.on=false; $('btnAcc').textContent='Iniciar teste'; $('acT').textContent='✅';
  const rows=Object.entries(acc.res).sort((a,b)=>a[1].ok/a[1].n-b[1].ok/b[1].n), tot=rows.reduce((s,[,r])=>s+r.n,0), ok=rows.reduce((s,[,r])=>s+r.ok,0), pct=tot?Math.round(100*ok/tot):0;
  $('acMsg').textContent='Teste concluído: '+pct+'% de acerto';
  $('acOut').innerHTML=`<b>${ok} de ${tot} letras (${pct}%)</b><table style="width:100%;margin-top:8px;border-collapse:collapse">${rows.map(([L,r])=>`<tr style="border-top:1px solid var(--line)"><td style="padding:4px"><b>${L}</b></td><td>${Math.round(100*r.ok/r.n)}%</td><td style="color:var(--mut)">${Object.entries(r.wrong).map(([k,n])=>`leu "${k}"`).join(', ')}</td></tr>`).join('')}</table>`;
  PRG.acc=Math.max(PRG.acc||0,pct); award(Math.round(pct/10));
}
$('btnAcc').onclick=()=>{
  if(acc.on){ acc.on=false; $('btnAcc').textContent='Iniciar teste'; $('acMsg').textContent='Teste interrompido.'; return; }
  if(!camOn){ camMsg('Ligue a câmera antes.'); return; }
  Object.assign(acc,{on:true,seq:[...letterPool()].sort(()=>Math.random()-.5),i:0,res:{}}); $('acOut').innerHTML=''; $('btnAcc').textContent='Parar teste'; accNext();
};

// ================= Calibração guiada =================
const EXT0=[...EXT], CURL0=[...CURL], calib={on:false,s:[]};
{ const c=ls('linkglove_calib',null); if(c&&c.EXT&&c.CURL){ c.EXT.forEach((v,i)=>EXT[i]=v); c.CURL.forEach((v,i)=>CURL[i]=v); } }
function lightLevel(){
  if(!cv.videoWidth) return null;
  const c=document.createElement('canvas'); c.width=32; c.height=24; const x=c.getContext('2d'); x.drawImage(cv,0,0,32,24);
  const d=x.getImageData(0,0,32,24).data; let s=0; for(let i=0;i<d.length;i+=4) s+=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; return s/(d.length/4);
}
const median = a => { const b=[...a].sort((x,y)=>x-y); return b[b.length>>1]; };
const clSay=(t,m)=>{ $('clT').textContent=t; $('clMsg').textContent=m; };
async function calStep(msg,secs){
  calib.s=[]; for(let c=secs;c>0;c--){ clSay(c,msg); await sleep(1000); }
  return calib.s.slice(Math.floor(calib.s.length/2));       // só a metade final (mão já posicionada)
}
$('btnCal').onclick=async()=>{
  if(!camOn){ camMsg('Ligue a câmera antes.'); return; }
  if(calib.on) return; calib.on=true; $('btnCal').disabled=true;
  try{
    const lv=lightLevel(); clSay('💡', lv===null?'Sem imagem.':lv<55?'Pouca luz: acenda uma luz de frente para você.':lv>225?'Luz demais: evite luz forte atrás ou na câmera.':'Luz boa.'); await sleep(1800);
    const open=await calStep('Mostre a mão ABERTA, dedos esticados',4);
    if(open.length<8){ clSay('✋','Não vi a sua mão. Tente de novo mais perto do centro da imagem.'); return; }
    const z=median(open.map(o=>o.z));
    if(z<0.14){ clSay('↔','Mão pequena na imagem: aproxime-a da câmera e calibre de novo.'); return; }
    if(z>0.42){ clSay('↔','Mão grande demais: afaste-a da câmera e calibre de novo.'); return; }
    const fist=await calStep('Agora feche a mão (punho)',4);
    if(fist.length<8){ clSay('✋','Não vi o punho. Tente de novo.'); return; }
    for(let k=0;k<4;k++){
      const ro=median(open.map(o=>o.r[k])), rf=median(fist.map(o=>o.r[k]));
      EXT[k]=Math.max(rf+0.25,ro*0.88); CURL[k]=Math.min(rf*1.12,EXT[k]-0.25);
    }
    lsSet('linkglove_calib',{EXT:[...EXT],CURL:[...CURL]});
    clSay('✅','Calibrado! Limites ajustados à sua mão: esticado a partir de '+EXT.map(v=>v.toFixed(2)).join(' / ')+'.');
  } finally { calib.on=false; $('btnCal').disabled=false; }
};
$('btnCalReset').onclick=()=>{ EXT0.forEach((v,i)=>EXT[i]=v); CURL0.forEach((v,i)=>CURL[i]=v); lsSet('linkglove_calib',null); clSay('↺','Limites restaurados ao padrão.'); };

