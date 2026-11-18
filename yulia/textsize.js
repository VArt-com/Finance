/* Размер текста для слабого зрения: кнопка «Aa» переключает 100% → 115% → 130% → 150%.
   Выбор общий для сайта и приложения (хранится на устройстве). На маленьких телефонах по умолчанию чуть крупнее. */
(function(){
  var KEY='yulia_fs',STEPS=[1,1.15,1.3,1.5],LAB=['Aa','A+','A++','A+++'];
  function get(){var v=null;try{v=parseFloat(localStorage.getItem(KEY))}catch(e){}
    if(v&&STEPS.indexOf(v)>=0)return v;
    return (window.screen&&Math.min(screen.width,screen.height)<=600)?1.1:1}
  function apply(v){var st=document.documentElement.style;st.setProperty('--fs',v);st.setProperty('--fc',Math.min(v,1.1))}
  var cur=get();apply(cur);
  function label(){var b=document.getElementById('btnFs');if(!b)return;
    var i=STEPS.indexOf(cur);if(i<0)i=0;b.textContent=LAB[i];b.title=Math.round(cur*100)+'%'}
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.getElementById('btnFs');if(!b)return;label();
    b.addEventListener('click',function(){var i=STEPS.indexOf(cur);cur=STEPS[(i+1)%STEPS.length];
      try{localStorage.setItem(KEY,String(cur))}catch(e){}apply(cur);label()});
  });
})();
