import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div
      style={{
        height: '90%',       
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div>
        <h1
          className="text-[var(--text-color)]"
          style={{ fontSize: '3rem', marginBottom: '0.25rem' }}
        >
          404
        </h1>

        <p
          className="text-[var(--text-color)]"
          style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}
        >
          Oops! The page you’re looking for doesn’t exist.
        </p>

        <Link
          to="/"
          style={{
            color: '#19c6c7',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
