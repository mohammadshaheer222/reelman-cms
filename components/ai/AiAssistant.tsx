'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Settings as SettingsIcon,
  Copy,
  Check,
  PlusCircle,
  ExternalLink,
  RefreshCw,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  actionData?: any;
  actionResult?: any;
}

const STORAGE_KEY = 'reelman_gemini_api_key';

export function AiAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hi! I'm your **Reelman Studio AI Copilot**.\n\nYou can ask me for client details in any status:\n* \`active client details\`\n* \`confirmed client details\`\n* \`pending client details\`\n* \`show all status client details\`\n\nClick any of the suggestions above or type your question below!`,
      provider: 'local-crm-agent',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(STORAGE_KEY) || '';
      setApiKey(savedKey);
      setTempApiKey(savedKey);
    } catch {
      // Local storage unavailable
    }

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-ai-assistant', handleOpenEvent);
    return () => window.removeEventListener('open-ai-assistant', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
        toast.success('Gemini API key saved successfully!');
      } else {
        localStorage.removeItem(STORAGE_KEY);
        toast.info('API key cleared. Running in local CRM agent mode.');
      }
    } catch {
      // Ignore
    }
    setShowSettings(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        provider: data.provider,
        actionData: data.actionData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error reaching AI assistant';
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue: ${msg}. Please check your connection or API key.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (messageId: string, actionData: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Execute action' }],
          executeAction: actionData,
        }),
      });

      if (!response.ok) throw new Error('Action execution failed');
      const data = await response.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, actionResult: data.actionResult, actionData: null }
            : m
        )
      );

      if (data.actionResult?.type === 'client_created') {
        window.dispatchEvent(new CustomEvent('client-created'));
        toast.success(`Client ${data.actionResult.client.name || 'created'} successfully!`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation cleared. How can I help your studio today?`,
        provider: 'local-crm-agent',
      },
    ]);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-gray-900 dark:text-white text-sm mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-gray-800 dark:text-neutral-200 text-xs mt-1.5 mb-0.5">
                {line.replace('#### ', '')}
              </h5>
            );
          }
          if (line.startsWith('* ') || line.startsWith('• ') || line.startsWith('- ')) {
            const itemText = line.replace(/^[*•-]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 text-gray-700 dark:text-neutral-300 ml-1">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{renderInlineStyles(itemText)}</span>
              </div>
            );
          }
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-r text-gray-800 dark:text-emerald-300 text-xs italic my-1"
              >
                {line.replace('> ', '')}
              </blockquote>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }
          return <p key={idx} className="text-gray-700 dark:text-neutral-300">{renderInlineStyles(line)}</p>;
        })}
      </div>
    );
  };

  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-gray-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={index}
            className="bg-gray-100 dark:bg-neutral-800 text-[#dc2626] dark:text-red-400 px-1 py-0.5 rounded text-xs font-mono font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. Floating Launch Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#141414] hover:bg-black dark:bg-[#1f232b] dark:hover:bg-[#282d37] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl border border-gray-800 dark:border-neutral-700 group transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="font-semibold text-sm tracking-wide">Studio AI</span>
        </button>
      )}

      {/* 2. Side Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white dark:bg-[#14161a] shadow-2xl border-l border-gray-200 dark:border-neutral-800 flex flex-col transition-all duration-300">
          {/* Top Bar Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-[#141414] dark:bg-[#0e1013] text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight">Studio AI Copilot</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {apiKey ? 'Gemini 2.0 Flash' : 'Free CRM Mode'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">Reelman Studio Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                title="AI Settings & Free Key"
                className={`p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-neutral-800 transition-colors ${
                  showSettings ? 'bg-gray-800 text-white' : ''
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
              <button
                onClick={clearChat}
                title="Clear Conversation"
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Sub-panel (Collapsible) */}
          {showSettings && (
            <div className="p-4 bg-gray-50 dark:bg-[#1a1d22] border-b border-gray-200 dark:border-neutral-800 text-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    Google Gemini API Key
                  </h4>
                  <p className="text-gray-500 dark:text-neutral-400 text-[11px] mt-0.5">
                    100% Free • Up to 15 requests/minute without a credit card.
                  </p>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold text-[11px]"
                >
                  <span>Get Free Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="Paste your AI Studio API key (AIzaSy...)"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-gray-400">
                  {apiKey ? '✓ Key active' : 'Using smart built-in engine'}
                </span>
                <div className="flex items-center gap-2">
                  {apiKey && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setTempApiKey('');
                        setApiKey('');
                        localStorage.removeItem(STORAGE_KEY);
                        toast.info('API Key removed');
                      }}
                      className="h-7 text-xs text-red-600 hover:text-red-700 px-2"
                    >
                      Clear Key
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveApiKey}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 font-medium"
                  >
                    Save Key
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Prompts Bar */}
          <div className="px-4 py-2.5 bg-gray-50/70 dark:bg-[#14161a] border-b border-gray-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
              Suggestions:
            </span>
            <button
              onClick={() => handleSendMessage('active client details')}
              className="text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0"
            >
              🟢 active client details
            </button>
            <button
              onClick={() => handleSendMessage('confirmed client details')}
              className="text-xs bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0"
            >
              ✅ confirmed client details
            </button>
            <button
              onClick={() => handleSendMessage('pending client details')}
              className="text-xs bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0"
            >
              ⏳ pending client details
            </button>
            <button
              onClick={() => handleSendMessage('show all status client details')}
              className="text-xs bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-300 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors font-medium shrink-0"
            >
              📋 show all status client details
            </button>
            <button
              onClick={() => handleSendMessage('Which clients need follow-up today?')}
              className="text-xs bg-white dark:bg-[#1c1f24] hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shrink-0"
            >
              🎯 follow-up clients
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-xl bg-gray-900 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                      isUser
                        ? 'bg-[#141414] dark:bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-[#1a1d22] border border-gray-100/90 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <>
                        {renderFormattedContent(message.content)}

                        {/* Interactive Action Card if AI proposed an action */}
                        {message.actionData?.type === 'create_client' && (
                          <div className="mt-3 p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              <span className="flex items-center gap-1">
                                <PlusCircle className="w-4 h-4 text-emerald-600" />
                                Ready to create lead:
                              </span>
                              <span className="text-[11px] bg-emerald-200/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                {message.actionData.payload?.name || 'New Client'}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              disabled={loading}
                              onClick={() => handleExecuteAction(message.id, message.actionData)}
                              className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium"
                            >
                              Create Client Record Now
                            </Button>
                          </div>
                        )}

                        {/* Action Result (Success feedback) */}
                        {message.actionResult?.type === 'client_created' && (
                          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              Added: {message.actionResult.client.name || 'New Client'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                router.push(`/clients/${message.actionResult.client._id}`);
                                setIsOpen(false);
                              }}
                              className="h-7 text-xs border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                            >
                              View Profile
                            </Button>
                          </div>
                        )}

                        {/* Quick Copy Button */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-end">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-xl bg-gray-900 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                </div>
                <div className="bg-white dark:bg-[#1a1d22] border border-gray-100 dark:border-neutral-800 rounded-2xl rounded-tl-none p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-gray-400 ml-1">Analyzing studio data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#14161a]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask studio copilot (e.g. 'Summarize follow-ups' or 'Add lead for Raj')..."
                rows={1}
                className="flex-1 resize-none max-h-24 p-2.5 text-xs bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition-all text-gray-800 dark:text-white"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 w-10 p-0 rounded-xl bg-[#141414] hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shrink-0 shadow-xs disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-emerald-400 dark:text-white" />
              </Button>
            </form>
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400 px-1">
              <span>Shift+Enter for new line</span>
              <span>Reelman AI • Free & Safe</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

