// Suavização dos pontos da mão
// ===== Suavização dos pontos da mão: reduz o tremor e a distorção quando um dedo passa atrás de outro =====
const SM = [];
const CHAINS = [[0,1,2,3,4],[0,5,6,7,8],[0,9,10,11,12],[0,13,14,15,16],[0,17,18,19,20]];
function smoothHands(raw, now, W, H){
  if (SM.length!==raw.length){ SM.length=0; raw.forEach(()=>SM.push(null)); }
  return raw.map((lm,s)=>{
    let st = SM[s];
    if (!st || Math.hypot(lm[0].x-st.wx, lm[0].y-st.wy)>0.3) st = SM[s] = {f:lm.map(q=>({x:q.x,y:q.y,z:q.z,dx:0,dy:0,dz:0})), t:now, n:0, bl:{}, wx:lm[0].x, wy:lm[0].y};
    const dt = Math.max(0.005,(now-st.t)/1000); st.t = now; st.n++;
    const sz0 = Math.hypot((lm[9].x-lm[0].x)*W,(lm[9].y-lm[0].y)*H) || 1;
    const out = lm.map((q,i)=>{
      const f=st.f[i], r={};
      // ponto que "pula" em relação ao pulso de um quadro para o outro = dedo escondido errando: quase ignora
      const outl = i>0 && Math.hypot(((q.x-lm[0].x)-(f.x-st.f[0].x))*W, ((q.y-lm[0].y)-(f.y-st.f[0].y))*H) > 0.3*sz0;
      for (const k of ['x','y','z']){
        const d = (q[k]-f[k])/dt;
        f['d'+k] += (1/(1+(1/(2*Math.PI))/dt))*(d-f['d'+k]);
        const fc = 1.2+10*Math.abs(f['d'+k]);
        f[k] += Math.min(outl?0.12:1, 1/(1+(1/(2*Math.PI*fc))/dt))*(q[k]-f[k]);
        r[k] = f[k];
      }
      return r;
    });
    // comprimento dos ossos: um dedo meio escondido não pode esticar nem encolher de repente
    const size = Math.hypot((out[9].x-out[0].x)*W,(out[9].y-out[0].y)*H) || 1;
    CHAINS.forEach(ch=>{
      for (let j=1;j<ch.length;j++){
        const a=ch[j-1], b=ch[j], key=a+'-'+b;
        const dx=(out[b].x-out[a].x)*W, dy=(out[b].y-out[a].y)*H, len=Math.hypot(dx,dy), rl=len/size, ref=st.bl[key];
        if (ref===undefined){ st.bl[key]=rl; continue; }
        if (st.n<20 || (rl>0.75*ref && rl<1.25*ref)) st.bl[key] = ref*0.95+rl*0.05;
        if (st.n>=20 && len>0){
          const L2 = Math.min(1.25*ref*size, Math.max(0.45*ref*size, len));
          if (L2!==len){ const k=L2/len, mx=(dx*k-dx)/W, my=(dy*k-dy)/H; for (let m=j;m<ch.length;m++){ out[ch[m]].x+=mx; out[ch[m]].y+=my; } }
        }
      }
    });
    st.wx=out[0].x; st.wy=out[0].y;
    return out;
  });
}

