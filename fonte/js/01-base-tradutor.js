// Configuração, Bluetooth da luva, idiomas, palavras e tradutor
const DEVICE_NAME = 'LinkGlove-LIBRAS';
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
// Cole aqui o ID da playlist (parte depois de "list=") para já abrir carregada:
const PLAYLIST_ID = '';
const IDLE_MS = 2200; // pausa (sem letras novas) antes de falar a frase sozinho

const LANGS = [['🇧🇷','Português','pt-BR'],['🇪🇸','Espanhol','es-ES'],['🇮🇹','Italiano','it-IT'],['🇩🇪','Alemão','de-DE'],['🇬🇧','Inglês','en-US']];
// Nome das letras: PT | ES | IT | DE | EN
const LN = ('á,a,a,ah,ay|bê,be,bi,beh,bee|cê,ce,ci,tseh,see|dê,de,di,deh,dee|é,e,e,eh,ee|éfe,efe,effe,eff,eff|gê,ge,gi,geh,jee|agá,hache,acca,hah,aych|i,i,i,ih,eye|jota,jota,i lunga,jott,jay|cá,ka,cappa,kah,kay|éle,ele,elle,ell,el|ême,eme,emme,emm,em|êne,ene,enne,enn,en|ó,o,o,oh,oh|pê,pe,pi,peh,pee|quê,cu,cu,kuh,cue|érre,erre,erre,err,ar|ésse,ese,esse,ess,ess|tê,te,ti,teh,tee|u,u,u,uh,you|vê,uve,vu,fau,vee|dáblio,uve doble,doppia vu,weh,double-u|xis,equis,ics,iks,ex|ípsilon,i griega,ipsilon,üpsilon,why|zê,zeta,zeta,tset,zee').split('|').map(s=>s.split(','));

// Dicionário: PT|ES|IT|DE|EN  (uma entrada por linha; frases também valem)
const WORDS = `oi|hola|ciao|hallo|hi
olá|hola|ciao|hallo|hello
bom dia|buenos días|buongiorno|guten Morgen|good morning
boa tarde|buenas tardes|buon pomeriggio|guten Tag|good afternoon
boa noite|buenas noches|buonanotte|gute Nacht|good night
bom|bueno|buono|gut|good
boa|buena|buona|gut|good
dia|día|giorno|Tag|day
tarde|tarde|pomeriggio|Nachmittag|afternoon
noite|noche|notte|Nacht|night
sim|sí|sì|ja|yes
não|no|no|nein|no
obrigado|gracias|grazie|danke|thank you
obrigada|gracias|grazie|danke|thank you
por favor|por favor|per favore|bitte|please
desculpa|perdón|scusa|Entschuldigung|sorry
tchau|adiós|ciao|tschüss|bye
tudo bem|todo bien|tutto bene|alles gut|all good
bem|bien|bene|gut|well
mal|mal|male|schlecht|bad
muito|mucho|molto|sehr|very
eu|yo|io|ich|I
você|tú|tu|du|you
ele|él|lui|er|he
ela|ella|lei|sie|she
nós|nosotros|noi|wir|we
nome|nombre|nome|Name|name
meu|mi|mio|mein|my
qual|cuál|quale|welche|which
como|cómo|come|wie|how
onde|dónde|dove|wo|where
quando|cuándo|quando|wann|when
quem|quién|chi|wer|who
quero|quiero|voglio|ich will|I want
preciso|necesito|ho bisogno|ich brauche|I need
gosto|me gusta|mi piace|ich mag|I like
amo|amo|amo|ich liebe|I love
sou|soy|sono|ich bin|I am
estou|estoy|sto|ich bin|I am
tenho|tengo|ho|ich habe|I have
vou|voy|vado|ich gehe|I go
posso|puedo|posso|ich kann|I can
ajuda|ayuda|aiuto|Hilfe|help
água|agua|acqua|Wasser|water
comer|comer|mangiare|essen|eat
beber|beber|bere|trinken|drink
comida|comida|cibo|Essen|food
casa|casa|casa|Haus|house
escola|escuela|scuola|Schule|school
trabalho|trabajo|lavoro|Arbeit|work
hoje|hoy|oggi|heute|today
amanhã|mañana|domani|morgen|tomorrow
ontem|ayer|ieri|gestern|yesterday
agora|ahora|adesso|jetzt|now
aqui|aquí|qui|hier|here
mãe|madre|mamma|Mutter|mother
pai|padre|papà|Vater|father
filho|hijo|figlio|Sohn|son
filha|hija|figlia|Tochter|daughter
irmão|hermano|fratello|Bruder|brother
irmã|hermana|sorella|Schwester|sister
amigo|amigo|amico|Freund|friend
amiga|amiga|amica|Freundin|friend
família|familia|famiglia|Familie|family
amor|amor|amore|Liebe|love
paz|paz|pace|Frieden|peace
feliz|feliz|felice|glücklich|happy
triste|triste|triste|traurig|sad
surdo|sordo|sordo|gehörlos|deaf
ouvinte|oyente|udente|hörend|hearing
libras|libras|libras|Libras|Libras
aprender|aprender|imparare|lernen|learn
falar|hablar|parlare|sprechen|speak
entender|entender|capire|verstehen|understand
ler|leer|leggere|lesen|read
escrever|escribir|scrivere|schreiben|write
banheiro|baño|bagno|Toilette|bathroom
hospital|hospital|ospedale|Krankenhaus|hospital
médico|médico|medico|Arzt|doctor
remédio|medicina|medicina|Medikament|medicine
dor|dolor|dolore|Schmerz|pain
fome|hambre|fame|Hunger|hunger
sede|sed|sete|Durst|thirst
frio|frío|freddo|kalt|cold
calor|calor|caldo|heiß|hot
dinheiro|dinero|soldi|Geld|money
telefone|teléfono|telefono|Telefon|phone
carro|coche|auto|Auto|car
ônibus|autobús|autobus|Bus|bus
rua|calle|strada|Straße|street
cidade|ciudad|città|Stadt|city
luva|guante|guanto|Handschuh|glove
com|con|con|mit|with
para|para|per|für|for
de|de|di|von|of
um|un|un|ein|a
uma|una|una|eine|a
seis sete|seis siete|sei sette|sechs sieben|six-seven
dois|dos|due|zwei|two
três|tres|tre|drei|three
quatro|cuatro|quattro|vier|four
cinco|cinco|cinque|fünf|five
seis|seis|sei|sechs|six
sete|siete|sette|sieben|seven
oito|ocho|otto|acht|eight
nove|nueve|nove|neun|nine
dez|diez|dieci|zehn|ten
zero|cero|zero|null|zero
parar|parar|fermati|stopp|stop
bonito|bonito|bello|schön|beautiful
grande|grande|grande|groß|big
pequeno|pequeño|piccolo|klein|small
novo|nuevo|nuovo|neu|new
velho|viejo|vecchio|alt|old
rápido|rápido|veloce|schnell|fast
devagar|despacio|piano|langsam|slow
certo|correcto|giusto|richtig|right
errado|incorrecto|sbagliato|falsch|wrong
difícil|difícil|difficile|schwierig|difficult
fácil|fácil|facile|einfach|easy
ajudar|ayudar|aiutare|helfen|to help
gostar|gustar|piacere|mögen|to like
querer|querer|volere|wollen|to want
saber|saber|sapere|wissen|to know
ver|ver|vedere|sehen|see
ouvir|oír|sentire|hören|hear
andar|caminar|camminare|gehen|walk
correr|correr|correre|laufen|run
dormir|dormir|dormire|schlafen|sleep
estudar|estudiar|studiare|lernen|study
brincar|jugar|giocare|spielen|play
cantar|cantar|cantare|singen|sing
dançar|bailar|ballare|tanzen|dance
esperar|esperar|aspettare|warten|wait
vir|venir|venire|kommen|come
dar|dar|dare|geben|give
pegar|coger|prendere|nehmen|take
abrir|abrir|aprire|öffnen|open
fechar|cerrar|chiudere|schließen|close
comprar|comprar|comprare|kaufen|buy
pagar|pagar|pagare|bezahlen|pay
caro|caro|caro|teuer|expensive
barato|barato|economico|billig|cheap
preço|precio|prezzo|Preis|price
tempo|tiempo|tempo|Zeit|time
hora|hora|ora|Uhr|hour
semana|semana|settimana|Woche|week
sol|sol|sole|Sonne|sun
chuva|lluvia|pioggia|Regen|rain
café|café|caffè|Kaffee|coffee
leite|leche|latte|Milch|milk
pão|pan|pane|Brot|bread
fruta|fruta|frutta|Obst|fruit
arroz|arroz|riso|Reis|rice
carne|carne|carne|Fleisch|meat
peixe|pescado|pesce|Fisch|fish
cachorro|perro|cane|Hund|dog
gato|gato|gatto|Katze|cat
livro|libro|libro|Buch|book
professor|profesor|professore|Lehrer|teacher
aluno|alumno|alunno|Schüler|student
igreja|iglesia|chiesa|Kirche|church
mercado|mercado|mercato|Markt|market
farmácia|farmacia|farmacia|Apotheke|pharmacy
polícia|policía|polizia|Polizei|police
emergência|emergencia|emergenza|Notfall|emergency
socorro|socorro|aiuto|Hilfe|help
cuidado|cuidado|attenzione|Vorsicht|careful
doente|enfermo|malato|krank|sick
cansado|cansado|stanco|müde|tired
bravo|enojado|arrabbiato|wütend|angry
medo|miedo|paura|Angst|fear
mulher|mujer|donna|Frau|woman
homem|hombre|uomo|Mann|man
criança|niño|bambino|Kind|child
pessoa|persona|persona|Person|person
todos|todos|tutti|alle|everyone
nada|nada|niente|nichts|nothing
tudo|todo|tutto|alles|everything
mais|más|più|mehr|more
menos|menos|meno|weniger|less
também|también|anche|auch|also
sempre|siempre|sempre|immer|always
nunca|nunca|mai|nie|never
depois|después|dopo|danach|after
antes|antes|prima|vorher|before
perto|cerca|vicino|nah|near
longe|lejos|lontano|weit|far
direita|derecha|destra|rechts|right (side)
esquerda|izquierda|sinistra|links|left (side)`.split('\n').map(l=>{const t=l.split('|');return{k:norm(t[0]).replace(/[^A-Z]/g,''),t}});
const NAMES = 'Miguel,Arthur,Heitor,Bernardo,Davi,Theo,Lorenzo,Gabriel,Pedro,Gael,Matheus,Mateus,Lucas,Benjamin,Nicolas,Guilherme,Rafael,Joaquim,Samuel,Enzo,Joao,Henrique,Murilo,Gustavo,Felipe,Pietro,Isaac,Lucca,Eduardo,Daniel,Bryan,Leonardo,Vinicius,Caio,Thiago,Otavio,Enrico,Anthony,Caua,Ricardo,Carlos,Jose,Paulo,Marcos,Antonio,Fernando,Rodrigo,Bruno,Diego,Andre,Helena,Alice,Laura,Maria,Valentina,Heloisa,Sophia,Isabella,Manuela,Julia,Luiza,Livia,Cecilia,Eloa,Giovanna,Beatriz,Mariana,Lara,Ana,Lorena,Isadora,Melissa,Amanda,Leticia,Camila,Gabriela,Fernanda,Larissa,Bianca,Carolina,Rafaela,Vitoria,Natalia,Aline,Patricia,Juliana,Bruna,Jessica,Sandra,Raquel,Renata,Tatiana,Priscila,Luciana,Marcela,Paula,Clara,Sara,Yasmin,Emily';
NAMES.split(',').forEach(n=>WORDS.push({k:norm(n).replace(/[^A-Z]/g,''),t:[n,n,n,n,n],n:true}));

function norm(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

// Letras que a luva pode confundir (formas de mão parecidas): trocar custa pouco
const CONF = new Set('MN UV PQ BW ES AS AE CO GQ IJ RU KP FT DG'.split(' ').flatMap(p=>[p,p[1]+p[0]]));
function wcost(a,b){
  const m=a.length,n=b.length; let prev=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const cur=[i];
    for(let j=1;j<=n;j++){
      const s=a[i-1]===b[j-1]?0:CONF.has(a[i-1]+b[j-1])?0.4:1;
      cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+s);
    } prev=cur;}
  return prev[n];
}
// Entende uma sequência de letras: tolera trocas, acentos e falta de espaços.
// Devolve a lista de palavras do dicionário, ou null se não conseguir cobrir tudo.
function understand(tok){
  const s=norm(tok).replace(/[^A-Z]/g,''), n=s.length; if(n<2) return null;
  const best=[0],back=[];
  for(let i=1;i<=n;i++){best[i]=Infinity;
    WORDS.forEach((w,wi)=>{const L=w.k.length; if(L<2) return;
      for(let l=L-1;l<=L+1;l++){const j=i-l; if(j<0||best[j]===Infinity) continue;
        const c=wcost(s.slice(j,i),w.k);
        const tol=w.n?(L<=5?0.5:0.8):(L<=3?0.5:L<=5?0.8:L<=7?1.2:0.34*L);
        if(c<=tol&&best[j]+c+0.3<best[i]){best[i]=best[j]+c+0.3;back[i]=[j,wi];}
      }});}
  if(best[n]===Infinity) return null;
  const out=[]; for(let i=n;i>0;i=back[i][0]) out.unshift(back[i][1]);
  return out;
}

const $=id=>document.getElementById(id);
const textEl=$('text'),letterEl=$('letter'),statusEl=$('status');
let voiceOn=true,vLang=0,device=null,idleT=null,current=[];

$('tr').innerHTML=LANGS.map((l,i)=>`<div class="card" id="c${i}"><h3><span>${l[0]} ${l[1]}</span><button data-sp="${i}" aria-label="Falar em ${l[1]}">🔊</button></h3><p id="t${i}">–</p><small id="n${i}"></small></div>`).join('');
$('vlang').innerHTML=LANGS.map((l,i)=>`<button class="pill" data-vl="${i}">${l[0]} ${l[1]}</button>`).join('');
// Imagens do alfabeto embutidas (o site funciona só com este arquivo)
const FILES=[...'ABC','CEDILHA',...'DEFGHIJKLMNOPQRSTUVWXYZ'];
$('alpha').innerHTML=FILES.map(f=>`<div id="a${f}"><img loading="lazy" src="${IMG[f.toLowerCase()]}" alt="Letra ${f==='CEDILHA'?'Ç':f} em LIBRAS"></div>`).join('');

// Converte o texto recebido em lista de itens {entrada} ou {raw}
function parse(raw){
  const items=[];
  raw.trim().split(/\s+/).filter(Boolean).forEach(tok=>{
    const u=understand(tok);
    if(u) u.forEach(wi=>items.push({w:WORDS[wi]})); else items.push({raw:tok});
  });
  return items;
}
function phrase(i){
  return current.map(it=>{
    if(it.w) return it.w.t[i];
    const k=norm(it.raw); return (k.length===1&&LN[k.charCodeAt(0)-65])?LN[k.charCodeAt(0)-65][i]:it.raw;
  }).join(' ');
}
function translate(){
  current=parse(textEl.value);
  $('heardTxt').textContent=current.length?phrase(0):'–';
  const k=norm(letterEl.textContent);
  LANGS.forEach((_,i)=>{
    $('t'+i).textContent=phrase(i)||'–';
    $('n'+i).textContent=(k.length===1&&k>='A'&&k<='Z')?`Letra ${k}: ${LN[k.charCodeAt(0)-65][i]}`:'';
    $('c'+i).classList.toggle('sel',i===vLang);
  });
  document.querySelectorAll('[data-vl]').forEach(b=>b.classList.toggle('sel',+b.dataset.vl===vLang));
  if($('spTarget')) $('spTarget').textContent=LANGS[vLang][0]+' '+LANGS[vLang][1];
  if($('stTr')){ $('stTr').textContent=phrase(vLang)||'–'; $('stRaw').textContent=textEl.value; $('stSel').value=vLang; }
  if($('ipTxt')) $('ipTxt').textContent=phrase(vLang)||'…';
  if(typeof suggest==='function') suggest();
}

let voices=[], spT=null;
const synth='speechSynthesis' in window ? speechSynthesis : null;
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};
function langVoices(lang){const c=LANGS[lang][2].slice(0,2);return voices.filter(v=>v.lang.toLowerCase().replace('_','-').startsWith(c))}
function pickVoice(lang){
  const list=langVoices(lang), saved=store('voz_'+lang);
  return list.find(v=>v.name===saved) || list.find(v=>/google|natural|neural|online/i.test(v.name)&&v.lang.replace('_','-')===LANGS[lang][2]) || list.find(v=>v.lang.replace('_','-')===LANGS[lang][2]) || list[0] || null;
}
function updateVoiceSelect(){
  voices=synth?synth.getVoices():[];
  const list=langVoices(vLang), cur=pickVoice(vLang), sel=$('voiceSel');
  sel.innerHTML=list.length?list.map(v=>`<option value="${v.name}" ${cur&&v.name===cur.name?'selected':''}>${v.name} (${v.lang})</option>`).join(''):'<option>voz padrão do navegador</option>';
}
function speak(msg,lang){
  if(!synth||!msg) return;
  clearTimeout(spT); synth.cancel();
  spT=setTimeout(()=>{            // pequena pausa depois do cancel evita cortes e travadas
    const u=new SpeechSynthesisUtterance(msg), v=pickVoice(lang);
    u.lang=LANGS[lang][2]; if(v) u.voice=v;
    u.rate=+$('rate').value||0.85; u.pitch=1; u.volume=1;
    synth.speak(u);
  },90);
}
function speakPhrase(i){ speak(phrase(i),i); if(typeof addHist==='function'&&phrase(0)) addHist(phrase(0)); }
function highlight(c){
  document.querySelectorAll('.alpha .hit').forEach(e=>e.classList.remove('hit'));
  const el=$('a'+norm(c)); if(el) el.classList.add('hit');
}

// Dados da luva: letra ou palavra; "_"/ESPACO = espaço; DEL/APAGAR = apagar
let lastIn={m:'',src:'',t:0};
function onData(msg,src='glove'){
  msg=msg.trim(); if(!msg) return;
  if(game.on&&game.type!=='quiz'){ gameFeed(msg); return; }
  if(curTab!=='tr') return;   // fora da aba Tradutor, a luva não escreve nem fala
  const mu=msg.toUpperCase(), nowT=Date.now();
  if(lastIn.src&&src!==lastIn.src&&mu===lastIn.m&&nowT-lastIn.t<1500) return;   // luva e câmera mandaram o mesmo: vale uma vez
  lastIn={m:mu,src,t:nowT};
  const k=norm(msg);
  if(k==='_'||k==='ESPACO') textEl.value+=' ';
  else if(k==='DEL'||k==='APAGAR') textEl.value=textEl.value.slice(0,-1);
  else{
    letterEl.textContent=msg.toUpperCase(); highlight(msg);
    textEl.value+=msg.length>1?(textEl.value&&!/\s$/.test(textEl.value)?' ':'')+msg+' ':msg;
    if(voiceOn&&msg.length===1) speak(msg,vLang);
  }
  translate();
  clearTimeout(idleT);
  if(voiceOn) idleT=setTimeout(()=>speakPhrase(vLang),IDLE_MS);
}

function setStatus(on){
  linkSay(on?'animado':'triste', on?'Luva conectada!':'Luva desconectada. Posso ajudar a reconectar?');
  statusEl.textContent=on?'🟢 Conectado':'❌ Desconectado';
  statusEl.className=on?'on':'off';
  $('btnConn').textContent=on?'Desconectar':'Conectar via Bluetooth';
}
function warn(m){const w=$('warn');w.textContent=m;w.style.display=m?'block':'none'}
let lastGlove=0, batLevel=null, manualDisc=false;
async function bleSetup(server){
  const ch=await (await server.getPrimaryService(SERVICE_UUID)).getCharacteristic(CHAR_UUID);
  await ch.startNotifications();
  ch.addEventListener('characteristicvaluechanged',e=>{ lastGlove=Date.now(); onData(new TextDecoder().decode(e.target.value),'glove'); });
  batLevel=null;
  try{   // bateria: serviço padrão do Bluetooth (0x180F), se a luva tiver
    const bc=await (await server.getPrimaryService('battery_service')).getCharacteristic('battery_level');
    batLevel=(await bc.readValue()).getUint8(0);
    await bc.startNotifications(); bc.addEventListener('characteristicvaluechanged',e=>{ batLevel=e.target.value.getUint8(0) });
  }catch(e){}
}
async function connect(){
  if(!navigator.bluetooth){warn('Este navegador não suporta Web Bluetooth. Use Chrome ou Edge no Android ou computador (no iPhone, tente o app Bluefy).');return}
  warn('');
  try{
    device=await navigator.bluetooth.requestDevice({filters:[{name:DEVICE_NAME}],optionalServices:[SERVICE_UUID,'battery_service']});
    device.addEventListener('gattserverdisconnected',async()=>{
      setStatus(false);
      if(manualDisc){ manualDisc=false; return; }
      for(let i=0;i<3;i++){ await sleep(2000); try{ await bleSetup(await device.gatt.connect()); setStatus(true); return; }catch(e){} }
    });
    await bleSetup(await device.gatt.connect());
    setStatus(true);
  }catch(err){setStatus(false);if(err.name!=='NotFoundError') warn('Não foi possível conectar: '+err.message)}
}
$('btnConn').onclick=()=>{if(device&&device.gatt.connected){ manualDisc=true; device.gatt.disconnect(); } else connect()};
$('btnClear').onclick=()=>{textEl.value='';letterEl.textContent='–';highlight('#');clearTimeout(idleT);if('speechSynthesis' in window) speechSynthesis.cancel();translate()};
$('btnVoice').onclick=()=>{
  voiceOn=!voiceOn;
  $('btnVoice').textContent=voiceOn?'🔊 Voz: Ativada':'🔇 Voz: Desativada';
  if(!voiceOn){clearTimeout(idleT);if('speechSynthesis' in window) speechSynthesis.cancel()}
};
$('btnSpeakAll').onclick=()=>speakPhrase(vLang);
document.addEventListener('click',e=>{
  const sp=e.target.closest('[data-sp]'),vl=e.target.closest('[data-vl]');
  if(sp) speakPhrase(+sp.dataset.sp);
  if(vl){vLang=+vl.dataset.vl;updateVoiceSelect();translate()}
});
textEl.addEventListener('input',translate);
$('voiceSel').onchange=e=>{store('voz_'+vLang,e.target.value);speak(phrase(vLang)||'Olá',vLang)};
$('rate').value=store('vel')||0.85; $('rate').onchange=e=>store('vel',e.target.value);
if(synth) synth.onvoiceschanged=updateVoiceSelect;
updateVoiceSelect();

// Vídeos sugeridos (encontrados por busca; confirme o canal de origem). Cole outros links no campo abaixo do player.
const VIDEOS=[['Curso básico de Libras (INES)','_j-gkWhJs7w'],['A Vida em Libras: obrigado, água… em outros países','WHGaShBtKYo'],['A Vida em Libras: dinheiro e banco','-gn34MLN8Yw'],['A Vida em Libras: escola','Y_SiGWPqH9o'],['TV INES – Aula de Libras: Cores','nVpc00JDfS4']];
function loadVid(id,list){
  $('video').innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${list?'videoseries?list=':''}${encodeURIComponent(id)}" title="Videoaula de LIBRAS" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe>`;
}
$('vlist').innerHTML=VIDEOS.map((v,i)=>`<button data-vid="${i}">${v[0]}</button>`).join('');
document.addEventListener('click',e=>{const b=e.target.closest('[data-vid]'); if(b) loadVid(VIDEOS[+b.dataset.vid][1])});
$('btnPl').onclick=()=>{
  const v=$('plUrl').value.trim(), l=v.match(/[?&]list=([\w-]+)/), w=v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  if(l) loadVid(l[1],true); else if(w) loadVid(w[1]); else { $('plUrl').value=''; $('plUrl').placeholder='Link inválido. Cole um link do YouTube (vídeo ou playlist).'; }
};

