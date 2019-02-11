// Load the module dependencies
import configStack from "@config/index";
import { HttpStatus } from "@utils/constants/httpStatus";
import { Codes } from "@utils/constants/codes";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import passport from "passport";
import socketio, { Socket } from "socket.io";
import * as jwt from "jsonwebtoken";
import { Application } from "express";

// Define the Socket.io configuration method
export default (app: Application) => {
  const config = configStack.config;
  let server;
  if (config.secure && config.secure.ssl === true) {
    // Load SSL key and certificate
    const privateKey = fs.readFileSync(
      path.resolve(config.secure.privateKey),
      "utf8"
    );
    const certificate = fs.readFileSync(
      path.resolve(config.secure.certificate),
      "utf8"
    );
    let caBundle;

    try {
      caBundle = fs.readFileSync(path.resolve(config.secure.caBundle), "utf8");
    } catch (err) {
      console.log("Warning: couldn't find or read caBundle file");
    }

    const options = {
      key: privateKey,
      cert: certificate,
      ca: caBundle,
      //  requestCert : true,
      //  rejectUnauthorized : true,
      secureProtocol: "TLSv1_method",
      ciphers: [
        "ECDHE-RSA-AES128-GCM-SHA256",
        "ECDHE-ECDSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES256-GCM-SHA384",
        "ECDHE-ECDSA-AES256-GCM-SHA384",
        "DHE-RSA-AES128-GCM-SHA256",
        "ECDHE-RSA-AES128-SHA256",
        "DHE-RSA-AES128-SHA256",
        "ECDHE-RSA-AES256-SHA384",
        "DHE-RSA-AES256-SHA384",
        "ECDHE-RSA-AES256-SHA256",
        "DHE-RSA-AES256-SHA256",
        "HIGH",
        "!aNULL",
        "!eNULL",
        "!EXPORT",
        "!DES",
        "!RC4",
        "!MD5",
        "!PSK",
        "!SRP",
        "!CAMELLIA"
      ].join(":"),
      honorCipherOrder: true
    };

    // Create new HTTPS Server
    server = https.createServer(options, app);
  } else {
    // Create a new HTTP server
    server = http.createServer(app);
  }
  // Create a new Socket.io server
  const io = socketio.listen(server);

  // Intercept Socket.io's handshake request
  io.use((socket: SocketIOWithJwt, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
      jwt.verify(socket.handshake.query.token, config.jwt.secret, function(
        err: jwt.VerifyErrors,
        decoded: any
      ) {
        if (err) {
          const error = {
            status: HttpStatus.UNAUTHORIZED,
            code: Codes.AUTH__INVALID_USER_TOKEN,
            message:
              "something went wrong when trying to decompilated the token you passed"
          };
          return next(new Error(JSON.stringify(error)));
        }
        socket.decoded = decoded;
        next();
      });
    } else {
      // anonymous user
      next();
    }
  });

  // Add an event listener to the 'connection' event
  io.on("connection", socket => {
    config.files.sockets.forEach(socketConfiguration => {
      require(path.resolve(socketConfiguration)).default(io, socket);
    });
  });

  return server;
};

interface SocketIOWithJwt extends Socket {
  decoded: any;
}
