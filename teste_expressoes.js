// continua o teste_parametros.js: palma cima/baixo, expressões do rosto, língua, calibração e aba Diagnóstico
const giraX=(lm,g)=>{ const t=g*Math.PI/180,c=Math.cos(t),s=Math.sin(t),o=lm[0]; return lm.map(p=>{ const X=(p.x-o.x)*W,Y=(p.y-o.y)*H,Z=(p.z||0)*W; return {x:o.x+X/W,y:o.y+(Y*c-Z*s)/H,z:(Y*s+Z*c)/W}; }); };
const giraY=(lm,g)=>{ const t=g*Math.PI/180,c=Math.cos(t),s=Math.sin(t),o=lm[0]; return lm.map(p=>{ const X=(p.x-o.x)*W,Y=(p.y-o.y)*H,Z=(p.z||0)*W; return {x:o.x+(X*c+Z*s)/W,y:o.y+Y/H,z:(-X*s+Z*c)/W}; }); };
const OR=(lm,l='D')=>{ const q=pmOR(lm,W,H,l); return q.palma+'|'+q.dedos; };
eq('palma para baixo, dedos à frente', OR(giraX(mao(0.5,0.5),90)), 'para baixo|para frente');
eq('palma para cima, dedos para trás', OR(giraX(mao(0.5,0.5),-90)), 'para cima|para trás');
eq('palma para a direita (de quem sinaliza)', pmOR(giraY(mao(0.5,0.5),90),W,H,'D').palma, 'para a direita');
eq('palma para a esquerda', pmOR(giraY(mao(0.5,0.5),-90),W,H,'D').palma, 'para a esquerda');
eq('mão esquerda: palma para baixo', pmOR(giraX(mao(0.5,0.5,{dominante:'E'}),90),W,H,'E').palma, 'para baixo');
eq('palma para frente continua', OR(mao(0.5,0.5)), 'para frente|cima');
// rosto sintético (px de 640x480)
function cara(mod){
  const p={}, S=(i,x,y)=>p[i]={x,y};
  S(10,320,120);S(152,320,360);S(234,220,240);S(454,420,240);S(33,265,215);S(133,305,215);S(159,285,209);S(145,285,221);
  S(263,375,215);S(362,335,215);S(386,355,209);S(374,355,221);S(105,285,193.4);S(334,355,193.4);S(107,305,196);S(336,335,196);
  S(61,282,299.5);S(291,358,299.5);S(13,320,298.5);S(14,320,300.5);S(0,320,294);S(17,320,306);S(2,320,280);S(1,320,270);S(205,270,285);S(425,370,285);
  if(mod) mod(p); const l=[]; for(const i in p) l[i]={x:p[i].x/W,y:p[i].y/H}; return l;
}
const nomes=(mod)=>{ const l=cara(mod), v=exprMedidas(l,W,H), i=exprIntens(v,EX_BASE0,{v:0}); return EX_ORDEM.filter(k=>i[k]>=0.5).join(','); };
eq('rosto neutro: nada ativo', nomes(), '');
eq('sorriso', nomes(p=>{p[61].y-=6;p[291].y-=6}), 'sorriso');
eq('cantos para baixo', nomes(p=>{p[61].y+=6;p[291].y+=6}), 'cantos para baixo');
eq('boca aberta', nomes(p=>{p[14].y+=19;p[17].y+=19}), 'boca aberta');
eq('sobrancelhas erguidas', nomes(p=>{p[105].y-=8;p[334].y-=8;p[107].y-=8;p[336].y-=8}), 'sobrancelhas erguidas');
eq('sobrancelhas franzidas', nomes(p=>{p[105].y+=5;p[334].y+=5;p[107].x+=8;p[336].x-=8}), 'sobrancelhas franzidas');
eq('olhos fechados', nomes(p=>{p[159].y=215;p[145].y=215;p[386].y=215;p[374].y=215}), 'olhos fechados');
eq('olhos arregalados', nomes(p=>{p[159].y-=5;p[386].y-=5;p[145].y+=5;p[374].y+=5}), 'olhos arregalados');
eq('piscada de um olho', nomes(p=>{p[159].y=215;p[145].y=215}), 'piscada de um olho');
eq('boca em O', nomes(p=>{p[61].x=300;p[291].x=340;p[14].y+=20}), 'boca aberta,boca em O');
eq('bico (lábios à frente)', nomes(p=>{p[61].x=300;p[291].x=340}), 'bico');
eq('sobrancelha assimétrica', nomes(p=>{p[105].y-=8}), 'sobrancelha assimétrica');
// língua: classificador de cor
const ref={rr:0.41,gg:0.315};
eq('pele não é língua', exprPixel(224,172,150,ref), false); eq('língua rosada é língua', exprPixel(200,90,100,ref), true); eq('região escura não conta', exprPixel(60,20,20,ref), false);
// calibração do rosto neutro
const l0=cara(p=>{p[105].y-=4;p[334].y-=4});   // este rosto tem sobrancelhas naturalmente mais altas
EX_BASE=Object.assign({},EX_BASE0); exprCalibrar(); for(let i=0;i<10;i++) exprStep(l0,W,H); EX_CAL.fim=0; exprStep(l0,W,H); exprStep(l0,W,H);
eq('calibração concluída', EX_OKCAL, true);
eq('rosto calibrado: sobrancelha alta vira neutra', EX_ORDEM.filter(k=>EX2.i[k]>=0.5).join(','), '');
EX_BASE=Object.assign({},EX_BASE0);
// Diagnóstico: desenha e renderiza sem erro
let errDg=''; try{ curTab='diag'; FACEON=true; EXPR=true; FACE=Object.assign({},FACE,{t:performance.now()}); exprStep(cara(),W,H); const m1=mao(0.5,0.5); diagFrame([m1],W,H,performance.now()); diagRender(); diagDraw(cx,W,H,[m1]); }catch(e){ errDg=e.message; }
eq('aba Diagnóstico renderiza', errDg, '');
// o 21 ainda funciona com as expressões novas
eq('ENM usa as expressões novas', Array.isArray(pmENM().ex), true);
console.log('RESULTADO: '+ok+' ok, '+bad+' falharam');
