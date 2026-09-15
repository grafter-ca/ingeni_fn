import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_BETTER_AUTH_URL 
  ? `${import.meta.env.VITE_BETTER_AUTH_URL}` 
  : "https://ingeri-api.onrender.com");

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket;

  private constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,

      path: "/socket.io", 
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect() {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }
}

export const socketManager = SocketClient.getInstance();
export const socket = socketManager.socket;