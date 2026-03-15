/// <reference types="react-hot-toast" />

declare module "react-hot-toast" {
  export * from "react-hot-toast";

  export function success(arg0: string, p0: { id: string }) {
    throw new Error("Function not implemented.");
  }

  export function error(arg0: string, p0: { id: string }) {
    throw new Error("Function not implemented.");
  }

  export function loading(arg0: string, arg1: { id: string }) {
    throw new Error("Function not implemented.");
  }
}
