/* Yulia Fit — движок иллюстраций упражнений.
   Фигура строится из углов суставов (прямая кинематика) и плавно анимируется между двумя позами. */
const Fig=(function(){
const W=400,H=300,FLOOR=270;
const C={skin:'#eac5a3',skinD:'#c79c7b',top:'#d2ae55',topD:'#a98532',leg:'#5a4f46',legD:'#3a322c',shoe:'#f3ede2',shoeD:'#b9b0a2',
 hair:'#5a3523',hairD:'#3e2417',hl:'#ff4d63',steel:'#9a8f80',steelD:'#5f564b',plate:'#2a2521',gold:'#d2ae55',pad:'#3b342d',padL:'#4c443b'};
const R=Math.PI/180, dir=a=>[Math.cos(a*R),Math.sin(a*R)];
const mv=(p,a,l)=>{const d=dir(a);return[p[0]+d[0]*l,p[1]+d[1]*l]};
const ad=(p,q)=>[p[0]+q[0],p[1]+q[1]];
const sb=(p,q)=>[p[0]-q[0],p[1]-q[1]];
const f=n=>Math.round(n*10)/10;
const LEN={torso:68,thigh:62,shin:60,foot:22,ua:44,fa:40,neck:13};

/* ---------- примитивы ---------- */
function cap(p,q,r1,r2,fill,extra){
  const dx=q[0]-p[0],dy=q[1]-p[1],d=Math.hypot(dx,dy);
  if(d<Math.abs(r1-r2)+0.01){const r=Math.max(r1,r2),c=r1>=r2?p:q;return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="${fill}" ${extra||''}/>`}
  const an=Math.atan2(dy,dx),ph=Math.acos((r1-r2)/d);
  const P=(c,r,a)=>[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)];
  const a1=P(p,r1,an+ph),b1=P(q,r2,an+ph),b2=P(q,r2,an-ph),a2=P(p,r1,an-ph);
  const lg2=ph>Math.PI/2?1:0,lg1=ph<Math.PI/2?1:0;
  return `<path d="M${f(a1[0])} ${f(a1[1])}L${f(b1[0])} ${f(b1[1])}A${r2} ${r2} 0 ${lg2} 0 ${f(b2[0])} ${f(b2[1])}L${f(a2[0])} ${f(a2[1])}A${r1} ${r1} 0 ${lg1} 0 ${f(a1[0])} ${f(a1[1])}Z" fill="${fill}" ${extra||''}/>`;
}
const circ=(c,r,fill,extra)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="${fill}" ${extra||''}/>`;
const line=(a,b,w,col,extra)=>`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra||''}/>`;
const rect=(x,y,w,h,r,fill,extra)=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}" fill="${fill}" ${extra||''}/>`;
const plate=(c,r)=>circ(c,r,C.plate,`stroke="${C.gold}" stroke-width="2"`)+circ(c,r*0.42,'#15120f',`stroke="${C.steel}" stroke-width="1.5"`);
const db=(c)=>circ(c,8.5,C.plate,`stroke="${C.gold}" stroke-width="2"`)+circ(c,3,C.steel);
const dbV=(c)=>rect(c[0]-6,c[1]-11,12,22,4,C.plate,`stroke="${C.gold}" stroke-width="2"`);
const bench=(x1,x2,y)=>line([x1+16,y+9],[x1+16,FLOOR],5,C.steelD)+line([x2-16,y+9],[x2-16,FLOOR],5,C.steelD)+rect(x1,y,x2-x1,11,5.5,C.pad,`stroke="${C.padL}" stroke-width="1.5"`);
const floor=()=>`<rect x="0" y="${FLOOR}" width="${W}" height="${H-FLOOR}" fill="url(#flr)"/>`+line([0,FLOOR],[W,FLOOR],2,'rgba(210,174,85,.55)');
const mat=(x1,x2)=>rect(x1,FLOOR-6,x2-x1,6,3,'#3a2f55',`stroke="rgba(255,255,255,.15)" stroke-width="1"`);
const cable=(a,b)=>line(a,b,1.8,'#cfc4ae',`stroke-dasharray="0"`);
const pulley=(c)=>circ(c,8,'#2a2521',`stroke="${C.steel}" stroke-width="2.5"`)+circ(c,2.5,C.steel);
const post=(x,y1,y2)=>line([x,y1],[x,y2],8,C.steelD)+line([x,y1],[x,y2],3,'#6e6355');
const seat=(x1,x2,y)=>rect(x1,y,x2-x1,12,6,C.pad,`stroke="${C.padL}" stroke-width="1.5"`)+line([(x1+x2)/2,y+12],[(x1+x2)/2,FLOOR],6,C.steelD)+line([(x1+x2)/2-26,FLOOR-2],[(x1+x2)/2+26,FLOOR-2],6,C.steelD);
const back=(a,b)=>line(a,b,12,C.pad,`stroke="${C.padL}"`)+line(a,b,12,C.pad);

/* ---------- кинематика ---------- */
function solve(P,ex){
  const J={},an=ex.anchor,t=P.t,base=P.rel?(t+90):0;
  const ft=P.ft!==undefined?P.ft:25;
  const ua=P.ua+base,fa=P.fa+base,fua=(P.fua!==undefined?P.fua:P.ua)+base,ffa=(P.ffa!==undefined?P.ffa:P.fa)+base;
  if(an.type==='toe'){J.toe=an.p;J.ankle=sb(J.toe,mv([0,0],ft,LEN.foot));J.knee=sb(J.ankle,mv([0,0],P.sh,LEN.shin));J.hip=sb(J.knee,mv([0,0],P.th,LEN.thigh))}
  else if(an.type==='hip'){J.hip=an.p}
  else if(an.type==='wrist'){const el=sb(an.p,mv([0,0],fa,LEN.fa)),sh=sb(el,mv([0,0],ua,LEN.ua));J.hip=sb(sh,mv([0,0],t,LEN.torso))}
  J.sh=mv(J.hip,t,LEN.torso);
  if(an.type!=='toe'){J.knee=mv(J.hip,P.th,LEN.thigh);J.ankle=mv(J.knee,P.sh,LEN.shin);J.toe=mv(J.ankle,ft,LEN.foot)}
  const fth=P.fth!==undefined?P.fth:P.th,fsh=P.fsh!==undefined?P.fsh:P.sh,fft=P.fft!==undefined?P.fft:ft;
  const off=[-5,-1];
  J.fhip=ad(J.hip,[off[0],0]);J.fknee=mv(J.fhip,fth,LEN.thigh);J.fankle=mv(J.fknee,fsh,LEN.shin);J.ftoe=mv(J.fankle,fft,LEN.foot);
  J.elbow=mv(J.sh,ua,LEN.ua);J.wrist=mv(J.elbow,fa,LEN.fa);
  J.fsh=ad(J.sh,[-3,0]);J.felbow=mv(J.fsh,fua,LEN.ua);J.fwrist=mv(J.felbow,ffa,LEN.fa);
  J.fwd=dir(t+90);J.t=t;J.ft=ft;J.P=P;
  J.head=ad(mv(J.sh,t+(P.hd||0),LEN.neck+10),[0,0]);
  return J;
}

/* ---------- рисование тела (вид сбоку) ---------- */
function leg(hip,knee,ankle,toe,far){
  const lc=far?C.legD:C.leg, sk=far?C.skinD:C.skin, sc=far?C.shoeD:C.shoe;
  const heel=ad(ankle,mv([0,0],Math.atan2(toe[1]-ankle[1],toe[0]-ankle[0])/R+180,4));
  return cap(hip,knee,13,9,lc)+cap(knee,ankle,8.8,6,lc)+circ(knee,9,lc)+
    cap(ankle,toe,7,5,sc)+cap(heel,ankle,6,6,sc);
}
function arm(sh,el,wr,far){
  const sk=far?C.skinD:C.skin;
  return cap(sh,el,7.4,5.8,sk)+cap(el,wr,5.8,4.6,sk)+circ(el,5.8,sk)+circ(wr,5,sk);
}
function torsoSvg(J,hl){
  const t=J.t,h=J.hip,s=J.sh,f=J.fwd;
  const mid=ad(h,[(s[0]-h[0])*0.36,(s[1]-h[1])*0.36]);
  let o=cap(h,s,14,12,C.top);
  o+=cap(h,mid,15,13.8,C.leg);
  /* лямки / плечо */
  o+=circ(s,9.5,C.top);
  return o;
}
function headSvg(J){
  const f=J.fwd,c=J.head,t=J.t;
  const nk=cap(J.sh,c,5.2,5.2,C.skin);
  const tail0=ad(c,[-f[0]*9.5,-f[1]*9.5]);
  const te=ad(ad(tail0,[-f[0]*9,-f[1]*9]),[0,13]);const tailEnd=[te[0],Math.min(te[1],FLOOR-5)];
  const mid=ad(tail0,[(tailEnd[0]-tail0[0])*.5-f[0]*3,(tailEnd[1]-tail0[1])*.5]);
  const pony=`<path d="M${f2(tail0)}Q${f2(mid)} ${f2(tailEnd)}" stroke="${C.hair}" stroke-width="6.5" stroke-linecap="round" fill="none"/>`;
  return nk+pony+circ(ad(c,[-f[0]*1.8,-f[1]*1.8]),12.6,C.hair)+circ(ad(c,[f[0]*2.2,f[1]*2.2]),10.2,C.skin)+
    circ(ad(c,[f[0]*6.2,f[1]*5.6-1]),0.01,'none');
}
const f2=p=>f(p[0])+' '+f(p[1]);

/* подсветка работающих мышц */
function hlSvg(J,hl,op){
  if(!hl||!hl.length)return'';
  const col=C.hl,o=`opacity="${f(op)}"`,t=J.t,fw=J.fwd,uv=dir(t);
  let s='';
  const blob=(c,r)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="url(#hlg)" ${o}/>`;
  hl.forEach(k=>{
    if(k==='quad'||k==='ham'){s+=cap(J.hip,J.knee,12,8.4,col,`opacity="${f(op*.62)}"`)}
    else if(k==='calf'){s+=cap(J.knee,J.ankle,8,5.6,col,`opacity="${f(op*.62)}"`)}
    else if(k==='glute'){s+=blob(ad(J.hip,[-fw[0]*5,-fw[1]*5]),19)}
    else if(k==='chest'){s+=blob(ad(ad(J.sh,[-uv[0]*17,-uv[1]*17]),[fw[0]*5,fw[1]*5]),17)}
    else if(k==='back'){s+=blob(ad(ad(J.sh,[-uv[0]*22,-uv[1]*22]),[-fw[0]*3,-fw[1]*3]),19)}
    else if(k==='lowback'){s+=blob(ad(ad(J.hip,[uv[0]*18,uv[1]*18]),[-fw[0]*3,-fw[1]*3]),16)}
    else if(k==='abs'){s+=blob(ad(ad(J.hip,[uv[0]*26,uv[1]*26]),[fw[0]*5,fw[1]*5]),17)}
    else if(k==='delt'){s+=blob(J.sh,15)}
    else if(k==='biceps'){s+=blob(ad(mv(J.sh,0,0),[(J.elbow[0]-J.sh[0])*.45,(J.elbow[1]-J.sh[1])*.45]),12)}
    else if(k==='triceps'){s+=blob(ad(J.sh,[(J.elbow[0]-J.sh[0])*.45,(J.elbow[1]-J.sh[1])*.45]),12)}
    else if(k==='forearm'){s+=cap(J.elbow,J.wrist,5.2,4.2,col,o)}
  });
  return s;
}

/* ---------- вид спереди ---------- */
function frontFrame(ex,P,time,hlOp){
  const cx=200,sy=96,sw=31,hy=ex.seated?172:160,hw=17;
  const seated=!!ex.seated;
  let s='';
  const spr=P.leg||0, a=P.arm||0, bd=P.bend||0;
  /* ноги */
  const lg=(sd)=>{
    const hip=[cx+sd*hw,hy];
    let knee,ankle;
    if(seated){knee=[hip[0]+sd*Math.sin(spr*R)*62,hip[1]+16];ankle=[knee[0]+sd*3,knee[1]+66]}
    else{knee=[hip[0]+sd*Math.sin(spr*R)*55,hip[1]+Math.cos(spr*R)*55];ankle=[knee[0]+sd*Math.sin((spr+4)*R)*53,knee[1]+Math.cos((spr+4)*R)*53]}
    return {hip,knee,ankle};
  };
  const L=lg(-1),Rg=lg(1);
  const legSvg=(g,sd)=>cap(g.hip,g.knee,12,8.4,C.leg)+cap(g.knee,g.ankle,8,5.6,C.leg)+circ(g.knee,8.6,C.leg)+
    `<ellipse cx="${f(g.ankle[0]+sd*4)}" cy="${f(g.ankle[1]+4)}" rx="9" ry="5.5" fill="${C.shoe}"/>`;
  s+=legSvg(L,-1)+legSvg(Rg,1);
  /* корпус */
  const nh=[cx,sy-4];
  s+=`<path d="M${cx-sw} ${sy+2}Q${cx-sw-3} ${sy+34} ${cx-hw-3} ${hy}L${cx+hw+3} ${hy}Q${cx+sw+3} ${sy+34} ${cx+sw} ${sy+2}Z" fill="${C.top}"/>`;
  s+=`<path d="M${cx-hw-4} ${hy-18}L${cx+hw+4} ${hy-18}L${cx+hw+3} ${hy+4}L${cx-hw-3} ${hy+4}Z" fill="${C.leg}"/>`;
  /* руки */
  const armSvg=(sd)=>{
    const sh=[cx+sd*sw,sy+4];
    const el=[sh[0]+sd*Math.sin(a*R)*44,sh[1]+Math.cos(a*R)*44];
    const fb=a-bd; // предплечье чуть внутрь
    const wr=[el[0]+sd*Math.sin(fb*R)*40,el[1]+Math.cos(fb*R)*40];
    return {sh,el,wr,svg:cap(sh,el,7,5.4,C.skin)+cap(el,wr,5.4,4.4,C.skin)+circ(sh,8,C.top)+circ(el,5.4,C.skin)+circ(wr,4.8,C.skin)+(ex.dumb?`<g>${rect(wr[0]-9,wr[1]-4,18,8,3,C.plate,`stroke="${C.gold}" stroke-width="1.6"`)}</g>`:'')};
  };
  const A1=armSvg(-1),A2=armSvg(1);
  s+=A1.svg+A2.svg;
  /* голова */
  s+=cap([cx,sy+4],[cx,sy-14],5,5,C.skin)+circ([cx-0,sy-30],11.6,C.skin);
  s+=`<path d="M${cx-12} ${sy-30}A12 12 0 0 1 ${cx+12} ${sy-30}Q${cx+6} ${sy-40} ${cx} ${sy-36}Q${cx-6} ${sy-40} ${cx-12} ${sy-30}Z" fill="${C.hair}"/>`;
  s+=`<path d="M${cx+11} ${sy-34}Q${cx+20} ${sy-30} ${cx+16} ${sy-14}" stroke="${C.hair}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  /* подсветка */
  const blob=(c,r)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="url(#hlg)" opacity="${f(hlOp)}"/>`;
  (ex.hl||[]).forEach(k=>{
    if(k==='delt'){s+=blob(A1.sh,15)+blob(A2.sh,15)}
    if(k==='abductor'){s+=cap(L.hip,L.knee,12,8,C.hl,`opacity="${f(hlOp*.8)}"`)+cap(Rg.hip,Rg.knee,12,8,C.hl,`opacity="${f(hlOp*.8)}"`)+blob([cx-26,hy-4],18)+blob([cx+26,hy-4],18)}
  });
  let back='',frontL='';
  if(ex.seated){
    back+=rect(cx-52,hy+10,104,12,6,C.pad,`stroke="${C.padL}" stroke-width="1.5"`)+rect(cx-44,sy-6,88,160,14,C.pad,`opacity=".55"`)+line([cx,hy+22],[cx,FLOOR],7,C.steelD)+line([cx-40,FLOOR-2],[cx+40,FLOOR-2],6,C.steelD);
    /* подушки на внешней стороне коленей */
    [[L,-1],[Rg,1]].forEach(([g,sd])=>{frontL+=rect(g.knee[0]+sd*8-5,g.knee[1]-18,10,36,5,C.steel,`stroke="${C.plate}" stroke-width="1.5"`)});
  }
  return {back,body:s,front:frontL};
}

/* ---------- сцены (оборудование) для вида сбоку ---------- */
const SC={
 squat:J=>{const f=J.fwd,b=ad(ad(J.sh,[-f[0]*6,-f[1]*6]),mv([0,0],J.t,-0));
   const u=dir(J.t);return {b:'',f:plate(ad(ad(J.sh,[-f[0]*5,-f[1]*5]),[-u[0]*9,-u[1]*9]),16)}},
 goblet:J=>({b:'',f:dbV(ad(J.wrist,[0,6]))}),
 legPress:J=>{const h=J.hip,bk=mv(h,-135,92);const sl=mv(J.ankle,J.P.sh,10),pd=mv(sl,J.P.sh+90,46),pd2=mv(sl,J.P.sh-90,46);
   return {b:line(mv(h,-135,-12),bk,14,C.pad)+line(ad(h,[4,30]),mv(ad(h,[4,30]),-42,215),8,C.steelD)+line([h[0]-40,FLOOR-2],[h[0]+110,FLOOR-2],7,C.steelD)+
     rect(h[0]-26,h[1]+12,56,10,5,C.pad)+line([h[0],h[1]+22],[h[0],FLOOR],6,C.steelD),
     f:line(pd,pd2,12,C.pad,`stroke="${C.padL}"`)+line(pd,pd2,10,C.pad)}},
 rdl:J=>({b:'',f:plate(J.wrist,15)}),
 hipThrust:J=>{const h=J.hip;return {b:bench(66,186,224),f:plate(ad(h,[-J.fwd[0]*5,-J.fwd[1]*5]),15)}},
 lunge:J=>({b:'',f:db(J.wrist)}),
 legCurl:J=>{const h=J.hip,by=h[1]+16;return {b:bench(h[0]-110,h[0]+90,by)+line([h[0]-122,by+4],[h[0]-122,FLOOR],6,C.steelD)+line([h[0]-122,by+4],ad(J.ankle,[-14,-10]),7,C.steelD),f:circ(ad(J.ankle,[-2,0]),7,C.steel,`stroke="${C.plate}" stroke-width="2"`)}},
 legExt:J=>{const h=J.hip;return {b:back([h[0]-14,h[1]-86],[h[0]-14,h[1]+4])+seat(h[0]-30,h[0]+80,h[1]+14),f:rect(J.ankle[0]-4,J.ankle[1]-8,10,24,5,C.steel,`stroke="${C.plate}" stroke-width="1.5"`)}},
 calf:J=>({b:rect(J.toe[0]-26,FLOOR-14,52,14,3,C.pad,`stroke="${C.padL}" stroke-width="1.5"`),f:db(J.wrist)}),
 dbBench:J=>{const h=J.hip;return {b:bench(h[0]-110,h[0]+34,h[1]+13),f:db(J.wrist)}},
 incline:J=>{const h=J.hip;const s=mv(h,-140,98);return {b:seat(h[0]-24,h[0]+40,h[1]+12)+line(mv(h,-140,-6),s,13,C.pad,`stroke="${C.padL}"`)+line(mv(h,-140,-6),s,11,C.pad),f:db(J.wrist)}},
 shoulder:J=>{const h=J.hip;return {b:back([h[0]-14,h[1]-100],[h[0]-14,h[1]+4])+seat(h[0]-30,h[0]+66,h[1]+14),f:db(J.wrist)}},
 pulldown:J=>{const h=J.hip,pl=[h[0]+46,22];return {b:post(h[0]+62,20,FLOOR)+line([h[0]+62,22],pl,6,C.steelD)+pulley(pl)+seat(h[0]-26,h[0]+60,h[1]+14)+rect(h[0]-2,h[1]-24,70,10,5,C.pad,`stroke="${C.padL}"`),f:cable(ad(pl,[-8,6]),ad(J.wrist,[1,0]))+circ(J.wrist,4.5,C.steel)}},
 row:J=>{const h=J.hip,a=J.ankle,pl=[392,a[1]-6];return {b:rect(a[0]+12,a[1]+8,300,FLOOR-a[1]-8,3,C.pad,`stroke="${C.padL}"`)+seat(h[0]-26,h[0]+34,h[1]+14)+line([a[0]+14,a[1]-30],[a[0]+14,a[1]+10],7,C.steel),f:cable(pl,J.wrist)+circ(J.wrist,4.5,C.steel)}},
 dbRow:J=>{const w=J.fwrist;return {b:bench(w[0]-46,w[0]+60,w[1]+6),f:db(J.wrist)}},
 facePull:J=>{const pl=[372,J.sh[1]-4];return {b:post(386,pl[1]-30,FLOOR)+pulley(pl),f:cable(pl,J.wrist)+circ(J.wrist,4.5,C.steel)+circ(J.fwrist,4.5,C.steel)}},
 biceps:J=>({b:'',f:db(J.wrist)}),
 triceps:J=>{const pl=[J.sh[0]+58,24];return {b:post(J.sh[0]+76,20,FLOOR)+line([J.sh[0]+76,24],pl,6,C.steelD)+pulley(pl),f:cable(ad(pl,[7,2]),J.wrist)+rect(J.wrist[0]-10,J.wrist[1]-2.5,20,5,2.5,C.steel)}},
 plank:J=>({b:mat(J.toe[0]-24,J.wrist[0]+60),f:''}),
 crunch:J=>({b:mat(J.hip[0]-130,J.hip[0]+120),f:''}),
 legRaise:J=>({b:`<rect x="${J.wrist[0]-70}" y="${J.wrist[1]-12}" width="140" height="8" rx="4" fill="${C.steelD}"/>`+post(J.wrist[0]+66,J.wrist[1]-12,FLOOR+10)+post(J.wrist[0]-66,J.wrist[1]-12,FLOOR+10),f:circ(J.wrist,5,C.steel)}),
 backExt:J=>{const h=J.hip,a=mv(h,160,95);return {b:line(ad(h,[16,-6]),ad(a,[-10,6]),13,C.pad,`stroke="${C.padL}"`)+line(ad(h,[16,-6]),ad(a,[-10,6]),11,C.pad)+line(ad(h,[16,12]),[h[0]+16,FLOOR],6,C.steelD)+line([h[0]-68,a[1]+20],[h[0]-68,FLOOR],6,C.steelD)+line([h[0]-90,FLOOR-2],[h[0]+50,FLOOR-2],6,C.steelD),f:''}},
 cardio:J=>({b:'',f:''})
};

/* ---------- данные поз ---------- */
const EXD={
 squat:{anchor:{type:'toe',p:[200,FLOOR]},hl:['quad','glute'],
  A:{t:-88,th:90,sh:90,rel:1,ua:110,fa:-70},B:{t:-60,th:8,sh:117}},
 goblet:{anchor:{type:'toe',p:[200,FLOOR]},hl:['quad','glute'],
  A:{t:-90,th:90,sh:90,rel:1,ua:75,fa:-75},B:{t:-76,th:6,sh:116}},
 legPress:{anchor:{type:'hip',p:[130,210]},hl:['quad','glute'],
  A:{t:-135,th:-52,sh:-48,ft:-138,ua:40,fa:-10},B:{th:-96,sh:4,ft:-86}},
 rdl:{anchor:{type:'toe',p:[200,FLOOR]},hl:['ham','glute','lowback'],
  A:{t:-90,th:87,sh:93,ua:92,fa:90},B:{t:-24,th:64,sh:101,ua:96,fa:88}},
 hipThrust:{anchor:{type:'toe',p:[300,FLOOR]},hl:['glute','ham'],
  A:{t:-158,th:-38,sh:80,ua:22,fa:22},B:{t:-188,th:-3,sh:97,ua:-8,fa:-8}},
 lunge:{anchor:{type:'toe',p:[240,FLOOR]},hl:['quad','glute'],
  A:{t:-90,th:90,sh:90,ua:92,fa:90},B:{t:-88,th:2,sh:92,fth:102,fsh:195,fft:85,ua:92,fa:90}},
 legCurl:{anchor:{type:'hip',p:[250,196]},hl:['ham'],
  A:{t:0,th:180,sh:180,ft:150,ua:100,fa:60},B:{sh:282,ft:250}},
 legExt:{anchor:{type:'hip',p:[150,206]},hl:['quad'],
  A:{t:-94,th:2,sh:92,ft:5,ua:70,fa:20},B:{sh:2,ft:-80}},
 calf:{anchor:{type:'toe',p:[210,FLOOR-14]},hl:['calf'],
  A:{t:-90,th:90,sh:90,ft:20,ua:92,fa:90},B:{ft:78}},
 dbBench:{anchor:{type:'hip',p:[270,198]},hl:['chest','triceps','delt'],
  A:{t:180,th:22,sh:96,ft:10,rel:1,ua:170,fa:0},B:{ua:2,fa:0}},
 incline:{anchor:{type:'hip',p:[250,196]},hl:['chest','delt','triceps'],
  A:{t:-140,th:14,sh:96,ft:10,rel:1,ua:170,fa:0},B:{ua:2,fa:0}},
 shoulder:{anchor:{type:'hip',p:[170,200]},hl:['delt','triceps'],
  A:{t:-92,th:4,sh:92,ft:5,ua:100,fa:-85},B:{ua:-95,fa:-90}},
 lateral:{view:'front',dumb:1,hl:['delt'],A:{arm:6,bend:6,leg:4},B:{arm:84,bend:10,leg:4}},
 pulldown:{anchor:{type:'hip',p:[170,196]},hl:['back','biceps'],
  A:{t:-98,th:4,sh:92,ft:5,ua:-70,fa:-80},B:{t:-108,ua:112,fa:-52}},
 row:{anchor:{type:'hip',p:[160,196]},hl:['back','biceps'],
  A:{t:-76,th:-14,sh:6,ft:-84,ua:2,fa:2},B:{t:-92,ua:170,fa:16}},
 dbRow:{anchor:{type:'toe',p:[190,FLOOR]},hl:['back','biceps'],
  A:{t:-16,th:66,sh:100,ua:92,fa:90,fua:92,ffa:90},B:{ua:166,fa:92}},
 facePull:{anchor:{type:'toe',p:[190,FLOOR]},hl:['delt','back'],
  A:{t:-86,th:90,sh:90,ua:0,fa:0,fua:0,ffa:0},B:{ua:-168,fa:-12,fua:-168,ffa:-12}},
 biceps:{anchor:{type:'toe',p:[200,FLOOR]},hl:['biceps'],
  A:{t:-90,th:90,sh:90,ua:94,fa:90},B:{fa:-62}},
 triceps:{anchor:{type:'toe',p:[190,FLOOR]},hl:['triceps'],
  A:{t:-82,th:92,sh:90,ua:98,fa:-12},B:{fa:84}},
 plank:{anchor:{type:'toe',p:[50,FLOOR-2]},hl:['abs','delt'],
  A:{t:-12,th:168,sh:168,ft:84,ua:90,fa:0},B:{t:-14,th:170,sh:170}},
 crunch:{anchor:{type:'hip',p:[200,FLOOR-14]},hl:['abs'],
  A:{t:180,th:-50,sh:100,ft:10,rel:1,ua:62,fa:-150},B:{t:212}},
 legRaise:{scale:.86,anchor:{type:'wrist',p:[200,16]},hl:['abs'],
  A:{t:-90,th:90,sh:90,ft:60,ua:-90,fa:-90},B:{th:-4,sh:30,ft:-30}},
 abductor:{view:'front',seated:1,hl:['abductor'],A:{leg:10},B:{leg:40}},
 backExt:{anchor:{type:'hip',p:[225,150]},hl:['lowback','glute','ham'],
  A:{t:58,th:160,sh:160,ft:140,rel:1,ua:75,fa:-75},B:{t:-20}},
 cardio:{anchor:{type:'hip',p:[200,148]},hl:['quad','calf'],
  A:{t:-88,th:66,sh:84,ft:15,fth:108,fsh:104,fft:70,ua:35,fa:-30,fua:140,ffa:150},
  B:{th:108,sh:104,ft:70,fth:66,fsh:84,fft:15,ua:140,fa:150,fua:35,ffa:-30}}
};

/* ---------- интерполяция ---------- */
const KEYS=['t','th','sh','ft','ua','fa','fth','fsh','fft','fua','ffa','hd','arm','bend','leg'];
function full(ex,which){
  const A=ex.A,B=Object.assign({},ex.A,ex.B);
  const base=which==='A'?A:B;
  /* дальние конечности: если не заданы — следуют за ближними */
  return Object.assign({},base);
}
function mix(a,b,k){const o=Object.assign({},a);KEYS.forEach(x=>{if(a[x]!==undefined&&b[x]!==undefined)o[x]=a[x]+(b[x]-a[x])*k});
  /* far-ключи, заданные только в одной позе */
  return o}
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
/* цикл: пауза A, подъём, пауза B, опускание */
function phase(u){
  if(u<.12)return 0; if(u<.48)return ease((u-.12)/.36); if(u<.6)return 1; if(u<.96)return 1-ease((u-.6)/.36); return 0;
}
function poseAt(id,k){
  const ex=EXD[id],A=ex.A,Bo=ex.B||{},B=Object.assign({},A,Bo);
  const A2=Object.assign({},A),B2=Object.assign({},B);
  [['fth','th'],['fsh','sh'],['fft','ft'],['fua','ua'],['ffa','fa']].forEach(([fk,nk])=>{
    A2[fk]=A[fk]!==undefined?A[fk]:A[nk];
    B2[fk]=Bo[fk]!==undefined?Bo[fk]:(A[fk]!==undefined?A[fk]:B[nk]);
  });
  return mix(A2,B2,k);
}

/* ---------- кадр ---------- */
const DEFS=`<defs><radialGradient id="hlg"><stop offset="0" stop-color="${C.hl}" stop-opacity=".95"/><stop offset=".6" stop-color="${C.hl}" stop-opacity=".45"/><stop offset="1" stop-color="${C.hl}" stop-opacity="0"/></radialGradient>
<linearGradient id="flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d2ae55" stop-opacity=".16"/><stop offset="1" stop-color="#d2ae55" stop-opacity="0"/></linearGradient>
<radialGradient id="bgg" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#2a2218"/><stop offset="1" stop-color="#14110e"/></radialGradient></defs>`;

function frame(id,k,time,opts){
  opts=opts||{};
  const ex=EXD[id];const op=.5+.2*Math.sin((time||0)*3.2);
  let inner='';
  const P=poseAt(id,k);
  if(ex.view==='front'){
    const r=frontFrame(ex,P,time,op);inner=floor()+r.back+r.body+r.front;
  }else{
    const J=solve(P,ex),sc=SC[id](J);
    let body=arm(J.fsh,J.felbow,J.fwrist,1)+leg(J.fhip,J.fknee,J.fankle,J.ftoe,1);
    body+=torsoSvg(J)+leg(J.hip,J.knee,J.ankle,J.toe,0)+headSvg(J);
    const hlTop=hlSvg(J,ex.hl,op);
    body+=hlTop;
    body+=arm(J.sh,J.elbow,J.wrist,0);
    inner=(id==='legRaise'?'':floor())+(ex.scale?`<g transform="translate(200 150) scale(${ex.scale}) translate(-200 -150)">`:'')+sc.b+body+sc.f+(ex.scale?'</g>':'');
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label||''}" preserveAspectRatio="xMidYMid meet">${DEFS}<rect width="${W}" height="${H}" fill="url(#bgg)"/>${inner}</svg>`;
  return opts.uid?svg.replace(/(hlg|flr|bgg)/g,'$1'+opts.uid):svg;
}

/* ---------- анимация ---------- */
function mount(el,id,opts){
  opts=opts||{};
  let speed=opts.speed||1,playing=opts.autoplay!==false,t0=performance.now(),raf=0,acc=0,last=t0,cyc=opts.cycle||4200;
  function draw(now){
    const dt=now-last;last=now;if(playing)acc+=dt*speed;
    const u=(acc%cyc)/cyc;
    el.innerHTML=frame(id,phase(u),now/1000,opts);
    raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  return {play(){playing=true},pause(){playing=false},toggle(){playing=!playing;return playing},setSpeed(s){speed=s},get playing(){return playing},destroy(){cancelAnimationFrame(raf)}};
}
return {frame,mount,EXD,phase,solve,poseAt};
})();
if(typeof module!=='undefined')module.exports=Fig;
