import { openDB } from 'idb';
import { emptyExtras, validateExtras, type Extras } from './features-model';

export const categories = ['Family', 'Health', 'Personal', 'Church', 'Work', 'Missions', 'Thanksgiving'] as const;
export const statuses = ['Ongoing', 'Partially answered', 'Answered', 'Closed'] as const;
export type Category = typeof categories[number];
export type Status = typeof statuses[number];
export type PrayerUpdate = { id: string; text: string; date: string };
export type Prayer = { id: string; title: string; body: string; category: Category; status: Status; priority: boolean; created: string; updated: string; updates: PrayerUpdate[]; recurrence: 'Anytime' | 'Daily' | 'Weekly'; date: string; sharing?: 'private' | 'shareable'; praise?: string; answeredAt?: string };
export type Entry = { id: string; title: string; body: string; mood: string; created: string };
export type Session = { id: string; created: string; seconds: number };
export type Settings = { language: 'en' | 'ta'; dark: boolean; large: boolean; name: string };
export type Data = { prayers: Prayer[]; entries: Entry[]; sessions: Session[]; settings: Settings } & Extras;
export const initial: Data = { prayers: [], entries: [], sessions: [], settings: { language: 'en', dark: false, large: false, name: '' }, ...emptyExtras };
export const uid = () => crypto.randomUUID();
const db = () => openDB('prayer-private', 1, { upgrade(database) { database.createObjectStore('app'); } });
export async function readData(): Promise<Data> {
  const database = await db();
  const saved = await database.get('app', 'data');
  return saved ? parseBackup(JSON.stringify({version: 1, data: saved})) : structuredClone(initial);
}
export async function writeData(data: Data) {
  const database = await db();
  await database.put('app', data, 'data');
}
export function parseBackup(text: string): Data {
  const raw = JSON.parse(text);
  if (![1,2].includes(raw.version) || !raw.data) throw new Error('Unsupported backup. Please select a Prayer backup file.');
  const d = raw.data;
  const str = (v: unknown): v is string => typeof v === 'string';
  const date = (v: unknown) => str(v) && Number.isFinite(Date.parse(v));
  if (!Array.isArray(d.prayers) || !Array.isArray(d.entries) || !Array.isArray(d.sessions) || !d.settings) throw new Error('This backup is incomplete.');
  if (!d.prayers.every((p: Prayer) => p && str(p.id) && str(p.title) && p.title.trim() && str(p.body) && categories.includes(p.category) && statuses.includes(p.status) && typeof p.priority === 'boolean' && date(p.created) && date(p.updated) && str(p.date) && ['Anytime', 'Daily', 'Weekly'].includes(p.recurrence) && Array.isArray(p.updates) && p.updates.every(u => u && str(u.id) && str(u.text) && date(u.date)))) throw new Error('The backup contains an invalid prayer.');
  if (!d.prayers.every((p: Prayer) => (p.sharing === undefined || ['private','shareable'].includes(p.sharing)) && (p.praise === undefined || str(p.praise)) && (p.answeredAt === undefined || date(p.answeredAt)))) throw new Error('The backup contains invalid prayer sharing or praise details.');
  if (!d.entries.every((e: Entry) => e && str(e.id) && str(e.title) && str(e.body) && str(e.mood) && date(e.created))) throw new Error('The backup contains an invalid journal entry.');
  if (!d.sessions.every((s: Session) => s && str(s.id) && date(s.created) && typeof s.seconds === 'number' && Number.isFinite(s.seconds) && s.seconds >= 0)) throw new Error('The backup contains an invalid session.');
  if (!['en', 'ta'].includes(d.settings.language) || typeof d.settings.dark !== 'boolean' || typeof d.settings.large !== 'boolean' || !str(d.settings.name)) throw new Error('The backup contains invalid settings.');
  for (const list of [d.prayers, d.entries, d.sessions]) if (new Set(list.map((item: {id: string}) => item.id)).size !== list.length) throw new Error('The backup contains duplicate records.');
  return { prayers: d.prayers, entries: d.entries, sessions: d.sessions, settings: d.settings, ...validateExtras(d) };
}

export const scriptures = [
  { theme: 'Stillness', reference: 'Psalm 46:10', text: 'Be still, and know that I am God.', prompt: 'Let your thoughts settle. There is nothing you need to prove in this moment.' },
  { theme: 'Hope', reference: 'Romans 12:12', text: 'Rejoicing in hope; patient in tribulation; continuing instant in prayer;', prompt: 'Bring one hope to God, even if the way ahead is unclear.' },
  { theme: 'Wisdom', reference: 'James 1:5', text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.', prompt: 'What decision would you like to bring before God?' },
  { theme: 'Thanksgiving', reference: '1 Thessalonians 5:18', text: 'In every thing give thanks: for this is the will of God in Christ Jesus concerning you.', prompt: 'Remember one small kindness you received today.' },
  { theme: 'Peace', reference: '1 Peter 5:7', text: 'Casting all your care upon him; for he careth for you.', prompt: 'Name what is weighing on your heart. You do not have to carry it alone.' },
  { theme: 'Forgiveness', reference: 'Psalm 51:10', text: 'Create in me a clean heart, O God; and renew a right spirit within me.', prompt: 'Make room for an honest conversation with God.' },
];
