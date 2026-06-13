(function() {
    const CAPSULE_UNLOCK_DATE = new Date('2029-06-13T00:00:00+08:00');
    const CAPSULE_STORAGE_KEY = 'yc2326_time_capsules';
    const BLESSING_STORAGE_KEY = 'yc2326_blessings';
    const MESSAGE_STORAGE_KEY = 'yc2326_messages';

    const galleryImages = [
        { src: './images/01-class-photo.jpg', title: '班级大合影', desc: '全员到齐的那一天' },
        { src: './images/02-sports-meet.jpg', title: '运动会', desc: '跑道上的汗水与呐喊' },
        { src: './images/03-classroom.jpg', title: '课堂瞬间', desc: '粉笔灰飞扬的日常' },
        { src: './images/04-performance.jpg', title: '文艺汇演', desc: '舞台上的闪耀时刻' },
        { src: './images/05-outing.jpg', title: '春游记忆', desc: '一起走过的风景' },
        { src: './images/06-graduation.jpg', title: '元旦晚会', desc: '快门按下的永恒' },
        { src: './images/07-daily.jpg', title: '日常掠影', desc: '那些不经意的美好' },
        { src: './images/08-teachers.jpg', title: '男神', desc: '教室内的欢乐' }
    ];

    function escapeHtml(str) { const div = document.createElement('div'); div.textContent = str; return div.innerHTML; }
    function escapeAttr(str) { return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function formatDate(d) { const date = new Date(d); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
    function showToast(msg) {
        const old = document.querySelector('.toast-msg'); if (old) old.remove();
        const t = document.createElement('div');
        t.className = 'toast-msg fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-[999] animate-fade-in-up pointer-events-none';
        t.textContent = msg; document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s ease'; setTimeout(() => t.remove(), 400); }, 2200);
    }

    // 滚动渐入
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.15 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));

    // 时间轴节点
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => e.target.classList.toggle('active', e.isIntersecting));
    }, { threshold: 0.5 });
    document.querySelectorAll('.timeline-dot').forEach(dot => timelineObserver.observe(dot));

    // 相册轮播
    const track = document.getElementById('galleryTrack'), dots = document.getElementById('galleryDots');
    const prevBtn = document.getElementById('galleryPrev'), nextBtn = document.getElementById('galleryNext');
    const viewport = document.getElementById('galleryViewport');
    let idx = 0, dragging = false, startX = 0, scrollStart = 0;

    function buildGallery() {
        track.innerHTML = ''; dots.innerHTML = '';
        galleryImages.forEach((img, i) => {
            const card = document.createElement('div'); card.className = 'gallery-card'; card.setAttribute('data-gallery-index', i);
            card.innerHTML = `<img src="${img.src}" alt="${img.title}" loading="lazy" onerror="this.parentElement.style.background='linear-gradient(135deg, #f0e8e0 0%, #e8dbd0 100%)'; this.style.display='none'; this.insertAdjacentHTML('afterend','<div class=\\'flex items-center justify-center h-full text-warm-400 text-sm\\'>📷 ${img.title}</div>')"><div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3 pointer-events-none"><p class="text-white text-xs font-medium">${img.title}</p></div>`;
            card.addEventListener('click', () => openLightbox(i)); track.appendChild(card);
            const dot = document.createElement('button');
            dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${i===0?'bg-sunset-500 w-5':'bg-warm-300 hover:bg-warm-400'}`;
            dot.setAttribute('aria-label', `第${i+1}张`); dot.addEventListener('click', () => goToSlide(i)); dots.appendChild(dot);
        });
    }
    function updateGallery(animate = true) {
        if (!track.firstChild) return;
        const w = track.firstChild.offsetWidth, gap = 16, vw = viewport.offsetWidth, offset = idx * (w+gap) - (vw/2 - w/2);
        track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
        track.style.transform = `translateX(${-offset}px)`;
        document.querySelectorAll('#galleryDots button').forEach((d,i) => { d.className = i===idx ? 'w-5 h-2 rounded-full bg-sunset-500' : 'w-2 h-2 rounded-full bg-warm-300 hover:bg-warm-400'; });
        prevBtn.style.opacity = idx===0 ? '0.3' : '1'; prevBtn.style.pointerEvents = idx===0 ? 'none' : 'auto';
        nextBtn.style.opacity = idx>=galleryImages.length-1 ? '0.3' : '1'; nextBtn.style.pointerEvents = idx>=galleryImages.length-1 ? 'none' : 'auto';
    }
    function goToSlide(i) { idx = Math.max(0, Math.min(i, galleryImages.length-1)); updateGallery(true); }
    prevBtn.addEventListener('click', () => { if (idx>0) { idx--; updateGallery(true); } });
    nextBtn.addEventListener('click', () => { if (idx<galleryImages.length-1) { idx++; updateGallery(true); } });
    viewport.addEventListener('pointerdown', e => { dragging=true; startX=e.clientX; scrollStart=idx; track.style.transition='none'; viewport.setPointerCapture(e.pointerId); });
    viewport.addEventListener('pointermove', e => {
        if (!dragging) return; const w = track.firstChild?.offsetWidth||280; const dx = e.clientX-startX;
        idx = Math.max(0, Math.min(scrollStart-Math.round(dx/(w+16)), galleryImages.length-1)); updateGallery(false);
    });
    viewport.addEventListener('pointerup', () => { dragging=false; updateGallery(true); });
    viewport.addEventListener('pointerleave', () => { if (dragging) { dragging=false; updateGallery(true); } });

    const lightbox = document.getElementById('lightboxOverlay'), lbImg = document.getElementById('lightboxImg');
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => { if (e.target===lightbox) closeLightbox(); });
    function openLightbox(i) { lbImg.src = galleryImages[i].src; lightbox.classList.add('open'); document.body.style.overflow='hidden'; }
    function closeLightbox() { lightbox.classList.remove('open'); document.body.style.overflow=''; setTimeout(() => { if (!lightbox.classList.contains('open')) lbImg.src=''; }, 350); }
    document.addEventListener('keydown', e => {
        if (e.key==='Escape' && lightbox.classList.contains('open')) closeLightbox();
        const r = document.getElementById('gallery').getBoundingClientRect();
        if (r.top<window.innerHeight && r.bottom>0) { if (e.key==='ArrowLeft') { if (idx>0) { idx--; updateGallery(true); } } if (e.key==='ArrowRight') { if (idx<galleryImages.length-1) { idx++; updateGallery(true); } } }
    });

    buildGallery(); requestAnimationFrame(() => requestAnimationFrame(() => updateGallery(false)));
    window.addEventListener('resize', () => { clearTimeout(window._gr); window._gr = setTimeout(() => updateGallery(false), 200); });

    // 时光胶囊
    document.getElementById('capsuleUnlockDateDisplay').textContent = `${CAPSULE_UNLOCK_DATE.getFullYear()}年${CAPSULE_UNLOCK_DATE.getMonth()+1}月${CAPSULE_UNLOCK_DATE.getDate()}日`;
    function getCaps() { try { return JSON.parse(localStorage.getItem(CAPSULE_STORAGE_KEY))||[]; } catch { return []; } }
    function saveCaps(d) { localStorage.setItem(CAPSULE_STORAGE_KEY, JSON.stringify(d)); }
    function isUnlocked(c) { return new Date() >= new Date(c.unlockDate); }
    function daysLeft(c) { return Math.max(0, Math.ceil((new Date(c.unlockDate)-new Date())/86400000)); }
    function renderCaps() {
        const caps = getCaps(), list = document.getElementById('capsuleList'), empty = document.getElementById('capsuleEmpty');
        if (!caps.length) { list.innerHTML=''; empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        list.innerHTML = caps.reverse().map((c,i) => {
            if (isUnlocked(c)) return `<div class="capsule-unlocked rounded-2xl p-5 sm:p-6 animate-capsule-seal" style="animation-delay:${i*0.1}s"><div class="flex items-center gap-2 mb-3"><span>🔓</span><span class="text-xs font-semibold text-sunset-600">胶囊已解锁</span><span class="text-xs text-warm-400 ml-auto">${formatDate(c.createdAt)} 封存</span></div><p class="text-ink leading-relaxed whitespace-pre-wrap">${escapeHtml(c.message)}</p><p class="text-sm text-warm-500 mt-3">—— ${escapeHtml(c.author)||'匿名'}</p><button class="mt-4 text-xs px-4 py-2 rounded-lg border border-sunset-300 text-sunset-600 hover:bg-sunset-50 share-btn" data-msg="${escapeAttr(c.message)}" data-author="${escapeAttr(c.author||'匿名')}">📤 分享到留言墙</button></div>`;
            else return `<div class="capsule-sealed rounded-2xl p-5 sm:p-6 animate-capsule-seal" style="animation-delay:${i*0.1}s"><div class="flex items-center gap-2 mb-3"><span>🔒</span><span class="text-xs text-warm-500">胶囊封存中</span><span class="text-xs text-warm-400 ml-auto">${formatDate(c.createdAt)}</span></div><div class="text-center py-4"><p class="text-3xl font-bold text-sunset-500">${daysLeft(c)}</p><p class="text-xs text-warm-400">天后解锁</p></div><p class="text-xs text-warm-400 text-center">—— ${escapeHtml(c.author)||'匿名'} 的寄语</p></div>`;
        }).join('');
        document.querySelectorAll('.share-btn').forEach(btn => btn.addEventListener('click', function() {
            const text = `【时光胶囊】${this.dataset.author} 的毕业寄语：\n\n${this.dataset.msg}\n\n—— 来自2326班时光胶囊`;
            navigator.clipboard?.writeText(text).catch(() => { const ta=document.createElement('textarea'); ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); });
            document.getElementById('messages').scrollIntoView({behavior:'smooth'}); showToast('✅ 内容已复制！请在留言墙粘贴发布');
        }));
    }
    document.getElementById('capsuleForm').addEventListener('submit', e => {
        e.preventDefault(); const author = document.getElementById('capsuleAuthor').value.trim()||'匿名';
        const msg = document.getElementById('capsuleMessage').value.trim(); if (!msg) return showToast('⚠️ 请写下寄语');
        const caps = getCaps(); caps.push({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,7), author, message: msg, unlockDate: CAPSULE_UNLOCK_DATE.toISOString(), createdAt: new Date().toISOString() });
        saveCaps(caps); document.getElementById('capsuleAuthor').value=''; document.getElementById('capsuleMessage').value=''; document.getElementById('capsuleCharCount').textContent='0';
        renderCaps(); showToast('🔒 胶囊已封存！'); document.getElementById('capsuleList').scrollIntoView({behavior:'smooth',block:'center'});
    });
    document.getElementById('capsuleMessage').addEventListener('input', function() { document.getElementById('capsuleCharCount').textContent = this.value.length; });
    renderCaps();

    // 祝福墙
    function getBless() { try { return JSON.parse(localStorage.getItem(BLESSING_STORAGE_KEY))||[]; } catch { return []; } }
    function saveBless(d) { localStorage.setItem(BLESSING_STORAGE_KEY, JSON.stringify(d)); }
    function renderBless() {
        const arr = getBless(), grid = document.getElementById('blessingGrid'), empty = document.getElementById('blessingEmpty');
        if (!arr.length) { grid.innerHTML=''; empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        grid.innerHTML = arr.reverse().map(b => `<div class="blessing-card animate-fade-in-up"><p class="author">${escapeHtml(b.author)||'匿名'}</p><p class="message">${escapeHtml(b.message)}</p><p class="text-xs text-warm-400 mt-2">${formatDate(b.createdAt)}</p></div>`).join('');
    }
    document.getElementById('blessingForm').addEventListener('submit', e => {
        e.preventDefault(); const author = document.getElementById('blessingAuthor').value.trim()||'匿名';
        const msg = document.getElementById('blessingMessage').value.trim(); if (!msg) return showToast('💬 请写下祝福');
        const arr = getBless(); arr.push({ id: Date.now().toString(36), author, message: msg, createdAt: new Date().toISOString() });
        saveBless(arr); document.getElementById('blessingAuthor').value=''; document.getElementById('blessingMessage').value=''; document.getElementById('blessingCharCount').textContent='0';
        renderBless(); showToast('🌟 祝福已送出！');
    });
    document.getElementById('blessingMessage').addEventListener('input', function() { document.getElementById('blessingCharCount').textContent = this.value.length; });
    renderBless();

    // ==================== 本地留言板 ====================
    function getMessages() { try { return JSON.parse(localStorage.getItem(MESSAGE_STORAGE_KEY)) || []; } catch(e) { return []; } }
    function saveMessages(msgs) { localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(msgs)); }
    function renderMessages() {
        const msgs = getMessages();
        const list = document.getElementById('messageList');
        const empty = document.getElementById('messageEmpty');
        if (!list) return;
        if (!msgs.length) { list.innerHTML = ''; if (empty) empty.classList.remove('hidden'); return; }
        if (empty) empty.classList.add('hidden');
        list.innerHTML = msgs.reverse().map(m => `
            <div>
                <div class="flex items-center gap-2 mb-2"><span class="font-semibold text-sunset-600 text-sm">${escapeHtml(m.author) || '匿名'}</span><span class="text-xs text-warm-400">${formatDate(m.createdAt)}</span></div>
                <p class="text-ink leading-relaxed whitespace-pre-wrap text-sm">${escapeHtml(m.message)}</p>
            </div>
        `).join('');
    }

    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const author = document.getElementById('messageAuthor').value.trim() || '匿名';
            const content = document.getElementById('messageContent').value.trim();
            if (!content) return showToast('💬 请输入留言内容');
            const msgs = getMessages();
            msgs.push({ id: Date.now().toString(36)+Math.random().toString(36).slice(2,7), author: author, message: content, createdAt: new Date().toISOString() });
            saveMessages(msgs);
            document.getElementById('messageAuthor').value = '';
            document.getElementById('messageContent').value = '';
            document.getElementById('messageCharCount').textContent = '0';
            renderMessages();
            showToast('✅ 留言发布成功！');
        });
        document.getElementById('messageContent').addEventListener('input', function() {
            document.getElementById('messageCharCount').textContent = this.value.length;
        });
    }
    renderMessages();

    // 高级导航
    const nav = document.getElementById('topNav'), links = document.querySelectorAll('.nav-link'), sections = document.querySelectorAll('section[id]');
    function onScroll() { nav.classList.toggle('nav-scrolled', window.scrollY > 50); }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
    const navObs = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) { links.forEach(l => l.classList.remove('active')); const a = document.querySelector(`.nav-link[data-section="${en.target.id}"]`); if (a) a.classList.add('active'); } });
    }, { rootMargin: '-20% 0px -70% 0px', threshold:0 });
    sections.forEach(s => navObs.observe(s));
    links.forEach(l => l.addEventListener('click', function(e) {
        const id = this.getAttribute('href').substring(1), sec = document.getElementById(id);
        if (sec) { e.preventDefault(); sec.scrollIntoView({behavior:'smooth'}); links.forEach(x => x.classList.remove('active')); this.classList.add('active'); }
    }));

    console.log('🌅 2326班毕业纪念站已就绪 | 少年不惧岁月长，彼方尚有荣光在');
})();
