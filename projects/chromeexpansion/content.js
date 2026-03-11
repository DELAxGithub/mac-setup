let scrollTimer = null;
let intervalSec = 2; // seconds per image
let images = [];
let currentIndex = -1;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    intervalSec = message.interval || 2;
    scanImages();
    if (images.length === 0) {
      sendResponse({ status: 'no_images', count: 0 });
      return true;
    }
    startTimer();
    sendResponse({ status: 'started', count: images.length, current: currentIndex });
  } else if (message.action === 'toggle') {
    if (scrollTimer) {
      stopTimer();
      sendResponse({ status: 'stopped', current: currentIndex });
    } else {
      scanImages();
      if (images.length === 0) {
        sendResponse({ status: 'no_images', count: 0 });
        return true;
      }
      startTimer();
      sendResponse({ status: 'started', count: images.length, current: currentIndex });
    }
  } else if (message.action === 'stop') {
    stopTimer();
    sendResponse({ status: 'stopped', current: currentIndex });
  } else if (message.action === 'setInterval') {
    intervalSec = message.interval;
    if (scrollTimer) {
      stopTimer();
      startTimer();
    }
    sendResponse({ status: 'interval_updated' });
  } else if (message.action === 'next') {
    scanImages();
    goNext();
    sendResponse({ status: 'ok', current: currentIndex, count: images.length });
  } else if (message.action === 'prev') {
    scanImages();
    goPrev();
    sendResponse({ status: 'ok', current: currentIndex, count: images.length });
  } else if (message.action === 'getStatus') {
    sendResponse({
      isScrolling: scrollTimer !== null,
      interval: intervalSec,
      current: currentIndex,
      count: images.length
    });
  }
  return true;
});

function scanImages() {
  // 一定サイズ以上のimgのみ対象（小さいアイコン等を除外）
  const allImgs = document.querySelectorAll('img');
  images = Array.from(allImgs).filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.width >= 100 && rect.height >= 100;
  });
}

function scrollToImage(index) {
  if (index < 0 || index >= images.length) return;
  currentIndex = index;
  images[index].scrollIntoView({ behavior: 'auto', block: 'start' });
}

function goNext() {
  if (images.length === 0) return;
  if (currentIndex < images.length - 1) {
    scrollToImage(currentIndex + 1);
  } else {
    // 最後の画像に到達したら停止
    stopTimer();
  }
}

function goPrev() {
  if (images.length === 0) return;
  if (currentIndex > 0) {
    scrollToImage(currentIndex - 1);
  }
}

function startTimer() {
  if (scrollTimer) return;
  // 開始時にまず最初の画像（または次の画像）へ
  if (currentIndex < 0) {
    scrollToImage(0);
  } else {
    goNext();
  }
  scrollTimer = setInterval(() => {
    goNext();
  }, intervalSec * 1000);
}

function stopTimer() {
  if (scrollTimer) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

// キーボード操作
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  if (e.key === 'Escape') {
    stopTimer();
  } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    scanImages();
    goNext();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    scanImages();
    goPrev();
  }
});
