import {renderEventDescription} from './event-content.js';
import {renderEventLinks} from './event-links.js';
import {eventContent} from './event-record.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safe=value=>{try{return new URL(value).protocol==='https:'?value:'';}catch{return '';}};
const external=(url,label,cls='btn outline')=>safe(url)?`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';
const eyebrow=(number,label)=>`<div class="eyebrow"><span class="section-no">${String(number).padStart(2,'0')}</span> ${esc(label)}</div>`;
const file=document=>`<div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>${esc(document.name.replace(/\.pdf$/i,''))}</h3></div>${safe(document.path)||/^\/(?:uploads|assets)\/[^?#]*\.pdf$/.test(document.path)?`<a class="moot-download-link" href="${esc(document.path)}" target="_blank" rel="noopener noreferrer">View PDF</a>`:''}</div>`;
function gallery(event,number=null) {
  const photos=event.photos||[];
  return `<section class="moot-photos" aria-labelledby="event-photos-title"><div class="moot-photo-heading"><div>${number?eyebrow(number,'Gallery'):''}<h2 id="event-photos-title">Gallery</h2></div><p>${photos.length?`${photos.length} photograph${photos.length===1?'':'s'}`:'No photographs published yet.'}</p></div><div class="moot-photo-grid">${photos.map((path,index)=>{const caption=event.photo_captions?.[path]||'';return `<figure><button class="photo-open" data-cms="view-photo" data-event="${esc(event.id)}" data-index="${index}"><img src="${esc(path)}" alt="${esc(caption||event.title+' — photograph '+(index+1))}" loading="lazy"></button><figcaption><span>${String(index+1).padStart(2,'0')}</span>${esc(caption||'Event photograph')}</figcaption></figure>`;}).join('')}</div></section>`;
}
function schedule(competition) {
  return `<div class="moot-schedule-grid"><div><h3>Competition dates</h3>${renderEventDescription(competition.schedule)||'<p>Schedule to be confirmed.</p>'}</div><div><h3>Who can take part</h3>${renderEventDescription(competition.participation)||'<p>Participation details to follow.</p>'}</div></div>`;
}
export function renderEventLayout(event,settings,{competition=null,programme=''}={}) {
  const past=event.status==='past',content=eventContent(event);
  const status=past?'Past event':event.status==='ongoing'?'Ongoing':'Upcoming event';
  const documents=event.documents||[];
  const registration=competition?.registration||event.registration;
  const label=past?'Event recap':competition?'Competition information':programme?'Society programme':'Event information';
  const question=competition&&documents.find(document=>/moot\s*(problem|question)/i.test(document.name)||/^ATC INTERNAL MOOT COMPETITION 2026(?:\.pdf)?$/i.test(document.name.trim()));
  let resources=documents.map(file).join('');
  if(competition){
    resources=(question?file({...question,name:'Moot Question'}):past?'':'<div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>Moot Question</h3><p>No release yet.</p></div><span class="file-pending">Not released</span></div>')+documents.filter(document=>!question||question.path!==document.path).map(file).join('');
    resources+=`<div class="moot-file"><span class="file-tag drive-tag" aria-hidden="true">DRIVE</span><div><h3>Competition updates & clarifications</h3><p>Questions, updates and clarifications from the society.</p></div>${external(competition.drive,'Open Drive','moot-download-link')||'<span class="file-pending">Link to follow</span>'}</div>`;
  }
  const header=`<div class="wrap moot-topline"><a href="#/events">Back to events</a><span class="preview-label">${label}</span></div><section class="moot-header"><div class="wrap"><div class="eyebrow">${esc(settings.location||'ATC Penang')} · ${esc(event.category||'Society event')}</div><h1>${esc(event.title)}</h1><p class="moot-lead">${!past&&competition?'Research the law. Build your argument. Find your voice.':status}</p><dl class="moot-facts event-facts"><div><dt>When</dt><dd>${!past&&competition?'See schedule below':esc(event.date||'Date to be confirmed')}</dd></div>${content.venue?`<div><dt>Venue</dt><dd>${esc(content.venue)}</dd></div>`:''}<div><dt>Category</dt><dd>${esc(event.category||'Society event')}</dd></div><div><dt>Status</dt><dd>${status}</dd></div></dl></div></section>`;
  const end=`<div class="moot-end"><a href="#/events">All society events</a><a href="mailto:${esc(settings.email||'')}">Contact the society</a></div>`;
  const links=renderEventLinks(event);
  if(past){
    const article=content.recap||content.introduction;
    return `<div class="event-preview moot-preview unified-event article-event">${header}<div class="wrap article-event-body"><nav class="event-actions article-shortcuts" aria-label="Event resources"><button type="button" class="btn outline" data-event-scroll="event-files">Files & Links</button>${(event.photos||[]).length?'<button type="button" class="btn outline" data-event-scroll="event-gallery">Gallery</button>':''}${links}</nav>${content.recap&&content.introduction?`<div class="event-copy article-introduction">${renderEventDescription(content.introduction)}</div>`:''}${article?`<article class="event-copy event-recap-copy" aria-label="Event recap">${renderEventDescription(article)}</article>`:''}<section id="event-files" class="article-event-files" aria-labelledby="event-documents-title"><h2 id="event-documents-title">Files & Links</h2>${resources||'<p class="small muted">No documents published yet.</p>'}${event.registration?external(event.registration,'Original registration link'):''}${competition?`<details class="event-archive-details"><summary>Competition dates & participation</summary>${schedule(competition)}</details>`:''}${programme?`<details class="event-archive-details"><summary>Topics & discussions</summary>${programme}</details>`:''}</section><div id="event-gallery">${gallery(event)}</div>${end}</div></div>`;
  }
  let section=3;
  const details=competition?`<section class="moot-schedule" aria-labelledby="event-details-title">${eyebrow(section++,'On this website')}<h2 id="event-details-title">Schedule & participation</h2>${schedule(competition)}</section>`:programme?`<section class="event-programme-section">${eyebrow(section++,'Legal knowledge')}<h2>Topics & discussions</h2>${programme}</section>`:'';
  return `<div class="event-preview moot-preview unified-event information-event">${header}<div class="wrap moot-body"><p class="moot-disclaimer">${competition?'Competition dates and participation details may be updated by the society. Please check this page for the latest schedule.':'Please check this page for updates from the society.'}</p><div class="moot-overview"><section class="moot-about">${eyebrow(1,competition?'The competition':'The event')}<h2>${competition?'Put theory<br>into practice.':programme?'Read. Discuss.<br>Share your perspective.':'About this event'}</h2><div class="event-copy moot-description">${renderEventDescription(content.introduction)}</div><div class="event-actions">${external(registration,competition?'Register your team':'Register for this event','btn moot-register')}${links}</div></section><section class="moot-downloads" aria-labelledby="event-documents-title">${eyebrow(2,'Resources')}<h2 id="event-documents-title">${competition?'Competition documents':'Event documents'}</h2>${resources||'<p class="small muted">No documents published yet.</p>'}</section></div>${details}${gallery(event,section)}${end}</div></div>`;
}

if(typeof document!=='undefined')document.addEventListener('click',event=>{const button=event.target.closest('[data-event-scroll]');if(button)document.getElementById(button.dataset.eventScroll)?.scrollIntoView({behavior:'smooth',block:'start'});});
