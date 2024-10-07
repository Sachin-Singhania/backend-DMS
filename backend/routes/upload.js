const express = require('express');
const { File,Folder } = require('../models/Upload'); 
const router = express.Router();  
const upload=require('../middleware/multer')
const authenticateToken=require('../middleware/verifyuser')
const path = require('path');
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
router.post('/fileupload',authenticateToken, upload.single('file'), async (req, res) => {
  try {
    console.log("first")
    const { folderId, userId } = req.body;
    console.log(folderId,userId);
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
    
   return res.status(201).json({ message: 'File uploaded successfully!', file: newFile });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});
router.get('/folders/:userId',authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId; 

    const folders = await Folder.find({ createdBy: userId }).populate('parentFolder');

    const folderData = await Promise.all(folders.map(async (folder) => {
      const files = await File.find({ folder: folder._id }); 
      return {
        folder,
        files,
      };
    }));
    return res.status(200).json(folderData);
  } catch (error) {
    console.error('Error fetching folders and files:', error);
    returnres.status(500).json({ message: 'Error fetching folders and files.' });
  }
});
router.get('/stream/:folderId/:fileId',authenticateToken, async (req, res) => {
  try {
    const { folderId, fileId } = req.params;

    const file = await File.findOne({
      _id:fileId,folder:folderId
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found.' });
    }
    const filePath = path.join(file.filePath.toString()); 
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on the server.' });
    }
    const readStream = fs.createReadStream(filePath,'utf-8');
   
    res.setHeader('Content-Type', file.mimeType);
    // readStream.on('data', (chunk) => {
    //   console.log(`Sending chunk of size: ${chunk.length}`);
    // });
    // readStream.on('end', () => {
    //   console.log('File stream ended.');
    // });
    readStream.pipe(res);

    readStream.on('error', (err) => {
      console.error('Error reading the file:', err);
      res.status(500).json({ message: 'Error streaming the file.' });
    });
  } catch (error) {
    console.error('Error streaming file:', error);
    return res.status(500).json({ message: 'Error streaming file.' });
  }
});

module.exports = router;  
