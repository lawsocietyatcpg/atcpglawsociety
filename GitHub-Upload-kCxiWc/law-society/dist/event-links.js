const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeURL = value => { try { return new URL(value).protocol === 'https:' ? value : ''; } catch { return ''; } };
export function renderEventLinks(event, {instagram = true} = {}) {
  const links = [...(instagram && event?.instagram ? [{name:'View Instagram post',url:event.instagram}] : []), ...(event?.links || [])];
  return links.filter(link => link.name && safeURL(link.url)).map(link => `<a class="btn outline event-external-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.name)}</a>`).join('');
}
export function eventLinkRow(link = {}) {
  return `<div class="event-link-row"><label>Link name (shown on website)<input data-event-link-name value="${esc(link.name)}" maxlength="160" placeholder="e.g. LinkedIn post or Watch the replay"></label><label>Website address<input data-event-link-url type="url" value="${esc(link.url)}" placeholder="https://…"></label><button type="button" class="text-button danger" data-remove-event-link>Remove link</button></div>`;
}
export function eventLinksEditor(links = []) {
  return `<section class="event-links-editor"><h3>Additional event links</h3><p class="small muted">Add a replay, LinkedIn post, registration page or any other website. Each link appears as a button with the name you choose. Save the event to publish your links.</p><div data-event-link-rows>${links.map(eventLinkRow).join('')}</div><button type="button" class="btn outline" data-add-event-link>Add link</button></section>`;
}
export function readEventLinks(form) {
  return [...form.querySelectorAll('.event-link-row')].map(row => ({name:row.querySelector('[data-event-link-name]').value.trim(),url:row.querySelector('[data-event-link-url]').value.trim()})).filter(link => link.name || link.url);
}
if (typeof document !== 'undefined') document.addEventListener('click', event => {
  const add = event.target.closest('[data-add-event-link]');
  if (add) { const rows = add.closest('.event-links-editor').querySelector('[data-event-link-rows]'); rows.insertAdjacentHTML('beforeend', eventLinkRow()); rows.lastElementChild.querySelector('input').focus(); }
  const remove = event.target.closest('[data-remove-event-link]');
  if (remove) remove.closest('.event-link-row').remove();
});
