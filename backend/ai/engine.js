const ENCOUNTERS = [
  { id: 'goblin_ambush', name: 'Goblin Ambush', damage: 15, heal: 0, reward: 10, text: "A band of frenzied goblins drops from the cavern ceiling!" },
  { id: 'healing_fountain', name: 'Healing Fountain', damage: 0, heal: 30, reward: 0, text: "You discover a glowing fountain emitting a restorative aura." },
  { id: 'puzzle_trap', name: 'Ancient Puzzle Trap', damage: 25, heal: 0, reward: 25, text: "Click. The stone door locks. Poisonous gas starts filling the chamber!" },
  { id: 'orc_brute', name: 'Orc Brute', damage: 35, heal: 0, reward: 30, text: "A massive Orc Brute blocks your path, wielding a crude hammer." },
  { id: 'empty_room', name: 'Quiet Catacombs', damage: 0, heal: 0, reward: 5, text: "A quiet, undisturbed crypt. Take a breather." }
];

class AIEngine {
  // ============================================
  // LEVEL 1: STORY ADVENTURE MINIMAX
  // ============================================
  static evaluateStory(state) {
    const targetHp = state.player.maxHp * 0.45;
    const hpDiff = Math.abs(state.player.hp - targetHp); 
    if (state.player.hp <= 0) return -10000;
    return -hpDiff + (state.player.gold * 0.2);
  }

  static simulateStoryTurn(state, encounter) {
     let nextState = JSON.parse(JSON.stringify(state));
     nextState.player.hp -= encounter.damage;
     nextState.player.hp += encounter.heal;
     nextState.player.gold += encounter.reward;
     nextState.player.level += 1;
     if (nextState.player.hp > nextState.player.maxHp) nextState.player.hp = nextState.player.maxHp;
     return nextState;
  }

  static minimaxStory(state, depth, alpha, beta, stats) {
    if (depth === 0 || state.player.hp <= 0) {
      stats.nodesEvaluated++;
      return { score: this.evaluateStory(state), encounter: null };
    }
    let maxEval = -Infinity;
    let bestEncounter = null;
    for (const enc of ENCOUNTERS) {
       if (enc.id === 'healing_fountain' && state.player.hp >= state.player.maxHp) continue;
       
       let nextState = this.simulateStoryTurn(state, enc);
       let ev = this.minimaxStory(nextState, depth - 1, alpha, beta, stats).score;
       
       if (ev > maxEval) { maxEval = ev; bestEncounter = enc; }
       alpha = Math.max(alpha, ev);
       if (beta <= alpha) { stats.branchesPruned++; break; }
    }
    return { score: maxEval, encounter: bestEncounter };
  }

  static getBestStoryMove(initialState) {
    let stats = { nodesEvaluated: 0, branchesPruned: 0 };
    let result = this.minimaxStory(initialState, 3, -Infinity, Infinity, stats);
    let enc = result.encounter || ENCOUNTERS[0];
    enc.heuristicScore = Math.floor(result.score);
    return { encounter: enc, stats };
  }

  // ============================================
  // LEVEL 2: TACTICAL GRID MINIMAX
  // ============================================
  static evaluateGrid(state) {
    let aiHp = state.units.filter(u => u.team === 'ai').reduce((sum, u) => sum + u.hp, 0);
    let playerHp = state.units.filter(u => u.team === 'player').reduce((sum, u) => sum + u.hp, 0);
    return aiHp - playerHp; // Maximize AI Health, Minimize Player Health
  }

  static executeGridIntent(unit, target) {
      const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
      if (dist <= unit.range) {
          target.hp -= unit.attack;
          unit.action = 'attack';
      } else {
          if (unit.x < target.x) unit.x += 1;
          else if (unit.x > target.x) unit.x -= 1;
          else if (unit.y < target.y) unit.y += 1;
          else if (unit.y > target.y) unit.y -= 1;
          unit.action = 'move';
      }
  }

  static generateGridMoves(state, team) {
    const teamUnits = state.units.filter(u => u.team === team && u.hp > 0);
    const enemies = state.units.filter(u => u.team !== team && u.hp > 0);
    if (teamUnits.length === 0 || enemies.length === 0) return [state];

    let possibleStates = [];
    const calcDist = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);

    // Strat 1: Focus weakest (Guaranteed Kill setup)
    let s1 = JSON.parse(JSON.stringify(state));
    let weakest = s1.units.filter(en => en.team !== team && en.hp > 0).sort((a,b) => a.hp - b.hp)[0];
    if(weakest) {
        for (let u of s1.units.filter(u => u.team === team && u.hp > 0)) { this.executeGridIntent(u, weakest); }
        s1.units = s1.units.filter(u => u.hp > 0);
        possibleStates.push(s1);
    }

    // Strat 2: Greedy Nearest (Basic spatial approach)
    let s2 = JSON.parse(JSON.stringify(state));
    for (let u of s2.units.filter(u => u.team === team && u.hp > 0)) {
        let nearest = s2.units.filter(en => en.team !== team && en.hp > 0).sort((a,b)=>calcDist(u, a) - calcDist(u, b))[0];
        if(nearest) this.executeGridIntent(u, nearest);
    }
    s2.units = s2.units.filter(u => u.hp > 0);
    possibleStates.push(s2);

    return possibleStates;
  }

  static minimaxGrid(state, depth, alpha, beta, maximizingPlayer, stats) {
    if (depth === 0) {
        stats.nodesEvaluated++;
        return { score: this.evaluateGrid(state), state: state };
    }
    
    let isGameOver = state.units.filter(u => u.team === 'ai').length === 0 || state.units.filter(u => u.team === 'player').length === 0;
    if (isGameOver) {
        stats.nodesEvaluated++;
        return { score: this.evaluateGrid(state), state: state };
    }

    if (maximizingPlayer) {
      let maxEval = -Infinity;
      let bestState = null;
      let possibleMoves = this.generateGridMoves(state, 'ai');
      for (const nextState of possibleMoves) {
        let ev = this.minimaxGrid(nextState, depth - 1, alpha, beta, false, stats).score;
        if (ev > maxEval) { maxEval = ev; bestState = nextState; }
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) { stats.branchesPruned++; break; }
      }
      return { score: maxEval, state: bestState || possibleMoves[0] };
    } else {
      let minEval = Infinity;
      let bestState = null;
      let possibleMoves = this.generateGridMoves(state, 'player');
      for (const nextState of possibleMoves) {
        let ev = this.minimaxGrid(nextState, depth - 1, alpha, beta, true, stats).score;
        if (ev < minEval) { minEval = ev; bestState = nextState; }
        beta = Math.min(beta, ev);
        if (beta <= alpha) { stats.branchesPruned++; break; }
      }
      return { score: minEval, state: bestState || possibleMoves[0] };
    }
  }

  static getBestGridMove(initialState) {
    let stats = { nodesEvaluated: 0, branchesPruned: 0 };
    const result = this.minimaxGrid(initialState, 4, -Infinity, Infinity, true, stats);
    return { nextState: result.state, stats };
  }
}

module.exports = AIEngine;
