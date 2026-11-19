import { useEffect, useState } from "react";
import { useProductStore } from "../../store/productStore";
import { useAuthActions, useAuthState } from "../../context/AuthContext";
import { Users, Package, ShoppingCart, ArrowUpRight } from "lucide-react";
import StatCard from "../../features/admin/home/StatCard";
import { useOrderStore } from "../../store/useOrderStore";
import { TrafficAnalyticsCard } from "../../components/admin/TrafficAnalyticsCard";

function Admin() {
  const { fetchProducts, products } = useProductStore();
  const { fetchAllOrders, orders } = useOrderStore();
  const { admin } = useAuthActions();
  const { isLoading: isAuthLoading, user } = useAuthState();

  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [syncWarnings, setSyncWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const init = async () => {
      setLoading(true);
      setSyncWarnings([]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!isMounted) return;

      const warnings: string[] = [];

      const [userResult, productsResult, ordersResult] =
        await Promise.allSettled([
          admin.listUsers({ limit: 1 }),
          fetchProducts(),
          fetchAllOrders(),
        ]);

      if (!isMounted) return;

      if (userResult.status === "fulfilled") {
        const userRes: any = userResult.value;
        const resolvedTotal = userRes?.data?.total ?? userRes?.total ?? 0;
        setUserCount(resolvedTotal);
      } else {
        warnings.push("Users registry endpoint unavailable");
      }

      if (productsResult.status === "rejected") {
        warnings.push("GET /products/public returned 404 or failed");
      }

      if (ordersResult.status === "rejected") {
        warnings.push("GET /orders/admin/all returned 404 or failed");
      }

      setSyncWarnings(warnings);
      setLoading(false);
    };

    void init();

    return () => {
      isMounted = false;
    };
  }, [user, isAuthLoading, admin, fetchProducts, fetchAllOrders]);

  if (isAuthLoading) {
    return (
      <div className="text-white p-6 font-mono text-xs uppercase tracking-widest">
        Verifying session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-red-500 p-6 font-mono text-xs uppercase tracking-widest">
        Access Denied. Admin privileges required.
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase">
            Core Overview
          </h1>
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mt-1">
            System Intelligence &amp; Resource Management
          </p>
        </div>
      </div>

      {syncWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
          Missing or unmapped backend routes: {syncWarnings.join(" • ")}
        </div>
      )}

      {/* Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={loading ? "..." : userCount}
          icon={<Users size={20} />}
          color="text-blue-500"
        />
        <StatCard
          title="Inventory Assets"
          value={loading ? "..." : products.length}
          icon={<Package size={20} />}
          color="text-purple-500"
        />
        <StatCard
          title="Processed Orders"
          value={loading ? "..." : orders.length}
          icon={<ShoppingCart size={20} />}
          color="text-amber-500"
        />
      </div>

      {/* Traffic Analytics Graph/Card Section */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] ml-2">
          Customer Engagement Analytics
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrafficAnalyticsCard
            vendorId="global-store"
            vendorName="Platform Overall"
          />
        </div>
      </div>

      {/* Operational Quick Links */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.4em] ml-2">
          Quick Operations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            href="/admin/users"
            label="Registry"
            desc="Manage User Access"
            accent="group-hover:text-blue-400"
          />
          <QuickLink
            href="/admin/products"
            label="Inventory"
            desc="Catalog Control"
            accent="group-hover:text-purple-400"
          />
          <QuickLink
            href="/admin/orders"
            label="Logistics"
            desc="Order Processing"
            accent="group-hover:text-amber-400"
          />
        </div>
      </div>
    </div>
  );
}

const QuickLink = ({
  href,
  label,
  desc,
  accent,
}: {
  href: string;
  label: string;
  desc: string;
  accent: string;
}) => (
  <a
    href={href}
    className="group p-6 bg-[#0a0a0a] border border-white/5 rounded-4xl hover:bg-white/10 transition-all relative overflow-hidden block"
  >
    <div className="flex justify-between items-center mb-1">
      <span
        className={`text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ${accent} transition-colors`}
      >
        {label}
      </span>
      <ArrowUpRight
        size={14}
        className="text-gray-700 group-hover:text-white transition-colors"
      />
    </div>
    <p className="text-sm font-bold text-white/80">{desc}</p>
  </a>
);

export default Admin;