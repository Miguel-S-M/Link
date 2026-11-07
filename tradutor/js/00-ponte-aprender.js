// Ponte: o Tradutor não carrega os minigames/trilha, mas o motor de câmera e as abas ainda os chamam.
// Aqui ficam versões vazias dessas peças (e as funções genéricas que moravam nos módulos dos jogos).
const ls=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(pk(k))||'null'); return v===null?d:v }catch(e){ return d } };
const lsSet=(k,v)=>{ try{ localStorage.setItem(pk(k),JSON.stringify(v)) }catch(e){} };
const tx=(c,t,x,y,s,col,al='center')=>{ c.font='bold '+s+'px sans-serif'; c.fillStyle=col; c.textAlign=al; c.fillText(t,x,y); };
function linkSay(expr,msg){ if(ART[expr]&&$('lkImg')) $('lkImg').src=ART[expr]; if($('lkSay')) $('lkSay').textContent=msg; }
function toast(m){ const t=$('toast'); t.textContent=m; t.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>t.style.display='none',3200); }
let STATS={}, PRG={acc:0}, LASTF=null;
const hit=()=>{}, award=()=>{}, recordResult=()=>{}, pickWeighted=(pool)=>pool[0];
function learnLetter(){} function learnSign(){} function stopGames(){} function lsClose(){}
function adapt(){} function enhance(){} async function hwLight(){ return false }
function boxInput(){} function rapTick(){} function rtTick(){} function lessonTick(){} function cmpTick(){} function cmpStart(){} function cmpStop(){}
const LIGHT={on:false}, box={on:false}, rap={on:false}, rt={on:false}, tut={on:false}, les={on:false,cam:false},
      mp={mode:'',live:false,conn:null,host:false};
