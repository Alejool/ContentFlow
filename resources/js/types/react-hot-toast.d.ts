/// <reference types="react-hot-toast" />

declare module 'react-hot-toast' {
  export * from 'react-hot-toast';

  export function success(arg0: string) {
    throw new Error("Function not implemented.");
  }

  export function error(arg0: string) {
    throw new Error("Function not implemented.");
  }
}
