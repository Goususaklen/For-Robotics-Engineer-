import React from 'react';
import {
  FIRMWARE_TEMPLATES,
  type CompileResult,
  type FirmwareTemplate,
} from '../utils/mcuEngine';
import { Play, Upload, CheckCircle2, AlertCircle, FileCode2 } from 'lucide-react';

interface CodeEditorWorkbenchProps {
  code: string;
  onChangeCode: (next: string) => void;
  compileResult: CompileResult;
  onCompile: () => void;
  onFlashToBoard: () => void;
  isFlashing: boolean;
  flashProgress: number;
  onSelectTemplate: (template: FirmwareTemplate) => void;
}

export const CodeEditorWorkbench: React.FC<CodeEditorWorkbenchProps> = ({
  code,
  onChangeCode,
  compileResult,
  onCompile,
  onFlashToBoard,
  isFlashing,
  flashProgress,
  onSelectTemplate,
}) => {
  const lineCount = code.split('\n').length;

  return (
    <section
      aria-label="Microcontroller C++ Firmware IDE"
      className="bg-[#0A0D1A] border border-slate-800/90 rounded-lg flex flex-col overflow-hidden"
    >
      {/* IDE Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0D1122] border-b border-slate-800/90">
        <div className="flex flex-wrap items-center gap-2">
          <FileCode2 className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-bold font-mono text-slate-200">
            singularity_firmware.ino
          </span>

          {/* Preset Templates Dropdown / Quick Buttons */}
          <div className="flex items-center gap-1.5 ml-2">
            {FIRMWARE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onSelectTemplate(tpl)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-[#070913] border border-slate-800 rounded hover:border-violet-500/50 hover:text-violet-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {tpl.category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCompile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#141A33] border border-slate-700 rounded-md hover:border-violet-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-violet-400" />
            <span>Verify & Compile</span>
          </button>

          <button
            type="button"
            disabled={isFlashing}
            onClick={onFlashToBoard}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(124,58,237,0.35)]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isFlashing ? `Flashing ${flashProgress}%` : 'Flash to Board'}</span>
          </button>
        </div>
      </div>

      {/* Flashing Progress Bar */}
      {isFlashing && (
        <div className="w-full h-1 bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-violet-500 transition-transform duration-150 origin-left"
            style={{ transform: `scaleX(${flashProgress / 100})` }}
          />
        </div>
      )}

      {/* Code Editor Canvas with Line Numbers */}
      <div className="relative flex font-mono text-xs bg-[#05070E] min-h-[340px] max-h-[420px] overflow-y-auto">
        <div
          aria-hidden="true"
          className="select-none py-3.5 px-3 text-right text-slate-600 bg-[#070A14] border-r border-slate-800/80 tabular-nums"
        >
          {Array.from({ length: lineCount }).map((_, idx) => (
            <div key={idx} className="leading-5">
              {idx + 1}
            </div>
          ))}
        </div>

        <label htmlFor="mcu-code-editor" className="sr-only">
          C++ Microcontroller Firmware Code Editor
        </label>
        <textarea
          id="mcu-code-editor"
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          spellCheck={false}
          className="w-full py-3.5 px-4 bg-transparent text-slate-100 leading-5 font-mono resize-none focus:outline-none selection:bg-violet-500/30"
          rows={Math.max(16, lineCount)}
        />
      </div>

      {/* Compiler & Memory Footprint Footer */}
      <div className="px-4 py-2.5 bg-[#080B16] border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-4 text-xs font-mono tabular-nums">
        <div className="flex items-center gap-2">
          {compileResult.success ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              BUILD NOMINAL ({compileResult.binaryHash})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              BUILD FAILED ({compileResult.diagnostics.filter((d) => d.severity === 'error').length} Errors)
            </span>
          )}

          {compileResult.diagnostics.length > 0 && (
            <span className="text-slate-400 truncate max-w-md">
              · Line {compileResult.diagnostics[0].line}: {compileResult.diagnostics[0].message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>
            FLASH: <strong className="text-slate-200">{compileResult.flashUsedBytes.toLocaleString()} B</strong> ({compileResult.flashPercent}%)
          </span>
          <span>·</span>
          <span>
            SRAM: <strong className="text-slate-200">{compileResult.sramUsedBytes.toLocaleString()} B</strong> ({compileResult.sramPercent}%)
          </span>
        </div>
      </div>
    </section>
  );
};
