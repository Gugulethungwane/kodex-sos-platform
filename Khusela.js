

/* =====================================================
              JavaScript for KHUSELA
   ===================================================== */


var KHUSELA_API = "";
var CHECKIN_MINUTES = 30;
var HOLD_MS = 3000;

window.onerror = function(msg, src, line){
  alert("Page error: " + msg + " (line " + line + ")");
};


function readJSON(key, fallback){
  try {
    var v = JSON.parse(localStorage.getItem(key));
    return v === null || v === undefined ? fallback : v;
  } catch(e) { return fallback; }
}
function writeJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function getAlerts(){
  var a = readJSON('khusela_alerts', []);
  return Array.isArray(a) ? a : [];
}

function saveAlert(lat, lng, status){
  var alert1 = {
    id: Date.now(),
    time: new Date().toLocaleString(),
    lat: (typeof lat === 'number') ? lat : null,
    lng: (typeof lng === 'number') ? lng : null,
    status: status
  };
  var list = getAlerts();
  list.unshift(alert1);
  writeJSON('khusela_alerts', list);
  sendToServer(alert1);
  return alert1.id;
}

function updateAlert(id, changes){
  var list = getAlerts();
  for(var i = 0; i < list.length; i++){
    if(list[i].id === id){
      for(var k in changes) list[i][k] = changes[k];
      writeJSON('khusela_alerts', list);
      sendToServer(list[i]);
      return;
    }
  }
}


function sendToServer(alertObj){
  if(!KHUSELA_API) return Promise.resolve(false);
  return fetch(KHUSELA_API + "/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alertObj)
  }).then(function(r){
    return r.ok;
  }).catch(function(){
    showToast("Saved on this device. Server not reachable.");
    return false;
  });
}


function loadFromServer(){
  if(!KHUSELA_API) return Promise.resolve(getAlerts());
  return fetch(KHUSELA_API + "/alerts")
    .then(function(r){ return r.json(); })
    .catch(function(){ return getAlerts(); });
}


function showBox(html){
  var o = document.getElementById('box');
  if(!o){
    o = document.createElement('div');
    o.id = 'box';
    o.style.cssText = "position:fixed;inset:0;background:rgba(11,8,26,0.96);color:white;z-index:99;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;font-size:18px;line-height:1.6;font-family:Arial,sans-serif;";
    document.body.appendChild(o);
  }
  o.innerHTML = html + '<br><button onclick="closeBox()" style="margin-top:24px;padding:12px 28px;border-radius:20px;border:0;font-weight:bold;cursor:pointer;">Close</button>';
  o.style.display = 'flex';
}

var fakeTimer;
function closeBox(){
  clearTimeout(fakeTimer);
  var o = document.getElementById('box');
  if(o) o.style.display = 'none';
}

function showToast(message){
  var t = document.getElementById('toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText "position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#17213A;color:white;padding:12px 18px;border-radius:13px;font-size:13px;z-index:100;max-width:90vw;text-align:center;font-family:Arial,sans-serif;display:none;";
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.style.display = 'none'; }, 3000);
}


function getLocation(onOk, onFail, precise){
  if(!navigator.geolocation){ onFail({ code: 0 }); return; }
  navigator.geolocation.getCurrentPosition(onOk, onFail, {
    enableHighAccuracy: !!precise,
    timeout: precise ? 10000 : 15000,
    maximumAge: precise ? 0 : 60000
  });
}
function locationProblem(err){
  if(err.code === 1) return "Location is BLOCKED. Click the lock icon next to the address bar, set Location to Allow, then refresh.";
  if(err.code === 2) return "No GPS signal. Try going outside or turn on Location services.";
  if(err.code === 3) return "Finding the location took too long. Try again.";
  return "Location is not supported on this browser.";
}


function shareLocation(){
  showBox("Finding your location...<br>Tap Allow if the browser asks.");
  getLocation(function(p){
    var link = "https://www.google.com/maps?q=" + p.coords.latitude + "," + p.coords.longitude;
    var msg = "My location: " + link;
    try { navigator.clipboard.writeText(msg); } catch(e) {}
    showBox("📍 Location found and copied:<br><br>" + link +
      '<br><br><a href="' + link + '" target="_blank" style="color:#2aff95;">Open map</a>');
    if(navigator.share){ navigator.share({ text: msg }).catch(function(){}); }
  }, function(err){ showBox("❌ " + locationProblem(err)); });
}

function fakeCall(){
  showBox("Fake call in 5 seconds...<br>Put your phone down.<br>Tap Close to cancel.");
  clearTimeout(fakeTimer);
  fakeTimer = setTimeout(function(){
    if(navigator.vibrate) navigator.vibrate([400,200,400,200,400]);
    showBox("📞<br><b style='font-size:28px'>Mom</b><br>Incoming call...<br><br>" +
      '<button onclick="answerFake()" style="background:#2aff95;padding:12px 24px;border:0;border-radius:20px;font-weight:bold;">Answer</button> ' +
      '<button onclick="closeBox()" style="background:#ff2a6d;color:white;padding:12px 24px;border:0;border-radius:20px;font-weight:bold;">Decline</button>');
  }, 5000);
}
function answerFake(){
  var start = Date.now();
  showBox("📞<br><b style='font-size:28px'>Mom</b><br><span id='callTime'>00:00</span>");
  var t = setInterval(function(){
    var el = document.getElementById('callTime');
    if(!el){ clearInterval(t); return; }
    var s = Math.floor((Date.now() - start) / 1000);
    el.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ":" + String(s % 60).padStart(2, '0');
  }, 1000);
}

function showTip(){
  var tips = [
    "Share your live location with someone you trust.",
    "Keep your phone charged before going out.",
    "Stay in well-lit areas with other people.",
    "Tell a friend where you are going and when you will be back.",
    "Trust your instincts. You can always leave."
  ];
  showBox("💡<br><br>" + tips[Math.floor(Math.random() * tips.length)]);
}

function changeName(){
  var n = prompt("What is your name?");
  if(n && n.trim()){
    localStorage.setItem('khuselaName', n.trim());
    var el = document.getElementById('userName');
    if(el) el.textContent = n.trim();
  }
}


var checkTimer;
function startCheckIn(){
  var running = Number(localStorage.getItem('checkInEnd')) || 0;
  if(running > Date.now()){
    showBox("🕒 Your check-in timer is running.<br><br>" +
      '<button onclick="imSafe()" style="background:#2aff95;padding:12px 24px;border:0;border-radius:20px;font-weight:bold;">✓ I\'m safe</button>');
    return;
  }
  localStorage.setItem('checkInEnd', String(Date.now() + CHECKIN_MINUTES * 60000));
  runCheckIn();
  showBox("🕒 Check-in started.<br>Tap the card again when you are safe.");
}
function imSafe(){
  localStorage.removeItem('checkInEnd');
  clearInterval(checkTimer);
  var label = document.getElementById('checkInLabel');
  if(label) label.textContent = "I'm safe timer " + CHECKIN_MINUTES + "m";
  showBox("✅ Glad you are safe.<br>The timer has been stopped.");
}
function runCheckIn(){
  clearInterval(checkTimer);
  checkTimer = setInterval(function(){
    var end = Number(localStorage.getItem('checkInEnd')) || 0;
    var label = document.getElementById('checkInLabel');
    if(!end || !label) return;
    var left = end - Date.now();
    if(left <= 0){
      localStorage.removeItem('checkInEnd');
      clearInterval(checkTimer);
      label.textContent = "I'm safe timer " + CHECKIN_MINUTES + "m";
      saveAlert(null, null, 'Check-in missed (demo)');
      showBox("⏰ Check-in time is up.<br>Are you safe?");
      return;
    }
    var m = Math.floor(left / 60000);
    var s = Math.floor((left % 60000) / 1000);
    label.textContent = m + ":" + String(s).padStart(2, '0') + " left";
  }, 1000);
}


function getGuardians(){
  var g = readJSON('khuselaGuardians', []);
  return Array.isArray(g) ? g : [];
}

function renderGuardians(){
  var box = document.getElementById('guardianList');
  if(!box) return;
  var list = getGuardians();
  box.innerHTML = "";

  var status = document.getElementById('statusLine');
  if(status) status.textContent = list.length + (list.length === 1 ? " guardian saved" : " guardians saved");

  if(!list.length){
    var empty = document.createElement('div');
    empty.className = 'g-empty';
    empty.textContent = "No guardians yet. Tap + Add Guardian.";
    box.appendChild(empty);
    return;
  }

  list.forEach(function(g, i){
    var row = document.createElement('div');
    row.className = 'guardian-row';

    var av = document.createElement('div');
    av.className = 'g-avatar';
    av.textContent = g.name.charAt(0).toUpperCase();

    var info = document.createElement('div');
    var b = document.createElement('b');
    b.style.fontSize = '13px';
    b.textContent = g.name;
    var sm = document.createElement('small');
    sm.style.color = '#a99bcf';
    sm.textContent = g.phone;
    info.appendChild(b);
    info.appendChild(document.createElement('br'));
    info.appendChild(sm);

    var actions = document.createElement('div');
    actions.className = 'g-actions';
    var call = document.createElement('a');
    call.href = 'tel:' + g.phone;
    call.textContent = '📞';
    var del = document.createElement('span');
    del.textContent = '✕';
    del.title = 'Remove';
    del.onclick = function(){
      var l = getGuardians();
      l.splice(i, 1);
      writeJSON('khuselaGuardians', l);
      renderGuardians();
      showToast("Guardian removed.");
    };
    actions.appendChild(call);
    actions.appendChild(del);

    row.appendChild(av);
    row.appendChild(info);
    row.appendChild(actions);
    box.appendChild(row);
  });
}

function addGuardian(){
  var field = "width:260px;max-width:80vw;padding:12px;border-radius:12px;border:0;margin:6px 0;font-size:16px;";
  showBox("Add a guardian<br><br>" +
    '<input id="gName" placeholder="Name" maxlength="40" style="' + field + '"><br>' +
    '<input id="gPhone" placeholder="Phone number" type="tel" maxlength="20" style="' + field + '"><br>' +
    '<span id="gError" style="color:#ff8fbd;font-size:13px;"></span><br>' +
    '<button onclick="saveGuardian()" style="background:#2aff95;padding:12px 24px;border:0;border-radius:20px;font-weight:bold;">Save guardian</button>');
  setTimeout(function(){ var n = document.getElementById('gName'); if(n) n.focus(); }, 50);
}
function saveGuardian(){
  var name = document.getElementById('gName').value.trim();
  var phone = document.getElementById('gPhone').value.trim();
  var err = document.getElementById('gError');
  if(!name){ err.textContent = "Please enter a name."; return; }
  if(!/^[0-9+ ()-]{5,20}$/.test(phone)){ err.textContent = "Please enter a valid phone number."; return; }
  var l = getGuardians();
  l.push({ name: name, phone: phone });
  writeJSON('khuselaGuardians', l);
  renderGuardians();
  closeBox();
  showToast("Guardian added.");
}


var sirenOn = false, sirenTimer;
function toggleSiren(){
  var audio = document.getElementById('sirenAudio');
  if(!audio) return;
  if(!sirenOn){
    audio.play();
    document.getElementById('sirenLabel').innerText = "STOP";
    document.getElementById('sirenIcon').innerText = "🔴";
    document.getElementById('sirenBtn').classList.add('stop');
    sirenOn = true;
    sirenTimer = setTimeout(stopSiren, 60000);
  } else { stopSiren(); }
}
function stopSiren(){
  var audio = document.getElementById('sirenAudio');
  clearTimeout(sirenTimer);
  if(audio){ audio.pause(); audio.currentTime = 0; }
  document.getElementById('sirenLabel').innerText = "SIREN";
  document.getElementById('sirenIcon').innerText = "🔊";
  document.getElementById('sirenBtn').classList.remove('stop');
  sirenOn = false;
}

var holdRaf, holdStart, holdFired = false;

function initSos(){
  var btn = document.getElementById('helpBtn');
  if(!btn) return;
  var fill = document.getElementById('fill');
  var helpText = document.getElementById('helpText');
  var holdText = document.getElementById('holdText');

  function start(e){
    e.preventDefault();
    holdFired = false;
    holdStart = performance.now();
    btn.classList.add('counting');
    holdText.innerText = "KEEP HOLDING...";
    holdRaf = requestAnimationFrame(tick);
  }
  function tick(now){
    var t = now - holdStart;
    fill.style.width = Math.min(t / HOLD_MS * 100, 100) + "%";
    helpText.innerText = Math.max(1, Math.ceil((HOLD_MS - t) / 1000));
    if(t >= HOLD_MS){ holdFired = true; doSOS(); return; }
    holdRaf = requestAnimationFrame(tick);
  }
  function end(){
    cancelAnimationFrame(holdRaf);
    if(holdFired) return;
    fill.style.width = "0%";
    helpText.innerText = "HELP";
    holdText.innerText = "HOLD 3 SEC";
    btn.classList.remove('counting');
  }

  btn.addEventListener('touchstart', start, { passive: false });
  btn.addEventListener('mousedown', start);
  ['touchend','touchcancel','mouseup','mouseleave'].forEach(function(ev){ btn.addEventListener(ev, end); });
  btn.addEventListener('contextmenu', function(e){ e.preventDefault(); });
}

function doSOS(){
  var btn = document.getElementById('helpBtn');
  var fill = document.getElementById('fill');
  var helpText = document.getElementById('helpText');
  var holdText = document.getElementById('holdText');
  var id = saveAlert(null, null, 'Demo alert saved');

  getLocation(function(p){
    updateAlert(id, {
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      acc: Math.round(p.coords.accuracy),
      status: 'Demo alert saved (with location)'
  document.getElementById('sub').innerText = "Demo: alert saved. Call 112 in a real emergency.";
  if(navigator.vibrate) navigator.vibrate([300,100,300,100,500]);

  setTimeout(function(){
    btn.classList.remove('sent');
    document.getElementById('body').classList.remove('alert-mode');
    helpText.innerText = "HELP"; holdText.innerText = "HOLD 3 SEC";
    document.getElementById('title').innerText = "EMERGENCY SOS";
    document.getElementById('sub').innerText = "Hold for 3 seconds to save a demo alert";
    fill.style.width = "0%";
    holdFired = false;
  }, 3000);
}

function sendMessage(){
  var text = "I need help. Please contact me.";
  function finish(msg){
    try { navigator.clipboard.writeText(msg); } catch(e) {}
    alert("Message ready:\n\n" + msg + "\n\n(Copied. Opening your messages app...)");
    window.location.href = "sms:?body=" + encodeURIComponent(msg);
  }
  getLocation(function(p){
    finish(text + " My location: https://www.google.com/maps?q=" + p.coords.latitude + "," + p.coords.longitude);
  }, function(){ finish(text); });
}


document.addEventListener('DOMContentLoaded', function(){

  if(document.getElementById('guardianList')){
    var nameEl = document.getElementById('userName');
    if(nameEl) nameEl.textContent = localStorage.getItem('khuselaName') || "friend";

    var clock = document.getElementById('liveClock');
    if(clock) setInterval(function(){ clock.textContent = "• " + new Date().toLocaleTimeString(); }, 1000);

    var bell = document.getElementById('bell');
    if(bell) bell.addEventListener('click', function(){
      var list = getAlerts();
      var last = list.length ? list[0].time + " - " + list[0].status : "none yet";
      showBox("🔔<br><br>Saved alerts: <b>" + list.length + "</b><br>Latest: " + last +
        '<br><br><a href="admin.html" style="color:#2aff95;">Open Admin</a>');
    });

    renderGuardians();
    runCheckIn();
  }

  // SOS page
  initSos();
});
