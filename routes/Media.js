const express = require("express");
const router = express.Router();

const {imageUpload , videoUpload, deleteImage, deleteVideo, getAllMedia} = require("../controllers/Media");
const { auth , isPremiumUser , checkImageUploadLimits , checkVideoUploadLimits } = require("../middlewares/Auth");

//controllers
router.post("/imageUpload" , auth , checkImageUploadLimits , imageUpload);

router.post("/videoUpload" , auth , isPremiumUser , checkVideoUploadLimits , videoUpload);

router.delete("/image-delete/:mediaId" , auth , deleteImage);

router.delete("/video-delete/:mediaId" , auth , deleteVideo);

router.get("/all" , auth , getAllMedia);

module.exports = router;