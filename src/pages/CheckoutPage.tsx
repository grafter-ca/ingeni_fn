// src/pages/CheckoutPage.tsx
import { useEffect, useState } from "react";
import { useCartStore } from "../store/cartStore";
import { useOrderStore } from "../store/useOrderStore";
import { useVendorStore } from "../store/vendorStore";
import CheckoutForm from "../components/forms/ChechoutForm";
import {
  Headset,
  MessageCircle,
  Phone,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
  Copy,
  Check,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import type { PaymentMethod } from "../types/api";
import { useAuthState } from "../context/AuthContext";
import { PaymentSecurityGateModal } from "../features/auth/PaymentSecurityGateModal";

const DEFAULT_PROVIDER_BY_METHOD: Record<PaymentMethod, string> = {
  MOBILE_MONEY: "MTN_MOMO",
  CREDIT_CARD: "CARD",
  CASH_ON_DELIVERY: "CASH",
  WORKFORCE_WALLET: "WALLET",
};

const FREE_SHIPPING_THRESHOLD = 10000;
const STANDARD_SHIPPING_FEE = 500;

const getItemVendorId = (item: any): string | undefined =>
  item?.vendorId || item?.product?.vendorId || item?.vendor?.id || undefined;

const CheckoutPage = () => {
  const { items, clearCart, getTotalPrice, getTotalItems } = useCartStore();
  const { vendors, fetchVendors } = useVendorStore();
  const { user } = useAuthState();
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [copiedVendorPhone, setCopiedVendorPhone] = useState<string | null>(
    null,
  );
  const userId = user?.id || null;

  const { createOrder, loading, error } = useOrderStore();

  const location = useLocation();
  const navigate = useNavigate();

  const guestData = location.state?.guestUser;

  const total = Number(getTotalPrice() || 0);
  const totalItems = getTotalItems();

  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("MOBILE_MONEY");

  useEffect(() => {
    if (vendors.length === 0) {
      fetchVendors().catch(() => {});
    }
  }, [vendors.length, fetchVendors]);

  const supportTeam = {
    phone: "+250786015225",
    email: "team@ingenistore.com",
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-poppins flex flex-col items-center justify-center text-gray-900 dark:text-white transition-colors duration-200">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Link
          to="/products"
          className="text-blue-600 dark:text-blue-500 hover:underline"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Check whether any cart item explicitly disables shipping (e.g., digital/pickup-only)
  const hasShippableItems = items.some(
    (item: any) =>
      item.requiresShipping !== false &&
      item.isDigital !== true &&
      item.freeShipping !== true,
  );

  const qualifiesForFreeShipping =
    !hasShippableItems || total > FREE_SHIPPING_THRESHOLD;
  const shipping = qualifiesForFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD + 1 - total,
  );

  const tax = total * 0.18;
  const grandTotal = total + tax + shipping;

  // Unique vendors in the current cart using Vendor fields (storeName, phone)
  const cartVendors = Array.from(
    new Map(
      items.map((item) => {
        const resolvedVendorId = getItemVendorId(item);
        const vendorRecord = vendors.find((v) => v.id === resolvedVendorId);
        const key = resolvedVendorId || item.id;
        return [
          key,
          {
            id: resolvedVendorId || key,
            storeName:
              vendorRecord?.storeName ||
              (item as any)?.product?.vendor?.storeName ||
              "Vendor Store",
            phone:
              vendorRecord?.phone ||
              (item as any)?.product?.vendor?.phone ||
              null,
          },
        ];
      }),
    ).values(),
  );

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedVendorPhone(phone);
      setTimeout(() => {
        setCopiedVendorPhone((prev) => (prev === phone ? null : prev));
      }, 2000);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  const handlePlaceOrder = async ({
    shippingAddress,
    phoneNumber,
    email,
    paymentMethod,
    provider,
    paymentProofUrl,
  }: {
    shippingAddress: string;
    phoneNumber: string;
    email: string;
    paymentMethod: PaymentMethod;
    provider: string;
    paymentProofFile?: File;
    paymentProofUrl?: string;
  }) => {
const validatedItems = items.map((item: any) => {
  const rawId = item.productId || item.id;
  const cleanId = rawId
    ? String(rawId).replace(/^local-/i, "").replace(/^fake-/i, "")
    : "";
  if (!cleanId) {
    throw new Error(`${item.name} is missing productId`);
  }

  const resolvedVendorId =
    getItemVendorId(item) ||
    vendors.find((v) => v.storeName === item.storeName)?.id;

  if (!resolvedVendorId) {
    throw new Error(
      `${item.name} is missing vendorId assignment for multi-vendor distribution`,
    );
  }

  return {
    productId: cleanId,
    vendorId: resolvedVendorId,
    quantity: Number(item.quantity || 1),
  };
});

    const payload = {
      items: validatedItems,
      shippingAddress,
      phoneNumber,
      email,
      paymentMethod,
      provider: provider || DEFAULT_PROVIDER_BY_METHOD[paymentMethod],
      paymentProofUrl: paymentProofUrl || undefined,
      totalAmount: grandTotal,
      taxAmount: tax,
      shippingFees: shipping,
      userId: userId || undefined,
    };

    const order = await createOrder(payload);

    clearCart();
    navigate(`/order-success/${order.orderNumber || order.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white py-10 px-6 font-poppins transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* SUPPORT SECTION */}
        <div className="mb-8 p-6 rounded-3xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-blue-500/25 flex flex-col md:flex-row justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-500">
              <Headset size={24} />
            </div>
            <div>
              <h2 className="font-bold text-blue-600 dark:text-blue-400">
                Need Help?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Contact our support team anytime.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={`tel:${supportTeam.phone}`}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition flex items-center gap-2 text-sm font-medium"
            >
              <Phone size={16} />
              Call
            </a>

            <a
              href={`mailto:${supportTeam.email}`}
              className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition flex items-center gap-2 text-sm font-medium"
            >
              <MessageCircle size={16} />
              Email
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10">
          {/* LEFT: Checkout Form & Payment Methods selector */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/5 rounded-full text-gray-700 dark:text-white transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={22} />
              </button>

              <h1 className="text-2xl font-black uppercase tracking-wide">
                Checkout ({totalItems} items)
              </h1>
            </div>

            <CheckoutForm
              onSubmit={handlePlaceOrder}
              loading={loading}
              error={error}
              totalAmount={grandTotal}
              vendors={cartVendors}
              selectedPayment={selectedPayment}
              onPaymentMethodChange={setSelectedPayment}
              defaultValues={{
                shippingAddress: "Kigali, Rwanda",
                phoneNumber: guestData?.phone || user?.phone || "",
                email: guestData?.email || user?.email || "",
                paymentMethod: selectedPayment,
                provider: DEFAULT_PROVIDER_BY_METHOD[selectedPayment],
              }}
            />

            <div className="mt-8 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4 font-semibold">
                Select Payment Method
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    id: "MOBILE_MONEY" as PaymentMethod,
                    label: "MoMo",
                    icon: Smartphone,
                  },
                  {
                    id: "CREDIT_CARD" as PaymentMethod,
                    label: "Card",
                    icon: CreditCard,
                  },
                  {
                    id: "CASH_ON_DELIVERY" as PaymentMethod,
                    label: "Cash",
                    icon: Banknote,
                  },
                  {
                    id: "WORKFORCE_WALLET" as PaymentMethod,
                    label: "Wallet",
                    icon: Wallet,
                  },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedPayment(method.id)}
                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      selectedPayment === method.id
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                        : "bg-gray-50 dark:bg-[#050505] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <method.icon size={20} />
                    <span className="text-xs font-bold uppercase">
                      {method.label}
                    </span>
                  </button>
                ))}
              </div>

              {selectedPayment === "MOBILE_MONEY" && (
                <div className="mt-5 p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-500/20 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Smartphone size={14} />
                      Mobile Money (MoMo) Payment Numbers
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 dark:text-blue-300">
                      Direct Vendor MoMo
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    You can send your Mobile Money (MoMo) payment directly to the
                    vendor&apos;s registered phone number listed below, or use
                    your MoMo payment code to complete and verify your order:
                  </p>

                  <div className="space-y-2 pt-1">
                    {cartVendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white/90 dark:bg-black/40 px-3.5 py-2.5 rounded-xl border border-gray-200/80 dark:border-white/10"
                      >
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white block">
                            {vendor.storeName}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            Registered MoMo / Mobile Number
                          </span>
                        </div>

                        {vendor.phone ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={`tel:${vendor.phone}`}
                              className="inline-flex items-center gap-1.5 font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <Phone size={13} />
                              {vendor.phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => void handleCopyPhone(vendor.phone!)}
                              title="Copy MoMo number"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-blue-600 hover:text-white text-[11px] font-medium transition cursor-pointer"
                            >
                              {copiedVendorPhone === vendor.phone ? (
                                <>
                                  <Check size={12} className="text-emerald-500" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">
                            No vendor phone — support: {supportTeam.phone}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/5 rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                Order Summary
              </h2>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {items.map((item: any) => {
                  const resolvedVendorId = getItemVendorId(item);
                  const itemVendor = vendors.find(
                    (v) => v.id === resolvedVendorId,
                  );
                  const vendorPhone =
                    itemVendor?.phone || item?.product?.vendor?.phone;
                  const lineTotal = Number(item.price || 0) * item.quantity;

                  return (
                    <div key={item.id} className="flex gap-4 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200 dark:border-white/10"
                      />

                      <div className="flex-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                          {vendorPhone ? ` • MoMo/Tel: ${vendorPhone}` : ""}
                        </p>
                      </div>

                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        RF {lineTotal.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conditional Shipping Information Banner */}
              <div
                className={`mt-6 p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                  qualifiesForFreeShipping
                    ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-500/20 text-amber-800 dark:text-amber-300"
                }`}
              >
                {qualifiesForFreeShipping ? (
                  <PackageCheck
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                  />
                ) : (
                  <Truck
                    size={18}
                    className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                  />
                )}
                <div className="space-y-0.5">
                  <p className="font-bold uppercase tracking-wider text-[11px]">
                    {qualifiesForFreeShipping
                      ? "Free Shipping Applied"
                      : `Shipping Required — RF ${shipping.toLocaleString()}`}
                  </p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {!hasShippableItems
                      ? "No shipping fee applies to the items in your cart."
                      : qualifiesForFreeShipping
                        ? `Your order exceeds RF ${FREE_SHIPPING_THRESHOLD.toLocaleString()} and qualifies for free delivery.`
                        : `Standard delivery fee applies. Add RF ${amountNeededForFreeShipping.toLocaleString()} more to unlock free shipping.`}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-white/5 mt-6 pt-6 space-y-3">
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    RF {total.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Tax (18%)</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    RF {tax.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>Shipping &amp; Delivery</span>
                  {shipping === 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/15">
                        Free Shipping
                      </span>
                      RF 0
                    </span>
                  ) : (
                    <span className="text-gray-900 dark:text-white font-medium">
                      RF {shipping.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-white/5 pt-4 text-blue-600 dark:text-blue-400">
                  <span>Total</span>
                  <span>RF {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Security modal for unauthenticated users */}
              {!user && showPaymentGate && (
                <PaymentSecurityGateModal
                  isOpen={showPaymentGate}
                  onClose={() => setShowPaymentGate(false)}
                  onProceedToPayment={() => {
                    setShowPaymentGate(false);
                    document
                      .querySelector<HTMLFormElement>("#checkout-form")
                      ?.requestSubmit();
                  }}
                />
              )}

              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setShowPaymentGate(true);
                  } else {
                    document
                      .querySelector<HTMLFormElement>("#checkout-form")
                      ?.requestSubmit();
                  }
                }}
                disabled={loading}
                className="w-full mt-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold uppercase transition-colors text-white disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer text-sm tracking-wider"
              >
                {loading ? "Processing..." : "Complete Purchase"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;