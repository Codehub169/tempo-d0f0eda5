import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@iconify/react';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth'); // Redirect to auth page after logout
  };

  return (
    <nav className="navbar" style={styles.navbar}>
      <div style={styles.navContainer}>
        <Link to={isAuthenticated ? "/dashboard" : "/auth"} style={styles.brand}>
          <Icon icon="ion:fitness-outline" style={styles.brandIcon} />
          <span style={styles.brandText}>FitTrack Pro</span>
        </Link>
        <div style={styles.navMenu}>
          {isAuthenticated ? (
            <>
              <span style={styles.welcomeMessage}>Welcome, {user?.username}!</span>
              <Link to="/dashboard" style={styles.navLink}>
                <Icon icon="lucide:layout-dashboard" style={styles.linkIcon} /> Dashboard
              </Link>
              {/* <Link to="/log-workout" style={styles.navLink}>Log Workout</Link> */}
              {/* Links to specific sections can be part of the dashboard page */}
              <button onClick={handleLogout} style={{...styles.navLink, ...styles.buttonLink}}>
                <Icon icon="lucide:log-out" style={styles.linkIcon} /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" style={styles.navLink}>
              <Icon icon="lucide:log-in" style={styles.linkIcon} /> Login / Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

// Basic styling - can be moved to App.css or a dedicated CSS file
const styles = {
  navbar: {
    backgroundColor: 'var(--surface-color)',
    padding: '1rem 2rem',
    boxShadow: 'var(--box-shadow-sm)',
    borderBottom: '1px solid var(--border-color, #e0e0e0)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  navContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: 'var(--primary-color)',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  brandIcon: {
    marginRight: '0.5rem',
    fontSize: '1.8rem',
  },
  brandText: {
    fontFamily: 'var(--font-family-headings)',
  },
  navMenu: {
    display: 'flex',
    alignItems: 'center',
  },
  navLink: {
    color: 'var(--text-color)',
    textDecoration: 'none',
    marginLeft: '1.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--border-radius)',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.3s ease, color 0.3s ease',
  },
  linkIcon: {
    marginRight: '0.3rem',
    fontSize: '1.1rem',
  },
  buttonLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'inherit',
  },
  welcomeMessage: {
    color: 'var(--text-color-muted, #6c757d)',
    marginRight: '1.5rem',
    fontSize: '0.9rem',
  }
};

// Hover effects (could be done with pseudo-classes in CSS file too)
// For simplicity, direct style manipulation is avoided here, but in a real app, use CSS modules or styled-components for better hover state handling.
// e.g. onMouseEnter/onMouseLeave or :hover in CSS.

export default Navbar;
