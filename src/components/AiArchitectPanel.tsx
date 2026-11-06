import React, { useState } from 'react';
import { Sparkles, Bug, Cpu, Send, CheckCircle2, Wrench } from 'lucide-react';
import type { BoardId, PinState, TransportType } from '../utils/mcuEngine';

export interface AiDiagnosticItem {
  severity: string;
  line: number;
  message: string;
  fix: string;
}

export interface AiBoardActionItem {
  pinNumber: number;
  mode: string;
  value: number;
  summary: string;
}

export interface AiArchitectResponse {
  explanation: string;
  code: string;
  diagnostics: AiDiagnosticItem[];
  boardActions: AiBoardActionItem[];
  serialCommands: string[];
}

interface AiArchitectPanelProps {
  boardId: BoardId;
  transport: TransportType;
  currentCode: string;
  pins: PinState[];
  onApplyAiResult: (result: AiArchitectResponse) => void;
}

export const AiArchitectPanel: React.FC<AiArchitectPanelProps> = ({
  boardId,
  transport,
  currentCode,
  pins,
  onApplyAiResult,
}) => {
  const [mode, setMode] = useState<'write' | 'debug' | 'control'>('write');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AiArchitectResponse | null>(null);

  const quickPrompts = [
    {
      label: 'Sensor Data Logging',
      mode: 'write' as const,
      text: 'Write C++ firmware for multi-sensor BME280 + Hall flux telemetry logging at 10Hz with JSON serial output and status LED heartbeat.',
    },
    {
      label: 'PID Motor & Servo Control',
      mode: 'control' as const,
      text: 'Write closed-loop PID motor control firmware, set thruster PWM to 3450 RPM, and align vector gimbal servo to 135 degrees.',
    },
    {
      label: 'Wireless Mesh Protocol',
      mode: 'write' as const,
      text: 'Write low-latency wireless ESP-NOW / UDP telemetry transceiver firmware with packet sequence counters and RF carrier gain.',
    },
    {
      label: 'Audit & Fix Bugs',
      mode: 'debug' as const,
      text: 'Debug and fix any missing semicolons, blocking delays, or uninitialized pins in the current sketch and verify pin mappings.',
    },
  ];

  const runAiArchitect = async (overridePrompt?: string, overrideMode?: 'write' | 'debug' | 'control') => {
    const activePrompt = (overridePrompt ?? prompt).trim();
    const activeMode = overrideMode ?? mode;

    if (!activePrompt) {
      setErrorMsg('Enter an instruction for the AI Firmware Architect or choose a preset below.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: activeMode,
          prompt: activePrompt,
          currentCode,
          boardId,
          transport,
          pinStates: pins,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Architect request failed (${response.status})`);
      }

      const data = (await response.json()) as AiArchitectResponse;
      setLastResult(data);
      onApplyAiResult(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach AI Firmware Architect service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      aria-label="AI Firmware Architect and Hardware Controller"
      className="bg-[#0A0D1A] border border-violet-500/30 rounded-lg p-5 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">
            AI Firmware Architect & Board Copilot
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthesize C++ sketches, debug syntax/timing errors, and autonomously actuate MCU pins
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#05060B] border border-slate-800 rounded-lg" role="group" aria-label="AI Operation Mode">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'write'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Write Code</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('debug')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'debug'
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Debug Sketch</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('control')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'control'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Control Board</span>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {quickPrompts.map((qp) => (
          <button
            key={qp.label}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setMode(qp.mode);
              setPrompt(qp.text);
              runAiArchitect(qp.text, qp.mode);
            }}
            className="px-3 py-1.5 text-xs font-medium text-violet-200 bg-violet-950/35 border border-violet-500/30 rounded-md hover:bg-violet-900/50 hover:border-violet-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Natural Language Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runAiArchitect();
        }}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <label htmlFor="ai-architect-prompt" className="sr-only">
          Describe firmware logic, debugging goal, or board control command
        </label>
        <input
          id="ai-architect-prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Write PID motor control code, set PWM thruster to 3450 RPM, and angle servo to 135°..."
          className="flex-1 px-3.5 py-2 text-xs bg-[#05060B] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 shadow-[0_0_16px_rgba(124,58,237,0.35)]"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Synthesizing...' : 'Execute AI Command'}</span>
        </button>
      </form>

      {errorMsg && (
        <div role="alert" className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 px-3 py-2 rounded-md">
          {errorMsg}
        </div>
      )}

      {/* AI Execution & Diagnostic Output */}
      {lastResult && (
        <div className="bg-[#060811] border border-slate-800/90 rounded-lg p-3.5 flex flex-col gap-3 text-xs">
          <div className="flex items-start gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-violet-300">AI Architect Report: </span>
              <span>{lastResult.explanation}</span>
            </div>
          </div>

          {lastResult.boardActions && lastResult.boardActions.length > 0 && (
            <div className="border-t border-slate-800/80 pt-2.5">
              <div className="text-[11px] font-mono text-slate-400 mb-1.5">
                AUTONOMOUS HARDWARE ACTIONS DISPATCHED:
              </div>
              <div className="flex flex-wrap gap-2">
                {lastResult.boardActions.map((act, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono text-blue-200 bg-blue-950/40 border border-blue-500/30 px-2.5 py-1 rounded"
                  >
                    Pin {act.pinNumber} ({act.mode} = {act.value}) · {act.summary}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lastResult.diagnostics && lastResult.diagnostics.length > 0 && (
            <div className="border-t border-slate-800/80 pt-2.5 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400">
                CODE DIAGNOSTICS & OPTIMIZATIONS:
              </div>
              {lastResult.diagnostics.map((diag, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-[11px]">
                  <Wrench className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <span>
                    [Line {diag.line}] {diag.message} — <span className="text-emerald-300">{diag.fix}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
