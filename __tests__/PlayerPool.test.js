import { render, screen } from '@testing-library/react';
import React from 'react';

// Example PlayerPool component for testing
function PlayerPool({ players }) {
  return (
    <ul>
      {players.map(player => (
        <li key={player}>{player}</li>
      ))}
    </ul>
  );
}

describe('PlayerPool', () => {
  it('renders all player names', () => {
    const players = ["Ja'Marr Chase", "Justin Jefferson", "Saquon Barkley"];
    render(<PlayerPool players={players} />);
    expect(screen.getByText("Ja'Marr Chase")).toBeInTheDocument();
    expect(screen.getByText("Justin Jefferson")).toBeInTheDocument();
    expect(screen.getByText("Saquon Barkley")).toBeInTheDocument();
  });
}); 