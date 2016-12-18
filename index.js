$(document).ready(function () {
    
    // Compile handlebars template
    var source   = $("#list-template").html();
    var template = Handlebars.compile(source);
    
    var twitchStreamers = ["brunofin", "Dota2ruhub", "freecodecamp", "nightblue3", "ratsmah", "trumpsc" ];
    var allTwitchStreamers = {};
    
    // Cache DOM
    $twitch_user = $('#twitch_user');
    $btnTwitchUser = $("#btn_twitch_user");
    $my_tabs_a = $('#myTabs a');
    $twitchUsersOnline = $("#twitch_users_online");
    $twitchUsersOffline = $("#twitch_users_offline");
    $twitchUsersAll = $("#twitch_users_all");
    
    // Regex for finding Streamer name
    // TODO: remove code 
    // var matchChannelAndName = /(\/channels\/+)(.*)/;
    
    function twitchSubmitUser( e ){
        e.preventDefault();
        var newTwitchStreamer = $twitch_user.val().toLowerCase().trim();

        if (twitchStreamers.indexOf(newTwitchStreamer) === -1 && newTwitchStreamer !== "") {
            twitchStreamers.push(newTwitchStreamer);
            twitchStreamers.sort();
            makeAjaxCall(twitchStreamers);
        }

        $twitch_user.val("");

    }
    
    // Bind Events
    $btnTwitchUser.click( twitchSubmitUser );
    
    $my_tabs_a.click(function (e) {
        //e.preventDefault()
        $(this).tab('show');
    });
    
    function sortTwitchStreamersOnlineStatus(a, b) {
      return a.status > b.status ? -1 : 1;
    }
    
    function sortTwitchStreamersAscend( a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1: -1;
    }

    function createListItems( streamers ) {
        
        var streamersOnline = streamers
                                                .filter(function( streamer ){
                                                     return streamer.status === "online";
                                                })
                                                .sort( sortTwitchStreamersAscend );
               
        var onlineTemplateString = template({ items: streamersOnline });        
        $twitchUsersOnline.html( onlineTemplateString );
        
        var streamersOffline = streamers
                                                .filter(function( streamer ) {
                                                  return streamer.status === "offline";
                                                })
                                                .sort( sortTwitchStreamersAscend );
        
        var offlineTemplateString = template({ items: streamersOffline });
        $twitchUsersOffline.html( offlineTemplateString );       
        
        // var sortedOnlineStatus = user.sort( sortTwitchStreamersOnlineStatus );
        var sortedOnlineStatus = streamers.slice()
                                               .sort( function( a, b ) {
                                                var nameA = a.name.toLowerCase();
                                                var nameB = b.name.toLowerCase();
                                                if( a.status !== b.status ) {
                                                  return a.status > b.status ? -1 : 1;
                                                }
                                                
                                                if( a.status === b.status ) {
                                                  return nameA > nameB ? 1 : -1;
                                                }
                                                
                                               } );
        
        // console.log(sortedOnlineStatus)
        var userTemplateString = template({ items: sortedOnlineStatus });

        $twitchUsersAll.html( userTemplateString );       

    } 

    function collectUserStreams( twitchStreamers ) {
        
        var streamerList;
        var url;
        if (Array.isArray( twitchStreamers ) ) {
                var streamerList = twitchStreamers.map(function (user) {
                    url = "https://wind-bow.gomix.me/twitch-api/streams/" + user + "?api_version=3";
                    return streamerAjax( url );
                });
                var channelList = twitchStreamers.map(function (user) {
                    url = "https://wind-bow.gomix.me/twitch-api/channels/" + user + "?api_version=3";
                    return streamerAjax( url );
                });
                var streamersChannelAndStreamData = streamerList.concat( channelList );
                // console.log( streamersChannelAndStreamData );
        } else {
            url = "https://wind-bow.gomix.me/twitch-api/streams/" + twitchStreamers + "?api_version=3";
            return [streamerAjax( url )];
        }
        // console.log( streamerList );
        return streamersChannelAndStreamData;

    }
    // TODO: remove collectUserChannels, code is not used
    function collectUserChannels( list ) {
        var channelList;
        var url;
        if (Array.isArray(list)) {
            var channelList = list.map(function (user) {
                    url = "https://wind-bow.gomix.me/twitch-api/channels/" + user + "?api_version=3";
                    return streamerAjax( url );
                });
        } else {
            url = "https://wind-bow.gomix.me/twitch-api/channels/" + list + "?api_version=3";
            return [streamerAjax( url )];
        }
        // console.log( channelList );
        return channelList;     
    }
    
    $.ajaxSetup({
        type : "GET",
        dataType : "jsonp",
    });
    
    // TODO: remove getName
    function getName(link) {

        var match;
        try {
            match = matchChannelAndName.exec(link);
            
            return match[match.length - 1];
        } catch (e) {
            console.log(e);
        }

    }

    function addStreamerToAllTwitchStreamers( user ) {

        var twitchStreamer = {};
      
        if ( user.error !== null && user.error === undefined ) {
            twitchStreamer.name = user.name // getName(user["_links"]["channel"]);

                var url = "http://www.twitch.tv/" + twitchStreamer.name;
                twitchStreamer["url"] = url;
                twitchStreamer.status = user["stream"] === null ? "offline" : "online";
                if (twitchStreamer.status === "online") { 
                    twitchStreamer.statusDetails = user["stream"]["channel"]["status"] ;
                    twitchStreamer.logo = user.logo; // user["stream"]["channel"]["logo"] ;
                    twitchStreamer.mediaIcon = "media-object fa fa-check";
                } else {
                    twitchStreamer.statusDetails = "";
                    // twitchStreamer.logo = "http://placehold.it/150x150";
                    twitchStreamer.logo = user.logo;
                    twitchStreamer.mediaIcon = "media-object fa fa-times";
                } 
        } else {
            // TODO: Remove commented out code
            // var messageArray = user.message.split(" ");
            // messageArray[1] = messageArray[1].replace(/'/g, "");
            // var userName = messageArray[1]
            // var messageString = messageArray.join(" ");
            twitchStreamer.name = user.name;
            twitchStreamer.status = "closed";
            twitchStreamer["url"] = "";
            twitchStreamer.statusDetails = user.message;
            // twitchStreamer.logo = "http://placehold.it/150x150";
            twitchStreamer.mediaIcon = "media-object fa fa-exclamation-triangle";
        }

        return twitchStreamer;
    }

    function getTwitchUsersAndAddToList( streams, channels) {

        var args = Array.prototype.slice.call(arguments),
                   i = 0,
               len = args.length,
               twitchStreamers, normalizedStreamerObjects;
        
        // iterate objects and match stream names with channels
        var JSONResponses = args.map( function( a ) {
                                              return a[0];
                                            });
        
        var newLen = Math.ceil( JSONResponses.length / 2 );
        for( var i = 0; i < newLen; i++ ) {
           
            var nameArr = JSONResponses[i]["_links"]["channel"].split( "/" );
            var idx = nameArr.length - 1;
            var name = nameArr[idx];
            JSONResponses[i].name = name;
            var reName = new RegExp( name, "i" );
          
          var isFound = false;
          for( var j = newLen; j < JSONResponses.length; j++ ) {   
            var streamerName = JSONResponses[j].name || "";
            if( reName.test( streamerName ) ) {
              JSONResponses[i].logo = JSONResponses[j].logo;
              isFound = true;
            }
          }
          if( !isFound ) {
            JSONResponses[i].logo = null;
            JSONResponses[i].error = "Not found";
            JSONResponses[i].message = "Channel " + JSONResponses[i].name + " does not exist";
          }
          
        }
        
        // TODO: function has too many responsibilites
        twitchStreamers = JSONResponses.slice( 0, newLen );
        normalizedStreamerObjects = saveResultsAllTwitchStreamers( twitchStreamers );
        createListItems( normalizedStreamerObjects );

    }
    
    function saveResultsAllTwitchStreamers( users ) {
     /*  var args = Array.prototype.slice.call( arguments ),
                 i = 0,
             len = args.length;
      */
      var names = [],
                     i = 0,
                 len = users.length;
      // TODO: remove code Array.isArray, code is not touched
      if (!Array.isArray( users )) {
        names.push(addStreamerToAllTwitchStreamers(args[0]));
      } else {
        for (i; i < len; i++) {
          // names.push(addStreamerToAllTwitchStreamers(args[i][0]));
          names.push(addStreamerToAllTwitchStreamers( users[i] ) );
        }
      }   
      return names;      
        //allTwitchStreamers["streams"] = names;
    }
    
    function AjaxErrorHandler( xhr, status, errorThrown ){
      console.log("Sorry there was a problem.");
      console.log("Error: " + errorThrown);
      console.log("Status: " + status);
      console.dir(xhr);
    }
    
    function makeAjaxCall(users) {
        $.when.apply($, collectUserStreams(users) ).
        then( getTwitchUsersAndAddToList ).
        fail( AjaxErrorHandler );
    };
    
    var streamerAjax = function (url) {

       return $.ajax({
                    url : url,
                    jsonp : "callback"
                  });
    };

    makeAjaxCall(twitchStreamers);

});
