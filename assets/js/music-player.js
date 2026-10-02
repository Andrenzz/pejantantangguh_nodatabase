(() => {
  'use strict';

  const PLAYLIST = [{"title": "About You", "artist": "The 1975", "src": "assets/music/track-01.mp3"}, {"title": "Die On This Hill", "artist": "SIENNA SPIRO", "src": "assets/music/track-02.mp3"}, {"title": "Merry Christmas, Please Don't Call", "artist": "Bleachers", "src": "assets/music/track-03.mp3"}, {"title": "Risk It All", "artist": "Bruno Mars", "src": "assets/music/track-04.mp3"}, {"title": "Shape of My Heart", "artist": "Backstreet Boys", "src": "assets/music/track-05.mp3"}, {"title": "What If I Call", "artist": "Alex Crichton", "src": "assets/music/track-06.mp3"}, {"title": "Rodok Rodok", "artist": "Unknown", "src": "assets/music/track-07.mp3"}, {"title": "PKI", "artist": "Unknown", "src": "assets/music/track-08.mp3"}];
  if (!PLAYLIST.length || document.querySelector('.pt-music-player')) return;

  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem(k); return v === null ? fallback : v; }
      catch (_) { return fallback; }
    },
    set(k, v) { try { localStorage.setItem(k, String(v)); } catch (_) {} }
  };

  let index = Math.max(0, Math.min(PLAYLIST.length - 1, Number(store.get('ptMusicIndex', 0)) || 0));
  let wasPlaying = store.get('ptMusicPlaying', '0') === '1';
  let lastSaved = 0;

  const audio = new Audio();
  audio.preload = 'metadata';

  const player = document.createElement('aside');
  player.className = 'pt-music-player';
  player.setAttribute('aria-label', 'Pemutar musik PEJANTAN TANGGUH');
  player.innerHTML = `
    <div class="pt-music-top">
      <div class="pt-music-mark" title="Musik">♫</div>
      <div class="pt-music-meta">
        <div class="pt-music-title"></div>
        <div class="pt-music-artist"></div>
      </div>
      <button class="pt-music-icon pt-search-toggle" type="button" aria-label="Cari lagu" title="Cari lagu">⌕</button>
      <button class="pt-music-icon pt-collapse" type="button" aria-label="Ciutkan pemutar" title="Ciutkan">–</button>
    </div>
    <div class="pt-music-main">
      <div class="pt-music-progress">
        <span class="pt-music-time pt-current">0:00</span>
        <input class="pt-music-range pt-seek" type="range" min="0" max="100" value="0" step="0.1" aria-label="Posisi lagu">
        <span class="pt-music-time pt-duration">0:00</span>
      </div>
      <div class="pt-music-controls">
        <button class="pt-music-control pt-prev" type="button" aria-label="Lagu sebelumnya" title="Sebelumnya">◀◀</button>
        <button class="pt-music-control pt-music-play" type="button" aria-label="Putar musik" title="Putar/Jeda">▶</button>
        <button class="pt-music-control pt-next" type="button" aria-label="Lagu berikutnya" title="Berikutnya">▶▶</button>
        <div class="pt-music-volume">
          <button class="pt-music-icon pt-mute" type="button" aria-label="Matikan suara" title="Mute">🔊</button>
          <input class="pt-music-range pt-volume" type="range" min="0" max="1" value="0.65" step="0.01" aria-label="Volume">
        </div>
      </div>
    </div>
    <div class="pt-music-search">
      <input class="pt-music-searchbox" type="search" placeholder="Cari judul atau artis..." autocomplete="off" aria-label="Cari judul atau artis">
      <div class="pt-music-results"></div>
    </div>`;

  document.body.appendChild(player);

  const $ = (s) => player.querySelector(s);
  const titleEl = $('.pt-music-title');
  const artistEl = $('.pt-music-artist');
  const playBtn = $('.pt-music-play');
  const muteBtn = $('.pt-mute');
  const seek = $('.pt-seek');
  const volume = $('.pt-volume');
  const currentEl = $('.pt-current');
  const durationEl = $('.pt-duration');
  const searchWrap = $('.pt-music-search');
  const searchInput = $('.pt-music-searchbox');
  const results = $('.pt-music-results');
  const collapseBtn = $('.pt-collapse');

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const syncPlayButton = () => {
    playBtn.textContent = audio.paused ? '▶' : '❚❚';
    playBtn.setAttribute('aria-label', audio.paused ? 'Putar musik' : 'Jeda musik');
  };

  const syncMuteButton = () => {
    muteBtn.textContent = audio.muted || audio.volume === 0 ? '🔇' : '🔊';
  };

  const renderResults = (query = '') => {
    const q = query.trim().toLocaleLowerCase('id-ID');
    results.innerHTML = '';
    const matches = PLAYLIST.map((track, i) => ({ track, i })).filter((item) =>
      !q || item.track.title.toLocaleLowerCase('id-ID').includes(q) ||
      item.track.artist.toLocaleLowerCase('id-ID').includes(q)
    );
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'pt-music-empty';
      empty.textContent = 'Lagu tidak ditemukan.';
      results.appendChild(empty);
      return;
    }
    matches.forEach(({ track, i }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pt-music-result' + (i === index ? ' active' : '');
      const b = document.createElement('b');
      b.textContent = track.title;
      const span = document.createElement('span');
      span.textContent = track.artist;
      btn.append(b, span);
      btn.addEventListener('click', () => {
        setTrack(i, true, 0);
        searchWrap.classList.remove('open');
      });
      results.appendChild(btn);
    });
  };

  const setTrack = (newIndex, shouldPlay = false, resumeTime = 0) => {
    index = (newIndex + PLAYLIST.length) % PLAYLIST.length;
    const track = PLAYLIST[index];
    audio.src = track.src;
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    store.set('ptMusicIndex', index);
    seek.value = '0';
    currentEl.textContent = '0:00';
    durationEl.textContent = '0:00';
    renderResults(searchInput.value);

    const resume = () => {
      if (resumeTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(resumeTime, Math.max(0, audio.duration - 0.2));
      }
      if (shouldPlay) {
        audio.play().then(() => {
          wasPlaying = true;
          store.set('ptMusicPlaying', '1');
          syncPlayButton();
        }).catch(() => {
          wasPlaying = false;
          store.set('ptMusicPlaying', '0');
          syncPlayButton();
        });
      }
    };
    if (audio.readyState >= 1) resume(); else audio.addEventListener('loadedmetadata', resume, { once:true });
  };

  const savedVolume = Math.max(0, Math.min(1, Number(store.get('ptMusicVolume', 0.65))));
  audio.volume = Number.isFinite(savedVolume) ? savedVolume : 0.65;
  volume.value = String(audio.volume);
  audio.muted = store.get('ptMusicMuted', '0') === '1';
  syncMuteButton();

  const collapsed = store.get('ptMusicCollapsed', '0') === '1';
  player.classList.toggle('collapsed', collapsed);
  collapseBtn.textContent = collapsed ? '+' : '–';
  collapseBtn.setAttribute('title', collapsed ? 'Buka pemutar' : 'Ciutkan');

  setTrack(index, wasPlaying, Number(store.get('ptMusicTime', 0)) || 0);
  renderResults();

  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().then(() => {
        wasPlaying = true;
        store.set('ptMusicPlaying', '1');
        syncPlayButton();
      }).catch(() => {});
    } else {
      audio.pause();
      wasPlaying = false;
      store.set('ptMusicPlaying', '0');
      syncPlayButton();
    }
  });

  $('.pt-prev').addEventListener('click', () => setTrack(index - 1, true, 0));
  $('.pt-next').addEventListener('click', () => setTrack(index + 1, true, 0));

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    store.set('ptMusicMuted', audio.muted ? '1' : '0');
    syncMuteButton();
  });

  volume.addEventListener('input', () => {
    audio.volume = Number(volume.value);
    if (audio.volume > 0 && audio.muted) audio.muted = false;
    store.set('ptMusicVolume', audio.volume);
    store.set('ptMusicMuted', audio.muted ? '1' : '0');
    syncMuteButton();
  });

  seek.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (Number(seek.value) / 100) * audio.duration;
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      seek.value = String((audio.currentTime / audio.duration) * 100);
      currentEl.textContent = formatTime(audio.currentTime);
      durationEl.textContent = formatTime(audio.duration);
    }
    const now = Date.now();
    if (now - lastSaved > 1000) {
      store.set('ptMusicTime', audio.currentTime || 0);
      lastSaved = now;
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('play', syncPlayButton);
  audio.addEventListener('pause', syncPlayButton);
  audio.addEventListener('ended', () => setTrack(index + 1, true, 0));

  $('.pt-search-toggle').addEventListener('click', () => {
    searchWrap.classList.toggle('open');
    if (searchWrap.classList.contains('open')) {
      searchInput.focus();
      renderResults(searchInput.value);
    }
  });
  searchInput.addEventListener('input', () => renderResults(searchInput.value));

  collapseBtn.addEventListener('click', () => {
    const next = !player.classList.contains('collapsed');
    player.classList.toggle('collapsed', next);
    store.set('ptMusicCollapsed', next ? '1' : '0');
    collapseBtn.textContent = next ? '+' : '–';
    collapseBtn.setAttribute('title', next ? 'Buka pemutar' : 'Ciutkan');
  });

  window.addEventListener('beforeunload', () => {
    store.set('ptMusicIndex', index);
    store.set('ptMusicTime', audio.currentTime || 0);
    store.set('ptMusicPlaying', audio.paused ? '0' : '1');
  });

  syncPlayButton();
})();
