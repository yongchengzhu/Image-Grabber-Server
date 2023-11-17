const BASE_URL = "https://chapmanganato.com"

const search = async () => navigateTo(`/search/story/${document.getElementById('textBox').value.replaceAll(' ', '_')}`);

const navigateTo = path => {
  history.pushState(null, null, path);
  handleNavigation(path);
};

const handleNavigation = path => {
  document.querySelector('.content') && document.querySelector('.content').remove();
  const content = Object.assign(document.createElement('div'), { className: "content" });
  document.body.appendChild(content);
  switch (true) {
    case path.startsWith('/search/story/'):
      fetchTextContents(BASE_URL + path, 'item-title', content);
      break;
    case path.startsWith('/manga-') && path.includes('/chapter-'):
      getImages(BASE_URL + path, content);
      break;
    case path.startsWith('/manga-'):
      fetchTextContents(BASE_URL + path, 'chapter-name', content);
      break;
    default:
      break;
  }
};

window.addEventListener('popstate', () => {
  handleNavigation(document.location.pathname);
});

const fetchTextContents = async (url, className, content) => {
  const html = await (await fetch(`/search?url=${url}`)).text();
  Array.from(new DOMParser().parseFromString(html, 'text/html').querySelectorAll(`.${className}`))
    .forEach(({ textContent, href }) => {
      const node = content.appendChild(Object.assign(document.createElement('div'), { textContent, className }));
      node.addEventListener('click', () => navigateTo(new URL(href).pathname));
    });
};

const getImages = async (url, content) => {
  const html = new DOMParser().parseFromString(await (await fetch(`/search?url=${url}`)).text(), 'text/html');
  const addButtons = () => [html.querySelector('.navi-change-chapter-btn-prev'), html.querySelector('.navi-change-chapter-btn-next')]
    .filter(Boolean)
    .forEach(({ textContent, href }) => content.appendChild(Object.assign(document.createElement('button'), { textContent }))
      .onclick = () => navigateTo(new URL(href).pathname));
  content.appendChild(Object.assign(document.createElement('h1'), { textContent: (html.querySelector('h1') || {}).textContent }));
  addButtons();
  for (const { src } of Array.from(html.querySelectorAll('img'))) {
    try {
      content.appendChild(Object.assign(document.createElement('img'), { src: `/images/${await (await fetch(`/image?url=${src}`)).text()}` }));
    } catch (error) {
      console.error(`Error fetching image: ${src}`, error);
    }
  }
  addButtons();
};

handleNavigation(document.location.pathname);
