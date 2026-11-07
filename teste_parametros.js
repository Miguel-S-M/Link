// roda dentro do contexto do app (use: node teste_carga.js tradutor teste_parametros.js)
const W=640,H=480; let ok=0,bad=0;
const eq=(nome,a,b)=>{ if(a===b){ok++} else {bad++; console.log('FALHOU:',nome,'→ obtido',JSON.stringify(a),'esperado',JSON.stringify(b))} };
function mao(cx,cy,{dir='cima',palmaFrente=true,dominante='D'}={}){   // 21 pontos; dedos esticados; imagem sem espelho
  const lm=Array.from({length:21},()=>({x:cx,y:cy+0.2,z:0}));
  const lado = (dominante==='D')===palmaFrente ? 1 : -1;      // mão direita com a palma para a câmera: indicador à direita da imagem
  const u={cima:[0,-1],baixo:[0,1],esquerda:[-1,0],direita:[1,0]}[dir], n=[-u[1],u[0]];   // n = perpendicular
  const base=(i,off)=>{ const k=lado*off; return {x:cx+u[0]*0.2/ (W/H)*0.0+ (u[0]*0.2*H/W) + n[0]*0.06*k*H/W*1.0, y:cy+0.2+u[1]*0.2*0+u[1]*0.2*1 + n[1]*0.06*k*(W/W)*W/H*0.0 }; };
  const wx=cx, wy=cy+0.2, L=0.2;
  const P=(f,off)=>({x:wx+(u[0]*f*L*H/W)+(n[0]*off*H/W), y:wy+(u[1]*f*L)+(n[1]*off), z:0});
  lm[0]={x:wx,y:wy,z:0};
  [[5,0.9,0.06],[9,1.0,0.02],[13,0.95,-0.02],[17,0.85,-0.06]].forEach(([i,f,o])=>lm[i]=P(f,o*lado));
  [[8,5,2.2],[12,9,2.2],[16,13,2.2],[20,17,2.2]].forEach(([t,b,m])=>{ lm[t]={x:wx+(lm[b].x-wx)*m, y:wy+(lm[b].y-wy)*m, z:0}; });
  lm[4]={x:lm[17].x,y:lm[17].y,z:0}; lm[2]={x:lm[17].x,y:lm[17].y,z:0}; lm[6]=lm[5]; lm[7]=lm[5];
  return lm;
}
// orientação
let m=mao(0.5,0.5); let o=pmOR(m,W,H,'D'); eq('palma frente D',o.palma,'para frente'); eq('dedos cima',o.dedos,'cima');
m=mao(0.5,0.5,{palmaFrente:false}); eq('palma trás D',pmOR(m,W,H,'D').palma,'para trás');
m=mao(0.5,0.5,{dominante:'E'}); eq('palma frente E',pmOR(m,W,H,'E').palma,'para frente');
m=mao(0.5,0.5,{dir:'baixo'}); eq('dedos baixo',pmOR(m,W,H,'D').dedos,'baixo');
m=mao(0.5,0.5,{dir:'direita'}); eq('dedos p/ imagem-direita = esquerda de quem sinaliza',pmOR(m,W,H,'D').dedos,'esquerda');
// configuração
m=mao(0.5,0.5); const c=classify(m,W,H); eq('mão aberta: dedos',pmCM(c).dedos,'EEEE');
// locação
FACE={t:performance.now(),cx:0.5,cy:0.3,w:0.15,h:0.2,eyeY:0.27,noseY:0.32,mouthY:0.38,roll:0,yaw:0,pitch:0};
const pa=(y,x=0.5)=>{ const q=mao(x,0); q.forEach(p=>{}); const l=q.map(p=>p); l[9]={x,y,z:0}; return pmPA(l,[l],0).zona; };
eq('testa',pa(0.2),'na testa'); eq('boca',pa(0.38),'na boca'); eq('queixo',pa(0.43),'no queixo');
eq('peito',pa(0.65),'no peito'); eq('espaço neutro lateral',pa(0.65,0.95),'espaço neutro (lado)');
// movimento
const mov=(f)=>{ PM_TRAJ=[]; let r; for(let i=0;i<30;i++){ const p=f(i/29); const q=mao(0.5,0.5); const dx=p[0]-0.5, dy=p[1]-0.5; const l=q.map(a=>({x:a.x+dx,y:a.y+dy,z:0})); r=pmMV(l,W,H,i*30); } return r; };
let r=mov(t=>[0.5-0.3*t,0.5]); eq('reto p/ direita (de quem sinaliza)',r.tipo+'|'+r.dir,'reto|direita');
r=mov(t=>[0.5+0.3*t,0.5]); eq('reto p/ esquerda',r.tipo+'|'+r.dir,'reto|esquerda');
r=mov(t=>[0.5,0.5-0.25*t]); eq('reto p/ cima',r.tipo+'|'+r.dir,'reto|cima');
r=mov(t=>[0.5,0.5]); eq('parado',r.tipo,'parado');
r=mov(t=>[0.5+0.09*Math.sin(t*2*Math.PI*3),0.5]); eq('vai-e-vem',r.tipo,'vai-e-vem');
r=mov(t=>[0.5+0.12*Math.cos(t*2*Math.PI),0.5+0.12*Math.sin(t*2*Math.PI)]); eq('circular',r.tipo,'circular');
// gravar e buscar
camOn=true; LEXICO=[]; PM_DOM='D';
const quadro=(i,x,y)=>{ const l=mao(x,y); const cl=[classify(l,W,H)]; paramsStep([l],cl,i*33,W,H); };
PM_REC={n:'TESTE',fim:2500,s:[]}; PM_TRAJ=[];
for(let i=0;i<90;i++) quadro(i,0.5-0.003*i,0.5);
eq('sinal guardado',LEXICO.length,1);
for(let i=100;i<130;i++) quadro(i,0.5-0.003*(i-100),0.5);
const bus=pmBuscar(); eq('busca acha o sinal',bus.length&&bus[0].n,'TESTE'); console.log('similaridade', bus.length&&bus[0].p.toFixed(2));
