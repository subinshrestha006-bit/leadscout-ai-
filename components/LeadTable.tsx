import React, { useState } from 'react';
import { Lead } from '../types';
import { Icons } from '../constants';

interface LeadTableProps {
  leads: Lead[];
}

export const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = (text: string, id: string, type: string) => {
    let contentToCopy = text;
    
    // Cleanup logic for contact info (strip prefixes like 'Email:', 'Phone:')
    if (type === 'contact') {
        const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
        if (emailMatch) {
            contentToCopy = emailMatch[0];
        } else {
             // Remove common prefixes
             contentToCopy = text.replace(/^(Email|Phone|WhatsApp|Tel|Mobile|Contact):\s*/i, '').trim();
        }
    }

    navigator.clipboard.writeText(contentToCopy);
    const key = `${id}-${type}`;
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getContactIcon = (contact: string) => {
    const c = contact.toLowerCase();
    // Prioritize Email
    if (c.includes('@')) return <Icons.Mail />;
    // Then WhatsApp/Chat
    if (c.includes('whatsapp') || c.includes('chat')) return <Icons.MessageCircle />;
    // Then Phone (must have at least 6 digits to avoid matching random numbers)
    const digitCount = (c.match(/\d/g) || []).length;
    if (digitCount >= 6) return <Icons.Phone />;
    
    // Default fallback
    return <Icons.Search />;
  };

  const isContactValid = (contact: string) => {
     const c = contact.toLowerCase();
     const digitCount = (c.match(/\d/g) || []).length;
     return c.includes('@') || c.includes('whatsapp') || digitCount >= 6;
  };

  const handleContact = (lead: Lead) => {
    const contact = lead.contactInfo.toLowerCase();
    // basic cleanup to find numbers
    const cleanNumber = lead.contactInfo.replace(/[^\d+]/g, '');
    // simple email regex
    const emailMatch = lead.contactInfo.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const email = emailMatch ? emailMatch[0] : null;

    if (email) {
      // Email Logic: Pre-fill subject and body from AI draft
      const subjectMatch = lead.emailDraft.match(/Subject:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : "Service Inquiry";
      
      let body = lead.emailDraft;
      // Try to remove the subject line from the body if it exists there
      if (subjectMatch) {
         body = body.replace(subjectMatch[0], '').trim();
      }
      
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } 
    else if (contact.includes('whatsapp') && cleanNumber) {
        // WhatsApp Logic
        window.open(`https://wa.me/${cleanNumber}`, '_blank');
    } 
    else if (cleanNumber && cleanNumber.length > 6) {
        // Phone Logic
        window.location.href = `tel:${cleanNumber}`;
    } 
    else {
        alert(`No direct contact link available for: ${lead.contactInfo}. Please copy manually.`);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status.toLowerCase();
    
    // Critical: Missing Website or Broken
    if (s.includes('no website') || s.includes('broken') || s.includes('offline') || s.includes('404')) {
      return {
        style: 'bg-red-900/40 text-red-300 border-red-800',
        icon: <Icons.Alert />,
        label: status.toUpperCase()
      };
    }
    
    // Socials Only (Variation of No Website)
    if (s.includes('social') || s.includes('instagram') || s.includes('facebook')) {
      return {
        style: 'bg-pink-900/40 text-pink-300 border-pink-800',
        icon: <Icons.Globe />,
        label: status.toUpperCase()
      };
    }

    // Opportunity: Voice/Booking Gaps (Perfect for AI Voice Agent)
    if (s.includes('voice') || s.includes('call') || s.includes('manual') || s.includes('phone') || s.includes('booking')) {
      return {
        style: 'bg-purple-900/40 text-purple-300 border-purple-800',
        icon: <Icons.Smartphone />,
        label: status.toUpperCase()
      };
    }

    // Opportunity: Chatbot/App Gaps
    if (s.includes('chatbot') || s.includes('app') || s.includes('automated')) {
      return {
        style: 'bg-amber-900/40 text-amber-300 border-amber-800',
        icon: <Icons.Bot />,
        label: status.toUpperCase()
      };
    }

    // UX/Quality Issues
    if (s.includes('outdated') || s.includes('slow') || s.includes('unfriendly') || s.includes('friction')) {
      return {
        style: 'bg-orange-900/40 text-orange-300 border-orange-800',
        icon: <Icons.Terminal />,
        label: status.toUpperCase()
      };
    }

    // Good/Modern
    if (s.includes('good') || s.includes('modern') || s.includes('excellent')) {
      return {
        style: 'bg-green-900/40 text-green-300 border-green-800',
        icon: <Icons.Check />,
        label: status.toUpperCase()
      };
    }

    // Default
    return {
      style: 'bg-gray-800 text-gray-400 border-gray-700',
      icon: null,
      label: status.toUpperCase()
    };
  };

  if (leads.length === 0) return null;

  return (
    <div className="overflow-x-auto bg-cyber-dark rounded-lg border border-cyber-gray shadow-lg">
      <table className="w-full text-left text-sm text-gray-400">
        <thead className="text-xs uppercase bg-cyber-black text-cyber-accent font-mono border-b border-cyber-gray">
          <tr>
            <th scope="col" className="px-6 py-4 tracking-wider">Business / Location</th>
            <th scope="col" className="px-6 py-4 tracking-wider">Tech Gap (Status)</th>
            <th scope="col" className="px-6 py-4 tracking-wider">Contact</th>
            <th scope="col" className="px-6 py-4 tracking-wider">Potential</th>
            <th scope="col" className="px-6 py-4 tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cyber-gray">
          {leads.map((lead) => {
            const statusConfig = getStatusConfig(lead.platformStatus);
            const hasContact = isContactValid(lead.contactInfo);
            
            return (
              <React.Fragment key={lead.id}>
                <tr className={`hover:bg-cyber-gray/30 transition-colors ${expandedId === lead.id ? 'bg-cyber-gray/20' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white text-base">{lead.name}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Icons.MapPin />
                      {lead.location}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 italic">{lead.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold tracking-wide uppercase ${statusConfig.style}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                    {lead.website && lead.website !== 'None' && (
                      <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="block mt-2 text-xs text-cyber-accent hover:underline truncate max-w-[150px]">
                        {lead.website}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 group">
                        <span className={`px-2 py-1 rounded break-all border flex items-center gap-2 w-fit ${hasContact ? 'bg-cyber-accent/5 text-white border-cyber-accent/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                          <span className={hasContact ? "text-cyber-accent" : "text-gray-500"}>
                              {getContactIcon(lead.contactInfo)}
                          </span>
                          {lead.contactInfo}
                        </span>
                        {hasContact && (
                          <button
                            onClick={() => copyToClipboard(lead.contactInfo, lead.id, 'contact')}
                            className="text-gray-500 hover:text-cyber-accent transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy Contact Info"
                          >
                            {copiedId === `${lead.id}-contact` ? <Icons.Check /> : <Icons.Copy />}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`text-lg font-bold ${lead.potentialScore > 80 ? 'text-cyber-green' : lead.potentialScore > 50 ? 'text-cyber-purple' : 'text-gray-400'}`}>
                         {lead.potentialScore}%
                       </span>
                       <div className="w-16 bg-gray-800 rounded-full h-1.5">
                         <div 
                           className={`h-1.5 rounded-full ${lead.potentialScore > 80 ? 'bg-cyber-green' : lead.potentialScore > 50 ? 'bg-cyber-purple' : 'bg-gray-400'}`}
                           style={{ width: `${lead.potentialScore}%` }}
                         ></div>
                       </div>
                    </div>
                     <p className="text-gray-300 text-xs leading-relaxed max-w-xs line-clamp-2">
                       {lead.reasoning}
                     </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleContact(lead)}
                        className="text-xs bg-cyber-green/10 text-cyber-green border border-cyber-green hover:bg-cyber-green hover:text-black transition-colors px-3 py-1.5 rounded font-bold uppercase flex items-center gap-1.5"
                        title="Initiate Contact"
                      >
                         {getContactIcon(lead.contactInfo)}
                         Connect
                      </button>
                      <button 
                        onClick={() => toggleExpand(lead.id)}
                        className="text-xs bg-cyber-accent/10 text-cyber-accent border border-cyber-accent hover:bg-cyber-accent hover:text-black transition-colors px-3 py-1.5 rounded font-bold uppercase"
                      >
                        {expandedId === lead.id ? 'Close' : 'View Outreach'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === lead.id && (
                  <tr className="bg-cyber-gray/10">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email Drafts Column */}
                        <div className="space-y-4">
                            {/* Initial Email */}
                            <div className="bg-cyber-black/50 border border-cyber-gray rounded p-4 relative flex flex-col">
                              <div className="absolute top-2 right-2">
                                <button 
                                  onClick={() => copyToClipboard(lead.emailDraft, lead.id, 'email')}
                                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-cyber-dark px-2 py-1 rounded border border-cyber-gray transition-colors"
                                >
                                  {copiedId === `${lead.id}-email` ? (
                                     <>
                                      <Icons.Check />
                                      COPIED
                                     </>
                                  ) : (
                                     <>
                                      <Icons.Download />
                                      COPY
                                     </>
                                  )}
                                </button>
                              </div>
                              <h4 className="text-cyber-accent text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                <Icons.Mail />
                                Cold Email Draft
                              </h4>
                              <div className="flex-1 bg-cyber-dark/50 p-3 rounded border border-white/5 font-mono text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {lead.emailDraft}
                              </div>
                            </div>

                            {/* Follow-up Email */}
                            <div className="bg-cyber-black/50 border border-cyber-gray rounded p-4 relative flex flex-col opacity-90">
                              <div className="absolute top-2 right-2">
                                <button 
                                  onClick={() => copyToClipboard(lead.followUpEmail, lead.id, 'followup')}
                                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-cyber-dark px-2 py-1 rounded border border-cyber-gray transition-colors"
                                >
                                  {copiedId === `${lead.id}-followup` ? (
                                     <>
                                      <Icons.Check />
                                      COPIED
                                     </>
                                  ) : (
                                     <>
                                      <Icons.Download />
                                      COPY
                                     </>
                                  )}
                                </button>
                              </div>
                              <h4 className="text-gray-400 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                <Icons.MessageCircle />
                                Follow-up Email (Send 3 Days Later)
                              </h4>
                              <div className="flex-1 bg-cyber-dark/50 p-3 rounded border border-white/5 font-mono text-xs md:text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
                                {lead.followUpEmail}
                              </div>
                            </div>
                        </div>

                        {/* Strategy & Tips Section */}
                        <div className="bg-cyber-black/50 border border-cyber-gray rounded p-4 flex flex-col h-fit">
                          <h4 className="text-cyber-green text-xs font-bold uppercase mb-3 flex items-center gap-2">
                            <Icons.Check />
                            Success Strategy & Tips
                          </h4>
                          <div className="flex-1 p-3 rounded bg-cyber-green/5 border border-cyber-green/20">
                            <div className="text-sm text-gray-300 space-y-2 font-mono">
                               {lead.outreachTips.split('\n').map((tip, idx) => (
                                 <p key={idx} className="flex gap-2">
                                   <span className="text-cyber-green">»</span>
                                   {tip}
                                 </p>
                               ))}
                            </div>
                          </div>
                          <div className="mt-4 p-3 rounded bg-cyber-purple/5 border border-cyber-purple/20">
                             <p className="text-xs text-gray-400">
                               <span className="text-cyber-purple font-bold">WHY THEM?</span> {lead.reasoning}
                             </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};