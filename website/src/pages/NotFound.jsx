import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <div className="text-7xl text-saffron-500">ॐ</div>
      <h1 className="mt-4 text-3xl text-maroon-800">Page not found</h1>
      <p className="mt-2 text-maroon-700">The page you are looking for does not exist.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}

