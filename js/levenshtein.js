/**
 * Levenshtein distance & fuzzy string matching utilities for team search
 */

function levenshteinDistance(str1, str2) {
  const a = str1.toLowerCase().trim();
  const b = str2.toLowerCase().trim();

  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // Deletion
        matrix[i][j - 1] + 1,       // Insertion
        matrix[i - 1][j - 1] + cost  // Substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

function calculateSimilarity(str1, str2) {
  const dist = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - dist / maxLength;
}

/**
 * Returns suggestions for a queried team name among known unique team names.
 */
function getTeamSuggestions(query, availableTeams) {
  if (!query || !availableTeams || availableTeams.length === 0) return [];
  const cleanedQuery = query.trim().toLowerCase();
  
  // Exclude exact matches (case-insensitive) from suggestions
  const candidates = availableTeams.filter(team => team.toLowerCase() !== cleanedQuery);

  const scored = candidates.map(team => {
    const dist = levenshteinDistance(cleanedQuery, team);
    const sim = calculateSimilarity(cleanedQuery, team);
    const startsWith = team.toLowerCase().startsWith(cleanedQuery);
    const includes = team.toLowerCase().includes(cleanedQuery);
    
    // Custom relevance score
    let score = sim;
    if (startsWith) score += 0.4;
    if (includes) score += 0.2;

    return { team, distance: dist, similarity: sim, score };
  });

  // Filter for reasonably close matches (dist <= 3 or score >= 0.4)
  const matches = scored
    .filter(item => item.distance <= 3 || item.score >= 0.45)
    .sort((a, b) => b.score - a.score);

  return matches.map(m => m.team);
}

window.LevenshteinUtils = {
  levenshteinDistance,
  calculateSimilarity,
  getTeamSuggestions
};
