import actions from '../lib/action-handler.js';
import uploadToken from './upload-token.js';
import syncMembers from './sync-members.js';

export default function handler(request, response) {
  const action = request.query.action;
  if (typeof action !== 'string') return response.status(404).json({ error: 'Unknown action.' });
  if (action === 'upload-token') return uploadToken(request, response);
  if (action === 'sync-members') return syncMembers(request, response);
  return actions(request, response, action);
}
