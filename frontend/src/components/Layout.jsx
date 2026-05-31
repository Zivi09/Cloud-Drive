import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { LogOut, Cloud, Search, Settings, X, Camera, File, Folder } from 'lucide-react';
import axios from 'axios';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const [imagesRes, foldersRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/images?q=${encodeURIComponent(searchQuery)}`, config),
          axios.get(`${import.meta.env.VITE_API_URL}/api/folders?q=${encodeURIComponent(searchQuery)}`, config)
        ]);
        
        const folderResults = foldersRes.data.map(f => ({ ...f, type: 'folder' }));
        const imageResults = imagesRes.data.map(img => ({ ...img, type: 'file' }));
        
        setSearchResults([...folderResults, ...imageResults]);
      } catch (err) {
        console.error('Search error', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleSearchResultClick = (result) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (result.type === 'folder') {
      window.dispatchEvent(new CustomEvent('navigate-to-folder', { detail: { folder: result } }));
    } else {
      window.dispatchEvent(new CustomEvent('navigate-to-folder', { detail: { folder: result.folder || null } }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '12px 16px',
        background: 'var(--bg-dark)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ width: '238px', flexShrink: 0 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cloud color="var(--primary)" size={32} />
            <h1 style={{ fontSize: '22px', fontWeight: '400', margin: 0, color: 'var(--text-main)' }}>
              Drive
            </h1>
          </Link>
        </div>

        <div style={{ flex: 1, maxWidth: '720px', margin: '0 20px', position: 'relative' }} ref={searchRef}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: '#e9eef6', 
            borderRadius: showSearchDropdown && searchResults.length > 0 ? '24px 24px 0 0' : '100px', 
            padding: '12px 16px',
            gap: '12px',
            borderBottom: showSearchDropdown && searchResults.length > 0 ? '1px solid #ccc' : 'none'
          }}>
            <Search size={20} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search in Drive" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setShowSearchDropdown(true);
              }}
              style={{ 
                border: 'none', 
                background: 'transparent', 
                outline: 'none', 
                fontSize: '16px', 
                width: '100%',
                color: 'var(--text-main)'
              }} 
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setSearchResults([]); }} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              >
                <X size={16} color="var(--text-muted)" />
              </button>
            )}
          </div>
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              borderRadius: '0 0 24px 24px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 20
            }}>
              {searchResults.map((result) => (
                <div 
                  key={result._id}
                  onClick={() => handleSearchResultClick(result)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    gap: '12px',
                    borderBottom: '1px solid #f1f3f4'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  {result.type === 'folder' ? <Folder size={20} color="var(--text-muted)" fill="var(--text-muted)" /> : <File size={20} color="var(--text-muted)" />}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '14px', color: '#202124' }}>{result.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Location: {result.type === 'folder' ? 'My Drive' : (result.folder ? result.folder.name : 'My Drive')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '238px', justifyContent: 'flex-end', position: 'relative' }}>
          <button 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title="Settings"
          >
            <Settings size={24} color="#5f6368" />
          </button>
          
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ 
              background: '#ff7043', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              color: 'white',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'box-shadow 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'}
            onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
            title={`Account: ${user.username}`}
          >
            {user.username.charAt(0).toUpperCase()}
          </button>

          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              background: '#f0f4f9',
              borderRadius: '24px',
              width: '320px',
              padding: '16px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                <button onClick={() => setShowProfileMenu(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5f6368', padding: '4px', borderRadius: '50%' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ fontSize: '14px', color: '#1f1f1f', marginBottom: '16px' }}>
                {user.username}@dobby.com
              </div>

              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ff7043', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '400' }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'white', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  <Camera size={14} color="#5f6368" />
                </div>
              </div>

              <div style={{ fontSize: '20px', fontWeight: '400', color: '#1f1f1f', marginBottom: '16px' }}>
                Hi, {user.username}!
              </div>

              <button style={{
                background: 'transparent',
                border: '1px solid #747775',
                borderRadius: '100px',
                padding: '8px 16px',
                color: '#0b57d0',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '16px',
                width: '100%',
                transition: 'background 0.2s'
              }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(11,87,208,0.04)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                Manage your Account
              </button>

              <div style={{ width: '100%', display: 'flex' }}>
                <button onClick={logout} style={{
                  flex: 1,
                  background: 'white',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#1f1f1f',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)',
                  transition: 'background 0.2s'
                }} onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'} onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '16px', background: 'white', borderRadius: '16px', marginRight: '16px', marginBottom: '16px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
