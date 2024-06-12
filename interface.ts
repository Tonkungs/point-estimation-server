import { WebSocket } from "ws";
enum EActionRoom {
  JOIN_ROOM = "JOIN_ROOM",
  LEAVE_ROOM = "LEAVE_ROOM",
  ESTIMATE_POINT = "ESTIMATE_POINT",
  DELETED_POINT = "DELETED_POINT",
  SHOW_HIDE_POINT = "SHOW_HIDE_POINT",
  CLEAR_MEMBERS = "CLEAR_MEMBERS",
}

const EActionType: EActionRoom[] = [
  EActionRoom.JOIN_ROOM,
  EActionRoom.LEAVE_ROOM,
  EActionRoom.ESTIMATE_POINT,
  EActionRoom.DELETED_POINT,
  EActionRoom.SHOW_HIDE_POINT,
  EActionRoom.CLEAR_MEMBERS,
];
// Point Estmation
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
interface IWSRoom {
  action: EActionRoom;
  roomID: string;
  userData: {
    ID: string;
    UserName: string;
    Point: string;
  };
}
// End Point Estimation

// Board
enum ESORTTYPE {
  ASC = "asc",
  DESC = "desc",
  NONE = "none",
}

enum CARDTYPE {
  START = "START",
  END = "END",
  CONTINUE = "CONTINUE",
}

interface ICard {
  UserID: string;
  UserName: string;
  CardID: string;
  Type: CARDTYPE;
  Content: string;
  Like: number;
}

interface IBoard {
  RoomID: string;
  Boards: ICard[];
  Members: IMember[];
  SortType: ESORTTYPE;
  IsTime: boolean;
  TimeStart: string;
  IsBlur: boolean;
  IsEdit: boolean;
  IsPoint: boolean;
  TimeFunc?: NodeJS.Timeout | undefined;
  // TimeFunc?: () => ReturnType<typeof setTimeout> | null;
}

interface IWSBoard {
  action: EActionBoard;
  roomID: string;
  userData: {
    ID: string;
    SortType: ESORTTYPE;
    UserName: string;
    CardID: string;
    Content: string;
    Type: CARDTYPE;
    Like: number;
  };
}
// End Board

enum EActionBoard {
  JOIN_BOARD = "JOIN_BOARD",
  LEAVE_BOARD = "LEAVE_BOARD",
  EDITING_BOARD = "EDITING_BOARD",
  LIKE_BOARD = "LIKE_BOARD",
  REMOVE_BOARD = "REMOVE_BOARD",
  SORTING_BOARD = "SORTING_BOARD",
  IS_TIME_BOARD = "IS_TIME_BOARD",
  IS_BLUR_BOARD = "IS_BLUR_BOARD",
  IS_EDIT_BOARD = "IS_EDIT_BOARD",
  IS_POINT_BOARD = "IS_POINT_BOARD",
}

const EBoardType: EActionBoard[] = [
  EActionBoard.JOIN_BOARD,
  EActionBoard.LEAVE_BOARD,
  EActionBoard.EDITING_BOARD,
  EActionBoard.LIKE_BOARD,
  EActionBoard.REMOVE_BOARD,
  EActionBoard.SORTING_BOARD,
  EActionBoard.IS_TIME_BOARD,
  EActionBoard.IS_BLUR_BOARD,
  EActionBoard.IS_EDIT_BOARD,
  EActionBoard.IS_POINT_BOARD,
];

export {
  IEstimationPoint,
  IMember,
  ESORTTYPE,
  ICard,
  EActionRoom,
  EActionType,
  IWSRoom,
  EActionBoard,
  EBoardType,
  IBoard,
  IWSBoard,
};
