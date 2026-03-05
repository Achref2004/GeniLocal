import { createBrowserRouter } from "react-router-dom";
import { BookCover } from "./BookCover";
import { LoginPage } from "./LoginPage";
import { SignUpPage } from "./SignUpPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: BookCover,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignUpPage,
  },
]);
