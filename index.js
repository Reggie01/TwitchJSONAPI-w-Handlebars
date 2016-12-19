(function () {
    
    // Compile handlebars template
    var source    = $("#list-template").html();
    var template = Handlebars.compile(source);
    
    var twitchStreamers = ["brunofin", "freecodecamp", "nightblue3", "teamtalima", "trumpsc" ];
    var allTwitchStreamers = {};
    
    // Cache DOM
    var  $twitch_user           = $( '#twitch_user' ),
          $btnTwitchUser       = $( "#btn_twitch_user" ),
          $my_tabs_a            = $( '#myTabs a' ),
          $twitchUsersOnline = $( "#twitch_users_online" ),
          $twitchUsersOffline = $( "#twitch_users_offline" ),
          $twitchUsersAll       = $( "#twitch_users_all" ),
          $form                      = $( "form" );
    
    // Bind Events
    $btnTwitchUser.click( twitchSubmitUser );
    
    $my_tabs_a.click(function (e) {
        //e.preventDefault()
        $(this).tab('show');
    });
    
    // render
    function render( streamerArrays ) {
      var streamersOnline = streamerArrays[0],
            streamersOffline = streamerArrays[1],
            allStreamers       = streamerArrays[2],
            onlineTemplateString,
            offlineTemplateString,
            userTemplateString;
            
      onlineTemplateString = template({ items: streamersOnline });        
      $twitchUsersOnline.html( onlineTemplateString );
      
      offlineTemplateString = template({ items: streamersOffline });
      $twitchUsersOffline.html( offlineTemplateString );       
        
      userTemplateString = template({ items: allStreamers });
      $twitchUsersAll.html( userTemplateString );       
    }
    
    function twitchSubmitUser( e ){
        e.preventDefault();
        var newTwitchStreamer     = $twitch_user.val().toLowerCase().trim(),
              twitchValidInputRegex = new RegExp( "^[a-zA-Z0-9][a-zA-Z0-9_]*$", "i" ),
              errorMsg                     = "form-group has-error has-feedback",
              successMsg                = "form-group has-success has-feedback",
              normalClass                = "form-group",
              glyphiconError            = "glyphicon glyphicon-remove form-control-feedback",
              glyphiconSuccess       = "glyphicon glyphicon-ok form-control-feedback",
              glyphicon                    = ".glyphicon";
              
        if( twitchValidInputRegex.test( newTwitchStreamer ) ) {
          if (twitchStreamers.indexOf(newTwitchStreamer) === -1 && newTwitchStreamer !== "") {
            twitchStreamers.push(newTwitchStreamer);
            twitchStreamers.sort();
            makeAjaxCall(twitchStreamers);
            $form.removeClass().addClass( successMsg );
            $form.find( glyphicon ).removeClass().addClass( glyphiconSuccess );
            $form.find(".control-label").attr( "aria-describedby", "inputSuccess2Status" );
            var $spanStatus = $form.find( ".inputError2Status" ) || $form.find( ".status" );
            $spanStatus.removeClass().addClass( "inputSuccess2Status" )
            setTimeout( function() {
              $form.removeClass().addClass( normalClass );
              $form.find( glyphicon ).removeClass().addClass( "glyphicon" );
              $form.find(".control-label").text("");
              $form.find( ".inputSuccess2Status" ).removeClass().addClass(".status");
              $twitch_user.val("");
            }, 2000 );
            
          } else {
            // TODO: user in list already
          }
        } else {
          // TODO: handle malformed input
          $form.removeClass().addClass( errorMsg );
          $form.find(".control-label").attr( "aria-describedby", "inputError2Status" );
          $form.find(".control-label").text("Invalid input special characters not allowed");
          $form.find( glyphicon ).removeClass().addClass( glyphiconError );
          var $spanStatus = $form.find( ".inputSuccess2Status" ) || $form.find( ".status" );
          $spanStatus.removeClass().addClass( "inputError2Status" );
          setTimeout( function() {
            $form.removeClass().addClass( normalClass );
            $form.find( glyphicon ).removeClass().addClass( "glyphicon" );
            $form.find(".control-label").text("");
            $form.find(".inputError2Status").removeClass().addClass("status");
            $twitch_user.val("");
          }, 2000 );
          console.log( "malformed input" );
        }
        
    }
    
    function sortTwitchStreamersOnlineStatus(a, b) {
      return a.status > b.status ? -1 : 1;
    }
    
    function sortTwitchStreamersAscend( a, b) {
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1: -1;
    }
    
    function createListItems( streamers ) {
        var streamers            = streamers.slice(),
              streamersOnline = getStreamersOnline( streamers ),
              streamersOffline = getStreamersOffline( streamers );
                   allStreamers  = getAllStreamers( streamers );
      return [streamersOnline, streamersOffline, allStreamers];
    }
    
    function getStreamersOnline( streamers ) {
      return streamers.filter(function( streamer ){
                               return streamer.status === "online";
                             })
                             .sort( sortTwitchStreamersAscend );              
    }    
    
    function getStreamersOffline( streamers ) {
      return streamers.filter(function( streamer ) {
                                         return streamer.status === "offline";
                                       })
                                       .sort( sortTwitchStreamersAscend );    
    } 
    
    function getAllStreamers( streamers ) {
      return streamers.slice()
                               .sort( function( a, b ) {
                                 var nameA = a.name.toLowerCase();
                                 var nameB = b.name.toLowerCase();
                                 if( a.status !== b.status ) {
                                   return a.status > b.status ? -1 : 1;
                                 }               
                                 if( a.status === b.status ) {
                                   return nameA > nameB ? 1 : -1;
                                 }
                               });
    }

    function collectUserStreams( twitchStreamers ) {
        
      var  streamersChannelAndStreamData, 
             streamerList, 
             url,
             channelList;
             
      streamerList = twitchStreamers.map(function (user) {
                               url = "https://wind-bow.gomix.me/twitch-api/streams/" + user + "?api_version=3";
                               return streamerAjax( url );
                             });
      channelList = twitchStreamers.map(function (user) {
                              url = "https://wind-bow.gomix.me/twitch-api/channels/" + user + "?api_version=3";
                              return streamerAjax( url );
      });
      
      var arr = [];
      // Combine /stream json response followed by /channel json response in array. It will be easier to combine
      // the objects together due to closer proximity.
      for( var i = 0; i < streamerList.length; i++ ) {
        var streamerIdx = i * 2;
        var channelIdx = streamerIdx + 1;
        arr[streamerIdx] = streamerList[i];
        arr[channelIdx] = channelList[i];
      }
      
      return arr;
    }
       
    function addStreamerToAllTwitchStreamers( user ) {

        var twitchStreamer = {},
              url;
        
        if ( user.error !== null && user.error === undefined ) {
            twitchStreamer.name = user.name;

                url = "http://www.twitch.tv/" + twitchStreamer.name;
                twitchStreamer["url"] = url;
                twitchStreamer.status = user["stream"] === null ? "offline" : "online";
                if (twitchStreamer.status === "online") { 
                    twitchStreamer.statusDetails = user["stream"]["channel"]["status"] ;
                    twitchStreamer.logo = user.logo; 
                    twitchStreamer.mediaIcon = "media-object fa fa-check";
                } else {
                    twitchStreamer.statusDetails = "";
                    twitchStreamer.logo = user.logo || "http://placehold.it/150x150";
                    twitchStreamer.mediaIcon = "media-object fa fa-times";
                } 
        } else {
            twitchStreamer.name = user.name;
            twitchStreamer.status = "closed";
            twitchStreamer["url"] = "";
            twitchStreamer.statusDetails = user.message;
            twitchStreamer.logo = "http://placehold.it/150x150";
            twitchStreamer.mediaIcon = "media-object fa fa-exclamation-triangle";
        }

        return twitchStreamer;
    }

    function handleStreamAndChannelJSONObjects( streams, channels) {
        
        var args = Array.prototype.slice.call(arguments),
                   i = 0,
               len = args.length,
               twitchStreamers = [], 
               normalizedStreamerObjects,
               JSONResponses,
               newLen;
        // iterate response objects and add channel logos to user stream objects
        JSONResponses = args.map( function( a ) {
                                              return a[0];
                                            });
        console.log( JSONResponses );
        
        // Logic for combining user /stream and /channel objects into one object
        for( var i = 0; i < JSONResponses.length; i += 2 ) {
          var streamIdx = i;
          var channelIdx = i + 1;
          
          if( JSONResponses[streamIdx].error === "not found" ){
            continue;
          }
          
          // Logic to find streamer name and turn the name into a Regular Expression
          var nameArr = JSONResponses[streamIdx]["_links"]["channel"].split( "/" );
          var idx = nameArr.length - 1;
          var name = nameArr[idx];
          JSONResponses[streamIdx].name = name;
          var reName = new RegExp( name, "i" );
          
          var streamerName = JSONResponses[channelIdx].name || "";
          // Look for streamer logo in /channel object and add it to /stream object
          if( reName.test( streamerName ) ) {
            JSONResponses[streamIdx].logo = JSONResponses[channelIdx].logo;
          } else {
            JSONResponses[i].logo = null;
            JSONResponses[i].error = JSONResponses[channelIdx].error;
            JSONResponses[i].message = "Channel " + JSONResponses[streamIdx].name + " does not exist";
          }
          twitchStreamers.push( JSONResponses[i] );
        }

        console.log( twitchStreamers );
        return twitchStreamers;
    }
    
    function saveResultsAllTwitchStreamers( users ) {
      
      var names = users.map( function( user ) {
                       return addStreamerToAllTwitchStreamers( user );
                     });
         
      return names;      
    }
    
    $.ajaxSetup({
        type : "GET",
        dataType : "jsonp",
    });
    
    function AjaxErrorHandler( xhr, status, errorThrown ){
      console.log("Sorry there was a problem.");
      console.log("Error: " + errorThrown);
      console.log("Status: " + status);
      console.dir(xhr);
    }
    
    function makeAjaxCall(users) {
        $.when.apply($, collectUserStreams(users) ).
        then( handleStreamAndChannelJSONObjects ).
        then( saveResultsAllTwitchStreamers ).
        then( createListItems ).
        then( render ).
        fail( AjaxErrorHandler );
    };
    
    var streamerAjax = function (url) {

      return $.ajax({
                            url : url,
                        jsonp : "callback"
                         });
    };

    makeAjaxCall( twitchStreamers );

})();
