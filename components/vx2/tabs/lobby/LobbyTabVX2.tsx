import React from 'react';

export interface LobbyTabVX2Props {
  onJoinClick?: (tournamentId: string) => void;
}

export default function LobbyTabVX2({}: LobbyTabVX2Props): React.ReactElement {
  return (
    <div
      style={{
        flex: 1,
        backgroundImage: 'url(/dog1dog.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
