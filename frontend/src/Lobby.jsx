import React, { useMemo, useState, useRef, useLayoutEffect } from 'react';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRandomName() {
  const adjectives = [
    'Silly', 'Wacky', 'Sneaky', 'Brave', 'Funky', 'Zany', 'Goofy', 'Wild', 'Clever', 'Jolly',
    'Bouncy', 'Nimble', 'Quirky', 'Chill', 'Spooky', 'Dizzy', 'Lucky', 'Peppy', 'Rowdy', 'Snazzy'
  ];
  const animals = [
    'Penguin', 'Giraffe', 'Otter', 'Llama', 'Moose', 'Panda', 'Sloth', 'Tiger', 'Frog', 'Monkey',
    'Goose', 'Ferret', 'Koala', 'Yak', 'Bison', 'Corgi', 'Hawk', 'Mole', 'Shark', 'Toad'
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
}

function getRandomBubbleStyle(excludeRect, existingBubbles) {
  const width = 8.5; // rem
  const height = 3.7; // rem
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const widthPercent = (width * 16) / vw * 100;
  const heightPercent = (height * 16) / vh * 100;
  let x, y;
  let tries = 0;
  const margin = 8; // percent
  let left = excludeRect ? Math.max(0, excludeRect.left - margin) : 0;
  let right = excludeRect ? Math.min(100, excludeRect.right + margin) : 100;
  let top = excludeRect ? Math.max(0, excludeRect.top - margin) : 0;
  let bottom = excludeRect ? Math.min(100, excludeRect.bottom + margin) : 100;
  function overlapsAny(x, y) {
    return existingBubbles.some(b => {
      const bx = b.x;
      const by = b.y;
      return (
        x < bx + b.widthPercent &&
        x + widthPercent > bx &&
        y < by + b.heightPercent &&
        y + heightPercent > by
      );
    });
  }
  do {
    x = Math.random() * (100 - widthPercent);
    y = Math.random() * (100 - heightPercent);
    tries++;
    if (!excludeRect && !existingBubbles.length) break;
  } while (
    (excludeRect &&
      x + widthPercent > left &&
      x < right &&
      y + heightPercent > top &&
      y < bottom) ||
    overlapsAny(x, y) &&
    tries < 200
  );
  const colors = [
    '#fc575e', '#f7b42c', '#61dafb', '#a259f7', '#43e97b', '#fcb045', '#f857a6', '#30cfd0', '#fdc830', '#f37335'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)] + 'cc';
  const rotation = Math.random() * 20 - 10;
  return { x, y, width, height, color, rotation, widthPercent, heightPercent };
}

export function PlayerNamesBackground({ players, excludeRect }) {
  // Persist bubble styles for each player name
  const bubbleStylesRef = useRef({});
  const bubbles = [];
  players.forEach((name) => {
    if (!bubbleStylesRef.current[name]) {
      const style = getRandomBubbleStyle(excludeRect, bubbles);
      bubbleStylesRef.current[name] = style;
      bubbles.push(style);
    } else {
      bubbles.push(bubbleStylesRef.current[name]);
    }
  });
  return (
    <div className="player-names-bg">
      {players.map((name) => {
        const bubble = bubbleStylesRef.current[name];
        return (
          <div
            key={name}
            className="player-bubble"
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: `${bubble.width}rem`,
              height: `${bubble.height}rem`,
              background: bubble.color,
              transform: `rotate(${bubble.rotation}deg)`
            }}
          >
            <span className="bubble-name">{name}</span>
          </div>
        );
      })}
    </div>
  );
}

function Lobby({ onStart }) {
  const code = useMemo(() => generateCode(), []);
  const [players, setPlayers] = useState([]);
  const lobbyRef = useRef();
  const [excludeRect, setExcludeRect] = useState();

  useLayoutEffect(() => {
    function updateRect() {
      if (lobbyRef.current) {
        const rect = lobbyRef.current.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        setExcludeRect({
          left: (rect.left / vw) * 100,
          right: (rect.right / vw) * 100,
          top: (rect.top / vh) * 100,
          bottom: (rect.bottom / vh) * 100
        });
      }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  const addPlayer = () => {
    setPlayers(prev => [...prev, getRandomName()]);
  };

  const handleStart = () => {
    onStart({ code, players, excludeRect });
  };

  return (
    <>
      <PlayerNamesBackground players={players} excludeRect={excludeRect} />
      <div className="lobby-container" ref={lobbyRef}>
        <h1 className="game-title">Wack-a-Human</h1>
        <div className="code-box">
          <span className="code-label">Room Code</span>
          <span className="room-code">{code}</span>
        </div>
        <button className="add-player-btn" onClick={addPlayer}>Add Player</button>
        {players.length > 0 ? (
          <div className="players-joined-msg">{players.length} player{players.length > 1 ? 's' : ''} joined</div>
        ) : (
          <div className="waiting-msg">Waiting for players to join...</div>
        )}
        <button className="start-btn" onClick={handleStart}>Start</button>
      </div>
    </>
  );
}

export default Lobby; 