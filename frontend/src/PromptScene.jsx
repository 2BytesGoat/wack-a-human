import React, { useEffect, useState } from 'react';

function PromptScene({ prompt, timeLeft, players, answeredPlayers, onSimulateAnswer }) {
  const [shrunk, setShrunk] = useState(false);
  const [round, setRound] = useState(1);
  
  useEffect(() => {
    const timer = setTimeout(() => setShrunk(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const notAnswered = players.filter(p => !answeredPlayers.includes(p));

  return (
    <div className={`prompt-scene${shrunk ? ' shrunk' : ' large'}`}>
      <h2 className="prompt-title">Round {round}</h2>
      <div className={`prompt-box${shrunk ? ' shrunk' : ' large'}`}>{prompt}</div>
      {/* Answered/Not Answered lists */}
      {shrunk && (
        <div style={{ margin: '1rem 0', fontSize: '1.1rem', color: '#333', fontWeight: 500, textAlign: 'center' }}>
          <div style={{ marginBottom: '0.5rem', color: '#43e97b', fontWeight: 700 }}>
            {answeredPlayers.length > 0 ? answeredPlayers.join(', ') : <span style={{color:'#bbb'}}>None yet</span>}
          </div>
          <div style={{ color: '#fc575e', fontWeight: 700 }}>
            {notAnswered.length > 0 ? notAnswered.join(', ') : <span style={{color:'#bbb'}}>All answered!</span>}
          </div>
        </div>
      )}
      {/* Simulate answer button for demo */}
      {shrunk && (
        <button onClick={onSimulateAnswer} style={{ marginBottom: '1rem' }}>Simulate Answer</button>
      )}
      {shrunk && <div className="timer">Time left: {timeLeft}s</div>}
    </div>
  );
}

export default PromptScene; 