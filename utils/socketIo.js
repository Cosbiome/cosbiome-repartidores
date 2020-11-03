import io from "socket.io-client";

// const endpointserver = 'https://cosbiome-backend.herokuapp.com/';
const endpointserver = "http://192.168.1.74:1337/";

const socketIo = io(endpointserver);

export { socketIo };
