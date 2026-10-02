(() => {
  const base = (window.PT_MEMORIES || []).map((x, i) => ({...x, id: `base-${i}`, uploaded: false}));
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let uploaded = [];

  function items(){ return [...uploaded, ...base]; }

  function render(){
    const list = items();
    const grid = qs('#memoryGrid');
    grid.innerHTML = list.map((m, i) => `
      <article class="memory-photo flat-photo ${i % 13 === 0 ? 'spotlight' : ''}" data-id="${esc(m.id)}">
        <img loading="lazy" src="${esc(m.src)}" alt="Foto memori PEJANTAN TANGGUH">
        ${m.uploaded ? '<div class="local-upload-badge">upload lokal</div>' : ''}
      </article>`).join('') || '<div class="gallery-empty">Belum ada foto memori.</div>';

    qsa('.memory-photo').forEach(el => el.onclick = () => {
      const m = items().find(x => x.id === el.dataset.id);
      if(!m) return;
      qs('#lightbox img').src = m.src;
      qs('#lightboxName').textContent = m.original || 'Foto memori';
      qs('#lightbox').classList.add('open');
    });

    qs('#gallerySummary').innerHTML = `<span><b>${list.length}</b> foto bersama</span><span><b>${uploaded.length}</b> upload lokal</span>`;
  }

  qs('#lightbox').onclick = e => {
    if(e.target.id === 'lightbox' || e.target.tagName === 'BUTTON') qs('#lightbox').classList.remove('open');
  };
  document.addEventListener('keydown', e => { if(e.key === 'Escape') qs('#lightbox').classList.remove('open'); });

  function openDB(){
    return new Promise((resolve, reject) => {
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const r = indexedDB.open('pt-memory-db-v16', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if(!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', {keyPath:'id'});
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }

  async function loadUploads(){
    try{
      const db = await openDB();
      const tx = db.transaction('photos', 'readonly');
      const req = tx.objectStore('photos').getAll();
      const rows = await new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error); });
      uploaded = rows.map(r => ({...r, src: URL.createObjectURL(r.blob), uploaded:true}));
      qs('#uploadStatus').textContent = uploaded.length ? `${uploaded.length} foto upload lokal tersimpan.` : 'Belum ada upload baru.';
      render();
    }catch{
      render();
    }
  }

  qs('#memoryUpload').onchange = async e => {
    const files = [...e.target.files];
    if(!files.length) return;
    let db = null;
    try{ db = await openDB(); }catch{}
    for(const file of files){
      const row = { id:`up-${Date.now()}-${Math.random().toString(36).slice(2)}`, original:file.name, blob:file, uploaded:true };
      if(db){
        await new Promise((resolve, reject) => {
          const tx = db.transaction('photos','readwrite');
          tx.objectStore('photos').put(row);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      }
      row.src = URL.createObjectURL(file);
      uploaded.unshift(row);
    }
    qs('#uploadStatus').textContent = `${uploaded.length} foto upload lokal tersimpan.`;
    e.target.value = '';
    render();
  };

  qs('#clearUploads').onclick = async () => {
    try{
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('photos','readwrite');
        tx.objectStore('photos').clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    }catch{}
    uploaded.forEach(x => x.src?.startsWith('blob:') && URL.revokeObjectURL(x.src));
    uploaded = [];
    qs('#uploadStatus').textContent = 'Upload lokal sudah dihapus.';
    render();
  };

  render();
  loadUploads();
})();
