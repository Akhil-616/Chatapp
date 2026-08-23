import { Mail, Users, Code2, Layers, Palette, ArrowUpRight } from 'lucide-react';

export default function CampusFooter({ onOpenAuth }) {
  return (
    <footer className="pt-20 pb-12 px-6 sm:px-12 max-w-[1180px] mx-auto border-t border-[rgba(23,20,15,0.14)] text-left">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        {/* Left Column */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#17140F] flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 15 4 14.33 4 13.5v-8Z"
                  fill="#F2ECDE"
                />
              </svg>
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-xl text-[#17140F]">
              connectjutti
            </span>
          </div>

          <h3 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight text-[#17140F] leading-tight">
            Talk with your campus circle today.
          </h3>
          <p className="text-sm text-[#6B6355] max-w-md font-['Inter'] leading-relaxed">
            Direct peer messaging, study threads, and group chats built for Kathmandu University, Tribhuvan University, and beyond.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="cj-btn cj-btn-solid"
            >
              Sign up free
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="cj-btn cj-btn-ghost"
            >
              Log in
            </button>
          </div>
        </div>

        {/* Right Columns: Contacts & Creators */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h4 className="text-xs font-bold font-['Space_Mono'] text-[#6B6355] mb-4 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-[#1B6C5D]" />
              <span>Campus Contact</span>
            </h4>
            <ul className="space-y-2.5 text-xs font-['Inter'] text-[#6B6355]">
              <li>
                <a
                  href="mailto:support@connectjutti.edu.np"
                  className="hover:text-[#17140F] transition-colors flex items-center gap-1 group"
                >
                  <span>support@connectjutti.edu.np</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:circle.ku@connectjutti.com"
                  className="hover:text-[#17140F] transition-colors flex items-center gap-1 group"
                >
                  <span>circle.ku@connectjutti.com</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:feedback@connectjutti.edu"
                  className="hover:text-[#17140F] transition-colors flex items-center gap-1 group"
                >
                  <span>feedback@connectjutti.edu</span>
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold font-['Space_Mono'] text-[#6B6355] mb-4 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#EFA23D]" />
              <span>Project Creators</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-[#6B6355]">
              <li className="flex flex-col">
                <span className="text-[#17140F] font-semibold flex items-center gap-1.5">
                  <Code2 className="w-3 h-3 text-[#1B6C5D]" />
                  <span>Aashma Shrestha</span>
                </span>
                <span className="text-[11px] text-[#6B6355] pl-4">Lead Developer &amp; Systems</span>
              </li>
              <li className="flex flex-col">
                <span className="text-[#17140F] font-semibold flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-[#EFA23D]" />
                  <span>Suman Kumar Thapa</span>
                </span>
                <span className="text-[11px] text-[#6B6355] pl-4">Full-Stack &amp; Realtime</span>
              </li>
              <li className="flex flex-col">
                <span className="text-[#17140F] font-semibold flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-[#17140F]" />
                  <span>Rojan KC</span>
                </span>
                <span className="text-[11px] text-[#6B6355] pl-4">UI/UX &amp; Creative Design</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="pt-8 border-t border-[rgba(23,20,15,0.1)] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B6355] gap-4">
        <div className="font-['Space_Grotesk'] font-bold text-[#17140F]">
          ConnectJutti © 2026 · Academic Peer Mesh
        </div>
        <div className="flex items-center gap-6 font-['Inter']">
          <span className="hover:text-[#17140F] transition-colors cursor-pointer">About</span>
          <span className="hover:text-[#17140F] transition-colors cursor-pointer">Campus Circles</span>
          <span className="hover:text-[#17140F] transition-colors cursor-pointer">Privacy Policy</span>
          <span className="hover:text-[#17140F] transition-colors cursor-pointer">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
}
