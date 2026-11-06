import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Activity, Send, Trash2, Pause, Play, Download } from 'lucide-react';

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'RX' | 'TX' | 'SYS';
  payload: string;
}

export interface TelemetrySample {
  tick: number;
  tempC: number;
  rpm: number;
  fluxUT: number;
}

interface SerialTelemetryTrayProps {
  logs: SerialLogEntry[];
  telemetryHistory: TelemetrySample[];
  isPaused: boolean;
  onTogglePause: () => void;
  onClearLogs: () => void;
  onSendCommand: (cmd: string) => void;
}

export const SerialTelemetryTray: React.FC<SerialTelemetryTrayProps> = ({
  logs,
  telemetryHistory,
  isPaused,
  onTogglePause,
  onClearLogs,
  onSendCommand,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPaused && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const filteredLogs = filterText.trim()
    ? logs.filter((l) => l.payload.toLowerCase().includes(filterText.toLowerCase()))
    : logs;

  const quickCommands = ['STATUS', 'SCAN_I2C', 'PIN 2 HIGH', 'PWM 12 220', 'SERVO 13 135', 'RESET'];

  const handleExportCsv = () => {
    const header = 'Tick,Temperature_C,Motor_RPM,MagneticFlux_uT\n';
    const rows = telemetryHistory
      .map((s) => `${s.tick},${s.tempC.toFixed(2)},${Math.round(s.rpm)},${s.fluxUT.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'singularity_telemetry.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build SVG polyline points for multi-channel oscilloscope
  const width = 560;
  const height = 175;
  const samples = telemetryHistory.slice(-40);

  const makePoints = (extractor: (s: TelemetrySample) => number, minVal: number, maxVal: number) => {
    if (samples.length === 0) return '';
    return samples
      .map((s, idx) => {
        const x = samples.length === 1 ? width / 2 : (idx / (samples.length - 1)) * (width - 24) + 12;
        const norm = Math.max(0, Math.min(1, (extractor(s) - minVal) / (maxVal - minVal || 1)));
        const y = height - 16 - norm * (height - 32);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const tempPoints = makePoints((s) => s.tempC, -20, 90);
  const rpmPoints = makePoints((s) => s.rpm, 0, 5000);
  const fluxPoints = makePoints((s) => s.fluxUT, 0, 160);

  const inspectedSample =
    hoverIndex !== null && samples[hoverIndex]
      ? samples[hoverIndex]
      : samples[samples.length - 1];

  return (
    <section
      aria-label="Real-Time Serial Monitor and Telemetry Oscilloscope"
      className="grid grid-cols-1 lg:grid-cols-12 gap-5"
    >
      {/* Left 7 Cols: Real-Time Serial Monitor & Command Console */}
      <div className="lg:col-span-7 bg-[#0A0D1A] border border-slate-800/90 rounded-lg flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#0D1122] border-b border-slate-800/90">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
              Real-Time Serial Bus Monitor
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="serial-filter-input" className="sr-only">
              Filter Serial Stream
            </label>
            <input
              id="serial-filter-input"
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter packets..."
              className="px-2.5 py-1 text-xs font-mono bg-[#05060B] border border-slate-800 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 w-36"
            />

            <button
              type="button"
              onClick={onTogglePause}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#070913] border border-slate-800 rounded hover:border-violet-500/40 cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              onClick={onClearLogs}
              aria-label="Clear Serial Monitor"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#070913] border border-slate-800 rounded hover:border-rose-500/40 hover:text-rose-300 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Quick Hardware Serial Commands */}
        <div className="px-4 py-2 bg-[#070913] border-b border-slate-800/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 mr-1">TX MACROS:</span>
          {quickCommands.map((qCmd) => (
            <button
              key={qCmd}
              type="button"
              onClick={() => onSendCommand(qCmd)}
              className="px-2 py-0.5 text-[11px] font-mono text-blue-300 bg-blue-950/30 border border-blue-500/30 rounded hover:bg-blue-900/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {qCmd}
            </button>
          ))}
        </div>

        {/* Serial Stream Output */}
        <div
          ref={logContainerRef}
          data-testid="serial-log-container"
          className="p-3.5 font-mono text-xs bg-[#04060C] h-56 overflow-y-auto space-y-1.5 tabular-nums"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <p>No serial packets matching current filter.</p>
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-slate-500 shrink-0">[{entry.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 ${
                    entry.direction === 'TX'
                      ? 'text-violet-400'
                      : entry.direction === 'SYS'
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {entry.direction}
                </span>
                <span className="text-slate-200 break-all">{entry.payload}</span>
              </div>
            ))
          )}
        </div>

        {/* Serial Command Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!commandInput.trim()) return;
            onSendCommand(commandInput);
            setCommandInput('');
          }}
          className="flex items-center gap-2 p-2.5 bg-[#080B16] border-t border-slate-800/90"
        >
          <label htmlFor="serial-command-input" className="sr-only">
            Serial Command Input
          </label>
          <input
            id="serial-command-input"
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Send UART/OTA Command (e.g. PIN 2 LOW, PWM 12 255, SERVO 13 90, STATUS)..."
            className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Transmit</span>
          </button>
        </form>
      </div>

      {/* Right 5 Cols: Multi-Channel Oscilloscope & Waveform Plotter */}
      <div className="lg:col-span-5 bg-[#0A0D1A] border border-slate-800/90 rounded-lg flex flex-col justify-between overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#0D1122] border-b border-slate-800/90">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
              Multi-Channel Telemetry Oscilloscope
            </h3>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#070913] border border-slate-800 rounded hover:border-violet-500/40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Live Telemetry KPI Readout Strip */}
        {inspectedSample && (
          <div className="grid grid-cols-3 border-b border-slate-800/80 bg-[#070913] divide-x divide-slate-800/80 text-center py-2 font-mono tabular-nums">
            <div className="px-2">
              <div className="text-[10px] text-slate-400">CH1 · TEMP</div>
              <div className="text-sm font-bold text-violet-300">
                {inspectedSample.tempC.toFixed(1)} <span className="text-[10px] text-slate-400">°C</span>
              </div>
            </div>
            <div className="px-2">
              <div className="text-[10px] text-slate-400">CH2 · THRUSTER</div>
              <div className="text-sm font-bold text-blue-300">
                {Math.round(inspectedSample.rpm)} <span className="text-[10px] text-slate-400">RPM</span>
              </div>
            </div>
            <div className="px-2">
              <div className="text-[10px] text-slate-400">CH3 · HALL FLUX</div>
              <div className="text-sm font-bold text-cyan-300">
                {inspectedSample.fluxUT.toFixed(1)} <span className="text-[10px] text-slate-400">µT</span>
              </div>
            </div>
          </div>
        )}

        {/* SVG Waveform Canvas */}
        <div className="p-3 bg-[#04060C] flex-1 flex flex-col justify-center">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 overflow-visible cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const idx = Math.min(samples.length - 1, Math.floor(relX * samples.length));
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Reference Grid Lines */}
            {[0.2, 0.5, 0.8].map((ratio, idx) => (
              <line
                key={idx}
                x1={0}
                y1={height * ratio}
                x2={width}
                y2={height * ratio}
                stroke="#1E293B"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            ))}

            {/* Channel 1: Temperature (Neon Violet) */}
            {tempPoints && (
              <polyline
                fill="none"
                stroke="#A855F7"
                strokeWidth="2"
                points={tempPoints}
              />
            )}

            {/* Channel 2: Motor RPM (Deep Blue) */}
            {rpmPoints && (
              <polyline
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2"
                points={rpmPoints}
              />
            )}

            {/* Channel 3: Magnetic Flux (Cyan) */}
            {fluxPoints && (
              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="1.75"
                strokeDasharray="5 3"
                points={fluxPoints}
              />
            )}
          </svg>
        </div>

        <div className="px-4 py-2 bg-[#080B16] border-t border-slate-800/90 flex items-center justify-between text-[11px] font-mono text-slate-400 tabular-nums">
          <span>SAMPLE WINDOW: 40 FRAMES (10 Hz)</span>
          <span>HOVER WAVEFORM TO PROBE</span>
        </div>
      </div>
    </section>
  );
};
