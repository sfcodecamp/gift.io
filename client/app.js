
function handleSubmit() {

	$('#input').blur();
	$('.error').remove();
	$('.stackable').html('');

	$('.flex-container').append(`
		<div class="ui active dimmer" id="loader">
				<div class="ui text loader">Loading</div>
			<p></p>
		</div>`);

	window.sr = ScrollReveal();

  sr.reveal('.card', {
    duration: 1000,
    viewFactor: 0.2,
  }, 300);

  var username = document.getElementById('input').value;
  username = username.slice(1);  
	axios.post('/api/gift', { user: username }).then(response => {

		$('#loader').remove();

		var unique = {};

		var data = response.data.filter(item => {
			if (!unique[item.catalogID]) {
				unique[item.catalogID] = true;
				return true;
			}
		});

		var image, name, description, linkUrl;

		data.map(function(item) {

			 image 			 = item.imageURI;
			 name 			 =  item.caption;
			 description = item.the_Description;
			 linkUrl  	 = item.modelQuickViewDetails.linkUrl;

			 $('.stackable').append(`
				  <a class="ui card" target="_blank" href=${linkUrl}>
				 	 <div class="image">
				 		 <img src=${image} alt=${name} class="cardImage">
				 	 </div>
				 	 <div class="content">
				 		 <div class="header">${name}</div>
				 		 <div class="description">${description}</div>
				 	 </div>
				  </a>`);

		});

	}).catch(err => {

		$('#loader').remove();

		var status = err.response.status;

		if (status === 404) {
			$('.errorContainer').append('<h2 class="error">No instagram user was found</h2>');
		} else if (status === 500) {
			$('.errorContainer').append('<h2 class="error">There was a problem on the server</h2>');
		} else {
			$('.errorContainer').append('<h2 class="error">Something went wrong...</h2>');
		}

	});

	return false;

};
