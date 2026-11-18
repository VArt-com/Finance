/* Yulia Fit — 2D-карта мышц: вид спереди и сзади, работающие мышцы подсвечены.
   Красный — основная нагрузка, оранжевый — дополнительная. Без внешних файлов, работает офлайн. */
var MuscleMap=(()=>{
const HL={squat:['quad','glute'],goblet:['quad','glute'],legPress:['quad','glute'],rdl:['ham','glute','lowback'],hipThrust:['glute','ham'],
 lunge:['quad','glute'],legCurl:['ham'],legExt:['quad'],calf:['calf'],dbBench:['chest','triceps','delt'],incline:['chest','delt','triceps'],
 shoulder:['delt','triceps'],lateral:['delt'],pulldown:['back','biceps'],row:['back','biceps'],dbRow:['back','biceps'],facePull:['delt','back'],
 biceps:['biceps'],triceps:['triceps'],plank:['abs','delt'],crunch:['abs'],legRaise:['abs'],abductor:['abductor'],backExt:['lowback','glute','ham'],
 cardio:['quad','calf']};
const HL2={squat:['ham','abs','lowback'],goblet:['abs'],legPress:['calf'],rdl:['back','forearm'],hipThrust:['quad','abs'],lunge:['ham','calf'],
 legCurl:['calf'],legExt:[],calf:[],dbBench:[],incline:[],shoulder:['back'],lateral:['forearm'],pulldown:['forearm','delt'],row:['forearm','lowback'],
 dbRow:['forearm','lowback'],facePull:['triceps'],biceps:['forearm'],triceps:['forearm'],plank:['glute','chest'],crunch:[],legRaise:['forearm','quad'],
 abductor:['glute'],backExt:[],cardio:['ham','glute']};
const NAMES={quad:['Квадрицепсы','ארבע ראשי'],ham:['Бицепс бедра','המסטרינג'],glute:['Ягодицы','ישבן'],abductor:['Средняя ягодичная','ישבן אמצעי'],
 calf:['Икры','תאומים'],chest:['Грудь','חזה'],delt:['Плечи (дельты)','כתפיים'],triceps:['Трицепс','תלת ראשי'],biceps:['Бицепс','דו ראשי'],
 back:['Спина (трапеция, широчайшие)','גב (טרפז, רחב)'],lowback:['Поясница','גב תחתון'],abs:['Пресс','בטן'],forearm:['Предплечья','אמות']};
/* контуры правой половины тела (левая получается зеркально) */
const BASE=['M100,58 L108,58 C124,64 142,70 150,78 L150,100 C144,122 136,160 130,190 C138,200 146,212 146,228 C146,260 140,292 133,310 L131,318 C135,340 131,372 127,396 L134,408 C136,415 130,419 122,419 L108,419 C108,408 110,400 112,396 C108,372 109,336 108,318 C104,296 101,272 100,250Z',
 'M141,76 C157,72 169,81 167,101 C167,126 161,148 155,161 L143,161 C141,136 139,110 141,76Z',
 'M144,160 C156,158 165,166 167,178 C170,192 172,206 172,218 C176,224 176,236 170,240 C164,242 160,234 158,220 C154,204 148,188 144,174Z'];
const FRONT={
 delt:['M138,72 C152,69 165,78 165,95 C165,105 161,113 156,119 L143,108 C140,96 138,84 138,72Z'],
 chest:['M101,84 C118,80 134,83 142,93 C144,105 139,116 129,121 C117,123 106,119 101,113Z'],
 biceps:['M143,110 C151,114 158,120 158,134 C158,146 154,153 150,158 C146,152 143,142 142,130 C141,121 142,115 143,110Z'],
 forearm:['M146,160 C156,158 163,165 165,176 C168,190 170,203 170,216 L162,218 C158,204 152,188 146,174Z'],
 abs:[0,1,2,3,4].map(i=>`M102,${126+i*13.5} h18 a3,3 0 0 1 3,3 v8.5 a3,3 0 0 1 -3,3 h-18Z`).concat(['M124,128 C133,134 135,162 131,190 C127,188 124,170 124,128Z']),
 quad:['M104,216 C118,210 138,214 143,228 C143,258 138,288 131,306 C123,310 115,308 111,300 C107,270 104,244 104,216Z'],
 abductor:['M139,212 C147,217 149,232 145,248 C142,238 140,226 139,212Z'],
 calf:['M113,318 C123,316 132,320 132,332 C132,352 128,374 124,394 L117,394 C113,370 109,346 113,318Z']};
const BACK={
 back:['M100,58 L108,58 C122,66 136,72 141,78 C134,94 118,104 100,112Z','M100,112 C118,104 134,96 141,100 C143,120 137,148 128,166 C118,166 108,160 100,158Z'],
 delt:FRONT.delt,
 triceps:['M143,110 C151,114 158,120 158,134 C158,146 154,153 150,158 C146,152 143,142 142,130 C141,121 142,115 143,110Z'],
 forearm:FRONT.forearm,
 lowback:['M100,160 C110,162 120,166 126,170 C126,182 124,192 120,202 L100,204Z'],
 glute:['M100,206 C120,200 144,208 145,230 C145,248 128,258 100,254Z'],
 abductor:['M124,202 C136,202 145,212 145,228 C139,224 130,216 124,202Z'],
 ham:['M103,256 C120,256 138,248 143,238 C143,264 138,288 131,306 C123,310 115,308 111,300 C106,284 103,270 103,256Z'],
 calf:['M110,316 C122,313 135,318 135,334 C135,352 129,368 123,384 L116,384 C110,366 106,338 110,316Z']};
const DETAIL={front:'<path d="M100,124 V198 M123,126 C131,140 132,170 128,190" class="mm-ln"/><ellipse cx="120" cy="313" rx="7" ry="5" class="mm-kn"/>',
 back:'<path d="M100,60 V252" class="mm-ln"/>'};
function side(map,st,flip){
  let o='';
  for(const k in map){
    const s=st[k]||0;
    o+=`<g class="mm-m ${s===1?'mm-p':s===2?'mm-s':''}">`+map[k].map(d=>`<path d="${d}"/>`).join('')+'</g>';
  }
  return o;
}
function view(map,st,kind){
  const half=BASE.map(d=>`<path d="${d}" class="mm-b"/>`).join('')+side(map,st)+DETAIL[kind];
  const head=kind==='front'
    ?'<ellipse cx="100" cy="30" rx="15" ry="18" class="mm-b"/><path d="M92,44 L108,44 L108,60 L92,60Z" class="mm-b"/>'
    :'<ellipse cx="100" cy="30" rx="15" ry="18" class="mm-b"/><path d="M92,44 L108,44 L108,60 L92,60Z" class="mm-b"/><path d="M86,22 C90,10 110,10 114,22" class="mm-hair"/>';
  return `<svg viewBox="0 0 200 424" role="img" aria-hidden="true">${head}<g>${half}</g><g transform="translate(200,0) scale(-1,1)">${half}</g></svg>`;
}
function html(id,lang){
  const h1=HL[id]||[],h2=HL2[id]||[],st={};
  h2.forEach(k=>st[k]=2);h1.forEach(k=>st[k]=1);
  const L=lang==='he'?1:0,nm=k=>NAMES[k][L];
  const ttl=L?['מבט מלפנים','מבט מאחור']:['Спереди','Сзади'];
  const leg=(k,c)=>`<span class="mm-lg"><i class="${c}"></i>${nm(k)}</span>`;
  return `<div class="mmap"><div class="mm-views"><figure>${view(FRONT,st,'front')}<figcaption>${ttl[0]}</figcaption></figure><figure>${view(BACK,st,'back')}<figcaption>${ttl[1]}</figcaption></figure></div>`+
   `<div class="mm-legend">${h1.map(k=>leg(k,'p')).join('')}${h2.map(k=>leg(k,'s')).join('')}</div></div>`;
}
return{html};
})();
