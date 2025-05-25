import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Trophy, HelpCircle, Volume2, VolumeX, Sparkles } from 'lucide-react';

const BlinkTacToe = () => {
 
  const emojiCategories = {
    animals: { name: 'Animals', emojis: ['🐶', '🐱', '🐵', '🐰', '🦊', '🐻', '🐼', '🐨'] },
    food: { name: 'Food', emojis: ['🍕', '🍟', '🍔', '🍩', '🍪', '🎂', '🍦', '🍭'] },
    sports: { name: 'Sports', emojis: ['⚽', '🏀', '🏈', '🎾', '🏐', '🏓', '🎱', '🏸'] },
    nature: { name: 'Nature', emojis: ['🌟', '🌙', '☀️', '🌈', '⭐', '💫', '🌸', '🍀'] },
    vehicles: { name: 'Vehicles', emojis: ['🚗', '🚕', '🚙', '🚐', '🚛', '🏎️', '🚓', '🚑'] },
    faces: { name: 'Faces', emojis: ['😀', '😎', '🤩', '😍', '🥳', '😊', '🤗', '😂'] }
  };


  const [gameState, setGameState] = useState('setup'); 
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerCategories, setPlayerCategories] = useState({ 1: null, 2: null });
  const [playerEmojis, setPlayerEmojis] = useState({ 1: [], 2: [] });
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [showHelp, setShowHelp] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animatingCells, setAnimatingCells] = useState(new Set());


  const playSound = useCallback((frequency, duration = 100) => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
     
    }
  }, [soundEnabled]);

  
  const checkWinner = useCallback((board) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6] 
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[b] && board[c]) {
        if (board[a].player === board[b].player && board[b].player === board[c].player) {
          return { player: board[a].player, line };
        }
      }
    }
    return null;
  }, []);


  const getRandomEmoji = useCallback((player) => {
    const category = playerCategories[player];
    if (!category) return null;
    const emojis = emojiCategories[category].emojis;
    return emojis[Math.floor(Math.random() * emojis.length)];
  }, [playerCategories, emojiCategories]);

  
  const handleCellClick = useCallback((index) => {
    if (gameState !== 'playing' || board[index] || animatingCells.has(index)) return;

    const newBoard = [...board];
    const emoji = getRandomEmoji(currentPlayer);
    const newPlayerEmojis = { ...playerEmojis };

    
    newPlayerEmojis[currentPlayer] = [...newPlayerEmojis[currentPlayer], { emoji, position: index, id: Date.now() }];

    
    if (newPlayerEmojis[currentPlayer].length > 3) {
      const oldestEmoji = newPlayerEmojis[currentPlayer].shift();
      
      if (newBoard[oldestEmoji.position]?.player === currentPlayer) {
        newBoard[oldestEmoji.position] = null;
        setAnimatingCells(prev => new Set(prev).add(oldestEmoji.position));
        setTimeout(() => {
          setAnimatingCells(prev => {
            const newSet = new Set(prev);
            newSet.delete(oldestEmoji.position);
            return newSet;
          });
        }, 300);
      }
    }

    
    newBoard[index] = { emoji, player: currentPlayer };
    setAnimatingCells(prev => new Set(prev).add(index));
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }, 300);

    setBoard(newBoard);
    setPlayerEmojis(newPlayerEmojis);

  
    playSound(currentPlayer === 1 ? 440 : 330, 150);

    
    const winResult = checkWinner(newBoard);
    if (winResult) {
      setWinner(winResult.player);
      setWinningLine(winResult.line);
      setGameState('ended');
      setScores(prev => ({ ...prev, [winResult.player]: prev[winResult.player] + 1 }));
      playSound(880, 500); 
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  }, [gameState, board, currentPlayer, playerEmojis, getRandomEmoji, checkWinner, playSound, animatingCells]);

  
  const startNewGame = useCallback(() => {
    if (playerCategories[1] && playerCategories[2]) {
      setBoard(Array(9).fill(null));
      setCurrentPlayer(1);
      setPlayerEmojis({ 1: [], 2: [] });
      setWinner(null);
      setWinningLine([]);
      setGameState('playing');
      setAnimatingCells(new Set());
      playSound(220, 100);
    }
  }, [playerCategories, playSound]);

  
  const resetGame = useCallback(() => {
    setGameState('setup');
    setBoard(Array(9).fill(null));
    setCurrentPlayer(1);
    setPlayerCategories({ 1: null, 2: null });
    setPlayerEmojis({ 1: [], 2: [] });
    setWinner(null);
    setWinningLine([]);
    setScores({ 1: 0, 2: 0 });
    setAnimatingCells(new Set());
  }, []);

  
  const selectCategory = useCallback((player, category) => {
    if (playerCategories[player === 1 ? 2 : 1] === category) return; 
    setPlayerCategories(prev => ({ ...prev, [player]: category }));
    playSound(330, 100);
  }, [playerCategories, playSound]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
       
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-400" />
            Blink Tac Toe
            <Sparkles className="text-yellow-400" />
          </h1>
          <p className="text-purple-200 text-lg">The emoji-powered twist on classic Tic Tac Toe!</p>
        </div>

        
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <HelpCircle size={20} />
            Help
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            Sound {soundEnabled ? 'On' : 'Off'}
          </button>
          <button
            onClick={resetGame}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">How to Play Blink Tac Toe</h2>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-lg">Setup:</h3>
                  <p>Each player selects a different emoji category before starting.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Gameplay:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Players take turns placing random emojis from their category</li>
                    <li>Each player can have maximum 3 emojis on the board</li>
                    <li>When placing a 4th emoji, the oldest one vanishes (FIFO)</li>
                    <li>Win by getting 3 of your emojis in a row (horizontal, vertical, or diagonal)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Special Rules:</h3>
                  <p>The 4th emoji cannot be placed where the 1st emoji was located!</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

       
        <div className="flex justify-center mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-yellow-400 text-2xl mb-1">
                  <Trophy />
                </div>
                <div className="text-white font-semibold">Player 1</div>
                <div className="text-3xl font-bold text-blue-400">{scores[1]}</div>
              </div>
              <div className="text-white text-2xl">VS</div>
              <div className="text-center">
                <div className="text-yellow-400 text-2xl mb-1">
                  <Trophy />
                </div>
                <div className="text-white font-semibold">Player 2</div>
                <div className="text-3xl font-bold text-red-400">{scores[2]}</div>
              </div>
            </div>
          </div>
        </div>

        {gameState === 'setup' && (
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Emoji Categories</h2>
            
            {[1, 2].map(player => (
              <div key={player} className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Player {player} - Select Category:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(emojiCategories).map(([key, category]) => (
                    <button
                      key={key}
                      onClick={() => selectCategory(player, key)}
                      disabled={playerCategories[player === 1 ? 2 : 1] === key}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        playerCategories[player] === key
                          ? 'border-yellow-400 bg-yellow-400 bg-opacity-20'
                          : playerCategories[player === 1 ? 2 : 1] === key
                          ? 'border-gray-500 bg-gray-500 bg-opacity-20 cursor-not-allowed opacity-50'
                          : 'border-white border-opacity-30 hover:border-opacity-60 bg-white bg-opacity-5'
                      }`}
                    >
                      <div className="text-white font-semibold mb-2">{category.name}</div>
                      <div className="text-2xl">{category.emojis.slice(0, 4).join(' ')}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {playerCategories[1] && playerCategories[2] && (
              <div className="text-center">
                <button
                  onClick={startNewGame}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold mx-auto transition-colors"
                >
                  <Play size={24} />
                  Start Game!
                </button>
              </div>
            )}
          </div>
        )}

        {(gameState === 'playing' || gameState === 'ended') && (
          <>
            {gameState === 'playing' && (
              <div className="text-center mb-6">
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 inline-block">
                  <div className="text-white text-lg font-semibold">
                    Player {currentPlayer}'s Turn ({emojiCategories[playerCategories[currentPlayer]]?.name})
                  </div>
                  <div className="text-3xl mt-2">
                    {emojiCategories[playerCategories[currentPlayer]]?.emojis.slice(0, 4).join(' ')}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center mb-8">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                <div className="grid grid-cols-3 gap-2">
                  {board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => handleCellClick(index)}
                      disabled={gameState === 'ended'}
                      className={`w-20 h-20 md:w-24 md:h-24 rounded-lg border-2 text-3xl md:text-4xl font-bold transition-all duration-300 ${
                        winningLine.includes(index)
                          ? 'border-yellow-400 bg-yellow-400 bg-opacity-30 animate-pulse'
                          : animatingCells.has(index)
                          ? 'border-white bg-white bg-opacity-20 scale-110'
                          : cell
                          ? 'border-white bg-white bg-opacity-10'
                          : 'border-white border-opacity-30 hover:border-opacity-60 hover:bg-white hover:bg-opacity-5'
                      } ${gameState === 'playing' && !cell && !animatingCells.has(index) ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {cell?.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

           
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {[1, 2].map(player => (
                <div key={player} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Player {player} ({emojiCategories[playerCategories[player]]?.name})
                  </h3>
                  <div className="flex gap-2">
                    {Array.from({ length: 3 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl ${
                          playerEmojis[player][i]
                            ? 'border-white bg-white bg-opacity-10'
                            : 'border-white border-opacity-30'
                        }`}
                      >
                        {playerEmojis[player][i]?.emoji}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

           
            {gameState === 'ended' && (
              <div className="text-center">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 mb-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    🎉 Player {winner} Wins! 🎉
                  </h2>
                  <div className="text-6xl mb-4">
                    {emojiCategories[playerCategories[winner]]?.emojis.slice(0, 3).join('')}
                  </div>
                </div>
                <button
                  onClick={startNewGame}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-semibold mx-auto transition-colors"
                >
                  <Play size={24} />
                  Play Again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BlinkTacToe;