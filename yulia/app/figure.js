/* Yulia Fit — движок иллюстраций упражнений.
   Фигура строится из углов суставов (прямая кинематика) и плавно анимируется между двумя позами. */
const Fig=(function(){
const W=400,H=300,FLOOR=270;
const C={plate:'#2b2c31',gold:'#9a9da4',steel:'#8b8e95',steelD:'#55575e',pad:'#303136',padL:'#5b5d64',hl:'#e8472c'};
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
const hexPts=(c,r)=>[0,1,2,3,4,5].map(i=>{const a=(60*i+30)*R;return f(c[0]+r*Math.cos(a))+' '+f(c[1]+r*Math.sin(a))}).join(' ');
const db=(c)=>`<polygon points="${hexPts(c,9.8)}" fill="#3a3c42" stroke="#8d9098" stroke-width="1.6" stroke-linejoin="round"/>`+circ(c,3.2,'#aeb1b8')+`<polygon points="${hexPts(c,5.8)}" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1"/>`;
const hexDb=c=>db(c);
const dbV=(c)=>rect(c[0]-6,c[1]-11,12,22,4,C.plate,`stroke="${C.gold}" stroke-width="2"`);
const bench=(x1,x2,y)=>line([x1+16,y+9],[x1+16,FLOOR],5,C.steelD)+line([x2-16,y+9],[x2-16,FLOOR],5,C.steelD)+rect(x1,y,x2-x1,11,5.5,C.pad,`stroke="${C.padL}" stroke-width="1.5"`);
const floor=()=>`<rect x="0" y="${FLOOR}" width="${W}" height="${H-FLOOR}" fill="url(#flr)"/>`+line([0,FLOOR],[W,FLOOR],2,'rgba(70,72,80,.32)');
const mat=(x1,x2)=>rect(x1,FLOOR-6,x2-x1,6,3,'#6d7586',`stroke="rgba(255,255,255,.15)" stroke-width="1"`);
const cable=(a,b)=>line(a,b,1.8,'#5d6068',`stroke-dasharray="0"`);
const pulley=(c)=>circ(c,8,'#2a2521',`stroke="${C.steel}" stroke-width="2.5"`)+circ(c,2.5,C.steel);
const post=(x,y1,y2)=>line([x,y1],[x,y2],8,C.steelD)+line([x,y1],[x,y2],3,'#6e6355');
const seat=(x1,x2,y)=>rect(x1,y,x2-x1,12,6,C.pad,`stroke="${C.padL}" stroke-width="1.5"`)+line([(x1+x2)/2,y+12],[(x1+x2)/2,FLOOR],6,C.steelD)+line([(x1+x2)/2-26,FLOOR-2],[(x1+x2)/2+26,FLOOR-2],6,C.steelD);
const back=(a,b)=>line(a,b,12,C.pad,`stroke="${C.padL}"`)+line(a,b,12,C.pad);


/* =====================================================================
   Анатомический стиль: серый «манекен» из отдельных мышц,
   работающие мышцы подсвечены (красные — основные, оранжевые — дополнительные)
   ===================================================================== */
const lerp=(a,b,k)=>a+(b-a)*k;
const f2=p=>f(p[0])+' '+f(p[1]);
let LITE=false,PU=.5;
const M={base:'#c3c4c9',baseD:'#9fa1a7',mus:'#e5e6e9',musL:'#f0f0f2',musD:'#d3d4d9',edge:'rgba(58,60,68,.5)',fib:'rgba(80,83,92,.3)',
 hl:'#e8472c',hlL:'#ff8a5a',hlE:'rgba(110,18,6,.8)',hlF:'rgba(100,16,6,.5)',glow:'#ff6a3a',
 sec:'#f6a97f',secE:'rgba(140,64,28,.65)',secF:'rgba(130,56,22,.42)'};

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
/* базовая форма сегмента тела (fs: -90 конечности, +90 торс/шея) */
function shp(p,q,pr,fill,o){
  o=o||{};
  const N=o.N||9,pts=outline(p,q,pr,o.t0||0,o.t1===undefined?1:o.t1,o.fs===undefined?-90:o.fs,o.pad||0,N);
  let d=`<path d="M${pts.map(f2).join('L')}Z" fill="${fill}"/>`;
  if(o.stroke!==false){
    const A=pts.slice(0,N+1),B=pts.slice(N+1).reverse();
    const st=`fill="none" stroke="${M.edge}" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round"`;
    d+=`<path d="M${A.map(f2).join('L')}" ${st}/><path d="M${B.map(f2).join('L')}" ${st}/>`;
  }
  return d;
}
function edge(p,q,pr,t,fs,pad){
  const dx=q[0]-p[0],dy=q[1]-p[1],n=dir(Math.atan2(dy,dx)/R+fs),w=interp(pr,t),c=[p[0]+dx*t,p[1]+dy*t];
  return[[c[0]+n[0]*(w[0]+pad),c[1]+n[1]*(w[0]+pad)],[c[0]-n[0]*(w[1]+pad),c[1]-n[1]*(w[1]+pad)]];
}
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
/* профили: [позиция 0..1, ширина спереди, ширина сзади] — атлетичная фигура */
const WID=(pr,k)=>pr.map(r=>[r[0],r[1]*k,r[2]*k]);
const PA0={
  thigh:[[0,13,15.5],[.25,15.6,14],[.55,13.6,11.6],[.85,9.8,9.2],[1,8,8]],
  shin:[[0,7.8,9],[.22,7.4,11.8],[.45,6.4,9.2],[.75,5.2,6.2],[1,4.4,4.8]],
  ua:[[0,9.6,9.2],[.22,9.2,8.8],[.5,8.6,8],[.8,6.4,6.6],[1,5.4,5.6]],
  fa:[[0,6.4,6],[.18,7.6,6.5],[.5,6.1,5.5],[.85,4.2,4.2],[1,3.7,3.7]],
  torso:[[0,12,15.5],[.15,11,12],[.35,10.5,11],[.58,13.2,13],[.78,15.8,13.6],[.92,13.4,12],[1,10,10]],
  neck:[[0,6.4,7.8],[1,5.4,6]]
};
const PA={thigh:WID(PA0.thigh,1.1),shin:WID(PA0.shin,1.1),ua:WID(PA0.ua,1.12),fa:WID(PA0.fa,1.08),torso:WID(PA0.torso,1.08),neck:PA0.neck};

/* мышца: полоса внутри сегмента между долями a..b ширины (с f — передняя, с b — задняя сторона) */
function mus(p,q,pr,side,a,b,t0,t1,fs,st,o){
  o=o||{};
  const N=8,dx=q[0]-p[0],dy=q[1]-p[1],n=dir(Math.atan2(dy,dx)/R+fs),sg=side==='f'?1:-1,idx=side==='f'?0:1;
  const P1=[],P2=[];
  for(let i=0;i<=N;i++){
    const s=i/N,t=t0+(t1-t0)*s,w=interp(pr,t)[idx],e=Math.max(.52,Math.pow(Math.sin(Math.PI*s),.45));
    const cen=(a+b)/2*w,half=(b-a)/2*w*e,c=[p[0]+dx*t,p[1]+dy*t];
    const o1=sg*(cen+half),o2=sg*(cen-half);
    P1.push([c[0]+n[0]*o1,c[1]+n[1]*o1]);P2.push([c[0]+n[0]*o2,c[1]+n[1]*o2]);
  }
  const poly=P1.concat(P2.slice().reverse()).map(f2).join('L');
  const fill=st===1?M.hl:st===2?M.sec:(o.fill||M.mus),ed=st===1?M.hlE:st===2?M.secE:M.edge,fc=st===1?M.hlF:st===2?M.secF:M.fib;
  let s='';
  if(st===1)s+=`<path d="M${poly}Z" fill="none" stroke="${M.glow}" stroke-width="5.5" stroke-linejoin="round" opacity="${f(.15+.4*PU)}"/>`;
  s+=`<path d="M${poly}Z" fill="${fill}" stroke="${ed}" stroke-width=".8" stroke-linejoin="round"/>`;
  if(st===1){
    const mid=P1.map((pt,i)=>[lerp(pt[0],P2[i][0],.3),lerp(pt[1],P2[i][1],.3)]).concat(P1.map((pt,i)=>[lerp(pt[0],P2[i][0],.62),lerp(pt[1],P2[i][1],.62)]).reverse());
    s+=`<path d="M${mid.map(f2).join('L')}Z" fill="${M.hlL}" opacity="${f(.3+.5*PU)}"/>`;
  }
  if(!LITE){
    const k=o.fib===undefined?2:o.fib;
    for(let j=1;j<=k;j++){const fr=j/(k+1);
      s+=`<path d="M${P1.map((pt,i)=>f2([lerp(pt[0],P2[i][0],fr),lerp(pt[1],P2[i][1],fr)])).join('L')}" fill="none" stroke="${fc}" stroke-width=".55"/>`}
  }
  return s;
}

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

/* ---------- вид сбоку ---------- */
function foot(toe,ft,far){
  const phi=ft-25,A=dir(phi),U=dir(phi-90);
  const P=(x,y)=>[toe[0]+A[0]*x+U[0]*y,toe[1]+A[1]*x+U[1]*y],Q=(x,y)=>f2(P(x,y));
  const c=far?M.baseD:M.base;
  let s=`<path d="M${Q(-24,0)}L${Q(3,0)}C${Q(6,0)} ${Q(8,1.6)} ${Q(7.6,3.6)}C${Q(7.2,5)} ${Q(5,5.8)} ${Q(2,6.4)}C${Q(-3,7.4)} ${Q(-8,8.6)} ${Q(-12,11)}L${Q(-16,15.5)}C${Q(-21,16.2)} ${Q(-24.6,12)} ${Q(-24.8,7)}C${Q(-25,3)} ${Q(-24.6,.8)} ${Q(-24,0)}Z" fill="${c}" stroke="${M.edge}" stroke-width=".9" stroke-linejoin="round"/>`;
  s+=line(P(2.6,.4),P(3.2,4.8),.7,M.fib)+line(P(-.2,.2),P(.4,5.6),.7,M.fib)+`<path d="M${Q(-20,3.6)}Q${Q(-10,6)} ${Q(-1,3)}" stroke="${M.fib}" stroke-width=".8" fill="none"/>`;
  return s;
}
function hand(el,wr,far){
  const c=far?M.baseD:M.base,a=Math.atan2(wr[1]-el[1],wr[0]-el[0])/R,D=dir(a),N=dir(a-90);
  const p0=sb(wr,[D[0]*3,D[1]*3]),p1=ad(wr,[D[0]*6,D[1]*6]);
  let s=shp(p0,p1,[[0,4,4],[.5,5,4.8],[1,3.8,3.8]],c,{N:6});
  s+=circ(p1,3.9,c);
  const t0=ad(wr,[N[0]*3.4,N[1]*3.4]),t1=ad(p1,[N[0]*4,N[1]*4]);
  s+=cap(t0,t1,2.1,1.7,c,`stroke="${M.edge}" stroke-width=".7"`);
  return s;
}
function leg(J,far){
  const hip=far?J.fhip:J.hip,knee=far?J.fknee:J.knee,ankle=far?J.fankle:J.ankle,toe=far?J.ftoe:J.toe,ft=far?J.fft:J.ft,S=J.S;
  if(far){
    return shp(knee,ankle,PA.shin,M.baseD)+shp(hip,knee,PA.thigh,M.baseD)+circ(knee,6.8,M.baseD)+
      mus(hip,knee,PA.thigh,'f',.15,1,.06,.95,-90,0,{fill:'#b3b5ba',fib:1})+mus(hip,knee,PA.thigh,'b',.1,1,.1,.92,-90,0,{fill:'#adafb4',fib:1})+
      mus(knee,ankle,PA.shin,'b',.1,1,.03,.5,-90,0,{fill:'#b3b5ba',fib:1})+foot(toe,ft,1);
  }
  let s=shp(knee,ankle,PA.shin,M.base)+shp(hip,knee,PA.thigh,M.base)+circ(knee,6.8,M.base);
  /* голень: камбаловидная, икроножная, передняя большеберцовая, ахиллово сухожилие */
  s+=mus(knee,ankle,PA.shin,'f',.18,.95,.1,.82,-90,0,{fill:M.musD,fib:1});
  s+=mus(knee,ankle,PA.shin,'b',.1,.8,.3,.82,-90,S('calf'),{fib:2});
  s+=mus(knee,ankle,PA.shin,'b',.1,1,.03,.52,-90,S('calf'),{fib:3});
  s+=mus(knee,ankle,PA.shin,'b',.05,.4,.6,1,-90,0,{fill:M.musL,fib:0});
  /* бедро: задняя поверхность (две головки), квадрицепс (три головки) */
  s+=mus(hip,knee,PA.thigh,'b',.1,1,.1,.94,-90,S('ham'),{fib:3});
  s+=mus(hip,knee,PA.thigh,'b',.02,.5,.16,.88,-90,S('ham'),{fill:M.musD,fib:2});
  s+=mus(hip,knee,PA.thigh,'f',.1,1,.04,.96,-90,S('quad'),{fib:3});
  s+=mus(hip,knee,PA.thigh,'f',.46,.97,.07,.78,-90,S('quad'),{fill:M.musL,fib:1});
  s+=mus(hip,knee,PA.thigh,'f',.12,.9,.62,.98,-90,S('quad'),{fill:M.mus,fib:1});
  s+=foot(toe,ft,0);
  return s;
}
const tp=(J,t,off)=>[J.hip[0]+(J.sh[0]-J.hip[0])*t+J.fwd[0]*off,J.hip[1]+(J.sh[1]-J.hip[1])*t+J.fwd[1]*off];
function torsoSvg(J){
  const h=J.hip,s=J.sh,S=J.S;
  let o=shp(h,s,PA.torso,M.base,{fs:90});
  o+=mus(h,s,PA.torso,'b',.3,1,.02,.46,90,S('lowback'),{fib:2});
  o+=mus(h,s,PA.torso,'b',.1,1,.28,.86,90,S('back'),{fib:3});
  o+=mus(h,s,PA.torso,'b',.1,1,.74,1,90,S('back'),{fib:2});
  o+=mus(h,s,PA.torso,'f',-.55,.3,.08,.6,90,S('abs'),{fill:M.musD,fib:3});
  o+=mus(h,s,PA.torso,'f',.14,1,.04,.57,90,S('abs'),{fib:0});
  const ab=S('abs')===1?M.hlE:S('abs')===2?M.secE:M.fib;
  [.15,.26,.37,.48].forEach(t=>{const w=interp(PA.torso,t)[0];o+=line(tp(J,t,w*.97),tp(J,t,w*.15),.8,ab)});
  o+=mus(h,s,PA.torso,'f',.1,1,.58,.97,90,S('chest'),{fib:3});
  return o;
}
function gluteSvg(J){
  const h=J.hip,F=J.fwd,u=dir(J.t),S=J.S,st=S('glute');
  const g=(x,y)=>[h[0]+F[0]*x+u[0]*y,h[1]+F[1]*x+u[1]*y];
  const fill=st===1?M.hl:st===2?M.sec:M.mus,ed=st===1?M.hlE:st===2?M.secE:M.edge,fc=st===1?M.hlF:st===2?M.secF:M.fib;
  const pts=[[-16,-2],[-14.5,7],[-7,12.5],[1.5,9.5],[5,1],[2.5,-9],[-5,-15.5],[-13,-12]].map(p=>g(p[0],p[1]));
  const d=smoothClosed(pts);
  let o='';
  if(st===1)o+=`<path d="${d}" fill="none" stroke="${M.glow}" stroke-width="5.5" opacity="${f(.15+.4*PU)}"/>`;
  o+=`<path d="${d}" fill="${fill}" stroke="${ed}" stroke-width=".8" stroke-linejoin="round"/>`;
  if(st===1)o+=`<path d="${smoothClosed([[-12,-1],[-10.5,6],[-5,9],[1,6.5],[2.5,0],[0,-8],[-5,-11],[-10,-9]].map(p=>g(p[0],p[1])))}" fill="${M.hlL}" opacity="${f(.3+.5*PU)}"/>`;
  if(!LITE)o+=line(g(-12,8),g(2,-7),.55,fc)+line(g(-14,0),g(3,-11),.55,fc)+line(g(-9,11),g(3,1),.55,fc);
  return o;
}
function headSvg(J){
  const c=J.head,a=J.t+(J.P.hd||0),U=dir(a),F=dir(a+90),S=J.S;
  const pt=(x,y)=>[c[0]+F[0]*x+U[0]*y,c[1]+F[1]*x+U[1]*y];
  let s='';
  const nb=ad(J.sh,[-F[0]*1,-F[1]*1]);
  s+=shp(nb,pt(0,-8),PA.neck,M.base,{fs:90});
  s+=mus(nb,pt(-1,-7),PA.neck,'f',-.4,.85,.06,.94,90,0,{fill:M.mus,fib:1});
  const face=[[-10.5,2],[-9,9],[-3,13],[4,11.5],[8.5,7],[9.2,3.6],[10.4,.4],[12.6,-2.2],[9.9,-3.8],[10.4,-5.4],[9.6,-6.8],[8.6,-8.8],[6.2,-11.4],[1.2,-11.6],[-4.6,-8.4],[-9.6,-3.4]].map(p=>pt(p[0],p[1]));
  s+=`<path d="${smoothClosed(face)}" fill="${M.mus}" stroke="${M.edge}" stroke-width=".9" stroke-linejoin="round"/>`;
  /* мышцы головы: височная, жевательная, лобная */
  s+=`<path d="M${f2(pt(-8,6))}Q${f2(pt(-2,12))} ${f2(pt(5,9.6))}" stroke="${M.fib}" stroke-width=".7" fill="none"/>`;
  s+=`<path d="M${f2(pt(-7,2))}Q${f2(pt(0,8))} ${f2(pt(7,5))}" stroke="${M.fib}" stroke-width=".6" fill="none"/>`;
  s+=`<path d="M${f2(pt(-1.4,-3))}Q${f2(pt(4.6,-1.4))} ${f2(pt(5.2,-7.6))}Q${f2(pt(1.4,-9.2))} ${f2(pt(-1.8,-6.6))}Z" fill="${M.musD}" stroke="${M.edge}" stroke-width=".6"/>`;
  s+=`<ellipse cx="${f(pt(6,2.4)[0])}" cy="${f(pt(6,2.4)[1])}" rx="2.3" ry="1.5" fill="rgba(52,55,62,.38)" transform="rotate(${f(a+90)} ${f(pt(6,2.4)[0])} ${f(pt(6,2.4)[1])})"/>`;
  s+=line(pt(4.2,5.2),pt(8.8,5.4),1.1,M.edge)+line(pt(8.8,-5.8),pt(10.2,-5.9),1.2,M.edge);
  s+=circ(pt(-2.4,-1.6),2.6,M.musD,`stroke="${M.edge}" stroke-width=".6"`);
  return s;
}
function arm(sh,el,wr,far,S){
  if(far){
    return circ(sh,8.4,M.baseD)+shp(sh,el,PA.ua,M.baseD)+shp(el,wr,PA.fa,M.baseD)+circ(el,5,M.baseD)+
      mus(sh,el,PA.ua,'f',.1,1,.18,.88,-90,0,{fill:'#b3b5ba',fib:1})+hand(el,wr,1);
  }
  let s=circ(sh,8.8,M.base)+shp(sh,el,PA.ua,M.base)+shp(el,wr,PA.fa,M.base)+circ(el,5,M.base);
  s+=mus(el,wr,PA.fa,'b',.05,1,.06,.82,-90,S('forearm'),{fill:M.musD,fib:2});
  s+=mus(el,wr,PA.fa,'f',.04,1,.03,.84,-90,S('forearm'),{fib:2});
  s+=mus(sh,el,PA.ua,'b',.04,1,.12,.92,-90,S('triceps'),{fib:2});
  s+=mus(sh,el,PA.ua,'f',.08,1,.2,.9,-90,S('biceps'),{fib:2});
  /* дельта: шапочка на плече */
  const sd=S('delt');
  s+=circ(sh,6.5,M.base);
  s+=mus(sh,el,PA.ua,'f',-1.05,1.05,-.2,.5,-90,sd,{fib:3});
  s+=hand(el,wr,0);
  return s;
}
function pelvisSvg(){return''}

/* ---------- вид спереди (анфас) ---------- */
function frontFrame(ex,P,time,hlOp,S){
  const seated=!!ex.seated,cx=200,hw=15.5,sw=31,hy=seated?172:146,sy=hy-66;
  const spr=P.leg||0,a=P.arm||0,bd=P.bend||0;
  const SIM={thigh:sym(PA.thigh),shin:sym(PA.shin),ua:sym(PA.ua),fa:sym(PA.fa)};
  const stA=S('abductor'),stD=S('delt');
  const fl=(st,base)=>st===1?M.hl:st===2?M.sec:base,ee=st=>st===1?M.hlE:st===2?M.secE:M.edge,ff=st=>st===1?M.hlF:st===2?M.secF:M.fib;
  let s='';
  const lg=sd=>{
    const hip=[cx+sd*hw,hy];let knee,ankle;
    if(seated){knee=[hip[0]+sd*Math.sin(spr*R)*62,hip[1]+16];ankle=[knee[0]+sd*3,knee[1]+66]}
    else{knee=[hip[0]+sd*Math.sin(spr*R)*60,hip[1]+Math.cos(spr*R)*60];ankle=[knee[0]+sd*Math.sin((spr+4)*R)*58,knee[1]+Math.cos((spr+4)*R)*58]}
    return{hip,knee,ankle};
  };
  const Lg=lg(-1),Rg=lg(1);
  const legSvg=(g,sd)=>{
    let o=shp(g.knee,g.ankle,SIM.shin,M.base)+shp(g.hip,g.knee,SIM.thigh,M.base)+circ(g.knee,7,M.base);
    const outer=sd===1?'f':'b',inner=sd===1?'b':'f';
    o+=mus(g.knee,g.ankle,SIM.shin,outer,.1,1,.04,.55,-90,0,{fill:M.musD,fib:2});
    o+=mus(g.hip,g.knee,SIM.thigh,outer,.5,1,.04,.96,-90,stA,{fib:2});
    o+=mus(g.hip,g.knee,SIM.thigh,inner,.45,1,.1,.94,-90,0,{fill:M.mus,fib:1});
    o+=mus(g.hip,g.knee,SIM.thigh,outer,-.4,.5,.04,.82,-90,0,{fill:M.musL,fib:1});
    o+=mus(g.hip,g.knee,SIM.thigh,inner,.1,.6,.6,.98,-90,0,{fill:M.mus,fib:0});
    o+=`<ellipse cx="${f(g.ankle[0]+sd*2.5)}" cy="${f(g.ankle[1]+4.5)}" rx="9.6" ry="6" fill="${M.base}" stroke="${M.edge}" stroke-width=".9"/>`;
    return o;
  };
  s+=legSvg(Lg,-1)+legSvg(Rg,1);
  /* торс */
  const half=[[sw-3,2],[sw-3.5,12],[27.5,28],[22,44],[18.4,56],[19.4,hy-sy-14],[21.5,hy-sy-2]];
  const lp=half.map(p=>[cx-p[0],sy+p[1]]),rp=half.map(p=>[cx+p[0],sy+p[1]]).reverse();
  s+=`<path d="${smoothClosed(lp.concat(rp))}" fill="${M.base}" stroke="${M.edge}" stroke-width=".9"/>`;
  /* трапеции и шея */
  s+=`<path d="M${cx-6} ${sy-12}L${cx-sw+2} ${sy+4}L${cx-14} ${sy+8}L${cx} ${sy+3}L${cx+14} ${sy+8}L${cx+sw-2} ${sy+4}L${cx+6} ${sy-12}Z" fill="${M.mus}" stroke="${M.edge}" stroke-width=".8" stroke-linejoin="round"/>`;
  /* косые мышцы и зубчатая */
  [-1,1].forEach(sd=>{
    s+=`<path d="M${cx+sd*17.5} ${sy+34}Q${cx+sd*27} ${sy+46} ${cx+sd*22} ${hy-16}L${cx+sd*14.5} ${hy-18}Q${cx+sd*19} ${sy+50} ${cx+sd*17.5} ${sy+34}Z" fill="${M.musD}" stroke="${M.edge}" stroke-width=".7"/>`;
    [0,1,2].forEach(k=>{s+=line([cx+sd*(25-k*1.6),sy+30+k*6],[cx+sd*(19-k*.4),sy+33+k*6],.7,M.fib)});
    /* грудная мышца */
    s+=`<path d="M${cx+sd*1.5} ${sy+9}Q${cx+sd*14} ${sy+4} ${cx+sd*sw*.86} ${sy+9}Q${cx+sd*28} ${sy+24} ${cx+sd*24} ${sy+30}Q${cx+sd*10} ${sy+38} ${cx+sd*1.5} ${sy+31}Z" fill="${M.mus}" stroke="${M.edge}" stroke-width=".8" stroke-linejoin="round"/>`;
    [0,1,2].forEach(k=>{s+=`<path d="M${cx+sd*3} ${sy+13+k*6}Q${cx+sd*(12+k*2)} ${sy+11+k*5} ${cx+sd*(22-k*1.4)} ${sy+14+k*5}" stroke="${M.fib}" stroke-width=".55" fill="none"/>`});
  });
  /* пресс: 3 ряда по 2 кубика */
  [0,1,2].forEach(r=>{[-1,1].forEach(sd=>{
    const y0=sy+36+r*10,h=8.4;
    s+=`<rect x="${f(cx+(sd===1?1:-12.6))}" y="${f(y0)}" width="11.6" height="${h}" rx="3.2" fill="${M.mus}" stroke="${M.edge}" stroke-width=".7"/>`;
  })});
  s+=line([cx,sy+34],[cx,hy-12],.7,M.fib);
  /* таз и паховые линии */
  s+=`<path d="M${cx-21} ${hy-14}Q${cx} ${hy-9} ${cx+21} ${hy-14}L${cx+19} ${hy+9}L${cx-19} ${hy+9}Z" fill="${M.mus}" stroke="${M.edge}" stroke-width=".8" stroke-linejoin="round"/>`;
  s+=line([cx-18,hy-10],[cx-3,hy+8],.8,M.edge)+line([cx+18,hy-10],[cx+3,hy+8],.8,M.edge);
  /* руки */
  const armSvg=sd=>{
    const sh=[cx+sd*sw,sy+5];
    const el=[sh[0]+sd*Math.sin(a*R)*44,sh[1]+Math.cos(a*R)*44];
    const fb=a-bd;
    const wr=[el[0]+sd*Math.sin(fb*R)*40,el[1]+Math.cos(fb*R)*40];
    let g=circ(sh,9.6,M.base)+shp(sh,el,SIM.ua,M.base)+shp(el,wr,SIM.fa,M.base)+circ(el,5.6,M.base);
    g+=mus(el,wr,SIM.fa,'f',.1,1,.04,.84,-90,0,{fill:M.musD,fib:2})+mus(sh,el,SIM.ua,'f',.2,1,.2,.9,-90,0,{fill:M.mus,fib:1});
    if(stD){g+=circ(sh,12.5,'none',`stroke="${M.glow}" stroke-width="5" opacity=".34"`)}
    g+=mus(sh,el,SIM.ua,'f',-1.05,1.05,-.2,.5,-90,stD,{fib:3});
    g+=circ(wr,4.9,M.base,`stroke="${M.edge}" stroke-width=".7"`);
    if(ex.dumb)g+=hexDb(wr);
    return{sh,el,wr,svg:g};
  };
  const A1=armSvg(-1),A2=armSvg(1);
  s+=A1.svg+A2.svg;
  /* голова */
  const hc=[cx,sy-28];
  s+=`<path d="M${cx-5.6} ${sy-18}L${cx-6} ${sy-8}L${cx+6} ${sy-8}L${cx+5.6} ${sy-18}Z" fill="${M.base}"/>`;
  s+=line([cx-3,sy-16],[cx+4,sy-6],1.6,M.musD)+line([cx+3,sy-16],[cx-4,sy-6],1.6,M.musD);
  s+=circ([cx-10.8,hc[1]+1],2.6,M.musD,`stroke="${M.edge}" stroke-width=".6"`)+circ([cx+10.8,hc[1]+1],2.6,M.musD,`stroke="${M.edge}" stroke-width=".6"`);
  s+=`<ellipse cx="${cx}" cy="${hc[1]}" rx="10.6" ry="12.8" fill="${M.mus}" stroke="${M.edge}" stroke-width=".9"/>`;
  s+=`<path d="M${cx-9} ${hc[1]-4}Q${cx} ${hc[1]-13} ${cx+9} ${hc[1]-4}" stroke="${M.fib}" stroke-width=".7" fill="none"/>`;
  s+=`<ellipse cx="${cx-4.3}" cy="${hc[1]+1.4}" rx="2.4" ry="1.5" fill="rgba(52,55,62,.4)"/><ellipse cx="${cx+4.3}" cy="${hc[1]+1.4}" rx="2.4" ry="1.5" fill="rgba(52,55,62,.4)"/>`;
  s+=`<path d="M${cx} ${hc[1]+2}Q${cx+2.2} ${hc[1]+6.6} ${cx-.2} ${hc[1]+7.2}" stroke="${M.edge}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
  s+=`<path d="M${cx-3.6} ${hc[1]+10.4}Q${cx} ${hc[1]+12} ${cx+3.6} ${hc[1]+10.4}" stroke="${M.edge}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  /* таз: подсветка отводящих (ягодичная средняя + напрягатель) */
  if(stA){
    [-1,1].forEach(sd=>{
      s+=`<ellipse cx="${cx+sd*25}" cy="${hy-4}" rx="9" ry="13" fill="${fl(stA,M.mus)}" stroke="${ee(stA)}" stroke-width=".9" opacity="${f(.8+.2*Math.sin((time||0)*3.2))}"/>`;
    });
  }
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

const DEFS=`<defs><radialGradient id="hlg"><stop offset="0" stop-color="#ff6a3a" stop-opacity=".9"/><stop offset=".6" stop-color="#ff6a3a" stop-opacity=".4"/><stop offset="1" stop-color="#ff6a3a" stop-opacity="0"/></radialGradient>
<linearGradient id="flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b6e77" stop-opacity=".22"/><stop offset="1" stop-color="#6b6e77" stop-opacity="0"/></linearGradient>
<radialGradient id="bgg" cx=".5" cy=".42" r=".85"><stop offset="0" stop-color="#fcfcfb"/><stop offset="1" stop-color="#dfdfdc"/></radialGradient></defs>`;
/* дополнительные (вторичные) мышцы — оранжевым */
const HL2={squat:['ham','abs','lowback'],goblet:['abs'],legPress:['calf'],rdl:['back','forearm'],hipThrust:['quad','abs'],lunge:['ham','calf'],
 legCurl:['calf'],legExt:[],calf:[],dbBench:[],incline:[],shoulder:['back'],lateral:['forearm'],pulldown:['forearm','delt'],row:['forearm','lowback'],
 dbRow:['forearm','lowback'],facePull:['triceps'],biceps:['forearm'],triceps:['forearm'],plank:['glute','chest'],crunch:[],legRaise:['forearm','quad'],
 abductor:[],backExt:[],cardio:['ham','glute']};

function frame(id,k,time,opts){
  opts=opts||{};
  const ex=EXD[id];const op=.5+.2*Math.sin((time||0)*3.2);
  PU=op;LITE=!!(opts.uid&&/^u\d/.test(opts.uid));
  const h1=ex.hl||[],h2=HL2[id]||[],S=key=>h1.indexOf(key)>=0?1:h2.indexOf(key)>=0?2:0;
  let inner='';
  const P=poseAt(id,k);
  if(ex.view==='front'){
    const r=frontFrame(ex,P,time,op,S);inner=floor()+`<ellipse cx="200" cy="${FLOOR+3}" rx="78" ry="6" fill="rgba(0,0,0,.14)"/>`+r.back+r.body+r.front;
  }else{
    const J=solve(P,ex);J.S=S;const sc=SC[id](J);
    let body=arm(J.fsh,J.felbow,J.fwrist,1,S)+leg(J,1);
    body+=torsoSvg(J)+leg(J,0)+gluteSvg(J)+headSvg(J);
    body+=arm(J.sh,J.elbow,J.wrist,0,S);
    const shx=(J.toe[0]+J.hip[0])/2;
    inner=(id==='legRaise'?'':floor()+`<ellipse cx="${f(shx)}" cy="${FLOOR+3}" rx="74" ry="6" fill="rgba(0,0,0,.14)"/>`)+(ex.scale?`<g transform="translate(200 150) scale(${ex.scale}) translate(-200 -150)">`:'')+sc.b+body+sc.f+(ex.scale?'</g>':'');
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
    if(now-last<40)return;
    const dt=now-last;last=now;if(playing)acc+=dt*speed;
    const u=(acc%cyc)/cyc;
    if(opts.onTick)opts.onTick(u);
    el.innerHTML=frame(id,phase(u),now/1000,opts);
  }
  raf=requestAnimationFrame(draw);
  return {play(){playing=true},pause(){playing=false},toggle(){playing=!playing;return playing},setSpeed(s){speed=s},get playing(){return playing},destroy(){cancelAnimationFrame(raf)}};
}
return {frame,mount,EXD,phase,solve,poseAt};
})();
if(typeof module!=='undefined')module.exports=Fig;