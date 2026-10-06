import React, { useState } from 'react';
import { ReplicationHudView } from '../components/ReplicationHudView';

export const ReplicationPage: React.FC = () => {
  const [isEngineActive, setIsEngineActive] = useState(true);
  const [latencyMs, setLatencyMs] = useState(0.12);

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <ReplicationHudView
        isEngineActive={isEngineActive}
        onToggleEngine={() => {
          setIsEngineActive((prev) => !prev);
          setLatencyMs((prev) => (prev === 0 ? 0.12 : 0));
        }}
        latencyMs={latencyMs}
      />
    </div>
  );
};
