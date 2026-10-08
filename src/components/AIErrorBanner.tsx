import React from 'react';
import {
  KeyRound,
  AlertTriangle,
  AlertCircle,
  Clock,
  CloudOff,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  X,
} from 'lucide-react';

export type AIErrorKind =
  | 'invalid_key'
  | 'quota_exceeded'
  | 'empty_response'
  | 'network_error'
  | 'generic';

export interface AIErrorInfo {
  kind: AIErrorKind;
  title: string;
  description: string;
  suggestion: string;
  status?: number;
  rawMessage?: string;
}

export function classifyAIError(error: any): AIErrorInfo {
  const msg =
    typeof error === 'string'
      ? error
      : error?.message || error?.error || error?.detail || '';
  const str = String(msg).toLowerCase();
  const status = error?.status || (str.match(/\b(400|401|403|404|429|500|502|503|504)\b/)?.[1] ? Number(str.match(/\b(400|401|403|404|429|500|502|503|504)\b/)?.[1]) : undefined);

  if (
    (str.includes('api key') && (str.includes('not valid') || str.includes('invalid') || str.includes('expired') || str.includes('missing') || str.includes('pass a valid'))) ||
    str.includes('api_key_invalid') ||
    str.includes('unauthorized') ||
    str.includes('permission_denied') ||
    status === 401 ||
    status === 403
  ) {
    return {
      kind: 'invalid_key',
      title: 'Invalid or Expired API Key',
      description: 'The API key provided was rejected by the AI provider (HTTP 401/403).',
      suggestion: 'Please update your Google Gemini API key in settings or verify that the key has not expired.',
      status: status || 401,
      rawMessage: msg,
    };
  }

  if (
    str.includes('quota') ||
    str.includes('resource_exhausted') ||
    str.includes('exhausted') ||
    str.includes('rate limit') ||
    str.includes('too many requests') ||
    status === 429
  ) {
    return {
      kind: 'quota_exceeded',
      title: 'AI Quota / Rate Limit Exceeded',
      description: 'Your API key or the server has reached the rate limit or free tier quota (HTTP 429).',
      suggestion: 'Wait 30–60 seconds, upgrade your quota in Google AI Studio, or update to your personal API key.',
      status: 429,
      rawMessage: msg,
    };
  }

  if (
    str.includes('no analysis response') ||
    str.includes('no response') ||
    str.includes('empty response') ||
    str.includes('no content') ||
    str.includes('candidate')
  ) {
    return {
      kind: 'empty_response',
      title: 'No AI Response Generated',
      description: 'The AI model completed the request but returned an empty or restricted response.',
      suggestion: 'Try adjusting the prompt, re-running the analysis, or updating your API key settings.',
      status,
      rawMessage: msg,
    };
  }

  if (
    str.includes('failed to fetch') ||
    str.includes('network') ||
    str.includes('socket') ||
    str.includes('timeout') ||
    status === 503 ||
    status === 504
  ) {
    return {
      kind: 'network_error',
      title: 'AI Service Temporarily Unavailable',
      description: 'Unable to establish a stable connection with the AI provider (HTTP 503 / Network Timeout).',
      suggestion: 'Check your internet connection, try again in a few moments, or update to an alternate provider.',
      status: status || 503,
      rawMessage: msg,
    };
  }

  return {
    kind: 'generic',
    title: 'AI Generation Interrupted',
    description: msg || 'An unexpected error occurred while contacting the AI service.',
    suggestion: 'Verify your API key configuration in settings or retry the request.',
    status,
    rawMessage: msg,
  };
}

interface AIErrorBannerProps {
  error: AIErrorInfo | string | any;
  onUpdateKey?: () => void;
  onRetry?: () => void;
  onUseFallback?: () => void;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

export const AIErrorBanner: React.FC<AIErrorBannerProps> = ({
  error,
  onUpdateKey,
  onRetry,
  onUseFallback,
  onDismiss,
  className = '',
  compact = false,
}) => {
  if (!error) return null;

  const info: AIErrorInfo =
    typeof error === 'object' && 'title' in error && 'suggestion' in error
      ? (error as AIErrorInfo)
      : classifyAIError(error);

  const isQuota = info.kind === 'quota_exceeded';
  const isInvalidKey = info.kind === 'invalid_key';

  const badgeColor = isQuota
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : isInvalidKey
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';

  const borderGradient = isQuota
    ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#0e131d] to-[#090d14]'
    : isInvalidKey
    ? 'border-rose-500/40 bg-gradient-to-r from-rose-950/40 via-[#0e131d] to-[#090d14]'
    : 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-[#0e131d] to-[#090d14]';

  const iconComponent = isInvalidKey ? (
    <KeyRound className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
  ) : isQuota ? (
    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
  ) : (
    <AlertCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
  );

  if (compact) {
    return (
      <div
        className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-3 ${borderGradient} ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {iconComponent}
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>{info.title}</span>
              {info.status && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${badgeColor}`}>
                  HTTP {info.status}
                </span>
              )}
            </div>
            <p className="text-neutral-400 text-[11px] mt-0.5">{info.suggestion}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onUpdateKey && (
            <button
              onClick={onUpdateKey}
              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <KeyRound className="w-3 h-3" />
              <span>Update API Key</span>
            </button>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 border border-neutral-700"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 text-neutral-500 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border shadow-lg space-y-3 ${borderGradient} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg border ${
              isQuota
                ? 'bg-amber-950/60 border-amber-800/80'
                : isInvalidKey
                ? 'bg-rose-950/60 border-rose-800/80'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            {iconComponent}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white">{info.title}</h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-semibold ${badgeColor}`}>
                {isQuota ? 'QUOTA EXCEEDED (429)' : isInvalidKey ? 'AUTHENTICATION (401/403)' : `STATUS ${info.status || 'ERROR'}`}
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{info.description}</p>
            <p className="text-xs text-neutral-400 font-medium">💡 {info.suggestion}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-neutral-500 hover:text-white rounded transition-colors cursor-pointer"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {info.rawMessage && (
        <div className="p-2 bg-black/40 rounded border border-neutral-800/80 text-[11px] font-mono text-neutral-400 truncate">
          <span className="text-neutral-500 mr-1.5">Error Detail:</span>
          {info.rawMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60 text-xs">
        <div className="flex items-center gap-2">
          {onUpdateKey && (
            <button
              onClick={onUpdateKey}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-semibold rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update API Key in Vault</span>
            </button>
          )}

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-cyan-300 hover:text-cyan-200 border border-neutral-700/80 rounded-md transition-colors cursor-pointer"
          >
            <span>Get Free Key</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          {onUseFallback && (
            <button
              onClick={onUseFallback}
              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 rounded-md transition-colors cursor-pointer"
            >
              Use Offline Quant Engine
            </button>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
