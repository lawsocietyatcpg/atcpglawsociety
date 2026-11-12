import assert from 'node:assert/strict';
import {applyAction} from './lib/actions.js';
import {renderEventLinks} from './dist/event-links.js';
import {createCaptionAutosave} from './dist/caption-autosave.js';

const state={events:[]};
const event={title:'Past trip',date:'5 Nov',category:'Visit',description:'Recap',status:'past',instagram:'https://www.instagram.com/p/example/',links:[{name:'Watch the replay',url:'https://example.com/replay'},{name:'LinkedIn post',url:'https://www.linkedin.com/posts/example'}]};
applyAction(state,'save-event',event,{});
const saved=state.events[0];
assert.deepEqual(saved.links,event.links);
for(const links of [[{name:'Bad',url:'javascript:alert(1)'}],[{name:'',url:'https://example.com'}],{},[{name:'Bad',url:''}]])assert.throws(()=>applyAction(structuredClone(state),'save-event',{...event,id:saved.id,links},{}));
let html=renderEventLinks(saved);
assert.match(html,/Watch the replay/);assert.match(html,/LinkedIn post/);assert.match(html,/View Instagram post/);
assert.doesNotMatch(renderEventLinks({links:[{name:'<script>',url:'javascript:alert(1)'}]}),/<script>/);
assert.match(renderEventLinks({links:[{name:'<b>name</b>',url:'https://example.com'}]}),/&lt;b&gt;name/);
applyAction(state,'save-event',{...event,id:saved.id,links:[]},{});assert.deepEqual(state.events[0].links,[]);

// Pause the first request while more text arrives, then ensure the latest text wins.
const calls=[], statuses=[];
let release,started;
const began=new Promise(resolve=>started=resolve);
const hold=new Promise(resolve=>release=resolve);
const autosave=createCaptionAutosave({delay:5,status:(_,__,text)=>statuses.push(text),save:async(id,path,value)=>{calls.push([id,path,value]);if(calls.length===1){started();await hold;}}});
autosave.getValue('trip','photo','Old');
autosave.edit('trip','photo','First');
await began;
autosave.edit('trip','photo','Latest');
const flushed=autosave.flush();release();await flushed;
assert.deepEqual(calls.map(call=>call[2]),['First','Latest']);assert.equal(autosave.pending(),false);
assert.equal(statuses.at(-1),'Caption saved automatically.');
autosave.edit('trip','photo','');await autosave.flush();assert.equal(calls.at(-1)[2],'');
// Re-rendering must preserve a pending draft rather than replace it with old state.
autosave.edit('trip','photo','New draft');assert.equal(autosave.getValue('trip','photo',''),'New draft');await autosave.flush();
let fail=true;
const retry=createCaptionAutosave({save:async()=>{if(fail)throw Error('Offline');}});
retry.getValue('trip','photo','');retry.edit('trip','photo','Keep my text');
await assert.rejects(retry.flush());assert.equal(retry.pending(),true);assert.equal(retry.getValue('trip','photo',''),'Keep my text');
fail=false;await retry.flush();assert.equal(retry.pending(),false);
console.log('PASS: named event links, safe rendering, removal, latest caption wins, automatic save, draft retention and failure retry.');
