import { describe, expect, it } from 'vitest';
import { initial, parseBackup } from './data';
import { cityFor, nextReminder, readShare, reminderCalendar, safeUrl, validateExtras, type Reminder } from './features-model';

const base: Reminder = {id:'test',title:'Private health concern',mode:'Daily',time:'07:00',endTime:'21:00',days:[1,3],date:'',enabled:true};
const local = (day: number, hour: number, minute = 0) => new Date(2026,10,day,hour,minute,0);
describe('prayer schedules',()=>{
  it('moves a daily time to tomorrow after today’s reminder',()=>{
    expect(nextReminder(base,local(2,8))).toEqual(local(3,7));
  });
  it('limits hourly reminders to the selected daytime window',()=>{
    const hourly={...base,mode:'Hourly' as const,time:'09:30',endTime:'20:00'};
    expect(nextReminder(hourly,local(2,10,40))).toEqual(local(2,11,30));
    expect(nextReminder(hourly,local(2,19,40))).toEqual(local(3,9,30));
  });
  it('schedules only chosen weekdays',()=>{
    expect(nextReminder({...base,mode:'Weekly'},local(2,8))).toEqual(local(4,7));
  });
  it('honours snooze, disabled state, and future one-off dates',()=>{
    expect(nextReminder({...base,enabled:false},local(2,6))).toBeNull();
    expect(nextReminder({...base,snoozedUntil:local(2,6,10).toISOString()},local(2,6))).toEqual(local(2,6,10));
    expect(nextReminder({...base,mode:'Once',date:'2027-01-01'},local(2,6))).toEqual(new Date(2027,0,1,7));
    expect(nextReminder({...base,mode:'Once',date:'2026-11-01'},local(2,6))).toBeNull();
  });
  it('exports a recurring calendar alarm without personal prayer text',()=>{
    const ics=reminderCalendar({...base,mode:'Weekly'},local(2,6));
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE\r\n');
    expect(ics).toContain('DTSTART:20261102T070000\r\n');
    expect(ics).toContain('BEGIN:VALARM\r\nTRIGGER:PT0M');
    expect(ics).not.toContain('Private health concern');
  });
  it('exports hourly windows and rejects past one-off exports',()=>{
    expect(reminderCalendar({...base,mode:'Hourly',time:'09:30',endTime:'11:00'},local(2,6))).toContain('RRULE:FREQ=DAILY;BYHOUR=9,10;BYMINUTE=30;BYSECOND=0');
    expect(()=>reminderCalendar({...base,mode:'Once',date:'2025-01-01'},local(2,6))).toThrow('past');
  });
});
describe('migration, privacy and recovery',()=>{
  it('opens an original v0.1 backup without losing its prayers or adding sharing permission',()=>{
    const old={prayers:[],entries:[],sessions:[],settings:initial.settings};
    expect(parseBackup(JSON.stringify({version:1,data:old}))).toEqual(initial);
  });
  it('round trips every new data type',()=>{
    const city=cityFor('Chennai');
    const data={...structuredClone(initial),reminders:[base],city,cities:[city],testimonies:[{id:'t',title:'A quiet answer',body:'Our own words',praise:'Thanks',created:local(2,6).toISOString()}],books:[{id:'b',title:'Prayer',author:'Author',url:'https://example.com/book',chapters:10,completed:2,notes:'Private'}],readingGroups:[{id:'g',name:'Family reading',bookId:'b',meeting:'',chapter:'1–2',prompt:'How can we pray?',notes:'Private preparation'}]};
    expect(parseBackup(JSON.stringify({version:1,data}))).toEqual(data);
  });
  it.each([{reminders:[{...base,days:[9]}]},{reminders:[{...base,mode:'Weekly',days:[]}]},{reminders:[{...base,mode:'Hourly',time:'20:00',endTime:'07:00'}]},{books:[{id:'b',title:'Unsafe',author:'',url:'javascript:alert(1)',chapters:1,completed:0,notes:''}]},{testimonies:[{id:'t',title:'Story',body:'text',praise:'thanks',created:'invalid'}]}])('rejects malformed new records before restore',raw=>{
    expect(()=>validateExtras(raw)).toThrow();
  });
  it('uses sourced city profiles only where available and does not invent background',()=>{
    expect(cityFor('Bangalore').name).toBe('Bengaluru');
    expect(cityFor('Kovai').source).toContain('coimbatore.nic.in');
    expect(cityFor('Unknown City').background).toBe('');
    expect(cityFor('Chennai','USA').source).toBe('');
    expect(safeUrl('javascript:alert(1)')).toBe(false);
  });
  it('rejects malformed or oversized share links',()=>{
    expect(readShare('#today')).toBeNull();
    expect(()=>readShare('#share=not_valid')).toThrow('incomplete');
    expect(()=>readShare('#share='+ 'a'.repeat(8300))).toThrow();
  });
});
