import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BadComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Missing dependency array
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  const handleClick = () => {
    console.log('Button clicked');
    // Missing event parameter
    alert('Button clicked!');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Bad Component</h1>
      <button onClick={handleClick}>Click Me</button>
      <Link to="/bad-link">Bad Link</Link>
      {/* This comment is not descriptive enough */}
      {data && (
        <div>
          <p>Some data: {data.name}</p>
        </div>
      )}
    </div>
  );
};

export default BadComponent;