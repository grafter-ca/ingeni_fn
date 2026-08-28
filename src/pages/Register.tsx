// src/pages/Register.tsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EastAfricanPhoneInput } from "../components/ui/EastAfricanPhoneInput";
import CountrySelect from "../components/ui/CountrySelect";
import { useAuthActions } from "../context/AuthContext";
import { ArrowLeft, MailCheck, Eye, EyeOff, Link as LinkIcon } from "lucide-react";

// Explicit interface matching the auth service context requirements
interface RegisterPayloadProps {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  image?: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthActions();

  const [step, setStep] = useState(1); 
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "RW",
    phone: "",
    image: "", // Direct string URI input field
  });
  
  // Visibility toggles for passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localError) setLocalError(null);
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
        setLocalError("Please fill in all required account fields.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match. Please verify and try again.");
        return;
      }
      if (formData.password.length < 8) {
        setLocalError("Password is too short. It must be at least 8 characters long.");
        return;
      }
      setLocalError(null);
      setStep(2); 
    } else {
      await handleSubmitFinal();
    }
  };

  const handleSubmitFinal = async () => {
    if (!formData.phone || formData.phone.length < 9) {
      setLocalError("Please enter a valid phone number for your region.");
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      // Build strongly typed payload matching RegisterPayloadProps
      const payload: RegisterPayloadProps = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone.trim(),
        country: formData.country,
      };

      // Only assign image if the user provided a non-empty URI string
      if (formData.image && formData.image.trim() !== "") {
        payload.image = formData.image.trim();
      }

      await register(payload);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error("Registration error details:", err);
      const serverMessage = 
        err?.data?.message || 
        err?.response?.data?.message || 
        err?.message || 
        err?.link ||
        "Registration failed. Email might already be in use.";
      
      setLocalError(Array.isArray(serverMessage) ? serverMessage.join(", ") : serverMessage);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col justify-between px-4 py-6 md:py-8 text-zinc-900 dark:text-white transition-colors">
        <header className="max-w-md w-full mx-auto">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-white/10 px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft size={14} /> Back Home
          </button>
        </header>

        <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] p-6 md:p-8 flex flex-col items-center text-center gap-6 shadow-2xl rounded-3xl border border-zinc-200 dark:border-white/10 my-auto mx-auto transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
            <MailCheck size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Check your email</h1>
            <p className="text-sm text-zinc-500 dark:text-gray-400">
              We've sent a secure verification link to <span className="text-zinc-900 dark:text-white font-medium">{formData.email}</span>. Please verify your inbox to activate your account.
            </p>
          </div>

          <div className="w-full pt-4 border-t border-zinc-100 dark:border-white/10">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 rounded-xl transition-colors text-sm cursor-pointer shadow-lg shadow-blue-600/25"
            >
              Proceed to Sign In
            </button>
          </div>
        </div>
        <div className="max-w-md w-full mx-auto hidden md:block" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col justify-between px-4 py-6 md:py-8 text-zinc-900 dark:text-white transition-colors">
      <header className="w-full max-w-md mx-auto mb-4">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.08] border border-zinc-200 dark:border-blue-600 px-3.5 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft size={14} /> Back Home
        </button>
      </header>

      <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] p-6 md:p-8 flex flex-col gap-6 shadow-2xl rounded-3xl border border-zinc-200 dark:border-white/10 my-auto mx-auto transition-colors">
        <div className="flex flex-col items-center text-center gap-2 border-b border-zinc-100 dark:border-white/10 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Join ingeni</h1>
          <p className="text-xs text-zinc-500 dark:text-gray-400 uppercase tracking-widest font-mono">
            Step {step} of 2: {step === 1 ? "Account Credentials" : "Personal Details"}
          </p>
        </div>

        <form onSubmit={handleNextStep} className="flex flex-col gap-4">
          {step === 1 ? (
            <>
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-zinc-700 dark:text-gray-100 font-base text-xs">Full Name</label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    label=""
                    type="text"
                    placeholder="e.g. Joe Doe"
                    value={formData.name}
                    onChange={(val: string) => handleChange("name", val)}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-zinc-700 dark:text-gray-100 font-base text-xs">Email Address</label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    label=""
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(val: string) => handleChange("email", val)}
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-zinc-700 dark:text-gray-100 font-base text-xs">Password</label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    label=""
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(val: string) => handleChange("password", val)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1 relative">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-zinc-700 dark:text-gray-100 font-base text-xs">Confirm Password</label>
                </div>
                <div className="relative flex items-center">
                  <Input
                    label=""
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(val: string) => handleChange("confirmPassword", val)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button label="Continue" type="submit" />
              </div>
            </>
          ) : (
            <>
              {/* Avatar URI Input Section */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-zinc-700 dark:text-gray-100 font-base text-xs">Profile Avatar URI (Optional)</label>
                  <span className="text-[10px] text-zinc-400">e.g. Cloudinary / Unsplash URL</span>
                </div>
                
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-zinc-400 pointer-events-none">
                    <LinkIcon size={16} />
                  </div>
                  <input
                    type="url"
                    placeholder="https://res.cloudinary.com/.../avatar.png"
                    value={formData.image}
                    onChange={(e) => handleChange("image", e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 pl-10 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Example Quick-Fill Link */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-zinc-400">Need a quick test placeholder?</span>
                  <button
                    type="button"
                    onClick={() => handleChange("image", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                  >
                    Use Sample URL
                  </button>
                </div>

                {/* Live Preview Avatar Thumbnail */}
                {formData.image && (
                  <div className="flex items-center gap-3 p-2.5 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 rounded-xl mt-1">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-200 dark:bg-white/10 flex items-center justify-center shrink-0 border border-zinc-300 dark:border-white/10">
                      <img 
                        src={formData.image} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          // Handle broken image links smoothly
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500 truncate flex-1">{formData.image}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-700 dark:text-gray-100 font-base text-xs ml-1">Phone Number</label>
                <EastAfricanPhoneInput
                  value={formData.phone}
                  onChange={(phone: string) => handleChange("phone", phone)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-700 dark:text-gray-100 font-base text-xs ml-1">Country / Region</label>
                <CountrySelect
                  value={formData.country}
                  onChange={(country: string) => handleChange("country", country)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-gray-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-white/15 transition-colors border border-zinc-200 dark:border-white/10 h-11 text-sm flex items-center justify-center cursor-pointer"
                >
                  Back
                </button>
                <div className="w-2/3">
                  <Button 
                    disabled={loading} 
                    label={
                      loading ? (
                        <div className="flex items-center justify-center gap-2.5 w-full">
                          <svg className="animate-spin h-4 w-4 shrink-0 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                          <span className="leading-none whitespace-nowrap overflow-hidden text-ellipsis">Registering...</span>
                        </div>
                      ) : (
                        "Complete Signup"
                      )
                    } 
                    type="submit" 
                  />
                </div>
              </div>
            </>
          )}

          {localError && (
            <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl mt-1">
              <p className="text-red-600 dark:text-red-400 text-xs text-center font-medium">{localError}</p>
            </div>
          )}
        </form>

        <footer className="text-center pt-2 border-t border-zinc-100 dark:border-white/5">
          <p className="text-zinc-500 dark:text-gray-400 text-xs">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-500 dark:hover:text-blue-300 transition-colors">
              Sign In
            </Link>
          </p>
        </footer>
      </div>
      <div className="max-w-md w-full mx-auto hidden md:block" />
    </div>
  );
};

export default Register;