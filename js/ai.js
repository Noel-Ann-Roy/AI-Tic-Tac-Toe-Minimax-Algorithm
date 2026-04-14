
const AI = (() => {
  function minimax(board, depth, isMaximizing, alpha, beta) {
    const winner = checkWinner(board);
    if (winner === 'O') return 10 - depth;
    if (winner === 'X') return depth - 10;
    if (board.every(c => c !== '')) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
          board[i] = 'O';
          best = Math.max(best, minimax(board, depth + 1, false, alpha, beta));
          board[i] = '';
          alpha = Math.max(alpha, best);
          if (beta <= alpha) break; 
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
          board[i] = 'X';
          best = Math.min(best, minimax(board, depth + 1, true, alpha, beta));
          board[i] = '';
          beta = Math.min(beta, best);
          if (beta <= alpha) break;
        }
      }
      return best;
    }
  }
  function bestMove(board) {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (board[i] === '') {
        board[i] = 'O';
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[i] = '';
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  function getHeatmap(board) {
    const scores = Array(9).fill(null);
    const empty = board.map((v, i) => v === '' ? i : null).filter(i => i !== null);
    if (empty.length === 0) return scores;

    let min = Infinity, max = -Infinity;
    for (const i of empty) {
      board[i] = 'O';
      const s = minimax(board, 0, false, -Infinity, Infinity);
      board[i] = '';
      scores[i] = s;
      if (s < min) min = s;
      if (s > max) max = s;
    }

    for (const i of empty) {
      const range = max - min || 1;
      const norm = (scores[i] - min) / range;
      if (norm < 0.25) scores[i] = 1;
      else if (norm < 0.6) scores[i] = 2;
      else scores[i] = 3;
    }

    return scores;
  }

  const COMBOS = [
    [0,1,2],[3,4,5],[6,7,8], 
    [0,3,6],[1,4,7],[2,5,8], 
    [0,4,8],[2,4,6]          
  ];

  function checkWinner(board) {
    for (const [a,b,c] of COMBOS) {
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    return null;
  }

  function getWinCombo(board) {
    for (const combo of COMBOS) {
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[b] === board[c]) return combo;
    }
    return null;
  }

  function randomMove(board) {
    const empty = board.map((v,i) => v==='' ? i : null).filter(i => i !== null);
    return empty[Math.floor(Math.random() * empty.length)];
  }

  function mediumMove(board) {
    return Math.random() < 0.6 ? bestMove(board) : randomMove(board);
  }

  function explainMove(boardBefore, moveIdx, difficulty) {
    if (difficulty === 'easy') {
      return `🎲 Easy mode: I just picked a random cell (${coords(moveIdx)}).`;
    }
    if (difficulty === 'medium') {
      const smart = Math.random() < 0.6;
      if (!smart) return `😅 Medium mode: I went random this time! (${coords(moveIdx)})`;
    }
    const b = [...boardBefore];

    b[moveIdx] = 'O';
    if (checkWinner(b)) {
      return `🏆 Winning move! I played ${coords(moveIdx)} to complete my line. You had no chance.`;
    }
    b[moveIdx] = '';

    b[moveIdx] = 'X';
    if (checkWinner(b)) {
      b[moveIdx] = '';
      return `🛡️ Block! I played ${coords(moveIdx)} to stop you from winning.`;
    }
    b[moveIdx] = '';

    if (moveIdx === 4) {
      return `⚡ Center control. Playing the center (${coords(moveIdx)}) gives me the most winning paths.`;
    }

    if ([0,2,6,8].includes(moveIdx)) {
      return `📐 Corner strategy at ${coords(moveIdx)}. Corners create fork opportunities to trap you.`;
    }

    let forkCount = 0;
    b[moveIdx] = 'O';
    for (const [a,bc,c] of COMBOS) {
      const cells = [a,bc,c];
      if (!cells.includes(moveIdx)) continue;
      const mine = cells.filter(i => b[i] === 'O').length;
      const empty2 = cells.filter(i => b[i] === '').length;
      if (mine === 2 && empty2 === 1) forkCount++;
    }
    b[moveIdx] = '';

    if (forkCount >= 2) {
      return `🔀 Fork! Playing ${coords(moveIdx)} creates two winning threats simultaneously. Impossible to block both!`;
    }

    return `🤖 Minimax optimal: ${coords(moveIdx)} gives me the best long-term position across all possible futures.`;
  }

  function coords(idx) {
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    return `(row ${r}, col ${c})`;
  }

  return {
    getMove(board, difficulty) {
      if (difficulty === 'easy') return randomMove(board);
      if (difficulty === 'medium') return mediumMove(board);
      return bestMove(board);
    },
    getHeatmap,
    checkWinner,
    getWinCombo,
    explainMove,
    COMBOS
  };

})();
