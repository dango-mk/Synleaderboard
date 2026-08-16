/**
 * Main Application Controller for SynLeaderboard
 * Auto-loads data from bundled JS & ./data/ txt files, supports Yearly & Monthly Explorer Tree with Newest/Oldest Sorting,
 * Left Sidebar Calendar Widget, and Mobile-Responsive UI.
 */

(function () {
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

  function initApp() {
    const toastNotification = document.getElementById('toastNotification');
    const dashboardContent = document.getElementById('dashboardContent');

    const btnClearCalendarFilter = document.getElementById('btnClearCalendarFilter');
    const btnExpandAllExplorer = document.getElementById('btnExpandAllExplorer');
    const btnCollapseAllExplorer = document.getElementById('btnCollapseAllExplorer');
    const explorerSortSelect = document.getElementById('explorerSortSelect');

    const kpiTotalMatches = document.getElementById('kpiTotalMatches');
    const kpiWinRate = document.getElementById('kpiWinRate');
    const kpiWinLoss = document.getElementById('kpiWinLoss');
    const kpiAvgDiff = document.getElementById('kpiAvgDiff');

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

    const btnExpandCalendar = document.getElementById('btnExpandCalendar');
    const expandedCalendarModal = document.getElementById('expandedCalendarModal');
    const closeExpandedCalendarModal = document.getElementById('closeExpandedCalendarModal');

    // Calendar Widget Init
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

    // Filter Listeners
    if (teamSearchInput) {
      teamSearchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value;
        updateTeamSuggestions();
        renderMatches();
      });
    }

    if (resultFilterSelect) {
      resultFilterSelect.addEventListener('change', (e) => {
        appState.resultFilter = e.target.value;
        renderMatches();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        appState.sortBy = e.target.value;
        renderMatches();
      });
    }

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

    if (closeMatchModal && matchModal) {
      closeMatchModal.addEventListener('click', () => {
        matchModal.classList.remove('active');
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === matchModal) matchModal.classList.remove('active');
      if (e.target === expandedCalendarModal) expandedCalendarModal.classList.remove('active');
    });

    function loadAllDataFiles() {
      if (window.BUNDLED_DATA_TEXTS && Array.isArray(window.BUNDLED_DATA_TEXTS) && window.BUNDLED_DATA_TEXTS.length > 0) {
        try {
          const parsed = ParserEngine.parseDiscordLog(window.BUNDLED_DATA_TEXTS);
          if (parsed && parsed.matches && parsed.matches.length > 0) {
            updateData(parsed);
            showToast(`📁 ログ全 ${window.BUNDLED_DATA_TEXTS.length} ファイルを自動統合ロードしました！ (${parsed.matches.length} 試合解析)`);
            return;
          }
        } catch (err) {
          console.warn('Error parsing BUNDLED_DATA_TEXTS', err);
        }
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
          .catch(() => '')
      )).then(texts => {
        const validTexts = texts.filter(t => t.length > 0);
        if (validTexts.length > 0) {
          const parsed = ParserEngine.parseDiscordLog(validTexts);
          updateData(parsed);
          showToast(`📁 ./data/ 内のログ全 ${validTexts.length} ファイルを統合ロードしました！ (${parsed.matches.length} 試合解析)`);
        }
      });
    }

    function showToast(msg) {
      if (!toastNotification) return;
      toastNotification.textContent = msg;
      toastNotification.classList.add('show');
      setTimeout(() => {
        toastNotification.classList.remove('show');
      }, 3500);
    }

    function parseDateToTimestamp(dateStr) {
      if (!dateStr || dateStr === 'Unknown Date') return 0;
      const isoStr = dateStr.replace(/\//g, '-').replace(' ', 'T');
      const ts = Date.parse(isoStr);
      return isNaN(ts) ? 0 : ts;
    }

    function updateData(parsedData) {
      appState.matches = parsedData.matches || [];
      
      const validMatchesOnly = appState.matches.filter(m => m.isValid984);
      appState.analytics = AnalyticsEngine.calculateDashboardAnalytics(
        validMatchesOnly.length > 0 ? validMatchesOnly : appState.matches
      );

      if (appState.matches.length > 0) {
        if (dashboardContent) dashboardContent.style.display = 'block';

        CalendarWidget.setData(appState.matches, appState.onlyValid984);

        renderKPIs();
        renderMatches();
      }
    }

    function renderKPIs() {
      const a = appState.analytics;
      if (!a || !kpiTotalMatches) return;

      kpiTotalMatches.textContent = a.totalMatches;
      kpiWinRate.textContent = `${a.winRate}%`;
      kpiWinLoss.textContent = `${a.wins}勝 ${a.losses}敗 ${a.draws}分`;

      const diffPrefix = a.avgDiff > 0 ? '+' : '';
      kpiAvgDiff.textContent = `${diffPrefix}${a.avgDiff}`;
      kpiAvgDiff.className = 'kpi-value ' + (a.avgDiff > 0 ? 'text-win' : a.avgDiff < 0 ? 'text-loss' : '');
    }

    function updateTeamSuggestions() {
      if (!suggestionBox) return;
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
            if (teamSearchInput) teamSearchInput.value = team;
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
      if (!matchesGrid) return;
      const list = getFilteredAndSortedMatches();
      matchesGrid.innerHTML = '';
      if (matchesCountBadge) matchesCountBadge.textContent = `${list.length} 件`;

      if (list.length === 0) {
        matchesGrid.innerHTML = `
          <div class="no-matches-card" style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
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
      if (!matchModal) return;
      appState.selectedMatch = match;

      if (modalHomeTeam) modalHomeTeam.textContent = match.homeTeam;
      if (modalAwayTeam) modalAwayTeam.textContent = match.awayTeam;
      if (modalScore) modalScore.textContent = `${match.homeScore} : ${match.awayScore}`;

      const diffPrefix = match.diff > 0 ? '+' : '';
      if (modalDiffBadge) {
        modalDiffBadge.textContent = `${diffPrefix}${match.diff}`;
        modalDiffBadge.className = `diff-badge ${match.isWin ? 'bg-win' : match.diff < 0 ? 'bg-loss' : 'bg-draw'}`;
      }

      if (modalDate) modalDate.textContent = match.date;
      if (modalSlotTag) modalSlotTag.textContent = match.slotTag ? `@${match.slotTag}` : '通常戦';

      const hasRaces = match.races && match.races.length > 0;
      if (modalRaceNotice) {
        modalRaceNotice.style.display = hasRaces ? 'none' : 'block';
      }

      if (modalRaceTableBody) {
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
      }

      matchModal.classList.add('active');

      setTimeout(() => {
        ChartEngine.renderMatchTrendChart('matchChartCanvas', match);
      }, 100);
    }

    // Trigger loading
    loadAllDataFiles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
