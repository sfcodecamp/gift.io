
function handleSubmit() {

	axios.post('/api/gift', { user: document.getElementById('input').value }).then(response => {

		var data = response.data;

		var display = data.map(function(item){

			 var image = item.imageURI;
			 var name =  item.caption;
			 var description = item.the_Description;

			 console.log(name + ': ' + description);

			 $('#display').append('<li><a href=' + image + '><h3>' + name + '</h3></a>' + description + '</p></li>');

		});

		// if this happens, response is the data from the shop api:
		// -> render production suggestions to UI

		console.log("Response", response);

		//console.log(response);


	}).catch(err => {

		// if this happens, no instagram user was found:
		// -> render message to UI:
		console.log('error!');

		$('#display').append('<h2>No instagram user was found</h2>');

	});

	return false;

};
