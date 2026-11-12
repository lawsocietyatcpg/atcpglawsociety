import {renderEventDescription} from './event-content.js';
import {renderEventLinks} from './event-links.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safe=value=>{try{return new URL(value).protocol==='https:'?value:'';}catch{return '';}};
const external=(url,label,cls='btn outline')=>safe(url)?`<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';
const eyebrow=(number,label)=>`<div class="eyebrow"><span class="section-no">${String(number).padStart(2,'0')}</span> ${esc(label)}</div>`;
const file=document=>`<div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>${esc(document.name.replace(/\.pdf$/i,''))}</h3></div>${safe(document.path)||/^\/(?:uploads|assets)\/[^?#]*\.pdf$/.test(document.path)?`<a class="moot-download-link" href="${esc(document.path)}" target="_blank" rel="noopener noreferrer">View PDF</a>`:''}</div>`;
export function renderEventLayout(event,settings,{competition=null,programme=''}={}) {
  const past=event.status==='past';
  const status=past?'Past event':event.status==='ongoing'?'Ongoing':'Upcoming event';
  const documents=event.documents||[],photos=event.photos||[];
  const description=event.description||'';
  // Long recaps keep a full-width reading column; the opening paragraph sits beside resources.
  const paragraphs=description.split(/\n\s*\n/);
  const split=!competition&&!programme&&description.length>900&&paragraphs.length>1;
  const introduction=split?paragraphs[0]:description;
  const recap=split?paragraphs.slice(1).join('\n\n'):'';
  const registration=competition?.registration||event.registration;
  const label=competition?'Competition information':programme?'Society programme':past?'Event recap':'Event information';
  const question=competition&&documents.find(document=>/moot\s*(problem|question)/i.test(document.name)||/^ATC INTERNAL MOOT COMPETITION 2026(?:\.pdf)?$/i.test(document.name.trim()));
  let resources=documents.map(document=>file(document)).join('');
  if(competition){
    resources=(question?file({...question,name:'Moot Question'}):'<div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>Moot Question</h3><p>No release yet.</p></div><span class="file-pending">Not released</span></div>')+documents.filter(document=>!question||question.path!==document.path).map(file).join('');
    resources+=`<div class="moot-file"><span class="file-tag drive-tag" aria-hidden="true">DRIVE</span><div><h3>Competition updates & clarifications</h3><p>Questions, updates and clarifications from the society.</p></div>${external(competition.drive,'Open Drive','moot-download-link')||'<span class="file-pending">Link to follow</span>'}</div>`;
  }
  let section=3;
  const details=competition?`<section class="moot-schedule" aria-labelledby="event-details-title">${eyebrow(section++,'On this website')}<h2 id="event-details-title">Schedule & participation</h2><div class="moot-schedule-grid"><div><h3>Competition dates</h3>${renderEventDescription(competition.schedule)||'<p>Schedule to be confirmed.</p>'}</div><div><h3>Who can take part</h3>${renderEventDescription(competition.participation)||'<p>Participation details to follow.</p>'}</div></div></section>`:recap?`<section class="event-recap-section">${eyebrow(section++,'The experience')}<h2>${past?'Event recap':'Event details'}</h2><article class="event-copy">${renderEventDescription(recap)}</article></section>`:programme?`<section class="event-programme-section">${eyebrow(section++,'Legal knowledge')}<h2>Topics & discussions</h2>${programme}</section>`:'';
  const links=renderEventLinks(event);
  return `<div class="event-preview moot-preview unified-event">
    <div class="wrap moot-topline"><a href="#/events">Back to events</a><span class="preview-label">${label}</span></div>
    <section class="moot-header"><div class="wrap"><div class="eyebrow">${esc(settings.location||'ATC Penang')} · ${esc(event.category||'Society event')}</div><h1>${esc(event.title)}</h1><p class="moot-lead">${competition?'Research the law. Build your argument. Find your voice.':status}</p>
      <dl class="moot-facts"><div><dt>When</dt><dd>${competition?'See schedule below':esc(event.date||'Date to be confirmed')}</dd></div><div><dt>${competition?'Where':'Category'}</dt><dd>${competition?'ATC Penang · Moot Court':esc(event.category||'Society event')}</dd></div><div><dt>${competition?'Registration':'Status'}</dt><dd>${competition?(external(registration,'Register your team','')||'Link to follow'):status}</dd></div></dl>
    </div></section>
    <div class="wrap moot-body"><p class="moot-disclaimer">${competition?'Competition dates and participation details may be updated by the society. Please check this page for the latest schedule.':past?'An activity from the society’s event archive.':'Please check this page for updates from the society.'}</p>
      <div class="moot-overview"><section class="moot-about">${eyebrow(1,competition?'The competition':'The event')}<h2>${competition?'Put theory<br>into practice.':programme?'Read. Discuss.<br>Share your perspective.':'About this event'}</h2><div class="event-copy moot-description">${renderEventDescription(introduction)}</div><div class="event-actions">${(!past||competition)?external(registration,competition?'Register your team':'Register for this event','btn moot-register'):''}${links}</div></section>
      <section class="moot-downloads" aria-labelledby="event-documents-title">${eyebrow(2,'Resources')}<h2 id="event-documents-title">${competition?'Competition documents':'Event documents'}</h2>${resources||'<p class="small muted">No documents published yet.</p>'}</section></div>
      ${details}
      <section class="moot-photos" aria-labelledby="event-photos-title"><div class="moot-photo-heading"><div>${eyebrow(section,'Gallery')}<h2 id="event-photos-title">${competition?'From the competition':'From the event'}</h2></div><p>${photos.length?`${photos.length} photograph${photos.length===1?'':'s'}`:'No photographs published yet.'}</p></div><div class="moot-photo-grid">${photos.map((path,index)=>{const caption=event.photo_captions?.[path]||'';return `<figure><button class="photo-open" data-cms="view-photo" data-event="${esc(event.id)}" data-index="${index}"><img src="${esc(path)}" alt="${esc(caption||event.title+' — photograph '+(index+1))}" loading="lazy"></button><figcaption><span>${String(index+1).padStart(2,'0')}</span>${esc(caption||'Event photograph')}</figcaption></figure>`;}).join('')}</div></section>
      <div class="moot-end"><a href="#/events">All society events</a><a href="mailto:${esc(settings.email||'')}">Contact the society</a></div>
    </div></div>`;
}
