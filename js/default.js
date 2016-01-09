// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
	"use strict";

	var app = WinJS.Application;
	var activation = Windows.ApplicationModel.Activation;

	var server;
	var username;
	var password;

	var visitsListLength;
	var visitsListIndex;

	var mySplitView = window.mySplitView = {
	    splitView: null,
	    homeClicked: WinJS.UI.eventHandler(function (ev) {
	        UIController('home');
	    }),
	    settingsClicked: WinJS.UI.eventHandler(function (ev) {
	        UIController('settings');
	    }),
	    logoutClicked: WinJS.UI.eventHandler(function (ev) {
	        UIController('login');
	    }),
	    patientClicked: WinJS.UI.eventHandler(function (ev) {
	        UIController('findPatient');
	        getPatientsList();
	    }),
	    visitsClicked: WinJS.UI.eventHandler(function (ev) {
	        UIController('actVisits');
	        getVisitsLength();
	        getVisitsList(0);
	    })	    
	};

	app.onactivated = function (args) {
		if (args.detail.kind === activation.ActivationKind.launch) {
			if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
				// TODO: This application has been newly launched. Initialize your application here.
			} else {
				// TODO: This application was suspended and then terminated.
				// To create a smooth user experience, restore application state here so that it looks like the app never stopped running.
			}
			args.setPromise(WinJS.UI.processAll());
			WinJS.UI.processAll().done(function () {
			    loadDisplayInfo();
			    window.onresize = loadDisplayInfo;
			    UIController('login');
			    document.getElementById('loginButton').addEventListener('click', loginClickHandler, false);
			    document.getElementById('checkUrlButton').addEventListener('click', checkUrlClickHandler, false);
			    document.getElementById('searchButton').addEventListener('click', searchClickHandler, false);
			    document.getElementById('prevButton').addEventListener('click', prevClickHandler, false);
			    document.getElementById('nextButton').addEventListener('click', nextClickHandler, false);
			    startTime();
			});
		}
	};

	app.oncheckpoint = function (args) {
		// TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
		// You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
		// If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
	};

	function loadDisplayInfo() {
	    var info = Windows.Graphics.Display.DisplayInformation.getForCurrentView();

	    if (info.rawDpiX > 0) {
	        var nativePPI = info.rawDpiX;
	        var logicalPPI = nativePPI * 100 / info.resolutionScale;
	        var screenSizeX = WinJS.Utilities.getContentWidth(document.getElementById('app')) / nativePPI;
	        if (screenSizeX < 5.5) {
	            Screen.updateSplitView('small');
	        }
	        else {
	            Screen.updateSplitView('large');
	        }
	    }
	    else {
	        // Simulate screen size if unavaliable 
	        Screen.updateSplitView('small');
	    }
	}

	function setVisitListButtons() {
	    if (visitsListIndex === 0){
	        document.getElementById('prevButton').style.backgroundColor = '#7f8c8d';
	    }
	    else {
	        document.getElementById('prevButton').style.backgroundColor = 'rgba(0, 153, 188, 1)';
	    }
	    if (visitsListLength == null || visitsListIndex < (visitsListLength - 10)) {
	        document.getElementById('nextButton').style.backgroundColor = 'rgba(0, 153, 188, 1)';
	    }
	    else {
	        document.getElementById('nextButton').style.backgroundColor = '#7f8c8d';
	    }
	}
	function nextClickHandler() {
	    if (visitsListIndex < (visitsListLength - 10))
	        getVisitsList((visitsListIndex + 10));
	}
	function prevClickHandler() {
	    if (visitsListIndex > 0)
	        getVisitsList((visitsListIndex - 10));
	}

	function loginClickHandler() {
	    document.getElementById('server').style.borderColor = 'rgba(0, 0, 0, 0.4)';
	    document.getElementById('username').style.borderColor = 'rgba(0, 0, 0, 0.4)';
	    document.getElementById('password').style.borderColor = 'rgba(0, 0, 0, 0.4)';
	    server = document.getElementById('server').value;
	    username = document.getElementById('username').value;
	    password = document.getElementById('password').value;

	    if (isNotEmpty(server) && isNotEmpty(username) && isNotEmpty(password)) {
	        var getUrl = server + "/ws/rest/v1/session";
	        $.ajax({
	            beforeSend: function(xhr) {
	                xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	            },
	            method: "GET",
	            async: true,
	            url: getUrl,            
	            cache: false,
	            success: function (data) {
	                var res = data.authenticated;
	                if (res) {
	                    UIController('home');
	                }
	                else {
	                    document.getElementById('password').style.borderColor = '#c0392b';
	                    document.getElementById('username').style.borderColor = '#c0392b';
	                    var contentDialog = document.querySelector(".win-contentdialog").winControl;
	                    document.querySelector('.win-contentdialog-content').innerHTML = '<br />Something goes wrong check username and password.<br />';
	                    contentDialog.show();
	                }
	            },
	            error: function () {
	                document.getElementById('server').style.borderColor = '#c0392b';
	                var contentDialog = document.querySelector(".win-contentdialog").winControl;
	                document.querySelector('.win-contentdialog-content').innerHTML = '<br />Wrong server url or no internet connection.<br />';
	                contentDialog.show();
	            }
	        });	         	        	        
	    }
	    else {
	        if (!isNotEmpty(server))
	            document.getElementById('server').style.borderColor = '#c0392b';
	        if (!isNotEmpty(username))
	            document.getElementById('username').style.borderColor = '#c0392b';
	        if (!isNotEmpty(password))
	            document.getElementById('password').style.borderColor = '#c0392b';
	    }
	}

	function checkUrlClickHandler() {
	    document.getElementById('server').style.borderColor = 'rgba(0, 0, 0, 0.4)';
	    var server = document.getElementById('server').value;
	    var getUrl = server + "/ws/rest/v1/session";
	    if (!isNotEmpty(server))
	        document.getElementById('server').style.borderColor = '#c0392b';
	    else {
	        $.ajax({
	            url: getUrl,
	            success: function (data) {
	                document.getElementById('server').style.borderColor = '#40d47e';
	            },
	            error: function () {
	                document.getElementById('server').style.borderColor = '#c0392b';
	                var contentDialog = document.querySelector(".win-contentdialog").winControl;
	                document.querySelector('.win-contentdialog-content').innerHTML = '<br />Wrong server url or no internet connection.<br />';
	                contentDialog.show();
	            }
	        });
	    }
	}

	function UIController(state) {
	    switch (state) {

	        case 'home':
	            $('#menuButton').show();
	            $('#activeVisits').hide();
	            $("#settings").hide();
	            $("#findPatient").hide();
	            $("#patientDetails").hide();
	            $('.win-splitview-panewrapper').show();
	            $('#login').hide();
	            $("#homeContext").show();
	            var splitView = document.querySelector(".splitView").winControl;
	            new WinJS.UI._WinKeyboard(splitView.paneElement); // Temporary workaround: Draw keyboard focus visuals on NavBarCommands
	            WinJS.UI.Animation.slideLeftIn(document.getElementById('homeContext'));
	            break;

	        case 'login':
                $('#menuButton').hide();
	            $('#activeVisits').hide();
	            $("#settings").hide();
	            $('.win-splitview-panewrapper').hide();
	            $('.win-splitview-paneplaceholder').hide();
	            $('#homeContext').hide();
	            $("#patientDetails").hide();
	            $('#findPatient').hide();
	            document.getElementById('username').value = '';
	            document.getElementById('password').value = '';
	            $('#login').show();	            
	            WinJS.UI.XYFocus.moveFocus("right");
	            WinJS.UI.Animation.enterPage(document.getElementById('mBody'));
	            break;

	        case 'findPatient':
	            $('#activeVisits').hide();
	            $("#settings").hide();
	            $('#login').hide();
	            $("#homeContext").hide();
	            $("#patientDetails").hide();
	            document.getElementById('searchLable').value = '';
	            $('.win-splitview-panewrapper').show();
	            $("#findPatient").show();
	            WinJS.UI.Animation.slideLeftIn(document.getElementById('findPatient'));
	            break;

	        case 'patientDetails':
	            $('#activeVisits').hide();
	            $("#settings").hide();
	            $('#login').hide();
	            $("#homeContext").hide();
	            $("#findPatient").hide();
	            $('.win-splitview-panewrapper').show();
	            $("#patientDetails").show();
	            WinJS.UI.Animation.slideLeftIn(document.getElementById('patientDetails'));
	            break;

	        case 'settings':
	            $('#activeVisits').hide();
	            $('#login').hide();
	            $("#homeContext").hide();
	            $("#findPatient").hide();	            
	            $("#patientDetails").hide();
	            $('.win-splitview-panewrapper').show();
	            $("#settings").show();
	            WinJS.UI.Animation.slideLeftIn(document.getElementById('settings'));
	            WinJS.UI.Animation.slideUp(document.getElementById('settingsContent'));
	            break;

	        case 'actVisits':
	            $('#login').hide();
	            $("#homeContext").hide();
	            $("#findPatient").hide();
	            $("#patientDetails").hide();
	            $('.win-splitview-panewrapper').show();
	            $("#settings").hide();
	            $('#activeVisits').show();
	            WinJS.UI.Animation.slideLeftIn(document.getElementById('activeVisits'));
	            break;
	    }
	}

	function getPatientsList() {
	    var getUrl = server + "/ws/rest/v1/patient?lastviewed&v=default";
	    $.ajax({
	        beforeSend: function (xhr) {
	            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	        },
	        method: "GET",
	        url: getUrl,
	        success: function (data) {
	            setPatients(data);
            }
	    });
	}

	function searchClickHandler() {
	    var searchVal = document.getElementById('searchLable').value;
	    if (isNotEmpty(searchVal)) {
	        var getUrl = server + "/ws/rest/v1/patient?q=" + searchVal + "&v=default";
	        $.ajax({
	            beforeSend: function (xhr) {
	                xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	            },
	            method: "GET",
	            url: getUrl,
	            success: function (data) {
	                setPatients(data);
	            }
	        });
	    }
	    else {
	        getPatientsList();
	    }
	}

	function setPatients(data) {
	    var newPatients = [];
	    if (data.results.length == 0) {
	        newPatients.push({
	            name: 'No Patients Found',
	            age: '',
	            genre: '',
	            birthdate: ''
	        });
	    }
	    else {
	        for (var i = 0; i < data.results.length; i++) {
	            var bdt = new Date(data.results[i].person.birthdate);
	            var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][bdt.getMonth()];
	            var birthdate = bdt.getUTCDate() + " " + month + " " + bdt.getFullYear();
	            var gender = 'Male';
	            if (data.results[i].person.gender === 'F')
	                gender = 'Female'
	            newPatients.push({
	                name: data.results[i].display,
	                age: data.results[i].person.age,
	                gender: gender,
	                birthdate: birthdate,
	                uuid: data.results[i].uuid
	            });
	        }
	    }
	    var patientsListNew = new WinJS.Binding.List(newPatients);
	    var patRepeater = document.querySelector("#repeater");
	    patRepeater.winControl.data = patientsListNew;
	    WinJS.UI.Animation.slideUp(patRepeater);
	}

	function showPatientDetails(uuid) {
	    var getUrl = server + '/ws/rest/v1/patient/' + uuid + '?v=full';
	    $.ajax({
	        beforeSend: function (xhr) {
	            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	        },
	        method: "GET",
	        url: getUrl,
	        success: function (data) {
	            var patientDetails = [];
	            var bdt = new Date(data.person.birthdate);
	            var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][bdt.getMonth()];
	            var birthdate = bdt.getUTCDate() + " " + month + " " + bdt.getFullYear();
	            var gender = 'Male';
	            if (data.person.gender === 'F')
	                gender = 'Female'

	            patientDetails.push({
	                name: data.person.display,
	                id: data.identifiers[0].identifier,
	                age: data.person.age,
	                gender: gender,
	                birthdate: birthdate,
	                address: data.person.preferredAddress.address1,
	                city: data.person.preferredAddress.cityVillage,
	                postalCode: data.person.preferredAddress.postalCode,
	                state: data.person.preferredAddress.stateProvince,
	                country: data.person.preferredAddress.country
	            });

	            var patientsListNew = new WinJS.Binding.List(patientDetails);
	            var patRepeater = document.querySelector("#patientDetailsRepeater");
	            patRepeater.winControl.data = patientsListNew;
	            UIController('patientDetails');
	            WinJS.UI.Animation.slideUp(patRepeater);
	        }
	    });
	}
    
	function getVisitsLength() {
	    var getUrl = server + '/ws/rest/v1/visit';
	    $.ajax({
	        beforeSend: function (xhr) {
	            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	        },
	        method: "GET",
	        url: getUrl,
	        success: function (data) {
	            visitsListLength = data.results.length;
	        }
	    });
	}

	function getVisitsList(index) {
	    visitsListIndex = index;
	    var getUrl = server + "/ws/rest/v1/visit?limit=10&startIndex=" + index + '&v=default';
	    setVisitListButtons();
	    $.ajax({
	        beforeSend: function (xhr) {
	            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
	        },
	        method: "GET",
	        url: getUrl,
	        success: function (data) {
	            setVisits(data);
	        }
	    });
	}

	function setVisits(data) {
	    var newVisits = [];
	    if (data.results.length == 0) {
	        newVisits.push({
	            name: 'No Visits Found',
	            date: '',
	            place: ''
	        });
	    }
	    else {
	        for (var i = 0; i < data.results.length; i++) {
	            var bdt = new Date(data.results[i].startDatetime);
	            var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][bdt.getMonth()];
	            var date = bdt.getUTCDate() + " " + month + " " + bdt.getFullYear();
	            newVisits.push({
	                name: data.results[i].patient.display.split('- ')[1],
	                date: date,
	                type: data.results[i].visitType.display,
	                place: '@ ' + data.results[i].location.display
	            });
	        }
	    }
	    var visitsListNew = new WinJS.Binding.List(newVisits);
	    var visRepeater = document.querySelector("#visitsRepeater");
	    visRepeater.winControl.data = visitsListNew;
	    WinJS.UI.Animation.slideUp(visRepeater);
	}

    //Expose the lists globally in the 'Patients' namespace.
	WinJS.Namespace.define("Patients",
        {
            data: new WinJS.Binding.List([]),
            visits: new WinJS.Binding.List([])
        });

	WinJS.Namespace.define("Navigation", {
	    dataBinding: WinJS.Binding.as({
	        navigations: new WinJS.Binding.List([]),
	    }),

	    NavigationItem: WinJS.Class.define(
                function (element, options) {
                    this.element = element;
                    this.element.onclick = function (event) {
                        var item = this.winControl.data;
                        // Handle onclick here
                        showPatientDetails(item.uuid)
                    };
                }
            ),
	});

	WinJS.Namespace.define("Screen", {
	    mode: {
	        small: {
	            name: 'small',
	            openedDisplayMode: WinJS.UI.SplitView.OpenedDisplayMode.overlay,
	            closedDisplayMode: WinJS.UI.SplitView.ClosedDisplayMode.none,
	        },
	        large: {
	            name: 'large',
	            openedDisplayMode: WinJS.UI.SplitView.OpenedDisplayMode.overlay,
	            closedDisplayMode: WinJS.UI.SplitView.ClosedDisplayMode.inline,
	        }
	    },
	    splitView: null,
	    updateSplitView: function (size) {
	        Object.keys(Screen.mode).forEach(function (key) {
	            $('#app').removeClass(Screen.mode[key].name);
	        });
	        var splitViewObj = document.querySelector('.splitView').winControl;
	        splitViewObj.openedDisplayMode = Screen.mode[size].openedDisplayMode;
	        splitViewObj.closedDisplayMode = Screen.mode[size].closedDisplayMode;
	        $('#app').addClass(size);
	    }
	});

	function startTime() {
	    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	    var today = new Date();
	    var h = today.getHours();
	    var m = today.getMinutes();
	    var s = today.getSeconds();
	    var d = today.getDay();
	    var pm = 'AM';
	    if (h >= 12) {
	        pm = 'PM';
	        h -= 12;
	    }
	    m = checkTime(m);
	    s = checkTime(s);
	    document.getElementById('time').innerHTML = h + ":" + m + ":" + s + ' ' + pm + ' '; 
	    document.getElementById('date').innerHTML = weekday[today.getDay()] + ', ' + month[today.getMonth()] + ' ' + today.getUTCDate() + ', ' + today.getFullYear();
	    var t = setTimeout(startTime, 500);
	}
	function checkTime(i) {
	    if (i < 10) { i = "0" + i };  // add zero in front of numbers < 10
	    return i;
	}

	function isNotEmpty(str) {
	    return !(!str || 0 === str.length);
	}

	app.start();
})();
