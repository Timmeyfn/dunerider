// Dune Rider — a 3rd-person desert stunt game served from a Cloudflare Worker.
// Deploy: put this file next to wrangler.toml and run `npx wrangler deploy` (multiplayer needs the LOBBY Durable Object).
// Pasting it into the dashboard editor also works, but then the game runs single-player until the LOBBY binding is added.

const HTML = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dune Rider</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}
html,body{margin:0;height:100%;overflow:hidden;background:#000;font-family:'Luckiest Guy',Impact,'Arial Black',sans-serif;color:#fff;user-select:none;-webkit-user-select:none}
canvas#gl{display:block}
.hud{position:fixed;pointer-events:none}
#speedLines{inset:0;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 50%,rgba(255,255,255,.55) 0deg .5deg,rgba(255,255,255,0) .5deg 6deg);-webkit-mask-image:radial-gradient(circle at 50% 50%,transparent 30%,#000 80%);mask-image:radial-gradient(circle at 50% 50%,transparent 30%,#000 80%)}
#slowmoFx{inset:0;opacity:0;transition:opacity .25s;background:radial-gradient(circle at 50% 50%,transparent 40%,rgba(40,120,255,.4) 100%)}
#slowmoFx.on{opacity:1}
#hyper{inset:0;width:100%;height:100%;opacity:0}
#hyperTint{inset:0;opacity:0;background:radial-gradient(circle at 50% 45%,rgba(160,210,255,.04) 25%,rgba(40,90,230,.55) 100%)}
#scoreBox{top:16px;left:16px;text-shadow:0 3px 0 #2a0a4a,0 0 12px rgba(0,0,0,.5)}
#scoreBox .lbl{font-size:16px;letter-spacing:2px;color:#ffe14d}
#score{font-size:44px;line-height:1}
#best{font-size:15px;opacity:.9;margin-top:4px}
#level{font-size:16px;margin-top:6px;color:#b6f3ff}
.xpbar{display:inline-block;width:110px;height:8px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.3);border-radius:4px;overflow:hidden;vertical-align:middle;margin-left:6px}
.xpbar i{display:block;height:100%;width:0;background:#7dff6a}
#coinsHud{font-size:20px;margin-top:4px;color:#ffd84d}
#chain{font-size:24px;color:#36e0ff;margin-top:8px;display:none}
#chainBar{width:150px;height:6px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden;display:none;margin-top:3px}
#chainBar i{display:block;height:100%;width:100%;background:#36e0ff}
#vehChip{top:18px;right:74px;font-size:22px;text-align:right;text-shadow:0 3px 0 #2a0a4a,0 0 10px rgba(0,0,0,.5)}
#vehChip small{display:block;font-family:system-ui,sans-serif;font-size:12px;opacity:.85;text-shadow:0 1px 2px #000}
#missions{top:76px;right:16px;width:280px;font-family:system-ui,sans-serif;font-size:13px;text-shadow:0 1px 2px #000}
#missions .hd{font-family:'Luckiest Guy',Impact,sans-serif;font-size:16px;color:#ffe14d;letter-spacing:1px;text-align:right;margin-bottom:4px}
#missions .m{background:rgba(14,10,30,.62);border-radius:8px;padding:5px 9px;margin-bottom:5px;display:flex;justify-content:space-between;gap:8px;border-left:4px solid #36e0ff}
#missions .m b{color:#ffe14d;white-space:nowrap}
#timer{top:12px;left:50%;transform:translateX(-50%);font-size:44px;display:none;text-shadow:0 3px 0 #2a0a4a}
#timer.low{color:#ff5a4a}
#chal{left:16px;top:250px;width:290px;display:none;background:rgba(14,10,30,.62);border-left:4px solid #ff9a3c;border-radius:10px;padding:7px 10px;font-family:system-ui,sans-serif;font-size:14px;text-shadow:0 1px 2px #000}
#chal .ct{font-weight:700;color:#ffd9a8}
#chal .cb{height:6px;background:rgba(255,255,255,.2);border-radius:3px;overflow:hidden;margin:5px 0 3px}
#chal .cb i{display:block;height:100%;width:100%;background:#ff9a3c}
#chal .cs{font-size:12px;color:#ffe14d}
#compass{right:16px;bottom:224px;width:260px;text-align:right;font-family:system-ui,sans-serif;font-size:12px;line-height:1.5;text-shadow:0 1px 2px #000}
#nameIn{font:600 16px system-ui,sans-serif;padding:8px 12px;border-radius:10px;border:2px solid #36e0ff;background:rgba(255,255,255,.95);color:#1a1030;width:190px}
#netList{right:16px;top:250px;width:220px;display:none;font-family:system-ui,sans-serif;font-size:13px;text-align:right;text-shadow:0 1px 2px #000}
#netList .hd{font-family:'Luckiest Guy',Impact,sans-serif;font-size:16px;color:#36e0ff;letter-spacing:1px}
#netList div{margin-top:2px}
#netList b{color:#ffe14d}
#netList .me{opacity:.7}
#netList .tip{font-size:11px;opacity:.75}
#alt{top:66px;left:50%;transform:translateX(-50%);font-size:22px;color:#b6f3ff;display:none;text-shadow:0 2px 0 #0a2a4a,0 0 10px rgba(0,0,0,.5);white-space:nowrap}
#trickBox{top:15%;left:50%;transform:translateX(-50%);text-align:center;display:none}
#trickBox.bump{animation:bump .25s ease-out}
@keyframes bump{0%{transform:translateX(-50%) scale(1.25)}100%{transform:translateX(-50%) scale(1)}}
#trickList div{font-size:34px;color:#ffe14d;text-shadow:0 3px 0 #7a1fa2,0 0 14px rgba(0,0,0,.4);line-height:1.1}
#trickPts{font-size:26px;margin-top:6px;text-shadow:0 3px 0 #2a0a4a}
#airTime{font-size:18px;color:#36e0ff;text-shadow:0 2px 0 #0a2a4a}
#popup{top:38%;left:50%;transform:translate(-50%,-50%);text-align:center;opacity:0;white-space:nowrap}
#popup.show{animation:pop 2.2s ease-out forwards}
#popup .pt{font-size:58px;color:#7dff6a;text-shadow:0 4px 0 #0b5a1a,0 0 20px rgba(0,0,0,.4)}
#popup.bad .pt{color:#ff4d4d;text-shadow:0 4px 0 #6a0b0b}
#popup .ps{font-size:22px;margin-top:4px;text-shadow:0 2px 0 #222}
@keyframes pop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}12%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}22%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-62%) scale(1)}}
#toast{top:26%;left:50%;transform:translateX(-50%);font-size:26px;color:#7dff6a;opacity:0;white-space:nowrap;text-shadow:0 3px 0 #0b3a1a,0 0 12px rgba(0,0,0,.5)}
#toast.show{animation:toast 2.6s ease-out forwards}
#flash{inset:0;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.95),rgba(220,240,255,.6) 60%,rgba(255,255,255,.2));opacity:0}
#flash.show{animation:flash .7s ease-out forwards}
#flash.blue{background:radial-gradient(circle at 50% 45%,rgba(240,248,255,.98),rgba(150,200,255,.8) 55%,rgba(60,110,255,.4))}
@keyframes flash{0%{opacity:1}100%{opacity:0}}
@keyframes toast{0%{opacity:0;transform:translate(-50%,12px)}10%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
#speedo{left:14px;bottom:14px;width:230px;height:230px}
.meter{left:30px;width:200px;text-shadow:0 2px 0 #0a2a4a}
.meter .lbl{font-size:15px;letter-spacing:1px;margin-bottom:3px}
.meter .lbl small{font-family:system-ui,sans-serif;font-size:11px;opacity:.8;margin-left:4px}
.meter .bar{height:12px;background:rgba(0,0,0,.45);border-radius:6px;overflow:hidden;border:2px solid rgba(255,255,255,.35)}
.meter i{display:block;height:100%;width:100%}
#boostBox{bottom:256px}
#boostBox .lbl{color:#ffb35c}
#boostBox i{background:linear-gradient(90deg,#ff5a1f,#ffd84d)}
#boostBox.full .bar{box-shadow:0 0 12px #ffb35c}
#buildChip{bottom:12px;left:50%;transform:translateX(-50%);font-family:system-ui,sans-serif;font-size:13px;background:rgba(14,10,30,.62);border:2px solid rgba(215,168,255,.6);border-radius:10px;padding:5px 12px;white-space:nowrap;text-shadow:0 1px 2px #000}
#buildChip b{color:#d7a8ff;font-family:'Luckiest Guy',Impact,sans-serif;font-weight:normal;font-size:15px;letter-spacing:1px}
#ocBadge{left:30px;bottom:300px;font-size:22px;color:#ff5a3c;text-shadow:0 2px 0 #4a0a00,0 0 14px rgba(255,80,30,.8);display:none}
#ocBadge.on{display:block;animation:ocpulse .5s ease-in-out infinite alternate}
@keyframes ocpulse{from{opacity:.65;transform:scale(1)}to{opacity:1;transform:scale(1.08)}}
#fuel{bottom:300px;display:none}
#fuel .lbl{color:#9fe3ff}
#fuel i{background:linear-gradient(90deg,#36a8ff,#b6f3ff)}
#minimap{right:16px;bottom:38px;width:180px;height:180px;border-radius:50%}
#hint{right:16px;bottom:12px;font-size:13px;opacity:.8;font-family:system-ui,sans-serif;text-shadow:0 1px 2px #000}
#gearBtn{position:fixed;top:14px;right:14px;font-size:22px;padding:6px 12px;z-index:5}
.overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,8,30,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:10}
.overlay.show{display:flex}
.panel{width:min(800px,94vw);max-height:92vh;overflow:auto;background:linear-gradient(160deg,#2a1450,#14102a);border:3px solid #ffe14d;border-radius:18px;padding:22px 26px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:system-ui,sans-serif}
.panel h1{font-family:'Luckiest Guy',Impact,sans-serif;font-weight:normal;font-size:56px;margin:0;letter-spacing:2px;color:#ffe14d;text-shadow:0 4px 0 #7a1fa2}
.panel h1 span{color:#36e0ff}
.panel h2{font-family:'Luckiest Guy',Impact,sans-serif;font-weight:normal;letter-spacing:1px;margin:20px 0 8px;color:#ffe14d;font-size:24px}
.panel h2 small{font-family:system-ui,sans-serif;font-size:12px;color:#bbb;letter-spacing:0;margin-left:8px}
.sub{margin:4px 0 14px;color:#cfc6e8}
.small{font-size:14px;color:#ddd;line-height:1.45;margin:0 0 8px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.veh{display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 6px;text-align:center}
.veh .ic{font-size:30px;line-height:1.1}
.veh b{font-family:'Luckiest Guy',Impact,sans-serif;font-weight:normal;font-size:17px;letter-spacing:1px}
.veh span{font-size:11px;color:#cfc6e8}
.sel{background:#ffe14d!important;color:#2a0a4a!important;border-color:#b38f00!important}
.sel span{color:#4a3a10!important}
#paints{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.swatch{width:38px;height:38px;border-radius:50%;padding:0;border:3px solid rgba(255,255,255,.35);font-size:13px;line-height:32px;text-align:center}
.swatch.on{border-color:#ffe14d;box-shadow:0 0 0 3px #ffe14d}
.swatch.lock{opacity:.45;cursor:not-allowed}
#binds{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}
.bind{display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.06);padding:5px 8px;border-radius:8px;font-size:14px}
.bind button{min-width:96px}
button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:6px 12px;background:#3a2a6a;color:#fff;border-bottom:3px solid #1d1240}
button:hover{background:#4c3a88}
button.listen{background:#ffe14d;color:#222;border-color:#a88a00}
button.big{font-family:'Luckiest Guy',Impact,sans-serif;font-size:30px;padding:10px 44px;background:#ffe14d;color:#2a0a4a;border-bottom:5px solid #b38f00;letter-spacing:2px}
button.big:hover{background:#fff07a}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;align-items:center}
.chip{font-family:'Luckiest Guy',Impact,sans-serif;font-size:18px;letter-spacing:1px;padding:8px 16px}
table.pts{width:100%;border-collapse:collapse;font-size:14px}
table.pts td{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.08)}
table.pts td:last-child{text-align:right;color:#ffe14d;font-weight:700}
#resList{margin:10px 0;font-size:18px}
#resList div{display:flex;justify-content:space-between;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,.06);margin-bottom:5px}
#resList div.me{background:#ffe14d;color:#2a0a4a;font-weight:700}
#resScore{font-family:'Luckiest Guy',Impact,sans-serif;font-size:46px;margin-top:6px}
@media (max-width:640px){#binds{grid-template-columns:1fr}.grid3{grid-template-columns:1fr 1fr}.panel h1{font-size:40px}#missions{display:none}}
</style>
</head>
<body>
<div id="speedLines" class="hud"></div>
<div id="slowmoFx" class="hud"></div>
<div id="hyperTint" class="hud"></div>
<canvas id="hyper" class="hud"></canvas>
<div id="scoreBox" class="hud">
  <div class="lbl">SCORE</div>
  <div id="score">0</div>
  <div id="best">BEST LANDING 0</div>
  <div id="level">LV 1<span class="xpbar"><i></i></span></div>
  <div id="coinsHud">🪙 0</div>
  <div id="chain">CHAIN x2</div>
  <div id="chainBar"><i></i></div>
</div>
<div id="timer" class="hud"></div>
<div id="alt" class="hud"></div>
<div id="chal" class="hud"><div id="chalT" class="ct"></div><div class="cb"><i id="chalB"></i></div><div id="chalS" class="cs"></div></div>
<div id="compass" class="hud"></div>
<div id="netList" class="hud"></div>
<div id="vehChip" class="hud"></div>
<div id="missions" class="hud"></div>
<div id="trickBox" class="hud"><div id="trickList"></div><div id="trickPts"></div><div id="airTime"></div></div>
<div id="popup" class="hud"></div>
<div id="toast" class="hud"></div>
<div id="flash" class="hud"></div>
<div id="fuel" class="hud meter"><div class="lbl">THRUSTERS</div><div class="bar"><i></i></div></div>
<div id="ocBadge" class="hud">⚡ OVERCLOCK x10</div>
<div id="buildChip" class="hud"></div>
<div id="boostBox" class="hud meter"><div class="lbl">BOOST ∞<small id="boostKey">hold F</small></div><div class="bar"><i></i></div></div>
<canvas id="speedo" class="hud" width="460" height="460"></canvas>
<canvas id="minimap" class="hud" width="360" height="360"></canvas>
<div id="hint" class="hud">Esc · Menu</div>
<button id="gearBtn" title="Menu">&#9881;</button>

<div id="menu" class="overlay show">
  <div class="panel">
    <h1>DUNE <span>RIDER</span></h1>
    <p class="sub">Desert stunts · no speed limit · giant dunes, ramps &amp; pyramids · trick combos</p>
    <div class="row"><button id="playBtn" class="big">RIDE</button><div id="modeRow" class="row" style="margin:0"></div></div>
    <h2>Multiplayer <small>one big lobby · everyone who opens this site rides together</small></h2>
    <div class="row" style="margin-top:0;align-items:center"><input id="nameIn" maxlength="16" placeholder="Your name" autocomplete="off"><span id="netStat" style="font-family:system-ui,sans-serif;font-size:14px">🟡 Connecting…</span></div>
    <h2>Vehicle <small>or press V while riding</small></h2>
    <div id="vehicles" class="grid3"></div>
    <h2>Paint <small>level up to unlock Gold (LV 5), Chrome (LV 10) and Rainbow (LV 15)</small></h2>
    <div id="paints"></div>
    <h2>World</h2>
    <div id="timeRow" class="row" style="margin-top:0"></div>
    <h2>Sandbox <small>B places the selected item in front of you · N picks the next item · K clears them</small></h2>
    <div id="sandRow" class="row" style="margin-top:0"></div>
    <h2>Keybinds <small>click a key, then press the new one (Esc cancels)</small></h2>
    <div id="binds"></div>
    <div class="row">
      <button id="resetBinds">Reset keybinds</button>
      <button id="unitsBtn"></button>
      <button id="soundBtn"></button>
      <button id="qualityBtn"></button>
    </div>
    <h2>How to score</h2>
    <p class="small">Everything you do in one jump builds a combo. Each <b>different</b> trick adds +1 to the multiplier. Steer with A/D in the air to line up your landing, and land wheels-down to bank it. Land tricks back to back to grow your <b>chain</b> (up to x10). Hold F to <b>boost</b> (it never runs out) and press O to <b>overclock</b> any vehicle. Hold T for slow-mo. Complete <b>missions</b> (top right) to earn XP and level up.</p>
    <table class="pts">
      <tr><td>Airtime (jumps over 0.6 s)</td><td>600 / sec</td></tr>
      <tr><td>Backflip / Frontflip</td><td>2,000 / 2,500</td></tr>
      <tr><td>Barrel Roll / 360 Spin</td><td>1,800 / 1,500</td></tr>
      <tr><td>Superman / No-Hander / Nac-Nac (hold)</td><td>1,500 / 1,200 / 1,200 + per sec</td></tr>
      <tr><td>Kicker (launch off a wooden ramp) / Pyramid Launch</td><td>1,000 / 5,000</td></tr>
      <tr><td>Big Air (2.5 s) / Mega Air (5 s) / Insane Air (9 s)</td><td>1,500 / 4,000 / 10,000</td></tr>
      <tr><td>Speed Demon (launch over 200 km/h)</td><td>2,000</td></tr>
      <tr><td>Coin / Sky ring</td><td>250 / 5,000</td></tr>
      <tr><td>Cactus Crusher (Monster Truck drives through cacti)</td><td>500</td></tr>
      <tr><td>Splashdown (land a jump in an oasis pond)</td><td>2,500</td></tr>
      <tr><td>Sonic Boom (every Mach number you break: Mach 1, 2, 3…)</td><td>25,000 × Mach</td></tr>
      <tr><td>Wheelie (hold ↓ on the ground)</td><td>300+ / sec</td></tr>
      <tr><td>Jet: Loop / Barrel Roll / Low Flyby / Touchdown</td><td>3,000 / 1,500 / 1,200 / 5,000</td></tr>
      <tr><td>Rocket: Booster Separation / Upright Landing</td><td>5,000 / 20,000</td></tr>
      <tr><td>Arch Thread (go through a stone arch)</td><td>3,000</td></tr>
      <tr><td>Admin: Hyperspace jump (+10,000 km/h, then +5,000 km/h every second until you drop out, and you keep the speed) / Rock Smash</td><td>10,000 / 1,000</td></tr>
      <tr><td>Overclock (O, any vehicle): motor & boost x10 · jet x6 · rocket x3 · helicopter x6</td><td>⚡</td></tr>
      <tr><td>Rocket: Booster Landing on the pad (Q) / Bullseye (under 1.5 m)</td><td>30,000 / +20,000</td></tr>
      <tr><td>Helicopter: Touchdown / Pirouette (360° spin in the air)</td><td>4,000 / 1,500</td></tr>
      <tr><td>Helicopter: Front flip / Backflip / Barrel roll</td><td>3,000 / 3,000 / 2,500</td></tr>
      <tr><td>Build: Trampoline bounce / Barrel blast / Your own sky ring</td><td>1,500 / 2,000 / 2,000</td></tr>
      <tr><td>Clean Landing (hold S in the air to dive onto a downhill slope = speed boost!)</td><td>800</td></tr>
      <tr><td>Landmark discovered (follow the 🧭 on the minimap) / New biome</td><td>25,000+ / 10,000</td></tr>
      <tr><td>Dust Devil 🌪️ (drive into a sand tornado) / Tornado Surf (aircraft)</td><td>4,000 / 2,500</td></tr>
      <tr><td>⚡ Random challenges (streak bonus, every 3rd = 🔥 FRENZY x2 for 20 s)</td><td>15,000–30,000</td></tr>
      <tr><td>Biomes: Red Canyon x1.25 · Black Sands x1.5 · Salt Flats = top-speed runs</td><td>x</td></tr>
      <tr><td>Vehicle bonus: Scooter / Quad / Rally / Monster Truck</td><td>x1.5 / x1.2 / x1.4 / x1.6</td></tr>
    </table>
  </div>
</div>

<div id="results" class="overlay">
  <div class="panel" style="width:min(520px,94vw);text-align:center">
    <h1>TIME'S <span>UP!</span></h1>
    <div id="resScore"></div>
    <div id="resNote" class="sub"></div>
    <h2>Top 5 Score Attack runs</h2>
    <div id="resList"></div>
    <div class="row" style="justify-content:center"><button id="againBtn" class="big">PLAY AGAIN</button><button id="freeBtn" class="chip">Free Ride</button></div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
'use strict';
var TAU = Math.PI * 2, V3 = THREE.Vector3;
function v(x, y, z){ return new V3(x, y, z); }

/* ================= settings, keybinds, progress ================= */
var ACTIONS = [
  ['throttle','Throttle','KeyW'],
  ['brake','Brake / Reverse (Dive in air)','KeyS'],
  ['left','Steer Left (also in air)','KeyA'],
  ['right','Steer Right (also in air)','KeyD'],
  ['jump','Jump (bunny hop)','Space'],
  ['boost','Boost','KeyF'],
  ['thrust','Thrusters (Roadster) / Hyperspace (Admin)','ShiftLeft'],
  ['wings','Retract / Deploy Wings (Admin)','KeyG'],
  ['overclock','Overclock (any vehicle)','KeyO'],
  ['slowmo','Slow-Mo (hold)','KeyT'],
  ['backflip','Backflip (Wheelie on ground)','ArrowDown'],
  ['frontflip','Frontflip','ArrowUp'],
  ['rollL','Barrel Roll Left','ArrowLeft'],
  ['rollR','Barrel Roll Right','ArrowRight'],
  ['spinL','Spin Left (Rocket: booster landing)','KeyQ'],
  ['spinR','Spin Right','KeyE'],
  ['superman','Superman','Digit1'],
  ['nohander','No-Hander','Digit2'],
  ['nacnac','Nac-Nac','Digit3'],
  ['vehicle','Change Vehicle','KeyV'],
  ['camera','Switch Camera','KeyC'],
  ['reset','Reset','KeyR'],
  ['build','Build: place item','KeyB'],
  ['buildNext','Build: next item','KeyN'],
  ['buildClear','Build: clear all','KeyK'],
  ['joinFriend','Multiplayer: go to a player','KeyJ']
];
var DEFAULT_BINDS = {};
ACTIONS.forEach(function(a){ DEFAULT_BINDS[a[0]] = a[2]; });
var binds = Object.assign({}, DEFAULT_BINDS);
var prefs = { units: 'kmh', sound: true, vehicle: 'bike', quality: 'high', time: 'day', mode: 'free', paint: {}, grav: 'normal', god: false, infBoost: false };
var progress = { level: 1, xp: 0, coins: 0, missions: [] };
var bestLanding = 0, topRuns = [];
function load(key, fallback){ try { var x = JSON.parse(localStorage.getItem(key) || 'null'); return x == null ? fallback : x; } catch (e) { return fallback; } }
function save(key, val){ try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
(function(){
  var sb = load('duneRider.binds', null); if (sb) for (var k in sb) if (k in binds) binds[k] = sb[k];
  Object.assign(prefs, load('duneRider.prefs', {}));
  if (!prefs.paint || typeof prefs.paint !== 'object') prefs.paint = {};
  Object.assign(progress, load('duneRider.progress', {}));
  bestLanding = +load('duneRider.best', 0) || 0;
  topRuns = load('duneRider.top', []);
  if (!Array.isArray(topRuns)) topRuns = [];
})();
function saveSettings(){ save('duneRider.binds', binds); save('duneRider.prefs', prefs); }
function keyName(code){
  if (!code) return '-';
  if (code.indexOf('Key') === 0) return code.slice(3);
  if (code.indexOf('Digit') === 0) return code.slice(5);
  if (code.indexOf('Numpad') === 0) return 'Num ' + code.slice(6);
  var m = { ArrowUp:'↑ Up', ArrowDown:'↓ Down', ArrowLeft:'← Left', ArrowRight:'→ Right', Space:'Space',
    ShiftLeft:'L-Shift', ShiftRight:'R-Shift', ControlLeft:'L-Ctrl', ControlRight:'R-Ctrl',
    AltLeft:'L-Alt', AltRight:'R-Alt', Enter:'Enter', Tab:'Tab', Backspace:'Backspace',
    Backquote:'~', Minus:'-', Equal:'=', BracketLeft:'[', BracketRight:']', Semicolon:';',
    Quote:"'", Comma:',', Period:'.', Slash:'/', CapsLock:'Caps' };
  return m[code] || code;
}
var keys = {}, pressed = {}, listening = null, paused = true;
function act(a){ return !!keys[binds[a]]; }
function tap(a){ return !!pressed[binds[a]]; }
function fract(x){ return x - Math.floor(x); }
function hash(a, b){ return fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453); }

/* ================= renderer / scene ================= */
var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
function applyPixelRatio(){ renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, prefs.quality === 'high' ? 2 : 1)); }
applyPixelRatio();
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'gl';
document.body.insertBefore(renderer.domElement, document.body.firstChild);

var scene = new THREE.Scene();
var HORIZON = 0xf4d9b2;
scene.fog = new THREE.Fog(HORIZON, 200, 780);
var camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 4000);
var SUN_DIR = v(0.5, 0.48, 0.42).normalize();

var hemi = new THREE.HemisphereLight(0xc4e0ff, 0xc8925c, 0.6);
scene.add(hemi);
var sun = new THREE.DirectionalLight(0xffe4bd, 1.25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1; sun.shadow.camera.far = 500;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(sun); scene.add(sun.target);

/* ---------- sky (gradient + sun/moon glow) ---------- */
function makeSkyMaterial(){
  return new THREE.ShaderMaterial({
    uniforms: {
      top: { value: new THREE.Color(0x2a74d4) }, mid: { value: new THREE.Color(0x8ec2ef) },
      horizon: { value: new THREE.Color(HORIZON) }, ground: { value: new THREE.Color(0xc99a68) },
      sunDir: { value: SUN_DIR }, glowAmt: { value: 1 }, discCol: { value: new THREE.Color(0xfffaeb) }, discAmt: { value: 1.5 }
    },
    vertexShader: [
      'varying vec3 vDir;',
      'void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 top; uniform vec3 mid; uniform vec3 horizon; uniform vec3 ground; uniform vec3 sunDir;',
      'uniform float glowAmt; uniform vec3 discCol; uniform float discAmt;',
      'varying vec3 vDir;',
      'void main(){',
      '  vec3 d = normalize(vDir);',
      '  float h = max(d.y, 0.0);',
      '  vec3 c = mix(horizon, mid, smoothstep(0.0, 0.25, h));',
      '  c = mix(c, top, smoothstep(0.2, 0.9, h));',
      '  c = mix(c, ground, 1.0 - smoothstep(-0.12, 0.0, d.y));',
      '  float s = max(dot(d, normalize(sunDir)), 0.0);',
      '  c += vec3(1.0, 0.8, 0.55) * pow(s, 6.0) * 0.32 * glowAmt;',
      '  c += vec3(1.0, 0.93, 0.8) * pow(s, 60.0) * 0.5 * glowAmt;',
      '  c += discCol * smoothstep(0.9993, 0.9997, s) * discAmt;',
      '  gl_FragColor = vec4(c, 1.0);',
      '}'
    ].join('\n'),
    side: THREE.BackSide, depthWrite: false, fog: false
  });
}
var sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), makeSkyMaterial());
sky.renderOrder = -2;
scene.add(sky);
var envScene = new THREE.Scene(), envSky = new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), makeSkyMaterial());
envScene.add(envSky);
var pmrem = new THREE.PMREMGenerator(renderer), envTex = null;
function rebuildEnv(){ if (envTex) envTex.dispose(); envTex = pmrem.fromScene(envScene, 0.02).texture; scene.environment = envTex; }

// stars (night)
var stars = (function(){
  var n = 1800, pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) {
    var u = Math.random() * TAU, y = 0.05 + Math.random() * 0.95, r = Math.sqrt(1 - y * y);
    pos[i * 3] = Math.cos(u) * r * 2700; pos[i * 3 + 1] = y * 2700; pos[i * 3 + 2] = Math.sin(u) * r * 2700;
  }
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9, depthWrite: false }));
  p.visible = false; p.frustumCulled = false; scene.add(p); return p;
})();

/* ---------- distant mesas ---------- */
var mesas = new THREE.Group(); scene.add(mesas);
var mesaMat = new THREE.MeshLambertMaterial({ color: 0xe2b993, fog: false, flatShading: true });
var mesaMat2 = new THREE.MeshLambertMaterial({ color: 0xeac7a3, fog: false, flatShading: true });
(function(){
  for (var i = 0; i < 34; i++) {
    var a = i / 34 * TAU + Math.sin(i * 7.3) * 0.08;
    var r = 2050 + Math.sin(i * 3.1) * 250;
    var rad = 80 + Math.abs(Math.sin(i * 5.7)) * 180;
    var h = 80 + Math.abs(Math.sin(i * 2.3)) * 230;
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.82, rad, h, 7, 1), i % 3 ? mesaMat : mesaMat2);
    m.position.set(Math.cos(a) * r, h / 2 - 40, Math.sin(a) * r);
    m.rotation.y = i; m.scale.z = 0.6 + Math.abs(Math.sin(i * 1.7));
    mesas.add(m);
  }
})();

/* ================= textures ================= */
function canvas(w, h){ var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function softTexture(){
  var c = canvas(64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
var SOFT = softTexture();
function sandTexture(){
  var S = 512, c = canvas(S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, waves = [];
  for (var i = 0; i < 10; i++) waves.push([1 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 7) - 3, Math.random() * TAU, 0.6 + Math.random()]);
  for (var py = 0; py < S; py++) {
    for (var px = 0; px < S; px++) {
      var n = 0;
      for (var w = 0; w < waves.length; w++) n += Math.sin(TAU * (waves[w][0] * px + waves[w][1] * py) / S + waves[w][2]) * waves[w][3];
      var rip = Math.sin(TAU * py * 22 / S + 3 * Math.sin(TAU * px * 2 / S));
      var v0 = 232 + n * 3 + rip * 9 + (Math.random() - 0.5) * 18, o = (py * S + px) * 4;
      d[o] = v0; d[o + 1] = v0 * 0.93; d[o + 2] = v0 * 0.86; d[o + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
// bumpy wind ripples: a normal map so the sand catches the light
function sandNormalTexture(){
  var S = 256, c = canvas(S), x = c.getContext('2d'), img = x.createImageData(S, S), d = img.data, H = new Float32Array(S * S);
  var waves = [];
  for (var i = 0; i < 6; i++) waves.push([1 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 5) - 2, Math.random() * TAU]);
  for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
    var n = 0;
    for (var w = 0; w < waves.length; w++) n += Math.sin(TAU * (waves[w][0] * px + waves[w][1] * py) / S + waves[w][2]);
    var rip = Math.sin(TAU * py * 11 / S + 2.5 * Math.sin(TAU * px * 2 / S) + 0.6 * Math.sin(TAU * px * 5 / S));
    H[py * S + px] = rip * 1.0 + n * 0.12 + Math.random() * 0.18;
  }
  for (py = 0; py < S; py++) for (px = 0; px < S; px++) {
    var l = H[py * S + (px + S - 1) % S], r = H[py * S + (px + 1) % S], u = H[((py + S - 1) % S) * S + px], b = H[((py + 1) % S) * S + px];
    var nx = (l - r) * 1.6, ny = (u - b) * 1.6, nz = 1, len = Math.sqrt(nx * nx + ny * ny + nz * nz), o = (py * S + px) * 4;
    d[o] = (nx / len * 0.5 + 0.5) * 255; d[o + 1] = (ny / len * 0.5 + 0.5) * 255; d[o + 2] = (nz / len * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function cloudTexture(){
  var c = canvas(256, 128), x = c.getContext('2d');
  for (var i = 0; i < 26; i++) {
    var cx = 40 + Math.random() * 176, cy = 50 + Math.random() * 40 - Math.abs(cx - 128) * 0.15, r = 18 + Math.random() * 30;
    var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  }
  return new THREE.CanvasTexture(c);
}
function stoneTexture(){
  var c = canvas(256), x = c.getContext('2d');
  x.fillStyle = '#d6b07a'; x.fillRect(0, 0, 256, 256);
  for (var r = 0; r < 8; r++) {
    for (var b = 0; b < 4; b++) {
      var off = (r % 2) * 32, l = 200 + Math.floor(Math.random() * 30);
      x.fillStyle = 'rgb(' + l + ',' + Math.floor(l * 0.8) + ',' + Math.floor(l * 0.55) + ')';
      x.fillRect(b * 64 + off + 2, r * 32 + 2, 60, 28);
    }
  }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 14); return t;
}
function numberTex(text, bg, fg, round){
  var c = canvas(256), x = c.getContext('2d');
  if (round) { x.beginPath(); x.arc(128, 128, 120, 0, TAU); x.fillStyle = bg; x.fill(); x.lineWidth = 10; x.strokeStyle = fg; x.stroke(); }
  else { x.fillStyle = bg; x.fillRect(0, 0, 256, 256); }
  x.fillStyle = fg; x.font = 'bold 170px Impact, "Arial Black", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 138);
  var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function flameDecalTex(){
  var c = canvas(512, 160), x = c.getContext('2d');
  [['#ff3b1f', 0], ['#ff9a1f', 14], ['#ffe14d', 30]].forEach(function(l){
    x.fillStyle = l[0]; x.beginPath(); x.moveTo(0, 20 + l[1]);
    for (var k = 0; k < 7; k++) {
      var bx = 60 + k * 62;
      x.quadraticCurveTo(bx, 10 + l[1], bx + 40, 70 + (k % 2) * 20);
      x.quadraticCurveTo(bx + 10, 100, bx - 20, 130 - l[1]);
    }
    x.lineTo(0, 140 - l[1]); x.closePath(); x.fill();
  });
  return new THREE.CanvasTexture(c);
}

/* ================= terrain: dunes + ramps + pyramids ================= */
// gentle climb to a sharp crest (launches you), then a long smooth downhill back to land on (Dune!-style)
function duneProfile(p){ return p < 0.55 ? Math.pow(p / 0.55, 1.5) : Math.pow((1 - p) / 0.45, 1.35); }
function duneHeight(x, z){
  // big rolling base
  var h = 30 * Math.sin(x * 0.0024 + 1.3) * Math.cos(z * 0.002)
        + 9 * Math.sin(x * 0.0075 + z * 0.0055)
        + 2.5 * Math.cos(z * 0.021 - x * 0.013);
  // main dune ridges: ~240 m apart and up to ~46 m tall
  var ph = z * 0.0041 + Math.sin(x * 0.0025) * 1.8 + x * 0.0009;
  var amp = 32 + 14 * Math.sin(x * 0.0017 + z * 0.0009);
  h += amp * duneProfile(fract(ph));
  // cross dunes
  var ph2 = x * 0.0048 + Math.sin(z * 0.0031 + 2.0) * 1.5;
  h += 11 * (1 + Math.sin(z * 0.0015)) * duneProfile(fract(ph2));
  // giant mega-dunes, up to ~85 m extra
  var ph3 = z * 0.0017 + x * 0.00075 + Math.sin(x * 0.001) * 1.2;
  var mega = Math.max(0, Math.sin(x * 0.0009 + z * 0.00033));
  h += 85 * mega * mega * duneProfile(fract(ph3));
  // biomes reshape the land far from the start
  var bw = biomeW(x, z);
  if (bw.any) {
    if (bw.s > 0) h = h * (1 - 0.93 * bw.s) + bw.s * (2.5 * Math.sin(x * 0.0031) * Math.cos(z * 0.0027) - 6);
    if (bw.r > 0) h *= 1 + 0.4 * bw.r;
    if (bw.b > 0) h += bw.b * 20 * duneProfile(fract(z * 0.0062 + x * 0.0021 + Math.sin(x * 0.004) * 0.6));
  }
  return h;
}
/* ================= biomes ================= */
var BIOMES = [
  { id: 'gold', name: 'GOLDEN DUNES', icon: '🏜️', sub: 'Classic sand, big air', mult: 1, col: [0.9, 0.72, 0.52] },
  { id: 'red', name: 'RED CANYON DUNES', icon: '🟥', sub: 'Taller dunes  ·  x1.25 points', mult: 1.25, col: [0.88, 0.46, 0.29] },
  { id: 'salt', name: 'SALT FLATS', icon: '⬜', sub: 'Dead flat  ·  floor it for top speed!', mult: 1, col: [0.96, 0.94, 0.9] },
  { id: 'black', name: 'BLACK SANDS', icon: '🌋', sub: 'Steep volcanic ridges  ·  x1.5 points', mult: 1.5, col: [0.33, 0.29, 0.29] }
];
var BW = { r: 0, s: 0, b: 0, any: false };
function biomeRaw(x, z, out, o){
  var far = smooth01(1200, 2400, Math.sqrt(x * x + z * z));
  var n1 = Math.sin(x * 0.00042 + 1.7) * Math.cos(z * 0.00037 - 0.6) + 0.35 * Math.sin((x + z) * 0.0011);
  var n2 = Math.sin(x * 0.00031 - 2.1 + z * 0.00018) * Math.cos(z * 0.00045 + 1.1) + 0.35 * Math.cos((x - z) * 0.0009);
  var ws = far * smooth01(0.42, 0.68, n1), wr = far * smooth01(0.38, 0.62, n2) * (1 - ws);
  out[o] = wr; out[o + 1] = ws; out[o + 2] = far * smooth01(0.42, 0.68, -n1) * (1 - wr);
}
// biome weights change slowly, so they're cached on a 24 m grid and blended (keeps terrain rebuilds fast)
var BC_N = 512, BC_G = 24, bcIX = new Int32Array(BC_N * BC_N).fill(-2147483648), bcIZ = new Int32Array(BC_N * BC_N), bcV = new Float32Array(BC_N * BC_N * 3);
function bcSlot(ix, iz){
  var k = (ix & (BC_N - 1)) * BC_N + (iz & (BC_N - 1));
  if (bcIX[k] !== ix || bcIZ[k] !== iz) { bcIX[k] = ix; bcIZ[k] = iz; biomeRaw(ix * BC_G, iz * BC_G, bcV, k * 3); }
  return k * 3;
}
function biomeW(x, z){
  BW.r = BW.s = BW.b = 0; BW.any = false;
  if (x * x + z * z < 1322500) return BW;                 // 1.15 km of classic golden dunes around the start
  var fx = x / BC_G, fz = z / BC_G, ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz;
  var a = bcSlot(ix, iz), b = bcSlot(ix + 1, iz), c = bcSlot(ix, iz + 1), d = bcSlot(ix + 1, iz + 1);
  var wa = (1 - tx) * (1 - tz), wb = tx * (1 - tz), wc = (1 - tx) * tz, wd = tx * tz;
  BW.r = bcV[a] * wa + bcV[b] * wb + bcV[c] * wc + bcV[d] * wd;
  BW.s = bcV[a + 1] * wa + bcV[b + 1] * wb + bcV[c + 1] * wc + bcV[d + 1] * wd;
  BW.b = bcV[a + 2] * wa + bcV[b + 2] * wb + bcV[c + 2] * wc + bcV[d + 2] * wd;
  BW.any = BW.r + BW.s + BW.b > 1e-5;
  return BW;
}
function biomeAt(x, z){
  var w = biomeW(x, z), best = 0, bi = 0;
  if (w.r > best) { best = w.r; bi = 1; } if (w.s > best) { best = w.s; bi = 2; } if (w.b > best) { best = w.b; bi = 3; }
  return best > 0.5 ? bi : 0;
}
function sandColor(x, z, h, steep, patch, out){
  var t = Math.max(0, Math.min(1, (h + 25) / 110));
  var r = 0.9 + 0.1 * t + patch - steep * 0.04, g = 0.72 + 0.1 * t + patch - steep * 0.07, b = 0.52 + 0.08 * t + patch * 0.6 - steep * 0.08;
  var w = biomeW(x, z);
  if (w.any) {
    var k = 1 - w.r - w.s - w.b, C;
    C = BIOMES[1].col; r = r * k + w.r * (C[0] + patch - steep * 0.06); g = g * k + w.r * (C[1] + patch * 0.6 - steep * 0.08); b = b * k + w.r * (C[2] + patch * 0.4 - steep * 0.06);
    var crack = 0.05 * (Math.abs(Math.sin(x * 0.11 + Math.sin(z * 0.07) * 3)) < 0.06 || Math.abs(Math.sin(z * 0.12 + Math.sin(x * 0.05) * 3)) < 0.06 ? 1 : 0);
    C = BIOMES[2].col; r += w.s * (C[0] - crack); g += w.s * (C[1] - crack); b += w.s * (C[2] - crack * 0.6);
    C = BIOMES[3].col; r += w.b * (C[0] + patch * 0.5 - steep * 0.05); g += w.b * (C[1] + patch * 0.5 - steep * 0.05); b += w.b * (C[2] + patch * 0.5 - steep * 0.04);
  }
  out[0] = r; out[1] = g; out[2] = b; return out;
}
var _sc = [0, 0, 0];
// oases: a sandy basin with a pond, ringed by palm trees
var OASIS_CELL = 650, oasisCache = new Map();
function oasisAt(i, j){
  var key = i * 100003 + j, o = oasisCache.get(key);
  if (o !== undefined) return o;
  o = null;
  var hh = hash(i * 5.3 + 2.9, j * 4.1 - 1.3);
  if (hh > 0.45 && !(i >= -1 && i <= 0 && j >= -1 && j <= 0)) {
    var cx = (i + 0.3 + hash(i + 1.2, j + 8.4) * 0.4) * OASIS_CELL, cz = (j + 0.3 + hash(i - 7.4, j + 2.2) * 0.4) * OASIS_CELL;
    var R = 14 + hash(i + 3.3, j - 3.3) * 10, p = pyrAt(Math.floor(cx / PYR_CELL), Math.floor(cz / PYR_CELL));
    if (!p || Math.max(Math.abs(cx - p.x), Math.abs(cz - p.z)) > p.B + R * 2.6 + 20) {
      o = { i: i, j: j, x: cx, z: cz, R: R, level: duneHeight(cx, cz) };
      o.water = o.level - 0.35;
    }
  }
  oasisCache.set(key, o); return o;
}
function smooth01(a, b, x){ var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function baseHeight(x, z){
  var h = duneHeight(x, z), o = oasisAt(Math.floor(x / OASIS_CELL), Math.floor(z / OASIS_CELL));
  if (o) {
    var d = Math.hypot(x - o.x, z - o.z);
    if (d < o.R * 2.4) {
      var q = d / o.R, target = q < 1 ? o.level - 1.6 * (1 - q * q) : o.level + (d - o.R) * 0.2;
      var t = smooth01(o.R * 1.1, o.R * 2.4, d);
      h = target * (1 - t) + h * t;
    }
  }
  return h;
}
function nearOasis(x, z, pad){
  var o = oasisAt(Math.floor(x / OASIS_CELL), Math.floor(z / OASIS_CELL));
  return !!(o && Math.hypot(x - o.x, z - o.z) < o.R * 2.4 + pad);
}
var RAMP_CELL = 140, PYR_CELL = 900, RAMP_BACK = 0.15;
var rampCache = new Map(), pyrCache = new Map();
function rampAt(i, j){
  var key = i * 100003 + j, r = rampCache.get(key);
  if (r !== undefined) return r;
  r = null;
  if (hash(i * 1.37 + 11.1, j * 0.91 - 7.7) > 0.45 && !(i >= -1 && i <= 0 && j >= -1 && j <= 0)) {
    var cx = (i + 0.25 + hash(i + 2.2, j + 5.5) * 0.5) * RAMP_CELL, cz = (j + 0.25 + hash(i - 4.4, j + 1.1) * 0.5) * RAMP_CELL;
    var sc = 0.8 + hash(i + 9.9, j - 3.3) * 0.9, a = hash(i - 8.8, j + 8.8) * TAU, L = 14 * sc;
    // the ramp starts flush with the sand at its entry so you roll straight onto it
    var base = baseHeight(cx - Math.sin(a) * L / 2, cz - Math.cos(a) * L / 2);
    if (!nearOasis(cx, cz, 25)) r = { i: i, j: j, x: cx, z: cz, a: a, sa: Math.sin(a), ca: Math.cos(a), L: L, W: 6.5 + sc * 2.5, H: 4.5 * sc, base: base };
  }
  rampCache.set(key, r); return r;
}
function pyrAt(i, j){
  var key = i * 100003 + j, p = pyrCache.get(key);
  if (p !== undefined) return p;
  p = null;
  if (hash(i * 3.1 + 1.7, j * 2.3 - 4.1) > 0.5 && !(i >= -1 && i <= 0 && j >= -1 && j <= 0)) {
    var cx = (i + 0.3 + hash(i + 6.1, j - 2.7) * 0.4) * PYR_CELL, cz = (j + 0.3 + hash(i - 1.9, j + 7.3) * 0.4) * PYR_CELL;
    var B = 60 + hash(i + 4.2, j + 4.2) * 55, k7 = B * 0.7;
    var pbase = Math.min(duneHeight(cx, cz), duneHeight(cx + k7, cz + k7), duneHeight(cx - k7, cz + k7), duneHeight(cx + k7, cz - k7), duneHeight(cx - k7, cz - k7));
    p = { i: i, j: j, x: cx, z: cz, B: B, H: B * 0.8, base: pbase };   // sits on the lowest corner so it never floats
  }
  pyrCache.set(key, p); return p;
}
function rampTop(r, x, z){
  var dx = x - r.x, dz = z - r.z;
  var u = dx * r.sa + dz * r.ca, w = dx * r.ca - dz * r.sa;
  if (Math.abs(w) > r.W / 2) return -1e9;
  var t = (u + r.L / 2) / r.L;
  if (t < 0 || t > 1 + RAMP_BACK) return -1e9;
  if (t <= 1) return r.base + r.H * Math.pow(t, 1.5);
  return r.base + r.H * (1 - (t - 1) / RAMP_BACK);
}
var FEAT = { top: -1e9, kind: null };
var userRamps = [];
function featureAt(x, z){
  FEAT.top = -1e9; FEAT.kind = null;
  var r = rampAt(Math.floor(x / RAMP_CELL), Math.floor(z / RAMP_CELL));
  if (r) { var t = rampTop(r, x, z); if (t > FEAT.top) { FEAT.top = t; FEAT.kind = 'ramp'; } }
  for (var ui = 0; ui < userRamps.length; ui++) {
    var ur = userRamps[ui], udx = x - ur.x, udz = z - ur.z;
    if (udx * udx + udz * udz > ur.L * ur.L) continue;
    var ut = rampTop(ur, x, z); if (ut > FEAT.top) { FEAT.top = ut; FEAT.kind = 'ramp'; }
  }
  var p = pyrAt(Math.floor(x / PYR_CELL), Math.floor(z / PYR_CELL));
  if (p) {
    var m = Math.max(Math.abs(x - p.x), Math.abs(z - p.z));
    if (m < p.B) { var pt = p.base + p.H * (1 - m / p.B); if (pt > FEAT.top) { FEAT.top = pt; FEAT.kind = 'pyramid'; } }
  }
  return FEAT;
}
function heightAt(x, z){
  var h = baseHeight(x, z), f = featureAt(x, z);
  return f.top > h ? f.top : h;
}
function featureKind(x, z){
  var b = baseHeight(x, z), f = featureAt(x, z);
  return f.top > b + 0.05 ? f.kind : null;
}
var _n = new V3(), _n2 = new V3();
function normalAt(x, z, out){
  var e = 0.4;
  var dx = (heightAt(x + e, z) - heightAt(x - e, z)) / (2 * e);
  var dz = (heightAt(x, z + e) - heightAt(x, z - e)) / (2 * e);
  return (out || _n).set(-dx, 1, -dz).normalize();
}

var T_SIZE = 1600, T_SEG = 300, CELL = T_SIZE / T_SEG;
var tGeo = new THREE.PlaneGeometry(T_SIZE, T_SIZE, T_SEG, T_SEG);
tGeo.rotateX(-Math.PI / 2);
var tPos = tGeo.attributes.position, tUV = tGeo.attributes.uv, tNor;
var baseXZ = new Float32Array(tPos.count * 2);
for (var ti = 0; ti < tPos.count; ti++) { baseXZ[ti * 2] = tPos.getX(ti); baseXZ[ti * 2 + 1] = tPos.getZ(ti); }
var tColArr = new Float32Array(tPos.count * 3);
tGeo.setAttribute('color', new THREE.BufferAttribute(tColArr, 3));
var SAND_MAP = sandTexture();
var sandFast = new THREE.MeshLambertMaterial({ map: SAND_MAP, vertexColors: true });
var terrain = new THREE.Mesh(tGeo, sandFast);
terrain.receiveShadow = true; terrain.frustumCulled = false;
scene.add(terrain);
var tCenter = { x: 1e9, z: 1e9 };
var farGround = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd8b47e }));
scene.add(farGround);

function rebuildTerrain(cx, cz){
  cx = Math.round(cx / CELL) * CELL; cz = Math.round(cz / CELL) * CELL;
  tCenter.x = cx; tCenter.z = cz;
  var i, x, z, h;
  for (i = 0; i < tPos.count; i++) {
    x = cx + baseXZ[i * 2]; z = cz + baseXZ[i * 2 + 1];
    h = baseHeight(x, z);                    // ramps & pyramids have their own meshes
    tPos.setXYZ(i, x, h, z);
    tUV.setXY(i, x / 7, z / 7);
  }
  tPos.needsUpdate = true; tUV.needsUpdate = true;
  tGeo.computeVertexNormals();
  tNor = tGeo.attributes.normal;
  for (i = 0; i < tPos.count; i++) {
    h = tPos.getY(i);
    var steep = Math.max(0, Math.min(1, (1 - tNor.getY(i)) * 3));
    var x2 = tPos.getX(i), z2 = tPos.getZ(i);
    var patch = 0.04 * Math.sin(x2 * 0.021 + Math.sin(z2 * 0.017) * 2) + 0.03 * Math.sin(z2 * 0.033 - x2 * 0.011);
    sandColor(x2, z2, h, steep, patch, _sc);
    tColArr[i * 3] = _sc[0]; tColArr[i * 3 + 1] = _sc[1]; tColArr[i * 3 + 2] = _sc[2];
  }
  tGeo.attributes.color.needsUpdate = true;
  placeScatter(cx, cz);
  placeFeatures(cx, cz);
  placeRocks(cx, cz);
}

/* ================= scenery: cacti, rocks, shrubs ================= */
var cactusMat = new THREE.MeshStandardMaterial({ color: 0x4d8a3c, roughness: 0.75 });
var cactusDark = new THREE.MeshStandardMaterial({ color: 0x3c7030, roughness: 0.8 });
var cactusGeos = (function(){
  var trunk = new THREE.CylinderGeometry(0.34, 0.4, 4.2, 14, 1), p = trunk.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z);
    if (r > 0.01) { var k = 1 + 0.06 * Math.cos(a * 7); p.setX(i, x * k); p.setZ(i, z * k); }
  }
  trunk.computeVertexNormals();
  function arm(pts, r){ return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(function(q){ return v(q[0], q[1], q[2]); })), 16, r, 10, false); }
  return {
    trunk: trunk, cap: new THREE.SphereGeometry(0.34, 14, 8, 0, TAU, 0, Math.PI / 2),
    armA: arm([[0.2, 1.9, 0], [0.75, 1.95, 0], [0.98, 2.3, 0], [1.0, 3.2, 0]], 0.21),
    armB: arm([[-0.2, 1.5, 0], [-0.68, 1.55, 0], [-0.86, 1.85, 0], [-0.88, 2.5, 0]], 0.19),
    capS: new THREE.SphereGeometry(0.21, 10, 6, 0, TAU, 0, Math.PI / 2),
    capS2: new THREE.SphereGeometry(0.19, 10, 6, 0, TAU, 0, Math.PI / 2)
  };
})();
function makeCactus(){
  var g = new THREE.Group();
  function add(geo, mat, x, y, z){ var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  add(cactusGeos.trunk, cactusMat, 0, 2.1, 0); add(cactusGeos.cap, cactusMat, 0, 4.2, 0);
  add(cactusGeos.armA, cactusDark, 0, 0, 0); add(cactusGeos.armB, cactusDark, 0, 0, 0);
  add(cactusGeos.capS, cactusDark, 1.0, 3.2, 0); add(cactusGeos.capS2, cactusDark, -0.88, 2.5, 0);
  return g;
}
var rockGeo = new THREE.DodecahedronGeometry(1, 0);
var rockMats = [new THREE.MeshStandardMaterial({ color: 0x9c6a48, roughness: 0.95, flatShading: true }),
                new THREE.MeshStandardMaterial({ color: 0x8a5c40, roughness: 0.95, flatShading: true })];
var shrubGeo = new THREE.IcosahedronGeometry(0.5, 0);
var shrubMat = new THREE.MeshLambertMaterial({ color: 0x8c8a4c, flatShading: true });
function makeShrub(){
  var g = new THREE.Group();
  for (var i = 0; i < 4; i++) {
    var m = new THREE.Mesh(shrubGeo, shrubMat);
    m.position.set(Math.sin(i * 2.1) * 0.35, 0.25 + (i % 2) * 0.15, Math.cos(i * 2.1) * 0.35);
    m.scale.setScalar(0.7 + (i % 3) * 0.2); m.castShadow = true; g.add(m);
  }
  return g;
}
var pools = { cactus: [], rock: [], shrub: [] }, cacList = [];
(function(){
  var i;
  for (i = 0; i < 130; i++) { var c0 = makeCactus(); c0.visible = false; scene.add(c0); pools.cactus.push(c0); }
  for (i = 0; i < 140; i++) { var r0 = new THREE.Mesh(rockGeo, rockMats[i % 2]); r0.castShadow = true; r0.receiveShadow = true; r0.visible = false; scene.add(r0); pools.rock.push(r0); }
  for (i = 0; i < 170; i++) { var s0 = makeShrub(); s0.visible = false; scene.add(s0); pools.shrub.push(s0); }
})();
function placeScatter(cx, cz){
  var CC = 80, r = 9, nc = 0, nr = 0, ns = 0;
  var ci = Math.floor(cx / CC), cj = Math.floor(cz / CC);
  cacList.length = 0;
  for (var ring = 0; ring <= r; ring++) {
    for (var i = ci - ring; i <= ci + ring; i++) {
      for (var j = cj - ring; j <= cj + ring; j++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== ring) continue;
        var px, pz, h1 = hash(i, j), h2 = hash(i + 31.7, j - 5.3), h3 = hash(i - 13.1, j + 21.9);
        if (h1 > 0.6 && nc < pools.cactus.length) {
          px = (i + hash(i + 7.1, j)) * CC; pz = (j + hash(i, j + 3.3)) * CC;
          if (px * px + pz * pz > 900 && !featureKind(px, pz) && !nearOasis(px, pz, 4) && !nearRock(px, pz, 12)) {
            var sc = 0.75 + hash(i + 1.7, j + 9.2) * 0.7, c = pools.cactus[nc++], py = baseHeight(px, pz) - 0.25;
            c.position.set(px, py, pz); c.rotation.y = h1 * 40; c.scale.setScalar(sc); c.visible = true;
            cacList.push({ x: px, y: py, z: pz, r: 0.5 * sc, h: 4.4 * sc, mesh: c });
          }
        }
        if (h2 > 0.35) {
          for (var q = 0; q < 2 && nr < pools.rock.length; q++) {
            px = (i + hash(i + q * 3.7, j + 1.1)) * CC; pz = (j + hash(i + 2.2, j + q * 5.9)) * CC;
            if (featureKind(px, pz)) continue;
            var rs = 0.35 + hash(i + q, j - q) * hash(j, i + q) * 2.2, rk = pools.rock[nr++];
            rk.position.set(px, baseHeight(px, pz) - rs * 0.25, pz);
            rk.scale.set(rs * 1.3, rs * 0.7, rs); rk.rotation.set(h2 * 5, h2 * 17 + q, 0); rk.visible = true;
          }
        }
        if (h3 > 0.3) {
          for (var w = 0; w < 2 && ns < pools.shrub.length; w++) {
            px = (i + hash(i + w * 9.1, j + 4.4)) * CC; pz = (j + hash(i + 6.6, j + w * 2.3)) * CC;
            if (featureKind(px, pz)) continue;
            var sh = pools.shrub[ns++];
            sh.position.set(px, baseHeight(px, pz) - 0.1, pz); sh.rotation.y = h3 * 9 + w; sh.scale.setScalar(0.7 + h3); sh.visible = true;
          }
        }
      }
    }
  }
  for (; nc < pools.cactus.length; nc++) pools.cactus[nc].visible = false;
  for (; nr < pools.rock.length; nr++) pools.rock[nr].visible = false;
  for (; ns < pools.shrub.length; ns++) pools.shrub[ns].visible = false;
}

/* ================= rock spires & stone arches ================= */
var ROCK_CELL = 420, rockCache = new Map();
var rockBandCanvas = (function(){
  var c = canvas(64, 256), x = c.getContext('2d'), cols = ['#c8774a', '#b8653c', '#d48a5a', '#a95a36', '#c46f45', '#dd9a66', '#b0603a'];
  x.fillStyle = '#c4703f'; x.fillRect(0, 0, 64, 256);
  for (var y = 0; y < 256; y += 6 + Math.floor(Math.random() * 16)) { x.fillStyle = cols[Math.floor(Math.random() * cols.length)]; x.fillRect(0, y, 64, 4 + Math.random() * 14); }
  return c;
})();
var spireTex = new THREE.CanvasTexture(rockBandCanvas); spireTex.wrapS = spireTex.wrapT = THREE.RepeatWrapping;
var archTex = new THREE.CanvasTexture(rockBandCanvas); archTex.wrapS = archTex.wrapT = THREE.RepeatWrapping; archTex.repeat.set(0.08, 0.06);
var spireMat = new THREE.MeshStandardMaterial({ map: spireTex, color: 0xffffff, roughness: 0.95, flatShading: true });
var archMat = new THREE.MeshStandardMaterial({ map: archTex, color: 0xffffff, roughness: 0.95, flatShading: true });
function rockJitter(g, amt){   // same offset for the same position, so faces stay joined
  var p = g.attributes.position;
  for (var i = 0; i < p.count; i++) {
    var x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    p.setXYZ(i, x + amt * Math.sin(x * 1.31 + y * 0.77 + z * 2.13), y + amt * 0.5 * Math.sin(x * 2.71 - z * 1.19), z + amt * Math.sin(z * 1.53 + y * 0.91 - x * 1.07));
  }
  g.computeVertexNormals(); return g;
}
var spireGeos = [0, 1, 2, 3].map(function(k){
  var pts = [], n = 10;
  for (var st = 0; st <= n; st++) {
    var t = st / n, r = 1 - 0.42 * t + 0.1 * Math.sin(t * 9 + k * 2);
    if (k % 2 && t > 0.8) r = 1.05 + 0.1 * Math.sin(k);           // hoodoo with a wide cap rock
    pts.push(new THREE.Vector2(Math.max(0.05, r), t));
  }
  pts.push(new THREE.Vector2(0.05, 1.0));
  return rockJitter(new THREE.LatheGeometry(pts, 7), 0.06);
});
function makeArchGeo(A){
  var sh = new THREE.Shape(), N = 16, So = A.Sx + A.T, Ho = A.Hh + A.T, k, t;
  sh.moveTo(So, -5);
  for (k = 0; k <= N; k++) { t = k / N * Math.PI; sh.lineTo(Math.cos(t) * So, Math.sin(t) * Ho); }
  sh.lineTo(-So, -5); sh.lineTo(-A.Sx, -5);
  for (k = N; k >= 0; k--) { t = k / N * Math.PI; sh.lineTo(Math.cos(t) * A.Sx, Math.sin(t) * A.Hh); }
  sh.lineTo(A.Sx, -5);
  var g = new THREE.ExtrudeGeometry(sh, { depth: A.W, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.6, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -A.W / 2);
  return rockJitter(g, 0.45);
}
function rockAt(i, j){
  var key = i * 100003 + j, r = rockCache.get(key);
  if (r !== undefined) return r;
  r = null;
  var hh = hash(i * 2.7 - 5.1, j * 3.9 + 8.3);
  if (hh > 0.42 && !(i >= -1 && i <= 0 && j >= -1 && j <= 0)) {
    var cx = (i + 0.25 + hash(i + 3.1, j - 6.2) * 0.5) * ROCK_CELL, cz = (j + 0.25 + hash(i - 2.6, j + 4.4) * 0.5) * ROCK_CELL;
    var clear = function(x, z, pad){ return !featureKind(x, z) && !nearOasis(x, z, pad); };
    r = { i: i, j: j, x: cx, z: cz, arch: null, spires: [] };
    if (hh > 0.76) {                                 // try a stone arch on flat-ish ground (several spots and angles)
      var Sx = 11 + hash(i, j + 2.2) * 9, Hh = 14 + hash(i + 2.2, j) * 14;
      var T = 3.2 + hash(i + 5.5, j + 5.5) * 1.6, W = 6 + hash(i - 1, j - 1) * 3, fo = Sx + T / 2, a0 = hash(i + 9.4, j + 1.7) * TAU;
      for (var tries = 0; tries < 18 && !r.arch; tries++) {
        var a = a0 + (tries % 6) * Math.PI / 6, off = Math.floor(tries / 6) * 45;
        var ax = cx + Math.cos(tries * 2.1) * off, az = cz + Math.sin(tries * 2.1) * off;
        var ux = Math.cos(a), uz = -Math.sin(a), wx = Math.sin(a), wz = Math.cos(a);
        var h1 = baseHeight(ax + ux * fo, az + uz * fo), h2 = baseHeight(ax - ux * fo, az - uz * fo), hc = baseHeight(ax, az);
        var lo = Math.min(h1, h2, hc), ok = Math.max(h1, h2, hc) - lo < 7 && clear(ax, az, 40) && clear(ax + ux * fo, az + uz * fo, 10) && clear(ax - ux * fo, az - uz * fo, 10);
        for (var k = -3; k <= 3 && ok; k++) if (baseHeight(ax + wx * k * 6, az + wz * k * 6) > lo + Hh * 0.4) ok = false;
        if (ok) r.arch = { id: i + '_' + j, x: ax, z: az, a: a, sa: Math.sin(a), ca: Math.cos(a), Sx: Sx, Hh: Hh, T: T, W: W, base: lo - 1, lastW: null };
      }
    }
    if (!r.arch) {                                   // a cluster of sandstone spires
      var n = 1 + Math.floor(hash(i + 7.7, j - 7.7) * 3);
      for (var q = 0; q < n; q++) {
        var ang = hash(i + q * 3.3, j + 1.9) * TAU, d = q ? 9 + hash(i - q, j + q) * 18 : 0;
        var sx = cx + Math.cos(ang) * d, sz = cz + Math.sin(ang) * d, rad = 2.2 + hash(i + q, j - 2.4) * 2.5;
        if (!clear(sx, sz, 8) || !clear(sx + rad + 3, sz, 0) || !clear(sx - rad - 3, sz, 0) || !clear(sx, sz + rad + 3, 0) || !clear(sx, sz - rad - 3, 0)) continue;
        r.spires.push({ x: sx, z: sz, r: rad, h: 12 + hash(i - q * 2.1, j + 5.2) * 22, base: baseHeight(sx, sz) - 1.5, g: Math.floor(hash(i + q, j + q * 1.7) * 4), rot: hash(q, i + j) * TAU });
      }
      if (!r.spires.length) r = null;
    }
  }
  rockCache.set(key, r); return r;
}
var spirePool = [], archPool = [], activeSpires = [], activeArches = [];
(function(){
  var i;
  for (i = 0; i < 40; i++) { var sm = new THREE.Mesh(spireGeos[0], spireMat); sm.castShadow = true; sm.receiveShadow = true; sm.visible = false; scene.add(sm); spirePool.push(sm); }
  for (i = 0; i < 12; i++) { var am = new THREE.Mesh(spireGeos[0], archMat); am.castShadow = true; am.receiveShadow = true; am.visible = false; scene.add(am); archPool.push(am); }
})();
function nearRock(x, z, pad){
  var r = rockAt(Math.floor(x / ROCK_CELL), Math.floor(z / ROCK_CELL));
  if (!r) return false;
  if (r.arch && Math.hypot(x - r.x, z - r.z) < r.arch.Sx + r.arch.T + pad) return true;
  for (var k = 0; k < r.spires.length; k++) if (Math.hypot(x - r.spires[k].x, z - r.spires[k].z) < r.spires[k].r + pad) return true;
  return false;
}
function placeRocks(cx, cz){
  var ns = 0, na = 0, ci = Math.floor(cx / ROCK_CELL), cj = Math.floor(cz / ROCK_CELL);
  activeSpires.length = 0; activeArches.length = 0;
  for (var i = ci - 2; i <= ci + 2; i++) {
    for (var j = cj - 2; j <= cj + 2; j++) {
      var r = rockAt(i, j); if (!r) continue;
      if (r.arch && na < archPool.length) {
        var A = r.arch, am = archPool[na++];
        if (!A.geo) A.geo = makeArchGeo(A);
        am.geometry = A.geo; am.position.set(A.x, A.base, A.z); am.rotation.set(0, A.a, 0); am.visible = true;
        activeArches.push(A);
      }
      r.spires.forEach(function(sp){
        if (ns >= spirePool.length) return;
        var m = spirePool[ns++];
        m.geometry = spireGeos[sp.g]; m.position.set(sp.x, sp.base, sp.z); m.scale.set(sp.r, sp.h, sp.r); m.rotation.set(0, sp.rot, 0); m.visible = true;
        cacList.push({ x: sp.x, y: sp.base, z: sp.z, r: sp.r * 0.85, h: sp.h, mesh: m, rock: true });
        activeSpires.push(sp);
      });
    }
  }
  for (; ns < spirePool.length; ns++) spirePool[ns].visible = false;
  for (; na < archPool.length; na++) archPool[na].visible = false;
}

/* ================= model-building helpers ================= */
var UPV = v(0, 1, 0);
function std(color, rough, metal){ return new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.6 : rough, metalness: metal || 0 }); }
function glow(color, intensity){ return new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: intensity || 1.5, roughness: 0.4 }); }
function shadowed(m){ m.castShadow = true; m.receiveShadow = true; return m; }
function mesh(geo, mat, parent, x, y, z, rx, ry, rz){
  var m = shadowed(new THREE.Mesh(geo, mat));
  m.position.set(x || 0, y || 0, z || 0);
  if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0);
  parent.add(m); return m;
}
function box(w, h, d, mat, parent, x, y, z, rx, ry, rz){ return mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, rx, ry, rz); }
function grp(parent, x, y, z){ var g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); parent.add(g); return g; }
function rod(a, b, r, mat, parent, seg, r2){
  var d = new V3().subVectors(b, a), L = d.length();
  var m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r2 == null ? r : r2, r, L, seg || 10), mat));
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(UPV, d.normalize());
  parent.add(m); return m;
}
function tube(pts, r, mat, parent, closed){
  var curve = new THREE.CatmullRomCurve3(pts.map(function(p){ return v(p[0], p[1], p[2]); }), !!closed);
  return mesh(new THREE.TubeGeometry(curve, Math.max(20, pts.length * 10), r, 8, !!closed), mat, parent);
}
function profileShape(pts){
  var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath(); return s;
}
function bodyShape(top, arches){
  var s = new THREE.Shape(); s.moveTo(top[0][0], top[0][1]);
  for (var i = 1; i < top.length; i++) s.lineTo(top[i][0], top[i][1]);
  var bottom = top[top.length - 1][1];
  arches.slice().sort(function(a, b){ return b.z - a.z; }).forEach(function(a){
    s.lineTo(a.z + a.r, bottom);
    s.absarc(a.z, a.y, a.r, 0, Math.PI, false);
    s.lineTo(a.z - a.r, bottom);
  });
  s.lineTo(top[0][0], top[0][1]);
  return s;
}
function extrude(shape, width, mat, parent, x, bevel){
  var b = bevel == null ? 0.03 : bevel;
  var g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 16 });
  g.rotateY(-Math.PI / 2);
  g.translate(width / 2 + (x || 0), 0, 0);
  return mesh(g, mat, parent);
}
function side(pts, width, mat, parent, x, bevel){ return extrude(profileShape(pts), width, mat, parent, x, bevel); }
function decal(tex, w, h, parent, x, y, z, ry, rx){
  var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, transparent: true, alphaTest: 0.1 }));
  m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); parent.add(m); return m;
}
function spring(a, b, r, turns, mat, parent){
  var d = new V3().subVectors(b, a), L = d.length(), pts = [];
  for (var k = 0; k <= turns * 12; k++) { var t = k / (turns * 12), an = t * turns * TAU; pts.push(v(Math.cos(an) * r, t * L, Math.sin(an) * r)); }
  var g = new THREE.Group(); g.position.copy(a); g.quaternion.setFromUnitVectors(UPV, d.normalize()); parent.add(g);
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 18, r * 0.22, 6, false), mat, g);
  return g;
}
function tire(R, w, mat, parent, knobs){
  var rIn = R - Math.min(w * 0.75, R * 0.42), c = Math.min(0.05, w * 0.25);
  var prof = [[rIn, -w / 2], [R - c, -w / 2], [R - c * 0.3, -w / 2 + c * 0.3], [R, -w / 2 + c], [R, w / 2 - c], [R - c * 0.3, w / 2 - c * 0.3], [R - c, w / 2], [rIn, w / 2]];
  var g = new THREE.LatheGeometry(prof.map(function(p){ return new THREE.Vector2(p[0], p[1]); }), 40);
  g.rotateZ(Math.PI / 2);
  var m = mesh(g, mat, parent);
  if (knobs) {
    var kh = Math.max(0.045, R * 0.08), kg = new THREE.BoxGeometry(w * 0.42, kh, Math.max(0.055, R * 0.1));
    for (var k = 0; k < knobs; k++) {
      var a = k / knobs * TAU;
      for (var s = -1; s <= 1; s += 2) {
        var kn = new THREE.Mesh(kg, mat);
        kn.position.set(s * w * 0.22, Math.sin(a + s * 0.06) * (R + kh * 0.25), Math.cos(a + s * 0.06) * (R + kh * 0.25));
        kn.rotation.x = Math.PI / 2 - (a + s * 0.06); kn.castShadow = true; parent.add(kn);
      }
    }
  }
  return m;
}
function spokeRim(R, w, rimMat, hubMat, spokeMat, parent){
  var rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022, 8, 48), rimMat); rim.rotation.y = Math.PI / 2; shadowed(rim); parent.add(rim);
  mesh(new THREE.CylinderGeometry(0.055, 0.055, w + 0.06, 16), hubMat, parent, 0, 0, 0, 0, 0, Math.PI / 2);
  for (var k = 0; k < 24; k++) {
    var a = k / 24 * TAU, sx = (k % 2 ? 1 : -1) * 0.05;
    rod(v(sx, Math.sin(a) * 0.05, Math.cos(a) * 0.05), v(sx * 0.2, Math.sin(a + 0.35) * (R - 0.01), Math.cos(a + 0.35) * (R - 0.01)), 0.0045, spokeMat, parent, 4);
  }
}
function discRim(R, w, sideSign, rimMat, darkMat, parent, vanes){
  mesh(new THREE.CylinderGeometry(R, R, w * 0.85, 32), darkMat, parent, 0, 0, 0, 0, 0, Math.PI / 2);
  mesh(new THREE.CylinderGeometry(R * 0.98, R * 0.98, 0.03, 32), rimMat, parent, sideSign * w * 0.42, 0, 0, 0, 0, Math.PI / 2);
  var n = vanes || 6;
  for (var k = 0; k < n; k++) {
    var a = k / n * TAU;
    box(0.035, R * 0.75, vanes ? 0.03 : R * 0.26, vanes ? darkMat : rimMat, parent, sideSign * (w * 0.42 + 0.02), Math.sin(a) * R * 0.52, Math.cos(a) * R * 0.52, Math.PI / 2 - a + (vanes ? 0.35 : 0), 0, 0);
  }
  mesh(new THREE.CylinderGeometry(R * 0.2, R * 0.2, 0.05, 16), rimMat, parent, sideSign * (w * 0.42 + 0.03), 0, 0, 0, 0, Math.PI / 2);
}
// flames (thrusters + boost exhaust): cone grows from the nozzle along -Y of its group
var FL_O = new THREE.ConeGeometry(0.16, 1.6, 14, 1, true); FL_O.translate(0, 0.8, 0); FL_O.rotateX(Math.PI);
var FL_I = new THREE.ConeGeometry(0.07, 0.9, 10, 1, true); FL_I.translate(0, 0.45, 0); FL_I.rotateX(Math.PI);
function flameMats(outer, inner){
  return [new THREE.MeshBasicMaterial({ color: outer, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
          new THREE.MeshBasicMaterial({ color: inner, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })];
}
var BLUE_FLAME = flameMats(0x66c8ff, 0xffffff), ORANGE_FLAME = flameMats(0xff7a22, 0xfff0c0);
function flame(parent, x, y, z, mats, backward, size){
  var g = grp(parent, x, y, z);
  if (backward) g.rotation.x = Math.PI / 2;
  var inner = grp(g); inner.scale.setScalar(size || 1);
  inner.add(new THREE.Mesh(FL_O, mats[0])); inner.add(new THREE.Mesh(FL_I, mats[1]));
  g.scale.setScalar(0.001);
  return g;
}

/* ================= ramps, pyramids, coins, rings ================= */
var woodMat = new THREE.MeshStandardMaterial({ color: 0xa8743e, roughness: 0.85, flatShading: true });
var woodDark = std(0x6e4724, 0.9);
var hazardMat = new THREE.MeshStandardMaterial({ color: 0xffd21a, emissive: 0x332400, roughness: 0.6 });
var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0xffffff, roughness: 0.9, flatShading: true });
var capMat = new THREE.MeshStandardMaterial({ color: 0xffcc33, roughness: 0.25, metalness: 0.9, emissive: 0x332200 });
var rampGeo = (function(){
  var pts = [[-0.5, -1.5], [-0.5, 0]];
  for (var k = 1; k <= 14; k++) { var t = k / 14; pts.push([t - 0.5, Math.pow(t, 1.5)]); }
  pts.push([0.5 + RAMP_BACK, 0], [0.5 + RAMP_BACK, -1.5]);
  var g = new THREE.ExtrudeGeometry(profileShape(pts), { depth: 1, bevelEnabled: false });
  g.rotateY(-Math.PI / 2); g.translate(0.5, 0, 0);
  return g;
})();
function makeRamp(){
  var g = new THREE.Group();
  g.body = shadowed(new THREE.Mesh(rampGeo, woodMat)); g.add(g.body);
  g.lip = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 0.35), hazardMat)); g.add(g.lip);
  g.railL = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 1), woodDark)); g.add(g.railL);
  g.railR = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 1), woodDark)); g.add(g.railR);
  g.visible = false; scene.add(g); return g;
}
var pyrGeo = new THREE.ConeGeometry(1, 1, 4, 1); pyrGeo.translate(0, 0.5, 0); pyrGeo.rotateY(Math.PI / 4);
function makePyramid(){
  var g = new THREE.Group();
  g.body = shadowed(new THREE.Mesh(pyrGeo, stoneMat)); g.add(g.body);
  g.cap = shadowed(new THREE.Mesh(pyrGeo, capMat)); g.add(g.cap);
  g.visible = false; scene.add(g); return g;
}
var coinGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.14, 28); coinGeo.rotateZ(Math.PI / 2);
var coinMat = new THREE.MeshStandardMaterial({ color: 0xffc81a, metalness: 1, roughness: 0.25, emissive: 0x6a4500 });
var coinStar = new THREE.CylinderGeometry(0.42, 0.42, 0.16, 5); coinStar.rotateZ(Math.PI / 2);
var coinStarMat = new THREE.MeshStandardMaterial({ color: 0xfff1a0, metalness: 0.8, roughness: 0.2, emissive: 0x8a6a00 });
function makeCoin(){
  var g = new THREE.Group();
  g.add(new THREE.Mesh(coinGeo, coinMat)); g.add(new THREE.Mesh(coinStar, coinStarMat));
  g.visible = false; scene.add(g); return g;
}
var ringGeo = new THREE.TorusGeometry(4.2, 0.32, 12, 48);
var ringMat = new THREE.MeshStandardMaterial({ color: 0x36e0ff, emissive: 0x36e0ff, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 });
var ringGlowMat = new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
var ringGlowGeo = new THREE.TorusGeometry(4.2, 0.9, 8, 48);
function makeRing(){
  var g = new THREE.Group();
  g.add(new THREE.Mesh(ringGeo, ringMat)); g.add(new THREE.Mesh(ringGlowGeo, ringGlowMat));
  g.visible = false; scene.add(g); return g;
}
var waterMat = new THREE.MeshStandardMaterial({ color: 0x2a8fbf, roughness: 0.06, metalness: 0.2, transparent: true, opacity: 0.86, envMapIntensity: 1.2 });
var waterGeo = new THREE.CircleGeometry(1, 56); waterGeo.rotateX(-Math.PI / 2);
var palmBark = new THREE.MeshStandardMaterial({ color: 0x8a6a45, roughness: 0.9 });
var palmLeaf = new THREE.MeshStandardMaterial({ color: 0x3f8f34, roughness: 0.7, side: THREE.DoubleSide });
var palmTrunkGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([v(0, 0, 0), v(0.25, 2.5, 0), v(0.75, 5, 0), v(1.3, 7, 0)]), 20, 0.24, 8, false);
var palmRingGeo = new THREE.TorusGeometry(0.27, 0.05, 6, 12); palmRingGeo.rotateX(Math.PI / 2);
var frondGeo = (function(){
  var g = new THREE.PlaneGeometry(0.9, 3.6, 1, 8); g.translate(0, 1.8, 0);
  var p = g.attributes.position;
  for (var i = 0; i < p.count; i++) { var y = p.getY(i), x = p.getX(i); p.setZ(i, Math.pow(y / 3.6, 2) * 1.7); p.setX(i, x * (1 - y / 4.2)); }
  g.computeVertexNormals(); return g;
})();
var coconutGeo = new THREE.SphereGeometry(0.18, 8, 6), coconutMat = std(0x5a3a1c, 0.8);
function makePalm(){
  var g = new THREE.Group();
  g.add(shadowed(new THREE.Mesh(palmTrunkGeo, palmBark)));
  for (var r = 0; r < 6; r++) { var rg = new THREE.Mesh(palmRingGeo, palmBark); rg.position.set(0.25 * Math.pow(r / 5, 1.6) * 4.2, 0.8 + r * 1.1, 0); g.add(rg); }
  var crown = grp(g, 1.3, 7, 0);
  for (var k = 0; k < 9; k++) {
    var fr = grp(crown); fr.rotation.y = k / 9 * TAU + Math.random() * 0.3;
    var fm = shadowed(new THREE.Mesh(frondGeo, palmLeaf)); fm.rotation.x = 0.9 + Math.random() * 0.5; fr.add(fm);
  }
  for (var c = 0; c < 3; c++) { var co = new THREE.Mesh(coconutGeo, coconutMat); co.position.set(Math.cos(c * 2.1) * 0.25, -0.25, Math.sin(c * 2.1) * 0.25); crown.add(co); }
  return g;
}
function makeOasis(){
  var g = new THREE.Group();
  g.water = new THREE.Mesh(waterGeo, waterMat); g.water.receiveShadow = true; g.add(g.water);
  g.palms = [];
  for (var k = 0; k < 8; k++) { var pm = makePalm(); scene.add(pm); g.palms.push(pm); }
  g.visible = false; scene.add(g); return g;
}
var fpools = { ramp: [], pyr: [], coin: [], ring: [], oasis: [] };
(function(){
  var i;
  for (i = 0; i < 95; i++) fpools.ramp.push(makeRamp());
  for (i = 0; i < 6; i++) fpools.pyr.push(makePyramid());
  for (i = 0; i < 420; i++) fpools.coin.push(makeCoin());
  for (i = 0; i < 50; i++) fpools.ring.push(makeRing());
  for (i = 0; i < 4; i++) fpools.oasis.push(makeOasis());
})();
var collected = new Set();
var activeRamps = [], activePyrs = [], activeCoins = [], activeRings = [], activeOases = [];
function placeFeatures(cx, cz){
  var nRamp = 0, nPyr = 0, nCoin = 0, nRing = 0, i, j, k;
  activeRamps.length = 0; activePyrs.length = 0; activeCoins.length = 0; activeRings.length = 0;
  function coin(id, x, y, z){
    if (collected.has(id) || nCoin >= fpools.coin.length) return;
    var c = fpools.coin[nCoin++]; c.position.set(x, y, z); c.visible = true;
    activeCoins.push({ m: c, id: id, x: x, y: y, z: z });
  }
  function ringAt(id, x, y, z, yaw){
    if (collected.has(id) || nRing >= fpools.ring.length) return;
    var r = fpools.ring[nRing++]; r.position.set(x, y, z); r.rotation.set(0, yaw, 0); r.visible = true;
    activeRings.push({ m: r, id: id, x: x, y: y, z: z });
  }
  // ramps (+ coin arcs and rings over their jumps)
  var ri = Math.floor(cx / RAMP_CELL), rj = Math.floor(cz / RAMP_CELL), R = 6;
  for (i = ri - R; i <= ri + R; i++) {
    for (j = rj - R; j <= rj + R; j++) {
      var r = rampAt(i, j);
      if (r && nRamp < fpools.ramp.length) {
        var g = fpools.ramp[nRamp++];
        g.position.set(r.x, r.base, r.z); g.rotation.set(0, r.a, 0);
        g.body.scale.set(r.W, r.H, r.L);
        g.lip.scale.x = r.W; g.lip.position.set(0, r.H + 0.04, r.L / 2 - 0.17);
        g.railL.scale.z = r.L; g.railL.position.set(r.W / 2, r.H * 0.35, 0);
        g.railR.scale.z = r.L; g.railR.position.set(-r.W / 2, r.H * 0.35, 0);
        g.visible = true; activeRamps.push(r);
        if (Math.abs(i - ri) > 3 || Math.abs(j - rj) > 3) continue;   // coins & rings only on nearby ramps
        var lipX = r.x + r.sa * r.L / 2, lipZ = r.z + r.ca * r.L / 2, top = r.base + r.H;
        for (k = 0; k < 6; k++) {
          var d = 8 + k * 7, arc = Math.sin(Math.PI * (k + 1) / 7);
          coin('r' + i + '_' + j + '_' + k, lipX + r.sa * d, top + 2.5 + arc * (3 + r.H), lipZ + r.ca * d);
        }
        if (hash(i + 0.5, j + 0.5) > 0.35) ringAt('R' + i + '_' + j, lipX + r.sa * 30, top + 9 + r.H, lipZ + r.ca * 30, r.a);
      }
      if (hash(i * 0.77 + 3.3, j * 1.13 - 9.1) > 0.8) {
        var sx = (i + 0.2 + hash(i, j + 0.7) * 0.6) * RAMP_CELL, sz = (j + 0.2 + hash(i + 0.7, j) * 0.6) * RAMP_CELL;
        ringAt('S' + i + '_' + j, sx, baseHeight(sx, sz) + 22 + hash(i + 3, j) * 25, sz, hash(i + 5, j + 5) * TAU);
      }
    }
  }
  // dune coin trails
  var CC = 80, ci = Math.floor(cx / CC), cj = Math.floor(cz / CC);
  for (i = ci - 5; i <= ci + 5; i++) {
    for (j = cj - 5; j <= cj + 5; j++) {
      if (hash(i + 51.3, j - 17.9) < 0.74) continue;
      var a = hash(i - 3.3, j + 7.7) * TAU, x0 = (i + 0.3) * CC, z0 = (j + 0.3) * CC;
      for (k = 0; k < 6; k++) {
        var px = x0 + Math.sin(a) * k * 5, pz = z0 + Math.cos(a) * k * 5;
        coin('d' + i + '_' + j + '_' + k, px, heightAt(px, pz) + 1.4, pz);
      }
    }
  }
  // pyramids
  var pi0 = Math.floor(cx / PYR_CELL), pj0 = Math.floor(cz / PYR_CELL);
  for (i = pi0 - 1; i <= pi0 + 1; i++) {
    for (j = pj0 - 1; j <= pj0 + 1; j++) {
      var p = pyrAt(i, j);
      if (!p || nPyr >= fpools.pyr.length) continue;
      var pg = fpools.pyr[nPyr++], sd = p.B * Math.SQRT2;
      pg.position.set(p.x, p.base + 0.25, p.z);
      pg.body.scale.set(sd, p.H, sd);
      pg.cap.scale.set(sd * 0.08, p.H * 0.08, sd * 0.08); pg.cap.position.y = p.H * 0.925;
      pg.visible = true; activePyrs.push(p);
      ringAt('P' + i + '_' + j, p.x, p.base + p.H + 30, p.z, 0);
      for (k = 0; k < 8; k++) {
        var t = (k + 1) / 9;
        coin('p' + i + '_' + j + '_' + k, p.x, p.base + p.H * t + 1.4, p.z - p.B * (1 - t));
      }
    }
  }
  // coin lines through stone arches
  var rci = Math.floor(cx / ROCK_CELL), rcj = Math.floor(cz / ROCK_CELL);
  for (i = rci - 2; i <= rci + 2; i++) for (j = rcj - 2; j <= rcj + 2; j++) {
    var rk = rockAt(i, j);
    if (!rk || !rk.arch) continue;
    for (k = 0; k < 5; k++) { var wd = (k - 2) * 5, ax = rk.arch.x + rk.arch.sa * wd, az = rk.arch.z + rk.arch.ca * wd; coin('a' + i + '_' + j + '_' + k, ax, baseHeight(ax, az) + 1.6, az); }
  }
  // oases
  var nOas = 0, oi0 = Math.floor(cx / OASIS_CELL), oj0 = Math.floor(cz / OASIS_CELL);
  activeOases.length = 0;
  for (i = oi0 - 1; i <= oi0 + 1; i++) {
    for (j = oj0 - 1; j <= oj0 + 1; j++) {
      var o = oasisAt(i, j);
      if (!o || nOas >= fpools.oasis.length) continue;
      var og = fpools.oasis[nOas++];
      og.position.set(o.x, o.water, o.z); og.water.scale.set(o.R * 0.92, 1, o.R * 0.92); og.visible = true;
      og.palms.forEach(function(pm, k){
        var a = k / og.palms.length * TAU + hash(o.i + k, o.j) * 0.5, d = o.R * (1.05 + hash(o.i, o.j + k) * 0.35);
        var px = o.x + Math.cos(a) * d, pz = o.z + Math.sin(a) * d, sc = 0.85 + hash(o.i + k * 2, o.j - k) * 0.45;
        pm.position.set(px, baseHeight(px, pz) - 0.2, pz); pm.rotation.y = -a + Math.PI + (hash(k, o.i) - 0.5) * 0.8; pm.scale.setScalar(sc); pm.visible = true;
        cacList.push({ x: px, y: pm.position.y, z: pz, r: 0.3 * sc, h: 7 * sc, mesh: pm });
      });
      activeOases.push(o);
      for (k = 0; k < 6; k++) { var ca = k / 6 * TAU; coin('o' + i + '_' + j + '_' + k, o.x + Math.cos(ca) * o.R * 0.5, o.water + 1.6, o.z + Math.sin(ca) * o.R * 0.5); }
    }
  }
  for (; nOas < fpools.oasis.length; nOas++) { fpools.oasis[nOas].visible = false; fpools.oasis[nOas].palms.forEach(function(pm){ pm.visible = false; }); }
  for (; nRamp < fpools.ramp.length; nRamp++) fpools.ramp[nRamp].visible = false;
  for (; nPyr < fpools.pyr.length; nPyr++) fpools.pyr[nPyr].visible = false;
  for (; nCoin < fpools.coin.length; nCoin++) fpools.coin[nCoin].visible = false;
  for (; nRing < fpools.ring.length; nRing++) fpools.ring[nRing].visible = false;
}

/* ================= the rider / driver ================= */
function makeRider(o){
  var suit = std(o.suit, 0.75), pants = std(o.pants, 0.75), acc = std(o.accent, 0.6);
  var helmetM = std(o.helmet, 0.25, 0.1), dark = std(0x1c1c22, 0.7), gogFrame = std(0x24262c, 0.3, 0.2);
  var lens = std(o.lens || 0xff7a1a, 0.08, 0.9), gloveM = std(o.glove || 0x1c1c22, 0.8), bootM = std(o.boot || 0xf0f0f0, 0.5);
  var R = {};
  R.root = new THREE.Group();
  R.hips = grp(R.root);
  var pel = mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.2, 12), pants, R.hips, 0, 0.02, 0); pel.scale.z = 0.75;
  R.torso = grp(R.hips, 0, 0.06, 0);
  var jer = mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.56, 14), suit, R.torso, 0, 0.3, 0); jer.scale.z = 0.72;
  var band = mesh(new THREE.CylinderGeometry(0.214, 0.205, 0.07, 14), acc, R.torso, 0, 0.47, 0); band.scale.z = 0.74;
  var band2 = mesh(new THREE.CylinderGeometry(0.175, 0.165, 0.05, 14), acc, R.torso, 0, 0.1, 0); band2.scale.z = 0.74;
  box(0.34, 0.3, 0.06, dark, R.torso, 0, 0.36, 0.135, -0.08);
  decal(numberTex(o.number || '77', '#' + new THREE.Color(o.suit).getHexString(), '#ffffff'), 0.22, 0.22, R.torso, 0, 0.32, -0.123, Math.PI);
  mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), dark, R.torso, 0, 0.6, 0);
  R.head = grp(R.torso, 0, 0.75, 0);
  var helm = mesh(new THREE.SphereGeometry(0.175, 24, 18), helmetM, R.head); helm.scale.set(1, 1.05, 1.12);
  box(0.2, 0.11, 0.12, helmetM, R.head, 0, -0.1, 0.15, 0.2);
  box(0.09, 0.06, 0.03, dark, R.head, 0, -0.09, 0.215);
  box(0.27, 0.02, 0.17, helmetM, R.head, 0, 0.13, 0.19, -0.28);
  box(0.06, 0.035, 0.32, acc, R.head, 0, 0.175, 0.0);
  box(0.27, 0.08, 0.05, gogFrame, R.head, 0, 0.025, 0.185);
  box(0.23, 0.06, 0.02, lens, R.head, 0, 0.025, 0.212);
  var strap = new THREE.Mesh(new THREE.TorusGeometry(0.178, 0.014, 6, 28), dark); strap.rotation.x = Math.PI / 2; strap.position.y = 0.025; strap.scale.set(1, 1.13, 1); R.head.add(strap);
  function arm(s){
    var sh = grp(R.torso, s * 0.22, 0.5, 0);
    mesh(new THREE.SphereGeometry(0.07, 12, 10), suit, sh);
    mesh(new THREE.CylinderGeometry(0.06, 0.052, 0.3, 10), suit, sh, 0, -0.15, 0);
    var el = grp(sh, 0, -0.3, 0);
    mesh(new THREE.SphereGeometry(0.055, 10, 8), acc, el);
    mesh(new THREE.CylinderGeometry(0.05, 0.044, 0.26, 10), suit, el, 0, -0.13, 0);
    box(0.085, 0.11, 0.075, gloveM, el, 0, -0.3, 0.01);
    return { s: sh, e: el };
  }
  function leg(s){
    var hp = grp(R.hips, s * 0.1, -0.03, 0);
    mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.42, 10), pants, hp, 0, -0.21, 0);
    box(0.02, 0.28, 0.07, acc, hp, s * 0.074, -0.2, 0);
    var kn = grp(hp, 0, -0.42, 0);
    mesh(new THREE.SphereGeometry(0.07, 10, 8), pants, kn);
    box(0.1, 0.15, 0.05, dark, kn, 0, -0.04, 0.066);
    mesh(new THREE.CylinderGeometry(0.066, 0.058, 0.2, 10), pants, kn, 0, -0.1, 0);
    box(0.135, 0.29, 0.16, bootM, kn, 0, -0.33, 0);
    box(0.14, 0.02, 0.165, dark, kn, 0, -0.27, 0);
    box(0.14, 0.02, 0.165, dark, kn, 0, -0.37, 0);
    box(0.135, 0.05, 0.28, dark, kn, 0, -0.48, 0.05);
    return { h: hp, k: kn };
  }
  var aL = arm(1), aR = arm(-1), lL = leg(1), lR = leg(-1);
  R.sL = aL.s; R.eL = aL.e; R.sR = aR.s; R.eR = aR.e;
  R.hL = lL.h; R.kL = lL.k; R.hR = lR.h; R.kR = lR.k;
  return R;
}

/* ================= vehicles ================= */
var vehRoot = new THREE.Group(); scene.add(vehRoot);
function rubberMat(){ return new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92, side: THREE.DoubleSide }); }
function clearcoat(c, metal, rough){ return new THREE.MeshPhysicalMaterial({ color: c, metalness: metal, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08 }); }

function buildBike(o){
  o = o || {};
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var team = o.team || std(0xe63323, 0.3, 0.05), white = o.white || std(0xf4f4f4, 0.35), black = std(0x17171a, 0.7);
  var num = o.number || '77', plateBg = o.plateBg || '#ffffff', plateFg = o.plateFg || '#111111';
  var alu = std(0xcfd3d8, 0.28, 0.9), dark = std(0x2b2d31, 0.45, 0.6), gold = std(0xd8a21a, 0.25, 0.9);
  var rubber = rubberMat(), ti = std(0xb9a48e, 0.3, 0.85), orange = std(0xff7a1a, 0.45), springM = std(0xffd21a, 0.4, 0.3);
  [-0.07, 0.07].forEach(function(x){
    tube([[x, 1.17, 0.5], [x, 0.86, 0.38], [x, 0.56, 0.2], [x, 0.43, -0.06], [x, 0.6, -0.22], [x, 0.98, -0.2], [x, 1.12, -0.15]], 0.03, alu, m);
    tube([[x, 1.2, 0.46], [x, 1.13, 0.1], [x, 1.08, -0.2], [x, 1.1, -0.55], [x, 1.13, -0.9]], 0.022, alu, m);
  });
  rod(v(0, 1.08, 0.57), v(0, 1.34, 0.47), 0.05, alu, m, 16);
  box(0.25, 0.26, 0.26, dark, m, 0, 0.87, 0.14);
  for (var f = 0; f < 5; f++) box(0.29, 0.014, 0.29, alu, m, 0, 0.77 + f * 0.05, 0.14);
  box(0.3, 0.32, 0.46, dark, m, 0, 0.56, -0.02);
  mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24), alu, m, 0.16, 0.55, 0.0, 0, 0, Math.PI / 2);
  mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 20), team, m, -0.16, 0.52, -0.05, 0, 0, Math.PI / 2);
  [-1, 1].forEach(function(s){
    box(0.05, 0.3, 0.26, dark, m, s * 0.21, 0.92, 0.33);
    for (var k = 0; k < 7; k++) box(0.054, 0.012, 0.24, alu, m, s * 0.21, 0.79 + k * 0.042, 0.33);
  });
  side([[-0.05, 1.08], [0.2, 1.12], [0.45, 1.12], [0.6, 1.2], [0.63, 1.32], [0.5, 1.37], [0.25, 1.27], [0.0, 1.23], [-0.15, 1.2]], 0.42, team, m, 0, 0.035);
  side([[0.18, 0.84], [0.62, 0.95], [0.67, 1.2], [0.45, 1.16], [0.22, 1.08]], 0.5, team, m, 0, 0.02);
  side([[0.3, 0.98], [0.62, 1.04], [0.64, 1.11], [0.33, 1.07]], 0.54, white, m, 0, 0.01);
  side([[-0.97, 1.13], [-0.2, 1.18], [0.18, 1.22], [0.22, 1.29], [0.1, 1.31], [-0.3, 1.28], [-0.97, 1.23]], 0.3, black, m, 0, 0.035);
  side([[-1.28, 1.06], [-0.85, 1.1], [-0.25, 1.12], [-0.2, 0.95], [-0.45, 0.85], [-0.9, 0.98], [-1.28, 1.01]], 0.36, white, m, 0, 0.02);
  side([[-1.0, 1.08], [-0.4, 1.13], [-0.38, 1.1], [-1.0, 1.05]], 0.4, team, m, 0, 0.005);
  var plateTex = numberTex(num, plateBg, plateFg);
  decal(plateTex, 0.28, 0.2, m, 0.225, 1.0, -0.55, Math.PI / 2);
  decal(plateTex, 0.28, 0.2, m, -0.225, 1.0, -0.55, -Math.PI / 2);
  [-1, 1].forEach(function(s){
    rod(v(s * 0.1, 0.56, -0.1), v(s * 0.1, 0.45, -0.75), 0.034, alu, m, 8);
    box(0.12, 0.03, 0.06, alu, m, s * 0.18, 0.5, -0.12);
  });
  rod(v(0, 0.62, -0.34), v(0, 1.0, -0.18), 0.022, alu, m, 10);
  spring(v(0, 0.66, -0.32), v(0, 0.94, -0.2), 0.05, 7, springM, m);
  rod(v(0, 0.92, -0.21), v(0, 1.02, -0.17), 0.045, dark, m, 12);
  rod(v(0.13, 0.58, 0.04), v(0.13, 0.5, -0.74), 0.014, dark, m, 6);
  rod(v(0.13, 0.46, 0.0), v(0.13, 0.38, -0.74), 0.014, dark, m, 6);
  tube([[0.06, 0.86, 0.28], [0.18, 0.72, 0.33], [0.22, 0.56, 0.14], [0.2, 0.6, -0.15], [0.2, 0.82, -0.42], [0.21, 0.96, -0.58]], 0.04, ti, m);
  rod(v(0.21, 0.96, -0.58), v(0.23, 1.09, -1.06), 0.066, alu, m, 18);
  rod(v(0.23, 1.09, -1.06), v(0.233, 1.1, -1.1), 0.05, dark, m, 14);
  var fr = grp(m, 0, 0, 0.85), fa = grp(fr, 0, 0, -0.85);
  [-1, 1].forEach(function(s){
    rod(v(s * 0.09, 1.36, 0.43), v(s * 0.09, 0.9, 0.63), 0.032, gold, fa, 12);
    rod(v(s * 0.09, 0.97, 0.6), v(s * 0.09, 0.45, 0.85), 0.043, black, fa, 12);
    box(0.06, 0.06, 0.18, orange, fa, s * 0.41, 1.47, 0.47, 0, s * 0.15, 0);
    rod(v(s * 0.3, 1.42, 0.43), v(s * 0.44, 1.45, 0.4), 0.025, black, fa, 10);
  });
  box(0.3, 0.05, 0.1, alu, fa, 0, 1.36, 0.43);
  box(0.28, 0.05, 0.1, alu, fa, 0, 1.18, 0.5);
  tube([[-0.42, 1.45, 0.38], [-0.22, 1.41, 0.43], [0, 1.4, 0.44], [0.22, 1.41, 0.43], [0.42, 1.45, 0.38]], 0.016, black, fa);
  box(0.13, 0.05, 0.06, team, fa, 0, 1.43, 0.44);
  box(0.34, 0.27, 0.03, white, fa, 0, 1.2, 0.62, -0.35);
  decal(numberTex(num, plateBg, plateFg), 0.26, 0.2, fa, 0, 1.2, 0.638, 0, -0.35);
  box(0.1, 0.06, 0.04, glow(0xfff6dd, 2.5), fa, 0, 1.06, 0.66, -0.35);
  side([[0.55, 1.0], [0.8, 0.99], [1.05, 0.96], [1.26, 0.9], [1.23, 0.86], [0.95, 0.9], [0.6, 0.95]], 0.2, white, fa, 0, 0.02);
  var fws = grp(grp(fa, 0, 0.45, 0.85));
  tire(0.46, 0.11, rubber, fws, 30); spokeRim(0.34, 0.11, alu, alu, alu, fws);
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 24), alu, fws, -0.07, 0, 0, 0, 0, Math.PI / 2);
  var rws = grp(grp(m, 0, 0.45, -0.75));
  tire(0.46, 0.14, rubber, rws, 30); spokeRim(0.34, 0.14, alu, alu, alu, rws);
  mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 28), dark, rws, 0.11, 0, 0, 0, 0, Math.PI / 2);
  V.wheels = [{ g: fws, r: 0.46 }, { g: rws, r: 0.46 }];
  V.steer = [fr];
  V.paint = [team];
  V.rider = makeRider(o.rider || { suit: 0x2b6cff, pants: 0xf2f2f2, accent: 0xffd400, helmet: 0xffd400, number: '77' });
  V.rider.root.position.set(0, 1.17, -0.3); V.riderY = 1.17;
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0.233, 1.1, -1.12, ORANGE_FLAME, true, 0.55);
  V.exhaust = [0.233, 1.1, -1.4];
  V.dust = [[0, 0, -0.78]];
  return V;
}

function buildScooter(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var body = std(0x2a2e35, 0.4, 0.5), black = std(0x141417, 0.85), alu = std(0xbfc4ca, 0.3, 0.9), accent = std(0x22d3ee, 0.35, 0.2);
  var rubber = rubberMat(), led = glow(0x22e6ff, 2);
  side([[-0.52, 0.13], [0.42, 0.13], [0.5, 0.18], [0.46, 0.26], [-0.5, 0.26], [-0.57, 0.2]], 0.2, body, m, 0, 0.025);
  box(0.17, 0.006, 0.86, black, m, 0, 0.29, -0.05);
  box(0.012, 0.02, 0.8, led, m, 0.12, 0.19, -0.05); box(0.012, 0.02, 0.8, led, m, -0.12, 0.19, -0.05);
  side([[-0.74, 0.3], [-0.55, 0.33], [-0.4, 0.28], [-0.42, 0.26], [-0.56, 0.29], [-0.74, 0.27]], 0.12, body, m, 0, 0.02);
  box(0.06, 0.02, 0.03, glow(0xff2a2a, 2), m, 0, 0.3, -0.76);
  rod(v(-0.06, 0.15, -0.3), v(-0.16, 0.02, -0.38), 0.012, alu, m, 6);
  var fr = grp(m, 0, 0, 0.55), fa = grp(fr, 0, 0, -0.55);
  rod(v(0, 0.24, 0.47), v(0, 1.12, 0.4), 0.032, body, fa, 14);
  box(0.08, 0.1, 0.07, accent, fa, 0, 0.42, 0.47);
  [-1, 1].forEach(function(s){ rod(v(s * 0.05, 0.3, 0.5), v(s * 0.05, 0.2, 0.55), 0.016, alu, fa, 8); });
  rod(v(-0.3, 1.13, 0.4), v(0.3, 1.13, 0.4), 0.017, black, fa, 10);
  [-1, 1].forEach(function(s){ rod(v(s * 0.2, 1.13, 0.4), v(s * 0.31, 1.13, 0.4), 0.026, black, fa, 10); });
  box(0.1, 0.03, 0.06, glow(0x9ad8ff, 1.2), fa, 0, 1.15, 0.41);
  box(0.08, 0.05, 0.03, glow(0xffffff, 2.5), fa, 0, 0.98, 0.43);
  box(0.06, 0.02, 0.18, body, fa, 0, 0.42, 0.55);
  var fws = grp(grp(fa, 0, 0.2, 0.55));
  tire(0.2, 0.07, rubber, fws); mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 24), accent, fws, 0, 0, 0, 0, 0, Math.PI / 2);
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16), alu, fws, 0, 0, 0, 0, 0, Math.PI / 2);
  var rws = grp(grp(m, 0, 0.2, -0.6));
  tire(0.2, 0.07, rubber, rws); mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.065, 24), body, rws, 0, 0, 0, 0, 0, Math.PI / 2);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 16), accent, rws, 0, 0, 0, 0, 0, Math.PI / 2);
  V.wheels = [{ g: fws, r: 0.2 }, { g: rws, r: 0.2 }];
  V.steer = [fr];
  V.paint = [accent];
  V.rider = makeRider({ suit: 0x111827, pants: 0x374151, accent: 0x22d3ee, helmet: 0xf5f5f5, lens: 0x22d3ee, boot: 0x22d3ee, number: '08' });
  V.rider.root.position.set(0, 1.2, -0.08); V.riderY = 1.2;
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0, 0.22, -0.78, BLUE_FLAME, true, 0.45);
  V.exhaust = [0, 0.22, -1.0];
  V.dust = [[0, 0, -0.6]];
  return V;
}

function buildQuad(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var paint = std(0x2fbf4a, 0.35, 0.1), black = std(0x18181b, 0.7), alu = std(0xc8ccd2, 0.3, 0.9), dark = std(0x2b2d31, 0.45, 0.6);
  var rubber = rubberMat(), rimM = std(0xf2f2f2, 0.35, 0.5), springM = std(0xffd21a, 0.4, 0.3);
  [-1, 1].forEach(function(s){ tube([[s * 0.22, 0.45, 0.8], [s * 0.25, 0.48, 0.2], [s * 0.25, 0.48, -0.5], [s * 0.22, 0.55, -0.9]], 0.035, dark, m); });
  box(0.42, 0.36, 0.55, dark, m, 0, 0.62, 0.0);
  for (var f = 0; f < 4; f++) box(0.46, 0.014, 0.3, alu, m, 0, 0.72 + f * 0.05, 0.12);
  side([[0.15, 0.74], [0.55, 0.82], [0.95, 0.8], [1.08, 0.7], [0.98, 0.64], [0.5, 0.68], [0.15, 0.66]], 1.1, paint, m, 0, 0.04);
  side([[-1.08, 0.72], [-0.8, 0.82], [-0.25, 0.86], [-0.2, 0.72], [-0.6, 0.68], [-1.02, 0.64]], 1.1, paint, m, 0, 0.04);
  side([[-0.05, 0.86], [0.3, 0.92], [0.46, 1.04], [0.3, 1.08], [-0.05, 1.02]], 0.4, paint, m, 0, 0.03);
  side([[-0.78, 0.9], [-0.05, 0.94], [0.05, 1.0], [-0.1, 1.05], [-0.78, 1.0]], 0.36, black, m, 0, 0.03);
  tube([[-0.42, 0.88, 0.72], [0.42, 0.88, 0.72]], 0.02, alu, m); tube([[-0.42, 0.88, 0.92], [0.42, 0.88, 0.92]], 0.02, alu, m);
  tube([[-0.42, 0.92, -0.75], [0.42, 0.92, -0.75]], 0.02, alu, m); tube([[-0.42, 0.92, -0.98], [0.42, 0.92, -0.98]], 0.02, alu, m);
  tube([[-0.36, 0.48, 1.13], [-0.32, 0.72, 1.17], [0.32, 0.72, 1.17], [0.36, 0.48, 1.13]], 0.035, black, m);
  box(0.36, 0.09, 0.05, glow(0xfff6dd, 2.4), m, 0, 0.8, 1.08);
  box(0.3, 0.06, 0.04, glow(0xff2020, 1.6), m, 0, 0.78, -1.08);
  [-1, 1].forEach(function(s){ box(0.4, 0.04, 0.5, black, m, s * 0.42, 0.5, -0.1); });
  decal(numberTex('07', '#ffffff', '#111111'), 0.26, 0.2, m, 0, 0.96, 0.4, 0, -0.5);
  var fr = grp(m, 0, 0, 0.45), fa = grp(fr, 0, 0, -0.45);
  rod(v(0, 0.75, 0.42), v(0, 1.12, 0.36), 0.03, alu, fa, 10);
  tube([[-0.4, 1.2, 0.36], [-0.2, 1.17, 0.41], [0.2, 1.17, 0.41], [0.4, 1.2, 0.36]], 0.017, black, fa);
  [-1, 1].forEach(function(s){ rod(v(s * 0.3, 1.19, 0.38), v(s * 0.42, 1.2, 0.35), 0.026, black, fa, 10); });
  box(0.12, 0.05, 0.06, paint, fa, 0, 1.19, 0.41);
  [[1, 0.68], [-1, 0.68], [1, -0.68], [-1, -0.68]].forEach(function(p){
    var s = p[0], z = p[1], holder = grp(m, s * 0.52, 0.33, z), spin = grp(holder);
    tire(0.33, 0.26, rubber, spin, 18); discRim(0.2, 0.26, s, rimM, dark, spin);
    V.wheels.push({ g: spin, r: 0.33 });
    if (z > 0) V.steer.push(holder);
    spring(v(s * 0.38, 0.38, z * 0.85), v(s * 0.24, 0.7, z * 0.7), 0.045, 6, springM, m);
  });
  V.paint = [paint];
  V.rider = makeRider({ suit: 0xff6a13, pants: 0x1b1b1f, accent: 0x2fbf4a, helmet: 0x2fbf4a, lens: 0x22d3ee, number: '07' });
  V.rider.root.position.set(0, 1.03, -0.28); V.riderY = 1.03;
  m.add(V.rider.root);
  rod(v(0.2, 0.62, -0.7), v(0.22, 0.72, -1.05), 0.05, alu, m, 14);
  V.boostFlame = flame(m, 0.22, 0.72, -1.08, ORANGE_FLAME, true, 0.6);
  V.exhaust = [0.22, 0.72, -1.4];
  V.dust = [[0.52, 0, -0.7], [-0.52, 0, -0.7]];
  return V;
}

function buildCar(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var paint = clearcoat(0xff6a13, 0.35, 0.35), white = clearcoat(0xf6f6f6, 0.2, 0.3);
  var black = std(0x18181b, 0.75), trim = std(0x26282c, 0.4, 0.5);
  var glass = new THREE.MeshPhysicalMaterial({ color: 0x1b2633, metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.6, clearcoat: 1 });
  var rubber = rubberMat(), rimM = std(0xf2f2f2, 0.3, 0.6), alu = std(0xc8ccd2, 0.3, 0.9);
  extrude(bodyShape([[-2.0, 0.42], [-2.08, 0.8], [-2.02, 1.08], [-1.85, 1.15], [-0.9, 1.18], [0.9, 1.17], [1.7, 1.05], [2.05, 0.92], [2.12, 0.7], [2.08, 0.42]],
    [{ z: 1.3, y: 0.44, r: 0.52 }, { z: -1.3, y: 0.44, r: 0.52 }]), 1.72, paint, m, 0, 0.05);
  extrude(profileShape([[-1.75, 1.14], [-1.48, 1.6], [0.35, 1.64], [0.98, 1.16]]), 1.54, glass, m, 0, 0.03);
  side([[-1.52, 1.6], [0.37, 1.64], [0.35, 1.7], [-1.5, 1.67]], 1.6, paint, m, 0, 0.02);
  box(1.64, 0.46, 0.09, paint, m, 0, 1.4, -0.42, 0.12);
  box(0.24, 0.012, 1.0, white, m, 0.2, 1.205, 1.3, -0.07); box(0.24, 0.012, 1.0, white, m, -0.2, 1.205, 1.3, -0.07);
  box(0.24, 0.012, 1.8, white, m, 0.2, 1.705, -0.58); box(0.24, 0.012, 1.8, white, m, -0.2, 1.705, -0.58);
  box(1.84, 0.1, 1.45, white, m, 0, 0.5, 0);
  var numT = numberTex('21', '#ffffff', '#111111', true);
  decal(numT, 0.55, 0.55, m, 0.92, 0.82, -0.05, Math.PI / 2); decal(numT, 0.55, 0.55, m, -0.92, 0.82, -0.05, -Math.PI / 2);
  box(1.75, 0.26, 0.22, black, m, 0, 0.52, 2.12); box(1.75, 0.26, 0.22, black, m, 0, 0.52, -2.08);
  box(0.7, 0.18, 0.04, black, m, 0, 0.8, 2.13);
  [-1, 1].forEach(function(s){
    box(0.38, 0.14, 0.05, glow(0xfff6dd, 2.2), m, s * 0.62, 0.86, 2.11);
    box(0.36, 0.11, 0.05, glow(0xff2020, 1.6), m, s * 0.62, 0.95, -2.07);
    box(0.14, 0.1, 0.16, black, m, s * 0.95, 1.25, 0.8);
    box(0.02, 0.3, 0.32, black, m, s * 0.75, 0.32, -1.85);
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 20), glow(0xfffbe8, 2.5), m, s * 0.22, 0.72, 2.25, Math.PI / 2, 0, 0);
    mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 20), glow(0xfffbe8, 2.5), m, s * 0.48, 0.72, 2.25, Math.PI / 2, 0, 0);
    rod(v(s * 0.6, 1.2, -1.82), v(s * 0.6, 1.36, -1.9), 0.03, black, m, 8);
  });
  box(1.72, 0.05, 0.38, paint, m, 0, 1.38, -1.95, 0.1);
  box(0.03, 0.18, 0.4, black, m, 0.86, 1.32, -1.95); box(0.03, 0.18, 0.4, black, m, -0.86, 1.32, -1.95);
  box(0.6, 0.08, 0.5, black, m, 0, 1.72, 0.0);
  rod(v(0.55, 0.42, -2.1), v(0.55, 0.42, -2.25), 0.05, alu, m, 12);
  box(1.6, 0.05, 3.6, black, m, 0, 0.62, -0.1);
  box(0.5, 0.4, 0.5, black, m, -0.38, 0.85, -0.35); box(0.5, 0.4, 0.5, black, m, 0.38, 0.85, -0.35);
  box(0.5, 0.6, 0.12, black, m, -0.38, 1.1, -0.62, 0.15);
  var sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 24), black); sw.position.set(-0.38, 1.08, 0.3); sw.rotation.x = -0.6; m.add(sw);
  [[1, 1.3], [-1, 1.3], [1, -1.3], [-1, -1.3]].forEach(function(p){
    var s = p[0], z = p[1], holder = grp(m, s * 0.83, 0.42, z), spin = grp(holder);
    tire(0.42, 0.28, rubber, spin, 22); discRim(0.27, 0.28, s, rimM, trim, spin);
    V.wheels.push({ g: spin, r: 0.42 });
    if (z > 0) V.steer.push(holder);
  });
  V.paint = [paint];
  V.rider = makeRider({ suit: 0x1e3a8a, pants: 0x1e3a8a, accent: 0xff6a13, helmet: 0xffffff, number: '21' });
  V.rider.root.position.set(-0.38, 0.62, -0.28); V.riderY = 0.62;
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0.55, 0.42, -2.26, ORANGE_FLAME, true, 0.8);
  V.exhaust = [0.55, 0.42, -2.6];
  V.dust = [[0.83, 0, -1.35], [-0.83, 0, -1.35]];
  return V;
}

function buildRoadster(){
  var V = { model: new THREE.Group(), wheels: [], steer: [], flames: [] }, m = V.model;
  var paint = clearcoat(0xb0101c, 0.6, 0.25);
  var black = std(0x111114, 0.5, 0.3), carbon = std(0x1d1f24, 0.35, 0.6), alu = std(0xd7dbe0, 0.2, 1.0);
  var glass = new THREE.MeshPhysicalMaterial({ color: 0x10161f, metalness: 0.5, roughness: 0.03, transparent: true, opacity: 0.55, clearcoat: 1 });
  var rubber = rubberMat();
  extrude(bodyShape([[-2.15, 0.3], [-2.22, 0.55], [-2.18, 0.72], [-2.0, 0.82], [-1.5, 0.9], [-0.9, 0.95], [-0.2, 0.96], [0.6, 0.93], [1.2, 0.86], [1.7, 0.74], [2.05, 0.6], [2.22, 0.45], [2.2, 0.3]],
    [{ z: 1.35, y: 0.36, r: 0.45 }, { z: -1.35, y: 0.36, r: 0.45 }]), 1.82, paint, m, 0, 0.08);
  extrude(profileShape([[-1.05, 0.95], [-0.62, 1.2], [0.15, 1.26], [0.98, 0.9]]), 1.46, glass, m, 0, 0.04);
  box(1.95, 0.04, 0.05, glow(0xff1a2a, 2.2), m, 0, 0.74, -2.23);
  [-1, 1].forEach(function(s){
    box(0.42, 0.035, 0.06, glow(0xeaf6ff, 2.5), m, s * 0.66, 0.66, 2.16, 0, -s * 0.25, 0);
    box(0.05, 0.16, 0.55, black, m, s * 0.97, 0.58, -0.62);
    box(0.06, 0.06, 0.12, carbon, m, s * 0.93, 0.98, 0.55);
  });
  box(1.7, 0.12, 0.35, carbon, m, 0, 0.3, -2.05);
  box(1.8, 0.04, 0.35, carbon, m, 0, 0.24, 2.05);
  box(1.6, 0.04, 3.4, carbon, m, 0, 0.24, 0);
  box(1.6, 0.4, 2.0, black, m, 0, 0.55, -0.2);
  box(0.5, 0.34, 0.5, black, m, -0.38, 0.5, -0.25); box(0.5, 0.34, 0.5, black, m, 0.38, 0.5, -0.25);
  var sw = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 8, 24), black); sw.position.set(-0.38, 0.86, 0.32); sw.rotation.x = -0.9; m.add(sw);
  var nozzleM = std(0x2e3238, 0.3, 0.9);
  V.nozzles = [];
  [[0.72, 0.22, 1.9], [-0.72, 0.22, 1.9], [0.72, 0.22, -1.85], [-0.72, 0.22, -1.85]].forEach(function(p){
    mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.12, 16), nozzleM, m, p[0], p[1], p[2]);
    V.flames.push(flame(m, p[0], p[1] - 0.06, p[2], BLUE_FLAME, false, 1));
    V.nozzles.push(v(p[0], p[1] - 0.2, p[2]));
  });
  mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.14, 18), nozzleM, m, 0, 0.5, -2.2, Math.PI / 2, 0, 0);
  V.boostFlame = flame(m, 0, 0.5, -2.28, BLUE_FLAME, true, 1);
  V.exhaust = [0, 0.5, -2.6];
  V.light = new THREE.PointLight(0x7fd0ff, 0, 10, 2); V.light.position.set(0, -0.2, 0); m.add(V.light);
  [[1, 1.35], [-1, 1.35], [1, -1.35], [-1, -1.35]].forEach(function(p){
    var s = p[0], z = p[1], holder = grp(m, s * 0.86, 0.36, z), spin = grp(holder);
    tire(0.36, 0.3, rubber, spin); discRim(0.27, 0.3, s, alu, carbon, spin, 12);
    V.wheels.push({ g: spin, r: 0.36 });
    if (z > 0) V.steer.push(holder);
  });
  V.paint = [paint];
  V.rider = makeRider({ suit: 0x111111, pants: 0x111111, accent: 0xb0101c, helmet: 0x0d0d10, lens: 0x66c8ff, number: '01' });
  V.rider.root.position.set(-0.38, 0.32, -0.1); V.riderY = 0.32;
  V.rider.root.scale.setScalar(0.95);
  m.add(V.rider.root);
  V.dust = [[0.86, 0, -1.4], [-0.86, 0, -1.4]];
  return V;
}

function buildMonster(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var paint = clearcoat(0x1f5fd6, 0.4, 0.3), black = std(0x141417, 0.7), chrome = std(0xe2e6ec, 0.12, 1.0);
  var dark = std(0x2b2d31, 0.45, 0.6), rubber = rubberMat(), springM = std(0xffd21a, 0.4, 0.3);
  var glass = new THREE.MeshPhysicalMaterial({ color: 0x0f1620, metalness: 0.5, roughness: 0.05, transparent: true, opacity: 0.7 });
  extrude(bodyShape([[-2.6, 1.5], [-2.66, 2.2], [-1.0, 2.25], [-0.9, 3.0], [0.55, 3.03], [1.15, 2.3], [2.55, 2.18], [2.68, 1.85], [2.64, 1.5]],
    [{ z: 1.4, y: 1.0, r: 1.0 }, { z: -1.4, y: 1.0, r: 1.0 }]), 2.0, paint, m, 0, 0.06);
  [-1, 1].forEach(function(s){
    box(0.03, 0.55, 1.15, glass, m, s * 1.08, 2.62, -0.18);
    decal(flameDecalTex(), 2.6, 0.8, m, s * 1.075, 1.95, 1.3, s * Math.PI / 2);
    rod(v(s * 0.75, 2.2, -1.0), v(s * 0.75, 3.45, -1.0), 0.07, chrome, m, 14);
    rod(v(s * 0.5, 1.25, 2.3), v(s * 0.5, 1.25, -2.3), 0.08, black, m, 8);
    box(0.36, 0.14, 0.05, glow(0xfff6dd, 2.2), m, s * 0.7, 1.95, 2.71);
    box(0.32, 0.14, 0.05, glow(0xff2020, 1.6), m, s * 0.75, 1.95, -2.69);
  });
  box(1.9, 0.75, 0.04, glass, m, 0, 2.66, 0.85, -0.75);
  box(1.9, 0.48, 0.04, glass, m, 0, 2.62, -0.97);
  box(1.6, 0.12, 0.16, glow(0xfff8e0, 2.2), m, 0, 3.12, 0.3);
  tube([[-1.0, 1.4, 2.78], [-0.95, 1.75, 2.85], [0.95, 1.75, 2.85], [1.0, 1.4, 2.78]], 0.06, chrome, m);
  tube([[-1.0, 1.45, -2.78], [-0.95, 1.75, -2.85], [0.95, 1.75, -2.85], [1.0, 1.45, -2.78]], 0.06, chrome, m);
  [1.4, -1.4].forEach(function(z){ rod(v(-1.25, 0.95, z), v(1.25, 0.95, z), 0.09, chrome, m, 12); });
  [[1, 1.4], [-1, 1.4], [1, -1.4], [-1, -1.4]].forEach(function(p){
    var s = p[0], z = p[1], holder = grp(m, s * 1.35, 0.95, z), spin = grp(holder);
    tire(0.95, 0.72, rubber, spin, 24); discRim(0.52, 0.72, s, chrome, dark, spin, 8);
    V.wheels.push({ g: spin, r: 0.95 });
    if (z > 0) V.steer.push(holder);
    spring(v(s * 0.8, 1.0, z - 0.3 * Math.sign(z)), v(s * 0.55, 1.6, z - 0.1 * Math.sign(z)), 0.11, 6, springM, m);
  });
  box(0.5, 0.4, 0.5, black, m, -0.45, 2.2, -0.3); box(0.5, 0.4, 0.5, black, m, 0.45, 2.2, -0.3);
  var sw = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), black); sw.position.set(-0.45, 2.55, 0.35); sw.rotation.x = -0.6; m.add(sw);
  V.paint = [paint];
  V.rider = makeRider({ suit: 0xffd21a, pants: 0x111111, accent: 0x1f5fd6, helmet: 0x1f5fd6, number: '99' });
  V.rider.root.position.set(-0.45, 2.05, -0.32); V.riderY = 2.05;
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0, 1.7, -2.8, ORANGE_FLAME, true, 1.3);
  V.exhaust = [0, 1.7, -3.2];
  V.dust = [[1.35, 0, -1.45], [-1.35, 0, -1.45]];
  return V;
}

// ---- the Admin Bike: black & gold, neon underglow, a crown, and animated wings ----
var FEATHER_GEO = (function(){
  var g = new THREE.ShapeGeometry(profileShape([[0, 0], [0.17, 0.22], [0.13, 0.8], [0, 1], [-0.11, 0.82], [-0.16, 0.24]]));
  g.rotateX(-Math.PI / 2);          // lies flat, pointing backwards (-z)
  return g;
})();
var featherWhite = new THREE.MeshStandardMaterial({ color: 0xfaf6ee, roughness: 0.55, emissive: 0x2a2418, side: THREE.DoubleSide });
var featherGold = new THREE.MeshStandardMaterial({ color: 0xe8b830, roughness: 0.3, metalness: 0.7, emissive: 0x5a3c00, side: THREE.DoubleSide });
var featherNeon = new THREE.MeshStandardMaterial({ color: 0xff7ae0, emissive: 0xff2bd6, emissiveIntensity: 1.3, roughness: 0.4, side: THREE.DoubleSide });
function makeWing(parent, side){
  var W = grp(parent, side * 0.09, 0.42, -0.15);
  var inner = grp(W);
  if (side < 0) inner.scale.x = -1;          // the right wing is a mirror of the left
  var bone = std(0xd4a017, 0.25, 0.9);
  rod(v(0, 0, 0), v(0.95, 0.38, -0.05), 0.045, bone, inner, 8);
  rod(v(0.95, 0.38, -0.05), v(2.0, 0.6, -0.3), 0.032, bone, inner, 8);
  mesh(new THREE.SphereGeometry(0.07, 10, 8), bone, inner, 0.95, 0.38, -0.05);
  for (var k = 0; k < 12; k++) {
    var t = k / 11, bx, by, bz;
    if (t < 0.47) { var a = t / 0.47; bx = 0.95 * a; by = 0.38 * a; bz = -0.05 * a; }
    else { var b2 = (t - 0.47) / 0.53; bx = 0.95 + 1.05 * b2; by = 0.38 + 0.22 * b2; bz = -0.05 - 0.25 * b2; }
    var len = 0.9 + 1.5 * t * (1 - 0.3 * t) + (k === 11 ? 0.35 : 0);
    var f = new THREE.Mesh(FEATHER_GEO, k >= 9 ? featherNeon : (k % 2 ? featherGold : featherWhite));
    f.castShadow = true; f.position.set(bx, by - 0.02 * k, bz); f.rotation.y = -1.3 * Math.pow(t, 1.25); f.scale.set(1, 1, len);
    inner.add(f);
    if (k < 9) {   // short covert feathers on top
      var c = new THREE.Mesh(FEATHER_GEO, featherWhite); c.position.set(bx, by + 0.03, bz); c.rotation.y = -1.1 * t; c.scale.set(0.8, 1, len * 0.45); inner.add(c);
    }
  }
  return W;
}
function buildAdmin(){
  var black = new THREE.MeshPhysicalMaterial({ color: 0x0e0e12, metalness: 0.7, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 });
  var gold = std(0xd4a017, 0.22, 0.95);
  var V = buildBike({ team: black, white: gold, number: '00', plateBg: '#111111', plateFg: '#ffd21a',
    rider: { suit: 0x121216, pants: 0x121216, accent: 0xffd21a, helmet: 0xd4a017, lens: 0xff2bd6, boot: 0x121216, glove: 0xd4a017, number: '00' } });
  var m = V.model, neon = glow(0xff2bd6, 2.6);
  box(0.03, 0.025, 1.3, neon, m, 0.12, 0.42, -0.1); box(0.03, 0.025, 1.3, neon, m, -0.12, 0.42, -0.1);
  box(0.46, 0.02, 0.03, neon, m, 0, 1.13, 0.35);
  // a gold crown on the helmet
  var crown = grp(V.rider.head, 0, 0.17, -0.01);
  var ring = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.07, 20, 1, true), gold); ring.material.side = THREE.DoubleSide; crown.add(ring);
  for (var k = 0; k < 5; k++) {
    var a = k / 5 * TAU, sp = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), gold);
    sp.position.set(Math.cos(a) * 0.13, 0.08, Math.sin(a) * 0.13); crown.add(sp);
    var gem = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), glow(k % 2 ? 0xff2bd6 : 0x36e0ff, 2)); gem.position.set(Math.cos(a) * 0.135, 0.01, Math.sin(a) * 0.135); crown.add(gem);
  }
  V.hyperFlame = flame(m, 0.233, 1.1, -1.12, BLUE_FLAME, true, 1.4);
  V.ocMat = new THREE.MeshStandardMaterial({ color: 0xff3b1f, emissive: 0xff2a00, emissiveIntensity: 0, transparent: true, opacity: 0, depthWrite: false });
  V.ocGlow = grp(m);
  box(0.36, 0.38, 0.52, V.ocMat, V.ocGlow, 0, 0.56, -0.02);                    // engine case glows
  rod(v(0.21, 0.96, -0.58), v(0.23, 1.09, -1.06), 0.085, V.ocMat, V.ocGlow, 18);   // exhaust glows
  [-1, 1].forEach(function(sd){ box(0.07, 0.34, 0.3, V.ocMat, V.ocGlow, sd * 0.21, 0.92, 0.33); });
  V.ocFlame = flame(m, 0.233, 1.1, -1.12, ORANGE_FLAME, true, 1.0);
  V.wingL = makeWing(V.rider.torso, 1);
  V.wingR = makeWing(V.rider.torso, -1);
  V.paint = [black];
  return V;
}

// ---- Moon Rocket: orange core stage, two white side boosters, upper stage, and a nose fairing that holds a Roadster ----
var rocketOrange = new THREE.MeshStandardMaterial({ color: 0xd9782b, roughness: 0.85 });
var bellMat = new THREE.MeshStandardMaterial({ color: 0x2c2f35, roughness: 0.35, metalness: 0.8, side: THREE.DoubleSide });
function bellGeo(r, h){
  var pts = [];
  for (var k = 0; k <= 8; k++) { var t = k / 8; pts.push(new THREE.Vector2(r * 0.45 + r * 0.55 * t * t, -t * h)); }
  return new THREE.LatheGeometry(pts, 24);
}
function makeBooster(){
  var g = new THREE.Group(), white = std(0xf2f2f2, 0.5), dark = std(0x2a2c30, 0.4, 0.7);
  mesh(new THREE.CylinderGeometry(0.85, 0.85, 26, 24), white, g, 0, 13, 0);
  [6, 12, 18].forEach(function(y){ mesh(new THREE.CylinderGeometry(0.875, 0.875, 0.35, 24), dark, g, 0, y, 0); });
  mesh(new THREE.CylinderGeometry(0.88, 0.88, 1.6, 24), dark, g, 0, 24.6, 0);
  mesh(new THREE.ConeGeometry(0.85, 3.2, 24), white, g, 0, 27.6, 0);
  mesh(bellGeo(0.7, 1.4), bellMat, g, 0, 0, 0);
  return g;
}
var launchPad = (function(){
  var g = new THREE.Group(), concrete = std(0x9a958c, 0.95), steel = std(0x8a3a2a, 0.6, 0.4);
  box(16, 1.2, 16, concrete, g, 0, -0.4, 0);
  box(6, 0.4, 6, std(0x3a3a3a, 0.9), g, 0, 0.3, 0);
  for (var k = 0; k < 4; k++) rod(v(9 + (k % 2) * 2.4, 0, -1.2 + (k > 1 ? 2.4 : 0)), v(9 + (k % 2) * 2.4, 46, -1.2 + (k > 1 ? 2.4 : 0)), 0.15, steel, g, 6);
  for (var y = 2; y < 46; y += 4) { box(2.6, 0.18, 0.18, steel, g, 10.2, y, -1.2); box(2.6, 0.18, 0.18, steel, g, 10.2, y, 1.2); box(0.18, 0.18, 2.6, steel, g, 9, y, 0); box(0.18, 0.18, 2.6, steel, g, 11.4, y, 0); }
  box(7, 0.3, 0.6, steel, g, 6, 36, 0);
  box(1.2, 1.2, 1.2, glow(0xff3030, 2.5), g, 10.2, 46.6, 0);
  g.visible = false; scene.add(g); return g;
})();
function buildRocket(){
  var V = { model: new THREE.Group(), wheels: [], steer: [], flames: [], boosterFlames: [] }, m = V.model;
  var white = std(0xf4f4f4, 0.45), dark = std(0x2a2c30, 0.4, 0.7);
  mesh(new THREE.CylinderGeometry(2.0, 2.0, 28, 40), rocketOrange, m, 0, 14, 0);
  [7, 14, 21].forEach(function(y){ mesh(new THREE.CylinderGeometry(2.02, 2.02, 0.12, 40), std(0xb8601f, 0.8), m, 0, y, 0); });
  mesh(new THREE.CylinderGeometry(2.0, 2.05, 1.4, 40), white, m, 0, 0.7, 0);
  mesh(new THREE.CylinderGeometry(2.0, 2.0, 1.2, 40), dark, m, 0, 28.6, 0);
  mesh(new THREE.CylinderGeometry(1.75, 2.0, 1.4, 40), white, m, 0, 29.9, 0);
  mesh(new THREE.CylinderGeometry(1.75, 1.75, 4.0, 40), white, m, 0, 32.6, 0);
  decal(numberTex('DR', '#f4f4f4', '#1f3fa6'), 2.2, 2.2, m, 0, 32.6, 1.76);
  [[0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]].forEach(function(p){ mesh(bellGeo(0.55, 1.3), bellMat, m, p[0], 0, p[1]); });
  V.boosters = [];
  [-1, 1].forEach(function(s){
    var b = makeBooster(); b.position.set(s * 2.95, 0.6, 0); m.add(b); V.boosters.push(b);
    box(0.9, 0.3, 0.3, dark, m, s * 2.45, 24, 0); box(0.9, 0.3, 0.3, dark, m, s * 2.45, 3, 0);
    V.boosterFlames.push(flame(b, 0, -1.2, 0, ORANGE_FLAME, false, 3.4));
  });
  V.flames.push(flame(m, 0, -1.2, 0, ORANGE_FLAME, false, 5.5));
  // four landing legs, folded up against the core (they swing down for a booster landing)
  var legMat = std(0x26282c, 0.45, 0.7), footMat = std(0x9a9a9a, 0.5, 0.7);
  V.legs = [];
  [1, 3, 5, 7].forEach(function(k){
    var th = k * Math.PI / 4, piv = grp(m, Math.cos(th) * 2.08, 1.6, Math.sin(th) * 2.08);
    piv.rotation.y = -th;
    var sw = grp(piv);
    box(0.34, 5.0, 0.6, legMat, sw, 0.12, 2.5, 0);
    box(0.12, 3.0, 0.2, std(0xd9782b, 0.8), sw, 0.3, 2.0, 0);
    mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 12), footMat, sw, 0.12, 5.0, 0);
    V.legs.push(sw);
  });
  // four grid fins near the top of the core stage
  var gc = canvas(64), gx2 = gc.getContext('2d');
  gx2.clearRect(0, 0, 64, 64); gx2.strokeStyle = '#3a3c40'; gx2.lineWidth = 5;
  for (var gl = 0; gl <= 64; gl += 12) { gx2.beginPath(); gx2.moveTo(gl, 0); gx2.lineTo(gl, 64); gx2.moveTo(0, gl); gx2.lineTo(64, gl); gx2.stroke(); }
  var finMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(gc), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.4 });
  V.fins = [];
  [1, 3, 5, 7].forEach(function(k){
    var th = k * Math.PI / 4, piv = grp(m, Math.cos(th) * 2.02, 26.4, Math.sin(th) * 2.02);
    piv.rotation.y = -th;
    var sw = grp(piv);
    box(0.1, 1.5, 1.3, finMat, sw, 0.06, 0.75, 0);
    V.fins.push(sw);
  });
  // nose fairing in two halves that swing open
  var ogive = [];
  for (var k = 0; k <= 12; k++) { var t = k / 12; ogive.push(new THREE.Vector2(Math.max(0.02, 1.75 * Math.sqrt(1 - Math.pow(t, 1.8))), t * 7.5)); }
  V.fairing = [];
  [-1, 1].forEach(function(s){
    var pivot = grp(m, s * 1.75, 34.6, 0);
    var half = mesh(new THREE.LatheGeometry(ogive, 32, s > 0 ? 0 : Math.PI, Math.PI), new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.45, side: THREE.DoubleSide }), pivot, -s * 1.75, 0, 0);
    V.fairing.push(pivot);
  });
  // the Roadster riding inside, nose up
  V.payload = buildRoadster().model;
  V.payload.position.set(0, 35.9, 0.6); V.payload.rotation.x = -Math.PI / 2; V.payload.scale.setScalar(0.92);
  m.add(V.payload);
  V.rider = makeRider({ suit: 0xf2f2f2, pants: 0xf2f2f2, accent: 0x1f3fa6, helmet: 0xf2f2f2, number: '02' });
  V.rider.root.visible = false; V.riderY = 0; m.add(V.rider.root);
  V.boostFlame = grp(m); V.exhaust = [0, -1.5, 0];
  V.paint = [rocketOrange];
  V.dust = [];
  return V;
}

// ---- Stealth Jet (an original design) ----
function flatPart(pts, thick, mat, parent, y, mirror){
  var shp = profileShape(pts.map(function(p){ return [mirror ? -p[0] : p[0], p[1]]; }));
  var g = new THREE.ExtrudeGeometry(shp, { depth: thick, bevelEnabled: false });
  g.rotateX(Math.PI / 2); g.translate(0, y + thick, 0);
  return mesh(g, mat, parent);
}
function buildJet(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var skin = std(0x6f767f, 0.55, 0.35), panel = std(0x5d636b, 0.6, 0.3), dark = std(0x3a3f46, 0.6, 0.3), black = std(0x141417, 0.6);
  var canopyM = new THREE.MeshPhysicalMaterial({ color: 0xd8a640, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.82, clearcoat: 1 });
  side([[-6.6, 1.75], [-6.7, 2.35], [-4.2, 2.6], [1.0, 2.75], [3.2, 2.6], [5.6, 2.25], [7.6, 2.05], [5.6, 1.85], [3.0, 1.65], [-6.6, 1.6]], 1.6, skin, m, 0, 0.12);
  side([[-5.8, 1.72], [-5.8, 2.25], [3.5, 2.32], [5.4, 2.02], [3.5, 1.76]], 3.0, panel, m, 0, 0.08);
  [-1, 1].forEach(function(s){
    box(0.6, 0.8, 2.6, dark, m, s * 1.3, 2.05, 1.5, 0, -s * 0.08, 0);
    box(0.52, 0.66, 0.08, black, m, s * 1.32, 2.05, 2.82);
    flatPart([[0.8, 1.8], [5.4, -1.3], [5.4, -2.4], [0.8, -3.2]], 0.14, skin, m, 1.95, s < 0);
    flatPart([[0.6, -4.6], [2.9, -6.1], [2.9, -6.9], [0.6, -6.9]], 0.1, skin, m, 2.1, s < 0);
    var fin = grp(m, s * 0.95, 2.35, 0); fin.rotation.z = -s * 0.42;
    side([[-4.4, 0], [-6.0, 2.3], [-6.9, 2.3], [-6.6, 0]], 0.12, skin, fin, 0, 0);
    box(0.05, 0.05, 4.6, glow(0x7fe8ff, 1.2), m, s * 5.35, 2.12, -1.85);
  });
  var canopy = mesh(new THREE.SphereGeometry(1, 24, 16), canopyM, m, 0, 2.85, 2.9); canopy.scale.set(0.62, 0.5, 1.7);
  rod(v(0, 2.05, -6.4), v(0, 2.05, -7.0), 0.6, dark, m, 20, 0.55);
  mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 20), glow(0xff8a2a, 1.5), m, 0, 2.05, -7.02);
  V.boostFlame = flame(m, 0, 2.05, -7.05, ORANGE_FLAME, true, 2.6);
  V.exhaust = [0, 2.05, -8.0];
  V.gear = grp(m);
  var rub = rubberMat(), strut = std(0xbfc4ca, 0.3, 0.9);
  [[0, 4.6, 0.38], [1.4, -1.0, 0.45], [-1.4, -1.0, 0.45]].forEach(function(p){
    rod(v(p[0], p[2], p[1]), v(p[0] * 0.8, 1.8, p[1]), 0.07, strut, V.gear, 8);
    var wg = grp(V.gear, p[0], p[2], p[1]), sp = grp(wg);
    mesh(new THREE.CylinderGeometry(p[2], p[2], 0.28, 18), rub, sp, 0, 0, 0, 0, 0, Math.PI / 2);
    V.wheels.push({ g: sp, r: p[2] });
  });
  V.rider = makeRider({ suit: 0x3e4a32, pants: 0x3e4a32, accent: 0xffd21a, helmet: 0x2a2f36, lens: 0xffd21a, number: '01' });
  V.rider.root.position.set(0, 2.2, 2.6); V.riderY = 2.2; V.rider.root.scale.setScalar(0.9);
  m.add(V.rider.root);
  V.paint = [skin];
  V.dust = [[0, 0, -1.0]];
  return V;
}

// ---- Dune Buggy: tube-frame sand rail with big paddle tyres at the back ----
function buildBuggy(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var paint = clearcoat(0xffc81a, 0.3, 0.3), cage = std(0x1d2733, 0.35, 0.6), black = std(0x17171a, 0.75);
  var chrome = std(0xe2e6ec, 0.12, 1.0), dark = std(0x2b2d31, 0.45, 0.6), rubber = rubberMat(), rimM = std(0x2a2c30, 0.35, 0.8);
  box(1.4, 0.08, 3.4, black, m, 0, 0.55, -0.1);
  side([[0.95, 0.55], [2.05, 0.68], [2.15, 0.86], [1.25, 1.05], [0.95, 1.0]], 1.3, paint, m, 0, 0.04);
  side([[-2.05, 0.62], [-1.05, 0.6], [-1.05, 1.15], [-1.75, 1.12], [-2.1, 0.88]], 1.2, paint, m, 0, 0.04);
  [-1, 1].forEach(function(s){
    tube([[s * 0.72, 0.6, 1.25], [s * 0.68, 1.45, 0.55], [s * 0.66, 1.85, -0.35], [s * 0.7, 1.2, -1.05], [s * 0.74, 0.6, -1.3]], 0.05, cage, m);
    tube([[s * 0.74, 0.6, 1.0], [s * 0.82, 0.62, -1.2]], 0.04, cage, m);
    box(0.5, 0.14, 0.9, paint, m, s * 1.05, 0.92, 1.35, 0, 0, s * 0.35);           // front fenders
    rod(v(s * 0.3, 1.0, -1.7), v(s * 0.38, 1.75, -2.05), 0.06, chrome, m, 12);   // exhaust stacks
    box(0.22, 0.14, 0.08, glow(0xfff6dd, 2.2), m, s * 0.48, 0.98, 2.16);          // headlights
  });
  rod(v(-0.66, 1.85, -0.35), v(0.66, 1.85, -0.35), 0.05, cage, m, 10);
  rod(v(-0.68, 1.45, 0.55), v(0.68, 1.45, 0.55), 0.05, cage, m, 10);
  rod(v(-0.7, 1.2, -1.05), v(0.7, 1.2, -1.05), 0.05, cage, m, 10);
  rod(v(-0.66, 1.85, -0.35), v(0.68, 1.45, 0.55), 0.035, cage, m, 8);
  for (var k = 0; k < 4; k++) box(0.18, 0.14, 0.1, glow(0xfff8e0, 2.2), m, -0.45 + k * 0.3, 1.95, 0.45);   // light bar
  box(0.7, 0.5, 0.6, dark, m, 0, 0.95, -1.45);                                    // engine
  for (var f2 = 0; f2 < 4; f2++) box(0.74, 0.03, 0.62, chrome, m, 0, 1.0 + f2 * 0.09, -1.45);
  box(0.55, 0.7, 0.12, black, m, 0, 0.95, -0.55, 0.2);                            // seat
  var sw = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 24), black); sw.position.set(0, 1.18, 0.45); sw.rotation.x = -0.7; m.add(sw);
  [[1, 1.35, 0.42, 0.26], [-1, 1.35, 0.42, 0.26], [1, -1.25, 0.58, 0.46], [-1, -1.25, 0.58, 0.46]].forEach(function(p){
    var s = p[0], z = p[1], R = p[2], W = p[3], holder = grp(m, s * (0.92 + W * 0.3), R, z), spin = grp(holder);
    tire(R, W, rubber, spin, z < 0 ? 14 : 18); discRim(R * 0.6, W, s, rimM, dark, spin, 6);
    V.wheels.push({ g: spin, r: R });
    if (z > 0) V.steer.push(holder);
  });
  V.paint = [paint];
  V.rider = makeRider({ suit: 0x1d2733, pants: 0x1d2733, accent: 0xffc81a, helmet: 0xffc81a, lens: 0x22d3ee, number: '55' });
  V.rider.root.position.set(0, 0.68, -0.35); V.riderY = 0.68;
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0.34, 1.78, -2.08, ORANGE_FLAME, true, 0.6);
  V.exhaust = [0.34, 1.78, -2.4];
  V.dust = [[0.95, 0, -1.25], [-0.95, 0, -1.25]];
  return V;
}

// ---- Jetpack: a rider with twin thrusters on their back (run around, then fly) ----
function buildJetpack(){
  var V = { model: new THREE.Group(), wheels: [], steer: [], flames: [], nozzles: [] }, m = V.model;
  V.rider = makeRider({ suit: 0xe8e8e8, pants: 0xe8e8e8, accent: 0xff6a13, helmet: 0xf5f5f5, lens: 0x36a8ff, boot: 0x3a3c40, glove: 0x3a3c40, number: '42' });
  V.rider.root.position.set(0, 0.98, 0); V.riderY = 0.98; m.add(V.rider.root);
  var T = V.rider.torso, tankM = std(0xc8ccd2, 0.25, 0.9), dark = std(0x2a2c30, 0.5, 0.6), accent = std(0xff6a13, 0.5);
  box(0.42, 0.5, 0.12, dark, T, 0, 0.32, -0.19);
  [-1, 1].forEach(function(s){
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 14), tankM, T, s * 0.13, 0.32, -0.31);
    mesh(new THREE.SphereGeometry(0.1, 12, 8), tankM, T, s * 0.13, 0.6, -0.31);
    mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.14, 12), dark, T, s * 0.13, 0.0, -0.31);
    V.flames.push(flame(T, s * 0.13, -0.07, -0.31, BLUE_FLAME, false, 0.45));
    V.nozzles.push(v(s * 0.13, 0.95, -0.31));
  });
  box(0.36, 0.06, 0.04, accent, T, 0, 0.55, -0.38);
  V.light = new THREE.PointLight(0x7fd0ff, 0, 6, 2); V.light.position.set(0, 0.6, -0.4); m.add(V.light);
  V.boostFlame = flame(T, 0, 0.3, -0.4, ORANGE_FLAME, true, 0.35);
  V.exhaust = [0, 1.3, -0.6];
  V.paint = [accent];
  V.dust = [[0, 0, 0]];
  return V;
}

// ---- Helicopter ----
function buildHeli(){
  var V = { model: new THREE.Group(), wheels: [], steer: [] }, m = V.model;
  var paint = clearcoat(0xd8262e, 0.3, 0.3), white = clearcoat(0xf2f2f2, 0.2, 0.3), dark = std(0x24272c, 0.5, 0.6), alu = std(0xc8ccd2, 0.3, 0.9);
  var glass = new THREE.MeshPhysicalMaterial({ color: 0x1b2633, metalness: 0.4, roughness: 0.05, transparent: true, opacity: 0.5, clearcoat: 1 });
  var body = mesh(new THREE.SphereGeometry(1, 28, 20), paint, m, 0, 1.55, -0.2); body.scale.set(1.1, 1.0, 1.9);
  var belly = mesh(new THREE.SphereGeometry(1, 24, 14), white, m, 0, 1.3, -0.2); belly.scale.set(1.0, 0.7, 1.75);
  var cock = mesh(new THREE.SphereGeometry(1, 24, 16), glass, m, 0, 1.75, 0.85); cock.scale.set(0.95, 0.85, 1.2);
  rod(v(0, 1.75, -1.7), v(0, 2.05, -6.5), 0.34, paint, m, 14, 0.15);
  side([[-5.7, 2.0], [-6.7, 3.4], [-7.0, 3.4], [-6.75, 1.9]], 0.1, paint, m, 0, 0.02);
  box(1.9, 0.07, 0.5, paint, m, 0, 2.02, -5.5);
  side([[-1.3, 2.4], [0.5, 2.45], [0.3, 2.85], [-1.1, 2.8]], 0.9, dark, m, 0, 0.04);
  rod(v(0, 2.8, -0.3), v(0, 3.25, -0.3), 0.09, alu, m, 10);
  V.rotor = grp(m, 0, 3.3, -0.3);
  mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.16, 16), dark, V.rotor);
  for (var k = 0; k < 4; k++) { var bl = grp(V.rotor); bl.rotation.y = k * Math.PI / 2; box(0.34, 0.05, 5.6, dark, bl, 0, 0, 2.95); box(0.36, 0.055, 0.4, std(0xffd21a, 0.5), bl, 0, 0, 5.5); }
  V.tailRotor = grp(m, 0.2, 2.75, -6.7);
  for (var t2 = 0; t2 < 2; t2++) { var tb = grp(V.tailRotor); tb.rotation.x = t2 * Math.PI / 2; box(0.04, 1.5, 0.16, dark, tb, 0, 0, 0); }
  [-1, 1].forEach(function(s){
    rod(v(s * 0.95, 0.12, 1.4), v(s * 0.95, 0.12, -1.8), 0.07, alu, m, 10);
    rod(v(s * 0.95, 0.12, 1.4), v(s * 0.95, 0.38, 1.85), 0.07, alu, m, 10);
    rod(v(s * 0.95, 0.12, 0.7), v(s * 0.55, 0.95, 0.6), 0.05, alu, m, 8);
    rod(v(s * 0.95, 0.12, -1.0), v(s * 0.55, 0.95, -1.0), 0.05, alu, m, 8);
    box(0.1, 0.1, 0.1, glow(s > 0 ? 0xff2020 : 0x20ff40, 2.5), m, s * 1.12, 1.6, -0.1);
  });
  box(0.1, 0.1, 0.1, glow(0xffffff, 2.5), m, 0, 3.45, -7.0);
  V.rider = makeRider({ suit: 0x2f3b2a, pants: 0x2f3b2a, accent: 0xd8262e, helmet: 0xf2f2f2, lens: 0x36a8ff, number: '09' });
  V.rider.root.position.set(0, 1.05, 0.55); V.riderY = 1.05; V.rider.root.scale.setScalar(0.95);
  m.add(V.rider.root);
  V.boostFlame = flame(m, 0, 1.6, -2.0, ORANGE_FLAME, true, 0.5);
  V.exhaust = [0, 1.6, -2.3];
  V.paint = [paint];
  V.dust = [];
  return V;
}

var VDEF = {
  bike: { name: 'Dirtbike', icon: '🏍️', desc: 'Flips + style tricks', build: buildBike,
    accel: 14, turn: 2.3, flip: 5.4, roll: 6, spin: 6, com: 0.8, lean: 0.35, pts: 1, style: true, jump: 8, wheelieA: 0.55,
    camDist: 7.5, camH: 3, look: 1.0, width: 0.25, crashRest: 0.45, shadow: 9, blob: [1.1, 2.7], sound: 'bike', fpv: [0, 1.98, 0.05],
    pose: { torso: 0.5, sX: -1.7, sZ: 0.28, el: 0.3, hLX: -0.9, hLZ: 0.15, kL: 1.3, hRX: -0.9, hRZ: 0.15, kR: 1.3, lift: 0 } },
  scooter: { name: 'E-Scooter', icon: '🛴', desc: 'Twitchy · 1.5x points', build: buildScooter,
    accel: 10, turn: 2.8, flip: 6.2, roll: 6.5, spin: 7, com: 0.75, lean: 0.3, pts: 1.5, style: true, jump: 8, wheelieA: 0.45,
    camDist: 6.5, camH: 2.6, look: 1.1, width: 0.2, crashRest: 0.3, shadow: 8, blob: [0.8, 1.8], sound: 'scooter', fpv: [0, 2.0, 0.1],
    pose: { torso: 0.2, sX: -0.76, sZ: 0.2, el: 0.05, hLX: -0.15, hLZ: 0.05, kL: 0.25, hRX: 0.2, hRZ: 0.05, kR: 0.15, lift: 0 } },
  quad: { name: 'Quad Bike', icon: '🏁', desc: 'Quadcrasher style · 1.2x', build: buildQuad,
    accel: 15, turn: 2.4, flip: 5.0, roll: 5.5, spin: 5.5, com: 0.7, lean: 0.14, pts: 1.2, style: true, jump: 9, wheelieA: 0.5,
    camDist: 8, camH: 3.2, look: 1.0, width: 0.6, crashRest: 0.6, shadow: 10, blob: [1.7, 2.6], sound: 'bike', fpv: [0, 1.86, 0.02],
    pose: { torso: 0.45, sX: -1.5, sZ: 0.35, el: 0.3, hLX: -1.0, hLZ: 0.35, kL: 1.45, hRX: -1.0, hRZ: 0.35, kR: 1.45, lift: 0 } },
  car: { name: 'Rally Car', icon: '🚙', desc: 'Heavy flips · 1.4x points', build: buildCar,
    accel: 15, turn: 1.9, flip: 3.8, roll: 4.2, spin: 4.5, com: 0.95, lean: -0.05, pts: 1.4, style: false, jump: 8, wheelieA: 0.22,
    camDist: 10.5, camH: 3.8, look: 1.0, width: 0.95, crashRest: 0.9, shadow: 13, blob: [2.3, 4.7], sound: 'car', fpv: [-0.38, 1.45, -0.05],
    pose: { torso: -0.25, sX: -1.15, sZ: 0.12, el: 0.25, hLX: -1.4, hLZ: 0.1, kL: 0.35, hRX: -1.4, hRZ: 0.1, kR: 0.35, lift: 0 } },
  monster: { name: 'Monster Truck', icon: '🛻', desc: 'Huge & bouncy · 1.6x', build: buildMonster,
    accel: 13, turn: 1.7, flip: 3.2, roll: 3.6, spin: 3.9, com: 1.0, lean: -0.06, pts: 1.6, style: false, jump: 11, wheelieA: 0.32,
    camDist: 14, camH: 5.5, look: 1.8, width: 1.3, crashRest: 1.4, shadow: 16, blob: [3.4, 5.8], sound: 'car', fpv: [-0.45, 2.85, 0.1],
    pose: { torso: -0.25, sX: -1.15, sZ: 0.12, el: 0.25, hLX: -1.4, hLZ: 0.1, kL: 0.35, hRX: -1.4, hRZ: 0.1, kR: 0.35, lift: 0 } },
  roadster: { name: 'Rocket Roadster', icon: '🚀', desc: 'Hold Thrusters to fly', build: buildRoadster,
    accel: 22, turn: 2.0, flip: 4.2, roll: 4.8, spin: 5, com: 0.75, lean: -0.04, pts: 1, style: false, thrust: true, jump: 8, wheelieA: 0.18,
    camDist: 10.5, camH: 3.5, look: 0.8, width: 0.95, crashRest: 0.75, shadow: 13, blob: [2.3, 4.9], sound: 'roadster', fpv: [-0.38, 1.12, 0.15],
    pose: { torso: -0.4, sX: -1.25, sZ: 0.12, el: 0.3, hLX: -1.5, hLZ: 0.1, kL: 0.2, hRX: -1.5, hRZ: 0.1, kR: 0.2, lift: 0 } },
  admin: { name: 'Admin Bike', icon: '👑', desc: 'Super OP · wings · hyperspace', build: buildAdmin,
    accel: 60, taper: false, turn: 2.6, flip: 9, roll: 9, spin: 9, com: 0.8, lean: 0.35, pts: 3, style: true, jump: 12, wings: true, admin: true, wheelieA: 0.65,
    camDist: 9, camH: 3.4, look: 1.1, width: 0.25, crashRest: 0.45, shadow: 12, blob: [1.1, 2.7], sound: 'admin', fpv: [0, 1.98, 0.05],
    pose: { torso: 0.5, sX: -1.7, sZ: 0.28, el: 0.3, hLX: -0.9, hLZ: 0.15, kL: 1.3, hRX: -0.9, hRZ: 0.15, kR: 1.3, lift: 0 } }
};
VDEF.jet = { name: 'Stealth Jet', icon: '✈️', desc: 'Fly! Loops, rings, afterburner', build: buildJet, flight: 'jet',
  accel: 20, turn: 1, flip: 0, roll: 0, spin: 0, com: 2.0, lean: 0, pts: 1.2, style: false, jump: 0,
  camDist: 17, camH: 4, look: 2, width: 4.5, crashRest: 1.5, shadow: 22, blob: [10, 14], sound: 'jet', fpv: [0, 3.05, 3.0],
  pose: { torso: -0.3, sX: -1.1, sZ: 0.15, el: 0.4, hLX: -1.4, hLZ: 0.1, kL: 0.4, hRX: -1.4, hRZ: 0.1, kR: 0.4, lift: 0 } };
VDEF.rocket = { name: 'Moon Rocket', icon: '🌙', desc: 'Launch · eject the Roadster · Q lands it', build: buildRocket, flight: 'rocket',
  accel: 0, turn: 0, flip: 0, roll: 0, spin: 0, com: 14, lean: 0, pts: 1, style: false, jump: 0,
  camDist: 60, camH: 8, look: 10, width: 3, crashRest: 2, shadow: 32, blob: [8, 8], sound: 'rocket', fpv: [0, 41, 0.5],
  pose: { torso: 0, sX: -0.3, sZ: 0.1, el: 0, hLX: -1.4, hLZ: 0.1, kL: 1.4, hRX: -1.4, hRZ: 0.1, kR: 1.4, lift: 0 } };
VDEF.buggy = { name: 'Dune Buggy', icon: '🏎️', desc: 'Light & bouncy · 1.3x points', build: buildBuggy,
  accel: 16, turn: 2.3, flip: 4.8, roll: 5.2, spin: 5.4, com: 0.9, lean: -0.05, pts: 1.3, style: false, jump: 10, wheelieA: 0.3,
  camDist: 9, camH: 3.4, look: 1.0, width: 0.9, crashRest: 0.9, shadow: 12, blob: [2.2, 4.2], sound: 'car', fpv: [0, 1.6, -0.25],
  pose: { torso: -0.25, sX: -1.15, sZ: 0.12, el: 0.25, hLX: -1.4, hLZ: 0.1, kL: 0.35, hRX: -1.4, hRZ: 0.1, kR: 0.35, lift: 0 } };
VDEF.jetpack = { name: 'Jetpack', icon: '🧑‍🚀', desc: 'Run, then hold Shift to fly', build: buildJetpack,
  accel: 9, turn: 3.2, flip: 5.5, roll: 6, spin: 6.5, com: 0.95, lean: 0.12, pts: 1.3, style: true, thrust: true, jump: 6, wheelieA: 0,
  maxSpeed: 10, thrustAcc: 27, thrustMax: 20, fuelTime: 9, airAccel: 13, airDrag: 0.35,
  camDist: 5.5, camH: 2.2, look: 1.2, width: 0.3, crashRest: 0.3, shadow: 7, blob: [0.8, 0.9], sound: 'jetpack', fpv: [0, 1.75, 0.15],
  pose: { torso: 0.05, sX: -0.15, sZ: 0.15, el: 0.25, hLX: 0, hLZ: 0.05, kL: 0.05, hRX: 0, hRZ: 0.05, kR: 0.05, lift: 0 } };
VDEF.heli = { name: 'Helicopter', icon: '🚁', desc: 'Flips & rolls · O overclock', build: buildHeli, flight: 'heli',
  accel: 0, turn: 0, flip: 0, roll: 0, spin: 0, com: 0.1, lean: 0, pts: 1.2, style: false, jump: 0,
  camDist: 16, camH: 5, look: 1.5, width: 2.4, crashRest: 1.2, shadow: 16, blob: [4, 8], sound: 'heli', fpv: [0, 2.35, 0.75],
  pose: { torso: -0.25, sX: -1.15, sZ: 0.12, el: 0.25, hLX: -1.4, hLZ: 0.1, kL: 0.35, hRX: -1.4, hRZ: 0.1, kR: 0.35, lift: 0 } };
var VEH_ORDER = ['bike', 'scooter', 'quad', 'buggy', 'car', 'monster', 'jetpack', 'roadster', 'heli', 'jet', 'rocket', 'admin'];
VEH_ORDER.forEach(function(key){
  var d = VDEF[key]; d.obj = d.build();
  d.obj.model.visible = false;
  d.obj.model.traverse(function(o){ if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = 0.85; });
  d.obj.paint.forEach(function(mat){ mat.userData.base = { c: mat.color.getHex(), m: mat.metalness, r: mat.roughness }; });
  vehRoot.add(d.obj.model);
});
if (!VDEF[prefs.vehicle]) prefs.vehicle = 'bike';
var cur = prefs.vehicle, VD = VDEF[cur];

// headlight (on at sunset & night)
var headlight = new THREE.SpotLight(0xfff2d6, 0, 160, 0.55, 0.5, 1.2);
headlight.position.set(0, 0.3, 1.2); vehRoot.add(headlight);
var hlTarget = new THREE.Object3D(); hlTarget.position.set(0, -2.5, 30); vehRoot.add(hlTarget); headlight.target = hlTarget;

// soft contact shadow under the vehicle
var blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: SOFT, color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
blob.renderOrder = 1;
scene.add(blob);

/* ================= paint ================= */
var PAINTS = [
  ['Red', 0xe63323], ['Orange', 0xff6a13], ['Yellow', 0xffc81a], ['Green', 0x2fbf4a], ['Cyan', 0x22c7e6], ['Blue', 0x2b6cff],
  ['Purple', 0x8b3dff], ['Pink', 0xff4fa3], ['White', 0xf2f2f2], ['Black', 0x1b1b1f],
  ['Gold', 0xd4a017, 5, 'gold'], ['Chrome', 0xdfe6ee, 10, 'chrome'], ['Rainbow', 0xff0000, 15, 'rainbow']
];
var rainbowMats = [];
function applyPaint(key){
  var d = VDEF[key], idx = prefs.paint[key], P = idx == null ? null : PAINTS[idx];
  if (P && P[2] && progress.level < P[2]) P = null;
  rainbowMats = rainbowMats.filter(function(m){ return d.obj.paint.indexOf(m) < 0; });
  d.obj.paint.forEach(function(mat){
    var b = mat.userData.base;
    if (!P) { mat.color.setHex(b.c); mat.metalness = b.m; mat.roughness = b.r; return; }
    mat.color.setHex(P[1]);
    if (P[3] === 'gold') { mat.metalness = 0.95; mat.roughness = 0.22; }
    else if (P[3] === 'chrome') { mat.metalness = 1; mat.roughness = 0.06; }
    else { mat.metalness = b.m; mat.roughness = b.r; }
    if (P[3] === 'rainbow') rainbowMats.push(mat);
  });
}

/* ================= particles ================= */
function makeParticles(n, color, size, opacity, additive, rise){
  var pos = new Float32Array(n * 3);
  for (var i = 0; i < n; i++) pos[i * 3 + 1] = -1e4;
  var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: SOFT, color: color, size: size, transparent: true, opacity: opacity, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  pts.frustumCulled = false; scene.add(pts);
  return { n: n, pos: pos, vel: new Float32Array(n * 3), life: new Float32Array(n), geo: geo, idx: 0, rise: rise || 0, mat: pts.material };
}
var dust = makeParticles(500, 0xd9b285, 2.4, 0.5, false, 1.2);
var fire = makeParticles(400, 0x8fd6ff, 1.1, 0.85, true, 0);
var embers = makeParticles(300, 0xffa040, 1.0, 0.85, true, 0);
var sparkle = makeParticles(200, 0xfff0a0, 0.9, 1, true, 0.5);
var splashP = makeParticles(260, 0xdff6ff, 1.0, 0.85, false, -14);
var bigFire = makeParticles(450, 0xff8a2a, 6, 0.9, true, 3);
var smoke = makeParticles(700, 0x8f8a84, 9, 0.42, false, 2.5);
function spawnP(P, x, y, z, vx, vy, vz, spread, life){
  var i = P.idx; P.idx = (P.idx + 1) % P.n;
  P.pos[i * 3] = x + (Math.random() - 0.5) * 0.5; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;
  P.vel[i * 3] = vx + (Math.random() - 0.5) * spread; P.vel[i * 3 + 1] = vy + Math.random() * spread * 0.6; P.vel[i * 3 + 2] = vz + (Math.random() - 0.5) * spread;
  P.life[i] = (life || 1) * (0.7 + Math.random() * 0.6);
}
function updateP(P, dt){
  var damp = Math.exp(-2.2 * dt);
  for (var i = 0; i < P.n; i++) {
    if (P.life[i] <= 0) continue;
    P.life[i] -= dt;
    if (P.life[i] <= 0) { P.pos[i * 3 + 1] = -1e4; continue; }
    P.vel[i * 3] *= damp; P.vel[i * 3 + 1] = P.vel[i * 3 + 1] * damp + P.rise * dt; P.vel[i * 3 + 2] *= damp;
    P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
  }
  P.geo.attributes.position.needsUpdate = true;
}
var dAccum = 0;

/* ================= game state & physics ================= */
var G = 17;
var AX = v(1, 0, 0), AY = v(0, 1, 0), AZ = v(0, 0, 1);
var tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4(), tmpV = new V3(), tmpV2 = new V3();
var S = {
  pos: v(0, heightAt(0, 0) + VD.com, 0), yaw: 0, speed: 0, steerS: 0, horiz: 0,
  vx: 0, vy: 0, vz: 0, grounded: true, airT: 0, grace: 0,
  q: new THREE.Quaternion(), qT: new THREE.Quaternion(), angV: new V3(),
  acc: { p: 0, r: 0, s: 0 }, tricks: {}, trickPts: 0, style: {}, bigAir: 0, speedDemon: false,
  launchKind: null, groundKind: null, launchDone: false,
  crashed: false, crashT: 0, crashSpin: new V3(), lean: 1,
  rpm: 1100, fuel: 1, thrusting: false, thrustVis: 0, bounce: 0, bounceV: 0,
  boost: 1, boosting: false, boostVis: 0, wing: 0, flapT: 0, flapCool: 0, wingsOut: true, wingTuck: 0, overclock: false, ocVis: 0,
  wheelie: 0, wheelieT: 0, wheeliePts: 0, slopeChain: 0, slopeChainT: 0,
  score: 0, chain: 1, chainT: 0, runCoins: 0
};

function groundQuat(yaw, n, lean, out){
  var f = tmpV.set(Math.sin(yaw), 0, Math.cos(yaw));
  var x = tmpV2.crossVectors(n, f).normalize();
  var z = new V3().crossVectors(x, n).normalize();
  tmpM.makeBasis(x, n, z);
  out.setFromRotationMatrix(tmpM);
  if (lean) out.multiply(tmpQ.setFromAxisAngle(AZ, lean));
  return out;
}
function groundVy(x, z, yaw, speed){
  var n = normalAt(x, z, tmpV2);
  var dhds = -(n.x * Math.sin(yaw) + n.z * Math.cos(yaw)) / n.y;
  return speed * dhds / Math.sqrt(1 + dhds * dhds);
}

var TRICK = {
  FRONTFLIP: 2500, BACKFLIP: 2000, 'BARREL ROLL': 1800, '360 SPIN': 1500,
  SUPERMAN: 1500, 'NO-HANDER': 1200, 'NAC-NAC': 1200,
  'BIG AIR': 1500, 'MEGA AIR': 4000, 'INSANE AIR': 10000, 'SPEED DEMON': 2000,
  KICKER: 1000, 'PYRAMID LAUNCH': 5000, 'DUST DEVIL': 4000, SPLASHDOWN: 2500, 'CLEAN LANDING': 800, 'ARCH THREAD': 3000, TRAMPOLINE: 1500
};
var STYLE = { superman: ['SUPERMAN', 1000], nohander: ['NO-HANDER', 800], nacnac: ['NAC-NAC', 800] };
var AIR_PTS = 600;

function addBoost(a){ S.boost = Math.min(1, S.boost + a); }
function addTrick(name){
  S.tricks[name] = (S.tricks[name] || 0) + 1;
  S.trickPts += TRICK[name] || 0;
  addBoost(0.1);
  trickBox.classList.remove('bump'); void trickBox.offsetWidth; trickBox.classList.add('bump');
  sfx('trick');
}

function bankWheelie(){
  if (S.wheelieT > 0.6) {
    var pts = Math.round(S.wheeliePts * VD.pts);
    S.score += pts; addBoost(0.05);
    popup('WHEELIE! +' + fmt(pts), S.wheelieT.toFixed(1) + ' seconds on one wheel', '');
    missionEvent('wheelie', S.wheelieT); sfx('landed');
  }
  S.wheelieT = 0; S.wheeliePts = 0;
}
function takeoff(){
  bankWheelie();
  S.grounded = false;
  S.vx = Math.sin(S.yaw) * S.horiz; S.vz = Math.cos(S.yaw) * S.horiz;
  S.airT = 0; S.acc.p = S.acc.r = S.acc.s = 0; S.angV.set(0, 0, 0);
  S.tricks = {}; S.trickPts = 0; S.style = { superman: 0, nohander: 0, nacnac: 0 }; S.bigAir = 0;
  S.speedDemon = Math.abs(S.speed) * 3.6 > 200;
  S.launchKind = S.groundKind; S.launchDone = false;
}

function stepGround(dt, inp){
  var aspd = Math.abs(S.speed);
  if (S.grace > 0) S.grace -= dt;
  // gentler pull that tapers off at high speed but never reaches zero, so there's still no top speed
  var kmhNow = Math.abs(S.speed) * 3.6;
  var oc = S.overclock ? 10 : 1;
  var pull = oc * (VD.taper === false ? VD.accel * 0.75 : VD.accel * 0.75 * (0.3 + 0.7 / (1 + kmhNow / 180)));
  if (inp.thr) S.speed += (S.speed < 0 ? 16 : pull) * dt;
  if (VD.maxSpeed && S.speed > VD.maxSpeed) S.speed -= (S.speed - VD.maxSpeed) * Math.min(1, 3 * dt);   // running pace
  if (S.boosting) S.speed += (VD.admin ? 45 : 17) * oc * dt;
  if (inp.brk) {
    if (S.speed > 0.3) S.speed = Math.max(0, S.speed - (VD.admin ? 30 + S.speed * 0.25 : 30) * dt);
    else S.speed = Math.max(-9, S.speed - 7 * dt);
  }
  if (!inp.thr && !inp.brk && !S.boosting) {
    var dec = (1.8 + (VD.admin ? Math.min(aspd, 150) : aspd) * 0.02) * dt;   // the admin bike barely slows when coasting
    S.speed = aspd <= dec ? 0 : S.speed - Math.sign(S.speed) * dec;
  }
  var n = normalAt(S.pos.x, S.pos.z, new V3());
  var dhds = -(n.x * Math.sin(S.yaw) + n.z * Math.cos(S.yaw)) / n.y;
  S.speed -= 9.8 * dhds / Math.sqrt(1 + dhds * dhds) * dt;
  // wheelie: hold the backflip key on the ground to lift the front
  var wantW = inp.back && S.speed > 2 ? (VD.wheelieA != null ? VD.wheelieA : 0.45) : 0;
  S.wheelie += (wantW - S.wheelie) * (1 - Math.exp(-(wantW ? 5 : 8) * dt));
  if (S.wheelie > 0.2) { S.wheelieT += dt; S.wheeliePts += (300 + S.wheelieT * 60) * dt; }
  else if (S.wheelieT > 0) bankWheelie();
  var steer = (inp.left ? 1 : 0) - (inp.right ? 1 : 0);
  S.steerS += (steer - S.steerS) * (1 - Math.exp(-8 * dt));
  aspd = Math.abs(S.speed);
  var rate = VD.turn * Math.min(1, aspd / 3) / (1 + aspd / 50);
  S.yaw += S.steerS * rate * dt * (S.speed < 0 ? -1 : 1);
  S.groundKind = featureKind(S.pos.x, S.pos.z);
  var cosS = 1 / Math.sqrt(1 + dhds * dhds);
  S.pos.x += Math.sin(S.yaw) * S.speed * cosS * dt; S.pos.z += Math.cos(S.yaw) * S.speed * cosS * dt;
  S.horiz = S.speed * cosS;
  var h = heightAt(S.pos.x, S.pos.z) + VD.com;
  var vyG = groundVy(S.pos.x, S.pos.z, S.yaw, S.speed);
  var yBall = S.pos.y + S.vy * dt - 0.5 * G * dt * dt;
  // launch only when the ground falls away faster than gravity could pull us down with it
  // (arcade: the sand only "holds" you with 0.6 G, so hill tops and steepening drop-offs throw you into the air)
  var launch = (S.vy - vyG) > G * dt * 0.6 && aspd > 6;
  if (launch && S.grace <= 0) {
    var sharp = (S.vy - vyG) > G * dt * 0.9;
    takeoff(); S.pos.y = Math.max(yBall, h + 0.01);
    if (sharp && aspd > 12) S.vy += Math.min(7, aspd * 0.07);   // a little "pop" off crests and drop-offs = more airtime
    if (S.vy > 50) {                       // cap the launch so crazy speeds don't fling you to space, but keep the speed going forward
      var hz = Math.hypot(S.vx, S.vz), total = Math.hypot(hz, S.vy), nh = Math.sqrt(total * total - 2500);
      if (hz > 0.01) { S.vx *= nh / hz; S.vz *= nh / hz; }
      S.vy = 50;
    }
    S.vy -= G * dt; return;
  }
  S.vy = vyG; S.pos.y = h;
  groundQuat(S.yaw, normalAt(S.pos.x, S.pos.z, n), -S.steerS * VD.lean * Math.min(1, aspd / 8), S.qT);
  S.q.slerp(S.qT, 1 - Math.exp(-14 * dt));
  if (inp.jump) { S.vy = Math.min(50, Math.max(S.vy, 0)) + VD.jump; takeoff(); sfx('jump'); }
  if (VD.thrust && inp.thrust && S.fuel > 0.02) { S.vy = Math.max(S.vy, 0) + 4; takeoff(); }
}

// gravity gets stronger the higher you are above the ground, so big launches don't send you into space.
// Normal jumps (under ~40 m) feel the same; the Rocket Roadster's thrusters ignore the extra pull.
function airGravity(){
  if (S.thrusting) return 1;
  var above = S.pos.y - VD.com - baseHeight(S.pos.x, S.pos.z);
  if (VD.wings && S.wing > 0.5) {               // open wings give lift and let you soar higher
    var ceil = VD.admin ? 400 : 180;
    if (above <= ceil) return S.vy < 0 ? 1 - 0.55 * S.wing : 1;
    return 1 + (above - ceil) / 22 * (S.vy > 0 ? 1.6 : 1);
  }
  if (above <= 40) return 1;
  var extra = (above - 40) / 22;
  return 1 + extra * (S.vy > 0 ? 1.6 : 1);   // pulls hardest while you're still climbing
}

function countAxis(key, posName, negName){
  var a = S.acc[key], need = TAU - 0.7;
  while (a >= need) { a -= TAU; addTrick(posName); }
  while (a <= -need) { a += TAU; addTrick(negName); }
  S.acc[key] = a;
}

function stepAir(dt, inp){
  if (S.wheelie > 0.001) S.wheelie *= Math.exp(-6 * dt); else S.wheelie = 0;   // front wheel eases down after a wheelie launch
  S.thrusting = !!(VD.thrust && inp.thrust && S.fuel > 0);
  if (S.thrusting) {                               // thrusters never run out either
    var tOc = S.overclock ? 3 : 1, tMax = (VD.thrustMax || 45) * tOc;
    S.vy += (VD.thrustAcc || 34) * tOc * dt; if (S.vy > tMax) S.vy = tMax;
  }
  if (VD.airDrag) { var adr = Math.exp(-VD.airDrag * dt); S.vx *= adr; S.vz *= adr; }
  var hs0 = Math.hypot(S.vx, S.vz);
  if ((VD.thrust && inp.thr) || S.boosting || (VD.admin && inp.thr)) {
    var fwd = tmpV.set(0, 0, 1).applyQuaternion(S.q); fwd.y = 0;
    if (hs0 > 2) fwd.set(S.vx / hs0, 0, S.vz / hs0);
    if (fwd.lengthSq() > 0.01) {
      fwd.normalize();
      var ocA = S.overclock ? 10 : 1;
      var a = (S.boosting ? (VD.admin ? 40 : 14) * ocA : 0) + (VD.thrust && inp.thr ? (VD.airAccel || 7) : 0) + (VD.admin && inp.thr ? (S.wingsOut ? 20 : 40) * ocA : 0);   // wings tucked = more speed in the air
      S.vx += fwd.x * a * dt; S.vz += fwd.z * a * dt;
    }
  }
  S.vy -= G * airGravity() * dt;
  if (inp.brk && !S.thrusting) { S.vy -= G * 2.5 * dt; S.diving = true; } else S.diving = false;   // hold brake in the air = dive (Dune!-style)
  if (inp.brk && VD.admin) {                 // the admin bike can also air-brake from crazy speeds
    var hzb = Math.hypot(S.vx, S.vz);
    if (hzb > 1) { var kb = Math.max(0, hzb - (30 + hzb * 0.25) * dt) / hzb; S.vx *= kb; S.vz *= kb; }
  }
  if (S.vy < -95) S.vy = -95;               // terminal velocity
  if (VD.wings) {
    if (S.wingsOut && (inp.jump || (VD.admin && inp.jumpHeld)) && S.flapCool <= 0) {   // Space in the air = a big wing flap (admin: hold to keep flying)
      S.vy = Math.min(VD.admin ? 42 : 35, Math.max(S.vy, 0) + (VD.admin ? 11 : 9)); S.flapT = 0.4; S.flapCool = VD.admin ? 0.25 : 0.3; sfx('flap');
    }
    if (S.wing > 0.5 && S.vy < -9) S.vy += (-9 - S.vy) * (1 - Math.exp(-2.5 * dt));   // glide
  }
  var steer = (inp.left ? 1 : 0) - (inp.right ? 1 : 0);
  S.steerS += (steer - S.steerS) * (1 - Math.exp(-6 * dt));
  if (Math.abs(S.steerS) > 0.001) {
    var hs = Math.hypot(S.vx, S.vz);
    var turn = S.steerS * (VD.thrust && S.thrusting ? 2.2 : 1.8) / (1 + hs / 250) * dt;
    var c = Math.cos(turn), s = Math.sin(turn);
    var nvx = S.vx * c + S.vz * s, nvz = -S.vx * s + S.vz * c;
    S.vx = nvx; S.vz = nvz;
    S.q.premultiply(tmpQ.setFromAxisAngle(AY, turn));
  }
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  S.airT += dt;
  var tp = ((inp.front ? 1 : 0) - (inp.back ? 1 : 0)) * VD.flip * 0.85;
  var tr = ((inp.rollR ? 1 : 0) - (inp.rollL ? 1 : 0)) * VD.roll * 0.85;
  var ts = ((inp.spinL ? 1 : 0) - (inp.spinR ? 1 : 0)) * VD.spin * 0.85;
  var k = 1 - Math.exp(-9 * dt);
  S.angV.x += (tp - S.angV.x) * k; S.angV.y += (ts - S.angV.y) * k; S.angV.z += (tr - S.angV.z) * k;
  S.q.multiply(tmpQ.setFromAxisAngle(AX, S.angV.x * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AY, S.angV.y * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AZ, S.angV.z * dt));
  S.acc.p += S.angV.x * dt; S.acc.s += S.angV.y * dt; S.acc.r += S.angV.z * dt;
  // with no trick keys held, gently line the nose up with the flight path so landings come out clean
  var trickKeys = inp.front || inp.back || inp.rollL || inp.rollR || inp.spinL || inp.spinR;
  if (!trickKeys && Math.hypot(S.vx, S.vz) > 1) {
    var hsA = Math.hypot(S.vx, S.vz), pitch = Math.max(-0.45, Math.min(0.45, Math.atan2(S.vy, hsA) * 0.6));
    var fv = tmpV.set(S.vx, Math.tan(pitch) * hsA, S.vz).normalize();   // follow the flight path, but never nose-dive
    var xv = tmpV2.crossVectors(AY, fv).normalize();
    var yv = new V3().crossVectors(fv, xv);
    tmpM.makeBasis(xv, yv, fv); S.qT.setFromRotationMatrix(tmpM);
    S.q.slerp(S.qT, 1 - Math.exp(-1.8 * dt));
  }
  countAxis('p', 'FRONTFLIP', 'BACKFLIP');
  countAxis('r', 'BARREL ROLL', 'BARREL ROLL');
  countAxis('s', '360 SPIN', '360 SPIN');
  if (VD.style) {
    for (var key in STYLE) {
      if (inp[key] && S.airT > 0.15) {
        S.style[key] += dt;
        if (S.style[key] > 0.3) {
          if (!S.tricks[STYLE[key][0]]) addTrick(STYLE[key][0]);
          S.trickPts += STYLE[key][1] * dt;
        }
      }
    }
  }
  if (S.airT > 2.5 && S.bigAir < 1) { S.bigAir = 1; addTrick('BIG AIR'); }
  if (S.airT > 5 && S.bigAir < 2) { S.bigAir = 2; addTrick('MEGA AIR'); }
  if (S.airT > 9 && S.bigAir < 3) { S.bigAir = 3; addTrick('INSANE AIR'); }
  if (S.speedDemon && S.airT > 0.6 && !S.tricks['SPEED DEMON']) addTrick('SPEED DEMON');
  if (!S.launchDone && S.airT > 0.5 && S.launchKind) {
    S.launchDone = true;
    if (S.launchKind === 'ramp') { addTrick('KICKER'); missionEvent('ramp', 1); }
    else { addTrick('PYRAMID LAUNCH'); missionEvent('pyramid', 1); }
  }
  var h = heightAt(S.pos.x, S.pos.z) + VD.com;
  if (S.pos.y <= h) { S.pos.y = h; land(); }
}

function land(){
  var n = normalAt(S.pos.x, S.pos.z, new V3());
  var up = v(0, 1, 0).applyQuaternion(S.q), d = up.dot(n);
  var f = v(0, 0, 1).applyQuaternion(S.q); f.y = 0;
  var fl = f.length(), hs = Math.hypot(S.vx, S.vz), align = 1;
  if (fl > 0.15 && hs > 2) { f.divideScalar(fl); align = (f.x * S.vx + f.z * S.vz) / hs; }
  if (noCrash()) {                    // the admin bike (and no-crash mode) can't crash: it always lands lined up with where it's going
    if (hs > 2) { f.set(S.vx / hs, 0, S.vz / hs); fl = 1; }
    align = 1; d = Math.max(d, 0.9);
  } else {
    if (d < 0.4) { crash('BAILED!'); return; }
    if (hs > 4 && align < 0.35) { crash('SIDEWAYS!'); return; }
  }
  if (fl > 0.15) S.yaw = Math.atan2(f.x, f.z);
  S.speed = VD.admin ? hs : hs * Math.max(align, 0) * (d > 0.88 ? 1 : 0.85);   // the admin bike never loses speed on landing
  // Dune!-style: touch down smoothly on a downhill slope and all that falling speed shoots you forward
  var v3 = Math.sqrt(hs * hs + S.vy * S.vy);
  var into = v3 > 1 ? -(S.vx * n.x + S.vy * n.y + S.vz * n.z) / v3 : 0;      // 0 = skimming the slope, 1 = straight into it
  var slope = hs > 1 ? -(n.x * S.vx + n.z * S.vz) / hs / n.y : 0;            // negative = ground falls away ahead
  var cleanLand = S.airT > 0.5 && slope < -0.05 && into < 0.45 + 0.6 * Math.min(0.5, -slope) && d > 0.7 && align > 0.8;   // steeper downhill = more forgiving
  if (cleanLand) {
    S.slopeChain = S.slopeChainT > 0 ? Math.min(6, S.slopeChain + 1) : 1; S.slopeChainT = 6;
    S.speed = v3 * 1.02 + 4 + S.slopeChain * 3;
    addTrick('CLEAN LANDING'); addBoost(0.08);
    toast('🌊 CLEAN LANDING! SPEED UP' + (S.slopeChain > 1 ? '  x' + S.slopeChain + ' IN A ROW' : ''), '#36e0ff');
    sfx('clean'); missionEvent('clean', S.slopeChain); S.cleanFx = 0.6;
  } else if (S.airT > 0.8 && into > 0.6 && !VD.admin) {
    S.speed *= 0.7; S.slopeChain = 0;           // slammed into the ground: lose speed
  }
  var impact = Math.max(0, groundVy(S.pos.x, S.pos.z, S.yaw, S.speed) - S.vy);
  S.grounded = true;
  S.vy = groundVy(S.pos.x, S.pos.z, S.yaw, S.speed);
  S.grace = 0.35;
  S.angV.set(0, 0, 0); S.thrusting = false;
  S.bounceV = -Math.min(VD.key === 'monster' ? 3 : 1.6, impact * (VD.key === 'monster' ? 0.09 : 0.05));
  for (var i = 0; i < Math.min(50, 10 + S.airT * 10); i++) spawnP(dust, S.pos.x, S.pos.y - VD.com + 0.2, S.pos.z, S.vx * 0.2, 2, S.vz * 0.2, 7, 1.4);
  if (S.airT > 0.5) sfx('land');
  if (inWater() && S.airT > 0.8) { addTrick('SPLASHDOWN'); splash(60, 12); }
  bank(d);
}

function bank(d){
  var tricks = S.tricks, names = Object.keys(tricks);
  var air = S.airT > 0.6 ? S.airT * AIR_PTS : 0;
  var base = S.trickPts + air;
  S.tricks = {}; S.trickPts = 0;
  missionEvent('air', S.airT);
  if (names.length === 0 && S.airT < 1.0) return;
  var mult = Math.max(1, names.length);
  var perfect = d > 0.97 && names.length > 0;
  var bMul = BIOMES[curBiome].mult * (frenzy.t > 0 ? 2 : 1);
  var total = Math.round(base * mult * S.chain * (perfect ? 1.5 : 1) * VD.pts * bMul);
  S.score += total;
  addBoost(Math.min(0.3, total / 40000));
  var sub = [];
  if (names.length) sub.push(names.join(' + '));
  sub.push('x' + mult + ' combo' + (S.chain > 1 ? '  ·  x' + S.chain + ' chain' : '') + (VD.pts !== 1 ? '  ·  x' + VD.pts + ' ' + VD.name : '') + (BIOMES[curBiome].mult !== 1 ? '  ·  x' + BIOMES[curBiome].mult + ' ' + BIOMES[curBiome].name : '') + (frenzy.t > 0 ? '  ·  x2 FRENZY' : '') + (perfect ? '  ·  PERFECT!' : ''));
  popup((names.length ? 'LANDED! +' : 'AIR +') + fmt(total), sub.join('<br>'), '');
  if (total > bestLanding) { bestLanding = total; save('duneRider.best', total); }
  names.forEach(function(nm){ for (var c = 0; c < tricks[nm]; c++) missionEvent('trick', nm); });
  missionEvent('combo', mult); missionEvent('landScore', total);
  if (perfect) missionEvent('perfect', 1);
  if (names.length) { S.chain = Math.min(10, S.chain + 1); S.chainT = 4; missionEvent('chain', S.chain); sfx('landed'); }
}

function crash(msg){
  S.crashed = true; S.crashT = 2.2; S.grounded = false; S.thrusting = false; S.wheelie = 0; S.wheelieT = 0; S.wheeliePts = 0; S.slopeChain = 0;
  if (Math.abs(S.speed) > 0 && !S.vx && !S.vz) { S.vx = Math.sin(S.yaw) * S.speed; S.vz = Math.cos(S.yaw) * S.speed; }
  S.speed = 0; S.chain = 1; S.chainT = 0;
  var lost = Object.keys(S.tricks).length;
  S.tricks = {}; S.trickPts = 0;
  S.crashSpin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4));
  S.lean = Math.random() < 0.5 ? -1 : 1;
  popup(msg, lost ? 'Combo lost' : '', 'bad');
  sfx('crash');
  if (VD.flight) {                       // aircraft blow up
    explode(S.pos.x, S.pos.y, S.pos.z, VD.flight === 'rocket' ? 2.5 : 1.3);
    VD.obj.model.visible = false; S.vx *= 0.1; S.vz *= 0.1; S.vy = 0; S.crashT = 2.8;
    if (VD.flight === 'rocket') launchPad.visible = false;
  }
}

function stepCrash(dt){
  S.crashT -= dt;
  var damp = Math.exp(-2.5 * dt);
  S.vx *= damp; S.vz *= damp; S.vy -= G * dt;
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  var h = heightAt(S.pos.x, S.pos.z) + VD.crashRest;
  if (S.pos.y <= h) {
    S.pos.y = h; S.vy = Math.abs(S.vy) > 3 ? -S.vy * 0.3 : 0;
    S.crashSpin.multiplyScalar(Math.exp(-4 * dt));
    var yaw = Math.hypot(S.vx, S.vz) > 1 ? Math.atan2(S.vx, S.vz) : S.yaw;
    groundQuat(yaw, normalAt(S.pos.x, S.pos.z, new V3()), S.lean * Math.PI / 2, S.qT);
    S.q.slerp(S.qT, 1 - Math.exp(-6 * dt));
    if (Math.hypot(S.vx, S.vz) > 3 && Math.random() < 0.5) spawnP(dust, S.pos.x, S.pos.y - 0.3, S.pos.z, 0, 1, 0, 3, 1.2);
  } else {
    S.q.multiply(tmpQ.setFromAxisAngle(AX, S.crashSpin.x * dt));
    S.q.multiply(tmpQ.setFromAxisAngle(AZ, S.crashSpin.z * dt));
  }
  if (S.crashT <= 0) respawn();
}

function respawn(){
  if (Math.hypot(S.vx, S.vz) > 1) S.yaw = Math.atan2(S.vx, S.vz);
  S.crashed = false; S.grounded = true; S.speed = 0; S.horiz = 0; S.vx = S.vy = S.vz = 0; S.steerS = 0; S.grace = 0.3;
  S.pos.y = heightAt(S.pos.x, S.pos.z) + VD.com;
  groundQuat(S.yaw, normalAt(S.pos.x, S.pos.z, new V3()), 0, S.q);
  S.angV.set(0, 0, 0); S.tricks = {}; S.trickPts = 0; S.thrusting = false; S.boosting = false; S.wheelie = 0; S.wheelieT = 0; S.wheeliePts = 0;
  S.acc.p = S.acc.r = S.acc.s = 0; S.sink = 0; S.gpitch = 0; S.flightT = 0; S.roar = 0; S.infiniteThrust = false;
  cancelHyper();
  RA = null; landingPad.visible = false; S.rotor = 0; S.heliP = 0; S.heliR = 0; S.spinAcc = 0;
  VD.obj.model.visible = true;
  if (VD.flight === 'rocket') {          // back on a launch pad, standing upright
    resetRocket();
    groundQuat(S.yaw, AY, 0, S.q);
    S.pos.y = heightAt(S.pos.x, S.pos.z) + VD.com + 0.5;
    launchPad.position.set(S.pos.x, S.pos.y - VD.com, S.pos.z); launchPad.rotation.y = S.yaw; launchPad.visible = true;
  } else launchPad.visible = false;
}

/* ================= flight: Stealth Jet & Moon Rocket ================= */
var debris = [];
function explode(x, y, z, power){
  for (var i = 0; i < 110 * power; i++) spawnP(bigFire, x, y, z, 0, 4, 0, 26 * power, 1.1);
  for (var j = 0; j < 70 * power; j++) spawnP(smoke, x, y, z, 0, 3, 0, 12 * power, 3.5);
  shakeT = Math.max(shakeT, 0.8); sfx('boom');
}
function flightTrick(name, pts){
  var p = Math.round(pts * VD.pts); S.score += p;
  toast(name + '!  +' + fmt(p), '#ffe14d'); sfx('trick'); addBoost(0.1);
  missionEvent('trick', name);
}
function countFlightTricks(){
  while (S.acc.p <= -TAU) { S.acc.p += TAU; flightTrick('LOOP', 3000); }
  while (S.acc.p >= TAU) { S.acc.p -= TAU; flightTrick('OUTSIDE LOOP', 4000); }
  while (Math.abs(S.acc.r) >= TAU) { S.acc.r -= Math.sign(S.acc.r) * TAU; flightTrick('BARREL ROLL', 1500); }
}

function stepJet(dt, inp){
  var fwd = tmpV.set(0, 0, 1).applyQuaternion(S.q);
  var thrust = ((inp.thr ? 26 : 6) + (S.boosting ? 30 : 0)) * (S.overclock ? 6 : 1);
  if (inp.brk) S.speed = Math.max(0, S.speed - 22 * dt);
  S.speed += (thrust - 2.6e-4 * S.speed * S.speed - 9.8 * fwd.y) * dt;   // tops out near Mach 0.9, past Mach 1.3 with afterburner
  if (S.speed < 0) S.speed = 0;
  S.roar = (inp.thr ? 0.05 : 0.02) + (S.boosting ? 0.1 : 0);
  var ctrl = Math.min(1, S.speed / 55);
  var pitchIn = (inp.front ? 1 : 0) - (inp.back ? 1 : 0);       // down arrow = nose up
  var rollIn = (inp.rollR ? 1 : 0) - (inp.rollL ? 1 : 0);
  var yawIn = ((inp.left ? 1 : 0) - (inp.right ? 1 : 0)) + ((inp.spinL ? 1 : 0) - (inp.spinR ? 1 : 0)) * 0.6;
  if (S.grounded) {
    // rolling down the sand like a runway
    S.yaw += yawIn * 0.8 * Math.min(1, S.speed / 8) / (1 + S.speed / 60) * dt;
    S.pos.x += Math.sin(S.yaw) * S.speed * dt; S.pos.z += Math.cos(S.yaw) * S.speed * dt;
    S.horiz = S.speed;
    S.pos.y = heightAt(S.pos.x, S.pos.z) + VD.com;
    var wantPitch = pitchIn < 0 && S.speed > 38 ? 0.16 : 0;
    S.gpitch = (S.gpitch || 0) + (wantPitch - (S.gpitch || 0)) * (1 - Math.exp(-4 * dt));
    groundQuat(S.yaw, normalAt(S.pos.x, S.pos.z, _n2), 0, S.q);
    S.q.multiply(tmpQ.setFromAxisAngle(AX, -S.gpitch));
    S.vx = Math.sin(S.yaw) * S.speed; S.vz = Math.cos(S.yaw) * S.speed; S.vy = 0;
    if (S.gpitch > 0.1 && S.speed > 52) {
      // lift off nose-up even when rolling downhill on a big dune
      var curPitch = Math.asin(Math.max(-1, Math.min(1, tmpV.set(0, 0, 1).applyQuaternion(S.q).y)));
      groundQuat(S.yaw, AY, 0, S.q); S.q.multiply(tmpQ.setFromAxisAngle(AX, -Math.max(0.14, curPitch)));
      S.grounded = false; S.sink = 0; S.flightT = 0; S.pos.y += 0.6; S.angV.set(0, 0, 0);
      toast('✈️ TAKEOFF!', '#ffffff');
    }
    return;
  }
  S.flightT = (S.flightT || 0) + dt;
  var k = 1 - Math.exp(-6 * dt);
  var jOc = S.overclock ? 1.6 : 1;
  S.angV.x += (pitchIn * 1.5 * jOc * ctrl - S.angV.x) * k;
  S.angV.z += (rollIn * 3.2 * jOc * ctrl - S.angV.z) * k;
  S.angV.y += (yawIn * 0.6 * ctrl - S.angV.y) * k;
  S.q.multiply(tmpQ.setFromAxisAngle(AX, S.angV.x * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AY, S.angV.y * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AZ, S.angV.z * dt));
  S.acc.p += S.angV.x * dt; S.acc.r += S.angV.z * dt;
  // banking turns the jet; with no roll input the wings slowly level out
  var leftWing = tmpV2.set(1, 0, 0).applyQuaternion(S.q), bank = Math.asin(Math.max(-1, Math.min(1, leftWing.y)));
  S.q.premultiply(tmpQ.setFromAxisAngle(AY, -bank * 1.2 * ctrl * dt));
  if (!rollIn && Math.abs(pitchIn) < 1) S.q.multiply(tmpQ.setFromAxisAngle(AZ, -bank * 1.0 * dt));
  // too slow = stall: the nose drops and you sink
  var stall = Math.max(0, Math.min(1, (45 - S.speed) / 45));
  S.sink = (S.sink || 0) + (stall * 28 - (S.sink || 0)) * (1 - Math.exp(-1.5 * dt));
  if (stall > 0) S.q.multiply(tmpQ.setFromAxisAngle(AX, stall * 0.9 * dt));
  fwd.set(0, 0, 1).applyQuaternion(S.q);
  S.vx = fwd.x * S.speed; S.vy = fwd.y * S.speed - S.sink; S.vz = fwd.z * S.speed;
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  if (S.pos.y > 3000) { S.pos.y = 3000; S.vy = Math.min(S.vy, 0); }
  S.yaw = Math.atan2(fwd.x, fwd.z);
  countFlightTricks();
  // low, fast flyby bonus
  var h = heightAt(S.pos.x, S.pos.z);
  if (S.pos.y - VD.com - h < 12 && S.speed > 110) { S.flyby = (S.flyby || 0) + dt; if (S.flyby > 2) { S.flyby = 0; flightTrick('LOW FLYBY', 1200); } } else S.flyby = 0;
  if (S.pos.y - VD.com <= h) {
    var up = tmpV2.set(0, 1, 0).applyQuaternion(S.q);
    var n = normalAt(S.pos.x, S.pos.z, _n2);
    var justOff = S.flightT < 2.5 && up.dot(n) > 0.6;      // brushing the sand right after takeoff just puts you back on the ground
    if (justOff || (up.dot(n) > 0.8 && S.vy > -10 && fwd.y > -0.3 && S.speed < 220)) {
      S.grounded = true; S.pos.y = h + VD.com; S.gpitch = 0; S.angV.set(0, 0, 0); S.sink = 0;
      if (S.flightT > 4) { var lp = Math.round(5000 * VD.pts); S.score += lp; toast('🛬 TOUCHDOWN!  +' + fmt(lp), '#7dff6a'); missionEvent('touchdown', 1); }
    } else crash('CRASHED!');
  }
}

function stepRocket(dt, inp){
  if (RA && RA.phase !== 'done') { stepRocketAuto(dt); return; }
  var up = tmpV.set(0, 1, 0).applyQuaternion(S.q);
  var burning = !!inp.thr;
  var thrust = burning ? (32 + (S.boostersOn ? 22 : 0) + (S.boosting ? 15 : 0)) * (S.overclock ? 3 : 1) : 0;
  S.engineOn = burning; S.roar = burning ? 0.38 : 0;
  if (S.grounded) {
    S.vx = S.vy = S.vz = 0;
    if (thrust > G) { S.grounded = false; S.flightT = 0; toast('🚀 LIFTOFF!', '#ffffff'); missionEvent('liftoff', 1); S.pos.y += 0.2; }
    else return;
  }
  S.flightT = (S.flightT || 0) + dt;
  var steer = S.flightT > 1.5 ? 0.6 : 0;          // clear the tower before steering
  var pIn = (inp.front ? 1 : 0) - (inp.back ? 1 : 0);
  var yIn = ((inp.rollR ? 1 : 0) - (inp.rollL ? 1 : 0)) + ((inp.right ? 1 : 0) - (inp.left ? 1 : 0));
  var rIn = -(inp.spinR ? 1 : 0);              // Q is the booster-landing button on the rocket
  var k = 1 - Math.exp(-4 * dt);
  S.angV.x += (pIn * steer - S.angV.x) * k; S.angV.z += (Math.max(-1, Math.min(1, yIn)) * steer - S.angV.z) * k; S.angV.y += (rIn * 1.0 - S.angV.y) * k;
  S.q.multiply(tmpQ.setFromAxisAngle(AX, S.angV.x * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AZ, S.angV.z * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AY, S.angV.y * dt));
  up.set(0, 1, 0).applyQuaternion(S.q);
  S.vx += up.x * thrust * dt; S.vy += (up.y * thrust - G) * dt; S.vz += up.z * thrust * dt;
  var drag = Math.exp(-0.02 * dt); S.vx *= drag; S.vy *= drag; S.vz *= drag;
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  if (S.pos.y > 9000) { S.pos.y = 9000; S.vy = Math.min(S.vy, 0); }
  if (S.boostersOn && burning) { S.boosterT += dt; if (S.boosterT > 9) separateBoosters(); }
  if (inp.jump && S.payload && S.pos.y - heightAt(S.pos.x, S.pos.z) > 25) { ejectRoadster(); return; }
  var h = heightAt(S.pos.x, S.pos.z);
  if (S.pos.y - VD.com <= h) {
    var spd = Math.hypot(S.vx, S.vy, S.vz);
    if (spd < 14 && up.y > 0.9) {
      S.grounded = true; S.pos.y = h + VD.com; S.vx = S.vy = S.vz = 0; S.angV.set(0, 0, 0);
      groundQuat(Math.atan2(Math.sin(S.yaw), Math.cos(S.yaw)), AY, 0, S.q);
      if (S.flightT > 5) { var lp = Math.round(20000 * VD.pts); S.score += lp; toast('🎯 ROCKET LANDED UPRIGHT!  +' + fmt(lp), '#7dff6a'); missionEvent('rocketland', 1); }
    } else crash('KABOOM!');
  }
}
function stepHeli(dt, inp){
  var up = tmpV.set(0, 1, 0).applyQuaternion(S.q);
  S.rotor = S.rotor || 0;
  var spool = inp.thr || !S.grounded;
  S.rotor += ((spool ? 1 : 0.15) - S.rotor) * (1 - Math.exp(-(spool ? 0.9 : 0.5) * dt));
  S.engineOn = S.rotor > 0.2; S.roar = S.rotor;
  var yawIn = ((inp.left ? 1 : 0) - (inp.right ? 1 : 0)) + ((inp.spinL ? 1 : 0) - (inp.spinR ? 1 : 0)) * 0.7;
  S.steerS += (Math.max(-1, Math.min(1, yawIn)) - S.steerS) * (1 - Math.exp(-4 * dt));
  if (S.grounded) {
    S.vx = S.vy = S.vz = 0; S.heliP = 0; S.heliR = 0; S.angV.set(0, 0, 0); S.acc.p = S.acc.r = 0;
    if (S.rotor > 0.2) S.yaw += S.steerS * 0.8 * dt;
    groundQuat(S.yaw, normalAt(S.pos.x, S.pos.z, _n2), 0, S.q);
    S.pos.y = heightAt(S.pos.x, S.pos.z) + VD.com;
    if (inp.thr && S.rotor > 0.9) { S.grounded = false; S.flightT = 0; S.pos.y += 0.3; S.vy = 2; toast('🚁 LIFTOFF!', '#ffffff'); }
    return;
  }
  S.flightT = (S.flightT || 0) + dt;
  var oc = S.overclock ? 1 : 0;
  // cyclic like a sim: the arrows ROTATE the helicopter. Hold them to keep rotating (flips & rolls!),
  // let go and it holds that angle. Space levels it back out.
  var rate = oc ? 5.2 : 3.0;
  var pIn = (inp.front ? 1 : 0) - (inp.back ? 1 : 0), rIn = (inp.rollR ? 1 : 0) - (inp.rollL ? 1 : 0);
  var kr = 1 - Math.exp(-7 * dt);
  S.angV.x += (pIn * rate - S.angV.x) * kr;
  S.angV.z += (rIn * rate * 1.15 - S.angV.z) * kr;
  S.angV.y += (Math.max(-1, Math.min(1, yawIn)) * (oc ? 2.6 : 1.7) - S.angV.y) * kr;
  S.q.multiply(tmpQ.setFromAxisAngle(AX, S.angV.x * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AZ, S.angV.z * dt));
  S.q.multiply(tmpQ.setFromAxisAngle(AY, S.angV.y * dt));
  var wv = tmpV2.set(S.angV.x, S.angV.y, S.angV.z).applyQuaternion(S.q);
  S.yaw += wv.y * dt;                                       // heading follows the turn (the camera uses it)
  if (inp.jumpHeld) {                                        // Space: auto-level
    groundQuat(S.yaw, AY, 0, S.qT); S.q.slerp(S.qT, 1 - Math.exp(-3.5 * dt));
  }
  // flips, rolls and pirouettes
  S.acc.p += S.angV.x * dt; S.acc.r += S.angV.z * dt; S.spinAcc = (S.spinAcc || 0) + S.angV.y * dt;
  if (!pIn && !rIn) { var dk = Math.exp(-0.4 * dt); S.acc.p *= dk; S.acc.r *= dk; }
  if (!yawIn) S.spinAcc *= Math.exp(-0.4 * dt);
  while (S.acc.p >= TAU * 0.92) { S.acc.p -= TAU; flightTrick('FRONTFLIP', 3000); missionEvent('heliflip', 1); }
  while (S.acc.p <= -TAU * 0.92) { S.acc.p += TAU; flightTrick('BACKFLIP', 3000); missionEvent('heliflip', 1); }
  while (Math.abs(S.acc.r) >= TAU * 0.92) { S.acc.r -= Math.sign(S.acc.r) * TAU; flightTrick('BARREL ROLL', 2500); }
  if (Math.abs(S.spinAcc) >= TAU) { S.spinAcc -= Math.sign(S.spinAcc) * TAU; flightTrick('PIROUETTE', 1500); }
  up.set(0, 1, 0).applyQuaternion(S.q);
  // collective: roughly level it holds height for you (W climbs, S sinks);
  // tipped right over or upside down it's raw rotor thrust, so flips feel real
  var hAboveH = S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z), T;
  if (up.y > 0.8) {
    var vyT = inp.thr ? (S.overclock ? 40 : 14) : inp.brk ? -Math.min(60, 1.5 + hAboveH * 0.5) : 0;   // drops fast when high, eases off as the skids get close to the sand
    T = (G + (vyT - S.vy) * 2.2) / up.y;
  } else T = G * (1.25 + (inp.thr ? 0.9 : 0) - (inp.brk ? 0.9 : 0)) * (oc ? 2.5 : 1);
  T = Math.max(0, T) * S.rotor;
  var hBoost = (S.boosting ? 1.6 : 1) * (oc ? 6 : 1);        // overclock: the rotor pulls you across the sky 6x harder
  S.vx += up.x * T * hBoost * dt; S.vz += up.z * T * hBoost * dt; S.vy += (up.y * T - G) * dt;
  var drag = Math.exp(-((oc ? 0.15 : 0.2) + (up.y > 0.97 && !pIn && !rIn ? 0.45 : 0)) * dt);   // level and hands off = it settles
  S.vx *= drag; S.vz *= drag; S.vy *= Math.exp(-0.1 * dt);
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  if (S.pos.y > 3500) { S.pos.y = 3500; S.vy = Math.min(0, S.vy); }
  var h = heightAt(S.pos.x, S.pos.z);
  if (S.pos.y - VD.com <= h) {
    var n = normalAt(S.pos.x, S.pos.z, _n2), hsp = Math.hypot(S.vx, S.vz);
    if (S.vy > -8 && up.dot(n) > 0.8 && hsp < 25) {
      S.grounded = true; S.pos.y = h + VD.com;
      if (S.flightT > 4) { var lp = Math.round(4000 * VD.pts); S.score += lp; toast('🚁 TOUCHDOWN!  +' + fmt(lp), '#7dff6a'); missionEvent('helitouch', 1); }
    } else crash('CRASHED!');
  }
}
function rocketPartWorld(obj, localPos){
  return _p.copy(localPos).add(VD.obj.model.position).applyQuaternion(S.q).add(S.pos);
}
function separateBoosters(){
  S.boostersOn = false;
  var R = VDEF.rocket.obj;
  R.boosters.forEach(function(b, i){
    b.visible = false;
    var d = makeBooster(), s = i ? 1 : -1;
    d.position.copy(rocketPartWorld(b, b.position)); d.quaternion.copy(S.q); scene.add(d);
    var side = tmpV2.set(s, 0, 0).applyQuaternion(S.q);
    debris.push({ g: d, vx: S.vx + side.x * 7, vy: S.vy + side.y * 7, vz: S.vz + side.z * 7, sx: (Math.random() - 0.5) * 0.6, sz: s * 0.5, t: 0, size: 1 });
  });
  var bp = Math.round(5000 * VD.pts); S.score += bp;
  toast('💨 BOOSTER SEPARATION!  +' + fmt(bp), '#ffffff'); sfx('boost');
}
function ejectRoadster(){
  var R = VDEF.rocket.obj, rm = R.model;
  var payloadPos = rocketPartWorld(R.payload, R.payload.position).clone();
  var up = v(0, 1, 0).applyQuaternion(S.q);
  // the empty rocket carries on as debris and falls back down
  var wp = v(0, -VD.com, 0).applyQuaternion(S.q).add(S.pos);
  vehRoot.remove(rm); scene.add(rm); rm.position.copy(wp); rm.quaternion.copy(S.q);
  R.payload.visible = false;
  R.fairing.forEach(function(f, i){ f.rotation.z = (i ? -1 : 1) * 1.4; });
  debris.push({ g: rm, vx: S.vx, vy: S.vy, vz: S.vz, sx: 0.15, sz: 0.25, t: 0, size: 2.5, rocket: true });
  var vel = v(S.vx, S.vy, S.vz).addScaledVector(up, 14);
  var yaw = Math.hypot(vel.x, vel.z) > 2 ? Math.atan2(vel.x, vel.z) : S.yaw;
  setVehicle('roadster', true);
  rm.visible = true;
  S.pos.copy(payloadPos); S.vx = vel.x; S.vy = vel.y; S.vz = vel.z;
  S.yaw = yaw; groundQuat(yaw, AY, 0, S.q);
  S.grounded = false; S.crashed = false; S.airT = 0; S.tricks = {}; S.trickPts = 0; S.acc.p = S.acc.r = S.acc.s = 0;
  S.infiniteThrust = true; S.fuel = 1; S.launchKind = null; S.launchDone = true;
  toast('🚗 ROADSTER DEPLOYED!  INFINITE THRUSTERS (hold ' + keyName(binds.thrust) + ')', '#36e0ff');
  sfx('ring'); missionEvent('deploy', 1);
}
function updateDebris(dt){
  for (var i = debris.length - 1; i >= 0; i--) {
    var d = debris[i];
    d.t += dt; d.vy -= G * dt;
    d.g.position.x += d.vx * dt; d.g.position.y += d.vy * dt; d.g.position.z += d.vz * dt;
    d.g.rotateX(d.sx * dt); d.g.rotateZ(d.sz * dt);
    if (d.rocket && Math.random() < 0.5) spawnP(smoke, d.g.position.x, d.g.position.y, d.g.position.z, 0, 0, 0, 3, 2);
    var h = heightAt(d.g.position.x, d.g.position.z);
    if (d.g.position.y < h + 1 || d.t > 40) {
      if (d.g.position.y < h + 1) explode(d.g.position.x, h + 2, d.g.position.z, d.size);
      if (d.rocket) d.g.visible = false; else scene.remove(d.g);
      debris.splice(i, 1);
    }
  }
}
function resetRocket(){
  var R = VDEF.rocket.obj, rm = R.model;
  for (var i = debris.length - 1; i >= 0; i--) if (debris[i].g === rm) debris.splice(i, 1);
  if (rm.parent !== vehRoot) { if (rm.parent) rm.parent.remove(rm); vehRoot.add(rm); }
  rm.position.set(0, -VDEF.rocket.com, 0); rm.quaternion.set(0, 0, 0, 1); rm.visible = true;
  R.boosters.forEach(function(b){ b.visible = true; });
  R.fairing.forEach(function(f){ f.rotation.z = 0; });
  R.payload.visible = true;
  S.boostersOn = true; S.boosterT = 0; S.payload = true; S.engineOn = false;
  S.rLegs = 0; S.rFins = 0; S.rLegsWant = false; S.rFinsWant = false; S.rocketThr = 1;
  if (R.legs) { R.legs.forEach(function(l){ l.rotation.z = 0; }); R.fins.forEach(function(f){ f.rotation.z = 0; }); }
}

/* ================= booster landing autopilot (Moon Rocket, press Q) ================= */
var RA = null, R_AMAX = 55, R_LAND = 74, LEG_EXT = 2.6, _ra = new V3(), _rq = new THREE.Quaternion();
function toggleRocketAuto(){
  if (RA && RA.phase !== 'done') { RA = null; S.engineOn = false; S.rocketThr = 1; toast('AUTOPILOT OFF · manual control', '#ffffff'); return; }
  if (S.grounded) { toast('Launch first (hold W), then press ' + keyName(binds.spinL) + ' to land it!', '#ffb35c'); return; }
  RA = { phase: 'flip', t: 0, pad: null, entry: 0, entryDone: false, slow: false, camOn: false, doneT: 0, legsGo: false };
  S.angV.set(0, 0, 0);
  if (S.boostersOn) separateBoosters();
  toast('🚀 BOOSTER LANDING · FLIP MANEUVER', '#ffffff'); sfx('coldgas');
}
function pickPad(px, pz){
  var best = null, bestCost = 1e9;
  for (var gx = -3; gx <= 3; gx++) for (var gz = -3; gz <= 3; gz++) {
    var cx = px + gx * 40, cz = pz + gz * 40, lo = 1e9, hi = -1e9;
    if (nearOasis(cx, cz, 10) || nearRock(cx, cz, 16)) continue;
    for (var k = 0; k <= 12; k++) {
      var a = k / 12 * TAU, r = k === 12 ? 0 : (k % 2 ? 7 : 14);
      var h = heightAt(cx + Math.cos(a) * r, cz + Math.sin(a) * r); lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
    var cost = (hi - lo) + Math.hypot(gx, gz) * 0.6;
    if (cost < bestCost) { bestCost = cost; best = { x: cx, z: cz, y: hi + 0.3 }; }
  }
  if (!best) best = { x: px, z: pz, y: heightAt(px, pz) + 0.3 };
  // the tracking camera sits out on the sunny side so the rocket is lit up
  var sx = SUN_DIR.x, sz = SUN_DIR.z, sl = Math.hypot(sx, sz) || 1;
  best.camDx = sx / sl * 48 + sz / sl * 16; best.camDz = sz / sl * 48 - sx / sl * 16;
  landingPad.position.set(best.x, best.y, best.z); landingPad.visible = true;
  return best;
}
function startCoast(){
  var A = RA; A.phase = 'coast'; A.t = 0;
  var h0 = S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z);
  var tf = Math.min(14, (S.vy + Math.sqrt(Math.max(0, S.vy * S.vy + 2 * G * Math.max(h0, 1)))) / G);
  A.pad = pickPad(S.pos.x + S.vx * tf * 0.6, S.pos.z + S.vz * tf * 0.6);
  toast('🪂 GRID FINS OUT · LANDING ZONE LOCKED', '#9fd8ff'); sfx('wings');
}
// height of whatever we'd land on: the pad when over it, otherwise the sand below and just ahead
function rocketGroundRef(A){
  if (A.pad && Math.hypot(S.pos.x - A.pad.x, S.pos.z - A.pad.z) < 17) return A.pad.y;
  return Math.max(heightAt(S.pos.x, S.pos.z), heightAt(S.pos.x + S.vx, S.pos.z + S.vz), heightAt(S.pos.x + S.vx * 2, S.pos.z + S.vz * 2));
}
function stepRocketAuto(dt){
  var A = RA; A.t += dt;
  S.flightT = (S.flightT || 0) + dt;
  var up = tmpV.set(0, 1, 0).applyQuaternion(S.q);
  var vh = Math.hypot(S.vx, S.vz), spd = Math.hypot(vh, S.vy);
  var ax = 0, ay = 0, az = 0, thr = 0, direct = false, turnRate = 2.5, want = _ra.set(0, 1, 0);
  var hRem = S.pos.y - VD.com - LEG_EXT - rocketGroundRef(A);
  if (A.phase === 'flip') {
    // cold-gas thrusters swing the rocket round so the engines face the way it's going
    if (spd > 5) want.set(-S.vx, -S.vy, -S.vz).normalize();
    turnRate = 1.8;
    if (Math.random() < 0.6) {
      var sd = Math.random() < 0.5 ? -1 : 1;
      _p.set(sd * 2, 30 - VD.com, 0).applyQuaternion(S.q).add(S.pos);
      var pd = tmpV2.set(sd, 0, 0).applyQuaternion(S.q);
      spawnP(puff, _p.x, _p.y, _p.z, pd.x * 14 + S.vx, pd.y * 14 + S.vy, pd.z * 14 + S.vz, 2, 0.6);
    }
    if (A.t > 1.8) {
      A.t = 0;
      if (vh > 35 || S.vy > 25) { A.phase = 'boost'; toast('🔥 BOOSTBACK BURN', '#ffb35c'); sfx('boost'); }
      else startCoast();
    }
  } else if (A.phase === 'boost') {
    // burn against the motion until we're basically falling straight down
    // when it's low, the burn also has to stop the fall, not just the sideways speed
    var ky = -S.vy + (S.vy < -5 && hRem < 1800 ? G : 0);
    var kx = -S.vx, kz = -S.vz, kl = Math.hypot(kx, ky, kz);
    if (kl > 0.1) want.set(kx, ky, kz).divideScalar(kl);
    turnRate = 3;
    thr = up.dot(want) > 0.8 ? 1 : 0.15;
    if ((vh < 15 && S.vy < 10) || A.t > 20) startCoast();
    else if (S.vy < 0 && S.vy * S.vy / (2 * Math.max(hRem, 0.5)) > (R_AMAX - G) * 0.8) {   // too low: go straight to the landing burn, pad goes where it'll come down
      var ev = Math.max(vh, 0.01), dist2 = Math.min(1500, ev * ev / 50);   // where it can stop sliding sideways
      A.phase = 'coast'; A.pad = pickPad(S.pos.x + S.vx / ev * dist2, S.pos.z + S.vz / ev * dist2);
      A.phase = 'land'; A.t = 0; toast('🔥 EMERGENCY LANDING BURN', '#ff8a2a'); sfx('boost');
    }
  } else if (A.phase === 'coast') {
    // grid fins steer toward the pad while it falls
    var tgo = Math.max(2.5, S.vy < -1 ? (hRem - 300) / -S.vy : 8);      // aim to be lined up before the burn starts
    var dvx = (A.pad.x - S.pos.x) / tgo - S.vx, dvz = (A.pad.z - S.pos.z) / tgo - S.vz;
    var fl = Math.hypot(dvx, dvz), finMax = hRem < 1500 ? 12 : 7;     // the fins bite harder in the thicker air down low
    if (fl > finMax) { dvx *= finMax / fl; dvz *= finMax / fl; }
    ax = dvx; az = dvz;
    want.set(dvx * 0.03, 1, dvz * 0.03).normalize();
    if (!A.entryDone && spd > 230 && hRem > 1200) {          // coming in hot: entry burn
      if (A.entry === 0) { toast('🔥 ENTRY BURN', '#ffb35c'); sfx('boost'); }
      A.entry += dt; thr = 1;
      if (A.entry > 2.6) A.entryDone = true;
    } else if (spd > 200 && Math.random() < 0.7) {           // re-entry glow around the engines
      _p.set(0, -VD.com - 1, 0).applyQuaternion(S.q).add(S.pos);
      spawnP(bigFire, _p.x, _p.y, _p.z, S.vx * 0.9, S.vy * 0.9, S.vz * 0.9, 4, 0.3);
    }
    if (hRem < 700) A.legsGo = true;
    // hoverslam: light the engines at the very last moment
    if (S.vy < 0 && thr === 0) {
      var need = S.vy * S.vy / (2 * Math.max(hRem - 2.5, 0.5));
      if (need > (R_LAND * 0.9 - G) * 0.97 || hRem < 3) {    // keeps ~10% thrust spare for steering onto the pad           // it looks like it's going to crash... then FULL THROTTLE
        A.phase = 'land'; A.t = 0; A.igniteAlt = hRem; A.igniteV = -S.vy;
        toast('🔥 FULL THROTTLE!', '#ff8a2a'); sfx('boost'); sfx('hyperJump'); shakeT = Math.max(shakeT, 0.5);
        _p.set(0, -VD.com - 2, 0).applyQuaternion(S.q).add(S.pos);
        for (var ig = 0; ig < 60; ig++) spawnP(bigFire, _p.x, _p.y, _p.z, (Math.random() - 0.5) * 30, -20 - Math.random() * 20, (Math.random() - 0.5) * 30, 6, 0.6);
      }
    }
  } else if (A.phase === 'land') {
    var vt = -2.0, hEff = Math.max(hRem - 2.5, 0.05);       // brake hard down to 2.5 m, then settle gently onto the pad
    var dxp = A.pad.x - S.pos.x, dzp = A.pad.z - S.pos.z, dp = Math.hypot(dxp, dzp);
    if (A.t > 25) dp = 0;                                     // taking too long: just set it down here
    var vdm = Math.min(120, Math.sqrt(2 * 12 * dp)), vdx = dp > 0.1 ? dxp / dp * vdm : 0, vdz = dp > 0.1 ? dzp / dp * vdm : 0;
    var hover = (dp > 12 || Math.hypot(S.vx - vdx, S.vz - vdz) > 10) && A.t <= 25;
    var needV = S.vy < vt ? (S.vy * S.vy - vt * vt) / (2 * hEff) : 0;
    var av = hRem < 2.5 ? G + (-Math.max(1.2, hRem * 0.8) - S.vy) * 6 : (S.vy < vt ? G + needV : G + (-Math.max(2.2, Math.min(14, hRem * 0.7)) - S.vy) * 1.5);   // sink down if it's moving slower than landing speed
    A.hover = hover;
    if (hover && hRem < 45) av = Math.max(av, G + ((hRem > 20 ? -4 : 1) - S.vy) * 2);   // not lined up yet: hold height and slide over to the pad
    av = Math.max(0, Math.min(R_LAND, av));
    var hx = (vdx - S.vx) * 1.4, hz = (vdz - S.vz) * 1.4;
    var hm = Math.min(hover ? 32 : 18, Math.sqrt(R_LAND * R_LAND - av * av)), hl = Math.hypot(hx, hz);
    if (hl > hm) { hx *= hm / hl; hz *= hm / hl; }
    var am = Math.hypot(hx, av, hz);
    want.set(hx, Math.max(av, 1), hz).normalize();
    turnRate = 6; direct = true; ax = hx; ay = av; az = hz;
    S.rocketThr = Math.max(0.35, Math.min(1.8, am / R_LAND * 1.8));   // huge flames at full throttle
    A.legsGo = true;
  }
  _rq.setFromUnitVectors(UPV, want);
  S.q.slerp(_rq, 1 - Math.exp(-turnRate * dt));
  if (!direct && thr > 0) { up.set(0, 1, 0).applyQuaternion(S.q); ax += up.x * R_AMAX * thr; ay += up.y * R_AMAX * thr; az += up.z * R_AMAX * thr; S.rocketThr = 1.2 * thr; }
  S.engineOn = direct ? ay > 0.5 : thr > 0;
  if (!S.engineOn) S.rocketThr = 0;
  S.roar = S.engineOn ? 0.38 : 0;
  S.vx += ax * dt; S.vy += (ay - G) * dt; S.vz += az * dt;
  S.pos.x += S.vx * dt; S.pos.y += S.vy * dt; S.pos.z += S.vz * dt;
  if (A.pad) {
    hRem = S.pos.y - VD.com - LEG_EXT - rocketGroundRef(A);
    A.camOn = A.phase === 'land' || hRem < 400;
    A.slow = A.phase === 'land' && hRem < 35 && !A.hover && S.vy < -1 && (A.slowT = (A.slowT || 0) + dt) < 2.5;
    var dPad = Math.hypot(S.pos.x - A.pad.x, S.pos.z - A.pad.z);
    up.set(0, 1, 0).applyQuaternion(S.q);
    var hPad = S.pos.y - VD.com - LEG_EXT - A.pad.y;
    if (dPad < 16 && hPad <= 0) {                                 // legs reach 4.6 m out, so this still puts them on the pad
      if (S.vy > -9 && up.y > 0.9 && Math.hypot(S.vx, S.vz) < 15) rocketLanded(dPad); else crash('KABOOM!');
      return;
    }
  }
  var gh = heightAt(S.pos.x, S.pos.z);
  if (S.pos.y - VD.com - (A.legsGo ? LEG_EXT : 0) <= gh) {      // came down off the pad
    up.set(0, 1, 0).applyQuaternion(S.q);
    if (S.vy > -9 && up.y > 0.9 && Math.hypot(S.vx, S.vz) < 15) {
      S.pos.y = gh + VD.com + (A.legsGo ? LEG_EXT : 0); rocketLanded(-1);
    } else crash('KABOOM!');
  }
}
function rocketLanded(d){
  var A = RA;
  S.grounded = true; S.vx = S.vy = S.vz = 0; S.angV.set(0, 0, 0); S.engineOn = false; S.rocketThr = 0; S.roar = 0;
  if (d >= 0) S.pos.y = A.pad.y + VD.com + LEG_EXT;
  groundQuat(S.yaw, AY, 0, S.q);
  A.phase = 'done'; A.doneT = 0; A.slow = false; A.camOn = true;
  shakeT = Math.max(shakeT, 0.9);
  var gy = S.pos.y - VD.com - LEG_EXT;
  for (var i = 0; i < 170; i++) { var a = Math.random() * TAU, sp = 14 + Math.random() * 26; spawnP(smoke, S.pos.x + Math.cos(a) * 3, gy + 1, S.pos.z + Math.sin(a) * 3, Math.cos(a) * sp, 1 + Math.random() * 3, Math.sin(a) * sp, 3, 3.5); }
  for (i = 0; i < 90; i++) { var b = Math.random() * TAU, sb = 10 + Math.random() * 20; spawnP(dust, S.pos.x, gy + 0.5, S.pos.z, Math.cos(b) * sb, 2, Math.sin(b) * sb, 4, 2); }
  sfx('land'); sfx('mission');
  if (d < 0) {
    var lp0 = Math.round(10000 * VD.pts); S.score += lp0;
    popup('LANDED! +' + fmt(lp0), 'missed the pad, but it stuck the landing', '');
    return;
  }
  var bull = d < 1.5, pts = Math.round((30000 + (bull ? 20000 : 0)) * VD.pts);
  S.score += pts;
  popup((bull ? '🎯 BULLSEYE! +' : 'THE ROCKET HAS LANDED! +') + fmt(pts), d.toFixed(1) + ' m from the centre of the pad', '');
  missionEvent('boosterland', 1); if (bull) missionEvent('bullseye', 1);
}
// tracking camera out on the sand, zoomed right in on the rocket
function padCamera(dt){
  var P = RA.pad;
  var cp = _co.set(P.x + P.camDx, P.y + 3.5, P.z + P.camDz);
  var gy = heightAt(cp.x, cp.z) + 1.6; if (cp.y < gy) cp.y = gy;
  var sh = Math.max(0, shakeT) * 0.6 + (S.engineOn ? 0.05 : 0);
  camera.position.set(cp.x + (Math.random() - 0.5) * sh, cp.y + (Math.random() - 0.5) * sh, cp.z);
  camera.up.copy(UPV);
  _cl.set(0, 13 - VD.com, 0).applyQuaternion(S.q).add(S.pos);
  camera.lookAt(_cl);
  camY = camera.position.y;
  var dist = Math.hypot(_cl.x - cp.x, _cl.y - cp.y, _cl.z - cp.z);
  var fov = Math.max(9, Math.min(70, 2 * Math.atan(34 / dist) * 57.3));
  fov = lastFov + (fov - lastFov) * (1 - Math.exp(-6 * dt));
  if (Math.abs(fov - lastFov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }
  flightCamInit = false;
}
// landing pad: concrete slab, painted target, blinking edge lights and a light beam you can see from the sky
var landingPad = (function(){
  var g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(14, 15.5, 8, 48), std(0x8f8b84, 0.95), g, 0, -4, 0);
  var c = canvas(512), x = c.getContext('2d');
  x.fillStyle = '#7f7b74'; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = '#ffd21a'; x.lineWidth = 26; x.beginPath(); x.arc(256, 256, 200, 0, TAU); x.stroke();
  x.strokeStyle = '#f4f4f4'; x.lineWidth = 34; x.beginPath(); x.moveTo(150, 150); x.lineTo(362, 362); x.moveTo(362, 150); x.lineTo(150, 362); x.stroke();
  x.lineWidth = 6; x.beginPath(); x.arc(256, 256, 236, 0, TAU); x.stroke();
  var top = new THREE.Mesh(new THREE.CircleGeometry(13.9, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.9 }));
  top.position.y = 0.03; top.receiveShadow = true; g.add(top);
  g.lightMat = glow(0xff3030, 2.5);
  for (var k = 0; k < 16; k++) { var a = k / 16 * TAU; box(0.5, 0.35, 0.5, g.lightMat, g, Math.cos(a) * 14.3, 0.18, Math.sin(a) * 14.3); }
  g.beamMat = new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.4, 700, 16, 1, true), g.beamMat); beam.position.y = 350; g.add(beam); g.beam = beam;
  g.visible = false; scene.add(g); return g;
})();
var puff = makeParticles(160, 0xffffff, 2.4, 0.8, false, 0);
function updateRocketParts(dt){
  var R = VDEF.rocket.obj;
  if (!R.legs) return;
  if (RA && RA.legsGo && !S.rLegsWant) { S.rLegsWant = true; sfx('wings'); toast('🦿 LANDING LEGS DEPLOYED', '#ffffff'); }
  var finsWant = !!(RA && RA.phase !== 'flip') || (S.rFinsWant && S.grounded);
  if (!RA && !S.grounded && (S.flightT || 0) > 1.5) { S.rLegsWant = false; S.rFinsWant = false; }
  if (RA && RA.phase !== 'flip') S.rFinsWant = true;
  S.rLegs = (S.rLegs || 0) + ((S.rLegsWant ? 1 : 0) - (S.rLegs || 0)) * (1 - Math.exp(-2.2 * dt));
  S.rFins = (S.rFins || 0) + ((finsWant ? 1 : 0) - (S.rFins || 0)) * (1 - Math.exp(-3 * dt));
  var le = S.rLegs * S.rLegs * (3 - 2 * S.rLegs);
  R.legs.forEach(function(l){ l.rotation.z = -(Math.PI - 0.55) * le; });
  R.fins.forEach(function(f){ f.rotation.z = -Math.PI / 2 * S.rFins; });
  if (landingPad.visible) {
    landingPad.lightMat.emissiveIntensity = Math.sin(animT * 6) > 0 ? 3 : 0.3;
    landingPad.beamMat.opacity = (RA && RA.phase !== 'done' ? 0.18 : 0.05) * (0.8 + 0.2 * Math.sin(animT * 3));
  }
}

/* ================= build mode: drop your own ramps, pads, trampolines, barrels and rings ================= */
var BUILD_ITEMS = [
  { id: 'ramp', name: 'RAMP', icon: '📐' },
  { id: 'mega', name: 'MEGA RAMP', icon: '🗻' },
  { id: 'boost', name: 'BOOST PAD', icon: '⚡' },
  { id: 'tramp', name: 'TRAMPOLINE', icon: '🤸' },
  { id: 'barrels', name: 'EXPLODING BARRELS', icon: '🛢️' },
  { id: 'ring', name: 'SKY RING', icon: '⭕' }
];
var buildSel = 0, userObjs = [], userPlaced = 0;
var padArrowTex = (function(){
  var c = canvas(128, 256), x = c.getContext('2d');
  x.fillStyle = '#0a3a4a'; x.fillRect(0, 0, 128, 256);
  x.fillStyle = '#36e0ff';
  for (var k = 0; k < 3; k++) { var y = 30 + k * 75; x.beginPath(); x.moveTo(14, y + 50); x.lineTo(64, y); x.lineTo(114, y + 50); x.lineTo(114, y + 72); x.lineTo(64, y + 22); x.lineTo(14, y + 72); x.closePath(); x.fill(); }
  return new THREE.CanvasTexture(c);
})();
var padMat = new THREE.MeshStandardMaterial({ map: padArrowTex, emissive: 0x36e0ff, emissiveMap: padArrowTex, emissiveIntensity: 1.2, roughness: 0.4 });
var trampFabric = new THREE.MeshStandardMaterial({ color: 0x2b6cff, roughness: 0.6 });
var trampFrame = std(0x1b1b1f, 0.4, 0.6), trampPad = std(0xff6a13, 0.6);
var barrelMat = new THREE.MeshStandardMaterial({ color: 0xd62a1e, roughness: 0.45, metalness: 0.3 });
var barrelBand = std(0xffd21a, 0.5);
function makeUserMesh(o){
  var g = new THREE.Group();
  if (o.type === 'ramp' || o.type === 'mega') {
    var body = shadowed(new THREE.Mesh(rampGeo, woodMat)); body.scale.set(o.W, o.H, o.L); g.add(body);
    var lip = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 0.35), hazardMat)); lip.scale.x = o.W; lip.position.set(0, o.H + 0.04, o.L / 2 - 0.17); g.add(lip);
    [-1, 1].forEach(function(s){ var rl = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 1), woodDark)); rl.scale.z = o.L; rl.position.set(s * o.W / 2, o.H * 0.35, 0); g.add(rl); });
    g.position.set(o.x, o.base, o.z); g.rotation.y = o.a;
  } else if (o.type === 'boost') {
    var pd = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 12), padMat); pd.receiveShadow = true; pd.position.y = 0.05; g.add(pd);
    g.position.set(o.x, o.base, o.z);
    groundQuat(o.a, normalAt(o.x, o.z, _n2), 0, g.quaternion);
  } else if (o.type === 'tramp') {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(4, 0.22, 10, 40), trampPad); ring.rotation.x = Math.PI / 2; ring.position.y = 1.1; ring.castShadow = true; g.add(ring);
    var fab = new THREE.Mesh(new THREE.CircleGeometry(3.85, 40).rotateX(-Math.PI / 2), trampFabric); fab.position.y = 1.0; fab.receiveShadow = true; g.add(fab);
    for (var k = 0; k < 6; k++) { var a = k / 6 * TAU; rod(v(Math.cos(a) * 3.9, 1.1, Math.sin(a) * 3.9), v(Math.cos(a) * 4.1, -0.6, Math.sin(a) * 4.1), 0.07, trampFrame, g, 8); }
    g.position.set(o.x, o.base, o.z); g.fabric = fab;
  } else if (o.type === 'barrels') {
    o.parts = [];
    for (var b = 0; b < 5; b++) {
      var ang = b / 5 * TAU, bg = grp(g, Math.cos(ang) * 1.3, 0, Math.sin(ang) * 1.3);
      mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.2, 18), barrelMat, bg, 0, 0.6, 0);
      mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 18), barrelBand, bg, 0, 0.35, 0);
      mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 18), barrelBand, bg, 0, 0.85, 0);
    }
    g.position.set(o.x, o.base - 0.1, o.z);
  } else if (o.type === 'ring') {
    g.add(new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: 0xff4fd8, emissive: 0xff4fd8, emissiveIntensity: 1.6, transparent: true, opacity: 0.9 })));
    g.add(new THREE.Mesh(ringGlowGeo, ringGlowMat));
    g.position.set(o.x, o.y, o.z); g.rotation.y = o.a;
  }
  scene.add(g); return g;
}
function placeBuildItem(){
  if (VD.flight === 'rocket') { toast('Build mode works with every vehicle except the rocket', '#ffb35c'); return; }
  var it = BUILD_ITEMS[buildSel], hs = Math.hypot(S.vx, S.vz);
  var a = (!S.grounded && hs > 2) ? Math.atan2(S.vx, S.vz) : S.yaw, sa = Math.sin(a), ca = Math.cos(a);
  var o = { type: it.id, a: a, sa: sa, ca: ca, cool: 0 };
  if (it.id === 'ramp' || it.id === 'mega') {
    var mega = it.id === 'mega';
    o.L = mega ? 46 : 16; o.W = mega ? 16 : 9; o.H = mega ? 20 : 5.5;
    var d = o.L / 2 + 14;
    o.x = S.pos.x + sa * d; o.z = S.pos.z + ca * d;
    o.base = baseHeight(o.x - sa * o.L / 2, o.z - ca * o.L / 2);
    userRamps.push(o);
  } else if (it.id === 'ring') {
    o.x = S.pos.x + sa * 35; o.z = S.pos.z + ca * 35; o.y = Math.max(S.pos.y + 4, baseHeight(o.x, o.z) + 14);
  } else {
    o.x = S.pos.x + sa * 16; o.z = S.pos.z + ca * 16; o.base = baseHeight(o.x, o.z);
  }
  o.g = makeUserMesh(o);
  userObjs.push(o);
  if (userObjs.length > 40) removeUserObj(userObjs[0]);
  userPlaced++; sfx('click'); sfx('wings');
  toast(it.icon + ' ' + it.name + ' PLACED', '#d7a8ff');
  missionEvent('build', 1);
}
function removeUserObj(o){
  scene.remove(o.g);
  var i = userObjs.indexOf(o); if (i >= 0) userObjs.splice(i, 1);
  var j = userRamps.indexOf(o); if (j >= 0) userRamps.splice(j, 1);
  buildDirty = true;
}
function clearBuild(){
  while (userObjs.length) removeUserObj(userObjs[0]);
  toast('🧹 CLEARED EVERYTHING YOU BUILT', '#d7a8ff'); sfx('click');
}
function tickUserObjects(dt){
  for (var i = 0; i < userObjs.length; i++) {
    var o = userObjs[i];
    if (o.cool > 0) o.cool -= dt;
    if (o.type === 'tramp') o.g.fabric.position.y += (1.0 - o.g.fabric.position.y) * Math.min(1, dt * 8);
  }
}
function checkUserObjects(){
  for (var i = userObjs.length - 1; i >= 0; i--) {
    var o = userObjs[i];
    var dx = S.pos.x - o.x, dz = S.pos.z - o.z, d2 = dx * dx + dz * dz;
    if (o.type === 'boost') {
      var u = dx * o.sa + dz * o.ca, w = dx * o.ca - dz * o.sa;
      if (Math.abs(u) < 6.5 && Math.abs(w) < 3.5 && S.grounded && o.cool <= 0 && S.pos.y - VD.com < o.base + 1.5) {
        o.cool = 0.8; S.speed = Math.max(S.speed, 0) + 35; S.horiz = S.speed; addBoost(0.25); S.cleanFx = 0.6;
        toast('⚡ BOOST PAD! +125 KM/H', '#36e0ff'); sfx('boost'); missionEvent('boostpad', 1);
      }
    } else if (o.type === 'tramp') {
      if (d2 < 4.3 * 4.3 && S.pos.y - VD.com < o.base + 1.6 && S.pos.y - VD.com > o.base - 1 && (S.grounded || S.vy < -1) && o.cool <= 0 && !VD.flight) {
        o.cool = 0.4;
        var fallV = S.grounded ? 0 : -S.vy;
        if (S.grounded) takeoff();
        S.grounded = false; S.pos.y = o.base + 1.7 + VD.com;
        S.vy = Math.min(60, Math.max(28, fallV * 0.95 + 10));
        addTrick('TRAMPOLINE'); o.g.fabric.position.y = 0.4;
        toast('🤸 BOING!', '#ffe14d'); sfx('boing'); missionEvent('bounce', 1);
      }
    } else if (o.type === 'barrels') {
      var rr = 2.2 + VD.width;
      if (d2 < rr * rr && S.pos.y - VD.com < o.base + 2) {
        explode(o.x, o.base + 1, o.z, 0.8);
        var bp = Math.round(2000 * VD.pts); S.score += bp;
        toast('💥 BARREL BLAST!  +' + fmt(bp), '#ff8a2a'); missionEvent('barrel', 1);
        if (!VD.flight) {
          var dl = Math.sqrt(d2) || 1;
          if (S.grounded) takeoff();
          S.grounded = false; S.vy = Math.max(S.vy, 0) + 24; S.vx += dx / dl * 8; S.vz += dz / dl * 8;
        }
        removeUserObj(o);
      }
    } else if (o.type === 'ring') {
      var dy = S.pos.y - o.y;
      if (d2 + dy * dy < 4.8 * 4.8 && o.cool <= 0) {
        o.cool = 2; var rp = Math.round(2000 * VD.pts); S.score += rp; addBoost(0.4);
        for (var q = 0; q < 30; q++) spawnP(sparkle, o.x, o.y, o.z, 0, 0, 0, 14, 0.8);
        toast('⭕ YOUR RING!  +' + fmt(rp) + ' · BOOST', '#ff4fd8'); sfx('ring');
      }
    }
  }
}
// sandbox switches
var GRAVITY = { moon: ['🌙 Moon', 0.35], normal: ['🌍 Normal', 1], heavy: ['🪐 Heavy', 1.8] };
function applyGravity(){ if (!GRAVITY[prefs.grav]) prefs.grav = 'normal'; G = 17 * GRAVITY[prefs.grav][1]; }
function noCrash(){ return VD.admin || (prefs.god && !VD.flight); }

function inWater(){
  for (var i = 0; i < activeOases.length; i++) {
    var o = activeOases[i];
    if (Math.hypot(S.pos.x - o.x, S.pos.z - o.z) < o.R * 0.9 && S.pos.y - VD.com < o.water + 0.3) return o;
  }
  return null;
}
function splash(n, power){
  for (var i = 0; i < n; i++) spawnP(splashP, S.pos.x, S.pos.y - VD.com + 0.3, S.pos.z, S.vx * 0.2 + (Math.random() - 0.5) * power, power * (0.5 + Math.random()), S.vz * 0.2 + (Math.random() - 0.5) * power, 2, 1.1);
}
function checkCollisions(){
  var i, dx, dy, dz;
  if (userObjs.length) checkUserObjects();
  checkDevils(); checkGates(); landmarkBlock();
  for (i = 0; i < cacList.length; i++) {
    var c = cacList[i], rr = c.r + VD.width;
    dx = S.pos.x - c.x; dz = S.pos.z - c.z;
    if (dx * dx + dz * dz < rr * rr && S.pos.y - VD.com < c.y + c.h) {
      var hs = S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vz);
      if (noCrash() || ((VD.key === 'monster' || VD.flight) && !c.rock)) {   // monster trucks & aircraft flatten cacti; the admin bike smashes anything
        c.mesh.visible = false; cacList.splice(i, 1);
        var cp = Math.round((c.rock ? 1000 : 500) * VD.pts); S.score += cp; addBoost(0.05);
        for (var g2 = 0; g2 < (c.rock ? 60 : 25); g2++) spawnP(dust, c.x, c.y + 1.5 + Math.random() * c.h * 0.6, c.z, 0, 3, 0, c.rock ? 16 : 8, 1.4);
        toast((c.rock ? '🪨 ROCK SMASH! +' : '🌵 CACTUS CRUSHER! +') + fmt(cp), '#7dff6a'); sfx('crash');
        break;
      }
      if (hs > 4) {
        if (S.grounded) { S.vx = Math.sin(S.yaw) * S.speed * 0.4; S.vz = Math.cos(S.yaw) * S.speed * 0.4; }
        else { S.vx *= 0.4; S.vz *= 0.4; }
        S.vy = 4; crash(c.rock ? 'ROCK!' : 'CACTUS!');
      } else {
        var dl = Math.sqrt(dx * dx + dz * dz) || 1;
        S.pos.x = c.x + dx / dl * rr; S.pos.z = c.z + dz / dl * rr; S.speed *= 0.5;
      }
      break;
    }
  }
  // stone arches: crash into the rock, or thread the gap for a bonus
  for (i = 0; i < activeArches.length; i++) {
    var A = activeArches[i];
    dx = S.pos.x - A.x; dz = S.pos.z - A.z;
    var reach = A.Sx + A.T + 25;
    if (dx * dx + dz * dz > reach * reach) { A.lastW = null; continue; }
    var u = dx * A.ca - dz * A.sa, w = dx * A.sa + dz * A.ca, yv = S.pos.y - VD.com + 0.9 - A.base;
    var So = A.Sx + A.T, Ho = A.Hh + A.T;
    var eo = u * u / (So * So) + yv * yv / (Ho * Ho), ei = u * u / (A.Sx * A.Sx) + yv * yv / (A.Hh * A.Hh);
    var halfW = A.W / 2 + Math.min(VD.width, 2) * 0.5;
    if (Math.abs(w) < halfW && eo < 1 && ei > 1 && !noCrash()) {
      var ahs = S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vz);
      if (ahs > 4) { S.vx *= -0.3; S.vz *= -0.3; S.vy = 3; crash('ROCK!'); return; }
      var push = (w < 0 ? -halfW : halfW) - w; S.pos.x += A.sa * push; S.pos.z += A.ca * push; S.speed *= 0.5;
    }
    if (A.lastW != null && (A.lastW < 0) !== (w < 0) && ei < 1 && yv > -1) {
      if (VD.flight) flightTrick('ARCH THREAD', 3000);
      else if (!S.grounded && !hyperActive()) addTrick('ARCH THREAD');
      else { var ap = Math.round(3000 * VD.pts); S.score += ap; toast('🪨 THREADED THE ARCH!  +' + fmt(ap), '#ffe14d'); sfx('trick'); }
      missionEvent('arch', 1);
    }
    A.lastW = w;
  }
  var cr = VD.admin ? 22 : 1.6 + VD.width, cy = S.pos.y - VD.com * 0.4;   // admin bike has a coin magnet
  for (i = activeCoins.length - 1; i >= 0; i--) {
    var co = activeCoins[i]; dx = S.pos.x - co.x; dy = cy - co.y; dz = S.pos.z - co.z;
    if (dx * dx + dy * dy + dz * dz < cr * cr) {
      collected.add(co.id); co.m.visible = false; activeCoins.splice(i, 1);
      S.score += Math.round(250 * VD.pts); S.runCoins++; progress.coins++; addBoost(0.03);
      for (var k = 0; k < 8; k++) spawnP(sparkle, co.x, co.y, co.z, 0, 2, 0, 6, 0.6);
      sfx('coin'); missionEvent('coin', 1);
    }
  }
  for (i = activeRings.length - 1; i >= 0; i--) {
    var rg = activeRings[i]; dx = S.pos.x - rg.x; dy = S.pos.y - rg.y; dz = S.pos.z - rg.z;
    var rr2 = VD.admin ? 26 : 4.6;
    if (dx * dx + dy * dy + dz * dz < rr2 * rr2) {
      collected.add(rg.id); rg.m.visible = false; activeRings.splice(i, 1);
      var pts = Math.round(5000 * VD.pts); S.score += pts; addBoost(0.4);
      for (var q = 0; q < 40; q++) spawnP(sparkle, rg.x, rg.y, rg.z, 0, 0, 0, 16, 0.8);
      toast('RING! +' + fmt(pts) + '  ·  BOOST REFILL', '#36e0ff');
      sfx('ring'); missionEvent('ring', 1);
    }
  }
}

/* ================= variety: biomes, landmarks, dust devils, challenges ================= */
var curBiome = 0, biomeT = 0, frenzy = { t: 0 };
progress.found = progress.found || {}; progress.biomes = progress.biomes || {};
var farBase = [0.847, 0.706, 0.494];
function updateBiome(dt){
  biomeT -= dt; if (biomeT > 0) return; biomeT = 0.5;
  var bi = biomeAt(S.pos.x, S.pos.z);
  if (bi === curBiome) return;
  curBiome = bi;
  var B = BIOMES[bi], k = bi === 0 ? farBase : [B.col[0] * 0.94, B.col[1] * 0.94, B.col[2] * 0.94];
  if (farGround.material.color && farGround.material.color.setRGB) farGround.material.color.setRGB(k[0], k[1], k[2]);
  var first = !progress.biomes[B.id] && bi !== 0, bonus = first ? Math.round(10000 * VD.pts) : 0;
  if (first) { progress.biomes[B.id] = 1; S.score += bonus; save('duneRider.progress', progress); }
  popup(B.icon + ' ' + B.name, B.sub + (first ? '<br>NEW BIOME DISCOVERED  +' + fmt(bonus) : ''), '');
  if (bi !== 0) { missionEvent('biome', 1); sfx('ring'); }
}

/* ---------- landmarks: rare one-off sights to discover ---------- */
var LM_CELL = 1400, lmCache = new Map(), lmActive = new Map();
var LM_TYPES = [
  { id: 'ufo', name: 'CRASHED UFO', icon: '🛸', R: 12, core: 9, pts: 25000 },
  { id: 'ship', name: 'PIRATE SHIPWRECK', icon: '🏴‍☠️', R: 15, core: 6, pts: 25000 },
  { id: 'skel', name: 'GIANT SKELETON', icon: '💀', R: 18, core: 4, pts: 25000 },
  { id: 'temple', name: 'LOST TEMPLE', icon: '🏛️', R: 18, core: 14, pts: 30000 },
  { id: 'head', name: 'STONE HEAD', icon: '🗿', R: 8, core: 5.5, pts: 25000 },
  { id: 'plane', name: 'PLANE WRECK', icon: '✈️', R: 15, core: 3, pts: 25000 }
];
function lmAt(i, j){
  var key = i + ',' + j, L = lmCache.get(key);
  if (L !== undefined) return L;
  L = null;
  var x, z, ty;
  if (i === 0 && j === 0) { x = 70; z = 430; ty = 0; }         // one close to the start so everyone finds the first
  else if (hash(i * 2.7 - 5.1, j * 3.9 + 0.7) > 0.4) {
    x = (i + 0.2 + hash(i + 0.4, j - 6.6) * 0.6) * LM_CELL; z = (j + 0.2 + hash(i - 3.1, j + 4.8) * 0.6) * LM_CELL;
    ty = Math.floor(hash(i + 7.7, j + 1.9) * LM_TYPES.length) % LM_TYPES.length;
  }
  if (x != null) {
    var T = LM_TYPES[ty], p = pyrAt(Math.floor(x / PYR_CELL), Math.floor(z / PYR_CELL));
    var clash = (p && Math.max(Math.abs(x - p.x), Math.abs(z - p.z)) < p.B + T.R + 30) || nearOasis(x, z, T.R + 20);
    if (!clash) {
      var r = T.R * 0.6, y = Math.min(baseHeight(x, z), baseHeight(x + r, z), baseHeight(x - r, z), baseHeight(x, z + r), baseHeight(x, z - r));
      L = { key: key, x: x, z: z, y: y, T: T, rot: hash(i - 2.2, j + 9.1) * TAU };
    }
  }
  lmCache.set(key, L); return L;
}
var lmMat = {
  metal: new THREE.MeshStandardMaterial({ color: 0xb8c2cc, metalness: 0.7, roughness: 0.35 }),
  metalDark: new THREE.MeshStandardMaterial({ color: 0x5c6670, metalness: 0.6, roughness: 0.45 }),
  glow: new THREE.MeshBasicMaterial({ color: 0x7dff6a }),
  glass: new THREE.MeshStandardMaterial({ color: 0x6fe6ff, transparent: true, opacity: 0.55, roughness: 0.1 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x4a2e17, roughness: 0.9 }),
  sail: new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1, side: THREE.DoubleSide }),
  flag: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1, side: THREE.DoubleSide }),
  bone: new THREE.MeshStandardMaterial({ color: 0xefe6cf, roughness: 0.8 }),
  dark: new THREE.MeshBasicMaterial({ color: 0x1a1210 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xd2b48a, roughness: 0.95, flatShading: true }),
  grey: new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.95, flatShading: true }),
  hull: new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 0.5, roughness: 0.5 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.6 })
};
function lmPart(g, geo, mat, x, y, z, rx, ry, rz){
  var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
var LM_BUILD = {
  ufo: function(g){
    var d = lmPart(g, new THREE.SphereGeometry(10, 32, 16), lmMat.metal, 0, 1.6, 0); d.scale.set(1, 0.22, 1);
    lmPart(g, new THREE.TorusGeometry(10, 0.55, 8, 48), lmMat.metalDark, 0, 1.6, 0, Math.PI / 2);
    lmPart(g, new THREE.SphereGeometry(4, 24, 12, 0, TAU, 0, Math.PI / 2), lmMat.glass, 0, 3.4, 0);
    var lg = new THREE.SphereGeometry(0.45, 8, 6);
    for (var i = 0; i < 12; i++) { var a = i / 12 * TAU; lmPart(g, lg, lmMat.glow, Math.cos(a) * 9.2, 1.9, Math.sin(a) * 9.2); }
    g.rotation.z = 0.32; g.position.y = -1.2;
  },
  ship: function(g){
    lmPart(g, new THREE.CylinderGeometry(5, 3.6, 26, 18, 1, true, -Math.PI / 2, Math.PI), lmMat.wood, 0, 0, 0, Math.PI / 2);
    lmPart(g, new THREE.BoxGeometry(9, 0.4, 25), lmMat.woodDark, 0, -0.2, 0);
    lmPart(g, new THREE.BoxGeometry(8, 3, 5), lmMat.wood, 0, 1.3, -10);
    var mast = new THREE.CylinderGeometry(0.35, 0.45, 18, 10);
    lmPart(g, mast, lmMat.woodDark, 0, 9, 4); lmPart(g, mast, lmMat.woodDark, 0, 8, -5, 0.15);
    var s1 = lmPart(g, new THREE.PlaneGeometry(9, 7), lmMat.sail, 0, 11, 4, 0, 0.3); s1.castShadow = true;
    lmPart(g, new THREE.PlaneGeometry(7, 5), lmMat.sail, 0.3, 9.5, -5.2, 0.1, -0.4);
    lmPart(g, new THREE.PlaneGeometry(2.6, 1.6), lmMat.flag, 1.3, 17.6, 4);
    g.rotation.z = 0.24; g.position.y = 1.2;
  },
  skel: function(g){
    lmPart(g, new THREE.CylinderGeometry(0.8, 0.6, 34, 10), lmMat.bone, 0, 0.6, 0, Math.PI / 2);
    for (var i = 0; i < 9; i++) {
      var rr = 5.5 - Math.abs(i - 3) * 0.55;
      lmPart(g, new THREE.TorusGeometry(rr, 0.5, 6, 20, Math.PI), lmMat.bone, 0, 0, 8 - i * 2.4, 0, 0, (i % 2 ? 0.08 : -0.08));
    }
    var sk = lmPart(g, new THREE.SphereGeometry(4.2, 18, 12), lmMat.bone, 0, 2.6, 21); sk.scale.set(1, 0.85, 1.25);
    var eye = new THREE.SphereGeometry(1.15, 10, 8);
    lmPart(g, eye, lmMat.dark, 1.7, 3.5, 25); lmPart(g, eye, lmMat.dark, -1.7, 3.5, 25);
    lmPart(g, new THREE.BoxGeometry(5, 1, 4), lmMat.bone, 0, 0.3, 24.5, 0.25);
    var horn = new THREE.ConeGeometry(0.8, 6, 8);
    lmPart(g, horn, lmMat.bone, 3.2, 5.5, 19.5, -0.5, 0, -0.7); lmPart(g, horn, lmMat.bone, -3.2, 5.5, 19.5, -0.5, 0, 0.7);
    var tail = new THREE.SphereGeometry(0.7, 8, 6);
    for (var t = 0; t < 8; t++) lmPart(g, tail, lmMat.bone, Math.sin(t * 0.6) * 2, 0.4, -18 - t * 1.6);
    g.position.y = -0.6;
  },
  temple: function(g){
    lmPart(g, new THREE.BoxGeometry(36, 2, 28), lmMat.stone, 0, 1, 0);
    lmPart(g, new THREE.BoxGeometry(32, 2, 24), lmMat.stone, 0, 3, 0);
    lmPart(g, new THREE.BoxGeometry(28, 2, 20), lmMat.stone, 0, 5, 0);
    var col = new THREE.CylinderGeometry(1, 1.15, 12, 12), colS = new THREE.CylinderGeometry(1, 1.15, 5, 12);
    for (var i = 0; i < 6; i++) for (var s = -1; s <= 1; s += 2) {
      var broken = (i === 1 && s === 1) || (i === 4 && s === -1);
      lmPart(g, broken ? colS : col, lmMat.stone, -11 + i * 4.4, broken ? 8.5 : 12, s * 8);
    }
    lmPart(g, new THREE.BoxGeometry(28, 1.8, 19), lmMat.stone, 0, 18.9, 0, 0, 0, 0.04);
    lmPart(g, new THREE.BoxGeometry(24, 1.6, 15), lmMat.stone, 0, 20.5, 0, 0, 0, 0.04);
    lmPart(g, new THREE.BoxGeometry(3, 1.4, 3), lmMat.stone, 13, 7, 12, 0.3, 0.5, 0.2);
    g.position.y = -1.5;
  },
  head: function(g){
    lmPart(g, new THREE.BoxGeometry(6, 10, 5), lmMat.grey, 0, 5, 0);
    lmPart(g, new THREE.BoxGeometry(6.6, 1.5, 1.8), lmMat.grey, 0, 7.6, 2.4);
    lmPart(g, new THREE.BoxGeometry(1.6, 4.2, 1.9), lmMat.grey, 0, 5.1, 3);
    lmPart(g, new THREE.BoxGeometry(3.6, 0.8, 1.2), lmMat.grey, 0, 2.6, 2.6);
    lmPart(g, new THREE.BoxGeometry(4.4, 1.6, 1.4), lmMat.grey, 0, 1.2, 2.2);
    var ear = new THREE.BoxGeometry(0.8, 4.4, 1.4);
    lmPart(g, ear, lmMat.grey, 3.3, 5.5, 0.4); lmPart(g, ear, lmMat.grey, -3.3, 5.5, 0.4);
    lmPart(g, new THREE.BoxGeometry(6.4, 2.6, 5.4), lmMat.red, 0, 11.2, -0.2);   // a red stone topknot
    g.scale.setScalar(1.7); g.rotation.x = -0.08; g.position.y = -2.5;
  },
  plane: function(g){
    lmPart(g, new THREE.CylinderGeometry(2, 1.6, 22, 16), lmMat.hull, 0, 0, 0, Math.PI / 2);
    lmPart(g, new THREE.CylinderGeometry(2.05, 2.05, 1.2, 16), lmMat.red, 0, 0, 4, Math.PI / 2);
    lmPart(g, new THREE.SphereGeometry(2, 16, 10), lmMat.hull, 0, 0, 11);
    lmPart(g, new THREE.BoxGeometry(13, 0.5, 4.5), lmMat.hull, 7.5, -0.6, 1.5, 0, 0, -0.06);
    lmPart(g, new THREE.BoxGeometry(8, 0.5, 4.5), lmMat.hull, -6.5, -2.0, 1.5, 0, 0.2, 0.42);    // the broken wing
    lmPart(g, new THREE.BoxGeometry(0.4, 5, 4), lmMat.red, 0, 3, -10);
    lmPart(g, new THREE.BoxGeometry(9, 0.4, 3), lmMat.hull, 0, 1, -10);
    var prop = new THREE.BoxGeometry(0.3, 5.5, 0.6);
    lmPart(g, prop, lmMat.metalDark, 0, 0, 12.4, 0, 0, 0.5); lmPart(g, prop, lmMat.metalDark, 0, 0, 12.4, 0, 0, 2.07);
    g.rotation.x = 0.14; g.rotation.z = 0.1; g.position.y = 0.6;
  }
};
function buildLandmark(L){
  var root = new THREE.Group(), g = new THREE.Group();
  LM_BUILD[L.T.id](g); root.add(g);
  root.position.set(L.x, L.y, L.z); root.rotation.y = L.rot;
  scene.add(root); return root;
}
var lmScanT = 0, lmNearest = null;
function updateLandmarks(dt){
  lmScanT -= dt;
  if (lmScanT <= 0) {
    lmScanT = 0.5;
    var ci = Math.floor(S.pos.x / LM_CELL), cj = Math.floor(S.pos.z / LM_CELL), seen = {}, best = 1e18;
    lmNearest = null;
    for (var i = ci - 3; i <= ci + 3; i++) for (var j = cj - 3; j <= cj + 3; j++) {
      var L = lmAt(i, j); if (!L) continue;
      var d2 = (L.x - S.pos.x) * (L.x - S.pos.x) + (L.z - S.pos.z) * (L.z - S.pos.z);
      if (!progress.found[L.key] && d2 < best) { best = d2; lmNearest = L; }
      if (d2 < 1150 * 1150) { seen[L.key] = 1; if (!lmActive.has(L.key)) lmActive.set(L.key, { L: L, g: buildLandmark(L) }); }
    }
    lmActive.forEach(function(a, k){ if (!seen[k]) { scene.remove(a.g); lmActive.delete(k); } });
  }
  lmActive.forEach(function(a){
    var L = a.L, dx = S.pos.x - L.x, dz = S.pos.z - L.z, d = Math.sqrt(dx * dx + dz * dz);
    if (!progress.found[L.key] && d < L.T.R + 30 && !S.crashed) discoverLandmark(L);
    if (L.T.id === 'ufo') { var gl = a.g.children[0]; gl.rotation.y += dt * 0.4; }
  });
}
function discoverLandmark(L){
  progress.found[L.key] = 1;
  var n = Object.keys(progress.found).length, pts = Math.round(L.T.pts * VD.pts);
  S.score += pts; addXP(150); save('duneRider.progress', progress);
  popup(L.T.icon + ' DISCOVERED!', L.T.name + '  +' + fmt(pts) + '<br>Landmarks found: ' + n, '');
  for (var q = 0; q < 50; q++) spawnP(sparkle, L.x, L.y + 8, L.z, 0, 6, 0, 22, 1.2);
  sfx('mission'); missionEvent('landmark', 1);
}
function landmarkBlock(){        // soft collision so you don't drive through them
  if (!S.grounded || VD.flight === 'rocket') return;
  lmActive.forEach(function(a){
    var L = a.L, dx = S.pos.x - L.x, dz = S.pos.z - L.z, d = Math.sqrt(dx * dx + dz * dz), c = L.T.core + VD.width * 0.5;
    if (d < c && d > 0.01) { S.pos.x = L.x + dx / d * c; S.pos.z = L.z + dz / d * c; S.speed *= 0.6; shakeT = Math.max(shakeT, 0.25); }
  });
}

/* ---------- dust devils: wandering sand tornadoes that throw you skywards ---------- */
var devils = [], devilT = 8;
function makeDevil(){
  var mat = new THREE.MeshBasicMaterial({ color: 0xd6ad78, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  var g = new THREE.Group(), layers = [];
  for (var i = 0; i < 8; i++) {
    var rb = 1.6 + i * 1.3, rt = 1.6 + (i + 1) * 1.3;
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, 6.5, 18, 1, true), mat);
    m.position.y = i * 6 + 3.2; g.add(m); layers.push(m);
  }
  g.visible = false; scene.add(g);
  return { g: g, layers: layers, mat: mat, on: false, x: 0, z: 0, y: 0, a: 0, life: 0, max: 40, hit: 0 };
}
for (var dv = 0; dv < 3; dv++) devils.push(makeDevil());
function spawnDevil(hs){
  var D = null; for (var i = 0; i < devils.length; i++) if (!devils[i].on) { D = devils[i]; break; }
  if (!D) return;
  var hd = hs > 2 ? Math.atan2(S.grounded ? Math.sin(S.yaw) : S.vx, S.grounded ? Math.cos(S.yaw) : S.vz) : S.yaw;
  var dist = 200 + Math.random() * 220, lat = (Math.random() - 0.5) * 260;
  D.x = S.pos.x + Math.sin(hd) * dist + Math.cos(hd) * lat; D.z = S.pos.z + Math.cos(hd) * dist - Math.sin(hd) * lat;
  D.a = Math.random() * TAU; D.life = 0; D.max = 35 + Math.random() * 20; D.hit = 0; D.on = true; D.g.visible = true;
}
function updateDevils(dt, hs){
  devilT -= dt;
  if (devilT <= 0) {
    devilT = (curBiome === 3 ? 4 : 8) + Math.random() * 8;
    if (hs < 220 && !hyperActive() && VD.flight !== 'rocket') spawnDevil(hs);
  }
  for (var i = 0; i < devils.length; i++) {
    var D = devils[i]; if (!D.on) continue;
    D.life += dt; if (D.hit > 0) D.hit -= dt;
    var dx = S.pos.x - D.x, dz = S.pos.z - D.z, dist = Math.sqrt(dx * dx + dz * dz);
    if (D.life > D.max || dist > 1300) { D.on = false; D.g.visible = false; continue; }
    D.a += (Math.random() - 0.5) * 1.5 * dt;
    var sp = 7, vx = Math.sin(D.a) * sp, vz = Math.cos(D.a) * sp;
    if (dist < 320 && dist > 1) { vx += dx / dist * 4; vz += dz / dist * 4; }      // they drift towards you
    D.x += vx * dt; D.z += vz * dt; D.y = baseHeight(D.x, D.z);
    var fade = Math.max(0, Math.min(1, D.life / 3, (D.max - D.life) / 3));
    D.mat.opacity = 0.3 * fade;
    D.g.position.set(D.x, D.y - 1, D.z); D.g.scale.set(1, 0.6 + 0.4 * fade, 1);
    for (var k = 0; k < D.layers.length; k++) {
      var L = D.layers[k]; L.rotation.y += (5 - k * 0.35) * dt;
      L.position.x = Math.sin(animT * 1.3 + k * 0.7) * k * 0.45; L.position.z = Math.cos(animT * 1.1 + k * 0.5) * k * 0.3;
    }
    if (dist < 450 && fade > 0.3) {
      for (var p = 0; p < 2; p++) {
        var pa = Math.random() * TAU, pr = 2 + Math.random() * 5;
        spawnP(dust, D.x + Math.cos(pa) * pr, D.y + 0.5 + Math.random() * 10, D.z + Math.sin(pa) * pr, -Math.sin(pa) * 14, 7 + Math.random() * 6, Math.cos(pa) * 14, 2, 1.6);
      }
    }
  }
}
function checkDevils(){
  if (S.crashed || hyperActive()) return;
  for (var i = 0; i < devils.length; i++) {
    var D = devils[i]; if (!D.on || D.hit > 0 || D.life < 2) continue;
    var dx = S.pos.x - D.x, dz = S.pos.z - D.z, up = S.pos.y - D.y;
    if (dx * dx + dz * dz > 10 * 10 || up > 55 || up < -3) continue;
    D.hit = 4;
    shakeT = Math.max(shakeT, 0.6); sfx('boost'); missionEvent('devil', 1);
    for (var q = 0; q < 30; q++) spawnP(dust, S.pos.x, S.pos.y, S.pos.z, 0, 8, 0, 14, 1.5);
    if (VD.flight) {
      S.vy = Math.max(S.vy, 0) + 22;
      if (!S.grounded) flightTrick('TORNADO SURF', 2500);
    } else {
      if (S.grounded) { takeoff(); S.pos.y += 0.6; }
      S.vy = Math.max(S.vy, 0) + 30;
      S.angV.y += 5;
      addTrick('DUST DEVIL');
      toast('🌪️ DUST DEVIL! HOLD ON!', '#ffd27a');
    }
  }
}

/* ---------- random challenges ---------- */
var notFlight = function(){ return !VD.flight; };
var CHALS = [
  { id: 'flip', text: 'Land a flip', time: 25, ok: notFlight, ev: 'trick', test: function(v){ return v === 'BACKFLIP' || v === 'FRONTFLIP'; }, pts: 15000 },
  { id: 'spin', text: 'Land a 360 spin', time: 25, ok: notFlight, ev: 'trick', test: function(v){ return v === '360 SPIN'; }, pts: 15000 },
  { id: 'roll', text: 'Land a barrel roll', time: 25, ok: notFlight, ev: 'trick', test: function(v){ return v === 'BARREL ROLL'; }, pts: 15000 },
  { id: 'combo', text: 'Land a x3 combo', time: 35, ok: notFlight, ev: 'combo', min: 3, pts: 25000 },
  { id: 'air', text: 'Get 4 s of airtime in one jump', time: 30, ok: notFlight, ev: 'air', min: 4, pts: 15000 },
  { id: 'clean', text: 'Land 2 CLEAN LANDINGS in a row', time: 40, ok: notFlight, ev: 'clean', min: 2, pts: 20000 },
  { id: 'wheelie', text: 'Hold a 3 s wheelie (S)', time: 30, ok: function(){ return !VD.flight && VD.wheelieA !== 0; }, ev: 'wheelie', min: 3, pts: 15000 },
  { id: 'coins', text: 'Grab 6 coins', time: 40, ok: function(){ return activeCoins.length >= 10; }, ev: 'coin', need: 6, pts: 15000 },
  { id: 'speed', text: '', time: 20, ev: 'speed', pts: 15000 },
  { id: 'score', text: '', time: 30, ev: null, pts: 20000 },
  { id: 'height', text: 'Get 60 m above the ground', time: 30, ok: function(){ return VD.flight || VD.thrust || VD.wings; }, ev: 'height', min: 60, pts: 15000 },
  { id: 'gates', text: 'Race through 5 gates', time: 0, ok: function(){ return VD.flight !== 'rocket'; }, ev: null, need: 5, pts: 30000 },
  { id: 'jroll', text: 'Do a barrel roll', time: 25, ok: function(){ return VD.flight === 'jet' || VD.flight === 'heli'; }, ev: 'trick', test: function(v){ return v === 'BARREL ROLL'; }, pts: 15000 },
  { id: 'hflip', text: 'Flip the helicopter (↑/↓)', time: 30, ok: function(){ return VD.flight === 'heli'; }, ev: 'heliflip', need: 1, pts: 20000 },
  { id: 'devil', text: 'Ride the dust devil 🌪️', time: 40, ok: function(){ return devils.some(function(D){ return D.on && D.life < D.max - 25 && Math.hypot(D.x - S.pos.x, D.z - S.pos.z) < 450; }); }, ev: 'devil', need: 1, pts: 20000 },
  { id: 'arch', text: 'Thread a stone arch', time: 45, ok: function(){ return activeArches.length > 0; }, ev: 'arch', need: 1, pts: 20000 },
  { id: 'land', text: 'Score 30,000 in ONE landing', time: 40, ok: notFlight, ev: 'landScore', min: 30000, pts: 20000 }
];
var chal = { cur: null, t: 0, max: 1, next: 18, streak: 0, prog: 0, need: 1, min: 0, text: '', last: null, score0: 0, gate: null, done: 0 };
var chalEl, chalText, chalFill, chalSub, chalDirty = true;
function startChallenge(){
  var opts = CHALS.filter(function(c){ return c.id !== chal.last && (!c.ok || c.ok()); });
  if (!opts.length) { chal.next = 10; return; }
  var c = opts[Math.floor(Math.random() * opts.length)];
  chal.cur = c; chal.last = c.id; chal.prog = 0; chal.need = c.need || 1; chal.min = c.min; chal.text = c.text; chal.t = c.time;
  if (c.id === 'speed') {
    var now = Math.abs(S.grounded ? S.speed : Math.hypot(S.vx, S.vy, S.vz)) * 3.6;
    chal.min = Math.max(150, Math.ceil((now * 1.3 + 60) / 10) * 10);
    chal.text = 'Hit ' + fmt(chal.min) + ' km/h';
  }
  if (c.id === 'score') { chal.min = Math.round(40000 * VD.pts); chal.score0 = S.score; chal.text = 'Score ' + fmt(chal.min) + ' points'; }
  if (c.id === 'gates') { chal.t = 0; spawnGate(); }
  chal.max = chal.t; chalDirty = true;
  toast('⚡ CHALLENGE: ' + chal.text.toUpperCase(), '#ff9a3c'); sfx('ring');
}
function challengeEvent(ev, val){
  var c = chal.cur; if (!c || c.ev !== ev) return;
  if (c.test) { if (c.test(val)) chal.prog++; else return; }
  else if (chal.min != null) { if (val >= chal.min) chal.prog = chal.need; else return; }
  else chal.prog += val || 1;
  chalDirty = true;
  if (chal.prog >= chal.need) finishChallenge(true);
}
function finishChallenge(ok){
  if (chal.gate) { chal.gate.g.visible = false; chal.gate.on = false; }
  if (ok) {
    var mul = 1 + 0.5 * chal.streak, pts = Math.round(chal.cur.pts * mul);
    S.score += pts; chal.streak++; chal.done++; addXP(60);
    popup('⚡ CHALLENGE COMPLETE! +' + fmt(pts), chal.text + (chal.streak > 1 ? '  ·  STREAK x' + chal.streak : ''), '');
    sfx('mission'); missionEvent('challenge', 1);
    if (chal.streak % 3 === 0) {
      frenzy.t = 20;
      setTimeout(function(){ toast('🔥 FRENZY!  x2 LANDING POINTS FOR 20 s', '#ff6a2a'); sfx('level'); }, 1400);
    }
  } else {
    toast('⌛ CHALLENGE FAILED' + (chal.streak > 1 ? '  ·  STREAK LOST' : ''), '#ff6a5a');
    chal.streak = 0;
  }
  chal.cur = null; chal.next = 22 + Math.random() * 20; chalDirty = true;
}
function updateChallenges(dt){
  if (frenzy.t > 0) { frenzy.t -= dt; chalDirty = true; }
  if (attack.active && !chal.cur) { /* still allowed during score attack */ }
  if (!chal.cur) {
    if (!S.crashed) chal.next -= dt;
    if (chal.next <= 0) startChallenge();
  } else {
    chal.t -= dt; chalDirty = true;
    if (chal.cur.id === 'score' && S.score - chal.score0 >= chal.min) finishChallenge(true);
    else if (chal.t <= 0) finishChallenge(false);
  }
  if (chalDirty) drawChallenge();
}
function drawChallenge(){
  chalDirty = false;
  if (!chalEl) { chalEl = $('chal'); chalText = $('chalT'); chalFill = $('chalB'); chalSub = $('chalS'); }
  if (!chal.cur && frenzy.t <= 0) { chalEl.style.display = 'none'; return; }
  chalEl.style.display = 'block';
  var sub = [];
  if (chal.cur) {
    var prog = chal.cur.id === 'score' ? fmt(Math.max(0, S.score - chal.score0)) + ' / ' + fmt(chal.min) : (chal.need > 1 ? chal.prog + ' / ' + chal.need : '');
    chalText.textContent = '⚡ ' + chal.text + (prog ? '  (' + prog + ')' : '');
    chalFill.style.width = Math.max(0, Math.min(100, chal.t / chal.max * 100)).toFixed(1) + '%';
    chalFill.style.background = chal.t < 6 ? '#ff5a4a' : '#ff9a3c';
    sub.push(Math.max(0, chal.t).toFixed(1) + ' s');
  } else { chalText.textContent = ''; chalFill.style.width = '0%'; }
  if (chal.streak > 0) sub.push('STREAK x' + chal.streak);
  if (frenzy.t > 0) sub.push('🔥 FRENZY x2 · ' + Math.ceil(frenzy.t) + ' s');
  chalSub.textContent = sub.join('   ');
}

/* gate race */
var gateMat = new THREE.MeshBasicMaterial({ color: 0xff8a2a });
var gateBeamMat = new THREE.MeshBasicMaterial({ color: 0xffb04a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide });
var gateObj = (function(){
  var g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.TorusGeometry(8, 0.7, 10, 40), gateMat));
  var beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 140, 8, 1, true), gateBeamMat); beam.position.y = 78; g.add(beam);
  g.visible = false; scene.add(g);
  return { g: g, on: false, x: 0, y: 0, z: 0 };
})();
function spawnGate(){
  var G0 = gateObj, hs = Math.abs(S.grounded ? S.speed : Math.hypot(S.vx, S.vz));
  var hd = (!S.grounded && Math.hypot(S.vx, S.vz) > 2) ? Math.atan2(S.vx, S.vz) : S.yaw;
  var dist = Math.max(70, Math.min(420, hs * 5)), a = hd + (Math.random() - 0.5) * 0.9;
  G0.x = S.pos.x + Math.sin(a) * dist; G0.z = S.pos.z + Math.cos(a) * dist;
  var gy = heightAt(G0.x, G0.z), flying = VD.flight && !S.grounded;
  G0.y = flying ? Math.max(gy + 9, Math.min(gy + 300, S.pos.y)) : gy + 5;
  G0.g.position.set(G0.x, G0.y, G0.z); G0.g.rotation.y = a; G0.g.visible = true; G0.on = true;
  chal.gate = G0;
  chal.t = Math.max(chal.t, dist / Math.max(8, hs) * 2.2 + 6); chal.max = Math.max(chal.max, chal.t);
}
function checkGates(){
  var G0 = gateObj; if (!G0.on || !chal.cur || chal.cur.id !== 'gates') return;
  var dx = S.pos.x - G0.x, dy = S.pos.y - G0.y, dz = S.pos.z - G0.z, r = VD.flight ? 10 : 8.5;
  if (dx * dx + dy * dy + dz * dz < r * r) {
    chal.prog++; chalDirty = true; S.score += Math.round(1000 * VD.pts);
    for (var q = 0; q < 30; q++) spawnP(sparkle, G0.x, G0.y, G0.z, 0, 0, 0, 14, 0.7);
    sfx('coin');
    if (chal.prog >= chal.need) finishChallenge(true);
    else { toast('GATE ' + chal.prog + ' / ' + chal.need, '#ff9a3c'); spawnGate(); }
  }
}

/* ---------- minimap extras + compass ---------- */
var compassEl = null, compassTxt = '';
function drawVarietyMap(px, C){
  lmActive.forEach(function(a){
    var p = px(a.L.x, a.L.z); if (Math.hypot(p[0] - C, p[1] - C) > C - 10) return;
    mm.font = '22px sans-serif'; mm.textAlign = 'center'; mm.textBaseline = 'middle';
    mm.globalAlpha = progress.found[a.L.key] ? 0.45 : 1; mm.fillText(a.L.T.icon, p[0], p[1]); mm.globalAlpha = 1;
  });
  mm.fillStyle = 'rgba(214,173,120,0.9)';
  devils.forEach(function(D){ if (!D.on) return; var p = px(D.x, D.z); mm.beginPath(); mm.arc(p[0], p[1], 6, 0, TAU); mm.fill(); });
  function edgeMark(x, z, draw){
    var p = px(x, z), dx = p[0] - C, dy = p[1] - C, d = Math.hypot(dx, dy), R = C - 18;
    if (d > R) { p[0] = C + dx / d * R; p[1] = C + dy / d * R; }
    draw(p, d > R);
  }
  if (gateObj.on) edgeMark(gateObj.x, gateObj.z, function(p){ mm.strokeStyle = '#ff8a2a'; mm.lineWidth = 5; mm.beginPath(); mm.arc(p[0], p[1], 9, 0, TAU); mm.stroke(); });
  if (lmNearest) edgeMark(lmNearest.x, lmNearest.z, function(p, outside){
    if (!outside) return;
    mm.font = '22px sans-serif'; mm.textAlign = 'center'; mm.textBaseline = 'middle'; mm.fillText(lmNearest.T.icon, p[0], p[1]);
  });
  if (!compassEl) compassEl = $('compass');
  var t = '';
  if (lmNearest) {
    var dk = Math.hypot(lmNearest.x - S.pos.x, lmNearest.z - S.pos.z);
    t = '🧭 ' + lmNearest.T.icon + ' ' + lmNearest.T.name + ' · ' + (dk > 1000 ? (dk / 1000).toFixed(1) + ' km' : Math.round(dk) + ' m');
  }
  t += (t ? '<br>' : '') + BIOMES[curBiome].icon + ' ' + BIOMES[curBiome].name + ' · found ' + Object.keys(progress.found).length;
  if (t !== compassTxt) { compassTxt = t; compassEl.innerHTML = t; }
}
function updateVariety(dt, hs){
  updateBiome(dt);
  updateLandmarks(dt);
  updateDevils(dt, hs);
  updateChallenges(dt);
  if (gateObj.on) gateObj.g.children[0].scale.setScalar(1 + Math.sin(animT * 5) * 0.06);
}

/* ================= multiplayer: one shared lobby + name tags ================= */
var net = { ws: null, id: null, ok: false, tries: 0, sendT: 0, retryT: 0, players: new Map(), joinIdx: 0, status: 'connecting', listDirty: true };
var NET_RATE = 0.125;            // 8 updates a second
function netName(){
  var n = (prefs.name || '').replace(/[^\w \-\.]/g, '').trim().slice(0, 16);
  return n || 'Rider' + (prefs.tag || (prefs.tag = String(Math.floor(Math.random() * 9000) + 1000)));
}
function netSend(o){ if (net.ws && net.ok) { try { net.ws.send(JSON.stringify(o)); } catch (e) {} } }
function netConnect(){
  if (typeof WebSocket === 'undefined' || typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) { net.status = 'offline'; netStatus(); return; }
  var ws;
  try { ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws'); }
  catch (e) { netRetry(); return; }
  net.ws = ws; net.status = 'connecting'; netStatus();
  ws.onopen = function(){ net.ok = true; net.tries = 0; netSend({ t: 'hello', name: netName() }); };
  ws.onmessage = function(ev){ var m; try { m = JSON.parse(ev.data); } catch (e) { return; } netMessage(m); };
  ws.onclose = function(){ net.ok = false; net.ws = null; net.id = null; netClearPlayers(); netRetry(); };
  ws.onerror = function(){ try { ws.close(); } catch (e) {} };
}
function netRetry(){
  net.tries++; net.status = net.tries > 3 ? 'offline' : 'connecting'; netStatus();
  net.retryT = Math.min(30, 2 * net.tries);
}
function netMessage(m){
  if (m.t === 'welcome') {
    net.id = m.id; net.status = 'online';
    (m.players || []).forEach(function(p){ netPlayer(p.id, p.name); });
    netStatus(); toast('🌐 JOINED THE LOBBY · ' + (m.players || []).length + ' other rider' + ((m.players || []).length === 1 ? '' : 's') + ' online', '#9fd8ff');
  } else if (m.t === 'join') {
    netPlayer(m.id, m.name); toast('👋 ' + m.name + ' joined', '#9fd8ff'); netStatus();
  } else if (m.t === 'name') {
    var p = net.players.get(m.id); if (p) { p.name = m.name; p.tagKey = ''; net.listDirty = true; }
  } else if (m.t === 'leave') {
    var q = net.players.get(m.id); if (q) { toast('👋 ' + q.name + ' left', '#9fd8ff'); netRemove(m.id); netStatus(); }
  } else if (m.t === 's' && m.id !== net.id && Array.isArray(m.d) && m.d.length >= 9) {
    var r = net.players.get(m.id) || netPlayer(m.id, m.n || 'Rider');
    var d = m.d, now = performance.now();
    for (var i = 0; i < 9; i++) if (typeof d[i] !== 'number' || !isFinite(d[i])) return;
    r.snaps.push({ t: now, x: d[0], y: d[1], z: d[2], q: new THREE.Quaternion(d[3], d[4], d[5], d[6]).normalize(), v: VEH_ORDER[d[7]] || 'bike', kmh: d[8], sc: d[9] || 0 });
    if (r.snaps.length > 6) r.snaps.shift();
    r.last = now;
  } else if (m.t === 'full') {
    net.status = 'full'; netStatus(); toast('🌐 The lobby is full right now', '#ff9a3c');
  }
}
function netStatus(){
  var el = $('netStat'); if (!el) return;
  var n = net.players.size;
  el.textContent = net.status === 'online' ? '🟢 Online · ' + (n + 1) + ' rider' + (n ? 's' : '') + ' in the lobby' : net.status === 'connecting' ? '🟡 Connecting…' : net.status === 'full' ? '🔴 Lobby full' : '⚪ Offline (single player)';
  net.listDirty = true;
}

// a remote rider: a copy of their vehicle model + a floating name tag
function makeTag(name, icon){
  var c = canvas(512, 128), x = c.getContext('2d');
  x.font = 'bold 54px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  var label = icon + ' ' + name, w = Math.min(500, x.measureText(label).width + 50);
  x.fillStyle = 'rgba(14,10,30,0.72)';
  if (x.roundRect) { x.beginPath(); x.roundRect(256 - w / 2, 14, w, 100, 30); x.fill(); } else x.fillRect(256 - w / 2, 14, w, 100);
  x.lineWidth = 6; x.strokeStyle = '#36e0ff'; if (x.roundRect) x.stroke(); else x.strokeRect(256 - w / 2, 14, w, 100);
  x.fillStyle = '#ffffff'; x.fillText(label, 256, 66);
  var tex = new THREE.CanvasTexture(c);
  var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, depthWrite: false, fog: false, transparent: true }));
  sp.renderOrder = 999; sp.scale.set(8, 2, 1);
  return sp;
}
function netPlayer(id, name){
  var p = net.players.get(id);
  if (p) return p;
  var root = new THREE.Group(); root.visible = false; scene.add(root);
  p = { id: id, name: String(name || 'Rider').slice(0, 16), root: root, model: null, veh: null, tag: null, tagKey: '', snaps: [], last: 0, dist: 0, kmh: 0, x: 0, z: 0 };
  net.players.set(id, p); net.listDirty = true;
  return p;
}
function netRemove(id){
  var p = net.players.get(id); if (!p) return;
  scene.remove(p.root); if (p.tag) scene.remove(p.tag);
  net.players.delete(id); net.listDirty = true;
}
function netClearPlayers(){ Array.from(net.players.keys()).forEach(netRemove); }
var _nq = new THREE.Quaternion();
function netUpdateRemote(p, now){
  if (!p.snaps.length) return;
  var rt = now - 160, a = null, b = null;               // draw everyone 160 ms in the past so movement stays smooth
  for (var i = 0; i < p.snaps.length - 1; i++) if (p.snaps[i].t <= rt && p.snaps[i + 1].t >= rt) { a = p.snaps[i]; b = p.snaps[i + 1]; break; }
  var x, y, z, s = p.snaps[p.snaps.length - 1];
  if (a) {
    var k = (rt - a.t) / Math.max(1, b.t - a.t);
    x = a.x + (b.x - a.x) * k; y = a.y + (b.y - a.y) * k; z = a.z + (b.z - a.z) * k;
    _nq.copy(a.q).slerp(b.q, k);
  } else if (p.snaps.length >= 2 && rt > s.t) {        // running late: keep them moving for a moment
    var pr = p.snaps[p.snaps.length - 2], dtm = Math.max(1, s.t - pr.t), ex = Math.min(400, rt - s.t) / dtm;
    x = s.x + (s.x - pr.x) * ex; y = s.y + (s.y - pr.y) * ex; z = s.z + (s.z - pr.z) * ex; _nq.copy(s.q);
  } else { x = p.snaps[0].x; y = p.snaps[0].y; z = p.snaps[0].z; _nq.copy(p.snaps[0].q); }
  if (p.veh !== s.v) {                                   // they changed vehicle: copy that model
    if (p.model) p.root.remove(p.model);
    var D = VDEF[s.v]; p.model = D.obj.model.clone(true); p.model.visible = true; p.model.position.set(0, -D.com, 0); p.model.rotation.set(0, 0, 0);
    p.model.traverse(function(o){ o.castShadow = false; });
    p.root.add(p.model); p.veh = s.v; p.tagKey = '';
  }
  p.root.position.set(x, y, z); p.root.quaternion.copy(_nq); p.root.visible = now - p.last < 5000;
  p.x = x; p.z = z; p.kmh = s.kmh; p.sc = s.sc;
  var key = p.name + '|' + p.veh;
  if (p.tagKey !== key) { if (p.tag) scene.remove(p.tag); p.tag = makeTag(p.name, VDEF[p.veh].icon); scene.add(p.tag); p.tagKey = key; }
  var dx = x - camera.position.x, dy = y - camera.position.y, dz = z - camera.position.z, dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  p.dist = Math.hypot(x - S.pos.x, z - S.pos.z);
  var sc = Math.max(1.3, Math.min(400, dist * 0.055));      // the tag stays readable however far away they are
  p.tag.scale.set(sc * 4, sc, 1);
  p.tag.position.set(x, y + 2.5 + (VDEF[p.veh].camH || 3) * 0.6 + sc * 0.6, z);
  p.tag.visible = p.root.visible;
}
var netListEl = null, netListT = 0;
function updateNet(dt){
  if (!net.ws && net.retryT > 0) { net.retryT -= dt; if (net.retryT <= 0) netConnect(); }
  var now = performance.now();
  if (net.ok && net.id) {
    net.sendT -= dt;
    if (net.sendT <= 0) {
      net.sendT = NET_RATE;
      var kmh = Math.round((S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vy, S.vz)) * 3.6);
      var r2 = function(v){ return Math.round(v * 100) / 100; }, r3 = function(v){ return Math.round(v * 1000) / 1000; };
      netSend({ t: 's', d: [r2(S.pos.x), r2(S.pos.y), r2(S.pos.z), r3(S.q.x), r3(S.q.y), r3(S.q.z), r3(S.q.w), VEH_ORDER.indexOf(cur), kmh, Math.round(S.score)] });
    }
  }
  net.players.forEach(function(p){ netUpdateRemote(p, now); });
  netListT -= dt;
  if (netListT <= 0 || net.listDirty) { netListT = 0.5; net.listDirty = false; drawNetList(); }
}
function drawNetList(){
  if (!netListEl) netListEl = $('netList');
  if (!netListEl) return;
  if (net.status !== 'online') { netListEl.style.display = 'none'; return; }
  var arr = Array.from(net.players.values()).filter(function(p){ return p.snaps.length; }).sort(function(a, b){ return a.dist - b.dist; });
  var h = '<div class="hd">🌐 ONLINE · ' + (net.players.size + 1) + '</div><div class="me">' + netName().replace(/</g, '') + ' (you)</div>';
  arr.slice(0, 6).forEach(function(p){
    h += '<div>' + VDEF[p.veh || 'bike'].icon + ' ' + p.name.replace(/</g, '') + ' <b>' + (p.dist > 1000 ? (p.dist / 1000).toFixed(1) + ' km' : Math.round(p.dist) + ' m') + '</b></div>';
  });
  if (arr.length) h += '<div class="tip">' + keyName(binds.joinFriend) + ' = go to a player</div>';
  netListEl.innerHTML = h; netListEl.style.display = 'block';
}
function joinFriend(){
  var arr = Array.from(net.players.values()).filter(function(p){ return p.snaps.length && p.root.visible; });
  if (!arr.length) { toast(net.status === 'online' ? 'Nobody else is riding right now' : 'Not connected to the lobby', '#ff9a3c'); return; }
  var p = arr[net.joinIdx++ % arr.length], s = p.snaps[p.snaps.length - 1];
  var f = new V3(0, 0, 1).applyQuaternion(s.q); f.y = 0; if (f.lengthSq() < 0.01) f.set(0, 0, 1); f.normalize();
  var x = s.x - f.x * 30, z = s.z - f.z * 30;
  if (hyperActive()) cancelHyper();
  S.crashed = false; S.grounded = true; S.speed = 0; S.horiz = 0; S.vx = S.vy = S.vz = 0; S.angV.set(0, 0, 0);
  S.yaw = Math.atan2(f.x, f.z); S.pos.set(x, heightAt(x, z) + VD.com, z); S.grace = 0.3;
  rebuildTerrain(x, z);
  toast('🌐 WARPED TO ' + p.name.toUpperCase(), '#9fd8ff');
}
function drawNetMap(px, C){
  net.players.forEach(function(p){
    if (!p.snaps.length || !p.root.visible) return;
    var q = px(p.x, p.z), dx = q[0] - C, dy = q[1] - C, d = Math.hypot(dx, dy), R = C - 16, out = d > R;
    if (out) { q[0] = C + dx / d * R; q[1] = C + dy / d * R; }
    mm.fillStyle = '#36e0ff'; mm.strokeStyle = '#0a1a2a'; mm.lineWidth = 3;
    mm.beginPath(); mm.arc(q[0], q[1], out ? 7 : 9, 0, TAU); mm.fill(); mm.stroke();
    mm.fillStyle = '#ffffff'; mm.font = 'bold 18px sans-serif'; mm.textAlign = 'center'; mm.textBaseline = 'bottom';
    mm.fillText(p.name.slice(0, 8), q[0], q[1] - 10);
  });
}
$('nameIn').value = prefs.name || '';
$('nameIn').onchange = function(){
  prefs.name = this.value.replace(/[^\w \-\.]/g, '').trim().slice(0, 16); this.value = prefs.name; saveSettings();
  netSend({ t: 'name', name: netName() }); netStatus();
};
netConnect();

/* ================= missions & XP ================= */
var MISSIONS = [
  { id: 'backflip', text: 'Land a Backflip', need: 1, ev: 'trick', match: 'BACKFLIP', xp: 150 },
  { id: 'frontflip', text: 'Land a Frontflip', need: 1, ev: 'trick', match: 'FRONTFLIP', xp: 150 },
  { id: 'roll', text: 'Land 2 Barrel Rolls', need: 2, ev: 'trick', match: 'BARREL ROLL', xp: 200 },
  { id: 'spin', text: 'Land a 360 Spin', need: 1, ev: 'trick', match: '360 SPIN', xp: 150 },
  { id: 'superman', text: 'Land a Superman (bike, scooter or quad)', need: 1, ev: 'trick', match: 'SUPERMAN', xp: 200 },
  { id: 'nacnac', text: 'Land a Nac-Nac', need: 1, ev: 'trick', match: 'NAC-NAC', xp: 200 },
  { id: 'air5', text: 'Get 5 s of airtime in one jump', need: 1, ev: 'air', min: 5, xp: 200 },
  { id: 'air10', text: 'Get 10 s of airtime in one jump', need: 1, ev: 'air', min: 10, xp: 400 },
  { id: 'speed300', text: 'Reach 300 km/h', need: 1, ev: 'speed', min: 300, xp: 150 },
  { id: 'speed700', text: 'Reach 700 km/h', need: 1, ev: 'speed', min: 700, xp: 300 },
  { id: 'coins25', text: 'Collect 25 coins', need: 25, ev: 'coin', xp: 200 },
  { id: 'coins60', text: 'Collect 60 coins', need: 60, ev: 'coin', xp: 400 },
  { id: 'rings3', text: 'Fly through 3 sky rings', need: 3, ev: 'ring', xp: 300 },
  { id: 'combo3', text: 'Land a x3 combo', need: 1, ev: 'combo', min: 3, xp: 250 },
  { id: 'combo5', text: 'Land a x5 combo', need: 1, ev: 'combo', min: 5, xp: 450 },
  { id: 'land100k', text: 'Score 100,000 in one landing', need: 1, ev: 'landScore', min: 100000, xp: 300 },
  { id: 'chain5', text: 'Build a x5 chain', need: 1, ev: 'chain', min: 5, xp: 350 },
  { id: 'ramp3', text: 'Launch off 3 wooden ramps', need: 3, ev: 'ramp', xp: 250 },
  { id: 'pyramid', text: 'Launch off a pyramid', need: 1, ev: 'pyramid', xp: 450 },
  { id: 'high100', text: 'Get 100 m high (Roadster thrusters help!)', need: 1, ev: 'height', min: 100, xp: 300 },
  { id: 'perfect3', text: 'Land 3 PERFECT landings', need: 3, ev: 'perfect', xp: 300 },
  { id: 'sonic', text: 'Break the sound barrier (Mach 1)', need: 1, ev: 'sonic', xp: 600 },
  { id: 'wheelie3', text: 'Hold a 3 s wheelie', need: 1, ev: 'wheelie', min: 3, xp: 200 },
  { id: 'wheelie8', text: 'Hold an 8 s wheelie', need: 1, ev: 'wheelie', min: 8, xp: 400 },
  { id: 'clean1', text: 'Land a CLEAN LANDING on a downhill slope', need: 1, ev: 'clean', min: 1, xp: 200 },
  { id: 'clean3', text: 'Land 3 CLEAN LANDINGS in a row', need: 1, ev: 'clean', min: 3, xp: 450 },
  { id: 'liftoff', text: 'Launch the Moon Rocket', need: 1, ev: 'liftoff', xp: 200 },
  { id: 'deploy', text: 'Eject the Roadster from the rocket', need: 1, ev: 'deploy', xp: 400 },
  { id: 'rocketland', text: 'Land the Moon Rocket upright', need: 1, ev: 'rocketland', xp: 800 },
  { id: 'loop', text: 'Fly a loop in the Stealth Jet', need: 1, ev: 'trick', match: 'LOOP', xp: 300 },
  { id: 'touchdown', text: 'Take off and land the Stealth Jet', need: 1, ev: 'touchdown', xp: 350 },
  { id: 'hyper', text: 'Jump to hyperspace (Admin Bike)', need: 1, ev: 'hyper', xp: 300 },
  { id: 'arch1', text: 'Thread a stone arch', need: 1, ev: 'arch', xp: 300 },
  { id: 'arch3', text: 'Thread 3 stone arches', need: 3, ev: 'arch', xp: 500 },
  { id: 'overclock', text: 'Overclock a vehicle (O)', need: 1, ev: 'overclock', xp: 200 },
  { id: 'speed20k', text: 'Reach 20,000 km/h', need: 1, ev: 'speed', min: 20000, xp: 500 },
  { id: 'boosterland', text: 'Land the Moon Rocket on the pad (press Q in flight)', need: 1, ev: 'boosterland', xp: 600 },
  { id: 'bullseye', text: 'Land the rocket within 1.5 m of the pad centre', need: 1, ev: 'bullseye', xp: 800 },
  { id: 'helitouch', text: 'Fly the helicopter and land it again', need: 1, ev: 'helitouch', xp: 300 },
  { id: 'heliflip', text: 'Flip the helicopter (hold ↑ or ↓)', need: 1, ev: 'heliflip', xp: 300 },
  { id: 'heli1000', text: 'Fly the helicopter at 1,000 km/h (overclock it!)', need: 1, ev: 'helispeed', min: 1000, xp: 400 },
  { id: 'build5', text: 'Build 5 things (B)', need: 5, ev: 'build', xp: 200 },
  { id: 'bounce3', text: 'Bounce on a trampoline 3 times', need: 3, ev: 'bounce', xp: 250 },
  { id: 'barrel', text: 'Blow up some exploding barrels', need: 1, ev: 'barrel', xp: 200 },
  { id: 'boostpad', text: 'Hit 3 boost pads', need: 3, ev: 'boostpad', xp: 200 },
  { id: 'landmark', text: 'Discover a landmark (follow the 🧭)', need: 1, ev: 'landmark', xp: 300 },
  { id: 'landmark3', text: 'Discover 3 landmarks', need: 3, ev: 'landmark', xp: 600 },
  { id: 'devil', text: 'Ride a dust devil 🌪️', need: 1, ev: 'devil', xp: 250 },
  { id: 'chal3', text: 'Complete 3 ⚡ challenges', need: 3, ev: 'challenge', xp: 350 },
  { id: 'biome', text: 'Visit a new biome (head out past 1.5 km)', need: 1, ev: 'biome', xp: 250 }
];
var MBY = {}; MISSIONS.forEach(function(m){ MBY[m.id] = m; });
function xpNeed(lv){ return 400 + lv * 200; }
function pickMission(){
  var have = progress.missions.map(function(m){ return m.id; }), opts = MISSIONS.filter(function(m){ return have.indexOf(m.id) < 0; });
  return { id: opts[Math.floor(Math.random() * opts.length)].id, p: 0 };
}
progress.missions = (progress.missions || []).filter(function(m){ return m && MBY[m.id]; }).slice(0, 3);
while (progress.missions.length < 3) progress.missions.push(pickMission());
var missionsDirty = true;
function missionEvent(ev, val){
  challengeEvent(ev, val);
  var changed = false;
  for (var i = 0; i < progress.missions.length; i++) {
    var m = progress.missions[i], d = MBY[m.id];
    if (d.ev !== ev) continue;
    var before = m.p;
    if (ev === 'trick') { if (val === d.match) m.p++; }
    else if (d.min != null) { if (val >= d.min) m.p = d.need; }
    else m.p += val || 1;
    if (m.p !== before) { missionsDirty = true; changed = true; }
    if (m.p >= d.need) {
      progress.missions[i] = pickMission();
      S.score += d.xp * 10;
      toast('✔ MISSION: ' + d.text.toUpperCase() + '  +' + d.xp + ' XP', '#7dff6a');
      sfx('mission');
      addXP(d.xp);
    }
  }
  if (changed) save('duneRider.progress', progress);
}
function addXP(n){
  progress.xp += n;
  while (progress.xp >= xpNeed(progress.level)) {
    progress.xp -= xpNeed(progress.level); progress.level++;
    var unlock = PAINTS.filter(function(p){ return p[2] === progress.level; }).map(function(p){ return p[0]; });
    setTimeout(function(){ toast('⭐ LEVEL ' + progress.level + '!' + (unlock.length ? '  Unlocked ' + unlock.join(', ') + ' paint' : ''), '#ffe14d'); sfx('level'); }, 1200);
  }
  save('duneRider.progress', progress);
  missionsDirty = true;
}

/* ================= vehicle switching ================= */
function setVehicle(key, keepState){
  if (!(cur === 'rocket' && keepState)) VD.obj.model.visible = false;
  cur = key; VD = VDEF[key]; VD.key = key; prefs.vehicle = key; saveSettings();
  VD.obj.model.visible = true;
  VD.obj.model.position.y = -VD.com;
  var shc = sun.shadow.camera;
  shc.left = shc.bottom = -VD.shadow; shc.right = shc.top = VD.shadow; shc.updateProjectionMatrix();
  blob.scale.set(VD.blob[0], 1, VD.blob[1]);
  headlight.position.set(0, VD.key === 'monster' ? 1.0 : 0.3, VD.blob[1] * 0.45);
  if (!keepState) { respawn(); S.chain = 1; }
  S.fuel = 1;
  if (key !== 'rocket') launchPad.visible = false;
  pose = Object.assign({}, VD.pose);
  applyPaint(key);
  applyAudioType();
  vehChip.innerHTML = VD.icon + ' ' + VD.name.toUpperCase() + '<small>' + keyName(binds.vehicle) + ' to change vehicle · ' + keyName(binds.camera) + ' camera · ' + keyName(binds.overclock) + ' overclock' +
    (VD.flight === 'heli' ? '<br>arrows rotate · ' + keyName(binds.jump) + ' level out' : '') +
    (VD.flight === 'rocket' ? '<br>' + keyName(binds.spinL) + ' booster landing · ' + keyName(binds.jump) + ' eject' : '') +
    (VD.admin ? '<br>' + keyName(binds.wings) + ' wings · ' + keyName(binds.thrust) + ' hyperspace' : '') + '</small>';
  document.getElementById('fuel').style.display = VD.thrust ? 'block' : 'none';
  renderVehicles(); renderPaints();
}

/* ================= poses ================= */
var pose = {};
function targetPose(inp){
  var t = Object.assign({}, VD.pose);
  if (S.crashed) {
    if (VD.style) { t.torso = -0.5; t.sX = -2.8; t.sZ = 1.3; t.el = -0.5; t.hLX = -1.3; t.kL = 0.4; t.hRX = 0.7; t.kR = 0.9; t.hLZ = 0.6; t.hRZ = 0.6; }
    else { t.sX = -2.9; t.sZ = 0.5; t.el = -0.3; }
    return t;
  }
  if (hyperActive() && VD.admin) { t.torso = 1.0; t.sX = -2.0; t.el = 0.7; t.hLX = -0.7; t.kL = 1.7; t.hRX = -0.7; t.kR = 1.7; return t; }
  if (!S.grounded && VD.style) {
    if (inp.nacnac) { t.hRX = 0.5; t.hRZ = 1.4; t.kR = 0.4; t.torso = 0.3; }
    if (inp.nohander) { t.sX = -3.0; t.sZ = 0.85; t.el = -0.4; t.torso = 0.05; }
    if (inp.superman) { t.torso = 1.35; t.hLX = 1.5; t.hRX = 1.5; t.kL = 0.1; t.kR = 0.1; t.hLZ = 0.25; t.hRZ = 0.25; t.lift = 0.35; if (!inp.nohander) { t.sX = -2.5; t.el = 0.1; } }
  } else if (S.grounded && S.wheelie > 0.05) { t.torso -= S.wheelie * 0.8; t.sX += S.wheelie * 0.4; }
  else if (S.grounded && VD.style && inp.brk && S.speed > 2) t.torso -= 0.25;
  else if (!S.grounded && !VD.style && S.airT > 1.5) { t.sX = -2.9; t.sZ = 0.4; t.el = -0.2; }   // drivers cheer on big air
  return t;
}
function applyPose(dt, inp){
  var R = VD.obj.rider, t = targetPose(inp), k = 1 - Math.exp(-12 * dt);
  for (var key in t) pose[key] += (t[key] - pose[key]) * k;
  R.torso.rotation.x = pose.torso;
  R.head.rotation.x = -pose.torso * 0.6;
  R.sL.rotation.set(pose.sX, 0, pose.sZ); R.sR.rotation.set(pose.sX, 0, -pose.sZ);
  R.eL.rotation.x = pose.el; R.eR.rotation.x = pose.el;
  R.hL.rotation.set(pose.hLX, 0, pose.hLZ); R.hR.rotation.set(pose.hRX, 0, -pose.hRZ);
  R.kL.rotation.x = pose.kL; R.kR.rotation.x = pose.kR;
  R.root.position.y = VD.obj.riderY + pose.lift;
  if (VD.key === 'jetpack') {
    if (S.grounded && !S.crashed && Math.abs(S.speed) > 0.5) {        // run cycle
      S.runPh = (S.runPh || 0) + Math.abs(S.speed) * dt * 1.4;
      var sw2 = Math.sin(S.runPh) * Math.min(1, Math.abs(S.speed) / 6);
      R.hL.rotation.x += sw2 * 0.8; R.hR.rotation.x -= sw2 * 0.8;
      R.kL.rotation.x += Math.max(0, -sw2) * 1.1; R.kR.rotation.x += Math.max(0, sw2) * 1.1;
      R.sL.rotation.x -= sw2 * 0.7; R.sR.rotation.x += sw2 * 0.7;
      R.root.position.y += Math.abs(Math.cos(S.runPh)) * 0.06;
    } else if (!S.grounded && !S.crashed) {                            // flying: legs trail back
      R.hL.rotation.x += 0.35; R.hR.rotation.x += 0.45; R.kL.rotation.x += 0.5; R.kR.rotation.x += 0.7;
    }
  }
}

/* ================= engine note ================= */
function updateEngine(dt, kmh, inp){
  var target = 1100 + 7400 * (1 - Math.exp(-kmh / 220));
  if (!S.grounded && inp.thr) target = Math.max(target, 8200);
  if (S.crashed) target = 1100;
  if (inp.thr && kmh < 3 && S.grounded) target = Math.max(target, 2400);
  S.rpm += (target - S.rpm) * (1 - Math.exp(-(target < S.rpm ? 14 : 8) * dt));
}

/* ================= HUD ================= */
function $(id){ return document.getElementById(id); }
var scoreEl = $('score'), bestEl = $('best'), levelEl = $('level'), coinsEl = $('coinsHud'), timerEl = $('timer');
var chainEl = $('chain'), chainBar = $('chainBar'), chainFill = chainBar.firstChild;
var trickBox = $('trickBox'), trickList = $('trickList'), trickPtsEl = $('trickPts'), airEl = $('airTime');
var altEl = $('alt'), popEl = $('popup'), toastEl = $('toast'), vehChip = $('vehChip'), missionsEl = $('missions');
var fuelLbl = document.querySelector('#fuel .lbl'), fuelFill = document.querySelector('#fuel i'), boostFill = document.querySelector('#boostBox i'), boostBox = $('boostBox');
var buildChip = $('buildChip'), buildDirty = true;
var speedLines = $('speedLines'), slowmoFx = $('slowmoFx'), ocBadge = $('ocBadge'), ocShown = false;
function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
function popup(title, sub, cls){
  popEl.className = 'hud'; void popEl.offsetWidth;
  popEl.innerHTML = '<div class="pt">' + title + '</div>' + (sub ? '<div class="ps">' + sub + '</div>' : '');
  popEl.className = 'hud show ' + (cls || '');
}
function toast(text, color){
  toastEl.className = 'hud'; void toastEl.offsetWidth;
  toastEl.textContent = text; toastEl.style.color = color || '#7dff6a';
  toastEl.className = 'hud show';
}
var lastTrickHTML = '', lastScore = -1, lastHudKey = '';
function updateHUD(){
  if (S.score !== lastScore) { scoreEl.textContent = fmt(S.score); lastScore = S.score; }
  var hk = bestLanding + '|' + progress.level + '|' + progress.xp + '|' + S.runCoins;
  if (hk !== lastHudKey) {
    lastHudKey = hk;
    bestEl.textContent = 'BEST LANDING ' + fmt(bestLanding);
    levelEl.innerHTML = 'LV ' + progress.level + '<span class="xpbar"><i style="width:' + (progress.xp / xpNeed(progress.level) * 100).toFixed(1) + '%"></i></span>';
    coinsEl.textContent = '🪙 ' + S.runCoins;
  }
  if (missionsDirty) {
    missionsDirty = false;
    var mh = '<div class="hd">MISSIONS</div>';
    progress.missions.forEach(function(m){ var d = MBY[m.id]; mh += '<div class="m"><span>' + d.text + '</span><b>' + Math.min(m.p, d.need) + '/' + d.need + '</b></div>'; });
    missionsEl.innerHTML = mh;
  }
  if (S.chain > 1) {
    chainEl.style.display = 'block'; chainBar.style.display = 'block';
    chainEl.textContent = 'CHAIN x' + S.chain;
    chainFill.style.width = Math.max(0, S.chainT / 4 * 100) + '%';
  } else { chainEl.style.display = 'none'; chainBar.style.display = 'none'; }
  if (VD.thrust) {
    fuelFill.style.width = '100%';
    var fl = '∞ INFINITE THRUSTERS';
    if (fuelLbl.textContent !== fl) fuelLbl.textContent = fl;
  }
  var altNow = S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z);
  if (VD.flight || altNow > 60) { altEl.style.display = 'block'; altEl.textContent = 'ALT ' + fmt(Math.max(0, altNow)) + ' m' + (VD.flight === 'rocket' && !S.grounded ? (RA ? '  ·  AUTOPILOT: ' + RA.phase.toUpperCase() : '  ·  ' + keyName(binds.spinL) + ' = BOOSTER LANDING' + (S.payload ? '  ·  ' + keyName(binds.jump) + ' = EJECT' : '')) : '') + (VD.flight === 'jet' && S.grounded ? '  ·  hold W, then ↓ to take off' : '') + (VD.flight === 'heli' ? (S.grounded ? '  ·  hold W to spin up & lift off' : '  ·  ' + keyName(binds.jump) + ' = LEVEL OUT') : ''); }
  else altEl.style.display = 'none';
  boostFill.style.width = (S.boost * 100).toFixed(1) + '%';
  var ocOn = S.overclock;
  if (ocOn !== ocShown) { ocShown = ocOn; ocBadge.className = 'hud' + (ocOn ? ' on' : ''); }
  if (buildDirty) {
    buildDirty = false; var bi = BUILD_ITEMS[buildSel];
    buildChip.innerHTML = '🛠 <b>' + bi.icon + ' ' + bi.name + '</b> · ' + keyName(binds.build) + ' place · ' + keyName(binds.buildNext) + ' next · ' + keyName(binds.buildClear) + ' clear' + (userObjs.length ? ' (' + userObjs.length + ')' : '');
  }
  boostBox.className = 'hud meter' + (S.boost >= 0.999 ? ' full' : '');
  if (attack.active) {
    timerEl.style.display = 'block';
    var t = Math.max(0, attack.t), mm = Math.floor(t / 60), ss = Math.floor(t % 60);
    timerEl.textContent = '⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss;
    timerEl.className = 'hud' + (t < 10 ? ' low' : '');
  } else timerEl.style.display = 'none';
  var names = Object.keys(S.tricks);
  if (S.grounded && !S.crashed && S.wheelieT > 0.3) {
    trickBox.style.display = 'block';
    if (lastTrickHTML !== 'W') { trickList.innerHTML = '<div>WHEELIE!</div>'; lastTrickHTML = 'W'; }
    trickPtsEl.textContent = fmt(S.wheeliePts * VD.pts);
    airEl.textContent = S.wheelieT.toFixed(1) + 's';
  } else if (!S.grounded && !S.crashed && (names.length || S.airT > 0.6)) {
    trickBox.style.display = 'block';
    var html = '';
    names.forEach(function(n){ html += '<div>' + n + (S.tricks[n] > 1 ? ' x' + S.tricks[n] : '') + '</div>'; });
    if (html !== lastTrickHTML) { trickList.innerHTML = html; lastTrickHTML = html; }
    var base = S.trickPts + (S.airT > 0.6 ? S.airT * AIR_PTS : 0);
    trickPtsEl.textContent = fmt(base * VD.pts) + '  x' + Math.max(1, names.length) + (S.chain > 1 ? '  ·  x' + S.chain + ' chain' : '');
    airEl.textContent = 'AIR ' + S.airT.toFixed(1) + 's';
  } else if (trickBox.style.display !== 'none') { trickBox.style.display = 'none'; lastTrickHTML = ''; trickList.innerHTML = ''; }
}

var spdCanvas = $('speedo'), sc = spdCanvas.getContext('2d');
var dialMax = 200, dialFlash = 0;
function drawSpeedo(speedMS, dt, mach){
  var W = 460, cx = 230, cy = 236, R = 184;
  var a0 = Math.PI * 0.75, sweep = Math.PI * 1.5;
  var val = prefs.units === 'mph' ? speedMS * 2.23694 : speedMS * 3.6;
  var aval = Math.abs(val);
  if (aval > dialMax * 0.92) { dialMax = Math.ceil(aval * 1.6 / 100) * 100; dialFlash = 0.5; }
  else if (dialMax > 200 && aval < dialMax * 0.25) dialMax = Math.max(200, Math.ceil(aval * 1.6 / 100) * 100);
  if (dialFlash > 0) dialFlash -= dt;
  sc.clearRect(0, 0, W, W);
  sc.beginPath(); sc.arc(cx, cy, R + 20, 0, TAU);
  sc.fillStyle = 'rgba(14,10,30,0.74)'; sc.fill();
  sc.lineWidth = 6; sc.strokeStyle = (VD.admin && S.overclock) ? 'rgba(255,60,30,' + (0.6 + 0.4 * Math.sin(animT * 18)).toFixed(2) + ')' : dialFlash > 0 ? 'rgba(255,225,77,0.9)' : (S.boosting ? 'rgba(255,140,40,0.9)' : 'rgba(255,255,255,0.18)'); sc.stroke();
  sc.lineCap = 'butt';
  var f = Math.min(1, aval / dialMax);
  sc.beginPath(); sc.arc(cx, cy, R - 8, a0, a0 + sweep);
  sc.strokeStyle = 'rgba(255,255,255,0.1)'; sc.lineWidth = 14; sc.stroke();
  var grad = sc.createLinearGradient(cx - R, 0, cx + R, 0);
  grad.addColorStop(0, '#36e0ff'); grad.addColorStop(0.6, '#ffe14d'); grad.addColorStop(1, '#ff4d4d');
  sc.beginPath(); sc.arc(cx, cy, R - 8, a0, a0 + sweep * f);
  sc.strokeStyle = grad; sc.lineWidth = 14; sc.stroke();
  sc.textAlign = 'center'; sc.textBaseline = 'middle';
  var step = dialMax / 10, labelSize = dialMax >= 10000 ? 17 : dialMax >= 1000 ? 21 : 26;
  for (var i = 0; i <= 20; i++) {
    var a = a0 + sweep * (i / 20), c = Math.cos(a), s = Math.sin(a), major = i % 4 === 0;
    sc.beginPath(); sc.moveTo(cx + c * (R - (major ? 42 : 34)), cy + s * (R - (major ? 42 : 34)));
    sc.lineTo(cx + c * (R - 20), cy + s * (R - 20));
    sc.strokeStyle = '#fff'; sc.lineWidth = major ? 4 : 2; sc.stroke();
    if (major) { sc.fillStyle = '#fff'; sc.font = labelSize + 'px "Luckiest Guy", Impact, sans-serif'; sc.fillText(String(Math.round(step * i / 2)), cx + c * (R - 68), cy + s * (R - 68) + 2); }
  }
  var na = a0 + sweep * f;
  sc.beginPath(); sc.moveTo(cx - Math.cos(na) * 18, cy - Math.sin(na) * 18);
  sc.lineTo(cx + Math.cos(na) * (R - 30), cy + Math.sin(na) * (R - 30));
  sc.strokeStyle = '#ff4433'; sc.lineWidth = 7; sc.lineCap = 'round'; sc.stroke();
  sc.beginPath(); sc.arc(cx, cy, 16, 0, TAU); sc.fillStyle = '#ff4433'; sc.fill();
  sc.fillStyle = 'rgba(255,255,255,0.75)'; sc.font = '18px "Luckiest Guy", Impact, sans-serif';
  sc.fillText(hyper.phase === 2 ? 'HYPERSPACE' : hyper.phase === 1 ? 'CHARGING…' : S.speed < -0.5 && S.grounded ? 'REVERSE' : (mach >= 0.5 ? 'MACH ' + mach.toFixed(2) : (S.thrusting ? 'THRUSTERS!' : (S.boosting ? 'BOOST!' : 'NO LIMIT'))), cx, cy + 62);
  sc.fillStyle = '#fff'; sc.font = '72px "Luckiest Guy", Impact, sans-serif';
  sc.fillText(String(Math.round(aval)), cx, cy + 122);
  sc.fillStyle = '#ffe14d'; sc.font = '22px "Luckiest Guy", Impact, sans-serif';
  sc.fillText(prefs.units === 'mph' ? 'MPH' : 'KM/H', cx, cy + 168);
}

var mm = $('minimap').getContext('2d');
function drawMinimap(){
  var W = 360, C = 180, RANGE = 380, k = C / RANGE;
  var heading = (!S.grounded && Math.hypot(S.vx, S.vz) > 2) ? Math.atan2(S.vx, S.vz) : S.yaw;
  var fx = Math.sin(heading), fz = Math.cos(heading), rx = -Math.cos(heading), rz = Math.sin(heading);
  function px(x, z){ var dx = x - S.pos.x, dz = z - S.pos.z; return [C + (dx * rx + dz * rz) * k, C - (dx * fx + dz * fz) * k]; }
  mm.clearRect(0, 0, W, W);
  mm.save(); mm.beginPath(); mm.arc(C, C, C - 4, 0, TAU); mm.fillStyle = 'rgba(14,10,30,0.62)'; mm.fill();
  mm.lineWidth = 5; mm.strokeStyle = 'rgba(255,255,255,0.35)'; mm.stroke(); mm.clip();
  activePyrs.forEach(function(p){
    var a = px(p.x - p.B, p.z - p.B), b = px(p.x + p.B, p.z - p.B), c = px(p.x + p.B, p.z + p.B), d = px(p.x - p.B, p.z + p.B);
    mm.beginPath(); mm.moveTo(a[0], a[1]); mm.lineTo(b[0], b[1]); mm.lineTo(c[0], c[1]); mm.lineTo(d[0], d[1]); mm.closePath();
    mm.fillStyle = 'rgba(230,190,120,0.75)'; mm.fill();
  });
  mm.fillStyle = '#c98a4a';
  activeRamps.forEach(function(r){
    var p = px(r.x, r.z); if (Math.abs(p[0] - C) > C || Math.abs(p[1] - C) > C) return;
    mm.save(); mm.translate(p[0], p[1]); mm.rotate(heading - r.a); mm.fillRect(-r.W * k * 1.5, -r.L * k * 1.5, r.W * k * 3, r.L * k * 3); mm.restore();
  });
  mm.fillStyle = '#ffd84d';
  activeCoins.forEach(function(c){ var p = px(c.x, c.z); if (Math.abs(p[0] - C) < C && Math.abs(p[1] - C) < C) mm.fillRect(p[0] - 3, p[1] - 3, 6, 6); });
  mm.strokeStyle = '#36e0ff'; mm.lineWidth = 4;
  activeRings.forEach(function(r){ var p = px(r.x, r.z); mm.beginPath(); mm.arc(p[0], p[1], 9, 0, TAU); mm.stroke(); });
  mm.fillStyle = '#b0603a';
  activeSpires.forEach(function(sp){ var p = px(sp.x, sp.z); mm.beginPath(); mm.arc(p[0], p[1], Math.max(3, sp.r * k * 2), 0, TAU); mm.fill(); });
  mm.fillStyle = '#d7a8ff';
  userObjs.forEach(function(o){ var p = px(o.x, o.z); if (Math.abs(p[0] - C) < C && Math.abs(p[1] - C) < C) { mm.beginPath(); mm.arc(p[0], p[1], o.type === 'mega' ? 9 : 6, 0, TAU); mm.fill(); } });
  mm.strokeStyle = '#d07a48'; mm.lineWidth = 6;
  activeArches.forEach(function(A){
    var f = A.Sx + A.T, a = px(A.x + A.ca * f, A.z - A.sa * f), b = px(A.x - A.ca * f, A.z + A.sa * f);
    mm.beginPath(); mm.moveTo(a[0], a[1]); mm.lineTo(b[0], b[1]); mm.stroke();
  });
  drawVarietyMap(px, C);
  drawNetMap(px, C);
  mm.restore();
  mm.beginPath(); mm.moveTo(C, C - 16); mm.lineTo(C + 11, C + 12); mm.lineTo(C, C + 6); mm.lineTo(C - 11, C + 12); mm.closePath();
  mm.fillStyle = '#ffffff'; mm.fill(); mm.lineWidth = 3; mm.strokeStyle = '#ff4433'; mm.stroke();
}

/* ================= audio ================= */
var audio = null;
function initAudio(){
  if (audio) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
  try {
    var AC = window.AudioContext || window.webkitAudioContext, ctx = new AC();
    var o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 3;
    var g = ctx.createGain(); g.gain.value = 0;
    var g2 = ctx.createGain(); g2.gain.value = 0.5;
    o2.connect(g2); g2.connect(f); o1.connect(f); f.connect(g); g.connect(ctx.destination);
    o1.start(); o2.start();
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), ch = buf.getChannelData(0);
    for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    var ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6;
    var ng = ctx.createGain(); ng.gain.value = 0;
    ns.connect(bp); bp.connect(ng); ng.connect(ctx.destination); ns.start();
    var ws = ctx.createBufferSource(); ws.buffer = buf; ws.loop = true;
    var wf = ctx.createBiquadFilter(); wf.type = 'highpass'; wf.frequency.value = 900;
    var wg = ctx.createGain(); wg.gain.value = 0;
    ws.connect(wf); wf.connect(wg); wg.connect(ctx.destination); ws.start();
    audio = { ctx: ctx, o1: o1, o2: o2, f: f, g: g, ng: ng, wg: wg, buf: buf };
    applyAudioType();
  } catch (e) {}
}
function applyAudioType(){
  if (!audio) return;
  var t = VD.sound;
  audio.o1.type = (t === 'bike' || t === 'car' || t === 'admin' || t === 'jet' || t === 'rocket' || t === 'heli') ? 'sawtooth' : 'sine';
  audio.o2.type = t === 'bike' ? 'square' : (t === 'car' ? 'sawtooth' : 'triangle');
}
function updateAudio(thr, kmh, timeScale){
  if (!audio) return;
  var t = audio.ctx.currentTime, type = VD.sound, fr, filt, gain;
  if (type === 'bike') { fr = 28 + S.rpm / 60 * 1.1; filt = 450 + S.rpm * 0.22 + (thr ? 700 : 0); gain = 0.035 + (thr ? 0.05 : 0); }
  else if (type === 'car') { fr = (VD.key === 'monster' ? 14 : 20) + S.rpm / 60 * 0.75; filt = 380 + S.rpm * 0.18 + (thr ? 500 : 0); gain = 0.04 + (thr ? 0.05 : 0); }
  else if (type === 'scooter') { fr = 200 + 700 * (1 - Math.exp(-kmh / 60)); filt = 2600; gain = 0.012 + (thr ? 0.018 : 0); }
  else if (type === 'heli') { fr = (30 + (S.rotor || 0) * 25) * (S.overclock ? 1.5 : 1); filt = 500 + (S.rotor || 0) * 500; gain = (0.02 + 0.05 * (S.rotor || 0)) * (0.55 + 0.45 * Math.abs(Math.sin(animT * TAU * 2.6 * (S.rotor || 0)))); }
  else if (type === 'jetpack') { fr = 160 + kmh * 2; filt = 2200; gain = 0.008; }
  else if (type === 'jet') { fr = 55 + Math.min(400, kmh * 0.25); filt = 900 + kmh * 0.8; gain = 0.03 + (thr ? 0.03 : 0); }
  else if (type === 'rocket') { fr = 32; filt = 300; gain = S.engineOn ? 0.06 : 0; }
  else if (type === 'admin') { fr = (70 + 900 * (1 - Math.exp(-kmh / 700))) * (S.overclock ? 1.6 : 1); filt = 1800 + Math.min(kmh, 6000); gain = 0.02 + (thr ? 0.03 : 0) + (S.overclock ? 0.015 : 0); }
  else { fr = 140 + 900 * (1 - Math.exp(-kmh / 300)); filt = 3000; gain = 0.014 + (thr ? 0.02 : 0); }
  fr *= timeScale < 1 ? 0.6 : 1;
  if (S.overclock && type !== 'admin' && type !== 'heli') fr *= 1.5;      // overclocked engines scream
  audio.o1.frequency.setTargetAtTime(fr, t, 0.03);
  audio.o2.frequency.setTargetAtTime(fr * 0.5, t, 0.03);
  audio.f.frequency.setTargetAtTime(filt, t, 0.05);
  var on = prefs.sound && !paused && !S.crashed;
  audio.g.gain.setTargetAtTime(on ? gain : 0, t, 0.06);
  audio.ng.gain.setTargetAtTime(on ? Math.max(Math.max(S.thrustVis, S.boostVis) * 0.13, VD.flight ? (S.roar || 0) : 0) : 0, t, 0.05);
  audio.wg.gain.setTargetAtTime(on ? Math.min(0.06, kmh / 9000) : 0, t, 0.2);
}
function sfx(type){
  if (!audio || !prefs.sound) return;
  var c = audio.ctx, t = c.currentTime;
  function tone(f0, f1, dur, typ, vol, delay){
    var st = t + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = typ; o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(f1, st + dur);
    g.gain.setValueAtTime(vol, st); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
    o.connect(g); g.connect(c.destination); o.start(st); o.stop(st + dur + 0.05);
  }
  function noise(dur, freq, vol){
    var s = c.createBufferSource(); s.buffer = audio.buf;
    var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    var g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.05);
  }
  if (type === 'coin') { tone(1320, 1980, 0.12, 'square', 0.035); tone(1980, 2640, 0.1, 'square', 0.025, 0.06); }
  else if (type === 'ring') { tone(523, 1046, 0.3, 'sine', 0.12); tone(784, 1568, 0.3, 'sine', 0.09, 0.08); tone(1046, 2092, 0.35, 'sine', 0.07, 0.16); }
  else if (type === 'trick') tone(520, 880, 0.12, 'triangle', 0.08);
  else if (type === 'landed') { tone(660, 660, 0.1, 'triangle', 0.08); tone(990, 990, 0.18, 'triangle', 0.08, 0.08); }
  else if (type === 'land') noise(0.25, 380, 0.35);
  else if (type === 'jump') tone(300, 520, 0.12, 'sine', 0.06);
  else if (type === 'crash') { noise(0.7, 900, 0.5); tone(140, 40, 0.5, 'sawtooth', 0.1); }
  else if (type === 'mission') { [0, 0.09, 0.18].forEach(function(d, i){ tone(700 + i * 250, 720 + i * 250, 0.16, 'triangle', 0.1, d); }); }
  else if (type === 'level') { [0, 0.1, 0.2, 0.32].forEach(function(d, i){ tone(523 * Math.pow(1.26, i), 530 * Math.pow(1.26, i), 0.28, 'square', 0.05, d); }); }
  else if (type === 'boost') noise(0.5, 1800, 0.25);
  else if (type === 'click') tone(800, 600, 0.05, 'square', 0.03);
  else if (type === 'hyperCharge') {
    var co = c.createOscillator(), cg = c.createGain(), cf = c.createBiquadFilter();
    co.type = 'sawtooth'; co.frequency.setValueAtTime(90, t); co.frequency.exponentialRampToValueAtTime(1400, t + 0.75);
    cf.type = 'lowpass'; cf.frequency.setValueAtTime(400, t); cf.frequency.exponentialRampToValueAtTime(5000, t + 0.75);
    cg.gain.setValueAtTime(0.001, t); cg.gain.linearRampToValueAtTime(0.09, t + 0.7); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    co.connect(cf); cf.connect(cg); cg.connect(c.destination); co.start(t); co.stop(t + 0.9);
  }
  else if (type === 'hyperJump') { noise(0.7, 5000, 0.6); tone(1500, 50, 1.3, 'sine', 0.5); tone(220, 35, 1.1, 'sawtooth', 0.15); tone(60, 25, 1.6, 'sine', 0.5, 0.05); }
  else if (type === 'hyperExit') { tone(70, 700, 0.35, 'sine', 0.3); noise(0.35, 1800, 0.3); }
  else if (type === 'overclock') { tone(200, 2400, 0.4, 'sawtooth', 0.08); noise(0.15, 6000, 0.35); tone(2400, 1800, 0.3, 'square', 0.04, 0.35); }
  else if (type === 'boing') { tone(180, 620, 0.25, 'sine', 0.2); tone(620, 300, 0.25, 'triangle', 0.08, 0.2); }
  else if (type === 'coldgas') { noise(0.18, 6000, 0.3); noise(0.12, 5000, 0.2); }
  else if (type === 'overclockOff') tone(1200, 150, 0.35, 'sawtooth', 0.06);
  else if (type === 'wings') { noise(0.07, 3500, 0.3); tone(320, 200, 0.1, 'square', 0.04); noise(0.07, 2500, 0.25); }
  else if (type === 'clean') { tone(400, 1200, 0.35, 'sine', 0.12); noise(0.4, 2500, 0.15); }
  else if (type === 'flap') { noise(0.28, 650, 0.3); tone(170, 110, 0.22, 'sine', 0.06); }
  else if (type === 'boom') { noise(0.12, 7000, 0.6); noise(1.6, 240, 1.0); tone(75, 26, 1.4, 'sine', 0.7); tone(48, 20, 1.8, 'triangle', 0.4, 0.05); }
}

/* ================= camera ================= */
var CAM_NAMES = ['CHASE CAM', 'CLOSE CAM', 'HELMET CAM', 'CINEMATIC CAM'];
var camYaw = 0, camY = S.pos.y + 3, camMode = 0, lastFov = 70, cine = null;
var FLIPY = new THREE.Quaternion().setFromAxisAngle(AY, Math.PI), _cp = new V3();
var _co = new V3(), _cl = new V3(), _cu = new V3(), flightCamInit = false;
function flightCamera(dt, hs){
  var close = camMode === 1 ? 0.6 : 1, target;
  if (VD.flight === 'jet') {
    target = _co.set(0, 4.2 * close, -17 * close).applyQuaternion(S.q).add(S.pos);
    _cl.set(0, 1.5, 9).applyQuaternion(S.q).add(S.pos);
    _cu.set(0, 1, 0).applyQuaternion(S.q).lerp(UPV, 0.45).normalize();
  } else if (VD.flight === 'heli') {
    var hcy = Math.cos(S.yaw), hsy = Math.sin(S.yaw), hb = 17 * close;
    target = _co.set(S.pos.x - hsy * hb, S.pos.y + 5.5 * close, S.pos.z - hcy * hb);
    _cl.set(S.pos.x + hsy * 4, S.pos.y + 1.8, S.pos.z + hcy * 4);
    _cu.copy(UPV);
  } else {
    var cy = Math.cos(S.yaw), sy = Math.sin(S.yaw), back = 62 * close;
    target = _co.set(S.pos.x - sy * back, S.pos.y + 6 * close, S.pos.z - cy * back);
    _cl.copy(S.pos).addScaledVector(tmpV2.set(0, 1, 0).applyQuaternion(S.q), 10);
    _cu.copy(UPV);
  }
  var gy = heightAt(target.x, target.z) + 2;
  if (target.y < gy) target.y = gy;
  if (!flightCamInit) { camera.position.copy(target); flightCamInit = true; }
  else camera.position.lerp(target, 1 - Math.exp(-(VD.flight === 'jet' ? 9 : 4) * dt));
  camera.up.copy(_cu);
  camera.lookAt(_cl);
  camY = camera.position.y;
  var fov = 65 + Math.min(25, hs * 0.05) + S.boostVis * 8;
  if (Math.abs(fov - lastFov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }
}
function updateCamera(dt, hs){
  if (RA && RA.pad && RA.camOn && VD.flight === 'rocket' && camMode <= 1 && !S.crashed) { padCamera(dt); return; }
  if (VD.flight && !S.crashed && camMode <= 1) { flightCamera(dt, hs); return; }
  flightCamInit = false; camera.up.copy(UPV);
  var targetYaw = camYaw;
  if (!S.crashed) {
    if (S.grounded) targetYaw = S.yaw;
    else if (hs > 2) targetYaw = Math.atan2(S.vx, S.vz);
  }
  var dy = targetYaw - camYaw;
  dy = ((dy + Math.PI) % TAU + TAU) % TAU - Math.PI;
  camYaw += dy * (1 - Math.exp(-5 * dt));
  var fov = 70 + Math.min(30, hs * 0.12) + S.boostVis * 8;
  VD.obj.rider.head.visible = camMode !== 2;
  if (camMode === 2) {
    _cp.set(VD.fpv[0], VD.fpv[1] - VD.com + S.bounce, VD.fpv[2]).applyQuaternion(S.q).add(S.pos);
    camera.position.copy(_cp);
    camera.quaternion.copy(S.q).multiply(FLIPY);
    camY = _cp.y; fov += 8;
  } else if (camMode === 3) {
    var dirx = hs > 1 ? (S.grounded ? Math.sin(S.yaw) : S.vx / hs) : Math.sin(S.yaw), dirz = hs > 1 ? (S.grounded ? Math.cos(S.yaw) : S.vz / hs) : Math.cos(S.yaw);
    var far = cine ? Math.hypot(cine.x - S.pos.x, cine.z - S.pos.z) : 1e9;
    var behind = cine ? ((cine.x - S.pos.x) * dirx + (cine.z - S.pos.z) * dirz) < -25 : true;
    if (!cine || far > 140 || behind) {
      var ahead = 30 + Math.min(120, hs * 0.8), sideOff = (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8);
      var cx = S.pos.x + dirx * ahead + dirz * sideOff, cz = S.pos.z + dirz * ahead - dirx * sideOff;
      cine = { x: cx, z: cz, y: Math.max(heightAt(cx, cz) + 2 + Math.random() * 6, S.grounded ? 0 : S.pos.y - 10) };
    }
    camera.position.set(cine.x, cine.y, cine.z);
    camera.lookAt(S.pos.x, S.pos.y + 0.6, S.pos.z);
    camY = cine.y; fov = 55;
  } else {
    var dist = (camMode === 0 ? VD.camDist : VD.camDist * 0.62) + Math.min(6, hs / 30) + S.boostVis * 1.5;
    var hgt = camMode === 0 ? VD.camH : VD.camH * 0.65;
    var tx = S.pos.x - Math.sin(camYaw) * dist, tz = S.pos.z - Math.cos(camYaw) * dist;
    camY += (S.pos.y + hgt - camY) * (1 - Math.exp(-7 * dt));
    var gy = heightAt(tx, tz) + 1.2;
    if (camY < gy) camY = gy;
    var shake = Math.min(1, hs / 150) * 0.06 + Math.max(S.thrustVis, S.boostVis) * 0.06 + Math.max(0, shakeT) * 0.9 + (hyper.phase === 1 ? hyper.t * 0.25 : hyper.phase === 2 ? 0.12 : 0);
    camera.position.set(tx + (Math.random() - 0.5) * shake, camY + (Math.random() - 0.5) * shake, tz);
    camera.lookAt(S.pos.x, S.pos.y + VD.look, S.pos.z);
  }
  if (hyper.fov) fov = Math.min(125, fov + hyper.fov);
  if (Math.abs(fov - lastFov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); lastFov = fov; }
}

/* ================= wildlife: tumbleweeds & vultures ================= */
var tumbleMat = new THREE.MeshLambertMaterial({ color: 0x9a7444, wireframe: true });
var tumbleGeo = new THREE.IcosahedronGeometry(0.9, 1);
var WIND = v(1, 0, 0.35).normalize();
var tumbles = [];
for (var tw = 0; tw < 12; tw++) {
  var tm = new THREE.Group();
  var t1 = new THREE.Mesh(tumbleGeo, tumbleMat); tm.add(t1);
  var t2 = new THREE.Mesh(tumbleGeo, tumbleMat); t2.rotation.set(0.7, 0.4, 0.2); t2.scale.setScalar(0.8); tm.add(t2);
  scene.add(tm);
  tumbles.push({ m: tm, x: 1e9, z: 1e9, sp: 5 + Math.random() * 5, ph: Math.random() * 10, s: 0.7 + Math.random() * 0.6 });
}
var vultureMat = std(0x2a211c, 0.9), vultures = [];
for (var vw = 0; vw < 6; vw++) {
  var vg = new THREE.Group();
  box(0.35, 0.22, 1.0, vultureMat, vg, 0, 0, 0);
  box(0.18, 0.16, 0.25, std(0xc9a48a, 0.8), vg, 0, 0.05, 0.6);
  var wl = grp(vg, 0.15, 0, 0), wr = grp(vg, -0.15, 0, 0);
  box(1.8, 0.04, 0.6, vultureMat, wl, 0.9, 0, 0); box(1.8, 0.04, 0.6, vultureMat, wr, -0.9, 0, 0);
  vg.scale.setScalar(1.6); scene.add(vg);
  vultures.push({ m: vg, wl: wl, wr: wr, a: vw / 6 * TAU, r: 30 + vw * 7, h: 55 + vw * 6, sp: 0.25 + vw * 0.03 });
}
var vCenter = { x: 0, z: 0 }, animT = 0;
function updateWildlife(dt){
  animT += dt;
  tumbles.forEach(function(t){
    var dx = t.x - S.pos.x, dz = t.z - S.pos.z;
    if (dx * dx + dz * dz > 260 * 260) {
      var a = Math.random() * TAU, r = 60 + Math.random() * 160;
      t.x = S.pos.x + Math.cos(a) * r - WIND.x * 80; t.z = S.pos.z + Math.sin(a) * r - WIND.z * 80;
    }
    t.x += WIND.x * t.sp * dt; t.z += WIND.z * t.sp * dt;
    var bounce = Math.abs(Math.sin(animT * 2.2 + t.ph)) * 1.2;
    t.m.position.set(t.x, heightAt(t.x, t.z) + 0.8 * t.s + bounce, t.z);
    t.m.rotation.z -= t.sp * dt / 0.9; t.m.rotation.y = 0.35; t.m.scale.setScalar(t.s);
  });
  if (Math.hypot(vCenter.x - S.pos.x, vCenter.z - S.pos.z) > 300) { vCenter.x = S.pos.x + 80; vCenter.z = S.pos.z + 120; }
  vultures.forEach(function(b, i){
    b.a += b.sp * dt;
    var x = vCenter.x + Math.cos(b.a) * b.r, z = vCenter.z + Math.sin(b.a) * b.r;
    b.m.position.set(x, baseHeight(x, z) + b.h, z);
    b.m.rotation.set(0, -b.a, 0.25);
    var flap = Math.sin(animT * 7 + i) * (Math.sin(animT * 0.5 + i) > 0.6 ? 0.5 : 0.06);
    b.wl.rotation.z = flap; b.wr.rotation.z = -flap;
  });
}

/* ================= clouds, blowing sand, tyre tracks ================= */
var cloudMat = new THREE.SpriteMaterial({ map: cloudTexture(), color: 0xffffff, transparent: true, opacity: 0.85, fog: false, depthWrite: false });
var clouds = [];
for (var ci2 = 0; ci2 < 26; ci2++) {
  var sp = new THREE.Sprite(cloudMat);
  var w2 = 380 + Math.random() * 520;
  sp.scale.set(w2, w2 * (0.3 + Math.random() * 0.15), 1);
  sp.renderOrder = -1; scene.add(sp);
  clouds.push({ m: sp, ox: (Math.random() - 0.5) * 4400, oz: (Math.random() - 0.5) * 4400, y: 520 + Math.random() * 300 });
}
function updateClouds(dt){
  clouds.forEach(function(c){
    c.ox += WIND.x * 6 * dt; c.oz += WIND.z * 6 * dt;
    if (c.ox > 2200) c.ox -= 4400; if (c.ox < -2200) c.ox += 4400;
    if (c.oz > 2200) c.oz -= 4400; if (c.oz < -2200) c.oz += 4400;
    c.m.position.set(camera.position.x + c.ox, c.y, camera.position.z + c.oz);
  });
}
var WS_N = 420, wsPos = new Float32Array(WS_N * 3), wsVel = new Float32Array(WS_N);
var wsGeo = new THREE.BufferGeometry(); wsGeo.setAttribute('position', new THREE.BufferAttribute(wsPos, 3));
var windSand = new THREE.Points(wsGeo, new THREE.PointsMaterial({ map: SOFT, color: 0xead2a8, size: 0.35, transparent: true, opacity: 0.6, depthWrite: false }));
windSand.frustumCulled = false; scene.add(windSand);
for (var wi2 = 0; wi2 < WS_N; wi2++) { wsPos[wi2 * 3] = 1e9; wsVel[wi2] = 10 + Math.random() * 10; }
function updateWindSand(dt){
  var cx = camera.position.x, cz = camera.position.z;
  for (var i = 0; i < WS_N; i++) {
    var o = i * 3, x = wsPos[o], z = wsPos[o + 2];
    if (Math.abs(x - cx) > 70 || Math.abs(z - cz) > 70) {
      x = cx + (Math.random() - 0.5) * 140; z = cz + (Math.random() - 0.5) * 140;
      wsPos[o + 1] = baseHeight(x, z) + 0.1 + Math.random() * Math.random() * 3;
    }
    wsPos[o] = x + WIND.x * wsVel[i] * dt; wsPos[o + 2] = z + WIND.z * wsVel[i] * dt;
    wsPos[o + 1] += Math.sin(animT * 3 + i) * 0.4 * dt;
  }
  wsGeo.attributes.position.needsUpdate = true;
}
var TRACK_N = 1200;
var trackGeo = new THREE.PlaneGeometry(1, 1); trackGeo.rotateX(-Math.PI / 2);
var tracks = new THREE.InstancedMesh(trackGeo, new THREE.MeshBasicMaterial({ color: 0x6b4a2a, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), TRACK_N);
tracks.frustumCulled = false; tracks.renderOrder = 1; scene.add(tracks);
var _tm = new THREE.Matrix4(), _tp = new V3(), _ts = new V3(), _tq = new THREE.Quaternion(), _tn = new V3(), trackIdx = 0, trackLast = [];
_tm.makeScale(0, 0, 0);
for (var ti2 = 0; ti2 < TRACK_N; ti2++) tracks.setMatrixAt(ti2, _tm);
function updateTracks(){
  var pts = VD.obj.dust, on = S.grounded && !S.crashed && Math.abs(S.speed) > 1;
  if (!on) { trackLast.length = 0; return; }
  var any = false;
  for (var k = 0; k < pts.length; k++) {
    var dp = pts[k];
    _tp.set(dp[0], 0, dp[2]).applyQuaternion(S.q).add(S.pos);
    var last = trackLast[k];
    if (!last) { trackLast[k] = { x: _tp.x, z: _tp.z }; continue; }
    var dx = _tp.x - last.x, dz = _tp.z - last.z, d = Math.hypot(dx, dz);
    if (d < 0.8) continue;
    if (d < 12) {
      var mx = (last.x + _tp.x) / 2, mz = (last.z + _tp.z) / 2, gh = heightAt(mx, mz);
      groundQuat(Math.atan2(dx, dz), normalAt(mx, mz, _tn), 0, _tq);
      _ts.set(VD.width > 0.5 ? 0.42 : 0.2, 1, d);
      _tm.compose(_tp.set(mx, gh + 0.04, mz), _tq, _ts);
      tracks.setMatrixAt(trackIdx, _tm); trackIdx = (trackIdx + 1) % TRACK_N; any = true;
    }
    trackLast[k] = { x: last.x + dx, z: last.z + dz };
  }
  if (any) tracks.instanceMatrix.needsUpdate = true;
}

/* ================= glow (bloom) — only if the extra scripts loaded ================= */
var composer = null, bloomPass = null;
function setupBloom(){
  if (composer || !THREE.EffectComposer || !THREE.RenderPass || !THREE.UnrealBloomPass) return;
  try {
    var pr = renderer.getPixelRatio();
    var rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { type: THREE.HalfFloatType });
    composer = new THREE.EffectComposer(renderer, rt);
    composer.addPass(new THREE.RenderPass(scene, camera));
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.45, 0.98);
    composer.addPass(bloomPass);
    composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
  } catch (e) { composer = null; bloomPass = null; }
}
function applyQuality(){
  var high = prefs.quality === 'high';
  applyPixelRatio(); renderer.setSize(innerWidth, innerHeight);
  sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  terrain.material = sandFast;
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(innerWidth, innerHeight); }
  windSand.visible = high;
}

/* ================= admin wings ================= */
function updateWings(dt){
  var V = VD.obj;
  if (!V.wingL) return;
  var stowed = !S.wingsOut || hyperActive();
  var target = (!S.grounded && !S.crashed && !stowed) ? 1 : 0;
  S.wing += (target - S.wing) * (1 - Math.exp(-(target ? 7 : 4) * dt));
  S.wingTuck += ((stowed ? 1 : 0) - S.wingTuck) * (1 - Math.exp(-6 * dt));
  if (S.flapT > 0) S.flapT -= dt;
  if (S.flapCool > 0) S.flapCool -= dt;
  var flap = S.flapT > 0 ? Math.cos((1 - S.flapT / 0.4) * TAU) * 0.8 : Math.sin(animT * 2.4) * 0.12;
  var fold = 1 - S.wing;
  var ry = 1.35 * fold + 0.2 * S.wingTuck, rz = -0.3 * fold + (flap + 0.18) * S.wing, sc = (0.55 + 0.45 * S.wing) * (1 - 0.85 * S.wingTuck);
  V.wingL.visible = V.wingR.visible = S.wingTuck < 0.97;
  V.wingL.rotation.set(0, ry, rz); V.wingR.rotation.set(0, -ry, -rz);
  V.wingL.scale.setScalar(sc); V.wingR.scale.setScalar(sc);
  if (S.wing > 0.6 && !paused && Math.random() < 0.7) {   // sparkle trail off the wingtips
    for (var s = -1; s <= 1; s += 2) {
      _p.set(s * 2.3 * sc, 1.5 - VD.com, -0.9).applyQuaternion(S.q).add(S.pos);
      spawnP(sparkle, _p.x, _p.y, _p.z, -S.vx * 0.1, 0, -S.vz * 0.1, 1, 0.5);
    }
  }
}

/* ================= hyperspace (Admin Bike) ================= */
var HYPER_ADD = 10000 / 3.6;            // +10,000 km/h on entry
var HYPER_ACC = 5000 / 3.6;             // then keeps speeding up by 5,000 km/h every second (x3 overclocked)
var hyper = { phase: 0, t: 0, base: 0, rel: 6, cool: 0, vis: 0, fov: 0 };   // phase: 0 off, 1 charging, 2 in hyperspace, 3 dropping out
function hyperActive(){ return hyper.phase === 1 || hyper.phase === 2; }
function startHyper(){
  if (hyper.phase !== 0 || hyper.cool > 0 || S.crashed) return;
  hyper.phase = 1; hyper.t = 0;
  toast('🌌 HYPERDRIVE CHARGING…', '#9fd8ff'); sfx('hyperCharge');
}
function enterHyper(){
  var hsNow = S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vz);
  if (!S.grounded && hsNow > 2) S.yaw = Math.atan2(S.vx, S.vz);
  hyper.base = Math.max(hsNow, 40);
  hyper.rel = Math.max(6, Math.min(600, S.pos.y - VD.com - baseHeight(S.pos.x, S.pos.z)));
  hyper.phase = 2; hyper.t = 0;
  bankWheelie();
  S.grounded = false; S.airT = 0; S.tricks = {}; S.trickPts = 0; S.angV.set(0, 0, 0); S.wheelie = 0;
  S.hyperSpeed = hyper.base + HYPER_ADD;
  var fl = $('flash'); fl.className = 'hud blue'; void fl.offsetWidth; fl.className = 'hud blue show';
  shockT = 1.5; shakeT = 0.8;
  shockRing.position.copy(S.pos); shockRing2.position.copy(S.pos);
  shockRing.quaternion.setFromUnitVectors(AZ, tmpV.set(Math.sin(S.yaw), 0, Math.cos(S.yaw))); shockRing2.quaternion.copy(shockRing.quaternion);
  for (var i = 0; i < 90; i++) spawnP(fire, S.pos.x, S.pos.y, S.pos.z, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 50, 6, 0.8);
  var pts = Math.round(10000 * VD.pts); S.score += pts;
  toast('🌌 HYPERSPACE!  +10,000 KM/H, THEN +5,000 EVERY SECOND  ·  ' + keyName(binds.thrust) + ' to drop out', '#9fd8ff');
  sfx('hyperJump'); missionEvent('hyper', 1);
}
function exitHyper(){
  hyper.phase = 3; hyper.t = 0; hyper.cool = 1.2;
  var hFull = heightAt(S.pos.x, S.pos.z);
  if (S.pos.y < hFull + VD.com + 0.5) S.pos.y = hFull + VD.com + 0.5;
  S.speed = S.horiz = S.hyperSpeed;          // you keep the hyperspace speed!
  takeoff();
  S.vy = 0; S.launchKind = null; S.launchDone = true;
  var fl = $('flash'); fl.className = 'hud blue'; void fl.offsetWidth; fl.className = 'hud blue show';
  toast('DROPPED OUT OF HYPERSPACE · ' + fmt(S.hyperSpeed * 3.6) + ' KM/H KEPT!', '#9fd8ff'); sfx('hyperExit');
}
function cancelHyper(){
  if (hyper.phase === 0) return;
  hyper.phase = 0; hyper.t = 0; hyper.vis = 0;
}
function stepHyper(dt, inp){
  hyper.t += dt;
  var steer = Math.max(-1, Math.min(1, ((inp.left ? 1 : 0) - (inp.right ? 1 : 0)) + ((inp.rollL ? 1 : 0) - (inp.rollR ? 1 : 0))));
  S.steerS += (steer - S.steerS) * (1 - Math.exp(-5 * dt));
  S.yaw += S.steerS * 0.7 * dt;
  hyper.rel = Math.max(4, Math.min(1500, hyper.rel + ((inp.back ? 1 : 0) - (inp.front ? 1 : 0)) * 150 * dt));   // ↓ climb, ↑ dive
  var fx = Math.sin(S.yaw), fz = Math.cos(S.yaw), sp = S.hyperSpeed;
  S.pos.x += fx * sp * dt; S.pos.z += fz * sp * dt;
  // look ahead and rise smoothly over the dunes
  var floor = -1e9;
  for (var k = 0; k <= 5; k++) { var d = k * k * 20; floor = Math.max(floor, baseHeight(S.pos.x + fx * d, S.pos.z + fz * d)); }
  var target = floor + VD.com + hyper.rel, hereMin = heightAt(S.pos.x, S.pos.z) + VD.com + 2;
  var ny = S.pos.y + (target - S.pos.y) * (1 - Math.exp(-5 * dt));
  if (ny < hereMin) ny = hereMin;
  S.vy = (ny - S.pos.y) / dt; S.pos.y = ny;
  S.vx = fx * sp; S.vz = fz * sp; S.horiz = S.speed = sp;
  groundQuat(S.yaw, AY, -S.steerS * 0.5, S.q);
  S.q.multiply(tmpQ.setFromAxisAngle(AX, -Math.atan2(S.vy, sp) * 0.6));
  S.hyperSpeed += HYPER_ACC * (S.overclock ? 3 : 1) * dt;      // no limit: it keeps accelerating until you drop out
  S.score += 1500 * VD.pts * dt;
}
// the lightspeed tunnel: star streaks drawn on an overlay canvas
var hyperCv = $('hyper'), hctx = hyperCv.getContext('2d'), hyperTint = $('hyperTint'), streaks = [];
for (var hs1 = 0; hs1 < 260; hs1++) streaks.push({ a: Math.random() * TAU, r: Math.random(), sp: 0.6 + Math.random() * 1.4, w: 0.6 + Math.random() * 1.8, b: Math.random() < 0.3 });
function sizeHyper(){ hyperCv.width = Math.round(innerWidth * 0.75); hyperCv.height = Math.round(innerHeight * 0.75); }
sizeHyper();
var hyperShown = false;
function drawHyper(dt){
  if (hyper.phase === 1) hyper.vis = 0.35 * Math.min(1, hyper.t / 0.75);
  else if (hyper.phase === 2) hyper.vis += (1 - hyper.vis) * (1 - Math.exp(-14 * dt));
  else hyper.vis *= Math.exp(-6 * dt);
  hyper.fov = hyper.phase === 1 ? -14 * Math.min(1, hyper.t / 0.75) : 40 * hyper.vis;
  var I = hyper.vis;
  if (I < 0.01) {
    if (hyperShown) { hctx.clearRect(0, 0, hyperCv.width, hyperCv.height); hyperCv.style.opacity = '0'; hyperTint.style.opacity = '0'; hyperShown = false; }
    return;
  }
  hyperShown = true; hyperCv.style.opacity = '1'; hyperTint.style.opacity = (I * 0.85).toFixed(2);
  var W = hyperCv.width, H = hyperCv.height, cx = W / 2, cy = H * 0.45, R = Math.hypot(W, H) * 0.55;
  hctx.clearRect(0, 0, W, H);
  var g = hctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
  g.addColorStop(0, 'rgba(200,230,255,' + (0.4 * I).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,170,255,0)');
  hctx.fillStyle = g; hctx.fillRect(0, 0, W, H);
  var stretch = hyper.phase === 2 ? 0.28 + 0.08 * Math.sin(animT * 40) : hyper.phase === 1 ? 0.02 + 0.12 * Math.min(1, hyper.t / 0.75) : 0.3 * I;
  var move = hyper.phase === 2 ? 3.2 : hyper.phase === 1 ? 0.5 : 1.2 * I;
  hctx.lineCap = 'round';
  for (var i = 0; i < streaks.length; i++) {
    var st = streaks[i];
    st.r += st.sp * move * dt * (0.4 + st.r);
    if (st.r > 1.25) { st.r = 0.03 + Math.random() * 0.25; st.a = Math.random() * TAU; }
    var r0 = st.r * R, r1 = (st.r + stretch * (0.3 + st.r)) * R, ca = Math.cos(st.a), sa = Math.sin(st.a);
    hctx.strokeStyle = st.b ? 'rgba(140,200,255,' + (I * 0.9).toFixed(3) + ')' : 'rgba(235,245,255,' + (I * 0.85).toFixed(3) + ')';
    hctx.lineWidth = st.w * (0.5 + st.r * 2);
    hctx.beginPath(); hctx.moveTo(cx + ca * r0, cy + sa * r0); hctx.lineTo(cx + ca * r1, cy + sa * r1); hctx.stroke();
  }
}
// a cheaper, wider terrain used while in hyperspace (you cover ~46 m every frame)
var LT_SIZE = 3000, LT_SEG = 120;
var lGeo = new THREE.PlaneGeometry(LT_SIZE, LT_SIZE, LT_SEG, LT_SEG); lGeo.rotateX(-Math.PI / 2);
var lPos = lGeo.attributes.position, lUV = lGeo.attributes.uv, lBase = new Float32Array(lPos.count * 2), lCol = new Float32Array(lPos.count * 3);
for (var li = 0; li < lPos.count; li++) { lBase[li * 2] = lPos.getX(li); lBase[li * 2 + 1] = lPos.getZ(li); }
lGeo.setAttribute('color', new THREE.BufferAttribute(lCol, 3));
var lowTerrain = new THREE.Mesh(lGeo, sandFast); lowTerrain.visible = false; lowTerrain.frustumCulled = false; lowTerrain.receiveShadow = true; scene.add(lowTerrain);
var lCenter = { x: 1e9, z: 1e9 };
var fastMode = false;
function fastRebuild(lx, lz, dx, dz){
  rebuildLowTerrain(lx, lz);
  var ox = S.pos.x + dx * 500, oz = S.pos.z + dz * 500;     // cacti, coins, ramps and rocks just ahead
  placeScatter(ox, oz); placeFeatures(ox, oz); placeRocks(ox, oz);
}
function rebuildLowTerrain(cx, cz){
  var LC = LT_SIZE / LT_SEG;
  cx = Math.round(cx / LC) * LC; cz = Math.round(cz / LC) * LC; lCenter.x = cx; lCenter.z = cz;
  for (var i = 0; i < lPos.count; i++) {
    var x = cx + lBase[i * 2], z = cz + lBase[i * 2 + 1], h = baseHeight(x, z);
    lPos.setXYZ(i, x, h, z); lUV.setXY(i, x / 7, z / 7);
    sandColor(x, z, h, 0, 0, _sc);
    lCol[i * 3] = _sc[0]; lCol[i * 3 + 1] = _sc[1]; lCol[i * 3 + 2] = _sc[2];
  }
  lPos.needsUpdate = true; lUV.needsUpdate = true; lGeo.attributes.color.needsUpdate = true;
  lGeo.computeVertexNormals();
}

/* ================= sound barrier ================= */
var SOUND_SPEED = 343;                 // m/s, about 1,235 km/h
var vaporMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
var vapor = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 48, 1, true), vaporMat); vapor.visible = false; vapor.frustumCulled = false; scene.add(vapor);
var shockMat = new THREE.MeshBasicMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
var shockRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 8, 72), shockMat); shockRing.visible = false; scene.add(shockRing);
var shockRing2 = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 8, 72), shockMat); shockRing2.visible = false; scene.add(shockRing2);
var shockT = 0, shakeT = 0, machLevel = 0, _dir = new V3();
function sonicBoom(level){
  shockT = 1.5; shakeT = 0.9;
  shockRing.position.copy(S.pos); shockRing.quaternion.setFromUnitVectors(AZ, _dir);
  shockRing2.position.copy(S.pos); shockRing2.quaternion.copy(shockRing.quaternion);
  var pts = Math.round(25000 * level * VD.pts); S.score += pts;
  toast('💥 SONIC BOOM! MACH ' + level + '  +' + fmt(pts), '#ffffff');
  var fl = $('flash'); fl.className = 'hud'; void fl.offsetWidth; fl.className = 'hud show';
  for (var i = 0; i < 80; i++) spawnP(splashP, S.pos.x, S.pos.y, S.pos.z, (Math.random() - 0.5) * 40, (Math.random() - 0.3) * 20, (Math.random() - 0.5) * 40, 4, 1.2);
  sfx('boom'); missionEvent('sonic', 1);
}
function updateSonic(dt, hs){
  if (S.grounded) _dir.set(Math.sin(S.yaw) * S.horiz, S.vy, Math.cos(S.yaw) * S.horiz); else _dir.set(S.vx, S.vy, S.vz);
  var spd = _dir.length(); if (spd > 0.01) _dir.divideScalar(spd); else _dir.set(Math.sin(S.yaw), 0, Math.cos(S.yaw));
  var mach = spd / SOUND_SPEED;
  if (hyper.phase >= 2) machLevel = Math.max(machLevel, Math.floor(mach));
  else if (!paused && !S.crashed) {
    if (Math.floor(mach) > machLevel) { machLevel = Math.floor(mach); if (machLevel <= 5 || machLevel % 5 === 0) sonicBoom(machLevel); }
    else if (machLevel > 0 && mach < machLevel - 0.08) machLevel--;
  }
  var mf = mach - Math.round(mach);
  var vo = mach > 0.8 ? Math.exp(-Math.pow(mf / 0.07, 2)) * 0.6 + (mach > 1 ? 0.12 : 0) : 0;
  if (vo > 0.01 && !S.crashed && hyper.phase < 2) {
    var size = VD.blob[1] * 0.9;
    vapor.visible = true; vapor.scale.set(size * 0.75, size * 1.5, size * 0.75);
    vapor.quaternion.setFromUnitVectors(UPV, _dir);
    vapor.position.copy(S.pos).addScaledVector(_dir, -size * 0.35);
    vaporMat.opacity = vo * (0.75 + Math.random() * 0.5);
  } else vapor.visible = false;
  if (shockT > 0) {
    shockT -= dt; var k = 1 - shockT / 1.5;
    shockRing.scale.setScalar(2 + k * 90); shockRing2.scale.setScalar(1 + k * 55);
    shockMat.opacity = Math.max(0, 1 - k) * 0.85; shockRing.visible = shockRing2.visible = true;
  } else shockRing.visible = shockRing2.visible = false;
  if (shakeT > 0) shakeT -= dt;
  return mach;
}

/* ================= time of day ================= */
var TIMES = {
  day: { label: '☀️ Day', top: 0x2a74d4, mid: 0x8ec2ef, horizon: 0xf4d9b2, ground: 0xc99a68, sun: [0.5, 0.48, 0.42], sunCol: 0xffe4bd, sunI: 1.25,
    hemiSky: 0xc4e0ff, hemiGround: 0xc8925c, hemiI: 0.6, fog: 0xf4d9b2, near: 200, far: 780, glow: 1, disc: 0xfffaeb, discAmt: 1.5, mesa: 0xe2b993, mesa2: 0xeac7a3, stars: false, lights: 0, cloud: 0xffffff, cloudA: 0.85, water: 0x2a8fbf, bloom: 0.45 },
  sunset: { label: '🌅 Sunset', top: 0x23306e, mid: 0xc8705a, horizon: 0xffb070, ground: 0x9c6448, sun: [0.75, 0.1, 0.35], sunCol: 0xff9a55, sunI: 1.4,
    hemiSky: 0xffb08a, hemiGround: 0x7a4a3a, hemiI: 0.5, fog: 0xf5a86e, near: 180, far: 720, glow: 1.6, disc: 0xffd7a0, discAmt: 1.8, mesa: 0xc77a5c, mesa2: 0xd48a66, stars: false, lights: 1.5, cloud: 0xffb48a, cloudA: 0.9, water: 0x3a6f9a, bloom: 0.7 },
  night: { label: '🌙 Night', top: 0x03081a, mid: 0x0b1530, horizon: 0x1d2847, ground: 0x15151f, sun: [-0.35, 0.55, 0.4], sunCol: 0x8fa8ff, sunI: 0.45,
    hemiSky: 0x4a5c90, hemiGround: 0x2a2234, hemiI: 0.4, fog: 0x1a2340, near: 110, far: 560, glow: 0.25, disc: 0xe8eeff, discAmt: 1.2, mesa: 0x2a3150, mesa2: 0x323a5c, stars: true, lights: 3.5, cloud: 0x2c3556, cloudA: 0.55, water: 0x14304a, bloom: 0.9 }
};
var curT = null, lastAltF = -1, _sc1 = new THREE.Color(), SPACE_TOP = new THREE.Color(0x01030b), SPACE_MID = new THREE.Color(0x07112a);
function altitudeSky(alt){
  if (!curT) return;
  var f = Math.max(0, Math.min(1, (alt - 500) / 4000));
  if (Math.abs(f - lastAltF) < 0.003 && !(f === 0 && lastAltF !== 0)) return;
  lastAltF = f;
  var u = sky.material.uniforms;
  u.top.value.setHex(curT.top).lerp(SPACE_TOP, f);
  u.mid.value.setHex(curT.mid).lerp(SPACE_MID, f * 0.9);
  stars.visible = curT.stars || f > 0.35;
  scene.fog.near = curT.near + Math.max(0, alt) * 0.9; scene.fog.far = curT.far + Math.max(0, alt) * 1.6;
}
function applyTime(){
  if (!TIMES[prefs.time]) prefs.time = 'day';
  var T = TIMES[prefs.time]; curT = T; lastAltF = -1;
  SUN_DIR.set(T.sun[0], T.sun[1], T.sun[2]).normalize();
  [sky.material, envSky.material].forEach(function(mt){
    var u = mt.uniforms;
    u.top.value.setHex(T.top); u.mid.value.setHex(T.mid); u.horizon.value.setHex(T.horizon); u.ground.value.setHex(T.ground);
    u.glowAmt.value = T.glow; u.discCol.value.setHex(T.disc); u.discAmt.value = T.discAmt;
  });
  scene.fog.color.setHex(T.fog); scene.fog.near = T.near; scene.fog.far = T.far;
  sun.color.setHex(T.sunCol); sun.intensity = T.sunI;
  hemi.color.setHex(T.hemiSky); hemi.groundColor.setHex(T.hemiGround); hemi.intensity = T.hemiI;
  mesaMat.color.setHex(T.mesa); mesaMat2.color.setHex(T.mesa2);
  stars.visible = T.stars;
  cloudMat.color.setHex(T.cloud); cloudMat.opacity = T.cloudA;
  waterMat.color.setHex(T.water);
  if (bloomPass) bloomPass.strength = T.bloom;
  headlight.intensity = T.lights;
  ringMat.emissiveIntensity = T.stars ? 2.4 : 1.6;
  rebuildEnv();
}

/* ================= Score Attack ================= */
var attack = { active: false, t: 0 };
function startRun(){
  S.score = 0; S.chain = 1; S.chainT = 0; S.runCoins = 0; S.boost = 1; lastScore = -1;
  respawn();
  attack.active = prefs.mode === 'attack'; attack.t = 120;
  if (attack.active) toast('SCORE ATTACK! 2 MINUTES — GO!', '#ffe14d');
}
function endRun(){
  attack.active = false; paused = true;
  var entry = { s: S.score, v: VD.name, d: new Date().toLocaleDateString() };
  topRuns.push(entry);
  topRuns.sort(function(a, b){ return b.s - a.s; });
  topRuns = topRuns.slice(0, 5);
  save('duneRider.top', topRuns);
  $('resScore').textContent = fmt(S.score);
  var rank = topRuns.indexOf(entry);
  $('resNote').textContent = rank === 0 ? 'NEW BEST RUN!' : (rank > 0 ? 'You made the top 5 at #' + (rank + 1) + '!' : 'So close — try again!');
  $('resList').innerHTML = topRuns.map(function(r, i){ return '<div class="' + (r === entry ? 'me' : '') + '"><span>#' + (i + 1) + ' · ' + r.v + '</span><span>' + fmt(r.s) + '</span></div>'; }).join('');
  $('results').classList.add('show');
  sfx('level');
}

/* ================= menu / input wiring ================= */
var menu = $('menu');
function renderVehicles(){
  var el = $('vehicles'); el.innerHTML = '';
  VEH_ORDER.forEach(function(key){
    var d = VDEF[key], b = document.createElement('button');
    b.className = 'veh' + (key === cur ? ' sel' : '');
    b.innerHTML = '<div class="ic">' + d.icon + '</div><b>' + d.name + '</b><span>' + d.desc + '</span>';
    b.onclick = function(){ setVehicle(key); sfx('click'); };
    el.appendChild(b);
  });
}
function renderPaints(){
  var el = $('paints'); el.innerHTML = '';
  var def = document.createElement('button'); def.className = 'swatch' + (prefs.paint[cur] == null ? ' on' : '');
  def.textContent = '↺'; def.title = 'Original'; def.style.background = '#3a2a6a';
  def.onclick = function(){ delete prefs.paint[cur]; saveSettings(); applyPaint(cur); renderPaints(); };
  el.appendChild(def);
  PAINTS.forEach(function(p, i){
    var b = document.createElement('button'), locked = p[2] && progress.level < p[2];
    b.className = 'swatch' + (prefs.paint[cur] === i ? ' on' : '') + (locked ? ' lock' : '');
    b.title = p[0] + (locked ? ' (unlocks at LV ' + p[2] + ')' : '');
    b.style.background = p[3] === 'rainbow' ? 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' :
      p[3] === 'gold' ? 'linear-gradient(135deg,#fff3a8,#d4a017,#7a5600)' : p[3] === 'chrome' ? 'linear-gradient(135deg,#ffffff,#9aa4b0,#ffffff)' : '#' + new THREE.Color(p[1]).getHexString();
    if (locked) b.textContent = '🔒';
    b.onclick = function(){ if (locked) { toast('Reach LV ' + p[2] + ' to unlock ' + p[0], '#ffb35c'); return; } prefs.paint[cur] = i; saveSettings(); applyPaint(cur); renderPaints(); sfx('click'); };
    el.appendChild(b);
  });
}
function renderModes(){
  var el = $('modeRow'); el.innerHTML = '';
  [['free', '🏜️ Free Ride'], ['attack', '⏱ Score Attack (2:00)']].forEach(function(m){
    var b = document.createElement('button'); b.className = 'chip' + (prefs.mode === m[0] ? ' sel' : ''); b.textContent = m[1];
    b.onclick = function(){ prefs.mode = m[0]; saveSettings(); if (m[0] === 'free') attack.active = false; renderModes(); sfx('click'); };
    el.appendChild(b);
  });
  var sr = $('sandRow'); sr.innerHTML = '';
  Object.keys(GRAVITY).forEach(function(k){
    var b = document.createElement('button'); b.className = 'chip' + (prefs.grav === k ? ' sel' : ''); b.textContent = GRAVITY[k][0] + ' gravity';
    b.onclick = function(){ prefs.grav = k; applyGravity(); saveSettings(); renderModes(); sfx('click'); };
    sr.appendChild(b);
  });
  [['god', '🛡 No-crash mode']].forEach(function(t){
    var b = document.createElement('button'); b.className = 'chip' + (prefs[t[0]] ? ' sel' : ''); b.textContent = t[1] + (prefs[t[0]] ? ': ON' : ': OFF');
    b.onclick = function(){ prefs[t[0]] = !prefs[t[0]]; saveSettings(); renderModes(); sfx('click'); };
    sr.appendChild(b);
  });
  var tl = $('timeRow'); tl.innerHTML = '';
  ['day', 'sunset', 'night'].forEach(function(k){
    var b = document.createElement('button'); b.className = 'chip' + (prefs.time === k ? ' sel' : ''); b.textContent = TIMES[k].label;
    b.onclick = function(){ prefs.time = k; saveSettings(); applyTime(); renderModes(); sfx('click'); };
    tl.appendChild(b);
  });
}
function renderBinds(){
  var el = $('binds'); el.innerHTML = '';
  ACTIONS.forEach(function(a){
    var row = document.createElement('div'); row.className = 'bind';
    var lab = document.createElement('span'); lab.textContent = a[1];
    var b = document.createElement('button');
    b.textContent = listening === a[0] ? 'Press a key…' : keyName(binds[a[0]]);
    if (listening === a[0]) b.className = 'listen';
    b.onclick = function(e){ e.stopPropagation(); listening = a[0]; renderBinds(); };
    row.appendChild(lab); row.appendChild(b); el.appendChild(row);
  });
  $('unitsBtn').textContent = 'Units: ' + (prefs.units === 'mph' ? 'MPH' : 'KM/H');
  $('soundBtn').textContent = 'Sound: ' + (prefs.sound ? 'On' : 'Off');
  $('qualityBtn').textContent = 'Graphics: ' + (prefs.quality === 'high' ? 'High' : 'Fast');
  $('boostKey').textContent = 'hold ' + keyName(binds.boost);
}
function openMenu(){
  paused = true; listening = null; renderBinds(); renderVehicles(); renderPaints(); renderModes();
  menu.classList.add('show');
  $('playBtn').textContent = (prefs.mode === 'attack' && !attack.active) ? 'START RUN' : (S.score || S.speed ? 'RESUME' : 'RIDE');
}
function closeMenu(){
  paused = false; listening = null; menu.classList.remove('show'); keys = {}; initAudio(); clock.getDelta();
  if (prefs.mode === 'attack' && !attack.active) startRun();
}
$('playBtn').onclick = closeMenu;
$('gearBtn').onclick = function(e){ e.currentTarget.blur(); if ($('results').classList.contains('show')) return; if (paused) closeMenu(); else openMenu(); };
$('againBtn').onclick = function(){ $('results').classList.remove('show'); paused = false; keys = {}; clock.getDelta(); startRun(); };
$('freeBtn').onclick = function(){ $('results').classList.remove('show'); prefs.mode = 'free'; saveSettings(); paused = false; keys = {}; clock.getDelta(); };
$('resetBinds').onclick = function(){ binds = Object.assign({}, DEFAULT_BINDS); saveSettings(); listening = null; renderBinds(); setVehicle(cur); };
$('unitsBtn').onclick = function(){ prefs.units = prefs.units === 'mph' ? 'kmh' : 'mph'; saveSettings(); renderBinds(); };
$('soundBtn').onclick = function(){ prefs.sound = !prefs.sound; saveSettings(); renderBinds(); };
$('qualityBtn').onclick = function(){
  prefs.quality = prefs.quality === 'high' ? 'fast' : 'high'; saveSettings();
  applyQuality(); renderBinds();
};

window.addEventListener('keydown', function(e){
  if (listening) {
    e.preventDefault();
    if (e.code !== 'Escape') {
      var old = binds[listening];
      for (var k in binds) if (k !== listening && binds[k] === e.code) binds[k] = old;
      binds[listening] = e.code; saveSettings();
    }
    listening = null; renderBinds(); return;
  }
  if (e.target && e.target.tagName === 'INPUT' && e.code !== 'Escape') return;   // typing your name
  if (e.code === 'Escape') { if ($('results').classList.contains('show')) return; if (paused) closeMenu(); else openMenu(); return; }
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (!paused) { for (var a in binds) if (binds[a] === e.code) { e.preventDefault(); break; } }
});
window.addEventListener('keyup', function(e){ keys[e.code] = false; });
window.addEventListener('blur', function(){ keys = {}; });
window.addEventListener('resize', function(){
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
  sizeHyper();
  if (bloomPass) bloomPass.setSize(innerWidth, innerHeight);
});

function readInput(){
  return {
    thr: act('throttle'), brk: act('brake'), left: act('left'), right: act('right'), jump: tap('jump'), jumpHeld: act('jump'), thrust: act('thrust'), boost: act('boost'),
    back: act('backflip'), front: act('frontflip'), rollL: act('rollL'), rollR: act('rollR'),
    spinL: act('spinL'), spinR: act('spinR'), superman: act('superman'), nacnac: act('nacnac'), nohander: act('nohander')
  };
}

/* ================= main loop ================= */
var clock = new THREE.Clock();
setVehicle(cur);
camYaw = S.yaw;
rebuildTerrain(0, 0);
applyQuality();
applyTime();
applyGravity();
renderBinds(); renderModes();
var emptyInput = readInput();
var _p = new V3(), _q = new THREE.Quaternion();

function frame(){
  requestAnimationFrame(frame);
  var realDt = Math.min(0.05, clock.getDelta());
  var inp = paused ? emptyInput : readInput();
  var timeScale = (!paused && (act('slowmo') || (RA && RA.slow))) ? 0.35 : 1;
  var dt = realDt * timeScale;
  slowmoFx.className = 'hud' + (timeScale < 1 ? ' on' : '');
  if (!paused) {
    if (tap('reset')) { respawn(); S.chain = 1; }
    if (tap('camera')) { camMode = (camMode + 1) % 4; cine = null; toast(CAM_NAMES[camMode], '#ffffff'); }
    if (tap('vehicle')) setVehicle(VEH_ORDER[(VEH_ORDER.indexOf(cur) + 1) % VEH_ORDER.length]);
    if (VD.wings && tap('wings')) {
      S.wingsOut = !S.wingsOut; sfx('wings');
      toast(S.wingsOut ? '🪽 WINGS DEPLOYED' : '🪽 WINGS RETRACTED · faster in the air, no gliding', '#ffe14d');
    }
    if (VD.flight === 'rocket' && tap('spinL') && !S.crashed) toggleRocketAuto();
    if (tap('buildNext')) { buildSel = (buildSel + 1) % BUILD_ITEMS.length; buildDirty = true; sfx('click'); toast('🛠 ' + BUILD_ITEMS[buildSel].icon + ' ' + BUILD_ITEMS[buildSel].name, '#d7a8ff'); }
    if (tap('build') && !S.crashed) { placeBuildItem(); buildDirty = true; }
    if (tap('buildClear')) { clearBuild(); buildDirty = true; }
    if (tap('joinFriend')) joinFriend();
    if (RA && RA.phase === 'done') { RA.doneT += realDt; if (RA.doneT > 4) RA = null; }
    if (tap('overclock')) {
      S.overclock = !S.overclock; sfx(S.overclock ? 'overclock' : 'overclockOff');
      var ocWhat = VD.flight === 'heli' ? 'rotor x6 · faster flips' : VD.flight === 'jet' ? 'engines x6 · snappier' : VD.flight === 'rocket' ? 'engines x3' : VD.thrust ? 'motor & boost x10 · thrusters x3' : 'motor & boost x10';
      toast(S.overclock ? '⚡ OVERCLOCK ON · ' + ocWhat : 'OVERCLOCK OFF', S.overclock ? '#ff5a3c' : '#ffffff');
      if (S.overclock) { shakeT = Math.max(shakeT, 0.4); missionEvent('overclock', 1); }
    }
    if (VD.admin && tap('thrust')) { if (hyper.phase === 0) startHyper(); else if (hyper.phase === 2) exitHyper(); }
    if (hyper.cool > 0) hyper.cool -= realDt;
    if (hyper.phase === 1) { hyper.t += realDt; if (hyper.t >= 0.75) { if (VD.admin && !S.crashed) enterHyper(); else hyper.phase = 0; } }
    else if (hyper.phase === 3) { hyper.t += realDt; if (hyper.t > 0.6) hyper.phase = 0; }
    var wasBoosting = S.boosting;
    S.boosting = !S.crashed && inp.boost && S.boost > 0;
    if (S.boosting && !wasBoosting) sfx('boost');
    S.boost = 1;                                   // boost never runs out
    var hs0 = S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vz);
    var n = Math.min(10, Math.max(1, Math.ceil(hs0 * dt / 1.5))), sdt = dt / n;
    for (var i = 0; i < n; i++) {
      if (S.crashed) stepCrash(sdt);
      else if (hyper.phase === 2) stepHyper(sdt, inp);
      else if (VD.flight === 'jet') stepJet(sdt, inp);
      else if (VD.flight === 'rocket') stepRocket(sdt, inp);
      else if (VD.flight === 'heli') stepHeli(sdt, inp);
      else if (S.grounded) stepGround(sdt, inp);
      else stepAir(sdt, inp);
      inp.jump = false;
      if (!S.crashed) checkCollisions();
    }
    if (S.grounded && !S.crashed) {
      S.thrusting = false; S.fuel = Math.min(1, S.fuel + dt / 3);
      if (inWater()) { S.speed *= Math.exp(-1.1 * dt); if (Math.abs(S.speed) > 3) splash(3, 3 + Math.abs(S.speed) * 0.1); }
    }
    if (S.grounded && !S.crashed && S.chain > 1) { S.chainT -= dt; if (S.chainT <= 0) S.chain = 1; }
    if (S.grounded && S.slopeChainT > 0) { S.slopeChainT -= dt; if (S.slopeChainT <= 0) S.slopeChain = 0; }
    if (S.cleanFx > 0) S.cleanFx -= realDt;
    S.bounceV += (-S.bounce * 120 - S.bounceV * 14) * dt;
    S.bounce += S.bounceV * dt;
    if (S.bounce < -0.3) { S.bounce = -0.3; S.bounceV = 0; }
    if (attack.active) { attack.t -= realDt; if (attack.t <= 0) endRun(); }
  }
  var hs = S.crashed ? Math.hypot(S.vx, S.vz) : (S.grounded ? Math.abs(S.speed) : Math.hypot(S.vx, S.vz));
  if (VD.flight && !S.crashed && !S.grounded) hs = Math.hypot(S.vx, S.vy, S.vz);
  var kmh = hs * 3.6;
  if (!paused) {
    missionEvent('speed', kmh);
    if (VD.flight === 'heli') missionEvent('helispeed', kmh);
    if (!S.grounded && !S.crashed) missionEvent('height', S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z));
  }
  updateEngine(paused ? 0 : dt, kmh, inp);

  vehRoot.position.copy(S.pos);
  vehRoot.quaternion.copy(S.q);
  var md = VD.obj.model, wa = S.crashed ? 0 : S.wheelie;
  md.rotation.x = -wa;
  if (wa > 0.001) {
    var pz = VD.obj.dust[0][2], py = VD.obj.wheels[VD.obj.wheels.length - 1].r, cw = Math.cos(wa), sw = Math.sin(wa);
    md.position.set(0, -VD.com + S.bounce + py - (py * cw + pz * sw), pz - (-py * sw + pz * cw));
  } else md.position.set(0, -VD.com + S.bounce, 0);
  applyPose(dt, inp);
  var spinAmt = (S.grounded ? S.speed : hs) * dt;
  VD.obj.wheels.forEach(function(w, wi){ w.g.rotation.x += (!S.grounded && inp.thr && !paused && wi > 0) ? 0.6 * timeScale : spinAmt / w.r; });
  VD.obj.steer.forEach(function(g){ g.rotation.y = S.steerS * 0.35; });

  // flames: thrusters (roadster) and boost exhaust (all vehicles)
  S.thrustVis += ((S.thrusting && !paused ? 1 : 0) - S.thrustVis) * (1 - Math.exp(-14 * realDt));
  S.boostVis += ((S.boosting && !paused ? 1 : 0) - S.boostVis) * (1 - Math.exp(-10 * realDt));
  var flick = 0.85 + Math.random() * 0.3;
  if (VD.thrust) {
    var sv = Math.max(0.001, S.thrustVis * flick);
    VD.obj.flames.forEach(function(fl){ fl.scale.set(sv, sv * (0.9 + Math.random() * 0.4), sv); });
    VD.obj.light.intensity = S.thrustVis * 3;
    if (S.thrustVis > 0.2 && !paused) {
      var down = tmpV.set(0, -1, 0).applyQuaternion(S.q);
      VD.obj.nozzles.forEach(function(nz){
        _p.copy(nz).add(VD.obj.model.position).applyQuaternion(S.q).add(S.pos);
        for (var k = 0; k < 2; k++) spawnP(fire, _p.x, _p.y, _p.z, down.x * 14 + S.vx * 0.6, down.y * 14 + S.vy * 0.6, down.z * 14 + S.vz * 0.6, 2.5, 0.35);
      });
    }
  }
  if (VD.flight === 'rocket') {
    var R = VD.obj, on = S.engineOn && !paused && !S.crashed, fs = on ? flick * (S.rocketThr || 1) : 0.001;
    R.flames.forEach(function(fl){ fl.scale.set(fs, fs * (0.9 + Math.random() * 0.5), fs); });
    R.boosterFlames.forEach(function(fl){ var b = S.boostersOn ? fs : 0.001; fl.scale.set(b, b * (0.9 + Math.random() * 0.5), b); });
    if (on) {
      var dn = tmpV.set(0, -1, 0).applyQuaternion(S.q), low = S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z) < 40;
      _p.set(0, -VD.com - 3, 0).applyQuaternion(S.q).add(S.pos);
      for (var sk = 0; sk < 4; sk++) spawnP(smoke, _p.x, _p.y, _p.z, dn.x * 25 + S.vx * 0.3, dn.y * 25 + S.vy * 0.3, dn.z * 25 + S.vz * 0.3, low ? 30 : 6, 3);
      for (var sf = 0; sf < 3; sf++) spawnP(bigFire, _p.x, _p.y, _p.z, dn.x * 30 + S.vx * 0.5, dn.y * 30 + S.vy * 0.5, dn.z * 30 + S.vz * 0.5, 5, 0.4);
    }
  }
  if (VD.flight === 'jet') {
    var gearOut = S.grounded || (S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z) < 25 && S.speed < 140) ? 1 : 0;
    VD.obj.gear.scale.y += (gearOut - VD.obj.gear.scale.y) * (1 - Math.exp(-4 * realDt));
    VD.obj.gear.visible = VD.obj.gear.scale.y > 0.05;
    if (tap('jump') && !S.grounded) {          // flares!
      for (var fl2 = 0; fl2 < 30; fl2++) spawnP(bigFire, S.pos.x, S.pos.y, S.pos.z, S.vx * 0.3 + (Math.random() - 0.5) * 30, S.vy * 0.3 - 8, S.vz * 0.3 + (Math.random() - 0.5) * 30, 6, 1.6);
      sfx('flap');
    }
  }
  if (!VD.obj.ocGlow && S.overclock && !paused && !S.crashed && VD.obj.exhaust && Math.random() < 0.8) {
    _p.set(VD.obj.exhaust[0], VD.obj.exhaust[1] - VD.com, VD.obj.exhaust[2]).applyQuaternion(S.q).add(S.pos);
    for (var oe = 0; oe < 3; oe++) spawnP(embers, _p.x, _p.y, _p.z, (Math.random() - 0.5) * 8 + S.vx * 0.5, 1 + Math.random() * 4 + S.vy * 0.5, (Math.random() - 0.5) * 8 + S.vz * 0.5, 3, 0.4);
  }
  if (VD.obj.ocGlow) {
    S.ocVis += ((S.overclock && !paused ? 1 : 0) - S.ocVis) * (1 - Math.exp(-5 * realDt));
    var pulse = 0.75 + 0.25 * Math.sin(animT * 18);
    VD.obj.ocMat.opacity = S.ocVis * 0.55 * pulse; VD.obj.ocMat.emissiveIntensity = S.ocVis * 2.5 * pulse;
    VD.obj.ocGlow.visible = S.ocVis > 0.02;
    var ocf = Math.max(0.001, S.ocVis * (inp.thr ? 1 : 0.35) * (0.8 + Math.random() * 0.5));
    VD.obj.ocFlame.scale.set(ocf, ocf * (1 + Math.random()), ocf);
    if (S.ocVis > 0.5 && !paused && Math.random() < 0.8) {   // sparks fly off the engine
      _p.set(0, 0.6 - VD.com, 0).applyQuaternion(S.q).add(S.pos);
      for (var sk2 = 0; sk2 < 3; sk2++) spawnP(embers, _p.x, _p.y, _p.z, (Math.random() - 0.5) * 10, 2 + Math.random() * 5, (Math.random() - 0.5) * 10, 3, 0.45);
    }
  }
  if (VD.obj.hyperFlame) {
    var hv = hyper.phase === 2 ? 1 : hyper.phase === 1 ? 0.4 * Math.min(1, hyper.t / 0.75) : 0;
    var hf = Math.max(0.001, hv * (0.85 + Math.random() * 0.3));
    VD.obj.hyperFlame.scale.set(hf, hf * (1 + Math.random() * 0.8), hf);
    if (hyper.phase === 2 && !paused) {      // a long streak of blue light along the path
      var stepBack = Math.hypot(S.vx, S.vz) * realDt;
      for (var tr = 0; tr < 10; tr++) {
        var bk = tr / 10 * stepBack;
        spawnP(fire, S.pos.x - Math.sin(S.yaw) * (bk + 2), S.pos.y - 0.2, S.pos.z - Math.cos(S.yaw) * (bk + 2), 0, 0, 0, 0.6, 0.5);
      }
    }
  }
  var rearOn = Math.max(S.boostVis, S.overclock && inp.thr && !paused && !S.crashed && VD.flight !== 'rocket' ? 0.7 : 0, VD.thrust && !S.grounded && inp.thr && !paused ? 0.9 : 0, VD.flight === 'jet' && !paused && !S.crashed ? (inp.thr ? 0.55 : 0.2) : 0, VD.flight === 'heli' && S.overclock && !S.grounded && !paused ? 0.9 : 0);
  var bv = Math.max(0.001, rearOn * flick);
  VD.obj.boostFlame.scale.set(bv, bv * (0.9 + Math.random() * 0.5), bv);
  if (S.boostVis > 0.3 && !paused && VD.flight !== 'rocket') {
    var back = tmpV.set(0, 0, -1).applyQuaternion(S.q);
    _p.set(VD.obj.exhaust[0], VD.obj.exhaust[1] - VD.com, VD.obj.exhaust[2]).applyQuaternion(S.q).add(S.pos);
    for (var e2 = 0; e2 < 3; e2++) spawnP(VD.thrust ? fire : embers, _p.x, _p.y, _p.z, back.x * 12 + S.vx * 0.7, back.y * 12 + (S.grounded ? 0 : S.vy * 0.7), back.z * 12 + S.vz * 0.7, 2, 0.4);
  }

  if (!paused && S.grounded && !S.crashed && Math.abs(S.speed) > 4) {
    dAccum += Math.min(Math.abs(S.speed), 80) * dt * 0.6;
    while (dAccum > 1) {
      dAccum -= 1;
      VD.obj.dust.forEach(function(dp){
        _p.set(dp[0], -VD.com + 0.1, dp[2]).applyQuaternion(S.q).add(S.pos);
        spawnP(dust, _p.x, _p.y, _p.z, -Math.sin(S.yaw) * 3, 1.2, -Math.cos(S.yaw) * 3, 3, 1.2);
      });
    }
  }
  updateP(dust, dt); updateP(fire, dt); updateP(embers, dt); updateP(sparkle, dt); updateP(splashP, dt); updateP(bigFire, dt); updateP(smoke, dt);
  if (!paused) updateDebris(dt);

  // contact shadow
  var gh = heightAt(S.pos.x, S.pos.z), nrm = normalAt(S.pos.x, S.pos.z, new V3());
  var above = S.pos.y - VD.com - gh;
  blob.position.set(S.pos.x, gh + 0.06, S.pos.z);
  groundQuat(S.crashed ? S.yaw : (S.grounded ? S.yaw : Math.atan2(S.vx, S.vz) || S.yaw), nrm, 0, _q);
  blob.quaternion.copy(_q);
  blob.material.opacity = (prefs.time === 'night' ? 0.3 : 0.5) * Math.max(0, 1 - above / 8);
  blob.visible = blob.material.opacity > 0.01;

  // spinning coins + rings, rainbow paint
  var spinA = animT * 3;
  for (var c = 0; c < activeCoins.length; c++) { activeCoins[c].m.rotation.y = spinA + c; activeCoins[c].m.position.y = activeCoins[c].y + Math.sin(spinA + c) * 0.15; }
  for (var r = 0; r < activeRings.length; r++) activeRings[r].m.children[1].scale.setScalar(1 + Math.sin(animT * 4 + r) * 0.08);
  for (var rm = 0; rm < rainbowMats.length; rm++) rainbowMats[rm].color.setHSL((animT * 0.15 + rm * 0.1) % 1, 0.85, 0.5);

  var dirx = 0, dirz = 0;
  if (hs > 1) { dirx = (S.grounded ? Math.sin(S.yaw) : S.vx / hs); dirz = (S.grounded ? Math.cos(S.yaw) : S.vz / hs); }
  var ahead = Math.min(600, 150 + hs * 0.6), slack = Math.min(480, 110 + hs * 0.45);
  var wantX = S.pos.x + dirx * ahead, wantZ = S.pos.z + dirz * ahead;
  var useFast = hyper.phase === 2 || (fastMode ? hs > 450 : hs > 600);
  var lwx = S.pos.x + dirx * 1000, lwz = S.pos.z + dirz * 1000;
  if (useFast !== fastMode) {
    fastMode = useFast;
    if (fastMode) { fastRebuild(lwx, lwz, dirx, dirz); terrain.visible = false; lowTerrain.visible = true; }
    else { terrain.visible = true; lowTerrain.visible = false; rebuildTerrain(wantX, wantZ); }
  } else if (fastMode) {
    if (Math.hypot(lwx - lCenter.x, lwz - lCenter.z) > 600) fastRebuild(lwx, lwz, dirx, dirz);
  } else if (Math.hypot(wantX - tCenter.x, wantZ - tCenter.z) > slack) rebuildTerrain(wantX, wantZ);

  updateWildlife(dt);
  if (!paused) updateVariety(dt, hs);
  updateNet(realDt);
  updateClouds(realDt);
  if (windSand.visible) updateWindSand(realDt);
  if (!paused) updateTracks();
  if (!paused && userObjs.length) tickUserObjects(dt);
  if (VD.flight === 'heli' && !S.crashed) {
    var rr = (S.rotor || 0) * (paused ? 0 : 1);
    VD.obj.rotor.rotation.y += rr * (S.overclock ? 42 : 26) * realDt; VD.obj.tailRotor.rotation.x += rr * 40 * realDt;
    var hAbove = S.pos.y - VD.com - heightAt(S.pos.x, S.pos.z);
    if (rr > 0.6 && hAbove < 18 && !paused) {             // rotor downwash blasts the sand outwards
      for (var dw = 0; dw < 3; dw++) { var da = Math.random() * TAU, dr = 3 + Math.random() * 5, gyw = heightAt(S.pos.x + Math.cos(da) * dr, S.pos.z + Math.sin(da) * dr);
        spawnP(dust, S.pos.x + Math.cos(da) * dr, gyw + 0.3, S.pos.z + Math.sin(da) * dr, Math.cos(da) * 16, 1.5, Math.sin(da) * 16, 3, 1.1 * (1 - hAbove / 22)); }
    }
  }
  updateWings(dt);
  drawHyper(realDt);
  if (VD.flight === 'rocket') updateRocketParts(realDt);
  var machNow = updateSonic(realDt, hs);
  updateCamera(realDt, hs);
  sky.position.copy(camera.position);
  stars.position.copy(camera.position);
  mesas.position.set(camera.position.x, 0, camera.position.z);
  farGround.position.set(camera.position.x, -46, camera.position.z);
  altitudeSky(camera.position.y);
  sun.position.copy(S.pos).addScaledVector(SUN_DIR, 150);
  sun.target.position.copy(S.pos);

  var sl = (Math.max(0, Math.min(0.85, (kmh - 160) / 500)) + S.boostVis * 0.35 + Math.max(0, S.cleanFx || 0) * 0.9) * (1 - Math.min(1, hyper.vis * 2));
  speedLines.style.opacity = paused ? 0 : Math.min(0.9, sl).toFixed(2);
  if (sl > 0.01) speedLines.style.transform = 'rotate(' + (Math.random() * 6).toFixed(2) + 'deg) scale(1.1)';

  drawSpeedo(hs, realDt, machNow);
  drawMinimap();
  updateHUD();
  updateAudio(inp.thr, kmh, timeScale);
  pressed = {};
  if (composer && prefs.quality === 'high') composer.render(); else renderer.render(scene, camera);
}
frame();
})();
</script>
</body>
</html>`;

// ---------- multiplayer server: ONE lobby (a Durable Object) that relays everyone's position ----------
const MAX_PLAYERS = 40;
function cleanName(n){ return String(n || '').replace(/[^\w \-.]/g, '').trim().slice(0, 16) || 'Rider'; }
export class Lobby {
  constructor(ctx, env){ this.ctx = ctx; }
  async fetch(request){
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const pair = new WebSocketPair(), client = pair[0], server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id: crypto.randomUUID().slice(0, 8), name: '' });
    return new Response(null, { status: 101, webSocket: client });
  }
  others(ws){ return this.ctx.getWebSockets().filter(w => { if (w === ws) return false; const a = w.deserializeAttachment() || {}; return a.name && !a.gone; }); }
  broadcast(ws, msg){ for (const w of this.others(ws)) { try { w.send(msg); } catch (e) {} } }
  async webSocketMessage(ws, data){
    if (typeof data !== 'string' || data.length > 1500) return;
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    const me = ws.deserializeAttachment() || {};
    if (m.t === 'hello') {
      const list = this.others(ws);
      if (!me.name && list.length >= MAX_PLAYERS) { ws.send(JSON.stringify({ t: 'full' })); ws.close(1013, 'full'); return; }
      const fresh = !me.name;
      me.name = cleanName(m.name); ws.serializeAttachment(me);
      ws.send(JSON.stringify({ t: 'welcome', id: me.id, players: list.map(w => { const a = w.deserializeAttachment(); return { id: a.id, name: a.name }; }) }));
      this.broadcast(ws, JSON.stringify(fresh ? { t: 'join', id: me.id, name: me.name } : { t: 'name', id: me.id, name: me.name }));
    } else if (!me.name) {
      return;
    } else if (m.t === 'name') {
      me.name = cleanName(m.name); ws.serializeAttachment(me);
      this.broadcast(ws, JSON.stringify({ t: 'name', id: me.id, name: me.name }));
    } else if (m.t === 's' && Array.isArray(m.d) && m.d.length <= 12) {
      const d = m.d.map(v => (typeof v === 'number' && isFinite(v)) ? v : 0);
      this.broadcast(ws, JSON.stringify({ t: 's', id: me.id, n: me.name, d }));
    }
  }
  async webSocketClose(ws){ this.leave(ws); }
  async webSocketError(ws){ this.leave(ws); }
  leave(ws){
    const me = ws.deserializeAttachment() || {};
    if (me.name && !me.gone) { me.gone = true; ws.serializeAttachment(me); this.broadcast(ws, JSON.stringify({ t: 'leave', id: me.id })); }
    try { ws.close(1000, 'bye'); } catch (e) {}
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      if (!env || !env.LOBBY) return new Response('Multiplayer is not set up: add the LOBBY Durable Object binding (see wrangler.toml).', { status: 503 });
      if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
      return env.LOBBY.get(env.LOBBY.idFromName('main')).fetch(request);
    }
    return new Response(HTML, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
        "cache-control": "no-cache"
      }
    });
  }
};
