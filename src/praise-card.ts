import type { ShareCard } from './features-model';
const escape=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
function wrap(text:string,width:number):string[]{
  const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
  const lines:string[]=[];
  for(const paragraph of text.split('\n')){
    let current='';let length=0;
    for(const item of segmenter.segment(paragraph)){
      current+=item.segment;length++;
      if(length>=width){lines.push(current);current='';length=0;}
    }
    lines.push(current);
  }
  return lines;
}
export function thanksgivingCard(card:ShareCard):string{
  if(card.title.length+card.text.length+card.praise.length>1200)throw new Error('For a readable card, shorten the reviewed title, message, and praise point to 1,200 characters in total.');
  const title=wrap(card.title,28),body=wrap(card.text,43),praise=card.praise?wrap(card.praise,43):[];
  const bodyY=260+title.length*66+65;
  const praiseY=bodyY+body.length*49+55;
  const height=Math.max(1080,praiseY+praise.length*49+170);
  const lines=(items:string[],x:number,y:number,step:number)=>items.map((line,i)=>`<tspan x="${x}" y="${y+i*step}">${escape(line)}</tspan>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}" role="img" aria-labelledby="title desc"><title id="title">${escape(card.title)}</title><desc id="desc">${escape(card.text+' '+card.praise)}</desc><rect width="1080" height="${height}" fill="#f7f6ed"/><rect x="42" y="42" width="996" height="${height-84}" rx="28" fill="none" stroke="#d7dfcd" stroke-width="2"/><path d="M865 200v-70m0 35c-40 0-57-30-49-53 36 0 55 26 49 53m0-18c-3-35 20-54 48-49 3 29-17 51-48 49" fill="none" stroke="#9bab85" stroke-width="4" stroke-linecap="round"/><text x="100" y="155" font-family="sans-serif" font-size="17" letter-spacing="4" fill="#8d9b7d">A REASON TO GIVE THANKS</text><text font-family="Georgia,serif" font-size="57" fill="#40533c">${lines(title,100,260,66)}</text><text font-family="sans-serif" font-size="32" fill="#69765f">${lines(body,100,bodyY,49)}</text>${praise.length?`<path d="M100 ${praiseY-35}h90" stroke="#b6c2a5" stroke-width="2"/><text font-family="Georgia,serif" font-size="33" font-style="italic" fill="#6e805e">${lines(praise,100,praiseY+20,49)}</text>`:''}<text x="100" y="${height-100}" font-family="Georgia,serif" font-size="25" fill="#758768">Prayer · A quiet place to meet with God.</text></svg>`;
}
