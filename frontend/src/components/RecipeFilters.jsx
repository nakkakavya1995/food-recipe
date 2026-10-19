import { RotateCcw } from 'lucide-react';

export default function RecipeFilters({ filters, setFilters }) {
  const update = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const hasActiveFilters = Boolean(
    filters.cuisine || filters.meal_type || filters.max_time
  );

  return (
    <div className="filters-bar-simple">
      <div className="filters-controls">
        <select
          id="filter-cuisine"
          value={filters.cuisine || ''}
          onChange={(event) => update('cuisine', event.target.value)}
          aria-label="Filter by cuisine"
          className="select-simple"
        >
          <option value="">All Cuisines</option>
          <option value="Indian">Indian</option>
          <option value="Italian">Italian</option>
          <option value="Chinese">Chinese</option>
          <option value="Mexican">Mexican</option>
          <option value="Continental">Continental</option>
          <option value="American">American</option>
          <option value="Mediterranean">Mediterranean</option>
        </select>

        <select
          id="filter-meal-type"
          value={filters.meal_type || ''}
          onChange={(event) => update('meal_type', event.target.value)}
          aria-label="Filter by meal type"
          className="select-simple"
        >
          <option value="">All Meal Types</option>
          <option value="Breakfast">Breakfast</option>
          <option value="Lunch">Lunch</option>
          <option value="Dinner">Dinner</option>
          <option value="Dessert">Dessert</option>
          <option value="Snack">Snack</option>
        </select>

        <select
          id="filter-cooking-time"
          value={filters.max_time || ''}
          onChange={(event) => update('max_time', event.target.value)}
          aria-label="Filter by cooking time"
          className="select-simple"
        >
          <option value="">Any Cooking Time</option>
          <option value="15">Under 15 minutes</option>
          <option value="20">Under 20 minutes</option>
          <option value="30">Under 30 minutes</option>
          <option value="45">Under 45 minutes</option>
          <option value="60">Under 60 minutes</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset-simple"
            onClick={() =>
              setFilters({
                cuisine: '',
                meal_type: '',
                max_time: '',
              })
            }
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}


