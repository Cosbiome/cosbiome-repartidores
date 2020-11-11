import io from "socket.io-client";

const endpointserver = "https://cosbiome-backend.herokuapp.com/";
// const endpointserver = "http://192.168.15.195:1337/";

const socketIo = io(endpointserver);

export { socketIo };
