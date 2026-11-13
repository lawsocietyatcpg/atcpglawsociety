import {parseListLine,renderCaptionList,formatCaptionList,continueCaptionList} from './caption-lists.js';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

// Escape all user text before adding the small set of supported formatting tags.
function inline(text) {
  return escape(text).replace(/(\*\*|__|\+\+|\*|_)(?=\S)(\S(?:.*?\S)?)\1/g, (_, marker, content) => {
    const tag = marker === '++' ? 'u' : marker.length === 2 ? 'strong' : 'em';
    return `<${tag}>${inlineUnescaped(content)}</${tag}>`;
  });
}
function inlineUnescaped(text) {
  // The outer renderer has already escaped this text, including any HTML.
  return text.replace(/(\*\*|__|\+\+|\*|_)(?=\S)(\S(?:.*?\S)?)\1/g, (_, marker, content) => {
    const tag = marker === '++' ? 'u' : marker.length === 2 ? 'strong' : 'em';
    return `<${tag}>${inlineUnescaped(content)}</${tag}>`;
  });
}
export function renderEventDescription(value) {
  const blocks = [], paragraph = [], list = [];
  const flush = () => { if (paragraph.length) blocks.push(`<p>${paragraph.splice(0).map(inline).join('<br>')}</p>`); };
  const flushList = () => {if(list.length)blocks.push(renderCaptionList(list.splice(0),inline));};
  for (const line of String(value ?? '').replace(/\r\n?/g, '\n').replace(/^\n+|\n+$/g,'').split('\n')) {
    const item=parseListLine(line);
    if(item){flush();list.push(item);continue;}
    flushList();
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) { flush(); blocks.push(`<h3>${inline(heading[1])}</h3>`); }
    else if (!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();flushList();
  return blocks.join('');
}
export function formatCaptionBlock(value, start, end, style) {
  const from = start === 0 ? 0 : value.lastIndexOf('\n', start - 1) + 1;
  const last = end > start ? end - 1 : start;
  const newline = value.indexOf('\n', last);
  const to = newline === -1 ? value.length : newline;
  const lines = value.slice(from, to).split('\n');
  const text = lines.map(line => {
    const content = (parseListLine(line)?.content ?? line).replace(/^#{1,6}\s+/, '');
    return style === 'heading' && (content.trim() || lines.length === 1) ? '### ' + content : content;
  }).join('\n');
  return {from, to, text};
}
export function eventDescriptionEditor(value,{name='description',label='Caption / description / event recap',rows=9}={}) {
  return `<section class="event-description-editor"><label for="f-${escape(name)}">${escape(label)}</label><div class="event-format-toolbar" role="group" aria-label="Caption formatting"><button type="button" class="btn outline" data-event-block="heading" title="Format the current or selected lines as a section heading">Heading</button><button type="button" class="btn outline" data-event-block="paragraph" title="Return the current or selected lines to normal text">Normal text</button><button type="button" class="btn outline" data-event-format="**" aria-label="Bold"><strong>B</strong></button><button type="button" class="btn outline" data-event-format="*" aria-label="Italic"><em>I</em></button><button type="button" class="btn outline" data-event-format="++" aria-label="Underline"><u>U</u></button><button type="button" class="btn outline" data-event-list="bullet" aria-label="Bullet points">• Bullets</button><button type="button" class="btn outline" data-event-list="number" aria-label="Numbering">1. Numbering</button><button type="button" class="btn outline" data-event-list="outdent" aria-label="Decrease list level">← Outdent</button><button type="button" class="btn outline" data-event-list="indent" aria-label="Increase list level">→ Indent</button></div><textarea id="f-${escape(name)}" name="${escape(name)}" rows="${rows}" aria-describedby="caption-help-${escape(name)}">${escape(value)}</textarea><p id="caption-help-${escape(name)}" class="small muted">Choose Heading or Normal text for the current or selected lines. Select text to apply Bold, Italic or Underline. Lists support up to 3 levels. Use Enter for the next item, Tab to indent and Shift+Tab to outdent. Enter on an empty item moves up a level or ends the list. Separate paragraphs with a blank line. Check the preview below before saving.</p><div class="caption-preview-label small muted">Caption preview</div><div class="event-copy caption-preview" aria-label="Caption preview">${renderEventDescription(value)}</div></section>`;
}
function applyListEdit(input,result) {
  input.setRangeText(result.value,0,input.value.length,'end');
  input.setSelectionRange(result.start,result.end);
  input.focus();input.dispatchEvent(new Event('input',{bubbles:true}));
}
if (typeof document !== 'undefined') {
  document.addEventListener('keydown',event=>{
    const input=event.target;
    if(!input.matches('.event-description-editor textarea')||event.isComposing)return;
    const start=input.selectionStart,end=input.selectionEnd;
    if(event.key==='Tab'){
      const first=input.value.lastIndexOf('\n',Math.max(0,start-1))+1;
      if(!parseListLine(input.value.slice(start===0?0:first).split('\n')[0]))return;
      event.preventDefault();applyListEdit(input,formatCaptionList(input.value,start,end,event.shiftKey?'outdent':'indent'));
    }else if(event.key==='Enter'&&!event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey){
      const result=continueCaptionList(input.value,start,end);
      if(result){event.preventDefault();applyListEdit(input,result);}
    }
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-event-format], [data-event-block], [data-event-list]');
    if (!button) return;
    const editor = button.closest('.event-description-editor');
    const input = editor.querySelector('textarea');
    const marker = button.dataset.eventFormat;
    const start = input.selectionStart, end = input.selectionEnd;
    if (button.dataset.eventList) {
      applyListEdit(input,formatCaptionList(input.value,start,end,button.dataset.eventList));
      return;
    }
    if (button.dataset.eventBlock) {
      const block = formatCaptionBlock(input.value, start, end, button.dataset.eventBlock);
      input.setRangeText(block.text, block.from, block.to, 'select');
      if (start === end) input.setSelectionRange(block.from + block.text.length, block.from + block.text.length);
      input.focus();
      input.dispatchEvent(new Event('input',{bubbles:true}));
      return;
    }
    const selected = input.value.slice(start, end);
    const unwrap = start >= marker.length && input.value.slice(start-marker.length,start) === marker && input.value.slice(end,end+marker.length) === marker;
    if (unwrap) {
      input.setRangeText(selected,start-marker.length,end+marker.length,'select');
    } else {
      input.setRangeText(marker+selected+marker,start,end,'select');
      input.setSelectionRange(start+marker.length,end+marker.length);
    }
    input.focus();
    input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  document.addEventListener('input', event => {
    const input = event.target;
    const editor = input.closest('.event-description-editor');
    if (editor && input.matches('textarea')) editor.querySelector('.caption-preview').innerHTML = renderEventDescription(input.value);
  });
}
