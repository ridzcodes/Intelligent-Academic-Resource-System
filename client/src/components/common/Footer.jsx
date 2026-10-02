import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Github, Shield, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Purpose */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white">
                Academia<span className="text-brand-400">Resource</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent Academic Resource Retrieval and Recommendation System designed for college students to discover, share, and manage verified study materials.
            </p>
          </div>

          {/* Col 2: Resource Types */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Materials
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse?type=Notes" className="hover:text-brand-400 transition">
                  Lecture Notes
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Textbook" className="hover:text-brand-400 transition">
                  Textbooks & References
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Question+Paper" className="hover:text-brand-400 transition">
                  Previous Question Papers
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Lab+Manual" className="hover:text-brand-400 transition">
                  Lab Manuals & Code
                </Link>
              </li>
              <li>
                <Link to="/browse?type=Assignment" className="hover:text-brand-400 transition">
                  Assignments & Solutions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/browse" className="hover:text-brand-400 transition">
                  Browse All Resources
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-brand-400 transition">
                  Keyword Search
                </Link>
              </li>
              <li>
                <Link to="/upload" className="hover:text-brand-400 transition">
                  Upload Study Material
                </Link>
              </li>
              <li>
                <Link to="/recommendations" className="hover:text-brand-400 transition">
                  Resource Recommendations
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-400 transition">
                  Student / Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Project Info */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Mini Project Details
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-brand-400" />
                <span>College Mini Project 2024-2025</span>
              </p>
              <p className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>JWT & Role-based Auth</span>
              </p>
              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 bg-slate-800 rounded-lg text-[11px] text-slate-300 font-mono">
                  Stack: MERN + Python AI Ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Intelligent Academic Resource System. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Built with modern web standards for academic excellence</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
