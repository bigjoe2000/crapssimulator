


    function add(obj) {
        const el = document.createElement(obj.tag);
        Object.keys(obj).filter(key=>key != 'tag').forEach(key=>el[key] = obj[key]);
        document.head.appendChild(el);
    }
    add({
        tag: "script",
        src: "https://www.gstatic.com/firebasejs/9.13.0/firebase-app-compat.js",
        className: 'wait'
    });
    add({
        tag: "script",
        src: "https://www.gstatic.com/firebasejs/9.13.0/firebase-auth-compat.js",
        className: 'wait'
    });
    add({
        tag: "script",
        src: "https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.js",
        className: 'wait'
    })
    add({
        tag: "link",
        rel: "stylesheet",
        href: "https://www.gstatic.com/firebasejs/ui/6.0.1/firebase-ui-auth.css",
        type: "text/css",
        className: 'wait'
    })
    add({
        tag: "script",
        src: "https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.6.8/beautify.js"
    })
    add({
        tag: "link",
        href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
        rel: "stylesheet",
        integrity: "sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN",
        crossOrigin: "anonymous"
    });
    add({
        tag: "script",
        src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
        integrity: "sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL",
        crossOrigin: "anonymous"
    })

    add({
        tag: "link",
        href: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.9.1/font/bootstrap-icons.css",
        rel: "stylesheet"
    });
    add({
        tag: "style",
        innerText: ".templates {display: none;} .hidden {display: none;}"
    })

	// Holds the current logged in firebase user
	var user;
	// The number of running api calls
	var apiCalls = 0;
	var firebaseIdToken;

	const firebaseConfig = {
	    apiKey: "AIzaSyCEm6BxhKOtpDs2ya1csHpiAu8-4wp261g",
	    authDomain: "chouette-scorer.firebaseapp.com",
	    projectId: "chouette-scorer",
	    storageBucket: "chouette-scorer.appspot.com",
	    messagingSenderId: "204030167526",
	    appId: "1:204030167526:web:231c2913a7eb9f1a6f2e27",
	    measurementId: "G-GEB64RT86F"
	};

    var fbLoaded = false;
    function initializeFirebase() {
        if (typeof firebase == 'undefined' 
            || typeof firebase.auth == 'undefined' 
            || fbLoaded)
            return;
        firebase.initializeApp(firebaseConfig);
        fbLoaded = true;

        firebase.auth().onAuthStateChanged(function(user) {
	        if (user) {
                if (!window.location.pathname.endsWith("craps.html"))
	        	    window.open('craps.html', '_self');
                else {
                    loadedCallbacks.forEach(fn=>fn(user));
                }
	        } else {
	            // FirebaseUI config.
	            var uiConfig = {
	              signInFlow: 'popup',
	              autoUpgradeAnonymousUsers: true,
	              signInSuccessUrl: 'craps.html',
	              signInOptions: [
	                // Leave the lines as is for the providers you want to offer your users.
	                firebase.auth.GoogleAuthProvider.PROVIDER_ID,
	                {
	                	provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
	                	signInMethod: firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD
	                },
	                firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
	                
	              ],
	              // tosUrl and privacyPolicyUrl accept either url string or a callback
	              // function.
	              // Terms of service url/callback.
	              tosUrl: 'https://www.bigjoe.org/chouette/tos.html',
	              // Privacy policy url/callback.
	              privacyPolicyUrl: function() {
	                window.location.assign('https://www.bigjoe.org/chouette/tos.html');
	              }
	            };

                let uiEl = document.querySelector('#firebaseui-auth-container');
                if (uiEl) {
                    // Initialize the FirebaseUI Widget using Firebase.
                    var ui = new firebaseui.auth.AuthUI(firebase.auth());
                    // The start method will wait until the DOM is loaded.
                    ui.start('#firebaseui-auth-container', uiConfig);
                } else {
                    window.location = "index.html";
                }
	        }
	      }, function(error) {
	        console.log(error);
	      });

    }
	
    function initWhenDone() {
        document.querySelectorAll('script.wait').forEach(el=>
            el.addEventListener('load', initializeFirebase));
    }
    initializeFirebase();
    initWhenDone();

    redirectHome = function() {
		alert("No user logged in... redirecting home");
		setTimeout(function () {
			window.location.href = "/chouette/index.jsp";
		}, 2000);
	}
	
	var loadedCallbacks = [];
	function addLoadedCallback(callback) {
		if (user) {
			callback(user);
		} else {
			loadedCallbacks.push(callback);		
		}
	}

	function addElement(type, text, className, keyValues) {
		let el = document.createElement(type);
		if (text) {
			el.innerText = text;
		}
		if (className) {
			className.split(' ').forEach(cn=>{
				el.classList.add(cn);
			});
		}
		if (keyValues) {
			Object.keys(keyValues).forEach(key=>{
				el[key] = keyValues[key]; 
			});
		}
		return el;
	}
	
	function removeChildren(el, leaveSome) {
		let n = leaveSome || 0;
		while(el.children.length > n) {
			el.removeChild(el.lastChild);
		}
	}

	function clearError() {
		if (document && document.getElementById('error')) {
			document.getElementById('error').innerText = '';
		};
	};
	
	function displayError(message) {
		let el = document.getElementById('error');
		if (!el) {
			el = document.createElement('div');
			el.classList.add('error');
			el.id = 'error';
			var parentEl = document.querySelector('#main .header');
			(parentEl || document.body).appendChild(el);
		}
		el.innerText = message;
		prompt('Something went wrong. Please copy and paste this error message in an email to chouette-scorer-support@googlegroups.com', message);
		// TODO Check later if Chromium Flood Prevention Implementation bug is fixed so we can reliably open the user's mail client
		// ref: https://stackoverflow.com/questions/71583658/not-allowed-to-launch-cutom-protocol-because-a-user-gesture-is-required
	};
	
	function showOverlay(message) {
		apiCalls++;
		let messageEl = document.body.querySelector('.fadeMe .message');
		if (messageEl) {
			messageEl.innerText = message ? message : '';
		}
		let fadeEl = document.body.querySelector('.fadeMe'); 
		if (fadeEl)
			fadeEl.classList.remove('hidden');
	};
	
	function hideOverlay(force) {
		apiCalls = Math.max(0, apiCalls - 1);
		if (force) {
			apiCalls = 0;
		}
		if (!apiCalls) {
			let fadeEl = document.body.querySelector('.fadeMe'); 
			if (fadeEl)
				fadeEl.classList.add('hidden');
		}
	};
	
	function makeApiCall(url, method, obj, callback, errorCallbacks, fadeMessage, retry) {
		let params = {};
		if (typeof url == 'object') {
			params = url;
		} else {
			params = {
					url: url,
					method: method,
					obj: obj,
					callback: callback,
					errorCallbacks: errorCallbacks,
					fadeMessage: fadeMessage,
					retry: retry
			}
		}
		// Use default method of get if not provided
		params.method = params.method || 'GET';
		if (params.obj && !(params.obj instanceof FormData) && params.obj.constructor != String)
			params.obj = JSON.stringify(params.obj);
		
		params.retry = params.retry || 1;
		
		params.noIdToken = params.noIdToken || false;
		
		clearError();
		if (params.fadeMessage != 'skip') {
			showOverlay(fadeMessage);
		}
		
		if (params.noIdToken) {
			let xhr = new XMLHttpRequest();
			xhr.open(params.method, params.url);
			xhr.onreadystatechange = apiCallback.bind(null, xhr, params);
			xhr.send(params.obj);
		} else {
			if (!firebase.auth().currentUser) {
				redirectHome();
				return;
			}
			firebase.auth().currentUser.getIdToken().then(function(idToken) {
				firebaseIdToken = idToken;
				let xhr = new XMLHttpRequest();
				xhr.open(params.method, params.url);
				xhr.setRequestHeader("firebase-id-token", firebaseIdToken);
				xhr.onreadystatechange = apiCallback.bind(null, xhr, params);
				xhr.send(params.obj);
			})
		}
	};
	
	function apiCallback(xhr, params) {
		errorCallbacks = params.errorCallbacks || {};
		callback = params.callback || console.log.bind(null);
		if (xhr.readyState == XMLHttpRequest.DONE) {
			if (params.fadeMessage != 'skip')
				hideOverlay();
			if (xhr.status == 401) {
			 	if (xhr.responseText) {
			 		let json = JSON.parse(xhr.responseText);
			 		if (json.message) {
			 			toast('Ask an admin for missing privileges: ' + params.url + ':' + json.message);
			 			return;
			 		}
			 	}
			 	toast(xhr.status + ':' + xhr.statusText + ':' + xhr.responseText);
				return;
			}
			if (xhr.status != 200) {
				if (errorCallbacks[xhr.status]) {
					errorCallbacks[xhr.status](xhr);
				} else if (errorCallbacks[1000]) {
					//special param which cover all errors (except -1)
					errorCallbacks[1000](xhr);
				} else if (--params.retry > 0) {
					makeApiCall(params);
				} else {
					// Display a message containing a trace id which can be searched for in Google Cloud Console
					let traceContext = xhr.getResponseHeader('x-cloud-trace-context');
					// Format: 715dc3fe6370f8e123a506e35e52cfd3;o=1 or  715dc3fe6370f8e123a506e35e52cfd3 so strip out ; and anything afterwards
					if (traceContext) {
						traceContext = traceContext.split(';')[0];
					}
					if (!traceContext) {
						traceContext = '';
					}
					const dateOfRequest = xhr.getResponseHeader('date')
					const message = `Trace ID: ${traceContext}
					Status: ${xhr.status}
					Status Text: ${xhr.statusText || '-'}
					Response Text: ${xhr.responseText || '-'}
					Datetime: ${dateOfRequest}`.replaceAll(/\t/g,'')
					displayError(message);
					throw 'API call returned bad code:' + message;
				}
				return;
			}
			let response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
			if (callback) {
				callback(response);
			}
		}
	};
    function confirmDelete(message, callback) {
        let modal = new tingle.modal({
            footer: true
        });
        let el = addElement('div');
        el.appendChild(addElement('h1', 'Confirm Delete'));
        el.appendChild(addElement('p', 'Once you delete a ' + message + ', it will be gone forever'));
        modal.setContent(el);

        modal.addFooterBtn('Delete Forever!', 'tingle-btn tingle-btn--danger tingle-btn--pull-left', function () {
        	callback();
        	modal.close();
        });

        modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function () {
            modal.close();
        });
		modal.open();
    }
	addLoadedCallback(user=>{
		let el = document.querySelector('.logged-in-email');
        if (el)
		    el.innerText = user.email;
		
		el = document.querySelector('.logged-in-photo');
		if (el && user.photoURL) {
			el.src = user.photoURL;
			el.referrerPolicy = 'no-referrer';
		}
        el = document.querySelector('.logged-in-logout');
        if (el)
            el.addEventListener('click', ()=>firebase.auth().signOut());
	});

