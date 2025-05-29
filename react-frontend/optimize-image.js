import sharp from "sharp";

// Optimize and resize the farm image
sharp("./src/assets/farm1.jpg")
  .resize(800)
  .jpeg({ quality: 80 })
  .toFile("./src/assets/optimized/farm1.jpg")
  .then(() => console.log("Image optimized successfully"))
  .catch((err) => console.error("Error optimizing image:", err));
