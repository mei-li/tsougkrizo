var global = {
  ws: null,
  username: null,
  ws_url: ws_url  // from base template 
};
var setnamebutton = document.getElementById("setname");
var sendinvitationbutton = document.getElementById("sendinvitation");
setnamebutton.addEventListener('click', function(e) {
  e.preventDefault();
  global.username = $('#nickname')[0].value; 
  $('#host-1').addClass('animated fadeOut faster');
  $('#host-2').addClass('animated fadeIn fast');
  $('#host-2').toggleClass('active');
  setTimeout(function(){	
  		$('#host-1').toggleClass('active');
		$('#host-1').removeClass('animated fadeOut faster');
		$('#host-2').removeClass('animated fadeIn fast');
   }, 800);
})


sendinvitationbutton.addEventListener('click', function(e) {
  ws = new WebSocket(ws_url);
  ws.onopen = function(){
    ws.send(JSON.stringify({"username": global.username}));
  }
    ws.onmessage = function(event) {
    var friend_url = event.data; /// here is the friend url
  };
  e.preventDefault();
   $("#sendinvitation p").attr('data-title', "Αποστέλλεται...");
  console.log("ToDo: send invitation");
  $('#egg-guy').addClass('animated fadeOut faster');
  setTimeout(function(){	
  		$('#egg-guy').addClass('inactive');
		$('#egg-guy').removeClass('animated fadeOut faster');
   }, 500);
})
