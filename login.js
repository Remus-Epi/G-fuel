var input = document.getElementsByClassName("inputs");
/*var prenume = document.getElementsByClassName("prenume");
var email = document.getElementsByClassName("email");
var parola = document.getElementsByClassName("parola");
var abonament = document.getElementsByClassName("abonament");*/
var button = document.getElementsByClassName("loginButton")[0];

function inputLength(item) {
	return item.value.length;
}

function displayValue() {
	for(i=0; i<4; i++)	
		console.log(input[i].value);
}

button.addEventListener("click", displayValue);