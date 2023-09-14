const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./utils/users');

const publicPath = path.join(__dirname, '../public');
const {
	generateMessage,
	generateLocationMessage,
} = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(publicPath));

io.on('connection', (socket) => {
	console.log('new client connected');

	socket.on('join', (options, callback) => {
		const { error, user } = addUser({ id: socket.id, ...options });
		if (error) {
			return callback(error);
		}
		console.log(user);
		socket.join(user.room);
		socket
			.to(user.room)
			.emit('onConnected', generateMessage('Admin', 'Welcome!'));
		socket.broadcast
			.to(user.room)
			.emit(
				'message',
				generateMessage('Admin', `${user.username} has joined the chat room`)
			);
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
		callback();
	});

	socket.on('sendLocation', (coordinates, callback) => {
		const user = getUser(socket.id);
		if (user) {
			socket.broadcast
				.to(user.room)
				.emit(
					'locationMessage',
					generateLocationMessage(
						user.username,
						`https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
					)
				);
			callback();
		}
	});

	socket.on('sendMessage', (message, callback) => {
		console.log(socket.id);
		console.log(typeof socket.io);
		const user = getUser(socket.id);
		console.log(user);
		if (user) {
			io.to(user.room).emit('message', generateMessage(user.username, message));
		}
		callback();
	});

	socket.on('disconnect', () => {
		const user = getUser(socket.id);
		if (user) {
			io.to(user.room).emit(
				'message',
				generateMessage('Admin', `${user.username} has left the chat!`)
			);
			removeUser(user.id);
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

const port = process.env.port || 3000;
server.listen(port, () => {
	console.log('server is up');
});
