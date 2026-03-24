import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FileText, Settings, Shield, Swords, Compass, Activity, Server, Target, Cpu, CheckCircle, Heart, Coins, Zap } from 'lucide-react';

/* =========================================
   MASTER APP CONTROLLER & NAVIGATION
========================================= */
export default function App() {
  const [view, setView] = useState('landing'); // 'landing', 'about', 'lvl1', 'lvl2'
  const [globalPlayer, setGlobalPlayer] = useState({ hp: 100, maxHp: 100, gold: 10, level: 1 });

  return (
    <div className="app-canvas">
      {/* GLOBAL NAVBAR */}
      <nav className="navbar">
         <div className="nav-brand"><Server size={20} className="mr-2"/> D&D ENGINE</div>
         <div className="nav-links">
            <button className={`nav-btn ${view==='landing'?'active':''}`} onClick={()=>setView('landing')}>Home</button>
            <button className={`nav-btn ${view==='about'?'active':''}`} onClick={()=>setView('about')}>Architecture</button>
            <button className="nav-btn accent" onClick={()=>setView('lvl1')}>Play Campaign</button>
         </div>
      </nav>

      {/* VIEWS */}
      {view === 'landing' && <LandingPage setView={setView} />}
      {view === 'about' && <AboutPage />}
      {view === 'lvl1' && <LevelOneStory setView={setView} player={globalPlayer} setPlayer={setGlobalPlayer} />}
      {view === 'lvl2' && <LevelTwoGrid setView={setView} player={globalPlayer} />}
    </div>
  );
}

/* =========================================
   LANDING PAGE
========================================= */
function LandingPage({ setView }) {
  return (
    <div className="page-view flex-center">
       <div className="hero-content">
          <h1 className="hero-title">ALGORITHMIC REALMS</h1>
          <p className="hero-subtitle">Experience a dynamic duo-level campaign powered natively by Minimax and Alpha-Beta Cutoffs. Survive the Dungeon Master's generated story, then command your tactics on the physical grid.</p>
          <div className="hero-buttons mt-4">
             <button className="main-btn primary" onClick={() => setView('lvl1')}><Play size={18} className="mr-2"/> Commence Level 1</button>
             <button className="main-btn secondary" onClick={() => setView('about')}><Settings size={18} className="mr-2"/> System Architecture</button>
          </div>
       </div>
    </div>
  );
}

/* =========================================
   ABOUT / SYSTEM ARCHITECTURE PAGE
========================================= */
function AboutPage() {
  return (
    <div className="page-view doc-page">
       <h2 className="doc-title">System Architecture</h2>
       <div className="doc-grid">
          <div className="doc-card">
             <h3><FileText size={20}/> Level 1: Narrative Minimax</h3>
             <p>The backend evaluates mathematical tension. Instead of killing the player instantly, it generates 3-turn-deep Game Trees assessing encounters (Traps, Goblins, Fountains) to keep player HP hovering around 45%.</p>
          </div>
          <div className="doc-card">
             <h3><Target size={20}/> Level 2: Spatial Grid Minimax</h3>
             <p>Once inside the Boss Room, the algorithm switches to a pure zero-sum spatial engine. It calculates physical distancing, line-of-sight, and deterministic greedy combat intent to dismantle your positioning.</p>
          </div>
          <div className="doc-card">
             <h3><Zap size={20}/> Alpha-Beta Exhaustion</h3>
             <p>Both levels utilize pristine Alpha-Beta Branch Cutoffs. Redundant logical branches (e.g., buying a potion when you have 0 gold) are mathematically severed before computational time is wasted natively in V8.</p>
          </div>
       </div>
    </div>
  );
}

/* =========================================
   LEVEL 1: STORY ADVENTURE
========================================= */
function LevelOneStory({ setView, player, setPlayer }) {
  const [history, setHistory] = useState([
    { id: 0, text: "LEVEL 1. The algorithms have dropped you into a dark crypt. Survive 3 encounters to reach the Boss Room.", type: 'system' }
  ]);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [encounterCount, setEncounterCount] = useState(0);
  const logEndRef = useRef(null);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history, activeEncounter]);

  const addLog = (text, type = 'story') => {
    setHistory(prev => [...prev, { id: Date.now() + Math.random(), text, type }]);
  };

  const requestNextEncounter = async (currentPlayerState) => {
    if (encounterCount >= 3) {
        addLog("✅ You have survived Level 1! The massive iron doors to the Boss Room unlock.", 'outcome');
        setActiveEncounter({ isEnd: true });
        return;
    }
    
    try {
      const res = await axios.post('http://localhost:5000/api/ai/story', { gameState: { player: currentPlayerState } });
      setActiveEncounter(res.data.nextState);
      addLog(`> DM Spawns: ${res.data.nextState.text}`, 'encounter');
    } catch (err) { addLog(`Error: ${err.message}`, 'system'); }
  };

  const handleAction = (actionType) => {
    let newPlayer = { ...player };
    let cEncounter = activeEncounter;
    
    if (actionType === 'fight') { newPlayer.hp -= cEncounter.damage; newPlayer.gold += cEncounter.reward; addLog(`You fought! Lost ${cEncounter.damage} HP, gained ${cEncounter.reward} Gold.`, 'outcome'); }
    else if (actionType === 'interact') {
       if (cEncounter.damage > 0) { newPlayer.hp -= (cEncounter.damage + 5); addLog("It was a trap! You took horrific damage.", "outcome"); }
       else { newPlayer.hp += cEncounter.heal; addLog(`You interacted safely and healed ${cEncounter.heal} HP.`, 'outcome'); }
    }
    
    newPlayer.level += 1;
    if (newPlayer.hp > newPlayer.maxHp) newPlayer.hp = newPlayer.maxHp;
    setPlayer(newPlayer);
    setActiveEncounter(null);
    setEncounterCount(cnt => cnt + 1);

    if (newPlayer.hp <= 0) addLog("💀 YOU DIED IN LEVEL 1.", 'system');
    else setTimeout(() => requestNextEncounter(newPlayer), 1000);
  };

  return (
    <div className="page-view flex-row">
       {/* UI HUD */}
       <div className="hud-panel">
          <h3>Player Sheet</h3>
          <div className="hud-stats">
              <p><Heart size={16} color="#ff6b6b"/> HP: {player.hp}/{player.maxHp}</p>
              <p><Coins size={16} color="#f59e0b"/> Gold: {player.gold}</p>
              <p><Shield size={16} color="#a4b0be"/> Level: {player.level}</p>
              <hr/>
              <p className="text-muted"><Compass size={16}/> Rooms Survived: {encounterCount}/3</p>
          </div>
       </div>

       {/* LOG & CONSOLE */}
       <div className="main-console">
          <div className="story-log">
             <AnimatePresence>
                {history.map(item => <motion.div key={item.id} className={`story-entry ${item.type}`}>{item.text}</motion.div>)}
             </AnimatePresence>
             <div ref={logEndRef} />
          </div>

          <div className="controls-bar">
             {!activeEncounter && player.hp > 0 && encounterCount === 0 && (
                <button className="main-btn primary" onClick={() => requestNextEncounter(player)}>Start Encounter Generation</button>
             )}
             {activeEncounter && !activeEncounter.isEnd && player.hp > 0 && (
                <div className="action-row">
                   <button className="main-btn btn-atk" onClick={() => handleAction('fight')}><Swords size={16}/> Fight</button>
                   <button className="main-btn btn-int" onClick={() => handleAction('interact')}><Activity size={16}/> Interact</button>
                </div>
             )}
             {activeEncounter?.isEnd && (
                <button className="main-btn victory" onClick={() => setView('lvl2')}><CheckCircle size={16}/> Advance to Level 2 (Grid Combat)</button>
             )}
             {player.hp <= 0 && <span className="text-red">Simulation Dead.</span>}
          </div>
       </div>
    </div>
  );
}

/* =========================================
   LEVEL 2: COMBAT TACTICAL GRID
========================================= */
function LevelTwoGrid({ setView, player }) {
  const [gameState, setGameState] = useState({
      gridSize: 8,
      units: [
         { id: 'p1', team: 'player', x: 1, y: 1, hp: player.hp, maxHp: player.maxHp, attack: 40, range: 1, type: 'Hero' },
         { id: 'a1', team: 'ai', x: 6, y: 6, hp: 120, maxHp: 120, attack: 30, range: 2, type: 'Dark Lord Boss' },
         { id: 'a2', team: 'ai', x: 6, y: 5, hp: 50, maxHp: 50, attack: 20, range: 1, type: 'Minion Guard' },
      ]
  });
  const [isBattling, setIsBattling] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const resolvePlayerMove = (state) => {
    let ns = JSON.parse(JSON.stringify(state));
    let hero = ns.units.find(u => u.team === 'player');
    let enemies = ns.units.filter(u => u.team === 'ai');
    if (!hero || enemies.length === 0) return ns;

    let nearest = enemies.sort((a,b) => (Math.abs(hero.x - a.x) + Math.abs(hero.y - a.y)) - (Math.abs(hero.x - b.x) + Math.abs(hero.y - b.y)))[0];
    let dist = Math.abs(hero.x - nearest.x) + Math.abs(hero.y - nearest.y);
    
    if (dist <= hero.range) { nearest.hp -= hero.attack; } 
    else {
        if (hero.x < nearest.x) hero.x += 1;
        else if (hero.x > nearest.x) hero.x -= 1;
        else if (hero.y < nearest.y) hero.y += 1;
        else if (hero.y > nearest.y) hero.y -= 1;
    }
    ns.units = ns.units.filter(u => u.hp > 0);
    return ns;
  };

  const executeTurn = async () => {
      let stateP = resolvePlayerMove(gameState);
      if (stateP.units.filter(u => u.team === 'ai').length === 0) { setIsBattling(false); alert("VICTORY! YOU CLEARED LEVEL 2!"); return; }
      if (stateP.units.filter(u => u.team === 'player').length === 0) { setIsBattling(false); alert("YOU DIED ON LEVEL 2!"); return; }
      
      try {
         const res = await axios.post('http://localhost:5000/api/ai/grid', { gameState: stateP });
         setGameState(res.data.nextState);
         setMetrics(res.data.metrics);
         
         const aiLeft = res.data.nextState.units.filter(u=>u.team==='ai').length;
         const pLeft = res.data.nextState.units.filter(u=>u.team==='player').length;
         if(aiLeft===0) { setIsBattling(false); alert("VICTORY! You defeated the Boss!"); }
         if(pLeft===0) { setIsBattling(false); alert("SLAUGHTERED BY THE AI BOSS."); }

      } catch (err) { console.error(err); setIsBattling(false); }
  };

  useEffect(() => {
     let intv;
     if (isBattling) intv = setInterval(executeTurn, 1000);
     return () => clearInterval(intv);
  }, [isBattling, gameState]);

  return (
    <div className="page-view flex-row">
       <div className="hud-panel dark-hud">
          <h3>Level 2: Boss Combat</h3>
          <p className="text-muted mt-2">The AI relies strictly on distance vector mapping to hunt you.</p>
          <button className="main-btn primary mt-4" onClick={() => setIsBattling(!isBattling)}>
             {isBattling ? "Pause Simulation" : "Start Auto-Battle"}
          </button>
          
          {metrics && (
             <div className="grid-metrics mt-4">
                <p><Cpu size={14}/> Node Depth: {metrics.nodesEvaluated}</p>
                <p><Zap size={14}/> Pruned: {metrics.branchesPruned}</p>
                <p><Activity size={14}/> Latency: {metrics.timeTakenMs}ms</p>
             </div>
          )}
       </div>

       <div className="main-console flex-center">
          <div className="physical-grid">
             {Array.from({length: 8*8}).map((_, idx) => {
                 let x = idx % 8; let y = Math.floor(idx / 8);
                 let unit = gameState.units.find(u => u.x === x && u.y === y);
                 return (
                     <div key={idx} className="grid-cell">
                         {unit && (
                           <motion.div layoutId={unit.id} className={`grid-unit ${unit.team}`}>
                              {unit.team === 'player' ? '🛡️' : '☠️'}
                              <div className="hp-mini-bar" style={{width: `${(unit.hp/unit.maxHp)*100}%`}}></div>
                           </motion.div>
                         )}
                     </div>
                 )
             })}
          </div>
       </div>
    </div>
  );
}
