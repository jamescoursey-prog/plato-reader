import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {readerHref} from './reader-link.mjs';
describe('Stephanus links for every Republic book',()=>{
  const starts=[['327a',1],['357a',2],['386a',3],['419a',4],
    ['449a',5],['484a',6],['514a',7],['543a',8],['571a',9],['595a',10]];
  for(const [loc,book] of starts){
    it('Republic '+loc+' routes to book '+book,()=>{
      assert.equal(readerHref('Republic',loc),
        'https://plato.johnhboyer.com/Republic/book/'+book+'/?loc='+loc);
    });
  }
  it('single-dialogue citations route to book 1',()=>{
    assert.equal(readerHref('Theaetetus','183e'),
      'https://plato.johnhboyer.com/Theaetetus/book/1/?loc=183e');
    assert.equal(readerHref('Meno','76c'),
      'https://plato.johnhboyer.com/Meno/book/1/?loc=76c');
  });
  it('rejects malformed or out-of-range section labels',()=>{
    for(const loc of ['600','600x','<script>','999a']){
      assert.throws(()=>readerHref('Republic',loc));
    }
  });
});
