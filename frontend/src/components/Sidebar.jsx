import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  Home, 
  HardDrive, 
  Monitor, 
  Users, 
  Clock, 
  Star, 
  AlertCircle, 
  Trash,
  FolderPlus,
  FileUp,
  FolderUp
} from 'lucide-react';

export const Sidebar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view') || 'home';

  const navItems = [
    { name: 'Home', view: 'home', icon: Home },
    { name: 'My Drive', view: 'drive', icon: HardDrive },
  ];

  const secondaryNavItems = [
    { name: 'Recent', view: 'recent', icon: Clock },
    { name: 'Starred', view: 'starred', icon: Star },
  ];

  const tertiaryNavItems = [
    { name: 'Trash', view: 'trash', icon: Trash },
  ];

  return (
    <div style={{ width: '256px', padding: '16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* New Button */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '16px 20px', 
            background: 'white', 
            borderRadius: '16px',
            boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s, box-shadow 0.2s',
            color: 'var(--text-main)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)';
            e.currentTarget.style.background = '#f8f9fa';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)';
            e.currentTarget.style.background = 'white';
          }}
        >
          <Plus size={24} />
          <span>New</span>
        </button>

        {showDropdown && (
          <div style={{ 
            position: 'absolute', 
            top: '100%', 
            left: '0', 
            marginTop: '8px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--border)',
            width: '280px',
            zIndex: 100,
            padding: '8px 0'
          }}>
            <button 
              onClick={() => {
                setShowDropdown(false);
                window.dispatchEvent(new Event('open-new-folder'));
              }}
              style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderPlus size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>New folder</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alt+C then F</span>
            </button>

            <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }}></div>

            <button 
              onClick={() => {
                setShowDropdown(false);
                window.dispatchEvent(new Event('open-upload-image'));
              }}
              style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileUp size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>File upload</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alt+C then U</span>
            </button>

            <button 
              onClick={() => {
                setShowDropdown(false);
                window.dispatchEvent(new Event('open-folder-upload'));
              }}
              style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderUp size={18} color="var(--text-muted)" />
                <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>Folder upload</span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alt+C then I</span>
            </button>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => {
            const isActive = currentView === item.view;
            return (
            <li key={item.name}>
              <Link to={`/?view=${item.view}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 24px', 
                borderRadius: '100px',
                background: isActive ? '#c2e7ff' : 'transparent',
                color: isActive ? '#001d35' : 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: isActive ? '500' : '400',
                fontSize: '14px'
              }}
              onMouseOver={(e) => !isActive && (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseOut={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <item.icon size={20} color={isActive ? '#001d35' : 'var(--text-muted)'} />
                {item.name}
              </Link>
            </li>
          )})}

          <div style={{ margin: '12px 0', borderTop: '1px solid transparent' }}></div>

          {secondaryNavItems.map(item => {
            const isActive = currentView === item.view;
            return (
            <li key={item.name}>
              <Link to={`/?view=${item.view}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 24px', 
                borderRadius: '100px',
                background: isActive ? '#c2e7ff' : 'transparent',
                color: isActive ? '#001d35' : 'var(--text-main)',
                textDecoration: 'none',
                fontWeight: isActive ? '500' : '400',
                fontSize: '14px'
              }}
              onMouseOver={(e) => !isActive && (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseOut={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <item.icon size={20} color={isActive ? '#001d35' : 'var(--text-muted)'} />
                {item.name}
              </Link>
            </li>
          )})}

          <div style={{ margin: '12px 0', borderTop: '1px solid transparent' }}></div>

          {tertiaryNavItems.map(item => {
            const isActive = currentView === item.view;
            return (
            <li key={item.name}>
              <Link to={`/?view=${item.view}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 24px', 
                borderRadius: '100px',
                background: isActive ? '#c2e7ff' : 'transparent',
                color: isActive ? '#001d35' : (item.color || 'var(--text-main)'),
                textDecoration: 'none',
                fontWeight: isActive ? '500' : '400',
                fontSize: '14px'
              }}
              onMouseOver={(e) => !isActive && (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseOut={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <item.icon size={20} color={isActive ? '#001d35' : (item.color || "var(--text-muted)")} />
                {item.name}
              </Link>
            </li>
          )})}
        </ul>
      </nav>
    </div>
  );
};
