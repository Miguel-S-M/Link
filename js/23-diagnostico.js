// Aba Diagnóstico: mostra ao vivo o que o site está enxergando (mãos, rosto, expressões) e se tudo está funcionando.
const DG = {last:null, n:0, nf:0, fps:0, ffps:0, t0:0, tf0:0};
const DG_PONTO = ['punho','polegar 1','polegar 2','polegar 3','polegar ponta','indicador 1','indicador 2','indicador 3','indicador ponta',
  'médio 1','médio 2','médio 3','médio ponta','anelar 1','anelar 2','anelar 3','anelar ponta','mínimo 1','mínimo 2','mínimo 3','mínimo ponta'];
const DG_GRUPOS = [['#f472b6',[61,185,40,39,37,0,267,269,270,409,291,375,321,405,314,17,84,181,91,146,78,191,80,81,82,13,312,311,310,415,308,324,318,402,317,14,87,178,88,95]],
  ['#60a5fa',[33,246,161,160,159,158,157,173,133,155,154,153,145,144,163,7,263,466,388,387,386,385,384,398,362,382,381,380,374,373,390,249]],
  ['#fbbf24',[70,63,105,66,107,300,293,334,296,336]], ['#34d399',[2,98,327,1,129,358,205,425]]];

function diagFrame(all, w, h, now){
  DG.last={all, w, h, t:now}; DG.n++;
  if (now-DG.t0>=1000){ DG.fps=Math.round(DG.n*1000/(now-DG.t0)); DG.n=0; DG.t0=now; }
}
function diagFace(now){
  DG.nf++; if (now-DG.tf0>=1000){ DG.ffps=Math.round(DG.nf*1000/(now-DG.tf0)); DG.nf=0; DG.tf0=now; }
}
const dgOn = () => curTab==='diag';

// desenho sobre a imagem (chamado pelo motor de câmera antes de copiar para a tela)
function diagDraw(cx, w, h, all){
  if (!dgOn()) return;
  const lab=(t,x,y,col)=>{ cx.save(); cx.translate(x,y); cx.scale(-1,1); cx.font='bold 11px sans-serif'; cx.fillStyle=col; cx.fillText(t,0,0); cx.restore(); };   // a tela é espelhada: o texto sai certo
  (all||[]).forEach(lm=>lm.forEach((p,i)=>lab(i,p.x*w+5,p.y*h-5,'#fde047')));
  if (!$('dgPts').checked || !EX2 || performance.now()-EX2.t>1500) return;
  DG_GRUPOS.forEach(([cor,ids])=>{ cx.fillStyle=cor; ids.forEach(i=>{ const p=EX2.l[i]; cx.beginPath(); cx.arc(p.x*w,p.y*h,2,0,6.283); cx.fill(); }); });
  const r=EX2.lingua&&EX2.lingua.rect; if (r){ cx.lineWidth=2; cx.strokeStyle=EX2.lingua.v>=0.5?'#ef4444':'#9ca3af'; cx.strokeRect(r.x0*w,r.y0*h,(r.x1-r.x0)*w,(r.y1-r.y0)*h); }
}

const dgChip = (ok, t) => '<span class="chip'+(ok?' ok':'')+'">'+(ok?'✔ ':'✖ ')+t+'</span> ';
const f3 = v => (v>=0?'+':'')+v.toFixed(3);

function diagRender(){
  const now=performance.now(), P=PARAMS, F=faceFresh(), X=EX2&&now-EX2.t<1500?EX2:null, D=DG.last&&now-DG.last.t<1500?DG.last:null;
  let ls_ok=true; try{ localStorage.setItem('_t','1'); localStorage.removeItem('_t') }catch(e){ ls_ok=false }
  $('dgSaude').innerHTML =
    dgChip(camOn,'Câmera') + dgChip(!!D, D?D.all.length+' mão(s)':'Mãos') + dgChip(FACEON&&!!F,'Rosto') + dgChip(FACEON&&EXPR&&!!X,'Expressões') + dgChip(ML.estado==='ok','Modelo de expressões'+(ML.estado==='carregando'?' (carregando…)':ML.estado==='falhou'?' (não carregou: usando medida simples'+(ML.erro?' — '+ML.erro:'')+')':ML.estado===''?' (ligue Expressões)':'')) +
    dgChip(EX_LG.ok,'Leitura da imagem (língua)') + dgChip(ls_ok,'Armazenamento') + dgChip(!!window.speechSynthesis,'Voz') +
    dgChip(!!(navigator.serviceWorker&&navigator.serviceWorker.controller),'Modo offline') +
    '<br><small style="color:var(--mut)">Quadros/s: mãos '+DG.fps+' · rosto '+DG.ffps+(EX_CAL?' · calibrando rosto neutro…':'')+'</small>';
  // mãos
  $('dgMaos').innerHTML = !D ? '<small style="color:var(--mut)">Nenhuma mão detectada.</small>' : D.all.map((lm,i)=>{
    const rows=lm.map((p,k)=>String(k).padStart(2,'0')+' '+DG_PONTO[k].padEnd(15)+' x='+p.x.toFixed(3)+'  y='+p.y.toFixed(3)+'  z='+(p.z||0).toFixed(3)).join('\n');
    return '<details'+(i===0?' open':'')+'><summary>Mão '+(i+1)+' (21 pontos; x e y de 0 a 1, z = profundidade)</summary><pre style="font-size:.78rem;overflow:auto;max-height:260px">'+rows+'</pre></details>';
  }).join('');
  // rosto
  if (!F){ $('dgRosto').innerHTML='<small style="color:var(--mut)">Rosto não detectado. Ligue "Reconhecer rosto" e "Expressões".</small>'; }
  else {
    const deg=r=>Math.round(r*180/Math.PI);
    let h='<p>Posição do rosto: centro ('+F.cx.toFixed(2)+', '+F.cy.toFixed(2)+') · largura '+F.w.toFixed(2)+' · inclinação '+deg(F.roll)+'° · giro '+F.yaw.toFixed(2)+' · cabeceio '+F.pitch.toFixed(2)+(headLabel()?' · <b>'+headLabel()+'</b>':'')+'</p>';
    if (!X) h+='<small style="color:var(--mut)">Ligue "Expressões" para medir as expressões.</small>';
    else {
      h+='<p>Reconhecido agora: <b>'+(X.nomes.join(', ')||'rosto neutro')+'</b></p>';
      h+=EX_ORDEM.map(k=>{ const p=Math.round(X.i[k]*100); return '<div class="row" style="gap:8px;align-items:center"><span style="width:190px">'+k+'</span><div class="bar" style="flex:1;min-width:80px"><i style="width:'+p+'%"></i></div><small style="width:40px;text-align:right">'+p+'%</small></div>'; }).join('');
      h+='<details><summary>Medidas do rosto</summary><pre style="font-size:.78rem">'+Object.keys(X.v).map(k=>k.padEnd(6)+X.v[k].toFixed(3)).join('\n')+'\nlíngua (área) '+X.lingua.frac.toFixed(2)+' · cor da pele a*='+X.lingua.a.toFixed(0)+'</pre></details>'+(X.ml&&ML.bs?'<details><summary>Pontuações do modelo (maiores)</summary><pre style="font-size:.78rem">'+Object.keys(ML.bs).sort((p,q)=>ML.bs[q]-ML.bs[p]).slice(0,14).map(k=>k.padEnd(20)+ML.bs[k].toFixed(2)).join('\n')+'</pre></details>':'');
    }
    $('dgRosto').innerHTML=h;
  }
  // parâmetros
  $('dgParam').innerHTML = !P.cm ? '<small style="color:var(--mut)">Sem mão na imagem.</small>' :
    '<p>Configuração: '+P.cm.dedos+' · polegar '+P.cm.pol+(P.cm.sep?' · '+P.cm.sep:'')+'<br>Locação: '+P.pa.zona+'<br>Orientação: palma '+P.or.palma+' · dedos '+P.or.dedos+'<br>Movimento: '+([P.mv.tipo,P.mv.dir,P.mv.prof,P.mv.giro].filter(Boolean).join(' · ')||'(medindo)')+'</p>';
}
setInterval(()=>{ if (dgOn()) diagRender(); }, 250);
$('dgNeutro').onclick = () => { if (!camOn||!FACEON||!EXPR){ $('dgMsg').textContent='Ligue a câmera, "Reconhecer rosto" e "Expressões" e deixe o rosto relaxado.'; return; } exprCalibrar(); $('dgMsg').textContent='Rosto neutro por 3 segundos… (boca fechada, olhar para a câmera)'; setTimeout(()=>{ $('dgMsg').textContent=(!EX_CAL&&EX_OKCAL)?'Rosto neutro calibrado.':'Poucos quadros com o rosto visível: tente de novo.'; },3300); };
$('dgNeutroRest').onclick = () => { exprRestaurar(); $('dgMsg').textContent='Calibração removida (valores padrão).'; };
