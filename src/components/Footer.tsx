import { PlaySquare, Github, Twitter, Youtube, Sparkles } from 'lucide-react';

interface FooterProps {
  onViewHome: () => void;
  theme?: 'dark' | 'light';
}

export default function Footer({ onViewHome, theme = 'dark' }: FooterProps) {
  return (
    <footer className={`transition-all duration-300 ${theme === 'light' ? 'bg-white border-t border-slate-200 text-slate-600' : 'bg-[#030712] border-t border-slate-800 text-slate-400'} py-12 px-6 md:px-12 mt-auto text-sm`}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div onClick={onViewHome} className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-yellow-600 p-[1px] group-hover:scale-105 transition-transform duration-300">
              <div className={`flex items-center justify-center w-full h-full rounded-[7px] ${theme === 'light' ? 'bg-white' : 'bg-[#030712]'}`}>
                <div className="relative">
                  <PlaySquare className="w-4 h-4 text-amber-500 fill-amber-500/10" strokeWidth={2} />
                  <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-amber-300" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                <span className={`text-lg font-display font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Cine</span>
                <span className="text-lg font-display font-black tracking-tight text-amber-500">Luxe</span>
              </div>
              <span className="text-[7.5px] font-sans font-bold uppercase tracking-[0.2em] text-amber-500/80 -mt-1 block">
                PREMIUM
              </span>
            </div>
          </div>
          <p className={`text-xs leading-relaxed font-sans ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            The ultimate cinematic experience. Rate masterpieces, read authentic community reviews, track your watchlists, and discover curated premium content.
          </p>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h4 className={`text-xs font-sans font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Platform</h4>
          <ul className="space-y-2 text-xs">
            <li><button onClick={onViewHome} className={`hover:text-amber-500 transition-colors cursor-pointer ${theme === 'light' ? 'text-slate-600 hover:text-slate-950' : 'text-slate-300 hover:text-white'}`}>Home</button></li>
            <li><span className={`${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>Streaming Now</span></li>
            <li><span className={`${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>Top Rated Masterpieces</span></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <h4 className={`text-xs font-sans font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Legal & Credits</h4>
          <ul className="space-y-2 text-xs">
            <li><span className={`transition-colors cursor-not-allowed ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Terms of Service</span></li>
            <li><span className={`transition-colors cursor-not-allowed ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Privacy Policy</span></li>
            <li><span className={`font-mono text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Powered by TMDB API & Gemini</span></li>
          </ul>
        </div>

        {/* Community & Socials */}
        <div className="space-y-3">
          <h4 className={`text-xs font-sans font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>Connect</h4>
          <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`}>Join the discussion on our socials.</p>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-300'} hover:text-amber-500 transition-colors cursor-pointer`}>
              <Twitter className="w-4 h-4" />
            </div>
            <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-300'} hover:text-amber-500 transition-colors cursor-pointer`}>
              <Youtube className="w-4 h-4" />
            </div>
            <div className={`p-2 rounded-md ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-300'} hover:text-amber-500 transition-colors cursor-pointer`}>
              <Github className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto pt-6 border-t ${theme === 'light' ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'} text-center text-xs`}>
        © {new Date().getFullYear()} CineLuxe Inc. A premium cinematic showcase.
      </div>
    </footer>
  );
}
