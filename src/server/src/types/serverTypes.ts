export interface User {
  uuid: string;
  state: {
    x: number;
    y: number;
  };
}

export interface Dictionary<T> {
  [key: string]: T;
}
