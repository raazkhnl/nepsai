import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Clean, lightweight, professional Markdown renderer tailored for financial analysis.
 * Eliminates raw markdown tokens like #, ##, **, -, etc., rendering styled typography,
 * callouts, bullet badges, tables, and metric highlights.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  if (!content) return null;

  // Split lines and parse blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2.5 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const [headerRow, separatorRow, ...bodyRows] = tableRows;
      const headers = headerRow ? headerRow.map((h) => h.trim()) : [];
      const hasValidHeader = headers.length > 0;

      elements.push(
        <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-lg border border-neutral-800 bg-[#090d14]">
          <table className="w-full text-left text-xs tabular-nums">
            {hasValidHeader && (
              <thead className="bg-[#0e131d] text-cyan-300 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="py-2 px-3 font-semibold">
                      {formatInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-neutral-800/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-neutral-800/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-neutral-300">
                      {formatInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  // Helper to parse bold, italic, code, metrics
  const formatInline = (text: string): React.ReactNode => {
    if (!text) return '';

    // Tokenize bold **text** or __text__
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Regex for bold, italic, code, and percentages/numbers
    const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
    let match: RegExpExecArray | null;
    let lastIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.substring(lastIdx, match.index));
      }

      if (match[2]) {
        // Bold: **text**
        const val = match[2];
        const isBullish = /bullish|buy|accumulate|support|\+\d+/i.test(val);
        const isBearish = /bearish|sell|reduce|stop-loss|risk|-\d+/i.test(val);

        parts.push(
          <strong
            key={`bold-${keyIdx++}`}
            className={`font-semibold ${
              isBullish
                ? 'text-emerald-400 font-bold'
                : isBearish
                ? 'text-rose-400 font-bold'
                : 'text-white'
            }`}
          >
            {val}
          </strong>
        );
      } else if (match[3]) {
        // Code: `code`
        parts.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/80 font-mono text-cyan-300 text-[11px]"
          >
            {match[3]}
          </code>
        );
      } else if (match[4]) {
        // Italic: *text*
        parts.push(
          <em key={`italic-${keyIdx++}`} className="italic text-neutral-400">
            {match[4]}
          </em>
        );
      }

      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return parts.length > 0 ? parts : text;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check for Markdown table row: | a | b | c |
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      inTable = true;
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      // Skip markdown separator row like |---|---|
      if (!cells.every((c) => /^[-:]+$/.test(c))) {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Empty line
    if (!line) {
      flushList();
      continue;
    }

    // Heading 1: # Title or Title ===
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <div
          key={`h1-${i}`}
          className="text-base font-bold text-white pt-3 pb-1 border-b border-neutral-800 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
          <span>{formatInline(line.replace(/^#\s+/, ''))}</span>
        </div>
      );
      continue;
    }

    // Heading 2: ## Section
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <div
          key={`h2-${i}`}
          className="text-sm font-bold text-cyan-300 pt-2.5 pb-1 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-sm bg-cyan-400 inline-block" />
          <span>{formatInline(line.replace(/^##\s+/, ''))}</span>
        </div>
      );
      continue;
    }

    // Heading 3: ### Sub-section
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <div
          key={`h3-${i}`}
          className="text-xs font-bold text-neutral-100 pt-2 pb-0.5 uppercase tracking-wider text-cyan-400/90"
        >
          {formatInline(line.replace(/^###\s+/, ''))}
        </div>
      );
      continue;
    }

    // Heading 4: #### Sub-heading
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <div
          key={`h4-${i}`}
          className="text-xs font-semibold text-neutral-200 pt-1.5 pb-0.5"
        >
          {formatInline(line.replace(/^####\s+/, ''))}
        </div>
      );
      continue;
    }

    // Blockquote: > Note or disclaimer
    if (line.startsWith('>')) {
      flushList();
      elements.push(
        <div
          key={`quote-${i}`}
          className="my-2 p-2.5 bg-neutral-900/60 border-l-2 border-cyan-500 rounded-r text-xs text-neutral-400 italic"
        >
          {formatInline(line.replace(/^>\s*/, ''))}
        </div>
      );
      continue;
    }

    // Unordered List item: * text or - text
    if (/^[-*]\s+/.test(line)) {
      inList = true;
      const itemText = line.replace(/^[-*]\s+/, '');
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-xs text-neutral-300 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/80 mt-1.5 shrink-0" />
          <span className="flex-1">{formatInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Numbered List item: 1. text
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2 my-1 text-xs text-neutral-300 leading-relaxed">
          <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-[10px] font-mono font-bold text-cyan-400 mt-0.5 shrink-0">
            {numMatch[1]}
          </span>
          <span className="flex-1">{formatInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Horizontal Rule: --- or ***
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="my-3 border-neutral-800" />);
      continue;
    }

    // Normal Paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-xs text-neutral-300 leading-relaxed my-1.5">
        {formatInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
};
