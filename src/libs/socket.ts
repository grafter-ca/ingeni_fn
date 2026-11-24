import { io, Socket } from "socket.io-client";

const resolveSocketUrl = (): string => {
  const rawSocketEnv = (import.meta.env.VITE_SOCKET_URL || "").trim();
  if (rawSocketEnv) {
    return rawSocketEnv.replace(/\/+$/, "").replace(/\/api$/, "");
  }

  const rawEnvUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (rawEnvUrl) {
    return rawEnvUrl.replace(/\/+$/, "").replace(/\/api$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:8000";
  }

  return "https://ingeri-api.onrender.com";
};

const SOCKET_URL = resolveSocketUrl();

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket;

  private constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      path: "/socket.io",
      withCredentials: true,
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