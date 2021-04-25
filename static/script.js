// Global game state
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

/*
Initialization
--------------
register event listeners
name page is shown by html

Game flow
---------
HOST
****
(user adds name) -> transitNamePageToInvitePage -> 	showInvitePage -> 
(wait for invitation url if host) -> displayShare -> showWaitingPage ->
(player arrived) -> (get results) -> 
websocket outcome -> showGamePage -> transitGamePageToResultsPage -> showResultPage

PLAYER
******
(user adds name) -> transitNamePageToInvitePage -> 	showInvitePage -> showWaitingPage
(get results from wbesocket) -> showGamePage -> transitGamePageToResultsPage -> showResultPage


PLAYED GAME
***********
showResultPage


*/

// Initialization of JS objects
Sentry.init({ dsn: 'https://195894b38c894c25ba5c4111599fb9d7@o378832.ingest.sentry.io/5202856' });


var buttonreset = document.getElementById("button-reset");
var buttonnewinvitation = document.getElementById("button-new-invitation");
var buttonshareresults = document.getElementById("button-play-link-results");
const shareDialog = document.querySelector('.play-link-dialog');
const closeButton = document.querySelector('.close-button');
const copyButton = document.querySelector('.copy-link');
var shareDialogCopyEventListener;

var update_texts = function() { $('body').i18n() };
$('.lang-switch').click(function(e) {
  url = window.location.href;
  url = url.replace('/' + $.i18n().locale + '/', '/' + $(this).data('locale') + '/');
  window.location.href = url;
});

$( document ).ready(function() {
  
  $.i18n().load(translations).done( function() {
    update_texts();
    showPage();
   } );
  

});

function showPage(){

  if (global.result === null) {  // new game
    registerErroHandling();
    registerBaseGame(transitNamePageToInvitePage);
    registerInvitation();
    registerShare(showWaitingPage);
    if (global.error != ''){
      handle_invalid_game();
    }
  }
  else { // game played, showing results
    console.log("THERE IS result:" + global.result);
    global.last_eggroll = global.result.outcome;
    global.opponent_nickname = global.result.host;
    global.username = global.result.opponent;
    global.persistent_url = window.location.href;
    registerResultInteractivity();
    registerShare();
    showResultPage();
  }
}

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
    teasertext = $.i18n('teaser_draw');
  } else {
    //one is winner and one is loser!
    teasertext = $.i18n('teaser_winner');
  }
  shareLink(
    global.username + ' VS ' + global.opponent_nickname +";",
    teasertext,
    global.persistent_url, 
    function(){gaEvent("share_result");}
  );
}

function registerBaseGame(callback){
  /* Set name, error button and set name button hanldlers */
  var nicknamefield = document.getElementById('nickname');
  nicknamefield.addEventListener('keydown', function (e) {if (e.key === "Enter" && nicknamefield.checkValidity()) {
    console.log(nicknamefield.checkValidity());
    e.preventDefault();
    callback();}
  });
  var setnamebutton = document.getElementById("setname");
  setnamebutton.addEventListener('click', function (e) {
    e.preventDefault();
    callback();
  });
}


function registerErroHandling(){
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
      showGamePage(parsed_data.outcome);
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

function animateInvitationButton(){
  $("#button-invitation").addClass("pressed");
  setTimeout(function(){
    $("#button-invitation").removeClass("pressed");
  }, 200);
}


function activateInvitationButton(){
  $("#button-invitation p").addClass("animated pulse infinite slow delay-1s");
}

function closedialog(callback){
  shareDialog.classList.remove('is-open');
  activateInvitationButton();
  if (typeof callback !== 'undefined') {
    callback();
  }
}

function registerShare(callback){
  /* Add share button set callback after sharing open, clode, copy hanlders  */
  shareDialogCloseEventListener = function (){
    closedialog(callback);
  }
  closeButton.addEventListener('click', shareDialogCloseEventListener);

  shareDialogCopyEventListener = function (){
    var copyText = document.getElementById("copied-url");
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
    closedialog(callback);
    console.log("copied link");
  }
  copyButton.addEventListener('click', shareDialogCopyEventListener);
}

function registerInvitation(){

  var invitationbutton = document.getElementById("button-invitation");
  invitationbutton.addEventListener('click', function(e) {
    shareablelink = $("#copied-url").attr("value");
    animateInvitationButton();
    activateInvitationButton();
    if (shareablelink){
      console.log('Resend: ' + shareablelink);
      gaEvent("reshare_game");
      displayShare(shareablelink);
    }
    else {
      gaEvent("share_game");
      connect(displayShare);  // wait to get share game url from wesocket
    }
    e.preventDefault();
  });
}


function displayShare(shareablelink){
  shareLink(

  $.i18n('invitation_title'),
  $.i18n('invitation_text', global.username),

  shareablelink,
  shareDialogCloseEventListener
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

function hideLanguageButton() {
  $('#lang-switch').hide();
}

function transitNamePageToInvitePage() {
  global.username = $('#nickname')[0].value;
  gaEvent("name_set");
  hideLanguageButton();
  //initialize waiting room
  showInvitePage();

  // animating things
  $('#page-nickname').addClass('animated fadeOut faster');
  $('#page-waiting-room').addClass('animated fadeIn slow');
  $('#page-waiting-room').addClass('active');
  setTimeout(function(){
    $('#page-nickname').removeClass('active');
      $('#page-nickname').removeClass('animated fadeOut faster');
      $('#page-waiting-room').removeClass('animated fadeIn slow');
  }, 800);
}

function showInvitePage()
{
  if (global.username == null) {console.log("error initing waiting room. Why is username unset?");}
  if (global.is_host) {
    $('#button-invitation').addClass('active');
    $("#page-waiting-room .instructions").html($.i18n('send-invite-message'));
    $('#button-invitation p').html($.i18n('send'));
  } else{
    console.log('init waiting room here is the friend ')
    $('#button-invitation').removeClass('active');
    showWaitingPage();  //don't ask to send invite, skip straight to connecting!
  }
}

function showWaitingPage()
{
  if (global.is_host){
    $("#button-invitation p").html($.i18n('resend'));
    $("#page-waiting-room .instructions").html($.i18n('waiting-egg-fellow'));
    $("#page-waiting-room .notes").html($.i18n('resend-invitation-note'));
  
  }else{
    console.log('friends has arrived ')
    connect();
    $("#button-invitation p").html($.i18n('invitation'));
    $("#page-waiting-room .instructions").html($.i18n('connecting_with', global.opponent_nickname));
  }
  $('#loading-icon').addClass('animated fadeIn faster');
  $('#loading-icon').addClass('active');
  setTimeout(function(){
      $('#loading-icon').removeClass('animated fadeIn faster');
  }, 500);
}

function transitGamePageToResultsPage(hypeDocument, element, event) {
  // display the name of the Hype container and the event called
  console.log(event);
  if (event.type === "HypeTimelineComplete"){
    if (event.timelineName === "Bump Timeline Butt"){
      console.log("finished animation sequence");
      if (global.persistent_url == null) {
        global.persistent_url = window.location.href;
      }
      closeButton.removeEventListener('click', shareDialogCloseEventListener);
      copyButton.removeEventListener('click', shareDialogCopyEventListener);
      registerShare();
      registerResultInteractivity();
      showResultPage();
      return false;
    }
  }

}

function showGamePage(eggroll)
{
  $('#loading-icon').removeClass('active');
  global.last_eggroll=eggroll;
  $('#page-waiting-room').addClass('animated fadeOut faster');
  $('#page-game').addClass('animated fadeIn slow');
  $('#page-game').addClass('active');
  if("HYPE_eventListeners" in window === false) {
    window.HYPE_eventListeners = Array();
  }
  window.HYPE_eventListeners.push({"type":"HypeTimelineComplete", "callback": transitGamePageToResultsPage});
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
}


function showResultPage() {
  $("#cards-container").scrollTop(0);

  $('#page-results .template').clone().insertAfter('#page-results .template');
  $('#page-results .template:last').removeAttr("style");
  $('#page-results .template:last').addClass("results-card animated tada delay-3s slow");
  $('#page-results .template:last').removeClass("template");
  $(".results-card:first .versus-title").html(global.username + "<span class=\"subnote inactive\">(Εγω)</span> VS " +global.opponent_nickname);

  $(".results-card:first .tag-line").html($.i18n('losing-egg', global.username));
 
  if ((global.last_eggroll.front) && (global.last_eggroll.back)){
    $(".results-card:first .tag-line").html($.i18n('winning-egg', global.username));   

    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
  } else if (global.last_eggroll.back) {
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
    $(".results-card:first .tag-line").html($.i18n('draw-egg', global.username));
  } else if (global.last_eggroll.front){
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-both").remove();
    $(".results-card:first .tag-line").html($.i18n('draw-egg', global.username));
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
  $("#page-error .instructions").html($.i18n('invalid_link'));
  // $("#page-error .instructions").html("Αυτός ο σύνδεσμος δεν είναι έγκυρος πλέον");  ΠΩΣ ΤΟ ΤΕΣΤΑΡΩ??
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