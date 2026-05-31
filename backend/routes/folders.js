const express = require('express');
const mongoose = require('mongoose');
const Folder = require('../models/Folder');
const Image = require('../models/Image');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Get folders inside a parent folder (or root)
router.get('/', async (req, res) => {
  try {
    const parent = req.query.parent || null;
    const view = req.query.view || null;
    const q = req.query.q || null;
    
    let query = { user: req.user._id };
    let sort = { name: 1 };
    let limit = 0;

    if (q) {
      query.name = { $regex: q, $options: 'i' };
      query.isTrashed = { $ne: true };
    } else if (view === 'home') {
      sort = { updatedAt: -1 };
      limit = 4;
      query.parent = null;
      query.isTrashed = { $ne: true };
    } else if (view === 'trash') {
      query.isTrashed = true;
    } else if (view === 'starred') {
      query.starred = true;
      query.isTrashed = { $ne: true };
    } else if (view === 'recent') {
      query.isTrashed = { $ne: true };
      query.parent = null;
    } else {
      query.parent = parent;
      query.isTrashed = { $ne: true };
    }

    let foldersQuery = Folder.find(query).sort(sort);
    if (limit) foldersQuery = foldersQuery.limit(limit);
    
    const folders = await foldersQuery;
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a folder
router.post('/', async (req, res) => {
  try {
    const { name, parent } = req.body;
    if (!name) return res.status(400).json({ message: 'Folder name is required' });

    let parentId = parent || null;

    const folder = await Folder.create({
      name,
      parent: parentId,
      user: req.user._id
    });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get folder size
router.get('/:id/size', async (req, res) => {
  try {
    const folderId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Using aggregate with graphLookup to find all descendant folders
    const descendants = await Folder.aggregate([
      { $match: { _id: folderId, user: userId } },
      {
        $graphLookup: {
          from: 'folders',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'children'
        }
      }
    ]);

    if (!descendants.length) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const allFolderIds = [folderId, ...descendants[0].children.map(f => f._id)];

    // Aggregate image sizes in all those folders
    const sizeResult = await Image.aggregate([
      { $match: { folder: { $in: allFolderIds }, user: userId } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    const totalSize = sizeResult.length > 0 ? sizeResult[0].totalSize : 0;
    
    res.json({ size: totalSize });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Move to trash
router.put('/:id/trash', async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isTrashed: true },
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Restore from trash
router.put('/:id/restore', async (req, res) => {
  try {
    const folder = await Folder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isTrashed: false },
      { new: true }
    );
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle star
router.put('/:id/star', async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, user: req.user._id });
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    
    folder.starred = !folder.starred;
    await folder.save();
    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Permanently delete folder and its contents
router.delete('/:id', async (req, res) => {
  try {
    const folderId = new mongoose.Types.ObjectId(req.params.id);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Find all descendant folders
    const descendants = await Folder.aggregate([
      { $match: { _id: folderId, user: userId } },
      {
        $graphLookup: {
          from: 'folders',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parent',
          as: 'children'
        }
      }
    ]);

    if (!descendants.length) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    const allFolderIds = [folderId, ...descendants[0].children.map(f => f._id)];

    // Delete all images in these folders
    await Image.deleteMany({ folder: { $in: allFolderIds }, user: req.user._id });

    // Delete all these folders
    await Folder.deleteMany({ _id: { $in: allFolderIds }, user: req.user._id });

    res.json({ message: 'Folder and contents deleted forever' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
