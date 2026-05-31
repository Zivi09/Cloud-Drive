const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filepath: { type: String, required: true },
  public_id: { type: String },
  size: { type: Number, required: true },
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  starred: { type: Boolean, default: false },
  isShared: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  trashedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Image', imageSchema);
