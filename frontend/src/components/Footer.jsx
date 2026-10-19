
import { Link } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer-simple">
      <div className="container footer-simple-inner">
        <div className="footer-left">
          <div className="footer-logo">
            <ChefHat size={20} />
            <span>RecipeNest</span>
          </div>
          <p className="footer-copy">
            A simple, open recipe collection for home cooks everywhere.
          </p>
        </div>

        <div className="footer-links-row">
          <Link to="/">Home</Link>
          <Link to="/recipes">Recipes</Link>
          <Link to="/recommendations">Recommended</Link>
          <Link to="/favorites">Saved Recipes</Link>
          <Link to="/add-recipe">Add a Recipe</Link>
        </div>
      </div>

      <div className="container footer-bottom-simple">
        <p>© {new Date().getFullYear()} RecipeNest. All rights reserved.</p>
      </div>
    </footer>
  );
}


