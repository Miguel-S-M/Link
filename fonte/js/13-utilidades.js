// Pose ruim, sugestão de palavras, favoritos, intérprete
// ================= Aviso de pose ruim =================
let jit=[], prevR=null, lastWarn='', lightT=0, lightMsg='';
function poseCheck(all,cl,now){
  let msg='';
  if(all.some(lm=>lm.some(q=>q.x<0.015||q.x>0.985||q.y<0.015||q.y>0.985))) msg='✋ A mão está saindo do quadro.';
  if(all.length===1){
    const c=cl[0];
    if(prevR) c.r.forEach((v,k)=>{ if(Math.abs(v-prevR[k])>0.45) jit.push(now); });
    prevR=c.r.slice(); jit=jit.filter(t=>now-t<1000);
    if(!msg&&jit.length>=3) msg='👆 Um dedo parece escondido atrás de outro. Gire um pouco a mão para a câmera ver todos os dedos.';
  } else prevR=null;
  if(now-lightT>2500){ lightT=now; const lv=lightLevel(); lightMsg=lv===null?'':lv<45?(LIGHT.on?'💡 Ainda escuro: acenda uma luz de frente para você.':'💡 Pouca luz: toque em "Ajustar luz" ou acenda uma luz.'):lv>235?'💡 Imagem estourada: reduza a luz na câmera.':''; }
  if(!msg) msg=lightMsg;
  if(msg!==lastWarn){ lastWarn=msg; document.querySelectorAll('.poseWarn').forEach(e=>e.textContent=msg); }
}

// ================= Sugestão de palavras, favoritos e histórico =================
function suggest(){
  const t=textEl.value, m=t.match(/(\S+)$/), box=$('sugg');
  if(!m){ box.innerHTML=''; return; }
  const tok=kk(m[1]); if(tok.length<2){ box.innerHTML=''; return; }
  const c=WORDS.filter(w=>w.k.startsWith(tok)&&w.k!==tok).sort((a,b)=>(!!b.custom-!!a.custom)||((a.n?1:0)-(b.n?1:0))||(a.k.length-b.k.length)).slice(0,5);
  box.innerHTML=c.map(w=>`<button data-sg="${w.k}">${w.t[0]}</button>`).join('');
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-sg]'); if(!b) return;
  const w=WORDS.find(x=>x.k===b.dataset.sg); if(!w) return;
  textEl.value=textEl.value.replace(/\S+$/,'')+w.t[0].toLowerCase()+' '; translate();
});
let FAV=ls('linkglove_fav',[]), HISTR=ls('linkglove_hist',[]);
function addHist(t){ t=(t||'').trim(); if(!t) return; HISTR=[t,...HISTR.filter(x=>x!==t)].slice(0,10); lsSet('linkglove_hist',HISTR); renderFav(); }
function renderFav(){
  const none='<small style="color:var(--mut)">Nada por aqui ainda.</small>';
  $('favList').innerHTML=FAV.length?FAV.map((t,i)=>`<span class="chip"><button data-fv="${i}" style="border:0;background:none;padding:2px 6px">${t}</button><button data-fd="${i}" aria-label="Remover" style="border:0;background:none;padding:2px 4px">✕</button></span>`).join(''):none;
  $('histList').innerHTML=HISTR.length?HISTR.map((t,i)=>`<button data-hs="${i}">${t}</button>`).join(''):none;
}
function loadPhrase(t,say){ textEl.value=t+' '; translate(); if(say) speakPhrase(vLang); }
document.addEventListener('click',e=>{
  const fv=e.target.closest('[data-fv]'), fd=e.target.closest('[data-fd]'), hs=e.target.closest('[data-hs]');
  if(fv) loadPhrase(FAV[+fv.dataset.fv],true);
  if(hs) loadPhrase(HISTR[+hs.dataset.hs],true);
  if(fd){ FAV.splice(+fd.dataset.fd,1); lsSet('linkglove_fav',FAV); renderFav(); }
});
$('btnFavAdd').onclick=()=>{ const t=$('favIn').value.trim(); if(!t) return; if(!FAV.includes(t)) FAV.push(t); $('favIn').value=''; lsSet('linkglove_fav',FAV); renderFav(); };
$('btnFavCur').onclick=()=>{ const t=phrase(0).trim(); if(!t||t==='–') return; if(!FAV.includes(t)) FAV.push(t); lsSet('linkglove_fav',FAV); renderFav(); toast('★ Frase salva nos favoritos'); };
$('btnHistClear').onclick=()=>{ HISTR=[]; lsSet('linkglove_hist',HISTR); renderFav(); };

// ================= Modo intérprete =================
$('btnInterp').onclick=()=>document.body.classList.toggle('interp');
$('ipClose').onclick=()=>document.body.classList.remove('interp');

