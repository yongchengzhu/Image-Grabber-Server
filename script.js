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
  console.log('Inside of fetchTextContents');
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
        const blob = await response.blob();
        const img = Object.assign(document.createElement('img'), {
          onload: () => URL.revokeObjectURL(src),
          src: URL.createObjectURL(blob),
        });
        contentElement.appendChild(img);
        return img;
      }
    } catch (error) {
      console.error(`Error fetching image: ${src}`, error);
    }
  };

  const matches = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g));

  // Map each image to a function that returns a promise
  const imagePromises = matches.map(({ 1: image }) => () => createImg(image));

  addButton('navi-change-chapter-btn-prev', 'Previous Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-prev[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  addButton('navi-change-chapter-btn-next', 'Next Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-next[^"]*"[^>]*href="([^"]+)"[^>]*>/);

  // Execute promises sequentially
  for (const promiseFn of imagePromises) {
    await promiseFn();
  }

  addButton('navi-change-chapter-btn-prev', 'Previous Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-prev[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  addButton('navi-change-chapter-btn-next', 'Next Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-next[^"]*"[^>]*href="([^"]+)"[^>]*>/);
};

handleNavigation(document.location.pathname);
