// Constantes do reconhecimento, perfis, amostras e KNN
// ================= Câmera + MediaPipe Hands =================
const HOLD_MS = 1000;                     // tempo mantendo a letra para enviar
const EXT = [1.6,1.65,1.6,1.45];          // razão punta/pulso ÷ base/pulso: acima = dedo esticado (indicador, médio, anelar, mínimo)
const CURL = [1.25,1.25,1.25,1.2];        // abaixo = dedo dobrado
const THUMB_OUT = 1.3;                    // distância polegar–base do mínimo ÷ tamanho da mão: acima = polegar aberto
const V_GAP = 1.6;
const KNN_MAX = 0.8;                      // distância máxima para uma gravação sua valer
let PROF = ''; try{ PROF = localStorage.getItem('linkglove_perfil')||'' }catch(e){}
const pk = b => b+(PROF?'_'+PROF:'');
let SAMPLES = []; try{ SAMPLES = JSON.parse(localStorage.getItem(pk('linkglove_amostras'))||'[]') }catch(e){}
function fd(a,b){ const n=Math.min(a.length,b.length); let q=0; for(let i=0;i<n;i++) q+=(a[i]-b[i])**2; return Math.sqrt(q*10/n); }
function knn(f){
  if (!SAMPLES.length) return null;
  const ds = SAMPLES.map(x=>({L:x.L, d:fd(x.f,f)})).sort((a,b)=>a.d-b.d).slice(0,5).filter(x=>x.d<=KNN_MAX);
  if (!ds.length) return null;
  const c = {}; ds.forEach(x=>c[x.L]=(c[x.L]||0)+1/(x.d+0.05));
  return Object.keys(c).sort((a,b)=>c[b]-c[a])[0];
}
const EU_Z = 0.06;                        // ponta do indicador MAIS LONGE da câmera que a base = apontando para o corpo
const GEST_WIN = 2500;                    // janela (ms) para gestos com movimento                        // abertura entre indicador e médio: acima = V, abaixo = U
const FAM_MIN_F = 0.3;                    // FAMÍLIA: fração do gesto com as duas mãos em F (0 = aceita qualquer formato de mão)
const CONN = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const cv = $('camVideo'), cc = $('camCanvas'), cx = cc.getContext('2d');
let hands = null, cam = null, camOn = false, buf = [], held = null, heldSince = 0, sentLetter = false;

