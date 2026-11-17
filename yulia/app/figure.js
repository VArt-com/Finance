/* Yulia Fit — движок иллюстраций упражнений.
   Фигура строится из углов суставов (прямая кинематика) и плавно анимируется между двумя позами. */
const Fig=(function(){
const W=400,H=300,FLOOR=270;
const C={skin:'#eec9a8',skinD:'#c99f7e',shade:'rgba(92,48,20,.13)',hi:'rgba(255,245,230,.16)',line:'rgba(40,22,10,.38)',
 top:'#d2ae55',topD:'#a98532',leg:'#4a413a',legD:'#2f2924',legL:'#6a5c52',shoe:'#f3ede2',shoeD:'#b9b0a2',
 hair:'#5a3523',hairD:'#3e2417',hairHi:'#9a6a47',hl:'#ff4d63',steel:'#9a8f80',steelD:'#5f564b',plate:'#2a2521',gold:'#d2ae55',pad:'#3b342d',padL:'#4c443b'};
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


/* ---------- формы тела: контур по профилю [позиция 0..1, ширина спереди, ширина сзади] ---------- */
const lerp=(a,b,k)=>a+(b-a)*k;
const f2=p=>f(p[0])+' '+f(p[1]);
function interp(pr,t){
  if(t<=pr[0][0])return[pr[0][1],pr[0][2]];
  for(let i=1;i<pr.length;i++){
    if(t<=pr[i][0]){const a=pr[i-1],b=pr[i];let k=(t-a[0])/(b[0]-a[0]);k=k*k*(3-2*k);return[lerp(a[1],b[1],k),lerp(a[2],b[2],k)]}
  }
  const l=pr[pr.length-1];return[l[1],l[2]];
}
function outline(p,q,pr,t0,t1,fs,pad,N){
  const dx=q[0]-p[0],dy=q[1]-p[1],n=dir(Math.atan2(dy,dx)/R+fs),A=[],B=[];
  for(let i=0;i<=N;i++){
    const t=t0+(t1-t0)*i/N,w=interp(pr,t),c=[p[0]+dx*t,p[1]+dy*t];
    A.push([c[0]+n[0]*(w[0]+pad),c[1]+n[1]*(w[0]+pad)]);
    B.push([c[0]-n[0]*(w[1]+pad),c[1]-n[1]*(w[1]+pad)]);
  }
  return A.concat(B.reverse());
}
/* fs: -90 для конечностей, +90 для торса/шеи (где «перед» тела) */
function shp(p,q,pr,fill,o){
  o=o||{};
  const N=o.N||9,pts=outline(p,q,pr,o.t0||0,o.t1===undefined?1:o.t1,o.fs===undefined?-90:o.fs,o.pad||0,N);
  let d=`<path d="M${pts.map(f2).join('L')}Z" fill="${fill}"/>`;
  if(o.stroke!==false){
    /* контур только по бокам, без линий на стыках суставов */
    const A=pts.slice(0,N+1),B=pts.slice(N+1).reverse();
    const st=`fill="none" stroke="${C.line}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"`;
    d+=`<path d="M${A.map(f2).join('L')}" ${st}/><path d="M${B.map(f2).join('L')}" ${st}/>`;
  }
  return d;
}
function edge(p,q,pr,t,fs,pad){
  const dx=q[0]-p[0],dy=q[1]-p[1],n=dir(Math.atan2(dy,dx)/R+fs),w=interp(pr,t),c=[p[0]+dx*t,p[1]+dy*t];
  return[[c[0]+n[0]*(w[0]+pad),c[1]+n[1]*(w[0]+pad)],[c[0]-n[0]*(w[1]+pad),c[1]-n[1]*(w[1]+pad)]];
}
const halfBack=pr=>pr.map(r=>[r[0],0,r[2]]);
const halfFront=pr=>pr.map(r=>[r[0],r[1]*.7,-r[1]*.28]);
/* объём: тень на обратной стороне + блик на передней */
const vol=(p,q,pr,o)=>shp(p,q,halfBack(pr),C.shade,Object.assign({stroke:false},o))+shp(p,q,halfFront(pr),C.hi,Object.assign({stroke:false},o));
const sym=pr=>pr.map(r=>{const m=(r[1]+r[2])/2;return[r[0],m,m]});
function smoothClosed(p){
  const n=p.length;let d='M'+f2(p[0]);
  for(let i=0;i<n;i++){
    const p0=p[(i-1+n)%n],p1=p[i],p2=p[(i+1)%n],p3=p[(i+2)%n];
    const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+='C'+f2(c1)+' '+f2(c2)+' '+f2(p2);
  }
  return d+'Z';
}
/* профили: спереди / сзади (квадрицепс, бицепс, икра, широчайшие, грудь...) */
const PR={
  thigh:[[0,12.5,14.5],[.28,14.2,13],[.6,12.4,10.8],[.85,9.2,8.8],[1,7.6,7.6]],
  shin:[[0,7.4,8.4],[.24,6.9,10.6],[.5,5.8,8.2],[.8,4.9,5.7],[1,4.2,4.4]],
  ua:[[0,8.6,8.4],[.25,8.2,8],[.5,7.7,7.2],[.8,6.1,6.3],[1,5.2,5.4]],
  fa:[[0,6,5.8],[.2,6.9,6],[.5,5.6,5.1],[.85,4,4],[1,3.6,3.6]],
  torso:[[0,11.5,15],[.18,10.4,11.4],[.38,9.8,10.4],[.58,12.4,12.2],[.78,14.6,12.8],[.92,12.6,11.4],[1,9.6,9.6]],
  neck:[[0,6.2,7.6],[1,5.2,5.8]]
};

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
  J.fwd=dir(t+90);J.t=t;J.ft=ft;J.fft=fft;J.P=P;
  J.head=ad(mv(J.sh,t+(P.hd||0),LEN.neck+10),[0,0]);
  return J;
}
/* ---------- рисование тела (вид сбоку) ---------- */
function shoe(toe,ft,far){
  const phi=ft-25,A=dir(phi),U=dir(phi-90);
  const P=(x,y)=>[toe[0]+A[0]*x+U[0]*y,toe[1]+A[1]*x+U[1]*y];
  const up=far?C.shoeD:C.shoe,sole=far?'#cfc7b8':'#ffffff',ac=far?C.topD:C.gold;
  let s=`<path d="M${f2(P(-25.5,0))}L${f2(P(2,0))}C${f2(P(6,0))} ${f2(P(8.2,2))} ${f2(P(7.6,4.6))}C${f2(P(7.2,6.4))} ${f2(P(5,7.4))} ${f2(P(2,8))}C${f2(P(-3,9))} ${f2(P(-8,10))} ${f2(P(-11,12.4))}C${f2(P(-13,14))} ${f2(P(-15,16.6))} ${f2(P(-17.5,17.4))}L${f2(P(-22,17))}C${f2(P(-25,16.2))} ${f2(P(-27.2,12))} ${f2(P(-27.2,7))}C${f2(P(-27.2,3))} ${f2(P(-26.6,.8))} ${f2(P(-25.5,0))}Z" fill="${up}" stroke="${C.line}" stroke-width=".9" stroke-linejoin="round"/>`;
  s+=line(P(-25,1.5),P(5.5,1.5),3.2,sole,`stroke-opacity="1"`);
  s+=`<path d="M${f2(P(-22,6.4))}Q${f2(P(-12,5.4))} ${f2(P(-2,9.4))}" stroke="${ac}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  s+=line(P(-6,10.4),P(-8.6,7.6),1,C.shoeD)+line(P(-9.4,11.8),P(-11.8,9),1,C.shoeD);
  return s;
}
function leg(J,far){
  const hip=far?J.fhip:J.hip,knee=far?J.fknee:J.knee,ankle=far?J.fankle:J.ankle,toe=far?J.ftoe:J.toe,ft=far?J.fft:J.ft;
  const sk=far?C.skinD:C.skin,sh=far?C.legD:C.leg,hm=far?C.legD:C.legL;
  let s=shp(knee,ankle,PR.shin,sk)+shp(hip,knee,PR.thigh,sk)+circ(knee,6.6,sk);
  s+=vol(knee,ankle,PR.shin,{t0:.14})+vol(hip,knee,PR.thigh,{t1:.88});
  s+=shoe(toe,ft,far);
  /* шорты до середины бедра */
  s+=shp(hip,knee,PR.thigh,sh,{t1:.47,pad:.9});
  const e=edge(hip,knee,PR.thigh,.47,-90,.9);
  s+=line(e[0],e[1],1.6,hm);
  return s;
}
function hand(el,wr,far){
  const sk=far?C.skinD:C.skin,a=Math.atan2(wr[1]-el[1],wr[0]-el[0])/R,D=dir(a),N=dir(a-90);
  const p0=sb(wr,[D[0]*3,D[1]*3]),p1=ad(wr,[D[0]*6,D[1]*6]);
  let s=shp(p0,p1,[[0,4,4],[.5,5,4.8],[1,3.8,3.8]],sk,{N:6});
  s+=circ(p1,3.9,sk);
  const t0=ad(wr,[N[0]*3.4,N[1]*3.4]),t1=ad(p1,[N[0]*4,N[1]*4]);
  s+=cap(t0,t1,2.1,1.7,sk,`stroke="${C.line}" stroke-width=".7"`);
  return s;
}
function arm(sh,el,wr,far){
  const sk=far?C.skinD:C.skin;
  let s=circ(sh,8.6,sk);
  s+=shp(sh,el,PR.ua,sk)+shp(el,wr,PR.fa,sk)+circ(el,5,sk);
  s+=vol(sh,el,PR.ua)+vol(el,wr,PR.fa)+hand(el,wr,far);
  return s;
}
const tp=(J,t,off)=>[J.hip[0]+(J.sh[0]-J.hip[0])*t+J.fwd[0]*off,J.hip[1]+(J.sh[1]-J.hip[1])*t+J.fwd[1]*off];
function torsoSvg(J){
  const h=J.hip,s=J.sh;
  let o=shp(h,s,PR.torso,C.skin,{fs:90})+vol(h,s,PR.torso,{fs:90});
  /* кубики пресса — лёгкая линия по центру живота */
  o+=line(tp(J,.2,3),tp(J,.5,3.6),.9,C.shade);
  /* спортивный топ */
  o+=shp(h,s,PR.torso,C.top,{fs:90,t0:.56,t1:.99,pad:.9});
  o+=shp(h,s,halfBack(PR.torso),'rgba(0,0,0,.12)',{fs:90,t0:.56,t1:.99,pad:.9,stroke:false});
  const e=edge(h,s,PR.torso,.56,90,.9);
  o+=line(e[0],e[1],1.6,C.topD);
  /* линия под грудью */
  const u=dir(J.t);
  o+=`<path d="M${f2(tp(J,.62,13.2))}Q${f2(tp(J,.58,9))} ${f2(tp(J,.6,3))}" stroke="${C.topD}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".7"/>`;
  return o;
}
function pelvisSvg(J){
  const h=J.hip,F=J.fwd;
  const u0=dir(J.t);let o=circ(ad(h,[-F[0]*3.5-u0[0]*1.5,-F[1]*3.5-u0[1]*1.5]),12.2,C.leg);
  o+=shp(h,J.sh,PR.torso,C.leg,{fs:90,t0:0,t1:.15,pad:.9});
  const e=edge(h,J.sh,PR.torso,.15,90,.9);
  o+=line(e[0],e[1],2,C.legL);
  return o;
}
function headSvg(J){
  const c=J.head,a=J.t+(J.P.hd||0),U=dir(a),F=dir(a+90);
  const pt=(x,y)=>[c[0]+F[0]*x+U[0]*y,c[1]+F[1]*x+U[1]*y];
  let s='';
  /* шея */
  const nb=ad(J.sh,[-F[0]*1,-F[1]*1]);
  s+=shp(nb,pt(0,-8),PR.neck,C.skin,{fs:90})+vol(nb,pt(0,-8),PR.neck,{fs:90});
  /* хвост — висит под действием «гравитации» */
  const t0=pt(-10.8,5.5),back=[-F[0],-F[1]];
  const end=[t0[0]+back[0]*9,Math.min(t0[1]+back[1]*9+28,FLOOR-6)];
  const ctl=[t0[0]+back[0]*15,t0[1]+back[1]*15+4];
  const L=[],Rr=[];
  for(let i=0;i<=8;i++){
    const t=i/8,u=1-t;
    const p=[u*u*t0[0]+2*u*t*ctl[0]+t*t*end[0],u*u*t0[1]+2*u*t*ctl[1]+t*t*end[1]];
    const d=[2*u*(ctl[0]-t0[0])+2*t*(end[0]-ctl[0]),2*u*(ctl[1]-t0[1])+2*t*(end[1]-ctl[1])];
    const dl=Math.hypot(d[0],d[1])||1,n=[-d[1]/dl,d[0]/dl],w=lerp(4.6,.9,t)+1.6*Math.sin(Math.PI*t);
    L.push([p[0]+n[0]*w,p[1]+n[1]*w]);Rr.push([p[0]-n[0]*w,p[1]-n[1]*w]);
  }
  s+=`<path d="M${L.concat(Rr.reverse()).map(f2).join('L')}Z" fill="${C.hair}" stroke="${C.hairD}" stroke-width=".7" stroke-linejoin="round"/>`;
  /* лицо в профиль */
  const face=[[-10.5,2],[-9,9],[-3,13],[4,11.5],[8.5,7],[9.2,3.6],[10.4,.4],[12.6,-2.2],[9.9,-3.8],[10.4,-5.4],[9.6,-6.8],[8.6,-8.8],[6.2,-11.4],[1.2,-11.6],[-4.6,-8.4],[-9.6,-3.4]].map(p=>pt(p[0],p[1]));
  s+=`<path d="${smoothClosed(face)}" fill="${C.skin}" stroke="${C.line}" stroke-width=".9" stroke-linejoin="round"/>`;
  s+=circ(pt(5,-3.4),3.4,'rgba(232,110,110,.2)');
  /* волосы */
  const hair=[[8.6,6.6],[4.5,12.6],[-3.2,14.4],[-10.6,9.5],[-12.6,1.5],[-10.2,-6.2],[-6.2,-6.8],[-3.4,-1.2],[-2.6,3.2],[2.6,6.4]].map(p=>pt(p[0],p[1]));
  s+=`<path d="${smoothClosed(hair)}" fill="${C.hair}" stroke="${C.hairD}" stroke-width=".7"/>`;
  s+=`<path d="M${f2(pt(-8.6,8))}Q${f2(pt(-2,13.4))} ${f2(pt(4.4,11))}" stroke="${C.hairHi}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".55"/>`;
  /* ухо, глаз, бровь, губы */
  s+=circ(pt(-2.2,-1.8),2.6,C.skinD,`stroke="${C.line}" stroke-width=".6"`);
  s+=line(pt(4.4,5),pt(8.4,5.3),1.3,C.hairD);
  s+=`<ellipse cx="${f(pt(6,2.4)[0])}" cy="${f(pt(6,2.4)[1])}" rx="1.25" ry="1.4" fill="#2b1a12" transform="rotate(${f(a+90)} ${f(pt(6,2.4)[0])} ${f(pt(6,2.4)[1])})"/>`;
  s+=line(pt(9,-5.8),pt(10.2,-5.9),1.4,'#b0595f');
  /* резинка */
  s+=circ(t0,2.3,C.gold,`stroke="${C.topD}" stroke-width=".6"`);
  return s;
}

/* подсветка работающих мышц */
function hlSvg(J,hl,op){
  if(!hl||!hl.length)return'';
  const col=C.hl,o=`opacity="${f(op)}"`;
  let s='';
  const blob=(c,r)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="url(#hlg)" ${o}/>`;
  const fillShape=(p,q,pr,t0,t1,k)=>shp(p,q,pr,col,{t0:t0||0,t1:t1===undefined?1:t1,stroke:false,pad:.5}).replace('/>',` opacity="${f(op*(k||.62))}"/>`);
  const nU=dir(Math.atan2(J.elbow[1]-J.sh[1],J.elbow[0]-J.sh[0])/R-90);
  const mid=[(J.sh[0]+J.elbow[0])/2,(J.sh[1]+J.elbow[1])/2];
  hl.forEach(k=>{
    if(k==='quad'||k==='ham'){
      const nT=dir(Math.atan2(J.knee[1]-J.hip[1],J.knee[0]-J.hip[0])/R-90),sg=k==='quad'?1:-1;
      [.32,.56,.8].forEach((t,i)=>{s+=blob([J.hip[0]+(J.knee[0]-J.hip[0])*t+nT[0]*3.5*sg,J.hip[1]+(J.knee[1]-J.hip[1])*t+nT[1]*3.5*sg],i===1?15:12.5)})}
    else if(k==='calf'){
      const nS=dir(Math.atan2(J.ankle[1]-J.knee[1],J.ankle[0]-J.knee[0])/R+90);
      [.2,.42].forEach(t=>{s+=blob([J.knee[0]+(J.ankle[0]-J.knee[0])*t+nS[0]*3.2,J.knee[1]+(J.ankle[1]-J.knee[1])*t+nS[1]*3.2],t<.3?11:8.5)})}
    else if(k==='glute'){s+=blob(ad(J.hip,[-J.fwd[0]*5.5,-J.fwd[1]*5.5]),19)}
    else if(k==='chest'){s+=blob(tp(J,.76,7),15)}
    else if(k==='back'){s+=blob(tp(J,.62,-6),18)}
    else if(k==='lowback'){s+=blob(tp(J,.14,-7),14)}
    else if(k==='abs'){s+=blob(tp(J,.34,5),14)}
    else if(k==='delt'){s+=blob(J.sh,14)}
    else if(k==='biceps'){s+=blob(ad(mid,[nU[0]*3.5,nU[1]*3.5]),11)}
    else if(k==='triceps'){s+=blob(ad(mid,[-nU[0]*3.5,-nU[1]*3.5]),11)}
    else if(k==='forearm'){s+=blob([(J.elbow[0]+J.wrist[0])/2,(J.elbow[1]+J.wrist[1])/2],9)}
  });
  return s;
}

/* ---------- вид спереди ---------- */
function frontFrame(ex,P,time,hlOp){
  const seated=!!ex.seated,cx=200,hw=15.5,sw=30,hy=seated?172:146,sy=hy-66;
  const spr=P.leg||0,a=P.arm||0,bd=P.bend||0;
  const SIM={thigh:sym(PR.thigh),shin:sym(PR.shin),ua:sym(PR.ua),fa:sym(PR.fa)};
  let s='';
  const lg=sd=>{
    const hip=[cx+sd*hw,hy];let knee,ankle;
    if(seated){knee=[hip[0]+sd*Math.sin(spr*R)*62,hip[1]+16];ankle=[knee[0]+sd*3,knee[1]+66]}
    else{knee=[hip[0]+sd*Math.sin(spr*R)*60,hip[1]+Math.cos(spr*R)*60];ankle=[knee[0]+sd*Math.sin((spr+4)*R)*58,knee[1]+Math.cos((spr+4)*R)*58]}
    return{hip,knee,ankle};
  };
  const Lg=lg(-1),Rg=lg(1);
  const legSvg=(g,sd)=>{
    let o=shp(g.knee,g.ankle,SIM.shin,C.skin)+shp(g.hip,g.knee,SIM.thigh,C.skin)+circ(g.knee,7.3,C.skin);
    o+=`<ellipse cx="${f(g.ankle[0]+sd*2.5)}" cy="${f(g.ankle[1]+4.5)}" rx="9.6" ry="6" fill="${C.shoe}" stroke="${C.line}" stroke-width=".9"/>`;
    o+=line([g.ankle[0]+sd*2.5-8,g.ankle[1]+8],[g.ankle[0]+sd*2.5+8,g.ankle[1]+8],2.4,'#fff');
    o+=shp(g.hip,g.knee,SIM.thigh,C.leg,{t1:.47,pad:.9});
    const e=edge(g.hip,g.knee,SIM.thigh,.47,-90,.9);o+=line(e[0],e[1],1.6,C.legL);
    return o;
  };
  s+=legSvg(Lg,-1)+legSvg(Rg,1);
  /* корпус: V-образный торс, талия */
  const half=[[sw-3,2],[sw-3.5,12],[26.5,28],[21,44],[17.6,56],[18.6,hy-sy-14],[20.5,hy-sy-2]];
  const lp=half.map(p=>[cx-p[0],sy+p[1]]),rp=half.map(p=>[cx+p[0],sy+p[1]]).reverse();
  s+=`<path d="${smoothClosed(lp.concat(rp))}" fill="${C.skin}" stroke="${C.line}" stroke-width=".9"/>`;
  s+=`<path d="M${cx-6} ${sy-12}L${cx-sw+2} ${sy+4}L${cx+sw-2} ${sy+4}L${cx+6} ${sy-12}Z" fill="${C.skin}"/>`;
  /* пресс */
  s+=line([cx,sy+42],[cx,hy-20],.9,C.shade);
  [48,56,64].forEach(d=>{if(sy+d<hy-18)s+=line([cx-6,sy+d],[cx+6,sy+d],.8,C.shade)});
  /* шорты */
  s+=`<path d="M${cx-22} ${hy-16}Q${cx} ${hy-11} ${cx+22} ${hy-16}L${cx+25} ${hy+9}Q${cx} ${hy+16} ${cx-25} ${hy+9}Z" fill="${C.leg}" stroke="${C.line}" stroke-width=".9"/>`;
  s+=line([cx-21,hy-15.5],[cx+21,hy-15.5],2,C.legL);
  s+=shp(Lg.hip,Lg.knee,SIM.thigh,C.leg,{t1:.47,pad:.9})+shp(Rg.hip,Rg.knee,SIM.thigh,C.leg,{t1:.47,pad:.9});
  /* топ */
  s+=`<path d="M${cx-sw+3} ${sy+4}L${cx-14} ${sy-1}Q${cx} ${sy+17} ${cx+14} ${sy-1}L${cx+sw-3} ${sy+4}L${cx+26} ${sy+18}L${cx+21.5} ${sy+38}Q${cx} ${sy+42} ${cx-21.5} ${sy+38}L${cx-26} ${sy+18}Z" fill="${C.top}" stroke="${C.line}" stroke-width=".9" stroke-linejoin="round"/>`;
  s+=`<path d="M${cx-19} ${sy+30}Q${cx} ${sy+37} ${cx+19} ${sy+30}" stroke="${C.topD}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  s+=line([cx-21.5,sy+38],[cx+21.5,sy+38],1.6,C.topD);
  /* руки */
  const armSvg=sd=>{
    const sh=[cx+sd*sw,sy+5];
    const el=[sh[0]+sd*Math.sin(a*R)*44,sh[1]+Math.cos(a*R)*44];
    const fb=a-bd;
    const wr=[el[0]+sd*Math.sin(fb*R)*40,el[1]+Math.cos(fb*R)*40];
    let g=circ(sh,9.4,C.skin)+shp(sh,el,SIM.ua,C.skin)+shp(el,wr,SIM.fa,C.skin)+circ(el,5.4,C.skin)+circ(wr,4.9,C.skin);
    if(ex.dumb)g+=rect(wr[0]-9,wr[1]-4,18,8,3,C.plate,`stroke="${C.gold}" stroke-width="1.6"`);
    return{sh,el,wr,svg:g};
  };
  const A1=armSvg(-1),A2=armSvg(1);
  s+=A1.svg+A2.svg;
  /* голова (анфас) */
  const hc=[cx,sy-28];
  s+=`<path d="M${cx-5.4} ${sy-18}L${cx-5.6} ${sy-8}L${cx+5.6} ${sy-8}L${cx+5.4} ${sy-18}Z" fill="${C.skin}"/>`;
  s+=`<path d="M${cx+9} ${sy-38}Q${cx+23} ${sy-34} ${cx+18} ${sy-8}" stroke="${C.hair}" stroke-width="7.5" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M${cx+9} ${sy-38}Q${cx+23} ${sy-34} ${cx+18} ${sy-8}" stroke="${C.hairHi}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".5"/>`;
  s+=circ([cx-10.8,hc[1]+1],2.6,C.skinD)+circ([cx+10.8,hc[1]+1],2.6,C.skinD);
  s+=`<ellipse cx="${cx}" cy="${hc[1]}" rx="10.6" ry="12.8" fill="${C.skin}" stroke="${C.line}" stroke-width=".9"/>`;
  s+=`<path d="M${cx-11.4} ${hc[1]-1.5}C${cx-14} ${hc[1]-20} ${cx+14} ${hc[1]-20} ${cx+11.4} ${hc[1]-1.5}C${cx+9} ${hc[1]-8} ${cx+4} ${hc[1]-10.5} ${cx} ${hc[1]-9.5}C${cx-4} ${hc[1]-10.5} ${cx-9} ${hc[1]-8} ${cx-11.4} ${hc[1]-1.5}Z" fill="${C.hair}" stroke="${C.hairD}" stroke-width=".7"/>`;
  s+=line([cx-7.6,hc[1]-1.2],[cx-2.4,hc[1]-1.8],1.2,C.hairD)+line([cx+2.4,hc[1]-1.8],[cx+7.6,hc[1]-1.2],1.2,C.hairD);
  s+=circ([cx-4.3,hc[1]+1.6],1.3,'#2b1a12')+circ([cx+4.3,hc[1]+1.6],1.3,'#2b1a12');
  s+=`<path d="M${cx} ${hc[1]+2}Q${cx+2.2} ${hc[1]+6.6} ${cx-.2} ${hc[1]+7.2}" stroke="${C.skinD}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M${cx-3.6} ${hc[1]+10.4}Q${cx} ${hc[1]+12.4} ${cx+3.6} ${hc[1]+10.4}" stroke="#b0595f" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  s+=circ([cx-6.6,hc[1]+6.4],2.8,'rgba(232,110,110,.18)')+circ([cx+6.6,hc[1]+6.4],2.8,'rgba(232,110,110,.18)');
  /* подсветка */
  const blob=(c,r)=>`<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${r}" fill="url(#hlg)" opacity="${f(hlOp)}"/>`;
  (ex.hl||[]).forEach(k=>{
    if(k==='delt'){s+=blob(A1.sh,15)+blob(A2.sh,15)}
    if(k==='abductor'){
      const ov=g=>blob([(g.hip[0]+g.knee[0])/2,(g.hip[1]+g.knee[1])/2],17);
      s+=ov(Lg)+ov(Rg)+blob([cx-26,hy-4],18)+blob([cx+26,hy-4],18);
    }
  });
  let back='',frontL='';
  if(ex.seated){
    back+=rect(cx-52,hy+10,104,12,6,C.pad,`stroke="${C.padL}" stroke-width="1.5"`)+rect(cx-44,sy-6,88,160,14,C.pad,`opacity=".55"`)+line([cx,hy+22],[cx,FLOOR],7,C.steelD)+line([cx-40,FLOOR-2],[cx+40,FLOOR-2],6,C.steelD);
    [[Lg,-1],[Rg,1]].forEach(([g,sd])=>{frontL+=rect(g.knee[0]+sd*8-5,g.knee[1]-18,10,36,5,C.steel,`stroke="${C.plate}" stroke-width="1.5"`)});
  }
  return{back,body:s,front:frontL};
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
    let body=arm(J.fsh,J.felbow,J.fwrist,1)+leg(J,1);
    body+=torsoSvg(J)+leg(J,0)+pelvisSvg(J)+headSvg(J);
    body+=hlSvg(J,ex.hl,op);
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
    raf=requestAnimationFrame(draw);
    if(now-last<30)return;
    const dt=now-last;last=now;if(playing)acc+=dt*speed;
    const u=(acc%cyc)/cyc;
    el.innerHTML=frame(id,phase(u),now/1000,opts);
  }
  raf=requestAnimationFrame(draw);
  return {play(){playing=true},pause(){playing=false},toggle(){playing=!playing;return playing},setSpeed(s){speed=s},get playing(){return playing},destroy(){cancelAnimationFrame(raf)}};
}
return {frame,mount,EXD,phase,solve,poseAt};
})();
if(typeof module!=='undefined')module.exports=Fig;