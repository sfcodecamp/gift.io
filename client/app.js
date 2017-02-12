
function handleSubmit() {

	$('#input').blur();
	$('.stackable').html('');

	$('.flex-container').append(`
		<div class="ui active dimmer" id="loader">
				<div class="ui text loader">Loading</div>
			<p></p>
		</div>
		`);

			window.sr = ScrollReveal();

	    sr.reveal('.card', {
	      duration: 1000,
	      viewFactor: 0.2,
	    }, 300);

	axios.post('/api/gift', { user: document.getElementById('input').value }).then(response => {

		$('#loader').remove();

		var data = response.data;

		var display = data.map(function(item){

			 var image = item.imageURI;
			 var name =  item.caption;
			 var description = item.the_Description;
			 var linkUrl  	 = item.linkUrl;

			 $('.stackable').append(`
				  <a class="ui card" href=${name}linkUrl>
				 	 <div class="image">
				 		 <img src=${image} alt="Grizzly Fitness Black Grizzly Paw Training Gloves - XXL">
				 	 </div>
				 	 <div class="content">
				 		 <div class="header"><h2 class="titleHeader">${name}</h2></div>
				 		 <div class="descriptionBox"><p class="description">${description}</p></div>
				 	 </div>
				  </a>
				 `);

		});

	}).catch(err => {

		$('#loader').remove();

		console.log('error!');
		$('.stackable').append('<h2>No instagram user was found</h2>');

	});

	return false;

};
