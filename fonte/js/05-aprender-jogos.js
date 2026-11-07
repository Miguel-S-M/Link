// Aprender com os jogos (letras, sinais e golpes)
// ===== Aprender com os jogos: o que você acerta jogando vira treino da IA (letras, sinais e golpes do boxe) =====
let LEARN = true; try{ LEARN = localStorage.getItem('linkglove_aprender')!=='0' }catch(e){}
let LASTF = null, learnTimer = null;
function learnSaveSoon(){ clearTimeout(learnTimer); learnTimer=setTimeout(()=>{ trSave(); sgSave(); },1500); }
function learnLetter(L){   // letra confirmada pelo jogo com a câmera: guarda a forma da mão se ela traz algo novo
  if (!LEARN || !LASTF || performance.now()-LASTF.t>400 || !/^[A-Z0-9]$/.test(L)) return;
  const same=SAMPLES.filter(x=>x.L===L);
  const dmin=same.length ? Math.min(...same.map(x=>fd(x.f,LASTF.f))) : 9;
  if (same.length && (dmin<0.12 || dmin>KNN_MAX)) return;       // repete o que já existe, ou foge demais do padrão
  if (same.filter(x=>x.g).length>=20) SAMPLES.splice(SAMPLES.indexOf(same.find(x=>x.g)),1);
  SAMPLES.push({L, f:LASTF.f.slice(), g:1});
  const mine=SAMPLES.filter(x=>x.L===L); if (mine.length>60) SAMPLES.splice(SAMPLES.indexOf(mine.find(x=>x.g)||mine[0]),1);
  learnSaveSoon(); learnUi();
}
function learnSign(S,q,best){   // sinal acertado no jogo: guarda o movimento se for uma variação nova do que você já gravou
  if (!LEARN || !q || best>=SIGN_MAX*0.9 || best<0.18) return;
  const mine=SIGNSAMP.filter(x=>x.S===S); if (!mine.length) return;
  if (mine.filter(x=>x.g).length>=6) SIGNSAMP.splice(SIGNSAMP.indexOf(mine.find(x=>x.g)),1);
  SIGNSAMP.push({S, v:q, g:1});
  const m2=SIGNSAMP.filter(x=>x.S===S); if (m2.length>8) SIGNSAMP.splice(SIGNSAMP.indexOf(m2.find(x=>x.g)||m2[0]),1);
  learnSaveSoon(); learnUi();
}
function learnUi(){
  const b=$('btnLearn'); if(!b) return;
  b.textContent='🧠 Aprender com os jogos: '+(LEARN?'ligado':'desligado'); b.classList.toggle('primary',LEARN);
  $('learnSt').textContent=`Aprendido nos jogos: ${SAMPLES.filter(x=>x.g).length} formas de letras · ${SIGNSAMP.filter(x=>x.g).length} gravações de sinais · ${BXP.n} golpes do boxe nesta sessão`;
}
$('btnLearn').onclick = () => { LEARN=!LEARN; try{ localStorage.setItem('linkglove_aprender',LEARN?'1':'0') }catch(e){} learnUi(); };
$('btnLearnUndo').onclick = () => {
  const l=SAMPLES.filter(x=>x.g).length, sg=SIGNSAMP.filter(x=>x.g).length;
  if (!confirm('Remover o que os jogos aprenderam ('+l+' formas de letras, '+sg+' gravações de sinais) e voltar os golpes do boxe à calibragem anterior? O que você gravou à mão não é apagado.')) return;
  for (let i=SAMPLES.length-1;i>=0;i--) if (SAMPLES[i].g) SAMPLES.splice(i,1);
  for (let i=SIGNSAMP.length-1;i>=0;i--) if (SIGNSAMP[i].g) SIGNSAMP.splice(i,1);
  Object.assign(BXC,{speed:BXBASE.speed,grow:BXBASE.grow,cx:BXBASE.cx}); BXP.lat=[]; BXP.fwd=[]; BXP.n=0;
  lsSet('linkglove_box_cal',{c:BXC,done:bxCalDone}); trSave(); sgSave(); learnUi();
};
setTimeout(learnUi,0);
