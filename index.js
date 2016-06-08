$(document).ready(function () {
    
    // Comiple handlbars template
    var source   = $("#list-template").html();
    var template = Handlebars.compile(source);
    
    var twitchStreamers = ["trumpsc", "freecodecamp", "brunofin", "nightblue3", "ratsmah", "Dota2ruhub"];
    var allTwitchStreamers = {};
    
    // Regex for finding Streamer name
    var matchChannelAndName = /(\/channels\/+)(.*)/;
    
    function twitchSubmitUser( e ){
        e.preventDefault();
        var newTwitchStreamer = $('#twitch_user').val().toLowerCase().trim();

        if (twitchStreamers.indexOf(newTwitchStreamer) === -1 && newTwitchStreamer !== "") {
            twitchStreamers.push(newTwitchStreamer);
            makeAjaxCall(twitchStreamers);
        }

        $('#twitch_user').val("");

    }

    $("#btn_twitch_user").click( twitchSubmitUser );
    
    $('#myTabs a').click(function (e) {
        //e.preventDefault()
        $(this).tab('show');
    });
    
    function sortTwitchStreamersOnlineStatus(a, b) {
      return a.status > b.status ? -1 : 1;
    }
    
    function sortTwitchStreamersAscend( a, b) {
      return a.name > b.name ? 1: -1;
    }

    function createListItems(user) {
        
        var streamersOnline = user
                                                .filter(function( streamer ){
                                                     return streamer.status === "online";
                                                })
                                                .sort( sortTwitchStreamersAscend );
               
        var onlineTemplateString = template({ items: streamersOnline });        
        $("#twitch_users_online").html( onlineTemplateString );
        
        var streamersOffline = user
                                                .filter(function( streamer ) {
                                                  return streamer.status === "offline";
                                                })
                                                .sort( sortTwitchStreamersAscend );
        
        var offlineTemplateString = template({ items: streamersOffline });
        $("#twitch_users_offline").html( offlineTemplateString );       
        
        var sortedOnlineStatus = user.sort( sortTwitchStreamersOnlineStatus );
        console.log(sortedOnlineStatus)
        var userTemplateString = template({ items: sortedOnlineStatus });

        $("#twitch_users_all").html( userTemplateString );       

    } 

    function checkOnlineStatus(list) {
     
        var aList;
        var url;
        if (Array.isArray(list)) {
            var aList = list.map(function (user) {
                    url = "https://api.twitch.tv/kraken/streams/" + user + "?api_version=3";
                    return streamerAjax( url );
                });
        } else {
            url = "https://api.twitch.tv/kraken/streams/" + list + "?api_version=3";

            return [streamerAjax( url )];
        }
 
        return aList;

    }

    $.ajaxSetup({
        type : "GET",
        dataType : "jsonp",
    });

    function getName(link) {

        var match;
        try {
            match = matchChannelAndName.exec(link);
            
            return match[match.length - 1];
        } catch (e) {
            console.log(e);
        }

    }

    function addStreamerToAlllTwitchStreamers(user) {

        var twitchStreamer = {};
      
        if (user.error === null || user.error === undefined) {
            twitchStreamer.name = getName(user["_links"]["channel"]);

                var url = "http://www.twitch.tv/" + twitchStreamer.name;
                twitchStreamer["url"] = url;
                twitchStreamer.status = user["stream"] === null ? "offline" : "online";
                if (twitchStreamer.status === "online") { 
                    twitchStreamer.statusDetails = user["stream"]["channel"]["status"] ;
                    twitchStreamer.logo = user["stream"]["channel"]["logo"] ;
                    twitchStreamer.mediaIcon = "media-object fa fa-check";
                } else {
                    twitchStreamer.statusDetails = "";
                    twitchStreamer.logo = "http://placehold.it/150x150";
                    twitchStreamer.mediaIcon = "media-object fa fa-times";
                } 
        } else {
            var messageArray = user.message.split(" ");
            messageArray[1] = messageArray[1].replace(/'/g, "");
            var userName = messageArray[1]
            var messageString = messageArray.join(" ");
            twitchStreamer.name = userName;
            twitchStreamer.status = "closed";
            twitchStreamer["url"] = "";
            twitchStreamer.statusDetails = messageString;
            twitchStreamer.logo = "http://placehold.it/150x150";
            twitchStreamer.mediaIcon = "media-object fa fa-exclamation-triangle";
        }

        return twitchStreamer;
    }

    function getTwitchUsersAndAddToList(a) {

        var args = Array.prototype.slice.call(arguments);
        var i = 0,
        len = args.length;

        var names = [];
        if (!Array.isArray(args[0])) {
            names.push(addStreamerToAlllTwitchStreamers(args[0]));

        } else {

            for (i; i < len; i++) {
                names.push(addStreamerToAlllTwitchStreamers(args[i][0]));
            }
        }
       
        allTwitchStreamers["items"] = names;
        createListItems(names);

    }
    
    function AjaxErrorHandler( xhr, status, errorThrown ){
      console.log("Sorry there was a problem.");
      console.log("Error: " + errorThrown);
      console.log("Status: " + status);
      console.dir(xhr);
    }
    
    function makeAjaxCall(users) {
        $.when.apply($, checkOnlineStatus(users)).
        then(getTwitchUsersAndAddToList).
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
