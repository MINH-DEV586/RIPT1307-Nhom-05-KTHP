import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

export const socket = io(SOCKET_URL, {
  withCredentials: true, // Important if you need to send cookies
  autoConnect: false, // We connect manually in the component
});
