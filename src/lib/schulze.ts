export type Ballot = {
  id: string;
  rankings: string[][];
};

export function schulze(ballots: Ballot[]): string[] {
  const candidates = new Set<string>();
  for (const ballot of ballots) {
    for (const group of ballot.rankings) {
      for (const c of group) candidates.add(c);
    }
  }
  const cand = Array.from(candidates);

  const pairwise: Record<string, Record<string, number>> = {};
  for (const c of cand) {
    pairwise[c] = {};
    for (const d of cand) pairwise[c][d] = 0;
  }

  for (const ballot of ballots) {
    for (let i = 0; i < ballot.rankings.length; i++) {
      const group = ballot.rankings[i];
      for (const candidate of group) {
        for (let k = i + 1; k < ballot.rankings.length; k++) {
          for (const opp of ballot.rankings[k]) {
            pairwise[candidate][opp] += 1;
          }
        }
      }
    }
  }

  const strength: Record<string, Record<string, number>> = {};
  for (const i of cand) {
    strength[i] = {};
    for (const j of cand) {
      if (i === j) continue;
      strength[i][j] = pairwise[i][j] > pairwise[j][i] ? pairwise[i][j] : 0;
    }
  }

  for (const i of cand) {
    for (const j of cand) {
      if (i === j) continue;
      for (const k of cand) {
        if (i === k || j === k) continue;
        strength[j][k] = Math.max(
          strength[j][k] || 0,
          Math.min(strength[j][i] || 0, strength[i][k] || 0)
        );
      }
    }
  }

  return cand.sort((a, b) => {
    const ab = strength[a][b] || 0;
    const ba = strength[b][a] || 0;
    if (ab === ba) return 0;
    return ba - ab;
  });
}
