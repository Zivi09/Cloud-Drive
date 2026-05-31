const express = require('express');
const multer = require('multer');
const path = require('path');
const Image = require('../models/Image');
const Folder = require('../models/Folder');
const { protect } = require('../middleware/auth');
const fs = require('fs');

const router = express.Router();

router.use(protect);

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Get images inside a folder (or root) based on view
router.get('/', async (req, res) => {
  try {
    // 30-day Auto-Delete Cleanup
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expiredImages = await Image.find({ user: req.user._id, isTrashed: true, trashedAt: { $lt: thirtyDaysAgo } });
    for (let img of expiredImages) {
      const fullPath = path.join(__dirname, '..', img.filepath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      await Image.findByIdAndDelete(img._id);
    }

    const { folder, view, q } = req.query;
    let query = { user: req.user._id };
    let sort = { createdAt: -1 };

    if (q) {
      query.isTrashed = { $ne: true };
      query.name = { $regex: q, $options: 'i' };
    } else if (view === 'trash') {
      query.isTrashed = true;
    } else {
      query.isTrashed = { $ne: true };
      if (view === 'recent' || view === 'home') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.updatedAt = { $gte: thirtyDaysAgo };
        sort = { updatedAt: -1 };
      } else if (view === 'starred') {
        query.starred = true;
      } else if (view === 'shared') {
        query.isShared = true;
      } else {
        query.folder = folder || null;
      }
    }

    const images = await Image.find(query).sort(sort).populate('folder', 'name');
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload an image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, folder } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ message: 'Name and image are required' });
    }

    let folderId = folder || null;

    if (folderId) {
      const parentFolder = await Folder.findOne({ _id: folderId, user: req.user._id });
      if (!parentFolder) {
        return res.status(404).json({ message: 'Folder not found or unauthorized' });
      }
    }

    const existingImage = await Image.findOne({ name, folder: folderId, user: req.user._id, isTrashed: false });
    if (existingImage) {
      const oldPath = path.join(__dirname, '..', existingImage.filepath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      existingImage.filepath = `/uploads/${req.file.filename}`;
      existingImage.size = req.file.size;
      await existingImage.save();
      return res.status(200).json(existingImage);
    }

    const image = await Image.create({
      name,
      filepath: `/uploads/${req.file.filename}`,
      size: req.file.size,
      folder: folderId,
      user: req.user._id
    });

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rename an image
router.put('/:id/rename', async (req, res) => {
  try {
    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: req.body.name },
      { returnDocument: 'after' }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle star
router.put('/:id/star', async (req, res) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
    if (!image) return res.status(404).json({ message: 'Image not found' });
    
    const updated = await Image.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { starred: !image.starred } },
      { returnDocument: 'after', timestamps: false }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle share
router.put('/:id/share', async (req, res) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
    if (!image) return res.status(404).json({ message: 'Image not found' });
    image.isShared = true; // For MVP, we just turn it on
    await image.save();
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Copy an image
router.post('/:id/copy', async (req, res) => {
  try {
    const image = await Image.findOne({ _id: req.params.id, user: req.user._id });
    if (!image) return res.status(404).json({ message: 'Image not found' });
    
    // In a real app we'd physically duplicate the file on disk too. 
    // For MVP, we can point to the same physical file but create a new DB record.
    const newImage = await Image.create({
      name: `Copy of ${image.name}`,
      filepath: image.filepath,
      size: image.size,
      folder: image.folder,
      user: req.user._id,
      starred: false,
      isShared: false
    });
    res.status(201).json(newImage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Move an image
router.put('/:id/move', async (req, res) => {
  try {
    let folderId = req.body.folder || null;
    if (folderId) {
      const parentFolder = await Folder.findOne({ _id: folderId, user: req.user._id });
      if (!parentFolder) return res.status(404).json({ message: 'Folder not found or unauthorized' });
    }

    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { folder: folderId },
      { returnDocument: 'after' }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Move to trash (Soft Delete)
router.put('/:id/trash', async (req, res) => {
  try {
    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isTrashed: true, trashedAt: new Date() },
      { returnDocument: 'after' }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restore from trash
router.put('/:id/restore', async (req, res) => {
  try {
    const image = await Image.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isTrashed: false, trashedAt: null },
      { returnDocument: 'after' }
    );
    if (!image) return res.status(404).json({ message: 'Image not found' });
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an image permanently (Hard Delete)
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!image) return res.status(404).json({ message: 'Image not found' });
    
    // Physically delete file
    const fullPath = path.join(__dirname, '..', image.filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    res.json({ message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
