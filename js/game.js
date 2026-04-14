
const Game = (() => {

  let state = {
    board: Array(9).fill(''),
    current: 'X',          
    gameOver: false,
    winner: null,
    winCombo: null,
    difficulty: 'medium',
    mode: 'pva',           
    history: [],            
    scores: { X: 0, O: 0, D: 0 },
    aiThinking: false,
    patternTracker: {}      
  };

  let aiTimeout = null;

  const getState = () => state;
  const getBoard = () => [...state.board];
  const isOver = () => state.gameOver;

  function restart() {
    if (aiTimeout) clearTimeout(aiTimeout);
    state.board = Array(9).fill('');
    state.current = 'X';
    state.gameOver = false;
    state.winner = null;
    state.winCombo = null;
    state.history = [];
    state.aiThinking = false;
    UI.onRestart();
  }

  function play(idx) {
    if (state.gameOver) return false;
    if (state.board[idx] !== '') return false;
    if (state.aiThinking) return false;

    if (state.current === 'X') {
      state.patternTracker[idx] = (state.patternTracker[idx] || 0) + 1;
    }

    state.history.push({
      board: [...state.board],
      current: state.current,
      moveIdx: idx
    });

    state.board[idx] = state.current;
    UI.onCellPlaced(idx, state.current);
    addMoveHistory(idx, state.current);

    const winner = AI.checkWinner(state.board);
    if (winner) {
      state.winner = winner;
      state.winCombo = AI.getWinCombo(state.board);
      state.gameOver = true;
      state.scores[winner]++;
      UI.onWin(winner, state.winCombo);
      return true;
    }

    if (state.board.every(c => c !== '')) {
      state.gameOver = true;
      state.scores['D']++;
      UI.onDraw();
      return true;
    }

    state.current = state.current === 'X' ? 'O' : 'X';
    if (state.mode === 'pva' && state.current === 'O' && !state.gameOver) {
      triggerAI();
    } else {
      UI.onTurnChange(state.current, state.mode);
      showHeatmap();
    }

    return true;
  }

  function undo() {
    if (state.aiThinking) return;
    if (state.history.length === 0) return;

    let stepsBack = state.mode === 'pva' ? 2 : 1;
    stepsBack = Math.min(stepsBack, state.history.length);

    for (let i = 0; i < stepsBack; i++) {
      state.history.pop();
    }

    const snap = state.history.length > 0
      ? state.history[state.history.length - 1]
      : null;

    state.board = snap ? [...snap.board] : Array(9).fill('');
    state.current = snap ? (snap.current === 'X' ? 'O' : 'X') : 'X';

    if (state.mode === 'pva') state.current = 'X';

    state.gameOver = false;
    state.winner = null;
    state.winCombo = null;

    UI.onUndo(state.board, state.current);
    showHeatmap();
  }

  function triggerAI() {
    state.aiThinking = true;
    UI.onAIThinking(true);

    const boardBefore = [...state.board];
    const delay = 700 + Math.random() * 800; 

    aiTimeout = setTimeout(() => {
      if (state.gameOver) return;

      let moveIdx = AI.getMove([...state.board], state.difficulty);

      if (state.difficulty === 'hard' && Math.random() < 0.12) {
        const userFav = Object.entries(state.patternTracker)
          .filter(([i]) => state.board[i] === '')
          .sort((a, b) => b[1] - a[1]);
        if (userFav.length > 0) moveIdx = parseInt(userFav[0][0]);
      }

      const explanation = AI.explainMove(boardBefore, moveIdx, state.difficulty);

      state.aiThinking = false;
      UI.onAIThinking(false);

      state.history.push({
        board: [...state.board],
        current: 'O',
        moveIdx
      });

      state.board[moveIdx] = 'O';
      UI.onCellPlaced(moveIdx, 'O');
      UI.onAIExplain(explanation);
      addMoveHistory(moveIdx, 'O');

      const winner = AI.checkWinner(state.board);
      if (winner) {
        state.winner = winner;
        state.winCombo = AI.getWinCombo(state.board);
        state.gameOver = true;
        state.scores[winner]++;
        UI.onWin(winner, state.winCombo);
        return;
      }

      if (state.board.every(c => c !== '')) {
        state.gameOver = true;
        state.scores['D']++;
        UI.onDraw();
        return;
      }

      state.current = 'X';
      UI.onTurnChange('X', state.mode);
      showHeatmap();
    }, delay);
  }

  function showHeatmap() {
    if (state.difficulty === 'easy') return;
    if (state.gameOver) return;
    const scores = AI.getHeatmap([...state.board]);
    UI.onHeatmap(scores);
  }

  function addMoveHistory(idx, player) {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    UI.addHistoryItem(player, row, col, state.history.length);
  }

  function setDifficulty(diff) {
    state.difficulty = diff;
  }

  function setMode(mode) {
    state.mode = mode;
    restart();
  }

  return {
    getState,
    getBoard,
    isOver,
    play,
    undo,
    restart,
    setDifficulty,
    setMode,
    showHeatmap
  };

})();
