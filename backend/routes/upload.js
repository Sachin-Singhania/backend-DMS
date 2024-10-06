const express = require('express');
const { File,Folder } = require('../models/Upload'); 
const router = express.Router();  
const upload=require('../middleware/multer')
const authenticateToken=require('../middleware/verifyuser')
const fs = require('fs');
router.post('/Addfolder',authenticateToken,async (req,res) => {
  try {
        const userId = req.body.userId;  
        const parentFolderId = req.body.parentFolderId;  
        const folderName = req.body.folderName;  
        
        let folder = new Folder({
          name: folderName,
          createdBy: userId,
          parentFolder: parentFolderId || null,
        });
        await folder.save();
        console.log('Folder created in DB:', folder);
        const folderPath = path.join(__dirname, '..', 'upload', folder._id.toString()); 
        if (!fs.existsSync(folderPath)) {
          try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log('Folder created:', folderPath);
          } catch (mkdirError) {
            console.error('Error creating folder:', mkdirError.message);
            return new Error('Failed to create directory for uploads.');
          }
        }
        res.status(201).json({ message: 'Folder Created'}); 
      } catch (error) {
      res.status(501).json({ message: 'Folder Unable to create'}); 
  }
})
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log("Second")
    const { folderId, userId } = req.body;

    const newFile = new File({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: userId,  
      folder: folderId,   
    });
    
    await newFile.save();
    
    res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;  
