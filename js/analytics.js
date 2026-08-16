/**
 * Analytics Engine for SynLeaderboard
 * Calculates aggregate stats for matches and opponent teams.
 */

function calculateDashboardAnalytics(matches) {
  if (!matches || matches.length === 0) {
    return {
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      avgDiff: 0,
      totalHomePoints: 0,
      totalAwayPoints: 0,
      opponentStats: []
    };
  }

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalDiff = 0;
  let totalHome = 0;
  let totalAway = 0;

  const opponentMap = new Map();

  matches.forEach(match => {
    totalHome += match.homeScore;
    totalAway += match.awayScore;
    totalDiff += match.diff;

    if (match.isWin) wins++;
    else if (match.diff < 0) losses++;
    else draws++;

    const opp = match.awayTeam || 'Unknown';
    if (!opponentMap.has(opp)) {
      opponentMap.set(opp, { team: opp, matches: 0, wins: 0, losses: 0, draws: 0, totalDiff: 0 });
    }
    const oppStat = opponentMap.get(opp);
    oppStat.matches++;
    if (match.isWin) oppStat.wins++;
    else if (match.diff < 0) oppStat.losses++;
    else oppStat.draws++;
    oppStat.totalDiff += match.diff;
  });

  const opponentStats = Array.from(opponentMap.values()).sort((a, b) => b.matches - a.matches);
  const totalMatches = matches.length;
  const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : '0.0';
  const avgDiff = totalMatches > 0 ? (totalDiff / totalMatches).toFixed(1) : '0.0';

  return {
    totalMatches,
    wins,
    losses,
    draws,
    winRate: parseFloat(winRate),
    avgDiff: parseFloat(avgDiff),
    totalHomePoints: totalHome,
    totalAwayPoints: totalAway,
    opponentStats
  };
}

window.AnalyticsEngine = {
  calculateDashboardAnalytics
};
