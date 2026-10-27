(() => {
  'use strict';
  const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)'), header=document.querySelector('.site-header');
  root.classList.add('js');
  const motion=()=>!reduced.matches;
  root.classList.toggle('motion',motion());
  const dialogs=[...document.querySelectorAll('dialog')];
  function openDialog(d){d.classList.remove('is-closing');d.showModal();document.body.classList.add('modal-open');document.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded',d.id==='site-menu'?'true':'false'));}
  function closeDialog(d){if(!d.open)return;const done=()=>{d.close();d.classList.remove('is-closing');};if(motion()){d.classList.add('is-closing');setTimeout(done,340);}else done();}
  document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>openDialog(document.querySelector('#site-menu'))));
  dialogs.forEach(d=>{d.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(d)));d.addEventListener('cancel',e=>{e.preventDefault();closeDialog(d);});d.addEventListener('close',()=>{document.body.classList.remove('modal-open');document.querySelectorAll('[data-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));d.querySelectorAll('video').forEach(v=>v.pause());});});
  const lightbox=document.querySelector('.lightbox'), lightImage=lightbox.querySelector('img');
  let movedAt=0;
  document.querySelectorAll('[data-lightbox]').forEach(b=>b.addEventListener('click',e=>{if(performance.now()-movedAt<200){e.preventDefault();return;}lightImage.src=b.dataset.lightbox;lightImage.alt=b.querySelector('img')?.alt||'作品大图';lightbox.querySelector('.lightbox-label').textContent=lightImage.alt;lightbox.classList.remove('is-zoomed');lightbox.querySelector('.zoom-button').setAttribute('aria-pressed','false');lightbox.querySelector('.zoom-button').textContent='原尺寸';openDialog(lightbox);lightbox.querySelector('.lightbox-scroll').scrollTop=0;}));
  lightbox.querySelector('.zoom-button').addEventListener('click',e=>{const z=lightbox.classList.toggle('is-zoomed');e.currentTarget.setAttribute('aria-pressed',String(z));e.currentTarget.textContent=z?'适应屏幕':'原尺寸';});
  document.querySelectorAll('.project-card').forEach(card=>{card.addEventListener('click',e=>{if(!e.target.closest('a,button'))navigate(card.dataset.href);});});
  // Videos load only near the viewport; leaving the page never keeps a video running.
  const videos=[...document.querySelectorAll('.motion-video')], manuallyPaused=new WeakSet();
  function videoState(v){const b=v.parentElement.querySelector('.video-toggle');if(b){b.textContent=v.paused?'播放':'暂停';b.setAttribute('aria-label',v.paused?'播放视频':'暂停视频');}}
  const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target:v,isIntersecting})=>{v.dataset.visible=String(isIntersecting);if(isIntersecting){if(!v.src){v.src=v.dataset.src;v.load();}if(motion()&&!manuallyPaused.has(v)&&!document.hidden)v.play().catch(()=>videoState(v));}else v.pause();}),{rootMargin:'100px',threshold:0.05});
  videos.forEach(v=>{if(v.dataset.src.includes('simagic-performance'))v.addEventListener('loadedmetadata',()=>{v.currentTime=2.5;},{once:true});videoObserver.observe(v);v.addEventListener('play',()=>videoState(v));v.addEventListener('pause',()=>videoState(v));v.parentElement.querySelector('.video-toggle')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(v.paused){manuallyPaused.delete(v);if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{});}else{manuallyPaused.add(v);v.pause();}});});
  const reel=document.querySelector('.reel-dialog');
  document.querySelectorAll('.reel-toggle').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();videos.forEach(v=>v.pause());const v=reel.querySelector('video');v.src='/assets/videos/'+b.dataset.video+'.mp4';openDialog(reel);v.play().catch(()=>{});}));
  reel.addEventListener('close',()=>videos.filter(v=>v.dataset.visible==='true'&&!manuallyPaused.has(v)&&motion()).forEach(v=>v.play().catch(()=>{})));
  document.addEventListener('visibilitychange',()=>videos.forEach(v=>{if(document.hidden)v.pause();else if(v.dataset.visible==='true'&&!manuallyPaused.has(v)&&motion())v.play().catch(()=>{});}));
  // Native horizontal scrolling, with drag, keyboard and explicit buttons.
  document.querySelectorAll('.gallery-track').forEach((track,index)=>{
    const count=track.querySelectorAll('img').length;
    const tools=document.createElement('div');tools.className='gallery-tools';tools.innerHTML='<span class="gallery-count">01 / '+String(count).padStart(2,'0')+'</span><div class="gallery-progress"><span></span></div><div><button type="button" aria-label="上一张">←</button><button type="button" aria-label="下一张">→</button></div>';
    if(track.dataset.nodeId==='575:69'){document.querySelector('[data-node-id="613:48"]').append(tools);}else{track.after(tools);}const [prev,next]=tools.querySelectorAll('button');
    const step=()=>track.querySelector('.gallery-item,.gallery-inner>div')?.getBoundingClientRect().width+24||track.clientWidth*.8;
    const scroll=(direction)=>track.scrollBy({left:direction*step(),behavior:motion()?'smooth':'instant'});
    prev.addEventListener('click',()=>scroll(-1));next.addEventListener('click',()=>scroll(1));
    function state(){const max=track.scrollWidth-track.clientWidth, p=max>0?track.scrollLeft/max:0;prev.disabled=p<=.002;next.disabled=p>=.998||max<1;tools.querySelector('.gallery-count').textContent=String(Math.min(count,Math.round(p*(count-1))+1)).padStart(2,'0')+' / '+String(count).padStart(2,'0');tools.querySelector('.gallery-progress span').style.transform='scaleX('+Math.max(.08,p)+')';if(p>=.998)track.classList.remove('is-scroll-captured');}
    track.addEventListener('scroll',state,{passive:true});new ResizeObserver(state).observe(track);state();
    track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();scroll(e.key==='ArrowRight'?1:-1);}if(e.key==='Home'){e.preventDefault();track.scrollTo({left:0,behavior:'smooth'});}if(e.key==='End'){e.preventDefault();track.scrollTo({left:track.scrollWidth,behavior:'smooth'});}});
    let startX=0,startLeft=0,dragging=false,pointerId=null;
    track.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;startX=e.clientX;startLeft=track.scrollLeft;pointerId=e.pointerId;dragging=false;});
    track.addEventListener('pointermove',e=>{if(pointerId!==e.pointerId)return;const dx=e.clientX-startX;if(Math.abs(dx)>6){if(!dragging){dragging=true;track.setPointerCapture(e.pointerId);track.classList.add('is-dragging');}track.scrollLeft=startLeft-dx;e.preventDefault();}});
    const end=()=>{if(dragging)movedAt=performance.now();if(pointerId!==null&&track.hasPointerCapture(pointerId))track.releasePointerCapture(pointerId);pointerId=null;dragging=false;track.classList.remove('is-dragging');};track.addEventListener('pointerup',end);track.addEventListener('pointercancel',end);track.addEventListener('lostpointercapture',()=>{pointerId=null;track.classList.remove('is-dragging');});
  });
  // Continue down the page only after the horizontal gallery has reached its end.
  const galleries=[...document.querySelectorAll('.gallery-track')];
  function advanceGallery(delta){
    const anchor=innerHeight*.3;
    for(const track of galleries){
      const max=track.scrollWidth-track.clientWidth, rect=track.getBoundingClientRect();
      if(max<=1||track.scrollLeft>=max-1||rect.bottom<=anchor||rect.top>anchor+delta)continue;
      const approach=Math.max(0,rect.top-anchor);
      if(approach)window.scrollBy({top:approach,behavior:'instant'});
      track.classList.add('is-scroll-captured');
      track.scrollLeft=Math.min(max,track.scrollLeft+Math.max(0,delta-approach));
      return true;
    }
    return false;
  }
  const canCapture=target=>!document.querySelector('dialog[open]')&&!target.closest('input,textarea,select,[contenteditable="true"]');
  window.addEventListener('wheel',e=>{
    if(e.defaultPrevented||e.ctrlKey||e.deltaY<=0||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!canCapture(e.target))return;
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
    if(advanceGallery(delta))e.preventDefault();
  },{passive:false});
  let touch;
  window.addEventListener('touchstart',e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY,startX:e.touches[0].clientX,startY:e.touches[0].clientY,axis:null,target:e.target}:null;},{passive:true});
  window.addEventListener('touchmove',e=>{
    if(!touch||e.touches.length!==1)return;
    const x=e.touches[0].clientX,y=e.touches[0].clientY,dy=touch.y-y;
    touch.x=x;touch.y=y;
    if(!touch.axis){const totalX=x-touch.startX,totalY=y-touch.startY;if(Math.max(Math.abs(totalX),Math.abs(totalY))<8)return;touch.axis=Math.abs(totalY)>Math.abs(totalX)?'y':'x';}
    if(touch.axis==='y'&&dy>0&&canCapture(touch.target)&&advanceGallery(dy))e.preventDefault();
  },{passive:false});
  window.addEventListener('touchend',()=>{touch=null;},{passive:true});
  window.addEventListener('touchcancel',()=>{touch=null;},{passive:true});
  window.addEventListener('keydown',e=>{
    if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||!canCapture(e.target)||(e.key===' '&&e.target.closest('button,a')))return;
    const delta=e.key==='ArrowDown'?40:e.key==='PageDown'||e.key===' '?innerHeight*.8:e.key==='End'?document.documentElement.scrollHeight:0;
    if(delta&&advanceGallery(delta))e.preventDefault();
  });
  // Reveal is progressive enhancement: all content remains readable without JavaScript.
  const revealObserver=new IntersectionObserver(es=>es.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.remove('is-pending');revealObserver.unobserve(target);}}),{threshold:.08,rootMargin:'0px 0px -35px 0px'});
  document.querySelectorAll('.reveal').forEach((el,i)=>{if(el.getBoundingClientRect().top>innerHeight*.92){el.classList.add('is-pending');el.style.transitionDelay=(i%3)*35+'ms';}revealObserver.observe(el);});
  const moving=[...document.querySelectorAll('.parallax')], nextScenes=[...document.querySelectorAll('.next-case')], spotlights=[...document.querySelectorAll('.about-scene')], progress=document.querySelector('.scroll-progress');
  let scheduled=false,lastY=scrollY;
  function tick(){scheduled=false;const y=scrollY,h=innerHeight;header.classList.toggle('is-fixed',y>140);header.classList.toggle('is-hidden',y>lastY+3&&y>h*.7&&!document.body.classList.contains('modal-open'));if(y<lastY-3||y<100)header.classList.remove('is-hidden');lastY=y;
    let surface=document.elementsFromPoint(innerWidth*.5,60).find(e=>e.closest('main')&&!e.closest('.site-header'));let dark=false;while(surface&&surface!==document.body){const color=getComputedStyle(surface).backgroundColor;const rgba=color.match(/[\d.]+/g)?.map(Number);if(rgba&&rgba.length>=3&&(rgba.length<4||rgba[3]>.85)){dark=(rgba[0]*.2126+rgba[1]*.7152+rgba[2]*.0722)<100;break;}surface=surface.parentElement;}header.classList.toggle('on-dark',dark);
    progress.style.transform='scaleX('+(y/Math.max(1,document.documentElement.scrollHeight-h))+')';
    moving.forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<h)el.style.setProperty('--parallax-y',motion()?Math.max(-r.height*.035,Math.min(r.height*.035,(h*.5-r.top-r.height*.5)*.11))+'px':'0px');});
    nextScenes.forEach(el=>{const r=el.getBoundingClientRect();if(r.bottom>0&&r.top<h){const p=Math.max(0,Math.min(1,(h-r.top)/(h+r.height)));el.style.setProperty('--next-scale',motion()?String(.88+p*.2):'1');}});
    spotlights.forEach(el=>{const r=el.getBoundingClientRect();el.classList.toggle('is-active',r.top<h*.8&&r.bottom>h*.15);if(innerWidth>900){const portrait=el.querySelector('.image-frame');if(portrait)portrait.style.setProperty('--portrait-y',motion()?Math.max(-55,Math.min(55,(h*.5-r.top-r.height*.5)*.1))+'px':'0px');}});
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(tick);}}addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);tick();
  reduced.addEventListener('change',()=>{root.classList.toggle('motion',motion());if(!motion())videos.forEach(v=>v.pause());schedule();});
  // Keep native history/navigation and add an intentional outgoing transition.
  let navigating=false;
  function navigate(href){if(navigating)return;navigating=true;const curtain=document.querySelector('.page-curtain');if(!motion()){location.href=href;return;}curtain.animate([{transform:'translateY(101%)'},{transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.76,0,.24,1)',fill:'forwards'}).finished.then(()=>location.href=href);}
  document.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.download)return;const u=new URL(a.href,location.href);if(u.origin!==location.origin||u.hash||u.pathname===location.pathname)return;e.preventDefault();navigate(u.href);});
  addEventListener('pageshow',()=>{navigating=false;document.querySelector('.page-curtain').getAnimations().forEach(a=>a.cancel());});
})();
// The reference's contextual cursor is limited to fine pointers and never replaces keyboard controls.
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
  const cursor=document.createElement('div');cursor.className='view-cursor';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
  let x=0,y=0,tx=0,ty=0,active=false,frame=0;
  const draw=()=>{x+=(tx-x)*.25;y+=(ty-y)*.25;cursor.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;if(Math.abs(tx-x)+Math.abs(ty-y)>.1)frame=requestAnimationFrame(draw);else frame=0;};
  document.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;const target=e.target.closest('.gallery-track,.project-card');active=!!target&&!e.target.closest('dialog,.gallery-tools');cursor.textContent=target?.classList.contains('gallery-track')?'拖动 ↔':'查看 ↗';cursor.classList.toggle('is-visible',active);if(!frame)draw();});
  document.addEventListener('pointerleave',()=>{active=false;cursor.classList.remove('is-visible');});
}
