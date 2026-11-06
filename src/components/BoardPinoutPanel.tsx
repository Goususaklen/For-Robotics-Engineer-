import React from 'react';
import {
  BOARD_SPECS,
  type BoardId,
  type PinState,
  type SensorTelemetry,
} from '../utils/mcuEngine';
import { Sliders, Zap, RotateCcw } from 'lucide-react';

interface BoardPinoutPanelProps {
  boardId: BoardId;
  pins: PinState[];
  sensors: SensorTelemetry;
  onUpdatePin: (pinNumber: number, mode: PinState['mode'], value: number) => void;
  onUpdateSensor: (key: keyof SensorTelemetry, value: number) => void;
  onResetPins: () => void;
}

export const BoardPinoutPanel: React.FC<BoardPinoutPanelProps> = ({
  boardId,
  pins,
  sensors,
  onUpdatePin,
  onUpdateSensor,
  onResetPins,
}) => {
  const spec = BOARD_SPECS[boardId];

  return (
    <div className="bg-[#0A0D1A] border border-slate-800/90 rounded-lg p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3.5">
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">
            Hardware Pinout & Actuator Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {spec.name} · {spec.mcu} · {spec.operatingVoltage} Logic Level
          </p>
        </div>

        <button
          type="button"
          onClick={onResetPins}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#11162B] border border-slate-700/80 rounded-md hover:border-violet-500/50 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Pin States</span>
        </button>
      </div>

      {/* Interactive SVG Board Architecture Schematic */}
      <div className="bg-[#060811] border border-slate-800/90 rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-3">
          <span>LIVE DIE TELEMETRY SCHEMATIC</span>
          <span>
            ACTIVE PINS: {pins.filter((p) => p.value > 0).length} / {pins.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {pins.map((pin) => {
            const isHigh = pin.mode === 'OUTPUT' && pin.value > 0;
            const isPwmActive = pin.mode === 'PWM' && pin.value > 0;
            const isServo = pin.mode === 'SERVO';

            return (
              <div
                key={pin.id}
                className={`p-3 rounded-md border transition-colors ${
                  isHigh || isPwmActive
                    ? 'bg-violet-950/25 border-violet-500/50'
                    : 'bg-[#0B0F1F] border-slate-800/90'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold font-mono text-slate-100">
                    {pin.id}
                  </span>
                  <span className="text-[11px] font-mono text-violet-300">
                    {pin.mode} ·{' '}
                    {pin.mode === 'OUTPUT' || pin.mode === 'INPUT'
                      ? pin.value > 0
                        ? 'HIGH (1)'
                        : 'LOW (0)'
                      : pin.mode === 'SERVO'
                      ? `${pin.value}°`
                      : pin.value}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 truncate mt-1">
                  {pin.connectedDevice || pin.label}
                </div>

                {/* Direct Interactive Hardware Controls */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  {(pin.mode === 'OUTPUT' || pin.mode === 'INPUT' || pin.mode === 'SERIAL') && (
                    <button
                      type="button"
                      aria-label={`Toggle ${pin.id}`}
                      onClick={() =>
                        onUpdatePin(pin.number, 'OUTPUT', pin.value > 0 ? 0 : 1)
                      }
                      className={`w-full py-1 px-2.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                        pin.value > 0
                          ? 'bg-violet-600 text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]'
                          : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pin.value > 0 ? 'Set LOW (0V)' : 'Drive HIGH'}
                    </button>
                  )}

                  {pin.mode === 'PWM' && (
                    <div className="w-full flex items-center gap-2">
                      <label htmlFor={`pwm-${pin.id}`} className="sr-only">
                        {pin.id} PWM Duty
                      </label>
                      <input
                        id={`pwm-${pin.id}`}
                        type="range"
                        min={0}
                        max={255}
                        value={pin.value}
                        onChange={(e) =>
                          onUpdatePin(pin.number, 'PWM', parseInt(e.target.value, 10))
                        }
                        className="w-full accent-violet-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-slate-300 w-9 text-right tabular-nums">
                        {Math.round((pin.value / 255) * 100)}%
                      </span>
                    </div>
                  )}

                  {isServo && (
                    <div className="w-full flex items-center gap-2">
                      <label htmlFor={`servo-${pin.id}`} className="sr-only">
                        {pin.id} Servo Angle
                      </label>
                      <input
                        id={`servo-${pin.id}`}
                        type="range"
                        min={0}
                        max={180}
                        value={pin.value}
                        onChange={(e) =>
                          onUpdatePin(pin.number, 'SERVO', parseInt(e.target.value, 10))
                        }
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-blue-300 w-9 text-right tabular-nums">
                        {pin.value}°
                      </span>
                    </div>
                  )}

                  {pin.mode === 'ADC' && (
                    <div className="w-full flex items-center gap-2">
                      <label htmlFor={`adc-${pin.id}`} className="sr-only">
                        {pin.id} Analog Input
                      </label>
                      <input
                        id={`adc-${pin.id}`}
                        type="range"
                        min={0}
                        max={boardId === 'esp32' ? 4095 : 1023}
                        value={pin.value}
                        onChange={(e) =>
                          onUpdatePin(pin.number, 'ADC', parseInt(e.target.value, 10))
                        }
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[11px] font-mono text-cyan-300 w-10 text-right tabular-nums">
                        {pin.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Physical Sensor Environment & Actuator Injection Sliders */}
      <div className="bg-[#060811] border border-slate-800/90 rounded-lg p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-3">
          <Sliders className="w-3.5 h-3.5 text-violet-400" />
          <span>Physical Sensor & Thruster Injection Bus</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[#0B0F1F] border border-slate-800/80 rounded-md p-2.5">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <label htmlFor="sensor-temp" className="text-slate-300 font-medium whitespace-nowrap">
                Core Temp (°C)
              </label>
              <span className="font-mono text-violet-300 tabular-nums whitespace-nowrap font-semibold">
                {sensors.temperatureC.toFixed(1)} °C
              </span>
            </div>
            <input
              id="sensor-temp"
              type="range"
              min={-20}
              max={85}
              step={0.5}
              value={sensors.temperatureC}
              onChange={(e) => onUpdateSensor('temperatureC', parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
          </div>

          <div className="bg-[#0B0F1F] border border-slate-800/80 rounded-md p-2.5">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <label htmlFor="sensor-rpm" className="text-slate-300 font-medium whitespace-nowrap">
                Motor Drive (RPM)
              </label>
              <span className="font-mono text-blue-300 tabular-nums whitespace-nowrap font-semibold">
                {Math.round(sensors.motorRpm)} RPM
              </span>
            </div>
            <input
              id="sensor-rpm"
              type="range"
              min={0}
              max={5000}
              step={50}
              value={sensors.motorRpm}
              onChange={(e) => onUpdateSensor('motorRpm', parseFloat(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="bg-[#0B0F1F] border border-slate-800/80 rounded-md p-2.5">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <label htmlFor="sensor-flux" className="text-slate-300 font-medium whitespace-nowrap">
                Hall Flux (µT)
              </label>
              <span className="font-mono text-cyan-300 tabular-nums whitespace-nowrap font-semibold">
                {sensors.magneticFluxUT.toFixed(1)} µT
              </span>
            </div>
            <input
              id="sensor-flux"
              type="range"
              min={10}
              max={150}
              step={1}
              value={sensors.magneticFluxUT}
              onChange={(e) => onUpdateSensor('magneticFluxUT', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="bg-[#0B0F1F] border border-slate-800/80 rounded-md p-2.5">
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
              <label htmlFor="sensor-pressure" className="text-slate-300 font-medium whitespace-nowrap">
                Barometric (hPa)
              </label>
              <span className="font-mono text-emerald-300 tabular-nums whitespace-nowrap font-semibold">
                {sensors.pressureHPa.toFixed(1)} hPa
              </span>
            </div>
            <input
              id="sensor-pressure"
              type="range"
              min={950}
              max={1060}
              step={0.5}
              value={sensors.pressureHPa}
              onChange={(e) => onUpdateSensor('pressureHPa', parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
