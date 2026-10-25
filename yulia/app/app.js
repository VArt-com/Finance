/* Yulia Fit — приложение (PWA). Без фреймворков. */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let lang=LS.get('yfit_lang',null)||((navigator.language||'').toLowerCase().indexOf('he')===0?'he':'ru');
let theme=LS.get('yfit_theme','dark');
const t=k=>(T[lang][k]!==undefined?T[lang][k]:(T.ru[k]!==undefined?T.ru[k]:k));
const li=a=>lang==='he'?a[1]:a[0];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

const I={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
 prog:'<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4"/>',
 lib:'<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
 chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 moon:'<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
 dl:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
 check:'<path d="M5 12l5 5L20 7"/>',
 wa:'<path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.5A9 9 0 1 1 21 12z"/><path d="M8.5 9.5c0 3 3 6 6 6l1.5-1.5-2-1.2-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1.2-2z"/>',
 ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1"/>',
 share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4"/>',
 play:'<path d="M7 4l13 8-13 8z"/>',pause:'<path d="M8 4v16M16 4v16"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 web:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
};
const ic=(n,w)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const LOGO=`<svg viewBox="0 0 64 64" width="38" height="38" aria-hidden="true" style="border-radius:11px"><defs><linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ecd08a"/><stop offset="1" stop-color="#c39a3d"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="#14110e"/><rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="url(#lg1)" stroke-width="1.4" opacity=".55"/><path d="M19 17L32 37L45 17M32 37V53" stroke="url(#lg1)" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 15H52" stroke="#d2ae55" stroke-width="3" stroke-linecap="round"/><rect x="6" y="8" width="5" height="14" rx="2" fill="url(#lg1)"/><rect x="53" y="8" width="5" height="14" rx="2" fill="url(#lg1)"/><rect x="11" y="10" width="3.5" height="10" rx="1.5" fill="#a98532"/><rect x="49.5" y="10" width="3.5" height="10" rx="1.5" fill="#a98532"/></svg>`;

const NOWEIGHT=['plank','crunch','legRaise','cardio','backExt'];
const waUrl=txt=>`https://wa.me/${APP_CFG.WA}`+(txt?`?text=${encodeURIComponent(txt)}`:'');
const igUrl=`https://www.instagram.com/${APP_CFG.IG}/`;
const exName=id=>li(EXI[id].name);
const unit=s=>String(s).replace('{s}',' '+SEC[lang]).replace('{m}',' '+MIN[lang]);
function parseSets(s){const m=/^(\d+)×(.+)$/.exec(s);return m?{sets:+m[1],reps:unit(m[2])}:{sets:1,reps:unit(s)}}
function lvlDots(n){return `<span class="lvl" title="${t('level')}">${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`}
let uidN=0;
function thumb(id){return Fig.frame(id,1,0,{uid:'u'+(++uidN)})}
function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2800)}

/* ───────── состояние и история ───────── */
const S={tab:'home',prog:null,day:0,group:'all',q:''};
const hist=()=>LS.get('yfit_hist',[]);
const lastW=()=>LS.get('yfit_w',{});

/* ───────── модальные окна + кнопка «назад» ───────── */
const modals=[];
function pushModal(close){modals.push(close);history.pushState({m:modals.length},'')}
function popModal(){if(modals.length)history.back()}
window.addEventListener('popstate',()=>{const c=modals.pop();if(c)c()});

/* ───────── шапка и вкладки ───────── */
const TABS=[['home','tabHome','home'],['programs','tabProg','prog'],['lib','tabLib','lib'],['progress','tabProgress','chart'],['contact','tabContact','chat']];
function renderChrome(){
  document.documentElement.lang=lang;document.documentElement.dir=lang==='he'?'rtl':'ltr';
  document.documentElement.setAttribute('data-theme',theme);
  const mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.content=theme==='light'?'#f7f2e9':'#0d0c0b';
  document.title=lang==='he'?'Yulia Fit — תוכנית אימונים':'Yulia Fit — программа тренировок';
  $('#logoMark').innerHTML=LOGO;
  $('#tagline').textContent=t('tagline');
  $('#btnLang').textContent=t('lang');
  $('#btnTheme').innerHTML=ic(theme==='light'?'moon':'sun',2);
  const bi=$('#btnInstall');bi.innerHTML=ic('dl',2.2)+'<span>'+t('install')+'</span>';
  $('#tabs').innerHTML=TABS.map(([k,l,i])=>`<button class="tab ${S.tab===k?'on':''}" data-go="${k}">${ic(i,1.9)}<span>${t(l)}</span></button>`).join('');
  updateInstallBtn();
}

/* ───────── экраны ───────── */
function viewHome(){
  const nEx=Object.keys(EXI).length;
  const pc=PROGRAMS.map((p,i)=>progCard(p,i)).join('');
  return `<section class="view">
  <div class="hero"><img src="../img/hero.jpg" alt="Yulia" fetchpriority="high"/><div class="tx">
    <span class="badge">${t('brandLine')}</span>
    <h1>Yulia <em>Fit</em></h1>
    <p>${t('coachBlurb')}</p>
    <div class="cta"><button class="btn gold" data-go="programs">${t('homeStart')}</button>
    <a class="btn wa" target="_blank" rel="noopener" href="${waUrl(t('waText'))}">${ic('wa')}WhatsApp</a>
    <a class="btn ig" target="_blank" rel="noopener" href="${igUrl}">${ic('ig')}Instagram</a></div>
  </div></div>
  <div class="stats"><div class="stat"><b>${PROGRAMS.length}</b><span>${t('stats3')}</span></div><div class="stat"><b>${nEx}</b><span>${t('stats25')}</span></div><div class="stat"><b>3–5</b><span>${t('statsDays')}</span></div></div>
  <div class="sec"><h2>${t('homePrograms')}</h2><button data-go="programs">${t('tabProg')} →</button></div>
  <div class="pgrid">${pc}</div>
  <div class="sec"><h2>${t('rulesTitle')}</h2></div>
  <div class="rules">${RULES.map(r=>`<div class="rule"><b>${lang==='he'?r[1]:r[0]}</b><span>${lang==='he'?r[3]:r[2]}</span></div>`).join('')}</div>
  <p class="disc">${t('disclaimer')}</p><p class="foot">${t('copyright')}</p></section>`;
}
function progCard(p,i){
  const ids=[];p.plan.forEach(d=>d.ex.forEach(e=>{if(ids.indexOf(e[0])<0)ids.push(e[0])}));
  return `<button class="pcard" data-prog="${p.id}"><span class="num">${i+1}</span>
   <h3>${li(p.n)}</h3><div class="pmeta"><span class="chip sm">${p.days} ${t('days')}</span><span class="chip sm">${p.weeks} ${t('weeks')}</span><span class="chip sm">${li(p.lvl)}</span></div>
   <p>${li(p.goal)}</p><div class="thumbs">${ids.slice(0,5).map(id=>`<div class="th">${thumb(id)}</div>`).join('')}</div></button>`;
}
function viewPrograms(){
  if(!S.prog)return `<section class="view"><div class="sec"><h2>${t('homePrograms')}</h2></div><div class="pgrid">${PROGRAMS.map(progCard).join('')}</div><p class="disc">${t('disclaimer')}</p></section>`;
  const p=PROGRAMS.find(x=>x.id===S.prog)||PROGRAMS[0];const d=p.plan[Math.min(S.day,p.plan.length-1)];
  return `<section class="view"><button class="ibtn" data-act="progBack" style="margin-bottom:12px">${lang==='he'?'→':'←'} ${t('back')}</button>
  <div class="card" style="margin-bottom:14px"><h2 style="font-size:34px;color:var(--gold2)">${li(p.n)}</h2>
   <div class="pmeta" style="margin:10px 0"><span class="chip sm">${p.days} ${t('days')}</span><span class="chip sm">${p.weeks} ${t('weeks')}</span><span class="chip sm">${li(p.lvl)}</span></div>
   <p style="font-size:14.5px;margin-bottom:6px"><b style="color:var(--gold)">${t('goal')}:</b> ${li(p.goal)}</p>
   <p style="font-size:14.5px"><b style="color:var(--gold)">${t('forWho')}:</b> ${li(p.who)}</p></div>
  <div class="dtabs">${p.plan.map((x,i)=>`<button class="dtab ${i===S.day?'on':''}" data-day="${i}">${t('day')} ${i+1} · ${li(x.n)}</button>`).join('')}</div>
  ${d.ex.map((e,i)=>`<button class="exrow" data-ex="${e[0]}" data-ctx="prog">
    <span class="n">${i+1}</span><span class="im">${thumb(e[0])}</span>
    <span><span class="nm">${exName(e[0])}</span><span class="sub" style="display:block">${li(GROUPS[EXI[e[0]].g])} · ${li(EXI[e[0]].eq)}</span></span>
    <span class="sr">${unit(e[1])}</span></button>`).join('')}
  <button class="btn gold block" data-act="startWorkout" style="margin-top:8px;padding:16px">${ic('play',2)} ${t('startDay')}</button>
  <p class="disc">${t('disclaimer')}</p></section>`;
}
function viewLib(){
  const gk=Object.keys(GROUPS);
  const q=S.q.trim().toLowerCase();
  const ids=Object.keys(EXI).filter(id=>(S.group==='all'||EXI[id].g===S.group)&&(!q||EXI[id].name.join('|').toLowerCase().indexOf(q)>=0));
  return `<section class="view"><div class="sec"><h2>${t('homeLib')}</h2></div>
  <input class="search" id="q" type="search" placeholder="${t('search')}" value="${esc(S.q)}" autocomplete="off"/>
  <div class="chips" style="margin-bottom:14px"><button class="chip ${S.group==='all'?'on':''}" data-group="all">${t('all')}</button>${gk.map(k=>`<button class="chip ${S.group===k?'on':''}" data-group="${k}">${li(GROUPS[k])}</button>`).join('')}</div>
  <div class="lgrid" id="lgrid">${libCards(ids)}</div></section>`;
}
function libCards(ids){return ids.map(id=>`<button class="lcard" data-ex="${id}" data-ctx="lib"><div class="im">${thumb(id)}</div><div class="bd"><div class="nm">${exName(id)}</div><div class="sub">${li(GROUPS[EXI[id].g])} ${lvlDots(EXI[id].lvl)}</div></div></button>`).join('')}
function viewProgress(){
  const h=hist(),wk=Date.now()-7*864e5;
  const week=h.filter(x=>x.ts>wk).length,sets=h.reduce((a,x)=>a+x.sets,0);
  const loc=lang==='he'?'he-IL':'ru-RU';
  return `<section class="view"><div class="sec"><h2>${t('progTitle')}</h2></div>
  <div class="stats"><div class="stat"><b>${h.length}</b><span>${t('progWorkouts')}</span></div><div class="stat"><b>${week}</b><span>${t('progWeek')}</span></div><div class="stat"><b>${sets}</b><span>${t('progStreak')}</span></div></div>
  <div class="sec"><h2>${t('progHistory')}</h2></div>
  ${h.length?`<div class="hist">${h.slice().reverse().slice(0,60).map(x=>`<div class="hrow"><div class="hd"><span>${esc(lang==='he'?x.dn[1]:x.dn[0])}</span><small>${new Date(x.ts).toLocaleDateString(loc,{day:'numeric',month:'short'})}</small></div><div class="ln">${x.mins} ${t('min')} · ${x.sets} ${t('sets')}</div><div class="ln">${x.ex.map(e=>esc(EXI[e.id]?exName(e.id):e.id)+(e.w&&e.w.length?' '+e.w.join('/')+' '+t('kg'):'')).join(' · ')}</div></div>`).join('')}</div>
  <button class="btn block" data-act="clearHist" style="margin-top:16px">${ic('trash')} ${t('progClear')}</button>`:`<div class="card muted">${t('progEmpty')}</div>`}
  </section>`;
}
function viewContact(){
  return `<section class="view"><div class="sec"><h2>${t('contactTitle')}</h2></div>
  <div class="cwrap"><div class="card"><div class="coach"><img src="../img/about.jpg" alt="Yulia"/><div><h3 style="font-size:26px;color:var(--gold2)">Yulia</h3><p class="muted" style="font-size:14px">${t('coachRole')}</p></div></div>
   <p style="margin:14px 0;font-size:14.5px">${t('contactText')}</p>
   <div style="display:grid;gap:10px"><a class="btn wa block" target="_blank" rel="noopener" href="${waUrl(t('waText'))}">${ic('wa')} ${t('contactWA')}</a>
   <a class="btn ig block" target="_blank" rel="noopener" href="${igUrl}">${ic('ig')} ${t('contactIG')} @${esc(APP_CFG.IG)}</a>
   <a class="btn block" target="_blank" rel="noopener" href="${APP_CFG.SITE}">${ic('web')} ${t('contactSite')}</a></div>
   <p class="muted" style="font-size:12.5px;margin-top:12px">${t('freeFirst')}</p></div>
  <div class="card"><h3 style="font-size:24px;margin-bottom:8px">${t('installTitle')}</h3><p style="font-size:14.5px;color:var(--text2);margin-bottom:12px">${t('installText')}</p>
   <div style="display:grid;gap:10px"><button class="btn gold block" data-act="install" id="btnInstall2">${ic('dl')} ${t('install')}</button><button class="btn block" data-act="share">${ic('share')} ${t('share')}</button></div>
   <p class="muted" style="font-size:12.5px;margin-top:12px">${ic('check',2.4).replace('<svg','<svg width="14" height="14" style="vertical-align:-2px"')} ${t('offline')}</p></div></div>
  <p class="disc">${t('disclaimer')}</p><p class="foot">${t('copyright')} · v${APP_CFG.VERSION}</p></section>`;
}
function render(){
  const v=$('#view');
  const views={home:viewHome,programs:viewPrograms,lib:viewLib,progress:viewProgress,contact:viewContact};
  v.innerHTML=(views[S.tab]||viewHome)();
  renderChrome();
  if(S.tab==='lib'){const q=$('#q');q.addEventListener('input',()=>{S.q=q.value;const ids=Object.keys(EXI).filter(id=>(S.group==='all'||EXI[id].g===S.group)&&(!S.q.trim()||EXI[id].name.join('|').toLowerCase().indexOf(S.q.trim().toLowerCase())>=0));$('#lgrid').innerHTML=libCards(ids)})}
}
function go(tab,prog){
  S.tab=tab;if(tab==='programs'&&prog!==undefined){S.prog=prog;S.day=0}
  if(tab!=='programs')S.prog=null;
  if(location.hash!=='#/'+tab)history.replaceState(null,'','#/'+tab);
  render();window.scrollTo(0,0);
}

/* ───────── карточка упражнения ───────── */
let anim=null,sheetState=null;
function openSheet(id,ctx,idx){
  sheetState={id,ctx:ctx||[id],idx:idx||0,mode:'anim',speed:1};
  const first=!$('#ovSheet').classList.contains('show');
  drawSheet();
  $('#ovSheet').classList.add('show');
  if(first){pushModal(closeSheetUI)}
}
function closeSheetUI(){if(anim){anim.destroy();anim=null}$('#ovSheet').classList.remove('show');$('#sheet').innerHTML='';sheetState=null}
function drawSheet(){
  const {id,ctx,idx}=sheetState,e=EXI[id];
  const multi=ctx.length>1;
  $('#sheet').innerHTML=`<div class="bar"><span class="chip sm">${li(GROUPS[e.g])}</span><button class="xbtn" data-act="closeSheet" aria-label="${t('close')}">×</button></div>
  <div class="figbox" id="figBox"><span class="ybadge">Yulia Fit</span></div>
  <div class="ctrl"><div class="seg" id="modeSeg"><button data-mode="anim" class="on">▶ ${t('play')}</button><button data-mode="A">${t('poseA')}</button><button data-mode="B">${t('poseB')}</button></div>
   <div class="seg"><button data-speed="1" class="on">${t('normal')}</button><button data-speed="0.45">${t('slow')}</button></div></div>
  <div class="sbody"><h2>${exName(id)}</h2>
   <div class="kv"><div class="it"><b>${t('muscles')}</b><span>${li(e.mus)}</span></div>
   ${li(e.sec)!=='—'?`<div class="it"><b>${t('secondary')}</b><span>${li(e.sec)}</span></div>`:''}
   <div class="it"><b>${t('equipment')}</b><span>${li(e.eq)}</span></div>
   <div class="it"><b>${t('level')}</b><span>${lvlDots(e.lvl)}</span></div></div>
   <h3>${t('technique')}</h3><ol class="steps">${e.steps.map(s=>`<li>${li(s)}</li>`).join('')}</ol>
   <h3>${t('mistakes')}</h3><ul class="errs">${e.err.map(s=>`<li>${li(s)}</li>`).join('')}</ul>
   <div class="tip"><b>${t('coachTip')}</b>${li(e.tip)}</div>
   <div class="askrow"><a class="btn wa" target="_blank" rel="noopener" href="${waUrl(t('waEx')+exName(id))}">${ic('wa')} ${t('askWA')}</a><a class="btn ig" target="_blank" rel="noopener" href="${igUrl}">${ic('ig')} ${t('askIG')}</a></div></div>
  ${multi?`<div class="nav2"><button class="btn" data-act="exPrev" ${idx===0?'disabled style="opacity:.4"':''}>${lang==='he'?'→':'←'} ${t('prev')}</button><button class="btn gold" data-act="exNext" ${idx>=ctx.length-1?'disabled style="opacity:.4"':''}>${t('next')} ${lang==='he'?'←':'→'}</button></div>`:''}`;
  $('#sheet').scrollTop=0;
  startFig();
}
function startFig(){
  if(anim){anim.destroy();anim=null}
  const box=$('#figBox');if(!box)return;
  const {id,mode,speed}=sheetState;
  const holder=document.createElement('div');holder.style.cssText='position:absolute;inset:0';
  const old=$('#figInner');if(old)old.remove();
  holder.id='figInner';box.appendChild(holder);
  if(mode==='anim'){
    anim=Fig.mount(holder,id,{speed,uid:'sh',autoplay:!reduceMotion});
  }else{holder.innerHTML=Fig.frame(id,mode==='A'?0:1,0,{uid:'sh'})}
  $$('#modeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));
  $$('[data-speed]').forEach(b=>b.classList.toggle('on',+b.dataset.speed===speed));
}

/* ───────── тренировка ───────── */
let W=null,restTimer=null,restEnd=0,restTotal=0,pAnim=null,wake=null,audio=null;
function startWorkout(){
  const p=PROGRAMS.find(x=>x.id===S.prog),d=p.plan[S.day],lw=lastW();
  W={prog:p.id,day:S.day,idx:0,start:Date.now(),finished:false,
   dn:[p.n[0]+' · '+d.n[0],p.n[1]+' · '+d.n[1]],
   items:d.ex.map(e=>{const ps=parseSets(e[1]);const w=[];for(let i=0;i<ps.sets;i++)w.push(lw[e[0]]!==undefined?String(lw[e[0]]):'');
     return {id:e[0],sets:ps.sets,reps:ps.reps,rest:EXI[e[0]].rest,done:new Array(ps.sets).fill(false),w}})};
  $('#player').classList.add('show');pushModal(()=>{closePlayerUI()});
  try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{wake=l}).catch(()=>{})}catch(e){}
  drawPlayer();
}
function closePlayerUI(){
  if(pAnim){pAnim.destroy();pAnim=null}
  clearRest();$('#player').classList.remove('show');$('#player').innerHTML='';W=null;
  try{if(wake){wake.release();wake=null}}catch(e){}
}
function doneSets(){return W.items.reduce((a,it)=>a+it.done.filter(Boolean).length,0)}
function totalSets(){return W.items.reduce((a,it)=>a+it.sets,0)}
function drawPlayer(){
  if(!W)return;
  if(W.finished){drawDone();return}
  const it=W.items[W.idx],e=EXI[it.id],nw=NOWEIGHT.indexOf(it.id)>=0;
  if(pAnim){pAnim.destroy();pAnim=null}
  $('#player').innerHTML=`<div class="ph"><button class="xbtn" data-act="closePlayer" aria-label="${t('close')}">×</button><div class="pt"><b>${esc(lang==='he'?W.dn[1]:W.dn[0])}</b><small>${W.idx+1} / ${W.items.length}</small></div><button class="ibtn" data-act="playerInfo">${t('technique')}</button></div>
  <div class="pbar"><i id="pbar" style="width:${doneSets()/totalSets()*100}%"></i></div>
  <div class="pscroll"><div class="figbox" id="pfig" style="margin:0 auto;width:min(100%,calc(46vh*1.3334))"><span class="ybadge">Yulia Fit</span></div>
   <div class="pname"><h2>${exName(it.id)}</h2></div>
   <div class="pmeta2">${it.sets}×${esc(it.reps)}${it.rest?` · ${t('rest')} ${it.rest} ${SEC[lang]}`:''} · ${li(e.mus)}</div>
   <div id="psets"></div></div>
  <div class="rest" id="rest"><div class="ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="27"/><circle class="fg" id="rfg" cx="32" cy="32" r="27" stroke-dasharray="169.6" stroke-dashoffset="0"/></svg><b id="rnum">0</b></div><div class="rt"><b>${t('restTimer')}</b><span id="rtxt"></span></div><button class="btn" data-act="restAdd" style="padding:10px 12px">${t('addTime')}</button><button class="btn" data-act="restSkip" style="padding:10px 12px">${t('skip')}</button></div>
  <div class="pfoot"><button class="btn" data-act="pPrev" ${W.idx===0?'style="opacity:.4"':''}>${lang==='he'?'→':'←'}</button>${W.idx<W.items.length-1?`<button class="btn gold" data-act="pNext">${t('next')} ${lang==='he'?'←':'→'}</button>`:`<button class="btn gold" data-act="pFinish">${t('finish')}</button>`}</div>`;
  const f=$('#pfig'),h=document.createElement('div');h.style.cssText='position:absolute;inset:0';f.appendChild(h);
  pAnim=Fig.mount(h,it.id,{uid:'pl',autoplay:!reduceMotion});
  drawSets();
}
function drawSets(){
  const it=W.items[W.idx],nw=NOWEIGHT.indexOf(it.id)>=0;
  $('#psets').innerHTML=it.done.map((d,i)=>`<div class="setrow ${d?'done':''}" ${nw?'style="grid-template-columns:42px 1fr 52px"':''}>
   <span class="sn">${i+1}</span><span class="rp">${t('set')} · ${esc(it.reps)}</span>
   ${nw?'':`<input inputmode="decimal" data-w="${i}" value="${esc(it.w[i])}" placeholder="${t('kg')}" aria-label="${t('weight')}"/>`}
   <button class="chk" data-set="${i}" aria-label="${t('markDone')}">${ic('check',3)}</button></div>`).join('');
  const b=$('#pbar');if(b)b.style.width=(doneSets()/totalSets()*100)+'%';
}
function beep(){
  try{
    audio=audio||new (window.AudioContext||window.webkitAudioContext)();
    const n=audio.currentTime;[0,.22,.44].forEach((o,i)=>{const os=audio.createOscillator(),g=audio.createGain();os.frequency.value=i===2?1046:784;os.connect(g);g.connect(audio.destination);g.gain.setValueAtTime(.0001,n+o);g.gain.exponentialRampToValueAtTime(.25,n+o+.02);g.gain.exponentialRampToValueAtTime(.0001,n+o+.18);os.start(n+o);os.stop(n+o+.2)});
    if(navigator.vibrate)navigator.vibrate([120,80,120]);
  }catch(e){}
}
function startRest(sec){
  if(!sec)return;const el=$('#rest');if(!el)return;
  restEnd=Date.now()+sec*1000;restTotal=sec;el.classList.add('show');
  clearInterval(restTimer);restTimer=setInterval(tickRest,250);tickRest();
}
function tickRest(){
  const left=Math.max(0,Math.ceil((restEnd-Date.now())/1000));
  const n=$('#rnum');if(!n){clearRest();return}
  n.textContent=left;$('#rfg').style.strokeDashoffset=String(169.6*(1-left/restTotal));
  $('#rtxt').textContent=left>0?'':t('done');
  if(left<=0){clearInterval(restTimer);restTimer=null;beep();setTimeout(()=>{const r=$('#rest');if(r)r.classList.remove('show')},1500)}
}
function clearRest(){clearInterval(restTimer);restTimer=null;const r=$('#rest');if(r)r.classList.remove('show')}
function toggleSet(i){
  const it=W.items[W.idx];it.done[i]=!it.done[i];
  if(it.done[i]){
    audio=audio||(window.AudioContext||window.webkitAudioContext?new (window.AudioContext||window.webkitAudioContext)():null);
    const w=parseFloat(String(it.w[i]).replace(',','.'));if(!isNaN(w)){const lw=lastW();lw[it.id]=w;LS.set('yfit_w',lw)}
    const last=it.done.every(Boolean)&&W.idx===W.items.length-1;
    if(!last&&it.rest)startRest(it.rest);
  }
  drawSets();
}
function finishWorkout(){
  if(!W)return;
  if(doneSets()===0){toast(t('markDone'));return}
  const mins=Math.max(1,Math.round((Date.now()-W.start)/60000));
  const ex=W.items.filter(it=>it.done.some(Boolean)).map(it=>({id:it.id,w:NOWEIGHT.indexOf(it.id)>=0?[]:it.w.filter((x,i)=>it.done[i]&&x!=='')}));
  const h=hist();h.push({ts:Date.now(),prog:W.prog,day:W.day,dn:W.dn,mins,sets:doneSets(),ex});LS.set('yfit_hist',h.slice(-300));
  W.finished=true;W.mins=mins;drawDone();
}
function drawDone(){
  if(pAnim){pAnim.destroy();pAnim=null}clearRest();
  const sets=doneSets();
  let rep=`${t('reportHead')} · Yulia Fit\n${lang==='he'?W.dn[1]:W.dn[0]}\n${t('duration')}: ${W.mins} ${t('min')}, ${t('sets')}: ${sets}\n`;
  W.items.forEach(it=>{const n=it.done.filter(Boolean).length;if(!n)return;const ws=NOWEIGHT.indexOf(it.id)>=0?'':it.w.filter((x,i)=>it.done[i]&&x!=='').join('/');rep+=`• ${exName(it.id)}: ${n}×${it.reps}${ws?' ('+ws+' '+t('kg')+')':''}\n`});
  $('#player').innerHTML=`<div class="ph"><span></span><div class="pt"></div><button class="xbtn" data-act="closePlayer" aria-label="${t('close')}">×</button></div>
  <div class="pscroll"><div class="done-sc"><div class="big">🏆</div><h2>${t('workoutDone')}</h2><p class="muted">${t('greatJob')}</p>
  <div class="sums"><div class="stat"><b>${W.mins}</b><span>${t('min')}</span></div><div class="stat"><b>${sets}</b><span>${t('sets')}</span></div><div class="stat"><b>${W.items.filter(i=>i.done.some(Boolean)).length}</b><span>${t('exercises')}</span></div></div>
  <div style="display:grid;gap:10px"><a class="btn wa block" target="_blank" rel="noopener" href="${waUrl(rep)}">${ic('wa')} ${t('sendReport')}</a><button class="btn gold block" data-act="closePlayer">${t('finish')}</button></div></div></div>`;
}

/* ───────── установка PWA ───────── */
let deferred=null;
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isMac=()=>/Macintosh/i.test(navigator.userAgent)&&!isIOS();
function updateInstallBtn(){const b=$('#btnInstall');if(b)b.hidden=isStandalone();const b2=$('#btnInstall2');if(b2&&isStandalone())b2.style.display='none'}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;updateInstallBtn()});
window.addEventListener('appinstalled',()=>{deferred=null;toast(t('installed'));updateInstallBtn()});
async function doInstall(){
  if(deferred){deferred.prompt();try{await deferred.userChoice}catch(e){}deferred=null;return}
  const ins=isIOS()?t('installIOS'):(isMac()?t('installMac'):t('installOther'));
  $('#inst').innerHTML=`${LOGO.replace('width="38" height="38"','width="72" height="72"')}<h3>${t('installTitle')}</h3><p>${t('installText')}</p><p style="color:var(--gold2)">${ins}</p><button class="btn gold block" data-act="closeInst">OK</button>`;
  $('#ovInst').classList.add('show');pushModal(()=>$('#ovInst').classList.remove('show'));
}
async function doShare(){
  const url=location.origin+location.pathname.replace(/index\.html$/,'');
  try{if(navigator.share){await navigator.share({title:'Yulia Fit',text:t('shareText'),url});return}}catch(e){if(e&&e.name==='AbortError')return}
  try{await navigator.clipboard.writeText(url);toast(t('copied'))}catch(e){toast(url)}
}

/* ───────── события ───────── */
document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-go],[data-prog],[data-day],[data-ex],[data-group],[data-act],[data-mode],[data-speed],[data-set]');
  if(!el)return;
  if(el.dataset.go){go(el.dataset.go);return}
  if(el.dataset.prog){go('programs',el.dataset.prog);return}
  if(el.dataset.day!==undefined){S.day=+el.dataset.day;render();return}
  if(el.dataset.group){S.group=el.dataset.group;render();return}
  if(el.dataset.ex){
    const id=el.dataset.ex;let ctx;
    if(el.dataset.ctx==='prog'){const p=PROGRAMS.find(x=>x.id===S.prog);ctx=p.plan[S.day].ex.map(e=>e[0])}
    else if(el.dataset.ctx==='lib'){ctx=$$('#lgrid .lcard').map(c=>c.dataset.ex)}
    else ctx=[id];
    openSheet(id,ctx,Math.max(0,ctx.indexOf(id)));return;
  }
  if(el.dataset.mode){sheetState.mode=el.dataset.mode;startFig();return}
  if(el.dataset.speed){sheetState.speed=+el.dataset.speed;if(anim)anim.setSpeed(sheetState.speed);$$('[data-speed]').forEach(b=>b.classList.toggle('on',b===el));return}
  if(el.dataset.set!==undefined){toggleSet(+el.dataset.set);return}
  switch(el.dataset.act){
    case 'progBack':S.prog=null;render();break;
    case 'startWorkout':startWorkout();break;
    case 'closeSheet':popModal();break;
    case 'exPrev':if(sheetState.idx>0){sheetState.idx--;sheetState.id=sheetState.ctx[sheetState.idx];sheetState.mode='anim';drawSheet()}break;
    case 'exNext':if(sheetState.idx<sheetState.ctx.length-1){sheetState.idx++;sheetState.id=sheetState.ctx[sheetState.idx];sheetState.mode='anim';drawSheet()}break;
    case 'closePlayer':
      if(W&&!W.finished&&doneSets()>0){if(!confirm(lang==='he'?'לסיים את האימון בלי לשמור?':'Выйти без сохранения тренировки?'))break}
      popModal();break;
    case 'playerInfo':openSheet(W.items[W.idx].id,[W.items[W.idx].id],0);break;
    case 'pNext':if(W.idx<W.items.length-1){W.idx++;clearRest();drawPlayer()}break;
    case 'pPrev':if(W.idx>0){W.idx--;clearRest();drawPlayer()}break;
    case 'pFinish':finishWorkout();break;
    case 'restAdd':restEnd+=15000;restTotal+=15;tickRest();break;
    case 'restSkip':clearRest();break;
    case 'clearHist':if(confirm(t('progClearQ'))){LS.set('yfit_hist',[]);render()}break;
    case 'install':doInstall();break;
    case 'share':doShare();break;
    case 'closeInst':popModal();break;
  }
});
document.addEventListener('input',ev=>{
  const el=ev.target;if(el.dataset&&el.dataset.w!==undefined&&W){W.items[W.idx].w[+el.dataset.w]=el.value}
});
$('#ovSheet').addEventListener('click',ev=>{if(ev.target.id==='ovSheet')popModal()});
$('#ovInst').addEventListener('click',ev=>{if(ev.target.id==='ovInst')popModal()});
$('#btnInstall').addEventListener('click',doInstall);
$('#btnLang').addEventListener('click',()=>{lang=lang==='he'?'ru':'he';LS.set('yfit_lang',lang);render();if(sheetState)drawSheet();if(W)drawPlayer()});
$('#btnTheme').addEventListener('click',()=>{theme=theme==='light'?'dark':'light';LS.set('yfit_theme',theme);renderChrome()});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modals.length)popModal()});

/* ───────── старт ───────── */
function route(){
  const h=(location.hash||'').replace(/^#\/?/,'').split('/');
  const tab=['home','programs','lib','progress','contact'].indexOf(h[0])>=0?h[0]:'home';
  S.tab=tab;if(tab!=='programs')S.prog=null;
  render();
  if(h[0]==='ex'&&EXI[h[1]])openSheet(h[1],[h[1]],0);
}
window.addEventListener('hashchange',()=>{if(!modals.length)route()});
route();

/* офлайн-режим: service worker */
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(()=>{});});
}
window.__yfit={S,go,openSheet};
})();
