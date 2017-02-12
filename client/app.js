
function handleSubmit() {

	$('#input').blur();
	$('.stackable').html('');
	$('.flex-container').append(`
		<div class="ui segment">
			<div class="ui active dimmer">
				<div class="ui text loader">Loading</div>
			</div>
			<p></p>
		</div>
		`);

			window.sr = ScrollReveal();

	    sr.reveal('.card', {
	      duration: 1000,
	      viewFactor: 0.2,
	    }, 300);

	axios.post('/api/gift', { user: document.getElementById('input').value }).then(response => {

		var data = response.data;

		var display = data.map(function(item){

			 var image = item.imageURI;
			 var name =  item.caption;
			 var description = item.the_Description;
			 var linkUrl  	 = item.linkUrl;

			 console.log(name + ': ' + description);

			//  <a class="ui card" href="http://www.shop.com/Grizzly+Fitness+Black+Grizzly+Paw+Training+Gloves+XXL-1507263259-p+.xhtml">
			// 	 <div class="image">
			// 		 <img src="http://img.shop.com/Image/OPContainer-Images/713/1047215713__175x175__.jpg" alt="Grizzly Fitness Black Grizzly Paw Training Gloves - XXL">
			// 	 </div>
			// 	 <div class="content">
			// 		 <div class="header">Grizzly Fitness Black Grizzly Paw Training Gloves - XXL</div>
			// 		 <div class="description">Premium Weightlifting Gloves in size xxlarge from Grizzly has a soft, durable cowhide leather with stretch back.  The palms and fingers are padded for added comfort.  Reinforced stitched stress areas for durability.  Velcro closure and Unisex design. ...</div>
			// 	 </div>
			//  </a>

			 $('.stackable').append(`
				  <a class="ui card" href=${name}linkUrl>
				 	 <div class="image">
				 		 <img src=${image} alt="Grizzly Fitness Black Grizzly Paw Training Gloves - XXL">
				 	 </div>
				 	 <div class="content">
				 		 <div class="header">${name}</div>
				 		 <div class="description">${description}</div>
				 	 </div>
				  </a>
				 `);

		});

		// if this happens, response is the data from the shop api:
		// -> render production suggestions to UI

		console.log("Response", response);

		//console.log(response);


	}).catch(err => {

		// if this happens, no instagram user was found:
		// -> render message to UI:
		console.log('error!');

		$('.stackable').append('<h2>No instagram user was found</h2>');

	});

	return false;

};
