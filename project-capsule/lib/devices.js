// Device registry for multi-machine setups (e.g. multiple Mac minis via Tailscale).
// v1: metadata only — online/offline is derived from a client ping endpoint (optional).
const { readJSON, writeJSON } = require('./storage');

function loadDevices() {
  return readJSON('devices.json', []);
}
function saveDevices(devices) {
  writeJSON('devices.json', devices);
}
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function listDevices() {
  return loadDevices();
}

function addDevice(input) {
  const device = {
    id: newId(),
    name: input.name || 'Naamloze machine',
    role: input.role || 'general',
    host: input.host || '',            // e.g. "regie-mini.tail-xxxx.ts.net"
    port: input.port || 4321,
    notes: input.notes || '',
    projectIds: input.projectIds || [],
    lastSeen: null,
    createdAt: new Date().toISOString(),
  };
  const list = loadDevices();
  list.push(device);
  saveDevices(list);
  return device;
}

function updateDevice(id, patch) {
  const list = loadDevices();
  const i = list.findIndex((d) => d.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch, id };
  saveDevices(list);
  return list[i];
}

function removeDevice(id) {
  const list = loadDevices().filter((d) => d.id !== id);
  saveDevices(list);
}

function markSeen(id) {
  return updateDevice(id, { lastSeen: new Date().toISOString() });
}

module.exports = { listDevices, addDevice, updateDevice, removeDevice, markSeen };
