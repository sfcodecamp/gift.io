
console.log('js');

function handleSubmit() {
	axios.post('/api/gift').then(response => {
		console.log(response);
	});
	return false;
}