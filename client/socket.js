import { io } from "socket.io-client";

const URL = "http://localhost:3000";
const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;