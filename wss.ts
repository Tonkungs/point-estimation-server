import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import {
  EActionBoard,
  EActionRoom,
  EActionType,
  EBoardType,
  ESORTTYPE,
  IBoard,
  ICard,
  IEstimationPoint,
  IWSBoard,
  IWSRoom,
} from "./interface";

const wss = new WebSocketServer({ port: 8081 });
let Rooms = new Map<string, IEstimationPoint | IBoard>();

function sendData(data: IEstimationPoint | IBoard) {
  let sanitizedData = {
    ...data,
    Members: data.Members.map(({ ID, UserName, Point }) => ({
      ID,
      UserName,
      Point,
    })),
  };

  if ("TimeFunc" in data) {
    let newSanitzendData = sanitizedData as IBoard;
    delete newSanitzendData.TimeFunc;
    sanitizedData = JSON.parse(JSON.stringify(sanitizedData));
  }

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
  const { action, roomID, userData }: IWSRoom | IWSBoard = JSON.parse(data);

  if (EActionType.includes(action as EActionRoom)) {
    let roomData: IEstimationPoint;
    switch (action) {
      case EActionRoom.JOIN_ROOM:
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
      case EActionRoom.LEAVE_ROOM:
        roomData = Rooms.get(roomID) as IEstimationPoint;

        roomData.Members = roomData.Members.filter(
          (member) => member.ID !== userData.ID
        );

        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionRoom.ESTIMATE_POINT:
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
      case EActionRoom.DELETED_POINT:
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
      case EActionRoom.SHOW_HIDE_POINT:
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
      case EActionRoom.CLEAR_MEMBERS:
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

  if (EBoardType.includes(action as EActionBoard)) {
    let roomData: IBoard;

    switch (action) {
      case EActionBoard.JOIN_BOARD:
        if (!Rooms.has(roomID)) {
          const roomDataConfig: IBoard = {
            RoomID: roomID,
            Boards: [],
            SortType: ESORTTYPE.NONE,
            Members: [],
            IsTime: false,
            TimeStart: "15:00",
            IsBlur: false,
            IsEdit: false,
            IsPoint: false,
          };

          Rooms.set(roomID, roomDataConfig);
        }

        roomData = Rooms.get(roomID) as IBoard;

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
      case EActionBoard.LEAVE_BOARD:
        roomData = Rooms.get(roomID) as IBoard;

        roomData.Members = roomData.Members.filter(
          (member) => member.ID !== userData.ID
        );

        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionBoard.EDITING_BOARD:
        roomData = Rooms.get(roomID) as IBoard;

        const resultCard: number = roomData.Boards.findIndex(
          (card) => card.CardID === userData.CardID
        );

        if (resultCard === -1) {
          roomData.Boards = [
            ...roomData.Boards,
            {
              UserID: userData.ID,
              UserName: userData.UserName,
              CardID: userData.CardID,
              Type: userData.Type,
              Content: userData.Content,
              Like: 0,
            },
          ];
        } else {
          roomData.Boards[resultCard] = {
            ...roomData.Boards[resultCard],
            Content: userData.Content,
            Like: userData.Like,
          };
        }

        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionBoard.REMOVE_BOARD:
        roomData = Rooms.get(roomID) as IBoard;
        roomData.Boards = roomData.Boards.filter(
          (card) => card.CardID !== userData.CardID
        );
        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionBoard.SORTING_BOARD:
        // roomData = Rooms.get(roomID) as IBoard;
        // roomData.SortType = userData.SortType;
        // Rooms.set(roomID, roomData);
        // sendData(roomData);
        break;
      case EActionBoard.IS_TIME_BOARD:
        roomData = Rooms.get(roomID) as IBoard;
        roomData.IsTime = !roomData.IsTime;

        if (roomData.IsTime) {
          const split = roomData.TimeStart.split(":");
          let newTime: number = parseInt(split[0]);
          let newSecond: number = parseInt(split[1]);

          roomData.TimeFunc = setInterval(() => {
            if (newSecond === 0) {
              newTime = newTime - 1;
              newSecond = 60;
            }

            newSecond = newSecond - 1;
            let newTimePaddingString = newTime.toString().padStart(2, "0");
            let newSecondStringPadding = newSecond.toString().padStart(2, "0");
            roomData.TimeStart = `${newTimePaddingString}:${newSecondStringPadding}`;
            Rooms.set(roomID, roomData);
            sendData(roomData);

            if (newTime < 0) {
              clearInterval(roomData.TimeFunc);
              Rooms.set(roomID, roomData);
              sendData(roomData);
            }
          }, 1000);
        } else {
          clearInterval(roomData.TimeFunc);
          Rooms.set(roomID, roomData);
          sendData(roomData);
        }
        break;
      case EActionBoard.IS_BLUR_BOARD:
        roomData = Rooms.get(roomID) as IBoard;
        roomData.IsBlur = !roomData.IsBlur;
        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionBoard.IS_EDIT_BOARD:
        roomData = Rooms.get(roomID) as IBoard;
        roomData.IsEdit = !roomData.IsEdit;
        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;
      case EActionBoard.IS_POINT_BOARD:
        roomData = Rooms.get(roomID) as IBoard;
        roomData.IsPoint = !roomData.IsPoint;
        Rooms.set(roomID, roomData);
        sendData(roomData);
        break;

      default:
        break;
    }
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

    if (Rooms.size === 0) {
      Rooms.clear();
    }

    console.log("Client disconnected");
  });
});

console.log("WebSocket server is running on ws://localhost:8081");
