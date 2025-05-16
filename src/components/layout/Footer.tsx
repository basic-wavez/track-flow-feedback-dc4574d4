
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="py-6 px-8 border-t border-wip-gray/30">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© 2025 Demo Manager by Basic Wavez</p>
          <div className="flex gap-4 mt-4 md:mt-0 flex-wrap justify-center">
            <Link to="/terms" className="text-sm text-gray-400 hover:text-wip-pink transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-sm text-gray-400 hover:text-wip-pink transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="text-sm text-gray-400 hover:text-wip-pink transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
