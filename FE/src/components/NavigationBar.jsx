// NavigationBar.js
import { Link, Outlet, useLocation } from "react-router-dom";

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
        <Link to="/">로고</Link>
        <div className="flex justify-center items-center gap-20">
          <Link to="/" className={linkStyles("/")}>
            선택 1
          </Link>
          <Link to="/" className={linkStyles("/")}>
            선택 2
          </Link>
          <Link to="/" className={linkStyles("/")}>
            선택 3
          </Link>
          <Link to="/" className={linkStyles("/")}>
            선택 4
          </Link>
        </div>
      </div>
      {/* Outlet을 사용하여 자식 요소 (MainPage)가 이 위치에 렌더링되도록 함 */}
      <Outlet />
    </div>
  );
}
