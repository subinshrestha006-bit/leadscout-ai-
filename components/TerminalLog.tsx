import React, { useEffect, useRef } from 'react';
import { AgentLog } from '../types';

interface TerminalLogProps {
  logs: AgentLog[];
}

export const TerminalLog: React.FC<TerminalLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-cyber-dark border border-cyber-gray rounded-lg p-4 h-48 overflow-y-auto font-mono text-xs md:text-sm shadow-inner shadow-black relative group">
      <div className="absolute top-2 right-2 text-cyber-gray group-hover:text-cyber-accent transition-colors">
        _SYS.LOG
      </div>
      <div className="flex flex-col space-y-2">
        {logs.length === 0 && (
          <span className="text-gray-500 italic">>> System initialized. Waiting for mission parameters...</span>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-3">
            <span className="text-gray-500 whitespace-nowrap">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'error' ? 'text-cyber-danger' : ''}
              ${log.type === 'success' ? 'text-cyber-green' : ''}
              ${log.type === 'action' ? 'text-cyber-accent' : ''}
              ${log.type === 'info' ? 'text-gray-300' : ''}
            `}>
              {log.type === 'action' && '> '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};