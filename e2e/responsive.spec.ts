import { expect, test, type Page } from '@playwright/test';
import { initial, type Data } from '../src/data';

const longWord='Neighbourhood'.repeat(8);
const words=`Praying with our neighbours · ${longWord} · நம்பிக்கையுடன் ஜெபிப்போம்`;
const now='2026-11-02T07:00:00.000Z';
const sample: Data={...structuredClone(initial),
  prayers:[{id:'prayer',title:words,body:words,category:'Missions',status:'Answered',priority:true,created:now,updated:now,updates:[],recurrence:'Daily',date:'',sharing:'shareable',praise:words,answeredAt:now}],
  entries:[{id:'entry',title:words,body:words,mood:'Reflective',created:now}],
  testimonies:[{id:'story',title:words,body:words,praise:words,created:now,scripture:longWord,topics:[longWord]}],
  reminders:[{id:'reminder',title:words,mode:'Custom',time:'07:00',endTime:'21:00',days:[1,2,3],times:['07:00','12:30','19:00'],date:'',enabled:false}],
  books:[{id:'book',title:words,author:longWord,url:'',chapters:10,completed:2,notes:words,language:'Tamil',bookmark:3}],
  readingGroups:[{id:'group',name:words,bookId:'book',meeting:'2026-11-10T18:00',chapter:longWord,prompt:words,notes:words}],
};

async function fits(page:Page,label:string) {
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
  const problems=await page.evaluate(()=>{
    const width=document.documentElement.clientWidth;
    const issues:string[]=[];
    if(document.documentElement.scrollWidth>width+1) issues.push(`document: ${document.documentElement.scrollWidth} > ${width}`);
    const bottom=document.querySelector<HTMLElement>('.bottom-nav')!;
    const main=document.querySelector('main')!;
    if(getComputedStyle(bottom).display!=='none'&&parseFloat(getComputedStyle(main).paddingBottom)<bottom.getBoundingClientRect().height+12)issues.push('content needs more clearance above bottom navigation');
    const dialog=document.querySelector('dialog[open]');
    const root=dialog||document.querySelector('main')!;
    if(dialog&&dialog.scrollWidth>dialog.clientWidth+1)issues.push('dialog has horizontal overflow');
    for(const el of root.querySelectorAll<HTMLElement>('*')){
      // Research data and tab strips intentionally scroll within their own bounds.
      if(el.closest('svg, .hero-art, .research-table-scroll table, .tabs > button, .botanical, .reflection-squiggle'))continue;
      if(!el.getClientRects().length)continue;
      const r=el.getBoundingClientRect();
      if(r.width&& (r.right>width+1||r.left< -1)) issues.push(`${el.tagName}.${el.className}: ${Math.round(r.left)}…${Math.round(r.right)}`);
    }
    return issues.slice(0,12);
  });
  expect(problems,label).toEqual([]);
}

for(const mode of ['standard','large-tamil-dark'] as const) {
  test(`all pages and editors fit: ${mode}`,async({page},testInfo)=>{
    await page.goto('/');
    await expect(page.locator('main h1')).toBeVisible();
    const data=structuredClone(sample);
    if(mode!=='standard')data.settings={language:'ta',dark:true,large:true,name:longWord.slice(0,30)};
    await page.evaluate(async data=>{
      const db=await new Promise<IDBDatabase>((resolve,reject)=>{const req=indexedDB.open('prayer-private',1);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
      await new Promise<void>((resolve,reject)=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(data,'data');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});db.close();
    },data);
    await page.reload();await expect(page.locator('main h1')).toBeVisible();
    // Drive navigation by its stable order so translated labels are exercised too.
    const names=['Today','My prayers','Pray for your city','Community','Prayer reminders','Journal','Testimonies','Prayer book library','Pray together','Research workspace','Gratitude garden','Scripture library'];
    async function go(name:string){
      const menu=page.getByRole('button',{name:'Open menu',exact:true});if(await menu.isVisible())await menu.click();
      await page.locator('.sidebar button.nav-item').nth(names.indexOf(name)).click();
      await fits(page,name);
      if(mode==='standard'&&['small-phone','desktop'].includes(testInfo.project.name))await page.screenshot({path:testInfo.outputPath(`${name.replaceAll(' ','-')}.png`),animations:'disabled'});
    }
    for(const name of names)await go(name);
    await go('Today');
    await page.locator('.scripture-hero .primary').click();await fits(page,'Prayer session duration');
    await page.locator('.session-content > .primary').click();await fits(page,'Active prayer session');await page.keyboard.press('Escape');
    await go('My prayers');await page.locator('.prayer-card').first().click();await fits(page,'Prayer detail and answered praise');
    await page.getByRole('button',{name:'Review & share',exact:true}).click();await fits(page,'Share preview');await page.keyboard.press('Escape');
    // Sharing replaces the detail dialog; close any remaining dialog before navigating.
    if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');
    await page.locator('.page-heading .primary').click();await fits(page,'Prayer editor');await page.keyboard.press('Escape');
    await go('Journal');await page.locator('.journal-entry').click();await fits(page,'Reflection editor');await page.keyboard.press('Escape');
    await go('Prayer reminders');await page.getByRole('button',{name:'Add reminder',exact:true}).click();await page.getByRole('combobox',{name:/Repeat/}).selectOption('Custom');await fits(page,'Reminder editor and quiet hours');
    await go('Testimonies');await page.getByRole('button',{name:'Write a testimony'}).click();await fits(page,'Testimony editor');
    await go('Prayer book library');await page.getByRole('button',{name:'Add a book',exact:true}).click();await fits(page,'Book editor');
    await go('Pray together');await page.getByRole('button',{name:'Create reading plan'}).click();await fits(page,'Reading plan editor');
    await go('Pray for your city');await page.getByRole('button',{name:'Find my city',exact:true}).click();await fits(page,'City location consent');
    await page.getByLabel('City name',{exact:true}).fill('Chennai');await page.getByRole('button',{name:'Choose city',exact:true}).click();await page.getByRole('button',{name:'Edit city notes',exact:true}).click();await fits(page,'Personal city notes editor');
    // Personal city is Chennai, so return to the catalogue before opening Delhi.
    const back=page.getByRole('button',{name:'All 42 cities',exact:true});if(await back.isVisible())await back.click();
    await page.getByLabel('Search city research').fill('Delhi');
    await page.getByRole('button',{name:/Delhi Delhi.*Explore prayer guide/}).click();
    for(const tab of ['Prayer guide','Background','Indicators','People & communities','Sources','Your review']){
      await page.locator('.research-tabs').getByRole('button',{name:tab,exact:true}).click();await fits(page,`City ${tab}`);
      if(tab==='People & communities'){
        const table=page.getByRole('table',{name:'Religion in NCT Delhi'});
        await expect(table.getByRole('columnheader')).toHaveText(['Religion','People','Share']);
        await expect(table.getByRole('row')).toHaveCount(9);
        expect(await table.evaluate(el=>el.scrollWidth<=el.parentElement!.clientWidth+1)).toBe(true);
        await page.locator('.religion-section').screenshot({path:testInfo.outputPath(`religion-${mode}.png`),animations:'disabled',style:'.bottom-nav, .toast { visibility: hidden; }'});
      }
    }
    await page.getByRole('button',{name:'Pray for Delhi',exact:true}).click();await fits(page,'Guided city prayer');await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Open personal settings'}).click();await fits(page,'Settings and backup actions');await page.keyboard.press('Escape');
    const payload=Buffer.from(JSON.stringify({version:1,kind:'testimony',title:words,text:words,praise:words})).toString('base64url');
    await page.goto(`/#share=${payload}`);await expect(page.getByRole('dialog',{name:'Shared encouragement'})).toBeVisible();await fits(page,'Incoming shared encouragement');
  });
}
