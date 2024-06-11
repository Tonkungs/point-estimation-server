"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ws_1 = require("ws");
var wss = new ws_1.WebSocketServer({ port: 8081 });
var Rooms = new Map();
function splitRoom(roomURL) {
    var parts = roomURL.split("/");
    var result = parts[2];
    return result || "";
}
function sendData(data) {
    var sanitizedData = __assign(__assign({}, data), { Members: data.Members.map(function (_a) {
            var ID = _a.ID, UserName = _a.UserName, Point = _a.Point;
            return ({
                ID: ID,
                UserName: UserName,
                Point: Point,
            });
        }) });
    data.Members.forEach(function (member) {
        if (member.Ws.readyState === ws_1.WebSocket.OPEN) {
            member.Ws.send(JSON.stringify(sanitizedData));
            console.log("Client Send");
        }
    });
    return;
}
function actionMessage(ws, data) {
    console.log("Received message: ".concat(data));
    var _a = JSON.parse(data), action = _a.action, roomID = _a.roomID, userData = _a.userData;
    var roomData;
    switch (action) {
        case "JOIN_ROOM":
            if (!Rooms.has(roomID)) {
                var roomDataConfig = {
                    RoomID: roomID,
                    Points: [],
                    IsHide: true,
                    Members: [],
                    Charts: [],
                };
                Rooms.set(roomID, roomDataConfig);
            }
            roomData = Rooms.get(roomID);
            var isFindMember = roomData.Members.findIndex(function (member) { return member.ID === userData.ID; });
            if (isFindMember === -1) {
                roomData === null || roomData === void 0 ? void 0 : roomData.Members.push({
                    ID: userData.ID,
                    UserName: userData.UserName,
                    Point: "",
                    Ws: ws,
                });
            }
            else {
                if (roomData === null || roomData === void 0 ? void 0 : roomData.Members) {
                    roomData.Members[isFindMember].Ws = ws;
                }
            }
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        case "LEAVE_ROOM":
            roomData = Rooms.get(roomID);
            roomData.Members = roomData.Members.filter(function (member) { return member.ID !== userData.ID; });
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        case "ESTIMATE_POINT":
            roomData = Rooms.get(roomID);
            roomData.Members = roomData.Members.map(function (member) {
                if (member.ID === userData.ID) {
                    member.Point = userData.Point;
                }
                return member;
            });
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        case "DELETED_POINT":
            roomData = Rooms.get(roomID);
            roomData.Members = roomData.Members.map(function (member) {
                member.Point = "";
                return member;
            });
            roomData.IsHide = true;
            roomData.Points = [];
            roomData.Points = [];
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        case "SHOW_HIDE_POINT":
            roomData = Rooms.get(roomID);
            roomData.IsHide = !roomData.IsHide;
            var pointCount_1 = new Map();
            roomData.Members.map(function (member) {
                var point = member.Point;
                var currentPoint = pointCount_1.get(point) || 0;
                pointCount_1.set(point, currentPoint + 1);
            });
            // หาคะแนนที่มีคนเลือกมากที่สุด
            var maxCount_1 = 0;
            var mostSelectedPoints_1 = [];
            pointCount_1.forEach(function (count, point) {
                if (count > maxCount_1) {
                    maxCount_1 = count;
                    mostSelectedPoints_1.length = 0; // ล้าง array
                    mostSelectedPoints_1.push(point);
                }
                else if (count === maxCount_1) {
                    mostSelectedPoints_1.push(point);
                }
            });
            roomData.Points = mostSelectedPoints_1;
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        case "CLEAR_MEMBERS":
            roomData = Rooms.get(roomID);
            roomData.Members = [];
            Rooms.set(roomID, roomData);
            sendData(roomData);
            break;
        default:
            console.log("unknown action");
            break;
    }
}
wss.on("connection", function (ws, req) {
    console.log("New client connected");
    ws.on("headers", function (data) {
        console.log("Headers: ".concat(data));
    });
    ws.on("message", function (data) {
        actionMessage(ws, data);
    });
    ws.on("close", function () {
        Rooms.forEach(function (roomData, roomID) {
            roomData.Members = roomData.Members.filter(function (member) { return member.Ws !== ws; });
            Rooms.set(roomID, roomData);
            sendData(roomData);
        });
        console.log("Client disconnected");
    });
});
console.log("WebSocket server is running on ws://localhost:8081");
