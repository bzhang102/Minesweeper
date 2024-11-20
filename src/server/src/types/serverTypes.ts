export interface User {
  username: string;
  state: {
    x: number;
    y: number;
  };
}

export interface Dictionary<T> {
  [key: string]: T;
}
