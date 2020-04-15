var global = {
  ws: null,
  username: null,
  ws_url: ws_url,  // from base template
  is_host: is_host, // this is jinja letting js know <true> that this is a P1(host) session and <false> that this is a P2(guest) session
  opponent_nickname: "SomeGuysname" //(MeiLi) ToDo: if you are P2 this is P1s name. If you are P1 this is P2's name. 
  //if you are the guest/P2, would be nice to have P1s name ahead of the game so that the message says "Joining FOTIS's game" - not very important though
};
var setnamebutton = document.getElementById("setname");
var invitationbutton = document.getElementById("button-invitation");
var nicknamefield = document.getElementById('nickname');

nicknamefield.addEventListener('keydown', function (e) {if (e.key === "Enter" && nicknamefield.checkValidity()) {
  console.log(nicknamefield.checkValidity());
  setnickname_and_progress(e);}
});
setnamebutton.addEventListener('click', function (e) {
  setnickname_and_progress(e)
});

invitationbutton.addEventListener('click', function(e) {
  ws = new WebSocket(ws_url);
  var friend_url;
  ws.onopen = function(){
    ws.send(JSON.stringify({"username": global.username}));
  }
  ws.onmessage = function(event) {
    var friend_url_json;
    friend_url_json = event.data; /// here is the friend url
    try {
      friend_url= JSON.parse(friend_url_json);
    } catch (ex) {
      console.error(ex);
    }
    console.log("Server sends: " + friend_url);
    console.log(friend_url);
    //dummy test for whether there is a URL in the response. Will need changes if websocket ever returns anything else
    if ("invitation_url" in friend_url){
      connecting_waiting_room(friend_url);
    }else
    {
      console.log("oh oh, websockets returned something else...");
    }
  };
  e.preventDefault();
})

function setnickname_and_progress(e) {
  e.preventDefault();
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
    $("#page-waiting-room .instructions").html("Γίνεται σύνδεση στο παιχνίδι του <b>"+ global.opponent_nickname + "</b>");
  }
  $('#egg-guy').addClass('animated fadeIn faster');
  $('#egg-guy').addClass('active');
  setTimeout(function(){	
      $('#egg-guy').removeClass('animated fadeIn faster');
  }, 500);
  //MeiLi ToDo: Do your websocket magic!
  //for test purposes i wait 1000ms and then assume somebody has joined your game
  //i also perform a random roll :) at the end of the roll I have the following
  //opponent_nickname (if you couldn't easily get it early on from jinja, this is the moment!)
  //back:true/false
  //front: true/false
  var eggroll = {
    back: (Math.random() >= 0.5),
    front: (Math.random() >= 0.5)
  };
  console.log(eggroll);
  setTimeout(function(){	
    init_page_game(eggroll);
  }, 1000);
}

function init_page_game()
{
  $('#page-waiting-room').addClass('animated fadeOut faster');
  $('#page-game').addClass('animated fadeIn slow');
  $('#page-game').addClass('active');
  HYPE.documents['eggs_animated01'].startTimelineNamed('Main Timeline', HYPE.documents['eggs_animated01'].kDirectionForward);
  setTimeout(function(){
    $('#page-waiting-room').removeClass('active');
      $('#page-waiting-room').removeClass('animated fadeOut faster');
      $('#page-game').removeClass('animated fadeIn slow');
  }, 800);
  $('#myegg').addClass('animated slideInUp slow');
  $('#enemyegg').addClass('animated slideInUp slow delay-1s');
}