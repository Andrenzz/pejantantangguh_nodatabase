
(() => {
const data = window.CHAT_DATA || [], meta = window.CHAT_META || {};
const qs = s => document.querySelector(s);
const esc = s => (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linkify = s => esc(s).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
const idMap={Wira:'wira',Andrea:'andrea',Dityo:'dityo',Dzikri:'dzikri',Fathan:'fathan'};
let pov=localStorage.getItem('pt-pov')||'Andrea';
let filtered=data.slice(), start=Math.max(0,filtered.length-10), loading=false;
const list=qs('#chatList'), povSel=qs('#povSelect');
if(povSel){povSel.value=pov; updateAvatar();}
function updateAvatar(){const im=qs('#povAvatar'); if(im) im.src=`assets/images/profiles/${idMap[pov]||'wira'}.webp`;}
function formatDay(iso){return new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(iso+'T12:00:00'));}
function rowHTML(m,prevDate){
  let h=''; if(m.d!==prevDate) h+=`<div class="day-sep"><span>${formatDay(m.d)}</span></div>`;
  if(m.type==='system') return h+`<div class="system-msg">${linkify(m.text||'Aktivitas grup')}</div>`;
  const mine=m.sender===pov;
  let body=''; if(m.mediaMissing) body+=`<div class="media-missing">▣ <span>Media belum tersedia</span></div>`;
  if(m.text) body+=`<div class="msg-text">${linkify(m.text)}</div>`;
  if(!body) body='<div class="msg-text" style="opacity:.6">Pesan kosong</div>';
  return h+`<div class="bubble-row ${mine?'mine':''}"><div class="bubble"><div class="sender">${esc(m.sender)}</div>${body}<div class="msg-meta">${m.time}</div></div></div>`;
}
function render(resetScroll=true){
  if(!list) return;
  const view=filtered.slice(start); let html='',prev='';
  for(const m of view){html+=rowHTML(m,prev);prev=m.d;}
  list.innerHTML=html || '<div class="system-msg">Tidak ada chat yang cocok dengan filter.</div>';
  if(resetScroll) list.scrollTop=list.scrollHeight;
  qs('#filterInfo').textContent=`Menampilkan ${view.length.toLocaleString('id-ID')} dari ${filtered.length.toLocaleString('id-ID')} hasil`;
  qs('#chatStatus').textContent=`${(meta.totalRecords||data.length).toLocaleString('id-ID')} rekaman • POV ${pov}`;
}
function prependOlder(){
  if(loading||start<=0) return; loading=true;
  const oldH=list.scrollHeight, batch=25; start=Math.max(0,start-batch);
  const view=filtered.slice(start); let html='',prev=''; for(const m of view){html+=rowHTML(m,prev);prev=m.d;}
  list.innerHTML=html; list.scrollTop=list.scrollHeight-oldH; loading=false;
  qs('#filterInfo').textContent=`Menampilkan ${(filtered.length-start).toLocaleString('id-ID')} dari ${filtered.length.toLocaleString('id-ID')} hasil`;
}
function applyFilters(){
 const q=qs('#searchText').value.trim().toLowerCase(), date=qs('#dateFilter').value, mo=+qs('#monthFilter').value||0, yr=+qs('#yearFilter').value||0;
 filtered=data.filter(m=>(!q||m.text.toLowerCase().includes(q)||m.sender.toLowerCase().includes(q))&&(!date||m.d===date)&&(!mo||m.m===mo)&&(!yr||m.y===yr));
 start=Math.max(0,filtered.length-10);render(true);
}
if(list) list.addEventListener('scroll',()=>{if(list.scrollTop<80) prependOlder();});
['searchText','dateFilter','monthFilter','yearFilter'].forEach(id=>{const el=qs('#'+id); if(el) el.addEventListener(id==='searchText'?'input':'change',applyFilters);});
if(povSel) povSel.addEventListener('change',e=>{pov=e.target.value;localStorage.setItem('pt-pov',pov);updateAvatar();render(false);});
qs('#clearFilters')?.addEventListener('click',()=>{qs('#searchText').value='';qs('#dateFilter').value='';qs('#monthFilter').value='';qs('#yearFilter').value='';applyFilters();});
function memories(){const box=qs('#todayMemories');if(!box)return;const n=new Date(),mm=n.getMonth()+1,dd=n.getDate(),yy=n.getFullYear();const groups={};for(const m of data){if(m.m===mm&&m.day===dd&&m.y<yy){(groups[m.y]??=[]).push(m)}}const ys=Object.keys(groups).sort((a,b)=>b-a).slice(0,3);if(!ys.length){box.innerHTML=`<div class="memory-card"><b>Kenangan Hari Ini</b><span>Belum ada chat pada tanggal ${dd}/${mm} di tahun sebelumnya.</span></div>`;return;}box.innerHTML=ys.map(y=>`<div class="memory-card" data-y="${y}"><b>${yy-y} tahun lalu • ${y}</b><span>${groups[y].length.toLocaleString('id-ID')} rekaman pada tanggal ini</span></div>`).join('');box.querySelectorAll('.memory-card[data-y]').forEach(c=>c.onclick=()=>{qs('#dateFilter').value=`${c.dataset.y}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;applyFilters();document.querySelector('.chat-shell').scrollIntoView({behavior:'smooth',block:'start'});});}
memories();render(true);
// hero slideshow
let si=0;const slides=[...document.querySelectorAll('.hero-slide')];if(slides.length>1)setInterval(()=>{slides[si].classList.remove('active');si=(si+1)%slides.length;slides[si].classList.add('active')},6500);
// reveal observer
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
})();
