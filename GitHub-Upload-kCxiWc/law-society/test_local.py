"""Isolated local integration checks; never writes to the preview database."""
import http.client
import base64
import io
import json
import tempfile
import threading
import zipfile
from pathlib import Path
import server

def run():
    with tempfile.TemporaryDirectory(prefix='lawsoc-check-') as temp:
        server.DB = Path(temp)/'test.sqlite3'
        server.PUBLIC = Path(temp)/'public'
        server.PUBLIC.mkdir()
        server.initialize()
        httpd = server.ThreadingHTTPServer(('127.0.0.1', 0),server.Handler)
        server.PORT = httpd.server_port
        threading.Thread(target=httpd.serve_forever,daemon=True).start()
        def request(action=None,data=None,cookie='',expected=200):
            c=http.client.HTTPConnection('127.0.0.1',server.PORT)
            headers={'Origin':f'http://127.0.0.1:{server.PORT}','Content-Type':'application/json','Cookie':cookie}
            c.request('POST' if action else 'GET','/api/'+(action or 'state'),json.dumps(data or {}) if action else None,headers)
            r=c.getresponse(); value=json.loads(r.read()); token=r.getheader('Set-Cookie','').split(';')[0]
            assert r.status==expected,(action,r.status,value)
            c.close()
            return value,token
        try:
            state,_=request(); assert len(state['settings']['committee'])==10 and len(state['events'])==8
            request('post',{'topic':'1','body':'Unauthorized'},expected=401)
            _,student=request('login',{'name':'QA student','role':'student'})
            request('save-topic',{'title':'Denied','status':'open'},student,403)
            request('post',{'topic':'1','body':'Not open yet'},student,400)
            request('login',{'name':'QA administrator','role':'admin'},expected=403)
            credentials={'username':'qa_admin','password':'test-only-long-password-2026'}
            _,admin=request('admin-setup',credentials)
            request('admin-setup',credentials,expected=409)
            request('admin-login',{'username':'qa_admin','password':'wrong'},expected=401)
            request('save-settings',{'settings':{'hero_title':'Test hero','term':'2027/2028'}},student,403)
            request('save-settings',{'settings':{'hero_title':'Test hero','term':'2027/2028'}},admin)
            changed,_=request(cookie=admin);assert changed['settings']['hero_title']=='Test hero'
            before=changed['revisions'][0]['id']
            request('restore-revision',{'id':before},admin)
            request('save-settings',{'settings':{'creator_credit':'erase'}},admin,400)
            topic=state['topics'][0];topic['status']='open'
            request('save-topic',topic,admin)
            request('post',{'topic':'1','body':'A test perspective <script> is text.'},student)
            state,_=request();post=state['posts'][0]['id']
            request('react',{'id':post,'reaction':'like'},student)
            request('react',{'id':post,'reaction':'dislike'},student)
            state,_=request();assert len(state['reactions'])==1 and state['reactions'][0]['reaction']=='dislike'
            request('comment',{'id':post,'body':'Test reply'},student)
            request('repost',{'id':post},student)
            state,_=request();assert len(state['posts'])==2 and state['posts'][1]['original']==post
            request('report',{'id':post,'reason':'QA moderation'},student)
            request('pin',{'id':post},student,403)
            request('pin',{'id':post},admin)
            state,_=request(cookie=admin);assert state['posts'][0]['pinned'] and len(state['reports'])==1
            request('resolve-report',{'id':state['reports'][0]['id']},admin)
            request('save-event',{'title':'QA Event','date':'Tomorrow','category':'Test','description':'QA recap','status':'past','registration':''},admin)
            state,_=request();event=state['events'][-1];assert event['title']=='QA Event'
            request('save-event',{**event,'registration':'javascript:alert(1)'},admin,400)
            png=(server.ROOT/'dist/assets/logo.png').read_bytes()
            request('upload',{'id':event['id'],'image':base64.b64encode(png).decode()},admin)
            state,_=request();photo=state['events'][-1]['photos'][0]
            request('photo-details',{'id':event['id'],'path':photo,'caption':'Test photograph caption','cover':True},admin)
            state,_=request();assert state['events'][-1]['photo_captions'][photo]=='Test photograph caption'
            pdf=b'%PDF-1.4\n% isolated test fixture'
            request('upload',{'id':event['id'],'target':'document','name':'Test problem PDF','image':base64.b64encode(pdf).decode()},admin)
            state,_=request();assert state['events'][-1]['documents'][0]['name']=='Test problem PDF'
            c=http.client.HTTPConnection('127.0.0.1',server.PORT)
            c.request('GET','/api/backup',headers={'Cookie':admin});r=c.getresponse();archive=r.read();assert r.status==200;c.close()
            with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
                assert 'content.json' in bundle.namelist() and any(n.endswith('.pdf') for n in bundle.namelist())
                assert 'administrator' not in bundle.read('content.json').decode()
            request('import-backup',{'archive':base64.b64encode(archive).decode()},student,403)
            request('import-backup',{'archive':base64.b64encode(archive).decode()},admin)
            state,_=request();assert state['events'][-1]['photo_captions'][photo]=='Test photograph caption'
            request('remove-photo',{'id':event['id'],'path':photo},admin)
            state,_=request();assert not state['events'][-1]['photos']
            bad=io.BytesIO()
            with zipfile.ZipFile(bad,'w') as bundle:bundle.writestr('../escape.txt','unsafe')
            request('import-backup',{'archive':base64.b64encode(bad.getvalue()).decode()},admin,400)
            request('delete-event',{'id':event['id']},admin)
            request('delete-post',{'id':post},admin)
            state,_=request();assert not state['posts'] and not state['comments'] and not state['reactions']
            server.initialize();persisted,_=request();assert persisted['topics'][0]['status']=='open'
            _,again=request('admin-login',credentials)
            request('change-credentials',{'username':'next_committee','current_password':credentials['password'],'password':'another-test-password-2027'},again)
            request('save-topic',topic,admin,401)
            request('admin-login',credentials,expected=401)
            request('admin-login',{'username':'next_committee','password':'another-test-password-2027'})
            request('logout',{},student)
            request('post',{'topic':'1','body':'After logout'},student,401)
            print('PASS: administrator setup, password login, role escalation blocked, persistent credentials, credential rotation, old sessions revoked, content settings, version recovery, fixed attribution, discussion, moderation and events.')
        finally:
            httpd.shutdown();httpd.server_close()

if __name__=='__main__':run()
