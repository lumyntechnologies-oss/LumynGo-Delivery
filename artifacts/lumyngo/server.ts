import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store io globally for use in API routes
  (global as { io?: SocketIOServer }).io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-order", (orderId: string) => {
      socket.join(`order-${orderId}`);
      console.log(`Socket ${socket.id} joined order-${orderId}`);
    });

    socket.on("join-rider", (riderId: string) => {
      socket.join(`rider-${riderId}`);
      console.log(`Socket ${socket.id} joined rider-${riderId}`);
    });

    socket.on(
      "rider-location",
      (data: { orderId: string; lat: number; lng: number; riderId: string }) => {
        io.to(`order-${data.orderId}`).emit("location-update", {
          lat: data.lat,
          lng: data.lng,
          riderId: data.riderId,
        });
      }
    );

    socket.on(
      "order-status",
      (data: { orderId: string; status: string; customerId: string }) => {
        io.to(`order-${data.orderId}`).emit("status-update", {
          orderId: data.orderId,
          status: data.status,
        });
      }
    );

    socket.on(
      "new-order",
      (data: { orderId: string; city?: string }) => {
        io.emit("order-available", data);
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> LumynGo ready on http://${hostname}:${port}`);
    });
});
