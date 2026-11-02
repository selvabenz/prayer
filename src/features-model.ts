export type Reminder = { id: string; title: string; mode: 'Hourly' | 'Daily' | 'Weekly' | 'Once' | 'Custom'; time: string; endTime: string; days: number[]; date: string; enabled: boolean; times?:string[]; lastFired?: string; snoozedUntil?: string };
export type QuietHours = {enabled:boolean;start:string;end:string};
export type Testimony = { id: string; title: string; body: string; praise: string; created: string; prayerId?: string;scripture?:string;topics?:string[] };
export type CityProfile = { name: string; country: string; background: string; people: string; needs: string; source: string; reviewed: string };
export type Book = { id: string; title: string; author: string; url: string; chapters: number; completed: number; notes: string;language?:string;bookmark?:number };
export type ReadingGroup = { id: string; name: string; bookId: string; meeting: string; chapter: string; prompt: string; notes: string };
export type CityReview = {id:string;reviewer:string;date:string;sourceChecked:boolean;communityChecked:boolean;notes:string;status:'draft'|'in-review'|'locally-reviewed'};
export type Extras = { reminders: Reminder[]; testimonies: Testimony[]; city: CityProfile | null; cities: CityProfile[]; books: Book[]; readingGroups: ReadingGroup[]; followedCities:string[];cityReviews:CityReview[];quietHours:QuietHours };
export const emptyExtras: Extras = { reminders: [], testimonies: [], city: null, cities: [], books: [], readingGroups: [],followedCities:[],cityReviews:[],quietHours:{enabled:false,start:'22:00',end:'06:00'} };

const text = (value: unknown): value is string => typeof value === 'string';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const strings = (r: Record<string, unknown>, fields: string[]) => fields.every(field => text(r[field]));
const validDate = (value: unknown) => text(value) && Number.isFinite(Date.parse(value));
export const safeUrl = (value: string) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
export function validateExtras(raw: Record<string, unknown>): Extras {
  function list<T>(key: string, valid: (r: Record<string, unknown>) => boolean): T[] {
    if (raw[key] === undefined) return [];
    const items = raw[key];
    if (!Array.isArray(items) || !items.every(item => record(item) && text(item.id) && item.id.trim() && valid(item)) || new Set(items.map(item => item.id)).size !== items.length) throw new Error(`Invalid ${key} in this backup.`);
    return items as T[];
  }
  const time=(value:unknown)=>text(value)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  const reminders = list<Reminder>('reminders', r => strings(r, ['title','time','endTime','date']) && !!String(r.title).trim() && ['Hourly','Daily','Weekly','Once','Custom'].includes(String(r.mode)) && time(r.time) && time(r.endTime) && (r.mode !== 'Hourly' || String(r.time) <= String(r.endTime)) && Array.isArray(r.days) && r.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) && (!['Weekly','Custom'].includes(String(r.mode)) || r.days.length > 0) && (r.mode!=='Custom'||Array.isArray(r.times)&&r.times.length>0&&r.times.length<=12&&r.times.every(time)&&new Set(r.times).size===r.times.length) && (r.mode !== 'Once' || /^\d{4}-\d{2}-\d{2}$/.test(String(r.date)) && validDate(r.date)) && typeof r.enabled === 'boolean' && (r.lastFired === undefined || validDate(r.lastFired)) && (r.snoozedUntil === undefined || validDate(r.snoozedUntil)));
  const testimonies = list<Testimony>('testimonies', r => strings(r, ['title','body','praise','created']) && !!String(r.title).trim() && validDate(r.created) && (r.prayerId === undefined || text(r.prayerId)));
  const books = list<Book>('books', r => strings(r, ['title','author','url','notes']) && !!String(r.title).trim() && (!r.url || safeUrl(String(r.url))) && Number.isInteger(r.chapters) && Number(r.chapters) > 0 && Number(r.chapters) <= 10000 && Number.isInteger(r.completed) && Number(r.completed) >= 0 && Number(r.completed) <= Number(r.chapters));
  const readingGroups = list<ReadingGroup>('readingGroups', r => strings(r, ['name','bookId','meeting','chapter','prompt','notes']) && !!String(r.name).trim());
  let city: CityProfile | null = null;
  if (raw.city !== undefined && raw.city !== null) {
    if (!record(raw.city) || !strings(raw.city, ['name','country','background','people','needs','source','reviewed']) || !String(raw.city.name).trim() || (raw.city.source && !safeUrl(String(raw.city.source)))) throw new Error('Invalid city profile in this backup.');
    city = raw.city as CityProfile;
  }
  const validCity = (value: unknown): value is CityProfile => record(value) && strings(value, ['name','country','background','people','needs','source','reviewed']) && !!String(value.name).trim() && (!value.source || safeUrl(String(value.source)));
  if (raw.cities !== undefined && (!Array.isArray(raw.cities) || !raw.cities.every(validCity))) throw new Error('Invalid saved city profiles in this backup.');
  const cities = raw.cities === undefined ? (city ? [city] : []) : raw.cities as CityProfile[];
  const followedCities=raw.followedCities===undefined?[]:raw.followedCities;
  if(!Array.isArray(followedCities)||!followedCities.every(id=>text(id)&&id.length>0)||new Set(followedCities).size!==followedCities.length)throw new Error('Invalid followed cities in this backup.');
  const cityReviews=list<CityReview>('cityReviews',r=>strings(r,['reviewer','date','notes'])&&['draft','in-review','locally-reviewed'].includes(String(r.status))&&typeof r.sourceChecked==='boolean'&&typeof r.communityChecked==='boolean'&&(r.status!=='locally-reviewed'||!!String(r.reviewer).trim()&&validDate(r.date)&&r.sourceChecked===true&&r.communityChecked===true));
  if(!testimonies.every(t=>(t.scripture===undefined||text(t.scripture))&&(t.topics===undefined||Array.isArray(t.topics)&&t.topics.every(text))))throw new Error('Invalid testimony topics or Scripture.');
  if(!books.every(b=>(b.language===undefined||text(b.language))&&(b.bookmark===undefined||Number.isInteger(b.bookmark)&&b.bookmark>=0&&b.bookmark<=b.chapters)))throw new Error('Invalid book language or bookmark.');
  const quietHours=raw.quietHours===undefined?{...emptyExtras.quietHours}:raw.quietHours;
  if(!record(quietHours)||typeof quietHours.enabled!=='boolean'||!time(quietHours.start)||!time(quietHours.end)||quietHours.start===quietHours.end)throw new Error('Invalid quiet hours.');
  return { reminders, testimonies, books, readingGroups, city, cities,followedCities,cityReviews,quietHours:quietHours as QuietHours };
}

export const cityLibrary: CityProfile[] = [
  { name: 'Chennai', country: 'India', background: 'Tamil Nadu’s capital stands on the Coromandel Coast beside the Bay of Bengal. It is a centre for commerce, culture, and education in South India.', people: 'People to remember: coastal neighbours, students, healthcare workers, families, and people new to the city.', needs: 'Prayer prompts: safety in daily travel; care for neighbours; wise leadership; access to education and healthcare.', source: 'https://chennai.nic.in/about-district/', reviewed: '2026-11-02' },
  { name: 'Coimbatore', country: 'India', background: 'Also called Kovai, Coimbatore lies on the Noyyal River near the Western Ghats. Textiles and engineering are important parts of the city’s industrial history.', people: 'People to remember: factory workers, small business owners, students, farmers, and families.', needs: 'Prayer prompts: safe workplaces; fair livelihoods; care for water and the environment; peace in homes.', source: 'https://coimbatore.nic.in/about-district/', reviewed: '2026-11-02' },
  { name: 'Bengaluru', country: 'India', background: 'The capital of Karnataka, Bengaluru is a centre of state administration and information technology. The city is also known for its parks and lakes.', people: 'People to remember: people starting new jobs, students, public-service workers, older neighbours, and families.', needs: 'Prayer prompts: belonging for newcomers; healthy rhythms of work and rest; care for public spaces; wise local leadership.', source: 'https://bengaluruurban.nic.in/en/', reviewed: '2026-11-02' },
];
export function cityFor(name: string, country = ''): CityProfile {
  const aliases: Record<string, string> = { madras: 'chennai', kovai: 'coimbatore', bangalore: 'bengaluru' };
  const key = aliases[name.trim().toLowerCase()] || name.trim().toLowerCase();
  const city = cityLibrary.find(c => c.name.toLowerCase() === key && (!country || country.toLowerCase() === 'india' || country === 'IN'));
  return city ? { ...city } : { name: name.trim(), country, background: '', people: '', needs: '', source: '', reviewed: '' };
}
export const bookLibrary = [
  { id: 'intercession', title: 'The Ministry of Intercession', author: 'Andrew Murray', url: 'https://www.gutenberg.org/ebooks/29296', chapters: 15, description: 'A classic invitation to a life of intercession and prayer for others.' },
  { id: 'power-prayer', title: 'Power Through Prayer', author: 'E. M. Bounds', url: 'https://www.gutenberg.org/ebooks/65115', chapters: 20, description: 'Reflections on prayer, personal character, and Christian ministry.' },
  { id: 'school-prayer', title: 'With Christ in the School of Prayer', author: 'Andrew Murray', url: 'https://www.ccel.org/ccel/murray/prayer', chapters: 31, description: 'Thirty-one lessons on prayer drawn from the teaching of Jesus.' },
];

export function nextReminder(r: Reminder, after = new Date()): Date | null {
  if (!r.enabled) return null;
  if (r.snoozedUntil && Date.parse(r.snoozedUntil) > after.getTime()) return new Date(r.snoozedUntil);
  const [hour, minute] = r.time.split(':').map(Number);
  const [endHour, endMinute] = r.endTime.split(':').map(Number);
  for (let offset = 0; offset < 9; offset++) {
    const day = new Date(after); day.setDate(day.getDate() + offset);
    if (['Weekly','Custom'].includes(r.mode) && !r.days.includes(day.getDay())) continue;
    if (r.mode === 'Once' && localDate(day) !== r.date) continue;
    const candidates:number[]=[];
    if(r.mode==='Custom')for(const time of r.times||[]){const[h,m]=time.split(':').map(Number);candidates.push(h*60+m);}
    else for(let minutes=hour*60+minute;minutes<=(r.mode==='Hourly'?endHour*60+endMinute:hour*60+minute);minutes+=60)candidates.push(minutes);
    for (const minutes of candidates.sort((a,b)=>a-b)) {
      const candidate = new Date(day); candidate.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (candidate.getTime() > after.getTime()) return candidate;
    }
  }
  // A one-off date can be farther than a week away.
  if (r.mode === 'Once') { const candidate = new Date(`${r.date}T${r.time}:00`); return candidate > after ? candidate : null; }
  return null;
}
export const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const icsEscape = (s: string) => s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
const localStamp = (d: Date) => localDate(d).replaceAll('-','') + 'T' + [d.getHours(),d.getMinutes(),d.getSeconds()].map(n => String(n).padStart(2,'0')).join('');
function foldLine(line: string): string {
  let count = 0; let out = '';
  for (const char of line) { const bytes = new TextEncoder().encode(char).length; if (count + bytes > 74) { out += '\r\n '; count = 1; } out += char; count += bytes; }
  return out;
}
export function reminderCalendar(reminder: Reminder, now = new Date()): string {
  if(reminder.mode==='Custom'){
    const events=(reminder.times||[]).map(time=>{
      const calendar=reminderCalendar({...reminder,id:reminder.id+'-'+time.replace(':',''),mode:'Weekly',time,times:undefined},now);
      return calendar.slice(calendar.indexOf('BEGIN:VEVENT'),calendar.indexOf('END:VCALENDAR')).trimEnd();
    });
    if(!events.length)throw new Error('Choose at least one custom time.');
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Prayer//Prayer reminders//EN','CALSCALE:GREGORIAN',...events,'END:VCALENDAR',''].join('\r\n');
  }
  const r = { ...reminder, enabled: true, snoozedUntil: undefined };
  const next = nextReminder(r, now);
  if (!next) throw new Error('This reminder is in the past. Choose a future date.');
  const end = new Date(next.getTime()+5*60000);
  let rule = '';
  if (r.mode === 'Daily') rule = 'RRULE:FREQ=DAILY';
  if (r.mode === 'Weekly') rule = `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map(d => ['SU','MO','TU','WE','TH','FR','SA'][d]).join(',')}`;
  if (r.mode === 'Hourly') {
    const [h,m] = r.time.split(':').map(Number); const [eh,em] = r.endTime.split(':').map(Number); const hours = [];
    for (let v = h*60+m; v <= eh*60+em; v += 60) hours.push(Math.floor(v/60));
    rule = `RRULE:FREQ=DAILY;BYHOUR=${hours.join(',')};BYMINUTE=${m};BYSECOND=0`;
  }
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Prayer//Prayer reminders//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${r.id}@prayer.local`,`DTSTAMP:${now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${localStamp(next)}`,`DTEND:${localStamp(end)}`,...(rule ? [rule] : []),'SUMMARY:Prayer time','DESCRIPTION:A quiet moment to pray. Open your Prayer app when you are ready.','BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Prayer time','END:VALARM','END:VEVENT','END:VCALENDAR'].map(foldLine).join('\r\n')+'\r\n';
}
export function inQuietHours(settings:QuietHours,date=new Date()){
  if(!settings.enabled)return false;const current=String(date.getHours()).padStart(2,'0')+':'+String(date.getMinutes()).padStart(2,'0');
  return settings.start<settings.end?current>=settings.start&&current<settings.end:current>=settings.start||current<settings.end;
}

export type ShareCard = { kind: 'prayer' | 'testimony' | 'reading'; title: string; text: string; praise: string };
export function shareLink(card: ShareCard): string {
  const bytes = new TextEncoder().encode(JSON.stringify({ version: 1, ...card }));
  if (bytes.length > 6000) throw new Error('Please shorten the sharing text to keep this link easy to send (about 6 KB).');
  const encoded = btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
  return `${window.location.origin}${window.location.pathname}#share=${encoded}`;
}
export function readShare(hash: string): ShareCard | null {
  if (!hash.startsWith('#share=')) return null;
  try {
    const encoded = hash.slice(7); if (encoded.length > 8200 || !/^[\w-]+$/.test(encoded)) throw new Error();
    const raw = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(encoded.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0))));
    if (raw.version !== 1 || !['prayer','testimony','reading'].includes(raw.kind) || !strings(raw,['title','text','praise']) || !raw.title.trim()) throw new Error();
    return { kind: raw.kind, title: raw.title, text: raw.text, praise: raw.praise };
  } catch { throw new Error('This shared link is incomplete or invalid. Ask the sender for a new copy.'); }
}
export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], {type})); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
