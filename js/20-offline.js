// Painel "Avançado" da câmera + modo offline (PWA: service worker, preparar arquivos, instalar app)
(function(){
  const $$=s=>document.querySelectorAll(s);

  // ----- painel Avançado: abre/fecha junto nas duas abas e lembra a escolha -----
  let adv=false; try{ adv=localStorage.getItem('linkglove_avancado')==='1' }catch(e){}
  $$('details.adv').forEach(d=>{
    d.open=adv;
    d.addEventListener('toggle',()=>{
      if (d.open===adv) return; adv=d.open;
      try{ localStorage.setItem('linkglove_avancado',adv?'1':'0') }catch(e){}
      $$('details.adv').forEach(o=>{ if (o.open!==adv) o.open=adv; });
    });
  });

  // ----- estado mostrado no painel -----
  const okSW = 'serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost' || location.hostname==='127.0.0.1');
  let extra = ''; try{ if (localStorage.getItem('linkglove_offline_ok')==='1') extra='✔ arquivos salvos para uso offline'; }catch(e){}
  if (!okSW) extra='o modo offline só funciona com o site publicado em https';
  const render = () => { const t=(navigator.onLine?'📶 Online':'✈ Sem internet, usando os arquivos salvos neste aparelho')+(extra?' · '+extra:''); $$('.offSt').forEach(e=>e.textContent=t); };
  addEventListener('online',render); addEventListener('offline',render); render();

  // ----- service worker -----
  if (okSW){
    const reg = () => navigator.serviceWorker.register('sw.js').catch(()=>{ extra='não foi possível ativar o modo offline'; render(); });
    if (document.readyState==='complete') reg(); else addEventListener('load',reg);
  }

  // ----- baixar as bibliotecas de visão (mãos, rosto, expressões) para usar sem internet -----
  const base = n => f => `https://cdn.jsdelivr.net/npm/@mediapipe/${n}/${f}`;
  async function preparar(){
    if (!okSW){ extra='o modo offline só funciona com o site publicado em https'; render(); return; }
    if (!navigator.onLine){ extra='conecte-se à internet para baixar os arquivos'; render(); return; }
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller){ extra='recarregue a página uma vez e toque de novo'; render(); return; }
    $$('.btnOffline').forEach(b=>b.disabled=true);
    const c=document.createElement('canvas'); c.width=c.height=96; c.getContext('2d').fillRect(0,0,96,96);
    const jobs=[
      ['mãos', async()=>{ const m=new Hands({locateFile:base('hands@0.4.1675469240')}); m.setOptions({maxNumHands:1,modelComplexity:0}); m.onResults(()=>{}); await m.send({image:c}); await m.close(); }],
      ['rosto', async()=>{ const m=new FaceDetection({locateFile:base('face_detection@0.4.1646425229')}); m.setOptions({model:'short'}); m.onResults(()=>{}); await m.send({image:c}); await m.close(); }],
      ['expressões', async()=>{ const m=new FaceMesh({locateFile:base('face_mesh@0.4.1633559619')}); m.setOptions({maxNumFaces:1,refineLandmarks:false}); m.onResults(()=>{}); await m.send({image:c}); await m.close(); }]
    ];
    const falhas=[];
    for (let i=0;i<jobs.length;i++){
      extra=`baixando ${jobs[i][0]} (${i+1}/${jobs.length})...`; render();
      try{ await jobs[i][1](); }catch(e){ falhas.push(jobs[i][0]); }
    }
    extra = falhas.length ? 'não baixou: '+falhas.join(', ')+' (tente de novo com internet)' : '✔ pronto: tudo salvo para usar sem internet';
    try{ localStorage.setItem('linkglove_offline_ok', falhas.length?'0':'1') }catch(e){}
    $$('.btnOffline').forEach(b=>b.disabled=false); render();
  }
  $$('.btnOffline').forEach(b=>b.onclick=preparar);

  // ----- instalar como app -----
  let ev=null;
  addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); ev=e; $$('.btnInstall').forEach(b=>b.hidden=false); });
  addEventListener('appinstalled',()=>{ ev=null; $$('.btnInstall').forEach(b=>b.hidden=true); });
  $$('.btnInstall').forEach(b=>b.onclick=async()=>{ if(!ev) return; ev.prompt(); try{ await ev.userChoice }catch(e){} ev=null; $$('.btnInstall').forEach(x=>x.hidden=true); });
})();
