const app = require('./app')
const path = require('path');
const port = process.env.PORT || 3000;
const http = require('http')
const socketio = require('socket.io');
const express = require("express");
const Filter = require('bad-words')
const {generateMessages, generateLocationMessage} = require('./utils/messages')
const {removeUser,addUser,getUsersInRoom,getUser} = require('./utils/users')

const server = http.createServer(app);
const io = socketio(server)
const publicDirectorypath = path.join(__dirname, '../public')

app.use(express.static(publicDirectorypath))


io.on('connection', (socket) => {



    socket.on('join', ({username, room},callback) => {
     const {error,user} =  addUser({id: socket.id, username, room})
        if (error){
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessages('Admin : ','Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessages('Admin : ',`${user.username} has joined the room`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        const room = getUser(socket.id).room
        if (filter.isProfane(message) || !getUser(socket.id)) {
            return callback('No bad words !')
        }
        io.to(room).emit('message', generateMessages(getUser(socket.id).username,message))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user){
            io.to(user.room).emit('message', generateMessages('Admin : ',`${user.username} has disconnected`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }

    })

    socket.on('shareLocation', (coords, callback) => {
        const room = getUser(socket.id).room
        io.to(room).emit('Locationmessage', generateLocationMessage(getUser(socket.id).username,coords.latitude, coords.longitude))
        callback()
    })

})

server.listen(port, () => {
    console.log(`Connected to Port ${port}!`)
});
