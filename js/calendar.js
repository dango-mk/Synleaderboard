/**
 * Calendar & Match Explorer Widget Module for SynLeaderboard
 * Supports inline sidebar view, expanded full-screen modal view, year navigation, 984pt valid match filtering,
 * and 2-Tier Explorer Tree (Year Folders -> Month Folders -> Match Files) with Newest/Oldest Date Sorting.
 */

const CalendarWidget = (function () {
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-indexed (0 = Jan)
  let activeSelectedDateStr = null;
  let matchesData = [];
  let onlyValid984Flag = true;
  let explorerSortOrder = 'newest'; // 'newest' or 'oldest'
  let onDateSelectCallback = null;
  let onMatchClickCallback = null;

  function init(options) {
    onDateSelectCallback = options.onDateSelect;
    onMatchClickCallback = options.onMatchClick;
  }

  function setData(matches, onlyValid984) {
    matchesData = matches || [];
    onlyValid984Flag = onlyValid984 !== undefined ? onlyValid984 : true;

    if (matchesData.length > 0) {
      const latest = getFilteredMatches().map(m => parseDateStrToObj(m.date)).filter(d => d !== null);
      if (latest.length > 0) {
        latest.sort((a, b) => b.timestamp - a.timestamp);
        currentYear = latest[0].year;
        currentMonth = latest[0].month;
      }
    }
    renderCalendar();
    renderExpandedCalendar();
    renderExplorerTree();
  }

  function getFilteredMatches() {
    if (onlyValid984Flag) {
      return matchesData.filter(m => m.isValid984);
    }
    return matchesData;
  }

  function parseDateStrToObj(dateStr) {
    if (!dateStr || dateStr === 'Unknown Date') return null;
    const clean = dateStr.replace(/\//g, '-').replace(' ', 'T');
    const d = new Date(clean);
    if (isNaN(d.getTime())) return null;
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      dateKey: `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`,
      timestamp: d.getTime()
    };
  }

  function getMatchesMapByDate() {
    const map = new Map();
    const activeMatches = getFilteredMatches();

    activeMatches.forEach(m => {
      const dObj = parseDateStrToObj(m.date);
      if (dObj) {
        if (!map.has(dObj.dateKey)) {
          map.set(dObj.dateKey, []);
        }
        map.get(dObj.dateKey).push(m);
      }
    });
    return map;
  }

  function renderCalendar() {
    const calendarHeader = document.getElementById('calendarHeaderTitle');
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    const btnPrevYear = document.getElementById('btnPrevYear');
    const btnPrevMonth = document.getElementById('btnPrevMonth');
    const btnNextMonth = document.getElementById('btnNextMonth');
    const btnNextYear = document.getElementById('btnNextYear');

    if (!calendarDaysGrid) return;

    calendarHeader.textContent = `${currentYear}年 ${currentMonth + 1}月`;

    bindNavButton(btnPrevYear, () => changeYear(-1));
    bindNavButton(btnPrevMonth, () => changeMonth(-1));
    bindNavButton(btnNextMonth, () => changeMonth(1));
    bindNavButton(btnNextYear, () => changeYear(1));

    calendarDaysGrid.innerHTML = '';

    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    dayNames.forEach((dName, idx) => {
      const th = document.createElement('div');
      th.className = `calendar-day-header ${idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''}`;
      th.textContent = dName;
      calendarDaysGrid.appendChild(th);
    });

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dateMap = getMatchesMapByDate();

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      calendarDaysGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayCell = document.createElement('div');
      const dateKey = `${currentYear}/${String(currentMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const matchesOnDay = dateMap.get(dateKey) || [];

      dayCell.className = 'calendar-day';
      if (activeSelectedDateStr === dateKey) {
        dayCell.classList.add('selected');
      }

      const dayNum = document.createElement('span');
      dayNum.className = 'day-number';
      dayNum.textContent = day;
      dayCell.appendChild(dayNum);

      if (matchesOnDay.length > 0) {
        dayCell.classList.add('has-matches');
        const badge = document.createElement('div');
        const wins = matchesOnDay.filter(m => m.isWin).length;
        const losses = matchesOnDay.filter(m => m.diff < 0).length;

        badge.className = `match-dot-badge ${wins > losses ? 'bg-win' : losses > wins ? 'bg-loss' : 'bg-draw'}`;
        badge.textContent = `${matchesOnDay.length}戦`;
        dayCell.appendChild(badge);

        dayCell.title = `${dateKey}: ${matchesOnDay.length}試合 (${wins}勝 ${losses}敗)`;

        dayCell.addEventListener('click', () => {
          selectDate(dateKey);
        });
      }

      calendarDaysGrid.appendChild(dayCell);
    }
  }

  function renderExpandedCalendar() {
    const calendarHeaderExp = document.getElementById('calendarHeaderTitleExp');
    const calendarDaysGridExp = document.getElementById('calendarDaysGridExp');
    const btnPrevYearExp = document.getElementById('btnPrevYearExp');
    const btnPrevMonthExp = document.getElementById('btnPrevMonthExp');
    const btnNextMonthExp = document.getElementById('btnNextMonthExp');
    const btnNextYearExp = document.getElementById('btnNextYearExp');

    if (!calendarDaysGridExp) return;

    calendarHeaderExp.textContent = `${currentYear}年 ${currentMonth + 1}月`;

    bindNavButton(btnPrevYearExp, () => changeYear(-1));
    bindNavButton(btnPrevMonthExp, () => changeMonth(-1));
    bindNavButton(btnNextMonthExp, () => changeMonth(1));
    bindNavButton(btnNextYearExp, () => changeYear(1));

    calendarDaysGridExp.innerHTML = '';

    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    dayNames.forEach((dName, idx) => {
      const th = document.createElement('div');
      th.className = `expanded-calendar-day-header ${idx === 0 ? 'sun' : idx === 6 ? 'sat' : ''}`;
      th.textContent = dName;
      calendarDaysGridExp.appendChild(th);
    });

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dateMap = getMatchesMapByDate();

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'expanded-calendar-day empty';
      calendarDaysGridExp.appendChild(emptyCell);
    }

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dayCell = document.createElement('div');
      const dateKey = `${currentYear}/${String(currentMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const matchesOnDay = dateMap.get(dateKey) || [];

      dayCell.className = 'expanded-calendar-day';
      if (activeSelectedDateStr === dateKey) {
        dayCell.classList.add('selected');
      }

      const dayTop = document.createElement('div');
      dayTop.className = 'exp-day-top';

      const dayNum = document.createElement('span');
      dayNum.className = 'exp-day-number';
      dayNum.textContent = day;
      dayTop.appendChild(dayNum);

      if (matchesOnDay.length > 0) {
        const wins = matchesOnDay.filter(m => m.isWin).length;
        const losses = matchesOnDay.filter(m => m.diff < 0).length;

        const summaryBadge = document.createElement('span');
        summaryBadge.className = 'exp-day-summary';
        summaryBadge.textContent = `${matchesOnDay.length}戦 (${wins}W${losses}L)`;
        dayTop.appendChild(summaryBadge);
      }

      dayCell.appendChild(dayTop);

      if (matchesOnDay.length > 0) {
        dayCell.classList.add('has-matches');
        const matchesList = document.createElement('div');
        matchesList.className = 'exp-matches-list';

        matchesOnDay.forEach(m => {
          const pill = document.createElement('div');
          pill.className = `exp-match-pill ${m.isWin ? 'win' : m.diff < 0 ? 'loss' : 'draw'}`;

          const diffPrefix = m.diff > 0 ? '+' : '';
          pill.innerHTML = `
            <span class="exp-team-vs">vs ${m.awayTeam}</span>
            <span class="exp-match-score">${m.homeScore}:${m.awayScore}</span>
            <span class="exp-match-diff">${diffPrefix}${m.diff}</span>
          `;

          pill.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onMatchClickCallback) onMatchClickCallback(m);
          });

          matchesList.appendChild(pill);
        });

        dayCell.appendChild(matchesList);

        dayCell.addEventListener('click', () => {
          selectDate(dateKey);
        });
      }

      calendarDaysGridExp.appendChild(dayCell);
    }
  }

  function bindNavButton(btnEl, handler) {
    if (!btnEl) return;
    const newBtn = btnEl.cloneNode(true);
    btnEl.parentNode.replaceChild(newBtn, btnEl);
    newBtn.addEventListener('click', handler);
  }

  function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    } else if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
    renderExpandedCalendar();
  }

  function changeYear(delta) {
    currentYear += delta;
    renderCalendar();
    renderExpandedCalendar();
  }

  function selectDate(dateKey) {
    if (activeSelectedDateStr === dateKey) {
      activeSelectedDateStr = null;
    } else {
      activeSelectedDateStr = dateKey;
    }
    renderCalendar();
    renderExpandedCalendar();
    if (onDateSelectCallback) onDateSelectCallback(activeSelectedDateStr);
  }

  // ----------------------------------------------------
  // 2-Tier Explorer Tree (Year Folders -> Month Folders -> Match Files)
  // ----------------------------------------------------

  function renderExplorerTree() {
    const explorerContainer = document.getElementById('explorerMatchTree');
    if (!explorerContainer) return;

    explorerContainer.innerHTML = '';
    const activeMatches = getFilteredMatches();

    if (activeMatches.length === 0) {
      explorerContainer.innerHTML = '<div class="muted p-2" style="font-size: 0.8rem;">有効な試合データがありません</div>';
      return;
    }

    // 2-Tier Map: Year -> Month -> Matches Array
    const yearMap = new Map();

    activeMatches.forEach(m => {
      const dObj = parseDateStrToObj(m.date);
      const year = dObj ? dObj.year : 0;
      const month = dObj ? dObj.month + 1 : 0; // 1-12

      if (!yearMap.has(year)) {
        yearMap.set(year, new Map());
      }
      const monthMap = yearMap.get(year);
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap.get(month).push(m);
    });

    // Sort Years
    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => {
      return explorerSortOrder === 'newest' ? b - a : a - b;
    });

    sortedYears.forEach(year => {
      const monthMap = yearMap.get(year);
      const yearLabel = year > 0 ? `${year}年` : '日付不明';

      // Calculate total matches in this year
      let totalYearMatches = 0;
      monthMap.forEach(matches => totalYearMatches += matches.length);

      // Create Year Folder Block
      const yearGroupEl = document.createElement('div');
      yearGroupEl.className = 'explorer-group explorer-year-group';

      const yearHeader = document.createElement('div');
      yearHeader.className = 'explorer-group-header explorer-year-header';
      yearHeader.innerHTML = `
        <span class="folder-icon">📂</span>
        <span class="group-title">${yearLabel}</span>
        <span class="group-count">${totalYearMatches}試合</span>
      `;

      const yearContent = document.createElement('div');
      yearContent.className = 'explorer-group-list explorer-year-content';

      // Sort Months inside this Year
      const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => {
        return explorerSortOrder === 'newest' ? b - a : a - b;
      });

      sortedMonths.forEach(month => {
        const matchesInMonth = monthMap.get(month);

        // Sort Matches inside this Month
        matchesInMonth.sort((a, b) => {
          const tsA = parseDateStrToObj(a.date)?.timestamp || 0;
          const tsB = parseDateStrToObj(b.date)?.timestamp || 0;
          return explorerSortOrder === 'newest' ? tsB - tsA : tsA - tsB;
        });

        const monthLabel = month > 0 ? `${String(month).padStart(2, '0')}月` : '不明';

        // Create Month Folder Block
        const monthGroupEl = document.createElement('div');
        monthGroupEl.className = 'explorer-group explorer-month-group';

        const monthHeader = document.createElement('div');
        monthHeader.className = 'explorer-group-header explorer-month-header';
        monthHeader.innerHTML = `
          <span class="folder-icon">📁</span>
          <span class="group-title">${monthLabel}</span>
          <span class="group-count">${matchesInMonth.length}試合</span>
        `;

        const monthList = document.createElement('div');
        monthList.className = 'explorer-group-list explorer-month-list';

        // Render Match Files inside Month Folder
        matchesInMonth.forEach(m => {
          const item = document.createElement('div');
          item.className = `explorer-match-item ${m.isWin ? 'win' : m.diff < 0 ? 'loss' : 'draw'}`;
          
          const diffPrefix = m.diff > 0 ? '+' : '';
          const diffText = `(${diffPrefix}${m.diff})`;
          const dayStr = m.date && m.date !== 'Unknown Date' ? m.date.split(' ')[0].split('/')[2] || '' : '';
          const dayBadge = dayStr ? `${dayStr}日` : '';

          item.innerHTML = `
            <span class="match-file-icon">📄</span>
            <span class="match-date-badge">${dayBadge}</span>
            <span class="match-title" title="${m.homeTeam} vs ${m.awayTeam}">vs ${m.awayTeam}</span>
            <span class="match-score">${m.homeScore}:${m.awayScore}</span>
            <span class="match-diff ${m.isWin ? 'text-win' : m.diff < 0 ? 'text-loss' : ''}">${diffText}</span>
          `;

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onMatchClickCallback) onMatchClickCallback(m);
          });

          monthList.appendChild(item);
        });

        // Toggle Month Folder expand/collapse
        monthHeader.addEventListener('click', (e) => {
          e.stopPropagation();
          monthGroupEl.classList.toggle('collapsed');
        });

        monthGroupEl.appendChild(monthHeader);
        monthGroupEl.appendChild(monthList);
        yearContent.appendChild(monthGroupEl);
      });

      // Toggle Year Folder expand/collapse
      yearHeader.addEventListener('click', () => {
        yearGroupEl.classList.toggle('collapsed');
      });

      yearGroupEl.appendChild(yearHeader);
      yearGroupEl.appendChild(yearContent);
      explorerContainer.appendChild(yearGroupEl);
    });
  }

  return {
    init,
    setData,
    setExplorerSortOrder: (order) => {
      explorerSortOrder = order;
      renderExplorerTree();
    },
    getSelectedDate: () => activeSelectedDateStr,
    clearSelectedDate: () => {
      activeSelectedDateStr = null;
      renderCalendar();
      renderExpandedCalendar();
    },
    expandAllExplorer: () => {
      const groups = document.querySelectorAll('#explorerMatchTree .explorer-group');
      groups.forEach(g => g.classList.remove('collapsed'));
    },
    collapseAllExplorer: () => {
      const groups = document.querySelectorAll('#explorerMatchTree .explorer-group');
      groups.forEach(g => g.classList.add('collapsed'));
    }
  };
})();

window.CalendarWidget = CalendarWidget;
