// Create the user chat configuration
function chatConfig(io: any, socket: any) {
  // Emit the status event when a new socket client is connected
  io.emit("chatMessage", {
    type: "status",
    text: "Is now connected",
    created: Date.now(),
    display_name: socket.decoded
      ? socket.decoded.display_name
      : "IMAGE_DEFAUL_PATH"
  });

  // Send a chat messages to all connected sockets when a message is received
  socket.on("chatMessage", (message: any) => {
    message.type = "message";
    message.created = Date.now();
    message.display_name = socket.decoded
      ? socket.decoded.display_name
      : "IMAGE_DEFAUL_PATH";

    // Emit the 'chatMessage' event
    io.emit("chatMessage", message);
  });

  // Emit the status event when a socket client is disconnected
  socket.on("disconnect", () => {
    io.emit("chatMessage", {
      type: "status",
      text: "disconnected",
      created: Date.now(),
      display_name: socket.decoded
        ? socket.decoded.display_name
        : "IMAGE_DEFAUL_PATH"
    });
  });
}

export default chatConfig;
