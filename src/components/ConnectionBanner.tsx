import React from 'react';
import {
  BOARD_SPECS,
  type BoardId,
  type ConnectionConfig,
  type TransportType,
  validateConnectionConfig,
} from '../utils/mcuEngine';
import { Cpu, Wifi, Usb, Radio, Bluetooth, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ConnectionBannerProps {
  config: ConnectionConfig;
  onChangeConfig: (next: ConnectionConfig) => void;
  isConnected: boolean;
  onConnectToggle: () => void;
  connectionError: string | null;
  lastFlashHash: string;
  packetCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  config,
  onChangeConfig,
  isConnected,
  onConnectToggle,
  connectionError,
  lastFlashHash,
  packetCount,
  expanded,
  onToggleExpand,
}) => {
  const board = BOARD_SPECS[config.boardId];
  const validation = validateConnectionConfig(config);

  const transports: { id: TransportType; label: string; icon: React.ReactNode; detail: string }[] = [
    { id: 'usb', label: 'USB Serial', icon: <Usb className="w-3.5 h-3.5" />, detail: 'UART / WebSerial' },
    { id: 'wifi', label: 'Wi-Fi OTA', icon: <Wifi className="w-3.5 h-3.5" />, detail: 'WebSocket 802.11n' },
    { id: 'lan', label: 'LAN Socket', icon: <Radio className="w-3.5 h-3.5" />, detail: 'TCP/UDP Stream' },
    { id: 'bluetooth', label: 'Bluetooth LE', icon: <Bluetooth className="w-3.5 h-3.5" />, detail: 'GATT Serial' },
  ];

  return (
    <section
      aria-label="Hardware Telemetry & Accretion Horizon Header"
      className="relative bg-[#080B16] border-b border-slate-800/90 px-6 py-4 overflow-hidden"
    >
      {/* Subtle Interstellar Blackhole Gravitational Lens SVG Background */}
      <div className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 opacity-35 hidden xl:block" aria-hidden="true">
        <svg width="340" height="140" viewBox="0 0 340 140" fill="none">
          <defs>
            <radialGradient id="eventHorizon" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="1" />
              <stop offset="38%" stopColor="#05060B" stopOpacity="1" />
              <stop offset="52%" stopColor="#7C3AED" stopOpacity="0.85" />
              <stop offset="72%" stopColor="#2563EB" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#05060B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="accretionDisk" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0" />
              <stop offset="25%" stopColor="#60A5FA" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#C4B5FD" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#8B5CF6" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle cx="170" cy="70" r="56" fill="url(#eventHorizon)" />
          <ellipse cx="170" cy="70" rx="155" ry="22" stroke="url(#accretionDisk)" strokeWidth="3.5" />
          <ellipse cx="170" cy="70" rx="120" ry="12" stroke="#A78BFA" strokeWidth="1.2" strokeDasharray="6 4" />
          <circle cx="170" cy="70" r="22" fill="#020307" stroke="#8B5CF6" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Board Selector & Active Link Telemetry */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-[#0D1224] border border-slate-800 rounded-lg">
            {(['esp32', 'arduino_uno'] as BoardId[]).map((id) => {
              const active = config.boardId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, boardId: id })}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(124,58,237,0.45)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{id === 'esp32' ? 'ESP32-S3 DevKitC' : 'Arduino UNO R3/WiFi'}</span>
                </button>
              );
            })}
          </div>

          {/* Transport Protocol Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#0D1224] border border-slate-800 rounded-lg" role="group" aria-label="Transport Protocol">
            {transports.map((t) => {
              const active = config.transport === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, transport: t.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600/30 text-blue-200 border border-blue-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0D1224] border border-slate-800 rounded-lg hover:border-violet-500/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {expanded ? 'Hide Link Settings' : 'Link Settings'}
          </button>
        </div>

        {/* Right: Unboxed Telemetry Readouts & Link Action */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 font-mono tabular-nums bg-[#05060B]/85 px-3.5 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {isConnected ? '● LINK LOCKED' : '▲ STANDBY'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-200">{validation.valid ? validation.endpointLabel : 'Invalid Endpoint'}</span>
            <span aria-hidden="true">·</span>
            <span>{board.clockMHz} MHz</span>
            <span aria-hidden="true">·</span>
            <span>FW {lastFlashHash}</span>
            <span aria-hidden="true">·</span>
            <span>RX {packetCount} pkts</span>
          </div>

          <button
            type="button"
            onClick={onConnectToggle}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isConnected
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {isConnected ? 'Disconnect Hardware' : 'Establish Link'}
          </button>
        </div>
      </div>

      {/* Expandable Transport Configuration Drawer */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4">
          {config.transport === 'usb' && (
            <div>
              <label htmlFor="usb-port-input" className="block text-xs font-medium text-slate-400 mb-1">
                USB Serial Device Path
              </label>
              <input
                id="usb-port-input"
                type="text"
                value={config.usbPort}
                onChange={(e) => onChangeConfig({ ...config, usbPort: e.target.value })}
                placeholder="/dev/ttyUSB0 or COM3"
                className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          {config.transport === 'wifi' && (
            <>
              <div>
                <label htmlFor="wifi-ip-input" className="block text-xs font-medium text-slate-400 mb-1">
                  Board Wi-Fi IPv4 Address
                </label>
                <input
                  id="wifi-ip-input"
                  type="text"
                  value={config.wifiIp}
                  onChange={(e) => onChangeConfig({ ...config, wifiIp: e.target.value })}
                  placeholder="192.168.1.142"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label htmlFor="wifi-ssid-input" className="block text-xs font-medium text-slate-400 mb-1">
                  Target WLAN SSID
                </label>
                <input
                  id="wifi-ssid-input"
                  type="text"
                  value={config.wifiSsid}
                  onChange={(e) => onChangeConfig({ ...config, wifiSsid: e.target.value })}
                  placeholder="SINGULARITY-LAB-5G"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </>
          )}

          {config.transport === 'lan' && (
            <>
              <div>
                <label htmlFor="lan-host-input" className="block text-xs font-medium text-slate-400 mb-1">
                  LAN Hostname / Static IP
                </label>
                <input
                  id="lan-host-input"
                  type="text"
                  value={config.lanHost}
                  onChange={(e) => onChangeConfig({ ...config, lanHost: e.target.value })}
                  placeholder="esp32-horizon.local"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label htmlFor="lan-port-input" className="block text-xs font-medium text-slate-400 mb-1">
                  Socket Port (TCP/UDP)
                </label>
                <input
                  id="lan-port-input"
                  type="number"
                  value={config.lanPort}
                  onChange={(e) => onChangeConfig({ ...config, lanPort: parseInt(e.target.value, 10) || 4210 })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </>
          )}

          {config.transport === 'bluetooth' && (
            <>
              <div>
                <label htmlFor="ble-name-input" className="block text-xs font-medium text-slate-400 mb-1">
                  BLE Peripheral Name
                </label>
                <input
                  id="ble-name-input"
                  type="text"
                  value={config.bleDeviceName}
                  onChange={(e) => onChangeConfig({ ...config, bleDeviceName: e.target.value })}
                  placeholder="ESP32-SINGULARITY-GATT"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label htmlFor="ble-uuid-input" className="block text-xs font-medium text-slate-400 mb-1">
                  GATT UART Service UUID
                </label>
                <input
                  id="ble-uuid-input"
                  type="text"
                  value={config.bleServiceUuid}
                  onChange={(e) => onChangeConfig({ ...config, bleServiceUuid: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor="baud-rate-select" className="block text-xs font-medium text-slate-400 mb-1">
              Baud Rate (bps)
            </label>
            <select
              id="baud-rate-select"
              value={config.baudRate}
              onChange={(e) => onChangeConfig({ ...config, baudRate: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-1.5 text-xs font-mono bg-[#05060B] border border-slate-800 rounded-md text-slate-100 focus:outline-none focus:border-violet-500"
            >
              {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) => (
                <option key={b} value={b}>
                  {b} bps
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-slate-400 font-mono">
              {validation.valid ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready: {validation.endpointLabel}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-400">
                  <AlertTriangle className="w-4 h-4" /> {validation.error}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {connectionError && (
        <div role="alert" className="mt-3 px-3 py-2 bg-rose-950/50 border border-rose-500/40 rounded-md text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{connectionError}</span>
        </div>
      )}
    </section>
  );
};
