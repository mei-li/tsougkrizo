var setnamebutton = document.getElementById("setname");
var sendinvitationbutton = document.getElementById("sendinvitation");
setnamebutton.addEventListener('click', function(e) {
  e.preventDefault();
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
  e.preventDefault();
   $("#sendinvitation p").attr('data-title', "Αποστέλλεται...");
  console.log("ToDo: send invitation");
  $('#egg-guy').addClass('animated fadeOut faster');
  setTimeout(function(){	
  		$('#egg-guy').addClass('inactive');
		$('#egg-guy').removeClass('animated fadeOut faster');
   }, 500);
})
