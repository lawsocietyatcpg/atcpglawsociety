// Three-level lists shared by the caption editor and public renderer.
export function parseListLine(line) {
  const match = /^([ \t]*)([-+*]|\d+[.)])(?:[ \t]+(.*)|$)/.exec(line);
  if (!match) return null;
  return {depth:Math.min(2,Math.floor(match[1].replace(/\t/g,'  ').length/2)), type:/^\d/.test(match[2])?'ol':'ul', content:match[3]??'', prefix:line.length-(match[3]??'').length};
}
const marker = (type,number=1) => type==='ol'?`${number}. `:'- ';
const prefixLength = line => parseListLine(line)?.prefix ?? (line.match(/^#{1,6}\s+/)?.[0].length || 0);
export function normalizeCaptionLists(value) {
  let previous=-1, counters=[], types=[];
  return value.split('\n').map(line=>{
    const item=parseListLine(line);
    if(!item){previous=-1;counters=[];types=[];return line;}
    const depth=Math.min(item.depth,previous+1);
    if(depth>previous||types[depth]!==item.type)counters[depth]=0;
    counters.length=types.length=depth+1;
    counters[depth]=(counters[depth]||0)+1;types[depth]=item.type;previous=depth;
    return '  '.repeat(depth)+marker(item.type,counters[depth])+item.content;
  }).join('\n');
}
const anchor = (value,offset) => {const before=value.slice(0,offset);return {line:before.split('\n').length-1,column:offset-(before.lastIndexOf('\n')+1)};};
const position = (lines,line,column) => lines.slice(0,line).reduce((sum,text)=>sum+text.length+1,0)+Math.min(column,lines[line].length);
export function formatCaptionList(value,start,end,command) {
  const lines=value.split('\n'), first=anchor(value,start), last=anchor(value,end);
  const to=end>start&&last.column===0?last.line-1:last.line;
  let through=to;
  // Moving a parent also moves its children, without flattening their hierarchy.
  if(['indent','outdent'].includes(command)) {
    const tail=parseListLine(lines[to]);
    while(tail&&through+1<lines.length&&parseListLine(lines[through+1])?.depth>tail.depth)through++;
  }
  const selected=lines.slice(first.line,through+1);
  if(['indent','outdent'].includes(command)) {
    const items=selected.map(parseListLine);
    const parent=first.line>0?parseListLine(lines[first.line-1]):null;
    if(items.some(item=>!item)||command==='indent'&&(!parent||parent.depth<items[0].depth||items.some(item=>item.depth>=2))||command==='outdent'&&items.some(item=>item.depth===0))return {value,start,end};
    selected.forEach((line,index)=>{lines[first.line+index]='  '.repeat(items[index].depth+(command==='indent'?1:-1))+marker(items[index].type)+items[index].content;});
  } else {
    const type=command==='number'?'ol':'ul';
    const populated=selected.filter(line=>line.trim());
    const remove=populated.length>0&&populated.every(line=>parseListLine(line)?.type===type);
    selected.forEach((line,index)=>{
      if(!line.trim()&&selected.length>1)return;
      const item=parseListLine(line), content=item?item.content:line.replace(/^#{1,6}\s+/,'');
      lines[first.line+index]=remove?content:'  '.repeat(item?.depth||0)+marker(type)+content;
    });
  }
  const next=normalizeCaptionLists(lines.join('\n')).split('\n');
  const mapped=point=>{
    const before=value.split('\n')[point.line], after=next[point.line];
    const oldPrefix=prefixLength(before), newPrefix=prefixLength(after);
    const column=point.column>=oldPrefix?point.column+newPrefix-oldPrefix:Math.min(point.column,newPrefix);
    return position(next,point.line,column);
  };
  return {value:next.join('\n'),start:mapped(first),end:mapped(last)};
}
export function continueCaptionList(value,start,end) {
  const point=anchor(value,start), lines=value.split('\n'), item=parseListLine(lines[point.line]);
  if(!item||point.column<item.prefix||anchor(value,end).line!==point.line)return null;
  if(!item.content.trim()) {
    lines[point.line]=item.depth?'  '.repeat(item.depth-1)+marker(item.type):'';
    const next=normalizeCaptionLists(lines.join('\n')).split('\n');
    const caret=position(next,point.line,prefixLength(next[point.line]));
    return {value:next.join('\n'),start:caret,end:caret};
  }
  const inserted=value.slice(0,start)+'\n'+'  '.repeat(item.depth)+marker(item.type)+value.slice(end);
  const next=normalizeCaptionLists(inserted).split('\n');
  const caret=position(next,point.line+1,prefixLength(next[point.line+1]));
  return {value:next.join('\n'),start:caret,end:caret};
}
export function renderCaptionList(items,inline) {
  let previous=-1;
  const rows=items.map(item=>{const depth=Math.min(item.depth,previous+1);previous=depth;return {...item,depth};});
  let index=0;
  function level(depth) {
    let html='';
    while(index<rows.length&&rows[index].depth===depth) {
      const type=rows[index].type;
      html+=`<${type}>`;
      while(index<rows.length&&rows[index].depth===depth&&rows[index].type===type) {
        html+=`<li>${inline(rows[index++].content)}`;
        if(index<rows.length&&rows[index].depth>depth)html+=level(depth+1);
        html+='</li>';
      }
      html+=`</${type}>`;
    }
    return html;
  }
  return level(0);
}
