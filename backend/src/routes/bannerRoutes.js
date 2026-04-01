const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

// 1. Ở đây ông giáo đã lấy ra 'admin' rồi nè
const { protect, admin } = require('../middlewares/authMiddleware'); 

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), 
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

// --- ROUTES ---
router.get('/', bannerController.getActiveBanners);

router.use(protect); 

// 🚀 SỬA DÒNG NÀY: 
// Vì dòng 4 ông giáo import 'admin' nên ở đây chỉ cần truyền 'admin' vào.
// Không dùng 'authorize' vì ông giáo đâu có import nó đâu!
router.use(admin); 

router.get('/admin', bannerController.getAllBannersAdmin);
router.post('/create', upload.single('imageUrl'), bannerController.createBanner);
router.patch('/update/:id', upload.single('imageUrl'), bannerController.updateBanner);
router.delete('/delete/:id', bannerController.deleteBanner);

module.exports = router;