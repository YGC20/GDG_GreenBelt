import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import NavigationBar from './components/NavigationBar';
import MainPage from './pages/MainPage';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/", // 오타 수정
    element: <NavigationBar />, // 기본 레이아웃
    children: [
      { path: "/", element: <MainPage /> }, // 오타 수정
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
