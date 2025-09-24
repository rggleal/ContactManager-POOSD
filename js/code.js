// change with domain later
//const urlBase = 'http://134.199.204.180/LAMPAPI';
const urlBase = 'http://team15poosd.xyz/LAMPAPI';
const extension = 'php';

let userId = 0;
let firstName = "";
let lastName = "";
let cookieUserId = 0;
let contactToDelete = null;
let currentEditContact = null;
let currentSearchTerm = '';
let isSearchActive = false;
let searchTimeout = null;
enableKonamiComicMode();

document.addEventListener('DOMContentLoaded', function() {
    // check if site is in the contacts page
    if (document.body.dataset.page === 'contacts') {
        setupRealTimeSearch();
    }
});


function doLogin() {
	userId = 0;
	firstName = "";
	lastName = "";

	let login = document.getElementById("loginName").value;
	let password = document.getElementById("loginPassword").value;
	//	var hash = md5( password );
	document.getElementById("loginError").textContent = "";
	
	if (login == "" || password == ""){
	    document.getElementById("loginError").textContent = "Please Enter your Username and Password";
	    return;
	}

	document.getElementById("loginResult").textContent = "";

	let tmp = { login: login, password: password };
	//	var tmp = {login:login,password:hash};
	let jsonPayload = JSON.stringify(tmp);

	let url = urlBase + '/Login.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				let jsonObject = JSON.parse(xhr.responseText);
				userId = jsonObject.id;

				if (!userId || userId < 1) {
					document.getElementById("loginResult").textContent = "Username or Password is incorrect";
					return;
				}

				firstName = jsonObject.firstName;
				lastName = jsonObject.lastName;

				saveCookie();

				window.location.href = "contacts.html";
			}
		};
		xhr.send(jsonPayload);
	}
	catch{
		document.getElementById("loginResult").textContent = "test";
	}

}

function saveCookie() {
	let minutes = 20;
	let date = new Date();
	date.setTime(date.getTime() + (minutes * 60 * 1000));
	document.cookie = "firstName=" + firstName + ",lastName=" + lastName + ",userId=" + userId + ";expires=" + date.toGMTString();

}

function readCookie() {
	userId = -1;
	let data = document.cookie;
	let splits = data.split(",");
	for (var i = 0; i < splits.length; i++) {
		let thisOne = splits[i].trim();
		let tokens = thisOne.split("=");
		if (tokens[0] == "firstName") {
			firstName = tokens[1];
		}
		else if (tokens[0] == "lastName") {
			lastName = tokens[1];
		}
		else if (tokens[0] == "userId") {
			userId = parseInt(tokens[1].trim());
			//fetch(`/LAMPAPI/FetchData.php?userId=${userId}`)
			//.then(response => response.json())
			// .then(data => {
			// console.log(data);
			// Update current page content without reload
			//    });


		}
	}
	console.log(userId);

	if (userId < 0) {
		window.location.href = "index.html";
	}
	else {
		document.getElementById("loginInfo").innerHTML = "Logged in as " + firstName + " " + lastName;
	
	}
}



function doLogout() {
	userId = 0;
	firstName = "";
	lastName = "";
	document.cookie = "firstName= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
	window.location.href = "index.html";
}

function showAddModal() {
	document.getElementById('createModal').showModal();

	document.getElementById('createModal').focus();

}

function cancelCreate() {
	// Close the modal
	document.getElementById('createModal').close();

	// Clear the stored contact and form
	contactToDelete = null;
	document.getElementById('addForm').reset();
}


function addContact() {
	let firstName = document.getElementById("createFirstName").value.trim();
	let lastName = document.getElementById("createLastName").value.trim();
	let phone = document.getElementById("createPhone").value.trim()
	let email = document.getElementById("createEmail").value.trim();

	if (!firstName || !lastName || !phone || !email) {
		alert('All fields are required!');
		return;
	}

	let tmp = { firstName: firstName, lastName: lastName, phone: phone, email: email, userId: userId };
	let jsonPayload = JSON.stringify(tmp);

	let url = urlBase + '/AddColor.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				alert("Contact has been successfully added to Contact Manager!");
				cancelCreate();

				// reload data to show updated data
				getAllData();
			}
			else if (this.readyState == 4) {
				alert("Error creating contact :(. Please try again.");
			}
		};
		xhr.send(jsonPayload);
	}
	catch (err) {
		alert(`Error: ${err.message}`);
	}

}

 function setupRealTimeSearch() {
            const searchInput = document.getElementById('searchText');
            
            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.trim();
                
                // Clear previous timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                
                // If empty, show all contacts immediately
                if (!searchTerm) {
                    clearSearch();
                    return;
                }
                
                // Show that we're about to search
                //alert("Will search in a moment...");
                
                // Debounce the database search (wait 800ms after user stops typing)
                searchTimeout = setTimeout(() => {
                    searchContact();
                }, 800);
            });
        }

function clearSearch() {
    document.getElementById("searchText").value = '';
    getAllData();
}

function searchContact()
{
	let srch = document.getElementById("searchText").value.trim();
	if (!srch) {
        clearSearch();
        return;
    }
	
	currentSearchTerm = srch;
	isSearchActive = true;

	let tmp = {search:srch,userId:userId};
	let jsonPayload = JSON.stringify( tmp );

	let url = urlBase + '/SearchContacts.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				//document.getElementById("colorSearchResult").innerHTML = "Contact(s) has been retrieved";
				let jsonObject = JSON.parse( xhr.responseText );
				
				if(jsonObject.error && jsonObject.error !== "") 
				{
					
					// just show empty table
                    document.querySelector("#ContactCards").innerHTML = "";
					// display error message
					alert(`NO contacts found matching "${currentSearchTerm}"`);
					
				}
				else if (jsonObject.results && Array.isArray(jsonObject.results) && jsonObject.results.length > 0)
				{
					// populate table with results
					populateContactCards(jsonObject.results, srch);

					// display success message with count
					//alert(`Found ${jsonObject.results.length} contact(s) matching "${currentSearchTerm}"`);
				}
				else
				{
					// problems with response format
					console.error("Unexpected response format:", jsonObject);
					alert(`NO contacts found matching "${currentSearchTerm}"`);
				}
			}
			else if(this.readyState == 4) 
			{
                alert("Error searching for contacts. Please try again.");
            }
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		console.error("Error during search:", err);
		//document.getElementById("colorSearchResult").innerHTML = err.message;
	}
}

function doRegister() {
	let firstName = document.getElementById("firstName").value;
	let lastName = document.getElementById("lastName").value;
	let registerUsername = document.getElementById("registerUsername").value;
	let registerPassword = document.getElementById("registerPassword").value;
	document.getElementById("registerResult").innerHTML = "";

	document.getElementById("firstNameErrorMessage").textContent = "";
        document.getElementById("lastNameErrorMessage").textContent = "";
        document.getElementById("usernameErrorMessage").textContent = "";
        document.getElementById("passwordErrorMessage").textContent = "";

	let hasError = false;

	if (firstName == ""){
		const fnErrorMessage = document.getElementById("firstNameErrorMessage");
		fnErrorMessage.textContent = 'Error: First Name cannot be empty!';
		hasError = true;
	}
        if (lastName == "" ){
		const lnErrorMessage = document.getElementById("lastNameErrorMessage");
		lnErrorMessage.textContent = 'Error: Last Name cannot be empty!';
		hasError = true;
	}
	if (registerUsername == ""){
		 const usernameErrorMessage = document.getElementById('usernameErrorMessage'); 
		usernameErrorMessage.textContent = 'Error: Username cannot be empty!';                                                                                                                                                                                                                  hasError = true;
	}
	if (registerPassword == ""){
	     const errorMessage = document.getElementById('passwordErrorMessage');
	     errorMessage.textContent = 'Password cannot be empty!';
	     hasError = true;
	}

	if (hasError){
	  return;
	}

	let tmp = { firstName: firstName, lastName: lastName, registerUsername: registerUsername, registerPassword: registerPassword, userId: userId };
	let jsonPayload = JSON.stringify(tmp);

	let url = urlBase + '/Register.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				document.getElementById("registerResult").innerHTML = "User has been registered!";

				triggerSpideyTransition();
			}
		}
		xhr.send(jsonPayload);
	}
	catch (err) {
		document.getElementById("registerResult").innerHTML = err.message;
	}

}

function showEditModal(contact) {

	currentEditContact = contact;

	// autofill form fields with existing contact
	document.getElementById("editFirstName").value = contact.FirstName;
	document.getElementById("editLastName").value = contact.LastName;
	document.getElementById("editPhone").value = contact.Phone;
	document.getElementById("editEmail").value = contact.Email;

	document.getElementById('currentEditContact').textContent = `${contact.FirstName} ${contact.LastName}`;

	document.getElementById('editModal').showModal();

	document.getElementById('editModal').focus();

}

function cancelEdit() {
	document.getElementById('editModal').close();

	// clear stored contact and form
	contactToDelete = null;
	document.getElementById('editForm').reset();
}

function doEdit() {
	if (!currentEditContact) {
		alert("Error: No contact selected for editing");
		return;
	}

	let firstName = document.getElementById("editFirstName").value.trim();
	let lastName = document.getElementById("editLastName").value.trim();
	let phone = document.getElementById("editPhone").value.trim()
	let email = document.getElementById("editEmail").value.trim();
	// validate input
	if (!firstName || !lastName || !phone || !email) {
		alert('All fields are required!');
		return;
	}


	let tmp = { firstName: firstName, lastName: lastName, phone: phone, email: email, userId: userId, id: currentEditContact.ID };
	console.log("Sending edit data:", tmp);

	let jsonPayload = JSON.stringify(tmp);
	let url = urlBase + '/EditContact.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				alert("Contact has been edited successfully!");

				cancelEdit();

				// reload data to show updated data
				getAllData();
			}
			else if (this.readyState == 4) {

				alert("Error editing contact :(. Please try again.");
			}
		};
		xhr.send(jsonPayload);
	}
	catch (err) {
		alert(`Error: ${err.message}`);
	}

}

function showDeleteModal(contact) {
	contactToDelete = contact;

	// show contact in modal
	document.getElementById('contactToDelete').textContent = `${contact.FirstName} ${contact.LastName}`;
	document.getElementById('deleteModal').showModal();
}

function cancelDelete() {
	document.getElementById('deleteModal').close();

	// clear stored contact
	contactToDelete = null;
}

function doDelete() {
	if (!contactToDelete) {
		alert("No contact selected for deletion");
		return;
	}
	/*
		// Debug logging
		console.log("doDelete called with:", {
			contactId: contactId,
			contactName: contactName,
			userId: userId,
			types: {
				contactId: typeof contactId,
				userId: typeof userId
			}
		});*/


	let tmp = { id: contactToDelete.ID, userId: userId };
	console.log("Sending data:", tmp);
	let jsonPayload = JSON.stringify(tmp);
	let url = urlBase + '/DeleteContact.' + extension;

	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try {
		xhr.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				//document.getElementById("deleteResult").innerHTML = "Contact has been deleted!";
				alert("Contact has been deleted successfully!");

				cancelDelete();

				// reload data to show updated data
				getAllData();
			}
			else if (this.readyState == 4) {

				alert("Error deleting contact :(. Please try again.");
			}
		};
		xhr.send(jsonPayload);
	}
	catch (err) {
		alert(`Error: ${err.message}`);
	}

}

function getAllData()
{
	fetch(`/LAMPAPI/FetchData.php?userId=${userId}`)
    .then(response => {
        return response.json();
    })
    .then(data => {
		populateContactCards(data);
	}) 
	.catch(error => console.error("Error fetching JSON:",error));
}




function populateContactCards(contacts, searchTerm = '') {
  const container = document.querySelector("#ContactCards");
  container.innerHTML = ""; // clear existing cards

  contacts.forEach(item => {
    // outer card container
    const card = document.createElement("div");
    card.classList.add("contact-card");

    // image (frame background)
    const img = document.createElement("img");
    img.src = "images/contactCardFrame.png";  // make sure this path matches your server
    img.alt = "Contact Card Frame";

    // overlay text container
    const overlay = document.createElement("div");
    overlay.classList.add("overlay-text");

    // same variable names from your table version
    const firstnameCell = document.createElement("div");
    firstnameCell.textContent = "First: " + item.FirstName;

    const lastnameCell = document.createElement("div");
    lastnameCell.textContent = "Last: " + item.LastName;

    const phoneCell = document.createElement("div");
    phoneCell.textContent = "Phone: " + item.Phone;

    const emailCell = document.createElement("div");
    emailCell.textContent = "Email: " + item.Email;
	

    // action buttons
    const editButton = document.createElement("button");
    editButton.classList.add("editButton");
    editButton.innerHTML = "<i class='fa fa-solid fa-pencil' title='Edit'></i> Edit";
    editButton.addEventListener("click", () => showEditModal(item));

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("deleteButton");
    deleteButton.innerHTML = "<i class='fa fa-solid fa-trash' title='Delete'></i> Delete";
    deleteButton.addEventListener("click", () => showDeleteModal(item));
     
    const buttonRow = document.createElement("div");
    buttonRow.classList.add("button-row");
    buttonRow.appendChild(editButton);
    buttonRow.appendChild(deleteButton);

    // build overlay content
    overlay.appendChild(firstnameCell);
    overlay.appendChild(lastnameCell);
    overlay.appendChild(phoneCell);
    overlay.appendChild(emailCell);
    overlay.appendChild(buttonRow);
    //overlay.appendChild(editButton);
    //overlay.appendChild(deleteButton);

    // build final card
    card.appendChild(img);
    card.appendChild(overlay);
    container.appendChild(card);
  });
}


/*function populateContactTable(contacts, searchTerm = '') 
{
	const tableBody = document.querySelector("#ContactTable tbody");
	// clear existing rows
	tableBody.innerHTML = "";

	contacts.forEach(item => {

         const row = document.createElement("tr");

         const firstnameCell = document.createElement("td");
         firstnameCell.textContent = item.FirstName;

         const lastnameCell = document.createElement("td");
         lastnameCell.textContent = item.LastName;

         const phoneCell = document.createElement("td");
         phoneCell.textContent = item.Phone;

         const emailCell = document.createElement("td");
         emailCell.textContent = item.Email;

         const actionCell = document.createElement("td");
		 
		 const editButton = document.createElement("button");
         editButton.classList.add("editButton");
         editButton.innerHTML  = "<i class='fa fa-solid fa-pen-to-square'></i> Edit"; 
	//editButton.textContent = "Edit";
         editButton.addEventListener("click", () => showEditModal(item));

         const deleteButton = document.createElement("button");
         deleteButton.classList.add("deleteButton");
         deleteButton.innerHTML  = "<i class='fa fa-solid fa-trash'></i> Delete";  
	//deleteButton.textContent = "Delete";
         deleteButton.addEventListener("click", () => showDeleteModal(item));

         row.appendChild(firstnameCell);
         row.appendChild(lastnameCell);
         row.appendChild(phoneCell);
         row.appendChild(emailCell);
         row.appendChild(editButton);
         row.appendChild(deleteButton); 
	//actionCell.appendChild(editButton);
         //actionCell.appendChild(deleteButton);

         tableBody.appendChild(row);
        });
}/*

/*
function getAllData() {
	fetch(`/LAMPAPI/FetchData.php?userId=${userId}`)
		.then(response => {
			return response.json();
		})
		.then(data => {

			const tableBody = document.querySelector("#ContactTable tbody");
			// clear existing rows
			tableBody.innerHTML = "";

			data.forEach(item => {

				const row = document.createElement("tr");

				const firstnameCell = document.createElement("td");
				firstnameCell.textContent = item.FirstName;

				const lastnameCell = document.createElement("td");
				lastnameCell.textContent = item.LastName;

				const phoneCell = document.createElement("td");
				phoneCell.textContent = item.Phone;

				const emailCell = document.createElement("td");
				emailCell.textContent = item.Email;

				const actionCell = document.createElement("td");

				const editButton = document.createElement("button");
				editButton.classList.add("editButton");
				editButton.textContent = "Edit";
				//editButton.addEventListener("click",() => doEdit(item));
				editButton.addEventListener("click", () => showEditModal(item));

				const deleteButton = document.createElement("button");
				deleteButton.classList.add("deleteButton");
				deleteButton.textContent = "Delete";
				// pass contactID and name to confirm deletion
				//const fullName = `${item.FirstName} ${item.LastName}`;
				//deleteButton.addEventListener("click", () => doDelete(item.ID, fullName));	
				deleteButton.addEventListener("click", () => showDeleteModal(item));

				row.appendChild(firstnameCell);
				row.appendChild(lastnameCell);
				row.appendChild(phoneCell);
				row.appendChild(emailCell);
				row.appendChild(editButton);
				row.appendChild(deleteButton);

				tableBody.appendChild(row);
			});
		})
		.catch(error => console.error("Error fetching JSON:", error));
}*/

function initHamburger() {
	const hamMenu = document.querySelector('.ham-menu');
	const drawer = document.querySelector('.off-screen-menu');
	if (!hamMenu || !drawer) return;

	hamMenu.addEventListener('click', () => {
		const open = hamMenu.classList.toggle('active');
		drawer.classList.toggle('active');
		hamMenu.setAttribute('aria-expanded', open);
	});
}

document.addEventListener('DOMContentLoaded', initHamburger);

function enableKonamiComicMode() {
  const konamiCode = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"
  ];

  let position = 0; //Which step the sequence is in

  document.addEventListener("keydown", function (event) {
    if (event.key === konamiCode[position]) {
      position++;

      if (position === konamiCode.length) {
        activateComicMode();
        position = 0; //Reset after success
      }
    } else {
      position = 0; //Reset only if wrong key
    }
  });

  function activateComicMode() {
    document.body.classList.toggle("comic-mode");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const shield = document.getElementById('shield');
  if (!shield) return;

  let x = 100, y = 100;
  let dx = 6, dy = 6;
  let raf = null;
  let bouncing = false;

  function frame() {
    const w = window.innerWidth, h = window.innerHeight;
    const ow = shield.offsetWidth, oh = shield.offsetHeight;

    x += dx; y += dy;
    if (x + ow >= w || x <= 0) dx = -dx;
    if (y + oh >= h || y <= 0) dy = -dy;

    shield.style.left = x + 'px';
    shield.style.top  = y + 'px';
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    bouncing = false;
  }

  function start() {
    if (bouncing) return;
    bouncing = true;
    frame();
    setTimeout(stop, 7000);  // stop after 6s
  }

  shield.addEventListener('click', start);
});

