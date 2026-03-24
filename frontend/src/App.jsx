import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Play, RotateCcw, Shield, ChevronDown, Sword, Activity, Pickaxe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TROOP_TYPES = [
  { type: 'Steve', symbol: '👦', hp: 200, attack: 40, range: 1 },
  { type: 'Iron Golem', symbol: '🤖', hp: 800, attack: 100, range: 1 },
  { type: 'Snow Golem', symbol: '⛄', hp: 100, attack: 20, range: 4 },
  { type: 'Wolf', symbol: '🐺', hp: 150, attack: 30, range: 1 },
  { type: 'Villager', symbol: '👨‍🌾', hp: 100, attack: 0, range: 0 },
  { type: 'TNT', symbol: '🧨', hp: 50, attack: 200, range: 2 },
  { type: 'Alex', symbol: '👧', hp: 200, attack: 50, range: 2 }
];

const INITIAL_STATE = {
  gridSize: 12,
  units: [
    { id: 'a1', team: 'ai', x: 5, y: 5, hp: 500, maxHp: 500, attack: 60, range: 1, type: 'Zombie', symbol: '🧟' },
    { id: 'a2', team: 'ai', x: 4, y: 4, hp: 300, maxHp: 300, attack: 40, range: 5, type: 'Skeleton', symbol: '💀' },
    { id: 'a3', team: 'ai', x: 6, y: 4, hp: 300, maxHp: 300, attack: 40, range: 5, type: 'Skeleton', symbol: '💀' },
    { id: 'a4', team: 'ai', x: 4, y: 6, hp: 200, maxHp: 200, attack: 150, range: 1, type: 'Creeper', symbol: '💥' },
    { id: 'a5', team: 'ai', x: 6, y: 6, hp: 200, maxHp: 200, attack: 150, range: 1, type: 'Creeper', symbol: '💥' },
    { id: 'a6', team: 'ai', x: 5, y: 3, hp: 250, maxHp: 250, attack: 30, range: 2, type: 'Spider', symbol: '🕷️' },
    { id: 'a7', team: 'ai', x: 5, y: 7, hp: 250, maxHp: 250, attack: 30, range: 2, type: 'Spider', symbol: '🕷️' },
    { id: 'a8', team: 'ai', x: 3, y: 5, hp: 600, maxHp: 600, attack: 80, range: 1, type: 'Enderman', symbol: '👁️' },
    { id: 'a9', team: 'ai', x: 7, y: 5, hp: 600, maxHp: 600, attack: 80, range: 1, type: 'Enderman', symbol: '👁️' },
    { id: 'a10', team: 'ai', x: 5, y: 2, hp: 1500, maxHp: 1500, attack: 120, range: 4, type: 'Wither', symbol: '👻' },
    { id: 'a11', team: 'ai', x: 5, y: 9, hp: 2000, maxHp: 2000, attack: 200, range: 5, type: 'Ender Dragon', symbol: '🐉' },
    { id: 'a12', team: 'ai', x: 3, y: 3, hp: 300, maxHp: 300, attack: 40, range: 5, type: 'Stray', symbol: '🏹' },
    { id: 'a13', team: 'ai', x: 7, y: 7, hp: 400, maxHp: 400, attack: 50, range: 1, type: 'Zombie Pigman', symbol: '🐖' }
  ]
};

function HeroSection({ onScrollToGame }) {
  return (
    <div className="hero-section">
      <div className="hero-overlay"></div>
      <motion.div 
        className="hero-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="mc-title">MINEMAX AI</h1>
        <p className="hero-subtitle">Survive the night. Deploy Golems, TNT, and Heroes to defeat the hostile mob invasion.</p>
        <button className="mc-btn cta-btn" onClick={onScrollToGame}>
          <Pickaxe size={28} style={{ marginRight: '10px' }} />
          ENTER OVERWORLD
        </button>
      </motion.div>
      <div className="scroll-indicator" onClick={onScrollToGame}>
        <ChevronDown size={36} />
      </div>
    </div>
  );
}

function Simulator({ simulatorRef }) {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [isBattling, setIsBattling] = useState(false);
  const [selectedTroop, setSelectedTroop] = useState(TROOP_TYPES[0]);
  const [logs, setLogs] = useState(["[Server] Welcome to the Overworld.", "[Server] Select an item from your Hotbar and click a grass block."]);
  const [metrics, setMetrics] = useState(null);

  const addLog = (msg) => {
    setLogs(prev => {
        const next = [msg, ...prev];
        return next.slice(0, 10);
    });
  };

  const handleCellClick = (x, y) => {
    if (isBattling) return;
    setGameState(prev => {
      let newUnits = [...prev.units];
      const unitIdx = newUnits.findIndex(u => u.x === x && u.y === y);
      
      if (unitIdx !== -1) {
        if (newUnits[unitIdx].team === 'player') {
          newUnits.splice(unitIdx, 1);
        }
      } else {
        newUnits.push({
          id: 'p' + Date.now() + Math.random(),
          team: 'player', 
          x, y, 
          hp: selectedTroop.hp, maxHp: selectedTroop.hp, 
          attack: selectedTroop.attack, range: selectedTroop.range, 
          type: selectedTroop.type, symbol: selectedTroop.symbol
        });
      }
      return { ...prev, units: newUnits };
    });
  };

  const resolvePlayerMove = (state) => {
    let newState = JSON.parse(JSON.stringify(state));
    for (let u of newState.units.filter(unit => unit.team === 'player' && unit.hp > 0)) {
        let enemies = newState.units.filter(en => en.team === 'ai' && en.hp > 0);
        if (enemies.length === 0) continue;
        
        // Simple TNT logic: Explodes and dies instantly if in range
        if (u.type === 'TNT') {
             let nearest = enemies.sort((a,b) => (Math.abs(u.x - a.x) + Math.abs(u.y - a.y)) - (Math.abs(u.x - b.x) + Math.abs(u.y - b.y)))[0];
             let dist = Math.abs(u.x - nearest.x) + Math.abs(u.y - nearest.y);
             if (dist <= u.range) {
                 nearest.hp -= u.attack;
                 u.hp = 0; // Boom
             }
             continue; // Doesn't move
        }

        if (u.type === 'Villager') continue; // Peaceful, doesn't attack
        
        let nearest = enemies.sort((a,b) => (Math.abs(u.x - a.x) + Math.abs(u.y - a.y)) - (Math.abs(u.x - b.x) + Math.abs(u.y - b.y)))[0];
        let dist = Math.abs(u.x - nearest.x) + Math.abs(u.y - nearest.y);
        
        if (dist <= u.range) {
            nearest.hp -= u.attack;
        } else {
            if (u.x < nearest.x) u.x += 1;
            else if (u.x > nearest.x) u.x -= 1;
            else if (u.y < nearest.y) u.y += 1;
            else if (u.y > nearest.y) u.y -= 1;
        }
    }
    newState.units = newState.units.filter(u => u.hp > 0);
    return newState;
  };

  const executeTurn = async () => {
    if (!isBattling) return;

    try {
        let stateAfterPlayer = resolvePlayerMove(gameState);
        setGameState(stateAfterPlayer);
        
        const aiUnitsLeft = stateAfterPlayer.units.filter(u => u.team === 'ai').length;
        const playerUnitsLeft = stateAfterPlayer.units.filter(u => u.team === 'player').length;

        if (aiUnitsLeft === 0) {
            addLog("<System> Hostile mobs cleared. You survived!");
            setIsBattling(false);
            return;
        }
        if (playerUnitsLeft === 0) {
            addLog("<System> You died! Spawn area overrun.");
            setIsBattling(false);
            return;
        }

        const res = await axios.post('http://localhost:5000/api/ai/move', { gameState: stateAfterPlayer });
        
        setGameState(res.data.nextState);
        setMetrics(res.data.metrics);
        addLog(`<Herobrine> Calculated next strike in ${res.data.metrics.timeTakenMs}ms.`);

    } catch (err) {
        addLog(`<System> Exception raised: ${err.message}`);
        setIsBattling(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isBattling) {
      interval = setInterval(executeTurn, 1800);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattling, gameState]);

  const toggleBattle = () => {
    if (gameState.units.filter(u => u.team === 'player').length === 0 && !isBattling) {
       addLog("<System> You need to spawn an entity first!");
       return;
    }
    setIsBattling(!isBattling);
    if (!isBattling) addLog("<System> Night falls. The hostile mobs are attacking!");
    else addLog("<System> Time paused.");
  };

  const resetBattle = () => {
    setGameState(INITIAL_STATE);
    setIsBattling(false);
    setLogs(["[Server] World reset.", "Spawn areas loaded."]);
    setMetrics(null);
  };

  return (
    <div className="simulator-section" ref={simulatorRef}>
      <h2 className="mc-title" style={{fontSize: '4rem', color: '#fff', textAlign: 'center', marginBottom: '40px'}}>THE OVERWORLD</h2>
      
      <div className="dashboard">
        {/* LEFT PANEL */}
        <div className="mc-panel controls">
          <div className="mc-panel-header">HOTBAR</div>
          
          <div className="troop-selector">
             {TROOP_TYPES.map(troop => (
               <div 
                 key={troop.type} 
                 className={`mc-slot ${selectedTroop.type === troop.type ? 'active' : ''}`}
                 onClick={() => setSelectedTroop(troop)}
               >
                 <div className="troop-emoji">{troop.symbol}</div>
                 <div className="troop-name">{troop.type}</div>
               </div>
             ))}
          </div>

          <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <button className="mc-btn" onClick={toggleBattle}>
              {isBattling ? "Pause Simulation" : "Start Simulation"}
            </button>
            <button className="mc-btn mc-btn-danger" onClick={resetBattle}>
              Reset World
            </button>
          </div>

          {metrics && (
             <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="mc-stats-box">
                 <h4>Mob Intel</h4>
                 <p>{metrics.timeTakenMs}ms Latency</p>
                 <p>{metrics.algorithm}</p>
             </motion.div>
          )}

        </div>

        {/* CENTER GRID */}
        <div className="battlefield-wrapper">
           <div className="battlefield">
              {Array.from({length: INITIAL_STATE.gridSize * INITIAL_STATE.gridSize}).map((_, idx) => {
                  const x = idx % INITIAL_STATE.gridSize;
                  const y = Math.floor(idx / INITIAL_STATE.gridSize);
                  const unit = gameState.units.find(u => u.x === x && u.y === y);
                  
                  return (
                      <div key={idx} className="mc-cell" onClick={() => handleCellClick(x, y)} style={{ cursor: isBattling ? 'default' : 'crosshair' }}>
                          {unit && (
                              <motion.div 
                                layoutId={unit.id}
                                className={`unit ${unit.team}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                              >
                                  {unit.symbol}
                                  <div className="unit-hp">
                                    <div className="hp-bar" style={{width: `${Math.min(100, Math.max(0, (unit.hp / unit.maxHp) * 100))}%`}}></div>
                                  </div>
                              </motion.div>
                          )}
                      </div>
                  );
              })}
           </div>
        </div>
        
        {/* RIGHT PANEL */}
        <div className="mc-panel stats-panel">
             <div className="mc-panel-header">DEBUG SCREEN</div>
             <div className="mc-stats-content">
                 <h4 className="text-green">Allied Entities</h4>
                 <p className="stat-num">{gameState.units.filter(u=>u.team === 'player').length}</p>
                 <div className="divider"></div>
                 <h4 className="text-red">Hostile Mobs</h4>
                 <p className="stat-num">{gameState.units.filter(u=>u.team === 'ai').length}</p>
             </div>

             <div className="mc-chat">
               {logs.map((log, idx) => (
                  <motion.div key={idx} initial={{opacity:0}} animate={{opacity:1}} style={{color: log.includes('died') || log.includes('overrun') || log.includes('Exception') || log.includes('Compromised') ? '#ff5555' : log.includes('survived') ? '#55ff55' : '#fff', marginBottom: '4px'}}>
                      {log}
                  </motion.div>
               ))}
            </div>
        </div>

      </div>
    </div>
  );
}

function App() {
  const simulatorRef = useRef(null);

  const scrollToGame = () => {
    simulatorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-main">
      <HeroSection onScrollToGame={scrollToGame} />
      <Simulator simulatorRef={simulatorRef} />
    </div>
  );
}

export default App;
