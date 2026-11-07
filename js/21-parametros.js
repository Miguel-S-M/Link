// Os 5 parâmetros da Libras, medidos a cada quadro: configuração da mão (CM), locação/ponto de articulação (PA),
// orientação (OR), movimento (MV) e expressões não manuais (ENM: rosto e cabeça; o corpo ainda não é medido).
// São medidas aproximadas para COMPARAR sinais gravados, não uma definição linguística: confira os nomes com quem sabe Libras.
// Referência da câmera: imagem SEM espelho (a mão direita de quem sinaliza aparece à esquerda da imagem).
const PM_JAN = 900;   // janela do movimento (ms)
let PM_DOM = 'D'; try{ PM_DOM = localStorage.getItem('linkglove_dom')||'D' }catch(e){}   // mão dominante: D ou E
const PARAMS = {t:0, n:0, cm:null, pa:null, or:null, mv:null, enm:null};
let PM_TRAJ = [], PM_REC = null, PM_UI = 0, PM_B = {p:0, y:0, k:0};
let LEXICO = ls('lexico_params', []);
const PM_PESO = {cm:.30, pa:.25, or:.15, mv:.20, enm:.10};

// 1) configuração da mão: estado dos 4 dedos (E esticado, H meio, C dobrado) + posição do polegar
function pmCM(c){
  const pol = c.thumb>THUMB_OUT ? 'aberto' : c.cg<0.3 ? 'toca o indicador' : c.thI<0.35 ? 'sobre o indicador' : 'junto';
  const sep = c.st[0]==='E'&&c.st[1]==='E' ? (c.gap>V_GAP ? 'separados' : 'juntos') : '';
  return {dedos:c.st.join(''), pol, sep, ref:c.rule||''};
}

// 2) orientação: para onde está a palma (frente, trás, cima, baixo, lados) e para onde apontam os dedos, do ponto de vista de quem sinaliza.
// Usa a profundidade (z) dos pontos da mão: é aproximada, confira na aba Diagnóstico.
function pmOR(lm, w, h, lado){
  const P=i=>[lm[i].x*w, lm[i].y*h, (lm[i].z||0)*w], o=P(0), p5=P(5), p9=P(9), p17=P(17);
  const a=[p5[0]-o[0],p5[1]-o[1],p5[2]-o[2]], b=[p17[0]-o[0],p17[1]-o[1],p17[2]-o[2]];
  let N=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];   // x: direita da imagem, y: baixo, z: longe da câmera
  if (lado==='E') N=N.map(v=>-v);                                          // mão direita com a palma para a câmera => N aponta para a câmera (z<0)
  const nn=Math.hypot(N[0],N[1],N[2])||1; N=N.map(v=>v/nn);
  const k=[Math.abs(N[0]),Math.abs(N[1]),Math.abs(N[2])].reduce((m,v,q,A)=>v>A[m]?q:m,0);
  const palma = k===1 ? (N[1]<0?'para cima':'para baixo') : k===2 ? (N[2]<0?'para frente':'para trás') : (N[0]>0?'para a esquerda':'para a direita');
  const v=[p9[0]-o[0],p9[1]-o[1],p9[2]-o[2]], vn=Math.hypot(v[0],v[1],v[2])||1, ang=Math.atan2(-v[1],v[0])*180/Math.PI;   // 0° = direita da imagem, 90° = cima
  const larg=Math.hypot(a[0]-b[0],a[1]-b[1])||1, enc=Math.abs(v[2])/vn>0.6 || Math.hypot(v[0],v[1])/larg<0.5;
  const dedos = enc ? (v[2]>0?'para trás':'para frente') : ang>45&&ang<=135 ? 'cima' : ang>-135&&ang<=-45 ? 'baixo' : Math.abs(ang)<=45 ? 'esquerda' : 'direita';
  return {palma, dedos, n:N.map(x=>+x.toFixed(2))};
}

// 3) locação: onde a mão está em relação ao rosto/corpo (precisa de "Reconhecer rosto"; corpo estimado pelo tamanho do rosto)
function pmPA(lm, all, i){
  const p=lm[9], sz=Math.hypot(lm[0].x-lm[9].x, lm[0].y-lm[9].y)||0.1;
  if (all.length>1){ const o=all[1-i][9]; if (Math.hypot(p.x-o.x,p.y-o.y)<1.3*sz) return {zona:'na outra mão', ref:true}; }
  const F=faceFresh(); if (!F) return {zona:'sem referência (ligue "Reconhecer rosto")', ref:false};
  let z=faceZone(p.x,p.y);
  const dy=(p.y-(F.cy+F.h*0.7))/F.h, dx=Math.abs(p.x-F.cx)/F.w;   // abaixo do queixo, em "alturas de rosto"
  if (z==='abaixo do rosto' || (z==='longe do rosto' && dy>0))
    z = dx>2.4 ? 'espaço neutro (lado)' : dy<0.6 ? 'no pescoço' : dy<2.2 ? 'no peito' : dy<3.8 ? 'na barriga' : 'abaixo da barriga';
  else if (z==='longe do rosto') z='espaço neutro';
  return {zona:z, ref:true};
}

// 4) movimento: trajetória da palma nos últimos ~0,9 s (em "tamanhos de mão")
const PM_DIR = ['esquerda','cima-esquerda','cima','cima-direita','direita','baixo-direita','baixo','baixo-esquerda'];   // de quem sinaliza
function pmMV(lm, w, h, now){
  const px=lm[9].x*w, py=lm[9].y*h, s=Math.hypot(px-lm[0].x*w, py-lm[0].y*h)||1, pw=Math.hypot((lm[5].x-lm[17].x)*w,(lm[5].y-lm[17].y)*h)||1;
  PM_TRAJ.push({t:now, x:px, y:py, s:Math.sqrt(s*pw), a:Math.atan2(py-lm[0].y*h, px-lm[0].x*w)});
  while (PM_TRAJ.length && now-PM_TRAJ[0].t>PM_JAN) PM_TRAJ.shift();
  const T=PM_TRAJ; if (T.length<5) return {tipo:'', dir:'', prof:'', giro:''};
  const ms=T.reduce((a,q)=>a+q.s,0)/T.length, A=T[0], B=T[T.length-1];
  let path=0; for (let i=1;i<T.length;i++) path+=Math.hypot(T[i].x-T[i-1].x, T[i].y-T[i-1].y); path/=ms;
  const dx=(B.x-A.x)/ms, dy=(B.y-A.y)/ms, net=Math.hypot(dx,dy);
  const xs=T.map(q=>q.x/ms), ys=T.map(q=>q.y/ms), rx=Math.max(...xs)-Math.min(...xs), ry=Math.max(...ys)-Math.min(...ys);
  const eixo = rx>=ry ? xs : ys, amp = Math.max(rx,ry);
  let rev=0, dirv=0, ult=eixo[0]; for (const v of eixo){ if (Math.abs(v-ult)>0.12){ const d=Math.sign(v-ult); if (dirv && d!==dirv) rev++; dirv=d; ult=v; } }
  const cx=xs.reduce((a,v)=>a+v,0)/xs.length, cy=ys.reduce((a,v)=>a+v,0)/ys.length;
  let sweep=0; for (let i=1;i<T.length;i++){ let d=Math.atan2(ys[i]-cy,xs[i]-cx)-Math.atan2(ys[i-1]-cy,xs[i-1]-cx); while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; sweep+=d; }
  let tipo = path<0.4 ? 'parado' : Math.abs(sweep)>4.5 ? 'circular' : rev>=2 ? (amp<0.35 ? 'tremido (curto)' : 'vai-e-vem') : net/path>0.75 ? 'reto' : 'curvo';
  let dir=''; if (tipo==='reto'||tipo==='curvo'){ const ang=Math.atan2(-dy,dx)*180/Math.PI; dir=PM_DIR[((Math.round(ang/45)%8)+8)%8]; }
  if (tipo==='circular') dir = sweep>0 ? 'anti-horário' : 'horário';   // como se vê na tela espelhada
  const r=B.s/A.s, prof = r>1.15 ? 'para a câmera' : r<0.87 ? 'para o corpo' : '';
  let da=(B.a-A.a)*180/Math.PI; while(da>180) da-=360; while(da<-180) da+=360;
  return {tipo, dir, prof, giro:Math.abs(da)>60?'giro do pulso':'', amp:+amp.toFixed(2)};
}

// 5) expressões não manuais: rosto (precisa de "Reconhecer rosto" + "Expressões") e cabeça. Corpo/ombros: ainda não medidos.
function pmENM(){
  const F=faceFresh(); if (!F) return {rosto:false};
  if (!headLabel()){ PM_B.k++; const a=Math.min(0.05,1/PM_B.k); PM_B.p+=(F.pitch-PM_B.p)*a; PM_B.y+=(F.yaw-PM_B.y)*a; }   // posição "neutra" da cabeça
  const dp=F.pitch-PM_B.p, dyw=F.yaw-PM_B.y;
  const cab = headLabel() || (dp>0.15 ? 'cabeça para baixo' : dp<-0.15 ? 'cabeça para cima' : Math.abs(dyw)>0.3 ? 'cabeça virada' : '');
  const incl = Math.abs(F.roll)>0.2 ? (F.roll>0 ? 'inclinada p/ esquerda' : 'inclinada p/ direita') : '';
  const X = (typeof EX2!=='undefined' && EX2 && performance.now()-EX2.t<1500) ? EX2 : null;   // expressões completas (22-expressoes.js)
  return {rosto:true, exp:X ? X.nomes.join(', ') : (EXPR&&F.ex)?exprLabel(F.ex):'', cabeca:cab, incl,
          ex:X ? EX_ORDEM.map(k=>+X.i[k].toFixed(2)) : (EXPR&&F.ex)?Array.from(F.ex):null, corpo:null};
}

// chamado pelo motor de câmera a cada quadro (08-sinais-camera.js)
function paramsStep(all, cl, now, w, h){
  diagFrame(all, w, h, now);
  if (!all.length){ PM_TRAJ=[]; Object.assign(PARAMS,{t:now,n:0,cm:null,pa:null,or:null,mv:null,enm:pmENM()}); }
  else {
    const i = all.length>1 ? (PM_DOM==='D' ? 0 : all.length-1) : 0;   // a mão direita de quem sinaliza fica à esquerda da imagem
    Object.assign(PARAMS,{t:now,n:all.length,cm:pmCM(cl[i]),pa:pmPA(all[i],all,i),or:pmOR(all[i],w,h,PM_DOM),mv:pmMV(all[i],w,h,now),enm:pmENM()});
  }
  if (PM_REC) pmRecStep(now);
  if (now-PM_UI>200){ PM_UI=now; pmRender(); }
}

// ---- léxico: cada sinal guardado como combinação dos 5 parâmetros ----
const pmModa = a => { const c={}; a.forEach(x=>c[x]=(c[x]||0)+1); return Object.keys(c).sort((p,q)=>c[q]-c[p])[0]||''; };
function pmRecStep(now){
  if (PARAMS.cm) PM_REC.s.push(JSON.parse(JSON.stringify(PARAMS)));
  if (now<PM_REC.fim) { $('pmMsg').textContent='Gravando "'+PM_REC.n+'"… faça o sinal inteiro'; return; }
  const S=PM_REC.s, n=PM_REC.n; PM_REC=null;
  if (S.length<8){ $('pmMsg').textContent='Poucos quadros com a mão visível. Tente de novo.'; return; }
  const mov=S.filter(q=>q.mv&&q.mv.tipo&&q.mv.tipo!=='parado'), M=mov.length?mov:S, g=(a,f)=>pmModa(a.map(f));
  const e={n, cm:{dedos:g(S,q=>q.cm.dedos), pol:g(S,q=>q.cm.pol), sep:g(S,q=>q.cm.sep)}, pa:g(S,q=>q.pa.zona),
           or:{palma:g(S,q=>q.or.palma), dedos:g(S,q=>q.or.dedos)},
           mv:{tipo:g(M,q=>q.mv.tipo), dir:g(M,q=>q.mv.dir), prof:g(M,q=>q.mv.prof), giro:g(M,q=>q.mv.giro)},
           enm:{exp:g(S,q=>q.enm.exp||''), cabeca:g(S,q=>q.enm.cabeca||''), incl:g(S,q=>q.enm.incl||'')}};
  LEXICO = LEXICO.filter(x=>x.n!==n).concat(e); lsSet('lexico_params', LEXICO);
  $('pmMsg').textContent='Sinal "'+n+'" guardado ('+LEXICO.length+' no léxico).'; pmRender();
}
function pmSim(e, P){
  let s=0, tw=0;
  if (P.cm){ let m=0; for (let i=0;i<4;i++){ const a=e.cm.dedos[i], b=P.cm.dedos[i]; m += a===b ? 1 : (a==='H'||b==='H') ? 0.5 : 0; }
             s+=PM_PESO.cm*((m/4)*0.75+(e.cm.pol===P.cm.pol?0.25:0)); tw+=PM_PESO.cm; }
  if (P.pa&&P.pa.ref){ s+=PM_PESO.pa*(e.pa===P.pa.zona?1:0); tw+=PM_PESO.pa; }
  if (P.or){ s+=PM_PESO.or*((e.or.palma===P.or.palma?0.5:0)+(e.or.dedos===P.or.dedos?0.5:0)); tw+=PM_PESO.or; }
  if (P.mv&&P.mv.tipo){ s+=PM_PESO.mv*((e.mv.tipo===P.mv.tipo?0.6:0)+(e.mv.dir===P.mv.dir?0.4:0)); tw+=PM_PESO.mv; }
  if (P.enm&&P.enm.rosto&&(e.enm.exp||e.enm.cabeca||e.enm.incl)){ const k=[e.enm.exp===(P.enm.exp||''),e.enm.cabeca===(P.enm.cabeca||''),e.enm.incl===(P.enm.incl||'')];
             s+=PM_PESO.enm*(k.filter(Boolean).length/3); tw+=PM_PESO.enm; }
  return tw ? s/tw : 0;
}
function pmBuscar(P=PARAMS){ return LEXICO.map(e=>({n:e.n, p:pmSim(e,P)})).filter(x=>x.p>=0.5).sort((a,b)=>b.p-a.p).slice(0,3); }

// ---- painel ----
function pmRender(){
  const P=PARAMS, set=(id,t)=>{ const el=$(id); if (el!==NULO) el.textContent=t||'–'; };
  if (!P.cm){ ['pmCM','pmPA','pmOR','pmMV'].forEach(id=>set(id,'–')); }
  else {
    set('pmCM', 'dedos I/M/A/m: '+P.cm.dedos+' · polegar '+P.cm.pol+(P.cm.sep?' · '+P.cm.sep:'')+(P.cm.ref?' · parece '+P.cm.ref:''));
    set('pmPA', P.pa.zona);
    set('pmOR', 'palma '+P.or.palma+' · dedos '+P.or.dedos);
    set('pmMV', [P.mv.tipo||'(medindo)', P.mv.dir, P.mv.prof, P.mv.giro].filter(Boolean).join(' · '));
  }
  const E=P.enm; set('pmENM', !E||!E.rosto ? 'ligue "Reconhecer rosto" e "Expressões" (⚙ Avançado)' : [E.exp, E.cabeca, E.incl].filter(Boolean).join(' · ')||'rosto neutro (corpo: não medido)');
  const c=pmBuscar(); const el=$('pmCand'); if (el!==NULO) el.innerHTML = LEXICO.length ? (c.length ? c.map(x=>'<span class="chip ok">'+x.n+' '+Math.round(x.p*100)+'%</span>').join(' ') : '<small style="color:var(--mut)">nenhum sinal do léxico parecido agora</small>') : '<small style="color:var(--mut)">léxico vazio: grave um sinal abaixo</small>';
  set('pmLex', LEXICO.length+' sinais no léxico');
}
$('pmDom').value = PM_DOM;
$('pmDom').onchange = e => { PM_DOM=e.target.value; try{ localStorage.setItem('linkglove_dom',PM_DOM) }catch(err){} };
$('pmGravar').onclick = () => {
  const n=$('pmNome').value.trim(); if (!n){ $('pmMsg').textContent='Escreva o nome do sinal.'; return; }
  if (!camOn){ $('pmMsg').textContent='Ligue a câmera primeiro.'; return; }
  PM_TRAJ=[]; PM_REC={n, fim:performance.now()+2500, s:[]};
};
$('pmExp').onclick = () => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify({versao:1,mao_dominante:PM_DOM,sinais:LEXICO},null,1)],{type:'application/json'})); a.download='lexico-parametros.json'; a.click(); };
$('pmLimpar').onclick = () => { if (confirm('Apagar todos os sinais do léxico?')){ LEXICO=[]; lsSet('lexico_params',LEXICO); pmRender(); } };
pmRender();
