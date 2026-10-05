"""Persistent administrator identity, content defaults and recoverable revisions."""
import hashlib
import hmac
import json
import re
import secrets
import time

DEFAULTS = {
    'color_primary': '#211346', 'color_background': '#fbf9f3', 'color_accent': '#e9b945', 'color_text': '#191331',
    'moot_preview': True,
    'site_name': 'Law Society', 'location': 'ATC Penang', 'term': '2026/2027',
    'hero_eyebrow': 'A student-led society · ATC Penang',
    'hero_title': 'The law.', 'hero_accent': 'Our conversation.',
    'hero_description': 'Explore legal issues. Share your perspective.',
    'topic_label': 'Biweekly discussion', 'topic_button': 'View topic',
    'event_label': 'Upcoming event', 'event_button': 'View events',
    'featured_topic': '', 'featured_event': '1', 'logo': '/assets/logo.png', 'logo_3d': True,
    'about_title': 'About us', 'committee_title': 'Our committee',
    'about': 'A student-led society at ATC Penang. We connect legal study with practice through mooting, discussions and visits.',
    'events_title': 'Events',
    'events_intro': 'Mooting, visits and conversations.',
    'events_note': 'Dates subject to confirmation.',
    'contact_title': 'Contact', 'instagram_label': '@lawsocietyatcpg_',
    'dialogue_title': 'Legal discussion',
    'dialogue_intro': 'Read the explainer. Join the conversation.',
    'principles': [
        ['LEARN', 'Legal issues', 'Student research and open discussion.'],
        ['PRACTISE', 'Advocacy', 'Build research and mooting skills.'],
        ['CONNECT', 'The profession', 'Meet lawyers, alumni and peers.']],
}

# Upgrade only untouched starter copy; never replace the committee's own edits.
LEGACY_COPY = {
    'about':'Law Society ATC Penang connects classroom learning with the practice of law. Through mooting, legal discussions, educational visits and conversations with practitioners, we help students build knowledge, confidence and a thoughtful approach to the law.',
    'hero_description':'A place to question, exchange perspectives and put legal knowledge into practice.',
    'topic_label':'Legal knowledge · Every two weeks', 'topic_button':'Explore topic',
    'event_label':'Coming up at the society',
    'about_title':'Beyond the\nlecture hall.', 'committee_title':'The people behind it.',
    'events_title':'Out of the books.\nInto the experience.',
    'events_intro':'Competitions, conversations and a closer look at the legal profession.',
    'events_note':'Proposed programme · Dates subject to confirmation.',
    'contact_title':'A question?\nLet’s talk.', 'dialogue_title':'Legal knowledge\n& discussion.',
    'dialogue_intro':'One issue, different perspectives. Explore our fortnightly legal explainers and take part in the discussion.',
    'principles':[
        ['LEARN','Explore the questions.','Look closer at contemporary legal issues through student research and open discussion.'],
        ['PRACTISE','Find your argument.','Develop research, analysis and advocacy through mooting and law-related activities.'],
        ['CONNECT','Meet the profession.','Learn from practising lawyers, alumni and peers, on campus and beyond.']]
}

def simplify_starter_copy(db):
    if db.execute('SELECT name FROM migrations WHERE name=?',('concise-copy-v1',)).fetchone(): return
    state=json.loads(db.execute('SELECT body FROM content WHERE id=1').fetchone()[0])
    remember(db,state,'simplify-starter-copy')
    for key,old in LEGACY_COPY.items():
        if state['settings'].get(key)==old: state['settings'][key]=DEFAULTS[key]
    db.execute('UPDATE content SET body=? WHERE id=1',(json.dumps(state),))
    db.execute('INSERT INTO migrations VALUES (?)',('concise-copy-v1',))

def initialize(db):
    db.execute('CREATE TABLE IF NOT EXISTS administrator (id INTEGER PRIMARY KEY CHECK(id=1), username TEXT NOT NULL, salt TEXT NOT NULL, digest TEXT NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, identity TEXT NOT NULL, expires REAL NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS login_attempts (id INTEGER PRIMARY KEY, attempted REAL NOT NULL)')
    db.execute('CREATE TABLE IF NOT EXISTS revisions (id INTEGER PRIMARY KEY, created REAL NOT NULL, action TEXT NOT NULL, body TEXT NOT NULL)')

def password_hash(password, salt):
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 600000).hex()

def valid_credentials(username, password):
    if not isinstance(username,str) or not re.fullmatch(r'[A-Za-z0-9_.-]{3,50}', username):
        raise ValueError('Use 3–50 letters, numbers, dots, hyphens or underscores for the username.')
    if not isinstance(password,str) or not 12 <= len(password) <= 128:
        raise ValueError('Use a password with 12–128 characters.')

def verify(row, password):
    return isinstance(password,str) and len(password)<=128 and hmac.compare_digest(password_hash(password,row[1]),row[2])

def issue_session(db, name, role, uid):
    token=secrets.token_urlsafe(32)
    user={'id':uid,'name':name,'role':role}
    db.execute('DELETE FROM sessions WHERE expires < ?', (time.time(),))
    db.execute('INSERT INTO sessions VALUES (?,?,?)', (hashlib.sha256(token.encode()).hexdigest(),json.dumps(user),time.time()+43200))
    return f'lawsoc_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200'

def remember(db, state, action):
    db.execute('INSERT INTO revisions(created,action,body) VALUES (?,?,?)',(time.time(),action,json.dumps(state)))
    db.execute('DELETE FROM revisions WHERE id NOT IN (SELECT id FROM revisions ORDER BY id DESC LIMIT 50)')

def validate_settings(settings):
    if not isinstance(settings,dict):
        raise ValueError('Invalid settings.')
    for key,value in settings.items():
        if key in ['committee','principles']:
            width=2 if key=='committee' else 3
            if not isinstance(value,list) or len(value)>60 or not all(isinstance(row,list) and len(row)==width and all(isinstance(s,str) and len(s)<=5000 for s in row) for row in value):
                raise ValueError('Please check the committee or purpose rows.')
        elif key in ['logo_3d','moot_preview']:
            if not isinstance(value,bool): raise ValueError('Invalid logo setting.')
        elif key.startswith('color_'):
            if not isinstance(value,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',value): raise ValueError('Choose a valid colour.')
        elif not isinstance(value,str) or len(value)>10000:
            raise ValueError('A text field is invalid or too long.')
    if 'email' in settings and not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+',settings['email']):
        raise ValueError('Enter a valid email address.')
    if 'instagram' in settings and settings['instagram'] and not settings['instagram'].startswith('https://'):
        raise ValueError('The Instagram link must use https://.')
    if 'logo' in settings and not valid_asset(settings['logo']):
        raise ValueError('Choose a logo uploaded through the media library.')

def valid_asset(path):
    return isinstance(path,str) and (path=='/assets/logo.png' or re.fullmatch(r'/uploads/[a-f0-9]{32}\.(png|jpg|webp)',path))

def valid_document(path):
    return isinstance(path,str) and bool(re.fullmatch(r'/uploads/[a-f0-9]{32}\.pdf',path))

def validate_backup(state):
    if not isinstance(state,dict) or set(state)!={'settings','events','topics','posts','comments','reactions','reports'}:
        raise ValueError('This is not a Law Society content backup.')
    validate_settings(state['settings'])
    if not {'about','email','instagram','committee'}.issubset(state['settings']): raise ValueError('Missing society settings in backup.')
    schemas={
        'events': {'id':str,'title':str,'date':str,'category':str,'description':str,'status':str,'registration':str,'photos':list},
        'topics': {'id':str,'title':str,'summary':str,'content':str,'publish':str,'discussion':str,'time':str,'instagram':str,'meet':str,'status':str},
        'posts': {'id':str,'topic':str,'author':str,'user':str,'body':str,'created':(int,float),'pinned':bool,'original':(str,type(None))},
        'comments': {'id':str,'post':str,'author':str,'body':str,'created':(int,float)},
        'reactions': {'post':str,'user':str,'reaction':str},
        'reports': {'id':str,'post':str,'user':str,'reason':str,'resolved':bool}}
    for collection,schema in schemas.items():
        rows=state[collection]
        if not isinstance(rows,list) or len(rows)>100000: raise ValueError('Invalid backup collection.')
        ids=set()
        for row in rows:
            if not isinstance(row,dict) or not all(k in row and isinstance(row[k],typ) for k,typ in schema.items()): raise ValueError('Invalid backup record.')
            if 'id' in row:
                if not re.fullmatch(r'[A-Za-z0-9_-]{1,80}',row['id']) or row['id'] in ids: raise ValueError('Invalid or duplicate record ID.')
                ids.add(row['id'])
            for key in ['instagram','meet','registration']:
                if key in row and row[key] and not row[key].startswith('https://'): raise ValueError('Unsafe link in backup.')
            if collection=='events':
                if row['status'] not in ['planned','upcoming','ongoing','past'] or not all(valid_asset(p) for p in row['photos']): raise ValueError('Invalid event in backup.')
                if not all(isinstance(d,dict) and isinstance(d.get('name'),str) and valid_document(d.get('path')) for d in row.get('documents',[])): raise ValueError('Invalid document in backup.')
            if collection=='topics' and row['status'] not in ['upcoming','open','archived']: raise ValueError('Invalid topic status.')
    topic_ids={t['id'] for t in state['topics']}; post_ids={p['id'] for p in state['posts']}
    for post in state['posts']:
        if post['topic'] not in topic_ids or post['original'] and post['original'] not in post_ids: raise ValueError('Broken discussion references in backup.')
    for collection in ['comments','reports','reactions']:
        if any(row['post'] not in post_ids for row in state[collection]): raise ValueError('Broken post references in backup.')
