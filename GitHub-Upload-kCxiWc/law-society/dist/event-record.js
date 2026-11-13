// Legacy captions stay intact: past-event descriptions become the recap until saved separately.
export function eventContent(event={}) {
  return {
    introduction:event.introduction ?? (event.status==='past'?'':event.description||''),
    recap:event.recap ?? (event.status==='past'?event.description||'':''),
    venue:event.venue ?? (event.id==='1'?'ATC Penang · Moot Court':'')
  };
}
