const URL = window.URL || window.webkitURL;
const url = new URL(window.location.href);
const registrarServer = url.searchParams.get('registrarUri') || 'sip.mconf.com';
const wsPort = url.searchParams.get('registrarUri') || '8080';
const registrarAuthUser = url.searchParams.get('authUser');
const ourURI = `${registrarAuthUser}@${registrarServer}`
const registrarPassword = url.searchParams.get('registrarPassword');
const displayName = url.searchParams.get('displayName') || "Mconf SIP-Web Client";
const stunServer = url.searchParams.get('stunServer') || 'stun:stun.l.google.com:19302';
const turn = url.searchParams.has('turn')? url.searchParams.get('turn') : [];
const destination = url.searchParams.get('destination');

let registered = false;

const createSimple = (callerURI, displayName, target, remoteVideo, buttonId) =>  {
  var remoteVideoElement = document.getElementById(remoteVideo);
  var button = document.getElementById(buttonId);

  var configuration = {
    media: {
      remote: {
        video: remoteVideoElement,
        audio: remoteVideoElement
      },
      local: {
        video: document.getElementById('localVideo'),
      },
      iceCheckingTimeout: 15000,
      render: {
        remote: remoteVideoElement,
        video: remoteVideoElement,
        audio: remoteVideoElement
      },
    },
    ua: {
      wsServers: `ws://${registrarServer}:${wsPort}`,
      uri: callerURI,
      displayName,
      userAgentString: `${SIP.C.USER_AGENT}/mconf`,
      registrarServer: `sip:${registrarServer}`,
      authorizationUser: registrarAuthUser,
      password: registrarPassword,
      traceSip: true,
      register: true,
      stun: [ stunServer ],
      turn,
    },
  };

  const simple = new SIP.WebRTC.Simple(configuration);

  simple.on('ended', function() {
    button.firstChild.nodeValue = 'Dial';
  });

  remoteVideoElement.style.visibility = 'visible';

  simple.on('connected', function() {
    remoteVideoElement.style.visibility = 'visible';
    button.firstChild.nodeValue = 'Hang up';
  });

  simple.on('ringing', function() {
    simple.answer();
  });

  button.addEventListener('click', function() {
    // No current call up
    if (simple.state === SIP.WebRTC.Simple.C.STATUS_NULL ||
      simple.state === SIP.WebRTC.Simple.C.STATUS_COMPLETED) {
      simple.call(target);
    } else {
      simple.hangup();
    }
  });

  return simple;
}

(function () {
  if (window.RTCPeerConnection) {
    // TODO add a form for the destination when calling outbound
    const simpleSession = createSimple(ourURI, displayName, destination, 'remoteVideo', 'start-video-button');
    let registrationFailed = false;
    const failRegistration = () => {
      registrationFailed = true;
      registered = false;
    };
    const markAsRegistered = () => {
      registered = true;
    }
    simpleSession.on('registered', markAsRegistered);
    simpleSession.on('registrationFailed', failRegistration);

    window.onunload = function () {
      simpleSession.ua.stop();
    };
  }
})();
