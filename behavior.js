const behaviorTracker = (function() {
  let mouseX = 0;
  let mouseY = 0;
  let mousePercentageX = 0;
  let mousePercentageY = 0;
  let totalKeyPresses = 0;
  let totalKeyPressTime = 0;
  let averageKeyPressTime = 0;
  let lastKeyPressTime = null;
  let inputElements = [];
  let focusedInputIndex = null;
  let inputDataMap = new Map();
  const initialPollInterval = 100; // configurable
  let currentPollInterval = initialPollInterval;
  const maxPollInterval = initialPollInterval * 8;
  let sameMousePositionCount = 0;
  let prevMouseX = null;
  let prevMouseY = null;
  let pollObject = null;

  function updateMousePosition(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mousePercentageX = (mouseX / window.innerWidth) * 100;
    mousePercentageY = 100 - (mouseY / window.innerHeight) * 100;
    console.log('Mouse position updated:', mouseX, mouseY);
  }

  function updateKeyPressTime() {
    if (lastKeyPressTime !== null) {
      totalKeyPressTime += performance.now() - lastKeyPressTime;
    }
    lastKeyPressTime = performance.now();
    totalKeyPresses++;
    averageKeyPressTime = totalKeyPressTime / totalKeyPresses;
    console.log('Keypress time updated:', averageKeyPressTime);
  }

  function keyPressToScore(time) {
    const minTime = 0;
    const maxTime = 1000;
    return 100 * (1 - Math.min(1, Math.max(0, time - minTime) / (maxTime - minTime)));
  }

  function recordInputData() {
    if (focusedInputIndex === null) {
      return;
    }
    const focusedInput = inputElements[focusedInputIndex];
    if (!inputDataMap.has(focusedInput)) {
      inputDataMap.set(focusedInput, []);
    }

    inputDataMap.get(focusedInput).push({
      timestamp: performance.now(),
      mouseX: mouseX,
      mouseY: mouseY,
      mousePercentageX: mousePercentageX,
      mousePercentageY: mousePercentageY,
      averageKeyPressTimeScore: keyPressToScore(averageKeyPressTime),
    });

    console.log('Data recorded for input index', focusedInputIndex);
  }

  function pollMousePosition() {
    if (prevMouseX === mouseX && prevMouseY === mouseY) {
      sameMousePositionCount++;
    } else {
      sameMousePositionCount = 0;
      currentPollInterval = initialPollInterval;
    }

    if (sameMousePositionCount >= 10 && currentPollInterval < maxPollInterval) {
      currentPollInterval *= 2;
      sameMousePositionCount = 0;
    }

    prevMouseX = mouseX;
    prevMouseY = mouseY;

    recordInputData();
    pollObject = setTimeout(pollMousePosition, currentPollInterval);
  }

  function findInputElements() {
    inputElements = Array.from(document.querySelectorAll("input"));
    inputElements.forEach((input, index) => {
      input.addEventListener("focus", () => {
        focusedInputIndex = index;
        console.log('Input index', focusedInputIndex, 'focused');
      });
    });
  }

  window.addEventListener("mousemove", updateMousePosition);
  window.addEventListener("keydown", updateKeyPressTime);
  window.addEventListener("DOMContentLoaded", () => {
    findInputElements();
    pollMousePosition();
    console.log('Behavior tracking started');
  });

  return {
    inputDataMap: inputDataMap,
    drawDataOnCanvas: function(canvasId) {
      clearTimeout(pollObject);
      
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error('Canvas element not found');
        return;
      }
      const ctx = canvas.getContext('2d');
    
      console.log('Drawing data on canvas');
    
      const totalInputElements = inputDataMap.size;
      const canvasHeightPerInput = canvas.height / totalInputElements;
      let currentY = 0;
    
      inputDataMap.forEach((dataList, inputElement) => {
        let currentX = 0;
        const canvasWidthPerDataPoint = canvas.width / dataList.length;
    
        dataList.forEach(data => {
          const r = data.mouseX;
          const g = data.mouseY;
          const b = data.averageKeyPressTimeScore;
    
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(currentX, currentY, canvasWidthPerDataPoint, canvasHeightPerInput);
    
          currentX += canvasWidthPerDataPoint;
        });
    
        currentY += canvasHeightPerInput;
      });
    
      // Save the canvas to a file
      const firstInputValue = inputElements[0].value;
      const fileName = `${firstInputValue}.png`;
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    },
  };
})();