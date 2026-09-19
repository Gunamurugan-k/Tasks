/* Pulse: self-contained Spotify-inspired demo. Music is ORIGINAL short instrumental demos. */
const tracks = [
  { id: 'neon', title: 'Neon Nights', artist: 'Pulse Originals', album: 'After Hours', cover: 'assets/neon-nights.svg', audio: 'audio/neon-nights.mp3', description: 'A little glow for your late-night drive.' },
  { id: 'golden', title: 'Golden Hour', artist: 'The Daydreamers', album: 'Soft Focus', cover: 'assets/golden-hour.svg', audio: 'audio/golden-hour.mp3', description: 'Warm beats for brighter days.' },
  { id: 'starlight', title: 'Starlight', artist: 'Orbit Club', album: 'Somewhere Far', cover: 'assets/starlight.svg', audio: 'audio/starlight.mp3', description: 'Float away for a little while.' },
  { id: 'rain', title: 'Rain Check', artist: 'Sunday Studio', album: 'Window Seat', cover: 'assets/rain-check.svg', audio: 'audio/rain-check.mp3', description: 'The soundtrack to a rainy afternoon.' },
  { id: 'ocean', title: 'Ocean Drive', artist: 'Coastline', album: 'Blue Signals', cover: 'assets/ocean-drive.svg', audio: 'audio/ocean-drive.mp3', description: 'Take the scenic route.' },
  { id: 'bloom', title: 'Slow Bloom', artist: 'The Daydreamers', album: 'Soft Focus', cover: 'assets/slow-bloom.svg', audio: 'audio/slow-bloom.mp3', description: 'Easy listening, big feelings.' }
];
const defaultPlaylists = [
  { id: 'chill', title: 'Chill Vibes', caption: 'Unwind, breathe, repeat', cover: 'assets/rain-check.svg', trackIds: ['rain','golden','bloom','starlight'] },
  { id: 'night', title: 'Night Drive', caption: 'Turn the lights down', cover: 'assets/neon-nights.svg', trackIds: ['neon','ocean','starlight','golden'] },
  { id: 'soft', title: 'Soft Focus', caption: 'For your quieter moments', cover: 'assets/slow-bloom.svg', trackIds: ['bloom','golden','rain'] },
  { id: 'discover', title: 'Fresh Finds', caption: 'A little bit of everything', cover: 'assets/ocean-drive.svg', trackIds: ['ocean','starlight','neon','bloom','rain','golden'] }
];
const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const getTrack = (id) => tracks.find((track) => track.id === id);
const safeText = (text) => String(text).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const readStored = (key, fallback) => { try { const data = JSON.parse(localStorage.getItem(key)); return data === null ? fallback : data; } catch { return fallback; } };
const store = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* Private browsing or disabled storage */ } };
let liked = new Set(readStored('pulse-liked', []));
let customPlaylists = readStored('pulse-playlists', []);
let selectedId = tracks[0].id;
let playOrder = tracks.map((track) => track.id);
let playing = false;
let shuffle = false;
let repeat = false;
let muted = false;
let volumeBeforeMute = 75;
let activeView = 'home';
let activePlaylist = null;
let libraryFilter = 'all';
let toastTimer;
const audio = byId('audio');
audio.volume = .75;

function toast(message) {
  const el = byId('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
function setRangeFill(input) { input.style.setProperty('--fill', `${((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100}%`); }
function formatTime(value) { if (!Number.isFinite(value) || value < 0) return '0:00'; const n = Math.floor(value); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2,'0')}`; }
function makeLikedImage(className='liked-icon') { return `<div class="${className}">${icon('heart')}</div>`; }
function playlistById(id) { return [...defaultPlaylists,...customPlaylists].find((p) => p.id === id); }
function playlistTracks(id) { if (id === 'liked') return tracks.filter((t) => liked.has(t.id)); const p = playlistById(id); return p ? p.trackIds.map(getTrack).filter(Boolean) : []; }
function coverCard(track) {
  return `<button class="music-card ${track.id === selectedId && playing ? 'playing' : ''}" data-track="${track.id}" aria-label="Play ${safeText(track.title)}">
    <div class="cover-wrap"><img src="${track.cover}" alt="${safeText(track.album)} cover" loading="lazy"/><span class="card-play">${icon(track.id === selectedId && playing ? 'pause' : 'play')}</span></div>
    <h3>${safeText(track.title)}</h3><p>${safeText(track.artist)} · ${safeText(track.description)}</p></button>`;
}
function playlistCard(p) {
  return `<button class="music-card" data-playlist="${p.id}" aria-label="Open ${safeText(p.title)} playlist"><div class="cover-wrap"><img src="${p.cover}" alt="${safeText(p.title)} playlist cover" loading="lazy"/><span class="card-play">${icon('play')}</span></div><h3>${safeText(p.title)}</h3><p>${safeText(p.caption)}</p></button>`;
}
function renderHome() {
  const hour = new Date().getHours();
  byId('greeting').textContent = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const quick = [
    { id:'liked', title:'Liked Songs', cover:null },
    { id:'chill', title:'Chill Vibes', cover:'assets/rain-check.svg' },
    { id:'night', title:'Night Drive', cover:'assets/neon-nights.svg' },
    { id:'soft', title:'Soft Focus', cover:'assets/slow-bloom.svg' },
    { id:'discover', title:'Fresh Finds', cover:'assets/ocean-drive.svg' },
    { id:'all', title:'Your Top Mix', cover:'assets/starlight.svg' }
  ];
  byId('quickGrid').innerHTML = quick.map((p) => `<button class="quick-card" data-playlist="${p.id}">${p.cover ? `<img src="${p.cover}" alt=""/>` : makeLikedImage('quick-art')}<strong>${safeText(p.title)}</strong><span class="hover-play">${icon('play')}</span></button>`).join('');
  byId('popularGrid').innerHTML = tracks.slice(0,4).map(coverCard).join('');
  byId('moodGrid').innerHTML = defaultPlaylists.map(playlistCard).join('');
  byId('freshGrid').innerHTML = tracks.slice(2,6).map(coverCard).join('');
}
function renderLibrary() {
  const likedItem = `<button class="library-item ${activePlaylist === 'liked' && activeView === 'playlist' ? 'current':''}" data-playlist="liked">${makeLikedImage()}<div><strong>Liked Songs</strong><small>Playlist · ${liked.size} songs</small></div></button>`;
  let items = libraryFilter === 'playlists' ? '' : likedItem;
  if (libraryFilter !== 'liked') items += [...defaultPlaylists,...customPlaylists].map((p) => `<button class="library-item ${activePlaylist === p.id && activeView === 'playlist' ? 'current':''}" data-playlist="${p.id}"><img src="${p.cover}" alt=""/><div><strong>${safeText(p.title)}</strong><small>Playlist · ${p.trackIds.length} songs</small></div></button>`).join('');
  byId('libraryItems').innerHTML = items;
  document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('selected', chip.dataset.filter === libraryFilter));
}
function renderSearch() {
  const query = byId('searchInput').value.trim().toLowerCase();
  const foundTracks = tracks.filter((t) => `${t.title} ${t.artist} ${t.album} ${t.description}`.toLowerCase().includes(query));
  const foundPlaylists = [...defaultPlaylists,...customPlaylists].filter((p) => `${p.title} ${p.caption}`.toLowerCase().includes(query));
  byId('searchHeading').textContent = query ? `Results for “${byId('searchInput').value.trim()}”` : 'Browse all';
  const parts = [];
  if (foundTracks.length) parts.push(`<p class="search-category">Songs</p>${foundTracks.map(coverCard).join('')}`);
  if (foundPlaylists.length) parts.push(`<p class="search-category">Playlists</p>${foundPlaylists.map(playlistCard).join('')}`);
  byId('searchResults').innerHTML = parts.length ? parts.join('') : `<div class="empty-state">${icon('search')}<h3>No results found</h3><p>Try another song, artist, or playlist name.</p></div>`;
}
function renderPlaylist(id) {
  const isLiked = id === 'liked';
  const isAll = id === 'all';
  const p = isLiked ? { title:'Liked Songs',caption:'Your collection of favorites',cover:null } : isAll ? {title:'Your Top Mix',caption:'All the sounds in one place',cover:'assets/starlight.svg'} : playlistById(id);
  if (!p) return showView('home');
  const songs = isAll ? tracks : playlistTracks(id);
  const bannerImage = p.cover ? `<img src="${p.cover}" alt="${safeText(p.title)} artwork"/>` : makeLikedImage('banner-liked');
  const rows = songs.map((track,index) => `<tr data-track="${track.id}" class="${track.id === selectedId ? 'active-song':''}"><td>${index + 1}</td><td><div class="song-cell"><img src="${track.cover}" alt=""/><div><strong>${safeText(track.title)}</strong><small>${safeText(track.artist)}</small></div></div></td><td>${safeText(track.album)}</td><td>0:24</td></tr>`).join('');
  byId('playlistView').innerHTML = `<div class="playlist-banner">${bannerImage}<div><span class="eyebrow">PUBLIC PLAYLIST</span><h1>${safeText(p.title)}</h1><p>${safeText(p.caption)} · ${songs.length} songs</p></div></div><div class="playlist-tools"><button class="playlist-play" data-play-playlist="${id}" title="Play playlist" aria-label="Play ${safeText(p.title)}">${icon('play')}</button><span style="font-size:12px;color:#aaa">${songs.length ? 'Press play and stay a while' : 'Like some songs to add them here'}</span></div>${songs.length ? `<table class="song-table"><thead><tr><th>#</th><th>Title</th><th>Album</th><th>${icon('clock')}</th></tr></thead><tbody>${rows}</tbody></table>` : `<div class="empty-state">${icon('heart')}<h3>Your collection starts here</h3><p>Tap the heart next to a playing song to save it.</p></div>`}`;
}
function showView(view, id) {
  activeView = view; activePlaylist = view === 'playlist' ? id : null;
  for (const key of ['home','search','playlist']) byId(`${key}View`).hidden = key !== view;
  byId('topSearch').classList.toggle('visible', view === 'search');
  byId('homeNav').classList.toggle('active', view === 'home');
  byId('searchNav').classList.toggle('active', view === 'search');
  if (view === 'home') renderHome();
  if (view === 'search') renderSearch();
  if (view === 'playlist') renderPlaylist(id);
  renderLibrary();
  byId('mainPanel').scrollTop = 0;
  byId('sidebar').classList.remove('open');
}
function setTrack(id, autoPlay=false, order) {
  const track = getTrack(id); if (!track) return;
  selectedId = id; if (order?.length) playOrder = order.slice();
  audio.src = track.audio; audio.load();
  byId('nowCover').src = track.cover;
  byId('nowCover').alt = `${track.title} album art`;
  byId('nowTitle').textContent = track.title;
  byId('nowArtist').textContent = track.artist;
  byId('currentTime').textContent = '0:00';byId('duration').textContent = '0:24';
  byId('progressBar').value = 0;setRangeFill(byId('progressBar'));
  updateLike();
  if (autoPlay) playAudio(); else { playing = false; updatePlayIcon(); }
  refreshVisible();renderQueue();
}
async function playAudio() {
  try { await audio.play(); playing = true; updatePlayIcon(); refreshVisible(); } catch { playing = false; updatePlayIcon(); toast('Could not play audio. Open with a local server or try again.'); }
}
function togglePlay() { if (audio.paused) playAudio(); else { audio.pause(); playing = false; updatePlayIcon();refreshVisible(); } }
function updatePlayIcon() {
  byId('playIcon').innerHTML = `<use href="#i-${playing ? 'pause':'play'}"/>`;
  byId('playBtn').setAttribute('aria-label', playing ? 'Pause' : 'Play');
}
function refreshVisible() {
  if (activeView === 'home') renderHome();
  if (activeView === 'search') renderSearch();
  if (activeView === 'playlist') renderPlaylist(activePlaylist);
}
function nextTrack(direction=1, fromEnd=false) {
  if (fromEnd && repeat) {audio.currentTime = 0;playAudio();return;}
  const order = playOrder.length ? playOrder : tracks.map((t) => t.id);
  const position = Math.max(0,order.indexOf(selectedId));
  let nextPosition;
  if (shuffle && order.length > 1) { nextPosition = Math.floor(Math.random() * (order.length - 1)); if (nextPosition >= position) nextPosition++; }
  else nextPosition = (position + direction + order.length) % order.length;
  setTrack(order[nextPosition], true);
}
function updateLike() {
  const yes = liked.has(selectedId);
  byId('likeBtn').classList.toggle('liked',yes);
  byId('likeBtn').setAttribute('aria-pressed',String(yes));
  byId('likeBtn').setAttribute('aria-label',yes?'Unlike this song':'Like this song');
}
function toggleLike() {
  if (liked.has(selectedId)) { liked.delete(selectedId);toast('Removed from Liked Songs'); }
  else { liked.add(selectedId);toast('Added to Liked Songs'); }
  store('pulse-liked',[...liked]);updateLike();renderLibrary();refreshVisible();
}
function renderQueue() {
  byId('queueItems').innerHTML = playOrder.map((id) => {const t=getTrack(id);return `<button class="queue-row ${id === selectedId ? 'current':''}" data-track="${id}"><img src="${t.cover}" alt=""/><div><strong>${safeText(t.title)}</strong><small>${safeText(t.artist)}${id === selectedId ? ' · Now playing':''}</small></div></button>`;}).join('');
}
function openCreateDialog() {
  byId('modalTitle').textContent='Create a playlist';
  byId('modalDescription').textContent='Give your new playlist a name. It will appear in your library and stay saved in this browser.';
  byId('playlistName').hidden=false;byId('playlistName').value='';
  byId('modalConfirm').hidden=false;byId('modalConfirm').textContent='Create playlist';
  byId('modal').dataset.mode='create';byId('modal').showModal();byId('playlistName').focus();
}
function createPlaylist() {
  const title=byId('playlistName').value.trim();
  if (!title) { toast('Enter a playlist name');return false; }
  const id=`custom-${Date.now()}`;
  customPlaylists.push({ id, title, caption:'Your personal mix',cover:'assets/starlight.svg',trackIds:[] });
  store('pulse-playlists',customPlaylists);renderLibrary();showView('playlist',id);toast('Playlist created');return true;
}
function playPlaylist(id) {
  const order=(id==='all'?tracks:playlistTracks(id)).map((t)=>t.id);
  if (!order.length) {toast('This playlist is empty');return;}
  setTrack(order[0],true,order);
}
// Event delegation keeps dynamically generated cards and rows interactive.
document.addEventListener('click',(event) => {
  const song=event.target.closest('[data-track]');
  if (song) {const id=song.dataset.track; if (id === selectedId) togglePlay();else { const order = activeView === 'playlist' ? (activePlaylist === 'all' ? tracks : playlistTracks(activePlaylist)).map((t) => t.id) : undefined; setTrack(id,true,order); } return;}
  const playPlaylistButton=event.target.closest('[data-play-playlist]');
  if (playPlaylistButton) {playPlaylist(playPlaylistButton.dataset.playPlaylist);return;}
  const playlist=event.target.closest('[data-playlist]');
  if (playlist) {showView('playlist',playlist.dataset.playlist);return;}
  const all=event.target.closest('[data-see-all]');
  if (all) {showView('search');byId('searchInput').focus();return;}
});
byId('homeNav').addEventListener('click',()=>showView('home'));
byId('searchNav').addEventListener('click',()=>{showView('search');byId('searchInput').focus();});
byId('backBtn').addEventListener('click',()=>{if(window.matchMedia('(max-width:760px)').matches){byId('sidebar').classList.toggle('open');}else showView('home');});
byId('forwardBtn').addEventListener('click',()=>{showView('search');byId('searchInput').focus();});
byId('searchInput').addEventListener('input',renderSearch);
byId('playBtn').addEventListener('click',togglePlay);
byId('nextBtn').addEventListener('click',()=>nextTrack(1));
byId('prevBtn').addEventListener('click',()=>{if(audio.currentTime>3){audio.currentTime=0;}else nextTrack(-1);});
byId('likeBtn').addEventListener('click',toggleLike);
byId('shuffleBtn').addEventListener('click',()=>{shuffle=!shuffle;byId('shuffleBtn').classList.toggle('enabled',shuffle);byId('shuffleBtn').setAttribute('aria-pressed',String(shuffle));toast(`Shuffle ${shuffle?'on':'off'}`);});
byId('repeatBtn').addEventListener('click',()=>{repeat=!repeat;byId('repeatBtn').classList.toggle('enabled',repeat);byId('repeatBtn').setAttribute('aria-pressed',String(repeat));toast(`Repeat ${repeat?'on':'off'}`);});
byId('progressBar').addEventListener('input',(event)=>{setRangeFill(event.target);const dur=audio.duration;if(Number.isFinite(dur))audio.currentTime=dur*Number(event.target.value)/100;});
byId('volumeBar').addEventListener('input',(event)=>{audio.volume=Number(event.target.value)/100;audio.muted=muted=audio.volume===0;byId('volumeIcon').innerHTML=`<use href="#i-${muted?'muted':'volume'}"/>`;setRangeFill(event.target);});
byId('muteBtn').addEventListener('click',()=>{if(!muted)volumeBeforeMute=Number(byId('volumeBar').value)||75;muted=!muted;audio.muted=muted;byId('volumeBar').value=muted?0:volumeBeforeMute;byId('volumeIcon').innerHTML=`<use href="#i-${muted?'muted':'volume'}"/>`;byId('muteBtn').setAttribute('aria-label',muted?'Unmute':'Mute');setRangeFill(byId('volumeBar'));});
byId('queueBtn').addEventListener('click',()=>{byId('queueDrawer').hidden=!byId('queueDrawer').hidden;renderQueue();});
byId('closeQueue').addEventListener('click',()=>byId('queueDrawer').hidden=true);
byId('createPlaylist').addEventListener('click',openCreateDialog);
document.querySelectorAll('.chip').forEach((el)=>el.addEventListener('click',()=>{libraryFilter=el.dataset.filter;renderLibrary();}));
byId('profileBtn').addEventListener('click',()=>{byId('modalTitle').textContent='Welcome to Pulse ✦';byId('modalDescription').textContent='An independently made, Spotify-inspired portfolio demo. All six short instrumentals are original and available offline. This is not affiliated with Spotify.';byId('playlistName').hidden=true;byId('modalConfirm').hidden=true;byId('modal').dataset.mode='about';byId('modal').showModal();});
byId('modalConfirm').addEventListener('click',(event)=>{if(byId('modal').dataset.mode==='create'&&!byId('playlistName').value.trim()){event.preventDefault();toast('Enter a playlist name');byId('playlistName').focus();}});
byId('modal').addEventListener('close',()=>{if(byId('modal').returnValue==='default' && byId('modal').dataset.mode==='create')createPlaylist();});
byId('playlistName').addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();if(createPlaylist())byId('modal').close('cancel');}});
audio.addEventListener('timeupdate',()=>{const dur=audio.duration;if(Number.isFinite(dur)&&dur>0){byId('progressBar').value=audio.currentTime/dur*100;setRangeFill(byId('progressBar'));}byId('currentTime').textContent=formatTime(audio.currentTime);});
audio.addEventListener('loadedmetadata',()=>{byId('duration').textContent=formatTime(audio.duration);});
audio.addEventListener('ended',()=>nextTrack(1,true));
audio.addEventListener('pause',()=>{if(playing){playing=false;updatePlayIcon();refreshVisible();}});
audio.addEventListener('play',()=>{playing=true;updatePlayIcon();refreshVisible();});
audio.addEventListener('error',()=>toast('Audio unavailable. Check that the audio folder is included.'));
document.addEventListener('keydown',(event)=>{
  const typing=['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)||byId('modal').open;
  if(event.key==='/'&&!typing){event.preventDefault();showView('search');byId('searchInput').focus();}
  if(event.code==='Space'&&!typing&&!['BUTTON','A'].includes(document.activeElement?.tagName)){event.preventDefault();togglePlay();}
  if(event.key==='Escape'){byId('queueDrawer').hidden=true;byId('sidebar').classList.remove('open');}
});
setRangeFill(byId('progressBar'));setRangeFill(byId('volumeBar'));setTrack(tracks[0].id,false);showView('home');
