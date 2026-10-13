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

  // плеер: HLS через hls.js (Chrome/Firefox), нативно в Safari; запасной mp4
  var root=document.querySelector('.player'); if(!root) return;
  var v=root.querySelector('video'), src=root.dataset.hls, mp4=root.dataset.mp4, bar=root.querySelector('.player__bar'), fill=bar&&bar.querySelector('i'), tm=root.querySelector('.time'), qEl=root.querySelector('.player__q');
  function fmt(s){ s=Math.max(0,s|0); return (s/60|0)+':'+('0'+s%60).slice(-2) }
  function setup(){
    if(src && window.Hls && Hls.isSupported()){
      var h=new Hls({ capLevelToPlayerSize:true, maxBufferLength:30 });
      h.loadSource(src); h.attachMedia(v);
      h.on(Hls.Events.LEVEL_SWITCHED,function(e,d){ var L=h.levels[d.level]; if(qEl&&L) qEl.textContent=L.height+'p · '+Math.round(L.bitrate/1000)+' kbps' });
      h.on(Hls.Events.ERROR,function(e,d){ if(d.fatal){ if(mp4){ h.destroy(); v.src=mp4 } } });
      window.__hls=h;
    } else if(src && v.canPlayType('application/vnd.apple.mpegurl')){ v.src=src; if(qEl) qEl.textContent='HLS · нативно' }
    else if(mp4){ v.src=mp4; if(qEl) qEl.textContent='mp4' }
  }
  setup();
  root.classList.add('paused');
  function toggle(){ v.paused ? v.play() : v.pause() }
  root.querySelector('.player__big').addEventListener('click',toggle);
  root.querySelector('[data-act=play]').addEventListener('click',toggle);
  v.addEventListener('click',toggle);
  v.addEventListener('play',function(){ root.classList.add('playing'); root.classList.remove('paused'); root.querySelector('[data-act=play]').textContent='❚❚' });
  v.addEventListener('pause',function(){ root.classList.remove('playing'); root.classList.add('paused'); root.querySelector('[data-act=play]').textContent='▶' });
  v.addEventListener('timeupdate',function(){ if(v.duration){ fill.style.width=(v.currentTime/v.duration*100)+'%'; tm.textContent=fmt(v.currentTime)+' / '+fmt(v.duration) } });
  bar.addEventListener('click',function(e){ var r=bar.getBoundingClientRect(); v.currentTime=(e.clientX-r.left)/r.width*v.duration });
  root.querySelector('[data-act=mute]').addEventListener('click',function(){ v.muted=!v.muted; this.textContent=v.muted?'🔇':'🔊' });
  root.querySelector('[data-act=full]').addEventListener('click',function(){ (root.requestFullscreen||root.webkitRequestFullscreen).call(root) });
  document.addEventListener('keydown',function(e){ if(e.target.tagName==='INPUT')return; if(e.key===' '||e.key==='k'){ e.preventDefault(); toggle() } if(e.key==='ArrowRight') v.currentTime+=10; if(e.key==='ArrowLeft') v.currentTime-=10; if(e.key==='f') root.querySelector('[data-act=full]').click() });
  // «продолжить просмотр» — позиция в localStorage по slug
  var key='play-pos:'+(root.dataset.slug||location.pathname);
  try{ var p=+localStorage.getItem(key); if(p>5) v.addEventListener('loadedmetadata',function once(){ v.removeEventListener('loadedmetadata',once); if(p<v.duration-10) v.currentTime=p }) }catch(e){}
  setInterval(function(){ if(!v.paused){ try{ localStorage.setItem(key,v.currentTime) }catch(e){} } },3000);
})();
