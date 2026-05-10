import { useState, useEffect } from 'react';

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS = [
  '🧠', '🎓', '💡', '📚',
  '🔬', '⚡', '🎯', '🏆',
  '🚀', '🎨', '🎭', '🎪',
  '🦁', '🐸', '🦅', '🦈',
  '☀️', '🌙', '⭐', '🌈',
  '🎵', '🎸', '🎹', '🎤',
  '🍕', '🍦', '🍰', '🍎',
  '🏖️', '🏔️', '🌲', '🏰'
];

interface MemoryGameProps {
  isLoading: boolean;
}

export default function MemoryGame({ isLoading }: MemoryGameProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Simulate loading progress
  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 20;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isLoading]);

  const initializeGame = () => {
    // Select random icons (8 pairs = 16 cards)
    const selectedIcons: string[] = [];
    const shuffled = [...ICONS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 8; i++) {
      selectedIcons.push(shuffled[i]);
      selectedIcons.push(shuffled[i]);
    }
    // Shuffle the pairs
    selectedIcons.sort(() => Math.random() - 0.5);

    const newCards: Card[] = selectedIcons.map((icon, idx) => ({
      id: idx,
      icon,
      isFlipped: false,
      isMatched: false,
    }));

    setCards(newCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameWon(false);
  };

  // Handle card click
  const handleCardClick = (id: number) => {
    if (isLoading && !gameWon) {
      // Game runs during loading
      if (flipped.includes(id) || matched.includes(id)) return;

      const newFlipped = [...flipped, id];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        const [first, second] = newFlipped;
        if (cards[first].icon === cards[second].icon) {
          // Match found!
          setMatched([...matched, first, second]);
          setFlipped([]);
        } else {
          // No match
          setMoves(moves + 1);
          setTimeout(() => setFlipped([]), 800);
        }
      }
    }
  };

  // Check if game is won
  useEffect(() => {
    if (matched.length === 16 && !gameWon) {
      setGameWon(true);
    }
  }, [matched, gameWon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '20px', padding: '40px' }}>
      {/* Progress Bar on Top */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Progress container */}
        <div style={{
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
        }}>
          {/* Progress fill */}
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #06b6d4 0%, #0ea5e9 100%)',
            borderRadius: '2px',
            width: `${loadingProgress}%`,
            transition: 'width 0.4s ease-out',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
          }} />
        </div>
        {/* Progress percentage */}
        <p style={{
          fontSize: '0.75rem',
          color: '#64748b',
          textAlign: 'right',
          fontWeight: '600',
        }}>
          {Math.round(loadingProgress)}%
        </p>
      </div>

      {/* Game Title */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ee3ab2', marginBottom: '8px' }}>
          Memory Rapide!
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#ff0080' }}>
          Trouvez les paires pendant le chargement...
        </p>
      </div>

      {/* Game Stats */}
      <div style={{
        display: 'flex',
        gap: '32px',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: '600',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Coups</p>
          <p style={{ color: '#06b6d4', fontSize: '1.5rem' }}>{moves}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#94a3b8', marginBottom: '4px' }}>Paires</p>
          <p style={{ color: '#4ade80', fontSize: '1.5rem' }}>{matched.length / 2}/8</p>
        </div>
        {gameWon && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fbbf24', marginBottom: '4px' }}>🎉</p>
            <p style={{ color: '#fbbf24', fontSize: '1.5rem' }}>Gagné!</p>
          </div>
        )}
      </div>

      {/* Game Grid 4x4 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        maxWidth: '400px',
        width: '100%',
      }}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={!isLoading || gameWon}
            style={{
              aspectRatio: '1',
              borderRadius: '12px',
              border: 'none',
              cursor: isLoading && !gameWon ? 'pointer' : 'default',
              background: matched.includes(card.id)
                ? 'rgba(34, 197, 94, 0.2)'
                : flipped.includes(card.id)
                ? 'rgba(30, 41, 59, 0.8)'
                : 'rgba(15, 23, 42, 0.8)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: matched.includes(card.id)
                ? 'rgba(34, 197, 94, 0.6)'
                : flipped.includes(card.id)
                ? 'rgba(6, 182, 212, 0.6)'
                : 'rgba(71, 85, 105, 0.5)',
              fontSize: flipped.includes(card.id) || matched.includes(card.id) ? '2rem' : '0',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow:
                matched.includes(card.id)
                  ? '0 0 12px rgba(34, 197, 94, 0.4)'
                  : flipped.includes(card.id)
                  ? '0 0 12px rgba(6, 182, 212, 0.4)'
                  : 'none',
              opacity: isLoading || gameWon ? 1 : 0.6,
            }}
          >
            {flipped.includes(card.id) || matched.includes(card.id) ? card.icon : '?'}
          </button>
        ))}
      </div>

      {/* Status */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#94a3b8',
        fontWeight: '500',
        letterSpacing: '0.3px',
      }}>
        {gameWon ? ' Génération en cours ' : 'Génération des questions QCM en cours...'}
      </p>
    </div>
  );
}
