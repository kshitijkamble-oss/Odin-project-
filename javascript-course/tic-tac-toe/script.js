// ── Player factory ────────────────────────────────────────────
const Player = (name, mark) => {
  let score = 0;
  const addWin = () => score++;
  const getScore = () => score;
  return { name, mark, addWin, getScore };
};

// ── Gameboard module ──────────────────────────────────────────
const Gameboard = (() => {
  let _board = Array(9).fill(null);

  const getBoard = () => [..._board];

  const placeMark = (index, mark) => {
    if (_board[index] !== null) return false;
    _board[index] = mark;
    return true;
  };

  const reset = () => {
    _board = Array(9).fill(null);
  };

  return { getBoard, placeMark, reset };
})();

// ── GameController module ─────────────────────────────────────
const GameController = (() => {
  const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],             // diagonals
  ];

  let _players = [];
  let _currentIdx = 0;
  let _active = false;

  const setPlayers = (name1, name2) => {
    _players = [
      Player(name1 || 'Player X', 'X'),
      Player(name2 || 'Player O', 'O'),
    ];
    _currentIdx = 0;
    _active = true;
  };

  const getPlayers = () => _players;
  const getCurrentPlayer = () => _players[_currentIdx];
  const isActive = () => _active;

  const playTurn = (index) => {
    if (!_active) return { status: 'inactive' };

    const player = getCurrentPlayer();
    const placed = Gameboard.placeMark(index, player.mark);
    if (!placed) return { status: 'invalid' };

    const board = Gameboard.getBoard();

    for (const combo of WIN_COMBOS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        _active = false;
        player.addWin();
        return { status: 'win', winner: player, combo };
      }
    }

    if (board.every(cell => cell !== null)) {
      _active = false;
      return { status: 'tie' };
    }

    _currentIdx = _currentIdx === 0 ? 1 : 0;
    return { status: 'continue', currentPlayer: getCurrentPlayer() };
  };

  const reset = () => {
    Gameboard.reset();
    _currentIdx = 0;
    _active = true;
  };

  return { setPlayers, getPlayers, getCurrentPlayer, isActive, playTurn, reset };
})();

// ── DisplayController module ──────────────────────────────────
const DisplayController = (() => {
  const $ = id => document.getElementById(id);

  const setupScreen   = $('setup-screen');
  const gameScreen    = $('game-screen');
  const board         = $('board');
  const turnName      = $('turn-name');
  const resultOverlay = $('result-overlay');
  const resultMessage = $('result-message');
  const resultIcon    = $('result-icon');
  const scoreLabelX   = $('score-label-x');
  const scoreLabelO   = $('score-label-o');
  const scoreValX     = $('score-val-x');
  const scoreValO     = $('score-val-o');

  // SVG for cells — path-drawn marks
  const makeXSvg = () => `
    <svg class="cell-svg" viewBox="0 0 60 60" aria-hidden="true">
      <line x1="14" y1="14" x2="46" y2="46" class="x-line-1"/>
      <line x1="46" y1="14" x2="14" y2="46" class="x-line-2"/>
    </svg>`;

  const makeOSvg = () => `
    <svg class="cell-svg" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="16" class="o-ring"/>
    </svg>`;

  // Static SVG for result card (no animation classes)
  const resultXSvg = () => `
    <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">
      <line x1="12" y1="12" x2="40" y2="40" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>
      <line x1="40" y1="12" x2="12" y2="40" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>
    </svg>`;

  const resultOSvg = () => `
    <svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">
      <circle cx="26" cy="26" r="14" fill="none" stroke="#2563EB" stroke-width="5"/>
    </svg>`;

  const _initBoard = () => {
    board.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i;
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      cell.setAttribute('tabindex', '0');
      cell.addEventListener('click', _handleCellClick);
      cell.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          _handleCellClick(e);
        }
      });
      board.appendChild(cell);
    }
  };

  const _renderBoard = () => {
    const state = Gameboard.getBoard();
    board.querySelectorAll('.cell').forEach((cell, i) => {
      if (state[i] === 'X' && !cell.classList.contains('taken')) {
        cell.classList.add('taken');
        cell.innerHTML = makeXSvg();
        cell.setAttribute('aria-label', `Cell ${i + 1}, X`);
        cell.setAttribute('tabindex', '-1');
      } else if (state[i] === 'O' && !cell.classList.contains('taken')) {
        cell.classList.add('taken');
        cell.innerHTML = makeOSvg();
        cell.setAttribute('aria-label', `Cell ${i + 1}, O`);
        cell.setAttribute('tabindex', '-1');
      }
    });
  };

  const _setTurnIndicator = (player) => {
    turnName.textContent = player.name;
    turnName.style.color = player.mark === 'X'
      ? 'var(--accent-x)'
      : 'var(--accent-o)';
  };

  const _highlightWin = (combo) => {
    board.querySelectorAll('.cell').forEach((cell, i) => {
      if (combo.includes(i)) cell.classList.add('win');
    });
  };

  const _syncScoreboard = () => {
    const [px, po] = GameController.getPlayers();
    scoreValX.textContent = px.getScore();
    scoreValO.textContent = po.getScore();
  };

  const _showResult = (status, winner) => {
    if (status === 'win') {
      resultIcon.innerHTML = winner.mark === 'X' ? resultXSvg() : resultOSvg();
      resultMessage.textContent = `${winner.name} wins.`;
    } else {
      resultIcon.innerHTML = `<span style="display:block;text-align:center;font-size:2.25rem;line-height:52px;color:var(--muted)">—</span>`;
      resultMessage.textContent = "It's a draw.";
    }
    _syncScoreboard();
    setTimeout(() => resultOverlay.classList.remove('hidden'), 550);
  };

  const _handleCellClick = (e) => {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const result = GameController.playTurn(index);

    if (result.status === 'invalid' || result.status === 'inactive') return;

    _renderBoard();

    if (result.status === 'win') {
      _highlightWin(result.combo);
      _showResult('win', result.winner);
    } else if (result.status === 'tie') {
      _showResult('tie', null);
    } else {
      _setTurnIndicator(result.currentPlayer);
    }
  };

  const _startGame = () => {
    const name1 = $('player1-name').value.trim();
    const name2 = $('player2-name').value.trim();
    GameController.setPlayers(name1, name2);

    const [px, po] = GameController.getPlayers();
    scoreLabelX.textContent = px.name;
    scoreLabelO.textContent = po.name;
    scoreValX.textContent = '0';
    scoreValO.textContent = '0';

    setupScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    _initBoard();
    _setTurnIndicator(GameController.getCurrentPlayer());
  };

  const _playAgain = () => {
    GameController.reset();
    resultOverlay.classList.add('hidden');
    _initBoard();
    _setTurnIndicator(GameController.getCurrentPlayer());
  };

  const _newGame = () => {
    resultOverlay.classList.add('hidden');
    gameScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
  };

  // ── Wire up buttons ─────────────────────────────────────────
  $('start-btn').addEventListener('click', _startGame);
  $('menu-btn').addEventListener('click', _newGame);
  $('play-again-btn').addEventListener('click', _playAgain);
  $('new-game-btn').addEventListener('click', _newGame);

  ['player1-name', 'player2-name'].forEach(id => {
    $(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') _startGame();
    });
  });

  return {};
})();
