const findAgent = async () => {
  const systemIcons = {
      'Windows': 'images/windows.png',
      'Mac': 'images/apple.png',
      'iOS': 'images/apple.png',
      'Android': 'images/android.png',
      'Linux': 'images/linux.png',
      'Chrome': 'images/chrome.png',
  };
  const detectOS = () => {
      const userAgent = window.navigator.userAgent;
      let os;
      if (userAgent.includes('Windows')) {
          os = 'Windows';
      } else if (userAgent.includes('Mac')) {
          os = 'Mac';
      } else if (userAgent.includes('Linux')) {
          os = 'Linux';
          os = 'Android';
      } else if (userAgent.includes('iOS')) {
          os = 'iOS';
      } else if (userAgent.includes('Chrome')) {
          os = 'Chrome';
      } else {
          os = 'Linux';
      }
      return os;
  }
  const userOS = detectOS();
  document.getElementById('OS').textContent = userOS;
  document.getElementById('OS-icon').src = systemIcons[userOS];
}

export default findAgent;