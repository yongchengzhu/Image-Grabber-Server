const search = async () => fetchTextContents(`https://manganato.com/search/story/${document.getElementById('textBox').value.replace(/\s+/g, '_')}`
    , 'item-title'
    , getChapters
  );

const getChapters = async (url) => fetchTextContents(url, 'chapter-name', getImages);

const getImages = async (url) => {
  const contentElement = document.querySelector('.content');
  contentElement.innerHTML = '';

  const html = await (await fetch(`/search?url=${url}`)).text();

  const createButton = (className, textContent, href) => {
    const button = contentElement.appendChild(Object.assign(document.createElement('button'), { textContent, className }));
    button.onclick = () => getImages(href);
  };

  const addButton = (className, textContent, regex) => {
    const match = html.match(regex);
    match && createButton(className, textContent, match[1]);
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

  addButton('navi-change-chapter-btn-prev', 'Previous Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-prev[^"]*"[^>]*href="([^"]+)"[^>]*>/);
  addButton('navi-change-chapter-btn-next', 'Next Chapter', /<a[^>]+class="[^"]*navi-change-chapter-btn-next[^"]*"[^>]*href="([^"]+)"[^>]*>/);

  const matches = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/g));

  // Map each image to a function that returns a promise
  const imagePromises = matches.map(({ 1: image }) => () => createImg(image));

  // Execute promises sequentially
  for (const promiseFn of imagePromises) {
    await promiseFn();
  }
};







const fetchTextContents = async (url, className, handleClick) => {
  const contentElement = document.querySelector('.content');
  contentElement.innerHTML = '';

  const html = await (await fetch(`/search?url=${url}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.${className}`))
    .forEach(div => {
      const node = contentElement.appendChild(Object.assign(document.createElement('div'), { textContent: div.textContent, className }));
      node.addEventListener('click', () => handleClick(div.getAttribute('href')));
    });
};
