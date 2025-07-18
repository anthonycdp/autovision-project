import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

interface Route {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

interface DotMapProps {
  routes: Route[];
}

const DotMap: React.FC<DotMapProps> = ({ routes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          setDimensions({ width: rect.width, height: rect.height });
        }
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let animationFrameId: number;
    let startTime = Date.now();

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw static dots
      const dotPositions = [
        { x: 0.1, y: 0.3 }, { x: 0.2, y: 0.7 }, { x: 0.3, y: 0.5 }, { x: 0.15, y: 0.6 },
        { x: 0.4, y: 0.2 }, { x: 0.5, y: 0.8 }, { x: 0.6, y: 0.4 }, { x: 0.7, y: 0.6 },
        { x: 0.8, y: 0.3 }, { x: 0.9, y: 0.7 }, { x: 0.25, y: 0.4 }, { x: 0.75, y: 0.5 },
        { x: 0.45, y: 0.6 }, { x: 0.65, y: 0.2 }, { x: 0.85, y: 0.8 }, { x: 0.35, y: 0.9 },
        { x: 0.55, y: 0.1 }, { x: 0.12, y: 0.8 }, { x: 0.88, y: 0.5 }, { x: 0.42, y: 0.35 }
      ];

      dotPositions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x * dimensions.width, pos.y * dimensions.height, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fill();
      });

      // Draw animated routes
      const currentTime = (Date.now() - startTime) / 1000;
      
      routes.forEach((route, index) => {
        const delay = index * 0.8;
        const progress = Math.max(0, Math.min(1, (currentTime - delay) / 3));
        
        if (progress > 0) {
          const fromX = route.from.x * dimensions.width;
          const fromY = route.from.y * dimensions.height;
          const toX = route.to.x * dimensions.width;
          const toY = route.to.y * dimensions.height;
          
          const currentX = fromX + (toX - fromX) * progress;
          const currentY = fromY + (toY - fromY) * progress;
          
          // Draw line trail
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(currentX, currentY);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 * progress})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw moving dot
          ctx.beginPath();
          ctx.arc(currentX, currentY, 3, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(59, 130, 246, ${progress})`;
          ctx.fill();
        }
      });

      // Reset animation after 15 seconds
      if (currentTime > 15) {
        startTime = Date.now();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dimensions, routes]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

interface TravelConnectSignInProps {
  onSignIn?: (email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  title?: string;
  subtitle?: string;
}

export const TravelConnectSignIn: React.FC<TravelConnectSignInProps> = ({
  onSignIn,
  onGoogleSignIn,
  title = "Travel Connect",
  subtitle = "Sign in to access your global travel dashboard and connect with nomads worldwide"
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  const routes: Route[] = [
    { from: { x: 0.1, y: 0.3 }, to: { x: 0.9, y: 0.4 } },
    { from: { x: 0.2, y: 0.7 }, to: { x: 0.8, y: 0.2 } },
    { from: { x: 0.3, y: 0.5 }, to: { x: 0.7, y: 0.8 } },
    { from: { x: 0.15, y: 0.6 }, to: { x: 0.85, y: 0.3 } },
    { from: { x: 0.4, y: 0.2 }, to: { x: 0.6, y: 0.9 } },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSignIn) {
      onSignIn(email, password);
    }
  };

  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn();
    }
  };
  
  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left side - Map */}
        <div className="hidden md:block w-1/2 h-[600px] relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
            <DotMap routes={routes} />
            
            {/* Logo and text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                  {subtitle}
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">Bem-vindo de volta</h1>
            <p className="text-gray-500 mb-8">Acesse sua conta</p>
            
            <div className="mb-6">
              <Button 
                variant="outline"
                className="w-full h-12 bg-white border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Entrar com Google</span>
              </Button>
            </div>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-blue-500">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite seu endereço de email"
                  required
                  className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="bg-gray-50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pr-10 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-2"
              >
                <Button
                  type="submit"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className={`w-full bg-gradient-to-r relative overflow-hidden from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 rounded-lg transition-all duration-300 ${
                    isHovered ? "shadow-lg shadow-blue-200" : ""
                  }`}
                >
                  <span className="flex items-center justify-center">
                    Entrar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                  {isHovered && (
                    <motion.div
                      className="absolute inset-0 bg-white opacity-20"
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </Button>
              </motion.div>
              
              <div className="text-center mt-6">
                <a href="#" className="text-blue-600 hover:text-blue-700 text-sm transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};