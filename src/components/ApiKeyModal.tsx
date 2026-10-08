import React, { useState } from 'react';
import { BYOKConfig } from '../types/market';
import { KeyRound, Shield, Check, Trash2, X, ExternalLink, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  byokConfig: BYOKConfig | null;
  onSaveConfig: (config: BYOKConfig | null) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  byokConfig,
  onSaveConfig,
}) => {
  const [provider, setProvider] = useState<'gemini' | 'nvidia' | 'deepseek' | 'groq' | 'openrouter' | 'openai'>(
    byokConfig?.provider || 'gemini'
  );
  const [apiKey, setApiKey] = useState(byokConfig?.apiKey || '');
  const [model, setModel] = useState(byokConfig?.model || 'gemini-3.8-flash');
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    detail?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: 'gemini' | 'nvidia' | 'deepseek' | 'groq' | 'openrouter' | 'openai') => {
    setProvider(newProvider);
    if (newProvider === 'gemini') setModel('gemini-3.8-flash');
    else if (newProvider === 'nvidia') setModel('meta/llama-3.3-70b-instruct');
    else if (newProvider === 'deepseek') setModel('deepseek-chat');
    else if (newProvider === 'groq') setModel('llama-3.3-70b-versatile');
    else if (newProvider === 'openrouter') setModel('deepseek/deepseek-r1:free');
    else if (newProvider === 'openai') setModel('gpt-4o-mini');
    setTestResult(null);
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      onSaveConfig(null);
      onClose();
      return;
    }

    onSaveConfig({
      provider,
      apiKey: apiKey.trim(),
      model,
    });
    onClose();
  };

  const handlePurge = () => {
    setApiKey('');
    onSaveConfig(null);
    setTestResult({
      type: 'info',
      message: 'Vault purged successfully.',
      detail: 'Personal API key removed from browser storage.',
    });
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        type: 'warning',
        message: 'Please enter an API key to test.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult({
      type: 'info',
      message: `Validating key handshake with ${provider.toUpperCase()}...`,
    });

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping NEPSE test. Reply with: OK' }] }],
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `Key Authenticated! Connected to ${model}.`,
            detail: 'Google Gemini API key validated successfully. Quota and authentication are active.',
          });
        } else {
          const err = await res.json().catch(() => ({}));
          const errMsg = err?.error?.message || res.statusText;
          if (res.status === 400 || res.status === 401 || res.status === 403 || /invalid|api key/i.test(errMsg)) {
            setTestResult({
              type: 'error',
              message: 'Invalid or Expired Google API Key (HTTP 401/403)',
              detail: 'Please generate a valid key from Google AI Studio (aistudio.google.com/app/apikey).',
            });
          } else if (res.status === 429 || /quota|exhausted|rate limit/i.test(errMsg)) {
            setTestResult({
              type: 'warning',
              message: 'Google Gemini Rate Limit / Quota Exceeded (HTTP 429)',
              detail: 'Key is authentic, but request limits have been reached. Wait a minute or check quotas in Google AI Studio.',
            });
          } else {
            setTestResult({
              type: 'error',
              message: `Handshake Failed (HTTP ${res.status})`,
              detail: errMsg,
            });
          }
        }
      } else if (provider === 'nvidia') {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: model || 'meta/llama-3.3-70b-instruct',
            messages: [{ role: 'user', content: 'Ping. Say OK.' }],
            max_tokens: 5,
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `NVIDIA NIM Key Validated! Connected to ${model}.`,
            detail: 'NVIDIA API key authenticated with high-throughput inference.',
          });
        } else {
          const err = await res.json().catch(() => ({}));
          const errMsg = err?.detail || err?.message || res.statusText;
          setTestResult({
            type: 'error',
            message: `NVIDIA NIM Validation Failed (HTTP ${res.status})`,
            detail: res.status === 401 ? 'Invalid NVIDIA API key. Generate one at build.nvidia.com.' : errMsg,
          });
        }
      } else if (provider === 'deepseek') {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: model || 'deepseek-chat',
            messages: [{ role: 'user', content: 'Ping. Say OK.' }],
            max_tokens: 5,
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `DeepSeek Key Validated! Connected to ${model}.`,
            detail: 'DeepSeek API key authenticated and responsive.',
          });
        } else {
          setTestResult({
            type: 'error',
            message: `DeepSeek Validation Failed (HTTP ${res.status})`,
            detail: res.status === 401 ? 'Invalid DeepSeek API key. Obtain one at platform.deepseek.com.' : res.status === 402 ? 'Insufficient DeepSeek account balance.' : 'Connection rejected.',
          });
        }
      } else if (provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Ping. Say OK.' }],
            max_tokens: 5,
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `Groq Key Validated! Connected to ${model}.`,
          });
        } else {
          setTestResult({
            type: 'error',
            message: `Groq Validation Failed (HTTP ${res.status})`,
            detail: res.status === 401 ? 'Invalid Groq API key.' : res.status === 429 ? 'Groq Rate Limit Exceeded.' : 'Connection rejected.',
          });
        }
      } else if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: 'Ping. Say OK.' }],
            max_tokens: 5,
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `OpenRouter Key Validated! Connected to ${model}.`,
          });
        } else {
          setTestResult({
            type: 'error',
            message: `OpenRouter Validation Failed (HTTP ${res.status})`,
            detail: res.status === 401 ? 'Invalid OpenRouter key.' : res.status === 429 ? 'Rate limit exceeded.' : 'Connection rejected.',
          });
        }
      } else if (provider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Ping. Say OK.' }],
            max_tokens: 5,
          }),
        });

        if (res.ok) {
          setTestResult({
            type: 'success',
            message: `OpenAI Key Validated! Connected to ${model}.`,
          });
        } else {
          setTestResult({
            type: 'error',
            message: `OpenAI Validation Failed (HTTP ${res.status})`,
            detail: res.status === 401 ? 'Invalid OpenAI API key.' : res.status === 429 ? 'OpenAI quota or rate limit exceeded.' : 'Connection rejected.',
          });
        }
      }
    } catch (err: any) {
      setTestResult({
        type: 'error',
        message: 'Network / Connection Error',
        detail: err.message || 'Unable to establish connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderLink = () => {
    switch (provider) {
      case 'gemini':
        return { label: 'Get free Google AI Studio key', url: 'https://aistudio.google.com/app/apikey' };
      case 'nvidia':
        return { label: 'Get NVIDIA NIM free credits', url: 'https://build.nvidia.com/' };
      case 'deepseek':
        return { label: 'Get DeepSeek API key', url: 'https://platform.deepseek.com/api_keys' };
      case 'groq':
        return { label: 'Get free Groq Cloud key', url: 'https://console.groq.com/keys' };
      case 'openrouter':
        return { label: 'Get OpenRouter key', url: 'https://openrouter.ai/keys' };
      case 'openai':
        return { label: 'Get OpenAI API key', url: 'https://platform.openai.com/api-keys' };
      default:
        return { label: 'Get API Key', url: 'https://aistudio.google.com/app/apikey' };
    }
  };

  const providerLink = getProviderLink();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#0e131d] border border-neutral-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">AI Key Vault & Provider Selection</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Tier Notice: 10 RPH */}
        <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/50 text-xs text-amber-200/90 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-300">Shared Server Tier: 10 Requests Per Hour (10 RPH)</div>
            <p className="mt-0.5 text-neutral-400 leading-relaxed">
              The default free server AI is capped at 10 requests/hour to prevent quota exhaustion. To enjoy <span className="text-amber-200 font-medium">unlimited, unmetered AI analyses</span> with zero wait time, connect your personal key from Google, NVIDIA, DeepSeek, Groq, or OpenAI below.
            </p>
          </div>
        </div>

        {/* Security / Privacy */}
        <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-900/40 text-xs text-neutral-300">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-neutral-400">
            Keys are stored strictly in your local browser and sent directly to the official provider over HTTPS.
          </p>
        </div>

        {/* Provider Selector */}
        <div className="space-y-1.5 text-xs">
          <label className="font-medium text-neutral-300">Select AI Provider:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'gemini', label: 'Google Gemini' },
              { id: 'nvidia', label: 'NVIDIA NIM' },
              { id: 'deepseek', label: 'DeepSeek' },
              { id: 'groq', label: 'Groq (Ultra-Fast)' },
              { id: 'openrouter', label: 'OpenRouter' },
              { id: 'openai', label: 'OpenAI' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id as any)}
                className={`p-2 rounded border text-center transition-colors cursor-pointer text-xs ${
                  provider === p.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-[#090d14] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-1 text-xs">
          <label className="font-medium text-neutral-300">Model:</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#090d14] border border-neutral-800 rounded p-2 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
          >
            {provider === 'gemini' && (
              <>
                <option value="gemini-3.8-flash">Gemini 3.8 Flash (Recommended)</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </>
            )}
            {provider === 'nvidia' && (
              <>
                <option value="meta/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
                <option value="deepseek-ai/deepseek-r1">DeepSeek R1 (NVIDIA NIM)</option>
                <option value="mistralai/mistral-large-2-instruct">Mistral Large 2 Instruct</option>
              </>
            )}
            {provider === 'deepseek' && (
              <>
                <option value="deepseek-chat">DeepSeek Chat (V3)</option>
                <option value="deepseek-reasoner">DeepSeek Reasoner (R1)</option>
              </>
            )}
            {provider === 'groq' && (
              <>
                <option value="llama-3.3-70b-versatile">LLaMA 3.3 70B Versatile</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </>
            )}
            {provider === 'openrouter' && (
              <>
                <option value="deepseek/deepseek-r1:free">DeepSeek R1 (Free)</option>
                <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                <option value="meta-llama/llama-3.3-70b-instruct">LLaMA 3.3 70B</option>
              </>
            )}
            {provider === 'openai' && (
              <>
                <option value="gpt-4o-mini">GPT-4o Mini (Cost-Effective)</option>
                <option value="gpt-4o">GPT-4o (Flagship)</option>
              </>
            )}
          </select>
        </div>

        {/* API Key Input */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-medium text-neutral-300">Enter API Key:</label>
            <a
              href={providerLink.url}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              {providerLink.label} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <input
            type="password"
            placeholder={
              provider === 'gemini'
                ? 'AIzaSy...'
                : provider === 'nvidia'
                ? 'nvapi-...'
                : provider === 'deepseek'
                ? 'sk-...'
                : provider === 'groq'
                ? 'gsk_...'
                : provider === 'openrouter'
                ? 'sk-or-...'
                : 'sk-proj-...'
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-[#090d14] border border-neutral-800 rounded p-2 text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Status text */}
        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs space-y-1 ${
              testResult.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : testResult.type === 'warning'
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                : testResult.type === 'error'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300'
            }`}
          >
            <div className="font-semibold flex items-center gap-1.5">
              <span>{testResult.message}</span>
            </div>
            {testResult.detail && (
              <p className="text-[11px] opacity-90 leading-relaxed">{testResult.detail}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          <button
            onClick={handlePurge}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Vault</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="px-3 py-1.5 text-xs border border-neutral-700 hover:border-neutral-500 text-neutral-300 rounded transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isTesting ? 'Validating...' : 'Test Key'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium bg-cyan-500 hover:bg-cyan-400 text-black rounded transition-colors cursor-pointer"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
