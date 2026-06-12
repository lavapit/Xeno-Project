"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Megaphone,
  Layers, 
  Sparkles, 
  MessageSquare, 
  Send, 
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Smartphone
} from 'lucide-react';
import Link from 'next/link';

interface Segment {
  id: string;
  name: string;
  description: string | null;
  customerCount: number;
}

function NewCampaignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Wizard steps: 1 = Choose Segment, 2 = Choose Channel & Message, 3 = Review & Send
  const [step, setStep] = useState(1);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  // Form State
  const [campaignName, setCampaignName] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState(searchParams.get('segmentId') || '');
  const [channel, setChannel] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(''); // for Email
  
  // AI generation states
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch('/api/segments');
        if (res.ok) {
          const data = await res.json();
          setSegments(data);
          
          // Auto select if we came from segments list
          const paramSegmentId = searchParams.get('segmentId');
          if (paramSegmentId) {
            setSelectedSegmentId(paramSegmentId);
            setStep(2);
          }
        }
      } catch (err) {
        console.error("Error loading segments:", err);
      } finally {
        setLoadingSegments(false);
      }
    };
    fetchSegments();
  }, [searchParams]);

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);

  // Generate Message via AI
  const handleAIGenerateMessage = async () => {
    if (!selectedSegment) return;
    setGeneratingAI(true);
    setError('');

    try {
      const res = await fetch('/api/ai/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentDescription: selectedSegment.description || selectedSegment.name,
          channel: channel,
          brandName: 'Velara'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate copy');

      setMessage(data.body || '');
      setSubject(data.subject || '');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'AI message generation failed.');
    } finally {
      setGeneratingAI(false);
    }
  };

  // Create & Send Campaign
  const handleLaunch = async () => {
    if (!campaignName || !selectedSegmentId || !message) return;
    setSubmitting(true);
    setError('');

    try {
      // 1. Create the campaign in draft
      const createRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          segmentId: selectedSegmentId,
          message: channel === 'email' && subject ? `Subject: ${subject}\n\n${message}` : message,
          channel: channel
        })
      });

      const campaignData = await createRes.json();
      if (!createRes.ok) throw new Error(campaignData.error || 'Failed to create campaign');

      // 2. Trigger the send (non-blocking in CRM)
      const sendRes = await fetch(`/api/campaigns/${campaignData.id}/send`, {
        method: 'POST'
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error || 'Failed to trigger send process');

      // 3. Redirect to campaign details page to watch delivery
      router.push(`/campaigns/${campaignData.id}`);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Campaign launch failed.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back to list */}
      <div>
        <Link 
          href="/campaigns" 
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Campaigns
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Megaphone className="h-8 w-8 text-indigo-500" />
          Create New Campaign
        </h1>
        <p className="text-slate-400 mt-1">
          Launch a targeted messaging campaign to drive engagement and sales.
        </p>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex gap-3 items-start text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>{error}</div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900 border border-slate-800/80 p-1.5 rounded-xl text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
        <button 
          onClick={() => selectedSegmentId && setStep(1)}
          disabled={step === 1}
          className={`py-2.5 rounded-lg transition ${step === 1 ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-slate-300'}`}
        >
          1. Choose Segment
        </button>
        <button 
          onClick={() => step > 2 && setStep(2)}
          disabled={step <= 2}
          className={`py-2.5 rounded-lg transition ${step === 2 ? 'bg-indigo-600 text-white shadow-md' : 'hover:text-slate-300'}`}
        >
          2. Compose Copy
        </button>
        <div className={`py-2.5 rounded-lg transition ${step === 3 ? 'bg-indigo-600 text-white shadow-md' : ''}`}>
          3. Review & Send
        </div>
      </div>

      {/* STEP 1: CHOOSE SEGMENT */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Select Target Audience
            </h2>
            <Link href="/segments/new" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Create a new segment <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingSegments ? (
            <div className="flex justify-center items-center py-12 text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              Loading segments...
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No audience segments exist. You must create one first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  onClick={() => setSelectedSegmentId(segment.id)}
                  className={`p-5 rounded-xl border text-left cursor-pointer transition ${
                    selectedSegmentId === segment.id
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-slate-800 bg-slate-950/20 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-white text-sm">{segment.name}</h3>
                    <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-900">
                      {segment.customerCount} Shoppers
                    </span>
                  </div>
                  {segment.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{segment.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-800/80">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedSegmentId}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COMPOSE COPY */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              Configure Campaign Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Clearance Sale"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">
                  Marketing Channel
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['whatsapp', 'sms', 'email'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => {
                        setChannel(ch);
                        setMessage('');
                        setSubject('');
                      }}
                      className={`py-3 px-4 rounded-lg border text-sm font-semibold capitalize flex flex-col items-center gap-1.5 transition ${
                        channel === ch
                          ? 'border-indigo-500 bg-indigo-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {ch === 'whatsapp' && <MessageSquare className="h-5 w-5" />}
                      {ch === 'sms' && <Phone className="h-5 w-5" />}
                      {ch === 'email' && <Mail className="h-5 w-5" />}
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Message Content
                  </label>
                  <button
                    type="button"
                    onClick={handleAIGenerateMessage}
                    disabled={generatingAI}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded border border-indigo-900/60 transition"
                  >
                    {generatingAI ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Draft with AI
                      </>
                    )}
                  </button>
                </div>

                {channel === 'email' && (
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Email Subject Line"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                )}

                <textarea
                  required
                  placeholder={
                    channel === 'whatsapp' 
                      ? "Write WhatsApp text (under 160 characters, supports emojis)..."
                      : channel === 'sms'
                      ? "Write SMS text (under 140 characters, plain text only)..."
                      : "Write Email body copy..."
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={channel === 'email' ? 6 : 4}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                />
                
                <div className="flex justify-between items-center mt-2 text-xxs text-slate-500">
                  <span>Selected Segment: {selectedSegment?.name}</span>
                  <span className="font-mono">{message.length} chars</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium rounded-lg text-sm transition"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!campaignName || !message}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Preview & Send <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live Mobile/Inbox Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            {channel === 'email' ? (
              /* Email Client Mockup */
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl w-full max-w-sm mx-auto">
                <div className="bg-slate-950 p-3.5 border-b border-slate-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-xxs font-medium text-slate-500 mx-auto">Velara Mailer</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-xs border-b border-slate-800 pb-2.5 space-y-1">
                    <div className="text-slate-500"><span className="text-slate-400 font-semibold">To:</span> {selectedSegment?.name} Segment</div>
                    <div className="text-slate-500"><span className="text-slate-400 font-semibold">From:</span> newsletter@velara.com</div>
                    <div className="text-white font-semibold mt-2">{subject || '(No Subject)'}</div>
                  </div>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap min-h-[120px] bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                    {message || 'Type message or use AI drafter...'}
                  </div>
                </div>
              </div>
            ) : (
              /* Phone / Chat Mockup */
              <div className="relative border-[6px] border-slate-800 rounded-[36px] bg-slate-950 w-full max-w-[280px] h-[480px] mx-auto flex flex-col shadow-2xl">
                {/* Speaker/Camera notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-20 bg-slate-800 rounded-full z-10" />
                
                {/* Top Status Bar */}
                <div className="pt-7 px-5 pb-2 flex justify-between text-[10px] text-slate-500 font-semibold">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1">
                    <span>5G</span>
                    <span className="w-4 h-2.5 bg-slate-800 rounded-sm border border-slate-700 inline-block" />
                  </div>
                </div>

                {/* Chat Header */}
                <div className="bg-slate-900 border-y border-slate-800/60 p-3 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xxs text-white">V</div>
                  <div>
                    <div className="text-[11px] font-bold text-white">Velara</div>
                    <div className="text-[9px] text-emerald-400">Online</div>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
                  {message ? (
                    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl rounded-br-none p-3 max-w-[85%] self-end text-xs text-slate-200 shadow space-y-1">
                      <p className="whitespace-pre-wrap">{message}</p>
                      <span className="block text-[9px] text-slate-500 text-right">9:41 AM</span>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-600 italic py-8">
                      Your message bubble will appear here.
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-slate-900 border-t border-slate-800/60 rounded-b-[30px] flex items-center gap-2">
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-full h-6 px-3 text-[10px] flex items-center text-slate-600">Text Message</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & SEND */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Check className="h-6 w-6 text-emerald-500" />
            Review & Launch Campaign
          </h2>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60">
              <span className="text-slate-400 font-semibold">Campaign Name</span>
              <span className="col-span-2 text-white font-medium">{campaignName}</span>
            </div>
            
            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60">
              <span className="text-slate-400 font-semibold">Audience Segment</span>
              <span className="col-span-2 text-indigo-400 font-semibold">{selectedSegment?.name}</span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60">
              <span className="text-slate-400 font-semibold">Channel</span>
              <span className="col-span-2 capitalize text-white font-medium">{channel}</span>
            </div>

            <div className="grid grid-cols-3 py-2 border-b border-slate-800/60">
              <span className="text-slate-400 font-semibold">Recipient Count</span>
              <span className="col-span-2 font-mono text-emerald-400 font-bold">{selectedSegment?.customerCount} shoppers</span>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-slate-400 font-semibold block">Message Content</span>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs whitespace-pre-wrap">
                {channel === 'email' && subject ? (
                  <>
                    <strong className="text-white">Subject:</strong> {subject}
                    <hr className="border-slate-800 my-2" />
                    {message}
                  </>
                ) : message}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium rounded-lg text-sm transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-lg shadow-emerald-600/20 transition-all duration-150"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Campaign...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Launch Campaign
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <NewCampaignContent />
    </Suspense>
  );
}
