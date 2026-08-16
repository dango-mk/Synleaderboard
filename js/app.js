/**
 * Main Application Controller for SynLeaderboard
 * Auto-loads data from ./data/ txt files, supports Yearly Explorer Tree with Newest/Oldest Sorting,
 * Left Sidebar Calendar Widget, and Cloud Share links.
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  let appState = {
    matches: [],
    members: [],
    warLists: [],
    analytics: null,
    searchQuery: '',
    resultFilter: 'all',
    minDiff: null,
    maxDiff: null,
    selectedCalendarDate: null,
    onlyValid984: true,
    sortBy: 'newest',
    selectedMatch: null
  };

  // DOM Elements
  const btnShareLink = document.getElementById('btnShareLink');
  const btnExportDataFile = document.getElementById('btnExportDataFile');
  const btnDownloadDataInModal = document.getElementById('btnDownloadDataInModal');
  const toastNotification = document.getElementById('toastNotification');
  const dashboardContent = document.getElementById('dashboardContent');

  // Sidebar Elements
  const btnClearCalendarFilter = document.getElementById('btnClearCalendarFilter');
  const btnExpandAllExplorer = document.getElementById('btnExpandAllExplorer');
  const btnCollapseAllExplorer = document.getElementById('btnCollapseAllExplorer');
  const explorerSortSelect = document.getElementById('explorerSortSelect');

  // KPI Elements
  const kpiTotalMatches = document.getElementById('kpiTotalMatches');
  const kpiWinRate = document.getElementById('kpiWinRate');
  const kpiWinLoss = document.getElementById('kpiWinLoss');
  const kpiAvgDiff = document.getElementById('kpiAvgDiff');

  // Filter Elements
  const teamSearchInput = document.getElementById('teamSearchInput');
  const suggestionBox = document.getElementById('suggestionBox');
  const resultFilterSelect = document.getElementById('resultFilterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const minDiffInput = document.getElementById('minDiffInput');
  const maxDiffInput = document.getElementById('maxDiffInput');
  const btnClearDiffRange = document.getElementById('btnClearDiffRange');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const chkValid984 = document.getElementById('chkValid984');
  const matchesGrid = document.getElementById('matchesGrid');
  const matchesCountBadge = document.getElementById('matchesCountBadge');

  // Match Modal Elements
  const matchModal = document.getElementById('matchModal');
  const closeMatchModal = document.getElementById('closeMatchModal');
  const modalHomeTeam = document.getElementById('modalHomeTeam');
  const modalAwayTeam = document.getElementById('modalAwayTeam');
  const modalScore = document.getElementById('modalScore');
  const modalDiffBadge = document.getElementById('modalDiffBadge');
  const modalDate = document.getElementById('modalDate');
  const modalSlotTag = document.getElementById('modalSlotTag');
  const modalRaceNotice = document.getElementById('modalRaceNotice');
  const modalRaceTableBody = document.getElementById('modalRaceTableBody');

  // Share Modal Elements & Cloud Storage Integrations
  const shareModal = document.getElementById('shareModal');
  const closeShareModal = document.getElementById('closeShareModal');
  const qrCodeImg = document.getElementById('qrCodeImg');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const btnCopyShareUrl = document.getElementById('btnCopyShareUrl');
  const shareStatusBox = document.getElementById('shareStatusBox');

  // Expanded Calendar Modal Elements
  const btnExpandCalendar = document.getElementById('btnExpandCalendar');
  const expandedCalendarModal = document.getElementById('expandedCalendarModal');
  const closeExpandedCalendarModal = document.getElementById('closeExpandedCalendarModal');

  // ----------------------------------------------------
  // Initialize Calendar Widget & Explorer Controls
  // ----------------------------------------------------
  CalendarWidget.init({
    onDateSelect: (dateStr) => {
      appState.selectedCalendarDate = dateStr;
      if (btnClearCalendarFilter) {
        btnClearCalendarFilter.style.display = dateStr ? 'inline-block' : 'none';
      }
      renderMatches();
    },
    onMatchClick: (match) => {
      openMatchModal(match);
    }
  });

  if (explorerSortSelect) {
    explorerSortSelect.addEventListener('change', (e) => {
      CalendarWidget.setExplorerSortOrder(e.target.value);
    });
  }

  if (btnExpandAllExplorer) {
    btnExpandAllExplorer.addEventListener('click', () => {
      CalendarWidget.expandAllExplorer();
    });
  }

  if (btnCollapseAllExplorer) {
    btnCollapseAllExplorer.addEventListener('click', () => {
      CalendarWidget.collapseAllExplorer();
    });
  }

  if (btnClearCalendarFilter) {
    btnClearCalendarFilter.addEventListener('click', () => {
      appState.selectedCalendarDate = null;
      CalendarWidget.clearSelectedDate();
      btnClearCalendarFilter.style.display = 'none';
      renderMatches();
    });
  }

  if (btnExpandCalendar && expandedCalendarModal) {
    btnExpandCalendar.addEventListener('click', () => {
      expandedCalendarModal.classList.add('active');
    });
  }

  if (closeExpandedCalendarModal && expandedCalendarModal) {
    closeExpandedCalendarModal.addEventListener('click', () => {
      expandedCalendarModal.classList.remove('active');
    });
  }

  // ----------------------------------------------------
  // Event Listeners
  // ----------------------------------------------------

  btnShareLink.addEventListener('click', () => {
    openShareModal();
  });

  if (btnExportDataFile) {
    btnExportDataFile.addEventListener('click', () => {
      downloadSerializedDataFile();
    });
  }

  if (btnDownloadDataInModal) {
    btnDownloadDataInModal.addEventListener('click', () => {
      downloadSerializedDataFile();
    });
  }

  if (closeShareModal) {
    closeShareModal.addEventListener('click', () => {
      shareModal.classList.remove('active');
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      if (shareUrlInput.value) {
        navigator.clipboard.writeText(shareUrlInput.value).then(() => {
          showToast('🔗 共有用URLをクリップボードにコピーしました！');
        });
      }
    });
  }

  // Filter Listeners
  teamSearchInput.addEventListener('input', (e) => {
    appState.searchQuery = e.target.value;
    updateTeamSuggestions();
    renderMatches();
  });

  resultFilterSelect.addEventListener('change', (e) => {
    appState.resultFilter = e.target.value;
    renderMatches();
  });

  sortSelect.addEventListener('change', (e) => {
    appState.sortBy = e.target.value;
    renderMatches();
  });

  if (minDiffInput) {
    minDiffInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      appState.minDiff = val !== '' && !isNaN(val) ? parseInt(val, 10) : null;
      updateActivePresetButtons();
      renderMatches();
    });
  }

  if (maxDiffInput) {
    maxDiffInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      appState.maxDiff = val !== '' && !isNaN(val) ? parseInt(val, 10) : null;
      updateActivePresetButtons();
      renderMatches();
    });
  }

  if (btnClearDiffRange) {
    btnClearDiffRange.addEventListener('click', () => {
      if (minDiffInput) minDiffInput.value = '';
      if (maxDiffInput) maxDiffInput.value = '';
      appState.minDiff = null;
      appState.maxDiff = null;
      updateActivePresetButtons();
      renderMatches();
    });
  }

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const minVal = btn.getAttribute('data-min');
      const maxVal = btn.getAttribute('data-max');

      if (minDiffInput) minDiffInput.value = minVal;
      if (maxDiffInput) maxDiffInput.value = maxVal;

      appState.minDiff = minVal !== '' && !isNaN(minVal) ? parseInt(minVal, 10) : null;
      appState.maxDiff = maxVal !== '' && !isNaN(maxVal) ? parseInt(maxVal, 10) : null;

      updateActivePresetButtons(btn);
      renderMatches();
    });
  });

  function updateActivePresetButtons(clickedBtn) {
    presetButtons.forEach(b => b.classList.remove('active'));
    if (clickedBtn) {
      clickedBtn.classList.add('active');
    }
  }

  if (chkValid984) {
    chkValid984.addEventListener('change', (e) => {
      appState.onlyValid984 = e.target.checked;
      CalendarWidget.setData(appState.matches, appState.onlyValid984);
      renderMatches();
    });
  }

  closeMatchModal.addEventListener('click', () => {
    matchModal.classList.remove('active');
  });

  window.addEventListener('click', (e) => {
    if (e.target === matchModal) matchModal.classList.remove('active');
    if (e.target === shareModal) shareModal.classList.remove('active');
    if (e.target === expandedCalendarModal) expandedCalendarModal.classList.remove('active');
  });

  // ----------------------------------------------------
  // Cloud JSON Bin Storage Service & Share Modal
  // ----------------------------------------------------

  async function uploadToCloudServer(payloadData) {
    try {
      const response = await fetch('https://api.npoint.io', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          return { type: 'npoint', id: data.id };
        }
      }
    } catch (e) {
      console.warn('Primary Cloud Bin API failed, trying fallback...', e);
    }

    try {
      const resp2 = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify(payloadData)
      });
      if (resp2.ok) {
        const data2 = await resp2.json();
        if (data2 && data2.metadata && data2.metadata.id) {
          return { type: 'jsonbin', id: data2.metadata.id };
        }
      }
    } catch (e) {
      console.warn('Fallback Cloud Bin API failed', e);
    }

    return null;
  }

  async function fetchFromCloudServer(binUrl) {
    try {
      const resp = await fetch(binUrl);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Failed to fetch from cloud storage URL', e);
    }
    return null;
  }

  async function openShareModal() {
    if (!appState.matches || appState.matches.length === 0) {
      showToast('共有するデータがありません。');
      return;
    }

    shareModal.classList.add('active');
    shareUrlInput.value = 'クラウドサーバーへアップロード中... ☁️';
    if (shareStatusBox) {
      shareStatusBox.style.display = 'block';
      shareStatusBox.style.background = 'rgba(56, 189, 248, 0.15)';
      shareStatusBox.style.color = 'var(--color-accent)';
      shareStatusBox.textContent = '⏳ 全成績データを無料クラウドサーバーへアップロードしています...';
    }

    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      matchCount: appState.matches.length,
      matches: appState.matches
    };

    const cloudRes = await uploadToCloudServer(payload);

    if (cloudRes && cloudRes.id) {
      const hashPrefix = cloudRes.type === 'npoint' ? '#n=' : '#j=';
      const shareUrl = `${window.location.origin}${window.location.pathname}${hashPrefix}${cloudRes.id}`;
      shareUrlInput.value = shareUrl;

      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
      qrCodeImg.src = qrApiUrl;

      if (shareStatusBox) {
        shareStatusBox.style.background = 'rgba(16, 185, 129, 0.15)';
        shareStatusBox.style.color = 'var(--color-win)';
        shareStatusBox.textContent = '✅ クラウド保存完了！超短縮URLが発行されました。コピーして送信してください！';
      }

      fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(shareUrl)}`)
        .then(res => res.text())
        .then(shortUrl => {
          if (shortUrl && shortUrl.startsWith('http')) {
            shareUrlInput.value = shortUrl;
            qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shortUrl)}`;
          }
        }).catch(() => {});

    } else {
      const compactStr = serializeMatchesCompact(appState.matches);
      const encoded = btoa(encodeURIComponent(compactStr));
      const hashUrl = `${window.location.origin}${window.location.pathname}#d=${encoded}`;
      shareUrlInput.value = hashUrl;
      qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(hashUrl)}`;
      
      if (shareStatusBox) {
        shareStatusBox.style.background = 'rgba(245, 158, 11, 0.15)';
        shareStatusBox.style.color = 'var(--color-draw)';
        shareStatusBox.textContent = '⚠️ ローカルエンコード方式でURLを生成しました。ファイル共有もご利用いただけます。';
      }
    }
  }

  function serializeMatchesCompact(matches) {
    return matches.map(m => `${m.awayTeam}:${m.homeScore}:${m.awayScore}:${m.date}`).join('|');
  }

  function deserializeMatchesCompact(compactStr) {
    if (!compactStr) return [];
    const items = compactStr.split('|');
    return items.map((item, idx) => {
      const parts = item.split(':');
      if (parts.length < 4) return null;
      const awayTeam = parts[0];
      const homeScore = parseInt(parts[1], 10);
      const awayScore = parseInt(parts[2], 10);
      const date = parts[3];
      const diff = homeScore - awayScore;
      const totalPoints = homeScore + awayScore;
      const isValid984 = (totalPoints === 984 && homeScore > 0 && awayScore > 0);

      return {
        id: 'match_compact_' + idx,
        date: date || 'Unknown Date',
        homeTeam: 'Syn',
        awayTeam,
        homeScore,
        awayScore,
        diff,
        totalPoints,
        isValid984,
        slotTag: null,
        isWin: diff > 0,
        isDraw: diff === 0,
        isComplete: true,
        races: [],
        members: ['データ未記録']
      };
    }).filter(m => m !== null);
  }

  function downloadSerializedDataFile() {
    if (!appState.matches || appState.matches.length === 0) {
      showToast('ダウンロードするデータがありません。');
      return;
    }

    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      matchCount: appState.matches.length,
      matches: appState.matches
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syn_leaderboard_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('💾 共有用データファイル (.json) をダウンロードしました！');
  }

  // ----------------------------------------------------
  // Automatic Loading from Bundled Data & ./data/ Files
  // ----------------------------------------------------

  function loadAllDataFiles() {
    if (window.BUNDLED_DATA_TEXTS && Array.isArray(window.BUNDLED_DATA_TEXTS) && window.BUNDLED_DATA_TEXTS.length > 0) {
      const parsed = ParserEngine.parseDiscordLog(window.BUNDLED_DATA_TEXTS);
      updateData(parsed);
      saveToLocalStorage(parsed);
      showToast(`📁 ログ全 ${window.BUNDLED_DATA_TEXTS.length} ファイルを自動ロードしました！ (${parsed.matches.length} 試合解析)`);
      return;
    }

    const dataFiles = [
      './data/Syn - 交流戦 - 交流戦即時 [1080472604026093669].txt',
      './data/Syn - 交流戦 - 交流戦挙手 [1080473617382510644].txt',
      './data/Team Synchronicity - 交流戦 - 交流戦即時 [848943966430298153].txt',
      './data/Team Synchronicity - 交流戦 - 挙手管理-✋ [847723665214406676].txt',
      './data/match1.txt',
      './data/match2.txt',
      './data/war1.txt',
      './data/war2.txt'
    ];

    Promise.all(dataFiles.map(url => 
      fetch(encodeURI(url))
        .then(r => r.ok ? r.text() : '')
        .catch(err => {
          console.warn('Could not fetch data file:', url, err);
          return '';
        })
    )).then(texts => {
      const validTexts = texts.filter(t => t.length > 0);
      if (validTexts.length > 0) {
        const parsed = ParserEngine.parseDiscordLog(validTexts);
        updateData(parsed);
        saveToLocalStorage(parsed);
        showToast(`📁 ./data/ 内のログ全 ${validTexts.length} ファイルを統合ロードしました！ (${parsed.matches.length} 試合解析)`);
      } else {
        fetch('./sample_log.txt')
          .then(r => r.text())
          .then(txt => {
            updateData(ParserEngine.parseDiscordLog(txt));
          });
      }
    });
  }

  function saveToLocalStorage(parsedData) {
    try {
      localStorage.setItem('syn_leaderboard_cache', JSON.stringify(parsedData));
    } catch (e) {
      console.warn('LocalStorage full or unavailable', e);
    }
  }

  function checkUrlHashOrStorage() {
    if (window.location.hash) {
      let binUrl = null;
      if (window.location.hash.startsWith('#n=')) {
        const id = window.location.hash.replace('#n=', '');
        binUrl = `https://api.npoint.io/${id}`;
      } else if (window.location.hash.startsWith('#j=')) {
        const id = window.location.hash.replace('#j=', '');
        binUrl = `https://api.jsonbin.io/v3/b/${id}?meta=false`;
      } else if (window.location.hash.startsWith('#bin=')) {
        try {
          binUrl = atob(window.location.hash.replace('#bin=', ''));
        } catch (e) {}
      }

      if (binUrl) {
        showToast('☁️ クラウドサーバーからデータを受信中...');
        fetchFromCloudServer(binUrl).then(cloudData => {
          if (cloudData && cloudData.matches && cloudData.matches.length > 0) {
            updateData(cloudData);
            saveToLocalStorage(cloudData);
            showToast(`☁️ クラウド共有データを受信・解析しました！ (${cloudData.matches.length} 試合表示)`);
          }
        });
        return true;
      }
    }

    if (window.location.hash && window.location.hash.startsWith('#d=')) {
      try {
        const encoded = window.location.hash.replace('#d=', '');
        const compactStr = decodeURIComponent(atob(encoded));
        const matches = deserializeMatchesCompact(compactStr);
        if (matches && matches.length > 0) {
          updateData({ matches, members: [], warLists: [] });
          return true;
        }
      } catch (e) {
        console.warn('Failed to parse compact URL hash data', e);
      }
    }

    return false;
  }

  function showToast(msg) {
    if (!toastNotification) return;
    toastNotification.textContent = msg;
    toastNotification.classList.add('show');
    setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 3500);
  }

  // ----------------------------------------------------
  // Data & UI Rendering
  // ----------------------------------------------------

  function parseDateToTimestamp(dateStr) {
    if (!dateStr || dateStr === 'Unknown Date') return 0;
    const isoStr = dateStr.replace(/\//g, '-').replace(' ', 'T');
    const ts = Date.parse(isoStr);
    return isNaN(ts) ? 0 : ts;
  }

  function updateData(parsedData) {
    appState.matches = parsedData.matches || [];
    appState.members = [];
    appState.warLists = [];
    
    const validMatchesOnly = appState.matches.filter(m => m.isValid984);
    appState.analytics = AnalyticsEngine.calculateDashboardAnalytics(
      validMatchesOnly.length > 0 ? validMatchesOnly : appState.matches
    );

    if (appState.matches.length > 0) {
      dashboardContent.style.display = 'block';

      // Update Calendar & Explorer Sidebar Widgets
      CalendarWidget.setData(appState.matches, appState.onlyValid984);

      renderKPIs();
      renderMatches();
    }
  }

  function renderKPIs() {
    const a = appState.analytics;
    if (!a) return;

    kpiTotalMatches.textContent = a.totalMatches;
    kpiWinRate.textContent = `${a.winRate}%`;
    kpiWinLoss.textContent = `${a.wins}勝 ${a.losses}敗 ${a.draws}分`;

    const diffPrefix = a.avgDiff > 0 ? '+' : '';
    kpiAvgDiff.textContent = `${diffPrefix}${a.avgDiff}`;
    kpiAvgDiff.className = 'kpi-value ' + (a.avgDiff > 0 ? 'text-win' : a.avgDiff < 0 ? 'text-loss' : '');
  }

  function updateTeamSuggestions() {
    const query = appState.searchQuery.trim();
    suggestionBox.innerHTML = '';
    
    if (!query) {
      suggestionBox.style.display = 'none';
      return;
    }

    const allOpponents = Array.from(new Set(appState.matches.map(m => m.awayTeam)));
    const suggestions = LevenshteinUtils.getTeamSuggestions(query, allOpponents);

    if (suggestions.length > 0) {
      suggestionBox.style.display = 'block';
      const wrapper = document.createElement('div');
      wrapper.className = 'suggestion-content';
      
      const label = document.createElement('span');
      label.className = 'suggestion-label';
      label.textContent = 'もしかして: ';
      wrapper.appendChild(label);

      suggestions.forEach(team => {
        const tag = document.createElement('button');
        tag.className = 'suggestion-tag';
        tag.textContent = team;
        tag.addEventListener('click', () => {
          teamSearchInput.value = team;
          appState.searchQuery = team;
          suggestionBox.style.display = 'none';
          renderMatches();
        });
        wrapper.appendChild(tag);
      });

      suggestionBox.appendChild(wrapper);
    } else {
      suggestionBox.style.display = 'none';
    }
  }

  function getFilteredAndSortedMatches() {
    let filtered = [...appState.matches];

    if (appState.selectedCalendarDate) {
      filtered = filtered.filter(m => {
        if (!m.date) return false;
        const cleanDate = m.date.split(' ')[0].replace(/-/g, '/');
        return cleanDate === appState.selectedCalendarDate;
      });
    }

    if (appState.onlyValid984) {
      filtered = filtered.filter(m => m.isValid984);
    }

    if (appState.searchQuery.trim()) {
      const q = appState.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(m => m.awayTeam.toLowerCase().includes(q));
    }

    if (appState.resultFilter === 'win') {
      filtered = filtered.filter(m => m.isWin);
    } else if (appState.resultFilter === 'loss') {
      filtered = filtered.filter(m => m.diff < 0);
    } else if (appState.resultFilter === 'draw') {
      filtered = filtered.filter(m => m.diff === 0);
    }

    if (appState.minDiff !== null) {
      filtered = filtered.filter(m => m.diff >= appState.minDiff);
    }
    if (appState.maxDiff !== null) {
      filtered = filtered.filter(m => m.diff <= appState.maxDiff);
    }

    filtered.sort((a, b) => {
      if (appState.sortBy === 'diff_desc') {
        return b.diff - a.diff;
      } else if (appState.sortBy === 'diff_asc') {
        return a.diff - b.diff;
      } else if (appState.sortBy === 'score_desc') {
        return b.homeScore - a.homeScore;
      } else if (appState.sortBy === 'oldest') {
        return parseDateToTimestamp(a.date) - parseDateToTimestamp(b.date);
      } else {
        return parseDateToTimestamp(b.date) - parseDateToTimestamp(a.date);
      }
    });

    return filtered;
  }

  function renderMatches() {
    const list = getFilteredAndSortedMatches();
    matchesGrid.innerHTML = '';
    matchesCountBadge.textContent = `${list.length} 件`;

    if (list.length === 0) {
      matchesGrid.innerHTML = `
        <div class="no-matches-card" style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          <p style="font-weight: 700; font-size: 1rem;">条件に一致する試合結果が見つかりませんでした。</p>
          ${appState.selectedCalendarDate ? `<p style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--color-accent);">※ カレンダーで ${appState.selectedCalendarDate} が選択されています。</p>` : ''}
        </div>
      `;
      return;
    }

    list.forEach(match => {
      const card = createMatchCard(match);
      matchesGrid.appendChild(card);
    });
  }

  function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = `match-card ${match.isWin ? 'card-win' : match.diff < 0 ? 'card-loss' : 'card-draw'}`;

    const diffPrefix = match.diff > 0 ? '+' : '';
    const resultBadgeClass = match.isWin ? 'badge-win' : match.diff < 0 ? 'badge-loss' : 'badge-draw';
    const resultText = match.isWin ? 'WIN' : match.diff < 0 ? 'LOSE' : 'DRAW';

    const hasRaces = match.races && match.races.length > 0;
    const detailBadge = hasRaces 
      ? '<span class="meta-item slot-badge text-win" style="background: rgba(56,189,248,0.15)">12レース詳細あり</span>'
      : '<span class="meta-item slot-badge muted">要約スコアのみ</span>';

    const validTag = match.isValid984 
      ? '<span class="meta-item slot-badge text-win" style="background: rgba(16,185,129,0.15)">984pt 成立</span>' 
      : '<span class="meta-item slot-badge text-loss" style="background: rgba(244,63,94,0.15)">除外 (0:0等)</span>';

    card.innerHTML = `
      <div class="card-header">
        <div class="teams-title">
          <span class="team-syn">${match.homeTeam}</span>
          <span class="vs-text">VS</span>
          <span class="team-opp">${match.awayTeam}</span>
        </div>
        <span class="result-badge ${resultBadgeClass}">${resultText}</span>
      </div>

      <div class="score-display">
        <div class="main-score">
          ${match.homeScore} <span class="score-colon">:</span> ${match.awayScore}
        </div>
        <div class="score-diff ${match.diff > 0 ? 'text-win' : match.diff < 0 ? 'text-loss' : ''}">
          (${diffPrefix}${match.diff})
        </div>
      </div>

      <div class="card-meta">
        <span class="meta-item"><i class="icon-calendar"></i> ${match.date}</span>
        ${detailBadge}
        ${validTag}
      </div>

      <div class="card-footer">
        <button class="btn-detail">詳細・レース点数差推移 <i class="icon-arrow-right"></i></button>
      </div>
    `;

    card.querySelector('.btn-detail').addEventListener('click', () => {
      openMatchModal(match);
    });

    return card;
  }

  function openMatchModal(match) {
    appState.selectedMatch = match;

    modalHomeTeam.textContent = match.homeTeam;
    modalAwayTeam.textContent = match.awayTeam;
    modalScore.textContent = `${match.homeScore} : ${match.awayScore}`;

    const diffPrefix = match.diff > 0 ? '+' : '';
    modalDiffBadge.textContent = `${diffPrefix}${match.diff}`;
    modalDiffBadge.className = `diff-badge ${match.isWin ? 'bg-win' : match.diff < 0 ? 'bg-loss' : 'bg-draw'}`;

    modalDate.textContent = match.date;
    modalSlotTag.textContent = match.slotTag ? `@${match.slotTag}` : '通常戦';

    const hasRaces = match.races && match.races.length > 0;
    if (modalRaceNotice) {
      modalRaceNotice.style.display = hasRaces ? 'none' : 'block';
    }

    modalRaceTableBody.innerHTML = '';
    if (hasRaces) {
      match.races.forEach(r => {
        const tr = document.createElement('tr');
        const diffClass = r.diff > 0 ? 'text-win' : r.diff < 0 ? 'text-loss' : '';
        const rDiffPrefix = r.diff > 0 ? '+' : '';

        const posStr = r.positions && r.positions.length > 0
          ? r.positions.map(p => `<span class="pos-num pos-${p}">${p}</span>`).join(' ')
          : '-';

        tr.innerHTML = `
          <td class="text-center font-bold">R${r.raceNum}</td>
          <td class="text-center">${r.homeScore} - ${r.awayScore}</td>
          <td class="text-center font-bold ${diffClass}">${rDiffPrefix}${r.diff}</td>
          <td><div class="pos-list">${posStr}</div></td>
          <td class="text-center muted">${r.cumHomeScore} - ${r.cumAwayScore}</td>
          <td class="text-center font-bold ${r.cumDiff > 0 ? 'text-win' : r.cumDiff < 0 ? 'text-loss' : ''}">
            ${r.cumDiff > 0 ? '+' : ''}${r.cumDiff}
          </td>
        `;
        modalRaceTableBody.appendChild(tr);
      });
    } else {
      modalRaceTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center muted" style="padding: 1.5rem;">
            この試合は最終要約スコア（${match.homeScore} : ${match.awayScore}）のみ記録されています。
          </td>
        </tr>
      `;
    }

    matchModal.classList.add('active');

    setTimeout(() => {
      ChartEngine.renderMatchTrendChart('matchChartCanvas', match);
    }, 100);
  }

  // Initial load check: Hash -> LocalStorage -> Bundled Data Files
  const loadedFromHash = checkUrlHashOrStorage();
  if (!loadedFromHash || !appState.matches || appState.matches.length === 0) {
    loadAllDataFiles();
  }
});
