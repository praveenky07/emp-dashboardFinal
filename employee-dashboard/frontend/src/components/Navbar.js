import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Navbar = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <nav className="navbar">
      <div className="navbar-search" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <Search size={20} style={{ marginRight: '0.5rem' }} />
        <input 
          type="text" 
          placeholder="Search..." 
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }}
        />
      </div>
      
      <div className="navbar-user">
        <button style={{ marginRight: '1rem', color: 'var(--text-secondary)' }}>
          <Bell size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '32px', height: '32px', 
            borderRadius: '50%', backgroundColor: 'var(--primary-color)', 
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <User size={18} />
          </div>
          <span>{user.name || user.username || 'User'}</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
