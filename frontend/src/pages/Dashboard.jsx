import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Folder as FolderIcon, 
  Image as ImageIcon, 
  ChevronRight, 
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  HardDrive,
  X,
  Printer,
  Download,
  MoreVertical,
  Minus,
  Plus,
  Search,
  MessageSquarePlus,
  Share,
  UserPlus,
  Edit2,
  Star,
  Copy,
  Info,
  Trash2,
  Move
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [path, setPath] = useState([]);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const currentView = searchParams.get('view') || 'home';
  const fetchIdRef = useRef(0);
  
  // Modals state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageName, setImageName] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  // New action modals state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameId, setRenameId] = useState(null);
  const [newName, setNewName] = useState('');

  const [showOrganizeModal, setShowOrganizeModal] = useState(false);
  const [organizeId, setOrganizeId] = useState(null);
  
  const [showFileInfoModal, setShowFileInfoModal] = useState(false);
  const [infoImage, setInfoImage] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfoModalData, setFileInfoModalData] = useState(null);

  const formatSize = (bytes) => {
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getGroupLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date >= today) return 'Today';
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    if (date >= startOfWeek) return 'Earlier this week';
    
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) return 'Earlier this month';
    if (date.getFullYear() === today.getFullYear()) return 'Earlier this year';
    
    return 'Older';
  };

  const displayImages = (currentView === 'drive' && !currentFolder) ? [] : images;

  const groupImages = () => {
    if (currentView !== 'recent') return { 'All': displayImages };
    const groups = {};
    displayImages.forEach(img => {
      const label = getGroupLabel(img.updatedAt || img.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(img);
    });
    return groups;
  };

  const fetchContents = async () => {
    fetchIdRef.current += 1;
    const currentFetchId = fetchIdRef.current;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      let folderViewParam = '';
      if (currentView === 'home') folderViewParam = '?view=home';
      else if (currentView === 'trash') folderViewParam = '?view=trash';
      else if (currentView === 'starred') folderViewParam = '?view=starred';
      else if (currentView === 'recent') folderViewParam = '?view=recent';
      else if (currentFolder) folderViewParam = `?parent=${currentFolder._id}`;
      
      const folderRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/folders${folderViewParam}`, config);
      const foldersWithSizes = await Promise.all(folderRes.data.map(async (f) => {
        const sizeRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/folders/${f._id}/size`, config);
        return { ...f, size: sizeRes.data.size };
      }));
      
      const folderParam = currentFolder ? `folder=${currentFolder._id}&` : '';
      const viewParam = `view=${currentView}`;
      const imageRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/images?${folderParam}${viewParam}`, config);
      
      if (currentFetchId === fetchIdRef.current) {
        setFolders(foldersWithSizes);
        setImages(imageRes.data);
      }
    } catch (error) {
      console.error(error);
    }
    
    if (currentFetchId === fetchIdRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolder, currentView]);

  useEffect(() => {
    // Reset folder state when switching views via sidebar
    setCurrentFolder(null);
    setPath([]);
  }, [currentView]);

  useEffect(() => {
    const openFolder = () => setShowFolderModal(true);
    const openUpload = () => setShowImageModal(true);
    const openFolderUpload = () => document.getElementById('folderUploadInput')?.click();
    
    const handleNavigateToFolder = (e) => {
      const { folder } = e.detail;
      setSearchParams({ view: 'drive' });
      setCurrentFolder(folder);
      if (folder) {
        setPath([folder]);
      } else {
        setPath([]);
      }
    };

    window.addEventListener('open-new-folder', openFolder);
    window.addEventListener('open-upload-image', openUpload);
    window.addEventListener('open-folder-upload', openFolderUpload);
    window.addEventListener('navigate-to-folder', handleNavigateToFolder);
    
    return () => {
      window.removeEventListener('open-new-folder', openFolder);
      window.removeEventListener('open-upload-image', openUpload);
      window.removeEventListener('open-folder-upload', openFolderUpload);
      window.removeEventListener('navigate-to-folder', handleNavigateToFolder);
    };
  }, []);

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    
    const firstPath = files[0].webkitRelativePath;
    const rootFolderName = firstPath ? firstPath.split('/')[0] : 'New Folder';

    setIsUploading(true);

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const folderRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/folders`, {
        name: rootFolderName,
        parent: currentFolder ? currentFolder._id : null
      }, config);
      
      const newFolderId = folderRes.data._id;

      for (const file of files) {
        const formData = new FormData();
        formData.append('name', file.name);
        formData.append('image', file);
        formData.append('folder', newFolderId);

        await axios.post(`${import.meta.env.VITE_API_URL}/api/images`, formData, {
          headers: { 
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      fetchContents();
    } catch (error) {
      console.error('Error uploading folder:', error);
    }
    
    setIsUploading(false);
    e.target.value = null;
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/folders`, {
        name: newFolderName,
        parent: currentFolder ? currentFolder._id : null
      }, config);
      setNewFolderName('');
      setShowFolderModal(false);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!imageFile) return;
    const formData = new FormData();
    formData.append('name', imageName);
    formData.append('image', imageFile);
    if (currentFolder) formData.append('folder', currentFolder._id);

    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/images`, formData, config);
      setImageName('');
      setImageFile(null);
      setShowImageModal(false);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const navigateToFolder = (folder) => {
    if (currentView !== 'drive') {
      setSearchParams({ view: 'drive' });
      setPath([folder]);
    } else {
      setPath([...path, folder]);
    }
    setCurrentFolder(folder);
  };

  const navigateUp = () => {
    const newPath = [...path];
    newPath.pop();
    setPath(newPath);
    setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null);
  };

  // --- ACTION HANDLERS ---
  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const handleDownload = (img) => {
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_URL}${img.filepath}`;
    link.download = img.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveDropdown(null);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${renameId}/rename`, { name: newName }, config);
      setShowRenameModal(false);
      fetchContents();
    } catch (error) {
      console.error(error);
      alert('Error renaming file. If you just added this feature, please restart your Node.js backend server so the new routes take effect!');
    }
  };

  const handleToggleStar = async (img, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${img._id}/star`, {}, config);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMakeCopy = async (id) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/images/${id}/copy`, {}, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${id}/share`, {}, config);
      alert('Link generated and copied to clipboard! (Simulated)');
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMoveToTrash = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${id}/trash`, {}, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${id}/restore`, {}, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteForever = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/images/${id}`, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFolderToggleStar = async (f, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/folders/${f._id}/star`, {}, config);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFolderMoveToTrash = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/folders/${id}/trash`, {}, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFolderRestore = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/folders/${id}/restore`, {}, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFolderDeleteForever = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/folders/${id}`, config);
      setActiveDropdown(null);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };

  const handleOrganizeSubmit = async (targetFolderId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/images/${organizeId}/move`, { folder: targetFolderId }, config);
      setShowOrganizeModal(false);
      fetchContents();
    } catch (error) {
      console.error(error);
    }
  };
  // -----------------------


  const dropdownMenuStyle = {
    position: 'absolute',
    right: '0',
    top: '100%',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 100,
    width: '220px',
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column'
  };

  const actionBtnStyle = {
    padding: '8px',
    background: 'transparent',
    border: 'none',
    color: '#5f6368',
    cursor: 'pointer',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const dropdownItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    cursor: 'pointer',
    color: '#202124',
    fontSize: '14px'
  };

  const dropdownIconContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  return (
    <div className="fade-in" style={{ padding: '0 20px 20px 20px', position: 'relative' }}>
      
      {/* Dropdown Overlay Listener */}
      {activeDropdown && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }} 
          onClick={() => setActiveDropdown(null)} 
        />
      )}
      
      {/* Alert Banner Removed */}


      {/* Top Actions & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentFolder && (
            <button 
              onClick={navigateUp}
              style={{ padding: '8px', background: 'transparent', borderRadius: '50%', color: 'var(--text-muted)', display: 'flex' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          {currentFolder ? (
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: '400' }}>
              <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => { setPath([]); setCurrentFolder(null); }}>
                My Drive
              </span>
              {path.map((p, idx) => (
                <span key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronRight size={18} color="var(--text-muted)" />
                  <span 
                    style={{ color: idx === path.length - 1 ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => {
                      const newPath = path.slice(0, idx + 1);
                      setPath(newPath);
                      setCurrentFolder(newPath[newPath.length - 1]);
                    }}
                  >
                    {p.name}
                  </span>
                </span>
              ))}
            </h2>
          ) : (
            <h1 style={{ fontSize: '24px', fontWeight: '400', margin: 0 }}>
              {currentView === 'home' ? 'Welcome to Drive' : 
               currentView === 'drive' ? 'My Drive' :
               currentView === 'shared' ? 'Shared with me' :
               currentView === 'recent' ? 'Recent' :
               currentView === 'starred' ? 'Starred' :
               currentView === 'trash' ? 'Trash' : 'Welcome to Drive'}
            </h1>
          )}
        </div>
      </div>

      <input 
        type="file" 
        webkitdirectory="true" 
        directory="true" 
        multiple 
        style={{ display: 'none' }} 
        id="folderUploadInput"
        onChange={handleFolderUpload}
      />

      {isUploading && (
        <div style={{ background: '#e8f0fe', color: '#1967d2', padding: '12px 24px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
          Uploading folder... please wait.
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {folders.length === 0 && images.length === 0 ? (
            currentView === 'trash' ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/empty_trash.png" alt="Trash is empty" style={{ width: '250px', marginBottom: '24px', mixBlendMode: 'multiply' }} />
                <h2 style={{ fontSize: '18px', fontWeight: '400', color: '#202124', margin: '0 0 8px 0' }}>Trash is empty</h2>
                <p style={{ fontSize: '14px', color: '#5f6368', margin: 0 }}>Items moved to the trash will be deleted forever after 30 days</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <FolderIcon size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                <p>Drop your files here or use the New button</p>
              </div>
            )
          ) : (
            <>
              {/* Folders Section */}
              {folders.length > 0 && currentView === 'home' && (
                <div style={{ marginBottom: '32px' }}>
                  {(!currentFolder && (currentView === 'home' || currentView === 'drive')) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', marginBottom: '16px', fontWeight: '500' }}>
                      <ChevronDown size={20} />
                      <span>Suggested folders</span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {folders.map(f => (
                      <div 
                        key={f._id} 
                        className="glass-panel" 
                        style={{ padding: '16px', cursor: 'pointer', background: '#f1f3f4', display: 'flex', flexDirection: 'column' }}
                        onClick={() => navigateToFolder(f)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <FolderIcon size={24} color="#5f6368" fill="#5f6368" />
                          {currentView === 'home' ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', fontWeight: '500', color: '#202124' }}>{f.name}</span>
                              <span style={{ fontSize: '12px', color: '#5f6368' }}>in My Drive</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '14px', fontWeight: '500' }}>{f.name}</span>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatSize(f.size)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files Section (List View) */}
              {(displayImages.length > 0 || (folders.length > 0 && currentView !== 'home')) && (
                <div>
                  {currentView === 'recent' && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#202124' }}>
                        Type <ChevronDown size={14} />
                      </button>
                      <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#202124' }}>
                        People <ChevronDown size={14} />
                      </button>
                      <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#202124' }}>
                        Modified <ChevronDown size={14} />
                      </button>
                      <button style={{ padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'transparent', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#202124' }}>
                        Source <ChevronDown size={14} />
                      </button>
                    </div>
                  )}

                  {currentView === 'home' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#202124', marginBottom: '16px', fontWeight: '500' }}>
                      <ChevronDown size={20} />
                      <span style={{ fontSize: '14px' }}>Suggested files</span>
                    </div>
                  )}

                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      {currentView !== 'home' ? (
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Name</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Owner</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Date modified</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>File size</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500', width: '60px' }}></th>
                        </tr>
                      ) : (
                        <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Name</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Reason suggested</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Owner</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500' }}>Location</th>
                          <th style={{ padding: '12px 16px', fontWeight: '500', width: '200px' }}></th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {currentView !== 'home' && folders.map(f => (
                        <tr 
                          key={f._id} 
                          style={{ 
                            borderBottom: '1px solid var(--border)', 
                            background: activeDropdown === f._id ? '#f4f7fc' : 'transparent',
                            cursor: 'pointer'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f4f7fc'}
                          onMouseOut={(e) => e.currentTarget.style.background = activeDropdown === f._id ? '#f4f7fc' : 'transparent'}
                          onClick={() => navigateToFolder(f)}
                        >
                          <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <FolderIcon size={24} color="#5f6368" fill="#5f6368" />
                            <span style={{ fontWeight: '500', color: activeDropdown === f._id ? '#0b57d0' : '#202124' }}>{f.name}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff7043', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <span>me</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                            {new Date(f.updatedAt || f.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>—</td>
                          <td style={{ padding: '12px 16px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button style={actionBtnStyle} onClick={(e) => handleFolderToggleStar(f, e)} title="Star">
                                <Star size={18} fill={f.starred ? '#f4b400' : 'none'} color={f.starred ? '#f4b400' : 'var(--text-main)'} />
                              </button>
                              <button 
                                style={actionBtnStyle} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === f._id ? null : f._id);
                                }}
                              >
                                <MoreVertical size={18} />
                              </button>
                            </div>

                            {/* Dropdown Menu for Folder */}
                            {activeDropdown === f._id && (
                              <div style={dropdownMenuStyle} onClick={(e) => e.stopPropagation()}>
                                <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameId(f._id);
                                  setNewName(f.name);
                                  setShowRenameModal(true);
                                  setActiveDropdown(null);
                                }}>
                                  <div style={dropdownIconContainerStyle}><Edit2 size={18} color="#5f6368" /> <span>Rename</span></div>
                                </div>
                                
                                <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                                
                                {currentView === 'trash' ? (
                                  <>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleFolderRestore(f._id); }}>
                                      <div style={dropdownIconContainerStyle}><Info size={18} color="#5f6368" /> <span>Restore</span></div>
                                    </div>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleFolderDeleteForever(f._id); }}>
                                      <div style={dropdownIconContainerStyle}><Trash2 size={18} color="#d93025" /> <span style={{color: '#d93025'}}>Delete forever</span></div>
                                    </div>
                                  </>
                                ) : (
                                  <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleFolderMoveToTrash(f._id); }}>
                                    <div style={dropdownIconContainerStyle}><Trash2 size={18} color="#5f6368" /> <span>Move to trash</span></div>
                                    <span style={{ color: '#5f6368', fontSize: '12px' }}>Delete</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {Object.entries(groupImages()).map(([groupLabel, groupImgs]) => (
                        <React.Fragment key={groupLabel}>
                          {currentView === 'recent' && (
                            <tr>
                              <td colSpan="5" style={{ padding: '12px 16px', fontWeight: '500', color: '#202124', fontSize: '14px' }}>{groupLabel}</td>
                            </tr>
                          )}
                          {groupImgs.map(img => (
                            <tr 
                              key={img._id} 
                              style={{ 
                                borderBottom: '1px solid var(--border)', 
                                background: activeDropdown === img._id ? '#f4f7fc' : 'transparent',
                                cursor: 'pointer'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#f4f7fc'}
                              onMouseOut={(e) => e.currentTarget.style.background = activeDropdown === img._id ? '#f4f7fc' : 'transparent'}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setPreviewImage(img);
                                setZoomLevel(1);
                              }}
                            >
                              <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', background: '#f1f3f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <img 
                                      src={`${import.meta.env.VITE_API_URL}${img.filepath}`} 
                                      alt={img.name} 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                      onError={(e) => {
                                        e.target.style.display='none'; 
                                        e.target.nextSibling.style.display='block';
                                      }} 
                                    />
                                    <ImageIcon size={16} color="var(--text-muted)" style={{ display: 'none' }} />
                                  </div>
                                  <span style={{ fontWeight: '500', color: activeDropdown === img._id ? '#0b57d0' : 'inherit' }}>{img.name}</span>
                                </div>
                              </td>
                              {currentView === 'home' && (
                                <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                  You modified • {new Date(img.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              )}
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ff7043', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                    {user.username.charAt(0).toUpperCase()}
                                  </div>
                                  <span>me</span>
                                </div>
                              </td>
                              {currentView !== 'home' && (
                                <>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                                    {new Date(img.updatedAt || img.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </td>
                                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{formatSize(img.size)}</td>
                                </>
                              )}
                              <td style={{ padding: '12px 16px' }}>
                                <div 
                                  style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const folder = img.folder || null;
                                    setSearchParams({ view: 'drive' });
                                    setCurrentFolder(folder);
                                    if (folder) {
                                      setPath([folder]);
                                    } else {
                                      setPath([]);
                                    }
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                                  onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                                >
                                  {img.folder ? <FolderIcon size={16} fill="currentColor" /> : <HardDrive size={16} />}
                                  <span>{img.folder ? img.folder.name : 'My Drive'}</span>
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button style={actionBtnStyle} onClick={(e) => handleToggleStar(img, e)} title="Star">
                                    <Star size={18} fill={img.starred ? '#f4b400' : 'none'} color={img.starred ? '#f4b400' : 'var(--text-main)'} />
                                  </button>
                                  <button 
                                    style={actionBtnStyle} 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(activeDropdown === img._id ? null : img._id);
                                    }}
                                  >
                                    <MoreVertical size={18} />
                                  </button>
                                </div>

                                {/* Dropdown Menu */}
                                {activeDropdown === img._id && (
                                  <div style={dropdownMenuStyle} onClick={(e) => e.stopPropagation()}>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleDownload(img); }}>
                                      <div style={dropdownIconContainerStyle}><Download size={18} color="#5f6368" /> <span>Download</span></div>
                                    </div>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => {
                                      e.stopPropagation();
                                      setRenameId(img._id);
                                      setNewName(img.name);
                                      setShowRenameModal(true);
                                      setActiveDropdown(null);
                                    }}>
                                      <div style={dropdownIconContainerStyle}><Edit2 size={18} color="#5f6368" /> <span>Rename</span></div>
                                    </div>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleMakeCopy(img._id); }}>
                                      <div style={dropdownIconContainerStyle}><Copy size={18} color="#5f6368" /> <span>Make a copy</span></div>
                                    </div>
                                    
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                                    
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleShare(img._id); }}>
                                      <div style={dropdownIconContainerStyle}><Share size={18} color="#5f6368" /> <span>Share</span></div>
                                    </div>
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setOrganizeId(img._id);
                                      setShowOrganizeModal(true);
                                      setActiveDropdown(null);
                                    }}>
                                      <div style={dropdownIconContainerStyle}><FolderIcon size={18} color="#5f6368" /> <span>Organize</span></div>
                                    </div>
                                    
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                                    
                                    <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => {
                                      e.stopPropagation();
                                      setInfoImage(img);
                                      setShowFileInfoModal(true);
                                      setActiveDropdown(null);
                                    }}>
                                      <div style={dropdownIconContainerStyle}><Info size={18} color="#5f6368" /> <span>File information</span></div>
                                    </div>
                                    
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                                    
                                    {currentView === 'trash' ? (
                                      <>
                                        <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleRestore(img._id); }}>
                                          <div style={dropdownIconContainerStyle}><Info size={18} color="#5f6368" /> <span>Restore</span></div>
                                        </div>
                                        <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleDeleteForever(img._id); }}>
                                          <div style={dropdownIconContainerStyle}><Trash2 size={18} color="#d93025" /> <span style={{color: '#d93025'}}>Delete forever</span></div>
                                        </div>
                                      </>
                                    ) : (
                                      <div style={dropdownItemStyle} onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'} onClick={(e) => { e.stopPropagation(); handleMoveToTrash(img._id); }}>
                                        <div style={dropdownIconContainerStyle}><Trash2 size={18} color="#5f6368" /> <span>Move to trash</span></div>
                                        <span style={{ color: '#5f6368', fontSize: '12px' }}>Delete</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {showFolderModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>New folder</h3>
            <form onSubmit={handleCreateFolder}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Folder Name" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowFolderModal(false)} style={{ padding: '10px 20px', color: 'var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '500', color: 'var(--text-main)' }}>Upload file</h3>
            <form onSubmit={handleUploadImage}>
              <div style={{ marginBottom: '15px' }}>
                <input 
                  type="text" 
                  value={imageName} 
                  onChange={(e) => setImageName(e.target.value)} 
                  placeholder="File name" 
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '14px' }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <input 
                  type="file" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setImageFile(file);
                    if (file && !imageName) {
                      setImageName(file.name);
                    }
                  }} 
                  required 
                  style={{ width: '100%', fontSize: '14px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowImageModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '350px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '500', color: '#202124' }}>Rename</h3>
            <form onSubmit={handleRenameSubmit}>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                autoFocus
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '2px solid #1a73e8', fontSize: '14px', marginBottom: '24px', outline: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setShowRenameModal(false)} style={{ padding: '8px 16px', color: '#1a73e8', background: 'transparent', border: 'none', fontWeight: '500', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', color: '#1a73e8', background: 'transparent', border: '1px solid #1a73e8', fontWeight: '500', cursor: 'pointer', borderRadius: '4px' }}>OK</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Organize Modal */}
      {showOrganizeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '500', color: '#202124' }}>Move to</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
              <div 
                style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e8eaed' }}
                onClick={() => handleOrganizeSubmit(null)}
                onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <HardDrive size={20} color="#5f6368" />
                <span style={{ fontSize: '14px', color: '#202124' }}>My Drive</span>
              </div>
              {folders.map(f => (
                <div 
                  key={f._id}
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e8eaed' }}
                  onClick={() => handleOrganizeSubmit(f._id)}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f1f3f4'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FolderIcon size={20} color="#5f6368" fill="#5f6368" />
                  <span style={{ fontSize: '14px', color: '#202124' }}>{f.name}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" onClick={() => setShowOrganizeModal(false)} style={{ padding: '8px 16px', color: '#1a73e8', background: 'transparent', border: 'none', fontWeight: '500', cursor: 'pointer', borderRadius: '4px' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* File Info Modal */}
      {showFileInfoModal && infoImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ padding: '24px', width: '100%', maxWidth: '350px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: '#202124' }}>File information</h3>
              <button onClick={() => setShowFileInfoModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}><X size={20} color="#5f6368" /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Name</span>
                <span style={{ color: '#202124', wordBreak: 'break-all' }}>{infoImage.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Size</span>
                <span style={{ color: '#202124' }}>{formatSize(infoImage.size)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Storage used</span>
                <span style={{ color: '#202124' }}>{formatSize(infoImage.size)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Location</span>
                <span style={{ color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={16} color="#5f6368" /> {currentFolder ? currentFolder.name : 'My Drive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Owner</span>
                <span style={{ color: '#202124', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ff7043', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  me
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Modified</span>
                <span style={{ color: '#202124' }}>{new Date(infoImage.updatedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr' }}>
                <span style={{ color: '#5f6368' }}>Created</span>
                <span style={{ color: '#202124' }}>{new Date(infoImage.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Preview Modal */}
      {previewImage && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(32, 33, 36, 0.95)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            color: 'white',
          }}>
            {/* Left section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
              <button 
                onClick={() => setPreviewImage(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#e8eaed',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  borderRadius: '50%',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <X size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', background: '#ea4335', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={12} color="white" />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '500', color: '#e8eaed' }}>{previewImage.name}</span>
              </div>
            </div>

            {/* Middle section */}
            <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
            </div>

            {/* Right section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '200px', justifyContent: 'flex-end' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><Printer size={20} /></button>
              <button style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}><Download size={20} /></button>
            </div>
          </div>

          {/* Image Container */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            paddingBottom: '100px',
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0,
            minWidth: 0
          }}>
            <img 
              src={`${import.meta.env.VITE_API_URL}${previewImage.filepath}`} 
              alt={previewImage.name} 
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                background: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                display: 'block',
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.2s ease-in-out',
                transformOrigin: 'center center'
              }}
            />
          </div>

          {/* Bottom Zoom Controls */}
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <div style={{
              background: 'rgba(32, 33, 36, 0.9)',
              border: '1px solid #5f6368',
              borderRadius: '100px',
              padding: '6px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))} style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', padding: '4px', display: 'flex' }}><Minus size={16} /></button>
              <button onClick={() => setZoomLevel(1)} style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', padding: '4px', display: 'flex' }}><Search size={16} /></button>
              <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))} style={{ background: 'transparent', border: 'none', color: '#e8eaed', cursor: 'pointer', padding: '4px', display: 'flex' }}><Plus size={16} /></button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
