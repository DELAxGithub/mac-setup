const intervalSlider = document.getElementById('intervalSlider');
const intervalValue = document.getElementById('intervalValue');
const startBtn = document.getElementById('startBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const statusEl = document.getElementById('status');

let isScrolling = false;

// 現在の状態を取得
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, { action: 'getStatus' }, (response) => {
    if (response) {
      isScrolling = response.isScrolling;
      intervalSlider.value = response.interval;
      intervalValue.textContent = response.interval;
      updateButton();
      updateStatus(response.current, response.count);
    }
  });
});

// 間隔スライダー
intervalSlider.addEventListener('input', () => {
  const val = parseFloat(intervalSlider.value);
  intervalValue.textContent = val;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'setInterval', interval: val });
  });
});

// 開始/停止ボタン
startBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const action = isScrolling ? 'stop' : 'start';
    const interval = parseFloat(intervalSlider.value);

    chrome.tabs.sendMessage(tabs[0].id, { action, interval }, (response) => {
      if (response) {
        if (response.status === 'no_images') {
          statusEl.textContent = '画像が見つかりません';
          return;
        }
        isScrolling = action === 'start';
        updateButton();
        updateStatus(response.current, response.count);
      }
    });
  });
});

// 前/次ボタン
prevBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'prev' }, (response) => {
      if (response) updateStatus(response.current, response.count);
    });
  });
});

nextBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'next' }, (response) => {
      if (response) updateStatus(response.current, response.count);
    });
  });
});

function updateButton() {
  if (isScrolling) {
    startBtn.textContent = '停止';
    startBtn.classList.add('active');
  } else {
    startBtn.textContent = '開始';
    startBtn.classList.remove('active');
  }
}

function updateStatus(current, count) {
  if (count > 0) {
    statusEl.textContent = `${current + 1} / ${count} 枚`;
  } else {
    statusEl.textContent = '';
  }
}
