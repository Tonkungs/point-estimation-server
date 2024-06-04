import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

const wss = new WebSocketServer({ port: 8081 });

interface IMember {
  ID: string;
  UserName: string;
  Point: string;
  Ws: WebSocket;
}
interface IEstimationPoint {
  RoomID: string;
  Points: string[];
  Charts: number[];
  IsHide: boolean;
  Members: IMember[];
}

let Rooms = new Map<string, IEstimationPoint>();

function splitRoom(roomURL: string): string {
  let parts = roomURL.split("/");
  let result = parts[2];
  return result || "";
}

function sendData(data: IEstimationPoint) {
  const sanitizedData = {
    ...data,
    Members: data.Members.map(({ ID, UserName, Point }) => ({
      ID,
      UserName,
      Point,
    })),
  };

  data.Members.forEach((member) => {
    if (member.Ws.readyState === WebSocket.OPEN) {
      member.Ws.send(JSON.stringify(sanitizedData));
      console.log(`Client Send`);
    }
  });
  return;
}

function actionMessage(ws: WebSocket, data: string) {
  console.log(`Received message: ${data}`);
  const { action, roomID, userData } = JSON.parse(data);
  let roomData: IEstimationPoint;

  switch (action) {
    case "JOIN_ROOM":
      if (!Rooms.has(roomID)) {
        const roomDataConfig: IEstimationPoint = {
          RoomID: roomID,
          Points: [],
          IsHide: true,
          Members: [],
          Charts: [],
        };

        Rooms.set(roomID, roomDataConfig);
      }

      roomData = Rooms.get(roomID) as IEstimationPoint;

      const isFindMember: number = roomData.Members.findIndex(
        (member) => member.ID === userData.ID
      );

      if (isFindMember === -1) {
        roomData?.Members.push({
          ID: userData.ID,
          UserName: userData.UserName,
          Point: "",
          Ws: ws,
        });
      } else {
        if (roomData?.Members) {
          roomData.Members[isFindMember].Ws = ws;
        }
      }

      Rooms.set(roomID, roomData);
      sendData(roomData);
      break;

    case "LEAVE_ROOM":
      roomData = Rooms.get(roomID) as IEstimationPoint;

      roomData.Members = roomData.Members.filter(
        (member) => member.ID !== userData.ID
      );

      Rooms.set(roomID, roomData);
      sendData(roomData);
      break;

    case "ESTIMATE_POINT":
      roomData = Rooms.get(roomID) as IEstimationPoint;

      roomData.Members = roomData.Members.map((member) => {
        if (member.ID === userData.ID) {
          member.Point = userData.Point;
        }
        return member;
      });

      Rooms.set(roomID, roomData);
      sendData(roomData);
      break;

    case "DELETED_POINT":
      roomData = Rooms.get(roomID) as IEstimationPoint;

      roomData.Members = roomData.Members.map((member) => {
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
      roomData = Rooms.get(roomID) as IEstimationPoint;

      roomData.IsHide = !roomData.IsHide;

      let pointCount = new Map<string, number>();
      roomData.Members.map((member) => {
        const point = member.Point;
        const currentPoint = pointCount.get(point) || 0;
        pointCount.set(point, currentPoint + 1);
      });

      // หาคะแนนที่มีคนเลือกมากที่สุด
      let maxCount = 0;
      let mostSelectedPoints: string[] = [];

      pointCount.forEach((count, point) => {
        if (count > maxCount) {
          maxCount = count;
          mostSelectedPoints.length = 0; // ล้าง array
          mostSelectedPoints.push(point);
        } else if (count === maxCount) {
          mostSelectedPoints.push(point);
        }
      });

      roomData.Points = mostSelectedPoints;
      Rooms.set(roomID, roomData);
      sendData(roomData);
      break;
    case "CLEAR_MEMBERS":
      roomData = Rooms.get(roomID) as IEstimationPoint;

      roomData.Members = [];

      Rooms.set(roomID, roomData);
      sendData(roomData);
      break;

    default:
      console.log("unknown action");
      break;
  }
}

wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
  console.log("New client connected");

  ws.on("headers", (data) => {
    console.log(`Headers: ${data}`);
  });

  ws.on("message", (data: string) => {
    actionMessage(ws, data);
  });

  ws.on("close", () => {
    Rooms.forEach((roomData, roomID) => {
      roomData.Members = roomData.Members.filter((member) => member.Ws !== ws);
      Rooms.set(roomID, roomData);
      sendData(roomData);
    });
    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:8081");
