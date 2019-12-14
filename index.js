const remoteElementName = 'remoteVideo'
// URL params parsing
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

const createSimple = (callerURI, displayName, target, buttonId) =>  {
  const remoteVideoElement = document.getElementById(remoteElementName);
  var button = document.getElementById(buttonId);

  var configuration = {
    media: {
      remote: {
        video: remoteVideoElement,
        audio: remoteVideoElement,
      },
      local: {
        video: document.getElementById('localVideo'),
      },
      iceCheckingTimeout: 15000,
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

  simple.on('ended', () => {
    remoteVideoElement.classList.remove('active');
    localVideo.classList.remove('active');
    button.firstChild.nodeValue = 'Dial';
  });

  simple.on('connected', () => {
    localVideo.classList.add('active');
    remoteVideoElement.classList.add('active');
    button.firstChild.nodeValue = 'Hang up';
  });

  simple.on('ringing', () => {
    simple.answer();
  });

  button.addEventListener('click', () => {
    // No current call up
    if (simple.state === SIP.WebRTC.Simple.C.STATUS_NULL ||
      simple.state === SIP.WebRTC.Simple.C.STATUS_COMPLETED) {
      const uri = document.getElementById('uri').value || target;
      simple.call(uri);;
    } else {
      simple.hangup();
    }
  });

  return simple;
}

(function () {
  if (window.RTCPeerConnection) {
    // TODO add a form for the destination when calling outbound
    const simpleSession = createSimple(ourURI, displayName, destination, 'start-video-button');
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
