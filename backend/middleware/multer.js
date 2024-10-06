const multer = require("multer");
const { Folder } = require("../models/Upload");
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const folderId = req.body.folderId; 
      let folder = await Folder.findById(folderId);
      if (!folder) {
        const userId = req.body.userId;  
        const parentFolderId = req.body.parentFolderId;  
        
        folder = new Folder({
          name: 'Default',
          createdBy: userId,
          parentFolder: parentFolderId || null,
        });

        try {
          await folder.save();
          console.log('Folder created in DB:', folder);
        } catch (dbError) {
          console.error('Error saving folder to DB:', dbError.message);
          return cb(new Error('Failed to create folder in the database.'));
        }
      }

      const folderPath = path.join(__dirname, '..', 'upload', folder._id.toString()); 

      if (!fs.existsSync(folderPath)) {
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          console.log('Folder created:', folderPath);
        } catch (mkdirError) {
          console.error('Error creating folder:', mkdirError.message);
          return cb(new Error('Failed to create directory for uploads.'));
        }
      }

      cb(null, folderPath); 
    } catch (err) {
      console.error('Error in destination function:', err.message);
      cb(new Error('An error occurred while setting the upload destination.'));
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileNameWithoutExt = file.originalname.split('.')[0];
      const fileExtension = file.originalname.split('.').pop();  
      const newFileName = `${fileNameWithoutExt}-${uniqueSuffix}.${fileExtension}`;

      cb(null, newFileName); 
    } catch (filenameError) {
      console.error('Error in filename generation:', filenameError.message);
      cb(new Error('An error occurred while generating the filename.'));
    }
  }
});

const upload = multer({ storage: storage });
module.exports = upload;
