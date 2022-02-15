const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const formatImage = require('./utils/image');
const Chatdata = require("./model/chatmodel");
const Userdata = require("./model/usermodel");
const moment = require('moment');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";

// Run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    // save new user joining room
    Userdata.find({ username: username, room: room }).then((user) => {
      if (user == "") {
        var userinfo = {
          username: username,
          room: room,
        };
        console.log(userinfo);
        const userData = new Userdata(userinfo);
        userData.save();
      }
    });

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));
    Chatdata.find({ room: user.room })
      .limit(100)
      .sort({ _id: 1 })
      .then(function (chats) {
        chats.map((chat) => {
          console.log(chat);
          if(chat.img===""){
            io.to(user.room).emit(
              "message",
              formatMessage(chat.username, chat.message, chat.img)
            );
          }
          else{
            io.to(user.room).emit(
              "base64 file",
              formatMessage(chat.username, chat.message, chat.img)
            );
          }
        });
      });

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    console.log(`nam: ${user.username} msg: ${msg} room: ${user.room}`);
    var item = {
      username: user.username,
      room: user.room,
      message: msg,
      img:""
    };
    console.log(item);
    const chat = new Chatdata(item);
    chat.save();
    io.to(user.room).emit("message", formatMessage(user.username, msg));
});
socket.on('base64 file', function (msg) {
  const user= getCurrentUser(socket.id);
  
  console.log('received base64 file from' + msg.username);
  socket.username = msg.username;
  io.to(user.room).emit('base64 file', formatMessage(socket.username,"",msg.file));
  var fileUser = {
    username: user.username,
    room: user.room,
    message: "",
    img:msg.file
  };
  const imgUser = new Chatdata(fileUser);
  imgUser.save();

});

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
