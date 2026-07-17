'use client';

import React, { useState, useEffect, useRef } from 'react';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = [
  { symbol: '♥', color: 'red' },
  { symbol: '♦', color: 'red' },
  { symbol: '♣', color: 'black' },
  { symbol: '♠', color: 'black' }
];

export default function GoFishGame() {
  const [deck, setDeck] = useState([]);
  const [playersHands, setPlayersHands] = useState([[], [], [], []]);
  const [playersSets, setPlayersSets] = useState([0, 0, 0, 0]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameLog, setGameLog] = useState('Game started! Your turn.');

  const logEndRef = useRef(null);

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameLog]);

  useEffect(() => {
    initGame();
  }, []);

  const addLog = (text) => {
    setGameLog((prev) => prev + '\n' + text);
  };

  const processBooks = (hand, isPlayer, logsArray) => {
    const counts = {};
    hand.forEach(c => counts[c.rank] = (counts[c.rank] || 0) + 1);
    let updatedHand = [...hand];
    let booksFound = 0;
    for (let rank in counts) {
      if (counts[rank] === 4) {
        updatedHand = updatedHand.filter(c => c.rank !== rank);
        booksFound++;
        if (isPlayer) {
          logsArray.push(`🎉 You completed the set of four for [${rank}]!`);
        } else {
          logsArray.push(`🤖 Player ${isPlayer ? '' : ''} completed the set of four for [${rank}].`);
        }
      }
    }
    return { updatedHand, booksFound };
  };

  const initGame = () => {
    let freshDeck = [];
    for (let rank of RANKS) {
      for (let suit of SUITS) {
        freshDeck.push({ rank, suit });
      }
    }
    freshDeck.sort(() => Math.random() - 0.5);
    const hands = [[], [], [], []];
    for (let i = 0; i < 7; i++) {
      for (let p = 0; p < 4; p++) {
        if (freshDeck.length > 0) {
          hands[p].push(freshDeck.pop());
        }
      }
    }
    const logs = ['Game initialized! Your turn.'];
    const newHands = [...hands];
    const newSets = [0, 0, 0, 0];

    for (let p = 0; p < 4; p++) {
      const result = processBooks(newHands[p], p === 0, logs);
      newHands[p] = result.updatedHand;
      newSets[p] += result.booksFound;
    }

    setDeck(freshDeck);
    setPlayersHands(newHands);
    setPlayersSets(newSets);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setGameLog(logs.join('\n'));
  };

  const isGameOver = (hands, deck) => {
    return deck.length === 0 || hands.some(h => h.length === 0);
  };

  const handlePlayerCardClick = (rank) => {
    if (gameOver || currentPlayerIndex !== 0) return;
    runPlayerTurn(0, rank);
  };

  const runPlayerTurn = async (playerId, chosenRank) => {
    if (gameOver) return;

    await delay(2500); 

    const nextPlayer = (playerId + 1) % 4;
    const hands = [...playersHands];
    const sets = [...playersSets];
    const logs = [`Player ${playerId + 1} asks for ${chosenRank}s.`];

    const targetPlayer = nextPlayer;
    const targetHand = [...hands[targetPlayer]];
    const playerHand = [...hands[playerId]];

    const matches = targetHand.filter(c => c.rank === chosenRank);

    if (matches.length > 0) {
      hands[targetPlayer] = targetHand.filter(c => c.rank !== chosenRank);
      hands[playerId] = [...playerHand, ...matches];
      logs.push(`Player ${targetPlayer + 1} gives you ${matches.length} card(s).`);

      const result = processBooks(hands[playerId], playerId === 0, logs);
      hands[playerId] = result.updatedHand;
      sets[playerId] += result.booksFound;

      setPlayersHands(hands);
      setPlayersSets(sets);
      setGameLog(logs.join('\n'));

      if (isGameOver(hands, deck)) {
        endGame();
        return;
      }
    } else {
      if (deck.length > 0) {
        const draw = deck.pop();
        hands[playerId] = [...playerHand, draw];
        logs.push(`No match. You drew a card.`);

        if (draw.rank === chosenRank) {
          logs.push(`You got your card! You get another turn.`);
          setPlayersHands(hands);
          setPlayersSets(sets);
          setGameLog(logs.join('\n'));
          if (isGameOver(hands, deck)) {
            endGame();
            return;
          }
        } else {
          setPlayersHands(hands);
          setPlayersSets(sets);
          setCurrentPlayerIndex(nextPlayer);
          setGameLog(logs.join('\n'));
        }
      } else {
        logs.push(`Deck is empty.`);
        setPlayersHands(hands);
        setPlayersSets(sets);
        setCurrentPlayerIndex(nextPlayer);
        setGameLog(logs.join('\n'));
      }
    }

    if (isGameOver(hands, deck)) {
      endGame();
      return;
    }

    if (currentPlayerIndex !== 0) {
      await delay(1500); // Delay before AI's turn
      runComputerPlayers();
    }
  };

  const endGame = () => {
    setGameOver(true);
    const scores = playersSets;
    const maxScore = Math.max(...scores);
    const winners = scores
      .map((score, idx) => ({ score, idx }))
      .filter(({ score }) => score === maxScore)
      .map(({ idx }) => `Player ${idx + 1}`)
      .join(', ');
    addLog(`Game Over! Winner: ${winners}`);
  };

  const runComputerPlayers = async () => {
    if (gameOver) return;
    const currentPlayer = currentPlayerIndex;
    if (currentPlayer === 0) return;

    const hand = [...playersHands[currentPlayer]];
    if (hand.length === 0) {
      setCurrentPlayerIndex((prev) => (prev + 1) % 4);
      return;
    }

    const randCard = hand[Math.floor(Math.random() * hand.length)];
    await delay(1500); // Delay before AI makes move
    runPlayerTurn(currentPlayer, randCard.rank);
  };

  useEffect(() => {
    if (currentPlayerIndex !== 0 && !gameOver) {
      (async () => {
        await delay(1500);
        await runComputerPlayers();
      })();
    }
  }, [currentPlayerIndex, gameOver]);

  const humanHand = [...playersHands[0]].sort(
    (a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank)
  );

  return (
    <div className="game-body">
      <style>{`
        .game-body {
          background-color: #0f172a;
          color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .game-container {
          width: 100%;
          max-width: 900px;
          background-color: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #334155;
          padding-bottom: 16px;
        }
        .back-link {
          color: #38bdf8;
          text-decoration: none;
          font-weight: bold;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
        }
        .info-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 24px 0;
          font-weight: 600;
        }
        .score-box {
          background-color: #020617;
          padding: 8px 16px;
          border-radius: 8px;
        }
        .score-value {
          font-size: 1.25rem;
          font-weight: bold;
        }
        .player-color { color: #10b981; }
        .comp-color { color: #06b6d4; }
        .turn-indicator {
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background-color: #451a03;
          color: #f59e0b;
          font-weight: bold;
        }
        .turn-indicator.over {
          background-color: #450a0a;
          color: #f87171;
        }
        .game-log {
          background-color: #020617;
          border-left: 4px solid #38bdf8;
          padding: 12px;
          height: 150px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 0.875rem;
          border-radius: 4px;
          margin-bottom: 24px;
          white-space: pre-line;
          line-height: 1.5;
        }
        .board {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .deck-area {
          display: flex;
          justify-content: center;
        }
        .card-deck {
          width: 75px;
          height: 105px;
          background: linear-gradient(135deg, #1e3a8a, #3b82f6);
          border: 2px solid #fff;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
          user-select: none;
        }
        .deck-icon { font-size: 1.5rem; }
        .deck-count { font-size: 0.75rem; font-weight: bold; margin-top: 4px; }
        .hand-section h3 {
          margin: 0 0 8px 0;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .hand {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          min-height: 110px;
          padding: 12px;
          background-color: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
        }
        .card-btn {
          width: 60px;
          height: 85px;
          background-color: #fff;
          border: none;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .card-btn:hover {
          transform: translateY(-8px);
          box-shadow: 0 10px 15px -3px rgba(56, 189, 248, 0.3);
        }
        .card-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .red { color: #dc2626; }
        .black { color: #0f172a; }
        .rank-lbl { font-size: 0.875rem; align-self: flex-start; }
        .suit-lbl { font-size: 1.25rem; align-self: flex-end; line-height: 1; }
        footer {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .winner-banner {
          font-size: 1.25rem;
          font-weight: 900;
          color: #fbbf24;
          letter-spacing: 0.05em;
        }
        .btn-reset {
          background-color: #2563eb;
          color: #fff;
          border: none;
          padding: 10px 24px;
          font-size: 1rem;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
        }
        .btn-reset:hover {
          background-color: #1d4ed8;
        }
      `}</style>

      <div className="game-container">
        <header>
          <h1>🎣 Go Fish Game</h1>
          <a href="#" className="back-link">Exit Game</a>
        </header>

        <div className="info-bar">
          {['Player 1', 'Player 2', 'Player 3', 'Player 4'].map((name, i) => (
            <div key={i} className="score-box">
              {name} Sets: <span className="score-value">{playersSets[i]}</span>
            </div>
          ))}
          <div className={`turn-indicator ${gameOver ? 'over' : ''}`}>
            {gameOver
              ? 'Game Over'
              : `Player ${currentPlayerIndex + 1}'s Turn`}
          </div>
        </div>

        <div className="game-log">
          {gameLog}
          <div ref={logEndRef} />
        </div>

        <div className="board">
          <div className="deck-area">
            <div className="card-deck">
              <span className="deck-icon">🎴</span>
              <span className="deck-count">{deck.length} left</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <h4>Player {idx + 2} Hand ({playersHands[idx + 1].length})</h4>
                <div style={{ display: 'flex' }}>
                  {playersHands[idx + 1].map((_, i) => (
                    <div key={i} className="card-back" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="hand-section" style={{ marginTop: '20px' }}>
            <h3>Your Hand ({playersHands[0].length})</h3>
            <div className="hand">
              {humanHand.map((card, idx) => (
                <button
                  key={idx}
                  className={`card-btn ${card.suit.color}`}
                  onClick={() => handlePlayerCardClick(card.rank)}
                  disabled={gameOver || currentPlayerIndex !== 0}
                >
                  <span className="rank-lbl">{card.rank}</span>
                  <span className="suit-lbl">{card.suit.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer>
          {gameOver && (
            <div className="winner-banner">
              {playersSets[0] > Math.max(...playersSets.slice(1))
                ? '🏆 You Win!'
                : playersSets[0] < Math.max(...playersSets.slice(1))
                ? '❌ You Lose!'
                : '🤝 It\'s a Tie!'}
            </div>
          )}
          <button className="btn-reset" onClick={initGame}>New Game</button>
        </footer>
      </div>
    </div>
  );
}