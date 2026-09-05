import { Globe, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import type { LoginProps, ReasonProps, RegisterProps, ValueProps } from "../types";
import clotheShop from "../assets/hero-slides/clothes-shop-chic.webp"
import electronicGadget from "../assets/hero-slides/electronic-gadgets.webp"
import fleshMarket from "../assets/hero-slides/fresh-produce-for-sale-kimironko-market-kigali-rwanda.webp"


export const RegisterFields : { label: string; type: string; placeholder: string; field: keyof RegisterProps }[] = [
  { label: "Name",     type: "text",     placeholder: "Name",     field: "name"     },
  { label: "Email",    type: "email",    placeholder: "Email",    field: "email"    },
  { label: "Password", type: "password", placeholder: "Password", field: "password" },
];

export const LoginFields : { label: string; type: string; placeholder: string; field: keyof LoginProps }[] = [
  { label: "Email",    type: "email",    placeholder: "Email",    field: "email"    },
  { label: "Password", type: "password", placeholder: "Password", field: "password" },
];

export const values : ValueProps[] = [
  {
    icon: ShieldCheck,
    title: "Trust & Quality",
    description: "Every product on Ingeni is carefully vetted to meet the highest standards of quality and reliability.",
  },
  {
    icon: Sparkles,
    title: "Premium Curation",
    description: "We don't sell everything — we sell the right things. Each item is handpicked to elevate your lifestyle.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "From local gems to international brands, Ingeni connects you to the world's finest products.",
  },
  {
    icon: HeartHandshake,
    title: "Customer First",
    description: "Your satisfaction is our priority. We're here before, during, and after every purchase.",
  },
];

export const reasons : ReasonProps[] = [
  { stat: "10K+",  label: "Happy Customers"    },
  { stat: "500+",  label: "Premium Products"   },
  { stat: "50+",   label: "Global Brands"      },
  { stat: "24/7",  label: "Customer Support"   },
];

export const navLinks = [
  { label: "Home",     path: "/"         },
  { label: "About",    path: "/about"    },
  { label: "Products", path: "/products" },
];

// PRODUCT SIDEBAR VARIABLES
export const PRICE_BRACKETS = [
  { label: "Under RF 1,000", min: 0, max: 1000 },
  { label: "RF 1,000 - RF 5,000", min: 1000, max: 5000 },
  { label: "RF 5,000 - RF 10,000", min: 5000, max: 10000 },
  { label: "RF 10,000+", min: 10000, max: 200000 },
];

export   const availableStores = ["TechHub Kigali","Kigali Central Store", "Matrix Hardware", "Prime Gear Rwanda"];

export const RWANDA_LOCATIONS = [
  // Kigali City Hubs
  "Nyarugenge",
  "Nyabugogo",
  "Gasabo",
  "Kicukiro",
  "Kimisagara",
  "Remera",
  "Gisozi",
  "Kacyiru",
  "Kanombe",
  "Gikondo",
  "Nyamirambo",
  "Kimironko",
  "Kigali",
  
  // Western Province & Key Border/Tourist Hubs
  "Rubavu",
  "Musanze",
  "Rusizi",
  "Karongi",
  
  // Southern & Eastern Commercial Centers
  "Huye",
  "Muhanga",
  "Rwamagana",
  "Nyagatare",
  "Bugesera",
];

export const promoSlides = [
    {
      title: "Clothes & Shoes",
      subtitle: "Latest streetwear & local fashion drops",
      image: clotheShop,
      tag: "Trending"
    },
    {
      title: "Electronics & Gadgets",
      subtitle: "Verified tech items with warranty",
      image: electronicGadget,
      tag: "Flash Sale"
    },
    {
      title: "Fresh Marketplace",
      subtitle: "Direct from Rural & Kigali vendors",
      image: fleshMarket,
      tag: "Organic"
    }
  ];