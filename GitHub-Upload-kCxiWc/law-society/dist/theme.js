/* Appearance is a visitor preference, independent of the administrator account. */
(() => {
  const root=document.documentElement;
  const system=matchMedia('(prefers-color-scheme: dark)');
  let saved=null;
  try { saved=localStorage.getItem('lawsoc-theme'); } catch {}
  if(!['light','dark'].includes(saved))saved=null;
  function apply(theme){
    root.dataset.theme=theme;
    document.querySelectorAll('[data-theme-toggle]').forEach(button=>{
      const next=theme==='dark'?'light':'dark';
      button.setAttribute('aria-label',`Switch to ${next} mode`);
      button.title=`Switch to ${next} mode`;
      button.querySelector('.theme-label').textContent=next==='dark'?'Dark':'Light';
      button.querySelector('.theme-symbol').textContent=next==='dark'?'☾':'☀';
    });
  }
  apply(saved||(system.matches?'dark':'light'));
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-theme-toggle]'))return;
    saved=root.dataset.theme==='dark'?'light':'dark';
    try { localStorage.setItem('lawsoc-theme',saved); } catch {}
    apply(saved);
  });
  document.addEventListener('theme-controls-ready',()=>apply(root.dataset.theme));
  system.addEventListener('change',()=>{if(!saved)apply(system.matches?'dark':'light')});
})();
