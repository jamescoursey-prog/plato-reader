// The Republic has ten separate routes; Stephanus numbers do not work
// reliably when a link is always directed to Book I.
const REPUBLIC_BOOK_STARTS=[327,357,386,419,449,484,514,543,571,595];
export function readerHref(work,section){
  if(!/^\d{1,3}[a-e]$/.test(section))throw new Error('Invalid Stephanus section '+section);
  let book=1;
  if(work==='Republic'){
    const page=Number.parseInt(section,10);
    book=REPUBLIC_BOOK_STARTS.findLastIndex(start=>page>=start)+1;
    if(book===0||page>621)throw new Error('Outside Republic Stephanus range: '+section);
  }
  return 'https://plato.johnhboyer.com/'+encodeURIComponent(work)+
    '/book/'+book+'/?loc='+encodeURIComponent(section);
}
