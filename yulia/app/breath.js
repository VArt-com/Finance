/* Yulia Fit — подсказки по дыханию: живой индикатор «вдох/выдох» на анимации, текст и необязательный голос. */
var Breath=(()=>{
/* какая половина движения — усилие: AB = от позы A к B, BA = от B к A; S = статика, R = ритм (кардио) */
const DIR={squat:'BA',goblet:'BA',rdl:'BA',lunge:'BA',legPress:'AB',hipThrust:'AB',legCurl:'AB',legExt:'AB',calf:'AB',dbBench:'AB',incline:'AB',
 shoulder:'AB',lateral:'AB',pulldown:'AB',row:'AB',dbRow:'AB',facePull:'AB',biceps:'AB',triceps:'AB',plank:'S',crunch:'AB',legRaise:'AB',
 abductor:'AB',backExt:'AB',cardio:'R'};
const T={
 AB:['Выдох — на усилии (когда давите, тянете или поднимаете). Вдох — на возврате в исходное положение. Не задерживайте дыхание.',
     'נשיפה — בזמן המאמץ (דחיפה, משיכה או הרמה). שאיפה — בחזרה למצב ההתחלתי. לא לעצור את הנשימה.'],
 BA:['Вдох — на опускании, выдох — на подъёме (это и есть усилие). Не задерживайте дыхание дольше 1–2 секунд.',
     'שאיפה — בירידה, נשיפה — בעלייה (זה המאמץ). לא לעצור את הנשימה יותר משנייה–שתיים.'],
 S:['Дышите ровно и спокойно: вдох носом на 3–4 счёта, выдох ртом на 4–5. Живот напряжён, но дыхание не задерживайте.',
    'לנשום בקצב רגוע ואחיד: שאיפה דרך האף 3–4 ספירות, נשיפה דרך הפה 4–5. הבטן מתוחה, אבל לא לעצור את הנשימה.'],
 R:['Ритм: вдох на 2–3 шага, выдох на 2–3 шага. Темп такой, чтобы вы могли говорить короткими фразами.',
    'קצב: שאיפה על 2–3 צעדים, נשיפה על 2–3 צעדים. הקצב כזה שאפשר לדבר במשפטים קצרים.']};
const SPEC={
 rdl:['Вдох перед наклоном и на спуске, выдох — когда выпрямляетесь. Спина прямая, живот напряжён.','שאיפה לפני ההתכופפות ובירידה, נשיפה בזמן ההתיישרות. הגב ישר, הבטן מתוחה.'],
 crunch:['Выдох — когда поднимаете корпус (живот втягивается), вдох — когда опускаетесь назад.','נשיפה — בהרמת פלג הגוף (הבטן נכנסת), שאיפה — בחזרה למטה.'],
 legRaise:['Выдох — поднимаете ноги, вдох — опускаете. Поясница прижата.','נשיפה — בהרמת הרגליים, שאיפה — בהורדה. הגב התחתון צמוד.'],
 calf:['Выдох — подъём на носки, вдох — опускание пятки.','נשיפה — עלייה על קצות האצבעות, שאיפה — ירידה.'],
 facePull:['Выдох — тянете канат к лицу, вдох — возвращаете руки вперёд.','נשיפה — משיכת הכבל אל הפנים, שאיפה — החזרת הידיים קדימה.'],
 backExt:['Выдох — поднимаетесь вверх, вдох — опускаетесь. Без рывков.','נשיפה — עלייה למעלה, שאיפה — ירידה. בלי תנופה.']};
const W={in:['ВДОХ','שאיפה'],out:['ВЫДОХ','נשיפה'],even:['Дышите ровно','לנשום בקצב אחיד'],rhythm:['Вдох 2–3 шага · выдох 2–3 шага','שאיפה 2–3 צעדים · נשיפה 2–3 צעדים']};
const SAY={in:['Вдох','שאיפה'],out:['Выдох','נשיפה']};
const L=lang=>lang==='he'?1:0;
function state(id,u){
  const d=DIR[id];if(!d||d==='S'||d==='R')return null;
  /* цикл: 0–.12 пауза A, .12–.48 A→B, .48–.6 пауза B, .6–.96 B→A, .96–1 пауза A */
  if(d==='AB')return(u>=.12&&u<.6)?'out':'in';
  return(u>=.6||u<.12)?'out':'in';
}
function text(id,lang){const d=DIR[id]||'AB';return (SPEC[id]||T[d])[L(lang)]}
function card(id,lang){return `<div class="brcard"><b>${lang==='he'?'נשימה':'Дыхание'}</b><span>${text(id,lang)}</span></div>`}
/* голос (необязательный, выключен по умолчанию) */
const canSpeak=typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
const KEY='yfit_voice';
function voiceOn(){try{return canSpeak&&localStorage.getItem(KEY)==='1'}catch(e){return false}}
function say(txt,lang){if(!canSpeak)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang=lang==='he'?'he-IL':'ru-RU';u.rate=1.05;speechSynthesis.speak(u)}catch(e){}}
function stop(){if(canSpeak)try{speechSynthesis.cancel()}catch(e){}}
function voiceBtn(lang){
  if(!canSpeak)return '';
  const on=voiceOn(),l=L(lang);
  return `<button class="ibtn vbtn ${on?'on':''}" data-act="voice" aria-pressed="${on}">${on?'🔊':'🔈'} ${l?(on?'קול: פעיל':'קול: כבוי'):(on?'Голос: вкл':'Голос: выкл')}</button>`;
}
function toggle(lang){
  const on=!voiceOn();try{localStorage.setItem(KEY,on?'1':'0')}catch(e){}
  if(on)say(lang==='he'?'הקול פועל':'Голос включён',lang);else stop();
  document.querySelectorAll('.vbtn').forEach(b=>{b.outerHTML=voiceBtn(lang)});
}
/* индикатор на фигуре: возвращает onTick для Fig.mount */
function ticker(holder,id,lang){
  const box=holder.parentElement;if(!box)return null;
  let bd=box.querySelector('.breath');
  if(!bd){bd=document.createElement('div');bd.className='breath';bd.setAttribute('aria-live','off');box.appendChild(bd)}
  const l=L(lang),d=DIR[id];
  if(d==='S'||d==='R'){bd.className='breath even';bd.innerHTML=`<span><i></i>${(d==='S'?W.even:W.rhythm)[l]}</span>`;return null}
  let cur='';
  return u=>{
    const s=state(id,u);if(s===cur)return;cur=s;
    bd.className='breath '+s;bd.innerHTML=`<span><i></i>${W[s][l]}</span>`;
    if(voiceOn())say(SAY[s][l],lang);
  };
}
function hide(holder){const b=holder.parentElement&&holder.parentElement.querySelector('.breath');if(b)b.remove()}
return{state,text,card,ticker,hide,stop,toggle,voiceBtn,voiceOn,canSpeak};
})();
