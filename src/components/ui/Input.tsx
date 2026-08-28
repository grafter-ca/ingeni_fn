type InputProps = {
    label?: string;
    type: string;
    placeholder?: string;
    value?: string;
    name?: string;
    onChange?: (value: string) => void;
    error?: string | undefined;
    className?: string;
    required?: boolean;
};

export const Input = ({ label, type, placeholder, value, onChange, error, className, required }: InputProps) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            {label && (
                <label className="text-zinc-700 dark:text-gray-300 font-mono text-xs ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input 
                required={required} 
                type={type} 
                placeholder={placeholder} 
                value={value} 
                name={label} 
                onChange={(e) => onChange?.(e.target.value)} 
                className={className ?? "w-full bg-zinc-50 dark:bg-white/[0.03] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 px-3.5 py-2.5 rounded-xl text-sm transition-all shadow-sm"} 
            />
            {error && <p className="font-poppins text-xs text-red-500 mt-0.5 ml-1">{error}</p>}
        </div>
    );
};

export default Input;