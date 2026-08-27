import logo from '../assets/logo.jpg'

interface BrandedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  logoSrc?: string
}

export function BrandedLogo({ size = 'md', className = "", logoSrc }: BrandedLogoProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 p-2',
    md: 'w-32 h-32 p-5',
    lg: 'w-48 h-48 p-8',
    xl: 'w-56 h-56 p-10'
  }

  const src = logoSrc || logo;

  return (
    <div className={`
      relative flex items-center justify-center rounded-full overflow-hidden
      bg-white dark:bg-zinc-950
      shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.5)]
      transition-all duration-500 ease-in-out
      border-4 border-muted/20 dark:border-primary/20
      ${sizeClasses[size]} 
      ${className}
    `}>
      <img 
        src={src} 
        alt="Business Logo" 
        className={`w-full h-full ${logoSrc ? 'object-contain' : 'object-cover rounded-full'} transition-all duration-500 hover:scale-110 active:scale-95 cursor-pointer`} 
      />
      
      {/* Decorative pulse effect in dark mode */}
      <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse -z-10 dark:block hidden" />
    </div>
  )
}
