import {mountLogo} from './logo3d.js';

export function createCMS(ctx){
  const {getState,main,dialog,esc,api,load,render,refresh,showDialog,toast,editItem}=ctx;
  let section='home',dispose=()=>{},dirty=false,importFile=null;
  const titles={home:'Home & branding',about:'About & committee',events:'Events',topics:'Legal topics',contact:'Contact',moderation:'Moderation',account:'Account & backups'};
  const br=s=>esc(s).replace(/\n/g,'<br>');
  const input=(key,label,value,type='text',hint='')=>`<div class="cms-field"><label for="cms-${key}">${label}</label>${type==='textarea'?`<textarea id="cms-${key}" name="${key}" rows="3">${esc(value)}</textarea>`:`<input id="cms-${key}" name="${key}" type="${type}" value="${esc(value)}">`}${hint?`<small class="muted">${hint}</small>`:''}</div>`;
  const settingsForm=(body)=>`<form data-cms-form="settings"><div class="form-grid">${body}</div><div class="save-bar"><span data-save-status>Changes appear on the website after saving.</span><button class="btn" type="submit">Save changes</button></div><p class="error" role="alert"></p></form>`;
  const select=(key,label,items,value)=>`<div class="cms-field"><label for="cms-${key}">${label}</label><select id="cms-${key}" name="${key}"><option value="">Automatic — first available</option>${items.map(i=>`<option value="${esc(i.id)}" ${value===i.id?'selected':''}>${esc(i.title)}</option>`).join('')}</select></div>`;
  const state=()=>getState();
  function disposeLogo(){dispose();dispose=()=>{}}
  function decorateShell(){
    const s=state().settings;
    for(const [key,variable] of [['color_primary','--purple'],['color_background','--paper'],['color_accent','--gold'],['color_text','--ink']])document.documentElement.style.setProperty(variable,s[key]);
    const brand=document.querySelector('.brand');
    brand.querySelector('img').src=s.logo;brand.querySelector('strong').textContent=s.site_name;
    brand.querySelector('span').textContent=`${s.location} · ${s.term}`;
    document.title=`${s.site_name} · ${s.location}`;
    document.querySelector('link[rel="icon"]').href=s.logo;
    document.querySelector('.links').insertAdjacentHTML('beforeend','<button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch colour mode"><span class="theme-symbol" aria-hidden="true">☾</span><span class="theme-label">Dark</span></button>');
    document.dispatchEvent(new Event('theme-controls-ready'));
    document.querySelector('.footer-inner').innerHTML=`<div><span>© ${new Date().getFullYear()} ${esc(s.site_name)} ${esc(s.location)}</span><small class="creator-credit">Website created by Ooi Pin Qi · Vice President, 2026/2027.<br>Original website design & development attribution. Please retain this credit.</small></div><span>${esc(s.term)} Committee</span><a href="#/admin">Admin</a>`;
  }
  function decorateHome(){
    disposeLogo();const s=state().settings;
    document.querySelector('.hero .eyebrow').textContent=s.hero_eyebrow;
    document.querySelector('.hero h1').innerHTML=`${br(s.hero_title)}<br><em>${br(s.hero_accent)}</em>`;
    document.querySelector('.hero-copy').textContent=s.hero_description;
    const art=document.querySelector('.hero-art');
    art.innerHTML=s.logo_3d?`<div class="logo-scene"><div class="eyebrow">Drag to inspect</div><div class="logo-canvas"></div><div class="logo-controls"><button data-logo-pause type="button">Pause rotation</button><button data-logo-reset type="button">Reset view</button></div><span class="edition">${esc(s.term)} · THE SOCIETY EMBLEM</span></div>`:`<img src="${esc(s.logo)}" alt="${esc(s.site_name)} emblem">`;
    if(s.logo_3d)dispose=mountLogo(art.querySelector('.logo-canvas'),s.logo);
    const topic=state().topics.find(t=>t.id===s.featured_topic)||state().topics.find(t=>t.status!=='archived');
    const event=state().events.find(e=>e.id===(s.featured_event||'1')&&e.status!=='past')||state().events.find(e=>e.status!=='past');
    const cards=document.querySelectorAll('.hero-feature');
    cards[0].querySelector('.eyebrow').textContent=s.topic_label;cards[0].querySelector('.btn').textContent=s.topic_button;
    cards[0].querySelector('h3').textContent=topic?.title||'Legal knowledge & discussion';
    cards[0].querySelector('p').textContent=topic?`Explainer ${friendlyDate(topic.publish)} · Discussion ${friendlyDate(topic.discussion)}`:'New topics will be announced here.';
    cards[0].querySelector('.btn').href=topic?'#/topic/'+topic.id:'#/dialogue';
    const topicActions=document.createElement('div');topicActions.className='topic-entry-actions';
    topicActions.append(cards[0].querySelector('.btn'));cards[0].append(topicActions);
    const meeting=topic?.meet;
    const validMeeting=meeting&&/^https:\/\//i.test(meeting);
    topicActions.insertAdjacentHTML('beforeend',validMeeting?`<a class="meeting-entry" href="${esc(meeting)}" target="_blank" rel="noopener noreferrer">Join Google Meet</a>`:'<span class="meeting-pending">Google Meet · Link coming soon</span>');
    cards[1].querySelector('.eyebrow').textContent=s.event_label;cards[1].querySelector('.btn').textContent=s.event_button;
    cards[1].querySelector('h3').textContent=event?.title||'Our next activity';
    cards[1].querySelector('p').textContent=event?`${event.date} · ${event.status==='planned'?'Planned':event.status==='ongoing'?'Ongoing':'Upcoming'}`:'Details to be announced';
    cards[1].querySelector('.btn').href=event&&event.status!=='planned'?'#/event/'+event.id:'#/events';
    document.querySelector('#about h2').innerHTML=br(s.about_title);
    document.querySelector('.committee-head h3').textContent=s.committee_title;
    document.querySelector('.committee-head .eyebrow').textContent='Committee · '+s.term;
    document.querySelector('.about-body').innerHTML=s.principles.map(p=>`<div class="principle"><span>${esc(p[0])}</span><h3>${esc(p[1])}</h3><p>${esc(p[2])}</p></div>`).join('');
    document.querySelector('#events h2').innerHTML=br(s.events_title);
    document.querySelector('#events .intro p').textContent=s.events_intro;
    document.querySelector('#events .intro small').textContent=s.events_note;
    const programme=document.createElement('div');programme.className='event-programme';
    const eventWrap=document.querySelector('#events>.wrap');
    eventWrap.append(programme);programme.append(eventWrap.querySelector('.tabs'),eventWrap.querySelector('#event-list'));
    document.querySelector('#contact h2').innerHTML=br(s.contact_title);
    const insta=document.querySelector('.contact-links a[target]');
    if(insta)insta.innerHTML='<small>INSTAGRAM</small>'+esc(s.instagram_label);
    decorateEventList();
  }
  function decorateEventList(){
    const list=document.querySelector('#event-list');if(!list)return;
    const recurring=list.querySelector('a[href="#/event/biweekly"]');if(recurring)recurring.href='#/dialogue';
    if(!state().settings.moot_preview)return;
    for(const row of list.querySelectorAll('.event-row.planned')){
      if(row.querySelector('h3')?.textContent!=='Annual Internal Moot Competition')continue;
      const anchor=document.createElement('a');anchor.className='event-row preview-event';anchor.href='#/event-preview';anchor.innerHTML=row.innerHTML;
      anchor.querySelector('.status').textContent='Layout preview';row.replaceWith(anchor);
    }
  }
  function eventPreview(){
    const event=state().events.find(e=>e.id==='1');
    main.innerHTML=`<div class="event-preview moot-preview">
      <div class="wrap moot-topline"><a href="#/events">Back to events</a><span class="preview-label">Layout preview</span></div>
      <section class="moot-header"><div class="wrap">
        <div class="eyebrow">ATC Penang · Advocacy</div>
        <h1>${esc(event?.title||'Annual Internal Moot Competition')}</h1>
        <p class="moot-lead">Research the law. Build your argument. Find your voice.</p>
        <dl class="moot-facts"><div><dt>When</dt><dd>${esc(event?.date||'Early / Mid-Nov 2026')}</dd></div><div><dt>Where</dt><dd>ATC Penang</dd></div><div><dt>Status</dt><dd>Proposed · Details to follow</dd></div></dl>
      </div></section>
      <div class="wrap moot-body">
        <p class="moot-disclaimer">Sample layout only. The moot problem and event photos are not yet available.</p>
        <div class="moot-overview">
          <section class="moot-about"><div class="eyebrow"><span class="section-no">01</span> The competition</div><h2>Put theory<br>into practice.</h2><p>${esc(event?.description||'Develop legal research and oral advocacy through our annual internal moot competition.')}</p><p class="muted small">The society will confirm the schedule and participation details here.</p></section>
          <section class="moot-downloads" aria-labelledby="moot-download-title"><div class="eyebrow"><span class="section-no">02</span> Resources</div><h2 id="moot-download-title">Competition documents</h2>
            <div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>Moot problem</h3><p>Available when released by the society.</p></div><span class="file-pending">Not released</span></div>
            <div class="moot-file"><span class="file-tag" aria-hidden="true">PDF</span><div><h3>Society proposal</h3><p>Sample download — not the moot problem.</p></div><a href="/assets/sample-proposal.pdf" download="Law-Society-Proposal-example.pdf" class="moot-download-link" aria-label="Download society proposal sample PDF">Download</a></div>
          </section>
        </div>
        <section class="moot-photos" aria-labelledby="moot-photo-title"><div class="moot-photo-heading"><div><div class="eyebrow"><span class="section-no">03</span> Gallery</div><h2 id="moot-photo-title">From the competition</h2></div><p>Photo positions shown below.<br>Actual photos will follow the event.</p></div>
          <div class="moot-photo-grid">${['Group photograph','Oral submissions','Closing moments'].map((name,i)=>`<figure><div class="moot-photo-slot" aria-label="Photo placeholder: ${name}"><svg viewBox="0 0 40 32" fill="none" aria-hidden="true"><rect x="1" y="1" width="38" height="30" rx="1" stroke="currentColor"/><circle cx="28" cy="10" r="3" stroke="currentColor"/><path d="M2 27 13 15l8 8 5-5 12 12" stroke="currentColor"/></svg><span>Photo to come</span></div><figcaption><span>0${i+1}</span>${name}</figcaption></figure>`).join('')}</div>
        </section>
        <div class="moot-end"><a href="#/events">All society events</a><a href="mailto:${esc(state().settings.email)}">Contact the society</a></div>
      </div>
    </div>`;
  }
  function decorateEvent(id){
    const event=state().events.find(e=>e.id===id);if(!event||event.status==='planned')return;
    if(id==='biweekly')main.querySelector('.prose')?.insertAdjacentHTML('afterend','<a class="btn" href="#/dialogue">Explore legal topics</a>');
    const documents=event.documents||[];
    if(documents.length)main.querySelector('.gallery')?.insertAdjacentHTML('beforebegin',`<section class="event-resources"><h3>Event resources</h3>${documents.map(d=>`<div class="resource-row"><span>${esc(d.name)}</span><a class="btn outline" href="${esc(d.path)}" download>Download PDF</a></div>`).join('')}</section>`);
    main.querySelector('.gallery')?.classList.add('event-gallery');
    const gallery=main.querySelector('.gallery');
    if(gallery)gallery.innerHTML=event.photos.map((path,i)=>`<figure><button class="photo-open" data-cms="view-photo" data-event="${event.id}" data-index="${i}"><img src="${esc(path)}" alt="${esc(event.photo_captions?.[path]||event.title+' — photograph '+(i+1))}" loading="lazy"></button>${event.photo_captions?.[path]?`<figcaption>${esc(event.photo_captions[path])}</figcaption>`:''}</figure>`).join('');
  }
  function friendlyDate(value){return value?new Date(value+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'TBC'}
  function openLogin(){
    const setup=!state().admin_configured;
    showDialog(`<h2>${setup?'Set up your admin account.':'Administrator sign in.'}</h2><p class="muted">${setup?'Create the society’s shared administrator username and password. Keep them safely for the next committee. This one-time setup is available only on this local computer.':'Use the society administrator account to update the website.'}</p><form data-cms-form="${setup?'admin-setup':'admin-login'}"><label for="admin-username">Username</label><input id="admin-username" name="username" autocomplete="username" required pattern="[A-Za-z0-9_.-]{3,50}" placeholder="e.g. atclawsociety"><label for="admin-password">Password${setup?' (at least 12 characters)':''}</label><input id="admin-password" name="password" type="password" autocomplete="${setup?'new-password':'current-password'}" required ${setup?'minlength="12"':''} maxlength="128">${setup?'<label for="admin-confirm">Confirm password</label><input id="admin-confirm" name="confirm" type="password" autocomplete="new-password" required>':''}<div class="dialog-foot"><button class="btn" type="submit">${setup?'Create administrator account':'Sign in'}</button></div><p class="error" role="alert"></p></form>`);
  }
  function committeeRow(row=['','']){return `<div class="repeat-row" data-member><div><label>Position<input data-position value="${esc(row[0])}" required maxlength="100"></label></div><div><label>Name<input data-name value="${esc(row[1])}" required maxlength="100"></label></div><button type="button" class="text-button danger" data-cms="remove-row">Remove</button></div>`}
  function principleRow(row=['','','']){return `<div class="principle-editor" data-principle><div class="form-grid">${input('purpose-label-'+Math.random().toString(36).slice(2),'Label',row[0])}${input('purpose-title-'+Math.random().toString(36).slice(2),'Heading',row[1])}</div><label>Description<textarea>${esc(row[2])}</textarea></label><button type="button" class="text-button danger" data-cms="remove-row">Remove purpose</button></div>`}
  function adminBody(){const s=state().settings;
    if(section==='home')return `<h2>Home & branding</h2><p class="muted">Update the first thing visitors see. Choose which topic and event to feature.</p>${settingsForm(`${input('site_name','Society name',s.site_name)}${input('location','Campus / location',s.location)}${input('term','Committee term',s.term)}${input('hero_eyebrow','Small line above the headline',s.hero_eyebrow)}${input('hero_title','Main headline',s.hero_title,'textarea')}${input('hero_accent','Highlighted headline',s.hero_accent,'textarea')}<div class="full">${input('hero_description','Hero introduction',s.hero_description,'textarea')}</div>${input('topic_label','Legal topic label',s.topic_label)}${input('topic_button','Legal topic button text',s.topic_button)}${select('featured_topic','Featured legal topic',state().topics,s.featured_topic)}${select('featured_event','Featured event',state().events.filter(e=>e.status!=='past'),s.featured_event)}${input('event_label','Event label',s.event_label)}${input('event_button','Event button text',s.event_button)}<div class="full"><label for="cms-logo_3d">Logo presentation</label><select id="cms-logo_3d" name="logo_3d"><option value="true" ${s.logo_3d?'selected':''}>Interactive 3D — drag to rotate</option><option value="false" ${!s.logo_3d?'selected':''}>Still image</option></select></div>`)}<div class="panel"><h3>Society logo</h3><img class="logo-thumb" src="${esc(s.logo)}" alt="Current society logo"><label for="cms-logo-file">Replace logo</label><input id="cms-logo-file" type="file" accept="image/png,image/jpeg,image/webp" data-cms-upload="logo"><small class="muted">Use a square PNG or JPEG. The full image, including its background, appears in 3D. Up to 5 MB; uploads save immediately.</small></div>`;
    if(section==='about')return `<h2>About & committee</h2><p class="muted">Update the society introduction and add next year’s committee, one person at a time.</p>${settingsForm(`<div class="full">${input('about_title','About heading',s.about_title,'textarea')}${input('about','Society introduction',s.about,'textarea')}${input('committee_title','Committee heading',s.committee_title)}${input('term','Committee term',s.term)}</div><div class="full"><h3>Committee members</h3><div id="member-rows">${s.committee.map(committeeRow).join('')}</div><button type="button" class="btn outline" data-cms="add-member">Add committee member</button></div><div class="full"><h3 style="margin-top:25px">Our purposes</h3><div id="principle-rows">${s.principles.map(principleRow).join('')}</div><button type="button" class="btn outline" data-cms="add-principle">Add purpose</button></div>`)}`;
    if(section==='contact')return `<h2>Contact</h2><p class="muted">Keep the society’s email address and Instagram up to date.</p>${settingsForm(`${input('contact_title','Contact heading',s.contact_title,'textarea')}${input('email','Society email',s.email,'email')}${input('instagram','Instagram link',s.instagram,'url')}${input('instagram_label','Instagram display name',s.instagram_label)}`)}`;
    if(section==='events'||section==='topics'){
      const events=section==='events',kind=events?'event':'topic',items=state()[section];
      return `<div class="cms-title-row"><div><h2>${events?'Events':'Legal topics'}</h2><p class="muted">${events?'Planned items are grey and non-clickable. Publish details when ready; move finished activities to Past.':'Only administrators create topics. Set a topic to Open when students can start posting.'}</p></div><button class="btn" data-action="edit-${kind}">Add ${kind}</button></div><div class="cms-list">${items.map((item,i)=>`<div class="cms-item"><div><span class="badge">${esc(item.status)}</span><h3>${esc(item.title)}</h3><small>${esc(item.date||item.discussion||'Date to be confirmed')}</small></div><div class="cms-item-buttons"><button class="btn outline" data-action="edit-${kind}" data-id="${item.id}">Edit</button><button class="text-button" data-cms="move" data-collection="${section}" data-id="${item.id}" data-direction="-1" ${i===0?'disabled':''}>Move up</button><button class="text-button" data-cms="move" data-collection="${section}" data-id="${item.id}" data-direction="1" ${i===items.length-1?'disabled':''}>Move down</button><button class="text-button danger" data-action="delete-${kind}" data-id="${item.id}">Delete</button></div></div>`).join('')||'<div class="empty">No items yet. Add your first one above.</div>'}</div><details class="panel"><summary>Edit section headings</summary>${settingsForm(events?`${input('events_title','Events heading',s.events_title,'textarea')}${input('events_intro','Events introduction',s.events_intro,'textarea')}${input('events_note','Schedule note',s.events_note)}`:`${input('dialogue_title','Discussion page heading',s.dialogue_title,'textarea')}${input('dialogue_intro','Discussion introduction',s.dialogue_intro,'textarea')}`)}</details>`;
    }
    if(section==='moderation'){
      const reports=(state().reports||[]).filter(r=>!r.resolved);
      return `<h2>Moderation</h2><p class="muted">Review reports and look after the discussion. Reporting never automatically removes a post.</p><h3>Reports awaiting review (${reports.length})</h3>${reports.map(r=>`<div class="panel"><p><strong>${esc(r.reason)}</strong></p><p>${esc(state().posts.find(p=>p.id===r.post)?.body||'Reposted content')}</p><div class="two-buttons"><button class="btn outline" data-action="resolve-report" data-id="${r.id}">Dismiss report</button><button class="btn outline danger" data-action="delete-post" data-id="${r.post}">Remove post</button></div></div>`).join('')||'<p class="small muted">There are no reports to review.</p>'}<h3 style="margin-top:35px">Student posts</h3>${state().posts.map(p=>`<div class="cms-item"><div><strong>${esc(p.author)}</strong><p>${esc(p.body||'Reposted another perspective')}</p><small>${esc(state().topics.find(t=>t.id===p.topic)?.title)}</small></div><div class="cms-item-buttons"><a class="text-button" href="#/topic/${p.topic}">View discussion</a><button class="text-button" data-action="pin" data-id="${p.id}">${p.pinned?'Unpin':'Pin'}</button><button class="text-button danger" data-action="delete-post" data-id="${p.id}">Remove</button></div></div>`).join('')||'<div class="empty">Student posts will appear here.</div>'}`;
    }
    return `<h2>Account & handover</h2><p class="muted">The website content belongs to the society’s workspace, not to a committee member’s login. Changing this account does not erase content.</p><section class="panel"><h3>Change administrator credentials</h3><p class="small muted">Give the new credentials to the incoming committee securely. Changing them signs out all existing sessions.</p><form data-cms-form="change-credentials">${input('username','Administrator username',state().user.name)}<label for="current-password">Current password</label><input id="current-password" type="password" name="current_password" autocomplete="current-password" required><label for="new-password">New password (at least 12 characters)</label><input id="new-password" type="password" name="password" autocomplete="new-password" minlength="12" maxlength="128" required><label for="new-confirm">Confirm new password</label><input id="new-confirm" type="password" name="confirm" autocomplete="new-password" required><button class="btn" style="margin-top:20px">Update login details</button><p class="error" role="alert"></p></form></section><section class="panel"><h3>Content backup</h3><p>Download a copy of the website’s content and uploaded photographs before handover. Passwords and login sessions are not included.</p><a href="/api/backup" class="btn" download>Download content backup</a><label for="import-backup">Restore a downloaded backup (.zip, up to 50 MB)</label><input id="import-backup" type="file" accept=".zip" data-cms-upload="backup"><p class="small muted">Importing replaces the current content. A recovery version is saved first. Your administrator password stays the same.</p></section><section class="panel"><h3>Recover a previous version</h3><p class="small muted">Every administrator content change saves the version from before that change. The latest 50 are retained; the 20 most recent are shown here. Restoring replaces all website content, including discussions, with that version.</p>${(state().revisions||[]).map(r=>`<div class="admin-item"><div><strong>${esc(r.action.replaceAll('-',' '))}</strong><small>${new Date(r.created*1000).toLocaleString('en-GB')}</small></div><button class="text-button" data-cms="restore" data-id="${r.id}">Restore</button></div>`).join('')||'<p class="muted">Versions appear after the first content update.</p>'}</section><section class="panel"><h3>Next committee checklist</h3><ol><li>Download a content backup and keep it with the society records.</li><li>Update the committee term and names under About & committee.</li><li>Change the administrator username/password and pass them on securely.</li><li>Keep past events and legal discussions as the society archive.</li></ol><p class="small muted">This copy runs on this computer. For access from other computers, the website, database and photographs still need a permanent online home. A backup alone is not the website software.</p><p class="small muted">The original creator attribution is fixed and is not editable from this admin workspace.</p></section>`;
  }
  function renderAdmin(){
    dirty=false;
    if(state().user?.role!=='admin'){
      main.innerHTML=`<div class="wrap page admin-welcome"><div class="eyebrow">Society workspace</div><h1 class="page-title">Website admin</h1><p class="topic-intro">Edit content, events and committee details. No coding needed.</p><button class="btn" data-cms="admin-login">${state().admin_configured?'Administrator sign in':'Set up administrator account'}</button><p class="small muted" style="margin-top:18px">${state().admin_configured?'Sign in with your administrator username and password.':'Create your own username and password once, then use them for future sign-ins.'}</p></div>`;return;
    }
    main.innerHTML=`<div class="wrap page cms"><div class="cms-top"><div><div class="eyebrow">Society workspace</div><h1>Make it yours.</h1></div><a class="btn outline" href="#/">View website</a></div><div class="cms-layout"><nav class="cms-nav" aria-label="Administration">${Object.entries(titles).map(([id,label])=>`<button data-cms="section" data-section="${id}" class="${id===section?'active':''}" ${id===section?'aria-current="page"':''}>${label}</button>`).join('')}<button data-cms="signout">Sign out</button><small>Signed in as<br><strong>${esc(state().user.name)}</strong><br>Saved on this computer</small></nav><div class="cms-content">${adminBody()}</div></div></div>`;
    if(section==='home'){
      const form=main.querySelector('[data-cms-form="settings"] .form-grid');
      form.insertAdjacentHTML('beforeend',`<div class="full"><h3>Brand colours</h3><p class="small muted">Coordinate these with the Media team. Use dark text on a light background so the website stays readable.</p><div class="form-grid">${[['color_primary','Primary / buttons'],['color_background','Page background'],['color_accent','Gold / accent'],['color_text','Text colour']].map(([k,l])=>input(k,l,state().settings[k],'color')).join('')}</div></div>`);
    }
    if(section==='events')main.querySelector('.cms-content').insertAdjacentHTML('beforeend',`<section class="panel"><h3>Moot page preview</h3><p class="small muted">Keep the sample page available until the layout is approved. Turning it off returns the planned Moot event to grey, non-clickable text.</p><form data-cms-form="settings"><label for="preview-toggle">Preview availability</label><select name="moot_preview" id="preview-toggle"><option value="true" ${state().settings.moot_preview?'selected':''}>Show the sample event page</option><option value="false" ${!state().settings.moot_preview?'selected':''}>Hide the sample — planned event only</option></select><button class="btn" style="margin-top:15px">Save preview setting</button><p class="error" role="alert"></p></form></section>`);
  }
  function decorateDialog(){
    const form=dialog.querySelector('[data-form="save-event"]');if(!form)return;
    const id=form.querySelector('[name="id"]').value;
    const event=state().events.find(e=>e.id===id);if(!event)return;
    const old=dialog.querySelector('.photo-manager');old?.remove();
    form.querySelector('.dialog-foot').insertAdjacentHTML('beforebegin',`<div class="photo-manager">${event.photos.map((path,i)=>`<div><img src="${esc(path)}" alt="Event photograph"><label>Photo caption<input data-caption value="${esc(event.photo_captions?.[path]||'')}" maxlength="300"></label><button type="button" class="text-button" data-cms="photo-details" data-id="${id}" data-path="${esc(path)}">Save caption</button><button type="button" class="text-button" data-cms="photo-details" data-cover="true" data-id="${id}" data-path="${esc(path)}" ${i===0?'disabled':''}>${i===0?'Cover photograph':'Use as cover'}</button><button type="button" class="text-button danger" data-cms="remove-photo" data-id="${id}" data-path="${esc(path)}">Remove photograph</button></div>`).join('')}</div>`);
    form.querySelector('.document-manager')?.remove();
    form.querySelector('.dialog-foot').insertAdjacentHTML('beforebegin',`<div class="document-manager"><h3>Downloadable PDFs</h3><p class="small muted">Add the moot problem, competition rules or event documents. Uploads save immediately.</p><label>Document name<input data-document-name placeholder="e.g. Moot problem 2026"></label><label>Add PDF (up to 5 MB)<input type="file" accept="application/pdf" data-cms-upload="document" data-event="${id}"></label>${(event.documents||[]).map(d=>`<div class="admin-item"><a href="${esc(d.path)}" target="_blank" rel="noopener">${esc(d.name)}</a><button type="button" class="text-button danger" data-cms="remove-document" data-id="${id}" data-path="${esc(d.path)}">Remove</button></div>`).join('')}</div>`);
  }
  function warnBefore(callback){if(!dirty)return callback();showDialog('<h2>Unsaved changes</h2><p>Save your edits first, or discard them to continue.</p><div class="dialog-foot"><button class="btn outline" data-action="close">Keep editing</button><button class="btn" data-cms="discard">Discard changes</button></div>');dialog.querySelector('[data-cms="discard"]').onclick=()=>{dirty=false;dialog.close();callback()}}
  function confirmAction(title,body,action,data){showDialog(`<h2>${title}</h2><p>${body}</p><form data-cms-form="${action}"><input type="hidden" name="id" value="${esc(data.id||'')}"><div class="dialog-foot"><button type="button" class="btn outline" data-action="close">Cancel</button><button class="btn" type="submit">Confirm</button></div><p class="error" role="alert"></p></form>`)}
  document.addEventListener('input',e=>{if(e.target.closest('[data-cms-form="settings"]')){dirty=true;const status=e.target.closest('form').querySelector('[data-save-status]');if(status)status.textContent='You have unsaved changes.'}});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
  document.addEventListener('click',e=>{const anchor=e.target.closest('a[href^="#/"]');if(anchor&&dirty){e.preventDefault();e.stopImmediatePropagation();warnBefore(()=>{location.hash=anchor.getAttribute('href')})}},true);
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-cms], [data-action="admin-login"], [data-action="account"]');
    if(!b)return;
    if(b.dataset.action==='account'&&state().user?.role!=='admin')return;
    e.preventDefault();e.stopImmediatePropagation();
    const action=b.dataset.cms||b.dataset.action;
    try{
      if(action==='admin-login')return openLogin();
      if(action==='view-photo'){
        const event=state().events.find(e=>e.id===b.dataset.event),index=Number(b.dataset.index),path=event?.photos[index];if(!path)return;
        return showDialog(`<div class="photo-viewer"><img src="${esc(path)}" alt="${esc(event.photo_captions?.[path]||event.title)}"><p>${esc(event.photo_captions?.[path]||event.title)}</p><div class="two-buttons">${index>0?`<button class="btn outline" data-cms="view-photo" data-event="${event.id}" data-index="${index-1}">Previous</button>`:''}${index<event.photos.length-1?`<button class="btn outline" data-cms="view-photo" data-event="${event.id}" data-index="${index+1}">Next</button>`:''}</div></div>`);
      }
      if(action==='account')return showDialog(`<h2>${esc(state().user.name)}</h2><p>Administrator account</p><div class="two-buttons"><a class="btn" href="#/admin" data-action="close">Open workspace</a><button class="btn outline" data-cms="signout">Sign out</button></div>`);
      if(action==='discard')return;
      if(action==='section')return warnBefore(()=>{section=b.dataset.section;renderAdmin()});
      if(action==='signout')return warnBefore(async()=>{await api('logout');if(dialog.open)dialog.close();await refresh()});
      if(action==='add-member'){document.querySelector('#member-rows').insertAdjacentHTML('beforeend',committeeRow());dirty=true;return}
      if(action==='add-principle'){document.querySelector('#principle-rows').insertAdjacentHTML('beforeend',principleRow());dirty=true;return}
      if(action==='remove-row'){b.closest('[data-member],[data-principle]').remove();dirty=true;return}
      if(action==='restore')return confirmAction('Restore this version?','Current content will be replaced. We save the current version first so you can recover it.','restore-revision',{id:b.dataset.id});
      b.disabled=true;
      if(action==='move'){
        const ids=state()[b.dataset.collection].map(x=>x.id),i=ids.indexOf(b.dataset.id),j=i+Number(b.dataset.direction);
        [ids[i],ids[j]]=[ids[j],ids[i]];await api('reorder',{collection:b.dataset.collection,ids});await refresh();toast('Order updated.');
      }else if(action==='remove-photo'||action==='remove-document'){
        await api(action,{id:b.dataset.id,path:b.dataset.path});await load();decorateDialog();toast('Removed. Recover it under Account & backups if needed.');
      }else if(action==='photo-details'){
        await api(action,{id:b.dataset.id,path:b.dataset.path,caption:b.parentElement.querySelector('[data-caption]').value,cover:b.dataset.cover==='true'});await load();decorateDialog();toast('Photo details saved.');
      }
    }catch(err){toast(err.message)}finally{b.disabled=false}
  },true);
  document.addEventListener('submit',async e=>{
    const form=e.target.closest('[data-cms-form]');if(!form)return;e.preventDefault();e.stopImmediatePropagation();
    const action=form.dataset.cmsForm,data=Object.fromEntries(new FormData(form)),button=form.querySelector('button[type="submit"],button:not([type])');
    if(button)button.disabled=true;
    try{
      if(['admin-setup','change-credentials'].includes(action)&&data.password!==data.confirm)throw Error('The two passwords do not match.');
      if(action==='settings'){
        const settings={...data};
        if('logo_3d' in settings)settings.logo_3d=settings.logo_3d==='true';
        if('moot_preview' in settings)settings.moot_preview=settings.moot_preview==='true';
        for(const key of Object.keys(settings))if(key.startsWith('purpose-'))delete settings[key];
        if(form.querySelector('#member-rows'))settings.committee=[...form.querySelectorAll('[data-member]')].map(row=>[row.querySelector('[data-position]').value.trim(),row.querySelector('[data-name]').value.trim()]);
        if(form.querySelector('#principle-rows'))settings.principles=[...form.querySelectorAll('[data-principle]')].map(row=>[...row.querySelectorAll('input,textarea')].map(i=>i.value.trim()));
        await api('save-settings',{settings});dirty=false;
      }else if(action==='import-backup'){
        if(!importFile)throw Error('Choose your backup file again.');
        await api('import-backup',{archive:(await readFile(importFile)).split(',')[1]});importFile=null;
      }else await api(action,data);
      if(dialog.open)dialog.close();await refresh();toast(action==='settings'?'Changes saved to your website.':action==='admin-setup'?'Administrator account created.':'Saved successfully.');
    }catch(err){form.querySelector('.error').textContent=err.message}finally{if(button)button.disabled=false}
  },true);
  const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Unable to read this file.'));reader.readAsDataURL(file)});
  document.addEventListener('change',async e=>{
    const control=e.target;if(!control.dataset.cmsUpload)return;const file=control.files[0];if(!file)return;
    try{
      if(control.dataset.cmsUpload==='backup'){
        if(file.size>50_000_000)throw Error('Choose a backup under 50 MB.');importFile=file;
        return confirmAction('Import this backup?',`Replace current content with ${esc(file.name)}? Current content will be saved as a recovery version. Your administrator credentials will not change.`,'import-backup',{});
      }
      if(file.size>5_000_000)throw Error('Choose an image under 5 MB.');
      if(control.dataset.cmsUpload==='document'){
        const name=dialog.querySelector('[data-document-name]').value.trim()||file.name;
        control.disabled=true;await api('upload',{id:control.dataset.event,target:'document',name,image:await readFile(file)});await load();decorateDialog();toast('PDF saved.');return;
      }
      control.disabled=true;await api('upload',{target:'logo',image:await readFile(file)});await load();decorateShell();toast('Logo saved.');
      const thumb=document.querySelector('.logo-thumb');if(thumb)thumb.src=state().settings.logo;
    }catch(err){toast(err.message)}finally{control.disabled=false}
  });
  return {decorateShell,decorateHome,decorateEventList,decorateEvent,eventPreview,disposeLogo,renderAdmin,openLogin,decorateDialog};
}
