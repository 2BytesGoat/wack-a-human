import { useMemo, useState, useRef, useLayoutEffect, useEffect } from 'react'
import './App.css'
import Lobby from './Lobby';
import PromptScene from './PromptScene';


function App() {
  // Remove code, players, lobbyRef, excludeRect, addPlayer, handleStart from here
  // Only keep gameStarted, timeLeft, prompt, and new lobbyData state
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [prompt, setPrompt] = useState('');
  const [lobbyData, setLobbyData] = useState(null); // { code, players, excludeRect }
  const [answers, setAnswers] = useState([]); // array of player names who answered

  // Timer effect
  useEffect(() => {
    if (!gameStarted) return;
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStarted, timeLeft]);

  // Example prompts
  const prompts = [
    'Invent a new holiday and describe how it is celebrated.',
    'What would you do if you could be invisible for a day?',
    'Describe the worst possible superpower.',
    'If animals could talk, which would be the rudest?',
    'Come up with a new ice cream flavor.'
  ];

  const handleLobbyStart = (data) => {
    setLobbyData(data);
    setGameStarted(true);
    setTimeLeft(60);
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
  };

  return (
    <div className="jackbox-bg">
      {/* Remove PlayerNamesBackground here so bubbles disappear after start */}
      {!gameStarted ? (
        <Lobby onStart={handleLobbyStart} />
      ) : (
        <PromptScene 
          prompt={prompt} 
          timeLeft={timeLeft} 
          players={lobbyData?.players || []}
          answeredPlayers={answers}
          onSimulateAnswer={() => {
            const allPlayers = lobbyData?.players || [];
            const next = allPlayers.find(p => !answers.includes(p));
            if (next) setAnswers(a => [...a, next]);
          }}
        />
      )}
    </div>
  );
}

export default App
