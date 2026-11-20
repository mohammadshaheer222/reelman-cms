'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  PlusCircle,
  KeyRound,
  ExternalLink,
  MessageSquare,
  FileText,
  DollarSign,
  Users,
  Settings as SettingsIcon,
  ShieldAlert,
  ArrowRight
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

export default function StudioAiPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 👋 Welcome to Reelman Studio AI\n\nI am your dedicated **AI Studio Copilot**, connected directly to your CRM database.\n\nQuick suggestion formats you can try:\n* \`active client details\` — See all clients in Active status\n* \`confirmed client details\` — Check confirmed shoot dates and locations\n* \`pending client details\` — View upcoming shoots pending token payments\n* \`show all status client details\` — View all clients grouped by their stage\n\n*Click any action on the left or type your question below!*`,
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
      // Ignore
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    setApiKey(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
        toast.success('Gemini API key saved successfully!');
      } else {
        localStorage.removeItem(STORAGE_KEY);
        toast.info('API key cleared.');
      }
    } catch {
      // Ignore
    }
    setShowKeyModal(false);
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
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          provider: data.provider,
          actionData: data.actionData,
        },
      ]);
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
        content: `Conversation refreshed. How can I assist your studio today?`,
        provider: 'local-crm-agent',
      },
    ]);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-gray-900 dark:text-white text-base mt-2 mb-1">
                {line.replace('### ', '')}
              </h4>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-gray-800 dark:text-neutral-200 text-sm mt-1.5 mb-0.5">
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
                className="border-l-3 border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20 p-2.5 rounded-r text-gray-800 dark:text-emerald-200 text-xs italic my-1.5"
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
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#14161a] p-6 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Studio AI Command Center</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                {apiKey ? 'Gemini 2.0 Flash' : 'Free Studio Mode'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
              Natural language intelligence for leads, proposals, shoot timelines, and revenue metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyModal(!showKeyModal)}
            className="rounded-xl border-gray-200 dark:border-neutral-700 text-xs font-semibold"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            {apiKey ? 'API Key Configured' : 'Configure Free Gemini Key'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="rounded-xl border-gray-200 dark:border-neutral-700 text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
            Reset Chat
          </Button>
        </div>
      </div>

      {/* API Key Modal / Banner */}
      {showKeyModal && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-5 rounded-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                Google Gemini API Key (100% Free)
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                Google AI Studio provides a free forever tier (15 requests/min, 1M tokens/min) with no credit card required.
              </p>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              <span>Get Free Key</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="password"
              placeholder="Paste API Key (AIzaSy...)"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              className="flex-1 text-xs font-mono px-3 py-2 bg-white dark:bg-neutral-900 border border-emerald-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              onClick={handleSaveApiKey}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold px-4 h-9"
            >
              Save Key
            </Button>
            {apiKey && (
              <Button
                variant="ghost"
                onClick={() => {
                  setTempApiKey('');
                  setApiKey('');
                  localStorage.removeItem(STORAGE_KEY);
                  toast.info('API Key cleared');
                }}
                className="text-xs text-red-600 hover:text-red-700 h-9"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Quick Studio AI Tools */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#14161a] p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
              Quick Studio Actions
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => handleSendMessage('active client details')}
                className="w-full text-left p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 group-hover:underline">
                    🟢 Active Client Details
                  </h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    View all clients currently in Active status.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('confirmed client details')}
                className="w-full text-left p-3 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-blue-200/70 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 group-hover:underline">
                    ✅ Confirmed Client Details
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    View booked shoots with event dates and venue locations.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('pending client details')}
                className="w-full text-left p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-amber-200/70 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 group-hover:underline">
                    ⏳ Pending Client Details
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    View pending bookings awaiting advance payment.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('show all status client details')}
                className="w-full text-left p-3 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-purple-200/70 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 group-hover:underline">
                    📋 All Clients by Status
                  </h4>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                    Complete list of clients organized under every pipeline stage.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('Summarize our CRM pipeline, total revenue, and outstanding balance')}
                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-neutral-800/50 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white group-hover:text-emerald-600">
                    Pipeline & Revenue Summary
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Breakdown of active leads, total bookings, advance received & pending balance.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('Which clients need immediate follow-up today?')}
                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-neutral-800/50 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white group-hover:text-blue-600">
                    Identify Follow-up Leads
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    List clients currently stuck in quotation or initial inquiry stages.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('Draft a signature wedding shoot proposal with full deliverables and commercial terms')}
                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-neutral-800/50 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white group-hover:text-purple-600">
                    Draft Shoot Proposal
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Generate standard video + photo package breakdown, deliverables, and payment schedule.
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSendMessage('Write a friendly WhatsApp follow-up reminder for a client awaiting quotation response')}
                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-neutral-800/50 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-white group-hover:text-emerald-600">
                    WhatsApp Message Drafter
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">
                    Polite, ready-to-copy WhatsApp messages for leads and payment reminders.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#141414] to-[#1f2227] text-white p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold tracking-wide uppercase">AI Lead Dictation</h4>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Type or dictate leads naturally:
            </p>
            <div
              onClick={() => handleSendMessage('Add lead for Ananya, phone 9876543210, wedding shoot on December 24 in Kochi, budget 75000')}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer text-[11px] font-mono text-emerald-300 transition-colors"
            >
              &quot;Add lead for Ananya, phone 9876543210, wedding shoot on Dec 24 in Kochi, budget 75000&quot;
            </div>
          </div>
        </div>

        {/* Right Column: Full Interactive Chat Session */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-[#14161a] rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden h-[680px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                      isUser
                        ? 'bg-[#141414] dark:bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-gray-50/80 dark:bg-[#1a1d22] border border-gray-100 dark:border-neutral-800 text-gray-800 dark:text-neutral-200 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <>
                        {renderFormattedContent(message.content)}

                        {/* Interactive Action Card if AI proposed an action */}
                        {message.actionData?.type === 'create_client' && (
                          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                              <span className="flex items-center gap-1.5">
                                <PlusCircle className="w-4 h-4 text-emerald-600" />
                                Ready to create lead:
                              </span>
                              <span className="text-[11px] bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-mono">
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
                          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-emerald-900 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                              <Check className="w-4 h-4 text-emerald-600" />
                              Added: {message.actionResult.client.name || 'New Client'}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/clients/${message.actionResult.client._id}`)}
                              className="h-7 text-xs border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950"
                            >
                              Open Profile
                            </Button>
                          </div>
                        )}

                        {/* Quick Copy Button */}
                        <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-neutral-700 flex items-center justify-end">
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 dark:hover:text-neutral-200 transition-colors"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
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
                <div className="w-8 h-8 rounded-xl bg-gray-900 dark:bg-neutral-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
                </div>
                <div className="bg-gray-50 dark:bg-[#1a1d22] border border-gray-100 dark:border-neutral-800 rounded-2xl rounded-tl-none p-3.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-gray-400 ml-1">Analyzing studio CRM data...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#14161a]">
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
                rows={2}
                className="flex-1 resize-none p-3 text-xs bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-neutral-900 transition-all text-gray-800 dark:text-white"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-12 w-12 p-0 rounded-xl bg-[#141414] hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shrink-0 shadow-xs disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-emerald-400 dark:text-white" />
              </Button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400 dark:text-neutral-500 px-1">
              <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
              <span>Reelman AI • 100% Free Forever</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
