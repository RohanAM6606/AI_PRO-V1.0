const express = require('express');
const cors = require('cors');
const AIEngine = require('./ai/engine');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ai/story', (req, res) => {
    const { gameState } = req.body;
    const startTime = Date.now();
    try {
        const result = AIEngine.getBestStoryMove(gameState);
        res.json({
            success: true,
            nextState: result.encounter,
            metrics: {
                timeTakenMs: Date.now() - startTime,
                algorithm: "Minimax + Alpha-Beta Pruning (Tension Score)",
                nodesEvaluated: result.stats.nodesEvaluated,
                branchesPruned: result.stats.branchesPruned
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

app.post('/api/ai/grid', (req, res) => {
    const { gameState } = req.body;
    const startTime = Date.now();
    try {
        const result = AIEngine.getBestGridMove(gameState);
        res.json({
            success: true,
            nextState: result.nextState,
            metrics: {
                timeTakenMs: Date.now() - startTime,
                algorithm: "Minimax + Alpha-Beta (Spatial Grid)",
                nodesEvaluated: result.stats.nodesEvaluated,
                branchesPruned: result.stats.branchesPruned
            }
        });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Master Campaign Backend (Story + Tactics) running on port ${PORT}`);
});
