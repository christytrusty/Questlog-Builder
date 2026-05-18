
(function(){
"use strict";

// ── Core utils (must be first) ────────────────────────────────────
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function esc(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function maybeRunStorageRecovery(){
  const params=new URLSearchParams(location.search);
  const backupKey='ql.project.autosave.before-v2.2';
  if(params.get('restore')==='pre-v2.2'){
    const backup=localStorage.getItem(backupKey);
    if(backup&&confirm('Restore the saved project backup from before v2.2? This replaces the current autosaved project in this browser.')){
      localStorage.setItem('ql.project.autosave.v2',backup);
    }
    params.delete('restore');
  }
  if(params.get('reset')==='saved-progress'&&confirm('Clear saved Questlog editor progress for this browser? This can fix broken old saved data, but it removes the current autosaved project and undo history.')){
    Object.keys(localStorage)
      .filter(k=>k.startsWith('ql.')&&k!==backupKey)
      .forEach(k=>localStorage.removeItem(k));
    params.delete('reset');
  }
  const query=params.toString();
  history.replaceState(null,'',location.pathname+(query?`?${query}`:'')+location.hash);
}
maybeRunStorageRecovery();

// ── Theme ─────────────────────────────────────────────────────────
const THEME_NAMES={
  dark:'Questlog Dark',
  light:'Questlog Light',
  mossbound:'Mossbound',
  'ivory-harbor':'Ivory Harbor',
  'royal-steel':'Royal Steel',
  'cocoa-gold':'Cocoa Gold',
  'neon-slate':'Neon Slate',
  'matrix-lime':'Matrix Lime',
  'violet-laser':'Violet Laser',
  'mars-charcoal':'Mars Charcoal',
  'crimson-smoke':'Crimson Smoke',
  'frosted-steel':'Frosted Steel',
  'umber-sand':'Umber Sand',
  'blush-clay':'Blush Clay',
  'emerald-spruce':'Emerald Spruce',
  'valhalla-bloom':'Valhalla Bloom',
  'heliotrope-mist':'Heliotrope Mist',
  'ink-mint':'Ink Mint',
  'ocean-foam':'Ocean Foam',
  'plum-rose':'Plum Rose',
  'tangerine-glow':'Tangerine Glow',
  'salmon-sushi':'Salmon Sushi',
  'graphite-gold':'Graphite Gold',
  'harvest-cinder':'Harvest Cinder',
  'sea-turtle':'Sea Turtle',
  'gotham-violet':'Gotham Violet'
};
const LIGHT_THEME_IDS=new Set([
  'light','mossbound','ivory-harbor','royal-steel','cocoa-gold',
  'crimson-smoke','frosted-steel','umber-sand','blush-clay',
  'heliotrope-mist','ocean-foam'
]);
let cTheme=localStorage.getItem('ql.theme')||'dark';
function updateThemeToggle(){
  const btn=$('#themeToggle');
  if(!btn)return;
  const isLight=LIGHT_THEME_IDS.has(cTheme);
  btn.textContent=isLight?'☾':'☀';
  btn.setAttribute('aria-label',isLight?'Switch to dark theme':'Switch to light theme');
  btn.setAttribute('data-tip',isLight?'Switch to Questlog Dark.':'Switch to Questlog Light.');
}
function applyTheme(t){
  cTheme=THEME_NAMES[t]?t:'dark';
  document.documentElement.setAttribute('data-theme',cTheme);
  localStorage.setItem('ql.theme',cTheme);
  const personalSelect=$('#personalThemePreset');
  if(personalSelect)personalSelect.value=cTheme;
  updateThemeToggle();
}
applyTheme(cTheme);

// ── Constants ─────────────────────────────────────────────────────
const MC_STATS=["minecraft:leave_game","minecraft:play_time","minecraft:total_world_time","minecraft:time_since_death","minecraft:time_since_rest","minecraft:sneak_time","minecraft:walk_one_cm","minecraft:crouch_one_cm","minecraft:sprint_one_cm","minecraft:walk_on_water_one_cm","minecraft:fall_one_cm","minecraft:climb_one_cm","minecraft:fly_one_cm","minecraft:walk_under_water_one_cm","minecraft:minecart_one_cm","minecraft:boat_one_cm","minecraft:pig_one_cm","minecraft:horse_one_cm","minecraft:aviate_one_cm","minecraft:swim_one_cm","minecraft:strider_one_cm","minecraft:jump","minecraft:drop","minecraft:damage_dealt","minecraft:damage_dealt_absorbed","minecraft:damage_dealt_resisted","minecraft:damage_taken","minecraft:damage_blocked_by_shield","minecraft:damage_absorbed","minecraft:damage_resisted","minecraft:deaths","minecraft:mob_kills","minecraft:animals_bred","minecraft:player_kills","minecraft:fish_caught","minecraft:talked_to_villager","minecraft:traded_with_villager","minecraft:eat_cake_slice","minecraft:fill_cauldron","minecraft:use_cauldron","minecraft:clean_armor","minecraft:clean_banner","minecraft:clean_shulker_box","minecraft:interact_with_brewingstand","minecraft:interact_with_beacon","minecraft:inspect_dropper","minecraft:inspect_hopper","minecraft:inspect_dispenser","minecraft:play_noteblock","minecraft:tune_noteblock","minecraft:pot_flower","minecraft:trigger_trapped_chest","minecraft:open_enderchest","minecraft:enchant_item","minecraft:play_record","minecraft:interact_with_furnace","minecraft:interact_with_crafting_table","minecraft:open_chest","minecraft:sleep_in_bed","minecraft:open_shulker_box","minecraft:open_barrel","minecraft:interact_with_blast_furnace","minecraft:interact_with_smoker","minecraft:interact_with_lectern","minecraft:interact_with_campfire","minecraft:interact_with_cartography_table","minecraft:interact_with_loom","minecraft:interact_with_stonecutter","minecraft:bell_ring","minecraft:raid_trigger","minecraft:raid_win","minecraft:interact_with_anvil","minecraft:interact_with_grindstone","minecraft:target_hit","minecraft:interact_with_smithing_table"];
const EQUIP_SLOTS=["head","chest","legs","feet","mainhand","offhand","body"];
const OBJ_TYPES=["questlog:stat","questlog:block_mine","questlog:block_place","questlog:entity_breed","questlog:entity_death","questlog:entity_kill","questlog:entity_tame","questlog:item_craft","questlog:item_drop","questlog:item_equip","questlog:item_obtain","questlog:item_use","questlog:visit_biome","questlog:visit_dimension","questlog:visit_position","questlog:trample","questlog:enchant","questlog:effect_added","questlog:visit_structure","questlog:or","questlog:not","questlog:block_interact","questlog:entity_approach","questlog:quest_complete","questlog:read","questlog:advancement","questlog:unobtainable"];
const REW_TYPES=["questlog:item","questlog:command","questlog:experience","questlog:loot_table"];
const NO_AMOUNT_OBJECTIVES=new Set(["questlog:or","questlog:not","questlog:read","questlog:unobtainable","questlog:quest_complete"]);
const APP_VERSION='2.8';
window.QUESTLOG_APP_VERSION=APP_VERSION;
document.documentElement.dataset.questlogAppVersion=APP_VERSION;
const PANEL_DEF=["display","progress","sounds","layout","labels","badge"];
const PANEL_FIELDS={display:["title","sort_order","chapter","translatable","include_in_main","hidden","description","description_completed","description_failed","icon"],progress:["requirements","objectives","failures","rewards"],sounds:["completed_sound","triggered_sound","toast_on_unlock","toast_on_complete","show_popup_on_unlock"],layout:["background_texture","right_panel_texture","peripheral_texture","overlay","overlay_width","overlay_height","overlay_x_offset","overlay_y_offset","left_panel_width","right_panel_width","panel_height","left_panel_x_offset","left_panel_y_offset","right_panel_x_offset","right_panel_y_offset"],labels:["back_button_text","collect_button_text","uncollected_text","collected_text","text_color","completed_text_color","hovered_text_color","title_color","progress_text_color"],badge:["badge"]};
const ADV_KEYS=["layout","labels","badge"];
const MAIN_KEYS=["display","progress","sounds"];
const MC_COLORS=[
  {code:'§0',name:'Black',color:'#000000'},{code:'§1',name:'Dark Blue',color:'#0000AA'},{code:'§2',name:'Dark Green',color:'#00AA00'},{code:'§3',name:'Dark Aqua',color:'#00AAAA'},
  {code:'§4',name:'Dark Red',color:'#AA0000'},{code:'§5',name:'Dark Purple',color:'#AA00AA'},{code:'§6',name:'Gold',color:'#FFAA00'},{code:'§7',name:'Gray',color:'#AAAAAA'},
  {code:'§8',name:'Dark Gray',color:'#555555'},{code:'§9',name:'Blue',color:'#5555FF'},{code:'§a',name:'Green',color:'#55FF55'},{code:'§b',name:'Aqua',color:'#55FFFF'},
  {code:'§c',name:'Red',color:'#FF5555'},{code:'§d',name:'Purple',color:'#FF55FF'},{code:'§e',name:'Yellow',color:'#FFFF55'},{code:'§f',name:'White',color:'#FFFFFF'}
];
const MC_STYLES=[
  {code:'§l',name:'Bold'},{code:'§o',name:'Italic'},{code:'§n',name:'Underline'},{code:'§m',name:'Strikethrough'},{code:'§k',name:'Obfuscated'},{code:'§r',name:'Reset'}
];

// ── State ─────────────────────────────────────────────────────────
let mode='quest',quests={},chapters={},currentFile=null,rawMode=false,jsonFocused=false;
let isDragging=false,draggedQuest=null;
let panelOrder=loadOrder();
let activeAdvKey=null; // which advanced section is currently shown
let toastSeq=0;

function debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms);};}
function onClick(sel,fn){const el=$(sel);if(el)el.onclick=fn;else console.warn(`[missing ui] ${sel}`);}
function onEvent(sel,type,fn){const el=$(sel);if(el)el.addEventListener(type,fn);else console.warn(`[missing ui] ${sel}`);}
function showMsg(t,ok){
  const stack=$('#toastStack');if(!stack)return;
  if(!t){stack.innerHTML='';return;}
  playUiSound(ok?'success':'error');
  const toast=document.createElement('div');
  toast.className=`toast ${ok?'ok':'err'}`;
  toast.dataset.toastId=String(++toastSeq);
  toast.textContent=t;
  stack.prepend(toast);
  const close=()=>{
    toast.classList.add('leaving');
    setTimeout(()=>toast.remove(),260);
  };
  setTimeout(close,5000);
}
let uiAudioCtx=null,lastTypeSoundAt=0;
const UI_SOUND_FILES={
  click:'ui-sounds/ui-click.wav',
  toggle:'ui-sounds/ui-toggle.wav',
  menu:'ui-sounds/ui-menu.wav',
  type:'ui-sounds/ui-type.wav',
  success:'ui-sounds/ui-success.wav',
  error:'ui-sounds/ui-error.wav'
};
const UI_SOUND_SHAPES={
  click:{freq:420,duration:0.05,gain:0.11},
  toggle:{freq:560,duration:0.065,gain:0.12},
  menu:{freq:360,duration:0.07,gain:0.10},
  type:{freq:720,duration:0.022,gain:0.052},
  success:{freq:660,duration:0.105,gain:0.13},
  error:{freq:180,duration:0.13,gain:0.14}
};
const uiSoundBuffers={},uiSoundBufferPromises={};
function canPlayUiSound(kind){
  if(!uiSoundsEnabled||uiSoundsMuted||uiSoundVolume<=0)return false;
  if(kind==='type'&&!uiTypingSoundsEnabled)return false;
  return true;
}
function getUiAudioContext(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return null;
  uiAudioCtx=uiAudioCtx||new AudioCtx();
  if(uiAudioCtx.state==='suspended')uiAudioCtx.resume?.();
  return uiAudioCtx;
}
function loadUiSoundBuffer(kind){
  const key=UI_SOUND_FILES[kind]?kind:'click';
  if(uiSoundBuffers[key])return Promise.resolve(uiSoundBuffers[key]);
  if(!uiSoundBufferPromises[key]){
    uiSoundBufferPromises[key]=fetch(UI_SOUND_FILES[key],{cache:'no-store'})
      .then(res=>{
        if(!res.ok)throw new Error(`Missing UI sound: ${key}`);
        return res.arrayBuffer();
      })
      .then(buffer=>{
        const ctx=getUiAudioContext();
        if(!ctx)throw new Error('AudioContext unavailable');
        return ctx.decodeAudioData(buffer);
      })
      .then(decoded=>(uiSoundBuffers[key]=decoded))
      .catch(err=>{
        delete uiSoundBufferPromises[key];
        throw err;
      });
  }
  return uiSoundBufferPromises[key];
}
function playGeneratedUiSound(kind='click'){
  try{
    const ctx=getUiAudioContext();if(!ctx)return;
    const shape=UI_SOUND_SHAPES[kind]||UI_SOUND_SHAPES.click;
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    const now=ctx.currentTime;
    osc.type='sine';osc.frequency.setValueAtTime(shape.freq,now);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001,shape.gain*uiSoundVolume),now+0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+shape.duration);
    osc.connect(gain);gain.connect(ctx.destination);
    osc.start(now);osc.stop(now+shape.duration+0.012);
  }catch(err){}
}
function playUiSound(kind='click'){
  if(!canPlayUiSound(kind))return;
  const key=UI_SOUND_FILES[kind]?kind:'click';
  const ctx=getUiAudioContext();if(!ctx)return;
  loadUiSoundBuffer(key).then(buffer=>{
    if(!canPlayUiSound(kind))return;
    getUiAudioContext();
    const source=ctx.createBufferSource(),gain=ctx.createGain();
    source.buffer=buffer;
    gain.gain.setValueAtTime(Math.min(2,Math.max(0,uiSoundVolume)),ctx.currentTime);
    source.connect(gain);gain.connect(ctx.destination);
    source.start();
  }).catch(()=>playGeneratedUiSound(key));
}
function updateUiSoundControls(){
  const soundBox=$('#uiSoundsToggle'),typeBox=$('#uiTypingSoundsToggle'),vol=$('#uiSoundVolume'),val=$('#uiSoundVolumeValue'),mute=$('#muteToggle');
  if(soundBox)soundBox.checked=uiSoundsEnabled;
  if(typeBox){typeBox.checked=uiTypingSoundsEnabled;typeBox.disabled=!uiSoundsEnabled;}
  if(vol){vol.value=String(Math.round(uiSoundVolume*100));vol.disabled=!uiSoundsEnabled;}
  if(val)val.textContent=`${Math.round(uiSoundVolume*100)}%`;
  if(mute){
    mute.textContent=uiSoundsMuted?'Muted':'♪';
    mute.classList.toggle('active',uiSoundsEnabled&&!uiSoundsMuted);
    mute.setAttribute('aria-pressed',String(uiSoundsEnabled&&!uiSoundsMuted));
    mute.dataset.tip=uiSoundsMuted?'UI sounds are muted. Click to unmute.':'Mute or unmute optional editor UI sounds.';
  }
}
function renderModSupportControls(){
  const list=$('#modSupportList'),targetSelect=$('#modSuggestionTarget');
  if(targetSelect)targetSelect.value=modSuggestionTarget;
  if(!list)return;
  const packs=Array.isArray(window.MOD_ID_PACKS?.packs)?window.MOD_ID_PACKS.packs:[];
  if(!packs.length){list.innerHTML='<div class="settings-copy">No mod suggestion packs are configured yet.</div>';return;}
  list.innerHTML=packs.map(pack=>{
    const supports=modPackSupportsTarget(pack);
    const dataCount=modPackDataCount(pack);
    const active=supports&&dataCount>0;
    const checked=active&&enabledModSuggestions.has(pack.id);
    const status=!supports?`Not available for Minecraft ${esc(modSuggestionTarget)}.`:dataCount>0?'':'Coming later.';
    const modIds=(pack.modIds||[pack.id]).join(', ');
    const description=pack.description||'Adds modded content for Questlog ID suggestions.';
    return `<label class="mod-pack-row ${active?'':'disabled'}">
      <input type="checkbox" class="mod-pack-toggle" value="${esc(pack.id)}" ${checked?'checked':''} ${active?'':'disabled'}>
      <span>
        <span class="mod-pack-name">${esc(pack.name||pack.id)}</span>
        <span class="mod-pack-meta">mod id: ${esc(modIds)}</span>
        <span class="mod-pack-desc">${esc(description)}</span>
        ${status?`<span class="mod-pack-status">${status}</span>`:''}
      </span>
    </label>`;
  }).join('');
}
function setUiSoundsEnabled(enabled){
  uiSoundsEnabled=!!enabled;
  localStorage.setItem(UI_SOUND_PREF_KEY,uiSoundsEnabled?'true':'false');
  updateUiSoundControls();
  showMsg(uiSoundsEnabled?'UI sounds enabled.':'UI sounds disabled.',true);
}
function setUiSoundsMuted(muted){
  uiSoundsMuted=!!muted;
  localStorage.setItem(UI_SOUND_MUTE_KEY,uiSoundsMuted?'true':'false');
  updateUiSoundControls();
  showMsg(uiSoundsMuted?'UI sounds muted.':'UI sounds unmuted.',true);
}
function setUiTypingSoundsEnabled(enabled){
  uiTypingSoundsEnabled=!!enabled;
  localStorage.setItem(UI_TYPING_SOUND_PREF_KEY,uiTypingSoundsEnabled?'true':'false');
  updateUiSoundControls();
  showMsg(uiTypingSoundsEnabled?'Typing sounds enabled.':'Typing sounds disabled.',true);
}
function setUiSoundVolume(value){
  uiSoundVolume=Math.min(2,Math.max(0,Number(value)/100||0));
  localStorage.setItem(UI_SOUND_VOLUME_KEY,String(uiSoundVolume));
  updateUiSoundControls();
}
function setupUiSoundEvents(){
  updateUiSoundControls();
  document.addEventListener('click',e=>{
    const el=e.target?.closest?.('button,.sidebar-row,.tab-btn,.mc-ac-row');
    if(!el||el.disabled||el.id==='muteToggle'||el.id==='themeToggle')return;
    playUiSound(el.closest?.('.sidebar-menu,.settings-menu')?'menu':'click');
  },true);
  document.addEventListener('change',e=>{
    if(e.target?.matches?.('input[type="checkbox"],select,input[type="range"]'))playUiSound('toggle');
  },true);
  document.addEventListener('input',e=>{
    const t=e.target;if(!t?.matches?.('input[type="text"],input[type="number"],textarea'))return;
    const now=Date.now();if(now-lastTypeSoundAt<55)return;
    lastTypeSoundAt=now;playUiSound('type');
  },true);
}
function defaultPersonalization(){
  return {
    count:3,
    font:"'DM Sans',system-ui,sans-serif",
    colors:[
      {label:'Primary',hex:cTheme==='light'?'#edeae0':'#131210',brightness:0},
      {label:'Secondary',hex:cTheme==='light'?'#faf8f2':'#1b1a16',brightness:0},
      {label:'Accent',hex:cTheme==='light'?'#b87030':'#d4924a',brightness:0},
      {label:'Text',hex:cTheme==='light'?'#252018':'#e6e2d6',brightness:0}
    ]
  };
}
function loadPersonalization(){
  try{
    const data=JSON.parse(localStorage.getItem(PERSONALIZATION_KEY)||'null');
    if(data&&Array.isArray(data.colors))return Object.assign(defaultPersonalization(),data);
  }catch{}
  return defaultPersonalization();
}
function normalizeHex(v){
  let s=String(v||'').trim();
  if(!s.startsWith('#'))s='#'+s;
  if(/^#[0-9a-fA-F]{3}$/.test(s))s='#'+s.slice(1).split('').map(c=>c+c).join('');
  return /^#[0-9a-fA-F]{6}$/.test(s)?s.toUpperCase():'#D4924A';
}
function adjustHex(hex,amount){
  const clean=normalizeHex(hex).slice(1);
  const n=[0,2,4].map(i=>parseInt(clean.slice(i,i+2),16));
  const out=n.map(v=>Math.max(0,Math.min(255,Math.round(v+(amount/100)*(amount>=0?255-v:v)))));
  return '#'+out.map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
}
const PERSONALIZATION_THEME_PROPS=['--bg','--sf','--sf2','--sf3','--bd','--bd2','--json-bg','--ac','--ac-bg','--ac-hi','--tx','--json-tx'];
function applyPersonalization(data=loadPersonalization()){
  const root=document.documentElement;
  PERSONALIZATION_THEME_PROPS.forEach(prop=>root.style.removeProperty(prop));
  if(data.font)root.style.setProperty('--font',data.font);
}
function clonePersonalizationDraft(){
  return JSON.parse(JSON.stringify(personalizationDraft||defaultPersonalization()));
}
function pushPersonalHistory(){
  if(!personalizationDraft)return;
  personalUndoStack.push(clonePersonalizationDraft());
  if(personalUndoStack.length>40)personalUndoStack.shift();
  personalRedoStack=[];
  updatePersonalHistoryButtons();
}
function updatePersonalHistoryButtons(){
  const u=$('#personalUndoBtn'),r=$('#personalRedoBtn');
  if(u)u.disabled=!personalUndoStack.length;
  if(r)r.disabled=!personalRedoStack.length;
}
function restorePersonalDraft(next){
  personalizationDraft=JSON.parse(JSON.stringify(next));
  $('#personalFontSelect')&&(($('#personalFontSelect').value=personalizationDraft.font||"'DM Sans',system-ui,sans-serif"));
  renderColorWorkstation();
  previewPersonalization();
  updatePersonalHistoryButtons();
}
function undoPersonalDraft(){
  if(!personalUndoStack.length)return;
  personalRedoStack.push(clonePersonalizationDraft());
  restorePersonalDraft(personalUndoStack.pop());
}
function redoPersonalDraft(){
  if(!personalRedoStack.length)return;
  personalUndoStack.push(clonePersonalizationDraft());
  restorePersonalDraft(personalRedoStack.pop());
}
function renderColorWorkstation(){
  const host=$('#colorWorkstation');if(!host||!personalizationDraft)return;
  const count=Math.max(3,Math.min(4,Number(personalizationDraft.count)||3));
  personalizationDraft.count=count;
  const labels=['Primary','Secondary','Accent','Text'];
  host.innerHTML=labels.slice(0,count).map((label,i)=>{
    const color=personalizationDraft.colors[i]||{label,hex:'#D4924A',brightness:0};
    return `<div class="color-card" data-color-index="${i}">
      <label>${esc(label)}</label>
      <div class="color-row">
        <input type="color" class="personal-color" value="${esc(normalizeHex(color.hex))}">
        <input type="text" class="personal-hex" value="${esc(normalizeHex(color.hex))}" spellcheck="false">
      </div>
      <div class="settings-range-row">
        <input type="range" class="personal-brightness" min="-40" max="40" step="1" value="${Number(color.brightness)||0}">
        <span class="settings-range-value">${Number(color.brightness)||0}</span>
      </div>
    </div>`;
  }).join('');
  $$('.color-card',host).forEach(card=>{
    const i=Number(card.dataset.colorIndex),picker=card.querySelector('.personal-color'),hex=card.querySelector('.personal-hex'),bright=card.querySelector('.personal-brightness'),val=card.querySelector('.settings-range-value');
    const arm=()=>{if(personalChangeArmed)return;pushPersonalHistory();personalChangeArmed=true;};
    const done=()=>{personalChangeArmed=false;};
    const update=()=>{personalizationDraft.colors[i]={label:labels[i],hex:normalizeHex(hex.value),brightness:Number(bright.value)||0};picker.value=normalizeHex(hex.value);val.textContent=bright.value;previewPersonalization();};
    card.addEventListener('focusin',arm);
    card.addEventListener('pointerdown',arm);
    card.addEventListener('change',done);
    card.addEventListener('focusout',done);
    picker.oninput=()=>{hex.value=picker.value;update();};
    hex.oninput=update;
    bright.oninput=update;
  });
}
function previewPersonalization(){
  if(!personalizationDraft)return;
  applyPersonalization(personalizationDraft);
}
function openPersonalizationModal(){
  closeSettingsMenu();
  personalizationOriginalTheme=cTheme;
  personalUndoStack=[];personalRedoStack=[];personalChangeArmed=false;
  personalizationDraft=loadPersonalization();
  personalizationDraft.count=Math.max(3,Math.min(4,Number(personalizationDraft.count)||3));
  $('#personalThemePreset')&&(($('#personalThemePreset').value=cTheme));
  $('#personalFontSelect')&&(($('#personalFontSelect').value=personalizationDraft.font||"'DM Sans',system-ui,sans-serif"));
  renderModSupportControls();
  previewPersonalization();
  $('#personalizationModal')?.classList.add('open');
}
function closePersonalizationModal(save=false){
  if(save&&personalizationDraft){
    localStorage.setItem(PERSONALIZATION_KEY,JSON.stringify(personalizationDraft));
    applyPersonalization(personalizationDraft);
    showMsg('Website look applied.',true);
  }else{
    if(personalizationOriginalTheme)applyTheme(personalizationOriginalTheme);
    applyPersonalization(loadPersonalization());
  }
  personalizationOriginalTheme=null;
  personalizationDraft=null;
  personalUndoStack=[];personalRedoStack=[];personalChangeArmed=false;
  $('#personalizationModal')?.classList.remove('open');
}
function setupHelpInteractions(){
  const tip=$('#hoverTip');if(!tip)return;
  const wait=1000,tolerance=5;
  let active=null,candidate=null,timer=null,last={x:0,y:0};
  const targetFrom=e=>e.target&&e.target.closest?e.target.closest('[data-tip]'):null;
  const clearTimer=()=>{if(timer){clearTimeout(timer);timer=null;}};
  const place=(x,y)=>{
    const pad=12;
    tip.style.left=`${Math.min(x+14,window.innerWidth-tip.offsetWidth-pad)}px`;
    tip.style.top=`${Math.min(y+14,window.innerHeight-tip.offsetHeight-pad)}px`;
  };
  const hide=()=>{
    clearTimer();active=null;candidate=null;tip.style.display='none';
  };
  const schedule=(el,x,y)=>{
    if(!tooltipsEnabled||!el?.dataset?.tip){hide();return;}
    clearTimer();candidate=el;active=null;tip.style.display='none';last={x,y};
    timer=setTimeout(()=>{
      if(!tooltipsEnabled||candidate!==el)return;
      active=el;tip.textContent=el.dataset.tip;tip.style.display='block';place(last.x,last.y);
    },wait);
  };
  document.addEventListener('mousemove',e=>{
    const el=targetFrom(e);
    if(!el){hide();return;}
    const dx=Math.abs(e.clientX-last.x),dy=Math.abs(e.clientY-last.y);
    if(active===el){place(e.clientX,e.clientY);return;}
    if(candidate===el&&dx<=tolerance&&dy<=tolerance)return;
    schedule(el,e.clientX,e.clientY);
  });
  document.addEventListener('mouseover',e=>{
    const el=targetFrom(e);if(el)schedule(el,e.clientX,e.clientY);
  });
  document.addEventListener('mouseout',e=>{if(targetFrom(e))hide();});
  document.addEventListener('focusin',e=>{
    const el=targetFrom(e);if(!el)return;
    const r=el.getBoundingClientRect();schedule(el,r.left,r.bottom);
  });
  document.addEventListener('focusout',e=>{if(targetFrom(e))hide();});
}
function getNs(){return($('#defaultNs')?.value||'questlog').trim();}
function objectiveSupportsAmount(t){return !NO_AMOUNT_OBJECTIVES.has(t||'');}


// ── Autosave / recovery ──────────────────────────────────────────
const AUTOSAVE_KEY='ql.project.autosave.v2';
const PRE_V22_BACKUP_KEY='ql.project.autosave.before-v2.2';
const AUTOSAVE_PREF_KEY='ql.autosave.enabled';
const TOOLTIP_PREF_KEY='ql.tooltips.enabled';
const UI_SOUND_PREF_KEY='ql.uiSounds.enabled';
const UI_SOUND_MUTE_KEY='ql.uiSounds.muted';
const UI_SOUND_VOLUME_KEY='ql.uiSounds.volume';
const UI_TYPING_SOUND_PREF_KEY='ql.uiSounds.typing';
const PERSONALIZATION_KEY='ql.personalization.preview';
const MOD_SUGGESTION_VERSION_KEY='ql.modSuggestions.version';
const MOD_SUGGESTION_ENABLED_KEY='ql.modSuggestions.enabled';
const SIDEBAR_WIDTH_KEY='ql.sidebar.width';
const LIST_SORT_KEY='ql.list.sort';
const TUTORIAL_SEEN_KEY='ql.tutorial.seen.v23';
const ACTIVITY_LIMIT=80;
let autosaveTimer=null;
let suppressAutosave=false;
let autosaveEnabled=localStorage.getItem(AUTOSAVE_PREF_KEY)!=='false';
let tooltipsEnabled=localStorage.getItem(TOOLTIP_PREF_KEY)!=='false';
let uiSoundsEnabled=localStorage.getItem(UI_SOUND_PREF_KEY)==='true';
let uiSoundsMuted=localStorage.getItem(UI_SOUND_MUTE_KEY)==='true';
let uiTypingSoundsEnabled=localStorage.getItem(UI_TYPING_SOUND_PREF_KEY)==='true';
let uiSoundVolume=Math.min(2,Math.max(0,parseFloat(localStorage.getItem(UI_SOUND_VOLUME_KEY)||'0.85')));
let modSuggestionTarget=localStorage.getItem(MOD_SUGGESTION_VERSION_KEY)||window.MOD_ID_PACKS?.defaultTarget||'1.21.1';
let enabledModSuggestions=new Set(JSON.parse(localStorage.getItem(MOD_SUGGESTION_ENABLED_KEY)||'[]'));
let personalizationDraft=null;
let personalizationOriginalTheme=null;
let personalUndoStack=[],personalRedoStack=[],personalChangeArmed=false;
let listSort=['alpha','order','recent'].includes(localStorage.getItem(LIST_SORT_KEY))?localStorage.getItem(LIST_SORT_KEY):'alpha';
let fileMeta={};
let activityLog=[];
let customTemplates=[];
let questSearch='';
let lastEditActivity={key:'',time:0};
const HISTORY_LIMIT=60;
let undoStack=[],redoStack=[],historyRestoring=false;
function autosavePayload(){
  return {
    version:2,
    savedAt:new Date().toISOString(),
    namespace:getNs(),
    mode,
    currentFile,
    quests,
    chapters,
    fileMeta,
    listSort,
    activityLog,
    customTemplates,
    undoStack,
    redoStack,
    rawMode:!!$('#viewRaw')?.checked
  };
}
function cloneProjectState(){
  return {
    namespace:getNs(),
    mode,
    currentFile,
    quests:JSON.parse(JSON.stringify(quests)),
    chapters:JSON.parse(JSON.stringify(chapters)),
    rawMode:!!$('#viewRaw')?.checked
  };
}
function stateSig(s){
  return JSON.stringify({
    namespace:s.namespace,
    mode:s.mode,
    currentFile:s.currentFile,
    quests:s.quests,
    chapters:s.chapters,
    rawMode:s.rawMode
  });
}
function updateHistoryButtons(){
  const u=$('#btnUndo'),r=$('#btnRedo');
  if(u)u.disabled=!undoStack.length;
  if(r)r.disabled=!redoStack.length;
}
function pushHistorySnapshot(){
  if(historyRestoring)return;
  const snap=cloneProjectState();
  const sig=stateSig(snap);
  const last=undoStack[undoStack.length-1];
  if(last&&stateSig(last)===sig)return;
  undoStack.push(snap);
  if(undoStack.length>HISTORY_LIMIT)undoStack.shift();
  redoStack=[];
  updateHistoryButtons();
  scheduleAutosave();
}
function syncVisibleStateForHistory(){
  if(historyRestoring)return;
  if(rawMode)return;
  if(mode==='quest')syncQ();
  else if($('#cf_name'))$('#cf_name').oninput?.();
}
function restoreProjectState(s){
  historyRestoring=true;
  suppressAutosave=true;
  quests=JSON.parse(JSON.stringify(s.quests||{}));
  chapters=JSON.parse(JSON.stringify(s.chapters||{}));
  mode=s.mode==='chapter'?'chapter':'quest';
  currentFile=s.currentFile||null;
  if(s.namespace&&$('#defaultNs'))$('#defaultNs').value=s.namespace;
  if($('#viewRaw'))$('#viewRaw').checked=!!s.rawMode;
  rawMode=!!s.rawMode;
  suppressAutosave=false;
  renderFileList();
  renderMain();
  renderValidation();
  saveAutosaveNow('history');
  historyRestoring=false;
  updateHistoryButtons();
}
function undoProject(){
  if(!undoStack.length)return;
  syncVisibleStateForHistory();
  redoStack.push(cloneProjectState());
  restoreProjectState(undoStack.pop());
  recordActivity('Undo','project','','Restored previous change');
  showMsg('Undid last change.',true);
}
function redoProject(){
  if(!redoStack.length)return;
  syncVisibleStateForHistory();
  undoStack.push(cloneProjectState());
  restoreProjectState(redoStack.pop());
  recordActivity('Redo','project','','Restored next change');
  showMsg('Redid change.',true);
}
function autosaveHasWork(data){
  return !!(data && ((data.quests&&Object.keys(data.quests).length)||(data.chapters&&Object.keys(data.chapters).length)));
}
function updateAutosaveStatus(msg){
  const saveBtn=$('#btnManualSaveHead');
  if(saveBtn)saveBtn.hidden=autosaveEnabled;
}
function saveAutosaveNow(reason='saved',force=false){
  if(suppressAutosave)return;
  if(!autosaveEnabled&&!force){updateAutosaveStatus('Manual save mode');return;}
  try{
    localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(autosavePayload()));
    updateAutosaveStatus(force?'Saved manually':'Auto save mode');
  }catch(err){
    updateAutosaveStatus(force?'Manual save failed':'Autosave failed');
    console.warn('[autosave]',err);
  }
}
function manualSaveNow(){
  if(mode==='quest')syncQ();else if($('#cf_name'))$('#cf_name').oninput?.();
  saveAutosaveNow('manual',true);
  recordActivity('Manual save','project','');
  showMsg('Project saved in this browser.',true);
}
const scheduleAutosave=debounce(()=>saveAutosaveNow('change'),650);
function setAutosaveEnabled(enabled){
  autosaveEnabled=!!enabled;
  localStorage.setItem(AUTOSAVE_PREF_KEY,autosaveEnabled?'true':'false');
  const box=$('#autosaveToggle');if(box)box.checked=autosaveEnabled;
  if(autosaveEnabled){saveAutosaveNow('enabled');recordActivity('Autosave enabled','project','');showMsg('Autosave enabled.',true);}
  else{updateAutosaveStatus('Manual save mode');recordActivity('Autosave disabled','project','');showMsg('Autosave disabled.',true);}
}
function setTooltipsEnabled(enabled){
  tooltipsEnabled=!!enabled;
  localStorage.setItem(TOOLTIP_PREF_KEY,tooltipsEnabled?'true':'false');
  const box=$('#tooltipsToggle');if(box)box.checked=tooltipsEnabled;
  const tip=$('#hoverTip');if(tip)tip.style.display='none';
  showMsg(tooltipsEnabled?'Tooltips enabled.':'Tooltips disabled.',true);
}
function preservePreV22Autosave(raw){
  if(!raw)return;
  try{
    if(!localStorage.getItem(PRE_V22_BACKUP_KEY)){
      localStorage.setItem(PRE_V22_BACKUP_KEY,raw);
    }
  }catch(err){console.warn('[autosave backup]',err);}
}
function loadAutosave(){
  try{
    const raw=localStorage.getItem(AUTOSAVE_KEY);if(!raw)return false;
    preservePreV22Autosave(raw);
    const data=JSON.parse(raw);if(!autosaveHasWork(data))return false;
    quests=data.quests&&typeof data.quests==='object'?data.quests:{};
    chapters=data.chapters&&typeof data.chapters==='object'?data.chapters:{};
    fileMeta=data.fileMeta&&typeof data.fileMeta==='object'?data.fileMeta:{};
    activityLog=Array.isArray(data.activityLog)?data.activityLog.slice(0,ACTIVITY_LIMIT):[];
    customTemplates=Array.isArray(data.customTemplates)?data.customTemplates:[];
    listSort=['alpha','order','recent'].includes(data.listSort)?data.listSort:listSort;
    localStorage.setItem(LIST_SORT_KEY,listSort);
    undoStack=Array.isArray(data.undoStack)?data.undoStack.slice(-HISTORY_LIMIT):[];
    redoStack=Array.isArray(data.redoStack)?data.redoStack.slice(-HISTORY_LIMIT):[];
    Object.values(quests).forEach(q=>{fixQA(q);nqbd(q);});
    ensureFileMeta();
    if(data.namespace&&$('#defaultNs'))$('#defaultNs').value=data.namespace;
    if(data.mode==='chapter'||data.mode==='quest')mode=data.mode;
    currentFile=data.currentFile||null;
    if(currentFile){
      if(mode==='quest'&&!quests[currentFile])currentFile=null;
      if(mode==='chapter'&&!chapters[currentFile])currentFile=null;
    }
    if(!currentFile){
      const q=Object.keys(quests).sort()[0],c=Object.keys(chapters).sort()[0];
      if(q){mode='quest';currentFile=q;}else if(c){mode='chapter';currentFile=c;}
    }
    const saved=data.savedAt?new Date(data.savedAt):null;
    updateAutosaveStatus(saved&&!Number.isNaN(saved.getTime())?'Restored autosave':'Restored autosave');
    return true;
  }catch(err){console.warn('[autosave load]',err);return false;}
}
function clearAutosaveStorage(){try{localStorage.removeItem(AUTOSAVE_KEY);}catch{}}
function openResetModal(){
  const first=$('#resetModal'),second=$('#resetModalDanger');
  if(!first||!second)return;
  first.classList.add('open');
  second.classList.remove('open');
}
function closeResetModal(){
  $('#resetModal')?.classList.remove('open');
  $('#resetModalDanger')?.classList.remove('open');
}
function performFullReset(){
  suppressAutosave=true;
  clearAutosaveStorage();
  quests={};chapters={};fileMeta={};activityLog=[];customTemplates=[];currentFile=null;mode='quest';rawMode=false;jsonFocused=false;
  if($('#viewRaw'))$('#viewRaw').checked=false;
  suppressAutosave=false;
  renderFileList();
  $('#btnNewQuest')?.click();
  saveAutosaveNow('reset');
  renderValidation();
  closeResetModal();
  showMsg('Progress reset. Started a fresh quest file.',true);
}
let confirmAction=null;
function openConfirmModal({title='Confirm action?',copy='This cannot be undone unless you use undo or restore a backup.',button='Delete',onConfirm=null}={}){
  confirmAction=typeof onConfirm==='function'?onConfirm:null;
  const titleEl=$('#confirmTitle'),copyEl=$('#confirmCopy'),btn=$('#confirmActionBtn');
  if(titleEl)titleEl.textContent=title;
  if(copyEl)copyEl.textContent=copy;
  if(btn)btn.textContent=button;
  $('#confirmModal')?.classList.add('open');
}
function closeConfirmModal(){
  $('#confirmModal')?.classList.remove('open');
  confirmAction=null;
}
function runConfirmAction(){
  const fn=confirmAction;
  closeConfirmModal();
  fn?.();
}

// ── Panel order ───────────────────────────────────────────────────
function normOrder(o){const seen=new Set(),out=[];(Array.isArray(o)?o:[]).forEach(k=>{if(PANEL_DEF.includes(k)&&!seen.has(k)){seen.add(k);out.push(k);}});PANEL_DEF.forEach(k=>{if(!seen.has(k))out.push(k);});return out;}
function loadOrder(){try{const r=localStorage.getItem('ql.panelOrder');return r?normOrder(JSON.parse(r)):[...PANEL_DEF];}catch{return[...PANEL_DEF];}}
function saveOrder(){try{localStorage.setItem('ql.panelOrder',JSON.stringify(normOrder(panelOrder)));}catch{}}

// ── Helpers ───────────────────────────────────────────────────────
const defQ=()=>({title:'New Quest',requirements:[],objectives:[],rewards:[]});
const defC=()=>({name:'New Chapter',icon:{item:'minecraft:knowledge_book'}});
function getCD(){if(!currentFile)return null;return mode==='quest'?quests[currentFile]:chapters[currentFile];}
function setCD(o){if(!currentFile)return;if(mode==='quest')quests[currentFile]=o;else chapters[currentFile]=o;}
function fixQA(q){if(!Array.isArray(q.requirements))q.requirements=[];if(!Array.isArray(q.objectives))q.objectives=[];if(!Array.isArray(q.rewards))q.rewards=[];fixKnownLegacyIds(q);}
function fixKnownLegacyIds(q){
  if(!q||typeof q!=='object')return;
  if(q.completed_sound==='minecraft:block.stonecutter.take_result')q.completed_sound='minecraft:ui.stonecutter.take_result';
  if(q.triggered_sound==='minecraft:block.stonecutter.take_result')q.triggered_sound='minecraft:ui.stonecutter.take_result';
  (q.rewards||[]).forEach(r=>{if(r&&r.claim_sound==='minecraft:block.stonecutter.take_result')r.claim_sound='minecraft:ui.stonecutter.take_result';});
}
function defIncMain(ch){return ch==='questlog:main'||ch==='main';}
function metaKey(kind,name){return `${kind}:${name}`;}
function ensureFileMeta(){
  const now=Date.now();
  Object.keys(chapters).forEach(name=>{const k=metaKey('chapter',name);if(!fileMeta[k])fileMeta[k]={updatedAt:now};});
  Object.keys(quests).forEach(name=>{const k=metaKey('quest',name);if(!fileMeta[k])fileMeta[k]={updatedAt:now};});
  Object.keys(fileMeta).forEach(k=>{
    const [kind,...rest]=k.split(':');
    const name=rest.join(':');
    if((kind==='quest'&&!quests[name])||(kind==='chapter'&&!chapters[name]))delete fileMeta[k];
  });
}
function touchFile(kind,name){
  if(!name)return;
  fileMeta[metaKey(kind,name)]={updatedAt:Date.now()};
}
function recordActivity(action,kind,file,detail=''){
  if(historyRestoring)return;
  activityLog.unshift({time:Date.now(),action,kind,file,detail});
  activityLog=activityLog.slice(0,ACTIVITY_LIMIT);
  scheduleAutosave();
}
function recordEditActivity(){
  if(historyRestoring||!currentFile)return;
  const kind=mode==='chapter'?'chapter':'quest';
  const key=`${kind}:${currentFile}`;
  const now=Date.now();
  if(lastEditActivity.key===key&&now-lastEditActivity.time<15000)return;
  lastEditActivity={key,time:now};
  recordActivity('Edited',kind,currentFile);
}
function moveFileMeta(kind,oldName,newName){
  const oldKey=metaKey(kind,oldName),newKey=metaKey(kind,newName);
  fileMeta[newKey]=fileMeta[oldKey]||{updatedAt:Date.now()};
  fileMeta[newKey].updatedAt=Date.now();
  delete fileMeta[oldKey];
}
function fileUpdatedAt(kind,name){return Number(fileMeta[metaKey(kind,name)]?.updatedAt)||0;}
function setListSort(value){
  listSort=['alpha','order','recent'].includes(value)?value:'alpha';
  localStorage.setItem(LIST_SORT_KEY,listSort);
  const sel=$('#questListSort');if(sel)sel.value=listSort;
  renderFileList();
}
function sortFiles(names,kind){
  const fallback=(a,b)=>String(a).localeCompare(String(b));
  if(listSort==='recent')return [...names].sort((a,b)=>fileUpdatedAt(kind,b)-fileUpdatedAt(kind,a)||fallback(a,b));
  if(listSort==='order'){
    const data=kind==='quest'?quests:chapters;
    const field=kind==='quest'?'sort_order':'order';
    return [...names].sort((a,b)=>(Number(data[a]?.[field])||0)-(Number(data[b]?.[field])||0)||fallback(a,b));
  }
  return [...names].sort(fallback);
}
function fileSearchText(name,kind){
  const base=String(name||'').replace(/\.json$/i,'');
  const data=kind==='quest'?quests[name]:chapters[name];
  const label=kind==='quest'?data?.title:data?.name;
  return `${base} ${name} ${label||''}`.toLowerCase();
}
function matchesSearch(name,kind){
  const q=questSearch.trim().toLowerCase();
  return !q||fileSearchText(name,kind).includes(q);
}
function setQuestSearch(value){
  questSearch=String(value||'');
  renderFileList();
}

// ── Binding helpers ───────────────────────────────────────────────
function questBoundCh(qn){
  const q=quests[qn];if(!q)return null;const ch=q.chapter;if(!ch)return null;
  const ns=getNs();
  for(const cf of Object.keys(chapters)){const base=cf.replace(/\.json$/i,'');if(ch===`${ns}:${base}`||ch===`questlog:${base}`)return cf;}
  return null;
}
function bindQ(qn,cn){
  const q=quests[qn];if(!q)return;
  pushHistorySnapshot();
  touchFile('quest',qn);
  q.chapter=`${getNs()}:${cn.replace(/\.json$/i,'')}`;
  renderFileList();if(currentFile===qn&&mode==='quest'){renderMain();}
}
function unbindQ(qn){
  const q=quests[qn];if(!q)return;
  pushHistorySnapshot();
  touchFile('quest',qn);
  delete q.chapter;
  renderFileList();if(currentFile===qn&&mode==='quest'){renderMain();}
}

// ── Rename ────────────────────────────────────────────────────────
function bindChapterDropTarget(el,cf){
  el.ondragover=e=>{
    if(!draggedQuest)return;
    e.preventDefault();
    if(e.dataTransfer)e.dataTransfer.dropEffect='move';
    el.classList.add(el.classList.contains('fi')?'drop-target':'drop-zone-active');
  };
  el.ondragleave=()=>el.classList.remove('drop-target','drop-zone-active');
  el.ondrop=e=>{
    if(!draggedQuest)return;
    e.preventDefault();
    el.classList.remove('drop-target','drop-zone-active');
    if(questBoundCh(draggedQuest)!==cf)bindQ(draggedQuest,cf);
    draggedQuest=null;
  };
}

function itemKindLabel(kind){return kind==='chapter'?'chapter':'quest';}
function setRenameModalError(t){
  const el=$('#renameError');if(!el)return;
  el.textContent=t||'';
  el.classList.toggle('open',!!t);
}
function closeRenameModal(){
  $('#renameModal')?.classList.remove('open');
  setRenameModalError('');
}

function startRename(row,oldName,kind){
  const nameEl=row.querySelector('.fi-name');if(!nameEl||nameEl.querySelector('input'))return;
  const base=oldName.replace(/\.json$/i,'');
  const inp=document.createElement('input');inp.className='fi-name-input';inp.value=base;
  nameEl.innerHTML='';nameEl.appendChild(inp);inp.focus();inp.select();
  let done=false;
  const commit=()=>{
    if(done)return;
    let nv=(inp.value||'').trim().replace(/\.json$/i,'');
    if(!nv){
      showMsg(`Name your ${itemKindLabel(kind)} something.`,false);
      inp.focus();
      return;
    }
    if(nv===base){done=true;renderFileList();return;}
    const nn=nv+'.json';
    if(kind==='quest'){if(quests[nn]&&nn!==oldName){showMsg('Name taken.',false);return;}quests[nn]=quests[oldName];delete quests[oldName];moveFileMeta('quest',oldName,nn);if(currentFile===oldName)currentFile=nn;}
    else{if(chapters[nn]&&nn!==oldName){showMsg('Name taken.',false);return;}chapters[nn]=chapters[oldName];delete chapters[oldName];moveFileMeta('chapter',oldName,nn);if(currentFile===oldName)currentFile=nn;}
    done=true;
    renderFileList();if(currentFile===nn)renderMain();
  };
  inp.onblur=commit;inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){done=true;renderFileList();}};
  inp.onclick=e=>e.stopPropagation();
  inp.oninput=e=>e.stopPropagation();
}

function bindFileNameRename(row,name,kind){
  const nameEl=row.querySelector('.fi-name');
  if(!nameEl)return;
  let clickTimer=null;

  nameEl.onclick=e=>{
    clearTimeout(clickTimer);
    if(e.detail>1)return;
    clickTimer=setTimeout(()=>{
      if(!isDragging&&!nameEl.querySelector('input'))selectFile(name,kind);
    },180);
  };

  nameEl.ondblclick=e=>{
    clearTimeout(clickTimer);
    e.preventDefault();
    e.stopPropagation();
    startRename(row,name,kind);
  };
}

// ── File list ─────────────────────────────────────────────────────
function renderFileList(){
  if(isDragging)return;
  const list=$('#fileList');list.innerHTML='';
  ensureFileMeta();
  const sortSel=$('#questListSort');if(sortSel)sortSel.value=listSort;
  const searchEl=$('#questSearch');if(searchEl&&searchEl.value!==questSearch)searchEl.value=questSearch;
  const qNames=sortFiles(Object.keys(quests),'quest');
  const cNames=sortFiles(Object.keys(chapters),'chapter');
  const boundTo={};const unbound=[];
  qNames.forEach(qn=>{const cf=questBoundCh(qn);if(cf){if(!boundTo[cf])boundTo[cf]=[];boundTo[cf].push(qn);}else unbound.push(qn);});
  const visibleUnbound=unbound.filter(qn=>matchesSearch(qn,'quest'));

  // Chapters
  const cl=document.createElement('div');cl.className='sb-group';cl.textContent='Chapters';list.appendChild(cl);
  let visibleChapters=0;
  if(!cNames.length){const e=document.createElement('div');e.className='sb-empty';e.textContent='No chapters';list.appendChild(e);}
  cNames.forEach(cf=>{
    const chapterMatches=matchesSearch(cf,'chapter');
    const visibleKids=(boundTo[cf]||[]).filter(qn=>chapterMatches||matchesSearch(qn,'quest'));
    if(questSearch.trim()&&!chapterMatches&&!visibleKids.length)return;
    visibleChapters++;
    const wrap=document.createElement('div');
    const cRow=makeFiRow(cf,'C',cf===currentFile&&mode==='chapter');
    bindFileNameRename(cRow,cf,'chapter');
    cRow.oncontextmenu=e=>showCtxMenu(e,cf,'chapter');
    cRow.querySelector('.fi-tag').onclick=()=>selectFile(cf,'chapter');
    bindChapterDropTarget(cRow,cf);
    wrap.appendChild(cRow);
    const kids=document.createElement('div');kids.className='fi-children chapter-drop-zone';
    bindChapterDropTarget(kids,cf);
    visibleKids.forEach(qn=>{
      const qRow=makeFiRow(qn,'Q',qn===currentFile&&mode==='quest',true);
      qRow.draggable=true;
      bindFileNameRename(qRow,qn,'quest');
      qRow.oncontextmenu=e=>showCtxMenu(e,qn,'quest');
      qRow.querySelector('.fi-tag').onclick=()=>selectFile(qn,'quest');
      qRow.ondragstart=e=>{isDragging=true;draggedQuest=qn;e.dataTransfer.effectAllowed='move';};
      qRow.ondragend=()=>{isDragging=false;draggedQuest=null;$$('.drop-target').forEach(el=>el.classList.remove('drop-target'));$$('.drop-zone-active').forEach(el=>el.classList.remove('drop-zone-active'));renderFileList();};
      kids.appendChild(qRow);
    });
    wrap.appendChild(kids);list.appendChild(wrap);
  });
  if(cNames.length&&!visibleChapters){const e=document.createElement('div');e.className='sb-empty';e.textContent='No matching chapters';list.appendChild(e);}

  // Quests
  const ql=document.createElement('div');ql.className='sb-group';ql.style.marginTop='10px';ql.textContent='Quests';list.appendChild(ql);
  const uz=document.createElement('div');
  uz.ondragover=e=>{e.preventDefault();if(draggedQuest)uz.classList.add('drop-zone-active');};
  uz.ondragleave=()=>uz.classList.remove('drop-zone-active');
  uz.ondrop=e=>{e.preventDefault();uz.classList.remove('drop-zone-active');if(draggedQuest){unbindQ(draggedQuest);draggedQuest=null;}};
  if(!visibleUnbound.length){const e=document.createElement('div');e.className='sb-empty';e.textContent=questSearch.trim()?'No matching unbound quests':qNames.length?'All bound':'No quests';uz.appendChild(e);}
  visibleUnbound.forEach(qn=>{
    const qRow=makeFiRow(qn,'Q',qn===currentFile&&mode==='quest');
    qRow.draggable=true;
    bindFileNameRename(qRow,qn,'quest');
    qRow.oncontextmenu=e=>showCtxMenu(e,qn,'quest');
    qRow.querySelector('.fi-tag').onclick=()=>selectFile(qn,'quest');
    qRow.ondragstart=e=>{isDragging=true;draggedQuest=qn;e.dataTransfer.effectAllowed='move';};
    qRow.ondragend=()=>{isDragging=false;draggedQuest=null;$$('.drop-target').forEach(el=>el.classList.remove('drop-target'));$$('.drop-zone-active').forEach(el=>el.classList.remove('drop-zone-active'));renderFileList();};
    uz.appendChild(qRow);
  });
  list.appendChild(uz);
}

function makeFiRow(name,tag,active,hasUnlink){
  const row=document.createElement('div');
  row.className='fi'+(active?' active':'');
  row.dataset.fileName=name;
  row.dataset.kind=tag==='C'?'chapter':'quest';
  const dispName=name.replace(/\.json$/i,'');
  row.innerHTML=`<span class="fi-tag">${tag}</span><span class="fi-name" title="Double-click to rename">${esc(dispName)}</span>`;
  return row;
}

function selectFile(name,kind,panelKey){
  currentFile=name;
  mode=kind;
  if(kind==='quest'&&panelKey)setTab(panelKey);
  renderFileList();
  renderMain();
  recordActivity('Opened',kind,name);
}

// ── Normalize helpers ─────────────────────────────────────────────
function nvb(b){if(!b||typeof b!=='object')return;if(b.x1!==undefined&&b.minX===undefined)b.minX=b.x1;if(b.y1!==undefined&&b.minY===undefined)b.minY=b.y1;if(b.z1!==undefined&&b.minZ===undefined)b.minZ=b.z1;if(b.x2!==undefined&&b.maxX===undefined)b.maxX=b.x2;if(b.y2!==undefined&&b.maxY===undefined)b.maxY=b.y2;if(b.z2!==undefined&&b.maxZ===undefined)b.maxZ=b.z2;delete b.x1;delete b.y1;delete b.z1;delete b.x2;delete b.y2;delete b.z2;}
function nob(o){if(!o||typeof o!=='object')return;if(o.type==='questlog:visit_position'&&o.bounds)nvb(o.bounds);if(o.type==='questlog:or'&&Array.isArray(o.objectives))o.objectives.forEach(nob);if(o.type==='questlog:not'&&o.objective)nob(o.objective);}
function not2(o){if(!o||typeof o!=='object')return;if(o.total!==undefined&&o.required_amount===undefined){o.required_amount=o.total;delete o.total;}if(o.type==='questlog:or'&&Array.isArray(o.objectives))o.objectives.forEach(not2);if(o.type==='questlog:not'&&o.objective)not2(o.objective);}
function nqbd(q){if(!q)return;(q.requirements||[]).forEach(o=>{nob(o);not2(o);});(q.objectives||[]).forEach(o=>{nob(o);not2(o);});(q.failures||[]).forEach(o=>{nob(o);not2(o);});}
function finR(r){if(!r)return;if(r.level===undefined&&r.levels!==undefined)r.level=!!r.levels;delete r.levels;if(r.translatable!==true)delete r.translatable;if(!r.auto_claim)delete r.auto_claim;if(!r.name)delete r.name;if(!r.claim_sound)delete r.claim_sound;if(r.icon===undefined||r.icon===null||r.icon==='')delete r.icon;const t=r.type;if(t==='questlog:item'&&(r.count===1||r.count===undefined))delete r.count;if(t==='questlog:command'&&(r.permission_level===2||r.permission_level===undefined))delete r.permission_level;if(t==='questlog:experience'&&!r.level)delete r.level;}
function finO(o){if(!o||typeof o!=='object')return;if(o.translatable!==true)delete o.translatable;if(!o.name)delete o.name;if(o.icon===undefined||o.icon===null||o.icon==='')delete o.icon;const t=o.type||'';if(!objectiveSupportsAmount(t))delete o.required_amount;else if(o.required_amount===1||o.required_amount===undefined)delete o.required_amount;if(t==='questlog:stat'&&o.retroactive!==false)delete o.retroactive;if(t==='questlog:visit_position'&&o.bounds&&typeof o.bounds==='object'){const b=o.bounds;nvb(b);if(!Object.keys(b).length)delete o.bounds;}if(t==='questlog:or'&&Array.isArray(o.objectives))o.objectives.forEach(finO);if(t==='questlog:not'&&o.objective)finO(o.objective);}

function trimQ(q){
  if(q.description===''||q.description===undefined)delete q.description;if(q.description_completed===undefined||q.description_completed==='')delete q.description_completed;if(q.description_failed===undefined||q.description_failed==='')delete q.description_failed;
  if(q.sort_order===0||q.sort_order===undefined)delete q.sort_order;const cv=q.chapter||'questlog:main';if(cv==='questlog:main')delete q.chapter;
  if(q.translatable!==true)delete q.translatable;const id=defIncMain(cv);if(q.include_in_main===id||q.include_in_main===undefined)delete q.include_in_main;if(q.hidden!==true)delete q.hidden;if(q.icon===undefined||q.icon===null||q.icon==='')delete q.icon;
  if(!q.completed_sound)delete q.completed_sound;if(!q.triggered_sound)delete q.triggered_sound;if(q.toast_on_unlock!==false)delete q.toast_on_unlock;if(q.toast_on_complete!==false)delete q.toast_on_complete;if(q.show_popup_on_unlock!==true)delete q.show_popup_on_unlock;
  if(!q.background_texture)delete q.background_texture;if(!q.right_panel_texture)delete q.right_panel_texture;if(!q.peripheral_texture)delete q.peripheral_texture;if(!q.overlay)delete q.overlay;if(q.overlay_width==null)delete q.overlay_width;if(q.overlay_height==null)delete q.overlay_height;if(!q.overlay_x_offset)delete q.overlay_x_offset;if(!q.overlay_y_offset)delete q.overlay_y_offset;
  if(q.left_panel_width===275||q.left_panel_width==null)delete q.left_panel_width;if(q.right_panel_width===170||q.right_panel_width==null)delete q.right_panel_width;if(q.panel_height===166||q.panel_height==null)delete q.panel_height;if(!q.left_panel_x_offset)delete q.left_panel_x_offset;if(!q.left_panel_y_offset)delete q.left_panel_y_offset;if(!q.right_panel_x_offset)delete q.right_panel_x_offset;if(!q.right_panel_y_offset)delete q.right_panel_y_offset;
  if(!q.back_button_text||q.back_button_text==='gui.back')delete q.back_button_text;if(!q.collect_button_text||q.collect_button_text==='questlog.reward.collect')delete q.collect_button_text;if(!q.uncollected_text||q.uncollected_text==='questlog.reward.uncollected')delete q.uncollected_text;if(!q.collected_text||q.collected_text==='questlog.reward.collected')delete q.collected_text;
  if(!q.text_color||q.text_color==='#4C381B')delete q.text_color;if(!q.completed_text_color||q.completed_text_color==='#529E52')delete q.completed_text_color;if(!q.hovered_text_color||q.hovered_text_color==='#FFFFFF')delete q.hovered_text_color;if(!q.title_color||q.title_color==='#4C381B')delete q.title_color;if(!q.progress_text_color||q.progress_text_color==='#9E7852')delete q.progress_text_color;
  if(!q.badge)delete q.badge;if(!q.failures||!q.failures.length)delete q.failures;if(!q.requirements||!q.requirements.length)delete q.requirements;if(!q.objectives||!q.objectives.length)delete q.objectives;if(!q.rewards||!q.rewards.length)delete q.rewards;
  (q.requirements||[]).forEach(finO);(q.objectives||[]).forEach(finO);(q.failures||[]).forEach(finO);(q.rewards||[]).forEach(finR);
}

function buildQOut(d){const out=JSON.parse(JSON.stringify(d||{}));fixQA(out);nqbd(out);trimQ(out);const ordered={};const ap=new Set();normOrder(panelOrder).forEach(pk=>{(PANEL_FIELDS[pk]||[]).forEach(f=>{if(Object.prototype.hasOwnProperty.call(out,f)){ordered[f]=out[f];ap.add(f);}});});Object.keys(out).forEach(f=>{if(!ap.has(f))ordered[f]=out[f];});return ordered;}
function trimCh(c){if(!c)return;if(c.translatable!==true)delete c.translatable;if(c.order===0||c.order===undefined)delete c.order;if(c.default_chapter!==true)delete c.default_chapter;if(c.hidden!==true)delete c.hidden;if(c.icon===undefined||c.icon===null||c.icon==='')delete c.icon;}

// ── Quest templates ───────────────────────────────────────────────
function qObj(type, fields){return Object.assign({type},fields||{});}
function qReward(type, fields){return Object.assign({type},fields||{});}
function tpl({cat='Progression',complexity='Simple',tags=[],file,title,icon,description,requirements=[],objectives=[],rewards=[],completed_sound='minecraft:ui.toast.challenge_complete',triggered_sound='minecraft:block.note_block.pling'}){
  return {cat,complexity,tags,file,title,icon,description,requirements,objectives,rewards,completed_sound,triggered_sound};
}
const QUEST_TEMPLATES=[
  tpl({cat:'Progression',complexity:'Simple',tags:['questlog:block_mine','questlog:item_craft'],file:'first_camp.json',title:'First Camp',icon:{item:'minecraft:campfire'},description:'Punch one tree, make the first table, and light a small camp before the dark starts asking questions.\n\n§8§oNothing about this place knows your name yet. Good. Start quiet.',objectives:[qObj('questlog:block_mine',{name:'Break a Log',block:'minecraft:oak_log',required_amount:1}),qObj('questlog:item_craft',{name:'Craft a Campfire',item:'minecraft:campfire',required_amount:1})],rewards:[qReward('questlog:item',{name:'Trail Snack',item:'minecraft:apple',count:3,claim_sound:'minecraft:entity.item.pickup'})],triggered_sound:'minecraft:block.wood.break',completed_sound:'minecraft:block.campfire.crackle'}),
  tpl({cat:'Progression',complexity:'Simple',tags:['questlog:item_obtain','questlog:item_craft'],file:'stone_and_sparks.json',title:'Stone and Sparks',icon:{item:'minecraft:furnace'},description:'Cobblestone is ugly until it starts solving problems. Gather enough, build a furnace, and give the cave a reason to warm up.\n\n§8§oThe first smoke trail usually means someone plans to stay.',requirements:[qObj('questlog:block_mine',{block:'minecraft:oak_log',required_amount:1})],objectives:[qObj('questlog:item_obtain',{name:'Gather Cobblestone',item:'minecraft:cobblestone',required_amount:16}),qObj('questlog:item_craft',{name:'Craft a Furnace',item:'minecraft:furnace',required_amount:1})],rewards:[qReward('questlog:experience',{name:'Warm Start',experience:35,claim_sound:'minecraft:entity.experience_orb.pickup'})],triggered_sound:'minecraft:block.stone.break',completed_sound:'minecraft:block.furnace.fire_crackle'}),
  tpl({cat:'Progression',complexity:'Intermediate',tags:['questlog:item_obtain','questlog:item_equip'],file:'iron_backbone.json',title:'Iron Backbone',icon:{item:'minecraft:iron_chestplate'},description:'The ground has teeth, so wear better bones. Smelt enough iron for real armor and put the chestplate on before the night gets clever.\n\n§8§oA shield is confidence with a handle.',requirements:[qObj('questlog:item_craft',{item:'minecraft:furnace'})],objectives:[qObj('questlog:item_obtain',{name:'Collect Iron Ingots',item:'minecraft:iron_ingot',required_amount:24}),qObj('questlog:item_equip',{name:'Equip an Iron Chestplate',item:'minecraft:iron_chestplate',slot:'chest',required_amount:1})],rewards:[qReward('questlog:item',{name:'Shield Insurance',item:'minecraft:shield',count:1,claim_sound:'minecraft:item.shield.block'})],triggered_sound:'minecraft:item.armor.equip_iron',completed_sound:'minecraft:ui.toast.challenge_complete'}),
  tpl({cat:'Progression',complexity:'Advanced',tags:['questlog:item_obtain','questlog:enchant'],file:'diamond_terms.json',title:'Diamond Terms',icon:{item:'minecraft:diamond_pickaxe'},description:'There is a blue glint under the stone, and it never shows up by accident. Find diamonds, make the pickaxe worth keeping, and let the caves know you came prepared.\n\n§8§oGood tools remember who made them.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:iron_pickaxe'})],objectives:[qObj('questlog:item_obtain',{name:'Find Diamonds',item:'minecraft:diamond',required_amount:5}),qObj('questlog:enchant',{name:'Enchant a Diamond Pickaxe',item:'minecraft:diamond_pickaxe',enchantment:'minecraft:efficiency',level:3,required_amount:1})],rewards:[qReward('questlog:item',{name:'Repair Fund',item:'minecraft:experience_bottle',count:16,claim_sound:'minecraft:entity.experience_bottle.throw'})],triggered_sound:'minecraft:block.amethyst_block.chime',completed_sound:'minecraft:entity.player.levelup'}),
  tpl({cat:'Progression',complexity:'Advanced',tags:['questlog:item_obtain','questlog:visit_biome'],file:'netherite_weather.json',title:'Netherite Weather',icon:{item:'minecraft:netherite_ingot'},description:'Ancient debris does not sit near the lava because it is friendly. Bring it home, fold it into netherite, and turn one bad trip into permanent leverage.\n\n§8§oThe Nether charges interest in fire.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:diamond_pickaxe'}),qObj('questlog:visit_biome',{biome:'minecraft:nether_wastes'})],objectives:[qObj('questlog:item_obtain',{name:'Recover Ancient Debris',item:'minecraft:ancient_debris',required_amount:4}),qObj('questlog:item_obtain',{name:'Forge a Netherite Ingot',item:'minecraft:netherite_ingot',required_amount:1})],rewards:[qReward('questlog:experience',{name:'Heat Treated',experience:300,claim_sound:'minecraft:entity.experience_orb.pickup'})],triggered_sound:'minecraft:block.portal.travel',completed_sound:'minecraft:item.armor.equip_netherite'}),
  tpl({cat:'Combat',complexity:'Simple',tags:['questlog:entity_kill','questlog:item_obtain'],file:'night_shift.json',title:'Night Shift',icon:{item:'minecraft:iron_sword'},description:'When the sun drops, the world starts testing the fences. Clear out the dead, gather what they leave behind, and make the dark feel a little less crowded.\n\n§8§oSome nights need proof.',objectives:[qObj('questlog:entity_kill',{name:'Defeat Zombies',entity:'minecraft:zombie',required_amount:8}),qObj('questlog:item_obtain',{name:'Collect Rotten Flesh',item:'minecraft:rotten_flesh',required_amount:4})],rewards:[qReward('questlog:item',{name:'More Light, Less Screaming',item:'minecraft:torch',count:32,claim_sound:'minecraft:block.lantern.place'})],triggered_sound:'minecraft:entity.zombie.ambient',completed_sound:'minecraft:entity.player.levelup'}),
  tpl({cat:'Combat',complexity:'Intermediate',tags:['questlog:entity_kill','questlog:item_drop'],file:'bone_debt.json',title:'Bone Debt',icon:{item:'minecraft:bow'},description:'The skeletons have been sending arrows like invoices. Break the line, take the bones, and leave one behind so the others understand the terms.\n\n§8§oFertilizer has a strange origin story.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:shield'})],objectives:[qObj('questlog:entity_kill',{name:'Defeat Skeletons',entity:'minecraft:skeleton',required_amount:8}),qObj('questlog:item_drop',{name:'Drop a Bone Offering',item:'minecraft:bone',required_amount:1})],rewards:[qReward('questlog:item',{name:'Returned Fire',item:'minecraft:arrow',count:32,claim_sound:'minecraft:entity.arrow.shoot'})],triggered_sound:'minecraft:entity.skeleton.ambient',completed_sound:'minecraft:event.raid.horn'}),
  tpl({cat:'Combat',complexity:'Advanced',tags:['questlog:entity_death','questlog:not'],file:'hardcore_lesson.json',title:'Not Today',icon:{item:'minecraft:totem_of_undying'},description:'Bring something useful back without letting the death screen have the last word. Simple on paper, louder in the cave.\n\n§8§oThe best escape is the one nobody gets to witness.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:iron_chestplate'})],objectives:[qObj('questlog:not',{objective:qObj('questlog:entity_death',{entity:'minecraft:player',required_amount:1})}),qObj('questlog:item_obtain',{name:'Bring Home a Golden Apple',item:'minecraft:golden_apple',required_amount:1})],rewards:[qReward('questlog:item',{name:'Emergency Button',item:'minecraft:totem_of_undying',count:1,claim_sound:'minecraft:item.totem.use'})],triggered_sound:'minecraft:entity.generic.hurt',completed_sound:'minecraft:item.totem.use'}),
  tpl({cat:'Combat',complexity:'Advanced',tags:['questlog:stat','questlog:quest_complete'],file:'village_defender.json',title:'Bell Weather',icon:{item:'minecraft:bell'},description:'The bell rings different when the raid horn answers. Stand with the village, win the fight, and let the doors open without fear for once.\n\n§8§oSmall towns keep big grudges.',requirements:[qObj('questlog:quest_complete',{quest:'questlog:night_shift'})],objectives:[qObj('questlog:stat',{name:'Win a Raid',stat:'minecraft:raid_win',required_amount:1,retroactive:true}),qObj('questlog:quest_complete',{name:'Finish Night Shift',quest:'questlog:night_shift'})],rewards:[qReward('questlog:item',{name:'Village Thanks',item:'minecraft:emerald',count:16,claim_sound:'minecraft:entity.villager.yes'})],triggered_sound:'minecraft:event.raid.horn',completed_sound:'minecraft:entity.villager.celebrate'}),
  tpl({cat:'Exploration',complexity:'Simple',tags:['questlog:visit_biome','questlog:item_obtain'],file:'desert_glass.json',title:'Desert Glass Budget',icon:{item:'minecraft:sand'},description:'Find the heat shimmer, scoop up the sand, and imagine what it becomes after fire gets involved.\n\n§8§oEvery window starts as a desert that lost its argument.',objectives:[qObj('questlog:visit_biome',{name:'Visit a Desert',biome:'minecraft:desert'}),qObj('questlog:item_obtain',{name:'Collect Sand',item:'minecraft:sand',required_amount:32})],rewards:[qReward('questlog:item',{name:'Smelting Starter',item:'minecraft:coal',count:8,claim_sound:'minecraft:block.sand.break'})],triggered_sound:'minecraft:music.overworld.desert',completed_sound:'minecraft:block.glass.place'}),
  tpl({cat:'Exploration',complexity:'Intermediate',tags:['questlog:visit_structure','questlog:block_interact'],file:'village_guest.json',title:'Village Guest Pass',icon:{item:'minecraft:emerald'},description:'Find a village and ring the bell like you belong there. The villagers may not trust you yet, but bread has started worse friendships.\n\n§8§oDo not steal the bed. Probably.',objectives:[qObj('questlog:visit_structure',{name:'Find a Village',structure:'minecraft:village'}),qObj('questlog:block_interact',{name:'Ring the Bell',block:'minecraft:bell',required_amount:1})],rewards:[qReward('questlog:item',{name:'Welcome Bread',item:'minecraft:bread',count:12,claim_sound:'minecraft:entity.villager.trade'})],triggered_sound:'minecraft:entity.villager.ambient',completed_sound:'minecraft:block.bell.use'}),
  tpl({cat:'Exploration',complexity:'Intermediate',tags:['questlog:visit_dimension','questlog:item_use'],file:'portal_breath.json',title:'Portal Breath',icon:{item:'minecraft:flint_and_steel'},description:'Build the frame, strike the spark, and step through before you think too hard about the sound it makes.\n\n§8§oThe Nether always answers the door hot.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:obsidian',required_amount:10})],objectives:[qObj('questlog:item_use',{name:'Light the Portal',item:'minecraft:flint_and_steel',required_amount:1}),qObj('questlog:visit_dimension',{name:'Enter the Nether',dimension:'minecraft:the_nether'})],rewards:[qReward('questlog:item',{name:'Return Snacks',item:'minecraft:cooked_porkchop',count:8,claim_sound:'minecraft:entity.piglin.admiring_item'})],triggered_sound:'minecraft:block.portal.trigger',completed_sound:'minecraft:block.portal.travel'}),
  tpl({cat:'Exploration',complexity:'Advanced',tags:['questlog:visit_position','questlog:effect_added'],file:'skyline_dare.json',title:'Skyline Dare',icon:{item:'minecraft:elytra'},description:'Climb until the ground looks like a suggestion, then drink the thing that makes falling negotiable.\n\n§8§oDo not look down unless you brought a plan.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:phantom_membrane',required_amount:1})],objectives:[qObj('questlog:effect_added',{name:'Gain Slow Falling',effect:'minecraft:slow_falling',required_amount:1}),qObj('questlog:visit_position',{name:'Reach Y 180',bounds:{minY:180}})],rewards:[qReward('questlog:item',{name:'Feather Tax Refund',item:'minecraft:feather',count:16,claim_sound:'minecraft:entity.chicken.egg'})],triggered_sound:'minecraft:entity.phantom.flap',completed_sound:'minecraft:item.elytra.flying'}),
  tpl({cat:'Exploration',complexity:'Advanced',tags:['questlog:visit_structure','questlog:advancement'],file:'stronghold_receipt.json',title:'Stronghold Receipt',icon:{item:'minecraft:ender_eye'},description:'Follow the eyes until stone starts hiding old work. Find the stronghold and bring back proof that the map was not lying.\n\n§8§oSome doors are buried because they still work.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:ender_eye',required_amount:8})],objectives:[qObj('questlog:visit_structure',{name:'Find a Stronghold',structure:'minecraft:stronghold'}),qObj('questlog:advancement',{name:'Enter the End Portal Room Path',advancement:'minecraft:story/follow_ender_eye'})],rewards:[qReward('questlog:experience',{name:'Stronghold Nerves',experience:250,claim_sound:'minecraft:entity.ender_eye.launch'})],triggered_sound:'minecraft:entity.ender_eye.launch',completed_sound:'minecraft:ui.toast.challenge_complete'}),
  tpl({cat:'Building',complexity:'Simple',tags:['questlog:block_place','questlog:item_craft'],file:'light_the_path.json',title:'Light the Path',icon:{item:'minecraft:lantern'},description:'Make lanterns and hang them where the shadows keep collecting. A base feels different once the corners stop whispering.\n\n§8§oLight is cheap. Panic is not.',objectives:[qObj('questlog:item_craft',{name:'Craft Lanterns',item:'minecraft:lantern',required_amount:4}),qObj('questlog:block_place',{name:'Place Lanterns',block:'minecraft:lantern',required_amount:4})],rewards:[qReward('questlog:item',{name:'Extra Chain',item:'minecraft:chain',count:4,claim_sound:'minecraft:block.lantern.place'})],triggered_sound:'minecraft:block.lantern.place',completed_sound:'minecraft:block.beacon.activate'}),
  tpl({cat:'Building',complexity:'Intermediate',tags:['questlog:block_place','questlog:block_mine'],file:'copper_roof_problem.json',title:'Copper Roof Problem',icon:{item:'minecraft:copper_block'},description:'Mine the copper, place the roof, and let time do its slow green handwriting.\n\n§8§oSome builds are finished only after the weather signs them.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:copper_ingot',required_amount:32})],objectives:[qObj('questlog:block_mine',{name:'Mine Copper Ore',block:'minecraft:copper_ore',required_amount:12}),qObj('questlog:block_place',{name:'Place Copper Blocks',block:'minecraft:copper_block',required_amount:8})],rewards:[qReward('questlog:item',{name:'Lightning Advice',item:'minecraft:lightning_rod',count:2,claim_sound:'minecraft:item.axe.scrape'})],triggered_sound:'minecraft:block.copper.place',completed_sound:'minecraft:block.copper.break'}),
  tpl({cat:'Building',complexity:'Intermediate',tags:['questlog:block_interact','questlog:item_craft'],file:'anvil_decisions.json',title:'Expensive Decisions',icon:{item:'minecraft:anvil'},description:'Craft the anvil and make one serious repair choice. It is heavy, expensive, and exactly the sort of thing a good tool deserves.\n\n§8§oThe first clang always sounds like commitment.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:iron_ingot',required_amount:31})],objectives:[qObj('questlog:item_craft',{name:'Craft an Anvil',item:'minecraft:anvil',required_amount:1}),qObj('questlog:block_interact',{name:'Use the Anvil',block:'minecraft:anvil',required_amount:1})],rewards:[qReward('questlog:item',{name:'Experience Cushion',item:'minecraft:experience_bottle',count:8,claim_sound:'minecraft:block.anvil.use'})],triggered_sound:'minecraft:block.anvil.place',completed_sound:'minecraft:block.anvil.use'}),
  tpl({cat:'Farming',complexity:'Simple',tags:['questlog:entity_breed','questlog:item_obtain'],file:'cow_department.json',title:'Cow Department',icon:{item:'minecraft:wheat'},description:'Set up the wheat, bring the cows together, and pretend this is agriculture instead of negotiations with square animals.\n\n§8§oThe farm grows louder before it grows useful.',objectives:[qObj('questlog:item_obtain',{name:'Harvest Wheat',item:'minecraft:wheat',required_amount:16}),qObj('questlog:entity_breed',{name:'Breed Cows',entity:'minecraft:cow',required_amount:2})],rewards:[qReward('questlog:item',{name:'Leather Starter',item:'minecraft:leather',count:4,claim_sound:'minecraft:entity.cow.ambient'})],triggered_sound:'minecraft:entity.cow.ambient',completed_sound:'minecraft:entity.player.levelup'}),
  tpl({cat:'Farming',complexity:'Intermediate',tags:['questlog:entity_breed','questlog:item_use'],file:'bee_courier.json',title:'Bee Courier',icon:{item:'minecraft:honeycomb'},description:'Flowers make promises, and bees deliver them in circles. Breed a pair and collect honey without turning the whole field against you.\n\n§8§oTiny wings run a surprisingly strict schedule.',requirements:[qObj('questlog:visit_biome',{biome:'minecraft:flower_forest'})],objectives:[qObj('questlog:item_use',{name:'Use a Flower',item:'minecraft:dandelion',required_amount:1}),qObj('questlog:entity_breed',{name:'Breed Bees',entity:'minecraft:bee',required_amount:2})],rewards:[qReward('questlog:item',{name:'Comb Bonus',item:'minecraft:honeycomb',count:3,claim_sound:'minecraft:block.beehive.shear'})],triggered_sound:'minecraft:entity.bee.loop',completed_sound:'minecraft:block.beehive.work'}),
  tpl({cat:'Farming',complexity:'Simple',tags:['questlog:entity_tame','questlog:entity_approach'],file:'wolf_interview.json',title:'Wolf Interview',icon:{item:'minecraft:bone'},description:'Walk up with bones and a steady hand. If the wolf accepts, you get more than a pet. You get a second heartbeat on the trail.\n\n§8§oSome friends arrive with teeth.',objectives:[qObj('questlog:entity_approach',{name:'Approach a Wolf',entity:'minecraft:wolf',range:8}),qObj('questlog:entity_tame',{name:'Tame a Wolf',entity:'minecraft:wolf',required_amount:1})],rewards:[qReward('questlog:item',{name:'Dog Snacks',item:'minecraft:cooked_beef',count:6,claim_sound:'minecraft:entity.wolf.ambient'})],triggered_sound:'minecraft:entity.wolf.ambient',completed_sound:'minecraft:entity.wolf.howl'}),
  tpl({cat:'Farming',complexity:'Intermediate',tags:['questlog:entity_tame','questlog:entity_approach'],file:'saddle_argument.json',title:'Saddle Argument',icon:{item:'minecraft:saddle'},description:'Find a horse, earn its patience, and try the saddle before it decides your posture is offensive.\n\n§8§oFast travel sometimes has opinions.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:saddle',required_amount:1})],objectives:[qObj('questlog:entity_approach',{name:'Approach a Horse',entity:'minecraft:horse',range:8}),qObj('questlog:entity_tame',{name:'Tame a Horse',entity:'minecraft:horse',required_amount:1})],rewards:[qReward('questlog:item',{name:'Stable Snacks',item:'minecraft:golden_carrot',count:4,claim_sound:'minecraft:entity.horse.ambient'})],triggered_sound:'minecraft:entity.horse.ambient',completed_sound:'minecraft:entity.horse.saddle'}),
  tpl({cat:'Magic',complexity:'Intermediate',tags:['questlog:enchant','questlog:block_interact'],file:'library_noise.json',title:'Library Noise',icon:{item:'minecraft:enchanted_book'},description:'Build the table, open the book, and let the letters crawl over something useful. Magic is mostly paperwork with better lighting.\n\n§8§oThe shelves are listening.',requirements:[qObj('questlog:item_craft',{item:'minecraft:enchanting_table',required_amount:1})],objectives:[qObj('questlog:block_interact',{name:'Use an Enchanting Table',block:'minecraft:enchanting_table',required_amount:1}),qObj('questlog:enchant',{name:'Enchant Any Book',item:'minecraft:book',required_amount:1})],rewards:[qReward('questlog:experience',{name:'Borrowed Glow',experience:120,claim_sound:'minecraft:block.enchantment_table.use'})],triggered_sound:'minecraft:block.enchantment_table.use',completed_sound:'minecraft:entity.player.levelup'}),
  tpl({cat:'Magic',complexity:'Advanced',tags:['questlog:effect_added','questlog:item_use'],file:'potion_panic.json',title:'Potion Panic Button',icon:{item:'minecraft:potion'},description:'Brew the backup plan before the cave becomes a problem. Drink when needed, breathe after.\n\n§8§oGlass bottles hold very small second chances.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:brewing_stand',required_amount:1})],objectives:[qObj('questlog:item_use',{name:'Drink a Potion',item:'minecraft:potion',required_amount:1}),qObj('questlog:effect_added',{name:'Gain Regeneration',effect:'minecraft:regeneration',required_amount:1})],rewards:[qReward('questlog:item',{name:'Emergency Glow',item:'minecraft:glowstone_dust',count:6,claim_sound:'minecraft:entity.generic.drink'})],triggered_sound:'minecraft:block.brewing_stand.brew',completed_sound:'minecraft:entity.generic.drink'}),
  tpl({cat:'Silly',complexity:'Simple',tags:['questlog:trample','questlog:stat'],file:'crop_crimes.json',title:'Crop Crimes Division',icon:{item:'minecraft:farmland'},description:'Step where you should not, hear the soil complain, then jump once like this was research.\n\n§8§oThe farm will remember. The farm is dramatic.',objectives:[qObj('questlog:trample',{name:'Trample Farmland',required_amount:1}),qObj('questlog:stat',{name:'Jump Once',stat:'minecraft:jump',required_amount:1,retroactive:true})],rewards:[qReward('questlog:item',{name:'Apology Seeds',item:'minecraft:wheat_seeds',count:16,claim_sound:'minecraft:item.crop.plant'})],triggered_sound:'minecraft:block.grass.step',completed_sound:'minecraft:item.crop.plant'}),
  tpl({cat:'Silly',complexity:'Simple',tags:['questlog:item_drop','questlog:read'],file:'throw_the_rock.json',title:'Throw the Rock',icon:{item:'minecraft:cobblestone'},description:'Read the note, drop the cobblestone, and accept that not every quest has to be heroic. Some of them just need to test the wires.\n\n§8§oThe rock returns changed. Slightly.',requirements:[qObj('questlog:read',{quest:'questlog:first_camp'})],objectives:[qObj('questlog:read',{name:'Read the Quest Note',quest:'questlog:first_camp'}),qObj('questlog:item_drop',{name:'Drop Cobblestone',item:'minecraft:cobblestone',required_amount:1})],rewards:[qReward('questlog:item',{name:'Rock Refund',item:'minecraft:cobblestone',count:2,claim_sound:'minecraft:entity.item.pickup'})],triggered_sound:'minecraft:entity.item.pickup',completed_sound:'minecraft:block.note_block.hat'}),
  tpl({cat:'Examples',complexity:'Advanced',tags:['questlog:or','questlog:not'],file:'plan_b_or_no_plan.json',title:'Plan B, Or No Plan',icon:{item:'minecraft:compass'},description:'Choose the clean route or the cave route. Make a compass, or drag enough redstone out of the dark. Just keep breathing while you improvise.\n\n§8§oPlans are nicer after they survive contact with stone.',requirements:[qObj('questlog:not',{objective:qObj('questlog:entity_death',{entity:'minecraft:player',required_amount:1})})],objectives:[qObj('questlog:or',{objectives:[qObj('questlog:item_craft',{name:'Craft a Compass',item:'minecraft:compass',required_amount:1}),qObj('questlog:item_obtain',{name:'Find Redstone',item:'minecraft:redstone',required_amount:16})]})],rewards:[qReward('questlog:item',{name:'Map Desk Starter',item:'minecraft:cartography_table',count:1,claim_sound:'minecraft:ui.cartography_table.take_result'})],triggered_sound:'minecraft:ui.button.click',completed_sound:'minecraft:ui.toast.challenge_complete'}),
  tpl({cat:'Examples',complexity:'Advanced',tags:['questlog:command','questlog:loot_table','questlog:unobtainable'],file:'admin_chest_example.json',title:'Admin Chest Example',icon:{item:'minecraft:chest'},description:'A pack-maker example with a locked trigger, a chest interaction, loot payout, and command reward. Use it for events, shops, secrets, or anything that needs a velvet rope.\n\n§8§oNot every quest is meant to open itself.',requirements:[qObj('questlog:unobtainable',{name:'Locked by Pack Logic'})],objectives:[qObj('questlog:block_interact',{name:'Open a Chest',block:'minecraft:chest',required_amount:1})],rewards:[qReward('questlog:loot_table',{name:'Example Loot Table',loot_table:'minecraft:chests/simple_dungeon',claim_sound:'minecraft:block.chest.open'}),qReward('questlog:command',{name:'Announce Completion',command:'tellraw @s {"text":"Quest complete.","color":"gold"}',permission_level:2})],triggered_sound:'minecraft:block.chest.open',completed_sound:'minecraft:ui.toast.challenge_complete'}),
  tpl({cat:'Examples',complexity:'Intermediate',tags:['questlog:advancement','questlog:quest_complete'],file:'story_checkpoint.json',title:'Story Checkpoint',icon:{item:'minecraft:knowledge_book'},description:'Finish the earlier work, claim the advancement, and let this mark the point where the path starts branching.\n\n§8§oGood chapters need hinges.',requirements:[qObj('questlog:quest_complete',{quest:'questlog:stone_and_sparks'})],objectives:[qObj('questlog:quest_complete',{name:'Complete Stone and Sparks',quest:'questlog:stone_and_sparks'}),qObj('questlog:advancement',{name:'Stone Age Advancement',advancement:'minecraft:story/mine_stone'})],rewards:[qReward('questlog:experience',{name:'Checkpoint XP',experience:75,claim_sound:'minecraft:entity.experience_orb.pickup'})],triggered_sound:'minecraft:ui.toast.in',completed_sound:'minecraft:ui.toast.out'}),
  tpl({cat:'Examples',complexity:'Simple',tags:['questlog:read','questlog:unobtainable'],file:'quest_noticeboard.json',title:'Quest Noticeboard',icon:{item:'minecraft:lectern'},description:'A noticeboard quest for instructions, rumors, server rules, or locked story beats. Read it, file it away, and let the world feel a little more intentional.\n\n§8§oSome quests are signs pretending to be doors.',objectives:[qObj('questlog:read',{name:'Read This Notice',quest:'questlog:quest_noticeboard'}),qObj('questlog:unobtainable',{name:'Manual Unlock Placeholder'})],rewards:[qReward('questlog:item',{name:'Bookmark',item:'minecraft:paper',count:1,claim_sound:'minecraft:item.book.page_turn'})],triggered_sound:'minecraft:item.book.page_turn',completed_sound:'minecraft:ui.toast.out'}),
  tpl({cat:'Examples',complexity:'Intermediate',tags:['questlog:block_mine','questlog:block_place'],file:'quarry_marker.json',title:'Quarry Marker',icon:{item:'minecraft:stonecutter'},description:'Mine enough stone to make the hole official, then place a stonecutter like a little flag in the dust.\n\n§8§oA quarry is just a mess with a title.',objectives:[qObj('questlog:block_mine',{name:'Mine Stone',block:'minecraft:stone',required_amount:64}),qObj('questlog:block_place',{name:'Place a Stonecutter',block:'minecraft:stonecutter',required_amount:1})],rewards:[qReward('questlog:item',{name:'Work Lights',item:'minecraft:torch',count:48,claim_sound:'minecraft:ui.stonecutter.take_result'})],triggered_sound:'minecraft:block.stone.break',completed_sound:'minecraft:ui.stonecutter.take_result'}),
  tpl({cat:'Progression',complexity:'Advanced',tags:['questlog:item_equip','questlog:visit_dimension'],file:'end_ready_uniform.json',title:'End-Ready Uniform',icon:{item:'minecraft:diamond_boots'},description:'Put on the boots, carry the eyes, and step into the End dressed like gravity is about to get personal.\n\n§8§oThe void notices loose footing.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:ender_eye',required_amount:12})],objectives:[qObj('questlog:item_equip',{name:'Equip Diamond Boots',item:'minecraft:diamond_boots',slot:'feet',required_amount:1}),qObj('questlog:visit_dimension',{name:'Enter the End',dimension:'minecraft:the_end'})],rewards:[qReward('questlog:item',{name:'Soft Landing Maybe',item:'minecraft:ender_pearl',count:4,claim_sound:'minecraft:entity.ender_pearl.throw'})],triggered_sound:'minecraft:block.end_portal.spawn',completed_sound:'minecraft:music.end'}),
  tpl({cat:'Exploration',complexity:'Advanced',tags:['questlog:visit_position','questlog:or'],file:'borderline_cartographer.json',title:'Borderline Cartographer',icon:{item:'minecraft:map'},description:'Make a map and push past the comfortable edges. Go far, climb high, and prove the paper still knows where you are.\n\n§8§oThe world is bigger than the first safe hill.',requirements:[qObj('questlog:item_craft',{item:'minecraft:map',required_amount:1})],objectives:[qObj('questlog:or',{objectives:[qObj('questlog:visit_position',{name:'Reach X 1000+',bounds:{minX:1000}}),qObj('questlog:visit_position',{name:'Reach Y 200+',bounds:{minY:200}})]})],rewards:[qReward('questlog:item',{name:'Cartographer Snack',item:'minecraft:cookie',count:8,claim_sound:'minecraft:ui.cartography_table.take_result'})],triggered_sound:'minecraft:ui.cartography_table.take_result',completed_sound:'minecraft:item.elytra.flying'}),
  tpl({cat:'Silly',complexity:'Intermediate',tags:['questlog:trample','questlog:entity_death'],file:'garden_insurance.json',title:'Garden Insurance',icon:{item:'minecraft:golden_carrot'},description:'The garden has rules. Break one carefully, stay alive, and bring back carrots as hush money.\n\n§8§oIf anyone asks, it was soil testing.',requirements:[qObj('questlog:item_obtain',{item:'minecraft:wheat_seeds',required_amount:8})],objectives:[qObj('questlog:trample',{name:'Trample One Farmland',required_amount:1}),qObj('questlog:not',{objective:qObj('questlog:entity_death',{name:'Do Not Die During the Incident',entity:'minecraft:player',required_amount:1})})],rewards:[qReward('questlog:item',{name:'Hush Carrots',item:'minecraft:golden_carrot',count:3,claim_sound:'minecraft:entity.villager.no'})],triggered_sound:'minecraft:block.grass.step',completed_sound:'minecraft:entity.villager.yes'})
];
function allTemplates(){return [...QUEST_TEMPLATES,...customTemplates.map((t,i)=>({...t,customIndex:i}))];}
function templateCategories(){return [...new Set(QUEST_TEMPLATES.map(t=>t.cat))].sort();}
function templateComplexities(){return ['Simple','Intermediate','Advanced'];}
function templateTags(){return OBJ_TYPES.slice();}
function slugFile(s){return String(s||'quest').toLowerCase().replace(/[^a-z0-9_./-]+/g,'_').replace(/^_+|_+$/g,'')+'.json';}
function uniqueFileName(base,map){let n=base.endsWith('.json')?base:base+'.json';let i=2;const stem=n.replace(/\.json$/i,'');while(map[n])n=`${stem}_${i++}.json`;return n;}
function uniqueTemplateTitle(base){let title=String(base||'Custom quest').trim()||'Custom quest';let n=title,i=2;const used=new Set(customTemplates.map(t=>String(t.title||'').toLowerCase()));while(used.has(n.toLowerCase()))n=`${title} ${i++}`;return n;}
function cloneTemplateQuest(t){const q={title:t.title,description:t.description||'',icon:t.icon||{item:'minecraft:book'},objectives:JSON.parse(JSON.stringify(t.objectives||[])),requirements:JSON.parse(JSON.stringify(t.requirements||[])),rewards:JSON.parse(JSON.stringify(t.rewards||[]))};if(t.completed_sound)q.completed_sound=t.completed_sound;if(t.triggered_sound)q.triggered_sound=t.triggered_sound;if(t.toast_on_unlock!==undefined)q.toast_on_unlock=t.toast_on_unlock;if(t.toast_on_complete!==undefined)q.toast_on_complete=t.toast_on_complete;fixQA(q);return q;}
function createQuestFromTemplate(t){const fn=uniqueFileName(t.file||slugFile(t.title),quests);const q=cloneTemplateQuest(t);quests[fn]=q;touchFile('quest',fn);recordActivity('Created from template','quest',fn,t.title);selectFile(fn,'quest');showMsg(`Created template: ${t.title}`,true);scheduleAutosave();}
function deleteCustomTemplate(index){
  const tpl=customTemplates[index];
  if(!tpl)return;
  openConfirmModal({
    title:`Delete ${tpl.title||'custom template'}?`,
    copy:'This only deletes the template you made. Built-in templates will stay.',
    button:'Delete template',
    onConfirm:()=>{
      customTemplates.splice(index,1);
      recordActivity('Deleted custom template','project','',tpl.title||'Untitled template');
      renderTemplateModal();
      scheduleAutosave();
      showMsg('Custom template deleted.',true);
    }
  });
}
function makeTemplateFromQuest(file){
  const q=quests[file];if(!q)return;
  const title=uniqueTemplateTitle((q.title||file.replace(/\.json$/i,'')).trim()||'Custom quest');
  const tpl={cat:'Custom',complexity:'Custom',source_file:file,created_at:new Date().toISOString(),tags:[...new Set([...(q.requirements||[]),...(q.objectives||[]),...(q.failures||[])].map(o=>o?.type).filter(Boolean))],file:slugFile(title),title,description:q.description||'',icon:q.icon||{item:'minecraft:book'},requirements:JSON.parse(JSON.stringify(q.requirements||[])),objectives:JSON.parse(JSON.stringify(q.objectives||[])),rewards:JSON.parse(JSON.stringify(q.rewards||[]))};
  if(q.completed_sound)tpl.completed_sound=q.completed_sound;
  if(q.triggered_sound)tpl.triggered_sound=q.triggered_sound;
  customTemplates.unshift(tpl);
  customTemplates=customTemplates.slice(0,60);
  recordActivity('Made template','quest',file,title);
  showMsg(`Saved ${title} as a custom template.`,true);
  scheduleAutosave();
}
function ensureTemplateChapter(){const fn='vanilla_starter.json';if(!chapters[fn])chapters[fn]={name:'Vanilla Starter',icon:{item:'minecraft:grass_block'},order:0};return fn;}
function createStarterPack(){const ch=ensureTemplateChapter();touchFile('chapter',ch);const ns=getNs()||'questlog';const made=[];QUEST_TEMPLATES.forEach((t,i)=>{const fn=uniqueFileName(t.file||slugFile(t.title),quests);const q=cloneTemplateQuest(t);q.chapter=`${ns}:${ch.replace(/\.json$/i,'')}`;q.sort_order=i;quests[fn]=q;touchFile('quest',fn);made.push(fn);});renderFileList();selectFile(made[0]||ch,made[0]?'quest':'chapter');renderValidation();showMsg(`Created ${made.length} vanilla starter quests.`,true);scheduleAutosave();}
function openTemplateModal(){const modal=$('#templateModal');if(!modal)return;modal.classList.add('open');renderTemplateModal();setTimeout(()=>$('#templateSearch')?.focus(),50);}
function closeTemplateModal(){$('#templateModal')?.classList.remove('open');}
function renderTemplateModal(){const list=$('#templateList'),cat=$('#templateCategory'),search=$('#templateSearch'),cx=$('#templateComplexity'),tag=$('#templateTag'),summary=$('#templateSummary');if(!list||!cat)return;const keepCat=cat.value||'all';cat.innerHTML='<option value="all">All categories</option>'+templateCategories().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');cat.value=[...cat.options].some(o=>o.value===keepCat)?keepCat:'all';if(cx&&!cx.dataset.ready){cx.innerHTML='<option value="all">All complexity</option>'+templateComplexities().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');cx.dataset.ready='1';}if(tag&&!tag.dataset.ready){tag.innerHTML='<option value="all">All objective tags</option>'+templateTags().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');tag.dataset.ready='1';}
  const q=String(search?.value||'').trim().toLowerCase();const cv=cat.value||'all';const xv=cx?.value||'all';const tv=tag?.value||'all';
  const customOnly=!!$('#templateCustomOnly')?.checked;
  const pool=allTemplates();
  const rows=pool.map((t,index)=>({t,index})).filter(({t})=>(!customOnly||t.customIndex!==undefined)&&(customOnly||cv==='all'||t.cat===cv)&&(customOnly||xv==='all'||t.complexity===xv)&&(tv==='all'||(t.tags||[]).includes(tv))&&(!q||`${t.title} ${t.cat} ${t.complexity} ${(t.tags||[]).join(' ')} ${t.description} ${t.source_file||''}`.toLowerCase().includes(q))).sort((a,b)=>(b.t.customIndex!==undefined)-(a.t.customIndex!==undefined)||String(a.t.title).localeCompare(String(b.t.title)));
  if(summary)summary.innerHTML=`<strong>${rows.length}</strong> shown <span>${customTemplates.length} custom</span> <span>${QUEST_TEMPLATES.length} built-in</span>`;
  list.innerHTML=rows.map(({t,index})=>`<div class="template-row ${t.customIndex!==undefined?'is-custom':''}" data-tpl="${esc(t.title)}"><div class="template-main"><div class="template-name">${esc(t.title)}</div><div class="template-desc">${esc(t.description||'')}</div><div class="template-meta">${t.customIndex!==undefined?'<span class="custom-pill">Custom</span>':''}<span>${esc(t.cat)}</span><span>${esc(t.complexity||'Simple')}</span><span>${esc((t.objectives||[]).length)} objective${(t.objectives||[]).length===1?'':'s'}</span><span>${esc((t.requirements||[]).length)} req</span>${t.source_file?`<span>From ${esc(t.source_file.replace(/\.json$/i,''))}</span>`:''}<span>${esc((t.tags||[]).slice(0,2).join(', ')||'No tags')}</span></div></div><div class="template-row-actions"><button class="btn btn-primary btn-sm template-create" data-index="${index}">Use template</button>${t.customIndex!==undefined?`<button class="btn btn-danger-soft btn-sm template-delete" data-custom-index="${t.customIndex}">Delete</button>`:''}</div></div>`).join('')||'<div class="template-empty">No templates match that search.</div>';
  $$('.template-create',list).forEach(btn=>btn.onclick=()=>createQuestFromTemplate(pool[Number(btn.dataset.index)]));
  $$('.template-delete',list).forEach(btn=>btn.onclick=()=>deleteCustomTemplate(Number(btn.dataset.customIndex)));
}
const CHANGELOGS=[
  {
    version:'2.8',
    title:'Version 2.8',
    status:'Advanced creator tools',
    sections:[
      {title:'Updated',items:[
        'Advanced editor fields are grouped into clearer texture, overlay, panel, label, color, and badge sections.',
        'JSON and ZIP files can be dropped onto the editor to import them through the same safe import path as the menu.',
        'Quest templates show custom counts, clearer Use template buttons, custom highlighting, and source-file info for templates made from quests.',
        'Export preview now gives a cleaner readiness check before downloading the project ZIP.',
        'Optional UI sounds now play replaceable files from ui-sounds, with typing sounds, volume control, and a mute button.',
        'Website personalization now has premade themes, font choices, editor toggles, and sound feel settings.',
        'Vanilla Minecraft 1.21.1 biome, block, item, and sound suggestions were refreshed.',
        'Mod ID suggestion support was added for popular packs, with a simple picker that shows the mod name, mod ID, and short description.'
      ]}
    ]
  },
  {
    version:'2.5',
    title:'Version 2.5',
    status:'Project workflow tools',
    sections:[
      {title:'Updated',items:[
        'Export preview focuses on warnings/missing data and a short install-location note.',
        'Sample ZIP regression fixture added for import/export testing.',
        'Activity panel was removed after testing because it was not useful enough for the main workflow.',
        'Project tools were removed; Bulk delete now has its own left-sidebar button and centered checklist overlay.',
        'Export project ZIP now opens the export preview directly instead of using a duplicate Preview export menu item.',
        'Right-click Make template can save custom templates, and custom templates can be filtered/deleted.',
        'Custom template deletion, file deletion, and bulk delete use in-app confirmation instead of browser popups.',
        'Settings was reorganized so status, tutorial, changelog, and reset controls are grouped together.',
        'Manual Save now lives in the right panel only when autosave is off.'
      ]}
    ]
  },
  {
    version:'2.3',
    title:'Version 2.3',
    status:'Creator usability and onboarding',
    sections:[
      {title:'Updated',items:[
        'Changelog moved into a full-screen overlay with a version selector.',
        'Left quest/chapter sidebar is wider and resizable.',
        'Quest and chapter list now has top search/filter and compact sorting controls.',
        'Validation warnings can jump to and highlight likely editor fields.',
        'Tooltip coverage expanded across core controls and fields.',
        'First-visit guided tutorial added, with Settings replay, spotlight highlights, and a Quit tutorial button.',
        'Tutorial now walks through Display, Progress, Sounds, Advanced, resources, Settings, and export basics.',
        'Release checklist added for safer Neocities uploads.',
        'Tutorial spotlight and popup placement polished so highlighted fields stay visible.',
        'Project ZIP export now uses config/questlog/quests and config/questlog/chapters paths.'
      ]}
    ]
  },
  {
    version:'2.2',
    title:'Version 2.2',
    status:'Safety, recovery, and cleaner controls',
    sections:[
      {title:'Updated',items:[
        'Top toast notifications for status and errors.',
        'Undo and redo history survives reloads.',
        'Inline rename, Add, and Import/export controls were cleaned up.',
        'Settings menu added for namespace, autosave, raw JSON, export, validation, reset, and tooltip controls.',
        'Neocities mixed-file warning and cache-busting file versions added.',
        'Version 2.0 to 2.2 autosave migration safeguard added.',
        'questlog:quest_complete no longer exposes or exports required_amount.'
      ]}
    ]
  },
  {
    version:'2.0',
    title:'Version 2.0',
    status:'Early editor update',
    sections:[
      {title:'Updated',items:[
        'Added more features, but needed decluttering so the UI changed a good amount.',
        'Featuring templates for quests.',
        'Autosaving and reset feature.',
        'Works by browser local storage.',
        'Missing/Error detection.',
        'Import project zips.',
        'Suggestions box, supported for all Minecraft IDs including sounds.',
        'Improved drag quest onto chapters to link them.',
        'Improved code, optimization, and backend logistics.',
        'Yay now its a website.'
      ]}
    ]
  }
];
function renderChangelog(version=APP_VERSION){
  const select=$('#changelogVersion'),body=$('#changelogBody');if(!select||!body)return;
  if(!select.dataset.ready){
    select.innerHTML=CHANGELOGS.map(c=>`<option value="${esc(c.version)}">Version ${esc(c.version)}</option>`).join('');
    select.dataset.ready='1';
  }
  const entry=CHANGELOGS.find(c=>c.version===version)||CHANGELOGS[0];
  select.value=entry.version;
  body.innerHTML=`<div class="changelog-version-title">${esc(entry.title)}</div><div class="changelog-version-sub">${esc(entry.status)}</div>${entry.sections.map(sec=>`<div class="changelog-section-title">${esc(sec.title)}</div><ul class="changelog-list">${sec.items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`).join('')}`;
}
function initSchemaSourceBadge(){
  const badge=$('#schemaSourceBadge');if(!badge)return;
  badge.href=QUESTLOG_SCHEMA_SOURCE.docs;
  badge.textContent='Validation docs';
  badge.dataset.tip=`Validation/export rules are based on ${QUESTLOG_SCHEMA_SOURCE.branch}, checked ${QUESTLOG_SCHEMA_SOURCE.checked}. Opens Questlog GitHub docs.`;
  badge.title=`${QUESTLOG_SCHEMA_SOURCE.label} - ${QUESTLOG_SCHEMA_SOURCE.branch}, checked ${QUESTLOG_SCHEMA_SOURCE.checked}`;
}
function openChangelogModal(){
  closeSettingsMenu();
  const modal=$('#changelogModal');if(!modal)return;
  renderChangelog(APP_VERSION);
  modal.classList.add('open');
}
function closeChangelogModal(){$('#changelogModal')?.classList.remove('open');}

const TUTORIAL_STEPS=[
  {target:'#questSearch',title:'Search the project',text:'Type here to temporarily filter the quest and chapter list. It only changes what you see; clearing the box brings the full list back.',pad:5},
  {target:'#questListSort',title:'Sort without changing files',text:'Use this to view quests alphabetically, by Questlog order, or by recently updated. Sorting does not rename files or change exported JSON.',pad:5},
  {target:'#fileList',title:'Quest and chapter files',text:'Questlog IDs come from file names. Double-click a file name to rename it, right-click for file actions, and drag quests onto chapters to link them.',pad:5},
  {target:'#btnAddMenu',title:'Create content',text:'Add creates quests, chapters, or starter templates. Templates are working examples you can edit into your own modpack quests.',pad:5},
  {target:'#btnImportExportMenu',title:'Import and export safely',text:'Import existing Questlog JSON or ZIP projects here. Export selected file downloads one JSON file; Export project ZIP is usually what you want for a full pack project.',pad:5},
  {target:'#formTabs',tab:'display',title:'Editor sections overview',text:'The center editor is split into Display, Progress, Sounds, and Advanced. Display is text and appearance, Progress is requirements/objectives/rewards, Sounds is notifications, and Advanced is mostly layout/resource-pack options.',pad:5},
  {target:'#qf_title',tab:'display',title:'Display: identity and placement',text:'Title is what players read. Sort order controls quest position inside a chapter. Chapter ID links this quest to a chapter file, usually namespace:chapter_file_name.',pad:7},
  {target:'#qf_description',tab:'display',title:'Display: description and icon',text:'Description is the main quest text and supports Questlog rich text links. The icon controls what players see beside the quest in the Questlog UI.',pad:7},
  {target:'#addReq',tab:'progress',title:'Progress: requirements',text:'Requirements gate or unlock a quest. Use them for “complete this first” or “own this item first” style logic. You usually do not need hidden:true when requirements already gate the quest.',pad:5},
  {target:'#addObj',tab:'progress',title:'Progress: objectives',text:'Objectives are what the player must do to complete the quest. Item obtain, block mine, advancement, quest complete, and similar types live here.',pad:5},
  {target:'#addRew',tab:'progress',title:'Progress: rewards and failures',text:'Rewards are what the player can claim after completion. Failures are optional and only needed for special quest designs.',pad:5},
  {target:'#qf_completed_sound',tab:'sounds',title:'Sounds and notifications',text:'Use this section for completed/triggered sounds, unlock toasts, completion toasts, and popup behavior. Sound fields expect Minecraft sound IDs.',pad:7},
  {target:'.adv-wrap',tab:'layout',title:'Advanced is for polish',text:'Advanced sections cover layout, textures, labels, colors, and badges. Most quests do not need these at first, but they help packs with custom resource-pack styling.',pad:5},
  {target:'#validationList',title:'Validation catches mistakes',text:'Validation catches missing objectives, broken IDs, and risky references. Click a warning to jump to the likely field and highlight it.',pad:5},
  {target:'#liveJson',title:'Live JSON preview',text:'The right panel shows the selected file as Questlog JSON. Power users can enable raw JSON editing in Settings, but the forms are safer for normal work.',pad:5},
  {target:'.tb-links',title:'Top-left resources',text:'These links go to Modrinth, the Questlog wiki, and examples. Use the wiki for deeper Questlog behavior once the editor basics make sense.',pad:5},
  {target:'.history-actions',title:'Undo and redo',text:'Undo and redo help recover accidental edits. Undo history is saved with the browser project.',pad:5},
  {target:'#settingsMenu',openSettings:true,title:'Settings recap',text:'Settings contains namespace, project-wide checking, sound volume, Website personalization, project status, changelog, this tutorial, and reset saved progress.',pad:5}
];
let tutorialIndex=0,tutorialResizeBound=false;
function markTutorialSeen(){try{localStorage.setItem(TUTORIAL_SEEN_KEY,'true');}catch{}}
function openTutorialPrompt(force=false){
  if(!force&&localStorage.getItem(TUTORIAL_SEEN_KEY)==='true')return;
  $('#tutorialPrompt')?.classList.add('open');
}
function closeTutorialPrompt(){$('#tutorialPrompt')?.classList.remove('open');}
function tutorialTargetRect(step){
  const selectors=step?.targets||(step?.target?[step.target]:[]);
  const rects=selectors.map(sel=>document.querySelector(sel)).filter(Boolean).map(el=>{
    if(el.scrollIntoView)el.scrollIntoView({block:'center',inline:'nearest'});
    return el.getBoundingClientRect();
  }).filter(r=>r&&r.width>=4&&r.height>=4);
  if(!rects.length)return null;
  const left=Math.min(...rects.map(r=>r.left)),top=Math.min(...rects.map(r=>r.top));
  const right=Math.max(...rects.map(r=>r.right)),bottom=Math.max(...rects.map(r=>r.bottom));
  return {left,top,right,bottom,width:right-left,height:bottom-top};
}
function prepareTutorialStep(step){
  if(step?.tab&&mode==='quest'){
    setTab(step.tab);
    renderMain();
  }
  if(step?.openSettings)$('#settingsMenu')?.classList.add('open');
  else closeSettingsMenu();
}
function placeTutorial(){
  const layer=$('#tutorialLayer'),spot=$('#tutorialSpotlight'),pop=$('#tutorialPop');
  if(!layer?.classList.contains('open')||!spot||!pop)return;
  const step=TUTORIAL_STEPS[tutorialIndex];
  let r=tutorialTargetRect(step);
  if(!r||r.width<4||r.height<4){
    r={left:window.innerWidth/2-120,top:window.innerHeight/2-80,width:240,height:160,right:window.innerWidth/2+120,bottom:window.innerHeight/2+80};
  }
  const pad=Number.isFinite(step?.pad)?step.pad:4;
  const left=Math.max(6,Math.round(r.left-pad)),top=Math.max(6,Math.round(r.top-pad));
  const width=Math.min(window.innerWidth-left-6,Math.round(r.width+pad*2));
  const height=Math.min(window.innerHeight-top-6,Math.round(r.height+pad*2));
  Object.assign(spot.style,{left:left+'px',top:top+'px',width:width+'px',height:height+'px'});
  const popW=Math.min(360,window.innerWidth-26),gap=14;
  const popH=pop.offsetHeight||220;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const rightSpace=window.innerWidth-(left+width)-gap-13;
  const leftSpace=left-gap-13;
  const bottomSpace=window.innerHeight-(top+height)-gap-13;
  const topSpace=top-gap-13;
  let px,py;
  if(rightSpace>=popW){
    px=left+width+gap;py=clamp(top,13,window.innerHeight-popH-13);
  }else if(leftSpace>=popW){
    px=left-popW-gap;py=clamp(top,13,window.innerHeight-popH-13);
  }else if(bottomSpace>=popH){
    px=clamp(left+width/2-popW/2,13,window.innerWidth-popW-13);py=top+height+gap;
  }else if(topSpace>=popH){
    px=clamp(left+width/2-popW/2,13,window.innerWidth-popW-13);py=top-popH-gap;
  }else{
    px=clamp(left+width/2-popW/2,13,window.innerWidth-popW-13);
    py=bottomSpace>=topSpace?clamp(top+height+gap,13,window.innerHeight-popH-13):clamp(top-popH-gap,13,window.innerHeight-popH-13);
  }
  Object.assign(pop.style,{left:px+'px',top:py+'px'});
}
function renderTutorial(){
  const step=TUTORIAL_STEPS[tutorialIndex];if(!step)return endTutorial(false);
  prepareTutorialStep(step);
  $('#tutorialTitle').textContent=step.title;
  $('#tutorialText').innerHTML=`${esc(step.text)}${tutorialIndex===TUTORIAL_STEPS.length-1?' <a href="https://moddedmc.wiki/en/project/questlog/latest/docs" target="_blank" rel="noreferrer">Open Questlog wiki</a>.':''}`;
  $('#tutorialProgress').textContent=`${tutorialIndex+1} / ${TUTORIAL_STEPS.length}`;
  const back=$('#tutorialBackBtn'),next=$('#tutorialNextBtn');
  if(back)back.disabled=tutorialIndex===0;
  if(next)next.textContent=tutorialIndex===TUTORIAL_STEPS.length-1?'Done':'Next';
  requestAnimationFrame(placeTutorial);
}
function startTutorial(){
  markTutorialSeen();
  closeTutorialPrompt();
  closeSettingsMenu();
  closeSidebarMenus();
  tutorialIndex=0;
  $('#tutorialLayer')?.classList.add('open');
  if(!tutorialResizeBound){
    tutorialResizeBound=true;
    window.addEventListener('resize',placeTutorial);
    window.addEventListener('scroll',placeTutorial,true);
  }
  renderTutorial();
}
function endTutorial(markSeen=true){
  if(markSeen)markTutorialSeen();
  $('#tutorialLayer')?.classList.remove('open');
  closeSettingsMenu();
}

function jsonSpace(){return $('#compactJson')?.checked?0:2;}
function stringifyJson(obj){return JSON.stringify(obj,null,jsonSpace());}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}
function classifyImportedJson(name,data){const norm=String(name||'import.json').split('/').pop()||'import.json';const isQ=data&&typeof data==='object'&&(data.objectives!==undefined||data.requirements!==undefined||data.rewards!==undefined||data.title!==undefined);if(isQ){fixQA(data);nqbd(data);const fn=uniqueFileName(norm.replace(/\.json$/i,'')+'.json',quests);quests[fn]=data;touchFile('quest',fn);return {kind:'quest',file:fn};}const fn=uniqueFileName(norm.replace(/\.json$/i,'')+'.json',chapters);chapters[fn]=data;touchFile('chapter',fn);return {kind:'chapter',file:fn};}
async function importZipFile(file){if(typeof JSZip==='undefined')throw new Error('JSZip failed to load.');const zip=await JSZip.loadAsync(file);const imported=[];const entries=Object.values(zip.files).filter(z=>!z.dir&&z.name.toLowerCase().endsWith('.json'));
  for(const ent of entries){try{const txt=await ent.async('string');const data=JSON.parse(txt);let rel=ent.name.replace(/^.*config\/questlog\//i,'');let kind=null;if(/(^|\/)quests\//i.test(rel))kind='quest';if(/(^|\/)chapters\//i.test(rel))kind='chapter';let base=rel.split('/').pop()||'import.json';if(kind==='quest'){fixQA(data);nqbd(data);const fn=uniqueFileName(base,quests);quests[fn]=data;touchFile('quest',fn);imported.push({kind,file:fn});}else if(kind==='chapter'){const fn=uniqueFileName(base,chapters);chapters[fn]=data;touchFile('chapter',fn);imported.push({kind,file:fn});}else imported.push(classifyImportedJson(base,data));}catch(err){console.warn('[zip import]',ent.name,err);}}
  if(!imported.length)throw new Error('No JSON quest/chapter files found in that ZIP.');renderFileList();selectFile(imported[0].file,imported[0].kind);renderValidation();scheduleAutosave();return imported.length;}
async function handleImportFiles(fileList,source='Imported'){
  const arr=Array.from(fileList||[]);if(!arr.length)return 0;
  let first=null,ok=0,skipped=0;
  for(const file of arr){
    const name=(file.name||'').toLowerCase();
    try{
      if(name.endsWith('.zip')){ok+=await importZipFile(file);if(!first&&currentFile)first={file:currentFile,kind:mode};continue;}
      if(!name.endsWith('.json')){skipped++;continue;}
      const text=await file.text();
      const data=JSON.parse(text);
      const res=classifyImportedJson(file.name,data);
      ok++;
      if(!first)first=res;
    }catch(err){showMsg(`${file.name}: ${err.message||String(err)}`,false);}
  }
  renderFileList();
  if(first)selectFile(first.file,first.kind);else renderMain();
  renderValidation();
  if(ok)recordActivity(source,'project','',`${ok} files`);
  scheduleAutosave();
  if(ok)showMsg(`${source} ${ok} file${ok===1?'':'s'}.`,true);
  if(skipped)showMsg(`Skipped ${skipped} unsupported file${skipped===1?'':'s'}. Drop .json or .zip files.`,false);
  return ok;
}
function setupDropImport(){
  const overlay=$('#importDropOverlay');let depth=0;
  const hasFiles=e=>Array.from(e.dataTransfer?.types||[]).includes('Files');
  const show=()=>overlay?.classList.add('open');
  const hide=()=>{depth=0;overlay?.classList.remove('open');};
  document.addEventListener('dragenter',e=>{if(!hasFiles(e))return;depth++;show();});
  document.addEventListener('dragover',e=>{if(!hasFiles(e))return;e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';show();});
  document.addEventListener('dragleave',e=>{if(!hasFiles(e))return;depth=Math.max(0,depth-1);if(depth===0)overlay?.classList.remove('open');});
  document.addEventListener('drop',async e=>{if(!hasFiles(e))return;e.preventDefault();const files=e.dataTransfer?.files;hide();await handleImportFiles(files,'Dropped');});
  window.addEventListener('blur',hide);
}

function syncCurrentForExport(){
  if(mode==='quest')syncQ();
  else if($('#cf_name'))$('#cf_name').oninput?.();
}
function projectZipPaths(){
  return {
    quests:Object.keys(quests).sort().map(n=>`config/questlog/quests/${n}`),
    chapters:Object.keys(chapters).sort().map(n=>`config/questlog/chapters/${n}`)
  };
}
function summarizeIssues(issues){
  return {
    missing:issues.filter(i=>i.level==='missing').length,
    error:issues.filter(i=>i.level==='error').length,
    warn:issues.filter(i=>i.level==='warn').length
  };
}
function exportPreviewChecks(issues,paths){
  const checks=[]; 
  const counts=summarizeIssues(issues);
  if(!paths.quests.length)checks.push({level:'warn',text:'Add at least one quest file before exporting.'});
  if(!paths.chapters.length)checks.push({level:'warn',text:'Add at least one chapter file before exporting.'});
  if([...Object.keys(quests),...Object.keys(chapters)].some(n=>!FILE_SAFE.test(n)))checks.push({level:'warn',text:'Some file names are not Questlog-safe.'});
  if(counts.error||counts.missing)checks.push({level:'missing',text:'Fix missing/error items shown in the right validation panel.'});
  if(!checks.length&&counts.warn)checks.push({level:'warn',text:'Warnings exist. Review the right validation panel before release.'});
  if(!checks.length)checks.push({level:'ok',text:'No blocking export problems found.'});
  return checks;
}
function exportReadiness(counts,paths){
  if(!paths.quests.length||!paths.chapters.length||counts.error||counts.missing){
    return {
      level:'blocked',
      title:'Not ready yet',
      copy:'Fix missing data and serious errors before uploading this ZIP to a modpack.'
    };
  }
  if(counts.warn){
    return {
      level:'review',
      title:'Ready after review',
      copy:'The ZIP can be made, but check the warnings first so the pack does not ship confusing quest behavior.'
    };
  }
  return {
    level:'ready',
    title:'Ready to export',
    copy:'No missing data, errors, or warnings were found in the current project check.'
  };
}
function issueLabel(level){
  return {error:'Fix',missing:'Needs review',warn:'Warning',ok:'Ready'}[level]||level;
}
function renderExportPreview(){
  syncCurrentForExport();
  const body=$('#exportPreviewBody');if(!body)return;
  const paths=projectZipPaths();
  const issues=validateAll(false);
  const counts=summarizeIssues(issues);
  const checks=exportPreviewChecks(issues,paths);
  const ready=exportReadiness(counts,paths);
  const exportOnlyProblems=(!paths.quests.length?1:0)+(!paths.chapters.length?1:0)+([...Object.keys(quests),...Object.keys(chapters)].some(n=>!FILE_SAFE.test(n))?1:0);
  const totalProblems=counts.error+counts.missing+counts.warn+exportOnlyProblems;
  body.innerHTML=`
    <div class="export-hero ${esc(ready.level)}">
      <div class="export-orb" aria-hidden="true"><span></span></div>
      <div>
        <div class="export-ready-title">${esc(ready.title)}</div>
        <div class="export-ready-copy">${esc(ready.copy)}</div>
      </div>
    </div>
    <div class="export-summary-grid">
      <div class="export-summary-cell"><div class="export-summary-num">${paths.quests.length}</div><div class="export-summary-label">Quests</div></div>
      <div class="export-summary-cell"><div class="export-summary-num">${paths.chapters.length}</div><div class="export-summary-label">Chapters</div></div>
      <div class="export-summary-cell"><div class="export-summary-num">${totalProblems}</div><div class="export-summary-label">Needs review</div></div>
    </div>
    <div class="export-section-title">Before uploading</div>
    <div class="export-info-box">Use this ZIP as the upload/copy package. Keep quest files in <span class="kbd">config/questlog/quests/</span> and chapter files in <span class="kbd">config/questlog/chapters/</span>. If the count says there are things to review, use the right validation panel for the exact fixes.</div>
    <div class="export-section-title">Readiness checks</div>
    <div class="export-check-list">${checks.map(c=>`<div class="export-check ${esc(c.level)} ${c.level!=='ok'?'needs-attention':''}"><strong>${esc(issueLabel(c.level))}</strong>${esc(c.text)}</div>`).join('')}</div>
    ${issues.length?'<div class="export-note">Detailed warning rows stay in the validation panel so this screen stays focused on the release decision.</div>':''}
  `;
}
function openExportPreviewModal(){
  closeSidebarMenus();
  renderExportPreview();
  $('#exportPreviewModal')?.classList.add('open');
}
function closeExportPreviewModal(){
  $('#exportPreviewModal')?.classList.remove('open');
}
async function exportProjectZip(){
  if(typeof JSZip==='undefined'){showMsg('JSZip failed.',false);return;}
  syncCurrentForExport();
  const zip=new JSZip();
  Object.entries(quests).forEach(([n,o])=>zip.file(`config/questlog/quests/${n}`,stringifyJson(buildQOut(o))));
  Object.entries(chapters).forEach(([n,c])=>{
    const cp=JSON.parse(JSON.stringify(c));
    trimCh(cp);
    zip.file(`config/questlog/chapters/${n}`,stringifyJson(cp));
  });
  const blob=await zip.generateAsync({type:'blob'});
  downloadBlob(blob,'questlog_export.zip');
  recordActivity('Exported ZIP','project','',`${Object.keys(quests).length} quests, ${Object.keys(chapters).length} chapters`);
  showMsg($('#compactJson')?.checked?'Compact ZIP exported.':'Pretty ZIP exported.',true);
}


// ── Live JSON ─────────────────────────────────────────────────────
function refreshJson(){const el=$('#liveJson');if(!currentFile||!getCD()||!el)return;if(jsonFocused)return;try{const d=getCD();el.value=mode==='quest'?stringifyJson(buildQOut(d)):stringifyJson(d);}catch(e){}}
const dRefresh=debounce(refreshJson,180);

// ── Tabs ──────────────────────────────────────────────────────────
function buildTabs(){
  const host=$('#formTabs');host.innerHTML='';
  if(!currentFile||!getCD())return;
  if(mode==='chapter')return;

  const ord=normOrder(panelOrder);
  let active=localStorage.getItem('ql.activeTab')||'display';
  if(ADV_KEYS.includes(active))activeAdvKey=active;
  else if(!MAIN_KEYS.includes(active))active='display';

  // Main tabs
  MAIN_KEYS.forEach(k=>{
    const idx=ord.indexOf(k);
    // only show main tabs in current order position
    const btn=document.createElement('button');
    btn.className='tab-btn'+(active===k?' active':'');
    btn.textContent={display:'Display',progress:'Progress',sounds:'Sounds'}[k];
    btn.dataset.key=k;
    btn.onclick=()=>{setTab(k);buildTabs();};
    host.appendChild(btn);
  });

  // Advanced dropdown
  const advWrap=document.createElement('div');advWrap.className='adv-wrap';
  const advBtn=document.createElement('button');
  advBtn.className='tab-btn'+(ADV_KEYS.includes(active)?' active':'');
  advBtn.textContent=ADV_KEYS.includes(active)?`Advanced · ${{layout:'Layout',labels:'Labels',badge:'Badge'}[active]}`:'Advanced ▾';
  const advMenu=document.createElement('div');advMenu.className='adv-menu';
  [{k:'layout',l:'Layout'},{k:'labels',l:'Labels'},{k:'badge',l:'Badge'}].forEach(({k,l})=>{
    const btn2=document.createElement('button');btn2.textContent=l;
    if(k===active)btn2.classList.add('adv-active');
    btn2.onclick=e=>{e.stopPropagation();advMenu.classList.remove('open');setTab(k);buildTabs();};
    advMenu.appendChild(btn2);
  });
  advBtn.onclick=e=>{e.stopPropagation();advMenu.classList.toggle('open');};
  advWrap.appendChild(advBtn);advWrap.appendChild(advMenu);host.appendChild(advWrap);
  document.addEventListener('click',()=>advMenu.classList.remove('open'),{once:true});

  // Apply visibility to sections
  const sections=$$('#panelForm > details.section[data-panel-key]');
  sections.forEach(s=>{s.style.display=s.dataset.panelKey===active?'':'none';if(s.dataset.panelKey===active)s.open=true;});

  // Keep tab panels open; the tab bar decides visibility, not collapsible details.
  sections.forEach(s=>{
    const sum=s.querySelector(':scope > summary');
    if(sum&&!sum.dataset.noCollapse){sum.dataset.noCollapse='1';sum.addEventListener('click',e=>{if(!e.target.closest('.panel-move'))e.preventDefault();});}
    s.open=true;
  });

  // Reorder ↑↓ buttons
  sections.forEach(s=>{
    const sum=s.querySelector(':scope > summary');if(!sum||sum.querySelector('.panel-move'))return;
    const ctrl=document.createElement('span');ctrl.className='panel-move';ctrl.style.cssText='float:right;display:inline-flex;gap:2px;';
    ctrl.innerHTML=`<button type="button" title="Move up">↑</button><button type="button" title="Move down">↓</button>`;
    const[u,d]=ctrl.querySelectorAll('button');
    u.onclick=e=>{e.preventDefault();e.stopPropagation();movePK(s.dataset.panelKey,-1);};
    d.onclick=e=>{e.preventDefault();e.stopPropagation();movePK(s.dataset.panelKey,1);};
    sum.appendChild(ctrl);
  });
}

function setTab(k){localStorage.setItem('ql.activeTab',k);if(ADV_KEYS.includes(k))activeAdvKey=k;else activeAdvKey=null;}
function movePK(k,dir){const o=normOrder(panelOrder);const i=o.indexOf(k);const n=i+dir;if(i<0||n<0||n>=o.length)return;const t=o[i];o[i]=o[n];o[n]=t;panelOrder=o;saveOrder();syncQ();renderMain();}

// ── Render main ───────────────────────────────────────────────────
function renderMain(){
  rawMode=!!$('#viewRaw')?.checked;
  const label=$('#jsonPanelLabel');if(label)label.textContent=rawMode?'JSON editor':'Live JSON';
  if(!currentFile||!getCD()){
    $(' #panelForm').innerHTML='<div class="empty-state"><p style="color:var(--mu)">Select or create a file</p></div>';
    $(' #formTabs').innerHTML='';
    $('#liveJson').value='';dValidate();return;
  }
  $('#panelForm').innerHTML='';
  if(mode==='chapter'){$('#panelForm').innerHTML=renderChForm(getCD());$('#formTabs').innerHTML='';bindChForm();}
  else{$('#panelForm').innerHTML=renderQForm(getCD());buildTabs();bindQForm();}
  if(!jsonFocused)refreshJson();
dValidate();
}

// ── Renderable ────────────────────────────────────────────────────
function renderRend(p,val){
  let k='item';if(typeof val==='string'&&val)k='stringitem';else if(val&&val.texture)k='texture';else if(val&&val.item)k='item';
  return`<div class="field" data-tip="Choose how this icon is written in Questlog JSON."><label>${p} kind</label><select data-r="${p}-kind"><option value="item" ${k==='item'?'selected':''}>Item (object)</option><option value="texture" ${k==='texture'?'selected':''}>Texture</option><option value="stringitem" ${k==='stringitem'?'selected':''}>Item ID (string)</option></select></div><div class="field" data-r="${p}-item" data-tip="Minecraft item ID used for the Questlog icon."><label>Item ID</label><input type="text" data-r="${p}-itemv" value="${esc(val&&val.item?val.item:'')}" placeholder="minecraft:diamond" /></div><div class="field hidden" data-r="${p}-tex" data-tip="Resource-pack texture path used for the Questlog icon."><label>Texture path</label><input type="text" data-r="${p}-texv" value="${esc(val&&val.texture?val.texture:'')}" /></div><div class="field hidden" data-r="${p}-str" data-tip="Legacy/simple item ID string format."><label>Item ID string</label><input type="text" data-r="${p}-strv" value="${typeof val==='string'?esc(val):''}" /></div>`;
}

// ── Description toolbar HTML ──────────────────────────────────────
function descToolbar(id){
  return`<div class="desc-toolbar"><div class="drop-wrap" data-target="${id}"><button type="button" class="btn btn-sm insert-trigger">+ Insert ▾</button><div class="drop-menu"><button type="button" data-fmt-template="quest">Quest link</button><button type="button" data-fmt-template="image">Image</button><button type="button" data-fmt-template="image-anim">Animated image</button></div></div><div class="drop-wrap" data-target="${id}"><button type="button" class="btn btn-sm fmt-trigger">§ Format ▾</button><div class="drop-menu fmt-menu"><div class="fmt-section-label">Colors</div>${MC_COLORS.map(c=>`<button type="button" data-fmt-code="${esc(c.code)}"><span class="color-swatch" style="background:${c.color}"></span>${c.name}</button>`).join('')}<div class="fmt-section-label">Styles</div>${MC_STYLES.map(s=>`<button type="button" data-fmt-code="${esc(s.code)}">${s.name}</button>`).join('')}</div></div></div>`;
}

function renderDescField(id,label,value,collapsible){
  const hasVal=value!==undefined&&value!==null&&value!=='';
  const tv=typeof value==='string'?value:value!=null?JSON.stringify(value):'';
  const inner=`${descToolbar(id)}<textarea id="${id}">${esc(tv)}</textarea>`;
  if(collapsible&&!hasVal)return`<div class="opt-desc-wrap" data-opt-id="${id}"><button type="button" class="btn opt-expand">+ Add ${label.toLowerCase()}</button><div class="hidden">${inner}</div></div>`;
  return`<div class="field"><label>${label}</label>${inner}</div>`;
}

function nhc(raw,fb){const v=String(raw||'').trim();if(/^#[0-9a-fA-F]{6}$/.test(v))return v.toUpperCase();if(/^#[0-9a-fA-F]{3}$/.test(v)){const h=v.slice(1);return`#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toUpperCase();}return fb;}
function rcf(label,id,val,fb){return`<div class="field"><label>${label}</label><div class="color-pair"><input type="color" id="${id}_picker" data-color-for="${id}" value="${nhc(val||fb,fb)}" /><input type="text" id="${id}" value="${esc(val||fb)}" /></div></div>`;}
function advTextField(label,id,value,tip='',placeholder=''){return`<div class="field"${tip?` data-tip="${esc(tip)}"`:''}><label>${label}</label><input type="text" id="${id}" value="${esc(value||'')}"${placeholder?` placeholder="${esc(placeholder)}"`:''} /></div>`;}
function advNumField(label,id,value,tip='',unit='px'){return`<div class="field"${tip?` data-tip="${esc(tip)}"`:''}><label>${label}${unit?` <span class="advanced-unit">${esc(unit)}</span>`:''}</label><input type="number" id="${id}" value="${value}" /></div>`;}
function advGroup(title,body){return`<div class="advanced-group"><div class="sub-h">${title}</div>${body}</div>`;}

// ── Quest form ────────────────────────────────────────────────────
function renderQForm(q){
  const d=(k,v)=>(q[k]!==undefined&&q[k]!==null?q[k]:v);
  const ch=d('chapter','questlog:main');
  const incMain=q.include_in_main!==undefined?q.include_in_main:defIncMain(ch);
  const badge=d('badge',null);
  return`
<details class="section" data-panel-key="display" open>
  <summary>Display &amp; Text</summary>
  <div class="sec-body">
    <div class="g2"><div class="field" data-tip="The player-facing quest title shown in Questlog."><label>Title</label><input type="text" id="qf_title" value="${esc(q.title||'')}" /></div><div class="field" data-tip="Questlog uses this number to order quests inside a chapter."><label>Sort order</label><input type="number" id="qf_sort_order" value="${d('sort_order',0)}" /></div><div class="field" data-tip="The chapter this quest belongs to, usually namespace:chapter_file_name."><label>Chapter ID</label><input type="text" id="qf_chapter" value="${esc(ch)}" placeholder="questlog:main" /></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin:10px 0;"><label class="toggle-label" data-tip="Mark the quest text as translatable for language files."><input type="checkbox" id="qf_translatable" ${d('translatable',false)?'checked':''} /> Translatable</label><label class="toggle-label" data-tip="Show this quest in the main Questlog view when appropriate."><input type="checkbox" id="qf_include_in_main" ${incMain?'checked':''} /> Include in main</label><label class="toggle-label" data-tip="Hide even after requirements are met. Usually requirements are enough for normal gating."><input type="checkbox" id="qf_hidden" ${d('hidden',false)?'checked':''} /> Hidden permanently</label></div>
    <div class="hint" style="margin-bottom:10px;">⚠ <strong>Hidden</strong> suppresses even after requirements are met. Requirements auto-gate — no need for hidden.</div>
    <div class="field" data-tip="Main quest description. Supports Questlog rich text links and formatting codes."><label>Description</label>${descToolbar('qf_description')}<textarea id="qf_description">${esc(typeof q.description==='string'?q.description:q.description!=null?JSON.stringify(q.description):'')}</textarea></div>
    <div class="hint" style="margin-bottom:8px;">Supports <span class="kbd">[text](quest:ns:id)</span>, <span class="kbd">[text](image:ns:path)</span></div>
    ${renderDescField('qf_description_completed','Description (completed)',q.description_completed,true)}
    ${renderDescField('qf_description_failed','Description (failed)',q.description_failed,true)}
    <div class="g2" style="margin-top:10px;">${renderRend('icon',q.icon)}</div>
  </div>
</details>

<details class="section" data-panel-key="progress" open>
  <summary>Requirements, Objectives &amp; Rewards</summary>
  <div class="sec-body">
    <div class="sub-h">Requirements (unlock)</div><div id="reqList"></div><button type="button" class="btn btn-dashed" id="addReq" data-tip="Add a requirement that unlocks or gates this quest.">+ Add requirement</button>
    <div class="sub-h" style="margin-top:14px;">Objectives</div><div id="objList"></div><button type="button" class="btn btn-dashed" id="addObj" data-tip="Add a player task needed to complete this quest.">+ Add objective</button>
    <div class="sub-h" style="margin-top:14px;">Failures — optional</div><div id="failList"></div><button type="button" class="btn btn-dashed" id="addFail" data-tip="Add an optional failure condition.">+ Add failure</button>
    <div class="sub-h" style="margin-top:14px;">Rewards</div><div id="rewList"></div><button type="button" class="btn btn-dashed" id="addRew" data-tip="Add a completion reward.">+ Add reward</button>
  </div>
</details>

<details class="section" data-panel-key="sounds">
  <summary>Sounds &amp; Notifications</summary>
  <div class="sec-body">
    <div class="g2" style="grid-template-columns:1fr 1fr;"><div class="field" data-tip="Sound played when the quest is completed. Use a Minecraft sound ID."><label>Completed sound</label><input type="text" id="qf_completed_sound" value="${esc(d('completed_sound','')||'')}" placeholder="minecraft:block.amethyst_block.hit" /></div><div class="field" data-tip="Sound played when the quest unlocks or triggers. Use a Minecraft sound ID."><label>Triggered sound</label><input type="text" id="qf_triggered_sound" value="${esc(d('triggered_sound','')||'')}" placeholder="minecraft:item.trident.hit_ground" /></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px;"><label class="toggle-label" data-tip="Show a toast when this quest becomes available."><input type="checkbox" id="qf_toast_on_unlock" ${d('toast_on_unlock',true)?'checked':''} /> Toast on unlock</label><label class="toggle-label" data-tip="Show a toast when this quest is completed."><input type="checkbox" id="qf_toast_on_complete" ${d('toast_on_complete',true)?'checked':''} /> Toast on complete</label><label class="toggle-label" data-tip="Show a larger popup when the quest unlocks."><input type="checkbox" id="qf_show_popup_on_unlock" ${d('show_popup_on_unlock',false)?'checked':''} /> Popup on unlock</label></div>
  </div>
</details>

<details class="section" data-panel-key="layout">
  <summary>UI Layout &amp; Textures</summary>
  <div class="sec-body">
    <div class="advanced-note">These fields are mostly for resource-pack styling and custom Questlog layouts. Leave them alone unless your pack is changing textures or panel placement.</div>
    ${advGroup('Texture sources',`<div class="advanced-grid wide">
      ${advTextField('Background texture','qf_background_texture',d('background_texture','')||'','Optional full Questlog background texture path.')}
      ${advTextField('Right panel texture','qf_right_panel_texture',d('right_panel_texture','')||'','Optional texture path for the right info panel.')}
      ${advTextField('Peripheral texture','qf_peripheral_texture',d('peripheral_texture','')||'','Optional side/peripheral texture path.')}
      ${advTextField('Overlay texture','qf_overlay',d('overlay','')||'','Optional overlay texture path.')}
    </div>`)}
    ${advGroup('Overlay size and position',`<div class="advanced-grid">
      ${advNumField('Overlay width','qf_overlay_width',d('overlay_width',''),'Pixel width of the overlay texture.')}
      ${advNumField('Overlay height','qf_overlay_height',d('overlay_height',''),'Pixel height of the overlay texture.')}
      ${advNumField('Overlay X offset','qf_overlay_x_offset',d('overlay_x_offset',0),'Horizontal overlay offset.')}
      ${advNumField('Overlay Y offset','qf_overlay_y_offset',d('overlay_y_offset',0),'Vertical overlay offset.')}
    </div>`)}
    ${advGroup('Questlog panels',`<div class="advanced-grid">
      ${advNumField('Left panel width','qf_left_panel_width',d('left_panel_width',275),'Width of the left Questlog panel.')}
      ${advNumField('Right panel width','qf_right_panel_width',d('right_panel_width',170),'Width of the right Questlog panel.')}
      ${advNumField('Panel height','qf_panel_height',d('panel_height',166),'Shared panel height.')}
    </div>`)}
    ${advGroup('Panel offsets',`<div class="advanced-grid">
      ${advNumField('Left panel X','qf_left_panel_x_offset',d('left_panel_x_offset',0),'Horizontal offset for the left panel.')}
      ${advNumField('Left panel Y','qf_left_panel_y_offset',d('left_panel_y_offset',0),'Vertical offset for the left panel.')}
      ${advNumField('Right panel X','qf_right_panel_x_offset',d('right_panel_x_offset',0),'Horizontal offset for the right panel.')}
      ${advNumField('Right panel Y','qf_right_panel_y_offset',d('right_panel_y_offset',0),'Vertical offset for the right panel.')}
    </div>`)}
  </div>
</details>

<details class="section" data-panel-key="labels">
  <summary>Button Labels &amp; Palette</summary>
  <div class="sec-body">
    <div class="advanced-note">Labels and colors are optional. Defaults are omitted from export so normal quests stay clean.</div>
    ${advGroup('Button and reward labels',`<div class="advanced-grid wide">
      ${advTextField('Back button','qf_back_button_text',d('back_button_text','gui.back'),'Translation key or literal text for the back button.')}
      ${advTextField('Collect button','qf_collect_button_text',d('collect_button_text','questlog.reward.collect'),'Translation key or literal text for the reward collect button.')}
      ${advTextField('Uncollected reward','qf_uncollected_text',d('uncollected_text','questlog.reward.uncollected'),'Text shown for uncollected rewards.')}
      ${advTextField('Collected reward','qf_collected_text',d('collected_text','questlog.reward.collected'),'Text shown after rewards are collected.')}
    </div>`)}
    ${advGroup('Questlog text colors',`<div class="advanced-grid">
      ${rcf('Text color','qf_text_color',d('text_color','#4C381B'),'#4C381B')}
      ${rcf('Completed text','qf_completed_text_color',d('completed_text_color','#529E52'),'#529E52')}
      ${rcf('Hovered text','qf_hovered_text_color',d('hovered_text_color','#FFFFFF'),'#FFFFFF')}
      ${rcf('Title color','qf_title_color',d('title_color','#4C381B'),'#4C381B')}
      ${rcf('Progress text','qf_progress_text_color',d('progress_text_color','#9E7852'),'#9E7852')}
    </div>`)}
  </div>
</details>

<details class="section" data-panel-key="badge">
  <summary>Badge — optional</summary>
  <div class="sec-body">
    <div class="advanced-note">Badges are optional icon overlays. Leave texture empty to remove the badge from exported JSON.</div>
    <div class="advanced-grid">
    <div class="field"><label>Texture</label><input type="text" id="qb_texture" value="${badge?esc(badge.texture||''):''}" /></div>
    <div class="field"><label>U / V</label><input type="text" id="qb_uv" value="${badge?(badge.u??0)+', '+(badge.v??0):'0, 0'}" /></div>
    <div class="field"><label>W / H</label><input type="text" id="qb_wh" value="${badge?(badge.width??16)+', '+(badge.height??16):'16, 16'}" /></div>
    <div class="field"><label>Tex size W×H</label><input type="text" id="qb_twh" value="${badge?(badge.texture_width??256)+', '+(badge.texture_height??256):'256, 256'}" /></div>
    <div class="field"><label>Frames</label><input type="number" id="qb_frames" value="${badge?badge.frames??1:1}" /></div>
    <div class="field"><label>Frame time (ms)</label><input type="number" id="qb_frame_time" value="${badge?badge.frame_time??100:100}" /></div>
    </div>
  </div>
</details>`;
}

function renderChForm(c){
  const d=(k,v)=>(c[k]!==undefined?c[k]:v);
  return`<div class="section"><div class="sec-body"><div class="g2"><div class="field" data-tip="The player-facing chapter name shown in Questlog."><label>Display name</label><input type="text" id="cf_name" value="${esc(c.name||'')}" /></div><div class="field" data-tip="Questlog uses this number to order chapters."><label>Order</label><input type="number" id="cf_order" value="${d('order',0)}" /></div></div><div style="display:flex;flex-wrap:wrap;gap:12px;margin:10px 0;"><label class="toggle-label" data-tip="Mark chapter text as translatable for language files."><input type="checkbox" id="cf_translatable" ${d('translatable',false)?'checked':''} /> Translatable</label><label class="toggle-label" data-tip="Use this as the default chapter when Questlog opens."><input type="checkbox" id="cf_default_chapter" ${d('default_chapter',false)?'checked':''} /> Default chapter</label><label class="toggle-label" data-tip="Hide the chapter until Questlog conditions reveal it."><input type="checkbox" id="cf_hidden" ${d('hidden',false)?'checked':''} /> Hidden</label></div><div class="hint" style="margin-bottom:10px;">Hidden chapters still show quests if requirements are met.</div><div class="g2">${renderRend('chicon',c.icon)}</div></div></div>`;
}

// ── Objectives ────────────────────────────────────────────────────
function oSel(sel){return`<select class="obj-type" data-tip="Choose the Questlog objective type this entry uses.">${OBJ_TYPES.map(t=>`<option value="${t}" ${t===sel?'selected':''}>${t}</option>`).join('')}</select>`;}
function rSel(sel){return`<select class="rew-type" data-tip="Choose the Questlog reward type this entry gives.">${REW_TYPES.map(t=>`<option value="${t}" ${t===sel?'selected':''}>${t}</option>`).join('')}</select>`;}

function renderOF(o){
  const t=o.type||'questlog:item_obtain';const ra=o.required_amount!==undefined?o.required_amount:1;
  const cn=`<div class="field" data-tip="Optional display name for this objective. Leave blank if the type does not need a label."><label>Name (display)</label><input type="text" class="obj-name" value="${esc(o.name||'')}" placeholder="optional" /></div><label class="toggle-label" style="margin-bottom:8px;" data-tip="Treat the objective name as a language key instead of literal text."><input type="checkbox" class="obj-trans" ${o.translatable?'checked':''} /> Name is translation key</label>`;
  const iv=o.icon===undefined||o.icon===null?'':typeof o.icon==='string'?o.icon:JSON.stringify(o.icon);
  const ci=`<div class="field"><label>Icon — optional</label><input type="text" class="obj-icon" value="${esc(iv)}" placeholder='item id or {"item":"..."}' /></div>`;
  const amt=s=>s?`<div class="field" data-tip="How many times the player must do this objective. Some Questlog objective types do not use this."><label>Required amount</label><input type="number" class="obj-amt" min="1" value="${ra}" /></div>`:'';
  if(t==='questlog:or'){const k=Array.isArray(o.objectives)?o.objectives:[];return`${cn}<div class="nested or-kids">${k.map((c,i)=>wrapOC(c,i)).join('')}</div><button type="button" class="btn btn-dashed add-or-child" style="margin-top:5px;">+ Sub-objective</button>`;}
  if(t==='questlog:not'){const ch=o.objective||{type:'questlog:read'};return`${cn}<div class="nested not-child">${wrapOC(ch,0,true)}</div>`;}
  if(t==='questlog:unobtainable')return`${cn}${ci}`;
  if(t==='questlog:read')return`${cn}${ci}<div class="field"><label>Quest ID</label><input type="text" class="obj-read-quest" value="${esc(o.quest||'')}" placeholder="questlog:my_quest" /></div>`;
  let e='';
  switch(t){
    case'questlog:stat':e=`<div class="field"><label>Statistic</label><select class="obj-stat">${MC_STATS.map(s=>`<option value="${s}" ${o.stat===s?'selected':''}>${s}</option>`).join('')}</select><input type="text" class="obj-stat-custom" style="margin-top:5px" placeholder="Or custom stat id" value="${o.stat&&!MC_STATS.includes(o.stat)?esc(o.stat):''}" /></div><label class="toggle-label" style="margin-bottom:8px;"><input type="checkbox" class="obj-retro" ${o.retroactive!==false?'checked':''} /> Retroactive</label>${amt(true)}`;break;
    case'questlog:block_mine':case'questlog:block_place':case'questlog:block_interact':e=`<div class="field"><label>Block ID or #tag</label><input type="text" class="obj-block" value="${esc(o.block||'')}" placeholder="minecraft:stone" /></div>${t==='questlog:block_interact'?`<div class="field"><label>Held item — optional</label><input type="text" class="obj-bitem" value="${esc(o.item||'')}" /></div>`:''}${amt(true)}`;break;
    case'questlog:entity_breed':case'questlog:entity_death':case'questlog:entity_kill':case'questlog:entity_tame':case'questlog:entity_approach':e=`<div class="field"><label>Entity ID</label><input type="text" class="obj-entity" value="${esc(o.entity||'')}" placeholder="minecraft:zombie" /></div>${t==='questlog:entity_approach'?`<div class="field"><label>Range (blocks)</label><input type="number" class="obj-range" value="${o.range??5}" /></div>`:''}${amt(true)}`;break;
    case'questlog:item_craft':case'questlog:item_drop':case'questlog:item_obtain':case'questlog:item_use':e=`<div class="field"><label>Item ID or #tag</label><input type="text" class="obj-item" value="${esc(o.item||'')}" placeholder="minecraft:diamond" /></div>${amt(true)}`;break;
    case'questlog:item_equip':e=`<div class="field"><label>Item ID or #tag</label><input type="text" class="obj-item" value="${esc(o.item||'')}" /></div><div class="field"><label>Slot</label><select class="obj-slot">${EQUIP_SLOTS.map(s=>`<option value="${s}" ${(o.slot||'mainhand')===s?'selected':''}>${s}</option>`).join('')}</select></div>${amt(true)}`;break;
    case'questlog:visit_biome':e=`<div class="field"><label>Biome ID</label><input type="text" class="obj-biome" value="${esc(o.biome||'')}" /></div>${amt(true)}`;break;
    case'questlog:visit_dimension':e=`<div class="field"><label>Dimension</label><input type="text" class="obj-dim" value="${esc(o.dimension||'')}" /></div>${amt(true)}`;break;
    case'questlog:visit_structure':e=`<div class="field"><label>Structure</label><input type="text" class="obj-structure" value="${esc(o.structure||'')}" /></div>${amt(true)}`;break;
    case'questlog:visit_position':{const b=o.bounds||{};const fv=v=>v!==undefined&&v!==null?v:'';const aw=(mn,mx,ax)=>{if(mn!=null&&mx!=null){const a=Number(mn),z=Number(mx);if(a>z)return`<div class="msg err" style="margin:3px 0;padding:3px 7px;">⚠ Min ${ax} > Max ${ax}</div>`;if(a===z)return`<div class="msg err" style="margin:3px 0;padding:3px 7px;">⚠ Zero-thickness slice on ${ax}</div>`;}return'';};e=`<div class="hint" style="margin-bottom:7px;">Empty = world extrema. Min Y=500 → trigger at Y ≥ 500.</div><div class="g3"><div><div class="field"><label>Min X</label><input type="number" class="obj-minx" value="${fv(b.minX??b.x1)}" /></div>${aw(b.minX??b.x1,b.maxX??b.x2,'X')}<div class="field"><label>Max X</label><input type="number" class="obj-maxx" value="${fv(b.maxX??b.x2)}" /></div></div><div><div class="field"><label>Min Y</label><input type="number" class="obj-miny" value="${fv(b.minY??b.y1)}" /></div>${aw(b.minY??b.y1,b.maxY??b.y2,'Y')}<div class="field"><label>Max Y</label><input type="number" class="obj-maxy" value="${fv(b.maxY??b.y2)}" /></div></div><div><div class="field"><label>Min Z</label><input type="number" class="obj-minz" value="${fv(b.minZ??b.z1)}" /></div>${aw(b.minZ??b.z1,b.maxZ??b.z2,'Z')}<div class="field"><label>Max Z</label><input type="number" class="obj-maxz" value="${fv(b.maxZ??b.z2)}" /></div></div></div>${amt(true)}`;break;}
    case'questlog:enchant':e=`<div class="field"><label>Enchantment — optional</label><input type="text" class="obj-ench" value="${esc(o.enchantment||'')}" /></div><div class="field"><label>Level — optional</label><input type="number" class="obj-elvl" value="${o.level??''}" /></div><div class="field"><label>Item — optional</label><input type="text" class="obj-item" value="${esc(o.item||'')}" /></div>${amt(true)}`;break;
    case'questlog:effect_added':e=`<div class="field"><label>Effect ID</label><input type="text" class="obj-effect" value="${esc(o.effect||'')}" /></div>${amt(true)}`;break;
    case'questlog:trample':e=amt(true);break;
    case'questlog:quest_complete':e=`<div class="field"><label>Quest ID</label><input type="text" class="obj-quest" value="${esc(o.quest||'')}" /></div>`;break;
    case'questlog:advancement':e=`<div class="field"><label>Advancement ID</label><input type="text" class="obj-adv" value="${esc(o.advancement||'')}" /></div>${amt(true)}`;break;
    default:e=`<div class="field"><label>Extra JSON</label><textarea class="obj-raw">${esc(JSON.stringify(o,null,2))}</textarea></div>`;
  }
  return`${cn}${ci}${e}`;
}

function wrapOC(o,i,isNot){return`<div class="obj-card" data-i="${i}"><div class="card-head"><span class="card-title">${isNot?'Inverted':'Objective #'+(i+1)}</span><div class="card-actions">${oSel(o.type||'questlog:item_obtain')}<button type="button" class="btn btn-sm btn-danger small-rm ${isNot?'hidden':''}">✕</button></div></div><div class="obj-fields">${renderOF(o)}</div></div>`;}

function renderOL(c,arr,k){c.innerHTML=arr.map((o,i)=>wrapOC(o,i)).join('');c.dataset.listKey=k;bindOC(c);}

function bindOC(root){
  root.querySelectorAll('.obj-card').forEach(card=>{
    const ts=card.querySelector(':scope > .card-head .obj-type');if(ts)ts.onchange=()=>{syncQ();renderMain();};
    const rm=card.querySelector(':scope > .card-head .small-rm');if(rm&&!rm.classList.contains('hidden'))rm.onclick=()=>{card.remove();syncQ();refreshJson();};
  });
  root.querySelectorAll('.add-or-child').forEach(btn=>{
    btn.onclick=()=>{const oc=btn.closest('.obj-card');const ts=oc?.querySelector(':scope > .card-head .obj-type');if(!ts||ts.value!=='questlog:or')return;const ok=oc.querySelector('.obj-fields .nested.or-kids');if(!ok)return;const idx=ok.querySelectorAll(':scope > .obj-card').length;ok.insertAdjacentHTML('beforeend',wrapOC({type:'questlog:item_obtain',item:'minecraft:dirt',required_amount:1},idx));bindOC(ok);syncQ();refreshJson();};
  });
}

function qIC(card,sel){for(const el of card.querySelectorAll(sel)){if(el.closest('.obj-card')===card)return el;}return null;}

function readOC(card){
  const type=card.querySelector(':scope > .card-head .obj-type')?.value||'questlog:item_obtain';const o={type};
  const fields=card.querySelector(':scope > .obj-fields');const name=fields?.querySelector('.obj-name')?.value?.trim();if(name)o.name=name;if(fields?.querySelector('.obj-trans')?.checked)o.translatable=true;
  const iv=fields?.querySelector('.obj-icon')?.value?.trim();if(iv){try{o.icon=JSON.parse(iv);}catch{o.icon=iv;}}
  const sA=()=>{const v=qIC(card,'.obj-amt');if(v)o.required_amount=Math.max(1,parseInt(v.value,10)||1);};
  if(type==='questlog:or'){const ob=card.querySelector(':scope > .obj-fields > .nested.or-kids')||card.querySelector('.obj-fields .nested.or-kids');o.objectives=ob?[...ob.querySelectorAll(':scope > .obj-card')].map(c=>readOC(c)):[];return o;}
  if(type==='questlog:not'){const inner=card.querySelector(':scope > .obj-fields > .nested.not-child > .obj-card');o.objective=inner?readOC(inner):{type:'questlog:read'};return o;}
  if(type==='questlog:read'||type==='questlog:unobtainable'){if(type==='questlog:read'){const rq=qIC(card,'.obj-read-quest')?.value?.trim();if(rq)o.quest=rq;}return o;}
  if(objectiveSupportsAmount(type))sA();
  switch(type){
    case'questlog:stat':{const s=qIC(card,'.obj-stat')?.value;const cu=qIC(card,'.obj-stat-custom')?.value?.trim();o.stat=cu||s||'minecraft:walk_one_cm';o.retroactive=!!qIC(card,'.obj-retro')?.checked;break;}
    case'questlog:block_mine':case'questlog:block_place':case'questlog:block_interact':o.block=qIC(card,'.obj-block')?.value?.trim()||'minecraft:stone';if(type==='questlog:block_interact'){const it=qIC(card,'.obj-bitem')?.value?.trim();if(it)o.item=it;}break;
    case'questlog:entity_breed':case'questlog:entity_death':case'questlog:entity_kill':case'questlog:entity_tame':o.entity=qIC(card,'.obj-entity')?.value?.trim()||'minecraft:zombie';break;
    case'questlog:entity_approach':o.entity=qIC(card,'.obj-entity')?.value?.trim()||'minecraft:villager';o.range=parseFloat(qIC(card,'.obj-range')?.value)||5;break;
    case'questlog:item_craft':case'questlog:item_drop':case'questlog:item_obtain':case'questlog:item_use':case'questlog:item_equip':o.item=qIC(card,'.obj-item')?.value?.trim()||'minecraft:dirt';if(type==='questlog:item_equip')o.slot=qIC(card,'.obj-slot')?.value||'mainhand';break;
    case'questlog:visit_biome':o.biome=qIC(card,'.obj-biome')?.value?.trim()||'minecraft:plains';break;
    case'questlog:visit_dimension':o.dimension=qIC(card,'.obj-dim')?.value?.trim()||'minecraft:overworld';break;
    case'questlog:visit_structure':o.structure=qIC(card,'.obj-structure')?.value?.trim()||'minecraft:village';break;
    case'questlog:visit_position':{const pc=cls=>{const el=qIC(card,cls);const v=el?.value?.trim();if(v===''||v===null||v===undefined)return undefined;const n=Number(v);return isNaN(n)?undefined:n;};const b={};const vMX=pc('.obj-minx');if(vMX!==undefined)b.minX=vMX;const vMY=pc('.obj-miny');if(vMY!==undefined)b.minY=vMY;const vMZ=pc('.obj-minz');if(vMZ!==undefined)b.minZ=vMZ;const vXX=pc('.obj-maxx');if(vXX!==undefined)b.maxX=vXX;const vXY=pc('.obj-maxy');if(vXY!==undefined)b.maxY=vXY;const vXZ=pc('.obj-maxz');if(vXZ!==undefined)b.maxZ=vXZ;if(Object.keys(b).length)o.bounds=b;break;}
    case'questlog:enchant':{const en=qIC(card,'.obj-ench')?.value?.trim();if(en)o.enchantment=en;const lv=qIC(card,'.obj-elvl')?.value;if(lv!==''&&lv!=null)o.level=parseInt(lv,10);const its=[...card.querySelectorAll('.obj-item')].filter(el=>el.closest('.obj-card')===card);const last=its[its.length-1]?.value?.trim();if(last)o.item=last;break;}
    case'questlog:effect_added':o.effect=qIC(card,'.obj-effect')?.value?.trim()||'minecraft:regeneration';break;
    case'questlog:trample':break;
    case'questlog:quest_complete':o.quest=qIC(card,'.obj-quest')?.value?.trim()||'questlog:other';break;
    case'questlog:advancement':o.advancement=qIC(card,'.obj-adv')?.value?.trim()||'minecraft:story/root';break;
    default:{const raw=qIC(card,'.obj-raw')?.value;if(raw){try{const p=JSON.parse(raw);Object.assign(o,p);o.type=type;}catch(e){console.warn(e);}}}
  }
  return o;
}
function readOL(root){return[...root.querySelectorAll(':scope > .obj-card')].map(c=>readOC(c));}

// ── Rewards ───────────────────────────────────────────────────────
function renderRC(r,i){
  const t=r.type||'questlog:item';let body='';
  if(t==='questlog:item')body=`<div class="field"><label>Item</label><input type="text" class="rw-item" value="${esc(r.item||'')}" /></div><div class="field"><label>Count</label><input type="number" class="rw-count" min="1" value="${r.count??1}" /></div>`;
  else if(t==='questlog:command')body=`<div class="field"><label>Command</label><input type="text" class="rw-cmd" value="${esc(r.command||'')}" /></div><div class="field"><label>Permission level</label><input type="number" class="rw-plvl" value="${r.permission_level??2}" /></div>`;
  else if(t==='questlog:experience')body=`<div class="field"><label>Amount</label><input type="number" class="rw-xp" value="${r.experience??0}" /></div><label class="toggle-label"><input type="checkbox" class="rw-levels" ${(r.level??r.levels)?'checked':''} /> Grant as levels</label>`;
  else if(t==='questlog:loot_table')body=`<div class="field"><label>Loot table</label><input type="text" class="rw-loot" value="${esc(r.loot_table||'')}" /></div>`;
  return`<div class="rew-card" data-ri="${i}"><div class="card-head"><span class="card-title">Reward #${i+1}</span><div class="card-actions">${rSel(t)}<button type="button" class="btn btn-sm btn-danger small-rm rew-remove">✕</button></div></div><div class="field"><label>Name — optional</label><input type="text" class="rw-name" value="${esc(r.name||'')}" /></div><label class="toggle-label" style="margin-bottom:6px;"><input type="checkbox" class="rw-trans" ${r.translatable?'checked':''} /> Translation key</label><div class="field"><label>Icon</label><input type="text" class="rw-icon" value="${esc(r.icon!=null?(typeof r.icon==='string'?r.icon:JSON.stringify(r.icon)):'')}" /></div><div class="field"><label>Claim sound</label><input type="text" class="rw-sound" value="${esc(r.claim_sound||'')}" /></div><label class="toggle-label" style="margin-bottom:6px;"><input type="checkbox" class="rw-autoclaim" ${r.auto_claim?'checked':''} /> Auto-claim</label>${body}</div>`;
}

// ── Bind dropdowns (insert + format) ─────────────────────────────
function setupDropdowns(){
  // Close all menus on doc click
  document.addEventListener('click',()=>$$('.drop-menu.open').forEach(m=>m.classList.remove('open')));

  // Insert dropdowns
  $$('.drop-wrap').forEach(wrap=>{
    const targetId=wrap.dataset.target;const ta=targetId?document.getElementById(targetId):null;if(!ta)return;
    const trigger=wrap.querySelector('.insert-trigger,.fmt-trigger');const menu=wrap.querySelector('.drop-menu');if(!trigger||!menu)return;
    trigger.onclick=e=>{e.stopPropagation();$$('.drop-menu.open').forEach(m=>{if(m!==menu)m.classList.remove('open');});menu.classList.toggle('open');};
    // Insert templates
    wrap.querySelectorAll('[data-fmt-template]').forEach(btn=>{
      btn.onclick=e=>{e.stopPropagation();menu.classList.remove('open');const tpl=btn.dataset.fmtTemplate;const s=ta.selectionStart??0;const e2=ta.selectionEnd??s;const sel=ta.value.slice(s,e2)||'text';const ins=tpl==='image'?`[${sel}](image:namespace:path)`:tpl==='image-anim'?`[${sel}](image:namespace:path:16:16:8:100)`:`[${sel}](quest:namespace:quest_id)`;ta.setRangeText(ins,s,e2,'end');ta.focus();ta.dispatchEvent(new Event('input',{bubbles:true}));};
    });
    // Format codes
    wrap.querySelectorAll('[data-fmt-code]').forEach(btn=>{
      btn.onclick=e=>{e.stopPropagation();menu.classList.remove('open');const code=btn.dataset.fmtCode;const s=ta.selectionStart??ta.value.length;ta.setRangeText(code,s,s,'end');ta.focus();ta.dispatchEvent(new Event('input',{bubbles:true}));};
    });
  });

  // Collapsible optional descriptions
  $$('.opt-expand').forEach(btn=>{
    btn.onclick=()=>{btn.style.display='none';btn.nextElementSibling?.classList.remove('hidden');const ta=btn.nextElementSibling?.querySelector('textarea');if(ta)ta.focus();setupDropdowns();};
  });
}

// ── Bind quest form ───────────────────────────────────────────────
function bindColorPickers(){
  $$('input[type="color"][data-color-for]').forEach(picker=>{
    const tid=picker.dataset.colorFor;const ti=tid?document.getElementById(tid):null;if(!ti)return;
    picker.oninput=()=>{ti.value=picker.value.toUpperCase();ti.dispatchEvent(new Event('input',{bubbles:true}));};
    ti.addEventListener('input',()=>{picker.value=nhc(ti.value,picker.value);});picker.value=nhc(ti.value,picker.value);
  });
}

function toggR(p){const k=document.querySelector(`[data-r="${p}-kind"]`);if(!k)return;const s=()=>{const v=k.value;document.querySelector(`[data-r="${p}-item"]`).classList.toggle('hidden',v!=='item');document.querySelector(`[data-r="${p}-tex"]`).classList.toggle('hidden',v!=='texture');document.querySelector(`[data-r="${p}-str"]`).classList.toggle('hidden',v!=='stringitem');};k.onchange=s;s();}

function bindQForm(){
  const q=getCD();
  setupDropdowns();bindColorPickers();toggR('icon');
  renderOL($('#reqList'),q.requirements||[],'req');renderOL($('#objList'),q.objectives||[],'obj');renderOL($('#failList'),q.failures||[],'fail');
  const rw=$('#rewList');rw.innerHTML=(q.rewards||[]).map((r,i)=>renderRC(r,i)).join('');
  rw.querySelectorAll('.rew-card').forEach(card=>{
    card.querySelector('.rew-type').onchange=()=>{syncQ();const i=+card.dataset.ri;q.rewards[i]={type:card.querySelector('.rew-type').value};setCD(q);renderMain();};
    card.querySelector('.rew-remove').onclick=()=>{syncQ();q.rewards.splice(+card.dataset.ri,1);setCD(q);renderMain();};
  });
  $('#addReq').onclick=()=>{syncQ();if(!Array.isArray(q.requirements))q.requirements=[];q.requirements.push({type:'questlog:item_obtain',item:'minecraft:dirt',required_amount:1});setCD(q);renderMain();};
  $('#addObj').onclick=()=>{syncQ();if(!Array.isArray(q.objectives))q.objectives=[];q.objectives.push({type:'questlog:item_obtain',item:'minecraft:dirt',required_amount:1});setCD(q);renderMain();};
  $('#addFail').onclick=()=>{syncQ();if(!q.failures)q.failures=[];q.failures.push({type:'questlog:stat',stat:'minecraft:play_time',required_amount:6000,retroactive:false});setCD(q);renderMain();};
  $('#addRew').onclick=()=>{syncQ();if(!Array.isArray(q.rewards))q.rewards=[];q.rewards.push({type:'questlog:item',item:'minecraft:diamond',count:1});setCD(q);renderMain();};
}

function bindChForm(){
  const sync=()=>{
    touchFile('chapter',currentFile);
    const c=getCD();c.name=$('#cf_name').value;c.order=parseInt($('#cf_order').value,10)||0;c.translatable=$('#cf_translatable').checked;c.default_chapter=$('#cf_default_chapter').checked;c.hidden=$('#cf_hidden').checked;
    const k=document.querySelector('[data-r="chicon-kind"]')?.value;if(k==='stringitem'){const v=document.querySelector('[data-r="chicon-strv"]')?.value?.trim();if(v)c.icon=v;else delete c.icon;}else if(k==='item'){const v=document.querySelector('[data-r="chicon-itemv"]')?.value?.trim();if(v)c.icon={item:v};else delete c.icon;}else{const v=document.querySelector('[data-r="chicon-texv"]')?.value?.trim();if(v)c.icon={texture:v};else delete c.icon;}
    trimCh(c);setCD(c);dRefresh();renderFileList();
  };
  $('#cf_name').oninput=sync;['#cf_order','#cf_translatable','#cf_default_chapter','#cf_hidden'].forEach(s=>{const el=$(s);el.oninput=el.onclick=sync;});
  toggR('chicon');const ck=document.querySelector('[data-r="chicon-kind"]');if(ck){const p=ck.onchange;ck.onchange=()=>{if(p)p();sync();};}
  $$('[data-r^="chicon"]').forEach(el=>{el.oninput=sync;});$('#cf_order').onchange=sync;
}

// ── Sync quest ────────────────────────────────────────────────────
function pMJ(text,ae){const t=text.trim();if(!t&&ae)return undefined;if(!t)return'';if(t.startsWith('[')||t.startsWith('{'))try{return JSON.parse(t);}catch{return t;}return t;}
function sOS(obj,k,v){v=v.trim();if(v)obj[k]=v;else delete obj[k];}

function syncQ(){
  if(!currentFile||mode!=='quest'||rawMode)return;
  touchFile('quest',currentFile);
  const q=getCD();
  q.title=$('#qf_title')?.value||'';q.sort_order=parseInt($('#qf_sort_order')?.value,10)||0;q.chapter=$('#qf_chapter')?.value?.trim()||'questlog:main';q.translatable=$('#qf_translatable')?.checked;q.include_in_main=$('#qf_include_in_main')?.checked;q.hidden=$('#qf_hidden')?.checked;
  const dv=$('#qf_description')?.value||'';q.description=pMJ(dv);if(q.description===''||q.description===undefined)delete q.description;
  const dc=$('#qf_description_completed');q.description_completed=dc?pMJ(dc.value,true):undefined;if(q.description_completed===undefined)delete q.description_completed;
  const df=$('#qf_description_failed');q.description_failed=df?pMJ(df.value,true):undefined;if(q.description_failed===undefined)delete q.description_failed;
  const ik=document.querySelector('[data-r="icon-kind"]')?.value;if(ik==='stringitem'){const v=document.querySelector('[data-r="icon-strv"]')?.value?.trim();if(v)q.icon=v;else delete q.icon;}else if(ik==='item'){const v=document.querySelector('[data-r="icon-itemv"]')?.value?.trim();if(v)q.icon={item:v};else delete q.icon;}else{const v=document.querySelector('[data-r="icon-texv"]')?.value?.trim();if(v)q.icon={texture:v};else delete q.icon;}
  q.requirements=readOL($('#reqList'));q.objectives=readOL($('#objList'));const f=readOL($('#failList'));if(f.length)q.failures=f;else delete q.failures;
  q.rewards=[...$('#rewList').querySelectorAll('.rew-card')].map(card=>{const t=card.querySelector('.rew-type').value;const r={type:t};const n=card.querySelector('.rw-name')?.value?.trim();if(n)r.name=n;if(card.querySelector('.rw-trans')?.checked)r.translatable=true;const ic=card.querySelector('.rw-icon')?.value?.trim();if(ic){try{r.icon=JSON.parse(ic);}catch{r.icon=ic;}}const snd=card.querySelector('.rw-sound')?.value?.trim();if(snd)r.claim_sound=snd;if(card.querySelector('.rw-autoclaim')?.checked)r.auto_claim=true;if(t==='questlog:item'){r.item=card.querySelector('.rw-item')?.value?.trim()||'minecraft:stone';r.count=parseInt(card.querySelector('.rw-count')?.value,10)||1;}else if(t==='questlog:command'){r.command=card.querySelector('.rw-cmd')?.value?.trim()||'/say hi';r.permission_level=parseInt(card.querySelector('.rw-plvl')?.value,10)||2;}else if(t==='questlog:experience'){r.experience=parseInt(card.querySelector('.rw-xp')?.value,10)||0;if(card.querySelector('.rw-levels')?.checked)r.level=true;}else if(t==='questlog:loot_table'){r.loot_table=card.querySelector('.rw-loot')?.value?.trim()||'minecraft:chests/spawn_bonus_chest';}return r;});
  const cs=$('#qf_completed_sound')?.value?.trim();if(cs)q.completed_sound=cs;else delete q.completed_sound;const ts=$('#qf_triggered_sound')?.value?.trim();if(ts)q.triggered_sound=ts;else delete q.triggered_sound;
  q.toast_on_unlock=$('#qf_toast_on_unlock')?.checked;q.toast_on_complete=$('#qf_toast_on_complete')?.checked;q.show_popup_on_unlock=$('#qf_show_popup_on_unlock')?.checked;
  sOS(q,'background_texture',$('#qf_background_texture')?.value||'');sOS(q,'right_panel_texture',$('#qf_right_panel_texture')?.value||'');sOS(q,'peripheral_texture',$('#qf_peripheral_texture')?.value||'');sOS(q,'overlay',$('#qf_overlay')?.value||'');
  const ow=$('#qf_overlay_width')?.value;if(ow!==''&&ow!==null&&ow!==undefined)q.overlay_width=parseInt(ow,10);else delete q.overlay_width;const oh=$('#qf_overlay_height')?.value;if(oh!==''&&oh!==null&&oh!==undefined)q.overlay_height=parseInt(oh,10);else delete q.overlay_height;
  q.overlay_x_offset=parseInt($('#qf_overlay_x_offset')?.value,10)||0;q.overlay_y_offset=parseInt($('#qf_overlay_y_offset')?.value,10)||0;q.left_panel_width=parseInt($('#qf_left_panel_width')?.value,10)||275;q.right_panel_width=parseInt($('#qf_right_panel_width')?.value,10)||170;q.panel_height=parseInt($('#qf_panel_height')?.value,10)||166;q.left_panel_x_offset=parseInt($('#qf_left_panel_x_offset')?.value,10)||0;q.left_panel_y_offset=parseInt($('#qf_left_panel_y_offset')?.value,10)||0;q.right_panel_x_offset=parseInt($('#qf_right_panel_x_offset')?.value,10)||0;q.right_panel_y_offset=parseInt($('#qf_right_panel_y_offset')?.value,10)||0;
  q.back_button_text=$('#qf_back_button_text')?.value?.trim()||'gui.back';q.collect_button_text=$('#qf_collect_button_text')?.value?.trim()||'questlog.reward.collect';q.uncollected_text=$('#qf_uncollected_text')?.value?.trim()||'questlog.reward.uncollected';q.collected_text=$('#qf_collected_text')?.value?.trim()||'questlog.reward.collected';
  q.text_color=$('#qf_text_color')?.value?.trim();q.completed_text_color=$('#qf_completed_text_color')?.value?.trim();q.hovered_text_color=$('#qf_hovered_text_color')?.value?.trim();q.title_color=$('#qf_title_color')?.value?.trim();q.progress_text_color=$('#qf_progress_text_color')?.value?.trim();
  const bt=$('#qb_texture')?.value?.trim();if(bt){const[u,v]=($('#qb_uv')?.value||'0,0').split(',').map(x=>parseInt(x.trim(),10)||0);const[w,h]=($('#qb_wh')?.value||'16,16').split(',').map(x=>parseInt(x.trim(),10)||0);const[tw,th]=($('#qb_twh')?.value||'256,256').split(',').map(x=>parseInt(x.trim(),10)||0);q.badge={texture:bt,u,v,width:w||16,height:h||16,texture_width:tw||256,texture_height:th||256,frames:parseInt($('#qb_frames')?.value,10)||1,frame_time:parseInt($('#qb_frame_time')?.value,10)||100};}else delete q.badge;
  trimQ(q);setCD(q);
  if(!isDragging)renderFileList();
  dValidate();
}




// ── Minecraft ID autocomplete ─────────────────────────────────────
function modPackDataCount(pack){
  return ['items','blocks','entities','sounds','biomes'].reduce((sum,key)=>sum+registryRows(pack,key).length,0);
}
function registryRows(pack,kind){
  const rows=pack?.[kind];
  if(Array.isArray(rows))return rows;
  return rows&&typeof rows==='object'&&rows.id?[rows]:[];
}
function modPackSupportsTarget(pack,target=modSuggestionTarget){
  return Array.isArray(pack?.supportedVersions)&&pack.supportedVersions.includes(target);
}
function activeModPacks(){
  const packs = Array.isArray(window.MOD_ID_PACKS?.packs) ? window.MOD_ID_PACKS.packs : [];
  return packs.filter(pack=>enabledModSuggestions.has(pack.id)&&modPackSupportsTarget(pack)&&modPackDataCount(pack)>0);
}
function saveEnabledModSuggestions(){
  localStorage.setItem(MOD_SUGGESTION_ENABLED_KEY,JSON.stringify([...enabledModSuggestions]));
}
function buildKnownIds(){
  const d = window.MC_ID_DATA || {items:[],blocks:[],entities:[],biomes:[]};
  const modPacks = activeModPacks();
  const modRows = kind => modPacks.flatMap(pack => {
    const rows = registryRows(pack,kind);
    return rows.map(row => ({
      id: row.id,
      name: row.name ? `${row.name} · ${pack.name || pack.id || 'Mod pack'}` : pack.name || pack.id || ''
    }));
  });
  const mergeRows = (...lists) => {
    const seen = new Set();
    const out = [];
    for (const list of lists) for (const row of list || []) {
      if(!row?.id || seen.has(row.id)) continue;
      seen.add(row.id);
      out.push(row);
    }
    return out;
  };
  const soundRows=(window.MC_SOUND_IDS||[]).map(id=>({id,name:id.replace(/^minecraft:/,'')}));
  const byKind = {
    item: mergeRows(d.items, modRows('items')),
    block: mergeRows(d.blocks, modRows('blocks')),
    entity: mergeRows(d.entities, modRows('entities')),
    sound: mergeRows(soundRows, modRows('sounds')),
    biome: mergeRows(d.biomes, modRows('biomes'))
  };
  return {
    data: byKind,
    sets: {
      item: new Set((byKind.item||[]).map(x=>x.id)),
      block: new Set((byKind.block||[]).map(x=>x.id)),
      entity: new Set((byKind.entity||[]).map(x=>x.id)),
      sound: new Set((byKind.sound||[]).map(x=>x.id)),
      biome: new Set((byKind.biome||[]).map(x=>x.id))
    }
  };
}
let VANILLA_IDS = buildKnownIds();
function refreshKnownIds(){
  VANILLA_IDS=buildKnownIds();
  if(acInput)showAc(acInput);
}
let acBox=null, acInput=null;
function acKindForInput(el){
  if(!el || el.tagName!=='INPUT' || el.type!=='text')return null;
  if(el.matches('#qf_completed_sound,#qf_triggered_sound,.rw-sound'))return 'sound';
  if(el.matches('.obj-block'))return 'block';
  if(el.matches('.obj-entity'))return 'entity';
  if(el.matches('.obj-biome'))return 'biome';
  if(el.matches('.obj-item,.obj-bitem,.rw-item,.obj-icon,.rw-icon'))return 'item';
  const r=el.getAttribute('data-r')||'';
  if(/(?:^|-)itemv$|(?:^|-)strv$/.test(r))return 'item';
  return null;
}
function acLabel(x){return x.name && x.name!==x.id ? `${x.id} — ${x.name}` : x.id;}
function acFilter(kind,q){
  const all=VANILLA_IDS.data[kind]||[];
  let raw=String(q||'').trim().toLowerCase();
  if(!raw || raw.startsWith('#'))return [];
  const namespaced=raw.includes(':');
  const short=namespaced?raw.split(':').pop():raw.replace(/^minecraft:/,'');
  const full=namespaced?raw:'minecraft:'+short;
  const starts=[], contains=[];
  for(const x of all){
    const id=x.id.toLowerCase();
    const name=String(x.name||'').toLowerCase();
    const noNs=id.replace(/^[^:]+:/,'');
    if(id.startsWith(full) || (!namespaced&&noNs.startsWith(short)))starts.push(x);
    else if(id.includes(raw) || (!namespaced&&noNs.includes(short)) || name.includes(raw))contains.push(x);
    if(starts.length+contains.length>=80)break;
  }
  return starts.concat(contains).slice(0,80);
}
function ensureAcBox(){
  if(acBox)return acBox;
  acBox=document.createElement('div');
  acBox.className='mc-ac hidden';
  document.body.appendChild(acBox);
  return acBox;
}
function hideAc(){if(acBox)acBox.classList.add('hidden');acInput=null;}
function positionAc(){
  if(!acBox||!acInput||acBox.classList.contains('hidden'))return;
  if(!document.body.contains(acInput)){hideAc();return;}
  const r=acInput.getBoundingClientRect();
  acBox.style.left=Math.round(Math.max(6,Math.min(r.left,window.innerWidth-240)))+'px';
  acBox.style.top=Math.round(Math.min(r.bottom+3,window.innerHeight-90))+'px';
  acBox.style.width=Math.max(240,Math.round(r.width))+'px';
}
function showAc(input){
  const kind=acKindForInput(input);if(!kind)return hideAc();
  const rows=acFilter(kind,input.value);
  const box=ensureAcBox();
  if(!rows.length){hideAc();return;}
  box.innerHTML=`<div class="mc-ac-head">Known ${kind} IDs</div>`+rows.map(x=>`<button type="button" class="mc-ac-row" data-id="${esc(x.id)}"><span>${esc(x.id)}</span>${x.name?`<small>${esc(x.name)}</small>`:''}</button>`).join('');
  $$('.mc-ac-row',box).forEach(btn=>{
    btn.onmousedown=e=>{
      e.preventDefault();
      input.value=btn.dataset.id;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));
      hideAc();
    };
  });
  acInput=input;box.classList.remove('hidden');positionAc();
}
document.addEventListener('focusin',e=>{if(acKindForInput(e.target))setTimeout(()=>showAc(e.target),0);});
document.addEventListener('input',e=>{if(acKindForInput(e.target))showAc(e.target);});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideAc();});
document.addEventListener('mousedown',e=>{if(acBox&&!acBox.contains(e.target)&&e.target!==acInput)hideAc();});
ensureAcBox().addEventListener('mousedown',e=>e.stopPropagation());
ensureAcBox().addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
window.addEventListener('resize',()=>{if(acInput)positionAc();});
window.addEventListener('scroll',()=>{if(acInput)positionAc();},true);

// ── Validation ───────────────────────────────────────────────────
const RESOURCE_ID=/^[a-z0-9_.-]+:[a-z0-9_./-]+$/;
const TAG_ID=/^#[a-z0-9_.-]+:[a-z0-9_./-]+$/;
const FILE_SAFE=/^[a-z0-9_./-]+\.json$/;
const HEX_COLOR=/^#[0-9a-fA-F]{6}$/;
const QUESTLOG_SCHEMA_SOURCE={
  label:'Questlog docs/source',
  branch:'1.20.1 docs branch',
  checked:'2026-05-16',
  docs:'https://github.com/infernalstudios/Questlog/tree/1.20.1/docs/questlog',
  examples:'https://github.com/infernalstudios/Questlog/tree/1.20.1/examples/questlog',
  wiki:'https://moddedmc.wiki/en/project/questlog/latest/docs'
};

function questIdFromFile(fn,ns=getNs()){return `${ns||'questlog'}:${String(fn||'').replace(/\.json$/i,'')}`;}
function chapterIdFromFile(fn,ns=getNs()){return `${ns||'questlog'}:${String(fn||'').replace(/\.json$/i,'')}`;}
function isRes(v,tag){if(typeof v!=='string')return false;const x=v.trim();return tag?(RESOURCE_ID.test(x)||TAG_ID.test(x)):RESOURCE_ID.test(x);}
function addIssue(out,level,file,kind,path,msg){out.push({level,file,kind,path,msg});}
function addMissing(out,file,kind,path,msg){addIssue(out,'missing',file,kind,path,msg);}
function vanillaStatus(kind,val){
  if(typeof val!=='string')return null;
  const x=val.trim();
  if(!x || x.startsWith('#'))return null;
  if(!x.startsWith('minecraft:'))return null;
  const set=VANILLA_IDS.sets[kind];
  if(!set || !set.size)return null;
  return set.has(x);
}
function cleanPath(base,idx,field){let p=base;if(idx!==undefined&&idx!==null)p+=`[${idx}]`;if(field)p+=`.`+field;return p;}
function normalizeRefCandidates(ref){
  if(!ref||typeof ref!=='string')return [];
  const ns=getNs()||'questlog';
  if(ref.includes(':'))return [ref];
  return [`${ns}:${ref}`,`questlog:${ref}`];
}
function objTargetField(type){
  if(['questlog:block_mine','questlog:block_place','questlog:block_interact'].includes(type))return 'block';
  if(['questlog:entity_breed','questlog:entity_death','questlog:entity_kill','questlog:entity_tame','questlog:entity_approach'].includes(type))return 'entity';
  if(['questlog:item_craft','questlog:item_drop','questlog:item_obtain','questlog:item_use','questlog:item_equip'].includes(type))return 'item';
  if(type==='questlog:visit_biome')return 'biome';
  if(type==='questlog:visit_dimension')return 'dimension';
  if(type==='questlog:visit_structure')return 'structure';
  if(type==='questlog:effect_added')return 'effect';
  if(type==='questlog:advancement')return 'advancement';
  if(type==='questlog:quest_complete'||type==='questlog:read')return 'quest';
  if(type==='questlog:stat')return 'stat';
  return null;
}

function validateObjective(o,out,file,kind,path,questIds,depth=0){
  if(!o||typeof o!=='object'){addIssue(out,'error',file,kind,path,'This entry is broken. Delete it or rebuild it from the visual editor.');return;}
  const t=o.type||'';
  if(!t)addMissing(out,file,kind,path+'.type','Choose what this objective should track.');
  else if(!OBJ_TYPES.includes(t))addIssue(out,'error',file,kind,path+'.type',`Unknown objective type: ${t}`);
  if(depth>8)addIssue(out,'error',file,kind,path,'Nested objective depth is very high. This may break editing or loading.');
  const amt=o.required_amount;
  if(amt!==undefined&&!objectiveSupportsAmount(t))addIssue(out,'warn',file,kind,path+'.required_amount',`${t} does not use required_amount; export will remove it.`);
  else if(amt!==undefined&&(!Number.isFinite(Number(amt))||Number(amt)<1))addIssue(out,'error',file,kind,path+'.required_amount','Required amount must be 1 or higher.');

  if(t==='questlog:or'){
    if(!Array.isArray(o.objectives)||!o.objectives.length)addMissing(out,file,kind,path+'.objectives','Add at least one option inside this OR group.');
    (o.objectives||[]).forEach((c,i)=>validateObjective(c,out,file,kind,cleanPath(path+'.objectives',i),questIds,depth+1));
    return;
  }
  if(t==='questlog:not'){
    if(!o.objective)addMissing(out,file,kind,path+'.objective','Add the objective that should be inverted.');
    else validateObjective(o.objective,out,file,kind,path+'.objective',questIds,depth+1);
    return;
  }
  if(t==='questlog:unobtainable')return;

  const fld=objTargetField(t);
  if(fld){
    const val=o[fld];
    if(!val)addMissing(out,file,kind,path+'.'+fld,`Add a ${fld} ID.`);
    else if(['item','block','entity','biome'].includes(fld)){
      const st=vanillaStatus(fld,val);
      if(st===false)addIssue(out,'error',file,kind,path+'.'+fld,`Unknown vanilla ${fld} ID: ${val}`);
    }
  }
  if(t==='questlog:quest_complete'||t==='questlog:read'){
    const ref=o.quest;
    if(ref&&!normalizeRefCandidates(ref).some(x=>questIds.has(x)))addIssue(out,'warn',file,kind,path+'.quest',`Quest reference does not match an existing quest: ${ref}`);
  }
  if(t==='questlog:item_equip'&&o.slot&&!EQUIP_SLOTS.includes(o.slot))addIssue(out,'warn',file,kind,path+'.slot',`Unknown equipment slot: ${o.slot}`);
  if(t==='questlog:entity_approach'&&o.range!==undefined&&Number(o.range)<=0)addIssue(out,'error',file,kind,path+'.range','Range must be greater than 0.');
  if(t==='questlog:visit_position'){
    const b=o.bounds||{};nvb(b);
    ['X','Y','Z'].forEach(ax=>{
      const mn=b['min'+ax], mx=b['max'+ax];
      if(mn!==undefined&&mx!==undefined){
        if(Number(mn)>Number(mx))addIssue(out,'error',file,kind,path+`.bounds`, `Min ${ax} is greater than Max ${ax}.`);
        else if(Number(mn)===Number(mx))addIssue(out,'warn',file,kind,path+`.bounds`, `Min ${ax} equals Max ${ax}; this creates a zero-thickness slice.`);
      }
    });
  }
}

function validateReward(r,out,file,kind,path){
  if(!r||typeof r!=='object'){addIssue(out,'error',file,kind,path,'This reward is broken. Delete it or rebuild it from the visual editor.');return;}
  const t=r.type||'';
  if(!t)addMissing(out,file,kind,path+'.type','Choose what kind of reward this should be.');
  else if(!REW_TYPES.includes(t))addIssue(out,'error',file,kind,path+'.type',`Unknown reward type: ${t}`);
  const rs=vanillaStatus('sound',r.claim_sound);if(rs===false)addIssue(out,'error',file,kind,path+'.claim_sound',`Unknown vanilla sound ID: ${r.claim_sound}`);
  if(t==='questlog:item'){
    if(!r.item)addMissing(out,file,kind,path+'.item','Add the item to give as this reward.');
    else { const st=vanillaStatus('item',r.item); if(st===false)addIssue(out,'error',file,kind,path+'.item',`Unknown vanilla item ID: ${r.item}`); }
    if(r.count!==undefined&&Number(r.count)<1)addIssue(out,'error',file,kind,path+'.count','Item count must be 1 or higher.');
  }else if(t==='questlog:command'){
    if(!r.command)addMissing(out,file,kind,path+'.command','Add the command this reward should run.');
    if(r.permission_level!==undefined&&(Number(r.permission_level)<0||Number(r.permission_level)>4))addIssue(out,'warn',file,kind,path+'.permission_level','Permission level is usually 0 through 4.');
  }else if(t==='questlog:experience'){
    if(r.experience===undefined)addMissing(out,file,kind,path+'.experience','Add how much XP this reward should give.');
    else if(Number(r.experience)<=0)addIssue(out,'warn',file,kind,path+'.experience','Experience amount is 0 or negative.');
  }else if(t==='questlog:loot_table'){
    if(!r.loot_table)addMissing(out,file,kind,path+'.loot_table','Add the loot table this reward should use.');
    else if(!isRes(r.loot_table,false))addIssue(out,'warn',file,kind,path+'.loot_table','Loot table should look like namespace:path.');
  }
}

function validateQuest(fn,q,out,questIds,chapterIds){
  const kind='quest';
  if(!FILE_SAFE.test(fn))addIssue(out,'warn',fn,kind,'file','Filename should be lowercase and use only letters, numbers, _, -, /, and .json.');
  if(!q||typeof q!=='object'){addIssue(out,'error',fn,kind,'root','Quest JSON must be an object.');return;}
  if(!q.title||!String(q.title).trim())addMissing(out,fn,kind,'title','Add a quest title.');
  if(q.requirements!==undefined&&!Array.isArray(q.requirements))addIssue(out,'error',fn,kind,'requirements','Requirements are damaged. Use the visual editor to rebuild this section.');
  if(q.objectives!==undefined&&!Array.isArray(q.objectives))addIssue(out,'error',fn,kind,'objectives','Objectives are damaged. Use the visual editor to rebuild this section.');
  if(q.rewards!==undefined&&!Array.isArray(q.rewards))addIssue(out,'error',fn,kind,'rewards','Rewards are damaged. Use the visual editor to rebuild this section.');
  if(!Array.isArray(q.objectives)||!q.objectives.length)addMissing(out,fn,kind,'objectives','Add at least one objective so the player has something to complete.');
  
  if(Array.isArray(q.requirements)&&q.requirements.length&&q.hidden===true)addIssue(out,'warn',fn,kind,'hidden','Hidden is true. Requirements already lock quests; hidden can keep it suppressed even when unlocked.');
  const ch=q.chapter;
  if(ch&&ch!=='questlog:main'&&ch!=='main'){
    if(!chapterIds.has(ch))addIssue(out,'warn',fn,kind,'chapter',`Chapter does not match an existing chapter file: ${ch}`);
  }
  const colors=['text_color','completed_text_color','hovered_text_color','title_color','progress_text_color'];
  colors.forEach(c=>{if(q[c]&&!HEX_COLOR.test(q[c]))addIssue(out,'warn',fn,kind,c,`${c} should be a #RRGGBB hex color.`);});
  (q.requirements||[]).forEach((o,i)=>validateObjective(o,out,fn,kind,cleanPath('requirements',i),questIds));
  (q.objectives||[]).forEach((o,i)=>validateObjective(o,out,fn,kind,cleanPath('objectives',i),questIds));
  (q.failures||[]).forEach((o,i)=>validateObjective(o,out,fn,kind,cleanPath('failures',i),questIds));
  (q.rewards||[]).forEach((r,i)=>validateReward(r,out,fn,kind,cleanPath('rewards',i)));
  ['completed_sound','triggered_sound'].forEach(sk=>{const st=vanillaStatus('sound',q[sk]);if(st===false)addIssue(out,'error',fn,kind,sk,`Unknown vanilla sound ID: ${q[sk]}`);});
}

function validateChapter(fn,c,out){
  const kind='chapter';
  if(!FILE_SAFE.test(fn))addIssue(out,'warn',fn,kind,'file','Filename should be lowercase and use only letters, numbers, _, -, /, and .json.');
  if(!c||typeof c!=='object'){addIssue(out,'error',fn,kind,'root','Chapter JSON must be an object.');return;}
  if(!c.name||!String(c.name).trim())addMissing(out,fn,kind,'name','Add a chapter display name.');
  if(c.order!==undefined&&!Number.isFinite(Number(c.order)))addIssue(out,'error',fn,kind,'order','Chapter order must be a number.');
}

function validateAll(currentOnly){
  const out=[];
  const ns=getNs()||'questlog';
  const questIds=new Set();
  Object.keys(quests).forEach(fn=>{const base=fn.replace(/\.json$/i,'');questIds.add(`${ns}:${base}`);questIds.add(`questlog:${base}`);});
  const chapterIds=new Set(['questlog:main','main']);
  Object.keys(chapters).forEach(fn=>{const base=fn.replace(/\.json$/i,'');chapterIds.add(`${ns}:${base}`);chapterIds.add(`questlog:${base}`);});
  const runQuest=(fn)=>validateQuest(fn,quests[fn],out,questIds,chapterIds);
  const runChapter=(fn)=>validateChapter(fn,chapters[fn],out);
  if(currentOnly&&currentFile){mode==='quest'?runQuest(currentFile):runChapter(currentFile);}
  else{Object.keys(chapters).sort().forEach(runChapter);Object.keys(quests).sort().forEach(runQuest);}
  return out;
}

function panelForIssue(issue){
  if(issue.kind==='chapter')return null;
  const p=issue.path||'';
  if(/^(requirements|objectives|failures|rewards)/.test(p))return 'progress';
  if(/sound|toast|popup/.test(p))return 'sounds';
  if(/texture|overlay|panel_/.test(p))return 'layout';
  if(/text_color|button_text|collected_text|uncollected_text|progress_text_color/.test(p))return 'labels';
  if(/^badge/.test(p))return 'badge';
  return 'display';
}
function targetForIssue(issue){
  const p=issue.path||'';
  if(issue.kind==='chapter'){
    const map={name:'#cf_name',order:'#cf_order'};
    return $(map[p])?.closest('.field')||$('#panelForm');
  }
  const direct={
    title:'#qf_title',sort_order:'#qf_sort_order',chapter:'#qf_chapter',hidden:'#qf_hidden',
    completed_sound:'#qf_completed_sound',triggered_sound:'#qf_triggered_sound',
    text_color:'#qf_text_color',completed_text_color:'#qf_completed_text_color',
    hovered_text_color:'#qf_hovered_text_color',title_color:'#qf_title_color',
    progress_text_color:'#qf_progress_text_color'
  };
  if(direct[p])return $(direct[p])?.closest('.field,.toggle-label')||$(direct[p]);
  const listMatch=p.match(/^(requirements|objectives|failures|rewards)\[(\d+)\](?:\.(\w+))?/);
  if(listMatch){
    const root={requirements:'#reqList',objectives:'#objList',failures:'#failList',rewards:'#rewList'}[listMatch[1]];
    const card=$(root)?.querySelector(`:scope > .${listMatch[1]==='rewards'?'rew':'obj'}-card[data-${listMatch[1]==='rewards'?'ri':'i'}="${listMatch[2]}"]`);
    if(!card)return $(root);
    const field=listMatch[3]||'';
    const cls={
      type:'.obj-type,.rew-type',name:'.obj-name,.rw-name',required_amount:'.obj-amt',
      item:'.obj-item,.rw-item',block:'.obj-block',entity:'.obj-entity',quest:'.obj-quest,.obj-read-quest',
      advancement:'.obj-adv',claim_sound:'.rw-sound',count:'.rw-count',command:'.rw-cmd',
      experience:'.rw-xp',loot_table:'.rw-loot',permission_level:'.rw-plvl'
    }[field];
    const el=cls?card.querySelector(cls):null;
    return el?.closest('.field,.card-head')||card;
  }
  return $('#panelForm');
}
function jumpToIssue(issue){
  const panel=panelForIssue(issue);
  if(panel)setTab(panel);
  selectFile(issue.file,issue.kind,panel);
  setTimeout(()=>{
    const target=targetForIssue(issue);if(!target)return;
    $$('.validation-highlight').forEach(el=>el.classList.remove('validation-highlight'));
    target.classList.add('validation-highlight');
    target.scrollIntoView({behavior:'smooth',block:'center'});
    const input=target.matches('input,textarea,select')?target:target.querySelector('input,textarea,select');
    input?.focus?.({preventScroll:true});
    showMsg('Jumped to validation issue.',true);
    setTimeout(()=>target.classList.remove('validation-highlight'),3600);
  },60);
}

function renderValidation(){
  const list=$('#validationList'),badge=$('#validationBadge');if(!list||!badge)return;
  const project=$('#validateProject')?.checked!==false;
  const issues=validateAll(!project);
  const missing=issues.filter(i=>i.level==='missing').length;
  const errors=issues.filter(i=>i.level==='error').length;
  const warns=issues.filter(i=>i.level==='warn').length;
  badge.className='validation-badge '+(errors?'err':missing?'missing':warns?'warn':'ok');
  const parts=[]; if(missing)parts.push(`${missing} missing`); if(errors)parts.push(`${errors} error${errors===1?'':'s'}`); if(warns)parts.push(`${warns} warning${warns===1?'':'s'}`);
  badge.textContent=parts.length?parts.join(' · '):'No issues';
  if(!issues.length){list.innerHTML=`<div class="validation-empty">No problems found. Clean JSON, tidy satchel. ✨</div>`;return;}
  const order={missing:0,error:1,warn:2,info:3};
  const sorted=[...issues].sort((a,b)=>(order[a.level]??9)-(order[b.level]??9)||String(a.file).localeCompare(String(b.file)));
  list.innerHTML=sorted.slice(0,100).map((i,idx)=>`<div class="validation-issue ${i.level}" data-issue-index="${idx}" data-file="${esc(i.file)}" data-kind="${esc(i.kind)}" data-path="${esc(i.path)}" data-tip="Click to jump to this warning in the editor."><div class="validation-issue-top"><span class="validation-sev">${esc(i.level)}</span><span class="validation-file">${esc(i.file)}</span><span class="validation-path">${esc(i.path)}</span></div><div class="validation-msg">${esc(i.msg)}</div></div>`).join('')+(sorted.length>100?`<div class="validation-empty">${sorted.length-100} more issues hidden.</div>`:'');
  $$('.validation-issue',list).forEach(el=>{el.onclick=()=>jumpToIssue(sorted[Number(el.dataset.issueIndex)]);});
}
const dValidate=debounce(renderValidation,220);

function renderProjectStatusMini(){
  const el=$('#projectStatusMini');if(!el)return;
  const issues=validateAll(false);
  const problemCount=issues.filter(i=>i.level==='missing'||i.level==='error'||i.level==='warn').length;
  const unbound=Object.keys(quests).filter(q=>!questBoundCh(q)).length;
  el.innerHTML=[
    `<span>${Object.keys(quests).length} quests</span>`,
    `<span>${Object.keys(chapters).length} chapters</span>`,
    `<span>${problemCount} warnings</span>`,
    `<span>${unbound} unbound</span>`
  ].join('');
}

function openBulkDeleteModal(){closeSidebarMenus();renderBulkDeleteList();$('#bulkDeleteModal')?.classList.add('open');}
function closeBulkDeleteModal(){$('#bulkDeleteModal')?.classList.remove('open');}
function eachObjectiveRef(o){if(!o||typeof o!=='object')return 0;let c=0;if((o.type==='questlog:quest_complete'||o.type==='questlog:read')&&typeof o.quest==='string')c++;if(Array.isArray(o.objectives))o.objectives.forEach(x=>{c+=eachObjectiveRef(x);});if(o.objective)c+=eachObjectiveRef(o.objective);return c;}
function namespaceMigrationStats(from,to){
  const prefix=`${from}:`;let questRefs=0,chapterRefs=0,fileIds=Object.keys(quests).length+Object.keys(chapters).length;
  Object.values(quests).forEach(q=>{if(typeof q.chapter==='string'&&q.chapter.startsWith(prefix))chapterRefs++;[...(q.requirements||[]),...(q.objectives||[]),...(q.failures||[])].forEach(o=>{questRefs+=eachObjectiveRef(o);});});
  return {from,to,fileIds,questRefs,chapterRefs};
}
function renderNamespacePreview(){
  const box=$('#namespaceMigrationPreview');if(!box)return;
  const from=($('#namespaceMigrateFrom')?.value||'').trim(),to=($('#namespaceMigrateTo')?.value||'').trim();
  if(!from||!to){box.innerHTML='<div>Add both namespaces to preview changes.</div>';return;}
  const s=namespaceMigrationStats(from,to);
  box.innerHTML=`<div><strong>${esc(from)}</strong> -> <strong>${esc(to)}</strong></div><div>${s.fileIds} file IDs will use the new namespace through the namespace box.</div><div>${s.chapterRefs} quest chapter reference${s.chapterRefs===1?'':'s'} will be rewritten.</div><div>Quest requirement/objective references using ${esc(from)} will be rewritten where found.</div>`;
}
function migrateObjectiveNamespace(o,from,to){
  if(!o||typeof o!=='object')return 0;let changed=0;const prefix=`${from}:`;
  if((o.type==='questlog:quest_complete'||o.type==='questlog:read')&&typeof o.quest==='string'&&o.quest.startsWith(prefix)){o.quest=`${to}:${o.quest.slice(prefix.length)}`;changed++;}
  if(Array.isArray(o.objectives))o.objectives.forEach(x=>{changed+=migrateObjectiveNamespace(x,from,to);});
  if(o.objective)changed+=migrateObjectiveNamespace(o.objective,from,to);
  return changed;
}
function applyNamespaceMigration(){
  const from=($('#namespaceMigrateFrom')?.value||'').trim(),to=($('#namespaceMigrateTo')?.value||'').trim();
  if(!from||!to||from===to){showMsg('Choose two different namespaces.',false);return;}
  if(!RESOURCE_ID.test(`${to}:dummy`)){showMsg('New namespace should use lowercase letters, numbers, _, -, or dots.',false);return;}
  pushHistorySnapshot();
  let changed=0;const prefix=`${from}:`;
  Object.entries(quests).forEach(([fn,q])=>{if(typeof q.chapter==='string'&&q.chapter.startsWith(prefix)){q.chapter=`${to}:${q.chapter.slice(prefix.length)}`;changed++;touchFile('quest',fn);}[...(q.requirements||[]),...(q.objectives||[]),...(q.failures||[])].forEach(o=>{const c=migrateObjectiveNamespace(o,from,to);if(c){changed+=c;touchFile('quest',fn);}});});
  if($('#defaultNs'))$('#defaultNs').value=to;
  recordActivity('Updated namespace refs','project','',`${from} to ${to}`);
  renderFileList();renderMain();renderValidation();renderNamespacePreview();scheduleAutosave();
  showMsg(`Updated namespace references: ${changed} change${changed===1?'':'s'}.`,true);
}
function renderBulkDeleteList(){
  const list=$('#bulkDeleteList');if(!list)return;
  const rows=[...Object.keys(chapters).sort().map(n=>['chapter',n]),...Object.keys(quests).sort().map(n=>['quest',n])];
  list.innerHTML=rows.map(([kind,name])=>`<label class="tool-list-item"><input type="checkbox" data-kind="${kind}" data-file="${esc(name)}"><span>${kind==='chapter'?'Chapter':'Quest'}: ${esc(name.replace(/\.json$/i,''))}</span><span class="tool-meta">${kind}</span></label>`).join('')||'<div class="validation-empty">No files to delete.</div>';
  $$('#bulkDeleteList input[type="checkbox"]').forEach(i=>i.onchange=updateBulkDeleteCount);
  updateBulkDeleteCount();
}
function updateBulkDeleteCount(){const n=$$('#bulkDeleteList input[type="checkbox"]:checked').length;const el=$('#bulkDeleteCount');if(el)el.textContent=`${n} selected`;}
function selectUnboundForDelete(){$$('#bulkDeleteList input[type="checkbox"]').forEach(i=>{i.checked=i.dataset.kind==='quest'&&!questBoundCh(i.dataset.file);});updateBulkDeleteCount();}
function bulkDeleteSelected(){
  const selected=$$('#bulkDeleteList input[type="checkbox"]:checked').map(i=>({kind:i.dataset.kind,file:i.dataset.file}));
  if(!selected.length){showMsg('Select at least one file to delete.',false);return;}
  openConfirmModal({
    title:`Delete ${selected.length} selected file${selected.length===1?'':'s'}?`,
    copy:'This removes the selected quests/chapters from this browser project. Use undo if you clicked the wrong thing.',
    button:'Delete selected',
    onConfirm:()=>{
      pushHistorySnapshot();
      selected.forEach(({kind,file})=>{if(kind==='quest'){delete quests[file];delete fileMeta[metaKey('quest',file)];}else{delete chapters[file];delete fileMeta[metaKey('chapter',file)];}if(currentFile===file&&mode===kind)currentFile=null;});
      if(!currentFile){const q=Object.keys(quests).sort()[0],c=Object.keys(chapters).sort()[0];if(q){mode='quest';currentFile=q;}else if(c){mode='chapter';currentFile=c;}}
      recordActivity('Bulk deleted','project','',`${selected.length} files`);
      closeBulkDeleteModal();
      renderFileList();renderMain();renderValidation();scheduleAutosave();
      showMsg(`Deleted ${selected.length} file${selected.length===1?'':'s'}.`,true);
    }
  });
}

// ── Events ────────────────────────────────────────────────────────
function closeSidebarMenus(except=null){
  $$('.sidebar-menu.open').forEach(m=>{if(m!==except)m.classList.remove('open');});
}
function toggleSidebarMenu(buttonId,menuId){
  const btn=$(buttonId),menu=$(menuId);
  if(!btn||!menu)return;
  btn.onclick=e=>{
    e.stopPropagation();
    closeSettingsMenu();
    const open=!menu.classList.contains('open');
    closeSidebarMenus(menu);
    menu.classList.toggle('open',open);
  };
  menu.addEventListener('click',e=>{
    if(e.target.closest('button'))closeSidebarMenus();
  });
}
toggleSidebarMenu('#btnAddMenu','#addMenu');
toggleSidebarMenu('#btnImportExportMenu','#importExportMenu');
document.addEventListener('click',()=>closeSidebarMenus());
function closeSettingsMenu(){
  $('#settingsMenu')?.classList.remove('open');
}
function setupSettingsMenu(){
  const btn=$('#btnSettings'),menu=$('#settingsMenu');
  if(!btn||!menu)return;
  const versionPill=$('#versionPill');
  if(versionPill)versionPill.textContent=`v${APP_VERSION}`;
  const autosaveBox=$('#autosaveToggle');
  if(autosaveBox)autosaveBox.checked=autosaveEnabled;
  const tooltipBox=$('#tooltipsToggle');
  if(tooltipBox)tooltipBox.checked=tooltipsEnabled;
  updateUiSoundControls();
  renderModSupportControls();
  btn.onclick=e=>{
    e.stopPropagation();
    closeSidebarMenus();
    renderProjectStatusMini();
    menu.classList.toggle('open');
  };
  menu.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',closeSettingsMenu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSettingsMenu();closeChangelogModal();closeTutorialPrompt();closeConfirmModal();closeBulkDeleteModal();closePersonalizationModal(false);}});
}
function setupSidebarResize(){
  const app=$('.app-body'),handle=$('#sidebarResizer');if(!app||!handle)return;
  const clamp=n=>Math.max(210,Math.min(360,Math.round(n)));
  const apply=n=>app.style.setProperty('--sidebar-width',`${clamp(n)}px`);
  const saved=parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY),10);
  apply(Number.isFinite(saved)?saved:240);
  let dragging=false;
  handle.addEventListener('pointerdown',e=>{
    dragging=true;
    handle.classList.add('dragging');
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });
  window.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const left=app.getBoundingClientRect().left;
    apply(e.clientX-left);
  });
  window.addEventListener('pointerup',e=>{
    if(!dragging)return;
    dragging=false;
    handle.classList.remove('dragging');
    handle.releasePointerCapture?.(e.pointerId);
    const width=parseInt(getComputedStyle(app).getPropertyValue('--sidebar-width'),10);
    if(Number.isFinite(width))localStorage.setItem(SIDEBAR_WIDTH_KEY,String(width));
  });
}
setupSettingsMenu();
setupUiSoundEvents();
setupHelpInteractions();
setupSidebarResize();
applyPersonalization(loadPersonalization());

onClick('#btnNewQuest',()=>{let b='new_quest',n=`${b}.json`,i=1;while(quests[n])n=`${b}_${i++}.json`;quests[n]=defQ();touchFile('quest',n);recordActivity('Created','quest',n);selectFile(n,'quest');});
onClick('#btnNewChapter',()=>{let b='new_chapter',n=`${b}.json`,i=1;while(chapters[n])n=`${b}_${i++}.json`;chapters[n]=defC();touchFile('chapter',n);recordActivity('Created','chapter',n);selectFile(n,'chapter');});
onEvent('#questListSort','change',e=>setListSort(e.target.value));
onEvent('#questSearch','input',e=>setQuestSearch(e.target.value));
onClick('#btnPickImport',()=>$('#fileImport')?.click());
const fileImportEl=$('#fileImport');
if(fileImportEl)fileImportEl.onchange=async e=>{
  await handleImportFiles(e.target.files,'Imported');
  e.target.value='';
};
setupDropImport();
onClick('#btnTemplates',openTemplateModal);
onClick('#templateCloseBtn',closeTemplateModal);
onClick('#templateCreatePack',createStarterPack);
onEvent('#templateSearch','input',renderTemplateModal);
onEvent('#templateCategory','change',renderTemplateModal);
$('#templateComplexity')?.addEventListener('change',renderTemplateModal);
$('#templateTag')?.addEventListener('change',renderTemplateModal);
onEvent('#templateCustomOnly','change',renderTemplateModal);
onClick('#templateModal',e=>{if(e.target===$('#templateModal'))closeTemplateModal();});
onClick('#btnChangelog',openChangelogModal);
onClick('#changelogCloseBtn',closeChangelogModal);
onEvent('#changelogVersion','change',e=>renderChangelog(e.target.value));
onClick('#changelogModal',e=>{if(e.target===$('#changelogModal'))closeChangelogModal();});
onClick('#btnTutorial',startTutorial);
onClick('#tutorialYesBtn',startTutorial);
onClick('#tutorialNoBtn',()=>{markTutorialSeen();closeTutorialPrompt();});
$('#tutorialPop')?.addEventListener('click',e=>e.stopPropagation());
onClick('#tutorialQuitBtn',e=>{e.stopPropagation();endTutorial(true);});
onClick('#tutorialBackBtn',e=>{e.stopPropagation();tutorialIndex=Math.max(0,tutorialIndex-1);renderTutorial();});
onClick('#tutorialNextBtn',e=>{e.stopPropagation();if(tutorialIndex>=TUTORIAL_STEPS.length-1)endTutorial(true);else{tutorialIndex++;renderTutorial();}});
onClick('#tutorialPrompt',e=>{if(e.target===$('#tutorialPrompt')){markTutorialSeen();closeTutorialPrompt();}});
$('#compactJson')?.addEventListener('change',()=>{refreshJson();recordActivity('Changed export JSON style','project','',$('#compactJson')?.checked?'Minified':'Pretty');scheduleAutosave();});
if($('#viewRaw'))$('#viewRaw').onchange=()=>{rawMode=!!$('#viewRaw')?.checked;recordActivity(rawMode?'Enabled raw JSON':'Disabled raw JSON','project','');renderMain();};
$('#autosaveToggle')?.addEventListener('change',e=>setAutosaveEnabled(e.target.checked));
$('#tooltipsToggle')?.addEventListener('change',e=>setTooltipsEnabled(e.target.checked));
$('#uiSoundsToggle')?.addEventListener('change',e=>setUiSoundsEnabled(e.target.checked));
$('#uiTypingSoundsToggle')?.addEventListener('change',e=>setUiTypingSoundsEnabled(e.target.checked));
$('#uiSoundVolume')?.addEventListener('input',e=>setUiSoundVolume(e.target.value));
onEvent('#modSuggestionTarget','change',e=>{
  modSuggestionTarget=e.target.value||'1.21.1';
  localStorage.setItem(MOD_SUGGESTION_VERSION_KEY,modSuggestionTarget);
  refreshKnownIds();
  renderModSupportControls();
  showMsg(`Mod suggestion target set to Minecraft ${modSuggestionTarget}.`,true);
});
document.addEventListener('change',e=>{
  const box=e.target?.closest?.('.mod-pack-toggle');
  if(!box)return;
  if(box.checked)enabledModSuggestions.add(box.value);else enabledModSuggestions.delete(box.value);
  saveEnabledModSuggestions();
  refreshKnownIds();
  renderModSupportControls();
  showMsg('Mod suggestion settings updated.',true);
});
onClick('#themeToggle',()=>{
  localStorage.removeItem(PERSONALIZATION_KEY);
  applyTheme(LIGHT_THEME_IDS.has(cTheme)?'dark':'light');
  personalizationDraft=defaultPersonalization();
  applyPersonalization(personalizationDraft);
  showMsg(`${THEME_NAMES[cTheme]} theme applied.`,true);
});
onClick('#btnPersonalization',openPersonalizationModal);
onEvent('#personalThemePreset','change',e=>{
  const font=personalizationDraft?.font||"'DM Sans',system-ui,sans-serif";
  applyTheme(e.target.value);
  personalizationDraft=Object.assign(defaultPersonalization(),{font});
  previewPersonalization();
});
onClick('#personalizationCloseBtn',()=>closePersonalizationModal(false));
onClick('#personalizationCancelBtn',()=>closePersonalizationModal(false));
onClick('#personalizationApplyBtn',()=>closePersonalizationModal(true));
onClick('#personalizationModal',e=>{if(e.target===$('#personalizationModal'))closePersonalizationModal(false);});
onEvent('#personalFontSelect','change',e=>{if(personalizationDraft){personalizationDraft.font=e.target.value;previewPersonalization();}});
onClick('#personalUndoBtn',undoPersonalDraft);
onClick('#personalRedoBtn',redoPersonalDraft);
onClick('#muteToggle',()=>setUiSoundsMuted(!uiSoundsMuted));
onClick('#btnManualSaveHead',manualSaveNow);
$('#defaultNs')?.addEventListener('input',()=>{renderFileList();renderValidation();refreshJson();scheduleAutosave();});
$('#defaultNs')?.addEventListener('change',()=>recordActivity('Changed namespace','project','',$('#defaultNs')?.value.trim()||'questlog'));
const lj=$('#liveJson');
const applyLJ=debounce(()=>{if(!currentFile||!getCD())return;try{const p=JSON.parse(lj.value);if(mode==='quest'){fixQA(p);nqbd(p);trimQ(p);quests[currentFile]=p;touchFile('quest',currentFile);}else{trimCh(p);chapters[currentFile]=p;touchFile('chapter',currentFile);}lj.value=mode==='quest'?stringifyJson(buildQOut(p)):stringifyJson(p);showMsg('JSON applied.',true);renderMain();}catch(err){showMsg(err.message||String(err),false);}},420);
lj.addEventListener('focusin',()=>{jsonFocused=true;});
lj.addEventListener('focusout',()=>{jsonFocused=false;refreshJson();});
lj.addEventListener('input',()=>{if(!currentFile)return;applyLJ();});
onClick('#btnDownload',()=>{if(!currentFile)return;if(mode==='chapter'&&$('#cf_name'))$('#cf_name').oninput?.();else syncQ();const data=getCD();if(!data)return;let out;if(mode==='quest')out=buildQOut(data);else{out=JSON.parse(JSON.stringify(data));trimCh(out);}downloadBlob(new Blob([stringifyJson(out)],{type:'application/json'}),currentFile);recordActivity('Exported selected',mode,currentFile);showMsg('Downloaded.',true);});
onClick('#btnDownloadAll',openExportPreviewModal);
onClick('#exportPreviewCloseBtn',closeExportPreviewModal);
onClick('#exportPreviewCancelBtn',closeExportPreviewModal);
onClick('#exportPreviewModal',e=>{if(e.target===$('#exportPreviewModal'))closeExportPreviewModal();});
onClick('#exportPreviewZipBtn',async()=>{
  await exportProjectZip();
  closeExportPreviewModal();
});
function shouldRecordHistory(e){
  if(historyRestoring)return false;
  const t=e.target;if(!t||!t.closest)return false;
  const ignored=[
    '#btnUndo','#btnRedo','#btnDownload','#btnDownloadAll',
    '#themeToggle','#muteToggle','#btnPickImport','#btnAddMenu','#btnImportExportMenu',
    '#ctxEditName','#templateCloseBtn',
    '#renameCancelBtn','#resetCancelBtn','#resetBackBtn'
  ].join(',');
  if(t.closest(ignored))return false;
  if(e.type==='input'||e.type==='change')return false;
  if(e.type==='click'){
    const mutatingClicks=[
      '#btnNewQuest','#btnNewChapter','#addReq','#addObj','#addFail','#addRew',
      '.small-rm','.rew-remove','#renameConfirmBtn',
      '#ctxDuplicate','#ctxMakeTemplate','#ctxUnlink','#ctxDelete','#resetDeleteBtn','.template-create','.template-delete',
      '#templateCreatePack','[data-fmt-template]','[data-fmt-code]','.mc-ac-row'
    ].join(',');
    return !!t.closest(mutatingClicks);
  }
  return false;
}
function maybeRecordHistory(e){if(shouldRecordHistory(e))pushHistorySnapshot();}
function maybeRecordFocusHistory(e){
  const t=e.target;
  if(['questListSort','questSearch'].includes(t?.id))return;
  if(!historyRestoring&&t?.closest?.('input,textarea,select'))pushHistorySnapshot();
}
document.body.addEventListener('focusin',maybeRecordFocusHistory,true);
document.body.addEventListener('input',maybeRecordHistory,true);
document.body.addEventListener('change',maybeRecordHistory,true);
document.body.addEventListener('click',maybeRecordHistory,true);
$('#btnUndo')?.addEventListener('click',undoProject);
$('#btnRedo')?.addEventListener('click',redoProject);
function onFC(e){if(e&&(e.target===lj||e.target.closest?.('#liveJson')||['viewRaw','questListSort','questSearch'].includes(e.target.id)))return;if(rawMode)return;if(mode==='quest'){syncQ();recordEditActivity();dRefresh();}else if($('#cf_name')){$('#cf_name').oninput?.();recordEditActivity();}}
document.body.addEventListener('input',onFC);document.body.addEventListener('change',onFC);
document.body.addEventListener('input',scheduleAutosave);document.body.addEventListener('change',scheduleAutosave);document.body.addEventListener('click',()=>setTimeout(scheduleAutosave,0));
onEvent('#validateProject','change',()=>{renderValidation();recordActivity('Changed validation scope','project','',$('#validateProject')?.checked!==false?'Project-wide':'Selected file');});
onClick('#btnBulkDeleteOpen',openBulkDeleteModal);
onClick('#bulkDeleteCloseBtn',closeBulkDeleteModal);
onClick('#bulkDeleteModal',e=>{if(e.target===$('#bulkDeleteModal'))closeBulkDeleteModal();});
onClick('#namespacePreviewBtn',renderNamespacePreview);
onClick('#namespaceApplyBtn',applyNamespaceMigration);
onEvent('#namespaceMigrateFrom','input',renderNamespacePreview);
onEvent('#namespaceMigrateTo','input',renderNamespacePreview);
onClick('#bulkSelectNoneBtn',()=>{$$('#bulkDeleteList input[type="checkbox"]').forEach(i=>i.checked=false);updateBulkDeleteCount();});
onClick('#bulkDeleteBtn',bulkDeleteSelected);
onClick('#btnResetProgress',()=>{closeSettingsMenu();openResetModal();});
onClick('#resetCancelBtn',closeResetModal);
onClick('#resetContinueBtn',()=>$('#resetModalDanger')?.classList.add('open'));
onClick('#resetBackBtn',()=>$('#resetModalDanger')?.classList.remove('open'));
onClick('#resetDeleteBtn',performFullReset);
onClick('#resetModal',e=>{if(e.target===$('#resetModal'))closeResetModal();});
onClick('#confirmCancelBtn',closeConfirmModal);
onClick('#confirmActionBtn',runConfirmAction);
onClick('#confirmModal',e=>{if(e.target===$('#confirmModal'))closeConfirmModal();});

// ── Context menu + rename modal ───────────────────────────────────
let ctxTarget=null;

function showCtxMenu(e,name,kind){
  e.preventDefault();e.stopPropagation();
  ctxTarget={name,kind};
  const menu=$('#ctxMenu');
  const unlink=$('#ctxUnlink');
  const makeTpl=$('#ctxMakeTemplate');
  if(unlink)unlink.style.display=kind==='quest'&&questBoundCh(name)?'flex':'none';
  if(makeTpl)makeTpl.style.display=kind==='quest'?'flex':'none';
  menu.classList.add('open');
  const x=Math.min(e.clientX,window.innerWidth-170);
  const y=Math.min(e.clientY,window.innerHeight-130);
  menu.style.left=x+'px';menu.style.top=y+'px';
}
function hideCtxMenu(){$('#ctxMenu')?.classList.remove('open');ctxTarget=null;}

function showRenameModal(name,kind){
  hideCtxMenu();
  const modal=$('#renameModal');const input=$('#renameInput');
  if(!modal||!input)return;
  setRenameModalError('');
  input.value=name.replace(/\.json$/i,'');
  modal.classList.add('open');setTimeout(()=>{input.focus();input.select();},50);
  const commit=()=>{
    const nv=input.value.trim().replace(/\.json$/i,'');
    if(!nv){
      setRenameModalError(`Name your ${itemKindLabel(kind)} something.`);
      input.focus();
      return;
    }
    setRenameModalError('');
    const nn=nv+'.json';
    if(nn===name){closeRenameModal();return;}
    if(kind==='quest'){if(quests[nn]&&nn!==name){setRenameModalError('Name taken.');return;}quests[nn]=quests[name];delete quests[name];moveFileMeta('quest',name,nn);if(currentFile===name)currentFile=nn;}
    else{if(chapters[nn]&&nn!==name){setRenameModalError('Name taken.');return;}chapters[nn]=chapters[name];delete chapters[name];moveFileMeta('chapter',name,nn);if(currentFile===name)currentFile=nn;}
    recordActivity('Renamed',kind,nn,name);
    closeRenameModal();renderFileList();if(currentFile===nn)renderMain();
  };
onClick('#renameConfirmBtn',commit);
onClick('#renameCancelBtn',closeRenameModal);
  input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape')closeRenameModal();};
  input.oninput=()=>setRenameModalError('');
}

function duplicateFile(name,kind){
  const base=name.replace(/\.json$/i,'');let nn=base+'_copy.json';let i=2;
  if(kind==='quest'){while(quests[nn])nn=`${base}_copy${i++}.json`;quests[nn]=JSON.parse(JSON.stringify(quests[name]));touchFile('quest',nn);}
  else{while(chapters[nn])nn=`${base}_copy${i++}.json`;chapters[nn]=JSON.parse(JSON.stringify(chapters[name]));touchFile('chapter',nn);}
  recordActivity('Duplicated',kind,nn,name);
  renderFileList();showMsg(`Duplicated as ${nn}`,true);
}

onClick('#ctxEditName',()=>{if(ctxTarget)showRenameModal(ctxTarget.name,ctxTarget.kind);});
onClick('#ctxDuplicate',()=>{if(ctxTarget){duplicateFile(ctxTarget.name,ctxTarget.kind);hideCtxMenu();}});
onClick('#ctxMakeTemplate',()=>{if(ctxTarget?.kind==='quest'){makeTemplateFromQuest(ctxTarget.name);hideCtxMenu();}});
onClick('#ctxUnlink',()=>{if(ctxTarget?.kind==='quest'){unbindQ(ctxTarget.name);hideCtxMenu();}});
onClick('#ctxDelete',()=>{
  if(!ctxTarget)return;const{name,kind}=ctxTarget;hideCtxMenu();
  openConfirmModal({
    title:`Delete ${name}?`,
    copy:`This removes the ${kind} file from this browser project. Use undo if you clicked the wrong thing.`,
    button:'Delete',
    onConfirm:()=>{
      pushHistorySnapshot();
      if(kind==='quest'){delete quests[name];delete fileMeta[metaKey('quest',name)];}
      else{delete chapters[name];delete fileMeta[metaKey('chapter',name)];}
      if(currentFile===name&&mode===kind)currentFile=null;
      recordActivity('Deleted',kind,name);
      renderFileList();renderMain();renderValidation();scheduleAutosave();
    }
  });
});
// Close context menu on any click outside
document.addEventListener('click',hideCtxMenu);
document.addEventListener('contextmenu',e=>{if(!e.target.closest('#fileList'))hideCtxMenu();});
onClick('#renameModal',e=>{if(e.target===$('#renameModal'))closeRenameModal();});

// ── Init ──────────────────────────────────────────────────────────
const restored=loadAutosave();
initSchemaSourceBadge();
renderFileList();
if(restored&&currentFile){renderMain();}
else{$('#btnNewQuest')?.click();}
renderValidation();
saveAutosaveNow('init');
updateHistoryButtons();
setTimeout(()=>openTutorialPrompt(false),500);
setInterval(()=>saveAutosaveNow('interval'),8000);
})();
