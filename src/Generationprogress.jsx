import { Sparkles } from 'lucide-react';

export default function GenerationProgress({ businessName, progress, buildStatus }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 z-50 flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div className="animate-bounce">
          <Sparkles className="w-20 h-20 text-white mx-auto" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          Building {businessName}
        </h2>
        
        <div className="max-w-md mx-auto">
          <div className="bg-white/20 rounded-full h-4 overflow-hidden backdrop-blur">
            <div 
              className="bg-white h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/90 text-lg mt-4 font-medium">
            {Math.round(progress)}%
          </p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md mx-auto">
          <p className="text-white text-xl font-medium animate-pulse">
            {buildStatus}
          </p>
        </div>
        
        <p className="text-white/70 text-sm max-w-md mx-auto">
          AI is crafting a unique design just for your business
        </p>
      </div>
    </div>
  );
}
