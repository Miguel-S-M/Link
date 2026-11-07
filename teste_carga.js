// Teste de carga: executa os scripts do app num DOM falso e mostra erros de carregamento.
const fs=require('fs'), vm=require('vm'), path=require('path');
const app=process.argv[2], dir=path.join(__dirname,app);
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const el=new Proxy(function(){},{get:(_,k)=>k===Symbol.toPrimitive?()=>'':k===Symbol.iterator?function*(){}:
  ['value','textContent','innerHTML','className','id','src','href'].includes(k)?'':['checked','disabled','hidden','open'].includes(k)?false:k==='length'?0:el,
  set:()=>true,apply:()=>el});
const mem=()=>{const m={};return {getItem:k=>k in m?m[k]:null,setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]},key:i=>Object.keys(m)[i],get length(){return Object.keys(m).length}}};
const ctx={console,Math,Date,JSON,Promise,Object,Array,String,Number,Boolean,RegExp,Set,Map,Error,Symbol,parseInt,parseFloat,isNaN,Float32Array,Uint8Array,
  setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>0,
  localStorage:mem(),sessionStorage:mem(),performance:{now:()=>Date.now()},
  navigator:{language:'pt-BR',mediaDevices:{getUserMedia:async()=>{}},userAgent:'x',serviceWorker:undefined},
  location:{reload(){},href:'http://localhost/',hash:''},
  document:{getElementById:id=>ids.has(id)?el:null,querySelectorAll:()=>[],querySelector:()=>el,createElement:()=>el,addEventListener(){},body:el,documentElement:el,hidden:false},
  addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),
  Hands:function(){return el},FaceMesh:function(){return el},FaceDetection:function(){return el},Camera:function(){return el},Peer:function(){return el},
  Image:function(){return el},Audio:function(){return el},AudioContext:function(){return el},Blob:function(){},URL:{createObjectURL:()=>''},
  alert(){},confirm:()=>true,prompt:()=>'',fetch:async()=>({ok:false}),getComputedStyle:()=>el,innerWidth:1000,innerHeight:700,devicePixelRatio:1};
ctx.window=ctx; ctx.self=ctx; ctx.globalThis=ctx;
vm.createContext(ctx);
const srcs=[...html.matchAll(/<script src="(js\/[^"?]+)/g)].map(m=>m[1]);
let erros=0;
for(const s of srcs){
  try{ vm.runInContext(fs.readFileSync(path.join(dir,s),'utf8'),ctx,{filename:s}); }
  catch(e){ erros++; const l=(e.stack||'').split('\n').find(x=>x.includes(s.replace('js/','')))||''; console.log('ERRO em',s,'→',e.name+':',e.message,'|',l.trim()); }
}
process.argv.slice(3).forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f}));
console.log(app+': '+srcs.length+' scripts, '+erros+' com erro de carga');
