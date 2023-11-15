const BASE_URL = "https://chapmanganato.com"

const search = async () => {
  const title = document.getElementById('textBox').value.replace(/\s+/g, '_');
  navigateTo(`/search/story/${title}`);
};

const navigateTo = path => {
  history.pushState(null, null, path);
  handleNavigation(path);
};

const handleNavigation = path => {
  if (path.startsWith('/search/story/')) {
    fetchTextContents(BASE_URL + path, 'item-title');
  } else if (path.startsWith('/manga-') && path.includes('/chapter-')) {
    getImages(BASE_URL + path);
  } else if (path.startsWith('/manga-')) {
    fetchTextContents(BASE_URL + path, 'chapter-name');
  } else {
    // Do nothing.
  }
};

const fetchTextContents = async (url, className) => {
  const contentElement = document.querySelector('.content');
  contentElement.innerHTML = '';
  const html = await (await fetch(`/search?url=${url}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.${className}`))
    .forEach(({ textContent, href }) => {
      const node = contentElement.appendChild(Object.assign(document.createElement('div'), { textContent, className }));
      node.addEventListener('click', () => navigateTo(new URL(href).pathname));
    });
};

window.addEventListener('popstate', () => {
  handleNavigation(document.location.pathname);
});

const getImages = async (url) => {
  const contentElement = document.querySelector('.content');
  contentElement.innerHTML = '';
  const html = await (await fetch(`/search?url=${url}`)).text();
  document.querySelector('.content').appendChild(Object.assign(document.createElement('h1'), { textContent: (new DOMParser().parseFromString(html, 'text/html').querySelector('h1') || {}).textContent }));
  const createButton = (className, textContent, href) => {
    const button = contentElement.appendChild(Object.assign(document.createElement('button'), { textContent, className }));
    button.onclick = () => navigateTo(href);
  };
  const addButton = (className, textContent, regex) => {
    const match = html.match(regex);
    match && createButton(className, textContent, new URL(match[1]).pathname);
  };
  const createImg = async (src) => {
    try {
      const response = await fetch(`/image?url=${src}`);
      if (response.ok) {
        const imageName = await response.text();
        const img = Object.assign(document.createElement('img'), {
          src: '/images/' + imageName,
        });
        contentElement.appendChild(img);
        return img;
      }
    } catch (error) {
      console.error(`Error fetching image: ${src}`, error);
    }
  };
  const matches = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g));
  const imagePromises = matches.map(({ 1: image }) => () => createImg(image));
  addButton('navi-change-chapter-btn-prev', 'Previous Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-prev[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  addButton('navi-change-chapter-btn-next', 'Next Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-next[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  for (const promiseFn of imagePromises) {
    const startPerformance = performance.now();
    await promiseFn();
    const endPerformance = performance.now();
    const executionTimePerformance = endPerformance - startPerformance;
    console.log(`Execution time: ${executionTimePerformance} milliseconds`);
  }
  addButton('navi-change-chapter-btn-prev', 'Previous Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-prev[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  addButton('navi-change-chapter-btn-next', 'Next Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-next[^"]*"[^>]*href="([^"]+)"[^>]*>/);
};

handleNavigation(document.location.pathname);
