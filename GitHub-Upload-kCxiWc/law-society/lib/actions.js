import { randomBytes } from 'node:crypto';
import seed from '../seed.json' with { type: 'json' };

export const adminActions = new Set([
  'save-event', 'delete-event', 'save-topic', 'delete-topic', 'settings',
  'save-settings', 'pin', 'delete-post', 'delete-comment', 'resolve-report',
  'remove-photo', 'remove-document', 'photo-details', 'reorder',
  'restore-revision', 'attach-upload',
  'restore-uploaded-backup',
]);

const id = () => randomBytes(8).toString('hex');
const asText = (value, limit = 5000) => {
  if (typeof value !== 'string') throw new Error('Please enter valid text.');
  const text = value.trim();
  if (text.length > limit) throw new Error(`Please keep this field within ${limit} characters.`);
  return text;
};
const required = (value, limit) => {
  const text = asText(value, limit);
  if (!text) throw new Error('Please complete the required fields.');
  return text;
};
const link = value => {
  const text = asText(value, 2000);
  if (text) {
    try { if (new URL(text).protocol !== 'https:') throw new Error(); }
    catch { throw new Error('Links must start with https:// and include a valid website.'); }
  }
  return text;
};
const item = (state, collection, itemId) => {
  const found = state[collection].find(value => value.id === itemId);
  if (!found) throw new Error('This item is no longer available. Refresh the page.');
  return found;
};
function removePost(state, postId) {
  const ids = new Set([postId, ...state.posts.filter(p => p.original === postId).map(p => p.id)]);
  state.posts = state.posts.filter(p => !ids.has(p.id));
  for (const collection of ['comments', 'reactions', 'reports']) {
    state[collection] = state[collection].filter(value => !ids.has(value.post));
  }
}
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Invalid settings.');
  const allowed = new Set([...Object.keys(seed.settings), 'about', 'email', 'instagram', 'committee']);
  for (const [key, value] of Object.entries(settings)) {
    if (!allowed.has(key)) throw new Error('Unknown settings field.');
    if (key === 'committee' || key === 'principles') {
      const width = key === 'committee' ? 2 : 3;
      if (!Array.isArray(value) || value.length > 60 || !value.every(row => Array.isArray(row) && row.length === width && row.every(cell => typeof cell === 'string' && cell.length <= 5000))) throw new Error('Please check the committee or purpose rows.');
    } else if (key === 'logo_3d' || key === 'moot_preview') {
      if (typeof value !== 'boolean') throw new Error('Invalid display setting.');
    } else if (key.startsWith('color_')) {
      if (typeof value !== 'string' || !/^#[\da-fA-F]{6}$/.test(value)) throw new Error('Choose a valid colour.');
    } else if (typeof value !== 'string' || value.length > 10000) {
      throw new Error('A text field is invalid or too long.');
    }
  }
  if (settings.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(settings.email)) throw new Error('Enter a valid email address.');
  if (settings.instagram) link(settings.instagram);
  if (settings.logo && settings.logo !== '/assets/logo.png' && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/society-public\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(settings.logo)) throw new Error('Choose a logo uploaded through the media library.');
}

export function applyAction(state, action, data, user, uploadedUrl) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid request.');
  const ident = data.id;
  const now = Date.now() / 1000;
  if (action === 'save-settings') {
    validateSettings(data.settings);
    Object.assign(state.settings, data.settings);
  } else if (action === 'settings') {
    if (!Array.isArray(data.committee) || data.committee.length > 60 || !data.committee.every(row => Array.isArray(row) && row.length === 2)) throw new Error('Enter each committee member as Position | Name.');
    Object.assign(state.settings, {
      about: required(data.about, 10000), email: required(data.email, 200),
      instagram: link(data.instagram),
      committee: data.committee.map(row => [required(row[0], 100), required(row[1], 100)]),
    });
  } else if (action === 'reorder') {
    const collection = data.collection;
    if (!['events', 'topics'].includes(collection)) throw new Error('Invalid collection.');
    const ids = data.ids;
    if (!Array.isArray(ids) || ids.length !== state[collection].length || new Set(ids).size !== ids.length || !ids.every(value => state[collection].some(row => row.id === value))) throw new Error('The list has changed. Refresh and try again.');
    const map = new Map(state[collection].map(row => [row.id, row]));
    state[collection] = ids.map(value => map.get(value));
  } else if (action === 'save-event' || action === 'save-topic') {
    const event = action === 'save-event';
    const collection = event ? 'events' : 'topics';
    const row = ident ? item(state, collection, ident) : { id: id() };
    row.title = required(data.title, 160);
    if (event) {
      for (const key of ['date', 'category', 'description']) row[key] = asText(data[key] || '');
      row.registration = link(data.registration || '');
      row.photos ||= [];
      row.documents ||= [];
    } else {
      for (const key of ['summary', 'content', 'publish', 'discussion', 'time']) row[key] = asText(data[key] || '');
      for (const key of ['instagram', 'meet']) row[key] = link(data[key] || '');
    }
    const statuses = event ? ['planned', 'upcoming', 'ongoing', 'past'] : ['upcoming', 'open', 'archived'];
    if (!statuses.includes(data.status)) throw new Error('Choose a valid status.');
    row.status = data.status;
    if (!ident) state[collection].push(row);
  } else if (action === 'delete-event' || action === 'delete-topic') {
    const collection = action === 'delete-event' ? 'events' : 'topics';
    item(state, collection, ident);
    if (collection === 'topics') for (const post of [...state.posts]) if (post.topic === ident) removePost(state, post.id);
    state[collection] = state[collection].filter(row => row.id !== ident);
  } else if (action === 'post') {
    if (data.ack !== 'on') throw new Error('Please acknowledge the discussion rules before posting.');
    const topic = item(state, 'topics', data.topic);
    if (topic.status !== 'open') throw new Error('This topic is not open for new posts yet, or has been archived.');
    state.posts.push({ id: id(), topic: topic.id, author: user.name, user: user.id, body: required(data.body, 4000), created: now, pinned: false, original: null });
  } else if (['react', 'repost', 'comment', 'report', 'pin', 'delete-post'].includes(action)) {
    const post = item(state, 'posts', ident);
    if (['comment', 'repost'].includes(action) && item(state, 'topics', post.topic).status !== 'open') throw new Error('This topic is read-only.');
    if (action === 'react') {
      if (!['like', 'dislike'].includes(data.reaction)) throw new Error('Invalid reaction.');
      const previous = state.reactions.find(row => row.post === ident && row.user === user.id);
      state.reactions = state.reactions.filter(row => !(row.post === ident && row.user === user.id));
      if (!previous || previous.reaction !== data.reaction) state.reactions.push({ post: ident, user: user.id, reaction: data.reaction });
    } else if (action === 'repost') {
      const original = post.original || ident;
      const previous = state.posts.find(row => row.original === original && row.user === user.id);
      if (previous) removePost(state, previous.id);
      else state.posts.push({ id: id(), topic: post.topic, author: user.name, user: user.id, body: '', created: now, pinned: false, original });
    } else if (action === 'comment') {
      if (data.ack !== 'on') throw new Error('Please acknowledge the discussion rules before commenting.');
      state.comments.push({ id: id(), post: ident, author: user.name, user: user.id, body: required(data.body, 2000), created: now });
    } else if (action === 'report') {
      if (state.reports.some(row => row.post === ident && row.user === user.id && !row.resolved)) throw new Error('You have already reported this post.');
      state.reports.push({ id: id(), post: ident, user: user.id, reason: required(data.reason, 1000), resolved: false });
    } else if (action === 'pin') post.pinned = !post.pinned;
    else removePost(state, ident);
  } else if (action === 'delete-comment') {
    item(state, 'comments', ident);
    state.comments = state.comments.filter(row => row.id !== ident);
  } else if (action === 'resolve-report') {
    item(state, 'reports', ident).resolved = true;
  } else if (action === 'remove-photo') {
    const event = item(state, 'events', ident);
    event.photos = event.photos.filter(path => path !== data.path);
  } else if (action === 'remove-document') {
    const event = item(state, 'events', ident);
    event.documents = (event.documents || []).filter(row => row.path !== data.path);
  } else if (action === 'photo-details') {
    const event = item(state, 'events', ident);
    if (!event.photos.includes(data.path)) throw new Error('Photograph not found.');
    event.photo_captions ||= {};
    event.photo_captions[data.path] = asText(data.caption || '', 300);
    if (data.cover) event.photos = [data.path, ...event.photos.filter(path => path !== data.path)];
  } else if (action === 'attach-upload') {
    if (!uploadedUrl) throw new Error('Upload information is missing.');
    if (data.target === 'logo') state.settings.logo = uploadedUrl;
    else {
      const event = item(state, 'events', ident);
      if (data.target === 'document') {
        event.documents ||= [];
        event.documents.push({ name: required(data.name || 'Document', 160), path: uploadedUrl });
      } else event.photos.push(uploadedUrl);
    }
  } else {
    throw new Error('Unknown action.');
  }
  return state;
}
