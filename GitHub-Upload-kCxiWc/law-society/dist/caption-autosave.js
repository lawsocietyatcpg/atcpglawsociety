// Serialize photo-caption writes so a slow earlier request cannot overwrite newer text.
export function createCaptionAutosave({save, status=()=>{}, error=()=>{}, delay=600}) {
  const entries=new Map();
  let queue=Promise.resolve();
  const key=(id,path)=>JSON.stringify([id,path]);
  const get=(id,path,initial='')=>{
    const k=key(id,path);
    if(!entries.has(k))entries.set(k,{id,path,value:initial,saved:initial,timer:null,queued:false,error:null,message:'Captions save automatically.'});
    return entries.get(k);
  };
  const report=(entry,message,failed=false)=>{entry.message=message;status(entry.id,entry.path,message,failed);};
  const enqueue=entry=>{
    clearTimeout(entry.timer);entry.timer=null;
    if(entry.queued)return;
    entry.queued=true;
    queue=queue.then(async()=>{
      try {
        entry.error=null;
        while(entry.value!==entry.saved){
          const value=entry.value;
          report(entry,'Saving caption…');
          await save(entry.id,entry.path,value);
          entry.saved=value;
        }
        report(entry,'Caption saved automatically.');
      } catch(cause) {
        entry.error=cause;
        report(entry,'Caption not saved. Please retry.',true);
        error('Your photo caption could not be saved. Please retry before closing.');
      } finally {entry.queued=false;}
    });
  };
  return {
    getValue:(id,path,initial)=>{const entry=get(id,path,initial);if(!entry.queued&&!entry.timer&&!entry.error&&entry.value===entry.saved&&entry.saved!==initial)entry.value=entry.saved=initial;return entry.value;},
    getStatus:(id,path)=>get(id,path).message,
    edit(id,path,value){const entry=get(id,path);entry.value=value;entry.error=null;clearTimeout(entry.timer);report(entry,'Waiting to save caption…');entry.timer=setTimeout(()=>enqueue(entry),delay);},
    pending:()=>[...entries.values()].some(entry=>entry.value!==entry.saved||entry.queued),
    async flush(){
      for(const entry of entries.values())if(entry.timer||entry.value!==entry.saved)enqueue(entry);
      await queue;
      if([...entries.values()].some(entry=>entry.error))throw Error('A photo caption has not been saved. Please retry before closing.');
    }
  };
}
