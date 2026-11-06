export type BoardId = 'esp32' | 'arduino_uno';
export type TransportType = 'usb' | 'wifi' | 'lan' | 'bluetooth';

export interface PinState {
  id: string;
  number: number;
  label: string;
  capabilities: ('GPIO' | 'PWM' | 'ADC' | 'I2C' | 'SPI' | 'UART' | 'DAC')[];
  mode: 'INPUT' | 'OUTPUT' | 'PWM' | 'ADC' | 'SERVO' | 'SERIAL';
  value: number; // 0 or 1 for digital, 0-255 for PWM, 0-180 for SERVO, 0-4095 for ADC
  connectedDevice?: string;
}

export interface BoardSpec {
  id: BoardId;
  name: string;
  mcu: string;
  architecture: string;
  clockMHz: number;
  flashKB: number;
  sramKB: number;
  operatingVoltage: string;
  supportedTransports: TransportType[];
  defaultPins: PinState[];
}

export interface ConnectionConfig {
  boardId: BoardId;
  transport: TransportType;
  baudRate: number;
  usbPort: string;
  wifiIp: string;
  wifiSsid: string;
  lanHost: string;
  lanPort: number;
  lanProtocol: 'TCP' | 'UDP';
  bleDeviceName: string;
  bleServiceUuid: string;
}

export interface CompileDiagnostic {
  line: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface CompileResult {
  success: boolean;
  boardId: BoardId;
  flashUsedBytes: number;
  flashTotalBytes: number;
  flashPercent: number;
  sramUsedBytes: number;
  sramTotalBytes: number;
  sramPercent: number;
  diagnostics: CompileDiagnostic[];
  detectedPins: { pinNumber: number; mode: string; value?: number }[];
  detectedBaudRate: number | null;
  binaryHash: string;
}

export interface SensorTelemetry {
  temperatureC: number;
  pressureHPa: number;
  magneticFluxUT: number;
  motorRpm: number;
  supplyVoltageV: number;
  signalRssiDbm: number;
}

export interface FirmwareTemplate {
  id: string;
  title: string;
  category: 'Sensor Logging' | 'Motor Control' | 'Wireless Protocol' | 'Autonomous AI';
  supportedBoards: BoardId[];
  description: string;
  code: string;
  recommendedPins: { pinNumber: number; mode: PinState['mode']; value: number; device: string }[];
}

export const BOARD_SPECS: Record<BoardId, BoardSpec> = {
  esp32: {
    id: 'esp32',
    name: 'ESP32-S3 DevKitC-1',
    mcu: 'Xtensa Dual-Core 32-bit LX7',
    architecture: 'Xtensa LX7 @ 240 MHz',
    clockMHz: 240,
    flashKB: 1310,
    sramKB: 320,
    operatingVoltage: '3.3V',
    supportedTransports: ['usb', 'wifi', 'lan', 'bluetooth'],
    defaultPins: [
      { id: 'GPIO2', number: 2, label: 'GPIO 2 (Onboard LED)', capabilities: ['GPIO', 'PWM', 'ADC'], mode: 'OUTPUT', value: 1, connectedDevice: 'Status LED (Violet)' },
      { id: 'GPIO4', number: 4, label: 'GPIO 4 (ADC1_CH3)', capabilities: ['GPIO', 'ADC', 'PWM'], mode: 'ADC', value: 2480, connectedDevice: 'BME280 Temp/Baro' },
      { id: 'GPIO5', number: 5, label: 'GPIO 5 (SPI CS)', capabilities: ['GPIO', 'SPI', 'PWM'], mode: 'OUTPUT', value: 1, connectedDevice: 'MicroSD Logger CS' },
      { id: 'GPIO12', number: 12, label: 'GPIO 12 (PWM Ch0)', capabilities: ['GPIO', 'PWM', 'ADC'], mode: 'PWM', value: 192, connectedDevice: 'BLDC Gimbal Thruster' },
      { id: 'GPIO13', number: 13, label: 'GPIO 13 (PWM Ch1)', capabilities: ['GPIO', 'PWM'], mode: 'SERVO', value: 115, connectedDevice: 'Horizon Vector Servo' },
      { id: 'GPIO14', number: 14, label: 'GPIO 14 (Hall Sensor)', capabilities: ['GPIO', 'ADC'], mode: 'ADC', value: 1850, connectedDevice: 'Hall Flux Probe' },
      { id: 'GPIO18', number: 18, label: 'GPIO 18 (SPI SCK)', capabilities: ['GPIO', 'SPI'], mode: 'OUTPUT', value: 0, connectedDevice: 'SPI Clock Bus' },
      { id: 'GPIO21', number: 21, label: 'GPIO 21 (I2C SDA)', capabilities: ['GPIO', 'I2C'], mode: 'SERIAL', value: 1, connectedDevice: 'I2C Telemetry Bus SDA' },
      { id: 'GPIO22', number: 22, label: 'GPIO 22 (I2C SCL)', capabilities: ['GPIO', 'I2C'], mode: 'SERIAL', value: 1, connectedDevice: 'I2C Telemetry Bus SCL' },
      { id: 'GPIO25', number: 25, label: 'GPIO 25 (DAC1)', capabilities: ['GPIO', 'DAC', 'PWM'], mode: 'PWM', value: 128, connectedDevice: 'Field Coil Exciter' },
      { id: 'GPIO32', number: 32, label: 'GPIO 32 (ADC1_CH4)', capabilities: ['GPIO', 'ADC'], mode: 'ADC', value: 3120, connectedDevice: 'Bus Voltage Divider' },
      { id: 'GPIO34', number: 34, label: 'GPIO 34 (Input Only)', capabilities: ['GPIO', 'ADC'], mode: 'INPUT', value: 1, connectedDevice: 'Optical Encoder A' },
    ],
  },
  arduino_uno: {
    id: 'arduino_uno',
    name: 'Arduino UNO R3 / R4 WiFi',
    mcu: 'ATmega328P / Renesas RA4M1',
    architecture: 'AVR 8-bit / Cortex-M4 @ 16-48 MHz',
    clockMHz: 16,
    flashKB: 32,
    sramKB: 2,
    operatingVoltage: '5.0V',
    supportedTransports: ['usb', 'wifi', 'lan', 'bluetooth'],
    defaultPins: [
      { id: 'D2', number: 2, label: 'D2 (INT0 Interrupt)', capabilities: ['GPIO'], mode: 'INPUT', value: 1, connectedDevice: 'Tachometer Pulse In' },
      { id: 'D3', number: 3, label: 'D3 (PWM Timer2)', capabilities: ['GPIO', 'PWM'], mode: 'PWM', value: 160, connectedDevice: 'H-Bridge Enable A' },
      { id: 'D5', number: 5, label: 'D5 (PWM Timer0)', capabilities: ['GPIO', 'PWM'], mode: 'PWM', value: 210, connectedDevice: 'Cooling Fan PWM' },
      { id: 'D6', number: 6, label: 'D6 (PWM Timer0)', capabilities: ['GPIO', 'PWM'], mode: 'OUTPUT', value: 0, connectedDevice: 'Relay Interlock' },
      { id: 'D9', number: 9, label: 'D9 (PWM Timer1)', capabilities: ['GPIO', 'PWM'], mode: 'SERVO', value: 90, connectedDevice: 'Azimuth Servo Actuator' },
      { id: 'D10', number: 10, label: 'D10 (SPI SS / PWM)', capabilities: ['GPIO', 'PWM', 'SPI'], mode: 'OUTPUT', value: 1, connectedDevice: 'SD Card CS' },
      { id: 'D13', number: 13, label: 'D13 (SCK / Builtin LED)', capabilities: ['GPIO', 'SPI'], mode: 'OUTPUT', value: 1, connectedDevice: 'Built-in LED L' },
      { id: 'A0', number: 14, label: 'A0 (ADC Ch0)', capabilities: ['ADC', 'GPIO'], mode: 'ADC', value: 642, connectedDevice: 'Thermistor Probe' },
      { id: 'A1', number: 15, label: 'A1 (ADC Ch1)', capabilities: ['ADC', 'GPIO'], mode: 'ADC', value: 512, connectedDevice: 'Current Shunt Sensor' },
      { id: 'A4', number: 18, label: 'A4 (I2C SDA)', capabilities: ['I2C', 'ADC', 'GPIO'], mode: 'SERIAL', value: 1, connectedDevice: 'OLED / Sensor SDA' },
      { id: 'A5', number: 19, label: 'A5 (I2C SCL)', capabilities: ['I2C', 'ADC', 'GPIO'], mode: 'SERIAL', value: 1, connectedDevice: 'OLED / Sensor SCL' },
    ],
  },
};

export const FIRMWARE_TEMPLATES: FirmwareTemplate[] = [
  {
    id: 'sensor_logging',
    title: 'Multi-Sensor Data Logging & Telemetry Stream',
    category: 'Sensor Logging',
    supportedBoards: ['esp32', 'arduino_uno'],
    description: 'High-precision I2C BME280 environmental & magnetic flux data logger with JSON serial framing and non-volatile flash ring buffer.',
    recommendedPins: [
      { pinNumber: 2, mode: 'OUTPUT', value: 1, device: 'Status LED (Violet)' },
      { pinNumber: 4, mode: 'ADC', value: 2650, device: 'BME280 Temp/Baro' },
      { pinNumber: 5, mode: 'OUTPUT', value: 1, device: 'MicroSD Logger CS' },
    ],
    code: `#include <Wire.h>
#include <SPI.h>

// Singularity Telemetry Frame Configuration
#define STATUS_LED_PIN 2
#define SENSOR_ADC_PIN 4
#define SD_CS_PIN 5
#define LOG_INTERVAL_MS 100

unsigned long lastSampleTick = 0;
uint32_t packetSequence = 0;

struct TelemetryPacket {
  float temperatureC;
  float pressureHPa;
  float magneticFluxUT;
  uint16_t rawAdc;
};

void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(STATUS_LED_PIN, OUTPUT);
  pinMode(SD_CS_PIN, OUTPUT);
  pinMode(SENSOR_ADC_PIN, INPUT);

  digitalWrite(STATUS_LED_PIN, HIGH);
  digitalWrite(SD_CS_PIN, HIGH);

  Serial.println("{\"event\":\"BOOT\",\"node\":\"SINGULARITY-SENSOR-NODE\",\"baud\":115200}");
}

void loop() {
  unsigned long now = millis();
  if (now - lastSampleTick >= LOG_INTERVAL_MS) {
    lastSampleTick = now;
    packetSequence++;

    uint16_t adcRaw = analogRead(SENSOR_ADC_PIN);
    float tempC = 22.4f + (adcRaw / 4095.0f) * 8.5f;
    float pressure = 1013.25f + sin(packetSequence * 0.1f) * 2.4f;

    // Blink status indicator on packet transmit
    digitalWrite(STATUS_LED_PIN, packetSequence % 2 == 0 ? HIGH : LOW);

    Serial.print("{\"seq\":");
    Serial.print(packetSequence);
    Serial.print(",\"tempC\":");
    Serial.print(tempC, 2);
    Serial.print(",\"hPa\":");
    Serial.print(pressure, 2);
    Serial.print(",\"adc\":");
    Serial.print(adcRaw);
    Serial.println("}");
  }
}`
  },
  {
    id: 'motor_control',
    title: 'Closed-Loop PID Motor & Gimbal Vector Control',
    category: 'Motor Control',
    supportedBoards: ['esp32', 'arduino_uno'],
    description: 'Hardware PWM thruster & servo gimbal controller with proportional-integral-derivative (PID) stabilization and current overload cutoff.',
    recommendedPins: [
      { pinNumber: 12, mode: 'PWM', value: 215, device: 'BLDC Gimbal Thruster' },
      { pinNumber: 13, mode: 'SERVO', value: 135, device: 'Horizon Vector Servo' },
      { pinNumber: 2, mode: 'OUTPUT', value: 1, device: 'Drive Enable LED' },
    ],
    code: `#include <Arduino.h>

// Closed-Loop PID Motor & Gimbal Control
#define MOTOR_PWM_PIN 12
#define SERVO_VECTOR_PIN 13
#define ENABLE_LED_PIN 2
#define ENCODER_PIN 34

float kp = 1.85f;
float ki = 0.12f;
float kd = 0.45f;

float targetRpm = 3200.0f;
float integralError = 0.0f;
float prevError = 0.0f;
unsigned long lastControlTick = 0;

void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PWM_PIN, OUTPUT);
  pinMode(SERVO_VECTOR_PIN, OUTPUT);
  pinMode(ENABLE_LED_PIN, OUTPUT);
  pinMode(ENCODER_PIN, INPUT);

  digitalWrite(ENABLE_LED_PIN, HIGH);
  analogWrite(MOTOR_PWM_PIN, 195);

  Serial.println("{\"event\":\"PID_INIT\",\"targetRpm\":3200,\"kp\":1.85,\"ki\":0.12,\"kd\":0.45}");
}

void loop() {
  unsigned long now = millis();
  if (now - lastControlTick >= 50) {
    float dt = (now - lastControlTick) / 1000.0f;
    lastControlTick = now;

    float measuredRpm = 3120.0f + (analogRead(ENCODER_PIN) * 0.04f);
    float error = targetRpm - measuredRpm;
    integralError += error * dt;
    float derivative = (error - prevError) / dt;
    prevError = error;

    int pwmOutput = constrain((int)(180 + kp * error * 0.1f + ki * integralError + kd * derivative), 0, 255);
    analogWrite(MOTOR_PWM_PIN, pwmOutput);

    Serial.print("{\"mode\":\"PID_LOCK\",\"rpm\":");
    Serial.print(measuredRpm, 1);
    Serial.print(",\"pwm\":");
    Serial.print(pwmOutput);
    Serial.println("}");
  }
}`
  },
  {
    id: 'wireless_mesh',
    title: 'ESP-NOW & Wi-Fi UDP Low-Latency Telemetry Bridge',
    category: 'Wireless Protocol',
    supportedBoards: ['esp32', 'arduino_uno'],
    description: 'Bi-directional wireless packet transceiver supporting Wi-Fi OTA command injection, LAN UDP broadcast, and BLE GATT fallback.',
    recommendedPins: [
      { pinNumber: 2, mode: 'OUTPUT', value: 1, device: 'RF Link Indicator' },
      { pinNumber: 25, mode: 'PWM', value: 164, device: 'Field Coil Exciter' },
    ],
    code: `#include <Arduino.h>

// Wireless Mesh & UDP Telemetry Transceiver
#define RF_STATUS_PIN 2
#define COIL_DAC_PIN 25
#define TELEMETRY_PORT 4210

uint32_t txFrames = 0;
uint32_t rxCommands = 0;
unsigned long lastBeacon = 0;

void setup() {
  Serial.begin(115200);
  pinMode(RF_STATUS_PIN, OUTPUT);
  pinMode(COIL_DAC_PIN, OUTPUT);

  digitalWrite(RF_STATUS_PIN, HIGH);
  analogWrite(COIL_DAC_PIN, 164);

  Serial.println("{\"event\":\"NET_READY\",\"protocol\":\"UDP_MESH\",\"port\":4210,\"rssi\":-48}");
}

void loop() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    rxCommands++;
    Serial.print("{\"ack\":\"CMD_EXEC\",\"rxCount\":");
    Serial.print(rxCommands);
    Serial.println("}");
  }

  if (millis() - lastBeacon >= 250) {
    lastBeacon = millis();
    txFrames++;
    digitalWrite(RF_STATUS_PIN, txFrames % 2);
    Serial.print("{\"beacon\":");
    Serial.print(txFrames);
    Serial.println(",\"link\":\"LOCKED\",\"latencyMs\":3.2}");
  }
}`
  }
];

export function validateConnectionConfig(config: ConnectionConfig): { valid: boolean; error?: string; endpointLabel: string } {
  const validBauds = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
  if (!validBauds.includes(config.baudRate)) {
    return { valid: false, error: `Unsupported baud rate ${config.baudRate} bps.`, endpointLabel: '' };
  }

  if (config.transport === 'usb') {
    if (!config.usbPort || config.usbPort.trim().length < 3) {
      return { valid: false, error: 'USB Serial port path is required (e.g., /dev/ttyUSB0 or COM3).', endpointLabel: '' };
    }
    return { valid: true, endpointLabel: `${config.usbPort.trim()} @ ${config.baudRate} bps` };
  }

  if (config.transport === 'wifi') {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(config.wifiIp.trim())) {
      return { valid: false, error: 'Enter a valid IPv4 address for Wi-Fi OTA (e.g., 192.168.1.142).', endpointLabel: '' };
    }
    const octets = config.wifiIp.trim().split('.').map(Number);
    if (octets.some((o) => o < 0 || o > 255)) {
      return { valid: false, error: 'IPv4 octets must be between 0 and 255.', endpointLabel: '' };
    }
    return { valid: true, endpointLabel: `ws://${config.wifiIp.trim()}:81 (${config.wifiSsid || 'WLAN'})` };
  }

  if (config.transport === 'lan') {
    if (!config.lanHost.trim()) {
      return { valid: false, error: 'LAN hostname or IP is required.', endpointLabel: '' };
    }
    if (!Number.isInteger(config.lanPort) || config.lanPort < 1 || config.lanPort > 65535) {
      return { valid: false, error: 'LAN port must be between 1 and 65535.', endpointLabel: '' };
    }
    return { valid: true, endpointLabel: `${config.lanProtocol.toLowerCase()}://${config.lanHost.trim()}:${config.lanPort}` };
  }

  if (config.transport === 'bluetooth') {
    if (!config.bleDeviceName.trim()) {
      return { valid: false, error: 'Bluetooth LE peripheral device name is required.', endpointLabel: '' };
    }
    return { valid: true, endpointLabel: `BLE://${config.bleDeviceName.trim()} [${config.bleServiceUuid.slice(0, 8)}]` };
  }

  return { valid: false, error: 'Unknown transport protocol.', endpointLabel: '' };
}

export function analyzeAndCompileSketch(code: string, boardId: BoardId): CompileResult {
  const spec = BOARD_SPECS[boardId];
  const diagnostics: CompileDiagnostic[] = [];
  const lines = code.split('\n');

  let openBraces = 0;
  let closeBraces = 0;
  let hasSetup = false;
  let hasLoop = false;
  let detectedBaudRate: number | null = null;
  const detectedPinsMap = new Map<number, { pinNumber: number; mode: string; value?: number }>();

  const defineMap = new Map<string, number>();

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const line = rawLine.replace(/\/\/.*$/, '').trim();
    if (!line) return;

    // Count braces
    for (const ch of line) {
      if (ch === '{') openBraces++;
      if (ch === '}') closeBraces++;
    }

    // Parse #define constants for pin mapping
    const defineMatch = line.match(/^#define\s+([A-Za-z_][A-Za-z0-9_]*)\s+(\d+)/);
    if (defineMatch) {
      defineMap.set(defineMatch[1], parseInt(defineMatch[2], 10));
    }

    if (/void\s+setup\s*\(/.test(line)) hasSetup = true;
    if (/void\s+loop\s*\(/.test(line)) hasLoop = true;

    const baudMatch = line.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
    if (baudMatch) {
      detectedBaudRate = parseInt(baudMatch[1], 10);
    }

    const resolvePin = (token: string): number | null => {
      const trimmed = token.trim();
      if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
      if (defineMap.has(trimmed)) return defineMap.get(trimmed)!;
      return null;
    };

    const pinModeMatch = line.match(/pinMode\s*\(\s*([^,]+)\s*,\s*([A-Z_]+)\s*\)/);
    if (pinModeMatch) {
      const p = resolvePin(pinModeMatch[1]);
      if (p !== null) {
        detectedPinsMap.set(p, { pinNumber: p, mode: pinModeMatch[2] });
      }
    }

    const digWriteMatch = line.match(/digitalWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (digWriteMatch) {
      const p = resolvePin(digWriteMatch[1]);
      if (p !== null) {
        const valToken = digWriteMatch[2].trim();
        const val = valToken === 'LOW' || valToken === '0' ? 0 : 1;
        detectedPinsMap.set(p, { pinNumber: p, mode: 'OUTPUT', value: val });
      }
    }

    const anaWriteMatch = line.match(/analogWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
    if (anaWriteMatch) {
      const p = resolvePin(anaWriteMatch[1]);
      if (p !== null) {
        const valNum = parseInt(anaWriteMatch[2].trim(), 10);
        detectedPinsMap.set(p, {
          pinNumber: p,
          mode: 'PWM',
          value: Number.isNaN(valNum) ? 180 : Math.max(0, Math.min(255, valNum)),
        });
      }
    }

    // Check obvious missing semicolon on common statements
    if (
      /^(pinMode|digitalWrite|analogWrite|Serial\.(begin|print|println)|delay)\s*\(.*\)$/.test(line) &&
      !line.endsWith(';')
    ) {
      diagnostics.push({
        line: lineNum,
        severity: 'error',
        message: `Missing semicolon ';' after statement on line ${lineNum}.`,
      });
    }

    if (/delay\s*\(\s*(\d+)\s*\)/.test(line)) {
      const delayMs = parseInt(line.match(/delay\s*\(\s*(\d+)\s*\)/)![1], 10);
      if (delayMs >= 1000) {
        diagnostics.push({
          line: lineNum,
          severity: 'warning',
          message: `Blocking delay(${delayMs}) detected; consider non-blocking millis() scheduling for real-time telemetry.`,
        });
      }
    }
  });

  if (!hasSetup) {
    diagnostics.push({
      line: 1,
      severity: 'error',
      message: 'Missing required Arduino entry point: void setup()',
    });
  }
  if (!hasLoop) {
    diagnostics.push({
      line: 1,
      severity: 'error',
      message: 'Missing required Arduino loop function: void loop()',
    });
  }
  if (openBraces !== closeBraces) {
    diagnostics.push({
      line: lines.length,
      severity: 'error',
      message: `Unbalanced curly braces: found ${openBraces} opening '{' and ${closeBraces} closing '}'.`,
    });
  }

  const hasErrors = diagnostics.some((d) => d.severity === 'error');
  const codeLength = code.trim().length;
  const flashTotalBytes = spec.flashKB * 1024;
  const sramTotalBytes = spec.sramKB * 1024;

  const baseFlash = boardId === 'esp32' ? 248320 : 4120;
  const flashUsedBytes = Math.min(flashTotalBytes, baseFlash + codeLength * 14);
  const flashPercent = Number(((flashUsedBytes / flashTotalBytes) * 100).toFixed(1));

  const baseSram = boardId === 'esp32' ? 28440 : 480;
  const sramUsedBytes = Math.min(sramTotalBytes, baseSram + detectedPinsMap.size * 48 + Math.floor(codeLength * 0.8));
  const sramPercent = Number(((sramUsedBytes / sramTotalBytes) * 100).toFixed(1));

  let hashAcc = 2166136261;
  for (let i = 0; i < code.length; i++) {
    hashAcc ^= code.charCodeAt(i);
    hashAcc = Math.imul(hashAcc, 16777619);
  }
  const binaryHash = `0x${(hashAcc >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;

  return {
    success: !hasErrors && codeLength > 0,
    boardId,
    flashUsedBytes,
    flashTotalBytes,
    flashPercent,
    sramUsedBytes,
    sramTotalBytes,
    sramPercent,
    diagnostics,
    detectedPins: Array.from(detectedPinsMap.values()),
    detectedBaudRate,
    binaryHash,
  };
}

export interface SerialCommandResult {
  handled: boolean;
  responseLine: string;
  updatedPins: PinState[];
  updatedSensors: SensorTelemetry;
}

export function executeSerialCommand(
  rawCommand: string,
  currentPins: PinState[],
  currentSensors: SensorTelemetry
): SerialCommandResult {
  const cmd = rawCommand.trim();
  const upper = cmd.toUpperCase();
  const parts = upper.split(/\s+/);

  const nextPins = currentPins.map((p) => ({ ...p }));
  const nextSensors = { ...currentSensors };

  if (parts[0] === 'STATUS' || parts[0] === 'PING') {
    const activeOutputs = nextPins.filter((p) => p.value > 0).length;
    return {
      handled: true,
      responseLine: `{"ack":"STATUS_OK","activePins":${activeOutputs},"tempC":${nextSensors.temperatureC.toFixed(1)},"rpm":${Math.round(nextSensors.motorRpm)},"vcc":${nextSensors.supplyVoltageV.toFixed(2)}}`,
      updatedPins: nextPins,
      updatedSensors: nextSensors,
    };
  }

  if (parts[0] === 'SCAN_I2C') {
    return {
      handled: true,
      responseLine: `{"ack":"I2C_SCAN","devices":["0x76 (BME280 Environmental)","0x3C (SSD1306 OLED)","0x68 (MPU6050 IMU)"]}`,
      updatedPins: nextPins,
      updatedSensors: nextSensors,
    };
  }

  if (parts[0] === 'RESET') {
    nextPins.forEach((p) => {
      if (p.mode === 'OUTPUT' || p.mode === 'PWM') p.value = 0;
      if (p.mode === 'SERVO') p.value = 90;
    });
    nextSensors.motorRpm = 0;
    return {
      handled: true,
      responseLine: `{"ack":"MCU_SOFT_RESET","state":"ALL_OUTPUTS_CLEARED"}`,
      updatedPins: nextPins,
      updatedSensors: nextSensors,
    };
  }

  // PIN <number> <HIGH|LOW|0|1>
  if (parts[0] === 'PIN' && parts.length >= 3) {
    const pinNum = parseInt(parts[1], 10);
    const val = parts[2] === 'HIGH' || parts[2] === '1' || parts[2] === 'ON' ? 1 : 0;
    const target = nextPins.find((p) => p.number === pinNum);
    if (target) {
      target.mode = 'OUTPUT';
      target.value = val;
      return {
        handled: true,
        responseLine: `{"ack":"GPIO_WRITE","pin":${pinNum},"label":"${target.id}","state":"${val ? 'HIGH' : 'LOW'}"}`,
        updatedPins: nextPins,
        updatedSensors: nextSensors,
      };
    }
    return {
      handled: false,
      responseLine: `{"err":"INVALID_PIN","message":"Pin ${pinNum} is not mapped on current board"}`,
      updatedPins: nextPins,
      updatedSensors: nextSensors,
    };
  }

  // PWM <number> <0-255>
  if (parts[0] === 'PWM' && parts.length >= 3) {
    const pinNum = parseInt(parts[1], 10);
    const duty = Math.max(0, Math.min(255, parseInt(parts[2], 10) || 0));
    const target = nextPins.find((p) => p.number === pinNum);
    if (target) {
      target.mode = 'PWM';
      target.value = duty;
      if (pinNum === 12 || pinNum === 3 || pinNum === 5) {
        nextSensors.motorRpm = Math.round((duty / 255) * 4200);
      }
      return {
        handled: true,
        responseLine: `{"ack":"PWM_SET","pin":${pinNum},"duty":${duty},"dutyPct":${((duty / 255) * 100).toFixed(1)}}`,
        updatedPins: nextPins,
        updatedSensors: nextSensors,
      };
    }
  }

  // SERVO <number> <0-180>
  if (parts[0] === 'SERVO' && parts.length >= 3) {
    const pinNum = parseInt(parts[1], 10);
    const angle = Math.max(0, Math.min(180, parseInt(parts[2], 10) || 90));
    const target = nextPins.find((p) => p.number === pinNum);
    if (target) {
      target.mode = 'SERVO';
      target.value = angle;
      return {
        handled: true,
        responseLine: `{"ack":"SERVO_VECTOR","pin":${pinNum},"angleDeg":${angle}}`,
        updatedPins: nextPins,
        updatedSensors: nextSensors,
      };
    }
  }

  // MOTOR <rpm>
  if (parts[0] === 'MOTOR' && parts.length >= 2) {
    const rpm = Math.max(0, Math.min(6000, parseFloat(parts[1]) || 0));
    nextSensors.motorRpm = rpm;
    const pwmPin = nextPins.find((p) => p.mode === 'PWM');
    if (pwmPin) {
      pwmPin.value = Math.min(255, Math.round((rpm / 4200) * 255));
    }
    return {
      handled: true,
      responseLine: `{"ack":"MOTOR_TARGET","targetRpm":${rpm},"pwmAssigned":${pwmPin ? pwmPin.value : 0}}`,
      updatedPins: nextPins,
      updatedSensors: nextSensors,
    };
  }

  return {
    handled: true,
    responseLine: `{"ack":"SERIAL_ECHO","cmd":${JSON.stringify(cmd)},"status":"PROCESSED"}`,
    updatedPins: nextPins,
    updatedSensors: nextSensors,
  };
}
