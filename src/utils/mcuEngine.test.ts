import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOARD_SPECS,
  FIRMWARE_TEMPLATES,
  validateConnectionConfig,
  analyzeAndCompileSketch,
  executeSerialCommand,
  type ConnectionConfig,
  type SensorTelemetry,
} from './mcuEngine';

test('validateConnectionConfig validates USB, Wi-Fi, LAN, and Bluetooth protocols accurately', () => {
  const baseConfig: ConnectionConfig = {
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
  };

  const usbRes = validateConnectionConfig(baseConfig);
  assert.equal(usbRes.valid, true);
  assert.match(usbRes.endpointLabel, /\/dev\/ttyUSB0 @ 115200 bps/);

  const badWifi = validateConnectionConfig({ ...baseConfig, transport: 'wifi', wifiIp: '999.1.1.1' });
  assert.equal(badWifi.valid, false);

  const goodWifi = validateConnectionConfig({ ...baseConfig, transport: 'wifi', wifiIp: '10.0.0.88' });
  assert.equal(goodWifi.valid, true);
  assert.match(goodWifi.endpointLabel, /ws:\/\/10\.0\.0\.88:81/);

  const goodLan = validateConnectionConfig({ ...baseConfig, transport: 'lan' });
  assert.equal(goodLan.valid, true);
  assert.equal(goodLan.endpointLabel, 'udp://esp32-horizon.local:4210');

  const goodBle = validateConnectionConfig({ ...baseConfig, transport: 'bluetooth' });
  assert.equal(goodBle.valid, true);
  assert.match(goodBle.endpointLabel, /BLE:\/\/ESP32-SINGULARITY-GATT/);
});

test('analyzeAndCompileSketch succeeds on valid firmware templates and extracts pins and baud rate', () => {
  const template = FIRMWARE_TEMPLATES[0];
  const res = analyzeAndCompileSketch(template.code, 'esp32');
  assert.equal(res.success, true);
  assert.equal(res.detectedBaudRate, 115200);
  assert.ok(res.flashUsedBytes > 0);
  assert.ok(res.detectedPins.some((p) => p.pinNumber === 2));
});

test('analyzeAndCompileSketch catches missing setup/loop and unbalanced braces', () => {
  const brokenCode = `
    void setup() {
      Serial.begin(115200);
      digitalWrite(2, HIGH)
  `;
  const res = analyzeAndCompileSketch(brokenCode, 'arduino_uno');
  assert.equal(res.success, false);
  assert.ok(res.diagnostics.some((d) => d.message.includes('void loop()')));
  assert.ok(res.diagnostics.some((d) => d.message.includes('Unbalanced curly braces')));
});

test('executeSerialCommand mutates GPIO, PWM, SERVO, and MOTOR states deterministically', () => {
  const initialPins = BOARD_SPECS.esp32.defaultPins.map((p) => ({ ...p }));
  const initialSensors: SensorTelemetry = {
    temperatureC: 24.5,
    pressureHPa: 1013.2,
    magneticFluxUT: 48.0,
    motorRpm: 1500,
    supplyVoltageV: 3.31,
    signalRssiDbm: -46,
  };

  const pinCmd = executeSerialCommand('PIN 2 LOW', initialPins, initialSensors);
  assert.equal(pinCmd.handled, true);
  assert.equal(pinCmd.updatedPins.find((p) => p.number === 2)?.value, 0);

  const pwmCmd = executeSerialCommand('PWM 12 255', pinCmd.updatedPins, pinCmd.updatedSensors);
  assert.equal(pwmCmd.handled, true);
  assert.equal(pwmCmd.updatedPins.find((p) => p.number === 12)?.value, 255);
  assert.equal(pwmCmd.updatedSensors.motorRpm, 4200);

  const servoCmd = executeSerialCommand('SERVO 13 165', pwmCmd.updatedPins, pwmCmd.updatedSensors);
  assert.equal(servoCmd.updatedPins.find((p) => p.number === 13)?.value, 165);
});
