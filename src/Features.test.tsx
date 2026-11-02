// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { initial, parseBackup, readData, writeData } from './data';
import { readShare, shareLink } from './features-model';

beforeEach(async()=>{
  vi.restoreAllMocks();await writeData(structuredClone(initial));
  window.history.replaceState(null,'','/');
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  window.scrollTo=vi.fn();
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
async function openApp(){render(<App/>);await screen.findByRole('heading',{name:/Good (morning|afternoon|evening)/});}

describe('new prayer tools',()=>{
  it('looks up a city only after consent and never persists coordinates',async()=>{
    const locate=vi.fn((success:PositionCallback)=>success({coords:{latitude:12.34567,longitude:78.12345}} as GeolocationPosition));
    Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:locate},configurable:true});
    const fetchCity=vi.fn().mockResolvedValue({ok:true,json:async()=>({city:'Chennai',countryName:'India'})});
    vi.stubGlobal('fetch',fetchCity);
    const user=userEvent.setup();await openApp();
    await user.click(screen.getAllByRole('button',{name:'Pray for your city'})[0]);
    expect(locate).not.toHaveBeenCalled();expect(fetchCity).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button',{name:'Find my city'}));
    expect(locate).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button',{name:'Allow one-time city lookup'}));
    await screen.findByText(/We found Chennai, India/);
    const url=fetchCity.mock.calls[0][0] as URL;
    expect(url.searchParams.get('latitude')).toBe('12.35');
    expect(url.searchParams.get('longitude')).toBe('78.12');
    expect((await readData()).city).toBeNull();
    await user.click(screen.getByRole('button',{name:'Choose city'}));
    await waitFor(async()=>expect((await readData()).city?.name).toBe('Chennai'));
    const stored=JSON.stringify(await readData());
    expect(stored).not.toContain('12.34567');expect(stored).not.toContain('latitude');
  });

  it('retains manual city entry when location permission is denied without an IP fallback',async()=>{
    Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:vi.fn((_success:PositionCallback,error:PositionErrorCallback)=>error({code:1,message:'Denied'} as GeolocationPositionError))},configurable:true});
    const fetchCity=vi.fn();vi.stubGlobal('fetch',fetchCity);
    const user=userEvent.setup();await openApp();
    await user.click(screen.getAllByRole('button',{name:'Pray for your city'})[0]);
    await user.click(screen.getByRole('button',{name:'Find my city'}));
    await user.click(screen.getByRole('button',{name:'Allow one-time city lookup'}));
    await screen.findByText('Location was denied or unavailable. You can enter your city manually.');
    expect(fetchCity).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('City name'),'My town');
    await user.click(screen.getByRole('button',{name:'Choose city'}));
    await waitFor(async()=>expect((await readData()).city?.name).toBe('My town'));
  });

  it('saves a schedule and can pause it',async()=>{
    const user=userEvent.setup();await openApp();
    await user.click(screen.getAllByRole('button',{name:'Prayer reminders'})[0]);
    await user.click(screen.getByRole('button',{name:'Add reminder'}));
    await user.type(screen.getByLabelText('Reminder name'),'A quiet evening');
    await user.selectOptions(screen.getByLabelText('Repeat'),'Weekly');
    await user.click(screen.getByRole('button',{name:'Save reminder'}));
    await waitFor(async()=>expect((await readData()).reminders).toHaveLength(1));
    expect(screen.getByText('A quiet evening')).toBeTruthy();
    await user.click(screen.getByRole('switch',{name:'Enable A quiet evening'}));
    await waitFor(async()=>expect((await readData()).reminders[0].enabled).toBe(false));
    expect(screen.getByText('Paused')).toBeTruthy();
  });

  it('saves city context, preserves it when switching cities, and drafts a private city prayer',async()=>{
    const user=userEvent.setup();await openApp();
    await user.click(screen.getAllByRole('button',{name:'Pray for your city'})[0]);
    await user.type(screen.getByLabelText('City name'),'Chennai');
    await user.click(screen.getByRole('button',{name:'Choose city'}));
    await screen.findByRole('heading',{name:/Chennai/});
    await user.click(screen.getByRole('button',{name:'Edit city notes'}));
    await user.clear(screen.getByLabelText('Local prayer needs'));
    await user.type(screen.getByLabelText('Local prayer needs'),'Care for our neighbours');
    await user.click(screen.getByRole('button',{name:'Save city notes'}));
    await waitFor(async()=>expect((await readData()).city?.needs).toBe('Care for our neighbours'));
    await user.clear(screen.getByLabelText('City name'));await user.type(screen.getByLabelText('City name'),'Coimbatore');
    await user.click(screen.getByRole('button',{name:'Choose city'}));
    await user.click(screen.getByRole('button',{name:'Chennai'}));
    expect(await screen.findByText('Care for our neighbours')).toBeTruthy();
    await user.click(screen.getByRole('button',{name:'Add city to my prayers'}));
    const dialog=screen.getByRole('dialog');
    expect((within(dialog).getByLabelText('Prayer title') as HTMLInputElement).value).toBe('Pray for Chennai');
    await user.click(within(dialog).getByRole('button',{name:'Save prayer'}));
    await waitFor(async()=>expect((await readData()).prayers[0].sharing).toBe('private'));
    expect((await readData()).cities).toHaveLength(2);
  });

  it('adds a curated book, records progress, and shares a reading plan without private notes',async()=>{
    const user=userEvent.setup();await openApp();
    await user.click(screen.getAllByRole('button',{name:'Prayer book library'})[0]);
    await user.click(screen.getAllByRole('button',{name:'+ Add to shelf'})[0]);
    await waitFor(async()=>expect((await readData()).books).toHaveLength(1));
    const progress=screen.getByRole('spinbutton',{name:/Chapters read for/});
    await user.clear(progress);await user.type(progress,'2');
    await waitFor(async()=>expect((await readData()).books[0].completed).toBe(2));
    await user.click(screen.getByRole('button',{name:'Read together'}));
    await user.type(screen.getByLabelText('Reading group name'),'Our reading circle');
    await user.type(screen.getByLabelText('Read for this meeting'),'Chapters 1–2');
    await user.type(screen.getByLabelText('Discussion prompt'),'How can we pray for others?');
    await user.type(screen.getByLabelText('Private group preparation notes'),'Private names must stay here');
    await user.click(screen.getByRole('button',{name:'Save reading plan'}));
    await waitFor(async()=>expect((await readData()).readingGroups).toHaveLength(1));
    await user.click(screen.getByRole('button',{name:'Share reading plan'}));
    const preview=screen.getByRole('dialog',{name:'Review your shared copy'});
    expect((within(preview).getByLabelText('Shared message') as HTMLTextAreaElement).value).toContain('Chapters 1–2');
    expect(preview.textContent).not.toContain('Private names must stay here');
    expect((within(preview).getByRole('button',{name:'Copy share link'}) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps request sharing off by default and builds a testimony from an answered prayer',async()=>{
    const user=userEvent.setup();await openApp();
    await user.click(screen.getByRole('button',{name:'Add a prayer'}));
    const editor=screen.getByRole('dialog');
    expect((within(editor).getByRole('checkbox',{name:'Allow sharing a copy of this request'}) as HTMLInputElement).checked).toBe(false);
    await user.type(within(editor).getByLabelText('Prayer title'),'A renewed friendship');
    await user.click(within(editor).getByRole('button',{name:'Save prayer'}));
    await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(screen.getByRole('button',{name:/A renewed friendship/}));
    await user.selectOptions(screen.getByLabelText('Prayer status'),'Answered');
    await user.type(screen.getByLabelText('Praise point'),'Thankful for a good conversation');
    await user.click(screen.getByRole('button',{name:'Save praise point'}));
    await waitFor(async()=>expect((await readData()).prayers[0].praise).toBe('Thankful for a good conversation'));
    expect(screen.getByText('ANSWERED PRAYER')).toBeTruthy();
    expect((screen.getByRole('button',{name:'Review & share'}) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole('button',{name:'Create testimony'}));
    await waitFor(async()=>expect((await readData()).testimonies).toHaveLength(1));
    expect(await screen.findByRole('heading',{name:'A renewed friendship'})).toBeTruthy();
  });

  it('round trips Tamil share text and saves incoming content only after a deliberate action',async()=>{
    const card={kind:'prayer' as const,title:'குடும்பம்',text:'என் குடும்பத்திற்காக ஜெபியுங்கள்',praise:''};
    const link=shareLink(card);expect(readShare(new URL(link).hash)).toEqual(card);
    window.history.replaceState(null,'',new URL(link).hash);const user=userEvent.setup();await openApp();
    const shared=await screen.findByRole('dialog',{name:'Shared encouragement'});
    expect((await readData()).prayers).toHaveLength(0);
    await user.click(within(shared).getByRole('button',{name:'Save as private prayer'}));
    await waitFor(async()=>expect((await readData()).prayers).toHaveLength(1));
    expect((await readData()).prayers[0]).toMatchObject({title:card.title,body:card.text,sharing:'private'});
    expect(window.location.hash).toBe('');
    expect(parseBackup(JSON.stringify({version:1,data:await readData()})).prayers[0].title).toBe(card.title);
  });
});
