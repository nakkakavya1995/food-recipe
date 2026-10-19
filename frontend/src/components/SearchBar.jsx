import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onSubmit,
}) {
  const quickIngredients = ['Paneer', 'Chicken', 'Pasta', 'Salad', 'Curry', 'Desserts'];

  return (
    <div className="search-bar-wrap-simple">
      <form
        className="search-form-simple"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <Search size={18} className="search-icon-simple" />
        <input
          type="search"
          placeholder="Search recipes by name or ingredient..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Search recipes"
        />
        {value && (
          <button
            type="button"
            className="search-clear-simple"
            onClick={() => {
              onChange('');
              onSubmit?.();
            }}
            title="Clear search"
          >
            <X size={15} />
          </button>
        )}
        <button type="submit" className="btn btn-primary search-btn-simple">
          Search
        </button>
      </form>

      <div className="popular-tags-simple">
        <span className="popular-label">Popular:</span>
        {quickIngredients.map((ing) => (
          <button
            key={ing}
            type="button"
            className={`popular-tag-btn ${value.toLowerCase() === ing.toLowerCase() ? 'active' : ''}`}
            onClick={() => {
              onChange(ing);
              setTimeout(() => onSubmit?.(), 50);
            }}
          >
            {ing}
          </button>
        ))}
      </div>
    </div>
  );
}


