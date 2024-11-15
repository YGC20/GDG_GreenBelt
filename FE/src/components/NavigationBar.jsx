// NavigationBar.js
import { Link, Outlet, useLocation } from "react-router-dom";
import logo from "../../public/logo.png"; // 로고 이미지 경로


export default function NavigationBar() {
  const location = useLocation();

  const linkStyles = (path) => {
    return location.pathname === path
      ? "text-blue-600 border-b-2 border-blue-600"
      : "text-gray-700 hover:text-blue-600 hover:border-b-2 hover:border-blue-600";
  };

  return (
    <div>
      <div className="border-b-2 h-[8vh] min-h-[75px] flex justify-between items-center px-5">
        <Link to="/">
          <img src={logo} alt="로고" className="h-[50px] w-auto" /> {/* 로고 이미지 */}

        </Link>
        <div className="flex justify-center items-center gap-20">
          <Link to="/" className={linkStyles("/")}>
            건물-난방
          </Link>
          <Link to="/" className={linkStyles("/")}>
            건물-가스
          </Link>
          <Link to="/" className={linkStyles("/")}>
            건물-전기
          </Link>
          <Link to="/" className={linkStyles("/")}>
            교통
          </Link>
        </div>
      </div>
      {/* Outlet을 사용하여 자식 요소 (MainPage)가 이 위치에 렌더링되도록 함 */}
      <Outlet />
    </div>
  );
}
