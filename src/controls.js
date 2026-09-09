'use strict';

// One small toolbar; one optional panel at a time. The existing controls keep
// their simulation/audio handlers, including independent mixer categories.
const quietControls={panel:null,opener:null,back:null,panels:[],ready:false};
const quietPrimaryPanels=new Set(['viewsPanel','trainPanel','morePanel']);

function closeQuietControls(restoreFocus=false){
 if(!quietControls.panel)return;
 const openers=[quietControls.opener];
 for(let back=quietControls.back;back;back=back.back)openers.push(back.opener);
 for(const panel of quietControls.panels)panel.hidden=true;
 for(const button of document.querySelectorAll('[data-quiet-opener]')){
  button.setAttribute('aria-expanded','false');button.classList.remove('on');
 }
 $('diagramToggle')?.setAttribute('aria-pressed','false');
 quietControls.panel=null;quietControls.opener=null;quietControls.back=null;
 if(restoreFocus){
  const target=openers.find(button=>button?.getClientRects().length)||(hobby.cinema?$('cinemaMix'):$('moreBtn'));
  target?.focus({preventScroll:true});
 }
}

function openQuietPanel(id,opener,back){
 const panel=$(id);if(!panel)return;
 if(quietControls.panel===panel){closeQuietControls(true);return;}
 const previous=quietControls.panel;
 if(back===undefined)back=previous&&!quietPrimaryPanels.has(id)?{id:previous.id,opener:quietControls.opener,back:quietControls.back}:null;
 closeQuietControls();
 quietControls.panel=panel;quietControls.opener=opener;quietControls.back=back;
 panel.hidden=false;panel.scrollTop=0;window.railwayAnalytics?.panel?.(id);
 for(const button of document.querySelectorAll('[data-quiet-opener]'))if(button.getAttribute('aria-controls')===id)button.setAttribute('aria-expanded','true');
 const backButton=panel.querySelector('[data-panel-back]');if(backButton)backButton.hidden=!back;
 if(id==='layoutPanel'){$('diagramToggle').setAttribute('aria-pressed','true');drawMap();}
 if(id==='playlistPanel')playlistPaint();
 if(id==='soundPanel')wakeCinema();
 (panel.querySelector('.control-panel-head h2')||panel.querySelector('h2,h3'))?.focus({preventScroll:true});
}

function initQuietControls(){
 if(quietControls.ready)return;quietControls.ready=true;
 const titles={viewsPanel:'Views',trainPanel:'Your train',morePanel:'Make yourself at home',ambiencePanel:'Atmosphere',layoutPanel:'Railway network',soundPanel:'Sound & music',playlistPanel:'The record shelf',help:'Controls & guide'};
 for(const [id,title]of Object.entries(titles)){
  const panel=$(id);if(!panel)continue;
  panel.classList.add('quiet-panel');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label',title);panel.removeAttribute('aria-modal');
  if(!panel.querySelector('.control-panel-head')){
   const head=document.createElement('div');head.className='control-panel-head quiet-generated';
   head.innerHTML='<button type="button" data-panel-back aria-label="Back to previous controls" hidden>‹</button><h2 tabindex="-1"></h2><button type="button" class="control-close" data-close-panel aria-label="Close panel">×</button>';
   head.querySelector('h2').textContent=title;panel.prepend(head);
  }
  panel.querySelector('[data-close-panel]').onclick=()=>closeQuietControls(true);
  const backButton=panel.querySelector('[data-panel-back]');if(backButton)backButton.onclick=()=>{
   const back=quietControls.back;if(back)openQuietPanel(back.id,back.opener,back.back);
  };
  quietControls.panels.push(panel);
 }
 const bindings={viewsBtn:'viewsPanel',trainBtn:'trainPanel',moreBtn:'morePanel',ambienceBtn:'ambiencePanel',playlistBtn:'playlistPanel',quietSoundMixer:'soundPanel',soundMixerButton:'soundPanel',atmosphereSoundMixer:'soundPanel',cinemaMix:'soundPanel',mapBtn:'layoutPanel',diagramToggle:'layoutPanel',divisionNetwork:'layoutPanel',quietHelp:'help',helpBtn:'help'};
 for(const [id,panel]of Object.entries(bindings)){
  const button=$(id);if(!button)continue;
  button.dataset.quietOpener='';button.setAttribute('aria-controls',panel);button.setAttribute('aria-expanded','false');
  button.onclick=()=>openQuietPanel(panel,button);
 }
 if($('playlistBtn')&&!$('playlistBtn').querySelector('span')){
  const label=document.createElement('span');label.textContent='The record shelf';$('playlistBtn').append(label);
 }
 if($('playlistBtn')){$('playlistBtn').className='control-link';$('soundPanel').append($('playlistBtn'));}
 for(const id of ['soundClose','closeNetwork','helpClose'])$(id).onclick=()=>closeQuietControls(true);
 toggleDiagram=()=>openQuietPanel('layoutPanel',$('viewsBtn'));
 playlistToggle=()=>openQuietPanel('playlistPanel',$('moreBtn'));
 showHelp=()=>openQuietPanel('help',$('moreBtn'));
 closeHelp=()=>{if(quietControls.panel===$('help'))closeQuietControls(true);};
 const originalHideUI=hideUI;
 hideUI=()=>{closeQuietControls();originalHideUI();(hidden?$('restore'):$('moreBtn')).focus({preventScroll:true});};
 $('quietHide').onclick=hideUI;$('restore').onclick=hideUI;
 // Cinema remains one tap away, beside pause, without its own floating row.
 $('railControls').insertBefore($('cinemaStart'),$('moreBtn'));
 $('cinemaStart').querySelector('span').textContent='Cinema';
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-camera],[data-district],#roomPlaces button,.engine-medallion,#leaveTrainInspector,#map,#turntableBtn'))closeQuietControls(true);
 });
 window.addEventListener('pointerdown',event=>{
  if(quietControls.panel&&!quietControls.panel.contains(event.target)&&!event.target.closest('#railControls,[data-quiet-opener]'))closeQuietControls();
 },true);
 window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&quietControls.panel){event.preventDefault();event.stopImmediatePropagation();closeQuietControls(true);return;}
  // A key used inside a disclosure belongs to that control, not the train's
  // global shortcuts. Keep native slider, select and button key behavior.
  if(quietControls.panel?.contains(event.target))event.stopPropagation();
 },true);
}
