/**
 * Ultra-Robust Discord & CSV Log Parser
 * Supports all MK8D Bot Formats:
 *  - Old Bot format (race1, race1 - rDKJ with course names)
 *  - New Bot format (1..12 bare numbers)
 *  - Japanese team names & CSV files
 */

function parseDiscordLog(input) {
  let texts = [];
  if (Array.isArray(input)) {
    texts = input.filter(t => typeof t === 'string' && t.trim().length > 0);
  } else if (typeof input === 'string') {
    texts = [input];
  }

  if (texts.length === 0) {
    return { matches: [], members: [], warLists: [] };
  }

  const allWarLists = [];
  const rawMatchBlocks = [];

  // =========================================================================
  // PASS 1: Collect ALL WAR LISTs and Raw Match Blocks across ALL files
  // =========================================================================

  texts.forEach((rawText, fileIdx) => {
    // Strip UTF-8 BOM and zero-width spaces
    const cleanText = rawText.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
    const lines = cleanText.split(/\r?\n/);
    let currentDate = null;

    let i = 0;
    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      if (!line) {
        i++;
        continue;
      }

      // Timestamp extraction e.g. [2023/03/15 22:00] or 2023-03-15 22:00:00
      const dateMatch = line.match(/^\[?(\d{4}[\/\-]\d{2}[\/\-]\d{2}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)\]?/);
      if (dateMatch) {
        currentDate = dateMatch[1].replace(/-/g, '/');
      }

      // Flexible CSV Parser (Comma separated lines)
      const csvParts = line.split(',').map(p => p.trim());
      if (csvParts.length >= 5 && !isNaN(parseInt(csvParts[1], 10)) && !isNaN(parseInt(csvParts[2], 10))) {
        const homeTeam = csvParts[0] || 'Syn';
        const homeScore = parseInt(csvParts[1], 10);
        const awayScore = parseInt(csvParts[2], 10);
        const awayTeam = csvParts[3] || 'Opponent';
        const dateStr = csvParts[4].replace(/-/g, '/');

        rawMatchBlocks.push({
          type: 'csv',
          fileIdx,
          lineIdx: i,
          date: dateStr,
          homeTeam,
          homeScore,
          awayScore,
          awayTeam,
          slotTag: null,
          races: []
        });
        i++;
        continue;
      }

      // WAR LIST Block
      if (line.includes('WAR LIST')) {
        const warListEntry = {
          fileIdx,
          lineIdx: i,
          date: currentDate || 'Unknown Date',
          rostersBySlot: {},
          fullRosters: []
        };

        i++;
        while (i < lines.length) {
          const subLine = lines[i].trim();
          if (subLine.includes('{Embed}') || subLine.includes('即時集計') || subLine.includes('即時計算')) {
            i--; // Backtrack
            break;
          }

          const slotMatch = subLine.match(/^(\d{1,2})@(\d+)/);
          if (slotMatch) {
            const slot = slotMatch[1];
            const vacancy = parseInt(slotMatch[2], 10);

            if (i + 1 < lines.length && lines[i + 1].trim().startsWith('>>>')) {
              i++;
              const namesStr = lines[i].trim().replace(/^>>>\s*/, '');
              const members = namesStr
                .split(',')
                .map(n => n.trim())
                .filter(n => n.length > 0);

              if (vacancy === 0 || members.length === 6) {
                warListEntry.rostersBySlot[slot] = members;
                warListEntry.fullRosters.push({ slot, members });
              }
            }
          }
          i++;
        }

        if (warListEntry.fullRosters.length > 0) {
          allWarLists.push(warListEntry);
        }
      }

      // Match Result Block (即時集計, 即時計算, or Team-Team headers)
      else if (line.includes('即時集計') || line.includes('即時計算') || line.match(/^[^\s-]+\s*-\s*[^\s-]+$/)) {
        const parsedBlock = extractMatchRawBlock(lines, i, currentDate, fileIdx);
        if (parsedBlock) {
          rawMatchBlocks.push(parsedBlock.matchRaw);
          i = parsedBlock.nextIndex;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  });

  // Flat roster pool for cross-file matching
  const globalRosterPool = [];
  allWarLists.forEach(wl => {
    wl.fullRosters.forEach(r => {
      globalRosterPool.push({
        date: wl.date,
        slot: r.slot,
        members: r.members,
        used: false
      });
    });
  });

  // =========================================================================
  // PASS 2: Match Generation & Roster Correlation
  // =========================================================================

  const finalMatches = rawMatchBlocks.map((raw, matchIdx) => {
    let assignedMembers = null;

    if (globalRosterPool.length > 0) {
      if (raw.slotTag && raw.slotTag !== '0') {
        const slotMatchItem = globalRosterPool.find(r => !r.used && r.slot === raw.slotTag);
        if (slotMatchItem) {
          slotMatchItem.used = true;
          assignedMembers = [...slotMatchItem.members];
        }
      }

      if (!assignedMembers && raw.date && raw.date !== 'Unknown Date') {
        const dateRawStr = raw.date.split(' ')[0];
        const dateMatchItem = globalRosterPool.find(r => !r.used && r.date.includes(dateRawStr));
        if (dateMatchItem) {
          dateMatchItem.used = true;
          assignedMembers = [...dateMatchItem.members];
        }
      }

      if (!assignedMembers) {
        const unusedItem = globalRosterPool.find(r => !r.used);
        if (unusedItem) {
          unusedItem.used = true;
          assignedMembers = [...unusedItem.members];
        } else {
          const poolItem = globalRosterPool[matchIdx % globalRosterPool.length];
          assignedMembers = [...poolItem.members];
        }
      }
    }

    if (!assignedMembers || assignedMembers.length === 0) {
      assignedMembers = ['データ未記録'];
    }

    const diff = raw.homeScore - raw.awayScore;
    const totalPoints = raw.homeScore + raw.awayScore;
    const isComplete = raw.races && raw.races.length > 0 ? raw.races.length === 12 : true;
    const isValid984 = (totalPoints === 984 && isComplete && raw.homeScore > 0 && raw.awayScore > 0);

    return {
      id: 'match_' + Date.now() + '_' + matchIdx + '_' + Math.random().toString(36).substr(2, 4),
      date: raw.date || 'Unknown Date',
      homeTeam: raw.homeTeam,
      awayTeam: raw.awayTeam,
      homeScore: raw.homeScore,
      awayScore: raw.awayScore,
      diff,
      totalPoints,
      isValid984,
      slotTag: raw.slotTag,
      isWin: diff > 0,
      isDraw: diff === 0,
      isComplete,
      races: raw.races || [],
      members: assignedMembers
    };
  });

  const allMembers = new Set();
  finalMatches.forEach(m => {
    if (m.members && Array.isArray(m.members)) {
      m.members.forEach(name => {
        if (name && name !== '不明' && name !== 'データ未記録') allMembers.add(name);
      });
    }
  });

  return {
    matches: finalMatches,
    warLists: allWarLists,
    members: Array.from(allMembers).sort()
  };
}

function parseRaceHeader(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.includes(':') || trimmed.startsWith('`')) return null;

  // Match race header formats:
  //  - "race1  - rDKJ"
  //  - "race12"
  //  - "1"
  //  - "12"
  //  - "R1  - rWS"
  const m = trimmed.match(/^(?:race|R)?\s*(\d{1,2})(?:\s*[\-\s].*)?$/i);
  if (m) {
    const num = parseInt(m[1], 10);
    if (num >= 1 && num <= 12) return num;
  }
  return null;
}

function extractMatchRawBlock(lines, startIndex, date, fileIdx) {
  try {
    let i = startIndex;
    const firstLine = lines[i].trim();

    let teamLine = '';
    if (firstLine.includes('-')) {
      teamLine = firstLine;
    } else {
      i++;
      while (i < lines.length && (!lines[i].trim() || lines[i].trim() === '{Embed}')) i++;
      if (i < lines.length) teamLine = lines[i].trim();
    }

    if (!teamLine || !teamLine.includes('-')) return null;

    let homeTeam = 'Syn';
    let awayTeam = 'Opponent';

    const teamMatch = teamLine.match(/^([^\s-]+)\s*-\s*([^\s`]+)/);
    if (teamMatch) {
      homeTeam = teamMatch[1].trim();
      awayTeam = teamMatch[2].trim();
    } else if (teamLine.includes('-')) {
      const parts = teamLine.split('-');
      homeTeam = parts[0].trim() || 'Syn';
      awayTeam = parts[1].trim() || 'Opponent';
    }
    i++;

    while (i < lines.length && !lines[i].trim()) i++;
    if (i >= lines.length) return null;

    const scoreLine = lines[i].trim();
    let homeScore = 0;
    let awayScore = 0;
    let slotTag = null;

    const scoreMatch = scoreLine.match(/`?(\d+)\s*:\s*(\d+)\s*\(([-+]?\d+)\)`?\s*(?:`?@(\d+)`?)?/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1], 10);
      awayScore = parseInt(scoreMatch[2], 10);
      if (scoreMatch[4] !== undefined) {
        slotTag = scoreMatch[4];
      }
    } else {
      return null;
    }
    i++;

    const races = [];
    let cumHome = 0;
    let cumAway = 0;

    while (i < lines.length) {
      const line = lines[i].trim();

      // Stop conditions for next match, embed, or Discord footer
      if (
        line.includes('{Embed}') || 
        line.includes('即時集計') || 
        line.includes('即時計算') || 
        line.includes('WAR LIST') || 
        line.startsWith('OBS更新') ||
        line.startsWith('バナー更新') ||
        line.startsWith('http://') ||
        line.startsWith('https://')
      ) {
        break;
      }

      const raceNum = parseRaceHeader(line);
      if (raceNum !== null) {
        i++;
        while (i < lines.length && !lines[i].trim()) i++; // skip empty lines if any

        if (i < lines.length) {
          const detailLine = lines[i].trim();
          const detailMatch = detailLine.match(/`?(\d+)\s*:\s*(\d+)\s*\(([-+]?\d+)\)`?\s*\|\s*`?([0-9,\s]+)`?/);
          
          if (detailMatch) {
            const rHome = parseInt(detailMatch[1], 10);
            const rAway = parseInt(detailMatch[2], 10);
            const rDiff = parseInt(detailMatch[3], 10);
            const positions = detailMatch[4]
              .split(',')
              .map(p => parseInt(p.trim(), 10))
              .filter(p => !isNaN(p));

            cumHome += rHome;
            cumAway += rAway;

            races.push({
              raceNum,
              homeScore: rHome,
              awayScore: rAway,
              diff: rDiff,
              cumHomeScore: cumHome,
              cumAwayScore: cumAway,
              cumDiff: cumHome - cumAway,
              positions
            });
          }
        }
      }
      i++;
    }

    if (homeScore === 0 && awayScore === 0 && races.length > 0) {
      homeScore = cumHome;
      awayScore = cumAway;
    }

    const matchRaw = {
      type: 'discord',
      fileIdx,
      lineIdx: startIndex,
      date: date || 'Unknown Date',
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      slotTag,
      races
    };

    return { matchRaw, nextIndex: i };
  } catch (err) {
    console.warn('Error extracting raw match block:', err);
    return null;
  }
}

window.ParserEngine = {
  parseDiscordLog
};
