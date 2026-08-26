// src/components/common/ProtocolHandler.tsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function ProtocolHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (location.pathname === "/open") {
      const targetUrl = params.get("url");
      if (targetUrl) navigate(targetUrl);
    } else if (location.pathname === "/product") {
      const productRef = params.get("ref");
      if (productRef) navigate(`/products/${productRef}`);
    } else if (location.pathname === "/scanner") {
      const code = params.get("code");
      if (code) navigate(`/scan-results?code=${code}`);
    }
  }, [location, navigate]);

  return null;
}