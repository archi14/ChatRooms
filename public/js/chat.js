const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = document.querySelector('input');
const $messageFormButton = document.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector(
	'#location-message-template'
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
});

const autoScroll = () => {
	const $newMessage = $messages.lastElementChild;
	const newMessageStyle = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyle.margin);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
	const visibleHeight = $messages.offsetHeight;
	const containerHeight = $messages.scrollHeight;

	const scrollOffset = $message.scrollTop + visibleHeight;
	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $message.scrollHeight;
	}
};
socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm a'),
	});
	$messages.insertAdjacentHTML('beforeend', html);
});

socket.on('locationMessage', (message) => {
	const html = Mustache.render(locationMessageTemplate, {
		username: message.username,
		createdAt: moment(message.createdAt).format('h:mm a'),
		url: message.url,
	});
	$messages.insertAdjacentHTML('beforeend', html);
});
$locationButton.addEventListener('click', () => {
	$locationButton.setAttribute('disabled', 'disabled');
	if (!navigator.geolocation) {
		return alert('Geolocation is not supported by your browser');
	}

	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			'sendLocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			() => {
				$locationButton.removeAttribute('disabled');
				console.log('Location was recieved successfully!');
			}
		);
	});
});
$messageForm.addEventListener('submit', (event) => {
	event.preventDefault();
	const message = $messageFormInput.value;
	$messageFormButton.setAttribute('disabled', 'disabled');
	$messageFormInput.value = '';
	$messageFormInput.focus();
	socket.emit('sendMessage', message, () => {
		$messageFormButton.removeAttribute('disabled');
		console.log('The message was delivered successfully!');
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	});
	$sidebar.insertAdjacentHTML('beforeend', html);
});
