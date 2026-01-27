import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { puzzlesApi, attemptsApi, Puzzle } from '@services/api';
import { useAuth } from '@contexts/AuthContext';

type PuzzleMode = 'random' | 'daily' | 'specific' | 'theme' | 'opening';

export function PuzzleSolvePage() {
  const { id, theme, opening } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine puzzle mode
  const mode: PuzzleMode = location.pathname.includes('/daily')
    ? 'daily'
    : location.pathname.includes('/theme')
    ? 'theme'
    : location.pathname.includes('/opening')
    ? 'opening'
    : location.pathname.includes('/random')
    ? 'random'
    : 'specific';

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [game, setGame] = useState(new Chess());
  const [currentPosition, setCurrentPosition] = useState('start');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'playing' | 'completed'>('playing');
  const [hasFailed, setHasFailed] = useState(false);
  const [usedHint, setUsedHint] = useState(false);
  const [wrongMoveMessage, setWrongMoveMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [autoPlayingOpponent, setAutoPlayingOpponent] = useState(false);

  // UI state for move highlighting and selection
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [showingSolution, setShowingSolution] = useState(false);
  const [solutionMovesSan, setSolutionMovesSan] = useState<string[]>([]);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');

  // Timer
  useEffect(() => {
    if (status === 'completed') {
      return; // Don't run timer if puzzle is completed
    }

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, status]);

  // Fetch puzzle
  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Reset all state when loading a new puzzle
        setStatus('playing');
        setHasFailed(false);
        setUsedHint(false);
        setWrongMoveMessage(null);
        setSelectedSquare(null);
        setLastMove(null);
        setLegalMoves([]);
        setShowingSolution(false);
        setMoveHistory([]);
        setCurrentMoveIndex(0);
        setStartTime(Date.now());
        setElapsedTime(0);

        let puzzleData: Puzzle;
        if (mode === 'daily') {
          puzzleData = await puzzlesApi.getDaily();
        } else if (mode === 'random') {
          puzzleData = await puzzlesApi.getRandom();
        } else if (mode === 'theme' && theme) {
          puzzleData = await puzzlesApi.getRandom({ themes: [theme] });
        } else if (mode === 'opening' && opening) {
          // TODO: Add opening filter to API once backend supports it
          puzzleData = await puzzlesApi.getRandom();
        } else if (id) {
          puzzleData = await puzzlesApi.getById(id);
        } else {
          throw new Error('Invalid puzzle mode');
        }

        // Validate puzzle data
        if (!puzzleData) {
          throw new Error('No puzzle found');
        }
        if (!puzzleData.moves || !puzzleData.fen) {
          throw new Error(`Puzzle ${puzzleData.lichessPuzzleId || 'unknown'} has incomplete data`);
        }

        setPuzzle(puzzleData);

        // Initialize game with puzzle position
        const newGame = new Chess(puzzleData.fen);
        setGame(newGame);
        setCurrentPosition(puzzleData.fen);

        // Parse solution moves
        const moves = puzzleData.moves.split(' ');
        setSolutionMoves(moves);

        // Convert solution to SAN notation for display
        const tempGame = new Chess(puzzleData.fen);
        const sanMoves: string[] = [];
        moves.forEach((moveStr, idx) => {
          try {
            const move = tempGame.move({
              from: moveStr.substring(0, 2) as Square,
              to: moveStr.substring(2, 4) as Square,
              promotion: moveStr[4] as 'q' | 'r' | 'b' | 'n' | undefined,
            });
            if (move) {
              sanMoves.push(move.san);
            }
          } catch (err) {
            console.error(`[Puzzle ${puzzleData.lichessPuzzleId}] Invalid move ${idx + 1}/${moves.length}:`, moveStr);
            console.error('Current position FEN:', tempGame.fen());
            console.error('Full solution:', puzzleData.moves);
            // Use the UCI notation as fallback
            sanMoves.push(moveStr);
          }
        });
        setSolutionMovesSan(sanMoves);

        // In Lichess puzzles, moves[0] is ALWAYS the opponent's setup move
        // The player always responds at moves[1]
        // Auto-play the first move to set up the puzzle position
        if (moves.length > 0) {
          const firstMove = moves[0];
          const from = firstMove.substring(0, 2) as Square;
          const to = firstMove.substring(2, 4) as Square;

          try {
            newGame.move({
              from,
              to,
              promotion: firstMove[4] as 'q' | 'r' | 'b' | 'n' | undefined,
            });
            setCurrentPosition(newGame.fen());
            setLastMove({ from, to });

            // After opponent's move, it's now the player's turn
            // Determine player color and set board orientation
            const playerColor = newGame.turn();
            setBoardOrientation(playerColor === 'w' ? 'white' : 'black');

            // Player should make move at index 1 (responding to opponent's setup)
            setCurrentMoveIndex(1);
          } catch (err) {
            console.error(`[Puzzle ${puzzleData.lichessPuzzleId}] Invalid first move:`, firstMove);
            console.error('Starting position FEN:', puzzleData.fen);
            throw new Error(`Puzzle ${puzzleData.lichessPuzzleId} has invalid move data. Please try another puzzle.`);
          }
        } else {
          // No moves in solution - shouldn't happen but handle gracefully
          setBoardOrientation(newGame.turn() === 'w' ? 'white' : 'black');
          setCurrentMoveIndex(0);
        }
      } catch (err) {
        console.error('Failed to fetch puzzle:', err);
        const errorMessage = err instanceof Error ? err.message :
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load puzzle';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPuzzle();
  }, [mode, id, theme, opening, puzzleKey]);

  const handleSquareClick = (square: Square) => {
    if (status !== 'playing' || autoPlayingOpponent) return;

    const gameCopy = new Chess(game.fen());

    // If a piece is already selected, try to move to this square
    if (selectedSquare) {
      makeMove(selectedSquare, square);
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Check if there's a piece on this square
    const piece = gameCopy.get(square);
    if (!piece) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Check if it's the right color's turn
    if (piece.color !== gameCopy.turn()) {
      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    // Select the piece and show legal moves
    setSelectedSquare(square);
    const moves = gameCopy.moves({ square, verbose: true });
    const targetSquares = moves.map(move => move.to as Square);
    setLegalMoves(targetSquares);
  };

  const makeMove = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (status !== 'playing' || autoPlayingOpponent) return false;

    const gameCopy = new Chess(game.fen());

    try {
      // Try to make the move
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity
      });

      if (!move) return false;

      const moveString = sourceSquare + targetSquare + (move.promotion || '');
      const expectedMove = solutionMoves[currentMoveIndex];

      // Check if move matches solution
      if (moveString === expectedMove ||
          (move.from + move.to === expectedMove) ||
          (move.from + move.to + (move.promotion || '') === expectedMove)) {
        // Correct move!
        setGame(gameCopy);
        setCurrentPosition(gameCopy.fen());
        setMoveHistory([...moveHistory, move.san]);
        setLastMove({ from: move.from as Square, to: move.to as Square });

        const newMoveIndex = currentMoveIndex + 1;
        setCurrentMoveIndex(newMoveIndex);
        setSelectedSquare(null);
        setLegalMoves([]);

        // Check if puzzle is complete (either all moves done OR game is over)
        if (newMoveIndex >= solutionMoves.length || gameCopy.isGameOver()) {
          setStatus('completed');
          // Puzzle completed - solved if no mistakes were made
          submitAttempt(!hasFailed);
        } else {
          // Block further moves while opponent is moving
          setAutoPlayingOpponent(true);
          // Make opponent's next move after a delay
          setTimeout(() => {
            makeOpponentMove(gameCopy, newMoveIndex);
          }, 500);
        }

        return true;
      } else {
        // Wrong move - show feedback but allow retry
        setHasFailed(true);
        setWrongMoveMessage('Wrong move! Try again.');
        setSelectedSquare(null);
        setLegalMoves([]);

        // Clear the wrong move message after 2 seconds
        setTimeout(() => {
          setWrongMoveMessage(null);
        }, 2000);

        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const makeOpponentMove = (currentGame: Chess, moveIndex: number) => {
    if (moveIndex >= solutionMoves.length) return;

    setAutoPlayingOpponent(true);
    const opponentMoveString = solutionMoves[moveIndex];
    const from = opponentMoveString.substring(0, 2) as Square;
    const to = opponentMoveString.substring(2, 4) as Square;

    try {
      const move = currentGame.move({
        from,
        to,
        promotion: opponentMoveString[4] as 'q' | 'r' | 'b' | 'n' | undefined,
      });

      if (move) {
        setGame(new Chess(currentGame.fen()));
        setCurrentPosition(currentGame.fen());
        setMoveHistory(prev => [...prev, move.san]);
        setLastMove({ from: move.from as Square, to: move.to as Square });

        const newMoveIndex = moveIndex + 1;
        setCurrentMoveIndex(newMoveIndex);

        // Check if puzzle is complete after opponent's move (either all moves done OR game is over)
        if (newMoveIndex >= solutionMoves.length || currentGame.isGameOver()) {
          setStatus('completed');
          submitAttempt(!hasFailed);
        }
      } else {
        // Move failed - this means the solution has invalid data
        // Complete the puzzle anyway since the player did their part
        console.warn(`[Puzzle ${puzzle?.lichessPuzzleId}] Invalid opponent move at index ${moveIndex}:`, opponentMoveString);
        setStatus('completed');
        submitAttempt(!hasFailed);
      }
    } catch (error) {
      // Move threw an error - complete the puzzle anyway
      console.error(`[Puzzle ${puzzle?.lichessPuzzleId}] Error making opponent move:`, error);
      setStatus('completed');
      submitAttempt(!hasFailed);
    }

    setAutoPlayingOpponent(false);
  };

  const submitAttempt = async (solved: boolean) => {
    if (!puzzle) return;

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // For guests, save to localStorage
      if (user.isGuest) {
        const guestAttempts = JSON.parse(localStorage.getItem('guestAttempts') || '[]');
        guestAttempts.push({
          puzzleId: puzzle.id,
          solved,
          timeSpent: elapsedTime,
          movesMade: moveHistory.join(' '),
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('guestAttempts', JSON.stringify(guestAttempts));
      } else {
        // For authenticated users, save to backend
        await attemptsApi.submit(
          puzzle.id,
          solved,
          elapsedTime,
          moveHistory.join(' ')
        );
      }
    } catch (err) {
      console.error('Failed to submit attempt:', err);
    }
  };

  const handleGiveUp = async () => {
    setStatus('completed');
    setHasFailed(true);
    await submitAttempt(false);
  };

  const handleShowSolution = () => {
    setShowingSolution(!showingSolution);
    if (!showingSolution) {
      setUsedHint(true);
    }
  };

  const handleNextPuzzle = () => {
    if (mode === 'random' || mode === 'theme' || mode === 'opening') {
      setPuzzleKey(prev => prev + 1); // Force new puzzle fetch
    } else {
      navigate('/puzzles');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate custom square styles for highlighting
  const getCustomSquareStyles = () => {
    const styles: { [square: string]: React.CSSProperties } = {};

    // Highlight last move
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
    }

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = { backgroundColor: 'rgba(255, 255, 0, 0.6)' };
    }

    // Highlight legal moves
    legalMoves.forEach(square => {
      styles[square] = {
        background: 'radial-gradient(circle, rgba(0, 0, 0, 0.2) 25%, transparent 25%)',
        borderRadius: '50%',
      };
    });

    return styles;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading puzzle...</p>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Puzzle</h2>
          <p className="text-red-600">{error || 'Puzzle not found'}</p>
        </div>
        <div className="flex gap-3">
          {(mode === 'random' || mode === 'theme' || mode === 'opening') && (
            <button onClick={() => setPuzzleKey(prev => prev + 1)} className="btn-primary">
              Try Another Puzzle
            </button>
          )}
          <button onClick={() => navigate('/puzzles')} className="btn-secondary">
            Back to Puzzles
          </button>
        </div>
      </div>
    );
  }

  const turnColor = game.turn() === 'w' ? 'White' : 'Black';

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1>
          {mode === 'daily' && 'Daily Puzzle'}
          {mode === 'random' && 'Random Puzzle'}
          {mode === 'theme' && `Theme: ${theme?.replace(/_/g, ' ')}`}
          {mode === 'opening' && `Opening: ${opening?.replace(/_/g, ' ')}`}
          {mode === 'specific' && `Puzzle ${puzzle.lichessPuzzleId}`}
        </h1>
        {status === 'completed' && !hasFailed && !usedHint && (
          <span className="text-green-600 font-semibold text-xl">✓ Solved!</span>
        )}
        {status === 'completed' && !hasFailed && usedHint && (
          <span className="text-blue-600 font-semibold text-xl">✓ Completed (with hint)</span>
        )}
        {status === 'completed' && hasFailed && (
          <span className="text-orange-600 font-semibold text-xl">✓ Completed (with mistakes)</span>
        )}
      </div>

      {user?.isGuest && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">Guest Mode - Progress Not Saved</h3>
              <p className="text-sm text-yellow-700">
                Your progress is stored locally and will be lost when you clear your browser data.{' '}
                <Link to="/login" className="underline font-medium hover:text-yellow-900">
                  Log in with Lichess or Google
                </Link>{' '}
                to save your progress permanently.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            {/* Turn indicator */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Turn:</span>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${
                  game.turn() === 'w'
                    ? 'bg-gray-100 text-gray-800 border border-gray-300'
                    : 'bg-gray-800 text-white'
                }`}>
                  {turnColor} to move
                </span>
              </div>
              {selectedSquare && (
                <span className="text-sm text-blue-600">
                  Selected: {selectedSquare.toUpperCase()}
                </span>
              )}
            </div>

            <div className="mb-4 relative">
              <Chessboard
                position={currentPosition}
                boardOrientation={boardOrientation}
                onPieceDrop={(sourceSquare, targetSquare) =>
                  status === 'playing' ? makeMove(sourceSquare as Square, targetSquare as Square) : false
                }
                onSquareClick={(square) => status === 'playing' && handleSquareClick(square as Square)}
                boardWidth={Math.min(600, window.innerWidth - 100)}
                customSquareStyles={getCustomSquareStyles()}
                arePiecesDraggable={status === 'playing'}
                customBoardStyle={{
                  borderRadius: '4px',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  opacity: status === 'completed' ? 0.7 : 1,
                }}
              />
              {status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`${
                    hasFailed ? 'bg-orange-500' : usedHint ? 'bg-blue-500' : 'bg-green-500'
                  } text-white px-8 py-4 rounded-lg shadow-2xl text-center`}>
                    <div className="text-4xl mb-2">
                      {hasFailed ? '✓' : usedHint ? '💡' : '🎉'}
                    </div>
                    <div className="text-2xl font-bold">
                      {hasFailed ? 'Puzzle Completed' : usedHint ? 'Completed!' : 'Perfect Solve!'}
                    </div>
                    <div className="text-sm mt-1 opacity-90">
                      {hasFailed ? 'With mistakes' : usedHint ? 'With hint' : 'No mistakes'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3 text-xs text-gray-500 flex gap-4">
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-yellow-200 border border-yellow-400"></span>
                Last move
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-yellow-300 border border-yellow-400"></span>
                Selected
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-4 h-4 bg-gray-300 rounded-full"></span>
                Legal moves
              </span>
            </div>

            {status === 'playing' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleShowSolution}
                    className="btn-secondary flex-1"
                  >
                    {showingSolution ? 'Hide Solution' : 'Show Solution'}
                  </button>
                  <button
                    onClick={handleGiveUp}
                    className="btn-secondary flex-1"
                  >
                    Give Up
                  </button>
                </div>
                {hasFailed && !showingSolution && (
                  <p className="text-sm text-orange-600 text-center">
                    Mistakes made - keep trying!
                  </p>
                )}
              </div>
            )}

            {status === 'completed' && (
              <div className="flex gap-3">
                <button
                  onClick={handleNextPuzzle}
                  className="btn-primary flex-1"
                >
                  {(mode === 'random' || mode === 'theme' || mode === 'opening') ? 'Next Puzzle' : 'Back to Puzzles'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4">Puzzle Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded text-xs ${
                  status === 'completed'
                    ? hasFailed
                      ? 'bg-orange-100 text-orange-800'
                      : usedHint
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {status === 'completed'
                    ? hasFailed
                      ? 'COMPLETED (MISTAKES)'
                      : usedHint
                      ? 'COMPLETED (HINT)'
                      : 'SOLVED PERFECTLY'
                    : 'IN PROGRESS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating:</span>
                <span className="font-medium">{puzzle.rating}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Themes:</span>
                <span className="font-medium">
                  {puzzle.themes.slice(0, 3).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time:</span>
                <span className="font-medium">{formatTime(elapsedTime)}</span>
              </div>
              {puzzle.openingTags && puzzle.openingTags.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Opening:</span>
                  <span className="font-medium text-xs">
                    {puzzle.openingTags[0].replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {puzzle.gameUrl && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <a
                    href={puzzle.gameUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <span>View on Lichess</span>
                    <span className="text-xs">↗</span>
                  </a>
                </div>
              )}
              {status === 'completed' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Moves Made:</span>
                    <span className="font-medium">{moveHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Solution Moves:</span>
                    <span className="font-medium">{solutionMovesSan.length}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4">Move History</h3>
            {moveHistory.length === 0 ? (
              <p className="text-sm text-gray-500">Your moves will appear here</p>
            ) : (
              <div className="text-sm space-y-1">
                {moveHistory.map((move, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-gray-500 w-8">
                      {Math.floor(idx / 2) + 1}.
                      {idx % 2 === 1 && '..'}
                    </span>
                    <span className="font-medium">{move}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {showingSolution && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-blue-800 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Solution</span>
              </h3>
              <div className="text-sm space-y-1">
                {solutionMovesSan.map((move, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-blue-600 w-8">
                      {Math.floor(idx / 2) + 1}.
                      {idx % 2 === 1 && '..'}
                    </span>
                    <span className={`font-medium ${
                      idx < currentMoveIndex
                        ? 'text-green-600 line-through'
                        : idx === currentMoveIndex
                        ? 'text-blue-800 font-bold'
                        : 'text-blue-700'
                    }`}>
                      {move}
                      {idx === currentMoveIndex && ' ← Next move'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Completed moves are crossed out. Try to follow the remaining moves!
              </p>
            </div>
          )}

          {status === 'completed' && !hasFailed && !usedHint && (
            <div className="card bg-green-50 border-green-200">
              <h3 className="text-green-800 mb-2">Perfect! 🎉</h3>
              <p className="text-sm text-green-700">
                Solved without mistakes!
              </p>
              <p className="text-sm text-green-700">
                Time: {formatTime(elapsedTime)}
              </p>
            </div>
          )}

          {status === 'completed' && !hasFailed && usedHint && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="text-blue-800 mb-2">Good job! 💡</h3>
              <p className="text-sm text-blue-700">
                You completed the puzzle with a hint.
              </p>
              <p className="text-sm text-blue-700">
                Time: {formatTime(elapsedTime)}
              </p>
            </div>
          )}

          {status === 'completed' && hasFailed && (
            <div className="card bg-orange-50 border-orange-200">
              <h3 className="text-orange-800 mb-2">Completed!</h3>
              <p className="text-sm text-orange-700">
                You made some mistakes but finished the puzzle.
              </p>
              <p className="text-sm text-orange-700">
                Time: {formatTime(elapsedTime)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast notification for wrong moves */}
      {wrongMoveMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <span className="text-xl">❌</span>
            <span className="font-medium">{wrongMoveMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
