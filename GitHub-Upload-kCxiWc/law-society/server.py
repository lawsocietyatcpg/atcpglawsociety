"""Loopback-only local CMS with persistent administrator password authentication."""
import base64
import hashlib
import io
import json
import os
import secrets
import sqlite3
import time
import zipfile
import cms_backend as cms
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / 'dist'
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)
DB = Path(os.environ.get('LAWSOC_DB', str(DATA / 'law-society.sqlite3')))
PORT = int(os.environ.get('LAWSOC_PORT', '4173'))
COMMITTEE = [
    ['President', 'Ashley Neoh Jia Li'], ['Vice President', 'Ooi Pin Qi'],
    ['Secretary', 'Yap Jin Hern'], ['Vice Secretary', 'Nur Hanan Zulaikha Binti Abdullah'],
    ['Treasurer', 'Asha Nair'], ['Director of PRM', 'Celine Liew Xiang Ling'],
    ['PRM Committee Member', 'Amishaa Gaunder A/P Kumar'],
    ['Director of Research', 'Melissa Tan Wey'], ['Research Committee Member', 'Chan Jing Fei'],
    ['Research Committee Member', 'Edward Lim Yi Wei']]

def connect():
    db = sqlite3.connect(DB)
    db.execute('PRAGMA foreign_keys = ON')
    return db

def initialize():
    with connect() as db:
        cms.initialize(db)
        db.execute('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)')
        db.execute('CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL)')
        if db.execute('SELECT id FROM content').fetchone():
            if not db.execute('SELECT name FROM migrations WHERE name=?',('biweekly-event',)).fetchone():
                state=json.loads(db.execute('SELECT body FROM content WHERE id=1').fetchone()[0])
                state['events'].insert(0,{'id':'biweekly','title':'Biweekly Legal Knowledge & Discussion','date':'2026 / 2027','category':'Ongoing · Legal knowledge & student discussion','description':'Read the society’s legal explainers, share your perspective and join our online discussions. Publication and discussion dates follow the biweekly plan, with scheduled holiday and examination breaks.','status':'ongoing','registration':'','photos':[],'documents':[]})
                db.execute('UPDATE content SET body=? WHERE id=1',(json.dumps(state),))
                db.execute('INSERT INTO migrations VALUES (?)',('biweekly-event',))
            cms.simplify_starter_copy(db)
            return
        events = [
            ('Annual Internal Moot Competition', 'Early / Mid-Nov 2026', 'Advocacy · On campus', 'An opportunity to put legal research and oral advocacy into practice through our annual internal moot competition.'),
            ('Penang DUN Visit', 'Late Nov 2026', 'Educational visit', 'A proposed visit to the Penang State Legislative Assembly during the State Budget proceedings.'),
            ('Kuala Lumpur Legal Educational Trip', 'Nov / Dec 2026', '3-day educational trip', 'Proposed visits to Parliament, the Federal Court / Court of Appeal and a law firm.'),
            ('Intercollegiate Law Debate / Advocacy Competition', 'Jan 2027', 'Intercollegiate', 'A proposed opportunity to exchange arguments and develop advocacy skills with students from other institutions.'),
            ('Legal Sharing Session', 'Feb 2027', 'Practising lawyers & ATC alumni', 'Perspectives on legal practice and professional development from practising lawyers and ATC alumni.'),
            ('Law Quiz', 'Aug 2027', 'Legal knowledge', 'A proposed quiz to bring students together and put their legal knowledge to the test.'),
            ('Co-curriculum Fair', 'Each FIL intake', 'Meet the society', 'Meet the committee and learn about opportunities to participate in the Law Society.')]
        state = {'settings': {'about': 'Law Society ATC Penang connects classroom learning with the practice of law. Through mooting, legal discussions, educational visits and conversations with practitioners, we help students build knowledge, confidence and a thoughtful approach to the law.', 'email': 'lawsocietyatcpg@gmail.com', 'instagram': 'https://www.instagram.com/lawsocietyatcpg_/', 'committee': COMMITTEE},
                 'events': [dict(id=str(i+1), title=e[0], date=e[1], category=e[2], description=e[3], status='planned', registration='', photos=[]) for i,e in enumerate(events)],
                 'topics': [{'id': '1', 'title': 'Najib’s House Arrest', 'summary': 'Our first legal knowledge topic of the 2026/2027 term. Read the society’s explainer when it is published, then bring your perspective to the discussion.', 'content': '', 'publish': '2026-10-09', 'discussion': '2026-10-16', 'time': 'Friday evening · time to be confirmed', 'instagram': '', 'meet': '', 'status': 'upcoming'}],
                 'posts': [], 'comments': [], 'reactions': [], 'reports': []}
        state['events'].insert(0,{'id':'biweekly','title':'Biweekly Legal Knowledge & Discussion','date':'2026 / 2027','category':'Ongoing · Legal knowledge & student discussion','description':'Read the society’s legal explainers, share your perspective and join our online discussions. Publication and discussion dates follow the biweekly plan, with scheduled holiday and examination breaks.','status':'ongoing','registration':'','photos':[],'documents':[]})
        db.execute('INSERT INTO content VALUES (1, ?)', (json.dumps(state),))
        db.execute('INSERT INTO migrations VALUES (?)',('biweekly-event',))

        cms.simplify_starter_copy(db)

def clean(value, limit=5000):
    if not isinstance(value, str):
        raise ValueError('Please enter valid text.')
    value = value.strip()
    if len(value) > limit:
        raise ValueError(f'Please keep this field within {limit} characters.')
    return value

def link(value):
    value = clean(value, 2000)
    if value and (urlparse(value).scheme != 'https' or not urlparse(value).netloc):
        raise ValueError('Links must start with https:// and include a valid website.')
    return value

def required(value, limit=5000):
    value = clean(value, limit)
    if not value:
        raise ValueError('Please complete the required fields.')
    return value

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def reply(self, value, status=200, cookie=None):
        raw = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        if cookie:
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(raw)

    def user(self):
        cookie = SimpleCookie(self.headers.get('Cookie', ''))
        token = cookie.get('lawsoc_session')
        if not token:
            return None
        with connect() as db:
            row=db.execute('SELECT identity FROM sessions WHERE token=? AND expires>?', (hashlib.sha256(token.value.encode()).hexdigest(),time.time())).fetchone()
        return json.loads(row[0]) if row else None

    def safe_host(self):
        return self.headers.get('Host') in (f'127.0.0.1:{PORT}', f'localhost:{PORT}')

    def do_GET(self):
        if not self.safe_host():
            return self.reply({'error': 'Local preview only.'}, 403)
        if self.path == '/api/state':
            with connect() as db:
                state = json.loads(db.execute('SELECT body FROM content WHERE id=1').fetchone()[0])
                configured=bool(db.execute('SELECT id FROM administrator').fetchone())
                revisions=[{'id':r[0],'created':r[1],'action':r[2]} for r in db.execute('SELECT id,created,action FROM revisions ORDER BY id DESC LIMIT 20')]
            user = self.user()
            if not user or user['role'] != 'admin':
                state.pop('reports')
            state['user'] = {k:v for k,v in user.items() if k != 'expires'} if user else None
            state['settings']={**cms.DEFAULTS,**state['settings']}
            state['admin_configured']=configured
            if user and user['role']=='admin': state['revisions']=revisions
            return self.reply(state)
        if self.path == '/api/backup':
            user=self.user()
            if not user or user['role']!='admin': return self.reply({'error':'Administrator sign-in required.'},403)
            with connect() as db:
                state=json.loads(db.execute('SELECT body FROM content WHERE id=1').fetchone()[0])
            output=io.BytesIO()
            with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
                archive.writestr('content.json',json.dumps(state))
                paths={state['settings'].get('logo','/assets/logo.png')} | {p for e in state['events'] for p in e['photos']} | {d['path'] for e in state['events'] for d in e.get('documents',[])}
                for path in paths:
                    if (cms.valid_asset(path) or cms.valid_document(path)) and path.startswith('/uploads/') and (PUBLIC/path.lstrip('/')).is_file():
                        archive.write(PUBLIC/path.lstrip('/'),path.lstrip('/'))
            raw=output.getvalue()
            self.send_response(200)
            self.send_header('Content-Type','application/zip')
            self.send_header('Content-Disposition','attachment; filename="law-society-content-backup.zip"')
            self.send_header('Content-Length',str(len(raw)))
            self.end_headers();self.wfile.write(raw);return
        if self.path.startswith('/api/'):
            return self.reply({'error': 'Not found.'}, 404)
        return super().do_GET()

    def do_POST(self):
        if not self.safe_host() or self.headers.get('Origin') != f'http://{self.headers.get("Host")}' or self.headers.get('Content-Type') != 'application/json':
            return self.reply({'error': 'This action is available only inside the local preview.'}, 403)
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= (70_000_000 if self.path=='/api/import-backup' else 8_000_000):
                raise ValueError('The upload is too large. Choose an image under 5 MB.')
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                raise ValueError('Invalid request.')
            if self.path in ['/api/admin-setup','/api/admin-login','/api/change-credentials']:
                change=self.path=='/api/change-credentials'
                user=self.user()
                if change and (not user or user['role']!='admin'): return self.reply({'error':'Administrator sign-in required.'},403)
                with connect() as db:
                    db.execute('BEGIN IMMEDIATE')
                    row=db.execute('SELECT username,salt,digest FROM administrator WHERE id=1').fetchone()
                    username=required(data.get('username',''),50)
                    password=data.get('password','')
                    if self.path=='/api/admin-setup':
                        if row: return self.reply({'error':'Administrator already exists. Please sign in.'},409)
                        cms.valid_credentials(username,password)
                        salt=secrets.token_hex(24)
                        db.execute('INSERT INTO administrator VALUES (1,?,?,?)',(username,salt,cms.password_hash(password,salt)))
                    else:
                        attempts=db.execute('SELECT COUNT(*) FROM login_attempts WHERE attempted>?',(time.time()-900,)).fetchone()[0]
                        if attempts>=8: return self.reply({'error':'Too many unsuccessful attempts. Please wait 15 minutes.'},429)
                        candidate=data.get('current_password','') if change else password
                        if not row or (not change and username!=row[0]) or not cms.verify(row,candidate):
                            db.execute('INSERT INTO login_attempts(attempted) VALUES (?)',(time.time(),))
                            db.commit()
                            return self.reply({'error':'Incorrect username or password.'},401)
                        db.execute('DELETE FROM login_attempts')
                        if change:
                            cms.valid_credentials(username,password)
                            salt=secrets.token_hex(24)
                            db.execute('UPDATE administrator SET username=?,salt=?,digest=? WHERE id=1',(username,salt,cms.password_hash(password,salt)))
                            db.execute('DELETE FROM sessions')
                    cookie=cms.issue_session(db,username,'admin','administrator')
                return self.reply({'ok':True},cookie=cookie)
            if self.path == '/api/login':
                name = required(data.get('name', ''), 40)
                role = data.get('role', 'student')
                if role != 'student':
                    return self.reply({'error':'Use the administrator username and password.'},403)
                with connect() as db:
                    cookie=cms.issue_session(db,name,'student',secrets.token_hex(12))
                return self.reply({'ok':True},cookie=cookie)
            if self.path == '/api/logout':
                cookie = SimpleCookie(self.headers.get('Cookie', ''))
                if cookie.get('lawsoc_session'):
                    with connect() as db:
                        db.execute('DELETE FROM sessions WHERE token=?',(hashlib.sha256(cookie['lawsoc_session'].value.encode()).hexdigest(),))
                return self.reply({'ok': True}, cookie='lawsoc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
            user = self.user()
            if not user:
                return self.reply({'error': 'Please sign in to participate.'}, 401)
            action = self.path.removeprefix('/api/')
            admin_actions = ['save-event', 'delete-event', 'save-topic', 'delete-topic', 'settings', 'pin', 'delete-post', 'delete-comment', 'resolve-report', 'upload', 'save-settings', 'remove-photo', 'remove-document', 'reorder', 'restore-revision', 'import-backup', 'photo-details']
            if action in admin_actions and user['role'] != 'admin':
                return self.reply({'error': 'Only administrators can do this.'}, 403)
            with connect() as db:
                db.execute('BEGIN IMMEDIATE')
                state = json.loads(db.execute('SELECT body FROM content WHERE id=1').fetchone()[0])
                if action in admin_actions:
                    cms.remember(db,state,action)
                ident = data.get('id')
                def find(collection, ident):
                    item = next((x for x in state[collection] if x['id'] == ident), None)
                    if item is None:
                        raise ValueError('This item is no longer available. Refresh the page.')
                    return item
                def remove_post(pid):
                    ids = {pid} | {p['id'] for p in state['posts'] if p.get('original') == pid}
                    state['posts'] = [p for p in state['posts'] if p['id'] not in ids]
                    for collection in ['comments', 'reactions', 'reports']:
                        state[collection] = [p for p in state[collection] if p.get('post') not in ids]
                now = time.time()
                if action=='save-settings':
                    incoming=data.get('settings',{})
                    cms.validate_settings(incoming)
                    allowed=set(cms.DEFAULTS)|{'about','email','instagram','committee'}
                    if set(incoming)-allowed: raise ValueError('Unknown settings field.')
                    state['settings'].update(incoming)
                elif action=='reorder':
                    collection=data.get('collection')
                    if collection not in ['events','topics']: raise ValueError('Invalid collection.')
                    ids=data.get('ids')
                    if not isinstance(ids,list) or len(ids)!=len(state[collection]) or set(ids)!={x['id'] for x in state[collection]}: raise ValueError('The list has changed. Refresh and try again.')
                    by_id={x['id']:x for x in state[collection]}
                    state[collection]=[by_id[i] for i in ids]
                elif action=='remove-photo':
                    event=find('events',ident)
                    event['photos']=[p for p in event['photos'] if p!=data.get('path')]
                elif action=='remove-document':
                    event=find('events',ident)
                    event['documents']=[d for d in event.get('documents',[]) if d['path']!=data.get('path')]
                elif action=='photo-details':
                    event=find('events',ident)
                    path=data.get('path')
                    if path not in event['photos']: raise ValueError('Photograph not found.')
                    event.setdefault('photo_captions',{})[path]=clean(data.get('caption',''),300)
                    if data.get('cover'):
                        event['photos'].remove(path);event['photos'].insert(0,path)
                elif action=='restore-revision':
                    revision=db.execute('SELECT body FROM revisions WHERE id=?',(ident,)).fetchone()
                    if not revision: raise ValueError('This saved version is no longer available.')
                    state=json.loads(revision[0])
                elif action=='import-backup':
                    archive_bytes=base64.b64decode(data.get('archive',''),validate=True)
                    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
                        members=archive.infolist()
                        if len(members)>2000 or sum(m.file_size for m in members)>50_000_000 or len({m.filename for m in members})!=len(members): raise ValueError('Backup is too large or contains duplicate files.')
                        if any(m.filename!='content.json' and not(cms.valid_asset('/'+m.filename) or cms.valid_document('/'+m.filename)) for m in members): raise ValueError('Unexpected file in backup.')
                        restored=json.loads(archive.read('content.json'))
                        cms.validate_backup(restored)
                        uploads={}
                        for member in members:
                            if member.filename=='content.json': continue
                            raw=archive.read(member)
                            ext=member.filename.rsplit('.',1)[-1]
                            valid=(ext=='png' and raw.startswith(b'\x89PNG\r\n\x1a\n')) or (ext=='jpg' and raw.startswith(b'\xff\xd8\xff')) or (ext=='webp' and raw.startswith(b'RIFF') and raw[8:12]==b'WEBP') or (ext=='pdf' and raw.startswith(b'%PDF-'))
                            if not valid: raise ValueError('Invalid image in backup.')
                            destination=PUBLIC/member.filename
                            if destination.exists() and destination.read_bytes()!=raw: raise ValueError('Image filename conflict. Existing images have been preserved.')
                            uploads[member.filename]=raw
                        paths={restored['settings'].get('logo','/assets/logo.png')}|{p for event in restored['events'] for p in event['photos']}|{d['path'] for event in restored['events'] for d in event.get('documents',[])}
                        if any(p.startswith('/uploads/') and p.lstrip('/') not in uploads and not (PUBLIC/p.lstrip('/')).is_file() for p in paths): raise ValueError('The backup is missing photographs.')
                        for name,raw in uploads.items():
                            (PUBLIC/'uploads').mkdir(exist_ok=True)
                            (PUBLIC/name).write_bytes(raw)
                        state=restored
                elif action == 'post':
                    topic = find('topics', data.get('topic'))
                    if topic['status'] != 'open':
                        raise ValueError('This topic is not open for new posts yet, or has been archived.')
                    state['posts'].append({'id': secrets.token_hex(8), 'topic': topic['id'], 'author': user['name'], 'user': user['id'], 'body': required(data.get('body', ''), 4000), 'created': now, 'pinned': False, 'original': None})
                elif action in ['react', 'repost', 'comment', 'report', 'pin', 'delete-post']:
                    post = find('posts', ident)
                    if action in ['comment', 'repost'] and find('topics', post['topic'])['status'] != 'open':
                        raise ValueError('This topic is read-only.')
                    if action == 'react':
                        reaction = data.get('reaction')
                        if reaction not in ['like', 'dislike']:
                            raise ValueError('Invalid reaction.')
                        previous = next((r for r in state['reactions'] if r['post'] == ident and r['user'] == user['id']), None)
                        state['reactions'] = [r for r in state['reactions'] if not(r['post'] == ident and r['user'] == user['id'])]
                        if not previous or previous['reaction'] != reaction:
                            state['reactions'].append({'post': ident, 'user': user['id'], 'reaction': reaction})
                    elif action == 'repost':
                        original = post.get('original') or ident
                        existing = next((p for p in state['posts'] if p.get('original') == original and p['user'] == user['id']), None)
                        if existing:
                            remove_post(existing['id'])
                        else:
                            state['posts'].append({'id': secrets.token_hex(8), 'topic': post['topic'], 'author': user['name'], 'user': user['id'], 'body': '', 'created': now, 'pinned': False, 'original': original})
                    elif action == 'comment':
                        state['comments'].append({'id': secrets.token_hex(8), 'post': ident, 'author': user['name'], 'body': required(data.get('body',''), 2000), 'created': now})
                    elif action == 'report':
                        if any(r['post'] == ident and r['user'] == user['id'] and not r['resolved'] for r in state['reports']):
                            raise ValueError('You have already reported this post.')
                        state['reports'].append({'id': secrets.token_hex(8), 'post': ident, 'user': user['id'], 'reason': required(data.get('reason',''), 1000), 'resolved': False})
                    elif action == 'pin':
                        post['pinned'] = not post.get('pinned')
                    else:
                        remove_post(ident)
                elif action == 'delete-comment':
                    find('comments', ident)
                    state['comments'] = [c for c in state['comments'] if c['id'] != ident]
                elif action == 'resolve-report':
                    find('reports', ident)['resolved'] = True
                elif action in ['save-event', 'save-topic']:
                    is_event = action == 'save-event'
                    collection = 'events' if is_event else 'topics'
                    item = find(collection, ident) if ident else {'id': secrets.token_hex(8)}
                    item['title'] = required(data.get('title',''), 160)
                    if is_event:
                        for key in ['date', 'category', 'description']:
                            item[key] = clean(data.get(key,''))
                        item['registration'] = link(data.get('registration',''))
                        item['photos'] = item.get('photos', [])
                        statuses = ['planned','upcoming','ongoing','past']
                    else:
                        for key in ['summary','content','publish','discussion','time']:
                            item[key] = clean(data.get(key,''))
                        for key in ['instagram','meet']:
                            item[key] = link(data.get(key,''))
                        statuses = ['upcoming','open','archived']
                    item['status'] = data.get('status')
                    if item['status'] not in statuses:
                        raise ValueError('Choose a valid status.')
                    if not ident:
                        state[collection].append(item)
                elif action in ['delete-event','delete-topic']:
                    collection = 'events' if action == 'delete-event' else 'topics'
                    find(collection, ident)
                    if collection == 'topics':
                        for p in list(state['posts']):
                            if p['topic'] == ident:
                                remove_post(p['id'])
                    state[collection] = [x for x in state[collection] if x['id'] != ident]
                elif action == 'settings':
                    committee = data.get('committee')
                    if not isinstance(committee,list) or len(committee)>60 or not all(isinstance(p,list) and len(p)==2 for p in committee):
                        raise ValueError('Enter each committee member as Position | Name.')
                    state['settings'].update({'about': required(data.get('about','')), 'email': required(data.get('email',''),200), 'instagram': link(data.get('instagram','')), 'committee': [[required(p[0],100),required(p[1],100)] for p in committee]})
                elif action == 'upload':
                    event = None if data.get('target')=='logo' else find('events', ident)
                    raw = base64.b64decode(data.get('image','').split(',')[-1], validate=True)
                    if len(raw)>5_000_000:
                        raise ValueError('Choose an image under 5 MB.')
                    ext = 'pdf' if data.get('target')=='document' and raw.startswith(b'%PDF-') else 'png' if raw.startswith(b'\x89PNG\r\n\x1a\n') else 'jpg' if raw.startswith(b'\xff\xd8\xff') else 'webp' if raw.startswith(b'RIFF') and raw[8:12]==b'WEBP' else None
                    if not ext:
                        raise ValueError('Choose a PNG, JPEG, WebP image or PDF document.')
                    if data.get('target')=='document' and ext!='pdf': raise ValueError('Choose a PDF document.')
                    folder = PUBLIC / 'uploads'
                    folder.mkdir(exist_ok=True)
                    name = secrets.token_hex(16)+'.'+ext
                    (folder/name).write_bytes(raw)
                    if event is None: state['settings']['logo']='/uploads/'+name
                    elif ext=='pdf': event.setdefault('documents',[]).append({'name':required(data.get('name','Document'),160),'path':'/uploads/'+name})
                    else: event['photos'].append('/uploads/'+name)
                else:
                    return self.reply({'error':'Unknown action.'},404)
                db.execute('UPDATE content SET body=? WHERE id=1', (json.dumps(state),))
            self.reply({'ok': True})
        except (ValueError, TypeError, KeyError, zipfile.BadZipFile) as exc:
            self.reply({'error': str(exc)},400)
        except Exception:
            self.reply({'error':'Unable to save. Please try again; your draft has not been cleared.'},500)

if __name__ == '__main__':
    initialize()
    print(f'Law Society local preview: http://127.0.0.1:{PORT}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
