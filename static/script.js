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
  error: error,
};
var setnamebutton = document.getElementById("setname");
var invitationbutton = document.getElementById("button-invitation");
var nicknamefield = document.getElementById('nickname');
var buttonnewinvitation = document.getElementById("button-new-invitation");

nicknamefield.addEventListener('keydown', function (e) {if (e.key === "Enter" && nicknamefield.checkValidity()) {
  console.log(nicknamefield.checkValidity());
  setnickname_and_progress(e);}
});
setnamebutton.addEventListener('click', function (e) {
  setnickname_and_progress(e)
});
buttonnewinvitation.addEventListener('click', function (e) {
  //go back to the waiting room (if you were a guest, now you are host)
  send_new_invite(e);
});

if (global.error != ''){
  handle_invalid_game();
}

function connect() {
  // Websocket handling
  ws = new WebSocket(ws_url);
  var parsed_data;
  ws.onopen = function(){
    ws.send(JSON.stringify({"username": global.username}));
  }
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
      connecting_waiting_room(parsed_data);
    } else if ("outcome" in parsed_data)
    {
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
}

function handle_invalid_game(){
  alert("invalid game: Foti do something pretty");
}


invitationbutton.addEventListener('click', function(e) {
  connect();
  e.preventDefault();
});

function setnickname_and_progress(e) {
  e.preventDefault();
  console.log('Nickname and progress')
  global.username = $('#nickname')[0].value; 
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
    $("#page-waiting-room .instructions").html("<b>Στείλε</b> τη παρακάτω πρόσκληση σε ένα φίλο για να τσουγκρίσετε το αυγό σας παρεα!");
    $('#button-invitation p').html("Πρόσκληση");
  } else{
    console.log('init waiting room Here is the friend ')
    $('#button-invitation').removeClass('active');
    connecting_waiting_room(null);//don't ask to send invite, skip straight to connecting!
  } 
}

function connecting_waiting_room(friend_url)
{
  if (global.is_host){
    $("#button-invitation p").html("Επαναποστολή");
    $("#page-waiting-room .instructions").html("Αναμονή για σύνδεση φίλου! Μην κλείσεις αυτό το παράθυρο <br> Πάτα το πλήκτρο για να ξαναστείλεις την πρόσκληση ή στείλε του τον παρακάτω σύνδεσμο <br> <b>"+friend_url["invitation_url"]+"</b>");
  }else{
    console.log('Connect waiting room Here is the friend ')
    connect();
    $("#button-invitation p").html("Πρόσκληση");
    $("#page-waiting-room .instructions").html("Γίνεται σύνδεση στο παιχνίδι του <b>"+ global.opponent_nickname + "</b>");
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
      init_results_page();
      return false;
    }
  }
  
}

function init_page_game(eggroll)
{
  global.last_eggroll=eggroll;
  $('#page-waiting-room').addClass('animated fadeOut faster');
  $('#page-game').addClass('animated fadeIn slow');
  $('#page-game').addClass('active');
  if("HYPE_eventListeners" in window === false) {
    window.HYPE_eventListeners = Array();
  }
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
      $('#page-game').removeClass('animated fadeIn slow');
  }, 800);
  $('#myegg').addClass('animated slideInUp slow');
  $('#enemyegg').addClass('animated slideInUp slow delay-1s');
}

function send_new_invite(e) {
  e.preventDefault();
  global.is_host = true;
  global.opponent_nickname = null;

  //ToDo meili: do your websocket magic for the new host
  //if you were already a host, do you need to make a new room or keep the same?
  // 

  //when done, goto send invitation/initialize waiting room
  HYPE.documents['eggs_animated01'].startTimelineNamed('Main Timeline', HYPE.documents['eggs_animated01'].kDirectionForward);
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
  }, 800);
}

function init_results_page() {
  $("#cards-container").scrollTop(0);

  $('#page-results .template').clone().insertAfter('#page-results .template');
  $('#page-results .template:last').removeAttr("style");
  $('#page-results .template:last').addClass("results-card");
  $('#page-results .template:last').removeClass("template");

  if ((global.last_eggroll.front) && (global.last_eggroll.back)){
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
  } else if (global.last_eggroll.front) {
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
    $(".results-card:first img.egg-cracked-both").remove();
  } else if (global.last_eggroll.back){
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-both").remove();
  } else {
    $(".results-card:first img.egg-champion").remove();
    $(".results-card:first img.egg-cracked-tip").remove();
    $(".results-card:first img.egg-cracked-butt").remove();
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
  $(".results-card-1 img.egg-result").html("Πρόσκληση");

}