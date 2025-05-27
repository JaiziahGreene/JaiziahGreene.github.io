var qshow=true;
var qloaded=false;

var userObj={};
var userResponse={};
var pin="";
var pincount=0;
var qpasswd="";

document.getElementById("qlink").onclick=function(){
	if(qloaded == false) {
		qload();
	}
	if (qshow == true) {
		document.getElementById("authqcode").style.display="block";
		document.getElementById("qlink").innerText="Hide";
		qshow=false;
	} else {
		document.getElementById("authqcode").style.display="none";
		document.getElementById("qlink").innerText="Qcode";
		qshow=true;
	}
};
document.getElementById("qbutton2").onclick=function(){
	document.getElementById("authqcode").style.display="none";
	document.getElementById("qlink").innerText="Qcode";
	qshow=true;
};

qdragElement(document.getElementById("authqcode"));

function qdragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
//  if (document.getElementById(elmnt.id + "header")) {
  if (document.getElementById("header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = qdragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV: 
    elmnt.onmousedown = qdragMouseDown;
  }

  function qdragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = qcloseDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = qelementDrag;
  }

  function qelementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function qcloseDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}


var chrome_up=false;
var chrome_in=false;
var chrome_done=false;
var chrome_timer_func=false;

ctimer=0;
function chrome_check_add() {
	if(chrome_in==true) {
  		document.getElementById('chromebook').innerHTML="Calling complete";
		google.principal.complete( {"token":authstate},chrome_complete);
	} else {
		if(chrome_done==false) {
			ctimer++;
    			chrome_timer_func=window.setTimeout(chrome_check_add,1000);
  			// document.getElementById('chromebook').innerHTML="Timer restart "+ctimer;
		}
	}
}

function chrome_init(KeyTypes) {
  chrome_up=true;
  //document.getElementById('chromebook').innerHTML="Initialized";
  console.log(KeyTypes);
}

function chrome_add() {
  document.getElementById('chromebook').innerHTML="Added";
//  google.principal.complete( {"token":authstate},chrome_complete);
  chrome_in=true;
}

function chrome_complete() {
  document.getElementById('chromebook').innerHTML="Saved";
  chrome_done=true;
}

function qload() {
var qapp = new Vue({
  el: '#qapp',
  data: {
    scanner: null,
    activeCameraId: null,
    cameras: [],
  },
  mounted: function () {
    var self = this;
    self.scanner = new Instascan.Scanner({ video: document.getElementById('qpreview'), scanPeriod: 2 });
    self.scanner.addListener('scan', function (content, image) {
	var resp = content;
// DRJES
	userObj.code=resp;
	userObj.ip=clientip;
	getUserInfo();
// DRJES
	qshow=true;
	document.getElementById('qh1').innerHTML="Found "+resp+". <button id='qbutton2'>Hide</button>";
	document.getElementById("qbutton2").onclick=function(){
		document.getElementById("authqcode").style.display="none";
		document.getElementById("qlink").innerText="Qcode";
		qshow=true;
	};
	document.getElementById("authqcode").style.display="none";
	document.getElementById("qlink").innerText="Qcode";
// Moved to getUserInfo return function for setting userid/password
    });
    Instascan.Camera.getCameras().then(function (cameras) {
      self.cameras = cameras;
      if (cameras.length > 0) {
        self.activeCameraId = cameras[0].id;
        self.scanner.start(cameras[0]);
      } else {
        console.error('No cameras found.');
      }
    }).catch(function (e) {
      console.error(e);
    });
  },
  methods: {
    formatName: function (name) {
      return name || '(unknown)';
    },
    selectCamera: function (camera) {
      this.activeCameraId = camera.id;
      this.scanner.start(camera);
    }
  }
});
qloaded=true;
google.principal.initialize(chrome_init);
}

var inside=0;
function getUserInfo() {
    if(inside==1) { return; };
    inside=1;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                userResponse = JSON.parse(this.responseText);
		document.getElementById("username").value=userResponse.payload.userid;
		if(typeof userResponse.payload.pin !== 'undefined' && userResponse.payload.pin != "") {
			pin=userResponse.payload.pin;
			qpasswd=userResponse.payload.passwd;
			document.getElementById("loginsubmit").disabled=true;
			document.getElementById("chromebook").innerHTML="<input id='pininput' type=input> <button id='pinbutton' onClick='matchPIN();'>PIN</button>";
			document.getElementById("chromebook").style.display="block";
			document.getElementById("pininput").focus();
			var pininput = document.getElementById("pininput");
			pininput.addEventListener("keypress", function(event) {
			  if (event.key === "Enter") {
			    event.preventDefault();
			    document.getElementById("pinbutton").click();
			  }
			});
		} else {
			document.getElementById("password").value=userResponse.payload.passwd;
			if(chrome_up == true) {
				google.principal.add( {"token":authstate,"user":userResponse.payload.userid,"passwordBytes":userResponse.payload.passwd,"keyType":'KEY_TYPE_PASSWORD_PLAIN'},chrome_add);
				chrome_check_add();
			}
			document.getElementById("password").focus();
		}
              }
    }
    xmlhttp.open("POST", "/simplesaml/qauth/getqauthinfo.php", true);
    xmlhttp.setRequestHeader("Content-Type", "application/json");
    xmlhttp.send(JSON.stringify(userObj));
    inside=0;
}

function matchPIN() {
	pincheck=document.getElementById("pininput").value;
	// alert(pincheck+"/"+pin);
	if(pincheck == pin && pincount < 5) {
		document.getElementById("password").value=qpasswd;
		document.getElementById("loginsubmit").disabled=false;
		document.getElementById("chromebook").style.display="none";
		if(chrome_up == true) {
			google.principal.add( {"token":authstate,"user":userResponse.payload.userid,"passwordBytes":userResponse.payload.passwd,"keyType":'KEY_TYPE_PASSWORD_PLAIN'},chrome_add);
			chrome_check_add();
		}
		document.getElementById("password").focus();
	}
	pincount++;
}
