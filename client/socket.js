import { io } from "socket.io-client";

const URL = process.env.NODE_ENV === "production" ? "https://veltro.app" : "http://localhost:5000";
const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
  withCredentials: true,
});

export default socket;