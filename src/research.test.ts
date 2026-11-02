import { describe, expect, it } from 'vitest';
import { initial, parseBackup } from './data';
import { inQuietHours, nextReminder, reminderCalendar, validateExtras, type Reminder } from './features-model';
import { findResearchCity, focusForToday, formattedMetric, metricsFor, prayerGuideFor, research, researchCities } from './research';
import { thanksgivingCard } from './praise-card';

describe('workbook research provenance',()=>{
  it('preserves all 42 cities, source records, and unreviewed status',()=>{
    expect(researchCities).toHaveLength(42);
    expect(new Set(researchCities.map(c=>c.id)).size).toBe(42);
    expect(research.sources).toHaveLength(24);
    expect(research.sha256).toBe('0f8f8570cf0eb9cd93e5a5cb6ccd54b317ea75311193e7e4d32c16c07c8c1122');
    expect(researchCities.every(c=>c.reviewStatus==='research-starter')).toBe(true);
    expect(researchCities.every(c=>c.catalogue.sourceSheet==='CITY CATALOGUE'&&Number(c.catalogue.sourceRow)>=2)).toBe(true);
  });
  it('keeps Delhi city and NCT literacy observations separate',()=>{
    const metrics=metricsFor(findResearchCity('Delhi')!);
    expect(metrics.find(m=>m.name==='Delhi city literacy')).toMatchObject({value:87.6,year:'2011'});
    expect(metrics.find(m=>m.name==='Delhi NCT literacy')).toMatchObject({value:86.2,geography:'NCT Delhi',year:'2011'});
    expect(metrics.find(m=>m.name==='Delhi urban unemployment (all ages)')).toMatchObject({value:6,year:'2025',geography:'Urban Delhi (state/UT)'});
  });
  it('never turns unavailable city evidence into zero or a city employment rate',()=>{
    for(const city of researchCities.filter(c=>c.id!=='delhi')){
      const metrics=metricsFor(city);
      expect(metrics.find(m=>m.name==='Registered crimes against women')?.value).toBeNull();
      expect(metrics.find(m=>m.name==='Registered crimes against children')?.value).toBeNull();
      expect(metrics.find(m=>m.name==='Oppression rate')?.value).toBeNull();
      expect(metrics.find(m=>m.name==='Bonded labour prevalence')?.value).toBeNull();
      expect(metrics.find(m=>m.name.includes('unemployment'))?.name).toContain('state/UT context');
    }
    expect(formattedMetric(null)).toBe('Not verified');
    expect(formattedMetric(0)).toBe('0');
  });
  it('does not replace geography-specific religion and language denominators',()=>{
    expect(research.delhi.religions.every(r=>r.Geography==='NCT Delhi'&&r['Census year']===2011)).toBe(true);
    expect(research.delhi.languages[0]['Statistical warning']).toContain('16,757,013');
    expect(research.faithAndPeople.filter(r=>r.City!=='Delhi').every(r=>r['2011 Hindu (%)']===null&&r['2011 Muslim (%)']===null)).toBe(true);
  });
  it('resolves aliases without inventing research for a same-name city in another country',()=>{
    expect(findResearchCity('Bangalore')?.id).toBe('bengaluru');
    expect(findResearchCity('Trichy')?.id).toBe('tiruchirappalli');
    expect(findResearchCity('Delhi','USA')).toBeUndefined();
    expect(findResearchCity('Unknown')).toBeUndefined();
  });
  it('rotates a stable daily prayer focus only among followed cities',()=>{
    const day=new Date(2026,10,2,7);
    expect(focusForToday([],day)).toBeNull();
    const focus=focusForToday(['chennai','delhi'],day)!;
    expect(['chennai','delhi']).toContain(focus.city.id);
    expect(focusForToday(['delhi','chennai'],day)).toEqual(focus);
    expect(prayerGuideFor(focus.city).some(p=>p.text===focus.prayer.text)).toBe(true);
    expect(prayerGuideFor(findResearchCity('Delhi')!)).toHaveLength(19);
  });
});
describe('custom schedules, local reviews, and recovery',()=>{
  it('renders reviewed thanksgiving text as escaped SVG without running embedded markup',()=>{
    const svg=thanksgivingCard({kind:'testimony',title:'நன்றி',text:'<script>alert("no")</script>',praise:'A & B'});
    expect(svg).toContain('நன்றி');expect(svg).toContain('&lt;script&gt;');expect(svg).not.toContain('<script>');expect(svg).toContain('A &amp; B');
  });
  const reminder:Reminder={id:'custom',title:'Private personal concern',mode:'Custom',time:'07:00',endTime:'21:00',times:['07:00','12:30','19:00'],days:[1,3,5],date:'',enabled:true};
  it('schedules custom times and exports distinct events without private titles',()=>{
    expect(nextReminder(reminder,new Date(2026,10,2,8))).toEqual(new Date(2026,10,2,12,30));
    expect(nextReminder(reminder,new Date(2026,10,2,20))).toEqual(new Date(2026,10,4,7));
    const calendar=reminderCalendar(reminder,new Date(2026,10,2,6));
    expect(calendar.match(/BEGIN:VCALENDAR/g)).toHaveLength(1);
    expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(calendar).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
    expect(calendar).not.toContain(reminder.title);
  });
  it('respects quiet-hour boundaries across midnight',()=>{
    const q={enabled:true,start:'22:00',end:'06:00'};
    expect(inQuietHours(q,new Date(2026,10,2,22))).toBe(true);
    expect(inQuietHours(q,new Date(2026,10,3,5,59))).toBe(true);
    expect(inQuietHours(q,new Date(2026,10,3,6))).toBe(false);
    expect(inQuietHours({...q,enabled:false},new Date(2026,10,2,23))).toBe(false);
  });
  it('rejects a completed local review without its checks and reviewer',()=>{
    expect(()=>validateExtras({cityReviews:[{id:'delhi',reviewer:'',date:'2026-11-02',status:'locally-reviewed',sourceChecked:false,communityChecked:false,notes:''}]})).toThrow();
    expect(()=>validateExtras({reminders:[{...reminder,times:['25:00']}]})).toThrow();
    expect(()=>validateExtras({quietHours:{enabled:true,start:'07:00',end:'07:00'}})).toThrow();
  });
  it('round trips new metadata in a v2 backup and keeps old backups compatible',()=>{
    const data={...structuredClone(initial),followedCities:['delhi'],reminders:[reminder],cityReviews:[{id:'delhi',reviewer:'Local reviewer',date:'2026-11-02',sourceChecked:true,communityChecked:true,notes:'Sources checked separately',status:'locally-reviewed' as const}]};
    expect(parseBackup(JSON.stringify({version:2,data}))).toEqual(data);
    const old={prayers:[],entries:[],sessions:[],settings:initial.settings};
    expect(parseBackup(JSON.stringify({version:1,data:old}))).toEqual(initial);
    expect(researchCities.find(c=>c.id==='delhi')?.reviewStatus).toBe('research-starter');
  });
});
