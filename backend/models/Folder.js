const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isTrashed: { type: Boolean, default: false },
  starred: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Folder', folderSchema);
