
function handleSubmit() {

	axios.post('/api/gift', { user: document.getElementById('input').value }).then(response => {

		// if this happens, response is the data from the shop api:
		// -> render production suggestions to UI
		console.log(response);

	}).catch(err => {

		// if this happens, no instagram user was found:
		// -> render message to UI:
		console.log('error!');

	});
	
	return false;

};