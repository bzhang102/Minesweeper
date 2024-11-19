export interface User {
  uuid: string;
  username: string;
  state: {
    x: number;
    y: number;
  };
}

export interface Dictionary<T> {
  [key: string]: T;
}
