import React, { useState, useCallback } from 'react';
import { Icons } from './constants';
import { TerminalLog } from './components/TerminalLog';
import { LeadTable } from './components/LeadTable';
import { AgentStatus, Lead, AgentLog, SearchParams } from './types';
import { scoutLocationsAndLeads, structureLeadData } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [params, setParams] = useState<SearchParams>({
    niche: 'High-end Restaurants',
    serviceOffering: 'AI Voice Reservation Agent'
  });

  const addLog = useCallback((message: string, type: AgentLog['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);

  const handleStartMission = async () => {
    if (!process.env.API_KEY) {
      addLog("API Key missing. Cannot start mission.", "error");
      return;
    }

    setStatus(AgentStatus.PLANNING);
    setLeads([]);
    setLogs([]);
    addLog(`Mission initiated: Find clients for "${params.serviceOffering}" in niche "${params.niche}"`, "action");

    try {
      // Step 1: Scout
      setStatus(AgentStatus.SCOUTING);
      const rawReport = await scoutLocationsAndLeads(params.niche, params.serviceOffering, (msg) => addLog(msg, 'info'));
      
      // Step 2: Analyze & Structure
      setStatus(AgentStatus.ANALYZING);
      addLog("Raw intelligence acquired. Analyzing patterns, drafting emails & generating strategy...", "action");
      const structuredLeads = await structureLeadData(rawReport, params.serviceOffering, (msg) => addLog(msg, 'info'));
      
      setLeads(structuredLeads);
      setStatus(AgentStatus.COMPLETE);
      addLog(`Mission Complete. ${structuredLeads.length} high-potential leads identified & prepped.`, "success");

    } catch (error) {
      setStatus(AgentStatus.ERROR);
      addLog(error instanceof Error ? error.message : "Unknown error occurred", "error");
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    // Updated headers to include Email Draft, Follow-up Email, and Strategy Tips
    const headers = ["Name", "Type", "Location", "Website", "Contact", "Score", "Reasoning", "Email Draft", "Follow-Up Email", "Strategy Tips"];
    const csvContent = [
      headers.join(","),
      ...leads.map(l => {
        // Escape quotes for CSV format
        const escape = (text: string) => `"${(text || '').replace(/"/g, '""')}"`;
        return [
          escape(l.name),
          escape(l.type),
          escape(l.location),
          escape(l.website),
          escape(l.contactInfo),
          l.potentialScore,
          escape(l.reasoning),
          escape(l.emailDraft),
          escape(l.followUpEmail),
          escape(l.outreachTips)
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_outreach_kit_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Lead data (including outreach kits) exported to CSV.", "success");
  };

  return (
    <div className="min-h-screen bg-cyber-black text-white p-4 md:p-8 font-sans selection:bg-cyber-accent selection:text-black">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-cyber-gray pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tighter flex items-center gap-3">
            <span className="text-cyber-accent"><Icons.Terminal /></span>
            LEADSCOUT<span className="text-cyber-purple">.AI</span>
          </h1>
          <p className="text-gray-400 mt-2 max-w-xl text-sm">
            Autonomous agent leveraging <span className="text-cyber-accent">Gemini 2.5</span> + <span className="text-cyber-green">Google Maps</span> to identify high-value B2B targets globally.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-cyber-dark border border-cyber-gray px-3 py-1 rounded text-xs text-gray-400 font-mono">
             v3.1-FOLLOWUP
          </div>
          {status === AgentStatus.SCOUTING || status === AgentStatus.ANALYZING ? (
             <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-accent/10 border border-cyber-accent text-cyber-accent text-xs font-bold animate-pulse">
               <span className="w-2 h-2 rounded-full bg-cyber-accent"></span>
               AGENT ACTIVE
             </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-cyber-gray/50 border border-cyber-gray text-gray-500 text-xs font-bold">
               <span className="w-2 h-2 rounded-full bg-gray-500"></span>
               STANDBY
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Controls & Terminal */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Controls */}
          <div className="bg-cyber-dark p-6 rounded-xl border border-cyber-gray shadow-lg">
            <h2 className="text-sm uppercase tracking-widest text-cyber-accent font-bold mb-4 flex items-center gap-2">
              <Icons.CPU /> Mission Parameters
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">TARGET NICHE</label>
                <input 
                  type="text" 
                  value={params.niche}
                  onChange={(e) => setParams({...params, niche: e.target.value})}
                  className="w-full bg-cyber-black border border-cyber-gray rounded p-3 text-sm text-white focus:border-cyber-accent focus:outline-none transition-colors"
                  placeholder="e.g. Sushi Restaurants, Boutique Hotels"
                />
              </div>
              
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">YOUR SERVICE</label>
                <input 
                  type="text" 
                  value={params.serviceOffering}
                  onChange={(e) => setParams({...params, serviceOffering: e.target.value})}
                  className="w-full bg-cyber-black border border-cyber-gray rounded p-3 text-sm text-white focus:border-cyber-accent focus:outline-none transition-colors"
                  placeholder="e.g. Chatbot, Website Redesign"
                />
              </div>

              <button
                onClick={handleStartMission}
                disabled={status === AgentStatus.SCOUTING || status === AgentStatus.ANALYZING}
                className={`
                  w-full py-4 rounded font-bold uppercase tracking-wider text-sm transition-all
                  ${status === AgentStatus.SCOUTING || status === AgentStatus.ANALYZING
                    ? 'bg-cyber-gray text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyber-purple to-indigo-600 hover:from-cyber-purple hover:to-cyber-accent text-white shadow-lg shadow-cyber-purple/20'
                  }
                `}
              >
                {status === AgentStatus.SCOUTING ? 'SCANNING GLOBAL NETWORKS...' : 
                 status === AgentStatus.ANALYZING ? 'ANALYZING & DRAFTING...' : 
                 'INITIALIZE AUTO-SCOUT'}
              </button>
            </div>
          </div>

          {/* Terminal */}
          <TerminalLog logs={logs} />
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Icons.Globe /> Detected Targets
               <span className="text-sm font-mono font-normal text-gray-500 ml-2">
                 {leads.length > 0 ? `(${leads.length} found)` : '(0)'}
               </span>
             </h2>
             
             {leads.length > 0 && (
               <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 text-xs font-bold bg-cyber-green/10 text-cyber-green border border-cyber-green px-4 py-2 rounded hover:bg-cyber-green/20 transition-all"
               >
                 <Icons.Download /> EXPORT TO CSV
               </button>
             )}
          </div>

          {leads.length === 0 ? (
            <div className="h-96 rounded-xl border-2 border-dashed border-cyber-gray flex flex-col items-center justify-center text-gray-600 space-y-4">
              {status === AgentStatus.IDLE ? (
                <>
                  <Icons.Search />
                  <p>Ready to deploy. Enter parameters and start mission.</p>
                </>
              ) : (
                 <div className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 border-4 border-cyber-accent border-t-transparent rounded-full animate-spin"></div>
                   <p className="animate-pulse text-cyber-accent">Agent is working...</p>
                 </div>
              )}
            </div>
          ) : (
            <LeadTable leads={leads} />
          )}
        </div>

      </main>
    </div>
  );
};

export default App;