var global = {
  ws: null,
  username: null,
  ws_url: ws_url,  // from base template
  is_host: is_host, // this is jinja letting js know <true> that this is a P1(host) session and <false> that this is a P2(guest) session
  opponent_nickname: opponent_nickname,
  last_eggroll: {
    back: null,
    front: null
  },
  result: result,
  error: error,
  game_played: false,
  timeout: 1000,  // milliseconds to retry failed socket connection for host
  persistent_url: null,
};

Sentry.init({ dsn: 'https://195894b38c894c25ba5c4111599fb9d7@o378832.ingest.sentry.io/5202856' });


var setnamebutton = document.getElementById("setname");
var invitationbutton = document.getElementById("button-invitation");
var nicknamefield = document.getElementById('nickname');
var buttonnewinvitation = document.getElementById("button-new-invitation");
var buttonreset = document.getElementById("button-reset");
var buttonshareresults = document.getElementById("button-share-results");
const shareDialog = document.querySelector('.share-dialog');
const closeButton = document.querySelector('.close-button');
const copyButton = document.querySelector('.copy-link');

$( document ).ready(function() {
  if (global.result === null) {
    registerBaseGame();
    registerShare(connecting_waiting_room);
    registerInvitation();
    if (global.error != ''){
      handle_invalid_game();
    }
  }
  else {
    console.log("THERE IS result:" + global.result);
    global.last_eggroll = global.result.outcome;
    global.opponent_nickname = global.result.host;
    global.username = global.result.opponent;
    global.persistent_url = window.location.href;
    registerResultInteractivity();
    registerShare();
    showResult();
  }

});

function registerResultInteractivity(){
  buttonnewinvitation.addEventListener('click', function (e) {
    gaEvent("play_again");
    window.location = "/";
  });
  buttonshareresults.addEventListener('click', function (e) {
    shareResult();
  });

}

function shareResult()
{
  var teasertext;
  if (global.last_eggroll.front != global.last_eggroll.back){
    //both have cracked eggs
    teasertext = "Μπορεί όλα τα αυγά να σπάσανε αλλά εμείς το διασκεδάσαμε!";
  } else {
    //one is winner and one is loser!
    teasertext = "Στο τσούγκρισμα υπήρξε αξεπέραστος πρωταθλητής! Ποιος να ναι αυτός; Αυτό, ΕΣΥ θα πρέπει να το βρείς!";
  }
  shareLink(
    global.username + ' VS ' + global.opponent_nickname +";",
    teasertext,
    global.persistent_url, 
    function(){gaEvent("share_result");}
  );
}

function registerBaseGame(){
  nicknamefield.addEventListener('keydown', function (e) {if (e.key === "Enter" && nicknamefield.checkValidity()) {
    console.log(nicknamefield.checkValidity());
    setnickname_and_progress(e);}
  });
  setnamebutton.addEventListener('click', function (e) {
    setnickname_and_progress(e);
  });
  /*buttonnewinvitation.addEventListener('click', function (e) {
    //go back to the waiting room (if you were a guest, now you are host)
    send_new_invite(e);
    gaEvent("play_again");
  });*/
  buttonreset.addEventListener('click', function (e) {
    //reset the app button
    window.location = "/";
});
}


function connect(onurl) {
  //here
  // Websocket handling
  ws = new WebSocket(ws_url);
  var parsed_data;
  ws.onopen = function(){
    this.send(JSON.stringify({"username": global.username}));
  }
  ws.onclose = function(e) {
    if (global.is_host && !global.game_played){ // TODO should change for multiplayer
      console.log('Socket is closed. Reconnect will be attempted in ' + global.timeout + ' second.', e.reason);
      if (typeof onurl !== 'undefined' && global.timeout < 1000 * 60 * 20) { // timeout is 20 mins
        setTimeout(function() {
          connect(onurl);
        }, global.timeout);
        global.timeout = global.timeout*2;
      }
      else {
        console.log('Closing socket, callback undefined or timeout '+ global.timeout +' too long')
      }

    }
  };

  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
  ws.onmessage = function(event) {
    var data;
    data = event.data;
    try {
      parsed_data= JSON.parse(data);
    } catch (ex) {
      console.error(ex);
    }
    console.log(parsed_data['invitation_url']);
    //dummy test for whether there is a URL in the response. Will need changes if websocket ever returns anything else
    if ("invitation_url" in parsed_data){
      global.persistent_url = parsed_data["invitation_url"]; //I wasn't sure this is the best place to put it, but I can't think of a better place.
      onurl(parsed_data["invitation_url"]);
    } else if ("outcome" in parsed_data)
    {
      global.opponent_nickname = parsed_data.opponent;
      global.game_played = true;
      init_page_game(parsed_data.outcome);
      console.log("game init");
    }
    else if ("error" in parsed_data){
        handle_invalid_game()
    }
    else {
      console.log("oh oh, websockets returned something else...");
    }
  };
  this.send = function (message, callback) {
    this.waitForConnection(function () {
        ws.send(message);
        if (typeof callback !== 'undefined') {
          callback();
        }
    }, 1000);
  };

  var interval = 100;
  this.waitForConnection = function (callback, interval) {
      if (ws.readyState === 1) {
          callback();
      } else {
          var that = this;
          // optional: implement backoff for interval here
          setTimeout(function () {
              that.waitForConnection(callback, interval);
          }, interval);
          interval = interval*2;
      }
  };
}

function handle_invalid_game(){
  console.log("ERORRRRROORORR");
  gaEvent("error_page");
  init_error_page();
}

function closedialog(callback){
  shareDialog.classList.remove('is-open');
  $("#button-invitation p").addClass("animated pulse infinite slow delay-1s");
  if (typeof callback !== 'undefined') {
    callback();
  }
}

function registerShare(callback){
  closeButton.addEventListener('click', event => {
    closedialog(callback);
  });

  copyButton.addEventListener('click', event => {
    var copyText = document.getElementById("copied-url");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    closedialog(callback);
    console.log("copied link");
  });
}

function registerInvitation(){

  invitationbutton.addEventListener('click', function(e) {
    //if ($("#copied-url").hasClass("socket-open")){
      //it's a re-send button
      //displayShare();
    //} else {
      //if NO .socket-open class on the DOM tree, the sockets haven't returned an address yet
      //so we assume it hasn't even opened (bug:there is time-gap - it might simply be that it hasn't returned yet)
    shareablelink = $("#copied-url").attr("value");
    $("#button-invitation").addClass("pressed");
    setTimeout(function(){
      $("#button-invitation").removeClass("pressed");
    }, 200);
    $("#button-invitation p").addClass("animated pulse infinite slow delay-1s");
    if (shareablelink){
      console.log('Resend: ' + shareablelink);
      gaEvent("reshare_game");
      displayShare(shareablelink);
    }
    else {
      gaEvent("share_game");
      connect(displayShare);
    }
    e.preventDefault();
  });
}

function displayShare(shareablelink){
  shareLink(
    'Πρόσκληση για Τσούγκρισμα',
    'Ο/η ' + global.username + ' σε προσκάλεσε να τσουγκρίσετε αυγά! Πάτησε τον σύνδεσμο για να ανταποκριθείς. ',
    shareablelink,
    function () {
      $("#button-invitation p").addClass("animated pulse infinite slow delay-1s");
      connecting_waiting_room();
    }
  );
}

function shareLink(title, text, link, callback){
  $("#copied-url").attr("value", link);
  if (navigator.share) {
    navigator.share({
      title: title,
      text: text,
      url: link
    }).then(() => {
      console.log('Thanks for sharing!');
      if (typeof callback !== 'undefined') {
        callback();
      }
    })
    .catch(console.error);
  } else {
    shareDialog.classList.add('is-open');
  }
}

function setnickname_and_progress(e) {
  e.preventDefault();
  console.log('Nickname and progress')
  global.username = $('#nickname')[0].value;
  gaEvent("name_set");
  //initialize waiting room
  init_waiting_room();
  $('#page-nickname').addClass('animated fadeOut faster');
  $('#page-waiting-room').addClass('animated fadeIn slow');
  $('#page-waiting-room').addClass('active');
  setTimeout(function(){
    $('#page-nickname').removeClass('active');
      $('#page-nickname').removeClass('animated fadeOut faster');
      $('#page-waiting-room').removeClass('animated fadeIn slow');
  }, 800);
}

function init_waiting_room()
{
  if (global.username == null) {console.log("error initing waiting room. Why is username unset?");}
  if (global.is_host) {
    $('#button-invitation').addClass('active');
    $("#page-waiting-room .instructions").html("Στείλε μια πρόσκληση σε ένα αγαπημένο σου πρόσωπο και τσουγκρίστε παρέα!");
    $('#button-invitation p').html("Αποστολή <svg><use href=\"#share-icon\"></use></svg>");
  } else{
    console.log('init waiting room here is the friend ')
    $('#button-invitation').removeClass('active');
    connecting_waiting_room();//don't ask to send invite, skip straight to connecting!
  }
}

function connecting_waiting_room()
{
  if (global.is_host){
    $("#button-invitation p").html("Επαναποστολή <svg><use href=\"#share-icon\"></use></svg>");
    $("#page-waiting-room .instructions").html("Αναμονή σύνδεσης, κράτησε αυτό το παράθυρο ανοιχτό. </p>");
    $("#page-waiting-room .notes").html("<p> Μπορείς να ξαναστείλεις την πρόσκληση πατώντας το παρακάτω πλήκτρο. Κάθε πρόσκληση μπορείς να την στείλεις σε ένα μόναχα άτομο</p>");
  }else{
    console.log('friends has arrived ')
    connect();
    $("#button-invitation p").html("Πρόσκληση");
    $("#page-waiting-room .instructions").html("Γίνεται σύνδεση με τον <b>"+ global.opponent_nickname + "</b>");
  }
  $('#loading-icon').addClass('animated fadeIn faster');
  $('#loading-icon').addClass('active');
  setTimeout(function(){
      $('#loading-icon').removeClass('animated fadeIn faster');
  }, 500);
}

function timeline_finished(hypeDocument, element, event) {
  // display the name of the Hype container and the event called
  console.log(event);
  if (event.type === "HypeTimelineComplete"){
    if (event.timelineName === "Bump Timeline Butt"){
      console.log("finished animation sequence");
      registerShare();
      registerResultInteractivity();
      showResult();
      return false;
    }
  }

}

function init_page_game(eggroll)
{
  $('#loading-icon').removeClass('active');
  global.last_eggroll=eggroll;
  $('#page-waiting-room').addClass('animated fadeOut faster');
  $('#page-game').addClass('animated fadeIn slow');
  $('#page-game').addClass('active');
  if("HYPE_eventListeners" in window === false) {
    window.HYPE_eventListeners = Array();
  }
  //patch???
  /*console.log(eggroll);
  global.opponent_nickname=eggroll["opponent"];*/
  window.HYPE_eventListeners.push({"type":"HypeTimelineComplete", "callback": timeline_finished});
  HYPE.documents['eggs_animated01'].customData['front']=eggroll["front"];
  HYPE.documents['eggs_animated01'].customData['back']=eggroll["back"];
  HYPE.documents['eggs_animated01'].customData['opponent_name']=global.opponent_nickname;
  HYPE.documents['eggs_animated01'].customData['my_name']=global.username;
  if (global.username === global.opponent_nickname) {
    HYPE.documents['eggs_animated01'].customData['my_name']="Εγώ";
  }
  HYPE.documents['eggs_animated01'].continueTimelineNamed('Main Timeline', HYPE.documents['eggs_animated01'].kDirectionForward);
  setTimeout(function(){
    $('#page-waiting-room').removeClass('active');
      $('#page-waiting-room').removeClass('animated fadeOut faster');
      $('#page-game').removeClass('animated fadeIn fast');
  }, 400);
  //$('#myegg').addClass('animated slideInUp slow');
  //$('#enemyegg').addClass('animated slideInUp slow delay-1s');
}

/* this functions is no longer needed but I've kept it as a memory of what it takes
to reset the scene
/*function send_new_invite(e) {
  e.preventDefault();
  global.is_host = true;
  global.opponent_nickname = null;

  //ToDo meili: do your websocket magic for the new host
  //if you were already a host, do you need to make a new room or keep the same?
  //
  window.location = "/";
  //when done, goto send invitation/initialize waiting room
  //
  // No need to execute following "reset" code since we reset the hard way!
  //
  /*HYPE.documents['eggs_animated01'].startTimelineNamed('Main Timeline', HYPE.documents['eggs_animated01'].kDirectionForward);
  HYPE.documents['eggs_animated01'].goToTimeInTimelineNamed(0,'Bump Timeline Butt');
  HYPE.documents['eggs_animated01'].goToTimeInTimelineNamed(0,'Bump Timeline');
  $('#loading-icon').removeClass('active');
  $('#button-invitation').addClass('active');
  init_waiting_room();
  $('#page-results').addClass('animated fadeOut faster');
  $('#page-waiting-room').addClass('animated fadeIn slow');
  $('#page-waiting-room').addClass('active');
  setTimeout(function(){
    $('#page-results').removeClass('active');
      $('#page-results').removeClass('animated fadeOut faster');
      $('#page-waiting-room').removeClass('animated fadeIn slow');
  }, 800);*/
//}

function showResult() {
  $("#cards-container").scrollTop(0);

  $('#page-results .template').clone().insertAfter('#page-results .template');
  $('#page-results .template:last').removeAttr("style");
  $('#page-results .template:last').addClass("results-card animated tada delay-3s slow");
  $('#page-results .template:last').removeClass("template");
  $(".results-card:first .versus-title").html(global.username + "<span class=\"subnote inactive\">(Εγω)</span> VS " +global.opponent_nickname);

  $(".results-card:first .tag-line").html("Πωπω, κατατροπώθηκε το αυγό σου <span class=\"accent\">" + global.username + "</span>! <br> Δεν πειράζει όμως, πάντα με υγεία!");
  if ((global.last_eggroll.front) && (global.last_eggroll.back)){
    $(".results-card:first .tag-line").html("Το αυγό σου <span class=\"accent\">" + global.username + "</span> αποδείχθηκε πρωταθλητής! Πάντα Καλότυχος!");
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
  } else if (global.last_eggroll.back) {
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
    $(".results-card:first .tag-line").html("Το αυγό σου <span class=\"accent\">" + global.username + "</span> έσπασε, αλλά έσπασε και το δικό μου! <br> Με υγεία και του χρόνου!");
  } else if (global.last_eggroll.front){
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-both").remove();
    $(".results-card:first .tag-line").html("Το αυγό σου <span class=\"accent\">" + global.username + "</span> έσπασε, αλλά έσπασε και το δικό μου! <br> Με υγεία και του χρόνου!");
  } else {
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
  }
  if (global.is_host){
    gaEvent("game_played_host");
  }else{
    gaEvent("game_played_guest");
  }
  //ToDo (for multiplayer): dynamically add .results-card-N with results for current match, at the top
  $('#page-game').addClass('animated fadeOut faster');
  $('#page-results').addClass('animated fadeIn slow');
  $('#page-results').addClass('active');
  setTimeout(function(){
    $('#page-game').removeClass('active');
      $('#page-game').removeClass('animated fadeOut faster');
      $('#page-results').removeClass('animated fadeIn slow');
  }, 800);
}

function init_error_page(){
  var $previous_page = $('.container.active');
  $previous_page.addClass('animated fadeOut faster');
  $('#page-error').addClass('animated fadeIn slow');
  $('#page-error').addClass('active');
  $("#page-error .instructions").html("Αυτός ο σύνδεσμος δεν είναι έγκυρος πλέον");
  setTimeout(function(){
    $previous_page.removeClass('active');
      $previous_page.removeClass('animated fadeOut faster');
      $('#page-error').removeClass('animated fadeIn slow');
  }, 800);
}

function gaEvent(action) {
  if (gtag){
    gtag('event',action);
  }
}