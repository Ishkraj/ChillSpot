self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
  });
  
  self.addEventListener("fetch", (event) => {
    // PWA trigger karne ke liye fetch event zaroori hai
  });