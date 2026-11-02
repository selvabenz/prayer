// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import {initial,readData,writeData} from './data';

beforeEach(async()=>{await writeData(structuredClone(initial));window.history.replaceState(null,'','/');window.scrollTo=vi.fn();HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};});
afterEach(cleanup);
async function open(){render(<App/>);await screen.findByRole('heading',{name:/Good (morning|afternoon|evening)/});}
describe('Places and integrated navigation',()=>{
  it('searches 42 city research starters, follows Delhi, and opens a guided prayer',async()=>{
    const user=userEvent.setup();await open();
    const mobile=screen.getByRole('navigation',{name:'Mobile navigation'});
    expect(within(mobile).getByRole('button',{name:'Places'})).toBeTruthy();
    expect(within(mobile).getByRole('button',{name:'Community'})).toBeTruthy();
    await user.click(within(mobile).getByRole('button',{name:'Places'}));
    await user.type(screen.getByRole('textbox',{name:'Search city research'}),'Delhi');
    await user.click(screen.getByRole('button',{name:'Follow Delhi'}));
    await waitFor(async()=>expect((await readData()).followedCities).toEqual(['delhi']));
    await user.click(screen.getByRole('button',{name:/Delhi Delhi.*Explore prayer guide/}));
    expect(screen.getByText('Research starter · local verification required')).toBeTruthy();
    await user.click(screen.getByRole('button',{name:'Pray for Delhi'}));
    const guide=screen.getByRole('dialog',{name:'Guided prayer for Delhi'});
    expect(within(guide).getByRole('heading',{name:'Women and girls'})).toBeTruthy();
    await user.click(within(guide).getByRole('button',{name:'Save as a private prayer'}));
    const editor=screen.getByRole('dialog');
    expect((within(editor).getByLabelText('Prayer title')as HTMLInputElement).value).toBe('Delhi: Women and girls');
    await user.click(within(editor).getByRole('button',{name:'Save prayer'}));
    await waitFor(async()=>expect((await readData()).prayers).toHaveLength(1));
    expect((await readData()).prayers[0].sharing).toBe('private');
  });
  it('records a local review without treating it as public approval',async()=>{
    const user=userEvent.setup();await open();
    await user.click(screen.getByRole('button',{name:'Research workspace'}));
    await user.selectOptions(screen.getByLabelText('Review status'),'locally-reviewed');
    await user.click(screen.getByRole('button',{name:'Save review record'}));
    expect(await screen.findByText('A completed local review needs a reviewer, date, source check, and community check.')).toBeTruthy();
    expect((await readData()).cityReviews).toHaveLength(0);
    await user.type(screen.getByLabelText('Reviewer name'),'A local reviewer');
    await user.click(screen.getByRole('checkbox',{name:/I checked the original sources/}));
    await user.click(screen.getByRole('checkbox',{name:/I reviewed the prayer language/}));
    await user.click(screen.getByRole('button',{name:'Save review record'}));
    await waitFor(async()=>expect((await readData()).cityReviews[0].status).toBe('locally-reviewed'));
    expect(screen.getByText(/does not grant an editor role/)).toBeTruthy();
  });
  it('saves a custom weekday schedule and quiet hours',async()=>{
    const user=userEvent.setup();await open();
    await user.click(screen.getAllByRole('button',{name:'Prayer reminders'})[0]);
    await user.click(screen.getByRole('switch',{name:'In-app quiet hours'}));
    await user.click(screen.getByRole('button',{name:'Add reminder'}));
    await user.type(screen.getByLabelText('Reminder name'),'Morning and evening prayer');
    await user.selectOptions(screen.getByLabelText('Repeat'),'Custom');
    await user.click(screen.getByRole('button',{name:'Save reminder'}));
    await waitFor(async()=>expect((await readData()).reminders[0].times).toEqual(['07:00','12:30','19:00']));
    expect((await readData()).quietHours).toEqual({enabled:true,start:'22:00',end:'06:00'});
  });
  it('opens personal stories, reading circles, and books through Community',async()=>{
    const user=userEvent.setup();await open();
    await user.click(within(screen.getByRole('navigation',{name:'Mobile navigation'})).getByRole('button',{name:'Community'}));
    expect(screen.getByRole('button',{name:/Testimonies Remember an answer/})).toBeTruthy();
    await user.click(screen.getByRole('button',{name:/Prayer book library Find a good book/}));
    await user.click(screen.getAllByRole('button',{name:'+ Add to shelf'})[0]);
    await waitFor(async()=>expect((await readData()).books).toHaveLength(1));
    await user.click(screen.getByRole('button',{name:'Bookmark next chapter'}));
    await waitFor(async()=>expect((await readData()).books[0].bookmark).toBe(1));
    await user.type(screen.getByRole('textbox',{name:'Search prayer books'}),'Murray');
    expect(screen.getByText('Bookmark: chapter 1')).toBeTruthy();
  });
});
