import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FileText, Settings, Shield, Swords, Compass, Activity, Server, Target, Cpu, CheckCircle, Heart, Coins, Zap, Skull } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function App() {
  const [view, setView] = useState('landing'); 
  const [globalPlayer, setGlobalPlayer] = useState({ hp: 100, maxHp: 100, gold: 10, level: 1 });

  return (
    <div className="app-canvas">
      <div className="wave-container">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      
      <nav className="navbar">
         <div className="nav-brand"><Server size={20} className="mr-2"/> ENGINE v3.0</div>
         <div className="nav-links">
            <button className={`nav-btn ${view==='landing'?'active':''}`} onClick={()=>setView('landing')}>Home</button>
            <button className={`nav-btn ${view==='about'?'active':''}`} onClick={()=>setView('about')}>Architecture</button>
            <button className={`nav-btn ${view==='lvl1'?'active':''}`} onClick={()=>setView('lvl1')}>Lvl 1: Story</button>
            <button className={`nav-btn ${view==='lvl2'?'active':''}`} onClick={()=>setView('lvl2')}>Lvl 2: Combat</button>
            <button className={`nav-btn accent`} onClick={()=>setView('lvl3')}>Lvl 3: Executioner</button>
         </div>
      </nav>

      {view === 'landing' && <LandingPage setView={setView} />}
      {view === 'about' && <AboutPage />}
      {view === 'lvl1' && <LevelOneStory setView={setView} player={globalPlayer} setPlayer={setGlobalPlayer} />}
      {view === 'lvl2' && <LevelTwoGrid setView={setView} player={globalPlayer} />}
      {view === 'lvl3' && <LevelThreeHangman setView={setView} />}
    </div>
  );
}

/* =========================================
   LANDING PAGE & ABOUT PAGE
========================================= */
function LandingPage({ setView }) {
  return (
    <div className="page-view flex-center">
       <div className="hero-content">
          <h1 className="hero-title">ALGORITHMIC REALMS</h1>
          <p className="hero-subtitle">Experience a dynamic tri-level campaign powered natively by Minimax and Alpha-Beta Cutoffs. Survive the Story, command physical grids, and try to execute the Evil Hangman.</p>
          <div className="hero-buttons mt-4 flex-center" style={{gap: '15px'}}>
             <button className="main-btn primary" onClick={() => setView('lvl1')}><Play size={18} className="mr-2"/> Level 1 (Campaign)</button>
             <button className="main-btn primary" style={{background: '#ef4444', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)'}} onClick={() => setView('lvl3')}><Skull size={18} className="mr-2"/> Level 3 (Hangman)</button>
          </div>
       </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="page-view doc-page">
       <h2 className="doc-title">System Architecture</h2>
       <div className="doc-grid">
          <div className="doc-card">
             <h3><FileText size={20}/> Level 1: Narrative Minimax</h3>
             <p>The backend evaluates mathematical tension. The engine simulates 3 story-branches deep to locate an optimal path where the player's hitpoints dynamically hover exactly around 45%.</p>
          </div>
          <div className="doc-card">
             <h3><Target size={20}/> Level 2: Spatial Grid</h3>
             <p>The algorithm switches to a zero-sum spatial engine mapping physical distancing and line-of-sight to aggressively dismantle your positioning inside the grid.</p>
          </div>
          <div className="doc-card">
             <h3><Skull size={20}/> Level 3: Adversarial Executioner</h3>
             <p>A natively "Evil" version of Hangman. The AI algorithm does not pick a word. It systematically partitions the entire linguistic dictionary actively changing the un-guessed letters dynamically dodging your strikes.</p>
          </div>
       </div>
    </div>
  );
}

/* =========================================
   LEVEL 1 & 2 EXCLUDED DOMAIN LOGIC 
========================================= */
function LevelOneStory({ setView, player, setPlayer }) {
  const [history, setHistory] = useState([{ id: 0, text: "SURVIVE LEVEL 1: Navigate 3 encounters.", type: 'system' }]);
  const [activeEncounter, setActiveEncounter] = useState(null);
  const [encounterCount, setEncounterCount] = useState(0);

  const requestNextEncounter = async (pState) => {
    if (encounterCount >= 3) { setHistory(pr=>[...pr, {id:99, text:"CLEARED LEVEL 1! Entering the Boss Room.", type:'outcome'}]); setActiveEncounter({isEnd:true}); return; }
    try {
      const res = await axios.post(`${BACKEND_URL}/api/ai/story`, { gameState: { player: pState } });
      setActiveEncounter(res.data.nextState);
      setHistory(pr=>[...pr, {id: Date.now(), text: `> DM Spawns: ${res.data.nextState.text}`, type:'encounter'}]);
    } catch(err) { console.error(err); }
  };

  const handleAction = (aType) => {
    let nP = {...player}; let cE = activeEncounter;
    if(aType === 'fight') { nP.hp -= cE.damage; nP.gold += cE.reward; setHistory(p=>[...p, {id: Date.now(), text:`Fought! Took ${cE.damage} DMG, gained ${cE.reward} G.`, type:'outcome'}]); }
    else { nP.hp += cE.heal; if(cE.damage>0) nP.hp -= cE.damage; setHistory(p=>[...p, {id: Date.now(), text:`Interacted cleanly. Healed ${cE.heal} HP.`, type:'outcome'}]); }
    if(nP.hp > nP.maxHp) nP.hp = nP.maxHp;
    setPlayer(nP); setActiveEncounter(null); setEncounterCount(c=>c+1);
    setTimeout(() => requestNextEncounter(nP), 800);
  };

  return (
    <div className="page-view flex-row">
       <div className="hud-panel"><h3>Lvl 1 Stats</h3><div className="hud-stats"><p><Heart size={16} color="#ff6b6b"/> HP: {player.hp}</p><p><Coins size={16} color="#f59e0b"/> Gold: {player.gold}</p></div></div>
       <div className="main-console">
          <div className="story-log">{history.map(i=><div key={i.id} className={`story-entry ${i.type}`}>{i.text}</div>)}</div>
          <div className="controls-bar">
             {!activeEncounter && player.hp>0 && encounterCount===0 && <button className="main-btn primary" onClick={()=>requestNextEncounter(player)}>Generate</button>}
             {activeEncounter && !activeEncounter.isEnd && <div className="action-row"><button className="main-btn btn-atk" onClick={()=>handleAction('fight')}>Fight</button><button className="main-btn btn-int" onClick={()=>handleAction('interact')}>Interact</button></div>}
             {activeEncounter?.isEnd && <button className="main-btn victory" onClick={()=>setView('lvl2')}>Next Level</button>}
          </div>
       </div>
    </div>
  );
}

function LevelTwoGrid({ player }) {
  return (
    <div className="page-view flex-center text-center">
       <div className="doc-card" style={{maxWidth: '600px'}}>
           <h3 style={{justifyContent: 'center'}}><Target size={30}/> LEVEL 2 TACTICAL COMBAT</h3>
           <p>Your Health carried over: <span className="text-red"><b>{player.hp} HP</b></span></p>
           <p className="mt-4">The core physical combat engine is actively standing by. Please navigate to <b>Level 3 (Hangman)</b> to test the new linguistic Adversarial AI features recently patched globally.</p>
       </div>
    </div>
  )
}

/* =========================================
   LEVEL 3: ADVERSARIAL EVIL HANGMAN
========================================= */
const HANGMAN_ASCII = [
  ``,  // 0 wrong
  `  \n  O \n `, // 1 wrong
  `  \n  O \n  | `, // 2 wrong
  `  \n  O \n /| `, // 3 wrong
  `  \n  O \n /|\\`, // 4 wrong
  `  \n  O \n /|\\\n /`, // 5 wrong
  `  \n  O \n /|\\\n / \\` // 6 wrong
];

function LevelThreeHangman() {
   const [pattern, setPattern] = useState('_________'); // 9 letters defaults to ALGORITHM
   const [dictionary, setDictionary] = useState([]);
   const [guessed, setGuessed] = useState([]);
   const [wrongCount, setWrongCount] = useState(0);
   const [metrics, setMetrics] = useState(null);
   const [gameStatus, setGameStatus] = useState('PLAYING'); // PLAYING, WON, LOST

   const guessLetter = async (char) => {
       if (guessed.includes(char) || gameStatus !== 'PLAYING') return;
       const newGuessed = [...guessed, char];
       setGuessed(newGuessed);

       try {
           const res = await axios.post(`${BACKEND_URL}/api/ai/hangman`, {
               gameState: { dictionary: dictionary, guessedLetter: char, currentPattern: pattern }
           });
           
           const { nextPattern, nextDictionary, isCorrect, metrics: m } = res.data;
           setPattern(nextPattern);
           setDictionary(nextDictionary);
           setMetrics(m);

           let newWrong = wrongCount;
           if (!isCorrect) {
               newWrong++;
               setWrongCount(newWrong);
           }

           if (!nextPattern.includes('_')) {
               setGameStatus('WON');
           } else if (newWrong >= 6) {
               setGameStatus('LOST');
           }
       } catch (err) { console.error("Hangman Server Error", err); }
   };

   return (
       <div className="page-view flex-row">
          <div className="hud-panel" style={{border: '1px solid #ef4444'}}>
             <h3 style={{color: '#ef4444'}}><Skull size={18}/> Level 3: Executioner</h3>
             <p className="text-muted mt-2">The AI does NOT pick a word. It evaluates your guesses and dynamically alters the dictionary bounds to force you down dead-end nodes.</p>
             
             <div className="mt-4" style={{background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px', textAlign: 'center'}}>
                <div style={{fontFamily: 'monospace', whiteSpace: 'pre', color: '#f87171', fontSize: '1.5rem', lineHeight: '1.2'}}>
                    {` +---+\n |   |\n${HANGMAN_ASCII[wrongCount] || ''}`}
                </div>
                <p className="mt-4 text-red">STRIKES: {wrongCount} / 6</p>
             </div>

             {metrics && (
                <div className="grid-metrics mt-4" style={{borderColor: 'rgba(239, 68, 68, 0.4)'}}>
                   <p><Cpu size={14}/> Node Deep-Search: {metrics.nodesEvaluated}</p>
                   <p><Zap size={14}/> Matrix Pruned: {metrics.branchesPruned}</p>
                   <p><Activity size={14}/> V8 Latency: {metrics.timeTakenMs}ms</p>
                </div>
             )}
          </div>

          <div className="main-console flex-center" style={{flexDirection: 'column'}}>
             <div style={{fontSize: '4rem', letterSpacing: '0.8rem', fontFamily: 'monospace', textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'}}>
                 {pattern}
             </div>
             
             {gameStatus === 'WON' && <h2 className="text-green mt-4" style={{fontSize: '2rem'}}>SYSTEM OVERRIDEN. YOU SURVIVED.</h2>}
             {gameStatus === 'LOST' && <h2 className="text-red mt-4" style={{fontSize: '2rem'}}>EXECUTION IMMINENT. GAME OVER.</h2>}

             <div className="keyboard mt-4">
                 {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(char => (
                    <button 
                       key={char} 
                       className={`key-btn ${guessed.includes(char) ? 'disabled' : ''}`}
                       onClick={() => guessLetter(char)}
                       disabled={guessed.includes(char) || gameStatus !== 'PLAYING'}
                    >
                       {char}
                    </button>
                 ))}
             </div>

             {gameStatus !== 'PLAYING' && (
                 <button className="main-btn primary mt-4" onClick={() => { setPattern('_________'); setDictionary([]); setGuessed([]); setWrongCount(0); setGameStatus('PLAYING'); setMetrics(null); }}>
                    Re-initialize Adversary
                 </button>
             )}
          </div>
       </div>
   )
}
