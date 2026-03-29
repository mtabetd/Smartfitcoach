(function(){
  var GATE_KEY='mtd_gate_access';
  var GATE_HASH='21rn9y'; // simpleHash('FROUITS')
  var GATE_HASH_LEGACY='b7e2g90d3f';
  function simpleHash(s){var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h=h&h;}return(h>>>0).toString(36).slice(0,10);}
  function checkGate(){
    var stored=localStorage.getItem(GATE_KEY);
    if(stored===GATE_HASH){unlock();return;}
    if(stored===GATE_HASH_LEGACY){localStorage.removeItem(GATE_KEY);}
    document.getElementById('gate').style.display='flex';
    document.getElementById('gate-btn').onclick=tryUnlock;
    document.getElementById('gate-pw').addEventListener('keydown',function(e){if(e.key==='Enter')tryUnlock();});
  }
  function tryUnlock(){
    var pw=document.getElementById('gate-pw').value;
    if(simpleHash(pw)===GATE_HASH){
      localStorage.setItem(GATE_KEY,GATE_HASH);
      unlock();
    } else {
      var err=document.getElementById('gate-error');
      err.style.display='block';
      err.textContent='Mot de passe incorrect';
      document.getElementById('gate-pw').value='';
      document.getElementById('gate-pw').focus();
    }
  }
  function unlock(){
    document.getElementById('gate').style.display='none';
    document.getElementById('app').style.display='block';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',checkGate);
  else checkGate();
})();
