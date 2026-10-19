
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="not-found">
      <span>🍳</span>
      <h1>Oops! Recipe not found.</h1>
      <p>This page seems to be missing from our kitchen.</p>
      <Link className="btn btn-primary" to="/">Back to home</Link>
    </section>
  );
}
