const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderSocialContacts(settings) {
  return [['instagram','INSTAGRAM',settings.instagram_label||'Instagram'],['linkedin','LINKEDIN',settings.linkedin_label||'LinkedIn']].map(([key,label,name])=>{
    const url=settings[key];
    try{if(new URL(url).protocol!=='https:')return '';}catch{return '';}
    return `<a class="contact-${key}" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><small>${label}</small>${esc(name)}</a>`;
  }).join('');
}
