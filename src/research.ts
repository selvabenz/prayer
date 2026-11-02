import imported from './research/india-2026.json';

export type ResearchRow = Record<string, string | number | null>;
export type ResearchCity = { id: string; name: string; state: string; country: string; reviewStatus: 'research-starter'; catalogue: ResearchRow };
type ResearchData = { schemaVersion: number; asOf: string; workbook: string; sha256: string; status: string; cities: ResearchCity[]; sources: ResearchRow[]; faithAndPeople: ResearchRow[]; delhi: { indicators: ResearchRow[]; prayerGuide: ResearchRow[]; socialSafety: ResearchRow[]; religions: ResearchRow[]; languages: ResearchRow[]; labour: ResearchRow[] } };
export const research = imported as unknown as ResearchData;
export const asText = (value: unknown) => value === null || value === undefined ? '' : String(value);
export const researchCities = research.cities;
const aliases: Record<string,string> = { bangalore: 'bengaluru', madras: 'chennai', kovai: 'coimbatore', calcutta: 'kolkata', mysore: 'mysuru', vizag: 'visakhapatnam', trichy: 'tiruchirappalli', cochin: 'kochi', nasik: 'nashik', baroda: 'vadodara' };
export function findResearchCity(name: string, country = 'India') {
  if (country && !['india','in'].includes(country.toLowerCase())) return undefined;
  const key = aliases[name.trim().toLowerCase()] || name.trim().toLowerCase();
  return researchCities.find(city => city.id === key || city.name.toLowerCase() === key);
}
export type ResearchMetric = { name: string; value: string | number | null; unit: string; year: string; geography: string; definition: string; source: string; reference: string };
const source = (name: string) => asText(research.sources.find(s => s['Source name'] === name)?.URL);
export function metricsFor(city: ResearchCity): ResearchMetric[] {
  if (city.id === 'delhi') return [{name:'Delhi city literacy',value:city.catalogue['Literacy 2011 (%) CITY'],unit:'%',year:'2011',geography:'Delhi city observation in the supplied Census-derived report; not NCT Delhi',definition:'The workbook reports 87.6% for the city and 86.2% for NCT Delhi. These are distinct geographic observations, not a change over time.',source:asText(city.catalogue['Literacy source']),reference:`CITY CATALOGUE · row ${city.catalogue.sourceRow}`},...research.delhi.indicators.map(r => ({name: asText(r.Indicator),value:r.Value,unit:asText(r.Unit),year:asText(r['Reference year']),geography:asText(r['Statistical geography']),definition:asText(r['Definition / warning']),source:asText(r['Source URL']),reference:`DELHI INDICATORS · row ${r.sourceRow}`}))];
  const r = city.catalogue;
  return [
    {name:'Literacy (city)',value:r['Literacy 2011 (%) CITY'],unit:'%',year:'2011',geography:`${city.name} city; Census-derived report`,definition:'Historical Census-derived observation. This is not a 2026 literacy estimate.',source:asText(r['Literacy source'])},
    {name:'Urban unemployment (state/UT context)',value:r['Urban state unemployment 2025 (%)'],unit:'%',year:'2025',geography:asText(r['Employment geography']),definition:'PLFS urban state/UT estimate. Do not interpret this as the city unemployment rate.',source:source('Annual PLFS')},
    {name:'Registered murder rate (metro)',value:r['2024 murder cases per lakh METRO'],unit:'cases per 100,000',year:'2024',geography:`${city.name} metropolitan reporting area, if covered`,definition:'Registered murder cases using a 2011 Census population denominator; not all homicides or a forecast of personal risk.',source:asText(r['Murder-rate source'])},
    {name:'Registered crimes against women',value:r['Women crime registered 2024 (metro)'],unit:'registered cases',year:'2024',geography:`${city.name} metropolitan reporting area`,definition:'Not verified for this city in the workbook. Missing is not zero. Registered complaints do not measure all harm.',source:source('Crime in India 2024')},
    {name:'Registered crimes against children',value:r['Child crime registered 2024 (metro)'],unit:'registered cases',year:'2024',geography:`${city.name} metropolitan reporting area`,definition:'Not verified for this city in the workbook. Missing is not zero. Do not infer prevalence.',source:source('Crime in India 2024')},
    {name:'Bonded labour prevalence',value:r['Bonded labour prevalence / rate'],unit:'not available',year:'Research pending',geography:city.name,definition:asText(r['Bonded/child labour: documented local evidence']),source:''},
    {name:'Oppression rate',value:null,unit:'not defined',year:'Not applicable',geography:'No comparable metric',definition:asText(r['Oppression rate']),source:''},
  ].map(m => ({...m,reference:`CITY CATALOGUE · row ${r.sourceRow}`}));
}
export type PrayerFocus = {topic:string; text:string; focus:string; background:string; source:string; reference:string};
export function prayerGuideFor(city:ResearchCity):PrayerFocus[] {
  if(city.id==='delhi') return research.delhi.prayerGuide.map(r=>({topic:asText(r['Prayer topic']),text:asText(r['Suggested prayer point']),focus:asText(r['Short focus']),background:asText(r['Verified background or editorial status']),source:asText(r['Evidence URL']),reference:`DELHI PRAYER GUIDE · row ${r.sourceRow}`}));
  const r=city.catalogue;
  const general = ['Prayer point 1','Prayer point 2','Prayer point 3'].map((key,i)=>({topic:['Care for neighbours','Local life and livelihoods','Wisdom and cooperation'][i],text:asText(r[key]),focus:asText(r['Priority prayer themes']),background:'Editorial prayer suggestion; local community review is still needed.',source:'',reference:`CITY CATALOGUE · row ${r.sourceRow}`}));
  return [...general,...[['Women and children','Women & children prayer focus'],['Dignified work','Fair labour / rehabilitation prayer focus'],['Community harmony','Religious & cultural harmony prayer focus']].map(([topic,key])=>({topic,text:asText(r[key]),focus:topic,background:'Editorial prayer suggestion. Not a measured claim about a community.',source:'',reference:`CITY CATALOGUE · row ${r.sourceRow}`}))].filter(p=>p.text);
}
export function focusForToday(followed:string[], date=new Date()) {
  const available=followed.map(id=>researchCities.find(c=>c.id===id)).filter((c):c is ResearchCity=>!!c).sort((a,b)=>a.id.localeCompare(b.id));
  if(!available.length)return null;
  const day=Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
  const city=available[day%available.length];const guide=prayerGuideFor(city);
  return {city,prayer:guide[Math.floor(day/available.length)%guide.length]};
}
export function formattedMetric(value:string|number|null) {
  if(value===null || value===undefined || value==='')return 'Not verified';
  return typeof value==='number'?value.toLocaleString('en-IN',{maximumFractionDigits:3}):value;
}
