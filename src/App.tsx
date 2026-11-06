import React, { useState, useEffect, useRef } from 'react';
import {
  BOARD_SPECS,
  FIRMWARE_TEMPLATES,
  analyzeAndCompileSketch,
  executeSerialCommand,
  validateConnectionConfig,
  type ConnectionConfig,
  type PinState,
  type SensorTelemetry,
  type FirmwareTemplate,
} from './utils/mcuEngine';
import { TopBar, type WorkspaceSection } from './components/TopBar';
import { ConnectionBanner } from './components/ConnectionBanner';
import { CodeEditorWorkbench } from './components/CodeEditorWorkbench';
import { AiArchitectPanel, type AiArchitectResponse } from './components/AiArchitectPanel';
import { BoardPinoutPanel } from './components/BoardPinoutPanel';
import {
  SerialTelemetryTray,
  type SerialLogEntry,
  type TelemetrySample,
} from './components/SerialTelemetryTray';

function formatTime(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
}

export default function App() {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('workspace');
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig>({
    boardId: 'esp32',
    transport: 'usb',
    baudRate: 115200,
    usbPort: '/dev/ttyUSB0',
    wifiIp: '192.168.1.142',
    wifiSsid: 'SINGULARITY-LAB-5G',
    lanHost: 'esp32-horizon.local',
    lanPort: 4210,
    lanProtocol: 'UDP',
    bleDeviceName: 'ESP32-SINGULARITY-GATT',
    bleServiceUuid: '4fafc201-1fb5-459e-8fcc-c5c9c331914b',
  });

  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [linkSettingsExpanded, setLinkSettingsExpanded] = useState<boolean>(false);

  const [code, setCode] = useState<string>(FIRMWARE_TEMPLATES[0].code);
  const [compileResult, setCompileResult] = useState(() =>
    analyzeAndCompileSketch(FIRMWARE_TEMPLATES[0].code, 'esp32')
  );
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [flashProgress, setFlashProgress] = useState<number>(0);
  const [lastFlashHash, setLastFlashHash] = useState<string>(compileResult.binaryHash);

  const [pins, setPins] = useState<PinState[]>(() =>
    BOARD_SPECS.esp32.defaultPins.map((p) => ({ ...p }))
  );

  const [sensors, setSensors] = useState<SensorTelemetry>({
    temperatureC: 24.8,
    pressureHPa: 1013.2,
    magneticFluxUT: 48.5,
    motorRpm: 2850,
    supplyVoltageV: 3.32,
    signalRssiDbm: -44,
  });

  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([
    {
      id: 'init-1',
      timestamp: '00:00:00.120',
      direction: 'SYS',
      payload: 'Singularity MCU Studio Link Locked: ESP32-S3 DevKitC-1 via /dev/ttyUSB0 @ 115200 bps',
    },
    {
      id: 'init-2',
      timestamp: '00:00:00.240',
      direction: 'RX',
      payload: '{"event":"BOOT","node":"SINGULARITY-SENSOR-NODE","baud":115200,"flashHash":"0x9F4A2C11"}',
    },
  ]);

  const [isSerialPaused, setIsSerialPaused] = useState<boolean>(false);
  const [packetCount, setPacketCount] = useState<number>(142);

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>(() =>
    Array.from({ length: 24 }).map((_, i) => ({
      tick: i + 1,
      tempC: 24.2 + Math.sin(i * 0.3) * 1.4,
      rpm: 2800 + Math.cos(i * 0.25) * 120,
      fluxUT: 48.0 + Math.sin(i * 0.4) * 3.2,
    }))
  );

  const tickRef = useRef<number>(25);

  const appendSerialLog = (direction: 'RX' | 'TX' | 'SYS', payload: string) => {
    setSerialLogs((prev) => [
      ...prev.slice(-79),
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatTime(),
        direction,
        payload,
      },
    ]);
  };

  // Switch board defaults when boardId changes
  const handleChangeConfig = (next: ConnectionConfig) => {
    const boardChanged = next.boardId !== connectionConfig.boardId;
    setConnectionConfig(next);
    setConnectionError(null);

    if (boardChanged) {
      const nextDefaultPins = BOARD_SPECS[next.boardId].defaultPins.map((p) => ({ ...p }));
      setPins(nextDefaultPins);
      const nextCompile = analyzeAndCompileSketch(code, next.boardId);
      setCompileResult(nextCompile);
      appendSerialLog(
        'SYS',
        `Switched target architecture to ${BOARD_SPECS[next.boardId].name} (${BOARD_SPECS[next.boardId].mcu})`
      );
    }
  };

  const handleConnectToggle = () => {
    if (isConnected) {
      setIsConnected(false);
      appendSerialLog('SYS', 'Hardware transport link closed by operator.');
      return;
    }

    const validation = validateConnectionConfig(connectionConfig);
    if (!validation.valid) {
      setConnectionError(validation.error || 'Invalid transport configuration.');
      setLinkSettingsExpanded(true);
      return;
    }

    setConnectionError(null);
    setIsConnected(true);
    appendSerialLog(
      'SYS',
      `Connected to ${BOARD_SPECS[connectionConfig.boardId].name} over ${connectionConfig.transport.toUpperCase()} (${validation.endpointLabel})`
    );
  };

  // Periodic live telemetry & serial stream when connected and not paused
  useEffect(() => {
    if (!isConnected || isSerialPaused) return;

    const interval = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;

      setSensors((prev) => {
        const nextTemp = Number((prev.temperatureC + Math.sin(t * 0.35) * 0.15).toFixed(2));
        const nextFlux = Number((prev.magneticFluxUT + Math.cos(t * 0.4) * 0.4).toFixed(2));
        const nextRpm = Math.max(0, Math.round(prev.motorRpm + Math.sin(t * 0.5) * 12));

        setTelemetryHistory((hist) => [
          ...hist.slice(-39),
          {
            tick: t,
            tempC: nextTemp,
            rpm: nextRpm,
            fluxUT: nextFlux,
          },
        ]);

        if (t % 2 === 0) {
          setSerialLogs((logs) => [
            ...logs.slice(-79),
            {
              id: `rx-${t}-${Date.now()}`,
              timestamp: formatTime(),
              direction: 'RX',
              payload: `{"seq":${t},"tempC":${nextTemp.toFixed(2)},"rpm":${nextRpm},"fluxUT":${nextFlux.toFixed(1)},"link":"${connectionConfig.transport.toUpperCase()}"}`,
            },
          ]);
          setPacketCount((c) => c + 1);
        }

        return {
          ...prev,
          temperatureC: nextTemp,
          magneticFluxUT: nextFlux,
          motorRpm: nextRpm,
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isConnected, isSerialPaused, connectionConfig.transport]);

  const handleCompile = () => {
    const res = analyzeAndCompileSketch(code, connectionConfig.boardId);
    setCompileResult(res);
    if (res.success) {
      appendSerialLog(
        'SYS',
        `Compiler verified sketch: Flash ${res.flashUsedBytes}B (${res.flashPercent}%), SRAM ${res.sramUsedBytes}B (${res.sramPercent}%) [${res.binaryHash}]`
      );
    } else {
      appendSerialLog(
        'SYS',
        `Compiler error: ${res.diagnostics.map((d) => `Line ${d.line}: ${d.message}`).join(' | ')}`
      );
    }
  };

  const handleFlashToBoard = () => {
    const res = analyzeAndCompileSketch(code, connectionConfig.boardId);
    setCompileResult(res);
    if (!res.success) {
      appendSerialLog('SYS', 'Flash aborted: Resolve compiler syntax errors before flashing binary.');
      return;
    }

    setIsFlashing(true);
    setFlashProgress(25);
    appendSerialLog(
      'SYS',
      `Flashing binary ${res.binaryHash} (${res.flashUsedBytes} bytes) over ${connectionConfig.transport.toUpperCase()}...`
    );

    setTimeout(() => setFlashProgress(70), 180);
    setTimeout(() => {
      setFlashProgress(100);
      setIsFlashing(false);
      setLastFlashHash(res.binaryHash);

      // Synchronize detected pins from code onto the live board pinout
      if (res.detectedPins.length > 0) {
        setPins((prev) =>
          prev.map((pin) => {
            const found = res.detectedPins.find((dp) => dp.pinNumber === pin.number);
            if (!found) return pin;
            const nextMode =
              found.mode === 'PWM'
                ? 'PWM'
                : found.mode === 'INPUT'
                ? 'INPUT'
                : 'OUTPUT';
            return {
              ...pin,
              mode: nextMode,
              value: found.value !== undefined ? found.value : pin.value,
            };
          })
        );
      }

      appendSerialLog(
        'RX',
        `{"event":"FLASH_COMPLETE","hash":"${res.binaryHash}","board":"${connectionConfig.boardId}","status":"RUNNING"}`
      );
    }, 380);
  };

  const handleSelectTemplate = (template: FirmwareTemplate) => {
    setCode(template.code);
    const res = analyzeAndCompileSketch(template.code, connectionConfig.boardId);
    setCompileResult(res);
    setLastFlashHash(res.binaryHash);

    setPins((prev) =>
      prev.map((pin) => {
        const rec = template.recommendedPins.find((r) => r.pinNumber === pin.number);
        if (!rec) return pin;
        return {
          ...pin,
          mode: rec.mode,
          value: rec.value,
          connectedDevice: rec.device,
        };
      })
    );

    appendSerialLog('SYS', `Loaded firmware preset: ${template.title}`);
  };

  const handleUpdatePin = (pinNumber: number, mode: PinState['mode'], value: number) => {
    setPins((prev) =>
      prev.map((p) => (p.number === pinNumber ? { ...p, mode, value } : p))
    );

    if (mode === 'PWM' && (pinNumber === 12 || pinNumber === 3 || pinNumber === 5)) {
      const nextRpm = Math.round((value / 255) * 4200);
      setSensors((s) => ({ ...s, motorRpm: nextRpm }));
    }

    appendSerialLog(
      'TX',
      `DIRECT_IO -> Pin ${pinNumber} set to ${mode}=${value}`
    );
  };

  const handleUpdateSensor = (key: keyof SensorTelemetry, value: number) => {
    setSensors((prev) => {
      const next = { ...prev, [key]: value };
      setTelemetryHistory((hist) => [
        ...hist.slice(-39),
        {
          tick: ++tickRef.current,
          tempC: next.temperatureC,
          rpm: next.motorRpm,
          fluxUT: next.magneticFluxUT,
        },
      ]);
      return next;
    });
  };

  const handleResetPins = () => {
    const res = executeSerialCommand('RESET', pins, sensors);
    setPins(res.updatedPins);
    setSensors(res.updatedSensors);
    appendSerialLog('SYS', res.responseLine);
  };

  const handleSendSerialCommand = (rawCmd: string) => {
    appendSerialLog('TX', rawCmd);
    const result = executeSerialCommand(rawCmd, pins, sensors);
    setPins(result.updatedPins);
    setSensors(result.updatedSensors);
    appendSerialLog('RX', result.responseLine);
    setPacketCount((c) => c + 1);
  };

  const handleApplyAiResult = (result: AiArchitectResponse) => {
    if (result.code) {
      setCode(result.code);
      const comp = analyzeAndCompileSketch(result.code, connectionConfig.boardId);
      setCompileResult(comp);
      setLastFlashHash(comp.binaryHash);
    }

    if (result.boardActions && result.boardActions.length > 0) {
      setPins((prev) =>
        prev.map((p) => {
          const act = result.boardActions.find((a) => a.pinNumber === p.number);
          if (!act) return p;
          const validMode: PinState['mode'] =
            act.mode === 'PWM' || act.mode === 'SERVO' || act.mode === 'ADC' || act.mode === 'INPUT'
              ? act.mode
              : 'OUTPUT';
          return {
            ...p,
            mode: validMode,
            value: act.value,
          };
        })
      );

      const pwmAct = result.boardActions.find((a) => a.mode === 'PWM');
      if (pwmAct) {
        setSensors((s) => ({
          ...s,
          motorRpm: Math.round((pwmAct.value / 255) * 4200),
        }));
      }
    }

    appendSerialLog(
      'SYS',
      `AI Copilot updated firmware & executed ${result.boardActions?.length || 0} hardware actions.`
    );
  };

  const handleSelectNavSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (section === 'protocols') {
      setLinkSettingsExpanded(true);
      document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const targetId =
      section === 'workspace'
        ? 'section-workspace'
        : section === 'pinout'
        ? 'section-pinout'
        : 'section-telemetry';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div id="top" className="min-h-screen bg-[#05060B] text-slate-100 flex flex-col">
      {/* 1. Mandatory 3-Zone Top Bar */}
      <TopBar
        activeSection={activeSection}
        onSelectSection={handleSelectNavSection}
        isConnected={isConnected}
        onToggleConnectModal={() => setLinkSettingsExpanded((prev) => !prev)}
      />

      {/* 2. Hardware Link & Multi-Transport Header */}
      <ConnectionBanner
        config={connectionConfig}
        onChangeConfig={handleChangeConfig}
        isConnected={isConnected}
        onConnectToggle={handleConnectToggle}
        connectionError={connectionError}
        lastFlashHash={lastFlashHash}
        packetCount={packetCount}
        expanded={linkSettingsExpanded}
        onToggleExpand={() => setLinkSettingsExpanded((prev) => !prev)}
      />

      {/* 3. Main Asymmetric Split Console */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-5 flex flex-col gap-5">
        {/* Top Row: Left Code Editor & AI Copilot | Right Interactive Pinout & Actuator Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <div id="section-workspace" className="xl:col-span-7 flex flex-col gap-5">
            <AiArchitectPanel
              boardId={connectionConfig.boardId}
              transport={connectionConfig.transport}
              currentCode={code}
              pins={pins}
              onApplyAiResult={handleApplyAiResult}
            />

            <CodeEditorWorkbench
              code={code}
              onChangeCode={(next) => {
                setCode(next);
                setCompileResult(analyzeAndCompileSketch(next, connectionConfig.boardId));
              }}
              compileResult={compileResult}
              onCompile={handleCompile}
              onFlashToBoard={handleFlashToBoard}
              isFlashing={isFlashing}
              flashProgress={flashProgress}
              onSelectTemplate={handleSelectTemplate}
            />
          </div>

          <div id="section-pinout" className="xl:col-span-5">
            <BoardPinoutPanel
              boardId={connectionConfig.boardId}
              pins={pins}
              sensors={sensors}
              onUpdatePin={handleUpdatePin}
              onUpdateSensor={handleUpdateSensor}
              onResetPins={handleResetPins}
            />
          </div>
        </div>

        {/* Bottom Tray: Real-Time Serial Bus Monitor & Multi-Channel Telemetry Oscilloscope */}
        <div id="section-telemetry">
          <SerialTelemetryTray
            logs={serialLogs}
            telemetryHistory={telemetryHistory}
            isPaused={isSerialPaused}
            onTogglePause={() => setIsSerialPaused((prev) => !prev)}
            onClearLogs={() => setSerialLogs([])}
            onSendCommand={handleSendSerialCommand}
          />
        </div>
      </main>
    </div>
  );
}
