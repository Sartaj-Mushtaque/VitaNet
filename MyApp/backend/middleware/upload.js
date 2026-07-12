import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.query.folderName || "General";
    const safe   = folder.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "General";
    const dir    = path.join("uploads", safe);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${sanitized}`);
  },
});

export default multer({ storage });