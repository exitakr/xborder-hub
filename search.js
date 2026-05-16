// X Border Hub - Search page logic
// - Real-time filter by from/to/industry/role
// - "もっと見る" loads +10 results
// - Application modal opens when "話を聞く →" is clicked

const samplePeople = [
  // YT
  {
    initials: 'YT', avatarBg: '#0055A4', avatarText: '#FFF6E8',
    name: 'YT さん', age: 34, tenure: '在SG 3年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Tech', role: 'Product Manager',
    companies: 'Sony → Shopee',
    bio: '日系大手から東南アジアTechへ。3年で乗り越えた話なら。',
    rating: '4.9', sessions: 23, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'RN', avatarBg: '#FFC93C', avatarText: '#0A1F3D',
    name: 'RN さん', age: 31, tenure: '在SG 1年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Tech', role: 'Engineer',
    companies: 'DeNA → Grab',
    bio: 'エンジニアでローカル採用される現実。準備した英語と技術。',
    rating: '4.8', sessions: 8, available: true, badge: 'NEW',
  },
  {
    initials: 'HK', avatarBg: '#4ECDC4', avatarText: '#0A1F3D',
    name: 'HK さん', age: 42, tenure: '在SGN 4年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Vietnam', toCity: 'Ho Chi Minh',
    industry: 'Startup', role: 'BD / Sales',
    companies: '商社 → 個人起業',
    bio: '商社→VN起業。家族同行と現地パートナー探しの3つの基準。',
    rating: '4.9', sessions: 41, available: true, badge: '⭐ 4.9',
  },
  {
    initials: 'SK', avatarBg: '#6B4F8E', avatarText: '#FFF6E8',
    name: 'SK さん', age: 38, tenure: '在SG 5年目',
    from: 'Japan', fromCity: 'Osaka',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Consumer', role: 'Marketing',
    companies: 'P&G Japan → P&G APAC',
    bio: '消費財マーケで日本→APACリージョナル。社内異動の交渉術。',
    rating: '4.7', sessions: 15, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'TM', avatarBg: '#1FA89E', avatarText: '#FFF6E8',
    name: 'TM さん', age: 29, tenure: '在HKG 2年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Hong Kong', toCity: 'Hong Kong',
    industry: 'Finance', role: 'Finance / Accounting',
    companies: '日系銀行 → 外資IB',
    bio: '新卒日系→外資IB香港。語学とテクニカルどう詰めた?',
    rating: '4.8', sessions: 19, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'AK', avatarBg: '#0A1F3D', avatarText: '#FFC93C',
    name: 'AK さん', age: 36, tenure: '在SG 4年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Tech', role: 'Designer',
    companies: 'メルカリ → Shopee',
    bio: 'デザインリードとして英語環境へ。ポートフォリオの作り方。',
    rating: '4.9', sessions: 27, available: true, badge: '⭐ 4.9',
  },
  {
    initials: 'MS', avatarBg: '#FFC93C', avatarText: '#0A1F3D',
    name: 'MS さん', age: 33, tenure: '在BKK 2年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Thailand', toCity: 'Bangkok',
    industry: 'Startup', role: 'BD / Sales',
    companies: '日系商社 → 現地スタートアップ',
    bio: 'タイのSmart Visaと起業家枠の最新申請プロセス。',
    rating: '4.7', sessions: 12, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'JN', avatarBg: '#0055A4', avatarText: '#FFF6E8',
    name: 'JN さん', age: 35, tenure: '在SF 3年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'United States', toCity: 'San Francisco',
    industry: 'Tech', role: 'Engineer',
    companies: '楽天 → US Tech',
    bio: 'H1Bと現地転職。技術面接とビザの両立。',
    rating: '4.9', sessions: 34, available: true, badge: '⭐ 4.9',
  },
  {
    initials: 'KW', avatarBg: '#6B4F8E', avatarText: '#FFF6E8',
    name: 'KW さん', age: 40, tenure: '在SG 6年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Finance', role: 'BD / Sales',
    companies: '日系証券 → 米系IB',
    bio: 'シニア層の現地転職。家族同行と教育費。',
    rating: '4.8', sessions: 22, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'NA', avatarBg: '#4ECDC4', avatarText: '#0A1F3D',
    name: 'NA さん', age: 32, tenure: '在SG 2年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Tech', role: '駐在帯同(無職)',
    companies: '夫の駐在で帯同',
    bio: '駐在帯同で来星。EP申請、住居、子供の学校、再就職活動の現実。',
    rating: '4.9', sessions: 11, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'HM', avatarBg: '#1FA89E', avatarText: '#FFF6E8',
    name: 'HM さん', age: 30, tenure: '在SGN 1年目',
    from: 'Japan', fromCity: 'Osaka',
    to: 'Vietnam', toCity: 'Ho Chi Minh',
    industry: 'Manufacturing', role: 'Engineer',
    companies: '製造業 → 現地工場',
    bio: '製造業からベトナム現地法人へ。技術者の海外赴任。',
    rating: '4.6', sessions: 7, available: true, badge: 'NEW',
  },
  {
    initials: 'YS', avatarBg: '#FFC93C', avatarText: '#0A1F3D',
    name: 'YS さん', age: 37, tenure: '在NYC 4年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'United States', toCity: 'New York',
    industry: 'Finance', role: 'Finance / Accounting',
    companies: '日系銀行 → US Bank',
    bio: 'NYでの金融キャリア。ビザ・税制・教育まで。',
    rating: '4.9', sessions: 31, available: true, badge: '⭐ 4.9',
  },
  {
    initials: 'TF', avatarBg: '#0055A4', avatarText: '#FFF6E8',
    name: 'TF さん', age: 28, tenure: '在SG 1年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Startup', role: 'Engineer',
    companies: '日系SaaS → SG Startup',
    bio: '若手エンジニアの海外Startup挑戦。',
    rating: '4.7', sessions: 6, available: true, badge: 'NEW',
  },
  {
    initials: 'RT', avatarBg: '#6B4F8E', avatarText: '#FFF6E8',
    name: 'RT さん', age: 39, tenure: '在SG 5年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Consumer', role: 'HR / People',
    companies: '日系メーカー → 外資FMCG',
    bio: 'HRBPとして英語環境へ。組織変革とローカルカルチャー。',
    rating: '4.8', sessions: 18, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'UE', avatarBg: '#4ECDC4', avatarText: '#0A1F3D',
    name: 'UE さん', age: 34, tenure: '在HKG 3年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Hong Kong', toCity: 'Hong Kong',
    industry: 'Tech', role: 'Product Manager',
    companies: 'ヤフー → Tencent HK',
    bio: '中華圏Tech企業でPM。中国語学習と意思決定スピード。',
    rating: '4.8', sessions: 14, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'KO', avatarBg: '#FFC93C', avatarText: '#0A1F3D',
    name: 'KO さん', age: 36, tenure: '在London 3年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'United States', toCity: 'New York',
    industry: 'Tech', role: 'Product Manager',
    companies: 'Sony → Spotify',
    bio: '東京→ロンドン→NY。3か国を経験したPM視点。',
    rating: '4.9', sessions: 25, available: true, badge: '⭐ 4.9',
  },
  {
    initials: 'IT', avatarBg: '#0A1F3D', avatarText: '#FFC93C',
    name: 'IT さん', age: 41, tenure: '在JKT 5年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Indonesia', toCity: 'Jakarta',
    industry: 'Manufacturing', role: 'BD / Sales',
    companies: '商社 → インドネシア駐在 → 現地法人代表',
    bio: 'ジャカルタ駐在から現地法人代表へ。生活と人脈。',
    rating: '4.8', sessions: 20, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'EM', avatarBg: '#1FA89E', avatarText: '#FFF6E8',
    name: 'EM さん', age: 33, tenure: '在SG 2年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Healthcare', role: 'BD / Sales',
    companies: '武田 → 外資ヘルスケアAPAC',
    bio: '製薬→ヘルスケアAPAC営業。リージョナル統括の実態。',
    rating: '4.7', sessions: 9, available: true, badge: 'NEW',
  },
  {
    initials: 'OK', avatarBg: '#0055A4', avatarText: '#FFF6E8',
    name: 'OK さん', age: 38, tenure: '在SG 4年目',
    from: 'Japan', fromCity: 'Tokyo',
    to: 'Singapore', toCity: 'Singapore',
    industry: 'Tech', role: 'Marketing',
    companies: 'リクルート → Tech Unicorn',
    bio: 'B2C出身のグロースマーケ。SG発APACへの展開戦略。',
    rating: '4.8', sessions: 16, available: true, badge: '⚡ 相談可',
  },
  {
    initials: 'KZ', avatarBg: '#6B4F8E', avatarText: '#FFF6E8',
    name: 'KZ さん', age: 31, tenure: '在KUL 2年目',
    from: 'Japan', fromCity: 'Osaka',
    to: 'Malaysia', toCity: 'Kuala Lumpur',
    industry: 'Tech', role: 'Engineer',
    companies: '日系SIer → KL Tech',
    bio: 'KLでの生活コストと技術者キャリア。',
    rating: '4.6', sessions: 5, available: true, badge: 'NEW',
  },
];

let displayCount = 5;  // initial show
const INCREMENT = 10;
let filteredResults = [];

function getFilters() {
  return {
    from: document.getElementById('filter-from').value,
    to: document.getElementById('filter-to').value,
    industry: document.getElementById('filter-industry').value,
    role: document.getElementById('filter-role').value,
  };
}

function filterPeople() {
  const f = getFilters();
  return samplePeople.filter(p => {
    if (f.from && p.from !== f.from) return false;
    if (f.to && p.to !== f.to) return false;
    if (f.industry && p.industry !== f.industry) return false;
    if (f.role && p.role !== f.role) return false;
    return true;
  });
}

function renderResults() {
  filteredResults = filterPeople();
  const list = document.getElementById('results-list');
  const loadMore = document.getElementById('load-more');
  const countEl = document.getElementById('result-count');
  countEl.textContent = filteredResults.length;

  if (filteredResults.length === 0) {
    list.innerHTML = `
      <div class="bg-paper border-[1.5px] border-ink rounded-2xl p-8 text-center shadow-pop-sm">
        <p class="text-3xl mb-2">🔍</p>
        <p class="display font-bold text-[16px] text-ink">該当する人がまだいません</p>
        <p class="text-[12px] text-ink-soft mt-2">フィルタを変えるか、リセットを試してください</p>
      </div>
    `;
    loadMore.style.display = 'none';
    return;
  }

  const shown = filteredResults.slice(0, displayCount);
  list.innerHTML = shown.map((p, i) => `
    <article class="result-card bg-cream border-[1.5px] border-ink rounded-2xl p-4 lg:p-5 shadow-pop-sm">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-12 h-12 rounded-full font-bold flex items-center justify-center text-sm border-[1.5px] border-ink shadow-pop-sm flex-shrink-0" style="background:${p.avatarBg}; color:${p.avatarText};">${p.initials}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-bold text-[14px] text-ink">${p.name}</p>
            <span class="text-[9px] uppercase tracking-wider bg-jade/20 text-jade-deep px-1.5 py-0.5 rounded border border-jade font-bold whitespace-nowrap">${p.badge}</span>
          </div>
          <p class="text-[11px] text-ink-soft mt-0.5">${p.age}歳 · ${p.tenure}</p>
        </div>
        <a href="profile.html" class="text-[11px] text-blue font-bold whitespace-nowrap">詳細 →</a>
      </div>

      <!-- Route -->
      <div class="bg-paper border border-ink/20 rounded-xl p-2.5 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="display font-bold text-[14px] text-ink">${p.fromCity}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0055A4" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          <span class="display font-bold text-[14px] text-blue">${p.toCity}</span>
        </div>
        <p class="text-[13px] font-bold text-ink mt-1.5">${p.industry} · ${p.role}</p>
        <p class="text-[11px] text-ink-soft mt-0.5">${p.companies}</p>
      </div>

      <p class="text-[12px] text-ink leading-relaxed mb-3">${p.bio}</p>

      <div class="flex items-center justify-between pt-3 border-t border-dashed border-ink/15">
        <span class="text-[10px] text-ink-faint font-bold">⭐ ${p.rating} · ${p.sessions}件</span>
        <button onclick="openApply('${p.initials}','${p.name}','${p.fromCity}→${p.toCity}','${p.avatarBg}','${p.avatarText}')" class="px-4 py-2 bg-ink text-cream rounded-full font-bold text-[11px] shadow-pop-sm">
          話を聞く →
        </button>
      </div>
    </article>
  `).join('');

  // Show / hide load more
  if (filteredResults.length > displayCount) {
    loadMore.style.display = 'inline-flex';
    loadMore.textContent = 'もっと見る';
  } else {
    loadMore.style.display = 'none';
  }

  // Sync filter visual state (filled)
  ['from', 'to', 'industry', 'role'].forEach(name => {
    const el = document.getElementById('filter-' + name);
    if (el.value) el.classList.add('filled');
    else el.classList.remove('filled');
  });
}

// Event bindings
['from', 'to', 'industry', 'role'].forEach(name => {
  document.getElementById('filter-' + name).addEventListener('change', () => {
    displayCount = 5;  // reset on filter change
    renderResults();
  });
});

document.getElementById('reset-filters').addEventListener('click', () => {
  ['from', 'to', 'industry', 'role'].forEach(name => {
    const el = document.getElementById('filter-' + name);
    el.value = '';
    el.classList.remove('filled');
  });
  displayCount = 5;
  renderResults();
});

document.getElementById('load-more').addEventListener('click', () => {
  displayCount += INCREMENT;
  renderResults();
});

// Application modal
const overlay = document.getElementById('modal-overlay');
const sheet = document.getElementById('app-sheet');
const toast = document.getElementById('toast');

function openApply(initials, name, route, bg, fg) {
  const av = document.getElementById('app-avatar');
  av.textContent = initials;
  av.style.background = bg;
  av.style.color = fg;
  document.getElementById('app-name').textContent = name;
  document.getElementById('app-route').textContent = route;
  document.getElementById('app-message').value = '';
  document.getElementById('app-date').value = '';
  document.getElementById('char-count').textContent = '0';

  overlay.classList.add('open');
  sheet.classList.add('open');
}

function closeApply() {
  overlay.classList.remove('open');
  sheet.classList.remove('open');
}

document.getElementById('close-app').addEventListener('click', closeApply);
overlay.addEventListener('click', closeApply);

document.getElementById('app-message').addEventListener('input', (e) => {
  document.getElementById('char-count').textContent = e.target.value.length;
});

document.getElementById('submit-app').addEventListener('click', () => {
  const msg = document.getElementById('app-message').value.trim();
  if (!msg) {
    alert('話を聞きたい内容を入力してください');
    return;
  }
  closeApply();
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  // ここで本来はAPI送信、マイページ履歴に追加など
});

// Initial render
renderResults();
