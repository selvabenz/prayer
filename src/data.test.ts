import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { initial, parseBackup, readData, writeData, type Prayer } from './data';

const prayer: Prayer = { id: 'a', title: 'Family', body: 'Peace', category: 'Family', status: 'Ongoing', priority: false, created: new Date().toISOString(), updated: new Date().toISOString(), updates: [], recurrence: 'Daily', date: '' };
beforeEach(async () => { await writeData(structuredClone(initial)); });
describe('private storage and recovery', () => {
  it('persists prayers, their history, and Tamil journal text across reads', async () => {
    const data = structuredClone(initial);
    data.prayers.push({ ...prayer, updates: [{ id: 'u', text: 'A good conversation', date: prayer.created }] });
    data.entries.push({ id: 'e', title: 'நன்றி', body: 'என் குடும்பத்திற்காக நன்றி', mood: 'Grateful', created: prayer.created });
    await writeData(data);
    expect(await readData()).toEqual(data);
  });
  it('round trips a full backup without changing Scripture or user text', () => {
    const data = { ...structuredClone(initial), prayers: [prayer] };
    expect(parseBackup(JSON.stringify({ version: 1, data }))).toEqual(data);
  });
  it.each([{ version: 4, data: initial }, { version: 1, data: { ...initial, prayers: [{...prayer, status: 'Public'}] } }, { version: 1, data: { ...initial, prayers: [prayer, prayer] } }, { version: 1, data: {...initial, settings: {language: 'xx'}} }])('rejects malformed backups before replacing records', backup => {
    expect(() => parseBackup(JSON.stringify(backup))).toThrow();
  });
});
