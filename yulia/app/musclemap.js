/* Yulia Fit — 2D-карта мышц (спереди и сзади), детальная: каждая мышца/головка отдельно.
   Красный — основная нагрузка, оранжевый — дополнительная. Без внешних файлов, работает офлайн. */
var MuscleMap=(()=>{
const Q=['quad_rf','quad_vl','quad_vm'];
/* [основные, дополнительные] */
const EX={
 squat:[[...Q,'glute','adduct'],['ham','lowback','abs']],
 goblet:[[...Q,'glute','adduct'],['abs']],
 legPress:[[...Q,'glute'],['adduct','ham','calf']],
 rdl:[['ham','glute','lowback'],['trap','lats','forearm']],
 hipThrust:[['glute','ham'],['glute_m',...Q,'abs']],
 lunge:[[...Q,'glute'],['ham','glute_m','adduct','calf']],
 legCurl:[['ham'],['calf']],
 legExt:[[...Q],[]],
 calf:[['calf','soleus'],[]],
 dbBench:[['chest_u','chest_l','delt_f','triceps'],['serratus']],
 incline:[['chest_u','delt_f','triceps'],['chest_l','serratus']],
 shoulder:[['delt_f','delt_s','triceps'],['trap','chest_u']],
 lateral:[['delt_s'],['delt_f','delt_r','trap','forearm']],
 pulldown:[['lats','biceps'],['rhomb','delt_r','forearm','trap']],
 row:[['lats','rhomb','trap','biceps'],['delt_r','forearm','lowback']],
 dbRow:[['lats','rhomb','trap','biceps'],['delt_r','forearm','lowback']],
 facePull:[['delt_r','rhomb','trap'],['delt_s','forearm']],
 biceps:[['biceps'],['forearm']],
 triceps:[['triceps'],['forearm']],
 plank:[['abs','obliques','delt_f'],['serratus','glute',...Q,'chest_l']],
 crunch:[['abs'],['obliques']],
 legRaise:[['abs'],['quad_rf','obliques','forearm']],
 abductor:[['glute_m'],['glute']],
 backExt:[['lowback','glute','ham'],[]],
 cardio:[[...Q,'calf'],['ham','glute']]};
const NAMES={
 delt_f:['Передняя дельта','כתף קדמית'],delt_s:['Средняя дельта','כתף צדדית'],delt_r:['Задняя дельта','כתף אחורית'],
 chest_u:['Верх груди','חזה עליון'],chest_l:['Низ груди','חזה תחתון'],serratus:['Зубчатая мышца','שרשרתית קדמית'],
 biceps:['Бицепс','דו ראשי'],triceps:['Трицепс','תלת ראשי'],forearm:['Предплечья','אמות'],
 abs:['Прямая мышца живота','בטן ישרה'],obliques:['Косые мышцы живота','אלכסוניים'],
 quad_rf:['Квадрицепс','ארבע ראשי'],quad_vl:['Квадрицепс','ארבע ראשי'],quad_vm:['Квадрицепс','ארבע ראשי'],
 adduct:['Приводящие (внутр. бедро)','מקרבי ירך'],glute_m:['Средняя ягодичная','ישבן אמצעי'],glute:['Большая ягодичная','ישבן גדול'],
 ham:['Бицепс бедра','המסטרינג'],calf:['Икроножная','תאומים'],soleus:['Камбаловидная','סוליאוס'],
 trap:['Трапеция','טרפז'],lats:['Широчайшие','רחב גבי'],rhomb:['Ромбовидные','מעוינים'],lowback:['Разгибатели спины','מיישרי גב']};
/* контуры правой половины тела (левая — зеркально) */
const BASE=['M100,58 L108,58 C124,64 142,70 150,78 L150,100 C144,122 136,160 130,190 C138,200 146,212 146,228 C146,260 140,292 133,310 L131,318 C135,340 131,372 127,396 L134,408 C136,415 130,419 122,419 L108,419 C108,408 110,400 112,396 C108,372 109,336 108,318 C104,296 101,272 100,250Z',
 'M141,76 C157,72 169,81 167,101 C167,126 161,148 155,161 L143,161 C141,136 139,110 141,76Z',
 'M144,160 C156,158 165,166 167,178 C170,192 172,206 172,218 C176,224 176,236 170,240 C164,242 160,234 158,220 C154,204 148,188 144,174Z'];
const DF='M138,72 C144,70.5 149,70.5 153,72 C150,86 148,98 146,107 L143,108 C140,96 138,84 138,72Z';
const DS='M153,72 C161,75 165,84 165,95 C165,105 161,113 156,119 L146,107 C148,98 150,86 153,72Z';
const ARM='M143,109 C151,113 158,119 158,134 C158,146 154,153 150,158 C146,152 143,142 142,130 C141,120 142,114 143,109Z';
const FA='M146,160 C156,158 163,165 165,176 C168,190 170,203 170,216 L162,218 C158,204 152,188 146,174Z';
const FRONT={
 chest_u:['M101,83 C113,80 127,80 140,88 C142,92 142,95 140,98 C128,95 112,95 101,98Z'],
 chest_l:['M101,99.5 C112,96.5 128,98.5 140,100 C141,108 137,116 129,121 C117,123 106,119 101,113Z'],
 serratus:['M131,124 C135,128 137,136 136,146 L131,143 L132,133Z','M131,148 C135,152 136,160 134,168 L130,164Z'],
 delt_f:[DF],delt_s:[DS],biceps:[ARM],forearm:[FA],
 abs:[0,1,2,3,4].map(i=>`M102,${126+i*13.5} h18 a3,3 0 0 1 3,3 v8.5 a3,3 0 0 1 -3,3 h-18Z`),
 obliques:['M124,128 C130,134 132,162 128,190 C125,186 123,168 124,128Z'],
 quad_vm:['M105,222 C108,218 111,218 111.5,225 C111.5,246 112.5,272 113.5,292 C110,300 106,296 105,288 C103,264 103,240 105,222Z'],
 quad_rf:['M113,216 C118,214 124,216 126,224 C127,250 125,276 122,298 C118,300 115,298 114.5,292 C113,262 112,238 113,216Z'],
 quad_vl:['M128,218 C136,216 142,222 143,232 C143,260 139,286 132,304 C128,306 124,304 122.5,298 C126,276 128,250 128,218Z'],
 adduct:['M100,214 L103.5,218 C101.5,240 102,264 103.5,288 C101,278 100,264 100,250Z'],
 glute_m:['M139,212 C147,217 149,232 145,248 C142,238 140,226 139,212Z'],
 calf:['M124,320 C130,320 133,326 132,336 C132,354 128,374 125,394 L120,394 C122,372 124,350 124,320Z']};
const BACK={
 trap:['M100,58 L108,58 C122,66 136,72 141,78 C134,94 118,104 100,112Z'],
 lats:['M104,119 C116,117 127,111 139,101 C144,120 138,148 128,166 C118,168 110,164 104,160Z'],
 rhomb:['M101,94 C112,93 121,95 127,99 C125,109 116,117 101,119Z'],
 delt_r:[DF],delt_s:[DS],triceps:[ARM],forearm:[FA],
 lowback:['M100,161 C110,163 120,167 126,171 C126,183 124,193 120,203 L100,205Z'],
 glute:['M100,206 C112,203 128,204 138,212 C145,220 146,236 140,246 C128,257 112,257 100,254Z'],
 glute_m:['M124,203 C136,203 146,213 146,227 C140,223 131,215 124,203Z'],
 ham:['M120,258 C130,254 138,248 143,239 C143,264 138,288 131,306 C126,308 122,306 120.5,300 C121.5,286 121.5,272 120,258Z',
      'M103,257 C110,258 115,259 120,259 C121.5,272 121.5,286 120,300 C116,308 111,306 108,298 C104,284 103,270 103,257Z'],
 calf:['M108,316 C114,313 120,314 122,320 C122,340 120,358 117,378 L115,378 C109,358 106,336 108,316Z',
       'M123,316 C129,314 134,320 134,332 C134,350 130,364 126,380 L119,380 C122,360 123,340 123,316Z'],
 soleus:['M115,380 C120,384 125,384 128,382 C128,390 126,396 124,398 L116,398 C114,392 114,386 115,380Z']};
const DETAIL={
 front:'<path d="M100,124 V198" class="mm-ln"/><path d="M113,224 C114,250 114,272 114,290" class="mm-ln"/><ellipse cx="119" cy="313" rx="6.5" ry="5" class="mm-kn"/><path d="M143,110 L150,156" class="mm-ln"/>',
 back:'<path d="M100,58 V254" class="mm-ln"/><path d="M104,162 C112,172 118,186 120,203" class="mm-ln"/>'};
function side(map,st){
  let o='';
  for(const k in map){const s=st[k]||0;
    o+=`<g class="mm-m ${s===1?'mm-p':s===2?'mm-s':''}">`+map[k].map(d=>`<path d="${d}"/>`).join('')+'</g>';}
  return o;
}
function view(map,st,kind){
  const half=BASE.map(d=>`<path d="${d}" class="mm-b"/>`).join('')+side(map,st)+DETAIL[kind];
  const head='<ellipse cx="100" cy="30" rx="15" ry="18" class="mm-b"/><path d="M92,44 L108,44 L108,60 L92,60Z" class="mm-b"/>'+(kind==='back'?'<path d="M86,22 C90,10 110,10 114,22" class="mm-hair"/>':'');
  return `<svg viewBox="0 0 200 424" role="img" aria-hidden="true">${head}<g>${half}</g><g transform="translate(200,0) scale(-1,1)">${half}</g></svg>`;
}
function html(id,lang){
  const e=EX[id]||[[],[]],st={};
  e[1].forEach(k=>st[k]=2);e[0].forEach(k=>st[k]=1);
  const L=lang==='he'?1:0,ttl=L?['מבט מלפנים','מבט מאחור']:['Спереди','Сзади'];
  const uniq=a=>{const seen={},r=[];a.forEach(k=>{const n=NAMES[k][L];if(!seen[n]){seen[n]=1;r.push(n)}});return r};
  const leg=(a,c)=>uniq(a).map(n=>`<span class="mm-lg"><i class="${c}"></i>${n}</span>`).join('');
  return `<div class="mmap"><div class="mm-views"><figure>${view(FRONT,st,'front')}<figcaption>${ttl[0]}</figcaption></figure><figure>${view(BACK,st,'back')}<figcaption>${ttl[1]}</figcaption></figure></div>`+
   `<div class="mm-legend">${leg(e[0],'p')}${leg(e[1].filter(k=>e[0].indexOf(k)<0),'s')}</div></div>`;
}
return{html};
})();
