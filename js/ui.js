
const UI = (() => {

  const board        = document.getElementById('board');
  const statusMsg    = document.getElementById('statusMsg');
  const thinkingInd  = document.getElementById('thinkingIndicator');
  const aiExplain    = document.getElementById('aiExplanation');
  const moveHistory  = document.getElementById('moveHistory');
  const scorePlayer  = document.getElementById('scorePlayer');
  const scoreAI      = document.getElementById('scoreAI');
  const scoreDraws   = document.getElementById('scoreDraws');
  const overlay      = document.getElementById('overlay');
  const overlayEmoji = document.getElementById('overlayEmoji');
  const overlayMsg   = document.getElementById('overlayMsg');
  const overlayWL    = document.getElementById('overlayWinLine');
  const undoBtn      = document.getElementById('undoBtn');
  const restartBtn   = document.getElementById('restartBtn');
  const themeToggle  = document.getElementById('themeToggle');
  const modeToggle   = document.getElementById('modeToggle');
  const diffBtns     = document.querySelectorAll('.diff-btn');

  let cells = [];

  function buildBoard() {
    board.innerHTML = '';
    cells = [];
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.idx = i;
      cell.addEventListener('click', () => Game.play(i));
      board.appendChild(cell);
      cells.push(cell);
    }
  }

  function onCellPlaced(idx, player) {
    const cell = cells[idx];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase(), 'taken');
    cell.classList.remove('placed');
    void cell.offsetWidth;
    cell.classList.add('placed');
    clearHeatmap();
  }

  function onWin(winner, combo) {
    combo.forEach((i, idx) => {
      setTimeout(() => {
        cells[i].classList.add('win-cell');
      }, idx * 120);
    });

    setTimeout(() => {
      updateScoreboard();
      const state = Game.getState();
      if (winner === 'X') {
        overlayEmoji.textContent = '🎉';
        overlayMsg.textContent = 'You Win!';
        overlayMsg.style.color = 'var(--accent-x)';
        overlayWL.textContent = `Winning line: cells ${combo.join(' → ')}`;
      } else {
        overlayEmoji.textContent = '🤖';
        overlayMsg.textContent = 'AI Wins!';
        overlayMsg.style.color = 'var(--accent-o)';
        overlayWL.textContent = `Winning line: cells ${combo.join(' → ')}`;
      }
      statusMsg.textContent = winner === 'X' ? '🎉 You win!' : '🤖 AI wins!';
      statusMsg.className = 'status-msg win';
      overlay.classList.remove('hidden');
    }, combo.length * 120 + 300);
  }

  function onDraw() {
    updateScoreboard();
    overlayEmoji.textContent = '🤝';
    overlayMsg.textContent = "It's a Draw!";
    overlayMsg.style.color = 'var(--accent-draw)';
    overlayWL.textContent = 'No one wins this round.';
    statusMsg.textContent = '🤝 Draw!';
    statusMsg.className = 'status-msg draw';
    setTimeout(() => overlay.classList.remove('hidden'), 400);
  }

  function onRestart() {
    overlay.classList.add('hidden');
    moveHistory.innerHTML = '<p class="dim">No moves yet.</p>';
    aiExplain.innerHTML = '<p class="dim">AI will explain its moves here…</p>';
    statusMsg.textContent = 'Your turn — place X';
    statusMsg.className = 'status-msg player-turn';
    buildBoard();
    undoBtn.disabled = false;
  }
  function onUndo(boardState, current) {
    overlay.classList.add('hidden');
    buildBoard();
    boardState.forEach((val, i) => {
      if (val) {
        cells[i].textContent = val;
        cells[i].classList.add(val.toLowerCase(), 'taken');
      }
    });
    const items = moveHistory.querySelectorAll('.history-item');
    const state = Game.getState();
    const keep = state.history.length;
    for (let i = items.length - 1; i >= keep; i--) {
      items[i].remove();
    }
    if (moveHistory.querySelectorAll('.history-item').length === 0) {
      moveHistory.innerHTML = '<p class="dim">No moves yet.</p>';
    }
    onTurnChange(current, state.mode);
    statusMsg.textContent = 'Move undone — your turn';
    statusMsg.className = 'status-msg player-turn';
  }

  function onAIThinking(active) {
    if (active) {
      thinkingInd.classList.remove('hidden');
      statusMsg.textContent = 'AI is thinking…';
      statusMsg.className = 'status-msg ai-turn';
      cells.forEach(c => c.classList.add('taken')); 
    } else {
      thinkingInd.classList.add('hidden');
      cells.forEach(c => {
        if (!c.classList.contains('x') && !c.classList.contains('o')) {
          c.classList.remove('taken');
        }
      });
    }
  }

  function onAIExplain(text) {
    aiExplain.innerHTML = `<div class="ai-reason"><span>🤖</span><span>${text}</span></div>`;
  }

  function onTurnChange(player, mode) {
    if (player === 'X') {
      statusMsg.textContent = mode === 'pvp' ? "Player X's turn" : 'Your turn — place X';
      statusMsg.className = 'status-msg player-turn';
    } else {
      statusMsg.textContent = mode === 'pvp' ? "Player O's turn" : 'AI thinking…';
      statusMsg.className = 'status-msg ai-turn';
    }
  }

  function onHeatmap(scores) {
    cells.forEach((cell, i) => {
      cell.classList.remove('heat-1','heat-2','heat-3');
      if (scores[i] !== null && !cell.classList.contains('taken')) {
        cell.classList.add(`heat-${scores[i]}`);
      }
    });
  }

  function clearHeatmap() {
    cells.forEach(c => c.classList.remove('heat-1','heat-2','heat-3'));
  }

  function addHistoryItem(player, row, col, num) {
    const dim = moveHistory.querySelector('.dim');
    if (dim) dim.remove();

    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <span class="marker ${player.toLowerCase()}">${player}</span>
      <span>→</span>
      <span class="pos">(row ${row}, col ${col})</span>
      <span style="margin-left:auto;color:var(--text-dim);font-size:0.6rem">#${num}</span>
    `;
    moveHistory.appendChild(item);
    moveHistory.scrollTop = moveHistory.scrollHeight;
  }

  function updateScoreboard() {
    const s = Game.getState().scores;
    scorePlayer.textContent = s.X;
    scoreAI.textContent = s.O;
    scoreDraws.textContent = s.D;
    [scorePlayer, scoreAI, scoreDraws].forEach(el => {
      el.style.transform = 'scale(1.4)';
      setTimeout(() => el.style.transition = 'transform 0.3s', 0);
      setTimeout(() => { el.style.transform = 'scale(1)'; }, 300);
    });
  }
  function initTheme() {
    const saved = localStorage.getItem('ttt-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    themeToggle.textContent = saved === 'dark' ? '🌙' : '☀️';
  }

  themeToggle.addEventListener('click', () => {
    const curr = document.documentElement.getAttribute('data-theme');
    const next = curr === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('ttt-theme', next);
  });
  modeToggle.addEventListener('click', () => {
    const state = Game.getState();
    const newMode = state.mode === 'pva' ? 'pvp' : 'pva';
    Game.setMode(newMode);
    modeToggle.textContent = newMode === 'pva' ? '🤖 vs AI' : '👥 PvP';
    modeToggle.classList.toggle('active', newMode === 'pvp');
    statusMsg.textContent = newMode === 'pva' ? 'Your turn — place X' : "Player X's turn";
  });
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Game.setDifficulty(btn.dataset.diff);
    });
  });

  restartBtn.addEventListener('click', () => Game.restart());
  document.getElementById('overlayRestart').addEventListener('click', () => Game.restart());
  undoBtn.addEventListener('click', () => Game.undo());

  function init() {
    initTheme();
    buildBoard();
    statusMsg.className = 'status-msg player-turn';
  }

  return {
    onCellPlaced,
    onWin,
    onDraw,
    onRestart,
    onUndo,
    onAIThinking,
    onAIExplain,
    onTurnChange,
    onHeatmap,
    addHistoryItem,
    init
  };

})();
UI.init();
