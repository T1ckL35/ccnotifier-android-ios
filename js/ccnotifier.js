

// TODO:
// 1) Starting config screen to add your username (config_user),
//  notifications enabled (config_notifications)
//  and notification interval (config_interval)
// 2) Once set/confirmed we should minimise the app and keep running
// 3) The notification should open up conquerclub.com
var ccnotifier = {

    'conquerclub_data' : null,
    'requestTimer' : null,
    // store an array of game ids that are ready
    // will be used to determine if a notification needs sending again or not.
    // will probably update the notification (with a 'x games ready' message if any new games are detected
    'readyGamesList' : [],
    'call_usercheck' : 'http://www.conquerclub.com/api.php?mode=player&un=',
    'call_gamecheck' : 'http://www.conquerclub.com/api.php?mode=gamelist&gs=A&names=Y&p1un=',

    /**
     * Grab the returned api xml and trawl it to see if the game is ready.
     * When done, save the game data to a cache for displaying when requested.
     */
    'cacheGameData' : function(gameslist) {
        this.conquerclub_data = gameslist;
    },

    /**
     * When recreating the games list popup we need to populate it with a cached
     * set of game data until the next timer call is run
     */
    "getCachedGameData" : function() {
        return this.conquerclub_data;
    },



    /**
     * Generic ajax function used to call a url and then run a passed in callback function
     * TODO: consider passing in an object of data {}
     */
    'callServer' : function(options) {
//        var dfd = new $.Deferred();

        var jqxhr = $.ajax({
            'url': options.url,
            'datatype': 'xml'
        })
        .done(function(xml) {
            console.log('callServer.done()');
//            dfd.resolve(xml);
        })
        .fail(function() {
            console.log('callServer.fail()');
        })
        .always(function() {
            // console.log('callServer.always()');
        });

        // Set another completion function for the request above
        jqxhr.always(function() {
            // console.log('callServer.always()');
        });
//        return dfd.promise();
        return jqxhr;
    },

    /**
     * Start the system running
     */
    'startChecks' : function() {
        var configData = configStorage.getData();
        if(configData !== null) {
            ccnotifier.startTimer();
        }
    },

    /**
     * Starts a timer to check the server api every n minutes.
     * If there is already a timer then it doesn't do anything.
     * Note, we will have to recreate the timer if the interval
     *  value changes in the config.
     */
    'startTimer' : function() {
        var _this = this,
            configData = configStorage.getData(),
            intervalMultipler = 10000; // 60000; (10000 currently equals 10 seconds)
        // NOTE, the intervalMultipler is currently in seconds for testing
        // so 10 will equal 10 seconds
        // When ready for live, change it to 60000 for minutes

        if(_this.requestTimer == null) { // TODO: SORT THIS BIT || configData.config_interval != interval) {
            _this.requestGames();
            _this.requestTimer = setInterval(function () {
                _this.requestGames();
            }, (configData.config_interval * intervalMultipler));
        // } else {
        //     _this.requestGames();
        }
    },

    /**
     * Destroys a timer if one has previously been used
     */
    'clearTimer' : function() {
        clearInterval(this.requestTimer);
        this.requestTimer = null;
    },

    /**
     * Used to validate config form data prior to saving
     */
    'checkFormData' : function(formdata, callback) {

        // TESTING - minimise the app by going to the home screen
        // window.plugins.webintent.getExtra(
        //     {
        //         action: 'goHome',
        //     },
        //     function() {
        //     },
        //     function() {
        //         alert('Failed to open URL via Android Intent')
        //     }
        // );

        // // TESTING - open browser up from this app
        // window.plugins.webintent.startActivity(
        //     {
        //         action: window.plugins.webintent.ACTION_VIEW,
        //         url: 'http://www.conquerclub.com'
        //     },
        //     function() {},
        //     function() {
        //         alert('Failed to open URL via Android Intent')
        //     }
        // );

        // TESTING - uncomment the bit below to add proper functionality back in

console.log('CHECK FORM DATA');
        var _this = this,
            configData = configStorage.getData(),
            url = this.call_usercheck+formdata.config_user;
console.log(url);

        if(formdata != null && formdata.config_user != '' && formdata.config_interval >= 1) {
            $.when(
                _this.callServer({
                    "url" : url
                })
            ).then(
                // success
                function(xml) {
                    if($(xml).find('player').length == 1) {
                        _this.clearTimer();
                        configStorage.saveData(formdata);
                        _this.startTimer();
console.log(window.plugins.webintent);
                        window.plugins.webintent.getExtra(
                            {
                                action: 'goHome',
                            },
                            function() {
                            },
                            function() {
                                alert('Failed to open URL via Android Intent')
                            }
                        );



                    }
                },
                // fail
                function() {
                    console.log('connection problem? - unable to check if user is valid');
                }
            );
        }
    },

    /**
     * Grabs the saved config data and uses it to query the server for 
     * a list of games the specified user is in.
     * Caches the data locally so that when a timer is used, the games list
     * popup will show the last retrieved data set until it refreshes.
     */
    'requestGames' : function() {
        var _this = this,
            configData = configStorage.getData(),
            url = _this.call_gamecheck+configData.config_user;

        $.when(
            _this.callServer({
                "url" : url
            })
        ).then(
            // success
            function(xml) {
                _this.cacheGameData($(xml).find('game'));
                _this.checkGameStates();
            },
            // fail
            function() {
                console.log('connection problem? - could not get the games list');
            }
        );
    },

    /**
     * Parses the returned xml data and extracts if a game is ready for the specified user.
     * If so then we will send a notification to the tablet/phone
     */
    "checkGameStates" : function() {
        var _this = this,
            games = this.getCachedGameData(),
            gameReady = false,
            configData = configStorage.getData();

        // manually parse each game into a json object for handlebars templating
        games.each(function(){

// console.log($(this).find("game_number").text());
            var game_number = $(this).find("game_number").text();

            $(this).children().each(function(){
                if(this.nodeName == 'players') {
                    $(this).children().each(function(){
// console.log($(this));
                        var state = $(this).attr('state');
console.log(configData.config_user);
console.log($(this).text());
console.log(state);
                        if($(this).text() == configData.config_user && state == 'Lost') {
                        // if($(this).text() == configData.config_user && (state == 'Ready' || state == 'Playing')) {
                            // GAME IS READY - ADD TO A LIST THAT WILL BE SHOWN IN THE NOTIFICATION MESSAGE
                            // gameReady = true;
console.log('checking game is in list ' + game_number);
console.log($.inArray( game_number, _this.readyGamesList));
                            // if(this.readyGamesList.indexOf(game_number) == -1) {
                            if($.inArray(game_number, _this.readyGamesList) == -1) {
console.log('game not found so adding');
                                _this.readyGamesList.push(game_number);
                                gameReady = true;
                            }

                        // TODO: This logic/procdess needs checking!!!!!
                        // } else {
                        //     // game isn't ready so if it is present in the current game list then remove it
                        //     _this.readyGamesList.splice($.inArray(game_number, _this.readyGamesList), 1);
                        }
                    });
                }
            });
        });
console.log(_this.readyGamesList)
        // TODO: IF WE HAVE A NOTIFICATION CALL THEN SEND IT
        if(gameReady == true) { // && configData.config_notifications == true
            window.plugin.notification.local.add({ message: 'Game ready!' });
            // _this.gameReadyNotification();
        }
    }

}








