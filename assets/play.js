/* play.neyra.vision · язык + плеер HLS · 13.10.2026 */
(function(){
  // язык RU/KZ: тексты в data-ru / data-kz, выбор в localStorage и ?lang=
  var q=new URLSearchParams(location.search).get('lang'), saved=null;
  try{ saved=localStorage.getItem('play-lang') }catch(e){}
  var lang=(q==='kz'||q==='ru')?q:(saved||'ru');
  function apply(l){
    lang=l; document.documentElement.lang=(l==='kz'?'kk':'ru');
    document.querySelectorAll('[data-ru]').forEach(function(e){ var v=e.getAttribute('data-'+l); if(v!=null) e.textContent=v });
    document.querySelectorAll('.lang button').forEach(function(b){ b.setAttribute('aria-pressed',b.dataset.l===l) });
    try{ localStorage.setItem('play-lang',l) }catch(e){}
  }
  document.querySelectorAll('.lang button').forEach(function(b){ b.addEventListener('click',function(){ apply(b.dataset.l) }) });
  apply(lang);

  // липкая кнопка на телефоне — только когда кнопка первого экрана ушла из вида
  var sticky=document.querySelector('.sticky-cta'), heroBtn=document.querySelector('.hero .btn--main');
  if(sticky&&heroBtn){ var raf=0; function chk(){ raf=0; sticky.classList.toggle('on',heroBtn.getBoundingClientRect().bottom<0) } addEventListener('scroll',chk,{passive:true}); chk() }

  // плеер: HLS через hls.js (Chrome/Firefox), нативно в Safari; запасной mp4
  var root=document.querySelector('.player'); if(!root) return;
  var v=root.querySelector('video'), src=root.dataset.hls, mp4=root.dataset.mp4, bar=root.querySelector('.player__bar'), fill=bar&&bar.querySelector('i'), tm=root.querySelector('.time'), qEl=root.querySelector('.player__q');
  function fmt(s){ s=Math.max(0,s|0); return (s/60|0)+':'+('0'+s%60).slice(-2) }
  function setup(){
    if(src && window.Hls && Hls.isSupported()){
      var h=new Hls({ capLevelToPlayerSize:true, maxBufferLength:30 });
      h.loadSource(src); h.attachMedia(v);
            h.on(Hls.Events.ERROR,function(e,d){ if(!d.fatal) return; var at=v.currentTime||0; h.destroy(); if(mp4){ v.src=mp4; v.addEventListener('loadedmetadata',function once(){ v.removeEventListener('loadedmetadata',once); if(at) v.currentTime=at },{once:true}) } else { root.classList.add('failed'); } });
    } else if(src && v.canPlayType('application/vnd.apple.mpegurl')){ v.src=src }
    else if(mp4){ v.src=mp4 }
  }
  var IC={"play": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M8 5v14l11-7z\"/></svg>", "pause": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 5h4v14H7zM13 5h4v14h-4z\"/></svg>", "vol": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 9v6h4l5 4V5L8 9zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z\"/></svg>", "mute": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 9v6h4l5 4V5L8 9zm15.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z\"/></svg>"};
  setup();
  root.classList.add('paused');
  function toggle(){ if(v.paused){ var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}) } else v.pause() }
  root.querySelector('.player__big').addEventListener('click',toggle);
  root.querySelector('[data-act=play]').addEventListener('click',toggle);
  v.addEventListener('click',toggle);
  v.addEventListener('play',function(){ root.classList.add('playing'); root.classList.remove('paused'); var b=root.querySelector('[data-act=play]'); b.innerHTML=IC.pause; b.setAttribute('aria-label','Пауза') });
  v.addEventListener('pause',function(){ root.classList.remove('playing'); root.classList.add('paused'); var b=root.querySelector('[data-act=play]'); b.innerHTML=IC.play; b.setAttribute('aria-label','Играть') });
  v.addEventListener('timeupdate',function(){ if(v.duration){ fill.style.width=(v.currentTime/v.duration*100)+'%'; tm.textContent=fmt(v.currentTime)+' / '+fmt(v.duration); if(bar){ bar.setAttribute('aria-valuemax',Math.round(v.duration)); bar.setAttribute('aria-valuenow',Math.round(v.currentTime)); bar.setAttribute('aria-valuetext',fmt(v.currentTime)) } } });
  if(bar) bar.addEventListener('keydown',function(e){ if(!isFinite(v.duration)) return; if(e.key==='ArrowRight'||e.key==='ArrowUp'){ e.preventDefault(); e.stopPropagation(); v.currentTime=Math.min(v.duration,v.currentTime+5) } if(e.key==='ArrowLeft'||e.key==='ArrowDown'){ e.preventDefault(); e.stopPropagation(); v.currentTime=Math.max(0,v.currentTime-5) } if(e.key==='Home'){ e.preventDefault(); v.currentTime=0 } if(e.key==='End'){ e.preventDefault(); v.currentTime=v.duration-1 } });
  if(bar) bar.addEventListener('click',function(e){ if(!isFinite(v.duration)) return; var r=bar.getBoundingClientRect(); v.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*v.duration });
  root.querySelector('[data-act=mute]').addEventListener('click',function(){ v.muted=!v.muted; this.innerHTML=v.muted?IC.mute:IC.vol; this.setAttribute('aria-pressed',v.muted?'true':'false') });
  root.querySelector('[data-act=full]').addEventListener('click',function(){ var fs=root.requestFullscreen||root.webkitRequestFullscreen; if(fs){ var r=fs.call(root); if(r&&r.catch) r.catch(function(){}) } else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen() });
  document.addEventListener('keydown',function(e){ if(e.metaKey||e.ctrlKey||e.altKey) return; var tg=e.target, tag=tg&&tg.tagName; if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(tg&&tg.isContentEditable)) return; if((tag==='BUTTON'||tag==='A')&&(e.key===' '||e.key==='Enter')&&!root.contains(tg)) return; if(!root.contains(tg)&&tg!==document.body) return; if(e.key===' '||e.key==='k'){ e.preventDefault(); toggle() } if(e.key==='ArrowRight') v.currentTime+=10; if(e.key==='ArrowLeft') v.currentTime-=10; if(e.key==='f') root.querySelector('[data-act=full]').click() });
  document.querySelectorAll('[data-watch]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'}); if(v.paused) toggle() }) });
  // «продолжить просмотр» — позиция в localStorage по slug
  var key='play-pos:'+(root.dataset.slug||location.pathname);
  try{ var p=+localStorage.getItem(key); if(p>5) v.addEventListener('loadedmetadata',function once(){ v.removeEventListener('loadedmetadata',once); if(p<v.duration-10) v.currentTime=p }) }catch(e){}
  setInterval(function(){ if(!v.paused){ try{ localStorage.setItem(key,v.currentTime) }catch(e){} } },3000);
})();
