import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/chamachain-logo-transparent.png" alt="ChamaChain Logo" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-cool-steel">
              ChamaChain
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-cool-steel">
            <Link to="/" className="hover:text-pale-sky transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="hover:text-pale-sky transition-colors">
              Dashboard
            </Link>
            <Link to="/create" className="hover:text-pale-sky transition-colors">
              Create
            </Link>
            <Link to="/profile" className="hover:text-pale-sky transition-colors">
              Profile
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Built on Solana Devnet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
